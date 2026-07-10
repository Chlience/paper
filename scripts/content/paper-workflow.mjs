import path from 'node:path';
import MarkdownIt from 'markdown-it';
import {
  authorProfileIsReferenced,
  collectAuthorReferences,
  normalizeAuthorKey,
  splitAuthorNames,
} from './authors.mjs';
import { getFirstArchivedAt, getSection, getSourceField, getSourceFieldRaw, getTopLevelField } from './markdown.mjs';

export const REQUIRED_SECTION_GROUPS = [
  { name: 'Source', headings: ['Source'] },
  { name: '作者与关系', headings: ['作者与关系'] },
  { name: '一句话结论', headings: ['一句话结论'] },
  { name: '论文脉络', headings: ['论文脉络'] },
  {
    name: '关键实验/定理',
    headings: ['关键实验/定理', '关键实验结果', '主要实验结果', '关键定理', '文献扫描结果', '方法论论证'],
  },
  { name: '证据链强度评估', headings: ['证据链强度评估'] },
  { name: 'OpenReview / 审稿意见吸收', headings: ['OpenReview / 审稿意见吸收'] },
  { name: '主要启发', headings: ['主要启发'] },
  { name: '局限', headings: ['局限', '局限与待验证问题'] },
  { name: '跨论文关系', headings: ['跨论文关系'] },
  { name: 'Reference Intake Brief', headings: ['Reference Intake Brief'] },
];

export const MATERIAL_TYPES = new Set([
  'research-paper',
  'technical-report',
  'model-card',
  'survey',
  'blog',
  'framework-docs',
  'composite',
]);

export const REVIEW_PAGE_TYPES = new Set([
  'official-review',
  'metadata-only',
  'proceedings',
  'commentary',
  'not-found',
  'not-applicable',
]);

export const REFERENCE_DECISIONS = new Set(['merge', 'revise-then-merge', 'skip', 'ask-user']);

const evidenceSectionGroup = REQUIRED_SECTION_GROUPS.find((group) => group.name === '关键实验/定理');

const exactMinutePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const exactDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const absoluteUrlPattern = /https?:\/\/[^\s)>；，。]+/gi;
const internalPaperPathPattern = /\/papers\/([^/#?\s)]+)\//g;
const markdownImagePattern = /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g;
const textualEvidenceLocatorPatterns = [
  /§\s*\d+(?:\.\d+)*/,
  /\b(?:section|sec|figure|fig|table|appendix|page|theorem|lemma|chapter)\.?(?=\s|[:#])\s*[:#]?\s*(?:[A-Z]?\d+(?:[._-]\d+)*|[A-Z]\b|["“`][^"”`]+["”`])/i,
  /\bp\.\s*\d+(?:-\d+)?/i,
  /\b(?:file|path)\b\s*[:#]?\s*`?[A-Za-z0-9_@+.-]+(?:\/[A-Za-z0-9_@+.-]+)+`?/i,
  /\bcommit\b\s*[:#]?\s*[0-9a-f]{7,40}\b/i,
  /\blines?\b\s*[:#]?\s*\d+(?:-\d+)?/i,
  /(?:第\s*)?[0-9一二三四五六七八九十]+(?:\.[0-9]+)*\s*(?:节|章|页)/,
  /(?:图|表|附录|定理|引理|页码|行号)\s*[:：]?\s*(?:[A-Z]?\d+(?:[._-]\d+)*|[A-Z]\b)/i,
  /(?:代码路径|文件)\s*[:：]?\s*`?[A-Za-z0-9_@+.-]+(?:\/[A-Za-z0-9_@+.-]+)+`?/,
];

const issue = (code, subject, message) => ({ code, subject, message });
const markdownParser = new MarkdownIt();

const sectionForGroup = (markdown, group) => {
  for (const heading of group.headings) {
    const section = getSection(markdown, heading);
    if (section.trim()) return section;
  }
  return '';
};

const hasTraceableSource = (source, knownPaperSlugs, allowArchive = false) => {
  for (const match of source.matchAll(absoluteUrlPattern)) {
    if (isHttpUrl(match[0])) return true;
  }
  for (const match of source.matchAll(internalPaperPathPattern)) {
    if (knownPaperSlugs.has(match[1])) return true;
  }
  return allowArchive && /(?:^|[\s(])\/archive\/(?:$|[\s)])/m.test(source);
};

const resultBlocks = (section) => {
  const matches = [...section.matchAll(/^###\s+(.+)$/gm)];
  if (matches.length === 0) return section.trim() ? [{ title: 'section', body: section }] : [];
  const blocks = matches
    .map((match, index) => ({
      title: match[1].trim(),
      body: section.slice(match.index, matches[index + 1]?.index ?? section.length),
    }))
    .filter(({ title }) => !/^(?:实验设置|baseline\s*审计|术语|符号约定)/i.test(title));
  return blocks.length > 0 ? blocks : [{ title: 'section', body: section }];
};

const lineValue = (section, name) =>
  section.match(new RegExp(`^- ${name}:\\s*(.+)$`, 'mi'))?.[1]?.trim() ?? '';

const evidenceValue = (block) => block.match(/^- 证据定位[:：]\s*(.+)$/mi)?.[1]?.trim() ?? '';

const resultFieldValue = (block, name) =>
  block.match(new RegExp(`^- ${name}[:：][ \\t]*(.+)$`, 'mi'))?.[1]?.trim() ?? '';

const scalarValue = (value = '') => value.trim().replace(/^`([^`]+)`$/, '$1').trim();

const canonicalValue = (value = '') => {
  const raw = scalarValue(value);
  return raw.match(/^\[[^\]]+\]\(([^)\s]+)\)$/)?.[1] ?? raw.match(/^<([^>\s]+)>$/)?.[1] ?? raw;
};

const isValidDate = (value) => {
  if (!exactDatePattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
};

const isValidMinute = (value) => {
  if (!exactMinutePattern.test(value)) return false;
  const [date, time] = value.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  return isValidDate(date) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
};

const hasEvidenceLocator = (value) => {
  for (const match of value.matchAll(absoluteUrlPattern)) {
    if (isHttpUrl(match[0])) return true;
  }
  return textualEvidenceLocatorPatterns.some((pattern) => pattern.test(value));
};

const isSafePaperImagePath = (imageUrl, expectedPrefix) => {
  if (/[\\%?#]/.test(imageUrl) || !imageUrl.startsWith(expectedPrefix)) return false;
  if (imageUrl.split('/').some((segment) => segment === '.' || segment === '..')) return false;
  return path.posix.normalize(imageUrl) === imageUrl;
};

const workflowVersionFor = (markdown) =>
  scalarValue(getSourceFieldRaw(getSection(markdown, 'Source'), 'Workflow version'));

const firstMarkdownTable = (markdown) => {
  const tokens = markdownParser.parse(markdown, {});
  const tableStart = tokens.findIndex((token) => token.type === 'table_open');
  if (tableStart < 0) return null;

  const rows = [];
  let row = null;
  let cell = null;

  for (const token of tokens.slice(tableStart)) {
    if (token.type === 'table_close') break;
    if (token.type === 'tr_open') row = [];
    if (token.type === 'th_open' || token.type === 'td_open') {
      cell = { text: '', links: [] };
    }
    if (token.type === 'inline' && cell) {
      cell.text = token.content.trim();
      cell.links = (token.children ?? [])
        .filter((child) => child.type === 'link_open')
        .map((child) => child.attrGet('href'))
        .filter(Boolean);
    }
    if ((token.type === 'th_close' || token.type === 'td_close') && row && cell) {
      row.push(cell);
      cell = null;
    }
    if (token.type === 'tr_close' && row) {
      rows.push(row);
      row = null;
    }
  }

  return rows.length > 0 ? { header: rows[0], rows: rows.slice(1) } : null;
};

export const validateArchiveIndex = (indexMarkdown, knownPaperSlugs) => {
  const errors = [];
  const table = firstMarkdownTable(getSection(indexMarkdown, '当前收录'));
  if (!table) {
    errors.push(issue('missing-index-table', '当前收录', 'Archive index must contain the current collection table.'));
    return { errors };
  }

  const header = table.header.map((cell) => cell.text);
  if (header.length !== 3 || header.some((value, index) => value !== ['简称', '时间', '核心信号'][index])) {
    errors.push(issue('index-table-header', '当前收录', 'Expected columns: 简称, 时间, 核心信号.'));
  }

  const indexedCounts = new Map();
  for (const [index, row] of table.rows.entries()) {
    const rowSubject = `row-${index + 1}`;
    if (row.length !== 3) {
      errors.push(issue('index-row-shape', rowSubject, 'Every archive index row must contain exactly three cells.'));
      continue;
    }

    const [titleCell, monthCell, signalCell] = row;
    const paperPath = titleCell.links.length === 1 ? titleCell.links[0] : '';
    const slug = paperPath.match(/^\/papers\/([^/#?]+)\/$/)?.[1] ?? '';
    const shortTitle = titleCell.text.match(/^\[([^\]]+)\]\(\/papers\/[^/#?]+\/\)$/)?.[1]?.trim() ?? '';
    const subject = slug || rowSubject;

    if (!slug) {
      errors.push(issue('index-paper-link', rowSubject, 'The short title must be a single /papers/<slug>/ link.'));
      continue;
    }
    if (!shortTitle) {
      errors.push(issue('missing-index-short-title', subject, 'Archive index short title is required.'));
    }

    indexedCounts.set(slug, (indexedCounts.get(slug) ?? 0) + 1);
    if (!knownPaperSlugs.has(slug)) {
      errors.push(issue('stale-index-entry', slug, 'Archive index links to a paper that is not archived.'));
    }

    if (!/^\d{4}年(?:[1-9]|1[0-2])月$/.test(monthCell.text)) {
      errors.push(issue('index-time-format', subject, 'Archive index time must use YYYY年M月.'));
    }

    const signal = signalCell.text.trim();
    if (!signal) {
      errors.push(issue('missing-core-signal', subject, 'Archive index core signal is required.'));
    } else if (signal.length < 8 || !/[。！？.!?]$/.test(signal)) {
      errors.push(issue('core-signal-format', subject, 'Core signal must be one concise sentence.'));
    }
  }

  for (const [slug, count] of indexedCounts) {
    if (count > 1) {
      errors.push(issue('duplicate-index-entry', slug, `Archive index contains ${count} rows for this paper.`));
    }
  }
  for (const slug of knownPaperSlugs) {
    if (!indexedCounts.has(slug)) {
      errors.push(issue('missing-index-entry', slug, 'Paper is missing from the current collection table.'));
    }
  }

  return { errors };
};

export const validatePaperRecord = async ({
  slug,
  markdown,
  indexMarkdown,
  knownPaperSlugs,
  legacyPaperSlugs = new Set(),
  imageExists,
}) => {
  const errors = [];
  const advisories = [];
  const source = getSection(markdown, 'Source');
  const workflowVersion = scalarValue(getSourceFieldRaw(source, 'Workflow version'));
  const isV2 = workflowVersion.toLowerCase() === 'v2';
  const materialType = scalarValue(getSourceFieldRaw(source, 'Material type'));
  const canonicalSource = canonicalValue(getSourceFieldRaw(source, 'Canonical source'));
  const firstArchivedAt = getFirstArchivedAt(markdown);
  const updatedAt = getTopLevelField(markdown, 'Updated-At');

  if (!workflowVersion && !legacyPaperSlugs.has(slug)) {
    errors.push(issue('missing-workflow-version', slug, 'New notes must declare Workflow version: v2.'));
  } else if (workflowVersion && !isV2) {
    errors.push(issue('unsupported-workflow-version', slug, `Unsupported Workflow version: ${workflowVersion}.`));
  }

  if (!firstArchivedAt || !updatedAt) {
    errors.push(issue('missing-archive-time', slug, 'First-Archived-At and Updated-At are required.'));
  }

  for (const group of REQUIRED_SECTION_GROUPS) {
    if (!sectionForGroup(markdown, group)) {
      errors.push(issue('missing-core-section', slug, `Missing or empty section: ${group.name}.`));
    }
  }
  if (!hasTraceableSource(source, knownPaperSlugs, isV2 && materialType === 'composite')) {
    errors.push(issue('missing-source-link', slug, 'Source must contain an external URL or a valid archived paper link.'));
  }
  if (!indexMarkdown.includes(`/papers/${slug}/`)) {
    errors.push(issue('missing-index-link', slug, 'Archive index does not link to this paper slug.'));
  }
  if (/^\s*(?:- |\d+\. )\s*$/m.test(markdown)) {
    errors.push(issue('template-placeholder', slug, 'Blank list placeholder remains in the note.'));
  }

  if (!isV2) {
    advisories.push(
      issue(
        'legacy-source-snapshot',
        slug,
        'Add Workflow version, Material type, Canonical source, and Accessed.',
      ),
    );
    if (!isValidMinute(firstArchivedAt) || !isValidMinute(updatedAt)) {
      advisories.push(issue('legacy-time-format', slug, 'Normalize timestamps to YYYY-MM-DD HH:mm.'));
    }
    const review = getSection(markdown, 'OpenReview / 审稿意见吸收');
    if (!lineValue(review, 'Page type') || !lineValue(review, 'Match confidence') || !lineValue(review, 'Observed at')) {
      advisories.push(issue('legacy-review-classification', slug, 'Add v2 review classification fields.'));
    }
    if (!/证据定位[:：]/.test(sectionForGroup(markdown, evidenceSectionGroup))) {
      advisories.push(
        issue(
          'legacy-evidence-location',
          slug,
          'Add section, figure, table, appendix, page, or URL evidence locations.',
        ),
      );
    }
    const intake = getSection(markdown, 'Reference Intake Brief');
    const decision = intake.match(/^Decision:\s*(\S+)$/mi)?.[1] ?? '';
    if (!REFERENCE_DECISIONS.has(decision)) {
      advisories.push(
        issue('legacy-reference-decision', slug, 'Standardize Decision to a supported v2 action.'),
      );
    }
  } else if (
    !isValidMinute(firstArchivedAt) ||
    !isValidMinute(updatedAt)
  ) {
    errors.push(issue('v2-time-format', slug, 'v2 timestamps must use YYYY-MM-DD HH:mm.'));
  } else if (updatedAt < firstArchivedAt) {
    errors.push(issue('v2-time-order', slug, 'Updated-At must not precede First-Archived-At.'));
  }

  if (isV2) {
    const sourceField = (names) => scalarValue(getSourceFieldRaw(source, names));
    const accessed = sourceField('Accessed');
    const requiredFields = [
      ['Material type', materialType],
      ['Canonical source', canonicalSource],
      ['Title', sourceField('Title')],
      [
        'Authors or Responsible organization',
        sourceField(['Authors', 'Responsible organization']),
      ],
      [
        'Published / submitted date',
        sourceField(['Published / updated', 'Submitted', 'Published']),
      ],
      [
        'Version / revision read',
        sourceField(['Version / revision read', 'Current version read']),
      ],
      ['Accessed', accessed],
    ];

    for (const [name, value] of requiredFields) {
      if (!value) errors.push(issue('v2-source-field', slug, `Missing v2 Source field: ${name}.`));
    }
    if (!MATERIAL_TYPES.has(materialType)) {
      errors.push(issue('v2-material-type', slug, 'Material type is outside the supported v2 set.'));
    }
    const canonicalPaper = canonicalSource.match(/^\/papers\/([^/#?]+)\/$/)?.[1];
    const validInternalCanonical =
      materialType === 'composite' &&
      (canonicalSource === '/archive/' || (knownPaperSlugs.has(canonicalPaper) && canonicalPaper !== slug));
    if (canonicalSource && !isHttpUrl(canonicalSource) && !validInternalCanonical) {
      errors.push(
        issue(
          'v2-canonical-source',
          slug,
          'Canonical source must be an absolute URL, or a non-self archive path for composite material.',
        ),
      );
    }
    if (accessed && !isValidDate(accessed)) {
      errors.push(issue('v2-accessed-date', slug, 'Accessed must use a valid YYYY-MM-DD date.'));
    }

    for (const block of resultBlocks(sectionForGroup(markdown, evidenceSectionGroup))) {
      const locator = evidenceValue(block.body);
      if (!locator || !hasEvidenceLocator(locator)) {
        errors.push(issue('v2-evidence-location', slug, `Missing evidence location in ${block.title}.`));
      }
      if (!resultFieldValue(block.body, '对照是否可比')) {
        errors.push(
          issue('v2-result-comparability', slug, `Missing comparability assessment in ${block.title}.`),
        );
      }
      if (!resultFieldValue(block.body, '支持的最窄结论')) {
        errors.push(
          issue(
            'v2-result-narrow-conclusion',
            slug,
            `Missing narrowest supported conclusion in ${block.title}.`,
          ),
        );
      }
    }

    const review = getSection(markdown, 'OpenReview / 审稿意见吸收');
    for (const name of ['Page type', 'Match confidence', 'Observed at']) {
      if (!lineValue(review, name)) {
        errors.push(issue('v2-review-field', slug, `Missing review field: ${name}.`));
      }
    }
    if (lineValue(review, 'Page type') && !REVIEW_PAGE_TYPES.has(lineValue(review, 'Page type'))) {
      errors.push(issue('v2-review-page-type', slug, 'Page type is outside the supported v2 set.'));
    }
    if (
      lineValue(review, 'Match confidence') &&
      !/^(high|medium|low)$/i.test(lineValue(review, 'Match confidence'))
    ) {
      errors.push(issue('v2-review-confidence', slug, 'Match confidence must be high, medium, or low.'));
    }
    const observedAt = lineValue(review, 'Observed at');
    if (observedAt && !isValidDate(observedAt)) {
      errors.push(issue('v2-review-date', slug, 'Observed at must use a valid YYYY-MM-DD date.'));
    }

    const intake = getSection(markdown, 'Reference Intake Brief');
    const decision = intake.match(/^Decision:\s*(\S+)$/mi)?.[1] ?? '';
    if (!REFERENCE_DECISIONS.has(decision)) {
      errors.push(issue('v2-reference-decision', slug, 'Reference Intake Brief has an invalid Decision value.'));
    }
  }

  const visibleMarkdown = markdown.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '));
  for (const match of visibleMarkdown.matchAll(markdownImagePattern)) {
    const imageUrl = (match[1] ?? match[2]).trim();
    if (/^https?:\/\//i.test(imageUrl)) continue;

    const expectedPrefix = `/images/papers/${slug}/`;
    if (!imageUrl.startsWith('/images/papers/')) {
      errors.push(issue('image-path', slug, `Local image path must start with ${expectedPrefix}.`));
      continue;
    }
    if (!imageUrl.startsWith(expectedPrefix)) {
      errors.push(issue('image-slug-mismatch', slug, `Image path must start with ${expectedPrefix}.`));
      continue;
    }
    if (!isSafePaperImagePath(imageUrl, expectedPrefix)) {
      errors.push(issue('image-path', slug, `Local image path must stay inside ${expectedPrefix}.`));
      continue;
    }
    const repoRelativePath = path.posix.join('public', imageUrl.slice(1));
    if (!(await imageExists(repoRelativePath))) {
      errors.push(issue('missing-image-file', slug, `Missing image file: ${repoRelativePath}.`));
    }
    const captionStart = match.index + match[0].length;
    const nextImage = visibleMarkdown.indexOf('![', captionStart);
    const captionEnd = Math.min(captionStart + 1000, nextImage === -1 ? visibleMarkdown.length : nextImage);
    const captionWindow = visibleMarkdown.slice(captionStart, captionEnd);
    if (!/Image Source:/i.test(captionWindow)) {
      errors.push(issue('missing-image-source', slug, `Image caption lacks Image Source: ${imageUrl}.`));
    }
  }

  return { errors, advisories };
};

export const validateArchiveTimes = (records) => {
  const errors = [];
  const advisories = [];
  const times = new Map();

  for (const record of records) {
    const value = getFirstArchivedAt(record.markdown);
    const group = times.get(value) ?? [];
    group.push(record);
    times.set(value, group);
  }

  for (const [value, group] of times) {
    if (!value || group.length < 2) continue;
    for (const record of group) {
      const isV2 = workflowVersionFor(record.markdown).toLowerCase() === 'v2';
      const target = isV2 ? errors : advisories;
      target.push(
        issue(
          isV2 ? 'v2-archive-time-conflict' : 'legacy-archive-time-conflict',
          record.slug,
          `First-Archived-At ${value} is shared by ${group.map((item) => item.slug).join(', ')}.`,
        ),
      );
    }
  }

  return { errors, advisories };
};

export const validateAuthorProfiles = (profiles) => {
  const errors = [];
  if (!Array.isArray(profiles)) {
    return { errors: [issue('authors-shape', 'data/authors.json', 'Expected a JSON array.')] };
  }

  const slugOwners = new Map();
  const identityOwners = new Map();
  const directUrlFields = ['homepage', 'github', 'huggingFace', 'x'];

  for (const [index, profile] of profiles.entries()) {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      errors.push(issue('author-profile-shape', `profile[${index}]`, 'Each author profile must be an object.'));
      continue;
    }

    const slug = typeof profile.slug === 'string' ? profile.slug.trim() : '';
    const name = typeof profile.name === 'string' ? profile.name.trim() : '';
    const subject = slug || `profile[${index}]`;
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.push(issue('author-slug', subject, 'Author slug must be a non-empty ASCII slug.'));
    }
    if (!name) {
      errors.push(issue('author-name', subject, 'Author name must be a non-empty string.'));
    }

    if (slug && slugOwners.has(slug)) {
      errors.push(
        issue('author-slug-conflict', slug, `Slug is already used by ${slugOwners.get(slug)}.`),
      );
    } else if (slug) {
      slugOwners.set(slug, name);
    }

    let aliases = [];
    if (profile.aliases !== undefined && !Array.isArray(profile.aliases)) {
      errors.push(issue('author-aliases-shape', subject, 'aliases must be an array when present.'));
    } else {
      aliases = profile.aliases ?? [];
    }

    for (const identity of [name, ...aliases]) {
      if (typeof identity !== 'string') {
        errors.push(issue('author-alias', subject, 'Every alias must be a string.'));
        continue;
      }
      const key = normalizeAuthorKey(identity);
      if (!key) continue;
      const owner = identityOwners.get(key);
      if (owner && owner !== slug) {
        errors.push(
          issue(
            'author-identity-conflict',
            identity,
            `Normalized identity is shared by ${owner} and ${slug}.`,
          ),
        );
      } else if (slug) {
        identityOwners.set(key, slug);
      }
    }

    for (const fieldName of directUrlFields) {
      const value = profile[fieldName];
      if (value && (typeof value !== 'string' || !isHttpUrl(value))) {
        errors.push(issue('author-profile-url', subject, `${fieldName} must be a valid absolute HTTP URL.`));
      }
    }

    let sources = [];
    if (profile.sources !== undefined && !Array.isArray(profile.sources)) {
      errors.push(issue('author-sources-shape', subject, 'sources must be an array when present.'));
    } else {
      sources = profile.sources ?? [];
    }
    for (const source of sources) {
      const value = typeof source === 'string' ? source : source?.url;
      if (typeof value !== 'string' || !isHttpUrl(value)) {
        errors.push(issue('author-source-url', subject, 'Every source must contain a valid absolute HTTP URL.'));
      }
    }
  }

  return { errors };
};

export const findRecurringUnprofiled = (records, profiles) => {
  const profileKeys = new Set(
    profiles
      .filter((profile) => profile && typeof profile === 'object' && !Array.isArray(profile))
      .flatMap((profile) => [
        profile.name,
        ...(Array.isArray(profile.aliases) ? profile.aliases : []),
      ])
      .filter((name) => typeof name === 'string')
      .map(normalizeAuthorKey),
  );
  const mentions = new Map();

  for (const record of records) {
    const source = getSection(record.markdown, 'Source');
    for (const name of splitAuthorNames(getSourceField(source, ['Authors', 'Author']))) {
      const key = normalizeAuthorKey(name);
      const value = mentions.get(key) ?? { name, paperSlugs: new Set() };
      value.paperSlugs.add(record.slug);
      mentions.set(key, value);
    }
  }

  return [...mentions.entries()]
    .filter(([key, value]) => !profileKeys.has(key) && value.paperSlugs.size >= 2)
    .map(([, value]) => issue('recurring-unprofiled-author', value.name, `Appears in ${value.paperSlugs.size} papers.`))
    .sort((left, right) => left.subject.localeCompare(right.subject));
};

export const findOrphanAuthorProfiles = (records, profiles) => {
  if (!Array.isArray(profiles)) return [];
  const references = records.map((record) => {
    const source = getSection(record.markdown, 'Source');
    return collectAuthorReferences(record.markdown, getSourceField(source, ['Authors', 'Author']));
  });

  return profiles
    .filter((profile) => profile && typeof profile === 'object' && !Array.isArray(profile))
    .filter((profile) => !references.some((paperReferences) => authorProfileIsReferenced(profile, paperReferences)))
    .map((profile) =>
      issue(
        'orphan-author-profile',
        profile.slug || profile.name || 'unknown-author',
        'Author profile has no remaining archived paper reference.',
      ),
    )
    .sort((left, right) => left.subject.localeCompare(right.subject));
};

export const validateArchiveCollections = ({ records, profiles, indexMarkdown, knownPaperSlugs }) => ({
  errors: [
    ...validateArchiveIndex(indexMarkdown, knownPaperSlugs).errors,
    ...validateAuthorProfiles(profiles).errors,
    ...findOrphanAuthorProfiles(records, profiles),
  ],
  advisories: findRecurringUnprofiled(records, Array.isArray(profiles) ? profiles : []),
});

export const summarizeAdvisories = (advisories, limit = 5) => {
  const grouped = new Map();
  for (const advisory of advisories) {
    const group = grouped.get(advisory.code) ?? [];
    group.push(advisory);
    grouped.set(advisory.code, group);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([code, issues]) => ({ code, count: issues.length, examples: issues.slice(0, limit) }));
};
