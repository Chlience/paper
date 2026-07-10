# Paper SOP v2 Design

Created-At: 2026-07-10
Status: Implemented; cross-paper ownership amended 2026-07-10

## 1. 目标

本次改版要让论文归档流程同时具备四项能力：

1. 维护者可以从一个短入口理解完整执行顺序和完成标准。
2. 论文、技术报告、模型卡、博客、框架文档和综述可以共享核心质量要求，并按材料类型启用条件检查。
3. 来源、定量结果、审稿意见、作者身份和本地判断可以追溯到具体证据。
4. 自动检查可以发现结构性遗漏，同时保持现有 91 篇历史笔记继续构建。

本轮会更新：

- `content/utility/paper-analysis-workflow.md`
- `content/utility/paper-note-template.md`
- `internal/author-x-account-search-sop.md`
- 内容检查脚本、`package.json` 和 CI 接线

本轮不批量改写历史论文笔记，不改变站点信息架构，也不重构 `content/utility/papers-index.md` 的数据模型。

## 2. 审计基线

仓库审计时共有 91 篇笔记、298 份人工维护作者 profile。当前作者解析器从 `Source -> Authors` 中识别出 583 个唯一作者键，其中 278 个已有 profile，另有 7 位未建档作者在两篇论文中重复出现。

现有内容已经形成以下稳定能力：

- 91 篇笔记均有索引站点链接。
- 站点检查支持 `关键实验/定理`、`关键定理`、`方法论论证` 等等价章节名。
- 91 篇笔记均有 `OpenReview / 审稿意见吸收` 章节。
- 83 篇笔记已经沉淀本地讨论。
- 主 SOP 已覆盖机制推导、baseline 公平性、公开审稿、作者关系、图片来源和提交策略。

审计发现以下流程缺口：

- 主 SOP 461 行，模板 216 行，作者 SOP 274 行；日常执行入口和详细规则混排。
- 固定 Source 字段无法准确表达非论文材料。当前有 4 篇缺 `Title`、8 篇缺 `Authors`、12 篇缺 `Submitted`、7 篇缺 `Current version read`。
- 定量结论通常记录结果值，但缺少统一的 section、figure、table、appendix 或 page 定位要求。
- 公开审稿页、OpenReview 元数据页、会议 proceedings 和未匹配结果缺少统一分类字段。
- 主 SOP 与项目级要求对 author profile pass 的触发范围表述不同。
- 作者 SOP 的公开记录建议、检索痕迹边界和文件位置说明存在冲突或过时内容。
- 元数据检查主要覆盖时间字段、维护痕迹和本地链接；来源完整度、模板残留、索引覆盖、图片来源和作者 JSON 一致性缺少独立内容检查。

## 3. 核心设计原则

### 3.1 核心流程与条件模块分层

所有材料共享来源确认、问题重建、证据校准、作者关系、跨论文关系、讨论回写和发布检查。训练配置、系统路径、理论证明、安全评测、综述覆盖度等要求按材料类型启用。

这项分层保留统一质量标准，同时减少与目标材料无关的空表格和机械填充。

### 3.2 证据定位随结论出现

关键数字、复杂度、定理条件、系统配置和 reviewer 判断要在对应结果附近记录定位信息。定位优先使用 `section / figure / table / appendix / page / URL`，无需建立独立且重复的全局引用表。

来源语言统一区分三类内容：

- 论文事实：来源直接给出的元数据、设置、公式、结果和决定。
- 作者主张：作者对原因、贡献、泛化和意义的解释。
- 本地分析：归档者根据来源形成的推导、比较、质疑和工程判断。

推测性的“作者可能的思考路径”始终标记为重建或推断，并给出依赖的论文前背景。

### 3.3 严格规则保持可执行

SOP 中的每个强制项必须满足至少一个条件：

- 可以由脚本可靠检查；
- 可以在模板中形成明确填写位；
- 可以在发布 checklist 中得到清晰人工判定。

