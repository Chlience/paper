import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import test from 'node:test';
import * as authors from './content/authors.mjs';
import * as markdown from './content/markdown.mjs';
import * as tagging from './content/tagging.mjs';
import * as workflow from './content/paper-workflow.mjs';

const { validatePaperRecord } = workflow;
const { stripPublicPaperMaintenance } = markdown;

const archiveIndex = (rows) => `# Paper Archive Index

## 当前收录

| 简称 | 时间 | 核心信号 |
| --- | --- | --- |
${rows.join('\n')}

## 后续新增论文沉淀规范

关系保留在对应论文笔记中。
`;

const archiveRow = (slug, shortTitle, month = '2026年7月', signal = '提炼论文最核心的机制贡献。') =>
  `| [${shortTitle}](/papers/${slug}/) | ${month} | ${signal} |`;

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
- 对照是否可比：在相同设置下可比。
- 支持的最窄结论：仅支持当前评测设置中的结果。
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

## 跨论文关系

- 暂无高置信跨论文关系。

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
    legacyPaperSlugs: new Set([slug]),
    imageExists,
  });

test('exports the paper record validator', () => {
  assert.equal(typeof validatePaperRecord, 'function');
});

test('exports the archive time validator', () => {
  assert.equal(typeof workflow.validateArchiveTimes, 'function');
});

test('exports the archive index validator', () => {
  assert.equal(typeof workflow.validateArchiveIndex, 'function');
});

test('exports the author profile validator', () => {
  assert.equal(typeof workflow.validateAuthorProfiles, 'function');
});

test('exports the recurring author audit', () => {
  assert.equal(typeof workflow.findRecurringUnprofiled, 'function');
});

test('exports the orphan author profile audit', () => {
  assert.equal(typeof workflow.findOrphanAuthorProfiles, 'function');
});

test('exports the archive collection audit', () => {
  assert.equal(typeof workflow.validateArchiveCollections, 'function');
});

test('controlled tags cover every archived paper and every defined route', async () => {
  const paperSlugs = (await fs.readdir('content/papers'))
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace(/\.md$/, ''));

  assert.deepEqual(tagging.validateTagConfiguration(paperSlugs), []);
  assert.deepEqual(
    new Set(Object.values(tagging.paperTagAssignments).flat()),
    new Set(tagging.tagDefinitions.map((tag) => tag.id)),
  );
});

test('controlled tag validation rejects incomplete or stale assignments', () => {
  const assignments = structuredClone(tagging.paperTagAssignments);
  const [missingSlug, unknownSlug, duplicateSlug, overflowSlug] = Object.keys(assignments);
  delete assignments[missingSlug];
  assignments[unknownSlug] = ['unknown-route'];
  assignments[duplicateSlug] = ['agent-workflow', 'agent-workflow'];
  assignments[overflowSlug] = tagging.tagDefinitions.slice(0, 5).map((tag) => tag.id);
  assignments['deleted-paper'] = ['benchmark'];

  const errors = tagging.validateTagConfiguration(
    [missingSlug, unknownSlug, duplicateSlug, overflowSlug],
    { assignments },
  );
  const codes = new Set(errors.map((error) => error.code));

  for (const code of [
    'missing-paper-tags',
    'unknown-paper-tag',
    'duplicate-paper-tag',
    'too-many-paper-tags',
    'stale-paper-tags',
  ]) {
    assert.ok(codes.has(code), `Expected ${code}.`);
  }
});

test('leaf tag labels exclude deprecated archive-wide categories', () => {
  const labels = new Set(tagging.tagDefinitions.map((tag) => tag.label));
  for (const broadLabel of ['RL', 'Systems', 'Methodology', 'Safety', 'Theory']) {
    assert.equal(labels.has(broadLabel), false);
  }
});

test('controlled tag validation rejects ambiguous search terms', () => {
  const taxonomy = structuredClone(tagging.tagTaxonomy);
  taxonomy.facets[0].tags[1].aliases.push(taxonomy.facets[0].tags[0].label);
  const errors = tagging.validateTagConfiguration(Object.keys(tagging.paperTagAssignments), { taxonomy });

  assert.ok(errors.some((error) => error.code === 'ambiguous-tag-term'));
});

