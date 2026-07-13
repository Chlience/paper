# Paper Analysis Workflow

First-Archived-At: 2026-06-19
Updated-At: 2026-07-13

## 目标

本页说明这个论文档案如何把一次阅读变成可追溯、可更新、可连接的长期记录。它面向两类读者：公开网页上的读者可以看到笔记质量如何被约束；后续维护者可以按同一套流程继续新增论文、作者档案和跨论文关系。

每次用户给出 arXiv、PDF、论文项目页、技术博客或论文标题时，本目录按同一流程产出独立 Markdown 笔记，并维护 `content/utility/papers-index.md`、`data/authors.json` 和相关站点链接。

## 快速执行卡

一次完整归档依次经过九个阶段：

1. **受理与分类**：确认材料类型、任务范围和规范来源。
2. **来源快照**：记录标题、作者或责任组织、发布日期、读取版本和访问日期。
3. **结构抽取**：定位章节、图表、定理、实验、附录、代码与项目材料。
4. **问题重建**：写清研究问题、已有方案缺口、核心假设和可能的思考路径。
5. **机制与证据分析**：解释方法成立条件，并给关键判断添加证据定位。
6. **外部核验**：核验公开审稿状态、作者身份和跨论文关系。
7. **成文与归档**：按模板生成或更新论文笔记、索引和作者档案。
8. **一致性检查**：执行本地内容工作流、元数据、公式、搜索和置顶条目检查；生产站点构建与生成页面检查由 GitHub Actions 执行。
9. **提交与回写**：核对改动范围，创建本地提交；后续交流继续回写原笔记。

## Definition of Done

一篇材料完成归档需要同时满足以下条件：

- `Source` 可追溯到规范来源，材料类型、责任主体、发布日期、读取版本和访问日期完整。
- 必需章节均有实质内容，关键结论区分论文事实、作者主张和本地分析。
- 核心方法、实验、定理或系统结论附有章节、图、表、附录、页码、代码路径或 URL 定位。
- 审稿页类型、匹配置信度、观察日期和 venue 状态已记录；缺少公开审稿时给出明确分类。
- 每位可解析作者完成基础身份核验；高价值或有歧义作者完成深入核验，并同步稳定事实。
- `content/utility/papers-index.md` 已更新；`当前收录` 包含唯一的简称、首次公开月份和索引核心信号，作者、机构、主题、引用或方法关系已写入对应论文的 `跨论文关系`。
- 本地内容工作流、元数据、公式、搜索和置顶条目检查通过；GitHub Actions 负责 production build 与生成站点检查。
- `Reference Intake Brief` 使用标准决策值，并说明吸收、修订、跳过或请求确认的原因。
- 本次完整改动已创建本地 commit；仅在用户明确要求后推送。

## 公开归档原则

这个 archive 的目标是保留一条可以复查的理解链路，而摘要只承担入口作用。每篇笔记都要回答论文想解决什么问题、此前方法留下什么空白、作者可能如何从已有失败模式中想到当前 idea、证据链支撑到什么程度，以及这些结论和已存档论文如何连接。

归档时遵循几条原则：

- 先确认来源，再写判断。外部 URL、arXiv、项目页和框架文档都要记录版本、日期、作者和链接。
- 先重建问题，再解释方法。方法分析前必须写出研究问题、已有方案不足和作者可能的思考路径。
- 区分论文事实、作者主张和本地分析。本地讨论后的收敛要明确标注，避免写成论文原始结论。
- 作者关系和主题关系同样重要。论文笔记保留该论文语境下的作者分工、机构桥接和主题判断；作者页聚合稳定身份信息和跨论文出现记录。
- 读后交流要回写。用户后续提出的概念修正、反例、工程判断和跨论文联系，只要有长期价值，都要沉淀到对应笔记。

## 公开页面展示什么

网页优先展示会影响读者信任和检索效率的信息：

- 每篇论文的来源、版本、作者、归档时间和站点内链接。
- 一句话结论、论文脉络、关键实验或定理、主要启发和局限。
- 公开审稿状态和 reviewer 意见吸收：venue status、review 数量、rating / confidence、主要认可点、主要质疑点、作者 rebuttal 和可信度影响。
- 作者列表中的发表时机构，以及已核验且不重复的历史机构。
- 已存档论文之间的主题、方法、系统、机构、作者和引用关系。
- 作者页中的稳定公开信息：主页、GitHub、Scholar/DBLP/OpenReview、机构页和可公开核验的社交主页。

网页展示结论、证据来源和可信度边界；用于形成这些结论的中间操作记录不进入公开页面。

## 输入

常见输入包括：

- arXiv abstract URL，例如 `https://arxiv.org/abs/2606.04075`。
- PDF URL。
- 项目仓库或论文官网。
- 论文标题或作者名。

若用户没有明确要求联网，但材料来自外部 URL、arXiv 或需要最新版本，必须访问来源确认版本、作者和日期。

## 材料类型与来源快照

每份新笔记在 `Source` 中声明 `Workflow version: v2`，并从以下类型中选择一个 `Material type`：

- `research-paper`：有正式论文主体和可审计研究结论。
- `technical-report`：由机构或项目发布，重点披露模型、训练、系统或评测信息。
- `model-card`：围绕模型能力、限制、训练来源、评测和使用边界组织。
- `survey`：综合已有研究，主要贡献来自分类、比较和研究议程。
- `blog`：作者、实验室或机构发布的技术解释、更新或观点材料。
- `framework-docs`：框架文档、版本说明、设计文档或官方实现说明。
- `composite`：多个相互补充的官方材料共同构成分析对象，例如论文、模型卡与项目文档的组合。

v2 来源快照至少记录：

- `Canonical source`：承载当前材料身份与版本信息的规范 URL。`composite` 可以指向其他已归档材料的 `/papers/<slug>/` 页面或 `/archive/`；自身页面不能作为自己的来源。
- `Title`，以及 `Authors` 或 `Responsible organization` 至少一项。
- `Published / updated`：来源显示的发布日期或最近一次有意义更新时间。
- `Current version read` 与 `Version / revision read` 二者至少填写一项，写明实际读取版本；来源没有版本号时记录日期、commit 或页面状态。
- `Accessed`：本次核验来源的日期，格式为 `YYYY-MM-DD`。

