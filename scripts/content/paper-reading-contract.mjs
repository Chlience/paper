import MarkdownIt from 'markdown-it';

export const CURRENT_PAPER_WORKFLOW_VERSION = 'v3';
export const V3_METHOD_OVERVIEW_HEADINGS = new Set([
  '贡献与方法总览',
  '贡献全景与方法总览',
  '方法总览与完整机制',
]);
export const V3_EVIDENCE_FIELDS = ['证据定位', '观察', '判别性与局限', '支持的最窄结论'];
export const V3_REVIEW_PAGE_TYPES = new Set([
  'official-review', 'metadata-only', 'proceedings', 'commentary',
  'not-found', 'not-applicable', 'not-checked', 'unavailable',
]);
const unmatchedReviewStates = new Set(['not-found', 'not-applicable', 'not-checked', 'unavailable']);
const parser = new MarkdownIt();
const issue = (code, subject, message) => ({ code, subject, message });

// Validate visible Markdown structure, never instructions hidden in comments or examples.
export const visibleContractMarkdown = (markdown) => {
  const source = markdown.replace(/<!--[\s\S]*?(?:-->|$)/g, (value) => value.replace(/[^\n]/g, ' '));
  const lines = source.split('\n');
  for (const token of parser.parse(source, {})) {
    if (!token.map) continue;
    if (
      ['fence', 'code_block', 'html_block'].includes(token.type) ||
      (token.type === 'heading_open' && token.level !== 0)
    ) {
      for (let index = token.map[0]; index < token.map[1]; index += 1) lines[index] = '';
    }
  }
  return lines.join('\n');
};

const headingBlocks = (markdown, tag) => {
  const tokens = parser.parse(markdown, {});
  const lines = markdown.split('\n');
  const headings = tokens.flatMap((token, index) => (
    token.type === 'heading_open' && token.tag === tag && token.level === 0
      ? [{ title: tokens[index + 1].content.trim(), start: token.map[0], bodyStart: token.map[1] }]
      : []
  ));
  return headings.map((heading, index) => ({
    ...heading,
    body: lines.slice(heading.bodyStart, headings[index + 1]?.start ?? lines.length).join('\n').trim(),
  }));
};

const isPlaceholder = (value) => /^(?:TODO|TBD|待填写|待补充|<[^>]+>|\.{3}|…+)[。.]?$/i.test(value.trim());
export const getContractField = (section, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const value = section.match(new RegExp(`^- ${escaped}[:：][ \\t]*([^\\n]*)$`, 'mi'))?.[1]?.trim() ?? '';
  return isPlaceholder(value) ? '' : value;
};