test('author references combine profile links with source author names', () => {
  const references = authors.collectAuthorReferences(
    [
      '## 作者与关系',
      '',
      '- [Ada Example](/authors/ada-example/): Example University.',
      '',
      '## 跨论文关系',
      '',
      '- Related work by [External Author](/authors/external-author/).',
    ].join('\n'),
    'Bob Example, Carol Example',
  );

  assert.deepEqual([...references.slugs], ['ada-example']);
  assert.deepEqual([...references.keys], ['bob example', 'carol example']);
  assert.equal(authors.authorProfileIsReferenced({ slug: 'ada-example', name: 'Ada Example' }, references), true);
  assert.equal(
    authors.authorProfileIsReferenced(
      { slug: 'robert-example', name: 'Robert Example', aliases: ['Bob Example'] },
      references,
    ),
    true,
  );
});

test('orphan author audit ignores linked and aliased profiles and reports true orphans', () => {
  const records = [
    {
      slug: 'linked-paper',
      markdown: [
        '## Source',
        '',
        '- Authors: Bob Example',
        '',
        '## 作者与关系',
        '',
        '- [Ada Example](/authors/ada-example/): Example University.',
      ].join('\n'),
    },
  ];
  const profiles = [
    { slug: 'ada-example', name: 'Ada Example' },
    { slug: 'robert-example', name: 'Robert Example', aliases: ['Bob Example'] },
    { slug: 'orphan-author', name: 'Orphan Author' },
  ];

  const issues = workflow.findOrphanAuthorProfiles(records, profiles);

  assert.deepEqual(issues.map((issue) => issue.subject), ['orphan-author']);
  assert.equal(issues[0].code, 'orphan-author-profile');
});

test('archive collection audit combines index and author reverse-integrity errors', () => {
  const records = [
    {
      slug: 'echo',
      markdown: '## Source\n\n- Authors: Ada Example\n\n## 作者与关系\n\n- Ada Example: Example University.',
    },
  ];
  const result = workflow.validateArchiveCollections({
    records,
    profiles: [
      { slug: 'ada-example', name: 'Ada Example' },
      { slug: 'orphan-author', name: 'Orphan Author' },
    ],
    indexMarkdown: archiveIndex([archiveRow('echo', 'ECHO')]),
    knownPaperSlugs: new Set(['echo', 'missing-paper']),
  });

  assert.ok(result.errors.some((issue) => issue.code === 'missing-index-entry'));
  assert.ok(result.errors.some((issue) => issue.code === 'orphan-author-profile'));
});

test('archive index accepts one well-formed row for every paper', () => {
  const result = workflow.validateArchiveIndex(
    archiveIndex([
      archiveRow('echo', 'ECHO'),
      archiveRow('spiral', 'SPIRAL', '2026年6月', '把搜索轨迹和聚合轨迹放进同一个 RL 目标。'),
    ]),
    new Set(['echo', 'spiral']),
  );

  assert.deepEqual(result.errors, []);
});

test('archive index requires reverse chronological month order', () => {
  const result = workflow.validateArchiveIndex(
    archiveIndex([
      archiveRow('older', 'Older', '2026年6月'),
      archiveRow('newer', 'Newer', '2026年7月'),
    ]),
    new Set(['older', 'newer']),
  );

  assert.ok(result.errors.some((issue) => issue.code === 'index-time-order' && issue.subject === 'newer'));
});

test('archive index allows stable ordering within the same month', () => {
  const result = workflow.validateArchiveIndex(
    archiveIndex([
      archiveRow('echo', 'ECHO', '2026年7月'),
      archiveRow('spiral', 'SPIRAL', '2026年7月'),
    ]),
    new Set(['echo', 'spiral']),
  );

  assert.deepEqual(result.errors, []);
});

test('archive index requires every paper inside the current collection table', () => {
  const index = `${archiveIndex([archiveRow('echo', 'ECHO')])}\n## 跨论文关系\n\n[SPIRAL](/papers/spiral/)`;
  const result = workflow.validateArchiveIndex(index, new Set(['echo', 'spiral']));

  assert.ok(result.errors.some((issue) => issue.code === 'missing-index-entry' && issue.subject === 'spiral'));
});

test('archive index rejects stale and duplicate paper rows', () => {
  const result = workflow.validateArchiveIndex(
    archiveIndex([
      archiveRow('echo', 'ECHO'),
      archiveRow('echo', 'ECHO duplicate'),
      archiveRow('deleted-paper', 'Deleted'),
    ]),
    new Set(['echo']),
  );

  assert.ok(result.errors.some((issue) => issue.code === 'duplicate-index-entry' && issue.subject === 'echo'));
  assert.ok(result.errors.some((issue) => issue.code === 'stale-index-entry' && issue.subject === 'deleted-paper'));
});