arXiv 论文优先以 abstract 页面作为规范来源，并补充 PDF、HTML、源码、代码与项目页。网页、模型卡和框架文档优先使用官方页面或官方仓库，记录页面更新时间、release、tag 或 commit。第三方报道只承担线索和外部评论角色，不能替代责任主体发布的规范来源。

## 输出文件

每篇论文对应一个独立 Markdown 文件：

```text
content/papers/<arxiv-id>-<short-title-slug>.md
```

示例：

```text
content/papers/2606.04075-llms-hack-rewards-and-society.md
```

每篇论文笔记头部保留两个本地档案时间字段：

- `First-Archived-At`: 首次分析归档时间，格式为 `YYYY-MM-DD HH:mm`，用于页面展示、站点列表、首页和 RSS 的分钟级排序；同一天多篇论文必须填写不同分钟。
- `Updated-At`: 最近一次有意义内容更新的时间。后续补充讨论、修正表格或增加作者关系时更新它，但不改变首次归档排序。

综合入口、路线图或需要长期置顶的条目可以额外加入 `Pinned: true`。生成器会把置顶条目排在普通论文前面，置顶组内部仍按 `First-Archived-At` 倒序排列。普通论文默认省略该字段。

每次新增或更新论文后，同步更新：

```text
content/utility/papers-index.md
```

若论文作者已有档案，或新论文让某位作者在当前归档中跨论文重复出现，同步维护：

```text
data/authors.json
```

`data/authors.json` 只记录相对稳定的作者事实：英文姓名、中文姓名、别名、机构、主页、X 账号、账号核验状态、主题标签和来源链接。论文笔记的 `作者与关系` 章节只写发表时机构和已核验历史机构；跨论文作者、机构、主题、引用和方法关系统一写入对应论文的 `跨论文关系`。

## 九阶段执行流程

### 1. 受理与分类

- 输入：用户提供的 URL、标题、作者名、PDF、仓库或已有笔记。
- 动作：确认任务对象、材料类型、是否为更新任务、是否涉及安全或双用途内容。
- 输出：明确的分析对象、目标文件和材料类型。
- 停止条件：能够唯一识别材料；存在重名或版本歧义时先完成交叉验证。

### 2. 来源快照

- 输入：规范来源及其官方补充材料。
- 动作：记录标题、作者或责任组织、日期、版本、访问日期、相关链接和主题分类。
- 输出：完整的 `Source` 字段与可复查链接。
- 停止条件：关键身份字段有直接来源；缺失项已标明来源未披露。

### 3. 结构抽取

- 输入：HTML、TeX source、PDF、项目页、代码仓库和附录。
- 动作：优先读取结构化来源，提取章节、图表、定理、实验设置、baseline、限制和实现证据；PDF 用于核对页码、图表与排版。
- 输出：带位置标记的阅读提纲和证据清单。
- 停止条件：核心主张均能映射到原文位置，仍缺少的材料已经列入待核验项。

### 4. 问题重建

- 输入：摘要、引言、相关工作、结论和论文发表前已存在的背景材料。
- 动作：重建研究问题、价值、已有方案缺口、核心假设和作者可能的思考路径。
- 输出：`论文脉络` 前四部分的初稿。
- 停止条件：方法引入能够从已知问题和约束顺承推出，推断部分已标为本地分析。

### 5. 机制与证据分析

- 输入：方法、系统、理论、实验、附录、代码和前一步的问题模型。
- 动作：解释计算路径、成立条件、对照可比性、最窄可支持结论和失败边界；按材料类型启用相应分析模块。
- 输出：方法机制、关键实验或定理、证据强度、启发与局限。
- 停止条件：每项核心结论都有证据定位，并且结论范围没有超出证据覆盖范围。

### 6. 外部核验

- 输入：论文身份、作者列表、会议信息和已有档案。
- 动作：分类并核验公开审稿页；对每位可解析作者执行基础身份核验，对核心、重复或歧义作者执行深入核验；检索已有作者、机构、主题、引用和方法关系。
- 输出：审稿分类、作者稳定事实和跨论文关系候选。
- 停止条件：可用来源达到各字段的证据要求；继续搜索只会重复现有来源时结束。

### 7. 成文与归档

- 输入：来源快照、分析草稿、证据定位和外部核验结果。
- 动作：按模板写入 `content/papers/<slug>.md`，更新 `content/utility/papers-index.md` 和必要的 `data/authors.json` 条目。
- 输出：结构完整、链接规范、可公开展示的档案改动。
- 停止条件：模板必需章节均有内容，内部搜索过程未进入公开 Markdown。

### 8. 一致性检查

- 输入：本次 Markdown、JSON、图片和索引改动。
- 动作：运行本地内容工作流、元数据、公式、搜索和置顶条目检查；检查图片来源、作者别名冲突、重复归档时间与内部链接。生产 Astro build、`dist/` 页面检查、产物打包和部署由 GitHub Actions 执行。
- 输出：本地源文件检查结果与需要修复的问题列表。
- 停止条件：本地错误全部清零；历史兼容提示已审阅且没有由本次改动新增的异常。push 后的 CI build 作为部署门禁。

本地检查命令固定为：

```bash
npm run test:workflow
npm run check:workflow
npm run check:metadata
npm run check:math
npm run test:search
npm run test:pins
```

本地归档不运行 `npm run build` 或 `npm run check:site`。`check:site` 读取生成后的 `dist/`，应在 GitHub Actions 完成 production build 后执行。

### 9. 提交与回写

- 输入：通过检查的完整改动。
- 动作：核对差异和文件边界，创建本地 commit；用户后续讨论产生长期价值时回写原笔记并重新检查。
- 输出：可回溯提交，以及持续更新的论文、索引、作者档案和关系章节。
- 停止条件：commit 只包含当前任务；推送动作已经获得用户明确指令。

## 分析维度

每篇论文至少回答这些问题：

