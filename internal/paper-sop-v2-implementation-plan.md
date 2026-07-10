# Paper SOP v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将论文归档流程升级为分阶段、按材料类型启用条件模块、具备证据定位和兼容型自动检查的 SOP v2。

**Architecture:** 主 SOP 继续作为公开质量契约和执行入口，模板承载 v2 可检查字段，作者 SOP 管理内部身份核验过程。新增纯验证模块与薄 CLI：纯模块返回结构化 error/advisory，CLI 负责读取仓库文件、检查图片存在性、汇总输出和设置退出码；现有站点检查复用同一章节契约。

**Tech Stack:** Markdown、Node.js 22 ESM、`node:test`、现有 `scripts/content/*.mjs`、npm scripts、GitHub Actions。

## Global Constraints

- 保留项目要求的核心章节：`Source`、`作者与关系`、`一句话结论`、`论文脉络`、`关键实验/定理`、`证据链强度评估`、`OpenReview / 审稿意见吸收`、`主要启发`、`局限`、`Reference Intake Brief`。
- 本轮不批量修改 `content/papers/` 下的 91 篇历史笔记。
- 缺少 `Workflow version: v2` 的笔记使用兼容规则；带 v2 标记的笔记执行严格 Source、时间、证据定位、审稿分类和接纳决策检查。
- Error 阻止命令成功；Advisory 只输出汇总数量和最多 5 个样例。
- 不新增 npm 依赖，使用 Node.js 22 标准库和现有内容解析模块。
- `data/authors.json` 的 `sources` 同时支持 URL 字符串和 `{ "label": "...", "url": "..." }`。
- 中文正文使用直接、顺承、解释型表达，避免先否定前项再强调后项的对照句式。
- 文件编辑使用 `apply_patch`；shell 命令使用 `rtk` 前缀。
- 每个任务通过对应测试后创建独立本地 commit；commit 使用英文摘要和中文摘要两段格式。
- 不执行 `git push`，除非用户明确要求。

---

## File Map

- Create `scripts/content/paper-workflow.mjs`: 保存章节别名、v2 枚举、纯内容校验和 advisory 统计逻辑。
- Create `scripts/check-paper-workflow.mjs`: 读取论文、索引、图片和作者数据，调用纯校验函数并输出 CLI 结果。
- Create `scripts/check-paper-workflow.test.mjs`: 使用 `node:test` 覆盖 legacy 兼容、v2 严格规则、图片和作者冲突。
- Modify `scripts/check-paper-site.mjs`: 从共享模块导入章节组，删除重复常量。
- Modify `package.json`: 增加 `test:workflow`、`check:workflow`，并把 workflow 检查接入 `check:site`。
- Modify `.github/workflows/deploy.yml`: 将检查步骤名称更新为同时表达站点与 paper workflow 检查。
- Modify `content/utility/paper-analysis-workflow.md`: 增加快速执行卡、Definition of Done、材料类型、来源快照、九阶段流程、证据定位、条件模块、版本更新和统一作者检查口径。
- Modify `content/utility/paper-note-template.md`: 增加 v2 Source 字段、结果证据定位、审稿分类和固定接纳决策。
- Modify `internal/author-x-account-search-sop.md`: 改写为两层 profile pass、字段级证据、工具无关搜索、停止条件和公开边界。
- Reference `internal/paper-sop-v2-design.md`: 已确认的设计规格，不在实施阶段改写。

---

### Task 1: Add the paper workflow validator with tests

**Files:**

- Create: `scripts/content/paper-workflow.mjs`
- Create: `scripts/check-paper-workflow.mjs`
- Create: `scripts/check-paper-workflow.test.mjs`

**Interfaces:**

- Consumes: `getFirstArchivedAt(markdown)`, `getUpdatedAt(markdown)`, `getSection(markdown, heading)`, `getSourceField(markdown, names)` from `scripts/content/markdown.mjs`; `normalizeAuthorKey(name)` and `splitAuthorNames(value)` from `scripts/content/authors.mjs`.
- Produces: `REQUIRED_SECTION_GROUPS`, `validatePaperRecord(input)`, `validateArchiveTimes(records)`, `validateAuthorProfiles(profiles)`, `findRecurringUnprofiled(records, profiles)`, and `summarizeAdvisories(advisories, limit)` from `scripts/content/paper-workflow.mjs`.
- `validatePaperRecord` input: `{ slug, markdown, indexMarkdown, knownPaperSlugs: Set<string>, imageExists: async (repoRelativePath: string) => boolean }`.
- Validation result: `{ errors: Array<{code, subject, message}>, advisories: Array<{code, subject, message}> }`.

- [ ] **Step 1: Write failing workflow validation tests**

