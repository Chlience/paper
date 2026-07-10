# Archive Time Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the archive's `当前收录` table sorted by first public month from newest to oldest.

**Architecture:** The Markdown table remains the single display source. `validateArchiveIndex` parses each valid month into a numeric key and rejects ascending transitions, while the existing rows are stably reordered once so equal-month rows retain their current order.

**Tech Stack:** Node.js ESM, `node:test`, Markdown source, Astro static build.

## Global Constraints

- Accept only the existing `YYYY年M月` time format.
- Order years and months from newest to oldest.
- Preserve source order for rows in the same month.
- Keep short titles, month values, and core signals unchanged.
- Add no browser-side sorting or interactive controls.
- Prefix every repository command with `rtk`.

---

### Task 1: Enforce and Apply Reverse Chronological Archive Order

**Files:**
- Modify: `scripts/check-paper-workflow.test.mjs:218-271`
- Modify: `scripts/content/paper-workflow.mjs:190-250`
- Modify: `content/utility/papers-index.md:13-119`
- Modify: `content/utility/paper-analysis-workflow.md:549-569`

**Interfaces:**
- Consumes: `validateArchiveIndex(indexMarkdown: string, knownPaperSlugs: Set<string>)`.
- Produces: validation issue code `index-time-order` on the first row that moves forward in time relative to the previous valid row.

- [ ] **Step 1: Write failing ordering tests**

Add these tests beside the existing archive-index tests:

```js
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
```

Extend the public-workflow contract test with:

```js
assert.match(workflowDoc, /从新到旧/);
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
rtk node --test --test-name-pattern="archive index requires reverse chronological month order|archive index allows stable ordering within the same month|public workflow documents index" scripts/check-paper-workflow.test.mjs
```

Expected: FAIL because `index-time-order` is absent and the workflow does not yet document `从新到旧`.

- [ ] **Step 3: Add the minimal month-order validator**

Add a local parser before `validateArchiveIndex`:

```js
const parseArchiveMonth = (value) => {
  const match = value.match(/^(\d{4})年([1-9]|1[0-2])月$/);
  return match ? Number(match[1]) * 12 + Number(match[2]) : null;
};
```

Inside `validateArchiveIndex`, initialize `let previousValidMonth = null;` before iterating rows. Replace the standalone month-format check with:

```js
const monthKey = parseArchiveMonth(monthCell.text);
if (monthKey === null) {
  errors.push(issue('index-time-format', subject, 'Archive index time must use YYYY年M月.'));
} else {
  if (previousValidMonth && monthKey > previousValidMonth.key) {
    errors.push(
      issue(
        'index-time-order',
        subject,
        `Archive index time must run newest to oldest; ${monthCell.text} appears after ${previousValidMonth.text}.`,
      ),
    );
  }
  previousValidMonth = { key: monthKey, text: monthCell.text };
}
```

- [ ] **Step 4: Run the focused tests and verify the code path**

Run:

```bash
rtk node --test --test-name-pattern="archive index requires reverse chronological month order|archive index allows stable ordering within the same month|public workflow documents index" scripts/check-paper-workflow.test.mjs
```

Expected: ordering tests PASS; the workflow-documentation assertion still FAILS.

- [ ] **Step 5: Stably reorder the real table**

Run this one-off Node script:

```bash
rtk node --input-type=module <<'NODE'
import fs from 'node:fs';

const file = 'content/utility/papers-index.md';
const source = fs.readFileSync(file, 'utf8');
const lines = source.split('\n');
const headerIndex = lines.indexOf('| 简称 | 时间 | 核心信号 |');
if (headerIndex < 0) throw new Error('Archive table header not found.');

const rowStart = headerIndex + 2;
let rowEnd = rowStart;
while (lines[rowEnd]?.startsWith('| ')) rowEnd += 1;

const rows = lines.slice(rowStart, rowEnd).map((line, sourceIndex) => {
  const match = line.match(/^\|[^|]*\|\s*(\d{4})年([1-9]|1[0-2])月\s*\|/);
  if (!match) throw new Error(`Invalid archive row time: ${line}`);
  return {
    line,
    sourceIndex,
    monthKey: Number(match[1]) * 12 + Number(match[2]),
  };
});

rows.sort((left, right) => right.monthKey - left.monthKey || left.sourceIndex - right.sourceIndex);
lines.splice(rowStart, rows.length, ...rows.map(({ line }) => line));
fs.writeFileSync(file, lines.join('\n'));
NODE
```

After the rewrite, inspect the diff:

```bash
rtk git diff -- content/utility/papers-index.md
```

Expected: only complete table rows move; row contents remain unchanged.

- [ ] **Step 6: Document the ordering contract**

In the workflow's `当前收录` field definition, extend the time rule to:

```markdown
2. **时间**：使用论文或材料首次公开月份，格式固定为 `YYYY年M月`；归档时间不进入这一列。表格按该月份从新到旧排列；同月条目保留现有相对顺序。
```

Update the quality checklist to require that `当前收录` is ordered by first public month from newest to oldest.

```markdown
- `content/utility/papers-index.md` 的 `当前收录` 是否与论文文件集合双向一致，按首次公开月份从新到旧排列，且每行包含简称、首次公开月份和索引核心信号。
```

- [ ] **Step 7: Run feature and integration verification**

Run:

```bash
rtk npm run test:workflow
rtk npm run build
rtk npm run check:site
rtk git diff --check
```

Expected: 0 failed tests, workflow and site checks pass, static build completes, and the diff check has no output.

- [ ] **Step 8: Commit the implementation**

Stage only the validator, tests, archive index, and workflow documentation. Commit with:

```text
feat: sort archive entries by first public month

feat: 按首次公开月份排序论文索引
```
