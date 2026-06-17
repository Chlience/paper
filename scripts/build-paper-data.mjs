import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import katex from 'katex';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTexmath from 'markdown-it-texmath';

const repoRoot = process.cwd();
const generatedDir = path.join(repoRoot, 'src/generated');
const generatedFile = path.join(generatedDir, 'paper-data.json');
const authorsFile = path.join(repoRoot, 'authors.json');
const legacyLocalRoot = ['', 'home', 'chlience', 'paper'].join('/');

const utilityFiles = new Map([
  ['papers-index.md', { slug: 'archive', title: 'Paper Archive Index', path: '/archive/' }],
  ['paper-analysis-workflow.md', { slug: 'workflow', title: 'Paper Analysis Workflow', path: '/workflow/' }],
  ['paper-note-template.md', { slug: 'template', title: 'Paper Note Template', path: '/template/' }],
]);

const tagOverrides = new Map([
  ['2001.08361-scaling-laws-neural-language-models', ['Methodology', 'Theory']],
  ['2203.15556-training-compute-optimal-large-language-models', ['Methodology', 'Theory']],
  ['2205.14135-flashattention-io-aware-exact-attention', ['Systems', 'Theory', 'Methodology']],
  ['2025-09-10-defeating-nondeterminism-llm-inference', ['Systems', 'RL', 'Methodology']],
  ['2403.03185-correlated-proxies-reward-hacking', ['RL', 'Safety', 'Methodology']],
  ['2405.19888-parrot-semantic-variable-llm-serving', ['Systems', 'Methodology']],
  ['2409.19256-hybridflow-rlhf-framework', ['Systems', 'RL']],
  ['2501.09620-causal-rewards-llm-alignment', ['RL', 'Safety', 'Methodology']],
  ['2501.12948-deepseek-r1-rl-reasoning', ['RL', 'Safety', 'Methodology']],
  ['2503.11926-monitoring-reasoning-models-obfuscation', ['RL', 'Safety', 'Methodology']],
  ['2503.14476-dapo-long-cot-rl-system', ['RL', 'Systems', 'Methodology']],
  ['2504.13837-rlvr-reasoning-boundary-base-model', ['RL', 'Methodology']],
  ['2505.24864-prorl-prolonged-rl-reasoning-boundaries', ['RL', 'Systems', 'Methodology']],
  ['2510.01180-brorl-broadened-rl-exploration', ['RL', 'Systems', 'Methodology']],
  ['2509.25123-rl-compositional-skill-acquisition', ['RL', 'Methodology']],
  ['2511.02749-span-queries-cache-attention-locality', ['Systems', 'Methodology']],
  ['2512.07783-interplay-pretraining-midtraining-rl-reasoning', ['RL', 'Methodology']],
  ['2506.10947-spurious-rewards-rethinking-rlvr', ['RL', 'Safety', 'Methodology']],
  ['2506.19248-inference-time-reward-hacking-llms', ['RL', 'Safety', 'Methodology']],
  ['2604.04648-caution-pessimism-best-of-n-reward-hacking', ['RL', 'Safety', 'Methodology']],
  ['2510.20270-impossiblebench-test-case-exploitation', ['Safety', 'Methodology', 'Systems']],
  ['2510.19315-transformers-inherently-succinct', ['Theory']],
  ['2605.14220-training-inference-mismatch-llm-rl', ['RL', 'Systems', 'Methodology']],
  ['2605.30290-self-trained-verification', ['RL', 'Methodology']],
  ['2605.31514-age-of-empires-anthropomorphism', ['Methodology']],
  ['2606.00135-agentic-tool-calling-rl-training', ['RL', 'Systems', 'Methodology']],
  ['2606.04075-llms-hack-rewards-and-society', ['Safety', 'RL']],
  ['2606.04101-ultraep-rack-scale-moe-load-balancing', ['Systems']],
  ['2606.04662-muon-outperforms-adam-curvature', ['Optimizer', 'Theory']],
  ['2606.06453-vortex-sparse-attention-serving', ['Systems']],
]);

const internalFilePaths = new Map([
  ['AGENTS.md', '/workflow/'],
  ['README.md', '/'],
]);

const excludedPaperFiles = new Set([
  'AGENTS.md',
  'DESIGN.md',
  'PRODUCT.md',
  'README.md',
  'author-x-account-search-sop.md',
  ...utilityFiles.keys(),
]);

