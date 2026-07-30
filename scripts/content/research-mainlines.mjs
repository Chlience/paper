import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  collectHeadings,
  excerpt,
  getFirstArchivedAt,
  getFirstHeading,
  getSection,
  getSourceField,
  getSourceFieldRaw,
  getTopLevelField,
  getUpdatedAt,
  renderMarkdown,
  stripMarkdown,
  stripPageChrome,
  stripSection,
} from './markdown.mjs';
import { PAPER_REVIEW_STATUSES } from '../../src/lib/paper-review.mjs';

export const REQUIRED_MAINLINE_HEADINGS = [
  'Source',
  '综合判断',
  '核心问题与边界',
  '分类框架',
  '演进脉络',
  '跨材料比较',
  '证据强度',
  '当前判断',
  '开放问题',
  '局限',
  '更新记录',
];

const FORBIDDEN_PAPER_HEADINGS = new Set([
  '作者与关系',
  '一句话结论',
  '论文脉络',
  '关键实验/定理',
  '关键实验结果',
  'OpenReview / 审稿意见吸收',
  '跨论文关系',
]);
const REVIEW_STATUSES = new Set(PAPER_REVIEW_STATUSES);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MINUTE_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const SEARCH_WINDOW_PATTERN = /^(\d{4}-\d{2}-\d{2})\s+至\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+([A-Z][A-Z0-9+:-]*)$/;
const PAPER_LINK_PATTERN = /\/papers\/([^/#?\s)]+)\//g;
const HTTP_LINK_PATTERN = /https?:\/\/[^\s)>；，。]+/g;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

const issue = (code, subject, message) => ({ code, subject, message });
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const uniqueMatches = (markdown, pattern, group = 0) =>
  [...new Set([...String(markdown).matchAll(pattern)].map((match) => match[group]))];
const validMinute = (value) => MINUTE_PATTERN.test(value ?? '') && !Number.isNaN(Date.parse(value.replace(' ', 'T')));
const validDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const parseAxes = (value = '') =>
  String(value)
    .split(/[；;,，]/)
    .map((item) => stripMarkdown(item).trim())
    .filter(Boolean);

export const parseSearchWindow = (value = '') => {
  const match = String(value).trim().match(SEARCH_WINDOW_PATTERN);
  if (!match || !validDay(match[1]) || !validDay(match[2]) || match[1] > match[2]) return null;
  return {
    start: match[1],
    end: match[2],
    cutoff: `${match[2]} ${match[3]} ${match[4]}`,
    timezone: match[4],
    label: `${match[1].slice(0, 7).replace('-', '.')} → ${match[2].slice(0, 7).replace('-', '.')}`,
  };
};

const sourceProtocol = (source = '') => {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => /^###\s+检索与纳入协议\s*$/.test(line.trim()));
  if (start < 0) return '';
  const endOffset = lines.slice(start + 1).findIndex((line) => /^###\s+/.test(line));
  const end = endOffset < 0 ? lines.length : start + 1 + endOffset;
  return lines.slice(start, end).join('\n').trim();
};

const readOptional = async (file, fallback) => {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
};

export const loadResearchMainlines = async ({ repoRoot = process.cwd() } = {}) => {
  const dir = path.join(repoRoot, 'content', 'mainlines');
  const files = (await fs.readdir(dir)).filter((fileName) => fileName.endsWith('.md')).sort();
  return Promise.all(
    files.map(async (fileName) => {
      const slug = fileName.slice(0, -3);
      const sourcePath = path.join(dir, fileName);
      return {
        slug,
        fileName,
        file: path.relative(repoRoot, sourcePath).split(path.sep).join('/'),
        sourcePath,
        markdown: await fs.readFile(sourcePath, 'utf8'),
      };
    }),
  );
};

export const validateResearchMainlines = async (entries, { repoRoot = process.cwd() } = {}) => {
  const errors = [];
  const advisories = [];
  const paperDir = path.join(repoRoot, 'content', 'papers');
  const paperFiles = await fs.readdir(paperDir);
  const knownPaperSlugs = new Set(paperFiles.filter((name) => name.endsWith('.md')).map((name) => name.slice(0, -3)));
  const indexMarkdown = await readOptional(path.join(repoRoot, 'content', 'utility', 'papers-index.md'), '');
  const paperTags = JSON.parse(await readOptional(path.join(repoRoot, 'data', 'paper-tags.json'), '{}'));
  const tagSlugs = new Set(Object.keys(paperTags.papers ?? paperTags));
  const seenSlugs = new Set();

  for (const entry of entries) {
    const { slug, markdown } = entry;
    if (seenSlugs.has(slug)) errors.push(issue('duplicate-slug', slug, 'Mainline slug must be unique.'));
    seenSlugs.add(slug);
    if (!SLUG_PATTERN.test(slug) || /^20\d{2}-/.test(slug)) {
      errors.push(issue('stable-slug', slug, 'Mainline slug must be date-free kebab-case.'));
    }

    const title = getFirstHeading(markdown, slug);
    if (/^20\d{2}|20\d{2}\s*年\s*\d/.test(title)) {
      errors.push(issue('stable-title', slug, 'Mainline title must keep date windows inside the article.'));
    }
    const firstArchivedAt = getFirstArchivedAt(markdown);
    const updatedAt = getUpdatedAt(markdown);
    const reviewStatus = getTopLevelField(markdown, 'Review-Status');
    const reviewedAt = getTopLevelField(markdown, 'Reviewed-At');
    if (!validMinute(firstArchivedAt) || !validMinute(updatedAt) || updatedAt < firstArchivedAt) {
      errors.push(issue('timestamps', slug, 'First-Archived-At and Updated-At must be ordered YYYY-MM-DD HH:mm values.'));
    }
    if (!REVIEW_STATUSES.has(reviewStatus)) {
      errors.push(issue('review-status', slug, `Review-Status must be one of: ${PAPER_REVIEW_STATUSES.join(', ')}.`));
    }
    if (reviewStatus === 'pending' && reviewedAt) {
      errors.push(issue('reviewed-at', slug, 'Pending articles must not declare Reviewed-At.'));
    } else if (reviewStatus === 'approved' && !validMinute(reviewedAt)) {
      errors.push(issue('reviewed-at', slug, 'Approved articles require Reviewed-At in YYYY-MM-DD HH:mm.'));
    }

    const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => stripMarkdown(match[1]));
    let previous = -1;
    for (const heading of REQUIRED_MAINLINE_HEADINGS) {
      const index = headings.indexOf(heading);
      if (index < 0 || !getSection(markdown, heading).trim()) {
        errors.push(issue('required-section', slug, `Missing or empty section: ${heading}.`));
      } else if (index <= previous) {
        errors.push(issue('section-order', slug, `Section ${heading} is out of order.`));
      }
      previous = Math.max(previous, index);
    }
    for (const heading of headings) {
      if (FORBIDDEN_PAPER_HEADINGS.has(heading)) {
        errors.push(issue('paper-only-section', slug, `Single-paper section is not part of the mainline contract: ${heading}.`));
      }
    }

    const source = getSection(markdown, 'Source');
    const sourceField = (names) => getSourceFieldRaw(source, names).trim();
    if (sourceField('Workflow version') !== 'synthesis-v1') {
      errors.push(issue('workflow-version', slug, 'Workflow version must equal synthesis-v1.'));
    }
    if (sourceField('Material type') !== 'composite') {
      errors.push(issue('material-type', slug, 'Material type must equal composite.'));
    }
    const modules = sourceField('Analysis modules').split(',').map((item) => item.trim()).filter(Boolean);
    if (!modules.includes('survey')) errors.push(issue('survey-module', slug, 'Analysis modules must include survey.'));
    for (const field of ['Responsible organization', 'Search services', 'Search window', 'Research question', 'Classification axes', 'Key figure decision']) {
      if (!sourceField(field)) errors.push(issue('source-field', slug, `Missing Source field: ${field}.`));
    }
    if (!parseSearchWindow(sourceField('Search window'))) {
      errors.push(issue('search-window', slug, 'Search window must include ordered dates, cutoff minute, and timezone.'));
    }
    if (!sourceProtocol(source)) errors.push(issue('search-protocol', slug, 'Source must contain ### 检索与纳入协议.'));
    if (parseAxes(sourceField('Classification axes')).length < 2) {
      errors.push(issue('classification-axes', slug, 'Classification axes must declare at least two topic-specific axes.'));
    }

    const figureDecision = sourceField('Key figure decision');
    const localImages = uniqueMatches(markdown, MARKDOWN_IMAGE_PATTERN, 1).filter((value) => value.startsWith('/images/'));
    if (!['include', 'omit'].includes(figureDecision)) {
      errors.push(issue('key-figure-decision', slug, 'Key figure decision must be include or omit.'));
    } else if (figureDecision === 'include' && (localImages.length === 0 || !/Image Source:/i.test(markdown))) {
      errors.push(issue('key-figure-include', slug, 'include requires a local image and Image Source.'));
    } else if (figureDecision === 'omit' && !sourceField('Key figure rationale')) {
      errors.push(issue('key-figure-rationale', slug, 'omit requires Key figure rationale.'));
    }

    const localPaperSlugs = uniqueMatches(markdown, PAPER_LINK_PATTERN, 1);
    for (const paperSlug of localPaperSlugs) {
      if (!knownPaperSlugs.has(paperSlug)) {
        errors.push(issue('paper-link', `${slug}:${paperSlug}`, 'Mainline links to an unknown local paper.'));
      }
    }
    const sourceCount = new Set([...localPaperSlugs, ...uniqueMatches(markdown, HTTP_LINK_PATTERN)]).size;
    if (sourceCount < 2) errors.push(issue('source-diversity', slug, 'A mainline must compare at least two traceable materials.'));
    const comparison = getSection(markdown, '跨材料比较');
    if (!/\|[^\n]+\|/.test(comparison)) {
      errors.push(issue('comparison-structure', slug, '跨材料比较 must contain a normalized comparison table.'));
    }
    const evidence = getSection(markdown, '证据强度');
    if (!/(强|中|弱|待验证)/.test(evidence) || !/(结论|判断)/.test(evidence)) {
      errors.push(issue('evidence-per-conclusion', slug, '证据强度 must assess named conclusions or judgments.'));
    }
    if (indexMarkdown.includes(`/papers/${slug}/`) || tagSlugs.has(slug)) {
      errors.push(issue('paper-inventory-leak', slug, 'Mainlines must stay outside the paper index and paper tags.'));
    }
  }

  return { valid: errors.length === 0, errors, advisories };
};

const publicMarkdown = (markdown) => {
  const source = getSection(markdown, 'Source');
  const protocol = sourceProtocol(source).replace(/^###\s+/, '## ');
  const body = stripSection(stripPageChrome(markdown), 'Source');
  return [protocol, body].filter(Boolean).join('\n\n');
};

export const buildMainlineRecords = (entries) =>
  entries
    .map(({ slug, file, markdown }) => {
      const source = getSection(markdown, 'Source');
      const field = (names) => getSourceFieldRaw(source, names).trim();
      const body = publicMarkdown(markdown);
      const includedPaperSlugs = uniqueMatches(markdown, PAPER_LINK_PATTERN, 1);
      const externalSources = uniqueMatches(markdown, HTTP_LINK_PATTERN);
      return {
        slug,
        id: slug,
        file,
        path: `/mainlines/${slug}/`,
        title: getFirstHeading(markdown, slug),
        firstArchivedAt: getFirstArchivedAt(markdown),
        updatedAt: getUpdatedAt(markdown),
        reviewStatus: getTopLevelField(markdown, 'Review-Status'),
        reviewedAt: getTopLevelField(markdown, 'Reviewed-At'),
        responsibleOrganization: getSourceField(source, 'Responsible organization'),
        researchQuestion: getSourceField(source, 'Research question'),
        classificationAxes: parseAxes(field('Classification axes')),
        searchServices: getSourceField(source, 'Search services'),
        searchWindow: parseSearchWindow(field('Search window')),
        subjects: getSourceField(source, 'Subjects'),
        coreSignal: excerpt(getSection(markdown, '综合判断'), 280),
        boundary: excerpt(getSection(markdown, '核心问题与边界'), 260),
        currentJudgment: excerpt(getSection(markdown, '当前判断'), 320),
        includedPaperSlugs,
        localPaperCount: includedPaperSlugs.length,
        externalSourceCount: externalSources.length,
        sourceCount: new Set([...includedPaperSlugs, ...externalSources]).size,
        headings: collectHeadings(body),
        html: renderMarkdown(body),
      };
    })
    .sort((left, right) =>
      String(right.firstArchivedAt).localeCompare(String(left.firstArchivedAt)) || left.title.localeCompare(right.title, 'zh-CN'),
    );