Create `scripts/check-paper-workflow.test.mjs` with fixtures that include every required core section and exercise legacy and v2 behavior:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findRecurringUnprofiled,
  validateArchiveTimes,
  validateAuthorProfiles,
  validatePaperRecord,
} from './content/paper-workflow.mjs';

const coreBody = `
## 作者与关系

- Ada Example: Example University.

## 一句话结论

结论。

## 论文脉络

问题、方法和结论链条。

## 关键实验/定理

### 结果 1

- 证据定位：Section 4, Table 1.
- 结果：有效。

## 证据链强度评估

- 证据边界。

## OpenReview / 审稿意见吸收

- Page type: not-found
- Match confidence: high
- Observed at: 2026-07-10

## 主要启发

- 启发。

## 局限

1. 局限。

## Reference Intake Brief

Decision: merge

Why: 来源和证据满足归档要求。
`;

const legacyPaper = `# Legacy note

First-Archived-At: 2026-07-03 09:03 CST
Updated-At: 2026-07-03 09:03 CST

## Source

- Local archive: [source](/papers/source-paper/)
${coreBody}`;

const v2Paper = `# V2 note

First-Archived-At: 2026-07-10 09:30
Updated-At: 2026-07-10 09:31

## Source

- Workflow version: v2
- Material type: research-paper
- Canonical source: https://arxiv.org/abs/2607.00001
- Title: V2 Paper
- Authors: Ada Example, Bob Example
- Submitted: 2026-07-01
- Current version read: v1
- Accessed: 2026-07-10
${coreBody}`;

const validate = (slug, markdown, imageExists = async () => true) =>
  validatePaperRecord({
    slug,
    markdown,
    indexMarkdown: `- [note](/papers/${slug}/)`,
    knownPaperSlugs: new Set([slug, 'source-paper']),
    imageExists,
  });

test('legacy notes accept a traceable internal source and report v2 migration advisories', async () => {
  const result = await validate('legacy-note', legacyPaper);
  assert.deepEqual(result.errors, []);
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-source-snapshot'));
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-time-format'));
});

test('a complete v2 note passes strict validation', async () => {
  const result = await validate('v2-note', v2Paper);
  assert.deepEqual(result.errors, []);
});

test('v2 validation rejects invalid time, source fields, evidence, review fields, and decision', async () => {
  const invalid = v2Paper
    .replace('2026-07-10 09:30', '2026-07-10 9:30 CST')
    .replace('- Canonical source: https://arxiv.org/abs/2607.00001\n', '')
    .replace('- 证据定位：Section 4, Table 1.\n', '')
    .replace('- Page type: not-found\n', '')
    .replace('Decision: merge', 'Decision: maybe');
  const result = await validate('invalid-v2', invalid);
  const codes = new Set(result.errors.map((issue) => issue.code));
  assert.ok(codes.has('v2-time-format'));
  assert.ok(codes.has('v2-source-field'));
  assert.ok(codes.has('v2-evidence-location'));
  assert.ok(codes.has('v2-review-field'));
  assert.ok(codes.has('v2-reference-decision'));
});

test('universal validation rejects missing core content, source links, and blank placeholders', async () => {
  const invalid = legacyPaper
    .replace('- Local archive: [source](/papers/source-paper/)', '- Source status: unavailable')
    .replace('## 局限', '### 局限')
    .concat('\n- \n');
  const result = await validate('invalid-legacy', invalid);
  const codes = new Set(result.errors.map((issue) => issue.code));
  assert.ok(codes.has('missing-core-section'));
  assert.ok(codes.has('missing-source-link'));
  assert.ok(codes.has('template-placeholder'));
});

test('paper validation detects missing index links and image provenance', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/v2-note/fig-1.png)\n\nFigure 1: result.',
  );
  const result = await validatePaperRecord({
    slug: 'v2-note',
    markdown,
    indexMarkdown: '# Empty index',
    knownPaperSlugs: new Set(['v2-note']),
    imageExists: async () => false,
  });
  const codes = new Set(result.errors.map((issue) => issue.code));
  assert.ok(codes.has('missing-index-link'));
  assert.ok(codes.has('missing-image-file'));
  assert.ok(codes.has('missing-image-source'));
});

test('author validation accepts both source shapes and rejects identity conflicts', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      aliases: ['A. Example'],
      homepage: 'https://example.com/ada',
      sources: [{ label: 'Homepage', url: 'https://example.com/ada' }],
    },
    {
      slug: 'bob-example',
      name: 'Bob Example',
      aliases: ['A. Example'],
      homepage: 'invalid-homepage',
      sources: ['https://example.com/bob'],
    },
  ];
  const result = validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-identity-conflict'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-profile-url'));
  assert.ok(!result.errors.some((issue) => issue.code === 'author-source-url'));
});