test('archive index enforces the concise three-column contract', () => {
  const invalidHeader = archiveIndex([archiveRow('echo', 'ECHO')]).replace('核心信号', 'Theme');
  const invalidRows = archiveIndex([
    archiveRow('echo', 'ECHO', '2026-07', ''),
    archiveRow('spiral', 'SPIRAL', '2026年6月', 'search, set RL, aggregation'),
  ]);

  const headerResult = workflow.validateArchiveIndex(invalidHeader, new Set(['echo']));
  const rowResult = workflow.validateArchiveIndex(invalidRows, new Set(['echo', 'spiral']));

  assert.ok(headerResult.errors.some((issue) => issue.code === 'index-table-header'));
  assert.ok(rowResult.errors.some((issue) => issue.code === 'index-time-format' && issue.subject === 'echo'));
  assert.ok(rowResult.errors.some((issue) => issue.code === 'missing-core-signal' && issue.subject === 'echo'));
  assert.ok(rowResult.errors.some((issue) => issue.code === 'core-signal-format' && issue.subject === 'spiral'));
});

test('archive index requires a current collection table', () => {
  const result = workflow.validateArchiveIndex('# Empty index', new Set(['echo']));

  assert.ok(result.errors.some((issue) => issue.code === 'missing-index-table'));
});

test('exports the advisory summarizer', () => {
  assert.equal(typeof workflow.summarizeAdvisories, 'function');
});

test('legacy notes accept internal sources and report migration advisories', async () => {
  const result = await validate('legacy-note', legacyPaper);
  assert.deepEqual(result.errors, []);
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-source-snapshot'));
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-time-format'));
});

test('the default v2 contract validates without errors', async () => {
  const result = await validate('v2-note', v2Paper);
  assert.deepEqual(result.errors, []);
});

test('new notes cannot enter compatibility mode without a workflow version', async () => {
  const result = await validatePaperRecord({
    slug: 'new-unversioned-note',
    markdown: legacyPaper,
    indexMarkdown: '- [note](/papers/new-unversioned-note/)',
    knownPaperSlugs: new Set(['new-unversioned-note', 'source-paper']),
    legacyPaperSlugs: new Set(['legacy-note']),
    imageExists: async () => true,
  });
  assert.ok(result.errors.some((issue) => issue.code === 'missing-workflow-version'));
});

test('unsupported workflow versions fail closed', async () => {
  const invalid = v2Paper.replace('Workflow version: v2', 'Workflow version: v3');
  const result = await validate('unsupported-workflow-version', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'unsupported-workflow-version'));
});