- 论文要解决什么研究问题；需要调研和补充哪些背景；这个问题为什么重要；解决后能带来哪些科学、工程、产品或治理价值。
- 这个问题之前是否已有解决方案；已有研究、系统、理论或评测为什么仍然不足；不足来自假设、规模、数据、指标、工程约束、泛化边界还是部署成本。
- 在正式讲方法前，重建作者可能的思考路径：仅使用论文提出前已经存在的背景、失败模式、经验观察和相关工作，模拟作者如何从这些线索中形成 intuition 和 idea。
- 作者的核心假设是什么。
- 方法或系统设计如何工作。
- 关键实验、定理或案例支撑什么结论。
- 实验设置是否写清楚：模型、数据、训练预算、rollout / batch / context length / reward / KL / entropy / optimizer / 系统配置、评测协议、baseline 选择和 baseline 强度。
- 哪些结论证据强，哪些需要谨慎。
- 对 LLM 安全、系统、理论、评测或产品有什么可复用启发。
- 论文的外部有效性、实验范围和实现限制是什么。
- 公开审稿意见如何改变可信度判断：哪些 reviewer 认可了问题价值，哪些 reviewer 指出了 theory、baseline、统计显著性、presentation 或 novelty 的硬伤；作者 rebuttal 是否实际回应了这些问题。

## 证据分层与定位

论文笔记中的陈述分为三层，层级描述来源性质，不代表价值排序：

1. **论文事实**：正文、附录、图表、代码或项目材料直接给出的设计、数字、定理、配置与限制。
2. **作者主张**：作者对贡献、原因、适用范围、失败模式和意义的解释，包括摘要、引言、结论、项目说明与 rebuttal。
3. **本地分析**：基于来源完成的机制重建、因果解释、跨论文比较、工程判断与可信度校准。

关键陈述需要附 `证据定位`，优先使用能够让下一位读者直接复查的位置：

- 论文：章节名、定理号、图号、表号、附录编号和 PDF 页码。
- 代码：仓库 URL、tag 或 commit、文件路径和必要的符号名。
- 网页：具体页面 URL、页面标题、发布时间或观察日期。
- 审稿材料：forum URL、review 类型和观察日期。

`作者可能的思考路径` 属于受约束的历史重建。它只能使用论文提出前已有的问题、失败模式和相关工作，并明确标为本地分析。机制解释中出现论文未直接陈述的因果关系时，也要给出推理依据和待复验条件。

## 方法机制推导与实现路径

当论文方法涉及关键数学变换、系统优化或实现层面的效率收益时，不能只写“用了某个机制”或“降低了某类成本”。笔记必须补齐机制为什么成立，以及它相对朴素路径具体省掉了什么。

写作要求：

1. 写清计算路径：先写朴素路径如何计算、缓存、通信或展开，再写优化路径如何改写，明确减少了哪一步成本。
2. 写清成立条件：若优化依赖矩阵结合律、转置、低秩分解、cache layout、prefetch、all-to-all、kernel fusion 或数值一致性条件，需要把这些条件显式写出。
3. 统一记号约定：涉及 tensor / matrix 推导时，优先使用和工程实现一致的行向量写法，例如 `x @ W`；若采用论文中的列向量写法，需要说明 convention。同一段推导内避免混用两种 convention。
4. 解释障碍来源：关键机制通常是为了解决某个原本无法优化的障碍，需要写清原始做法为什么会破坏优化。例如 RoPE 的位置相关旋转矩阵会阻止 key projection 被吸收到 query 侧。
5. 区分概念机制和高效实现：概念上可以先说“latent 还原成 key/value”；若高效实现通过代数改写、缓存布局或 kernel 优化避免反复展开完整历史 KV，需要单独写清。

一句话要求：凡是涉及核心效率收益或关键数学变换，必须同时写出朴素计算路径、优化后的计算路径、成立条件、记号约定，以及原方法为什么会阻碍该优化；优先使用与工程实现一致的 tensor / matrix 记号，避免只用高层术语替代机制推导。

## 术语与缩写处理

重要缩写首次进入正文分析时必须展开。尤其是领域内常见但普通读者未必默认知道的缩写，例如 ORM、PRM、RFT、STV、OTB、VIMPO、TIS、TV、KL、RLVR、GRPO、DAPO、MTP、KV Cache 等。

写法要求：

- 首次出现使用 `缩写 (English Full Name，中文译名或功能定义)`。例如 `PRM (Process Reward Model，过程奖励模型，用于给中间推理步骤打分)`，`ORM (Outcome Reward Model，结果奖励模型，用于判断整条解答最终是否正确)`。
- 若缩写出现在论文标题、Source、作者原文标题或引用标题中，可以保留原文；进入“一句话结论”“论文脉络”“关键实验/定理”等分析正文时再展开。
- 若一个段落或表格会集中使用多个缩写，先加一小段“术语预备”或在表格前用短句列出定义，避免读者读到中途才看到解释。
- 展开时给出该缩写在当前论文语境下的具体含义。相同缩写跨论文可能含义不同，例如 TV 可以表示 total variation，也可能表示 token-level variance；必须结合原文确认。
- 极常见工程缩写如 GPU、CPU、API、URL 可不强制展开；若缩写直接影响论文结论或实验设置，优先展开。
- 若无法确认全称，写明“不确定原文全称”，并用功能定义替代猜测。

## 按材料类型启用的分析模块

所有材料都需要来源快照、问题与价值、核心内容、证据边界、局限、关系分析和 `Reference Intake Brief`。其余模块按材料实际主张启用：

- **实验研究**：启用数据、模型、训练配置、评测协议、统计报告、baseline 强度、可比性和外部有效性审计。
- **系统研究**：增加硬件拓扑、软件栈、调度与通信路径、吞吐与延迟定义、负载条件、故障模式和成本归因。
- **理论研究**：增加定义、假设、定理、证明结构、反例、渐近条件，以及理论对象和实际系统之间的映射。
- **模型卡与技术报告**：增加训练数据、训练阶段、硬件、并行策略、框架版本、评测覆盖、安全边界、未披露项和成本信息。
- **综述**：增加纳入标准、时间范围、分类轴、覆盖缺口、引用偏差和与既有综述的差异。
- **安全与双用途研究**：增加威胁模型、攻击者能力、评测环境、现实可迁移性、防御启发和披露边界。
- **技术博客与框架文档**：增加责任主体、适用版本、API 或行为证据、实现路径、变更历史和与论文主张的一致性。

模板中的实验审计表提供通用候选项。写作时保留与当前材料相关的行，删除无关行；来源未披露的关键字段明确写“未披露”。一份材料同时涉及多个类型时可以组合启用模块，并在 `Material type` 使用 `composite`。

## 实验设置与 baseline 审计