const slugCounts = new Map();
const slugify = (value) => {
  const base = String(value)
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\](){}<>:"'.,，。；;!?！？/\\|]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const slug = base || 'section';
  const count = slugCounts.get(slug) ?? 0;
  slugCounts.set(slug, count + 1);
  return count === 0 ? slug : `${slug}-${count + 1}`;
};

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
})
  .use(markdownItTexmath, {
    engine: katex,
    delimiters: ['brackets', 'dollars', 'beg_end'],
    katexOptions: {
      output: 'htmlAndMathml',
      throwOnError: false,
    },
  })
  .use(markdownItAnchor, {
    slugify,
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      symbol: '#',
      placement: 'after',
      class: 'heading-anchor',
      ariaHidden: true,
    }),
  });

const stripMarkdown = (value = '') =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const asciiFold = (value = '') =>
  String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizeAuthorKey = (value = '') =>
  asciiFold(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const slugifyAuthor = (value = '') =>
  asciiFold(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'author';

const authorTextIsParseable = (value = '') => {
  const text = value.trim();
  if (!text || /^unknown$/i.test(text)) return false;
  return !/(https?:|contributors?|team:|other authors?|appendix|collaboration|;)/i.test(text);
};

const looksLikePersonName = (value = '') => {
  const name = value.trim();
  if (!name || name.length > 64) return false;
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]+$/u.test(name)) return false;
  const words = name.split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.length <= 6;
};

