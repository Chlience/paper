# Paper Analysis Workflow

First-Archived-At: 2026-06-19
Updated-At: 2026-07-21

## 目标

本工作流把用户指定的论文、技术报告、模型卡、博客、框架文档或综合材料转成可追溯、可更新、可连接的长期笔记。用户给出材料即代表归档范围已经确定；受理阶段负责识别材料、版本、重复条目和安全边界。

v2.1 使用固定质量底线和条件分析模块。每篇笔记都要说明研究问题、核心贡献、工作机制、直接证据和成立边界；实验、系统、理论、模型报告、综述、安全与文档类细节按材料实际主张启用。

## 快速执行卡

一次完整归档依次经过八个阶段：

1. **受理与分类**：唯一识别材料，确认是否为新增、更新或综合条目，选择材料类型和分析模块。
2. **来源快照**：记录规范来源、责任主体、日期、实际读取版本、访问日期和公开审稿状态。
3. **结构与问题重建**：定位章节、图表、定理、实验、附录和代码，写清研究问题、已有方案缺口与核心假设，并完成关键图准入判断。
4. **机制与证据分析**：解释首要贡献的 `what / how / why / evidence / boundary`，为关键结果添加直接证据定位和最窄结论，把准入的高价值图放在首次解释对应机制或结果的位置。
5. **外部核验**：核验 venue 与公开审稿状态；完成作者基础核验，并对高价值或高风险作者执行深入核验。
6. **成文与关系归档**：按七个核心章节成文，在新论文中记录高置信跨论文关系；讨论内容在产生后继续回写。
7. **发布元数据**：更新 `content/utility/papers-index.md`、`data/paper-tags.json` 和必要的 `data/authors.json`。
8. **语义与结构门禁**：先完成人工语义检查，再运行本地验证，核对差异并创建独立本地 commit。

## Definition of Done

一篇材料完成归档需要同时满足以下条件：

- `Source` 声明 `Workflow version: v2.1`、材料类型和 `Analysis modules`，并包含可复查的来源快照。
- `Source` 声明 `Key figure decision: include` 或 `omit`；`include` 至少嵌入一张高价值本地图片并标注 `Image Source`，`omit` 写明 `Key figure rationale`。
- 七个核心章节均有实质内容：`Source`、`作者与关系`、`一句话结论`、`论文脉络`、`关键实验/定理`、`局限`、`跨论文关系`。
- `一句话结论`、索引核心信号和正文最深入部分指向同一项首要贡献。
- 关键结果写明章节、公式、图、表、附录、页码、代码路径、commit 或 URL 证据定位，并给出证据支持的最窄结论。
- 已完成 venue 与公开审稿状态核验；正式公开审稿存在时，已吸收主要认可、质疑、作者回应及其对可信度的影响。
- 每位可解析作者完成基础身份核验；触发深入核验的作者已按字段保存稳定来源。
- 新论文已记录会改变理解的作者、机构、主题、引用或方法关系；旧论文只在原有理解发生变化时回写。
- `content/utility/papers-index.md` 保留唯一三列表格行；`data/paper-tags.json` 保留一个主标签和最多三个辅助标签。
- 笔记头部声明本地 `Review-Status`；新归档默认进入 `pending`，用户明确确认后进入 `approved`，实质更新使已审阅笔记进入 `needs-review`。
- 五项人工语义门禁通过，本地内容工作流、元数据、公式、搜索和置顶检查通过。
- 完整改动已创建本地 commit；推送只在用户明确要求后执行。

研究主线当前作为独立语料快照维护。新增论文暂不更新 `data/research-mainlines.json` 或 `content/utility/research-mainlines.md`，后续在主线规则更新后重新接入论文工作流。

## Source 快照

新增笔记在 `Source` 中填写：

