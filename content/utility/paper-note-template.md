# <Paper Title> 论文笔记

First-Archived-At: YYYY-MM-DD HH:mm
Updated-At: YYYY-MM-DD HH:mm
Review-Status: pending

> 本模板用于单篇材料。跨论文时间窗、方法谱系或证据综合使用 [Research Synthesis Workflow](/synthesis-workflow/) 中的 `composite` 契约。

## Source

- Workflow version: v2.1
- Material type: research-paper / technical-report / model-card / survey / blog / framework-docs
- Analysis modules: experiment / system / theory / model-report / survey / safety / docs
- Canonical source:
- Title:
- Authors:
- Responsible organization:
- arXiv:
- PDF:
- Code/Project:
- OpenReview / Review page:
- Submitted:
- Published / updated:
- Current version read:
- Version / revision read:
- Accessed: YYYY-MM-DD
- Key figure decision: include / omit
- Key figure rationale:
- Review status: page-type=not-found; match-confidence=high; observed-at=YYYY-MM-DD; venue-status=unknown
- Subjects:

<!--
填写规则：
- `Authors` 与 `Responsible organization` 至少填写一项。
- `Authors` 保留全部可解析作者。默认新建 profile 只覆盖作者顺序前两位、论文明确标注的共同一作和明确通讯作者；普通作者只复用已有 profile，用户明确要求时可以例外新建。已建档作者使用 `/authors/<slug>/` 链接，其余作者保留姓名文本。
- `Current version read` 与 `Version / revision read` 至少填写一项。
- Canonical source 使用官方绝对 URL；`composite` 的内部基线来源规则见 [Research Synthesis Workflow](/synthesis-workflow/)。
- Analysis modules 可以填写多个逗号分隔值，例如 `system, experiment`。
- `Key figure decision` 使用 `include` 或 `omit`。存在能解释首要贡献、机制、训练信号、主结论或失败边界的高价值图时使用 `include`，至少嵌入一张本地图片；使用 `omit` 时填写实质性的 `Key figure rationale`。
- Review status 的 page-type 使用 official-review / metadata-only / proceedings / commentary / not-found / not-applicable；match-confidence 使用 high / medium / low。
- 按材料类型删除不适用字段。
-->

## 作者与关系

- Author A: Institution in this paper.
- Author B: Institution in this paper；历史机构：previously verified affiliations.

写法要求：作者条目覆盖全部可解析作者，并在冒号后直接写发表该论文时的机构。额外历史机构只写已核验且不与当前机构重复的内容。默认新建 profile 只覆盖作者顺序前两位、论文明确标注的共同一作和明确通讯作者；普通作者只复用已有 profile。正文说明同机构关系、跨机构桥接、作者角色和当前归档中的直接作者关系。

## 一句话结论

用一段自然语言说明首要贡献、主要机制、最可靠证据和关键边界，不使用公式或 TeX 数学定界符。

<!-- 索引核心信号从本节提炼：用一个可独立成立的自然语言句子说明研究对象、区别性机制和主要结果；省略某个边界会改变结论真值时，将该边界写入句子。核心信号不使用公式或 TeX 数学定界符；简称和首次公开月份写入 papers-index.md -> 当前收录。 -->

## 论文脉络

<!-- 术语写作建议：英文术语、缩写或指标首次出现在解释性正文时，优先补充简短中文括注，如 tie（平局）、SNR（信噪比）；中文直译仍不足以说明含义或计算口径时，再用一句话单独解释，如 pairwise accuracy（成对准确率）。 -->

### 1. 研究问题、背景和价值

说明论文试图解决的问题、必要背景和解决价值。

### 2. 已有解决方案与不足

说明已有工作如何处理该问题，以及仍然存在的假设、规模、数据、指标、工程或泛化缺口。

### 3. 作者可能的思考路径

使用论文提出前已经存在的背景和失败模式重建可能的 idea 形成过程，并明确标为本地分析。

### 4. 核心假设或切入点

写清成立条件和方法所依赖的关键判断。

### 5. 方法 / 系统 / 理论框架

先确定一项首要贡献及必要的辅助贡献。回到定义首要贡献的原始章节、公式、算法、图、附录或代码，回答 `what / how / why / evidence / boundary`。

涉及效率或数学变换时，写清朴素路径、优化路径、成立条件、原始障碍和实现边界；同一段推导保持一致的 tensor / matrix 记号。

### 6. 结论链条

按“假设—机制—直接证据—最窄结论—边界”组织主线。

## 关键实验/定理

### 结果 1

- 设置：
- 指标：
- 结果：
- 证据定位：Section / Figure / Table / Appendix / Page / URL / code path / commit
- 支持的最窄结论：
- 解读：

<!--
按 Analysis modules 添加条件字段：
- experiment：Baseline；对照是否可比。
- system：系统条件；指标定义；成本归因。
- theory：假设；适用域。
- model-report：未披露项。
- survey：纳入范围。
- safety：威胁模型；披露边界。
- docs：适用版本。

结果数量由核心证据决定。删除无关字段，避免用空表格代替分析。

高价值图片放在首次解释它的机制或结果附近：
![Figure 1: short description](/images/papers/<paper-slug>/fig-1-short-name.png)
Figure 1: caption. Image Source: [source label](<image source URL>).
-->

## 局限

1. 首要贡献的成立条件与适用边界。
2. 实验、理论、系统或来源中的主要混杂因素与未披露项。
3. 外部有效性、失败模式和后续复验指标。

## 跨论文关系

- 与已有论文的作者或机构关系：
- 与已有论文的主题关系：
- 与已有论文的方法或系统关系：

只保留能够改变跨论文理解的关系。新论文记录本次发现；旧论文只在核心贡献理解、局限或叙事角色发生变化时回写。当前没有可靠关系时写明 `暂无高置信跨论文关系。`。

已存档论文使用 `[2504.13837](/papers/2504.13837-rlvr-reasoning-boundary-base-model/)`；已建档作者使用 `[Tri Dao](/authors/tri-dao/)`；本地文件名只用代码样式。

<!--
以下章节按条件添加，不保留空章节：

## OpenReview / 审稿意见吸收

仅当 Source -> Review status 的 page-type=official-review 时添加。

- Reviewer consensus:
- Main criticisms:
- Author response:
- 对可信度的影响:

## 本地讨论补充

在后续交流形成长期有效的概念修正、反例、工程判断或复验指标时添加。

## 主要启发

在材料产生可复用设计原则、诊断指标或实践建议时添加。
-->
