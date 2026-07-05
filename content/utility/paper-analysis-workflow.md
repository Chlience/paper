# Paper Analysis Workflow

First-Archived-At: 2026-06-19
Updated-At: 2026-07-05

## 目标

本页说明这个论文档案如何把一次阅读变成可追溯、可更新、可连接的长期记录。它面向两类读者：公开网页上的读者可以看到笔记质量如何被约束；后续维护者可以按同一套流程继续新增论文、作者档案和跨论文关系。

每次用户给出 arXiv、PDF、论文项目页、技术博客或论文标题时，本目录按同一流程产出独立 Markdown 笔记，并维护 `content/utility/papers-index.md`、`data/authors.json` 和相关站点链接。

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

`data/authors.json` 只记录相对稳定的作者事实：英文姓名、中文姓名、别名、机构、主页、X 账号、账号核验状态、主题标签和来源链接。论文笔记的 `作者与关系` 章节只写发表时机构和已核验历史机构；跨论文作者、机构和主题关系写入 `content/utility/papers-index.md` 或 `跨论文关系`。

## 阅读顺序

1. 打开 arXiv abstract 页面，记录标题、作者、提交日期、版本、主题分类、项目链接。
2. 优先读取 HTML 或 TeX source。若 arXiv / publisher / project page 提供 HTML 版本或源码包，先读这些结构化来源；PDF 主要用于核对页数、图表和排版信息。尽量避免把 PDF parser 作为主要信息来源，因为公式、表格、脚注、作者信息和多栏排版容易在解析中丢失或错乱。
3. 抽取章节结构、摘要、图表标题、定理、表格、实验设置、baseline 设置和结论。
4. 先读 introduction 和 conclusion，确认论文真实目标。
5. 在正式进入 method / system / theory 前，先重建研究问题、已有工作不足和作者可能的思考路径。
6. 再读 method / system / theory / experiment，梳理证据链。
7. 最后读 limitation、ethics、appendix 和 project README，补齐边界条件。
8. 搜索公开审稿意见。若论文有 OpenReview、ARR、会议投稿页或可匹配的公开 peer review，按 `审稿意见搜索与吸收` 章节记录 venue status、review 数量、rating / confidence、主要认可点、主要质疑点、作者回应和可信度影响；若未发现公开审稿，写入 `Reference Intake Brief -> Skipped`。
9. 完成论文初稿后，核验作者公开身份信息；稳定来源写入 `data/authors.json`，跨论文作者、机构和主题关系写入 `content/utility/papers-index.md`。核验过程本身不写入论文 Markdown。

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

## 实验设置与 baseline 审计

LLM RL、post-training、systems、serving、optimizer 和评测类论文都必须把实验设置写到足够可复查。baseline 的选择和强度会直接改变结论可信度，不能只记录最终分数。

### 必须记录的实验设置

每个核心实验至少记录：

1. 模型与初始化：base / instruct / aligned checkpoint，参数规模，MoE active / total 参数，context length，是否使用 reference model 或 value model。
2. 数据与任务：训练集、过滤规则、prompt 数量、验证 / 测试集、是否去重、是否含合成数据、是否和 benchmark 有污染风险。
3. RL / 训练配置：PPO / GRPO / DAPO / RLOO / REINFORCE / actor-critic 等目标；rollout group size；batch size；max prompt / response length；采样温度、top-p、top-k；KL penalty / KL loss；entropy bonus；reward shaping；optimizer、learning rate、warmup、训练步数和 token budget。
4. 系统配置：GPU 数量和型号，parallelism / sharding，rollout engine 与 trainer engine，是否异步，是否使用 vLLM / SGLang / Megatron / FSDP / ZeRO，是否有 fused kernel 或 logprob consistency 设置。
5. 评测协议：pass@1、avg@k、pass@$k$、majority vote、Best-of-N、temperature、top-p、样本数、判题器、工具环境、是否报告 peak / final / average checkpoint。
6. 统计报告：seed 数量、误差线、置信区间、显著性检验、曲线平滑方式；若缺失，明确写入局限。

技术报告、模型报告和系统报告还必须单独写清训练相关信息：

- 训练硬件：GPU / TPU 数量、型号、节点数、每节点卡数、NVLink / NVSwitch / InfiniBand / Ethernet 等拓扑。
- 并行方式：PP / TP / EP / DP / SP / FSDP / ZeRO / sequence parallel / expert parallel 的度数、跨节点范围、是否异步、是否使用自研调度或 fused kernels。
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

## 审稿意见搜索与吸收

每篇论文都要做 reviewer opinion check。这个检查服务可信度校准，不服务“找背书”。写作时要把社区传播热度、工程采用、公开审稿认可和最终录用状态分开。