仅能依赖主观判断的要求使用“建议”或“优先”，并写明适用条件。

### 3.4 历史兼容与新增规范分离

历史笔记继续满足现有核心章节和站点约束。v2 模板增加材料类型、来源快照和证据定位字段。自动检查采用三层约束：

- Universal error：所有内容都应满足的核心章节、可追溯来源、索引、图片和作者数据不变量。
- v2 error：带有 `Workflow version: v2` 的条目需要满足精确时间、Source 快照、证据定位、审稿分类和接纳决策规则。
- Advisory：历史内容尚未统一的 v2 字段，输出数量和文件列表，不阻止本轮构建。

后续需要批量迁移时，可以将已完成迁移的 advisory 逐项提升为 error。

## 4. 主 SOP 信息架构

主 SOP 顶部增加“快速执行卡”和 Definition of Done，维护者先看到一条完整路径，再按需进入详细模块。

### 4.1 快速执行卡

执行顺序固定为九个阶段：

1. Intake：识别材料类型和归档目标。
2. Source pass：固定 canonical source、版本、日期和访问时间。
3. Problem pass：重建研究问题、已有方案、思考路径和核心假设。
4. Mechanism pass：解释朴素路径、优化路径、成立条件和实现边界。
5. Evidence pass：核对实验、定理、baseline、统计和证据定位。
6. External pass：核对公开审稿、代码、框架版本和外部状态。
7. Relationship pass：更新作者 profile、机构关系、论文笔记中的跨论文关系和索引行。
8. Discussion/update pass：回写讨论结论、版本变化和勘误。
9. Release gate：执行内容检查、构建、站点检查和本地提交。

每个阶段都写清输入、动作、产物和停止条件，避免把搜索动作本身当作完成标准。

### 4.2 材料类型

v2 支持以下类型：

- `research-paper`
- `technical-report`
- `model-card`
- `survey`
- `blog`
- `framework-docs`
- `composite`

`composite` 用于时间线、跨报告综合入口或同时整合多个主要来源的专题文档。材料类型决定 Source 必填字段和条件模块，不降低核心章节要求。

### 4.3 Source 快照

新增笔记至少记录：

- Material type
- Canonical source
- Title
- Authors 或 Responsible organization
- Published / submitted date
- Version / revision read
- Accessed date

arXiv 论文继续保留 arXiv、PDF、Submitted、Current version read。网页材料使用 Published / updated、Version / commit / release 和 Accessed，避免填写不适用的 arXiv 字段。

### 4.4 条件分析模块

主 SOP 为不同材料提供独立检查表：

- 实验论文：数据、模型、训练预算、评测协议、统计和 baseline 公平性。
- 系统论文：硬件拓扑、并行方式、调度、吞吐、延迟、资源利用率和对照实现。
- 理论论文：定义、假设、定理、证明依赖、适用域、反例和经验验证。
- 模型或技术报告：数据、训练阶段、计算量、框架栈、能力评测、安全评测和未披露项。
- 综述：检索范围、纳入标准、分类轴、覆盖盲区和结论时效性。
- 安全评测：威胁模型、攻击者能力、评测环境、现实外推边界和双用途处理。
- 博客或框架文档：责任主体、版本或 commit、与论文 claim 的关系、运行环境和时效性。

### 4.5 版本更新与勘误

当来源发布新版本时，先比较摘要、方法、实验、作者和结论变化，再决定更新范围。`Updated-At` 只在内容发生有意义变化时更新。影响旧判断的变化写入本地讨论或专门的版本变化段，并保留此前判断为何需要调整。

## 5. 模板设计

模板继续保留项目要求的核心章节。主要调整如下：

### 5.1 Source

Source 增加 Workflow version、Material type、Canonical source、Responsible organization、Published / updated 和 Accessed。新模板固定填写 `Workflow version: v2`，供检查器启用严格规则。旧字段继续保留为论文材料的常用字段，注释说明按类型删减不适用项。

