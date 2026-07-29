import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import test from 'node:test';
import * as authors from './content/authors.mjs';
import * as markdown from './content/markdown.mjs';
import * as repository from './content/repository.mjs';
import * as tagging from './content/tagging.mjs';
import * as workflow from './content/paper-workflow.mjs';
import * as paperReview from '../src/lib/paper-review.mjs';

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
Review-Status: pending

## Source

- Local archive: [source](/papers/source-paper/)
${coreBody}`;

const v2Paper = `# V2 note

First-Archived-At: 2026-07-10 09:30
Updated-At: 2026-07-10 09:31
Review-Status: pending

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

const v21CoreBody = `
## 作者与关系

- Ada Example: Example University.

## 一句话结论

结论。

## 论文脉络

### 1. 研究问题

研究问题。

### 2. 现有方法的缺口

现有缺口。

### 3. 思路形成

思路形成过程。

### 4. 核心假设

核心假设。

### 5. 贡献全景与方法总览

首要贡献由三个阶段组成，执行顺序为输入编码、核心变换和训练目标构造；辅助贡献提供接口诊断并支撑各阶段的独立验证。第一阶段接收原始输入并产生中间表示；第二阶段依据该表示执行核心变换，并把新状态传递给第三阶段；第三阶段输出训练信号。该设计用于隔离表示构造与目标计算，使每个阶段的作用和接口可以分别验证。以两个样本和一个阈值为例，样本经过三个阶段后的对象、操作与结果分别对应正式定义中的输入、变换和输出。直接证据位于 Section 3 和 Figure 2；来源未披露生产规模下的失败边界，因此结论只在当前实验条件下成立。

### 6. 核心变换与训练信号

核心变换接收第一阶段的中间表示，执行受约束的状态更新，并把更新后的状态传递给训练目标构造阶段，最终输出可用于优化的训练信号。这个操作解决原始输入与目标计算直接耦合的问题。直接证据位于 Section 3 和 Figure 2；方法依赖当前表示假设，生产规模下的失败边界仍未披露。

### 7. 结论链

结论链条。

## 关键实验/定理

### 结果 1

- 对照是否可比：在相同设置下可比。
- 证据定位：Section 4, Table 1.
- 支持的最窄结论：仅支持当前评测设置中的结果。
- 结果：有效。

## 局限

1. 局限。

## 跨论文关系

- 暂无高置信跨论文关系。
`;

const v21Paper = `# V2.1 note

First-Archived-At: 2026-07-17 09:30
Updated-At: 2026-07-17 09:31
Review-Status: pending

## Source

- Workflow version: v2.1
- Material type: research-paper
- Analysis modules: experiment
- Canonical source: https://arxiv.org/abs/2607.00002
- Title: V2.1 Paper
- Authors: Ada Example, Bob Example
- Submitted: 2026-07-16
- Current version read: v1
- Accessed: 2026-07-17
- Key figure decision: omit
- Key figure rationale: 测试材料没有高价值机制图，正文足以表达当前 fixture 的完整证据。
- Review status: page-type=not-found; match-confidence=high; observed-at=2026-07-17; venue-status=arXiv preprint
${v21CoreBody}`;

const validate = (
  slug,
  markdown,
  {
    imageExists = async () => true,
    methodOverviewBaseline = new Map(),
  } = {},
) =>
  validatePaperRecord({
    slug,
    markdown,
    indexMarkdown: `- [note](/papers/${slug}/)`,
    knownPaperSlugs: new Set([slug, 'source-paper']),
    legacyPaperSlugs: new Set([slug]),
    methodOverviewBaseline,
    imageExists,
  });

test('exports the paper record validator', () => {
  assert.equal(typeof validatePaperRecord, 'function');
});

test('exports the method overview baseline validator', () => {
  assert.equal(typeof workflow.validateMethodOverviewBaseline, 'function');
});

test('exports the v2.1 analysis module taxonomy', () => {
  assert.deepEqual(
    [...workflow.ANALYSIS_MODULES],
    ['experiment', 'system', 'theory', 'model-report', 'survey', 'safety', 'docs'],
  );
});

test('exports the paper review status taxonomy and filter helpers', () => {
  assert.deepEqual([...paperReview.PAPER_REVIEW_STATUSES], ['pending', 'needs-review', 'approved']);
  assert.equal(paperReview.normalizePaperReviewFilter('needs-review'), 'needs-review');
  assert.equal(paperReview.normalizePaperReviewFilter('unknown'), 'all');
  assert.equal(paperReview.paperMatchesReviewFilter({ reviewStatus: 'approved' }, 'approved'), true);
  assert.equal(paperReview.paperMatchesReviewFilter({ reviewStatus: 'pending' }, 'approved'), false);
  assert.deepEqual(
    paperReview.countPaperReviewStatuses([
      { reviewStatus: 'pending' },
      { reviewStatus: 'approved' },
      { reviewStatus: 'needs-review' },
    ]),
    { all: 3, pending: 1, 'needs-review': 1, approved: 1 },
  );
});