### 搜索顺序

1. 优先使用论文 `Source` 中已经出现的 OpenReview / ARR / conference submission URL。
2. 若只有 arXiv 或 PDF，用标题、作者和年份搜索公开投稿页：
   - `"Paper Title" OpenReview`
   - `"Paper Title" "Official Review"`
   - `"Paper Title" ICLR OR NeurIPS OR ICML OR ACL OR ARR`
   - `"arxiv_id" OpenReview`
3. 若标题改动或存在匿名投稿，用作者组合、摘要关键词和 arXiv id 交叉匹配。匹配证据不足时，只写“未能可靠匹配公开 review”，避免弱匹配。
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
6. 若 API v2 无结果，再尝试网页可见内容、OpenReview revisions、会议 proceedings 页面、ACL Anthology review attachment 或 ARR 页面。仍无公开结果时，记录跳过原因。

### 记录内容

若找到公开审稿，论文笔记中新增或更新 `OpenReview / 审稿意见吸收` 小节，至少记录：

- Venue status: submitted / withdrawn / accepted / rejected / under review / unknown，以及观察日期。
- Public reviews: review 数量；若公开 rating / soundness / confidence，记录分布或范围。
- Reviewer consensus: 主要认可点，例如问题重要性、方法新意、实验覆盖、工程可用性。
- Main criticisms: 主要质疑点，例如理论假设、baseline 不完整、统计显著性、ablation 不足、泛化边界、写作或 novelty。
- Author response: 是否公开 rebuttal；作者是否补充实验、承认限制或澄清误解。
- 对本文可信度的影响: 明确哪些主张应上调可信度，哪些主张应降级为待复验。

写法要求：

- 只摘取少量必要短语，不复制大段 reviewer 原文。
- 将 reviewer 意见转写成可复查的技术判断，避免把单个 reviewer 的措辞写成定论。
- rating 低但工程生态采用强时，明确区分“实践参考价值”和“正式审稿认可度”。
- 若论文已撤稿或无公开决定，不能写成已获会议背书。
- 若未找到公开审稿，在 `Reference Intake Brief -> Skipped` 写入 `公开 reviewer comments` 和原因，例如“未发现 OpenReview/ARR/会议公开审稿页”。

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
- 若讨论产生新的作者关系、主题延展、方法复用或跨材料关系，同步更新 `content/utility/papers-index.md`。

写法要求：

- 标明这是本地讨论后的分析收敛，避免写成论文作者原始主张。
- 保留用户提出的关键判断，但用可复查的技术语言表达。
- 对未验证推论写清楚适用条件和待复验指标。

## 作者关系分析

每篇论文必须有 `作者与关系` 章节。

记录内容：

- 每位作者发表该论文时的机构。
- 已有作者档案中经过核验的历史机构。
- 与当前 `content/utility/papers-index.md` 中已有作者是否重叠。
- 与已有论文是否存在同主题、同方法、同系统、同数据集、同机构或引用关系。
- 若作者已有 `/authors/<slug>/` 页面，在相关论文笔记和索引中优先使用作者页链接。
- 若作者个人信息经过核验，更新 `data/authors.json`；只记录稳定来源和公开可展示字段。
- 对核心作者、通讯作者、代码仓库维护者、项目负责人和跨论文重复作者，优先核验主页、GitHub、Scholar/DBLP/OpenReview、机构页和项目页。
- 若证据只支持部分字段，只写入已核验字段；证据不足的字段留空。论文 Markdown 不记录核验过程。

判断要求：

- 来源明确的机构事实直接写事实。
- 作者列表说明只写发表时机构和已核验历史机构；作者条目冒号后直接写发表该论文时的机构，不加发表时机构前缀。
- 若已核验历史机构包含发表该论文时的机构，历史机构中省略该重复项；没有额外历史机构时，不写 `历史机构：`。
- 作者重叠、跨机构桥接、主题延展和方法复用写入 `content/utility/papers-index.md` 或 `跨论文关系`，避免把维护过程写进作者列表。

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
- `Reference Intake Brief`

`论文脉络` 章节必须在方法分析前包含三段前置分析：

1. `研究问题、背景和价值`：说明论文提出并解决的研究问题，补充必要背景，解释问题重要性和解决价值。
2. `已有解决方案与不足`：说明此前相关工作如何处理该问题，以及为什么还留下空白或代价。
3. `作者可能的思考路径`：从已有背景、失败模式、经验观察和相关工作出发，重建作者可能如何想到当前 idea；这一段先于方法介绍，避免把论文自身贡献当作前提。

若阅读后的交流产生了有效补充，必须加入或更新：

- `本地讨论补充`

## 站点链接规范

面向站点展示的内部链接在 Markdown 源文件中直接使用站点路径：