### 5.2 阅读目标与证据边界

该章节加入证据语言约定和来源定位规则。正文避免为每句话添加标签；关键争议、推断和外部事实需要显式说明类别。

### 5.3 关键实验或定理

每个结果增加：

- 证据定位
- 对照是否可比
- 结果支持的最窄结论

实验审计表拆为通用项和条件项。维护者按材料类型保留相关表格，删除不适用空行。

### 5.4 公开审稿

审稿章节增加：

- Page type：official review / metadata-only / proceedings / commentary / not-found / not-applicable
- Match confidence：high / medium / low
- Observed at

只有可靠匹配的 official review 才汇总 rating、reviewer consensus 和 rebuttal。元数据页和 proceedings 只用于确认投稿或录用状态。

### 5.5 Reference Intake Brief

保留该核心章节，并限制为材料接纳决策：目标位置、可复用元素、风险、跳过材料和最终决策。最终决策使用固定值：`merge`、`revise-then-merge`、`skip`、`ask-user`。

## 6. 作者 SOP 设计

### 6.1 两层 profile pass

所有作者执行基础 pass：

1. 标准化姓名和别名。
2. 搜索现有 `authors.json`、索引和论文笔记。
3. 核对论文作者身份、发表时机构和至少一个稳定学术来源。
4. 记录已核验字段，证据不足字段留空。

以下对象进入深入 pass：通讯作者、核心作者、仓库维护者、项目负责人、跨论文重复作者、身份歧义作者，以及已经发现候选 X 账号的作者。

### 6.2 来源优先级

身份事实优先使用个人主页、机构页、论文项目页、GitHub、ORCID、DBLP、OpenReview 和 Scholar。搜索代理可以扩展候选集合，候选在写入前需要用独立来源复核。

X 账号继续使用严格阈值：至少两个独立强信号且不存在身份冲突。每个 profile 字段独立判断证据，不使用一个全局置信度替代字段级核验。

### 6.3 停止条件

满足以下条件即可结束单个作者搜索：

- 已找到稳定主页或机构页，并完成主要身份字段交叉验证；
- 对候选 X 完成高置信核验；
- 经过姓名、机构、论文和已知 handle 的限定搜索仍无候选，记录 `xConfidence: "not-found"`；
- 同名歧义无法消除，保留最小 profile 或暂不写入，并在临时记录中说明阻塞证据。

### 6.4 公开与内部边界

论文 Markdown 的作者列表只保留发表时机构和已核验历史机构。`data/authors.json` 保存稳定身份字段及来源。查询词、候选账号、拒绝原因、搜索代理输出和 `xConfidence` 判断过程保存在 `/tmp`，不进入公开论文笔记。

## 7. 自动检查设计

新增 `scripts/check-paper-workflow.mjs`，并通过 `npm run check:workflow` 接入 `check:site` 和 CI。

### 7.1 Error 级检查

- 新条目必须声明 `Workflow version: v2`；兼容模式只覆盖 `internal/paper-workflow-legacy-slugs.json` 冻结的历史 slug，未知版本直接报错。
- 所有条目的 `First-Archived-At` 与 `Updated-At` 均存在；v2 条目必须使用 `YYYY-MM-DD HH:mm`。
- v2 条目的 `Updated-At` 不早于 `First-Archived-At`，首次归档分钟不与已有条目重复。
- 核心章节或允许的等价标题存在且包含有效内容。
- 所有条目的 Source 至少包含一个可解析的绝对外部 URL 或有效 `/papers/<slug>/` 来源链接；v2 条目必须额外填写 Canonical source。
- v2 条目的关键结果或定理至少包含一项 section、figure、table、appendix、page 或 URL 证据定位。
- v2 条目的审稿章节必须填写 Page type、Match confidence 和 Observed at。
- v2 条目的 `Reference Intake Brief` 必须使用固定 Decision 值。
- 笔记不保留模板占位符和空白决策值。
- 每篇论文在索引中至少有一个 `/papers/<slug>/` 链接。
- 本地图片使用 `/images/papers/<slug>/...`，对应文件存在，图注包含 `Image Source`。
- `data/authors.json` 可以解析，profile slug 唯一，规范化姓名和别名不产生跨 profile 冲突。
- 已填写的主页、GitHub、Hugging Face 和 X 使用合法绝对 URL；`sources` 同时兼容 URL 字符串和 `{ "label": "...", "url": "..." }`，其中 URL 必须合法。