LLM RL、post-training、systems、serving、optimizer 和评测类论文都必须把实验设置写到足够可复查。baseline 的选择和强度会直接改变结论可信度，不能只记录最终分数。若论文方法、系统或实验代码基于已有框架，还要做轻量级框架分析，明确它的 paper base：具体基于哪些训练、推理、服务、评测或 agent 框架，大版本或 commit 证据是什么，作者主要改动落在哪些模块。

### 必须记录的实验设置

每个核心实验至少记录：

1. 模型与初始化：base / instruct / aligned checkpoint，参数规模，MoE active / total 参数，context length，是否使用 reference model 或 value model。
2. 数据与任务：训练集、过滤规则、prompt 数量、验证 / 测试集、是否去重、是否含合成数据、是否和 benchmark 有污染风险。
3. RL / 训练配置：PPO / GRPO / DAPO / RLOO / REINFORCE / actor-critic 等目标；rollout group size；batch size；max prompt / response length；采样温度、top-p、top-k；KL penalty / KL loss；entropy bonus；reward shaping；optimizer、learning rate、warmup、训练步数和 token budget。
4. 系统配置：GPU 数量和型号，parallelism / sharding，rollout engine 与 trainer engine，是否异步，是否使用 vLLM / SGLang / Megatron / FSDP / ZeRO，是否有 fused kernel 或 logprob consistency 设置。
5. 框架基座 / paper base：若论文使用或改造现有框架，记录训练框架、推理 / rollout 框架、serving 框架、并行 / kernel 框架、agent loop / tool 框架、reward / evaluator 框架；尽量写出大版本、commit、release 日期或 README / requirements 证据。若只披露框架名，写明“版本未披露”。若没有相关实现，写“未涉及”。
6. 框架改动范围：区分直接调用、配置适配、fork / vendored code、核心模块改写和新增模块；写清作者改了 trainer、rollout、scheduler、agent loop、reward、data pipeline、kernel、benchmark harness 中的哪一部分。不要把框架本身能力写成论文贡献。
7. 评测协议：pass@1、avg@k、pass@$k$、majority vote、Best-of-N、temperature、top-p、样本数、判题器、工具环境、是否报告 peak / final / average checkpoint。
8. 统计报告：seed 数量、误差线、置信区间、显著性检验、曲线平滑方式；若缺失，明确写入局限。

技术报告、模型报告和系统报告还必须单独写清训练相关信息：

- 训练硬件：GPU / TPU 数量、型号、节点数、每节点卡数、NVLink / NVSwitch / InfiniBand / Ethernet 等拓扑。
- 并行方式：PP / TP / EP / DP / SP / FSDP / ZeRO / sequence parallel / expert parallel 的度数、跨节点范围、是否异步、是否使用自研调度或 fused kernels。
- 框架栈：具体训练框架、推理 / serving engine、分布式训练后端、checkpoint / weight sync 方式、数据处理和评测 harness；优先记录大版本，例如 `verl 0.x`、`SGLang 0.4.x`、`Megatron-Core 0.13.x`、`PyTorch 2.x`、`CUDA 12.x` 这类粒度。版本证据不足时记录来源和缺口。
- 训练数据：pretraining tokens、数据组成变化、语言覆盖、代码 / 数学 / 多模态比例线索、去重 / 过滤 / packing、FIM 或合成数据比例；SFT / RL 数据量、来源、生成器和人工校验方式。
- 训练过程：sequence length、context extension 阶段、batch size schedule、optimizer、learning-rate schedule、warmup、gradient clipping、训练步数、token budget、checkpoint / rollback 情况。
- 训练时间与成本：GPU hours、wall-clock time、每 trillion tokens 成本、pretraining / context extension / post-training 分项成本、公开成本是否排除研究试错和 ablations。
- 未披露项：若卡数、并行、数据、训练时间或成本缺失，明确写“未披露”，并把它放入可信度边界或局限。

数字密集的训练配置、成本、benchmark 和 ablation 信息优先使用 Markdown 表格；正文只保留判断、条件和边界。

### baseline 强度判断

每个核心表格或图都要记录 baseline 相关判断：

- baseline 名称和版本：GRPO、DAPO、PPO、RLOO、OPO、VAPO、SimpleTIR、verl recipe、官方实现、作者复现或本地复现。
- baseline 是否 tuned：学习率、KL、clip、batch、rollout group size、max length、reward shaping、token-level loss aggregation 等关键超参是否和新方法同等调参。
- baseline 是否 compute-matched：训练 token、rollout 数、GPU hours、wall-clock、batch size、采样预算、评测样本数是否相同或可比。
- baseline 是否 implementation-matched：同一数据、同一 trainer、同一 rollout engine、同一 reward / verifier、同一 logprob 计算路径。
- baseline 是否覆盖强替代方案：LLM RL 论文尤其要检查是否包含 DAPO / GRPO tuned recipe、actor-critic / value baseline、rollout correction、rejection / filtering、sequence-level trust region、larger group size 或更强 sampling baseline。
- baseline 是否存在弱化风险：旧 checkpoint、未调参、短 context、少 rollout、不同 evaluator、不同训练预算、缺少 strong recipe、只比较 naive GRPO/PPO。
- baseline 结论边界：若 baseline 选择弱或 compute 不匹配，结论写成“相对这些 baseline 成立”，避免扩展成对整个方向的胜出。

### 写入位置

- `关键实验/定理` 中每个结果都要有 `设置`、`Baseline`、`指标`、`结果`、`解读`。
- 若 baseline 选择影响可信度，在 `证据链强度评估 -> 需要谨慎的推论` 和 `局限` 中重复点明。
- 若 reviewer 批评 baseline 不完整、统计显著性不足或实验设置不公平，在 `OpenReview / 审稿意见吸收` 中明确写入，并说明作者 rebuttal 是否补充实验。

## 关键图嵌入与摘录

论文中重要图、项目图、HTML 图、PDF 图表裁剪、截图和必要的本地辅助示意图都可以进入归档。准入标准以信息价值为先：图必须能澄清关键事实、补充文字难以承载的信息量，或直接帮助读者复查机制、实验结论和失败边界。优先使用论文 TeX source、HTML、项目页或官方仓库中已经公开提供的图片；若使用截图、PDF 裁剪或本地辅助示意图，必须在图注中说明来源形态，不能改写数据、删改关键坐标或让本地推论看起来像论文原始结论。默认把图嵌入到首次需要它的正文位置附近，例如方法图放在对应机制小节，训练信号图放在标签或 loss 说明附近，主结论图放在对应实验结果旁边。目标是提升机制理解和证据复查效率，避免把论文复制成图片集。

