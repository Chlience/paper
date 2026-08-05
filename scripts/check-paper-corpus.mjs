import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import * as markdown from './content/markdown.mjs';
import * as workflow from './content/paper-workflow.mjs';
import {
  REQUIRED_MAINLINE_HEADINGS,
  loadResearchMainlines,
  validateResearchMainlines,
} from './content/research-mainlines.mjs';
import * as tagging from './content/tagging.mjs';
import { validatePaperFixture } from './fixtures/paper-workflow.mjs';

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

test('K3 is a strict method overview canary after migration', async () => {
  const canary = await fs.readFile(
    'content/papers/2026-07-27-kimi-k3-open-frontier-intelligence.md',
    'utf8',
  );
  const slug = '2026-07-27-kimi-k3-open-frontier-intelligence';
  const result = await validatePaperFixture(slug, canary);

  assert.ok(!result.errors.some((entry) => entry.code.startsWith('v21-method-overview')));
  assert.ok(!result.advisories.some((entry) => entry.code.startsWith('v21-method-overview')));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'));
  for (const heading of ['11.1 SFT', '11.3 部分采样轨迹', '11.5 MOPD']) {
    assert.match(
      canary,
      new RegExp(`^#### ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'),
    );
  }
  assert.match(canary, /^### 5\. 贡献全景与方法总览$/m);
  assert.match(canary, /^### 12\. 部署约束/m);
  assert.match(canary, /^### 14\. 结论链条$/m);
  assert.doesNotMatch(canary, /^### 5\.\d+\s/m);
  assert.doesNotMatch(canary, /^### 5\. 核心贡献与方法逻辑$/m);
});

test('DRPO is the real strict method overview canary', async () => {
  const slug = '2510.04474-drpo-decoupled-reward-policy-optimization';
  const canary = await fs.readFile(`content/papers/${slug}.md`, 'utf8');
  const result = await validatePaperFixture(slug, canary);

  assert.ok(!result.errors.some((entry) => entry.code.startsWith('v21-method-overview')));
  assert.ok(!result.advisories.some((entry) => entry.code.startsWith('v21-method-overview')));
  assert.ok(!result.advisories.some((entry) => entry.code === 'v21-method-detail-narrative'));
  assert.match(canary, /^### 5\. 贡献全景与方法总览$/m);
  assert.match(canary, /^### 6\. GRPO 中组合 reward 的符号翻转$/m);
  assert.match(canary, /^### 11\. 结论链条$/m);
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

test('the workflow documents define one aligned primary-insight construction process', async () => {
  const [workflowDoc, template, agentInstructions, maintenanceSop] = await Promise.all([
    fs.readFile('content/utility/paper-analysis-workflow.md', 'utf8'),
    fs.readFile('content/utility/paper-note-template.md', 'utf8'),
    fs.readFile('AGENTS.md', 'utf8'),
    fs.readFile('internal/paper-archive-maintenance-sop.md', 'utf8'),
  ]);

  for (const document of [workflowDoc, template, agentInstructions, maintenanceSop]) {
    for (const requirement of [
      '首要启发',
      '不设置目标数量',
      '原有判断',
      '区分性证据',
      '抽象关系',
      '可证伪预测',
    ]) {
      assert.match(document, new RegExp(requirement));
    }
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

test('LatentMoE is the strict primary-insight construction canary', async () => {
  const slug = '2601.18089-latentmoe-accuracy-per-flop-parameter';
  const canary = await fs.readFile(`content/papers/${slug}.md`, 'utf8');
  const result = await validatePaperFixture(slug, canary);
  const insightErrors = result.errors.filter((entry) => entry.code.startsWith('v21-insight'));

  assert.deepEqual(insightErrors, []);

  const sectionStart = canary.indexOf('## 主要启发');
  assert.notEqual(sectionStart, -1);
  const remainder = canary.slice(sectionStart + '## 主要启发'.length);
  const nextSectionOffset = remainder.search(/\n## /);
  const insights = nextSectionOffset === -1 ? remainder : remainder.slice(0, nextSectionOffset);

  assert.equal(insights.match(/^### \d+\. /gm)?.length, 1);
  assert.match(
    insights,
    /^### 1\. 高成本数据路径可以使用较窄表示，节省的预算可以增加按需激活的容量$/m,
  );
  for (const locator of ['Section 2', 'Figure 3', 'Figures 4–5', 'Table 5']) {
    assert.match(insights, new RegExp(locator));
  }
  assert.match(insights, /迁移成立时/);
  assert.match(insights, /该预测会失败/);
  assert.doesNotMatch(
    insights,
    /服务预算需要同时记录|转换规则需要消融验证|解析成本守恒需要通过目标负载下的系统测量闭合/,
  );
});

test('public workflow and agent instructions expose one aligned v2.1 contract', async () => {
  const workflowDoc = await fs.readFile('content/utility/paper-analysis-workflow.md', 'utf8');
  const synthesisWorkflow = await fs.readFile('content/utility/research-synthesis-workflow.md', 'utf8');
  const template = await fs.readFile('content/utility/paper-note-template.md', 'utf8');
  const mainlineTemplate = await fs.readFile('content/utility/research-mainline-template.md', 'utf8');
  const mainlinesDoc = await fs.readFile('content/utility/research-mainlines.md', 'utf8');
  const agentInstructions = await fs.readFile('AGENTS.md', 'utf8');
  const authorSop = await fs.readFile('internal/author-x-account-search-sop.md', 'utf8');
  const maintenanceSop = await fs.readFile('internal/paper-archive-maintenance-sop.md', 'utf8');

  for (const document of [
    workflowDoc,
    synthesisWorkflow,
    template,
    mainlineTemplate,
    mainlinesDoc,
    agentInstructions,
    maintenanceSop,
  ]) {
    assert.doesNotMatch(document, /needs-review|需复审|待复审/);
    assert.match(document, /pending/);
    assert.match(document, /approved/);
    assert.match(document, /Updated-At/);
    assert.match(
      document,
      /保留原有(?:\s+`?Review-Status`?\s+和\s+`?Reviewed-At`?|审阅状态与审阅时间)/,
    );
  }

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
    for (const requirement of ['首要启发', '区分性证据', '抽象关系', '可证伪预测']) {
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
  const requiredCommands = ['npm run check:source', 'npm run build', 'npm run check:dist'];

  for (const command of requiredCommands) {
    assert.match(source, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.equal(source.match(/npm run build\b/g)?.length, 1);
  assert.equal(source.match(/npm run check:source\b/g)?.length, 1);
  assert.equal(source.match(/npm run check:dist\b/g)?.length, 1);
  assert.match(source, /runs-on: ubuntu-24\.04/);
  assert.match(source, /timeout-minutes: 10/);
  assert.doesNotMatch(source, /^\s*schedule:/m);
  assert.ok(source.indexOf('Validate source') < source.indexOf('Build and verify static site'));
  assert.ok(source.indexOf('Build and verify static site') < source.indexOf('Pack static artifact'));
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