const splitAuthorNames = (value = '') => {
  if (!authorTextIsParseable(value)) return [];
  const separator = value.includes(',') ? /\s*,\s*/ : /\s+and\s+/i;
  const seen = new Set();
  const names = [];

  for (const rawPart of value.split(separator)) {
    const name = rawPart.trim().replace(/\s+/g, ' ');
    const key = normalizeAuthorKey(name);
    if (!looksLikePersonName(name) || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
};

const readAuthorProfiles = async () => {
  try {
    const raw = await fs.readFile(authorsFile, 'utf8');
    const profiles = JSON.parse(raw);
    return Array.isArray(profiles) ? profiles : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
};

const excerpt = (value, limit = 220) => {
  const text = stripMarkdown(value);
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
};

const getFirstHeading = (markdown, fallback) => {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (!match) return fallback;
  return match[1].replace(/\s+(论文笔记|技术文章笔记)\s*$/, '').trim();
};

const getTopLevelField = (markdown, name) => {
  const escaped = escapeRegExp(name);
  return markdown.match(new RegExp(`^${escaped}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
};

const getDate = (markdown) => getTopLevelField(markdown, 'Date');
const getSortTime = (markdown) => getTopLevelField(markdown, 'Sort-Time') || getDate(markdown);

const getSection = (markdown, heading) => {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return '';

  const collected = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break;
    collected.push(line);
  }
  return collected.join('\n').trim();
};

const getSourceField = (markdown, names) => {
  const labels = Array.isArray(names) ? names : [names];
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const value = markdown.match(new RegExp(`^-\\s+${escaped}:\\s*(.+)$`, 'mi'))?.[1]?.trim();
    if (value) return stripMarkdown(value);
  }
  return '';
};

const inferTags = (markdown, filename) => {
  const haystack = `${filename}\n${markdown}`.toLowerCase();
  const tags = [];
  const add = (tag, pattern) => {
    if (pattern.test(haystack)) tags.push(tag);
  };

  add('RL', /\b(rl|rlhf|rlvr|grpo|ppo|post-training|rollout|reward)\b/);
  add('Systems', /\b(serving|inference|kernel|attention|moe|vllm|sglang|verl|distributed|hybridflow|vortex|ultraep)\b/);
  add('Safety', /\b(safety|jailbreak|reward hacking|societal|risk|governance)\b/);
  add('Theory', /\b(theory|theorem|transformer|succinct|hessian|curvature|formal|automata)\b/);
  add('Optimizer', /\b(muon|adam|adamw|optimizer|shampoo|soap|galore|apollo|lion|adafactor)\b/);
  add('Methodology', /\b(methodology|anthropomorphism|verification|verifier|evaluation|benchmark)\b/);

  return [...new Set(tags)].slice(0, 5);
};

const stripPageChrome = (markdown) =>
  markdown
    .replace(/^#\s+.+\n+/, '')
    .replace(/^Date:\s*.+\n+/m, '')
    .replace(/^Sort-Time:\s*.+\n+/m, '')
    .trim();

const fileToWebPath = (file, paperFiles) => {
  if (paperFiles.has(file)) return `/papers/${file.replace(/\.md$/, '')}/`;
  if (internalFilePaths.has(file)) return internalFilePaths.get(file);
  return utilityFiles.get(file)?.path ?? null;
};

const normalizeLocalLinks = (markdown, paperFiles) => {
  const legacyRootPattern = escapeRegExp(`${legacyLocalRoot}/`);
  let result = markdown.replace(
    new RegExp(`\\]\\((?:${legacyRootPattern})?([^\\)\\s:#]+\\.md)(?::\\d+)?(#[^)]+)?\\)`, 'g'),
    (match, file, hash = '') => {
      const webPath = fileToWebPath(file, paperFiles);
      return webPath ? `](${webPath}${hash})` : match;
    },
  );

  for (const file of [...paperFiles, ...utilityFiles.keys(), ...internalFilePaths.keys()]) {
    const webPath = fileToWebPath(file, paperFiles);
    if (!webPath) continue;
    result = result.replaceAll(`${legacyLocalRoot}/${file}`, webPath);
  }

  result = result.replaceAll(legacyLocalRoot, 'paper archive root');

  return result;
};

const collectHeadings = (markdown) => {
  const headings = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;
    headings.push({
      depth: match[1].length,
      text: stripMarkdown(match[2]),
      id: match[2]
        .trim()
        .toLowerCase()
        .replace(/[`*_~[\](){}<>:"'.,，。；;!?！？/\\|]+/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'section',
    });
  }
  return headings;
};

const renderMarkdown = (markdown, paperFiles) => {
  slugCounts.clear();
  return md.render(normalizeLocalLinks(markdown, paperFiles));
};

const readMarkdownFiles = async () => {
  const files = await fs.readdir(repoRoot);
  return files.filter((file) => file.endsWith('.md')).sort();
};

const build = async () => {
  const markdownFiles = await readMarkdownFiles();
  const paperFiles = new Set(markdownFiles.filter((file) => !excludedPaperFiles.has(file)));
  const authorProfiles = await readAuthorProfiles();

  const papers = [];
  for (const file of paperFiles) {
    const sourcePath = path.join(repoRoot, file);
    const raw = await fs.readFile(sourcePath, 'utf8');
    const title = getSourceField(raw, 'Title') || getFirstHeading(raw, file.replace(/\.md$/, ''));
    const slug = file.replace(/\.md$/, '');
    const oneSentence = getSection(raw, '一句话结论');
    const sourceUrl =
      getSourceField(raw, ['arXiv', 'URL', 'PDF', 'Source']) ||
      getSourceField(raw, 'DOI');

    const pageMarkdown = stripPageChrome(raw);
    const date = getDate(raw);
    const sortTime = getSortTime(raw);
    const authors = getSourceField(raw, ['Authors', 'Author']) || 'Unknown';
    papers.push({
      slug,
      file,
      path: `/papers/${slug}/`,
      title,
      date,
      sortTime,
      sourceUrl,
      authors,
      parsedAuthors: splitAuthorNames(authors),
      subjects: getSourceField(raw, 'Subjects'),
      currentVersion: getSourceField(raw, 'Current version read'),
      tags: tagOverrides.get(slug) ?? inferTags(raw, file),
      summary: excerpt(oneSentence || getSection(raw, '论文脉络')),
      headings: collectHeadings(pageMarkdown),
      html: renderMarkdown(pageMarkdown, paperFiles),
    });
  }

  papers.sort((a, b) => {
    const timeCompare = String(b.sortTime).localeCompare(String(a.sortTime));
    return timeCompare || b.slug.localeCompare(a.slug);
  });

  const authorMentions = new Map();
  for (const paper of papers) {
    for (const name of paper.parsedAuthors) {
      const key = normalizeAuthorKey(name);
      if (!key) continue;
      const mention = authorMentions.get(key) ?? { name, paperSlugs: new Set() };
      mention.paperSlugs.add(paper.slug);
      authorMentions.set(key, mention);
    }
  }

  const authorRecordsByKey = new Map();
  const addAuthorRecord = (key, profile, mention) => {
    const name = profile?.name ?? mention?.name;
    const slug = profile?.slug ?? slugifyAuthor(name);
    const aliasKeys = [name, ...(profile?.aliases ?? [])].filter(Boolean).map(normalizeAuthorKey);
    const paperSlugs = new Set();

    for (const aliasKey of aliasKeys) {
      for (const slugValue of authorMentions.get(aliasKey)?.paperSlugs ?? []) {
        paperSlugs.add(slugValue);
      }
    }
    for (const slugValue of mention?.paperSlugs ?? []) {
      paperSlugs.add(slugValue);
    }

    const paperList = papers
      .filter((paper) => paperSlugs.has(paper.slug))
      .map(({ slug: paperSlug, path: paperPath, title, date, sortTime, summary, tags }) => ({
        slug: paperSlug,
        path: paperPath,
        title,
        date,
        sortTime,
        summary,
        tags,
      }));

    const paperTopics = [...new Set(paperList.flatMap((paper) => paper.tags ?? []))];
    const profileTopics = profile?.topics ?? [];
    const record = {
      slug,
      path: `/authors/${slug}/`,
      name,
      aliases: profile?.aliases ?? [],
      affiliations: profile?.affiliations ?? [],
      homepage: profile?.homepage ?? '',
      x: profile?.x ?? '',
      xConfidence: profile?.xConfidence ?? '',
      topics: profileTopics.length > 0 ? profileTopics : paperTopics,
      notes: profile?.notes ?? '',
      sources: profile?.sources ?? [],
      profileStatus: profile ? 'tracked' : 'recurring',
      paperCount: paperList.length,
      papers: paperList,
    };

    for (const aliasKey of aliasKeys) {
      if (aliasKey) authorRecordsByKey.set(aliasKey, record);
    }
    if (key) authorRecordsByKey.set(key, record);
  };

  for (const profile of authorProfiles) {
    const key = normalizeAuthorKey(profile.name);
    addAuthorRecord(key, profile, authorMentions.get(key));
  }

  for (const [key, mention] of authorMentions) {
    if (authorRecordsByKey.has(key) || mention.paperSlugs.size < 2) continue;
    addAuthorRecord(key, null, mention);
  }

  const authors = [...new Map([...authorRecordsByKey.values()].map((author) => [author.slug, author])).values()].map((author) => {
    const coauthorsByKey = new Map();
    const ownKeys = [author.name, ...(author.aliases ?? [])].map(normalizeAuthorKey);

    for (const paper of papers) {
      if (!paper.parsedAuthors.some((name) => ownKeys.includes(normalizeAuthorKey(name)))) continue;
      for (const coauthorName of paper.parsedAuthors) {
        const key = normalizeAuthorKey(coauthorName);
        if (!key || ownKeys.includes(key)) continue;
        const linked = authorRecordsByKey.get(key);
        coauthorsByKey.set(key, {
          name: linked?.name ?? coauthorName,
          path: linked?.path ?? '',
        });
      }
    }

    return {
      ...author,
      coauthors: [...coauthorsByKey.values()]
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 24),
    };
  });

  authors.sort((a, b) => {
    const statusCompare = a.profileStatus === b.profileStatus ? 0 : a.profileStatus === 'tracked' ? -1 : 1;
    return statusCompare || b.paperCount - a.paperCount || a.name.localeCompare(b.name);
  });

  for (const paper of papers) {
    paper.authorEntries = paper.parsedAuthors.map((name) => {
      const author = authorRecordsByKey.get(normalizeAuthorKey(name));
      return author ? { name, path: author.path, slug: author.slug, profileStatus: author.profileStatus } : { name };
    });
    delete paper.parsedAuthors;
  }

  const utilities = [];
  for (const [file, meta] of utilityFiles) {
    const sourcePath = path.join(repoRoot, file);
    const raw = await fs.readFile(sourcePath, 'utf8');
    const pageMarkdown = stripPageChrome(raw);
    utilities.push({
      ...meta,
      file,
      date: getDate(raw),
      summary: excerpt(raw, 180),
      headings: collectHeadings(pageMarkdown),
      html: renderMarkdown(pageMarkdown, paperFiles),
    });
  }

  const tags = [...new Set(papers.flatMap((paper) => paper.tags))].sort();
  const data = {
    generatedAt: new Date().toISOString(),
    site: {
      title: 'Chlience Paper Archive',
      description: 'LLM, RL, systems, safety, theory paper reading notes with author and cross-paper relationships.',
      url: 'https://papers.chlience.com',
    },
    papers,
    authors,
    utilities,
    tags,
  };

  await fs.mkdir(generatedDir, { recursive: true });
  await fs.writeFile(generatedFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Generated ${papers.length} paper pages, ${authors.length} author pages, and ${utilities.length} utility pages.`);
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