- `Workflow version: v2.1`
- `Material type`：`research-paper`、`technical-report`、`model-card`、`survey`、`blog`、`framework-docs` 或 `composite`
- `Analysis modules`：从 `experiment`、`system`、`theory`、`model-report`、`survey`、`safety`、`docs` 中选择一个或多个
- `Canonical source`
- `Title`
- `Authors` 或 `Responsible organization` 至少一项
- `Published / updated`、`Submitted` 或 `Published` 至少一项
- `Current version read` 或 `Version / revision read` 至少一项
- `Accessed: YYYY-MM-DD`
- `Key figure decision`：`include` 或 `omit`
- `Key figure rationale`：仅在 `omit` 时必填，说明信息价值、版权、安全或材料形态原因
- `Review status`：使用固定键值记录 `page-type`、`match-confidence`、`observed-at` 和 `venue-status`

推荐格式：

```text
- Review status: page-type=not-found; match-confidence=high; observed-at=2026-07-17; venue-status=arXiv preprint
```

`page-type` 使用 `official-review`、`metadata-only`、`proceedings`、`commentary`、`not-found` 或 `not-applicable`；`match-confidence` 使用 `high`、`medium` 或 `low`。

arXiv 论文优先以 abstract 页面作为规范来源，并补充 PDF、HTML、TeX source、代码与项目页。网页、模型卡和框架文档优先使用责任主体发布的页面或仓库，并记录 release、tag、commit 或页面状态。`composite` 可以使用其它已存档材料的 `/papers/<slug>/` 或 `/archive/` 作为规范入口，不能引用自身页面。

每篇论文头部保留：

- `First-Archived-At: YYYY-MM-DD HH:mm`
- `Updated-At: YYYY-MM-DD HH:mm`
- `Review-Status: pending`

`Updated-At` 只在结论、证据、关系或其它实质内容变化时更新。

## 本地审阅状态

本地审阅状态记录用户是否确认当前笔记判断，与 `Source -> Review status` 记录的公开 venue / peer-review 状态分别维护。

- `Review-Status: pending`：分析已经归档，等待用户审阅。新增论文和缺少用户明确确认的历史论文使用该状态，不记录 `Reviewed-At`。
- `Review-Status: approved`：用户已确认核心贡献、直接证据、最窄结论边界和局限，同时记录 `Reviewed-At: YYYY-MM-DD HH:mm`。`Updated-At` 不得晚于该时间。
- `Review-Status: needs-review`：已审阅笔记发生实质更新，保留上次 `Reviewed-At`，且 `Updated-At` 晚于该时间。用户再次确认后改回 `approved` 并刷新 `Reviewed-At`。

排版、错字和链接维护不改变状态。论文目录通过 `/papers/?review=pending`、`/papers/?review=needs-review` 和 `/papers/?review=approved` 提供筛选深链；无查询参数时展示全部论文。

## 七个核心章节

### Source

保存来源身份、版本、日期、访问状态和外部核验结果。

### 作者与关系

作者条目只写论文发表时机构和额外已核验历史机构。正文可以说明同机构关系、跨机构桥接、作者角色和当前归档中的直接关系。

### 一句话结论

用一段话写明首要贡献、主要机制、最可靠证据和关键边界。索引核心信号从本节提炼。

### 论文脉络

在进入方法前依次回答：

1. 研究问题、背景和价值。
2. 已有方案与剩余缺口。
3. 作者可能的思考路径；推断明确标为本地分析。
4. 核心假设或切入点。
5. 方法、系统或理论框架。
6. 从假设到证据的结论链条。

### 关键实验/定理

章节名可以按材料改为 `关键实验结果`、`主要实验结果`、`关键定理`、`文献扫描结果` 或 `方法论论证`。每个核心结果至少包含：

- `证据定位`
- `支持的最窄结论`

`experiment` 模块同时记录对照是否可比。其它模块按 `internal/paper-analysis-modules.md` 选择相应字段。

### 局限

覆盖首要贡献的成立条件、主要混杂因素、未披露信息、外部有效性和待复验指标。

### 跨论文关系

记录会改变理解的作者重叠、实验室连续产出、主题延展、引用、方法复用和系统层级关系。新论文负责记录本次发现；旧论文只在新关系改变其核心贡献理解、局限或叙事角色时回写。当前没有可靠关系时写明 `暂无高置信跨论文关系。`。

