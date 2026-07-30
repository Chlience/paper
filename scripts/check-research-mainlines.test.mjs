import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import {
  REQUIRED_MAINLINE_HEADINGS,
  buildMainlineRecords,
  loadResearchMainlines,
  validateResearchMainlines,
} from './content/research-mainlines.mjs';

const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'paper-mainline-contract-'));
after(() => fs.rm(fixtureRoot, { recursive: true, force: true }));
await fs.mkdir(path.join(fixtureRoot, 'content', 'mainlines'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'content', 'papers'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'content', 'utility'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'data'), { recursive: true });
await fs.writeFile(path.join(fixtureRoot, 'content', 'papers', 'paper-a.md'), '# Paper A\n');
await fs.writeFile(path.join(fixtureRoot, 'content', 'papers', 'paper-b.md'), '# Paper B\n');
await fs.writeFile(path.join(fixtureRoot, 'content', 'utility', 'papers-index.md'), '# Index\n');
await fs.writeFile(path.join(fixtureRoot, 'data', 'paper-tags.json'), '{"papers":{}}\n');

const fixtureMarkdown = `# Test Direction

First-Archived-At: 2026-07-22 10:00
Updated-At: 2026-07-22 10:00
Review-Status: pending

## Source

- Workflow version: synthesis-v1
- Material type: composite
- Analysis modules: survey, system
- Responsible organization: Test Archive
- Search services: arXiv and official repositories
- Search window: 2026-01-01 至 2026-07-22 10:00 CST
- Research question: How does the direction evolve?
- Classification axes: mechanism；evidence source；deployment boundary
- Key figure decision: omit
- Key figure rationale: The comparison table carries the key evidence.
- Subjects: Agentic RL

### 检索与纳入协议

Include primary sources with a direct mechanism contribution; record exclusions.

## 综合判断

The direction has two experimentally distinct routes.

## 核心问题与边界

The scope covers language agents and excludes robotics.

## 分类框架

Classify by mechanism, signal, and boundary.

## 演进脉络

[Paper A](/papers/paper-a/) establishes the first route; [Paper B](/papers/paper-b/) extends it.

## 跨材料比较

| Material | Mechanism | Evidence |
| --- | --- | --- |
| Paper A | A | direct |
| Paper B | B | direct |

## 证据强度

| 结论 | 强度 | 原因 |
| --- | --- | --- |
| Route A works locally | 中 | one controlled experiment |

## 当前判断

Route B has the stronger deployment boundary.

## 开放问题

Cross-domain replication remains open.

## 局限

The evidence uses different benchmarks.

## 更新记录

- 2026-07-22: Created from an explicit synthesis request.
`;

const writeFixture = async (slug, markdown = fixtureMarkdown) => {
  await fs.writeFile(path.join(fixtureRoot, 'content', 'mainlines', `${slug}.md`), markdown);
  return loadResearchMainlines({ repoRoot: fixtureRoot });
};

test('a valid independent mainline contract builds article records and paper memberships', async () => {
  const entries = await writeFixture('test-direction');
  const result = await validateResearchMainlines(entries, { repoRoot: fixtureRoot });
  assert.deepEqual(result.errors, []);
  const [record] = buildMainlineRecords(entries);
  assert.equal(record.path, '/mainlines/test-direction/');
  assert.deepEqual(record.includedPaperSlugs, ['paper-a', 'paper-b']);
  assert.match(record.html, /id="检索与纳入协议"/);
  assert.doesNotMatch(record.html, /id="source"/);
});