- 已存档论文：`[2504.13837](/papers/2504.13837-rlvr-reasoning-boundary-base-model/)`。
- 作者页：`[Tri Dao](/authors/tri-dao/)`。
- 索引页：`[papers-index.md](/archive/)`。
- 工作流页：`[paper-analysis-workflow.md](/workflow/)`。
- 模板页：`[paper-note-template.md](/template/)`。

写作要求：

- 论文笔记、`content/utility/papers-index.md` 和跨论文关系中的已存档论文链接必须使用 `/papers/<slug>/`，作者链接必须使用 `/authors/<slug>/`，避免写成相对 `.md` 链接。
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

更新 [papers-index.md](/archive/) 时必须同步处理：

1. `当前收录` 表格新增或更新该论文。
2. `作者关系图谱` 新增 cluster 或更新已有 cluster。
3. `跨论文关系` 写入与已有论文的主题、作者、机构、引用或方法关系。
4. 若论文属于新主题，建立新的 cluster。
5. 若论文延续已有主题，写清楚它补充了什么视角。

## 作者页维护

作者页由构建脚本从两类信息生成：

1. `data/authors.json` 中的人类维护档案，适合记录主页、X、机构、主题和核验来源。
2. 论文 `Source -> Authors` 中跨论文重复出现的作者，适合自动汇总相关论文。

维护原则：

- 作者页存放稳定身份信息和跨论文聚合；论文页作者列表只保留发表时机构和额外已核验历史机构，条目中不加发表时机构前缀。
- 账号、主页、机构、中文姓名等事实必须有来源链接。公开社交主页只有在来源链条足够稳定时才展示。
- 若作者有已核验中文姓名，在 `data/authors.json` 写入 `chineseName`；站点展示为 `English Name (中文姓名)`。
- 无法可靠拆分的团队署名、大规模 author list、文档贡献者列表先保留在论文页，不自动拆成作者页。
- 新增作者档案后完成站点构建和链接检查，确认 `/authors/` 和 `/authors/<slug>/` 可访问。

每次新增或更新论文时按以下顺序执行作者页维护：

1. 从 `Source -> Authors`、`作者与关系`、项目页、代码仓库和 appendix 中抽取作者与可核验角色。
2. 在 `data/authors.json`、`content/utility/papers-index.md` 和已有论文笔记中搜索候选作者，确认已有档案、别名、中文姓名和跨论文重复情况。
3. 对需要补充档案的作者，核验主页、GitHub、学术主页、机构页、项目页和可公开核验的社交主页。
4. 交叉验证后更新 `data/authors.json`；若找到作者页，在论文笔记和索引中使用 `/authors/<slug>/` 链接。
5. 对团队署名、超大作者列表或证据稀疏作者，保留团队或机构级记录；论文 Markdown 不写个人核验过程。
6. 完成站点构建和链接检查，确认作者页和论文页链接可生成。

## 收尾提交策略

每完成一篇论文的分析、索引更新和作者页维护后，默认创建一个独立 commit，但不自动 push。

执行顺序：

1. 先完成质量检查、站点构建和链接检查，确认本篇论文页面、索引页和作者页可以生成。
2. 用 `git status --short` 检查工作区，识别本篇论文相关改动和既有未提交改动。
3. 只 stage 本篇论文对应的 Markdown、`content/utility/papers-index.md`、`data/authors.json` 和必要生成物；若工作区已有其他论文或无关改动，不能合入本篇 commit。
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
- `content/utility/papers-index.md` 是否更新。
- 是否把稳定作者来源同步到 `data/authors.json`；论文 Markdown 不应包含作者核验过程。
- 作者页相关信息是否同步到 `data/authors.json`，论文笔记和 `content/utility/papers-index.md` 是否使用 `/authors/<slug>/` 链接。
- 每篇论文是否包含作者关系。
- 是否保留来源 URL 和版本日期。
- 是否完成公开审稿意见搜索；若有公开 review，是否吸收 reviewer consensus、主要质疑、作者回应和可信度影响；若无公开 review，是否在 `Skipped` 记录原因。
- 是否在核心实验中写清楚实验设置、baseline 名称/版本/调参强度、compute 是否匹配、实现是否匹配和评测协议。
- 是否区分来源事实、作者主张和本地推论。
- 是否在方法前回答研究问题、已有工作不足，并重建作者可能的思考路径。
- 是否把阅读后的有效交流提炼进对应笔记。
- 是否存在先否定前项、再强调后项的对照式中文表达。
- 是否避免长段复制论文原文。
- 面向站点展示的内部链接是否使用 `/papers/<slug>/`、`/authors/<slug>/`、`/archive/`、`/workflow/` 或 `/template/`。