## 条件章节

以下章节只在有实际内容时加入：

- `OpenReview / 审稿意见吸收`：`Review status` 为 `official-review` 时必需。
- `本地讨论补充`：后续交流形成长期有效的概念修正、反例、工程判断或复验指标时加入。
- `主要启发`：材料产生可复用设计原则、诊断指标或实践建议时加入。
- `阅读目标与判断边界`：复杂综合材料需要先限定范围时加入，也可以把内容并入 `论文脉络` 与 `局限`。

`Reference Intake Brief` 已退出 v2.1。用户指定材料即确定归档对象，笔记不再记录 `merge`、`skip` 或其它准入决策。

## 分析模块

`Material type` 描述材料身份，`Analysis modules` 描述需要执行的分析检查。模块可以组合：

| 模块 | 主要检查 |
| --- | --- |
| `experiment` | 设置、数据、指标、统计、baseline 强度、compute 与实现可比性 |
| `system` | 硬件与软件条件、数据路径、吞吐与延迟定义、资源和成本归因 |
| `theory` | 定义、假设、定理、证明依赖、适用域、反例与系统映射 |
| `model-report` | 数据、训练阶段、硬件、并行、框架、评测、安全和未披露项 |
| `survey` | 纳入范围、时间边界、分类轴、覆盖缺口、引用偏差与时效性 |
| `safety` | 威胁模型、攻击者能力、评测环境、现实迁移性、防御与披露边界 |
| `docs` | 责任主体、适用版本、API 或行为证据、变更历史和论文主张一致性 |

模块细则、字段建议和 canary 阶段 advisory 见 `internal/paper-analysis-modules.md`。

## 证据与语义门禁

笔记区分三类陈述：

1. **论文事实**：正文、附录、图表、代码或项目材料直接给出的设计、数字、定理与限制。
2. **作者主张**：作者对贡献、原因、适用范围和意义的解释。
3. **本地分析**：机制重建、因果解释、跨论文比较、工程判断和可信度校准。

关键判断优先定位到原始章节、公式、图、表、附录、页码、代码路径、符号名、tag、commit 或具体 URL。机制分析涉及效率或数学变换时，写清朴素路径、优化路径、成立条件、原始障碍和实现边界。

提交前人工核验：

1. 一句话结论、索引核心信号和正文最深入部分是否对齐同一首要贡献。
2. 读者能否说明该贡献的机制或论证链。
3. 关键结论是否绑定最直接的证据位置。
4. 结论范围是否收缩到证据实际覆盖的边界。
5. 局限是否覆盖首要贡献的成立条件和主要混杂因素。

这五项依赖阅读判断，自动结构检查只承担辅助作用。

## 公开审稿核验

每篇材料都核验 venue 与公开审稿状态，并写入 `Source -> Review status`。搜索顺序优先使用来源中的审稿 URL，再按标题、作者、arXiv id 和 venue 交叉匹配。

`official-review` 需要新增完整章节，至少记录 reviewer 共识、主要质疑、作者回应和对可信度的影响。其它页面类型只记录页面直接支持的状态；社区传播、工程采用、proceedings 状态和正式审稿认可分别表达。

## 作者核验与关系所有权

每位可解析作者完成基础核验：姓名规范形式、论文时机构、本地重名与作者重叠，以及至少一项稳定学术身份来源。团队署名和无法可靠拆分的超大作者列表按团队处理。

通讯作者、共同一作、项目负责人、仓库主要维护者、跨论文重复作者和身份冲突作者进入深入核验。主页、机构页、GitHub、Hugging Face、ORCID、Scholar、DBLP、OpenReview 与 X 按字段保存来源；X 只在已有强候选时核验。

稳定事实进入 `data/authors.json`。检索过程与未采纳的信息只在维护阶段保留，不进入论文笔记或公开页面；具体核验边界由仓库内部维护规则约束。

