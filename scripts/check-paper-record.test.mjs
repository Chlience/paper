import assert from 'node:assert/strict';
import test from 'node:test';
import * as workflow from './content/paper-workflow.mjs';
import {
  legacyPaper,
  v2Paper,
  v21CoreBody,
  v21Paper,
  validatePaperFixture,
} from './fixtures/paper-workflow.mjs';

const { validatePaperRecord } = workflow;

test('exports the v2.1 analysis module taxonomy', () => {
  assert.deepEqual(
    [...workflow.ANALYSIS_MODULES],
    ['experiment', 'system', 'theory', 'model-report', 'survey', 'safety', 'docs'],
  );
});

test('exports the canonical method overview headings for downstream checks', () => {
  assert.equal(workflow.MULTI_STAGE_METHOD_OVERVIEW_HEADING, '贡献全景与方法总览');
  assert.equal(workflow.SINGLE_STAGE_METHOD_OVERVIEW_HEADING, '方法总览与完整机制');
});

test('legacy notes accept internal sources and report migration advisories', async () => {
  const result = await validatePaperFixture('legacy-note', legacyPaper);
  assert.deepEqual(result.errors, []);
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-source-snapshot'));
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-time-format'));
});

test('the default v2 contract validates without errors', async () => {
  const result = await validatePaperFixture('v2-note', v2Paper);
  assert.deepEqual(result.errors, []);
});

test('the default v2.1 canary validates with seven core sections', async () => {
  const result = await validatePaperFixture('v21-note', v21Paper);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.advisories, []);
  assert.doesNotMatch(v21Paper, /Reference Intake Brief/);
  assert.doesNotMatch(v21Paper, /^## OpenReview \/ 审稿意见吸收$/m);
});

test('v2.1 paper rejects detailed stages without the required section 5 overview heading', async () => {
  const markdown = v21Paper.replace('### 5. 贡献全景与方法总览', '### 5. 输入编码');
  const result = await validatePaperFixture('v21-method-overview-heading', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-overview-heading'));
});

test('v2.1 paper checks the section 5 overview independently from later method detail', async () => {
  const markdown = v21Paper.replace(
    /首要贡献由三个阶段组成，执行顺序[\s\S]+?当前实验条件下成立。/,
    '本文给出核心贡献，详细输入、操作、传递对象、训练信号、设计理由、直接证据和失败边界见下一节。',
  );
  const result = await validatePaperFixture('v21-method-overview-chain', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-chain'));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'));
});

