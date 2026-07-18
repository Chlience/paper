import katex from 'katex';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTexmath from 'markdown-it-texmath';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const slugCounts = new Map();
const imageDimensions = new Map();
const publicDir = path.resolve(process.cwd(), 'public');

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

const getLocalImageDimensions = (src) => {
  if (!src || !src.startsWith('/')) return null;
  const cleanSrc = src.split(/[?#]/)[0];
  if (!cleanSrc.startsWith('/images/')) return null;
  if (imageDimensions.has(cleanSrc)) return imageDimensions.get(cleanSrc);

  const filePath = path.resolve(publicDir, cleanSrc.replace(/^\/+/, ''));
  if (!filePath.startsWith(`${publicDir}${path.sep}`) || !existsSync(filePath)) {
    imageDimensions.set(cleanSrc, null);
    return null;
  }

  const buffer = readFileSync(filePath);
  const isPng =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  if (!isPng) {
    imageDimensions.set(cleanSrc, null);
    return null;
  }

  const dimensions = {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
  imageDimensions.set(cleanSrc, dimensions);
  return dimensions;
};

const getPlainInlineText = (inlineToken) =>
  (inlineToken?.children ?? [])
    .map((child) => child.content ?? '')
    .join('')
    .trim();

const isFigureCaption = (inlineToken) =>
  /^(Figure|Fig\.|图)\s*[A-Za-z0-9一二三四五六七八九十.:-]*/i.test(getPlainInlineText(inlineToken));

const isSingleImageParagraph = (inlineToken) => {
  const children = inlineToken?.children ?? [];
  return children.length === 1 && children[0].type === 'image';
};

const addImageLoadingAttrs = (imageToken) => {
  const src = imageToken.attrGet('src');
  const alt = (imageToken.content || imageToken.attrGet('alt') || '').trim();
  const dimensions = getLocalImageDimensions(src);

  imageToken.attrJoin('class', 'paper-figure-image');
  imageToken.attrSet('loading', 'lazy');
  imageToken.attrSet('decoding', 'async');
  if (alt) imageToken.attrSet('alt', alt);
  if (dimensions) {
    imageToken.attrSet('width', String(dimensions.width));
    imageToken.attrSet('height', String(dimensions.height));
  }
};

const paperFigurePlugin = (markdown) => {
  markdown.core.ruler.after('inline', 'paper_figures', (state) => {
    const output = [];

    for (let i = 0; i < state.tokens.length; i += 1) {
      const token = state.tokens[i];
      const inline = state.tokens[i + 1];
      const close = state.tokens[i + 2];
      const nextOpen = state.tokens[i + 3];
      const captionInline = state.tokens[i + 4];
      const nextClose = state.tokens[i + 5];

      if (
        token?.type === 'paragraph_open' &&
        inline?.type === 'inline' &&
        close?.type === 'paragraph_close' &&
        isSingleImageParagraph(inline) &&
        nextOpen?.type === 'paragraph_open' &&
        captionInline?.type === 'inline' &&
        nextClose?.type === 'paragraph_close' &&
        isFigureCaption(captionInline)
      ) {
        const image = inline.children[0];
        const src = image.attrGet('src');
        const alt = (image.content || image.attrGet('alt') || '').trim();
        addImageLoadingAttrs(image);

        const figureOpen = new state.Token('figure_open', 'figure', 1);
        figureOpen.attrSet('class', 'paper-figure');
        figureOpen.attrSet('data-paper-figure', '');

        const linkOpen = new state.Token('link_open', 'a', 1);
        linkOpen.attrSet('class', 'paper-figure-open');
        linkOpen.attrSet('data-paper-figure-open', '');
        linkOpen.attrSet('href', src);
        linkOpen.attrSet('aria-label', alt ? `查看大图：${alt}` : '查看大图');

        const linkClose = new state.Token('link_close', 'a', -1);
        const captionOpen = new state.Token('figcaption_open', 'figcaption', 1);
        captionOpen.attrSet('class', 'paper-figure-caption');
        const captionClose = new state.Token('figcaption_close', 'figcaption', -1);
        const figureClose = new state.Token('figure_close', 'figure', -1);

        output.push(figureOpen, linkOpen, image, linkClose, captionOpen, captionInline, captionClose, figureClose);
        i += 5;
        continue;
      }

      output.push(token);
    }

    state.tokens = output;
  });
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
  })
  .use(paperFigurePlugin);

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

export const getFirstArchivedAt = (markdown) => getTopLevelField(markdown, 'First-Archived-At');

export const getUpdatedAt = (markdown) =>
  getTopLevelField(markdown, 'Updated-At') || getFirstArchivedAt(markdown);

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
    .replace(/^Review-Status:\s*.+\n+/m, '')
    .replace(/^Reviewed-At:\s*.+\n+/m, '')
    .replace(/^Pinned:\s*.+\n+/m, '')
    .trim();

const publicUtilityOmitBlockPattern =
  /<!--\s*public-utility-omit:start\s*-->[\s\S]*?<!--\s*public-utility-omit:end\s*-->/gi;

export const stripPublicUtilityMaintenance = (markdown = '') =>
  String(markdown)
    .replace(publicUtilityOmitBlockPattern, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const publicPaperMaintenanceExemptionPatterns = [
  /^-[ \t]+Page type:[ \t]*not-found[ \t]*$/i,
  /^-[ \t]+Review status:[ \t]*page-type=not-found;[ \t]*match-confidence=(?:high|medium|low);[ \t]*observed-at=\d{4}-\d{2}-\d{2};[ \t]*venue-status=\S.*$/i,
];

export const isPublicPaperMaintenanceExemption = (line) =>
  publicPaperMaintenanceExemptionPatterns.some((pattern) => pattern.test(line));

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

    if (isPublicPaperMaintenanceExemption(trimmed)) {
      kept.push(line);
      continue;
    }

    if (paperMaintenanceLinePattern.test(line)) continue;

    kept.push(line);
  }

  return kept.join('\n').trim();
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

export const renderMarkdown = (markdown) => {
  slugCounts.clear();
  return md.render(markdown);
};