test('v2 notes require minute-precision archive timestamps', async () => {
  const invalid = v2Paper.replace('2026-07-10 09:30', '2026-07-10 9:30 CST');
  const result = await validate('invalid-v2-time', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-time-format'));
});

test('v2 notes reject an update time before the archive time', async () => {
  const invalid = v2Paper.replace('Updated-At: 2026-07-10 09:31', 'Updated-At: 2026-07-10 09:29');
  const result = await validate('invalid-v2-time-order', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-time-order'));
});

test('all notes require an explicit Updated-At field', async () => {
  const invalid = legacyPaper.replace('Updated-At: 2026-07-03 09:03 CST\n', '');
  const result = await validate('missing-updated-time', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-archive-time'));
});

test('v2 timestamps must represent real calendar minutes', async () => {
  const invalid = v2Paper.replace('2026-07-10 09:30', '2026-99-99 99:99');
  const result = await validate('invalid-calendar-time', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-time-format'));
});

test('v2 notes require a complete source snapshot', async () => {
  const invalid = v2Paper.replace('- Canonical source: https://arxiv.org/abs/2607.00001\n', '');
  const result = await validate('invalid-v2-source', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-source-field'));
});

test('v2 notes restrict material type to the supported taxonomy', async () => {
  const invalid = v2Paper.replace('Material type: research-paper', 'Material type: notebook');
  const result = await validate('invalid-v2-material', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-material-type'));
});

test('v2 notes require a resolvable canonical source', async () => {
  const invalid = v2Paper.replace(
    'Canonical source: https://arxiv.org/abs/2607.00001',
    'Canonical source: unavailable',
  );
  const result = await validate('invalid-v2-canonical-source', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-canonical-source'));
});

test('v2 canonical sources accept a Markdown link to an absolute URL', async () => {
  const markdown = v2Paper.replace(
    'Canonical source: https://arxiv.org/abs/2607.00001',
    'Canonical source: [arXiv](https://arxiv.org/abs/2607.00001)',
  );
  const result = await validate('markdown-canonical-source', markdown);
  assert.deepEqual(result.errors, []);
});

test('composite notes accept a traceable bare internal canonical source', async () => {
  const markdown = v2Paper
    .replace('Material type: research-paper', 'Material type: composite')
    .replace('Canonical source: https://arxiv.org/abs/2607.00001', 'Canonical source: /papers/source-paper/');
  const result = await validate('composite-note', markdown);
  assert.deepEqual(result.errors, []);
});

test('non-composite notes reject internal canonical sources', async () => {
  const markdown = v2Paper.replace(
    'Canonical source: https://arxiv.org/abs/2607.00001',
    'Canonical source: /papers/source-paper/',
  );
  const result = await validate('internal-research-source', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-canonical-source'));
});

test('composite notes reject a self-referential canonical source', async () => {
  const markdown = v2Paper
    .replace('Material type: research-paper', 'Material type: composite')
    .replace('Canonical source: https://arxiv.org/abs/2607.00001', 'Canonical source: /papers/composite-self-link/');
  const result = await validate('composite-self-link', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-canonical-source'));
});

test('v2 access dates reject template placeholders', async () => {
  const invalid = v2Paper.replace('Accessed: 2026-07-10', 'Accessed: YYYY-MM-DD');
  const result = await validate('invalid-access-date', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-accessed-date'));
});

test('v2 review dates reject template placeholders', async () => {
  const invalid = v2Paper.replace('Observed at: 2026-07-10', 'Observed at: YYYY-MM-DD');
  const result = await validate('invalid-review-date', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-review-date'));
});

test('all notes require non-empty core sections', async () => {
  const invalid = legacyPaper.replace('## 局限', '### 局限');
  const result = await validate('invalid-core-section', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-core-section'));
});

test('all notes require archive and update timestamps', async () => {
  const invalid = legacyPaper
    .replace('First-Archived-At: 2026-07-03 09:03 CST\n', '')
    .replace('Updated-At: 2026-07-03 09:03 CST\n', '');
  const result = await validate('missing-times', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-archive-time'));
});

test('all notes require a traceable source link', async () => {
  const invalid = legacyPaper.replace(
    '- Local archive: [source](/papers/source-paper/)',
    '- Source status: unavailable',
  );
  const result = await validate('invalid-source-link', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-source-link'));
});

test('traceable source links must be valid absolute URLs', async () => {
  const invalid = legacyPaper.replace(
    '- Local archive: [source](/papers/source-paper/)',
    '- Source: https://?',
  );
  const result = await validate('invalid-absolute-source', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-source-link'));
});

test('all notes require an archive index link', async () => {
  const result = await validatePaperRecord({
    slug: 'legacy-note',
    markdown: legacyPaper,
    indexMarkdown: '# Empty index',
    knownPaperSlugs: new Set(['legacy-note', 'source-paper']),
    imageExists: async () => true,
  });
  assert.ok(result.errors.some((issue) => issue.code === 'missing-index-link'));
});

test('all notes reject blank template placeholders', async () => {
  const result = await validate('placeholder-note', `${legacyPaper}\n- \n`);
  assert.ok(result.errors.some((issue) => issue.code === 'template-placeholder'));
});

test('v2 result blocks require evidence locations', async () => {
  const invalid = v2Paper.replace('- 证据定位：Section 4, Table 1.\n', '');
  const result = await validate('invalid-v2-evidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 result blocks require a comparability assessment', async () => {
  const invalid = v2Paper.replace('- 对照是否可比：在相同设置下可比。', '- 对照是否可比：');
  const result = await validate('missing-v2-comparability', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-result-comparability'));
});

test('v2 result blocks require a narrowest supported conclusion', async () => {
  const invalid = v2Paper.replace('- 支持的最窄结论：仅支持当前评测设置中的结果。', '- 支持的最窄结论：');
  const result = await validate('missing-v2-narrow-conclusion', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-result-narrow-conclusion'));
});

test('v2 evidence checks cover result headings written in English', async () => {
  const invalid = v2Paper
    .replace('### 结果 1', '### Throughput')
    .replace('- 证据定位：Section 4, Table 1.\n', '');
  const result = await validate('english-result-heading', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 evidence locations reject unresolved placeholders', async () => {
  const invalid = v2Paper.replace('证据定位：Section 4, Table 1.', '证据定位：TODO');
  const result = await validate('placeholder-evidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 evidence locations reject words that only begin with a locator abbreviation', async () => {
  const invalid = v2Paper.replace('证据定位：Section 4, Table 1.', '证据定位：pending');
  const result = await validate('prefix-only-evidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 evidence locations reject incomplete URLs', async () => {
  const invalid = v2Paper.replace('证据定位：Section 4, Table 1.', '证据定位：https://');
  const result = await validate('incomplete-url-evidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 notes require review classification fields', async () => {
  const invalid = v2Paper.replace('- Page type: not-found\n', '');
  const result = await validate('invalid-v2-review-fields', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-review-field'));
});

test('v2 notes restrict review page type to the supported taxonomy', async () => {
  const invalid = v2Paper.replace('Page type: not-found', 'Page type: blog-post');
  const result = await validate('invalid-v2-review-type', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-review-page-type'));
});

test('v2 notes restrict review match confidence to three levels', async () => {
  const invalid = v2Paper.replace('Match confidence: high', 'Match confidence: certain');
  const result = await validate('invalid-v2-review-confidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-review-confidence'));
});

test('v2 notes restrict reference intake decisions to four actions', async () => {
  const invalid = v2Paper.replace('Decision: merge', 'Decision: maybe');
  const result = await validate('invalid-v2-reference-decision', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-reference-decision'));
});

test('v2 reference intake decisions reject trailing placeholder text', async () => {
  const invalid = v2Paper.replace('Decision: merge', 'Decision: merge / revise-then-merge / skip');
  const result = await validate('placeholder-v2-reference-decision', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-reference-decision'));
});

test('legacy notes report missing review classification and evidence locations', async () => {
  const legacy = legacyPaper
    .replace('- 证据定位：Section 4, Table 1.\n', '')
    .replace('- Page type: not-found\n', '')
    .replace('- Match confidence: high\n', '')
    .replace('- Observed at: 2026-07-10\n', '');
  const result = await validate('legacy-advisories', legacy);
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-review-classification'));
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-evidence-location'));
});

test('legacy notes report nonstandard reference intake decisions', async () => {
  const legacy = legacyPaper.replace('Decision: merge', 'Decision: maybe');
  const result = await validate('legacy-reference-decision', legacy);
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-reference-decision'));
});

test('paper figures require an existing local file', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/v2-note/fig-1.png)\n\nFigure 1: result. Image Source: https://example.com/fig-1.png',
  );
  const result = await validate('v2-note', markdown, async () => false);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-image-file'));
});

test('paper figures require an Image Source caption', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/v2-note/fig-1.png)\n\nFigure 1: result.',
  );
  const result = await validate('v2-note', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-image-source'));
});

test('paper figure paths must use the current paper slug', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/other-note/fig-1.png)\n\nFigure 1: result. Image Source: https://example.com/fig-1.png',
  );
  const result = await validate('v2-note', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'image-slug-mismatch'));
});

test('paper image checks ignore examples inside HTML comments', async () => {
  const markdown = `${v2Paper}\n<!-- ![Example](/images/papers/placeholder/fig.png) -->\n`;
  const result = await validate('commented-image', markdown, async () => false);
  assert.ok(!result.errors.some((issue) => issue.code.startsWith('image-') || issue.code.startsWith('missing-image')));
});

test('paper images reject local paths outside the paper image directory', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/elsewhere.png)\n\nFigure 1: result. Image Source: https://example.com/fig.png',
  );
  const result = await validate('invalid-image-directory', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'image-path'));
});

test('paper images reject relative local paths', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](fig.png)\n\nFigure 1: result. Image Source: https://example.com/fig.png',
  );
  const result = await validate('relative-image-path', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'image-path'));
});

test('paper images reject path traversal outside the paper directory', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/path-traversal/../other/fig.png)\n\nFigure 1: result. Image Source: https://example.com/fig.png',
  );
  let checkedFilesystem = false;
  const result = await validate('path-traversal', markdown, async () => {
    checkedFilesystem = true;
    return true;
  });
  assert.ok(result.errors.some((issue) => issue.code === 'image-path'));
  assert.equal(checkedFilesystem, false);
});

test('each local image requires its own nearby Image Source caption', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    [
      '- 结果：有效。',
      '',
      '![Figure 1](/images/papers/two-images/fig-1.png)',
      '',
      'Figure 1: result.',
      '',
      '![Figure 2](/images/papers/two-images/fig-2.png)',
      '',
      'Figure 2: result. Image Source: https://example.com/fig-2.png',
    ].join('\n'),
  );
  const result = await validate('two-images', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-image-source'));
});

test('archive time conflicts are errors for v2 notes and advisories for legacy notes', () => {
  const records = [
    { slug: 'v2-note', markdown: v2Paper },
    {
      slug: 'legacy-note',
      markdown: legacyPaper.replaceAll('2026-07-03 09:03 CST', '2026-07-10 09:30'),
    },
  ];
  const result = workflow.validateArchiveTimes(records);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-archive-time-conflict'));
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-archive-time-conflict'));
});

test('author aliases cannot resolve to two different profiles', () => {
  const profiles = [
    { slug: 'ada-example', name: 'Ada Example', aliases: ['A. Example'] },
    { slug: 'bob-example', name: 'Bob Example', aliases: ['A. Example'] },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-identity-conflict'));
});

test('author profile slugs must be unique', () => {
  const profiles = [
    { slug: 'shared-slug', name: 'Ada Example' },
    { slug: 'shared-slug', name: 'Bob Example' },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-slug-conflict'));
});

test('author profile links must be absolute URLs', () => {
  const profiles = [{ slug: 'ada-example', name: 'Ada Example', homepage: 'invalid-homepage' }];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-profile-url'));
});

test('author profile links reject incomplete HTTP URLs', () => {
  const profiles = [{ slug: 'ada-example', name: 'Ada Example', homepage: 'https://' }];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-profile-url'));
});

test('author profiles require an object with a slug and name', () => {
  let result;
  assert.doesNotThrow(() => {
    result = workflow.validateAuthorProfiles([null, { aliases: [] }]);
  });
  assert.ok(result.errors.some((issue) => issue.code === 'author-profile-shape'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-slug'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-name'));
});

test('author aliases and sources must remain arrays', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      aliases: 'A. Example',
      sources: { label: 'Homepage', url: 'https://example.com/ada' },
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-aliases-shape'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-sources-shape'));
});

test('author evidence sources must contain absolute URLs', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      sources: [{ label: 'Homepage', url: 'invalid-source' }],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-source-url'));
});

test('author evidence accepts URL strings and labeled source objects', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      sources: [
        'https://example.com/paper',
        { label: 'Homepage', url: 'https://example.com/ada' },
      ],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(!result.errors.some((issue) => issue.code === 'author-source-url'));
});

test('author profile data must be a JSON array', () => {
  let result;
  assert.doesNotThrow(() => {
    result = workflow.validateAuthorProfiles({});
  });
  assert.ok(result.errors.some((issue) => issue.code === 'authors-shape'));
});

test('recurring unprofiled authors are reported once', () => {
  const records = [
    { slug: 'one', markdown: '## Source\n\n- Authors: Ada Example, Bob Example' },
    { slug: 'two', markdown: '## Source\n\n- Authors: Bob Example, Carol Example' },
  ];
  const issues = workflow.findRecurringUnprofiled(records, [{ slug: 'ada-example', name: 'Ada Example' }]);
  assert.deepEqual(issues.map((issue) => issue.subject), ['Bob Example']);
});

test('content build associates linked author profiles with their papers', async () => {
  const result = spawnSync(process.execPath, ['scripts/build-paper-data.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const data = JSON.parse(await fs.readFile('src/generated/paper-data.json', 'utf8'));
  assert.equal(data.tagFacets.length, tagging.tagFacets.length);
  assert.equal(data.tagRoutes.length, tagging.tagDefinitions.length);
  for (const paper of data.papers) {
    assert.equal(paper.primaryTagId, paper.tagIds[0]);
    assert.equal(paper.primaryTag, paper.tags[0]);
    assert.ok(paper.tagIds.length >= 1 && paper.tagIds.length <= 4);
  }
  for (const slug of ['nino-vieillard', 'gennady-pekhimenko', 'dongyang-ma-flashmemory']) {
    const author = data.authors.find((candidate) => candidate.slug === slug);
    assert.ok(author, `Missing generated author ${slug}`);
    assert.ok(author.paperCount > 0, `Expected ${slug} to have at least one linked paper`);
  }
});

test('advisory summaries group by code and bound examples', () => {
  const advisories = [
    ...Array.from({ length: 7 }, (_, index) => ({ code: 'legacy-a', subject: `paper-${index}`, message: 'A' })),
    { code: 'legacy-b', subject: 'paper-b', message: 'B' },
  ];
  const summary = workflow.summarizeAdvisories(advisories);
  assert.deepEqual(
    summary.map(({ code, count, examples }) => ({ code, count, examples: examples.length })),
    [
      { code: 'legacy-a', count: 7, examples: 5 },
      { code: 'legacy-b', count: 1, examples: 1 },
    ],
  );
});

test('workflow CLI validates the current archive without errors', () => {
  const result = spawnSync(process.execPath, ['scripts/check-paper-workflow.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Paper workflow check passed for \d+ papers and \d+ author profiles\./);
});

test('public paper sanitizer retains the v2 not-found review classification', () => {
  const cleaned = stripPublicPaperMaintenance(`## OpenReview / 审稿意见吸收

- Page type: not-found
- xConfidence: not-found
`);

  assert.match(cleaned, /Page type: not-found/);
  assert.doesNotMatch(cleaned, /xConfidence/);
});

test('public utility sanitizer removes repository-only maintenance blocks', () => {
  const source = `公开说明。

<!-- public-utility-omit:start -->
npm run check:site
<!-- public-utility-omit:end -->

继续公开说明。`;

  const sanitized = markdown.stripPublicUtilityMaintenance(source);
  assert.doesNotMatch(sanitized, /npm run/i);
  assert.doesNotMatch(sanitized, /public-utility-omit/);
  assert.match(sanitized, /公开说明。/);
  assert.match(sanitized, /继续公开说明。/);
});

test('the maintenance exemption accepts only the canonical single-line review field', () => {
  assert.equal(typeof markdown.isPublicPaperMaintenanceExemption, 'function');
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- Page type: not-found'), true);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('-\n Page type: not-found'), false);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- Page type:\nnot-found'), false);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- xConfidence: not-found'), false);
});

test('metadata CLI accepts the v2 not-found review classification', async () => {
  const canary = await fs.readFile('content/papers/2603.00729-qwen3-coder-next-agentic-coding.md', 'utf8');
  assert.match(canary, /^- Page type: not-found$/m);

  const result = spawnSync(process.execPath, ['scripts/check-paper-metadata.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Paper metadata check passed\./);
});

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
    '索引核心信号',
  ]) {
    assert.match(template, new RegExp(fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('public workflow documents index and deletion reverse-integrity contracts', async () => {
  const workflowDoc = await fs.readFile('content/utility/paper-analysis-workflow.md', 'utf8');
  const agentInstructions = await fs.readFile('AGENTS.md', 'utf8');

  for (const snippet of [
    '| 简称 | 时间 | 核心信号 |',
    '索引核心信号',
    '论文删除与反向清理',
    '`orphan-author-profile`',
    '`data/paper-tags.json`',
    '`data/tag-taxonomy.json`',
  ]) {
    assert.match(workflowDoc, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(workflowDoc, /从新到旧/);
  assert.match(agentInstructions, /核心信号/);
  assert.match(agentInstructions, /孤立作者/);
});

test('archive omits global author grouping while paper notes retain author relationships', async () => {
  const [index, workflowDoc, template, archivePage, agentInstructions, authorSop, dapo, flashAttention2] =
    await Promise.all([
      fs.readFile('content/utility/papers-index.md', 'utf8'),
      fs.readFile('content/utility/paper-analysis-workflow.md', 'utf8'),
      fs.readFile('content/utility/paper-note-template.md', 'utf8'),
      fs.readFile('src/pages/archive/index.astro', 'utf8'),
      fs.readFile('AGENTS.md', 'utf8'),
      fs.readFile('internal/author-x-account-search-sop.md', 'utf8'),
      fs.readFile('content/papers/2503.14476-dapo-long-cot-rl-system.md', 'utf8'),
      fs.readFile('content/papers/2307.08691-flashattention-2-parallelism-work-partitioning.md', 'utf8'),
    ]);

  assert.doesNotMatch(index, /^## 作者关系图谱$/m);
  assert.doesNotMatch(index, /^### Cluster\s+/m);
  assert.match(markdown.getSection(dapo, '跨论文关系'), /Haibin Lin/);
  assert.match(flashAttention2, /\/authors\/tri-dao\//);
  assert.doesNotMatch(workflowDoc, /作者关系图谱|索引 cluster/i);
  assert.doesNotMatch(
    workflowDoc,
    /(?:关系|主题延展|方法复用)[^\n]{0,80}(?:同步更新|写入)\s*`?content\/utility\/papers-index/i,
  );
  assert.doesNotMatch(template, /索引行[^\n]*cluster/i);
  assert.doesNotMatch(archivePage, /作者关系图谱/);
  assert.match(agentInstructions, /跨论文关系/);
  assert.match(authorSop, /papers-index\.md`：只维护 `当前收录`/);
  assert.match(authorSop, /论文笔记 `跨论文关系`/);
  assert.doesNotMatch(authorSop, /papers-index\.md`：写已核验/);
  assert.doesNotMatch(authorSop, /papers-index\.md` 中已核验的跨论文关系/);

  const paperFiles = (await fs.readdir('content/papers')).filter((fileName) => fileName.endsWith('.md'));
  const staleMaintenancePatterns = [
    /作者关系图谱/i,
    /新增后应更新的索引 cluster/i,
    /新增索引 cluster/i,
    /索引状态：[^\n]*cluster/i,
    /索引中的作者关系/i,
    /Proposed form:[^\n]*(?:索引[^\n]*cluster|cluster[^\n]*跨论文关系)/i,
    /(?:新增|更新|扩展|归入)[^\n]*Cluster [A-Z][A-Z0-9]*/i,
    /索引状态：[^\n]*跨论文关系/i,
    /(?:更新|同步|补充)[^\n]{0,60}(?:papers-index|索引)[^\n]{0,60}跨论文关系/i,
    /(?:papers-index|索引)[^\n]{0,60}的当前收录[^\n]{0,60}跨论文关系/i,
    /关系写入索引/i,
    /索引中(?:补充|作为)[^\n]*关系/i,
    /当前索引[^\n]*引用关系/i,
    /应在索引中[^\n]*(?:连接|关系|图谱)/i,
    /Existing local paper notes and `content\/utility\/papers-index\.md` \| Cross-paper relationship mapping/i,
    /papers-index\.md` 中已有论文的作者关系/i,
    /(?:在 `content\/utility\/papers-index\.md` 新增|索引中已经存在的)[^\n]*节点/i,
  ];
  const staleFiles = [];

  for (const fileName of paperFiles) {
    const source = await fs.readFile(`content/papers/${fileName}`, 'utf8');
    const ambiguousOwnership = source.split('\n').some((line) => {
      const maintenanceField = /(?:Intended target system|Proposed form|Why):/i.test(line);
      const mentionsIndex = /(?:papers-index|索引|\bindex\b)/i.test(line);
      const mentionsRelations = /(?:关系|图谱|节点)/i.test(line);
      if (!maintenanceField || !mentionsIndex || !mentionsRelations) return false;

      const ownsOnlyCollection = /(?:索引行|当前收录)/.test(line);
      const localizesRelations = /(?:关系章节|对应论文|本笔记|笔记中维护关系)/.test(line);
      return !ownsOnlyCollection || !localizesRelations;
    });
    if (ambiguousOwnership || staleMaintenancePatterns.some((pattern) => pattern.test(source))) {
      staleFiles.push(fileName);
    }
  }

  assert.deepEqual(staleFiles, []);
});

test('cross-paper relations live in paper notes instead of the archive index', async () => {
  const index = await fs.readFile('content/utility/papers-index.md', 'utf8');
  assert.doesNotMatch(index, /^## 跨论文关系$/m);
  assert.ok(workflow.REQUIRED_SECTION_GROUPS.some((group) => group.name === '跨论文关系'));

  const paperFiles = (await fs.readdir('content/papers')).filter((fileName) => fileName.endsWith('.md'));
  const missingRelations = [];
  for (const fileName of paperFiles) {
    const source = await fs.readFile(`content/papers/${fileName}`, 'utf8');
    if (!markdown.getSection(source, '跨论文关系').trim()) missingRelations.push(fileName);
  }

  assert.deepEqual(missingRelations, []);
});