test('review filters use their visible lifecycle timestamp while preserving pins', () => {
  const papers = [
    {
      slug: 'newly-archived',
      firstArchivedAt: '2026-07-20 09:00',
      updatedAt: '2026-07-20 09:00',
      reviewedAt: '2026-07-20 10:00',
    },
    {
      slug: 'newly-reviewed',
      firstArchivedAt: '2026-07-18 09:00',
      updatedAt: '2026-07-21 08:00',
      reviewedAt: '2026-07-21 09:00',
    },
    {
      slug: 'pinned',
      firstArchivedAt: '2026-07-01 09:00',
      updatedAt: '2026-07-01 09:00',
      reviewedAt: '2026-07-01 10:00',
      pinned: true,
    },
  ];

  assert.deepEqual(paperReview.paperReviewSortDefinition('approved'), {
    field: 'reviewedAt',
    label: '审阅时间',
  });
  assert.deepEqual(paperReview.paperReviewSortDefinition('needs-review'), {
    field: 'updatedAt',
    label: '更新时间',
  });
  assert.deepEqual(
    [...papers].sort((left, right) => paperReview.comparePapersForReviewFilter(left, right, 'all')).map(
      ({ slug }) => slug,
    ),
    ['pinned', 'newly-archived', 'newly-reviewed'],
  );
  assert.deepEqual(
    [...papers]
      .sort((left, right) => paperReview.comparePapersForReviewFilter(left, right, 'pending'))
      .map(({ slug }) => slug),
    ['pinned', 'newly-archived', 'newly-reviewed'],
  );
  assert.deepEqual(
    [...papers]
      .sort((left, right) => paperReview.comparePapersForReviewFilter(left, right, 'needs-review'))
      .map(({ slug }) => slug),
    ['pinned', 'newly-reviewed', 'newly-archived'],
  );
  assert.deepEqual(
    [...papers]
      .sort((left, right) => paperReview.comparePapersForReviewFilter(left, right, 'approved'))
      .map(({ slug }) => slug),
    ['pinned', 'newly-reviewed', 'newly-archived'],
  );
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
  assert.deepEqual([...references.authorSlugs], []);
  assert.deepEqual([...references.authorLinkKeysBySlug], []);
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

test('explicit author matching only accepts links in the Source Authors field', () => {
  const linkedReferences = authors.collectAuthorReferences(
    [
      '## Source',
      '',
      '- Authors: [Xi Wang](/authors/xi-wang-jhu/), Ada Example',
      '',
      '## 作者与关系',
      '',
      '- [External Author](/authors/external-author/): collaborator.',
    ].join('\n'),
    'Xi Wang, Ada Example',
  );
  const nameOnlyReferences = authors.collectAuthorReferences(
    '## Source\n\n- Authors: Xi Wang, Ada Example',
    'Xi Wang, Ada Example',
  );
  const relationOnlyReferences = authors.collectAuthorReferences(
    [
      '## Source',
      '',
      '- Authors: Xi Wang, Ada Example',
      '',
      '## 作者与关系',
      '',
      '- [Xi Wang](/authors/xi-wang-jhu/): related identity.',
    ].join('\n'),
    'Xi Wang, Ada Example',
  );
  const mismatchedReferences = authors.collectAuthorReferences(
    '## Source\n\n- Authors: [Ada Example](/authors/xi-wang-jhu/)',
    'Ada Example',
  );
  const profile = { slug: 'xi-wang-jhu', name: 'Xi Wang', matchByName: false };

  assert.deepEqual([...linkedReferences.authorSlugs], ['xi-wang-jhu']);
  assert.deepEqual(
    [...linkedReferences.authorLinkKeysBySlug].map(([slug, keys]) => [slug, [...keys]]),
    [['xi-wang-jhu', ['xi wang']]],
  );
  assert.equal(authors.authorProfileIsReferenced(profile, linkedReferences), true);
  assert.equal(authors.authorProfileIsReferenced(profile, nameOnlyReferences), false);
  assert.equal(authors.authorProfileIsReferenced(profile, relationOnlyReferences), false);
  assert.equal(authors.authorProfileIsReferenced(profile, mismatchedReferences), false);
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

test('archive index extracts core signals and rejects formulas or multiple sentences', () => {
  const valid = archiveIndex([
    archiveRow('echo', 'ECHO', '2026年7月', '用可寻址记忆连接上下文重建和轨迹级信用分配。'),
  ]);
  const invalid = archiveIndex([
    archiveRow('formula', 'Formula', '2026年7月', '用 $O(T^2)$ 描述序列成本。'),
    archiveRow('multi', 'Multi', '2026年6月', '先重建上下文。再分配信用。'),
  ]);

  assert.equal(
    workflow.parseArchiveCoreSignals(valid).get('echo'),
    '用可寻址记忆连接上下文重建和轨迹级信用分配。',
  );
  const result = workflow.validateArchiveIndex(invalid, new Set(['formula', 'multi']));
  assert.ok(result.errors.some((issue) => issue.code === 'core-signal-math' && issue.subject === 'formula'));
  assert.ok(result.errors.some((issue) => issue.code === 'core-signal-format' && issue.subject === 'multi'));
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

test('the default v2.1 canary validates with seven core sections', async () => {
  const result = await validate('v21-note', v21Paper);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.advisories, []);
  assert.doesNotMatch(v21Paper, /Reference Intake Brief/);
  assert.doesNotMatch(v21Paper, /^## OpenReview \/ 审稿意见吸收$/m);
});

test('v2.1 paper rejects detailed stages without the required section 5 overview heading', async () => {
  const markdown = v21Paper.replace('### 5. 贡献全景与方法总览', '### 5. 输入编码');
  const result = await validate('v21-method-overview-heading', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-overview-heading'));
});

test('v2.1 paper checks the section 5 overview independently from later method detail', async () => {
  const markdown = v21Paper.replace(
    /首要贡献由三个阶段组成，执行顺序[\s\S]+?当前实验条件下成立。/,
    '本文给出核心贡献，详细输入、操作、传递对象、训练信号、设计理由、直接证据和失败边界见下一节。',
  );
  const result = await validate('v21-method-overview-chain', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-chain'));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'));
});

test('unchanged v2.1 migration baselines downgrade method overview gaps to advisories', async () => {
  const slug = 'v21-method-overview-baseline';
  const markdown = v21Paper.replace('### 5. 贡献全景与方法总览', '### 5. 输入编码');
  const result = await validate(slug, markdown, {
    methodOverviewBaseline: new Map([[slug, '2026-07-17 09:31']]),
  });

  assert.ok(result.advisories.some((entry) => entry.code === 'v21-method-overview-heading'));
  assert.ok(!result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
});

test('a changed baseline paper must satisfy the strict method overview contract', async () => {
  const slug = 'v21-method-overview-updated';
  const markdown = v21Paper
    .replace('Updated-At: 2026-07-17 09:31', 'Updated-At: 2026-07-17 09:32')
    .replace('### 5. 贡献全景与方法总览', '### 5. 输入编码');
  const result = await validate(slug, markdown, {
    methodOverviewBaseline: new Map([[slug, '2026-07-17 09:31']]),
  });

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
});

test('v2.1 paper accepts the single-stage method overview contract', async () => {
  const singleStage = [
    '### 5. 方法总览与完整机制',
    '',
    '首要贡献是一次受约束变换：给定输入和初始状态，方法计算闭式更新并最终输出训练信号。该操作用于解决输入表示与优化目标的接口不一致。直接证据位于 Section 3 和 Figure 2；成立边界是当前表示假设，来源未披露生产规模结果。',
    '',
    '### 6. 结论链',
  ].join('\n');
  const markdown = v21Paper.replace(
    /### 5\. 贡献全景与方法总览[\s\S]+?### 7\. 结论链/,
    singleStage,
  );
  const result = await validate('v21-single-stage-method-overview', markdown);

  assert.ok(!result.errors.some((entry) => entry.code.startsWith('v21-method-overview')));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'));
});

test('v2.1 method overviews require an explicit primary contribution', async () => {
  const markdown = v21Paper.replace(
    /首要贡献由三个阶段组成[^。]+。/,
    '方法包含三个阶段，执行顺序为输入编码、核心变换和训练目标构造；辅助贡献提供接口诊断并支撑各阶段的独立验证。',
  );
  const result = await validate('v21-method-overview-contribution', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-chain'));
});

test('HTML comments cannot satisfy method overview signals', async () => {
  const markdown = v21Paper.replace(
    /(?<=### 5\. 贡献全景与方法总览\n\n)[\s\S]+?(?=\n\n### 6\. 核心变换与训练信号)/,
    '<!-- 首要贡献与辅助贡献相互支撑。输入进入阶段流程，执行核心操作并传递对象，最终输出训练信号；该阶段的作用用于解决问题。 -->',
  );
  const result = await validate('v21-hidden-method-overview', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-chain'));
});

test('v2.1 paper requires multi-stage overviews to promote their detail sections', async () => {
  const markdown = v21Paper.replace(
    /### 6\. 核心变换与训练信号[\s\S]+?(?=\n### 7\. 结论链)/,
    '',
  );
  const result = await validate('v21-multi-stage-overview-mode', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-mode'));
});

test('v2.1 paper keeps single-stage mechanisms inside section 5', async () => {
  const markdown = v21Paper.replace(
    '### 5. 贡献全景与方法总览',
    '### 5. 方法总览与完整机制',
  );
  const result = await validate('v21-single-stage-overview-mode', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-mode'));
});

test('fenced headings cannot satisfy the v2.1 method overview contract', async () => {
  const markdown = v21Paper
    .replace('### 5. 贡献全景与方法总览', '### 5. 输入编码')
    .replace(
      '### 6. 核心变换与训练信号',
      '```markdown\n### 5. 贡献全景与方法总览\n```\n\n### 6. 核心变换与训练信号',
    );
  const result = await validate('v21-fenced-method-overview', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
});

test('nested blockquote headings cannot satisfy the v2.1 method overview contract', async () => {
  const markdown = v21Paper.replace(
    '### 5. 贡献全景与方法总览',
    '> ### 5. 贡献全景与方法总览',
  );
  const result = await validate('v21-blockquote-method-overview', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
});

test('HTML comments cannot hide a method overview heading', async () => {
  for (const hiddenHeading of [
    '<!--\n### 5. 贡献全景与方法总览\n-->',
    '<!--\n### 5. 贡献全景与方法总览',
  ]) {
    const markdown = v21Paper.replace(
      '### 5. 贡献全景与方法总览',
      hiddenHeading,
    );
    const result = await validate('v21-commented-method-overview', markdown);

    assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
  }
});

test('v2.1 paper rejects a method wrapper around nested 5.x headings', async () => {
  const markdown = v21Paper.replace(
    '### 5. 贡献全景与方法总览',
    '### 5. 贡献全景与方法总览\n\n#### 5.1 输入编码',
  );
  const result = await validate('v21-method-wrapper-heading', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-wrapper-heading'));
});

test('v2.1 paper rejects hierarchical or discontinuous paper-context numbering', async () => {
  const markdown = v21Paper.replace(
    '### 6. 核心变换与训练信号',
    '### 5.2 核心变换与训练信号',
  );
  const result = await validate('v21-paper-context-heading-sequence', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-paper-context-heading-sequence'));
});

test('v2.1 paper receives an advisory when the method narrative omits stage-level detail', async () => {
  const markdown = v21Paper.replace(
    /### 6\. 核心变换与训练信号[\s\S]+?(?=\n### 7\. 结论链)/,
    '### 6. 核心变换与训练信号\n\n本节展开第二阶段。',
  );
  const result = await validate('v21-method-detail-narrative', markdown);

  assert.equal(
    result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'),
    true,
  );
});

test('K3 keeps detailed method prose while its frozen overview gap remains advisory', async () => {
  const canary = await fs.readFile(
    'content/papers/2026-07-27-kimi-k3-open-frontier-intelligence.md',
    'utf8',
  );
  const slug = '2026-07-27-kimi-k3-open-frontier-intelligence';
  const result = await validate(slug, canary, {
    methodOverviewBaseline: new Map([[slug, '2026-07-28 11:47']]),
  });

  assert.equal(
    result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'),
    false,
  );
  assert.ok(result.advisories.some((entry) => entry.code === 'v21-method-overview-heading'));
  for (const heading of ['11.1 SFT', '11.3 部分采样轨迹', '11.5 MOPD']) {
    assert.match(
      canary,
      new RegExp(`^#### ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'),
    );
  }
  assert.match(canary, /^### 5\. 贡献全景$/m);
  assert.match(canary, /^### 12\. 部署约束/m);
  assert.match(canary, /^### 14\. 结论链条$/m);
  assert.doesNotMatch(canary, /^### 5\.\d+\s/m);
  assert.doesNotMatch(canary, /^### 5\. 核心贡献与方法逻辑$/m);
});

test('DRPO is the real strict method overview canary', async () => {
  const slug = '2510.04474-drpo-decoupled-reward-policy-optimization';
  const canary = await fs.readFile(`content/papers/${slug}.md`, 'utf8');
  const result = await validate(slug, canary);

  assert.ok(!result.errors.some((entry) => entry.code.startsWith('v21-method-overview')));
  assert.ok(!result.advisories.some((entry) => entry.code.startsWith('v21-method-overview')));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'));
  assert.match(canary, /^### 5\. 贡献全景与方法总览$/m);
  assert.match(canary, /^### 6\. GRPO 中组合 reward 的符号翻转$/m);
  assert.match(canary, /^### 11\. 结论链条$/m);
});

test('paper conclusions require natural-language descriptions without formulas', async () => {
  const markdown = v21Paper.replace('结论。', '方法把序列成本从 $O(T^2)$ 降为线性。');
  const result = await validate('v21-conclusion-math', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'conclusion-math'));
});

test('v2.1 notes require an explicit key figure decision', async () => {
  const markdown = v21Paper
    .replace('- Key figure decision: omit\n', '')
    .replace('- Key figure rationale: 测试材料没有高价值机制图，正文足以表达当前 fixture 的完整证据。\n', '');
  const result = await validate('v21-key-figure-decision', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-key-figure-decision'));
});

test('v2.1 notes reject an unknown key figure decision', async () => {
  const markdown = v21Paper.replace('- Key figure decision: omit', '- Key figure decision: defer');
  const result = await validate('v21-key-figure-decision-enum', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-key-figure-decision'));
});

test('v2.1 figure inclusion requires at least one local paper image', async () => {
  const markdown = v21Paper.replace('- Key figure decision: omit', '- Key figure decision: include');
  const result = await validate('v21-key-figure-include', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-key-figure-required'));
});

test('v2.1 figure omission requires a substantive rationale', async () => {
  const markdown = v21Paper.replace(
    '- Key figure rationale: 测试材料没有高价值机制图，正文足以表达当前 fixture 的完整证据。\n',
    '',
  );
  const result = await validate('v21-key-figure-omit', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-key-figure-rationale'));
});

test('v2.1 figure inclusion accepts a sourced local image', async () => {
  const markdown = v21Paper
    .replace('- Key figure decision: omit', '- Key figure decision: include')
    .replace(
      '- 结果：有效。',
      [
        '- 结果：有效。',
        '',
        '![Figure 1](/images/papers/v21-key-figure-valid/fig-1.png)',
        '',
        'Figure 1: result. Image Source: https://example.com/fig-1.png',
      ].join('\n'),
    );
  const result = await validate('v21-key-figure-valid', markdown);
  assert.ok(!result.errors.some((issue) => issue.code.startsWith('v21-key-figure')));
});

test('v2.1 figure omission accepts a rationale and no image', async () => {
  const result = await validate('v21-key-figure-omitted', v21Paper);
  assert.ok(!result.errors.some((issue) => issue.code.startsWith('v21-key-figure')));
});

test('v2.1 figure omission rejects a conflicting local image', async () => {
  const markdown = v21Paper.replace(
    '- 结果：有效。',
    [
      '- 结果：有效。',
      '',
      '![Figure 1](/images/papers/v21-key-figure-conflict/fig-1.png)',
      '',
      'Figure 1: result. Image Source: https://example.com/fig-1.png',
    ].join('\n'),
  );
  const result = await validate('v21-key-figure-conflict', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-key-figure-conflict'));
});

test('new notes cannot keep using the frozen v2 contract', async () => {
  const result = await validatePaperRecord({
    slug: 'new-v2-note',
    markdown: v2Paper,
    indexMarkdown: '- [note](/papers/new-v2-note/)',
    knownPaperSlugs: new Set(['new-v2-note']),
    imageExists: async () => true,
  });
  assert.ok(result.errors.some((issue) => issue.code === 'deprecated-workflow-version'));
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

test('all notes require a valid local review status', async () => {
  const missing = v21Paper.replace('Review-Status: pending\n', '');
  const missingResult = await validate('missing-paper-review-status', missing);
  assert.ok(missingResult.errors.some((issue) => issue.code === 'missing-paper-review-status'));

  const invalid = v21Paper.replace('Review-Status: pending', 'Review-Status: reviewed');
  const invalidResult = await validate('invalid-paper-review-status', invalid);
  assert.ok(invalidResult.errors.some((issue) => issue.code === 'paper-review-status'));
});

test('approved and needs-review states preserve the user review boundary', async () => {
  const approved = v21Paper.replace(
    'Review-Status: pending',
    'Review-Status: approved\nReviewed-At: 2026-07-17 09:32',
  );
  assert.deepEqual((await validate('approved-paper-review', approved)).errors, []);

  const staleApproved = approved.replace('Updated-At: 2026-07-17 09:31', 'Updated-At: 2026-07-17 09:33');
  assert.ok(
    (await validate('stale-approved-paper-review', staleApproved)).errors.some(
      (issue) => issue.code === 'paper-review-state-order',
    ),
  );

  const needsReview = v21Paper.replace(
    'Review-Status: pending',
    'Review-Status: needs-review\nReviewed-At: 2026-07-17 09:30',
  );
  assert.deepEqual((await validate('needs-paper-review', needsReview)).errors, []);

  const pendingWithDate = v21Paper.replace('Review-Status: pending', 'Review-Status: pending\nReviewed-At: 2026-07-17 09:30');
  assert.ok(
    (await validate('pending-paper-review-date', pendingWithDate)).errors.some(
      (issue) => issue.code === 'paper-reviewed-at',
    ),
  );
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

test('v2.1 notes require at least one known analysis module', async () => {
  const missing = v21Paper.replace('- Analysis modules: experiment\n', '');
  const missingResult = await validate('missing-v21-module', missing);
  assert.ok(missingResult.errors.some((issue) => issue.code === 'v21-analysis-modules'));

  const unknown = v21Paper.replace('Analysis modules: experiment', 'Analysis modules: experiment, unknown');
  const unknownResult = await validate('unknown-v21-module', unknown);
  assert.ok(unknownResult.errors.some((issue) => issue.code === 'v21-analysis-module'));
});

test('v2.1 notes reject duplicate analysis modules', async () => {
  const invalid = v21Paper.replace('Analysis modules: experiment', 'Analysis modules: experiment, experiment');
  const result = await validate('duplicate-v21-module', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-analysis-modules'));
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

test('paper notes reject internal canonical sources', async () => {
  const markdown = v2Paper.replace(
    'Canonical source: https://arxiv.org/abs/2607.00001',
    'Canonical source: /papers/source-paper/',
  );
  const result = await validate('internal-research-source', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-canonical-source'));
});

test('v2 access dates reject template placeholders', async () => {
  const invalid = v2Paper.replace('Accessed: 2026-07-10', 'Accessed: YYYY-MM-DD');
  const result = await validate('invalid-access-date', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-accessed-date'));
});

test('v2.1 source review status requires four valid fields', async () => {
  const missing = v21Paper.replace('; venue-status=arXiv preprint', '');
  const missingResult = await validate('missing-v21-review-status', missing);
  assert.ok(missingResult.errors.some((issue) => issue.code === 'v21-review-status'));

  const invalidDate = v21Paper.replace('observed-at=2026-07-17', 'observed-at=YYYY-MM-DD');
  const dateResult = await validate('invalid-v21-review-date', invalidDate);
  assert.ok(dateResult.errors.some((issue) => issue.code === 'v21-review-date'));

  const invalidType = v21Paper.replace('page-type=not-found', 'page-type=blog-post');
  const typeResult = await validate('invalid-v21-review-type', invalidType);
  assert.ok(typeResult.errors.some((issue) => issue.code === 'v21-review-page-type'));

  const invalidConfidence = v21Paper.replace('match-confidence=high', 'match-confidence=certain');
  const confidenceResult = await validate('invalid-v21-review-confidence', invalidConfidence);
  assert.ok(confidenceResult.errors.some((issue) => issue.code === 'v21-review-confidence'));
});

test('v2.1 requires a full review section only for official reviews', async () => {
  const official = v21Paper.replace('page-type=not-found', 'page-type=official-review');
  const missingResult = await validate('missing-official-review-section', official);
  assert.ok(missingResult.errors.some((issue) => issue.code === 'v21-official-review-section'));

  const complete = `${official}

## OpenReview / 审稿意见吸收

- Reviewer consensus: 问题重要。
- Main criticisms: 统计证据有限。
- Author response: 补充实验。
- 对可信度的影响: 核心结论保持，外推范围收缩。
`;
  const completeResult = await validate('complete-official-review-section', complete);
  assert.deepEqual(completeResult.errors, []);
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

test('v2.1 keeps evidence and narrow conclusions strict', async () => {
  const withoutEvidence = v21Paper.replace('- 证据定位：Section 4, Table 1.\n', '');
  const evidenceResult = await validate('missing-v21-evidence', withoutEvidence);
  assert.ok(evidenceResult.errors.some((issue) => issue.code === 'v2-evidence-location'));

  const withoutBoundary = v21Paper.replace('- 支持的最窄结论：仅支持当前评测设置中的结果。\n', '');
  const boundaryResult = await validate('missing-v21-boundary', withoutBoundary);
  assert.ok(boundaryResult.errors.some((issue) => issue.code === 'v2-result-narrow-conclusion'));
});

test('v2.1 experiment comparability starts as a canary advisory', async () => {
  const invalid = v21Paper.replace('- 对照是否可比：在相同设置下可比。\n', '');
  const result = await validate('v21-experiment-advisory', invalid);
  assert.deepEqual(result.errors, []);
  assert.ok(result.advisories.some((issue) => issue.code === 'v21-module-experiment'));
});

test('v2.1 module-specific fields start as bounded advisories', async () => {
  const system = v21Paper.replace('Analysis modules: experiment', 'Analysis modules: system');
  const result = await validate('v21-system-advisory', system);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.advisories.map((issue) => issue.code),
    ['v21-module-system', 'v21-module-system', 'v21-module-system'],
  );
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

test('paper figures require an existing local file', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/v2-note/fig-1.png)\n\nFigure 1: result. Image Source: https://example.com/fig-1.png',
  );
  const result = await validate('v2-note', markdown, { imageExists: async () => false });
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
  const result = await validate('commented-image', markdown, { imageExists: async () => false });
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
  const result = await validate('path-traversal', markdown, {
    imageExists: async () => {
      checkedFilesystem = true;
      return true;
    },
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

test('author aliases, sources, and representative papers must remain arrays', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      aliases: 'A. Example',
      sources: { label: 'Homepage', url: 'https://example.com/ada' },
      representativePapers: 'A Representative Paper',
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-aliases-shape'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-sources-shape'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-representative-papers-shape'));
});

test('author matchByName must remain boolean', () => {
  const profiles = [{ slug: 'ada-example', name: 'Ada Example', matchByName: 'false' }];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-match-by-name-shape'));
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

test('author representative papers accept the homepage-backed contract', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      homepage: 'https://example.com/ada',
      representativePapers: [
        {
          title: 'A Representative Paper',
          url: 'https://arxiv.org/abs/2601.00001',
          year: 2026,
          venue: 'Example Conference',
        },
      ],
      sources: [{ label: 'Homepage', url: 'https://example.com/ada' }],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(!result.errors.some((issue) => issue.code.startsWith('author-representative-paper')));
});

test('author representative papers require homepage evidence in sources', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      homepage: 'https://example.com/ada',
      representativePapers: [
        {
          title: 'A Representative Paper',
          url: 'https://arxiv.org/abs/2601.00001',
        },
      ],
      sources: [{ label: 'Paper', url: 'https://arxiv.org/abs/2601.00001' }],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-representative-papers-source'));
});

test('author representative papers reject missing provenance, malformed fields, and duplicates', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      representativePapers: [
        {
          title: '',
          url: 'invalid-paper',
          year: '2026',
          venue: '',
        },
        {
          title: 'Duplicate Paper',
          url: 'https://arxiv.org/abs/2601.00001',
        },
        {
          title: 'Duplicate Paper',
          url: 'https://arxiv.org/abs/2601.00002',
        },
      ],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  for (const code of [
    'author-representative-papers-homepage',
    'author-representative-paper-title',
    'author-representative-paper-url',
    'author-representative-paper-year',
    'author-representative-paper-venue',
    'author-representative-paper-duplicate',
  ]) {
    assert.ok(result.errors.some((issue) => issue.code === code), `Missing ${code}`);
  }
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
    assert.ok(paperReview.PAPER_REVIEW_STATUSES.includes(paper.reviewStatus));
    assert.ok(paper.coreSignal, `Missing core signal for ${paper.slug}`);
    assert.ok(paper.conclusion, `Missing conclusion for ${paper.slug}`);
    assert.match(paper.conclusionHtml, /^<p>[\s\S]*<\/p>\n$/);
    assert.ok(!paper.html.includes('id="一句话结论"'));
    assert.ok(!Object.hasOwn(paper, 'summary'));
  }

  assert.ok(
    !data.papers.some((paper) => paper.materialType === 'composite'),
    'Request-defined mainlines must stay outside generated paper data',
  );

  const regularPaper = data.papers.find((paper) => paper.slug === '2607.13988-trace-turn-level-reward-assignment');
  assert.ok(regularPaper, 'Missing regular-paper canary TRACE');
  assert.equal(regularPaper.materialType, 'research-paper');
  assert.ok(!Object.hasOwn(regularPaper, 'searchWindow'));
  assert.match(regularPaper.html, /id="source"/);
  for (const slug of ['nino-vieillard', 'gennady-pekhimenko', 'dongyang-ma-flashmemory']) {
    const author = data.authors.find((candidate) => candidate.slug === slug);
    assert.ok(author, `Missing generated author ${slug}`);
    assert.ok(author.paperCount > 0, `Expected ${slug} to have at least one linked paper`);
  }

  const xiWang = data.authors.find((author) => author.slug === 'xi-wang-jhu');
  assert.ok(xiWang, 'Missing the explicitly linked JHU Xi Wang profile');
  assert.deepEqual(xiWang.papers.map((paper) => paper.slug), ['2606.23525-self-compacting-language-model-agents']);
  assert.ok(!xiWang.coauthors.some((author) => author.name === 'Chao Jin'));

  const selfCompact = data.papers.find(
    (paper) => paper.slug === '2606.23525-self-compacting-language-model-agents',
  );
  const selfCompactXi = selfCompact.authorEntries.find((author) => author.slug === 'xi-wang-jhu');
  assert.equal(selfCompactXi?.name, 'Xi Wang');

  const megaScale = data.papers.find(
    (paper) => paper.slug === '2505.11432-megascale-moe-communication-efficient-training',
  );
  const megaScaleXi = megaScale.authorEntries.find((author) => author.name === 'Xi Wang');
  assert.equal(megaScale.authorEntries.length, 19);
  assert.deepEqual(megaScaleXi, { name: 'Xi Wang' });

  const triDao = data.authors.find((author) => author.slug === 'tri-dao');
  const triDaoPapers = new Set(triDao.papers.map((paper) => paper.slug));
  assert.ok(triDaoPapers.has('2205.14135-flashattention-io-aware-exact-attention'));
  assert.ok(triDaoPapers.has('2307.08691-flashattention-2-parallelism-work-partitioning'));
  assert.ok(!triDao.coauthors.some((author) => author.name === 'Keller Jordan'));
  assert.equal(triDao.representativePapers.length, 6);
  assert.deepEqual(triDao.representativePapers[0], {
    title: 'Marconi: Prefix Caching for the Era of Hybrid LLMs',
    url: 'https://arxiv.org/abs/2411.19379',
    year: 2025,
    venue: 'MLSys',
  });
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

test('the frozen v2 manifest matches every pre-v2.1 structured note', async () => {
  const [manifestSource, paperFiles] = await Promise.all([
    fs.readFile('internal/paper-workflow-v2-slugs.json', 'utf8'),
    fs.readdir('content/papers'),
  ]);
  const manifest = JSON.parse(manifestSource);
  const v2Slugs = [];
  for (const fileName of paperFiles.filter((name) => name.endsWith('.md'))) {
    const source = await fs.readFile(`content/papers/${fileName}`, 'utf8');
    if (/^- Workflow version: v2$/m.test(source)) v2Slugs.push(fileName.replace(/\.md$/, ''));
  }
  assert.deepEqual([...manifest.slugs].sort(), v2Slugs.sort());
});

test('the frozen method overview baseline matches current unmodified v2.1 migrations', async () => {
  const frozenCeiling = new Set([
    '2026-06-16-glm-5-2-long-horizon-tasks@2026-07-27 14:54',
    '2026-07-27-kimi-k3-open-frontier-intelligence@2026-07-28 11:47',
    '202607.1328-towards-long-horizon-agents-survey@2026-07-21 10:14',
    '2503.01840-eagle-3-training-time-test@2026-07-27 15:47',
    '2505.19645-moesd-sparse-moe-speculative-decoding@2026-07-24 14:20',
    '2601.16206-computer-environments-agentic-intelligence@2026-07-21 14:18',
    '2601.18734-self-distilled-reasoner-opsd@2026-07-28 15:34',
    '2601.19897-self-distillation-continual-learning@2026-07-29 10:39',
    '2603.00729-qwen3-coder-next-agentic-coding@2026-07-21 14:18',
    '2605.09539-tacomas-test-time-coevolution-mas@2026-07-22 11:03',
    '2605.10899-rubricem-rubric-guided-meta-rl@2026-07-22 17:16',
    '2605.26684-graphgpo-graph-credit-assignment-agentic-rl@2026-07-22 14:40',
    '2606.20954-lre-learned-relevance-eviction@2026-07-29 11:32',
    '2607.00151-smoothagent-lookahead-context-engineering@2026-07-29 13:35',
    '2607.02980-hils-attention-infinite-context@2026-07-21 14:18',
    '2607.04763-reopd-prefix-replay-agentic-distillation@2026-07-23 18:09',
    '2607.12696-ecospec-cost-aware-moe-speculative-decoding@2026-07-24 15:15',
    '2607.13988-trace-turn-level-reward-assignment@2026-07-22 15:28',
    '2607.14777-seed-self-evolving-on-policy-distillation@2026-07-23 16:10',
    '2607.18082-cripo-rubric-rl-self-distillation@2026-07-22 18:27',
  ]);
  const manifest = JSON.parse(
    await fs.readFile('internal/paper-workflow-method-overview-baseline.json', 'utf8'),
  );
  const records = await Promise.all(
    manifest.entries.map(async ({ slug }) => ({
      slug,
      markdown: await fs.readFile(`content/papers/${slug}.md`, 'utf8'),
    })),
  );
  const slugs = manifest.entries.map(({ slug }) => slug);

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.capturedAt, '2026-07-29 15:47');
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(!slugs.includes('2510.04474-drpo-decoupled-reward-policy-optimization'));
  assert.ok(!slugs.includes('2601.20802-reinforcement-learning-via-self-distillation'));
  for (const [index, entry] of manifest.entries.entries()) {
    assert.ok(frozenCeiling.has(`${entry.slug}@${entry.updatedAt}`));
    assert.match(records[index].markdown, /^- Workflow version: v2\.1$/m);
    assert.match(
      records[index].markdown,
      new RegExp(`^Updated-At: ${entry.updatedAt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'),
    );
  }
  assert.deepEqual(
    workflow.validateMethodOverviewBaseline({ records, manifest }).errors,
    [],
  );
  assert.deepEqual(
    [...workflow.methodOverviewBaselineCompatibilityMap(manifest)],
    manifest.entries.map(({ slug, updatedAt }) => [slug, updatedAt]),
  );
});

test('method overview baseline validation rejects stale, malformed, duplicate, missing, regressed, and post-capture entries', () => {
  const staleSlug = '2026-06-16-glm-5-2-long-horizon-tasks';
  const staleUpdatedAt = '2026-07-27 14:54';
  const stale = v21Paper
    .replace('First-Archived-At: 2026-07-17 09:30', 'First-Archived-At: 2026-06-16 09:30')
    .replace('Updated-At: 2026-07-17 09:31', `Updated-At: ${staleUpdatedAt}`);
  const regressedSlug = '2601.18734-self-distilled-reasoner-opsd';
  const regressedUpdatedAt = '2026-07-28 15:34';
  const regressed = v21Paper
    .replace('First-Archived-At: 2026-07-17 09:30', 'First-Archived-At: 2026-01-28 09:30')
    .replace('Updated-At: 2026-07-17 09:31', 'Updated-At: 2026-07-28 15:33')
    .replace('### 5. 贡献全景与方法总览', '### 5. 输入编码');
  const postCaptureSlug = '2503.01840-eagle-3-training-time-test';
  const postCapture = v21Paper
    .replace('First-Archived-At: 2026-07-17 09:30', 'First-Archived-At: 2026-07-29 15:48')
    .replace('Updated-At: 2026-07-17 09:31', 'Updated-At: 2026-07-29 15:47');
  const result = workflow.validateMethodOverviewBaseline({
    records: [
      { slug: staleSlug, markdown: stale },
      { slug: regressedSlug, markdown: regressed },
      { slug: postCaptureSlug, markdown: postCapture },
    ],
    manifest: {
      schemaVersion: 1,
      capturedAt: '2026-07-29 15:47',
      entries: [
        { slug: staleSlug, updatedAt: staleUpdatedAt },
        { slug: staleSlug, updatedAt: staleUpdatedAt },
        { slug: regressedSlug, updatedAt: regressedUpdatedAt },
        {
          slug: '202607.1328-towards-long-horizon-agents-survey',
          updatedAt: '2026-07-21 10:14',
        },
        { slug: postCaptureSlug, updatedAt: '2026-07-27 15:47' },
        { slug: '', updatedAt: 'invalid' },
      ],
    },
  });
  const codes = new Set(result.errors.map((entry) => entry.code));

  assert.ok(codes.has('v21-method-overview-baseline-stale'));
  assert.ok(codes.has('v21-method-overview-baseline-duplicate'));
  assert.ok(codes.has('v21-method-overview-baseline-entry'));
  assert.ok(codes.has('v21-method-overview-baseline-time-regression'));
  assert.ok(codes.has('v21-method-overview-baseline-capture-boundary'));
  assert.ok(
    workflow.validateMethodOverviewBaseline({ records: [], manifest: null }).errors.some(
      (entry) => entry.code === 'v21-method-overview-baseline-shape',
    ),
  );
  assert.ok(
    workflow.validateMethodOverviewBaseline({
      records: [],
      manifest: { schemaVersion: 2, capturedAt: '2026-07-29 15:48', entries: [] },
    }).errors.some((entry) => entry.code === 'v21-method-overview-baseline-metadata'),
  );
  assert.equal(
    workflow.methodOverviewBaselineCompatibilityMap({
      schemaVersion: 2,
      capturedAt: '2026-07-29 15:48',
      entries: [{ slug: staleSlug, updatedAt: staleUpdatedAt }],
    }).size,
    0,
  );
});

test('new papers cannot enter method overview compatibility mode', async () => {
  const slug = '2510.04474-drpo-decoupled-reward-policy-optimization';
  const markdown = v21Paper.replace('### 5. 贡献全景与方法总览', '### 5. 输入编码');
  const manifest = {
    schemaVersion: 1,
    capturedAt: '2026-07-29 15:47',
    entries: [{ slug, updatedAt: '2026-07-17 09:31' }],
  };
  const compatibilityMap = workflow.methodOverviewBaselineCompatibilityMap(manifest);
  const recordResult = await validate(slug, markdown, {
    methodOverviewBaseline: compatibilityMap,
  });
  const baselineResult = workflow.validateMethodOverviewBaseline({
    records: [{ slug, markdown }],
    manifest,
  });

  assert.equal(compatibilityMap.has(slug), false);
  assert.ok(recordResult.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
  assert.ok(
    baselineResult.errors.some(
      (entry) => entry.code === 'v21-method-overview-baseline-not-frozen',
    ),
  );
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

test('the maintenance exemption accepts canonical v2 and v2.1 review status lines', () => {
  assert.equal(typeof markdown.isPublicPaperMaintenanceExemption, 'function');
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- Page type: not-found'), true);
  assert.equal(
    markdown.isPublicPaperMaintenanceExemption?.(
      '- Review status: page-type=not-found; match-confidence=high; observed-at=2026-07-17; venue-status=arXiv preprint',
    ),
    true,
  );
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('-\n Page type: not-found'), false);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- Page type:\nnot-found'), false);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- Review status: page-type=not-found'), false);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- xConfidence: not-found'), false);
});

test('metadata CLI accepts the v2 not-found review classification', async () => {
  const canary = await fs.readFile('content/papers/2512.02556-deepseek-v3-2-open-large-language-models.md', 'utf8');
  assert.match(canary, /^- Page type: not-found$/m);

  const result = spawnSync(process.execPath, ['scripts/check-paper-metadata.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Paper metadata check passed\./);
});

test('the public template exposes the v2.1 seven-section contract', async () => {
  const template = await fs.readFile('content/utility/paper-note-template.md', 'utf8');
  for (const fieldName of [
    'Workflow version: v2.1',
    'Material type',
    'Analysis modules',
    'Key figure decision',
    'Key figure rationale',
    'Canonical source',
    'Responsible organization',
    'Published / updated',
    'Accessed',
    'Review status',
    'Review-Status: pending',
    '证据定位',
    '支持的最窄结论',
    '索引核心信号',
    '不使用公式或 TeX 数学定界符',
  ]) {
    assert.match(template, new RegExp(fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const heading of ['Source', '作者与关系', '一句话结论', '论文脉络', '关键实验/定理', '局限', '跨论文关系']) {
    assert.match(template, new RegExp(`^## ${heading}$`, 'm'));
  }
  assert.match(template, /贡献全景与方法总览/);
  assert.match(template, /^### 5\. 贡献全景与方法总览$/m);
  assert.match(template, /^### 6\. <第一关键阶段：按执行或论证依赖命名>$/m);
  assert.match(template, /^### 7\. 结论链条$/m);
  assert.doesNotMatch(template, /^### 5\.\d+\s/m);
  assert.match(template, /具体例子/);
  assert.match(template, /端到端执行链或论证链/);
  for (const requirement of [
    '起点、输入或初始条件',
    '关键阶段及其执行或依赖顺序',
    '阶段间传递的数据',
    '最终输出、训练信号或结论',
    '后文增加关键阶段',
    '### 5. 方法总览与完整机制',
  ]) {
    assert.match(template, new RegExp(requirement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(template, /直接证据/);
  assert.doesNotMatch(template, /^## Reference Intake Brief$/m);
});

test('the public template defines evidence-backed insight construction without a discussion bucket', async () => {
  const template = await fs.readFile('content/utility/paper-note-template.md', 'utf8');

  for (const requirement of ['认识更新', '证据与机制', '迁移与边界', '来源归因']) {
    assert.match(template, new RegExp(requirement));
  }
  assert.doesNotMatch(template, /^## 本地讨论补充$/m);
});

test('LRE keeps the three discussion insights in the canonical insight section', async () => {
  const canary = await fs.readFile(
    'content/papers/2606.20954-lre-learned-relevance-eviction.md',
    'utf8',
  );

  assert.doesNotMatch(canary, /^## 本地讨论补充$/m);

  const heading = '## 主要启发';
  const sectionStart = canary.indexOf(heading);
  assert.notEqual(sectionStart, -1, 'LRE must keep a 主要启发 section');

  const remainder = canary.slice(sectionStart + heading.length);
  const nextSectionOffset = remainder.search(/\n## /);
  const insights = nextSectionOffset === -1 ? remainder : remainder.slice(0, nextSectionOffset);

  assert.equal(
    insights.match(/^### \d+\. /gm)?.length,
    3,
    'LRE must keep exactly the three user insights',
  );
  for (const [number, concept] of [
    [1, '原文保真'],
    [2, '可观测代理'],
    [3, '时间距离'],
  ]) {
    assert.match(insights, new RegExp(`^### ${number}\\. .*${concept}`, 'm'));
  }
  assert.equal(
    insights.match(/证据定位/g)?.length,
    3,
    'each LRE insight must retain its own evidence location',
  );
  assert.match(insights, /实验没有覆盖数学推理/);
  assert.match(insights, /LoCoMo 的问题设置会主动查询跨 session 的旧事实，因此它可能放大远距离依赖/);
  assert.doesNotMatch(
    insights,
    /主动淘汰应单独评测|生产预算应覆盖完整输入|最有价值的下一组复验/,
  );
});

test('public workflow and agent instructions expose one aligned v2.1 contract', async () => {
  const workflowDoc = await fs.readFile('content/utility/paper-analysis-workflow.md', 'utf8');
  const synthesisWorkflow = await fs.readFile('content/utility/research-synthesis-workflow.md', 'utf8');
  const template = await fs.readFile('content/utility/paper-note-template.md', 'utf8');
  const agentInstructions = await fs.readFile('AGENTS.md', 'utf8');
  const authorSop = await fs.readFile('internal/author-x-account-search-sop.md', 'utf8');
  const maintenanceSop = await fs.readFile('internal/paper-archive-maintenance-sop.md', 'utf8');

  for (const snippet of [
    '| 简称 | 时间 | 核心信号 |',
    '索引核心信号',
    '论文删除与反向清理',
    '`orphan-author-profile`',
    '`data/paper-tags.json`',
    '`data/tag-taxonomy.json`',
    'Workflow version: v2.1',
    'Analysis modules',
    'Key figure decision',
    'Review-Status',
    'Reviewed-At',
    '五项人工语义门禁',
  ]) {
    assert.match(workflowDoc, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(workflowDoc, /从新到旧/);
  for (const document of [workflowDoc, template, agentInstructions]) {
    assert.match(document, /\/synthesis-workflow\//);
    assert.match(document, /\/mainline-template\//);
  }
  for (const snippet of [
    'Workflow version: synthesis-v1',
    'Material type: composite',
    'Analysis modules',
    'survey',
    'Responsible organization',
    'Search services',
    'Search window',
    '策略角色配置',
    'Review-Status: pending',
    '五项人工语义门禁',
  ]) {
    assert.match(synthesisWorkflow, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(agentInstructions, /核心信号/);
  assert.match(agentInstructions, /不使用公式、TeX 定界符/);
  assert.match(agentInstructions, /无剩余论文关联/);
  assert.match(agentInstructions, /Review-Status/);
  assert.match(agentInstructions, /Key figure rationale/);
  assert.match(agentInstructions, /论文脉络.*最重要的分析正文/);
  assert.match(agentInstructions, /具体例子/);
  assert.match(workflowDoc, /核心贡献与方法/);
  assert.match(workflowDoc, /阶段详解从 `### 6\.` 开始/);
  assert.match(agentInstructions, /阶段详解从 `### 6\.` 开始/);
  assert.match(maintenanceSop, /阶段详解从 `### 6\.` 开始/);
  assert.match(workflowDoc, /具体例子/);
  for (const document of [workflowDoc, template, agentInstructions, maintenanceSop]) {
    for (const requirement of ['认识更新', '证据与机制', '迁移与边界', '来源归因']) {
      assert.match(document, new RegExp(requirement));
    }
  }
  assert.match(workflowDoc, /`本地讨论补充` 同样退出 v2\.1 的正式结构/);
  assert.match(agentInstructions, /不再新增公开的 `本地讨论补充`/);
  assert.match(maintenanceSop, /不再新增公开的 `本地讨论补充`/);
  for (const document of [workflowDoc, template, agentInstructions, maintenanceSop]) {
    assert.match(document, /完整执行链|端到端/);
    assert.match(document, /不设统一字数/);
    assert.match(document, /训练信号/);
    assert.match(document, /失败条件|失败边界|成立边界/);
    assert.match(document, /贡献全景与方法总览/);
    assert.match(document, /方法总览与完整机制/);
    assert.match(document, /只(?:读|阅读)(?:本节|第 5 节)/);
  }
  for (const document of [workflowDoc, agentInstructions, maintenanceSop]) {
    assert.match(document, /paper-workflow-method-overview-baseline\.json/);
  }
  assert.match(maintenanceSop, /Key figure decision: include/);
  assert.match(maintenanceSop, /Key figure decision: omit/);
  assert.match(maintenanceSop, /Key figure rationale/);
  assert.match(maintenanceSop, /分析正文语义验收/);
  assert.match(maintenanceSop, /具体例子/);
  assert.doesNotMatch(agentInstructions, /`Reference Intake Brief`/);
  assert.match(authorSop, /不要求每位作者都创建 `data\/authors\.json` profile/);
  for (const document of [workflowDoc, template, agentInstructions, authorSop]) {
    assert.match(document, /作者顺序前两位/);
    assert.match(document, /共同一作/);
    assert.match(document, /通讯作者/);
    assert.match(document, /普通作者[^。\n]*复用已有 profile/);
  }
  assert.match(authorSop, /稳定学术来源本身只完成基础核验/);
  assert.match(authorSop, /只有已有强候选的深入核验作者进入 X 检查/);
  for (const document of [workflowDoc, template, agentInstructions, authorSop, maintenanceSop]) {
    assert.match(document, /representativePapers/);
  }
  assert.match(authorSop, /selected、representative、featured/);
  assert.match(authorSop, /不自动创建单篇论文笔记/);
});

test('TacoMAS keeps ordinary coauthors at paper level under the core-profile contract', async () => {
  const paper = await fs.readFile(
    'content/papers/2605.09539-tacomas-test-time-coevolution-mas.md',
    'utf8',
  );
  const profiles = JSON.parse(await fs.readFile('data/authors.json', 'utf8'));
  const authorsLine = paper.split('\n').find((line) => line.startsWith('- Authors:'));

  assert.ok(authorsLine);
  const linkedAuthors = [...authorsLine.matchAll(/\[([^\]]+)\]\(\/authors\/[^)]+\/\)/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(linkedAuthors, ['Chen Xu', 'Yicheng Hu', 'Xinyu Lin', 'Wenjie Wang']);
  for (const name of ['Ruizi Wang', 'Dongrui Liu', 'Fuli Feng']) assert.match(authorsLine, new RegExp(name));
  for (const slug of ['ruizi-wang-ustc', 'dongrui-liu', 'fuli-feng']) {
    assert.ok(!profiles.some((profile) => profile.slug === slug));
  }
});

test('deploy workflow validates source and builds the static site once', async () => {
  const source = await fs.readFile('.github/workflows/deploy.yml', 'utf8');
  const requiredCommands = [
    'npm run test:workflow',
    'npm run check:workflow',
    'npm run check:mainlines',
    'npm run check:metadata',
    'npm run test:search',
    'npm run test:pins',
    'node scripts/check-markdown-math.mjs',
    'node scripts/check-paper-site.mjs',
  ];

  for (const command of requiredCommands) {
    assert.match(source, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.equal(source.match(/npm run build\b/g)?.length, 1);
  assert.doesNotMatch(source, /npm run check:(?:math|site)/);
  assert.match(source, /runs-on: ubuntu-24\.04/);
  assert.match(source, /timeout-minutes: 10/);
  assert.doesNotMatch(source, /^\s*schedule:/m);
  assert.ok(source.indexOf('Validate source') < source.indexOf('Build and verify static site'));
  assert.ok(source.indexOf('Build and verify static site') < source.indexOf('Pack static artifact'));
});

test('topic routes live on the dedicated topics page', async () => {
  const [home, papers, topics, paperRow, paperPage, siteHeader, siteLib] = await Promise.all([
    fs.readFile('src/pages/index.astro', 'utf8'),
    fs.readFile('src/pages/papers/index.astro', 'utf8'),
    fs.readFile('src/pages/topics/index.astro', 'utf8'),
    fs.readFile('src/components/PaperRow.astro', 'utf8'),
    fs.readFile('src/pages/papers/[slug].astro', 'utf8'),
    fs.readFile('src/components/SiteHeader.astro', 'utf8'),
    fs.readFile('src/lib/site.ts', 'utf8'),
  ]);

  for (const source of [home, paperRow, paperPage]) {
    assert.match(source, /\/topics\/#tag-/);
    assert.doesNotMatch(source, /\/papers\/#tag-/);
  }
  assert.doesNotMatch(papers, /routeGroups|Topic Routes|id=\{`tag-/);
  assert.match(topics, /canonicalPath="\/topics\/"/);
  assert.ok(topics.includes('id={`tag-${route.id}`}'));
  assert.match(siteHeader, /id: 'topics', label: '主题'/);
  assert.match(siteLib, /topics: '\/topics\/'/);
});

test('paper detail metadata keeps source concise and topics in a separate badge row', async () => {
  const [paperPage, paperSearch, siteCss] = await Promise.all([
    fs.readFile('src/pages/papers/[slug].astro', 'utf8'),
    fs.readFile('src/lib/paper-search.mjs', 'utf8'),
    fs.readFile('src/styles/site.css', 'utf8'),
  ]);
  const paperMeta = paperPage.slice(
    paperPage.indexOf('<div class="paper-meta">'),
    paperPage.indexOf('</header>'),
  );

  assert.doesNotMatch(paperPage, /paper\.currentVersion/);
  assert.match(paperSearch, /paper\.currentVersion/);
  assert.match(paperMeta, /aria-label="论文状态与来源"/);
  assert.match(paperMeta, /class="paper-meta-line paper-meta-topics"[\s\S]*aria-label="论文主题"/);
  assert.equal(paperMeta.match(/class="paper-meta-line(?: paper-meta-topics)?"/g)?.length, 2);
  assert.ok(paperMeta.indexOf('paper-review-badge') < paperMeta.indexOf('paper-meta-topics'));
  assert.ok(paperMeta.indexOf('paper-meta-topics') < paperMeta.indexOf('paper.tags.map'));
  assert.ok(paperMeta.indexOf('paper.tags.map') < paperMeta.indexOf('paper-topic'));
  assert.doesNotMatch(paperMeta, />Topics</);
  assert.doesNotMatch(paperMeta, /paper-meta-label/);
  assert.doesNotMatch(siteCss, /\.paper-meta-label/);
});

test('research synthesis workflow and mainline template have public routes', async () => {
  const [page, templatePage, header, siteLib] = await Promise.all([
    fs.readFile('src/pages/synthesis-workflow/index.astro', 'utf8'),
    fs.readFile('src/pages/mainline-template/index.astro', 'utf8'),
    fs.readFile('src/components/ResearchSynthesisHeader.astro', 'utf8'),
    fs.readFile('src/lib/site.ts', 'utf8'),
  ]);
  const definition = repository.utilityPageDefinitions.find((entry) => entry.slug === 'synthesis-workflow');
  const templateDefinition = repository.utilityPageDefinitions.find((entry) => entry.slug === 'mainline-template');

  assert.equal(definition?.file, 'content/utility/research-synthesis-workflow.md');
  assert.equal(definition?.path, '/synthesis-workflow/');
  assert.match(page, /canonicalPath="\/synthesis-workflow\/"/);
  assert.match(page, /active="workflow"/);
  assert.equal(templateDefinition?.file, 'content/utility/research-mainline-template.md');
  assert.equal(templateDefinition?.path, '/mainline-template/');
  assert.match(templatePage, /canonicalPath="\/mainline-template\/"/);
  assert.match(header, /href=\{paths\.synthesisWorkflow\}/);
  assert.match(header, /主线综合 SOP/);
  assert.match(siteLib, /synthesisWorkflow: '\/synthesis-workflow\/'/);
  assert.match(siteLib, /mainlineTemplate: '\/mainline-template\/'/);
});

test('research mainlines expose request-defined article routes without the legacy graph system', async () => {
  const [page, detailPage, siteHeader, siteLib, layout] = await Promise.all([
    fs.readFile('src/pages/mainlines/index.astro', 'utf8'),
    fs.readFile('src/pages/mainlines/[id].astro', 'utf8'),
    fs.readFile('src/components/SiteHeader.astro', 'utf8'),
    fs.readFile('src/lib/site.ts', 'utf8'),
    fs.readFile('src/layouts/Layout.astro', 'utf8'),
  ]);
  const definition = repository.utilityPageDefinitions.find((entry) => entry.slug === 'mainlines');

  assert.equal(definition?.file, 'content/utility/research-mainlines.md');
  assert.equal(definition?.path, '/mainlines/');
  assert.match(page, /active="mainlines"/);
  assert.match(page, /canonicalPath="\/mainlines\/"/);
  assert.match(page, /mainline\.path/);
  for (const field of ['核心问题', '边界', '分类框架', '当前判断']) {
    assert.match(page, new RegExp(field));
  }
  assert.doesNotMatch(
    page,
    /data-mainline-(?:filters|search|select|role|row|clear)|URLSearchParams|applyFilters|role="search"/,
  );
  assert.doesNotMatch(page, /classification\.papers\.map|paperEntries/);

  assert.match(detailPage, /export function getStaticPaths/);
  assert.match(detailPage, /mainlineData\.mainlines/);
  assert.match(detailPage, /canonicalPath = mainline\.path/);
  assert.match(detailPage, /mainline\.html/);
  assert.match(detailPage, /schemaType: 'Article'/);
  assert.doesNotMatch(detailPage, /client:(?:load|idle|visible|only)/);
  await assert.rejects(fs.access('src/components/MainlineGraph.astro'));
  await assert.rejects(fs.access('src/components/MainlineMethodTable.astro'));
  await assert.rejects(fs.access('data/research-mainlines.json'));
  assert.match(siteHeader, /id: 'mainlines', label: '主线'/);
  assert.match(siteLib, /mainlines: '\/mainlines\/'/);
  assert.match(layout, /'mainlines'/);
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