const hasContent = (body) => {
  const tokens = parser.parse(body, {});
  return tokens.some((token, index) => (
    token.type === 'inline' && tokens[index - 1]?.type !== 'heading_open' &&
    token.children?.some((child) => ['text', 'code_inline'].includes(child.type) &&
      child.content.trim() && !isPlaceholder(child.content))
  ));
};
const hasUrl = (value) => [...value.matchAll(/https?:\/\/[^\s)>；，。]+/gi)].some(([url]) => {
  try { return Boolean(new URL(url).hostname); } catch { return false; }
});
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export const validateV3ReadingContract = ({ markdown, slug, sectionGroups, hasEvidenceLocator }) => {
  const errors = [];
  const sections = headingBlocks(markdown, 'h2');
  const section = (name) => sections.find((item) => item.title === name)?.body ?? '';
  for (const group of sectionGroups) {
    const matches = sections.filter((item) => group.headings.includes(item.title));
    if (matches.length !== 1 || !hasContent(matches[0]?.body ?? '')) {
      errors.push(issue('v3-core-section', slug, `Require one visible, non-empty ${group.name} section.`));
    }
  }
  const source = section('Source');
  if (!getContractField(source, 'Reading scope')) {
    errors.push(issue('v3-reading-scope', slug, 'Reading scope must state actual coverage and material gaps.'));
  }

  const overviews = headingBlocks(section('论文脉络'), 'h3').filter((block) =>
    V3_METHOD_OVERVIEW_HEADINGS.has(block.title.replace(/^\d+\.\s*/, '')),
  );
  if (overviews.length !== 1 || !hasContent(overviews[0]?.body ?? '')) {
    errors.push(issue('v3-method-overview', slug, 'Require one visible 贡献与方法总览 with content; numbering and position are free.'));
  }

  const evidenceGroup = sectionGroups.find((group) => group.name === '关键实验/定理');
  const evidence = sections.find((item) => evidenceGroup.headings.includes(item.title))?.body ?? '';
  const results = headingBlocks(evidence, 'h3');
  for (const block of results.length ? results : [{ title: '关键证据', body: evidence }]) {
    for (const field of V3_EVIDENCE_FIELDS) {
      const value = getContractField(block.body, field);
      if (!value || (field === '证据定位' && !hasEvidenceLocator(value))) {
        errors.push(issue('v3-evidence-field', `${slug}: ${block.title}`, `Missing or invalid ${field}.`));
      }
    }
  }

  const insights = section('主要启发');
  if (insights) {
    const blocks = headingBlocks(insights, 'h3');
    if (!blocks.length) errors.push(issue('v3-insight-heading', slug, 'Each insight requires a descriptive level-three heading.'));
    for (const block of blocks) {
      if (!hasContent(block.body) || !hasEvidenceLocator(block.body)) {
        errors.push(issue('v3-insight-evidence', `${slug}: ${block.title}`, 'Each insight requires visible content and direct evidence location.'));
      }
    }
  }

  const status = new Map();
  for (const part of getContractField(source, 'Review status').split(';')) {
    const separator = part.indexOf('=');
    if (separator > 0) {
      const key = part.slice(0, separator).trim();
      if (status.has(key)) errors.push(issue('v3-review-status', slug, `Duplicate review status key: ${key}.`));
      status.set(key, part.slice(separator + 1).trim());
    }
  }
  const pageType = status.get('page-type');
  const confidence = status.get('match-confidence');
  if (
    !V3_REVIEW_PAGE_TYPES.has(pageType) || !isDate(status.get('observed-at') ?? '') ||
    !status.get('venue-status') ||
    !(unmatchedReviewStates.has(pageType) ? confidence === 'not-applicable' : /^(high|medium|low)$/.test(confidence ?? ''))
  ) errors.push(issue('v3-review-status', slug, 'Review status must distinguish observed page type, identity matching, date, and venue status.'));

  if (['not-found', 'unavailable'].includes(pageType) && !getContractField(source, 'Review lookup')) {
    errors.push(issue('v3-review-lookup', slug, 'Record the lookup scope or access failure in Review lookup.'));
  }
  if (['metadata-only', 'proceedings', 'commentary'].includes(pageType) && !hasUrl(getContractField(source, 'Review evidence'))) {
    errors.push(issue('v3-review-evidence', slug, 'Review evidence requires a direct URL and the observed scope.'));
  }
  if (pageType === 'official-review') {
    const review = section('OpenReview / 审稿意见吸收');
    for (const field of ['已读材料', '证据定位', '主要质疑', '作者回应', '对结论的影响']) {
      const value = getContractField(review, field);
      if (!value || (field === '证据定位' && !hasUrl(value))) {
        errors.push(issue('v3-official-review-field', slug, `Official review analysis requires ${field}.`));
      }
    }
  }
  return { errors };
};