test('mainline review metadata follows the pending and approved lifecycle', async () => {
  const approvedRevision = fixtureMarkdown
    .replace('Updated-At: 2026-07-22 10:00', 'Updated-At: 2026-07-22 10:01')
    .replace('Review-Status: pending', 'Review-Status: approved\nReviewed-At: 2026-07-22 10:00');
  assert.deepEqual(
    (
      await validateResearchMainlines(
        [{ slug: 'approved-revision', markdown: approvedRevision }],
        { repoRoot: fixtureRoot },
      )
    ).errors,
    [],
  );

  const approvedWithoutDate = fixtureMarkdown.replace('Review-Status: pending', 'Review-Status: approved');
  assert.ok(
    (
      await validateResearchMainlines(
        [{ slug: 'approved-without-date', markdown: approvedWithoutDate }],
        { repoRoot: fixtureRoot },
      )
    ).errors.some((item) => item.code === 'reviewed-at'),
  );

  const pendingWithDate = fixtureMarkdown.replace(
    'Review-Status: pending',
    'Review-Status: pending\nReviewed-At: 2026-07-22 10:00',
  );
  assert.ok(
    (
      await validateResearchMainlines(
        [{ slug: 'pending-with-date', markdown: pendingWithDate }],
        { repoRoot: fixtureRoot },
      )
    ).errors.some((item) => item.code === 'reviewed-at'),
  );

  const needsReview = fixtureMarkdown.replace(
    'Review-Status: pending',
    'Review-Status: needs-review\nReviewed-At: 2026-07-22 10:00',
  );
  assert.ok(
    (
      await validateResearchMainlines(
        [{ slug: 'needs-review-state', markdown: needsReview }],
        { repoRoot: fixtureRoot },
      )
    ).errors.some((item) => item.code === 'review-status'),
  );
});

test('mainline structure is synthesis-native and date windows stay internal', async () => {
  const dated = fixtureMarkdown.replace('# Test Direction', '# 2026 年 1—7 月 Test Direction');
  const entries = await writeFixture('2026-07-test-direction', dated);
  const codes = new Set((await validateResearchMainlines(entries, { repoRoot: fixtureRoot })).errors.map((item) => item.code));
  assert.ok(codes.has('stable-slug'));
  assert.ok(codes.has('stable-title'));

  const paperHeading = fixtureMarkdown.replace('## 综合判断', '## 作者与关系\n\nTest.\n\n## 综合判断');
  const paperEntries = await writeFixture('paper-shaped-direction', paperHeading);
  assert.ok(
    (await validateResearchMainlines(paperEntries, { repoRoot: fixtureRoot })).errors.some(
      (item) => item.code === 'paper-only-section',
    ),
  );
});

test('search protocol, comparison structure, conclusion evidence, and paper separation are hard boundaries', async () => {
  const broken = fixtureMarkdown
    .replace('### 检索与纳入协议', '### Notes')
    .replace('| Material | Mechanism | Evidence |', 'Materials are discussed in prose.')
    .replace('| --- | --- | --- |\n| Paper A | A | direct |\n| Paper B | B | direct |', '')
    .replace('| 结论 | 强度 | 原因 |\n| --- | --- | --- |\n| Route A works locally | 中 | one controlled experiment |', 'Evidence is described here.');
  const entries = await writeFixture('broken-contract', broken);
  const codes = new Set((await validateResearchMainlines(entries, { repoRoot: fixtureRoot })).errors.map((item) => item.code));
  assert.ok(codes.has('search-protocol'));
  assert.ok(codes.has('comparison-structure'));
  assert.ok(codes.has('evidence-per-conclusion'));

  await fs.writeFile(
    path.join(fixtureRoot, 'content', 'utility', 'papers-index.md'),
    '| Broken | 2026-07 | [link](/papers/broken-contract/) |\n',
  );
  assert.ok(
    (await validateResearchMainlines(entries, { repoRoot: fixtureRoot })).errors.some(
      (item) => item.code === 'paper-inventory-leak',
    ),
  );
});

test('the live corpus contains exactly the three confirmed migration targets and no Muon synthesis', async () => {
  const entries = await loadResearchMainlines();
  assert.deepEqual(
    entries.map((entry) => entry.slug).sort(),
    [
      'agentic-rl-learned-environment-evolution',
      'chinese-frontier-model-reports-timeline',
      'llm-agent-rl-credit-assignment',
    ],
  );
  assert.equal(REQUIRED_MAINLINE_HEADINGS.length, 11);
  assert.deepEqual((await validateResearchMainlines(entries)).errors, []);
});
