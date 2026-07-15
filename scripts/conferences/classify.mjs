const normalizeText = (value = '') =>
  String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|#39);/g, ' ')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}+#.\-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ccfAreaFallbacks = {
  'architecture-systems': ['computer-architecture', 'parallel-distributed-computing', 'storage-systems'],
  networking: ['computer-networks', 'wireless-mobile'],
  security: ['cybersecurity', 'cryptography'],
  software: ['software-engineering', 'programming-languages', 'operating-systems'],
  'data-management': ['databases', 'data-mining', 'information-retrieval'],
  theory: ['algorithms-complexity', 'formal-methods'],
  'graphics-multimedia': ['computer-graphics', 'visualization', 'multimedia'],
  'artificial-intelligence': ['machine-learning', 'natural-language-processing', 'computer-vision', 'knowledge-reasoning'],
  'human-computer-interaction': ['human-computer-interaction', 'ubiquitous-computing'],
  interdisciplinary: ['web-systems', 'real-time-embedded', 'computational-economics'],
};

const venueDomainPriors = {
  acl: 'natural-language-processing',
  asplos: 'computer-architecture',
  cvpr: 'computer-vision',
  icml: 'machine-learning',
  'usenix-security': 'cybersecurity',
};

const termPatternCache = new Map();
const strongSingleTerms = new Set(['nlp', 'nvme', 'olap', 'rag', 'sql', 'ssd', 'wifi']);

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const termPattern = (term) => {
  if (termPatternCache.has(term)) return termPatternCache.get(term);
  const pluralSuffix = /[sσ]$/u.test(term) ? '' : '(?:s|es)?';
  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(term)}${pluralSuffix}(?=$|[^\\p{L}\\p{N}])`,
    'u',
  );
  termPatternCache.set(term, pattern);
  return pattern;
};

const scoreDefinition = (text, definition) => {
  let score = 0;
  for (const rawTerm of [definition.label, ...(definition.aliases ?? [])]) {
    const term = normalizeText(rawTerm);
    if (!term || !termPattern(term).test(text)) continue;
    score += term.includes(' ') ? 3 : strongSingleTerms.has(term) ? 2 : 1;
    if (text.startsWith(term) || text.includes(` ${term}:`)) score += 1;
  }
  return score;
};

export const classifyDomains = (
  { title = '', abstract = '', sourceTopics = [], ccfAreaId = '', venueId = '' },
  taxonomy,
) => {
  const text = normalizeText([title, abstract, ...sourceTopics].join(' '));
  const venuePriorId = venueDomainPriors[venueId] ?? '';
  const scored = taxonomy.domains
    .map((domain) => ({
      domain,
      score: scoreDefinition(text, domain) + (domain.id === venuePriorId ? 2 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.domain.label.localeCompare(b.domain.label));

  if (scored.length === 0) {
    const fallbackIds = ccfAreaFallbacks[ccfAreaId] ?? [];
    const fallback = taxonomy.domains.find((domain) => domain.id === fallbackIds[0]);
    return {
      domains: fallback ? [fallback] : [],
      primaryDomainId: fallback?.id ?? '',
      confidence: fallback ? 0.24 : 0,
    };
  }

  const bestScore = scored[0].score;
  const minimumSelectedScore = venuePriorId ? 2 : 1;
  const selected = scored
    .filter(({ score }) => score >= minimumSelectedScore)
    .slice(0, 3)
    .map(({ domain }) => domain);
  const normalizedTitle = normalizeText(title);
  const describesRetrievalAugmentedGeneration =
    termPattern('rag').test(normalizedTitle) ||
    /(?:^|[^\p{L}\p{N}])retrieval(?:-| )augmented generation(?=$|[^\p{L}\p{N}])/u.test(normalizedTitle);
  const requiredDomainIds = describesRetrievalAugmentedGeneration
    ? ['information-retrieval']
    : [];
  for (const domainId of requiredDomainIds) {
    if (selected.some((domain) => domain.id === domainId)) continue;
    const required = scored.find(({ domain }) => domain.id === domainId)?.domain;
    if (!required) continue;
    if (selected.length < 3) selected.push(required);
    else selected[selected.length - 1] = required;
  }
  const evidenceFactor = abstract ? 0.18 : sourceTopics.length > 0 ? 0.1 : 0;
  const confidence = Math.min(0.94, 0.42 + bestScore * 0.07 + evidenceFactor);

  return { domains: selected, primaryDomainId: selected[0]?.id ?? '', confidence };
};

const contributionPriority = [
  'survey-position',
  'dataset-benchmark',
  'theory-proof',
  'evaluation-measurement',
  'empirical-analysis',
  'system-infrastructure',
  'tool-resource',
  'model-architecture',
  'application',
  'algorithm-method',
];

export const classifyContributionType = ({ title = '', abstract = '', sourceTopics = [] }, taxonomy) => {
  const text = normalizeText([title, abstract, ...sourceTopics].join(' '));
  const titleText = normalizeText(title);
  const abstractText = normalizeText(abstract);
  const byId = new Map(taxonomy.contributionTypes.map((definition) => [definition.id, definition]));
  const scored = contributionPriority
    .map((id, priority) => ({
      definition: byId.get(id),
      priority,
      score:
        id === 'survey-position'
          ? scoreDefinition(titleText, byId.get(id) ?? { label: '', aliases: [] }) +
            (/(?:^| )this (?:position|survey) paper(?: |$)|(?:^| )we (?:present|provide|conduct) (?:a |an )?(?:systematic |literature )(?:survey|review)(?: |$)|(?:^| )we (?:present|provide) (?:a |an )?survey (?:of|on)(?: |$)/u.test(
              abstractText,
            )
              ? 3
              : 0)
          : scoreDefinition(text, byId.get(id) ?? { label: '', aliases: [] }),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.priority - b.priority);

  const selected = scored[0]?.definition ?? byId.get('unknown');
  return {
    contributionType: selected,
    confidence: scored[0] ? Math.min(0.9, 0.4 + scored[0].score * 0.09 + (abstract ? 0.12 : 0)) : 0,
  };
};

const sentenceCandidates = (abstract = '') =>
  String(abstract)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35);

export const extractCoreContribution = (abstract = '') => {
  const candidates = sentenceCandidates(abstract);
  const contributionPattern = /\b(we|this (?:paper|work|study))\s+(?:introduce|present|propose|develop|design|show|demonstrate|establish|provide|study|investigate|evaluate)\b/i;
  const selected = candidates.find((sentence) => contributionPattern.test(sentence)) ?? candidates[0] ?? '';
  if (!selected) return '';
  const words = selected.split(/\s+/).filter(Boolean);
  const excerpt = words.length > 24 ? `${words.slice(0, 24).join(' ')}...` : selected;
  return excerpt.length > 360 ? `${excerpt.slice(0, 357).trimEnd()}...` : excerpt;
};

export const classifyPaper = (paper, taxonomy, classifierVersion = 'rules-v3') => {
  const domainResult = classifyDomains(paper, taxonomy);
  const contributionResult = classifyContributionType(paper, taxonomy);
  const coreContribution = extractCoreContribution(paper.abstract);
  const confidenceValues = [domainResult.confidence, contributionResult.confidence].filter((value) => value > 0);
  const classificationConfidence = confidenceValues.length
    ? Number((confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length).toFixed(2))
    : 0;

  return {
    ...paper,
    domains: domainResult.domains.map(({ id, label }) => ({ id, label })),
    primaryDomainId: domainResult.primaryDomainId,
    contributionType: contributionResult.contributionType
      ? { id: contributionResult.contributionType.id, label: contributionResult.contributionType.label }
      : { id: 'unknown', label: 'Pending Classification' },
    coreContribution,
    classificationConfidence,
    classificationStatus: paper.abstract ? 'automatic' : 'title-only',
    classifierVersion,
  };
};
