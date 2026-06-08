import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';

const repoRoot = process.cwd();
const generatedDir = path.join(repoRoot, 'src/generated');
const generatedFile = path.join(generatedDir, 'paper-data.json');
const legacyLocalRoot = ['', 'home', 'chlience', 'paper'].join('/');

const utilityFiles = new Map([
  ['papers-index.md', { slug: 'archive', title: 'Paper Archive Index', path: '/archive/' }],
  ['paper-analysis-workflow.md', { slug: 'workflow', title: 'Paper Analysis Workflow', path: '/workflow/' }],
  ['paper-note-template.md', { slug: 'template', title: 'Paper Note Template', path: '/template/' }],
]);

const internalFilePaths = new Map([
  ['AGENTS.md', '/workflow/'],
  ['README.md', '/'],
]);

const excludedPaperFiles = new Set(['AGENTS.md', 'README.md', ...utilityFiles.keys()]);

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

const excerpt = (value, limit = 220) => {
  const text = stripMarkdown(value);
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
};

const getFirstHeading = (markdown, fallback) => {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (!match) return fallback;
  return match[1].replace(/\s+(论文笔记|技术文章笔记)\s*$/, '').trim();
};

const getDate = (markdown) => markdown.match(/^Date:\s*(.+)$/m)?.[1]?.trim() ?? '';

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

    papers.push({
      slug,
      file,
      path: `/papers/${slug}/`,
      title,
      date: getDate(raw),
      sourceUrl,
      authors: getSourceField(raw, ['Authors', 'Author']) || 'Unknown',
      subjects: getSourceField(raw, 'Subjects'),
      currentVersion: getSourceField(raw, 'Current version read'),
      tags: inferTags(raw, file),
      summary: excerpt(oneSentence || getSection(raw, '论文脉络')),
      headings: collectHeadings(raw),
      html: renderMarkdown(raw, paperFiles),
    });
  }

  papers.sort((a, b) => {
    const dateCompare = String(b.date).localeCompare(String(a.date));
    return dateCompare || b.slug.localeCompare(a.slug);
  });

  const utilities = [];
  for (const [file, meta] of utilityFiles) {
    const sourcePath = path.join(repoRoot, file);
    const raw = await fs.readFile(sourcePath, 'utf8');
    utilities.push({
      ...meta,
      file,
      date: getDate(raw),
      summary: excerpt(raw, 180),
      headings: collectHeadings(raw),
      html: renderMarkdown(raw, paperFiles),
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
    utilities,
    tags,
  };

  await fs.mkdir(generatedDir, { recursive: true });
  await fs.writeFile(generatedFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Generated ${papers.length} paper pages and ${utilities.length} utility pages.`);
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
