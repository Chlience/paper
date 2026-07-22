# LLM 与 Agent 强化学习中的信用分配

First-Archived-At: 2026-07-13 16:58
Updated-At: 2026-07-22 17:20
Review-Status: pending

## Source

- Workflow version: synthesis-v1
- Material type: composite
- Analysis modules: survey, experiment, system, theory
- Responsible organization: Chlience Paper Archive（本地综合）
- Search services: [arXiv](https://arxiv.org/)、[ACL Anthology](https://aclanthology.org/)、[OpenReview](https://openreview.net/)、官方项目页与代码仓库
- Search window: 2026-05-01 至 2026-07-22 17:20 CST
- Research question: 稀疏终局奖励如何被分配到 LLM 与 Agent 轨迹中的 token、步骤、工具调用、记忆操作、摘要、角色和策略，各方法依赖什么可比性与额外模型？
- Classification axes: 信用单元；识别信号；分配算子；可比性条件；策略角色配置
- Key figure decision: omit
- Key figure rationale: 该方向包含多种信用单元、估计信号和策略角色配置，跨材料矩阵比任一单篇论文图更能表达核心差异。
- Published / updated: 2026-07-22
- Current version read: 检索截止时可访问的论文版本、正式论文集页面、官方项目页与本地已审阅笔记
- Accessed: 2026-07-22
- Subjects: Reinforcement Learning；Credit Assignment；LLM Reasoning；Agentic RL；Memory；Context Compaction；Multi-Agent

### 检索与纳入协议

检索组合 `credit assignment`、`reward redistribution`、`process reward`、`counterfactual`、`critic`、`memory`、`context compaction`、`tool use`、`agentic RL`、`multi-agent`、`verifier` 和 `reference policy`。材料需直接改变稀疏回报落到局部行为的方式，或给出可检验的信用分配诊断。单纯更换优化器、异步调度或奖励模型且没有局部归因机制的工作不进入核心表；[Reward-Driven LLM Agent Workflows](https://arxiv.org/abs/2607.17038) 主要研究 POMDP 下的路由与自纠工作流，没有提出新的局部信用算子，因此记录为相邻工作并排除。

时间窗以首次公开或实质版本更新为准。2026 年 5—7 月首发方法构成演进主体；窗口外首发、窗口内正式发表或实质更新的工作单独标注。跨论文只比较机制、假设、成本与最窄结论，不按不同模型和任务的最终分数排名。检索结果继续通过本地单篇笔记校正，尤其关注 CompactionRL、ECHO、TRACE、GraphGPO、SPIRAL、SAO 和信用分配综述中的公式与基线边界。

## 综合判断

从 Token 到 Compact Agent，信用分配研究正在从“把一个轨迹回报广播给所有 token”扩展为五个相互独立的问题：选择更新单元，识别局部进展，规定回报如何分配，保证比较对象处于足够相近的状态，并决定生成、评价与估值由哪些策略角色承担。2026 年 5 月的方法集中于自然边界、局部重采样和同状态比较；6 月扩展到图结构、teacher divergence、critic、记忆操作和来源追踪；7 月进一步处理正向信用校准、单 rollout critic、压缩边界和冻结参考模型的连续进展信号。

严格因果归因、低成本和通用性仍难以同时获得。同状态反事实提供较强局部可比性，代价是额外 rollout；critic 支持单 rollout 和连续有符号信用，误差转移到价值拟合与边界 bootstrap；judge、teacher、attention、entropy 与 provenance 成本较低或结构清楚，输出仍属于代理信号。多策略方案已出现，其中一类让多个任务策略同时生成和互评，另一类把独立 critic、冻结 verifier 或参考策略作为信用估计组件。策略角色配置本身已经成为方法差异。

## 核心问题与边界

### 稀疏回报为何在 Agent 轨迹中更难分配

LLM 轨迹的 token 数很长，Agent 轨迹还包含工具返回、环境状态、记忆写入、摘要、角色交接和不可训练 observation。终局成功可能依赖早期一个工具选择，也可能来自多个普通步骤的组合。把同一个回报均匀广播会强化成功轨迹中的无效行为，也会惩罚失败轨迹中有价值的局部尝试。

带上下文压缩的 Agent（compact agent）增加了状态分叉。一次摘要或记忆写入改变后续上下文，两个来自同一 prompt 的 rollout 随后可能处于不同有效状态。提示级组相对优势（prompt-level group advantage）仍能优化完整轨迹回报，无法自动回答“在相同写入前状态（pre-write state）下，哪一个记忆动作更好”。来源追踪回答哪些信息被后续策略使用，反事实或 critic 回答替换局部动作后回报如何变化；两类信号对应不同问题。

### 判断边界

- “识别关键位置”与“估计该位置的因果效应”分开判断。attention、surprisal、judge label 和 provenance 可以定位位置，因果幅度仍需额外假设。
- 同一 prompt 不等于同一状态。局部可比性需要说明固定的前缀、环境快照、记忆状态或 critic 条件。
- 生成策略、评价模型、参考策略和 critic 均计入策略角色配置与总计算。
- 单篇内部消融能支持配方中的局部组件；跨论文优势需要同 backbone、数据、scaffold、rollout 数与总计算对照。
- 本文涵盖 reasoning、search、tool use、memory、coding 和多角色 Agent；机器人任务只在方法直接讨论语言策略信用时作为邻接证据。

## 分类框架

### 五轴表示

| 轴 | 常见选择 | 需要审计的问题 |
| --- | --- | --- |
| 信用单元 | token、segment、turn、工具调用、记忆操作、摘要、角色、完整策略 | 单元能否对应可干预行为；粒度过细是否增加噪声 |
| 识别信号 | critic、同状态重采样、teacher/reference likelihood、judge、图、attention、surprisal、provenance | 信号是否校准；它识别的是使用、相关、进展还是因果贡献 |
| 分配算子 | hard mask、连续权重、process reward、局部 group advantage、TD/GAE、角色回报重分配 | 正负信用是否对称；是否重复计权；尺度是否与终局 advantage 匹配 |
| 可比性条件 | 同 prompt、同前缀或状态、动作条件 peers、state critic、counterfactual continuation | 状态分叉、样本稀疏、critic bootstrap 和聚类误差 |
| 策略角色配置 | 单 actor、共享参数多角色、多个可训练任务策略、actor + critic、actor + 冻结 verifier/reference | 梯度干扰、评价漂移、互评串通、推理与训练成本 |

统一的 policy loss 可以理解为：识别信号先决定位置权重，信用估计器再决定局部 advantage，最后由 mask 或连续权重把它落到可训练 token。相同的 mask 可以配合 group advantage、局部重采样或 critic；相同的 critic 也可以服务 token、turn 或 segment。方法比较应保留这两层分解。

### 多策略参与生成与信用分配的三种配置

1. **多个任务策略共同生成并互评。** [CCPO / SEPO](https://arxiv.org/html/2603.21563v5) 的 Thinker 与 Solver 都参与正常解题，SEPO 让两个角色提供受限自评和互评，再由外部 verifier 锚定并重分配角色回报。它直接回答“多策略（multi-policy）能否同时完成生成和信用分配”，当前粒度主要位于角色与轨迹层。
2. **共享参数承担多个生成角色。** [SPIRAL](/papers/2606.23595-spiral-learning-search-aggregate/) 的同一 LoRA 可扮演搜索与聚合策略，下游聚合成功率回传给上游搜索集合；角色共享参数，信用跨策略阶段传播。
3. **任务策略与专用估值角色分离。** [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/) 使用共享 actor 生成摘要和工具动作，独立 critic 估计 token/segment advantage；[TRACE](/papers/2607.13988-trace-turn-level-reward-assignment/) 使用冻结初始化参考模型测量工具 turn 后答案可预测性的变化；[LLM-as-a-Verifier](/papers/2607.05391-llm-as-a-verifier/) 使用冻结 LLM 产生连续进展分数。后两类组件参与信用估计，不承担正常任务策略更新。

因此，“多策略”需要明确是多个可训练任务策略、共享参数的多角色策略，还是一个任务策略配合 critic、verifier 或参考策略。三者的互评风险、可比性和计算成本不同。

## 演进脉络

### 2026 年 5 月：边界、重置与同状态比较

| 工作 | 信用单元 | 识别与分配机制 | 主要边界 |
| --- | --- | --- | --- |
| [SIOP](https://arxiv.org/abs/2605.04984) | turn | outcome-potential state 构造势函数奖励 | outcome cluster 质量决定信号上限 |
| [BEACON](https://arxiv.org/abs/2605.06078) | milestone / segment | 里程碑分段后融合局部与全局 advantage | 依赖任务结构和里程碑质量 |
| [Memory-R2](https://arxiv.org/abs/2605.21768) | memory operation | 固定 intermediate memory state 做局部重采样 | 可比性强，增加 rollout 成本 |
| [SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/) | reset 后缀 | 定位错误点，从同一前缀重采样 suffix，只更新后缀 | 定位错误会传入局部采样 |
| [GraphGPO](/papers/2605.26684-graphgpo-graph-credit-assignment-agentic-rl/) | graph edge / step | 聚合状态转移图，用到目标的距离下降构造 edge advantage | 状态合并和图距离属于近似 |
| [CARL](https://arxiv.org/abs/2605.27788) | 工具边界 segment | critic 从二元结果学习工具段的有符号 advantage | 聚焦工具调用，保留 critic 误差 |
| [MMPO](https://arxiv.org/abs/2605.30159) | summary / memory turn | belief entropy 给摘要增加有界中间奖励 | 低熵可能来自过度自信 |

这一阶段首先寻找可操作边界。Memory-R2 和 SRPO 通过重采样提高局部可比性；BEACON 与 GraphGPO 用结构减少整条轨迹的信号稀释；MMPO 开始把压缩状态质量写入奖励。

### 2026 年 6 月：估值器、记忆信用与来源追踪

| 工作 | 信用单元 | 识别与分配机制 | 主要边界 |
| --- | --- | --- | --- |
| [MemoPilot](https://arxiv.org/abs/2606.08656) | memory turn | turn reward 与上下文无关的 turn advantage | 冻结执行模型，任务范围较窄 |
| [FlowTracer](https://arxiv.org/abs/2606.10646) | token | answer-targeted attention flow 塑造 token reward | 结构归因仍弱于干预效应 |
| [HiMPO](https://arxiv.org/abs/2606.16285) | memory-write token | 同一 pre-write state 替换旧/新记忆并用 hindsight gate 过滤 | scorer 和目标结果依赖 |
| [VIMPO](/papers/2606.20008-vimpo-value-implicit-policy-optimization-llms/) | token | policy/reference 比率与 KL 构造 implicit value / advantage | 省去 critic，引入 reference 与递推假设 |
| [G2PO](https://arxiv.org/abs/2606.22995) | graph edge | 全局状态图聚合 value，执行 edge-centric TD | 状态等价与图覆盖决定质量 |
| [SPIRAL](/papers/2606.23595-spiral-learning-search-aggregate/) | 搜索轨迹集合 | 聚合成功率按 participation 回传搜索轨迹 | 集合成员共现带来归因噪声 |
| [SWE-MeM](https://arxiv.org/abs/2606.28434) | memory segment / token | 分段轨迹、token mean 与规则 mask 联合 | 规则具有 coding-agent 特异性 |
| [ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/) | source turn / finding / selection | 最终 reconstruction trace 生成正向 hard mask | 记录“被使用”，未直接估计边际贡献 |
| [TRIAGE](https://arxiv.org/abs/2606.32017) | action segment / role | judge 标注进展、探索、停滞与退化并添加有界角色奖励 | role label 存在系统偏差风险 |

6 月的变化集中在估计器和状态表示。teacher likelihood、attention flow、图 TD、action-conditioned peers 与 critic 在额外 rollout、模型偏差和近似假设之间取舍。记忆路线分为 compact state 质量评分、同状态 memory counterfactual 和 source provenance 路由；SPIRAL 与 SEPO 则把信用传播推进到角色和策略之间。

### 2026 年 7 月：校准、参考策略与单 rollout critic

| 工作 | 信用单元 | 识别与分配机制 | 主要边界 |
| --- | --- | --- | --- |
| [DASH](https://arxiv.org/abs/2607.00482) | answer-commitment segment | 中间答案接近或偏离正确答案时给正负信用 | 需要可解析的中间答案 |
| [PivoARL](https://arxiv.org/abs/2607.03702) | pivotal state / suffix | 反思定位最早关键错误并从该状态重试 | 自定位准确率决定局部质量 |
| [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/) | execution / summary token | 独立 critic、token 归一化与跨 segment GAE | critic 校准、边界 bootstrap 和来源缺失 |
| [LLM-as-a-Verifier](/papers/2607.05391-llm-as-a-verifier/) | prefix / process step | 冻结 LLM 的评分 token 概率形成连续进展信号 | 当前训练证据规模较小 |
| [SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/) | token / observation gap | 单 rollout、双侧 stale-token mask 与 skip-observation GAE | 强化时间估值，语义局部归因较弱 |
| [TACO](https://arxiv.org/abs/2607.07976) | tail token | surprisal 与局部 entropy 抑制不可信 token 的正向信用 | 只校准正信用，信号仍是代理 |
| [TRACE](/papers/2607.13988-trace-turn-level-reward-assignment/) | tool turn | 冻结参考模型测量工具边界后的答案可预测性变化 | 需要已知短答案和额外评分 |

截至 7 月 22 日，研究重点从寻找局部单元推进到校准参照系。TACO 约束过强正向更新；PivoARL 与 DASH 定位错误或漂移；SAO 与 CompactionRL 用 critic 支持单 rollout 和分段轨迹；LLM-as-a-Verifier 与 TRACE 让冻结模型沿前缀产生连续信号。统一 attribution benchmark 仍未形成。

## 跨材料比较

### Compact Agent 的直接对照

| 方法 | 被训练的 compact 行为 | 局部信用来源 | 可比性条件 | 信用落点 | 主要缺口 |
| --- | --- | --- | --- | --- | --- |
| Memory-R2 | 记忆写入、更新与删除 | 同一中间记忆状态的局部重采样 | 强：固定 pre-action state | 局部 group advantage 给记忆操作，全局目标保留 | 重采样成本与局部 horizon |
| MMPO | 递归摘要 | belief entropy 与终局回报 | 中：比较 belief clarity | 有界记忆奖励叠加 outcome | 置信代理可能误校准 |
| HiMPO | memory-write tokens | 新旧记忆在同一 pre-write state 的 recoverability 差 | 强：局部替换对照 | memory advantage 只给记忆 token | scorer 与目标结果依赖 |
| ECHO | finding、来源选择与重建 | 最终使用的 source-indexed trace | 中：保留来源，幅度仍来自 prompt group | 正 group advantage 路由到被选来源 | 只给正信用；使用记录弱于边际贡献 |
| CompactionRL | full-prefix summary | compressed-state critic 与跨 segment GAE | 由 critic 条件化，无需组内同状态 | 成功和失败均可产生有符号 token advantage | critic 误差；opaque summary 缺少来源 |
| TRACE | 工具 turn | 冻结参考策略的答案可预测性变化 | 相邻前缀 + 固定参考模型 | TD-shaped turn reward 混入终局优势 | 已知答案、reference scoring 成本 |

### CompactionRL 相对 SUPO 的创新边界

| 维度 | [SUPO](https://arxiv.org/abs/2510.06727) | CompactionRL | 当前定位 |
| --- | --- | --- | --- |
| 摘要与执行策略 | 同一模型联合生成并训练 | 同一模型联合生成并训练 | 共同骨架；SUPO 已包含摘要任务，增量集中在后续估值机制 |
| Advantage | 完整 rollout group 的相对 advantage 广播到 split trajectories | 独立 critic 给出 state/token-dependent advantage | critic 支持 group size 1，是明确配方增量 |
| Segment weighting | 全部生成 token 的统一 denominator | 全 batch token mean | SUPO 已覆盖核心 token 归一化思路 |
| 边界信用 | 同一 rollout advantage 广播到各 segment | 按后续 token 距离修正的跨 segment GAE | 最清楚的算法增量，仍是完整跨边界 GAE 的近似 |
| 实证范围 | 长程搜索 | 两个模型规模的 coding / terminal agents | 新任务与规模证据 |

CompactionRL 的贡献重心位于 segmented rollout 的 actor-critic 估计配方：独立 critic、group size 1 和跨压缩边界的时间信用。SUPO 已联合训练 summary 与 tool action，也已按全部生成 token 归一化。CompactionRL 缺少同 backbone、scaffold、压缩提示、峰值上下文和总计算预算下的 SUPO objective 对照；现有消融能证明其内部组件有效，无法识别 critic 路线相对 rollout-level group objective 的净收益。

### 策略角色配置对照

| 配置 | 正常策略生成 | 信用估计 | 优点 | 风险 |
| --- | --- | --- | --- | --- |
| 单 actor + outcome broadcast | 一个可训练策略 | prompt group 回报 | 简单、低额外模型成本 | 局部信号稀释，状态分叉难解释 |
| 多个可训练任务策略 | Thinker、Solver 或搜索、聚合角色 | 自评、互评与外部 verifier 锚定 | 角色结果可直接回流上游 | 互评串通、角色奖励尺度与额外 rollout |
| 共享 actor + 独立 critic | 同一 actor 生成动作与摘要 | critic / TD / GAE | 单 rollout、有符号连续信用 | value tracking、训练计算与 bootstrap 误差 |
| actor + 冻结 verifier/reference | actor 生成任务轨迹 | 冻结模型沿 prefix 或 turn 评分 | 评价目标较稳定，可得到过程信号 | 参考模型偏差、评分推理成本、答案依赖 |
| actor + provenance mask | actor 生成记忆与执行动作 | trace 决定可达位置，outcome 决定幅度 | 信用路径可检查 | trace 覆盖和因果必要性不足 |

## 证据强度

| 结论 | 强度 | 直接证据与限制 |
| --- | --- | --- |
| 同状态重采样能提高局部 memory / suffix 信用的条件可比性 | 强 | Memory-R2、HiMPO 与 SRPO 明确固定局部状态并替换后续行为；额外 rollout 成本清楚存在 |
| 图、teacher、judge、attention、entropy 和 provenance 能把梯度集中到更少位置 | 中强 | 多篇内部消融方向一致；代理信号与干预效应之间仍有差距 |
| critic 能支持单 rollout、分段轨迹和有符号 token 信用 | 中强 | CompactionRL、SAO 与 CARL 提供机制和内部实验；critic 校准与计算对照不足 |
| 多个可训练任务策略可以同时参与生成和信用分配 | 中 | SEPO 和 SPIRAL 给出角色/集合级实例；任务集中，粒度尚未稳定扩展到 token 与长程工具轨迹 |
| ECHO 的来源追踪识别了局部因果贡献 | 中弱 | 它直接识别最终重建使用的来源，删除、替换或同状态重采样才能进一步确认边际贡献 |
| CompactionRL 的 summary 联合训练构成相对 SUPO 的核心新机制 | 弱 | SUPO 已具备共享 actor、summary/tool 联训和 token denominator；新增证据集中在 critic 与跨 segment GAE |
| 现有方法已经解决长程 Agent 的通用信用分配 | 弱 | 缺统一 benchmark、计算匹配、跨任务复验、双向信用与严格 attribution ground truth |

强度按具体结论给出。同一论文可以为机制实现提供强证据，同时只为通用性提供弱证据。正式发表状态提高来源稳定性，无法替代对照可比性和归因正确性的验证。

## 当前判断

当前最有解释力的设计空间由“信用单元 × 识别信号 × 分配算子 × 可比性条件 × 策略角色配置”组成。只报告 token/turn 粒度会遗漏状态比较条件和额外模型；只报告 critic 或 judge 会遗漏信用实际落到哪些生成行为。未来方法应把五轴同时写入实验协议。

带上下文压缩的 Agent 适合组合两类信号：来源追踪有向无环图（provenance DAG）决定哪些 token、来源和记忆操作允许接收信用；同状态重采样或压缩状态 critic 决定有符号幅度。这个组合能分开“后续使用了什么”和“替换该行为会怎样”。它仍需递归来源、负向信用、掩码覆盖率与 critic 校准的联合诊断。

多策略路径值得单独研究。多个任务策略可以同时生成与互评，适合角色级或集合级目标；独立 critic、冻结 verifier 和参考策略提供更稳定的专用估值角色。二者可以组合，同时需要外部可验证结果锚定，防止多个可训练角色共同适应彼此的评分偏差。

统一复验应至少报告局部信用的 precision/recall 与符号正确率、同状态干预回报差、各信用单元获得的梯度质量、critic explained variance、来源覆盖，以及 rollout token、环境步骤、judge/reference 调用、critic FLOPs、GPU 时间和 wall-clock。任务成功率只能覆盖其中一部分。

## 开放问题

1. 能否建立带可删除、替换和恢复关键动作的 attribution benchmark，直接测局部信用的符号与幅度？
2. 同 prompt group 在状态分叉后应如何定义有效 peers，何时需要局部重采样，何时 critic 足够？
3. 多个可训练策略互评时，怎样通过独立 verifier、冻结参考策略或交叉拟合限制评价漂移与串通？
4. provenance 如何递归追踪摘要所依赖的更早来源，并给未使用但关键的信息保留信用？
5. 跨压缩边界的完整 Bellman recursion 与当前 token-distance 修正相比，质量和成本如何变化？
6. 能否同时保留失败轨迹中的有用步骤和抑制成功轨迹中的无效步骤，形成稳定的双向信用？
7. credit estimator 的训练收益在对齐 rollout、critic、judge 和参考模型总计算后是否仍成立？

## 局限

- 时间窗内预印本密集，版本、代码、会议状态和实验结果可能继续变化。
- 检索词对标题和摘要命名敏感；没有直接使用 credit assignment 术语的方法可能遗漏。
- 跨论文任务、模型、环境、scaffold 与预算不同，本文的矩阵支持机制比较，不支持性能排序。
- 多数工作缺少统一 attribution ground truth、多训练种子、置信区间和完整成本报告。
- 对 SEPO、SPIRAL 等多策略配置的结论来自少量任务；扩展到开放式多 Agent 工具环境仍待验证。
- 本文对 provenance + local/critic 的组合属于综合建议，尚无来源论文验证完整实现。

## 更新记录

- 2026-07-13：根据 2026 年 5—7 月 RL 信用分配进展总结请求建立初始综合。
- 2026-07-22：补齐 7 月检索截止与 TRACE 等材料；采用日期无关标题和独立主线结构；加入多策略角色配置、CompactionRL—SUPO 创新边界及逐结论证据强度。
