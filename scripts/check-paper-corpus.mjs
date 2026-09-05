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
import { v3Paper } from './fixtures/paper-reading-v3.mjs';
import { CURRENT_PAPER_WORKFLOW_VERSION, getContractField, visibleContractMarkdown, validateV21Compatibility } from './content/paper-reading-contract.mjs';

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

test('the v3 compatibility manifest matches the remaining v2.1 corpus', async () => {
  const manifest = JSON.parse(await fs.readFile('internal/paper-workflow-v21-slugs.json', 'utf8'));
  const files = (await fs.readdir('content/papers')).filter((name) => name.endsWith('.md'));
  const records = await Promise.all(files.map(async (name) => ({
    slug: name.replace(/\.md$/, ''), markdown: await fs.readFile(`content/papers/${name}`, 'utf8'),
  })));
  assert.deepEqual(validateV21Compatibility({ manifest, records }).errors, []);
  assert.deepEqual([...manifest.slugs].sort(), records
    .filter((record) => getContractField(markdown.getSection(record.markdown, 'Source'), 'Workflow version') === 'v2.1')
    .map((record) => record.slug).sort());
});

test('the published template can be filled as a valid v3 note', async () => {
  const template = visibleContractMarkdown(await fs.readFile('content/utility/paper-note-template.md', 'utf8'));
  const source = markdown.getSection(v3Paper, 'Source');
  assert.equal(getContractField(markdown.getSection(template, 'Source'), 'Workflow version'), CURRENT_PAPER_WORKFLOW_VERSION);
  const values = {
    '<Paper Title>': 'Deterministic parse cache — synthetic fixture',
    '<official URL>': getContractField(source, 'Canonical source'),
    '<title>': getContractField(source, 'Title'),
    '<paper author block; use Responsible organization for team documents>': 'Fixture authors',
    '<publication date>': '2026-09-05',
    '<version and direct link; observation date for an unversioned page>': getContractField(source, 'Version / revision read'),
    '<sections and appendices actually read; material gaps affecting the judgment>': getContractField(source, 'Reading scope'),
    '<why text or tables suffice, or why the figure cannot be included>': getContractField(source, 'Key figure rationale'),
    '<用自然语言写清首要贡献、区别性机制、主要结果与会改变真值的边界；不使用公式或 TeX 数学定界符。索引核心信号从本节提炼。>': markdown.getSection(v3Paper, '一句话结论'),
    '<说明研究对象、用户关心的问题、已核验基线与剩余缺口；必要背景和核心假设可以合并。>': '相同输入的重复解析可能产生重复工作。该示意检查复用结果所需条件。',
    '<说明首要贡献及必要辅助贡献；从输入或假设开始，按执行或依赖顺序交代关键对象、操作、传递关系和最终输出、训练信号或论证结论。先消歧角色与版本。只读本节应能复述完整链条。>': markdown.getSection(v3Paper, '论文脉络').split('### 贡献与方法总览')[1].split('####')[0].trim(),
    '<首要机制或关键论证，按实际内容命名>': '缓存的等价条件',
    '<解释关键操作如何工作、设计理由、成立条件和证据定位。公式解释用途、变量、方向与实现后果；需要时用对应原定义的具体例子。单阶段可合并进总览，多阶段按解释需要分节，不设固定编号或统一字数。>': 'Section 2：键包括文本、版本和配置；确定性与不可变性保证缓存返回结果和重算一致。未记录的外部状态会破坏保证。',
    '<该证据检验的主张>': '相同键的重复调用可以复用解析结果',
    '<同版本章节、图表、定理、页码或具体 URL / code path / commit>': getContractField(markdown.getSection(v3Paper, '关键实验/定理'), '证据定位'),
    '<实际报告的结果及必要设置、比较对象与指标口径；区分作者报告、本地计算与独立复现>': getContractField(markdown.getSection(v3Paper, '关键实验/定理'), '观察'),
    '<对照固定和改变了什么，能区分哪些解释，尚不能排除什么；理论说明假设与适用域>': getContractField(markdown.getSection(v3Paper, '关键实验/定理'), '判别性与局限'),
    '<证据足以支持的判断，保留条件；可以是证据不足或负面结论>': getContractField(markdown.getSection(v3Paper, '关键实验/定理'), '支持的最窄结论'),
    '<按受影响主张说明成立边界、混杂因素、访问或披露缺口及其判断后果；已展开的限制简短引用。>': markdown.getSection(v3Paper, '局限'),
    '<按论文作者块记录论文时机构、顺序和明确角色；共同机构可合并。只检查本地同名、别名与已有 profile，机构无法映射到个人时明确说明。>': markdown.getSection(v3Paper, '作者与关系'),
    '<只保留有证据且改变理解的引用、方法关系或本地比较；无可靠关系写“暂无高置信跨论文关系。”。本地论文用 /papers/<slug>/，作者用 /authors/<slug>/。>': markdown.getSection(v3Paper, '跨论文关系'),
  };
  let filled = template.replaceAll('YYYY-MM-DD HH:mm', '2026-09-05 09:00').replaceAll('YYYY-MM-DD', '2026-09-05');
  for (const [placeholder, value] of Object.entries(values)) filled = filled.replaceAll(placeholder, value);
  assert.doesNotMatch(filled, /<[^>]+>/);
  assert.deepEqual((await validatePaperFixture('v3-template', filled)).errors, []);
  assert.doesNotMatch(filled, /作者可能的思考路径/);
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

test('workflow entry points route to one current reading contract and preserve publication boundaries', async () => {
  const [workflowDoc, template, agentInstructions, maintenanceSop, modules] = await Promise.all([
    fs.readFile('content/utility/paper-analysis-workflow.md', 'utf8'),
    fs.readFile('content/utility/paper-note-template.md', 'utf8'),
    fs.readFile('AGENTS.md', 'utf8'),
    fs.readFile('internal/paper-archive-maintenance-sop.md', 'utf8'),
    fs.readFile('internal/paper-analysis-modules.md', 'utf8'),
  ]);
  for (const document of [workflowDoc, template, agentInstructions]) {
    assert.match(document, new RegExp(`Workflow version: ${CURRENT_PAPER_WORKFLOW_VERSION}`));
    assert.match(document, /analysis-only/);
    assert.match(document, /archive-core/);
    assert.match(document, /\/synthesis-workflow\//);
    assert.match(document, /\/mainline-template\//);
  }
  for (const document of [agentInstructions, maintenanceSop, modules]) {
    assert.match(document, /content\/utility\/paper-analysis-workflow\.md/);
  }
  for (const document of [workflowDoc, template, agentInstructions, maintenanceSop]) {
    assert.match(document, /pending/);
    assert.match(document, /approved/);
    assert.match(document, /保留原有\s+`?Review-Status`?\s+和\s+`?Reviewed-At`?/);
  }
  // Check the actual documented local commands, not a second copy of scientific prose.
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  for (const match of workflowDoc.matchAll(/rtk npm run ([a-z:-]+)/g)) assert.ok(packageJson.scripts[match[1]]);
  assert.match(workflowDoc, /internal\/paper-workflow-v21-slugs\.json/);
  assert.match(agentInstructions, /Key figure decision: include\|omit/);
  assert.match(maintenanceSop, /representativePapers/);

  // Preserve the independent contracts whose documents are outside this revision.
  const [synthesisWorkflow, mainlineTemplate, mainlinesDoc, authorSop] = await Promise.all([
    fs.readFile('content/utility/research-synthesis-workflow.md', 'utf8'),
    fs.readFile('content/utility/research-mainline-template.md', 'utf8'),
    fs.readFile('content/utility/research-mainlines.md', 'utf8'),
    fs.readFile('internal/author-x-account-search-sop.md', 'utf8'),
  ]);
  for (const document of [synthesisWorkflow, mainlineTemplate, mainlinesDoc]) {
    assert.match(document, /pending/);
    assert.match(document, /approved/);
    assert.match(document, /保留原有(?:\s+`?Review-Status`?\s+和\s+`?Reviewed-At`?|审阅状态与审阅时间)/);
  }
  for (const field of ['Workflow version: synthesis-v1', 'Material type: composite', 'Analysis modules', 'Search services', 'Search window', 'Responsible organization']) {
    assert.ok(synthesisWorkflow.includes(field));
  }
  for (const requirement of ['作者顺序前两位', '共同一作', '通讯作者', 'representativePapers', 'selected、representative、featured', '不自动创建单篇论文笔记']) {
    assert.ok(authorSop.includes(requirement));
  }
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
