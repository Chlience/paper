import assert from 'node:assert/strict';
import test from 'node:test';
import * as workflow from './content/paper-workflow.mjs';
import {
  archiveIndex,
  archiveRow,
  legacyPaper,
  v2Paper,
} from './fixtures/paper-workflow.mjs';

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