### 适合摘录的图

每篇论文默认摘录 $0$ 到 $3$ 张图。只有满足以下至少一条时才摘录：

- 架构、系统路径或数据流图：例如模型结构、训练 / 推理流水线、cache / memory / communication path。
- 关键训练信号或标签构造图：例如 reward、indexer、verifier、dataset pipeline、credit assignment 的生成流程。
- 主结论图：例如 accuracy / memory / latency / cost 的核心 tradeoff，或支撑论文最主要 claim 的曲线。
- 失败边界图：例如 scaling collapse、ablation failure、OOD degradation、false positives、latency tail。
- 跨论文关系图：能够直接帮助比较已有归档论文的方法、系统层级或证据边界。

不摘录只起装饰作用、信息可由表格完整表达、与主结论关系弱或版权风险高的图片。若一张图只提供少量数值，优先改写成 Markdown 表格和文字解读。若图片来源无法核验、许可风险明显或需要过度裁剪才能读懂，改用文字或表格说明。

### 存放、命名与正文位置

图片文件放在：

```text
public/images/papers/<paper-slug>/fig-<n>-<short-name>.<ext>
```

Markdown 中使用站点路径引用，并直接放在相关分析段落附近：

```markdown
![Figure 1: short description](/images/papers/<paper-slug>/fig-1-short-name.png)

Figure 1: 原始 caption 的中文翻译或轻度修饰，保留图中变量、方法名和实验条件。Image Source: [source label](<image source URL>).
```

不默认新建独立 `关键图摘录` 章节。只有综合综述、图谱型文章、或多张图需要集中比较时，才建立图集式章节。普通论文笔记里，图应随正文论证出现。

图注不写 `from <paper title>` 这类重复来源说明，也不把本地“重要性”分析写进 caption。图注主体优先来自论文原始 caption，可以翻译、压缩或轻度修饰，末尾统一追加 `Image Source: ...` 指向具体图片文件来源。若使用截图、PDF 裁剪或本地辅助示意图，`Image Source` 前要写清 `Screenshot`、`PDF crop` 或 `Local schematic based on ...`。若需要说明这张图为什么重要，放在图前后的正文分析中。

### 版权与复现边界

- 优先使用论文 TeX source、HTML、项目页或官方仓库中许可清楚的图片文件。
- 截图、PDF 裁剪和本地辅助示意图只用于高价值场景：能澄清机制、证据或边界，并且来源标注足够清楚。
- 本地辅助示意图必须明确标注为本地生成，不能手工复刻论文图、不能伪装成论文原图，也不能加入论文未声称的数据或结论。
- 每张图必须有明确图片来源链接或可追溯来源说明；没有摘录理由时删除图片，摘录理由写在正文分析中。
- 安全或双用途论文中的图若包含可直接滥用流程，放弃缓存该图，改写成高层文字 summary，避免沉淀操作细节。

## 审稿意见搜索与吸收

每篇论文都要做 reviewer opinion check。这个检查用于校准可信度。写作时分别记录社区传播热度、工程采用、公开审稿认可和最终录用状态，避免不同信号相互替代。

### 页面分类

`OpenReview / 审稿意见吸收` 固定记录 `Page type`、`Match confidence` 和 `Observed at`：

- `official-review`：可确认与当前材料匹配的正式投稿 forum，并公开 official review、meta review、decision 或 rebuttal。只有这一类页面可以支持 reviewer 数量、评分、共识、批评和作者回应。
- `metadata-only`：投稿页只公开标题、作者、状态或少量元数据，未公开可读审稿内容。它可以支持投稿身份和页面状态。
- `proceedings`：会议 proceedings、出版社或 anthology 页面。它可以支持发表与录用状态，通常不能支持审稿过程判断。
- `commentary`：社区评论、媒体报道、论坛讨论或非正式评议。它作为外部观察单独引用，不能写成正式 reviewer 意见。
- `not-found`：在既定搜索范围内没有找到可可靠匹配的公开审稿页。
- `not-applicable`：当前材料类型没有正式同行评审语境，例如部分框架文档或产品模型卡。

`Match confidence` 使用 `high`、`medium` 或 `low`。标题、作者、摘要、材料版本和 venue 标识形成一致匹配时可以记为 `high`；存在标题变更或匿名投稿但有多项交叉证据时可记为 `medium`；弱匹配只能作为线索，不能承载审稿结论。`Observed at` 使用 `YYYY-MM-DD`，因为公开状态可能继续变化。

### 搜索顺序

1. 优先使用论文 `Source` 中已经出现的 OpenReview / ARR / conference submission URL。
2. 若只有 arXiv 或 PDF，用标题、作者和年份搜索公开投稿页：
   - `"Paper Title" OpenReview`
   - `"Paper Title" "Official Review"`
   - `"Paper Title" ICLR OR NeurIPS OR ICML OR ACL OR ARR`
   - `"arxiv_id" OpenReview`
3. 若标题改动或存在匿名投稿，用作者组合、摘要关键词和 arXiv id 交叉匹配。匹配证据不足时，将页面记为低置信线索，最终分类使用 `not-found` 或继续核验。
4. 对 OpenReview forum，优先拉取 API，再用网页正文补充核对：

```text
https://api2.openreview.net/notes?forum=<forum_id>&details=replyCount,directReplies,replies
```

5. 在返回 notes 中重点筛选这些 invitation 或字段：
   - `Official_Review`
   - `Author_Response` / `Rebuttal`
   - `Meta_Review`
   - `Decision`
   - `Withdrawal`
   - `Comment`
6. 若 API v2 无结果，再尝试网页可见内容、OpenReview revisions、会议 proceedings 页面、ACL Anthology review attachment 或 ARR 页面。完成既定搜索范围后按页面分类记录结果。

### 记录内容

完成搜索后，论文笔记中新增或更新 `OpenReview / 审稿意见吸收` 小节，至少记录：