test('recurring unprofiled authors are returned as advisories', () => {
  const records = [
    { slug: 'one', markdown: '## Source\n\n- Authors: Ada Example, Bob Example' },
    { slug: 'two', markdown: '## Source\n\n- Authors: Bob Example, Carol Example' },
  ];
  const issues = findRecurringUnprofiled(records, [{ slug: 'ada-example', name: 'Ada Example' }]);
  assert.deepEqual(issues.map((issue) => issue.subject), ['Bob Example']);
});

test('archive-time conflicts are errors for v2 notes and advisories for legacy notes', () => {
  const records = [
    { slug: 'v2-note', markdown: v2Paper },
    {
      slug: 'legacy-note',
      markdown: legacyPaper.replace('2026-07-03 09:03 CST', '2026-07-10 09:30'),
    },
  ];
  const result = validateArchiveTimes(records);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-archive-time-conflict'));
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-archive-time-conflict'));
});
```

- [ ] **Step 2: Run the tests and verify the module is missing**

Run:

```bash
rtk node --test scripts/check-paper-workflow.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/content/paper-workflow.mjs`.

- [ ] **Step 3: Implement the shared workflow contract and validators**

Create `scripts/content/paper-workflow.mjs`. Use these public constants and functions exactly:

```js
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

const field = (markdown, names) => getSourceField(markdown, names);

const lineValue = (section, name) =>
  section.match(new RegExp(`^- ${name}:\\s*(.+)$`, 'mi'))?.[1]?.trim() ?? '';

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

const hasTraceableSource = (source, knownPaperSlugs) => {
  if (absoluteUrlPattern.test(source)) return true;
  for (const match of source.matchAll(internalPaperLinkPattern)) {
    if (knownPaperSlugs.has(match[1])) return true;
  }
  return false;
};

