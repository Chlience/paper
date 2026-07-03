import path from 'node:path';
import katex from 'katex';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTexmath from 'markdown-it-texmath';
import { internalFilePaths, legacyLocalRoot, utilityFiles } from './repository.mjs';

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

export const stripMarkdown = (value = '') =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const excerpt = (value, limit = 220) => {
  const text = stripMarkdown(value);
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
};

export const getFirstHeading = (markdown, fallback) => {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (!match) return fallback;
  return match[1].replace(/\s+(论文笔记|技术文章笔记)\s*$/, '').trim();
};

export const getTopLevelField = (markdown, name) => {
  const escaped = escapeRegExp(name);
  return markdown.match(new RegExp(`^${escaped}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
};

export const getFirstArchivedAt = (markdown) =>
  getTopLevelField(markdown, 'First-Archived-At') ||
  getTopLevelField(markdown, 'Archive-Time') ||
  getTopLevelField(markdown, 'Sort-Time') ||
  getTopLevelField(markdown, 'Date');

export const getUpdatedAt = (markdown) =>
  getTopLevelField(markdown, 'Updated-At') ||
  getTopLevelField(markdown, 'Sort-Time') ||
  getTopLevelField(markdown, 'Archive-Time') ||
  getTopLevelField(markdown, 'Date') ||
  getFirstArchivedAt(markdown);

export const getPinned = (markdown) => /^(true|yes|1)$/i.test(getTopLevelField(markdown, 'Pinned'));

export const getSection = (markdown, heading) => {
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

export const getSourceFieldRaw = (markdown, names) => {
  const labels = Array.isArray(names) ? names : [names];
  for (const label of labels) {
    const escaped = escapeRegExp(label);
    const value = markdown.match(new RegExp(`^-\\s+${escaped}:\\s*(.+)$`, 'mi'))?.[1]?.trim();
    if (value) return value;
  }
  return '';
};

export const getSourceField = (markdown, names) => stripMarkdown(getSourceFieldRaw(markdown, names));

export const getSourceUrl = (markdown) => {
  const candidates = [
    ['arXiv', getSourceFieldRaw(markdown, 'arXiv')],
    ['URL', getSourceFieldRaw(markdown, 'URL')],
    ['PDF', getSourceFieldRaw(markdown, 'PDF')],
    ['Source', getSourceFieldRaw(markdown, 'Source')],
    ['DOI', getSourceFieldRaw(markdown, 'DOI')],
  ];

  for (const [label, rawValue] of candidates) {
    if (!rawValue) continue;
    const markdownUrl = rawValue.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/i)?.[1];
    if (markdownUrl) return markdownUrl;

    const bareUrl = rawValue.match(/https?:\/\/[^\s)；，。]+/i)?.[0];
    if (bareUrl) return bareUrl;

    const plainValue = stripMarkdown(rawValue);
    if (label === 'arXiv') {
      const arxivId = plainValue.match(/\b\d{4}\.\d{4,5}(?:v\d+)?\b/)?.[0];
      if (arxivId) return `https://arxiv.org/abs/${arxivId}`;
    }

    if (label === 'DOI') {
      const doi = plainValue.match(/\b10\.\d{4,9}\/\S+\b/)?.[0]?.replace(/[；，。.]$/, '');
      if (doi) return `https://doi.org/${doi}`;
    }
  }

  return '';
};

export const stripPageChrome = (markdown) =>
  markdown
    .replace(/^#\s+.+\n+/, '')
    .replace(/^First-Archived-At:\s*.+\n+/m, '')
    .replace(/^Updated-At:\s*.+\n+/m, '')
    .replace(/^Pinned:\s*.+\n+/m, '')
    .replace(/^Date:\s*.+\n+/m, '')
    .replace(/^Archive-Time:\s*.+\n+/m, '')
    .replace(/^Sort-Time:\s*.+\n+/m, '')
    .trim();

const paperMaintenanceLinePattern =
  /(关系判断|作者\s*profile\s*pass|Author\s+profile\s+pass|作者页决策|Grok broad|Grok CLI|SuperGrok|xConfidence|not-found|账号搜索|X\s*\/\s*GitHub|逐人\s*X|逐作者档案|全量作者\s*profile|全作者\s*X|全体作者\s*X|homepage\s*\/\s*GitHub\s*\/\s*Scholar)/i;

export const stripPublicPaperMaintenance = (markdown) => {
  const lines = markdown.split('\n');
  const kept = [];
  let skipAuthorMaintenanceBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (skipAuthorMaintenanceBlock) {
      if (/^##\s+/.test(line)) {
        skipAuthorMaintenanceBlock = false;
      } else {
        continue;
      }
    }

    if (/^关系判断[:：]?$/.test(trimmed) || /^作者\s*profile\s*pass[:：]?$/.test(trimmed) || /^作者页决策[:：]?$/.test(trimmed)) {
      skipAuthorMaintenanceBlock = true;
      continue;
    }

    if (/^#{3,6}\s+Author\s+profile\s+pass/i.test(trimmed)) {
      skipAuthorMaintenanceBlock = true;
      continue;
    }

    if (paperMaintenanceLinePattern.test(line)) continue;

    kept.push(line);
  }

  return kept.join('\n').trim();
};

const fileToWebPath = (file, paperFileNames) => {
  const normalizedFile = file.replace(/^[./]+/, '').replace(/\\/g, '/');
  const fileName = path.basename(normalizedFile);
  if (paperFileNames.has(fileName)) return `/papers/${fileName.replace(/\.md$/, '')}/`;
  if (internalFilePaths.has(normalizedFile)) return internalFilePaths.get(normalizedFile);
  if (internalFilePaths.has(fileName)) return internalFilePaths.get(fileName);
  return utilityFiles.get(fileName)?.path ?? null;
};

const normalizeLocalLinks = (markdown, paperFileNames) => {
  const legacyRootPattern = escapeRegExp(`${legacyLocalRoot}/`);
  let result = markdown.replace(
    new RegExp(`\\]\\((?:${legacyRootPattern})?([^\\)\\s:#]+\\.md)(?::\\d+)?(#[^)]+)?\\)`, 'g'),
    (match, file, hash = '') => {
      const webPath = fileToWebPath(file, paperFileNames);
      return webPath ? `](${webPath}${hash})` : match;
    },
  );

  const localFiles = [
    ...[...paperFileNames].flatMap((file) => [file, `content/papers/${file}`]),
    ...[...utilityFiles.keys()].flatMap((file) => [file, `content/utility/${file}`]),
    ...internalFilePaths.keys(),
  ];
  for (const file of localFiles) {
    const webPath = fileToWebPath(file, paperFileNames);
    if (!webPath) continue;
    result = result.replaceAll(`${legacyLocalRoot}/${file}`, webPath);
  }

  result = result.replaceAll(legacyLocalRoot, 'paper archive root');

  return result;
};

export const collectHeadings = (markdown) => {
  const headings = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;
    headings.push({
      depth: match[1].length,
      text: stripMarkdown(match[2]),
      id:
        match[2]
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

export const renderMarkdown = (markdown, paperFileNames) => {
  slugCounts.clear();
  return md.render(normalizeLocalLinks(markdown, paperFileNames));
};
