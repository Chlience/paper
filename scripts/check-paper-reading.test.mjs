import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePaperRecord, validateArchiveTimes } from './content/paper-workflow.mjs';
import { validateV21Compatibility } from './content/paper-reading-contract.mjs';
import { stripPublicPaperMaintenance, renderMarkdown } from './content/markdown.mjs';
import { v2Paper, v21Paper } from './fixtures/paper-workflow.mjs';
import { v3Paper, v3TheoryPaper, v3Insight } from './fixtures/paper-reading-v3.mjs';

const validate = (markdown, extra = {}) => validatePaperRecord({
  slug: 'reading-fixture', markdown,
  indexMarkdown: '[fixture](/papers/reading-fixture/)',
  knownPaperSlugs: new Set(['reading-fixture']),
  imageExists: async () => true,
  ...extra,
});
const hasError = (result, code) => result.errors.some((item) => item.code === code);
const reviewStatus = (type, confidence = 'not-applicable') => v3Paper.replace(
  'page-type=not-checked; match-confidence=not-applicable',
  `page-type=${type}; match-confidence=${confidence}`,
);
const addSourceField = (markdown, field) => markdown.replace('## 一句话结论', `${field}\n\n## 一句话结论`);

test('v3 system and theory canaries validate without enrichment or fixed narrative order', async () => {
  for (const markdown of [v3Paper, v3TheoryPaper]) {
    const result = await validate(markdown);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.advisories, []);
    assert.doesNotMatch(markdown, /作者可能的思考路径|首要贡献|辅助贡献/);
  }
});

test('v3 accepts numbered and unnumbered overviews with inline or nested detail', async () => {
  for (const heading of ['贡献与方法总览', '1. 贡献与方法总览', '5. 贡献全景与方法总览', '方法总览与完整机制']) {
    const source = v3Paper.replace('### 贡献与方法总览', `### ${heading}`);
    assert.deepEqual((await validate(source)).errors, []);
    assert.deepEqual((await validate(source.replace('#### 缓存为何保持结果\n', ''))).errors, []);
  }
});

test('v3 rejects empty, hidden and duplicate core sections', async () => {
  const limitation = '状态依赖、可变返回值或不完整缓存键会破坏等价性；该示意没有测量时间、内存和并发行为。';
  for (const body of ['', '<!-- 尚未读取 -->', '```md\n局限仅在示例代码中\n```', '### 尚待说明', '<只剩占位>']) {
    assert.ok(hasError(await validate(v3Paper.replace(limitation, body)), 'v3-core-section'), body);
  }
  assert.ok(hasError(await validate(`${v3Paper}\n## Source\n\n第二份来源。`), 'v3-core-section'));
});