export const validatePaperRecord = async ({
  slug,
  markdown,
  indexMarkdown,
  knownPaperSlugs,
  imageExists,
}) => {
  const errors = [];
  const advisories = [];
  const source = getSection(markdown, 'Source');
  const firstArchivedAt = getFirstArchivedAt(markdown);
  const updatedAt = getUpdatedAt(markdown);
  const workflowVersion = field(markdown, 'Workflow version');
  const isV2 = workflowVersion.toLowerCase() === 'v2';

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

  if (isV2) {
    if (!exactMinutePattern.test(firstArchivedAt) || !exactMinutePattern.test(updatedAt)) {
      errors.push(issue('v2-time-format', slug, 'v2 timestamps must use YYYY-MM-DD HH:mm.'));
    } else if (updatedAt < firstArchivedAt) {
      errors.push(issue('v2-time-order', slug, 'Updated-At must not precede First-Archived-At.'));
    }

    const requiredFields = [
      ['Material type', field(markdown, 'Material type')],
      ['Canonical source', field(markdown, 'Canonical source')],
      ['Title', field(markdown, 'Title')],
      ['Authors or Responsible organization', field(markdown, ['Authors', 'Responsible organization'])],
      ['Published / submitted date', field(markdown, ['Published / updated', 'Submitted', 'Published'])],
      ['Version / revision read', field(markdown, ['Version / revision read', 'Current version read'])],
      ['Accessed', field(markdown, 'Accessed')],
    ];
    for (const [name, value] of requiredFields) {
      if (!value) errors.push(issue('v2-source-field', slug, `Missing v2 Source field: ${name}.`));
    }
    if (!MATERIAL_TYPES.has(field(markdown, 'Material type'))) {
      errors.push(issue('v2-material-type', slug, 'Material type is outside the supported v2 set.'));
    }
    const canonicalSource = field(markdown, 'Canonical source');
    const canonicalPaper = canonicalSource.match(/^\/papers\/([^/#?]+)\/$/)?.[1];
    const validInternalCanonical = canonicalSource === '/archive/' || knownPaperSlugs.has(canonicalPaper);
    if (canonicalSource && !/^https?:\/\//i.test(canonicalSource) && !validInternalCanonical) {
      errors.push(issue('v2-canonical-source', slug, 'Canonical source must be an absolute URL or a valid archive path.'));
    }

    const evidenceSection = REQUIRED_SECTION_GROUPS.find((group) => group.name === '关键实验/定理');
    for (const block of resultBlocks(sectionForGroup(markdown, evidenceSection))) {
      if (!/- 证据定位[:：]\s*\S/m.test(block.body)) {
        errors.push(issue('v2-evidence-location', slug, `Missing evidence location in ${block.title}.`));
      }
    }

    const review = getSection(markdown, 'OpenReview / 审稿意见吸收');
    for (const name of ['Page type', 'Match confidence', 'Observed at']) {
      if (!lineValue(review, name)) errors.push(issue('v2-review-field', slug, `Missing review field: ${name}.`));
    }
    if (lineValue(review, 'Page type') && !REVIEW_PAGE_TYPES.has(lineValue(review, 'Page type'))) {
      errors.push(issue('v2-review-page-type', slug, 'Page type is outside the supported v2 set.'));
    }
    if (lineValue(review, 'Match confidence') && !/^(high|medium|low)$/i.test(lineValue(review, 'Match confidence'))) {
      errors.push(issue('v2-review-confidence', slug, 'Match confidence must be high, medium, or low.'));
    }

    const intake = getSection(markdown, 'Reference Intake Brief');
    const decision = intake.match(/^Decision:\s*(\S+)$/mi)?.[1] ?? '';
    if (!REFERENCE_DECISIONS.has(decision)) {
      errors.push(issue('v2-reference-decision', slug, 'Reference Intake Brief has an invalid Decision value.'));
    }
  } else {
    advisories.push(issue('legacy-source-snapshot', slug, 'Add Workflow version, Material type, Canonical source, and Accessed.'));
    if (!exactMinutePattern.test(firstArchivedAt) || !exactMinutePattern.test(updatedAt)) {
      advisories.push(issue('legacy-time-format', slug, 'Normalize timestamps to YYYY-MM-DD HH:mm.'));
    }
    const review = getSection(markdown, 'OpenReview / 审稿意见吸收');
    if (!lineValue(review, 'Page type') || !lineValue(review, 'Match confidence') || !lineValue(review, 'Observed at')) {
      advisories.push(issue('legacy-review-classification', slug, 'Add v2 review classification fields.'));
    }
    const evidenceGroup = REQUIRED_SECTION_GROUPS.find((group) => group.name === '关键实验/定理');
    if (!/证据定位[:：]/.test(sectionForGroup(markdown, evidenceGroup))) {
      advisories.push(issue('legacy-evidence-location', slug, 'Add section, figure, table, appendix, page, or URL evidence locations.'));
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
      const isV2 = field(record.markdown, 'Workflow version').toLowerCase() === 'v2';
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
  const slugOwners = new Map();
  const identityOwners = new Map();
  const directUrlFields = ['homepage', 'github', 'huggingFace', 'x'];

  if (!Array.isArray(profiles)) {
    return { errors: [issue('authors-shape', 'data/authors.json', 'Expected a JSON array.')] };
  }

  for (const profile of profiles) {
    if (slugOwners.has(profile.slug)) {
      errors.push(issue('author-slug-conflict', profile.slug, `Slug is already used by ${slugOwners.get(profile.slug)}.`));
    } else {
      slugOwners.set(profile.slug, profile.name);
    }

    for (const name of [profile.name, ...(profile.aliases ?? [])]) {
      const key = normalizeAuthorKey(name);
      if (!key) continue;
      const owner = identityOwners.get(key);
      if (owner && owner !== profile.slug) {
        errors.push(issue('author-identity-conflict', name, `Normalized identity is shared by ${owner} and ${profile.slug}.`));
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
    for (const name of splitAuthorNames(field(record.markdown, ['Authors', 'Author']))) {
      const key = normalizeAuthorKey(name);
      const value = mentions.get(key) ?? { name, paperSlugs: new Set() };
      value.paperSlugs.add(record.slug);
      mentions.set(key, value);
    }
  }

  return [...mentions.entries()]
    .filter(([key, value]) => !profileKeys.has(key) && value.paperSlugs.size >= 2)
    .map(([, value]) => issue('recurring-unprofiled-author', value.name, `Appears in ${value.paperSlugs.size} papers.`))
    .sort((a, b) => a.subject.localeCompare(b.subject));
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
```

- [ ] **Step 4: Implement the repository CLI**

Create `scripts/check-paper-workflow.mjs` with the following orchestration:

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { readAuthorProfiles } from './content/authors.mjs';
import {
  findRecurringUnprofiled,
  summarizeAdvisories,
  validateArchiveTimes,
  validateAuthorProfiles,
  validatePaperRecord,
} from './content/paper-workflow.mjs';
import { repoRoot, readPaperEntries } from './content/repository.mjs';

const indexPath = path.join(repoRoot, 'content', 'utility', 'papers-index.md');
const entries = await readPaperEntries();
const indexMarkdown = await fs.readFile(indexPath, 'utf8');
const profiles = await readAuthorProfiles();
const knownPaperSlugs = new Set(entries.map((entry) => entry.slug));
const records = await Promise.all(
  entries.map(async (entry) => ({ ...entry, markdown: await fs.readFile(entry.sourcePath, 'utf8') })),
);

const exists = async (repoRelativePath) => {
  try {
    await fs.access(path.join(repoRoot, repoRelativePath));
    return true;
  } catch {
    return false;
  }
};

const errors = [];
const advisories = [];

for (const record of records) {
  const result = await validatePaperRecord({
    slug: record.slug,
    markdown: record.markdown,
    indexMarkdown,
    knownPaperSlugs,
    imageExists: exists,
  });
  errors.push(...result.errors);
  advisories.push(...result.advisories);
}

const timeResult = validateArchiveTimes(records);
errors.push(...timeResult.errors);
advisories.push(...timeResult.advisories);

errors.push(...validateAuthorProfiles(profiles).errors);
advisories.push(...findRecurringUnprofiled(records, profiles));

for (const item of errors) {
  console.error(`ERROR [${item.code}] ${item.subject}: ${item.message}`);
}

for (const group of summarizeAdvisories(advisories)) {
  console.warn(`ADVISORY [${group.code}] ${group.count}`);
  for (const item of group.examples) console.warn(`  ${item.subject}: ${item.message}`);
}

if (errors.length > 0) {
  console.error(`Paper workflow check failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`Paper workflow check passed for ${records.length} papers and ${profiles.length} author profiles.`);
}
```

The final CLI is read-only and does not write generated files.

- [ ] **Step 5: Run focused tests and the full-repository checker**

Run:

```bash
rtk node --test scripts/check-paper-workflow.test.mjs
rtk node scripts/check-paper-workflow.mjs
```

Expected:

- `node:test` reports 8 passing tests and 0 failures.
- The repository checker ends with `Paper workflow check passed for 91 papers and 298 author profiles.`
- Advisory groups include legacy source snapshots, review classification, evidence locations, one legacy time-format entry, one duplicate-minute group, and recurring unprofiled authors.
- No file under `content/papers/` changes.

- [ ] **Step 6: Commit the validator**

```bash
rtk git add scripts/content/paper-workflow.mjs scripts/check-paper-workflow.mjs scripts/check-paper-workflow.test.mjs
rtk git diff --cached --check
rtk git commit -m $'feat: add paper workflow validation\n\nfeat: 添加论文工作流校验'
```

---

### Task 2: Restructure the public workflow and v2 note template

**Files:**

- Modify: `content/utility/paper-analysis-workflow.md:1-461`
- Modify: `content/utility/paper-note-template.md:1-216`
- Test: `scripts/check-paper-workflow.test.mjs`

**Interfaces:**

- Consumes: v2 field names and enums exported by `scripts/content/paper-workflow.mjs`.
- Produces: a public nine-stage execution contract and a template accepted by `validatePaperRecord`.

- [ ] **Step 1: Add a template-contract test before changing Markdown**

Extend `scripts/check-paper-workflow.test.mjs` to read the real template and assert that the field names and allowed values match the validator:

```js
import fs from 'node:fs/promises';

test('the public template exposes every v2 contract field', async () => {
  const template = await fs.readFile('content/utility/paper-note-template.md', 'utf8');
  for (const fieldName of [
    'Workflow version',
    'Material type',
    'Canonical source',
    'Responsible organization',
    'Published / updated',
    'Accessed',
    '证据定位',
    'Page type',
    'Match confidence',
    'Observed at',
    'Decision: merge',
  ]) {
    assert.match(template, new RegExp(fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
```

- [ ] **Step 2: Run the template test and verify it fails**

Run:

```bash
rtk node --test scripts/check-paper-workflow.test.mjs
```

Expected: the new test fails first on missing `Workflow version`.

- [ ] **Step 3: Add the quick execution path and Definition of Done to the main SOP**

Update `Updated-At` to the implementation date. Immediately after `## 目标`, add these sections and preserve the existing public-archive principles below them:

```markdown
## 快速执行卡

每次归档按九个阶段推进：

1. Intake：确认材料类型、归档目标和安全边界。
2. Source pass：固定 canonical source、版本、发布日期和访问日期。
3. Problem pass：重建研究问题、已有方案、思考路径和核心假设。
4. Mechanism pass：解释朴素路径、优化路径、成立条件和实现边界。
5. Evidence pass：核对实验、定理、baseline、统计和证据定位。
6. External pass：核对公开审稿、代码、框架版本和外部状态。
7. Relationship pass：完成作者身份核验、机构关系、跨论文关系和索引更新。
8. Discussion/update pass：回写讨论结论、版本变化和勘误。
9. Release gate：执行内容检查、构建、站点检查和本地提交。

详细规则用于解释每个阶段的输入、动作、产物和停止条件。归档完成以产物满足 Definition of Done 为准。

## Definition of Done

一篇新增笔记完成归档需要同时满足：

- Source 固定材料类型、canonical source、责任作者或组织、版本和访问日期。
- 核心章节完整，关键结果或定理带有可复查证据定位。
- 论文事实、作者主张和本地分析在争议点上能够区分。
- 已按材料类型完成相关实验、系统、理论、安全或综述检查。
- 公开审稿页已经分类；匹配证据不足时记录 `not-found` 或 `not-applicable`。
- 全体作者完成基础身份核验，重点作者完成深入身份核验。
- 论文索引、跨论文关系和稳定作者事实已经同步。
- 阅读后的有效讨论已经回写。
- `check:workflow`、metadata、math、build 和 site 检查通过。
- 改动已经形成独立本地 commit，push 等待用户明确要求。
```

- [ ] **Step 4: Replace the fixed input model with material types and source snapshots**

Add `## 材料类型与来源快照` after the existing input description. Include the exact enum values from `MATERIAL_TYPES`, explain `composite`, and define these required v2 fields:

```markdown
- `Workflow version: v2`
- `Material type`
- `Canonical source`
- `Title`
- `Authors` 或 `Responsible organization`
- `Submitted`、`Published` 或 `Published / updated`
- `Current version read` 或 `Version / revision read`
- `Accessed`
```

State that arXiv papers retain arXiv/PDF/submission fields; web materials use publication/update, release/commit, and access fields. Canonical source accepts an absolute primary-source URL; `composite` may use a stable `/papers/<slug>/` or `/archive/` site path when the note synthesizes archived materials.

- [ ] **Step 5: Turn the reading order into the nine-stage workflow**

Replace `## 阅读顺序` with `## 九阶段执行流程`. For each phase, write four explicit lines:

```markdown
- 输入：进入该阶段前已经掌握的信息。
- 动作：需要完成的阅读、核验或写入操作。
- 产物：在 Markdown、索引或作者 JSON 中形成的结果。
- 停止条件：能够进入下一阶段的客观条件。
```

Map existing rules into the corresponding stages. Keep HTML/TeX preference in Source pass, introduction/conclusion ordering in Problem pass, method/experiment reading in Mechanism/Evidence pass, OpenReview in External pass, author/index work in Relationship pass, discussion write-back in Discussion/update pass, and checks/commit in Release gate.

- [ ] **Step 6: Add evidence classes, locators, and conditional analysis modules**

Insert `## 证据分层与定位` before method derivation. Define:

```markdown
- 论文事实：来源直接给出的元数据、设置、公式、结果和决定。
- 作者主张：作者对原因、贡献、泛化和意义的解释。
- 本地分析：根据来源形成的推导、比较、质疑和工程判断。
```

Require key numbers, complexity claims, theorem conditions, system configurations, review decisions and external status to carry one or more of `Section`、`Figure`、`Table`、`Appendix`、`Page`、direct URL. Mark the reconstructed author thinking path as inference.

Insert `## 按材料类型启用的分析模块` before the existing experiment audit. Give separate checklists for:

- experiment papers;
- systems papers;
- theory papers;
- model/technical reports;
- surveys;
- safety evaluations;
- blogs/framework docs.

Retain existing detailed mechanism and baseline sections as the deep-reference modules. State that irrelevant conditional rows should be removed from the final note instead of left empty.

- [ ] **Step 7: Align review, author, version-update, and release rules**

In `审稿意见搜索与吸收`, add the page taxonomy from `REVIEW_PAGE_TYPES`, match confidence, and observed date. Clarify that only `official-review` supports reviewer consensus/rating/rebuttal summaries; metadata and proceedings confirm bibliographic status only.

In `作者关系分析` and `作者页维护`, require baseline identity verification for every parsed author and in-depth verification for corresponding/core/maintainer/repeated/ambiguous authors. Keep internal SOP paths and search traces outside the public workflow page.

Add `## 版本更新与勘误` before the commit strategy. Require comparison of metadata, method, experiment, author and conclusion changes; update `Updated-At` only for meaningful content changes.

Update `质量检查` so its first lines mirror Definition of Done. Use “内容工作流检查” on the public page; put the literal command in README and internal documentation.

- [ ] **Step 8: Update the v2 note template**

Replace the Source block with this field set and comments explaining conditional deletion:

```markdown
## Source

- Workflow version: v2
- Material type: research-paper / technical-report / model-card / survey / blog / framework-docs / composite
- Canonical source:
- Title:
- Authors:
- Responsible organization:
- arXiv:
- PDF:
- Code/Project:
- OpenReview / Review page:
- Submitted:
- Published / updated:
- Current version read:
- Version / revision read:
- Accessed: YYYY-MM-DD
- Subjects:
```

Add `- 证据定位：` and `- 支持的最窄结论：` to every result fixture. Split the experiment table into a short common table plus commented material-specific tables so final notes keep only applicable rows.

Replace the review block with:

```markdown
## OpenReview / 审稿意见吸收

- Page type: official-review / metadata-only / proceedings / commentary / not-found / not-applicable
- Match confidence: high / medium / low
- Observed at: YYYY-MM-DD
- Venue status:
- Public reviews:
- Ratings / confidence:
- Reviewer consensus:
- Main criticisms:
- Author response:
- 对可信度的影响:
```

Replace the intake decision line with:

```markdown
Decision: merge

Allowed values: `merge` / `revise-then-merge` / `skip` / `ask-user`
```

- [ ] **Step 9: Run the documentation contract and repository checks**

Run:

```bash
rtk node --test scripts/check-paper-workflow.test.mjs
rtk node scripts/check-paper-workflow.mjs
rtk npm run check:metadata
rtk git diff --check
```

Expected: all workflow tests pass; the repository checker reports 91 papers and 298 profiles with advisories only; metadata and diff checks pass.

- [ ] **Step 10: Commit the public workflow and template**

```bash
rtk git add content/utility/paper-analysis-workflow.md content/utility/paper-note-template.md scripts/check-paper-workflow.test.mjs
rtk git diff --cached --check
rtk git commit -m $'docs: restructure the paper analysis workflow\n\ndocs: 重构论文分析工作流'
```

---

### Task 3: Rewrite the internal author profile SOP

**Files:**

- Modify: `internal/author-x-account-search-sop.md:1-274`
- Reference: `data/authors.json`
- Reference: `scripts/content/authors.mjs`

**Interfaces:**

- Consumes: author identity normalization and the existing `authors.json` field schema.
- Produces: one unambiguous private procedure for baseline and in-depth author profile passes.

- [ ] **Step 1: Replace stale purpose and tool assumptions**

Rewrite the title and opening in Chinese. State these outputs explicitly:

```markdown
- 论文笔记：只保留发表时机构和已核验历史机构。
- `data/authors.json`：保存稳定身份字段、字段值和来源。
- `/tmp`：保存查询词、候选账号、拒绝原因、搜索代理输出和临时置信判断。
```

Describe search agents and direct X tools as optional discovery paths. Primary-source cross-validation remains mandatory before writing data.

- [ ] **Step 2: Define the baseline pass for every author**

Use this ordered contract:

1. Extract exact author names, affiliations and contribution signals from the paper source.
2. Normalize English names, Chinese names and aliases.
3. Search `data/authors.json`, the archive index and related notes for duplicates.
4. Check a stable academic identity source: homepage, institution, project page, ORCID, DBLP, OpenReview or Scholar.
5. Write only verified fields; leave unresolved fields empty.
6. Record `xConfidence: "not-found"` after the bounded X search produces no viable candidate.

State that team signatures and unparseable author lists receive organization-level records and do not force synthetic person profiles.

- [ ] **Step 3: Define in-depth pass triggers and field-level evidence**

In-depth pass triggers:

- corresponding or core author;
- code/project maintainer;
- project lead;
- author repeated across archived papers;
- ambiguous same-name identity;
- viable X candidate found during baseline search.

For each profile field, list acceptable sources and contradictions. Keep the existing strict X rule of at least two independent strong signals. Explain that homepage/GitHub identity evidence supports the person profile and does not by itself prove an X handle.

- [ ] **Step 4: Add bounded search order and stopping rules**

Define this search order:

1. paper/project primary source;
2. local archive and `authors.json`;
3. homepage/institution/GitHub;
4. Scholar/DBLP/OpenReview/ORCID;
5. search agent candidate expansion;
6. direct X profile and post verification when a candidate exists.

Add these stopping rules:

- stable identity fields have independent support;
- high-confidence X candidate has two strong independent signals;
- bounded name+institution, name+paper and handle searches produce no candidate;
- identity ambiguity remains unresolved and the profile is kept minimal or skipped.

- [ ] **Step 5: Define the `authors.json` write contract**

Document every supported field from the current data:

```json
{
  "slug": "ada-example",
  "name": "Ada Example",
  "chineseName": "",
  "aliases": ["A. Example"],
  "affiliations": ["Example University"],
  "homepage": "https://example.com/ada",
  "github": "https://github.com/ada",
  "huggingFace": "",
  "x": "",
  "xConfidence": "not-found",
  "topics": ["example topic"],
  "notes": "Stable public identity summary.",
  "sources": [
    { "label": "Homepage", "url": "https://example.com/ada" }
  ]
}
```

Explain uniqueness rules for slug and normalized names/aliases. Preserve both existing source formats, while recommending labeled objects for new entries.

- [ ] **Step 6: Remove contradictory and stale sections**

Delete or replace:

- the recommendation to add search evidence to the paper note;
- the instruction to keep the SOP in the repo root;
- the “see conversation history” archival instruction;
- hard dependency on one Grok command shape;
- long slime/GLM-specific successful-run examples that duplicate the general evidence rules.

Retain concise Chinese-community search nuances only when they change verification decisions.

- [ ] **Step 7: Validate the rewritten SOP and commit**

Run:

```bash
rtk rg -n "add to the paper note|repo root|conversation history|Grok broad|不是.+而是" internal/author-x-account-search-sop.md
rtk node scripts/check-paper-workflow.mjs
rtk git diff --check
```

Expected: the search returns no stale/conflicting phrases; the workflow checker still passes with advisories only; diff check is clean.

Commit:

```bash
rtk git add internal/author-x-account-search-sop.md
rtk git diff --cached --check
rtk git commit -m $'docs: align the author profile SOP\n\ndocs: 统一作者档案 SOP'
```

---

### Task 4: Wire validation into local checks and CI

**Files:**

- Modify: `scripts/check-paper-site.mjs:10-28`
- Modify: `package.json:10-21`
- Modify: `.github/workflows/deploy.yml:40-48`
- Modify: `README.md:29-40,59-71`

**Interfaces:**

- Consumes: `REQUIRED_SECTION_GROUPS` and workflow CLI from Task 1.
- Produces: stable npm commands and CI execution for the new validation layer.

- [ ] **Step 1: Reuse the shared section contract in the site checker**

Add:

```js
import { REQUIRED_SECTION_GROUPS } from './content/paper-workflow.mjs';
```

Remove the local `requiredSectionGroups` array. Update the loop to map shared heading names back to Markdown headings:

```js
for (const group of REQUIRED_SECTION_GROUPS) {
  if (!group.headings.some((heading) => source.includes(`## ${heading}`))) {
    fail(`${paper.file} is missing required section group: ${group.name}`);
  }
}
```

- [ ] **Step 2: Add npm commands and integrate the checker**

Change the scripts block to include:

```json
"test:workflow": "node --test scripts/check-paper-workflow.test.mjs",
"check:workflow": "node scripts/check-paper-workflow.mjs",
"check:site": "npm run check:metadata && npm run check:workflow && node scripts/check-paper-site.mjs"
```

Keep all existing commands unchanged.

- [ ] **Step 3: Make CI ownership explicit**

Rename the existing GitHub Actions step from `Check generated site` to `Check generated site and paper workflow`. Keep its command as `npm run check:site`, which now executes the workflow checker transitively. Do not add a duplicate standalone CI invocation.

- [ ] **Step 4: Document local commands and v2 entry points**

In README Build, use:

```bash
npm run test:workflow
npm run check:workflow
npm run build
npm run check:site
npm run check:math
```

In Content Workflow, add the internal author SOP path and state that new notes start from the public template with `Workflow version: v2`.

- [ ] **Step 5: Run the complete verification matrix**

Run each command separately:

```bash
rtk npm run test:workflow
rtk npm run check:workflow
rtk npm run check:metadata
rtk npm run check:math
rtk npm run build
rtk npm run check:site
rtk git diff --check
rtk git status --short
```

Expected:

- Workflow tests: the complete validator suite passes; the CLI smoke assertion uses dynamic archive counts so normal archive growth does not invalidate the test.
- Workflow check: pass for 91 papers and 298 author profiles; advisory output is bounded to 5 examples per code.
- Metadata: `Paper metadata check passed.`
- Math: check passes after content generation.
- Build: Astro static build completes.
- Site: `Site check passed for 91 papers.`
- Diff check: no output.
- Git status: only Task 4 files are unstaged before its commit; no `content/papers/` file appears.

- [ ] **Step 6: Commit integration changes**

```bash
rtk git add scripts/check-paper-site.mjs package.json .github/workflows/deploy.yml README.md
rtk git diff --cached --check
rtk git commit -m $'chore: enforce the paper workflow checks\n\nchore: 接入论文工作流检查'
```

---

### Task 5: Final repository audit and handoff

**Files:**

- Verify only; modify a task-owned file only when a verification failure demonstrates a defect in that task.

**Interfaces:**

- Consumes: all Task 1-4 outputs.
- Produces: clean local history, passing checks, audit counts and a concise user-facing analysis.

- [ ] **Step 1: Verify commit scope and history**

Run:

```bash
rtk git status --short --branch
rtk git log -6 --oneline --decorate
rtk git diff origin/main...HEAD --stat
rtk git diff origin/main...HEAD -- content/papers
```

Expected: branch is ahead only by the design, plan, validator, public workflow/template, author SOP and integration commits; the final command has no output.

- [ ] **Step 2: Re-run all release checks from a clean worktree**

Run:

```bash
rtk npm run test:workflow
rtk npm run check:workflow
rtk npm run check:metadata
rtk npm run check:math
rtk npm run build
rtk npm run check:site
rtk git status --short
```

Expected: every command succeeds and the final status is clean.

- [ ] **Step 3: Report the audit outcome**

The final response must include:

- changed SOP architecture and the v2 entry fields;
- exact automated error coverage;
- advisory categories and current counts, including recurring unprofiled authors;
- confirmation that 91 historical notes were not modified and still pass;
- verification commands executed;
- local commit hashes;
- explicit statement that no push occurred.
