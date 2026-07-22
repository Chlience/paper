# Research Synthesis Workflow

First-Archived-At: 2026-07-22
Updated-At: 2026-07-22

## 目标与适用范围

研究综合以一个明确问题、冻结时间窗和可复核材料集合为分析对象。它适合处理三类任务：补齐一段时间内的研究增量，重建一组方法的演进关系，或在实验口径不同的材料之间建立机制与证据比较。

单篇材料继续使用 [Paper Analysis Workflow](/workflow/) 和 [Paper Note Template](/template/)。当核心判断需要同时依赖多项独立材料，且结论来自跨材料比较时，建立 `Material type: composite` 的研究综合。仅汇总若干摘要、列举论文标题或改写一篇综述的内容，仍按普通材料笔记处理。

## Definition of Done

一篇研究综合完成归档需要同时满足以下条件：

- 研究问题、纳入范围、排除范围、检索服务、时间窗和截止时刻均可复查。
- 首次公开、正式发表和窗口内实质修订分别记录，时间线口径保持一致。
- 比较轴来自研究问题，表中每项方法都能落到相同字段，并附证据位置与适用边界。
- 论文事实、作者主张和本地综合分别表达；跨设置结果只比较机制与条件，不生成缺少可比基础的性能排名。
- 一句话结论、索引核心信号、最深入的比较和局限指向同一项综合判断。
- 公开正文形成连续的判断路径，内部来源快照、作者核验和维护记录继续保存在 Markdown。
- 五项人工语义门禁、内容验证、站点构建和页面 canary 均通过，完整改动已经创建本地 commit。

## 一、建立与冻结研究窗口

先写一条可以被材料支持或推翻的研究问题，再确定材料边界。时间窗使用完整日期；检索截止时刻包含分钟和时区。对快速变化主题，时间窗同时承担版本快照作用，更新时不得静默移动截止日期。

`Source` 至少声明：

- `Workflow version: v2.1`
- `Material type: composite`
- `Analysis modules`：必须包含 `survey`，再按主张加入 `experiment`、`system`、`theory`、`safety` 或 `docs`
- `Canonical source`：选择一项稳定基线，例如前序综述、代表性存档论文或 `/archive/`
- `Responsible organization`
- `Search services`
- `Search window: YYYY-MM-DD 至 YYYY-MM-DD HH:mm TZ`
- `Published / updated`、`Current version read`、`Accessed`
- `Key figure decision` 与需要时的 `Key figure rationale`
- `Review status: page-type=not-applicable; ...`

在 `Source` 字段后添加一个三级标题，使用 `检索协议与结果边界`、`纳入协议与术语边界` 或含义等价的名称。这里记录检索式、候选数量、机制同义词、正式来源回查、纳入条件、排除条件和已知覆盖缺口。构建器会把这段协议提升到公开正文开头。

## 二、记录搜索增量与版本变化

首次扫描与后续增量扫描分开记录。可复核的候选数量绑定具体查询式和结束日期；机制同义词、引文回查和项目页补录分别说明，避免把多种检索口径合并成一个看似精确的数字。

时间线统一使用首次公开日期。以下两类事件单列：

1. 窗口内获得正式论文集或公开审稿页面、首次公开时间早于窗口的材料。
2. 首次公开时间早于窗口、窗口内新增方法、实验或关键结论的实质版本修订。

扩展时间窗时，保留原始搜索底稿，补充新增区间及其查询结果，并更新 `Search window`、`Published / updated`、`Accessed`、`Updated-At` 和局限中的截止说明。已审阅综合进入 `needs-review`。

## 三、建立统一比较框架

比较轴服务于研究问题。方法谱系通常需要回答以下问题：研究对象或分配单元是什么，识别信号来自哪里，信号如何进入训练或系统路径，比较成立需要哪些条件，哪些模型或角色负责生成、评价与更新。

当前 RL 信用分配综合使用五轴 canary：

```text
credit unit × identification signal × assignment operator × comparability condition × policy topology
```

其它主题需要重新定义字段，沿用字段名称需要给出机制对应关系。每个比较项至少包含机制、直接证据、最窄结论和主要边界；涉及效率时同时记录额外 rollout、模型调用、训练计算、环境重放和硬件条件。实验口径缺少共同基础时，表格只呈现条件差异和各自内部证据。

## 四、组织公开正文

研究综合保留 v2.1 的七个核心章节，方便索引、审阅状态和跨论文关系复用。公开页面采用以下阅读顺序：

1. 标题、综合判断、研究窗口和检索截止时刻。
2. 检索协议、纳入范围和结果边界。
3. 读者需要回答的问题与判断边界。
4. 统一概念框架和比较轴。
5. 时间演进或问题演进。
6. 横向机制比较、专门场景比较和直接证据。
7. 证据强度、开放问题、主要启发、局限与跨论文关系。

时间线适合回答“何时出现了什么变化”，比较表适合回答“方法之间具体差在哪里”，解释性段落负责连接原因、条件和后果。表格中的单元格保持可独立理解，术语首次出现时按领域惯用表达归一化，必要时在括号中保留英文原词。

构建器依据 `Material type: composite` 使用研究综合页头、时间窗、`Article` 结构化数据、责任组织署名和较宽的比较区域。`Source` 字段、`作者与关系`、公开审稿维护段和历史 `Reference Intake Brief` 保留在 Markdown 中，不进入公开正文；新的 v2.1 综合不再新增 `Reference Intake Brief`。

## 五、证据、关系与审阅状态

研究综合延续三层陈述：

1. **论文事实**：原文、图表、公式、代码或正式页面直接支持的内容。
2. **作者主张**：作者对贡献、原因、范围和意义的解释。
3. **本地综合**：统一符号、机制比较、演进判断、条件审计和开放问题。

综合材料没有单一作者时，使用 `Responsible organization`，不为 composite 新建作者 profile。来源论文的作者、机构和身份事实由对应单篇笔记与 `data/authors.json` 承担。综合中的 `跨论文关系` 记录主题延展、方法复用、团队连续产出和证据互补；旧论文只在新综合改变其核心理解或局限时回写。

新综合使用 `Review-Status: pending`。用户确认核心综合判断、纳入边界、直接证据、最窄结论和局限后进入 `approved` 并记录 `Reviewed-At`。时间窗扩展、方法集合变化、比较轴变化或核心结论调整均属于实质更新，已审阅综合进入 `needs-review`。

## 六、发布同步与语义门禁

研究综合仍使用 `/papers/<slug>/` 路由，并在 `content/utility/papers-index.md` 保留唯一一行，在 `data/paper-tags.json` 分配一个主标签和最多三个辅助标签。索引核心信号用一个自然语言句子概括研究对象、区别性框架、主要判断和会改变结论真值的边界。

提交前逐项确认：

1. 核心贡献对齐：标题、一句话结论、索引和正文中心判断一致。
2. 论证链完整：研究问题能够沿比较轴、时间线和证据得到回答。
3. 直接证据可定位：重要方法和结论绑定原始章节、公式、表格、页面或存档笔记。
4. 结论边界最窄：时间窗、纳入条件、版本口径和跨设置可比性均已显式说明。
5. 局限覆盖成立条件：检索遗漏、术语偏差、版本时效、计算差异和未审计材料均有记录。

<!-- public-utility-omit:start -->

本地检查命令：

```bash
npm run test:workflow
npm run check:workflow
npm run check:metadata
npm run check:math
npm run test:search
npm run test:pins
npm run build
npm run check:site
git diff --check
```

<!-- public-utility-omit:end -->