test('v3 method entry must be visible and contain explanatory content', async () => {
  const heading = '### 贡献与方法总览';
  for (const hidden of ['> ' + heading, '<!--\n' + heading + '\n-->', '```md\n' + heading + '\n```']) {
    assert.ok(hasError(await validate(v3Paper.replace(heading, hidden)), 'v3-method-overview'));
  }
  assert.ok(hasError(await validate(v3Paper.replace(/(?<=### 贡献与方法总览\n)[\s\S]*?(?=### 问题与边界)/, '\n<!-- TODO -->\n')), 'v3-method-overview'));
});

test('v3 requires actual reading scope and rejects a blank field consuming the next line', async () => {
  for (const value of ['', 'TODO', '<sections read>', '<!-- full paper -->']) {
    const source = v3Paper.replace(/- Reading scope:[^\n]*/, `- Reading scope: ${value}`);
    assert.ok(hasError(await validate(source), 'v3-reading-scope'));
  }
  const source = v3Paper.replace(/- Title:[^\n]*/, '- Title:');
  assert.ok(hasError(await validate(source), 'v2-source-field'));
});

test('each v3 result requires observation, discrimination, locator and narrow conclusion', async () => {
  for (const field of ['证据定位', '观察', '判别性与局限', '支持的最窄结论']) {
    for (const value of ['', 'TODO', '<待填内容>', '<!-- only instructions -->']) {
      const source = v3Paper.replace(new RegExp(`- ${field}：[^\\n]+`), `- ${field}：${value}`);
      assert.ok(hasError(await validate(source), 'v3-evidence-field'), `${field}: ${value}`);
    }
  }
  const missingObservation = v3Paper.replace(/- 观察：[^\n]+\n/, '');
  assert.ok(hasError(await validate(missingObservation), 'v3-evidence-field'));
  assert.ok(hasError(await validate(missingObservation.replace('## 局限', '```md\n- 观察：隐藏观察\n```\n\n## 局限')), 'v3-evidence-field'));
});

test('v3 result checks cover every result and accept a single result without subheadings', async () => {
  assert.deepEqual((await validate(v3Paper.replace('### 相同键的重复调用可以复用解析结果\n', ''))).errors, []);
  const secondResult = v3Paper.replace('## 局限', '### 第二项结果\n\n- 观察：只有观察，缺少证据与边界。\n\n## 局限');
  assert.ok(hasError(await validate(secondResult), 'v3-evidence-field'));
});

test('v3 accepts explicitly unavailable evidence and avoids claiming semantic verification', async () => {
  const source = v3Paper.replace(/- 观察：[^\n]+/, '- 观察：Section 3 未披露性能测量。')
    .replace(/- 支持的最窄结论：[^\n]+/, '- 支持的最窄结论：该材料不足以判断实际时间收益。');
  assert.deepEqual((await validate(source)).errors, []);
  // A structural validator deliberately cannot prove a scientific attribution.
  const disputed = source.replace(/- 判别性与局限：[^\n]+/, '- 判别性与局限：这里的科学判断需要人工复核。');
  assert.deepEqual((await validate(disputed)).errors, []);
});

test('v3 optional insights accept one paragraph without numbering or a forced transfer', async () => {
  assert.deepEqual((await validate(v3Paper + v3Insight)).errors, []);
  assert.ok(hasError(await validate(v3Paper + v3Insight.replace('Section 2', '该来源')), 'v3-insight-evidence'));
  assert.ok(hasError(await validate(v3Paper + v3Insight.replace('### 缓存键需要覆盖决定结果的外部条件', '')), 'v3-insight-heading'));
});

test('v3 distinguishes unchecked, unmatched, inaccessible and inapplicable reviews', async () => {
  for (const type of ['not-checked', 'not-applicable']) {
    assert.deepEqual((await validate(reviewStatus(type))).errors, []);
  }
  for (const type of ['not-found', 'unavailable']) {
    assert.ok(hasError(await validate(reviewStatus(type)), 'v3-review-lookup'));
    const source = addSourceField(reviewStatus(type), '- Review lookup: 官方 API 按材料 ID 查询；该记录只表示本次未取得评审材料。');
    assert.deepEqual((await validate(source)).errors, []);
    assert.match(stripPublicPaperMaintenance(source), new RegExp(`page-type=${type}`));
  }
  assert.ok(hasError(await validate(reviewStatus('not-found', 'high')), 'v3-review-status'));
});

test('v3 observed review pages require matched source evidence and valid state metadata', async () => {
  for (const type of ['metadata-only', 'proceedings', 'commentary']) {
    assert.ok(hasError(await validate(reviewStatus(type, 'high')), 'v3-review-evidence'));
    const source = addSourceField(reviewStatus(type, 'high'), '- Review evidence: https://example.org/review/1；只读取此页元数据。');
    assert.deepEqual((await validate(source)).errors, []);
  }
  for (const source of [
    reviewStatus('unknown'),
    v3Paper.replace('observed-at=2026-09-05', 'observed-at=2026-02-30'),
    v3Paper.replace('venue-status=unknown', 'venue-status='),
    v3Paper.replace('venue-status=unknown', 'page-type=official-review; venue-status=unknown'),
  ]) assert.ok(hasError(await validate(source), 'v3-review-status'));
});

test('v3 decision-only review records read scope without requiring invented consensus', async () => {
  const source = reviewStatus('official-review', 'high');
  assert.ok(hasError(await validate(source), 'v3-official-review-field'));
  const review = `
## OpenReview / 审稿意见吸收

- 已读材料：仅 decision；未读取 individual reviews 与 rebuttal。
- 证据定位：https://example.org/review/decision
- 主要质疑：decision 没有披露具体质疑。
- 作者回应：未读取。
- 对结论的影响：只能确认 decision 内容，核心科学判断仍由正文证据支持。
`;
  assert.deepEqual((await validate(source + review)).errors, []);
  assert.ok(hasError(await validate(source + review.replace(/- 已读材料：[^\n]+/, '')), 'v3-official-review-field'));
});

test('new paper identities cannot downgrade to v2.1', async () => {
  assert.ok(hasError(await validate(v21Paper), 'deprecated-workflow-version'));
  assert.deepEqual((await validate(v21Paper, { v21PaperSlugs: new Set(['reading-fixture']) })).errors, []);
});

test('v2.1 compatibility rejects new, duplicate, migrated and malformed entries', () => {
  const slug = '2609.01343-smelt-compute-matched-moe-looped-transformers';
  const records = [{ slug, markdown: v21Paper.replace('Updated-At: 2026-07-17 09:31', 'Updated-At: 2026-09-04 09:07') }];
  const manifest = { capturedAt: '2026-09-05', slugs: [slug] };
  assert.deepEqual(validateV21Compatibility({ manifest, records }).errors, []);
  for (const invalid of [null, { ...manifest, capturedAt: '2026-09-06' }, { ...manifest, slugs: 'all' }]) {
    assert.ok(validateV21Compatibility({ manifest: invalid, records }).errors.length);
  }
  for (const slugs of [['new-paper'], [slug, slug], [null]]) {
    assert.ok(validateV21Compatibility({ manifest: { ...manifest, slugs }, records }).errors.length);
  }
  assert.ok(validateV21Compatibility({ manifest, records: [{ slug, markdown: v3Paper }] }).errors.length);
  assert.ok(validateV21Compatibility({ manifest, records: [] }).errors.length);
  assert.ok(hasError(validateV21Compatibility({ manifest, records: [{ slug, markdown: v21Paper }] }), 'v21-migration-required'));
  assert.deepEqual(validateV21Compatibility({ manifest: { ...manifest, slugs: [] }, records: [] }).errors, []);
});

test('v3 retains review history and source rendering and allows real minute ties', async () => {
  const source = v3Paper.replace('Review-Status: pending', 'Review-Status: approved\nReviewed-At: 2026-09-05 09:01')
    .replace('Updated-At: 2026-09-05 09:00', 'Updated-At: 2026-09-05 09:02');
  assert.deepEqual((await validate(source)).errors, []);
  const rendered = renderMarkdown(stripPublicPaperMaintenance(source));
  assert.match(rendered, /Reading scope/);
  assert.match(rendered, /page-type=not-checked/);
  assert.match(rendered, /判别性与局限/);
  const times = validateArchiveTimes([{ slug: 'one', markdown: v3Paper }, { slug: 'two', markdown: v3Paper }]);
  assert.deepEqual(times.errors, []);
  assert.deepEqual(times.advisories, []);
  const mixed = validateArchiveTimes([
    { slug: 'old', markdown: v2Paper },
    { slug: 'new', markdown: v3Paper.replaceAll('2026-09-05 09:00', '2026-07-10 09:30') },
  ]);
  assert.deepEqual(mixed.errors, []);
  assert.deepEqual(mixed.advisories, []);
});


test('v3 retains module selection and local figure provenance checks', async () => {
  assert.ok(hasError(await validate(v3Paper.replace('Analysis modules: docs, system', 'Analysis modules: unknown')), 'v21-analysis-module'));
  const include = v3Paper.replace('Key figure decision: omit', 'Key figure decision: include');
  assert.ok(hasError(await validate(include), 'v21-key-figure-required'));
  const image = '\n![Cache](/images/papers/reading-fixture/cache.png)\n\nImage Source: https://example.org/parse-cache/v1#figure\n';
  assert.deepEqual((await validate(include + image)).errors, []);
  assert.ok(hasError(await validate(include + image, { imageExists: async () => false }), 'missing-image-file'));
  assert.ok(hasError(await validate(v3Paper + image), 'v21-key-figure-conflict'));
  assert.ok(hasError(await validate(include + image.replace('Image Source:', 'Caption:')), 'missing-image-source'));
});
