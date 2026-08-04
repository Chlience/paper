import { validatePaperRecord } from '../content/paper-workflow.mjs';

export const archiveIndex = (rows) => `# Paper Archive Index

## 当前收录

| 简称 | 时间 | 核心信号 |
| --- | --- | --- |
${rows.join('\n')}

## 后续新增论文沉淀规范

关系保留在对应论文笔记中。
`;

export const archiveRow = (
  slug,
  shortTitle,
  month = '2026年7月',
  signal = '提炼论文最核心的机制贡献。',
) => `| [${shortTitle}](/papers/${slug}/) | ${month} | ${signal} |`;

export const coreBody = `
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

export const legacyPaper = `# Legacy note

First-Archived-At: 2026-07-03 09:03 CST
Updated-At: 2026-07-03 09:03 CST
Review-Status: pending

## Source

- Local archive: [source](/papers/source-paper/)
${coreBody}`;

export const v2Paper = `# V2 note

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

export const v21CoreBody = `
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

export const v21Paper = `# V2.1 note

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

export const validatePaperFixture = (
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