const frozenV21Snapshots = new Map([
  ['2026-06-16-glm-5-2-long-horizon-tasks', '2026-07-27 14:54'],
  ['2026-07-27-kimi-k3-open-frontier-intelligence', '2026-07-30 16:58'],
  ['2026-08-26-qwen3-8-flash-next-architecture', '2026-08-28 15:28'],
  ['202607.1328-towards-long-horizon-agents-survey', '2026-07-21 10:14'],
  ['2503.01840-eagle-3-training-time-test', '2026-07-27 15:47'],
  ['2503.14476-dapo-long-cot-rl-system', '2026-08-25 11:01'],
  ['2505.19645-moesd-sparse-moe-speculative-decoding', '2026-07-24 14:20'],
  ['2508.08221-tricks-or-traps-lite-ppo', '2026-08-25 11:01'],
  ['2510.04474-drpo-decoupled-reward-policy-optimization', '2026-07-29 15:47'],
  ['2510.25741-scaling-latent-reasoning-looped-language-models', '2026-09-04 15:26'],
  ['2601.16206-computer-environments-agentic-intelligence', '2026-07-21 14:18'],
  ['2601.18089-latentmoe-accuracy-per-flop-parameter', '2026-08-05 11:34'],
  ['2601.18734-self-distilled-reasoner-opsd', '2026-07-28 15:34'],
  ['2601.19897-self-distillation-continual-learning', '2026-07-29 10:39'],
  ['2601.20802-reinforcement-learning-via-self-distillation', '2026-07-29 10:39'],
  ['2603.00729-qwen3-coder-next-agentic-coding', '2026-07-21 14:18'],
  ['2603.15031-attention-residuals', '2026-08-06 10:31'],
  ['2605.09539-tacomas-test-time-coevolution-mas', '2026-07-22 11:03'],
  ['2605.10899-rubricem-rubric-guided-meta-rl', '2026-07-22 17:16'],
  ['2605.26684-graphgpo-graph-credit-assignment-agentic-rl', '2026-07-22 14:40'],
  ['2606.20954-lre-learned-relevance-eviction', '2026-07-29 11:32'],
  ['2607.00151-smoothagent-lookahead-context-engineering', '2026-07-29 13:35'],
  ['2607.02980-hils-attention-infinite-context', '2026-07-21 14:18'],
  ['2607.04763-reopd-prefix-replay-agentic-distillation', '2026-07-23 18:09'],
  ['2607.05378-compactionrl-context-compaction-agent-rl', '2026-08-04 11:24'],
  ['2607.12696-ecospec-cost-aware-moe-speculative-decoding', '2026-07-24 15:15'],
  ['2607.13988-trace-turn-level-reward-assignment', '2026-07-22 15:28'],
  ['2607.14777-seed-self-evolving-on-policy-distillation', '2026-07-23 16:10'],
  ['2607.18082-cripo-rubric-rl-self-distillation', '2026-07-22 18:27'],
  ['2607.26246-w2s-opd-weak-to-strong-distillation', '2026-08-04 11:10'],
  ['2609.01343-smelt-compute-matched-moe-looped-transformers', '2026-09-04 09:07'],
]);

export const validateV21Compatibility = ({ manifest, records }) => {
  if (manifest?.capturedAt !== '2026-09-05' || !Array.isArray(manifest?.slugs)) {
    return { errors: [issue('v21-compatibility-manifest', 'v2.1 baseline', 'Invalid compatibility manifest.')] };
  }
  const errors = [];
  const seen = new Set();
  const snapshots = new Map(records.map(({ slug, markdown }) => [slug, {
    version: getContractField(headingBlocks(visibleContractMarkdown(markdown), 'h2').find((item) => item.title === 'Source')?.body ?? '', 'Workflow version'),
    updatedAt: markdown.match(/^Updated-At:[ \t]*([^\n]+)$/m)?.[1]?.trim(),
  }]));
  for (const slug of manifest.slugs) {
    if (!frozenV21Snapshots.has(slug) || seen.has(slug) || snapshots.get(slug)?.version !== 'v2.1') {
      errors.push(issue('v21-compatibility-entry', String(slug), 'Compatibility entries must be unique, frozen, existing v2.1 papers.'));
    }
    if (frozenV21Snapshots.has(slug) && snapshots.get(slug)?.version === 'v2.1' && snapshots.get(slug).updatedAt !== frozenV21Snapshots.get(slug)) {
      errors.push(issue('v21-migration-required', slug, 'An updated v2.1 paper must migrate to v3 and leave the compatibility manifest.'));
    }
    seen.add(slug);
  }
  return { errors };
};