- Page type: 使用上述六类枚举。
- Match confidence: `high` / `medium` / `low`。
- Observed at: 本次观察日期，格式为 `YYYY-MM-DD`。
- Venue status: submitted / withdrawn / accepted / rejected / under review / unknown。
- Public reviews: review 数量；若公开 rating / soundness / confidence，记录分布或范围。
- Reviewer consensus: 主要认可点，例如问题重要性、方法新意、实验覆盖、工程可用性。
- Main criticisms: 主要质疑点，例如理论假设、baseline 不完整、统计显著性、ablation 不足、泛化边界、写作或 novelty。
- Author response: 是否公开 rebuttal；作者是否补充实验、承认限制或澄清误解。
- 对可信度的影响: 明确哪些主张应上调可信度，哪些主张应降级为待复验。

写法要求：

- 只摘取少量必要短语，不复制大段 reviewer 原文。
- 将 reviewer 意见转写成可复查的技术判断，避免把单个 reviewer 的措辞写成定论。
- rating 低但工程生态采用强时，明确区分“实践参考价值”和“正式审稿认可度”。
- 若论文已撤稿或无公开决定，不能写成已获会议背书。
- 页面分类为 `metadata-only`、`proceedings`、`commentary`、`not-found` 或 `not-applicable` 时，只记录该页面直接支持的事实，并在 `Reference Intake Brief -> Skipped` 说明缺少正式 reviewer 内容。

## 交流沉淀

完成初版阅读和分析后，若用户继续围绕该论文追问、质疑、要求类比、纠偏、总结或生成社交媒体表达，需要把有长期价值的讨论回写到对应论文笔记。

沉淀内容包括：

- 对论文主张的更精确表述。
- 用户指出的概念修正、边界条件和反例。
- 公式化重述、因果链、直觉解释和工程判断。
- 对论文结论强弱的再校准。
- 与已有论文、技术博客、框架或系统实现的新关系。
- 可复用的诊断指标、评测 checklist 或实践建议。

写入位置：

- 默认写入对应笔记的 `本地讨论补充` 章节。
- 若讨论修正了 `一句话结论`、`局限`、`主要启发` 或 `跨论文关系`，同步更新对应章节。
- 若讨论改变了对论文核心贡献、主张边界或本地评价的读法，在 `一句话结论` 后补一段 `本地评价：...`，用一到两段前置呈现收敛判断；完整推理链仍保留在 `本地讨论补充`。
- 若讨论产生新的作者关系、主题延展、方法复用或跨材料关系，在相关论文各自的 `跨论文关系` 中补充；核心信号发生变化时再更新 `content/utility/papers-index.md`。

写法要求：

- 标明这是本地讨论后的分析收敛，避免写成论文作者原始主张。
- 保留用户提出的关键判断，但用可复查的技术语言表达。
- 对未验证推论写清楚适用条件和待复验指标。

## 作者关系分析

每篇论文必须有 `作者与关系` 章节。

作者身份核验分为两层：

- **基础核验**：覆盖 `Source -> Authors` 中每位可解析的个人作者。至少确认姓名规范形式、论文发表时机构、与已有档案是否重合，并搜索一项稳定学术身份来源。团队署名和无法可靠拆分的超大作者列表按团队处理。
- **深入核验**：覆盖通讯作者、核心作者、代码仓库维护者、项目负责人、跨论文重复作者以及姓名或机构有歧义的作者。交叉核验个人主页、机构页、GitHub、Scholar、DBLP、OpenReview 和公开社交主页，按字段保存来源。

基础核验保证作者关系图的覆盖率；深入核验用于补充高价值字段和解决身份冲突。单一来源只支持它直接给出的字段，社交账号等易误配字段需要更强的交叉证据。搜索达到可信来源要求或连续结果开始重复时结束，并把未解决歧义留空。

记录内容：

- 每位作者发表该论文时的机构。
- 已有作者档案中经过核验的历史机构。
- 与当前已存档论文的作者是否重叠。
- 与已有论文是否存在同主题、同方法、同系统、同数据集、同机构或引用关系。
- 若作者已有 `/authors/<slug>/` 页面，在相关论文笔记中优先使用作者页链接。
- 若作者个人信息经过核验，更新 `data/authors.json`；只记录稳定来源和公开可展示字段。
- 对进入深入核验的作者，优先核验主页、GitHub、Scholar/DBLP/OpenReview、机构页和项目页。
- 若证据只支持部分字段，只写入已核验字段；证据不足的字段留空。论文 Markdown 不记录核验过程。

判断要求：

- 来源明确的机构事实直接写事实。
- 作者列表说明只写发表时机构和已核验历史机构；作者条目冒号后直接写发表该论文时的机构，不加发表时机构前缀。
- 若已核验历史机构包含发表该论文时的机构，历史机构中省略该重复项；没有额外历史机构时，不写 `历史机构：`。
- 作者重叠、跨机构桥接、主题延展和方法复用写入对应论文的 `跨论文关系`，避免把维护过程写进作者列表。

## 笔记结构

新增论文笔记使用 [paper-note-template.md](/template/)。若论文是纯理论、系统、方法论或安全评测，可调整章节名，但必须保留以下核心章节：

- `Source`
- `作者与关系`
- `一句话结论`
- `论文脉络`
- `关键实验/定理`
- `证据链强度评估`，其中必须包含实验设置与 baseline 强度判断
- `OpenReview / 审稿意见吸收`，若无公开审稿则在 `Reference Intake Brief -> Skipped` 记录
- `主要启发`
- `局限`
- `跨论文关系`
- `Reference Intake Brief`

`论文脉络` 章节必须在方法分析前包含三段前置分析：

1. `研究问题、背景和价值`：说明论文提出并解决的研究问题，补充必要背景，解释问题重要性和解决价值。
2. `已有解决方案与不足`：说明此前相关工作如何处理该问题，以及为什么还留下空白或代价。
3. `作者可能的思考路径`：从已有背景、失败模式、经验观察和相关工作出发，重建作者可能如何想到当前 idea；这一段先于方法介绍，避免把论文自身贡献当作前提。

若阅读后的交流产生了有效补充，必须加入或更新：

- `本地讨论补充`

