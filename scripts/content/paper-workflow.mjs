import path from 'node:path';
import { normalizeAuthorKey, splitAuthorNames } from './authors.mjs';
import { getFirstArchivedAt, getSection, getSourceField, getUpdatedAt } from './markdown.mjs';

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
const absoluteUrlPattern = /https?:\/\/[^\s)>；，。]+/i;
const internalPaperLinkPattern = /\]\(\/papers\/([^/#?]+)\/\)/g;
const localImagePattern = /!\[[^\]]*\]\((\/images\/papers\/[^)\s]+)\)/g;

const issue = (code, subject, message) => ({ code, subject, message });

const sectionForGroup = (markdown, group) => {
  for (const heading of group.headings) {
    const section = getSection(markdown, heading);
    if (section.trim()) return section;
  }
  return '';
};

const hasTraceableSource = (source, knownPaperSlugs) => {
  if (absoluteUrlPattern.test(source)) return true;
  for (const match of source.matchAll(internalPaperLinkPattern)) {
    if (knownPaperSlugs.has(match[1])) return true;
  }
  return false;
};

const resultBlocks = (section) => {
  const matches = [...section.matchAll(/^###\s+(.+)$/gm)];
  if (matches.length === 0) return section.trim() ? [{ title: 'section', body: section }] : [];
  return matches
    .map((match, index) => ({
      title: match[1].trim(),
      body: section.slice(match.index, matches[index + 1]?.index ?? section.length),
    }))
    .filter(({ title }) => /结果|定理|实验|案例|扫描/.test(title) && !/设置|审计/.test(title));
};

const lineValue = (section, name) =>
  section.match(new RegExp(`^- ${name}:\\s*(.+)$`, 'mi'))?.[1]?.trim() ?? '';

export const validatePaperRecord = async ({
  slug,
  markdown,
  indexMarkdown,
  knownPaperSlugs,
  imageExists,
}) => {
  const errors = [];
  const advisories = [];
  const workflowVersion = getSourceField(markdown, 'Workflow version');
  const isV2 = workflowVersion.toLowerCase() === 'v2';
  const source = getSection(markdown, 'Source');
  const firstArchivedAt = getFirstArchivedAt(markdown);
  const updatedAt = getUpdatedAt(markdown);

  if (!firstArchivedAt || !updatedAt) {
    errors.push(issue('missing-archive-time', slug, 'First-Archived-At and Updated-At are required.'));
  }

  for (const group of REQUIRED_SECTION_GROUPS) {
    if (!sectionForGroup(markdown, group)) {
      errors.push(issue('missing-core-section', slug, `Missing or empty section: ${group.name}.`));
    }
  }
  if (!hasTraceableSource(source, knownPaperSlugs)) {
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
    if (!exactMinutePattern.test(firstArchivedAt) || !exactMinutePattern.test(updatedAt)) {
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
    !exactMinutePattern.test(firstArchivedAt) ||
    !exactMinutePattern.test(updatedAt)
  ) {
    errors.push(issue('v2-time-format', slug, 'v2 timestamps must use YYYY-MM-DD HH:mm.'));
  } else if (updatedAt < firstArchivedAt) {
    errors.push(issue('v2-time-order', slug, 'Updated-At must not precede First-Archived-At.'));
  }

  if (isV2) {
    const requiredFields = [
      ['Material type', getSourceField(markdown, 'Material type')],
      ['Canonical source', getSourceField(markdown, 'Canonical source')],
      ['Title', getSourceField(markdown, 'Title')],
      [
        'Authors or Responsible organization',
        getSourceField(markdown, ['Authors', 'Responsible organization']),
      ],
      [
        'Published / submitted date',
        getSourceField(markdown, ['Published / updated', 'Submitted', 'Published']),
      ],
      [
        'Version / revision read',
        getSourceField(markdown, ['Version / revision read', 'Current version read']),
      ],
      ['Accessed', getSourceField(markdown, 'Accessed')],
    ];

    for (const [name, value] of requiredFields) {
      if (!value) errors.push(issue('v2-source-field', slug, `Missing v2 Source field: ${name}.`));
    }
    if (!MATERIAL_TYPES.has(getSourceField(markdown, 'Material type'))) {
      errors.push(issue('v2-material-type', slug, 'Material type is outside the supported v2 set.'));
    }
    const canonicalSource = getSourceField(markdown, 'Canonical source');
    const canonicalPaper = canonicalSource.match(/^\/papers\/([^/#?]+)\/$/)?.[1];
    const validInternalCanonical = canonicalSource === '/archive/' || knownPaperSlugs.has(canonicalPaper);
    if (canonicalSource && !/^https?:\/\//i.test(canonicalSource) && !validInternalCanonical) {
      errors.push(
        issue('v2-canonical-source', slug, 'Canonical source must be an absolute URL or a valid archive path.'),
      );
    }

    for (const block of resultBlocks(sectionForGroup(markdown, evidenceSectionGroup))) {
      if (!/- 证据定位[:：]\s*\S/m.test(block.body)) {
        errors.push(issue('v2-evidence-location', slug, `Missing evidence location in ${block.title}.`));
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

    const intake = getSection(markdown, 'Reference Intake Brief');
    const decision = intake.match(/^Decision:\s*(\S+)$/mi)?.[1] ?? '';
    if (!REFERENCE_DECISIONS.has(decision)) {
      errors.push(issue('v2-reference-decision', slug, 'Reference Intake Brief has an invalid Decision value.'));
    }
  }

  for (const match of markdown.matchAll(localImagePattern)) {
    const imageUrl = match[1];
    const expectedPrefix = `/images/papers/${slug}/`;
    if (!imageUrl.startsWith(expectedPrefix)) {
      errors.push(issue('image-slug-mismatch', slug, `Image path must start with ${expectedPrefix}.`));
    }
    const repoRelativePath = path.posix.join('public', imageUrl.slice(1));
    if (!(await imageExists(repoRelativePath))) {
      errors.push(issue('missing-image-file', slug, `Missing image file: ${repoRelativePath}.`));
    }
    const captionWindow = markdown.slice(match.index, match.index + 1000);
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
      const isV2 = getSourceField(record.markdown, 'Workflow version').toLowerCase() === 'v2';
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

  for (const profile of profiles) {
    if (slugOwners.has(profile.slug)) {
      errors.push(
        issue('author-slug-conflict', profile.slug, `Slug is already used by ${slugOwners.get(profile.slug)}.`),
      );
    } else {
      slugOwners.set(profile.slug, profile.name);
    }

    for (const name of [profile.name, ...(profile.aliases ?? [])]) {
      const key = normalizeAuthorKey(name);
      if (!key) continue;
      const owner = identityOwners.get(key);
      if (owner && owner !== profile.slug) {
        errors.push(
          issue(
            'author-identity-conflict',
            name,
            `Normalized identity is shared by ${owner} and ${profile.slug}.`,
          ),
        );
      } else {
        identityOwners.set(key, profile.slug);
      }
    }

    for (const name of directUrlFields) {
      const value = profile[name];
      if (value && !/^https?:\/\//i.test(value)) {
        errors.push(issue('author-profile-url', profile.slug, `${name} must be an absolute URL.`));
      }
    }

    for (const source of profile.sources ?? []) {
      const value = typeof source === 'string' ? source : source?.url;
      if (!value || !/^https?:\/\//i.test(value)) {
        errors.push(issue('author-source-url', profile.slug, 'Every source must contain an absolute URL.'));
      }
    }
  }

  return { errors };
};

export const findRecurringUnprofiled = (records, profiles) => {
  const profileKeys = new Set(
    profiles.flatMap((profile) => [profile.name, ...(profile.aliases ?? [])].map(normalizeAuthorKey)),
  );
  const mentions = new Map();

  for (const record of records) {
    for (const name of splitAuthorNames(getSourceField(record.markdown, ['Authors', 'Author']))) {
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