test('unchanged v2.1 migration baselines downgrade method overview gaps to advisories', async () => {
  const slug = 'v21-method-overview-baseline';
  const markdown = v21Paper.replace('### 5. 贡献全景与方法总览', '### 5. 输入编码');
  const result = await validatePaperFixture(slug, markdown, {
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
  const result = await validatePaperFixture(slug, markdown, {
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
  const result = await validatePaperFixture('v21-single-stage-method-overview', markdown);

  assert.ok(!result.errors.some((entry) => entry.code.startsWith('v21-method-overview')));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'));
});

test('v2.1 method overviews require an explicit primary contribution', async () => {
  const markdown = v21Paper.replace(
    /首要贡献由三个阶段组成[^。]+。/,
    '方法包含三个阶段，执行顺序为输入编码、核心变换和训练目标构造；辅助贡献提供接口诊断并支撑各阶段的独立验证。',
  );
  const result = await validatePaperFixture('v21-method-overview-contribution', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-chain'));
});

test('HTML comments cannot satisfy method overview signals', async () => {
  const markdown = v21Paper.replace(
    /(?<=### 5\. 贡献全景与方法总览\n\n)[\s\S]+?(?=\n\n### 6\. 核心变换与训练信号)/,
    '<!-- 首要贡献与辅助贡献相互支撑。输入进入阶段流程，执行核心操作并传递对象，最终输出训练信号；该阶段的作用用于解决问题。 -->',
  );
  const result = await validatePaperFixture('v21-hidden-method-overview', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-chain'));
});

test('v2.1 paper requires multi-stage overviews to promote their detail sections', async () => {
  const markdown = v21Paper.replace(
    /### 6\. 核心变换与训练信号[\s\S]+?(?=\n### 7\. 结论链)/,
    '',
  );
  const result = await validatePaperFixture('v21-multi-stage-overview-mode', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-mode'));
});

test('v2.1 paper keeps single-stage mechanisms inside section 5', async () => {
  const markdown = v21Paper.replace(
    '### 5. 贡献全景与方法总览',
    '### 5. 方法总览与完整机制',
  );
  const result = await validatePaperFixture('v21-single-stage-overview-mode', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-mode'));
});

test('fenced headings cannot satisfy the v2.1 method overview contract', async () => {
  const markdown = v21Paper
    .replace('### 5. 贡献全景与方法总览', '### 5. 输入编码')
    .replace(
      '### 6. 核心变换与训练信号',
      '```markdown\n### 5. 贡献全景与方法总览\n```\n\n### 6. 核心变换与训练信号',
    );
  const result = await validatePaperFixture('v21-fenced-method-overview', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
});

test('nested blockquote headings cannot satisfy the v2.1 method overview contract', async () => {
  const markdown = v21Paper.replace(
    '### 5. 贡献全景与方法总览',
    '> ### 5. 贡献全景与方法总览',
  );
  const result = await validatePaperFixture('v21-blockquote-method-overview', markdown);

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
    const result = await validatePaperFixture('v21-commented-method-overview', markdown);

    assert.ok(result.errors.some((entry) => entry.code === 'v21-method-overview-heading'));
  }
});

test('v2.1 paper rejects a method wrapper around nested 5.x headings', async () => {
  const markdown = v21Paper.replace(
    '### 5. 贡献全景与方法总览',
    '### 5. 贡献全景与方法总览\n\n#### 5.1 输入编码',
  );
  const result = await validatePaperFixture('v21-method-wrapper-heading', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-method-wrapper-heading'));
});

test('v2.1 paper rejects hierarchical or discontinuous paper-context numbering', async () => {
  const markdown = v21Paper.replace(
    '### 6. 核心变换与训练信号',
    '### 5.2 核心变换与训练信号',
  );
  const result = await validatePaperFixture('v21-paper-context-heading-sequence', markdown);

  assert.ok(result.errors.some((entry) => entry.code === 'v21-paper-context-heading-sequence'));
});

test('v2.1 paper receives an advisory when the method narrative omits stage-level detail', async () => {
  const markdown = v21Paper.replace(
    /### 6\. 核心变换与训练信号[\s\S]+?(?=\n### 7\. 结论链)/,
    '### 6. 核心变换与训练信号\n\n本节展开第二阶段。',
  );
  const result = await validatePaperFixture('v21-method-detail-narrative', markdown);

  assert.equal(
    result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'),
    true,
  );
});

test('paper conclusions require natural-language descriptions without formulas', async () => {
  const markdown = v21Paper.replace('结论。', '方法把序列成本从 $O(T^2)$ 降为线性。');
  const result = await validatePaperFixture('v21-conclusion-math', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'conclusion-math'));
});

test('v2.1 notes require an explicit key figure decision', async () => {
  const markdown = v21Paper
    .replace('- Key figure decision: omit\n', '')
    .replace('- Key figure rationale: 测试材料没有高价值机制图，正文足以表达当前 fixture 的完整证据。\n', '');
  const result = await validatePaperFixture('v21-key-figure-decision', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-key-figure-decision'));
});

test('v2.1 notes reject an unknown key figure decision', async () => {
  const markdown = v21Paper.replace('- Key figure decision: omit', '- Key figure decision: defer');
  const result = await validatePaperFixture('v21-key-figure-decision-enum', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-key-figure-decision'));
});

test('v2.1 figure inclusion requires at least one local paper image', async () => {
  const markdown = v21Paper.replace('- Key figure decision: omit', '- Key figure decision: include');
  const result = await validatePaperFixture('v21-key-figure-include', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-key-figure-required'));
});

test('v2.1 figure omission requires a substantive rationale', async () => {
  const markdown = v21Paper.replace(
    '- Key figure rationale: 测试材料没有高价值机制图，正文足以表达当前 fixture 的完整证据。\n',
    '',
  );
  const result = await validatePaperFixture('v21-key-figure-omit', markdown);
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
  const result = await validatePaperFixture('v21-key-figure-valid', markdown);
  assert.ok(!result.errors.some((issue) => issue.code.startsWith('v21-key-figure')));
});

test('v2.1 figure omission accepts a rationale and no image', async () => {
  const result = await validatePaperFixture('v21-key-figure-omitted', v21Paper);
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
  const result = await validatePaperFixture('v21-key-figure-conflict', markdown);
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
  const result = await validatePaperFixture('unsupported-workflow-version', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'unsupported-workflow-version'));
});

test('v2 notes require minute-precision archive timestamps', async () => {
  const invalid = v2Paper.replace('2026-07-10 09:30', '2026-07-10 9:30 CST');
  const result = await validatePaperFixture('invalid-v2-time', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-time-format'));
});

test('v2 notes reject an update time before the archive time', async () => {
  const invalid = v2Paper.replace('Updated-At: 2026-07-10 09:31', 'Updated-At: 2026-07-10 09:29');
  const result = await validatePaperFixture('invalid-v2-time-order', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-time-order'));
});

test('all notes require an explicit Updated-At field', async () => {
  const invalid = legacyPaper.replace('Updated-At: 2026-07-03 09:03 CST\n', '');
  const result = await validatePaperFixture('missing-updated-time', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-archive-time'));
});

test('all notes require a valid local review status', async () => {
  const missing = v21Paper.replace('Review-Status: pending\n', '');
  const missingResult = await validatePaperFixture('missing-paper-review-status', missing);
  assert.ok(missingResult.errors.some((issue) => issue.code === 'missing-paper-review-status'));

  const invalid = v21Paper.replace('Review-Status: pending', 'Review-Status: reviewed');
  const invalidResult = await validatePaperFixture('invalid-paper-review-status', invalid);
  assert.ok(invalidResult.errors.some((issue) => issue.code === 'paper-review-status'));
});

test('approved revisions preserve status while invalid review metadata is rejected', async () => {
  const approved = v21Paper.replace(
    'Review-Status: pending',
    'Review-Status: approved\nReviewed-At: 2026-07-17 09:32',
  );
  assert.deepEqual((await validatePaperFixture('approved-paper-review', approved)).errors, []);

  const revisedApproved = approved.replace('Updated-At: 2026-07-17 09:31', 'Updated-At: 2026-07-17 09:33');
  assert.deepEqual(
    (await validatePaperFixture('revised-approved-paper-review', revisedApproved)).errors,
    [],
  );

  const approvedWithoutDate = v21Paper.replace('Review-Status: pending', 'Review-Status: approved');
  assert.ok(
    (await validatePaperFixture('approved-paper-review-without-date', approvedWithoutDate)).errors.some(
      (issue) => issue.code === 'paper-reviewed-at',
    ),
  );

  const needsReview = v21Paper.replace(
    'Review-Status: pending',
    'Review-Status: needs-review\nReviewed-At: 2026-07-17 09:30',
  );
  assert.ok(
    (await validatePaperFixture('needs-paper-review', needsReview)).errors.some(
      (issue) => issue.code === 'paper-review-status',
    ),
  );

  const pendingWithDate = v21Paper.replace('Review-Status: pending', 'Review-Status: pending\nReviewed-At: 2026-07-17 09:30');
  assert.ok(
    (await validatePaperFixture('pending-paper-review-date', pendingWithDate)).errors.some(
      (issue) => issue.code === 'paper-reviewed-at',
    ),
  );
});

test('v2 timestamps must represent real calendar minutes', async () => {
  const invalid = v2Paper.replace('2026-07-10 09:30', '2026-99-99 99:99');
  const result = await validatePaperFixture('invalid-calendar-time', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-time-format'));
});

test('v2 notes require a complete source snapshot', async () => {
  const invalid = v2Paper.replace('- Canonical source: https://arxiv.org/abs/2607.00001\n', '');
  const result = await validatePaperFixture('invalid-v2-source', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-source-field'));
});

test('v2 notes restrict material type to the supported taxonomy', async () => {
  const invalid = v2Paper.replace('Material type: research-paper', 'Material type: notebook');
  const result = await validatePaperFixture('invalid-v2-material', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-material-type'));
});

test('v2.1 notes require at least one known analysis module', async () => {
  const missing = v21Paper.replace('- Analysis modules: experiment\n', '');
  const missingResult = await validatePaperFixture('missing-v21-module', missing);
  assert.ok(missingResult.errors.some((issue) => issue.code === 'v21-analysis-modules'));

  const unknown = v21Paper.replace('Analysis modules: experiment', 'Analysis modules: experiment, unknown');
  const unknownResult = await validatePaperFixture('unknown-v21-module', unknown);
  assert.ok(unknownResult.errors.some((issue) => issue.code === 'v21-analysis-module'));
});

test('v2.1 notes reject duplicate analysis modules', async () => {
  const invalid = v21Paper.replace('Analysis modules: experiment', 'Analysis modules: experiment, experiment');
  const result = await validatePaperFixture('duplicate-v21-module', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v21-analysis-modules'));
});

test('v2 notes require a resolvable canonical source', async () => {
  const invalid = v2Paper.replace(
    'Canonical source: https://arxiv.org/abs/2607.00001',
    'Canonical source: unavailable',
  );
  const result = await validatePaperFixture('invalid-v2-canonical-source', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-canonical-source'));
});

test('v2 canonical sources accept a Markdown link to an absolute URL', async () => {
  const markdown = v2Paper.replace(
    'Canonical source: https://arxiv.org/abs/2607.00001',
    'Canonical source: [arXiv](https://arxiv.org/abs/2607.00001)',
  );
  const result = await validatePaperFixture('markdown-canonical-source', markdown);
  assert.deepEqual(result.errors, []);
});

test('paper notes reject internal canonical sources', async () => {
  const markdown = v2Paper.replace(
    'Canonical source: https://arxiv.org/abs/2607.00001',
    'Canonical source: /papers/source-paper/',
  );
  const result = await validatePaperFixture('internal-research-source', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-canonical-source'));
});

test('v2 access dates reject template placeholders', async () => {
  const invalid = v2Paper.replace('Accessed: 2026-07-10', 'Accessed: YYYY-MM-DD');
  const result = await validatePaperFixture('invalid-access-date', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-accessed-date'));
});

test('v2.1 source review status requires four valid fields', async () => {
  const missing = v21Paper.replace('; venue-status=arXiv preprint', '');
  const missingResult = await validatePaperFixture('missing-v21-review-status', missing);
  assert.ok(missingResult.errors.some((issue) => issue.code === 'v21-review-status'));

  const invalidDate = v21Paper.replace('observed-at=2026-07-17', 'observed-at=YYYY-MM-DD');
  const dateResult = await validatePaperFixture('invalid-v21-review-date', invalidDate);
  assert.ok(dateResult.errors.some((issue) => issue.code === 'v21-review-date'));

  const invalidType = v21Paper.replace('page-type=not-found', 'page-type=blog-post');
  const typeResult = await validatePaperFixture('invalid-v21-review-type', invalidType);
  assert.ok(typeResult.errors.some((issue) => issue.code === 'v21-review-page-type'));

  const invalidConfidence = v21Paper.replace('match-confidence=high', 'match-confidence=certain');
  const confidenceResult = await validatePaperFixture('invalid-v21-review-confidence', invalidConfidence);
  assert.ok(confidenceResult.errors.some((issue) => issue.code === 'v21-review-confidence'));
});

test('v2.1 requires a full review section only for official reviews', async () => {
  const official = v21Paper.replace('page-type=not-found', 'page-type=official-review');
  const missingResult = await validatePaperFixture('missing-official-review-section', official);
  assert.ok(missingResult.errors.some((issue) => issue.code === 'v21-official-review-section'));

  const complete = `${official}

## OpenReview / 审稿意见吸收

- Reviewer consensus: 问题重要。
- Main criticisms: 统计证据有限。
- Author response: 补充实验。
- 对可信度的影响: 核心结论保持，外推范围收缩。
`;
  const completeResult = await validatePaperFixture('complete-official-review-section', complete);
  assert.deepEqual(completeResult.errors, []);
});

test('v2 review dates reject template placeholders', async () => {
  const invalid = v2Paper.replace('Observed at: 2026-07-10', 'Observed at: YYYY-MM-DD');
  const result = await validatePaperFixture('invalid-review-date', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-review-date'));
});

test('all notes require non-empty core sections', async () => {
  const invalid = legacyPaper.replace('## 局限', '### 局限');
  const result = await validatePaperFixture('invalid-core-section', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-core-section'));
});

test('all notes require archive and update timestamps', async () => {
  const invalid = legacyPaper
    .replace('First-Archived-At: 2026-07-03 09:03 CST\n', '')
    .replace('Updated-At: 2026-07-03 09:03 CST\n', '');
  const result = await validatePaperFixture('missing-times', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-archive-time'));
});

test('all notes require a traceable source link', async () => {
  const invalid = legacyPaper.replace(
    '- Local archive: [source](/papers/source-paper/)',
    '- Source status: unavailable',
  );
  const result = await validatePaperFixture('invalid-source-link', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-source-link'));
});

test('traceable source links must be valid absolute URLs', async () => {
  const invalid = legacyPaper.replace(
    '- Local archive: [source](/papers/source-paper/)',
    '- Source: https://?',
  );
  const result = await validatePaperFixture('invalid-absolute-source', invalid);
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
  const result = await validatePaperFixture('placeholder-note', `${legacyPaper}\n- \n`);
  assert.ok(result.errors.some((issue) => issue.code === 'template-placeholder'));
});

test('v2 result blocks require evidence locations', async () => {
  const invalid = v2Paper.replace('- 证据定位：Section 4, Table 1.\n', '');
  const result = await validatePaperFixture('invalid-v2-evidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 result blocks require a comparability assessment', async () => {
  const invalid = v2Paper.replace('- 对照是否可比：在相同设置下可比。', '- 对照是否可比：');
  const result = await validatePaperFixture('missing-v2-comparability', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-result-comparability'));
});

test('v2 result blocks require a narrowest supported conclusion', async () => {
  const invalid = v2Paper.replace('- 支持的最窄结论：仅支持当前评测设置中的结果。', '- 支持的最窄结论：');
  const result = await validatePaperFixture('missing-v2-narrow-conclusion', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-result-narrow-conclusion'));
});

test('v2.1 keeps evidence and narrow conclusions strict', async () => {
  const withoutEvidence = v21Paper.replace('- 证据定位：Section 4, Table 1.\n', '');
  const evidenceResult = await validatePaperFixture('missing-v21-evidence', withoutEvidence);
  assert.ok(evidenceResult.errors.some((issue) => issue.code === 'v2-evidence-location'));

  const withoutBoundary = v21Paper.replace('- 支持的最窄结论：仅支持当前评测设置中的结果。\n', '');
  const boundaryResult = await validatePaperFixture('missing-v21-boundary', withoutBoundary);
  assert.ok(boundaryResult.errors.some((issue) => issue.code === 'v2-result-narrow-conclusion'));
});

test('v2.1 experiment comparability starts as a canary advisory', async () => {
  const invalid = v21Paper.replace('- 对照是否可比：在相同设置下可比。\n', '');
  const result = await validatePaperFixture('v21-experiment-advisory', invalid);
  assert.deepEqual(result.errors, []);
  assert.ok(result.advisories.some((issue) => issue.code === 'v21-module-experiment'));
});

test('v2.1 module-specific fields start as bounded advisories', async () => {
  const system = v21Paper.replace('Analysis modules: experiment', 'Analysis modules: system');
  const result = await validatePaperFixture('v21-system-advisory', system);
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
  const result = await validatePaperFixture('english-result-heading', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 evidence locations reject unresolved placeholders', async () => {
  const invalid = v2Paper.replace('证据定位：Section 4, Table 1.', '证据定位：TODO');
  const result = await validatePaperFixture('placeholder-evidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 evidence locations reject words that only begin with a locator abbreviation', async () => {
  const invalid = v2Paper.replace('证据定位：Section 4, Table 1.', '证据定位：pending');
  const result = await validatePaperFixture('prefix-only-evidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 evidence locations reject incomplete URLs', async () => {
  const invalid = v2Paper.replace('证据定位：Section 4, Table 1.', '证据定位：https://');
  const result = await validatePaperFixture('incomplete-url-evidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-evidence-location'));
});

test('v2 notes require review classification fields', async () => {
  const invalid = v2Paper.replace('- Page type: not-found\n', '');
  const result = await validatePaperFixture('invalid-v2-review-fields', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-review-field'));
});

test('v2 notes restrict review page type to the supported taxonomy', async () => {
  const invalid = v2Paper.replace('Page type: not-found', 'Page type: blog-post');
  const result = await validatePaperFixture('invalid-v2-review-type', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-review-page-type'));
});

test('v2 notes restrict review match confidence to three levels', async () => {
  const invalid = v2Paper.replace('Match confidence: high', 'Match confidence: certain');
  const result = await validatePaperFixture('invalid-v2-review-confidence', invalid);
  assert.ok(result.errors.some((issue) => issue.code === 'v2-review-confidence'));
});

test('legacy notes report missing review classification and evidence locations', async () => {
  const legacy = legacyPaper
    .replace('- 证据定位：Section 4, Table 1.\n', '')
    .replace('- Page type: not-found\n', '')
    .replace('- Match confidence: high\n', '')
    .replace('- Observed at: 2026-07-10\n', '');
  const result = await validatePaperFixture('legacy-advisories', legacy);
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-review-classification'));
  assert.ok(result.advisories.some((issue) => issue.code === 'legacy-evidence-location'));
});

test('paper figures require an existing local file', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/v2-note/fig-1.png)\n\nFigure 1: result. Image Source: https://example.com/fig-1.png',
  );
  const result = await validatePaperFixture('v2-note', markdown, { imageExists: async () => false });
  assert.ok(result.errors.some((issue) => issue.code === 'missing-image-file'));
});

test('paper figures require an Image Source caption', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/v2-note/fig-1.png)\n\nFigure 1: result.',
  );
  const result = await validatePaperFixture('v2-note', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-image-source'));
});

test('paper figure paths must use the current paper slug', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/other-note/fig-1.png)\n\nFigure 1: result. Image Source: https://example.com/fig-1.png',
  );
  const result = await validatePaperFixture('v2-note', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'image-slug-mismatch'));
});

test('paper image checks ignore examples inside HTML comments', async () => {
  const markdown = `${v2Paper}\n<!-- ![Example](/images/papers/placeholder/fig.png) -->\n`;
  const result = await validatePaperFixture('commented-image', markdown, { imageExists: async () => false });
  assert.ok(!result.errors.some((issue) => issue.code.startsWith('image-') || issue.code.startsWith('missing-image')));
});

test('paper images reject local paths outside the paper image directory', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/elsewhere.png)\n\nFigure 1: result. Image Source: https://example.com/fig.png',
  );
  const result = await validatePaperFixture('invalid-image-directory', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'image-path'));
});

test('paper images reject relative local paths', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](fig.png)\n\nFigure 1: result. Image Source: https://example.com/fig.png',
  );
  const result = await validatePaperFixture('relative-image-path', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'image-path'));
});

test('paper images reject path traversal outside the paper directory', async () => {
  const markdown = v2Paper.replace(
    '- 结果：有效。',
    '- 结果：有效。\n\n![Figure](/images/papers/path-traversal/../other/fig.png)\n\nFigure 1: result. Image Source: https://example.com/fig.png',
  );
  let checkedFilesystem = false;
  const result = await validatePaperFixture('path-traversal', markdown, {
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
  const result = await validatePaperFixture('two-images', markdown);
  assert.ok(result.errors.some((issue) => issue.code === 'missing-image-source'));
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
  const recordResult = await validatePaperFixture(slug, markdown, {
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