`关键实验/定理` 中的每个核心结果应写明 `证据定位`、`对照是否可比` 和 `支持的最窄结论`。`OpenReview / 审稿意见吸收` 使用固定页面分类。`Reference Intake Brief -> Recommendation` 的 `Decision` 只使用 `merge`、`revise-then-merge`、`skip` 或 `ask-user`。

## 站点链接规范

面向站点展示的内部链接在 Markdown 源文件中直接使用站点路径：

- 已存档论文：`[2504.13837](/papers/2504.13837-rlvr-reasoning-boundary-base-model/)`。
- 作者页：`[Tri Dao](/authors/tri-dao/)`。
- 索引页：`[papers-index.md](/archive/)`。
- 工作流页：`[paper-analysis-workflow.md](/workflow/)`。
- 模板页：`[paper-note-template.md](/template/)`。

写作要求：

- 论文笔记及其 `跨论文关系`、`content/utility/papers-index.md` 中的已存档论文链接必须使用 `/papers/<slug>/`，作者链接必须使用 `/authors/<slug>/`，避免写成相对 `.md` 链接。
- 当文本是在说明本地要编辑的文件名时，使用代码样式，例如 `2504.13837-rlvr-reasoning-boundary-base-model.md`。
- 新增论文后，若其它笔记或索引提到该论文并需要跳转，也同步补成 `/papers/<slug>/` 链接。

## Markdown 公式写法

站点在构建期使用 KaTeX 渲染 Markdown 里的 LaTeX 公式。论文 Markdown 中的数学公式必须使用 `$...$` 或 `$$...$$` 包裹：

- 行内公式使用 `$...$`，例如 `$a_t = b_t + c_t$`。
- 独立单行公式使用 `$$...$$`，例如：

```text
$$
L_t = \sum_i g_i g_i^\top
$$
```

写作要求：

- 不使用 `\(...\)`、`\[...\]` 或裸 `\begin{equation}...\end{equation}` 作为 Markdown 源文公式分隔符；若需要 equation / aligned / split 等 LaTeX 环境，外层仍用 `$$...$$` 包裹。
- 不把数学表达式放进反引号代码样式中。例如写 `$\pi_{\phi_d}$`，不要写 `` `\pi_{\phi_d}` ``。
- 简短符号和变量关系优先写成行内公式；需要独立展示的推导、loss、定理表达和更新规则写成单行或多行 `$$...$$` 公式块。
- 普通美元金额和 shell 变量尽量放进反引号代码中，例如 `` `$HOME` ``。
- 长公式优先使用块级公式，减少表格和移动端横向撑开。
- 公式只用于保留必要符号、更新规则和定理表达；正文解释仍需用自然语言说明变量含义。

## 索引更新

更新 [papers-index.md](/archive/) 时，`当前收录` 固定使用以下结构：

| 简称 | 时间 | 核心信号 |
| --- | --- | --- |
| `SPIRAL` | `2026年6月` | 把 search traces、set construction、aggregation trace 放进同一个 RL 目标。 |

三列分别遵循以下规则：

1. **简称**：使用论文、方法、系统或模型最稳定的公开简称，并将简称直接链接到 `/papers/<slug>/`。
2. **时间**：使用论文或材料首次公开月份，格式固定为 `YYYY年M月`；归档时间不进入这一列。表格按该月份从新到旧排列；同月条目保留现有相对顺序。
3. **索引核心信号**：从 `一句话结论` 提炼一条完整句子，说明论文新增的机制、训练目标、系统能力或可验证结论。它需要绑定核心贡献，避免作者、机构、模型清单、实验关键词和 Theme 式堆叠。

索引完整性要求：

1. `content/papers/*.md` 中每个 slug 在 `当前收录` 中恰好出现一次。
2. `当前收录` 不能保留已经删除的论文，也不能使用其它章节中的论文链接代替表格行。
3. 每行必须包含非空简称、规范月份和索引核心信号；新增论文在这三项完成后才满足归档要求。
4. 单篇作者、机构和贡献关系保留在对应论文的 `作者与关系`，稳定作者事实进入 `data/authors.json`；索引不按论文重复维护作者或机构分组。
5. 索引不维护全局 `跨论文关系`；每篇论文必须在自己的 `跨论文关系` 中保留能改变理解的作者重叠、实验室连续产出、主题延展、引用或方法复用。当前没有可靠关系时明确记录 `暂无高置信跨论文关系。`。

`check:workflow` 会对论文文件集合与 `当前收录` 执行双向比较，并拒绝缺失、重复、失效链接和不符合三列契约的表格行。

## 作者页维护

作者页由构建脚本从两类信息生成：

1. `data/authors.json` 中的人类维护档案，适合记录主页、X、机构、主题和核验来源。
2. 论文 `Source -> Authors` 中的姓名、别名和正文中的 `/authors/<slug>/` 链接，用于汇总相关论文并识别跨论文重复作者。

维护原则：

- 作者页存放稳定身份信息和跨论文聚合；论文页作者列表只保留发表时机构和额外已核验历史机构，条目中不加发表时机构前缀。
- 账号、主页、机构、中文姓名等事实必须有来源链接。公开社交主页只有在来源链条足够稳定时才展示。
- 若作者有已核验中文姓名，在 `data/authors.json` 写入 `chineseName`；站点展示为 `English Name (中文姓名)`。
- 无法可靠拆分的团队署名、大规模 author list、文档贡献者列表先保留在论文页，不自动拆成作者页。
- 新增作者档案后通过本地工作流检查 profile 关联、slug、别名和来源；push 后由 GitHub Actions 生成并检查 `/authors/` 与 `/authors/<slug>/` 页面。
- `data/authors.json` 中每个 profile 至少关联一篇剩余论文。直接作者链接、`Source -> Authors` 姓名和 alias 都可建立关联；完全没有关联的 profile 会触发 `orphan-author-profile` 硬错误。

每次新增或更新论文时按以下顺序执行作者页维护：

1. 从 `Source -> Authors`、`作者与关系`、项目页、代码仓库和 appendix 中抽取作者与可核验角色。
2. 在 `data/authors.json` 和已有论文笔记中搜索候选作者，确认已有档案、别名、中文姓名和跨论文重复情况。
3. 对需要补充档案的作者，核验主页、GitHub、学术主页、机构页、项目页和可公开核验的社交主页。
4. 交叉验证后更新 `data/authors.json`；若找到作者页，在论文笔记中使用 `/authors/<slug>/` 链接。
5. 对团队署名、超大作者列表或证据稀疏作者，保留团队或机构级记录；论文 Markdown 不写个人核验过程。
6. 完成本地作者关联与内部链接检查；作者页和论文页的 production 生成结果由 GitHub Actions 检查。