### 7.2 Advisory 级检查

- 缺少 Material type、Canonical source、Accessed 或统一 version 字段。
- 旧条目的时间格式未统一，或首次归档分钟与其他旧条目重复。
- 审稿章节缺少 Page type、Match confidence 或 Observed at。
- 关键结果缺少证据定位。
- 重复出现但尚无人工 profile 的作者。
- 旧版 `Reference Intake Brief` 决策值未标准化。

Advisory 输出汇总计数和有限文件样例，避免在 91 篇历史笔记上产生难以阅读的完整日志。

### 7.3 兼容策略

Error 规则在实现前先对全库运行。`internal/paper-workflow-legacy-slugs.json` 冻结启用 v2 前的 91 个历史 slug；这些条目缺少版本标记时使用兼容规则，章节别名、外部 URL 和有效站内来源链接继续支持旧格式。清单外的新条目必须声明 `Workflow version: v2`，从而避免通过省略版本字段绕过严格检查。带有 v2 标记的条目执行完整 Source、真实日期、结果定位、审稿分类和接纳决策规则。历史缺口进入 advisory；单篇历史笔记迁移到 v2 后可以继续保留在清单中，版本标记会优先启用严格规则。

## 8. 验证与测试

实现完成后执行：

```text
npm run check:workflow
npm run check:metadata
npm run check:math
npm run build
npm run check:site
git diff --check
```

检查脚本至少需要手工验证以下失败场景：

- 无效时间格式或更新时间倒置。
- 新笔记缺少 v2 标记，或使用未知工作流版本。
- 缺少核心章节。
- Source 缺少可追溯链接，或 v2 条目缺少 Canonical source。
- 索引漏链。
- 图片路径错误、文件缺失或图注无来源。
- 作者记录形状、URL、slug 或别名冲突。
- 模板占位符残留。

历史 91 篇笔记必须继续通过 Error 级检查和站点构建。Advisory 结果会进入最终分析，作为后续迁移清单，不在本轮修改对应论文。

## 9. 验收标准

本轮完成需同时满足：

1. 主 SOP 顶部可以直接看到九阶段执行卡和 Definition of Done。
2. 主 SOP 明确区分核心要求与材料类型条件模块。
3. 模板能够表达论文、报告、网页材料和综合专题的来源快照。
4. 定量结论、定理和审稿判断具有统一证据定位方式。
5. 主 SOP、模板、作者 SOP 和项目级要求对 author profile pass 的口径一致。
6. 作者 SOP 不再建议把搜索过程写入公开论文笔记。
7. 自动检查覆盖时间、章节、来源、索引、图片、模板残留和作者数据一致性。
8. 现有 91 篇笔记无需批量修改即可通过完整验证。
9. 所有改动形成独立本地 commit；用户明确要求后才 push。

## 10. 延后事项

以下优化具有价值，但属于后续独立任务：

- 将 `当前收录` 表格改为生成数据。
- 将论文本地关系章节进一步升级为机器可读的结构化边；从全局长文本索引迁移到论文本地章节已完成。
- 为历史 91 篇笔记补齐 v2 Source 和证据定位字段。
- 为作者搜索建立持久化的内部审计记录。
- 将 advisory 分阶段提升为 CI error。