## 索引与主题标签

`content/utility/papers-index.md` 的 `当前收录` 固定使用：

| 简称 | 时间 | 核心信号 |
| --- | --- | --- |
| [SPIRAL](/papers/2606.23595-spiral-learning-search-aggregate/) | 2026年6月 | 把 search traces、set construction 和 aggregation trace 放进同一个强化学习目标。 |

- 简称使用稳定公开简称并链接 `/papers/<slug>/`。
- 时间使用首次公开月份，格式为 `YYYY年M月`，从新到旧排列。
- 索引核心信号从 `一句话结论` 提炼，写成聚焦首要贡献的完整句子。
- 每个论文 slug 在表中恰好出现一次。

`data/paper-tags.json` 为每篇论文分配 1–4 个受控标签，第一项是主标签。标签来自 `data/tag-taxonomy.json`，主题路由使用 `/topics/#tag-<id>`。

## 交流沉淀与版本更新

用户后续提出的概念修正、反例、公式化重述、工程判断、可信度调整和跨论文联系，只要具有长期价值，就回写到对应笔记。默认进入 `本地讨论补充`；同时影响核心结论、局限或跨论文关系时，更新对应章节。

来源出现新版本时，比较元数据、方法定义、实验数字、图表、作者、机构、审稿状态和限制。实质变化更新 `Updated-At`；链接与排版等维护修改保留原时间。

## 站点链接、公式与图片

- 已存档论文使用 `/papers/<slug>/`。
- 作者页使用 `/authors/<slug>/`。
- 主题使用 `/topics/#tag-<id>`。
- 索引、工作流和模板分别使用 `/archive/`、`/workflow/`、`/template/`。
- 本地文件名只用代码样式，不建立 `.md` 相对链接。
- Markdown 公式使用 `$...$` 或 `$$...$$`。
- 每篇 v2.1 笔记在 `Source` 声明 `Key figure decision: include` 或 `omit`。高价值图存在时优先使用 `include`；`omit` 必须解释原因。
- `include` 至少嵌入一张本地图片。图片放入 `public/images/papers/<paper-slug>/`，使用 `/images/papers/<paper-slug>/...`，每张图附近标注 `Image Source`。

详细公式、图片准入、版权和站点维护规则见 `internal/paper-archive-maintenance-sop.md`。

## 论文删除与反向清理

删除论文前遵守项目高危操作确认规则，明确绝对路径、操作类型和数据丢失风险并取得用户二次确认。确认后同步处理论文文件、索引行、标签分配、失效关系、静态图片和作者 profile。

作者 profile 在剩余论文中没有作者链接、姓名或别名关联时必须同提交删除；`orphan-author-profile` 属于硬错误。研究主线仍是独立快照，删除论文涉及该快照时等待主线规则或另行取得明确范围。

## 验证与提交

<!-- public-utility-omit:start -->

本地检查命令：

```bash
npm run test:workflow
npm run check:workflow
npm run check:metadata
npm run check:math
npm run test:search
npm run test:pins
git diff --check
```

production build 与生成站点检查由 GitHub Actions 执行。

<!-- public-utility-omit:end -->

提交前检查工作区边界，只纳入当前任务文件。完整改动验证通过后创建本地 commit，commit message 遵循项目约定；只有用户明确要求时才 push。

## 安全与双用途处理

安全、漏洞、攻击、绕过、滥用、社会制度套利、模型越狱或 agent 工具滥用论文保留问题定义、机制、风险、评测、防御启发和治理建议。可直接复用的攻击步骤、真实目标细节和高风险操作流程不进入归档。

## 契约维护

新增、删除或调整任何强制要求时，在同一次改动中同步检查：

1. `AGENTS.md`
2. 本工作流与 Definition of Done
3. `content/utility/paper-note-template.md`
4. 验证器与测试
5. 至少一个 v2.1 fixture 或真实 canary

五项未对齐的规则保持建议级。模块专属自动检查先经过真实 canary；确认没有误判后再升级为硬错误。