## 论文删除与反向清理

删除论文会同时影响索引、作者聚合、跨论文关系和静态资源。执行文件删除前，先按项目高危操作规则列出绝对路径、操作类型和数据丢失风险，并取得二次确认。

确认后依次处理：

1. 删除 `content/papers/<slug>.md`，并移除 `当前收录` 中对应的唯一表格行。
2. 搜索该 slug，在剩余论文各自的 `跨论文关系` 中删除或修订已经失效的关系描述。
3. 清理只服务该论文的 tag override、legacy manifest 条目和静态图片；目录或图片删除仍遵循高危操作确认要求。
4. 重新计算剩余论文中的作者关联。某个 `data/authors.json` profile 若没有 `/authors/<slug>/` 链接，也没有通过 `Source -> Authors` 姓名或 alias 关联任何论文，在同一提交中删除该 profile。
5. 运行本地内容与反向完整性检查。`missing-index-entry`、`stale-index-entry`、`duplicate-index-entry` 与 `orphan-author-profile` 都属于必须修复的硬错误。

构建脚本只负责聚合关联，不会静默删除人工维护的作者资料。删除动作保持显式、可审查，并与论文删除处于同一提交。

## 版本更新与勘误

已有笔记遇到 arXiv 新版本、项目页更新、会议状态变化、作者更正或本地讨论修正时，执行增量更新：

1. 先比较旧笔记的 `Current version read`、`Version / revision read`、`Published / updated` 与当前规范来源。
2. 按来源元数据、方法定义、实验数字、图表、作者与机构、审稿状态、限制和结论逐项检查差异。
3. 新版本改变关键结论时，更新对应证据定位、最窄结论、局限和跨论文关系；保留必要的版本差异说明。
4. 来源修正了数字、作者或状态时，把更正后的事实写入正文，并在 `本地讨论补充` 或相关小节说明原判断为何调整。
5. 只有实质内容变化才更新 `Updated-At`。链接格式、错别字等纯维护调整可以保留原时间，避免制造虚假的内容更新时间。
6. 更新后重新执行本地完整检查，并确认索引、作者档案和关联笔记是否需要同步修订。

## 收尾提交策略

每完成一篇论文的分析、索引更新和作者页维护后，默认创建一个独立 commit，但不自动 push。

执行顺序：

1. 先完成本地内容、元数据、公式、搜索和置顶条目检查；production 页面生成与站点检查交给 GitHub Actions。
2. 用 `git status --short` 检查工作区，识别本篇论文相关改动和既有未提交改动。
3. 只 stage 本篇论文对应的 Markdown、`content/utility/papers-index.md`、`data/authors.json` 和必要静态资源；`dist/` 与 `src/generated/` 不进入 commit。若工作区已有其他论文或无关改动，不能合入本篇 commit。
4. commit message 使用本篇论文的 arXiv id 或短标题，保持一篇论文一个 commit，便于回溯和回滚。
5. commit 后再次检查 `git status --short`，确认剩余未提交内容属于其他任务或历史遗留。
6. 不执行 `git push`；只有用户明确要求 push / 推送时再推送远端。

## 安全与双用途处理

涉及安全、漏洞、攻击、绕过、滥用、社会制度套利、模型越狱或 agent 工具滥用时：

- 保留问题定义、机制、评测结果、防御启发和治理建议。
- 避免沉淀逐步可执行攻击流程。
- 对真实世界机构、法律或合规议题，标明论文实验是否为模拟环境。
- 对高风险推论，区分作者主张和本地分析。

## 质量检查

发布前检查：

- 新增或更新内容是否已写入对应 Markdown / JSON 文件。
- `content/utility/papers-index.md` 的 `当前收录` 是否与论文文件集合双向一致，按首次公开月份从新到旧排列，且每行包含简称、首次公开月份和索引核心信号。
- v2 笔记是否声明工作流版本和材料类型，并记录规范来源、责任主体、发布日期或更新时间、读取版本和访问日期。
- 是否把稳定作者来源同步到 `data/authors.json`；论文 Markdown 不应包含作者核验过程。
- 作者页相关信息是否同步到 `data/authors.json`，论文笔记是否使用 `/authors/<slug>/` 链接。
- `data/authors.json` 是否没有失去全部论文关联的孤立作者 profile。
- 每篇论文是否包含作者关系；每位可解析作者是否完成基础身份核验，需要深入核验的作者是否达到字段证据要求。
- 每篇论文是否包含非空 `跨论文关系`；当前没有可靠关系时是否明确记录 `暂无高置信跨论文关系。`。
- 是否保留来源 URL 和版本日期。
- 是否完成公开审稿意见搜索并记录 Page type、Match confidence、Observed at；只有正式审稿页才吸收 reviewer consensus、主要质疑、作者回应和可信度影响，其他类型是否按证据边界记录。
- 是否在核心实验中写清楚实验设置、baseline 名称/版本/调参强度、compute 是否匹配、实现是否匹配和评测协议。
- 每项核心结果是否包含证据定位、对照可比性和证据支持的最窄结论。
- 若摘录关键图，是否有明确的信息价值，是否能澄清机制、证据或边界，是否放入 `public/images/papers/<paper-slug>/`，Markdown 是否使用 `/images/papers/<paper-slug>/...` 站点路径，图注是否说明来源形态并包含 `Image Source`，版权边界是否清楚。
- 是否区分来源事实、作者主张和本地推论。
- 是否在方法前回答研究问题、已有工作不足，并重建作者可能的思考路径。
- 是否把阅读后的有效交流提炼进对应笔记。
- `Reference Intake Brief` 是否使用标准决策值并解释原因。
- 是否存在先否定前项、再强调后项的对照式中文表达。
- 是否避免长段复制论文原文。
- 面向站点展示的内部链接是否使用 `/papers/<slug>/`、`/authors/<slug>/`、`/archive/`、`/workflow/` 或 `/template/`。
- 本地内容工作流、元数据、公式、搜索和置顶条目检查是否全部通过；production build 与生成站点检查是否明确交给 GitHub Actions。
