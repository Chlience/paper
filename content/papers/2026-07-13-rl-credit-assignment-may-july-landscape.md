# 2026 年 5-7 月 RL 信用分配研究进展：从 Token 到 Compact Agent

First-Archived-At: 2026-07-13 14:41
Updated-At: 2026-07-13 14:41
Review-Status: approved
Reviewed-At: 2026-07-18 17:30

## Source

- Workflow version: v2
- Material type: composite
- Canonical source: /papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/
- Title: 2026 年 5-7 月 RL 信用分配研究进展：从 Token 到 Compact Agent
- Responsible organization: Chlience Paper Archive（本地综合）
- Search services: [arXiv](https://arxiv.org/)、[OpenReview](https://openreview.net/)、[ACL Anthology](https://aclanthology.org/)、通用网页检索与论文官方项目页
- Search window: 2026-05-01 至 2026-07-13 14:38 CST
- Published / updated: 2026-07-13
- Current version read: 检索截止时可访问的 arXiv abstract / HTML、ACL Anthology proceedings page、OpenReview metadata / paper page 与已存档全文笔记
- Accessed: 2026-07-13
- Subjects: Reinforcement Learning；Credit Assignment；Agentic RL；Memory；Context Compaction；Reasoning

### 检索协议与结果边界

本次采用“精确词检索 + 机制同义词扩展 + 正式论文集回查”三层流程：

| 层级 | 查询与来源 | 用途 |
| --- | --- | --- |
| 精确词检索 | arXiv API：`all:"credit assignment" AND submittedDate:[202605010000 TO 202607132359]`，按提交时间倒序分页 | 获得 212 条原始结果，覆盖显式使用 credit assignment 表述的论文 |
| 机制扩展 | 全网检索 `advantage reweighting`、`reward redistribution`、`process reward`、`local rerollout`、`hindsight`、`counterfactual`、`memory policy optimization`、`context compaction RL`、`role-typed credit`、`graph policy optimization` | 补回标题和摘要没有精确词组、机制上直接改变局部 RL 信号的论文，例如 ECHO、CompactionRL、SAO、MMPO |
| 正式发表回查 | ACL 2026、Findings of ACL 2026、OpenReview 2026 页面 | 区分 5 月以后首次公开的方法与 7 月正式发表、此前已有 preprint 的方法 |

纳入条件：论文直接改变 terminal reward 到 token、segment、turn、memory action 或 workflow role 的映射，或改变该映射所依赖的 value / counterfactual estimator。纯 RL infrastructure、通用 MARL、神经科学信用分配、只修改最终 reward 且没有局部归因机制的工作未进入核心表。检索数量描述的是可复核候选集，仍可能漏掉使用其他术语、尚未被搜索引擎索引或只存在于封闭评审系统中的工作。

时间统一按首次公开日期排序。ACL 2026 的 [Fine-Mem](https://aclanthology.org/2026.acl-long.900/)、[CriticSearch](https://aclanthology.org/2026.findings-acl.596/)、[ELPO](https://aclanthology.org/2026.acl-long.504/) 和 [CW-GRPO](https://aclanthology.org/2026.acl-long.1462/) 在 7 月获得正式论文集页面，其中若干方法的 preprint 早于 5 月，因此单独作为正式发表更新，不计入“5 月以后首次提出”的时间线。

## 作者与关系

- 本材料由本地归档综合，没有单一论文作者，也不为 composite 新建作者档案。
- 核心来源来自多个独立团队。ECHO 连接 Peking University、Baidu Inc. 与 USTC；CompactionRL / SAO 连接 Tsinghua University KEG 与 Z.AI。两组之间未发现已核验的作者重叠。
- CompactionRL 与 [SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/) 存在 Yujiang Li、Zhenyu Hou、Jie Tang、Yuxiao Dong 等作者重叠，形成“compact trajectory credit + single-rollout actor-critic”连续产出。
- Memory-R2、MMPO、HiMPO、SWE-MeM、ECHO 和 CompactionRL 在主题上形成 memory / compaction credit 路线；具体作者机构以各官方标题页和已存档单篇笔记为准，本综合不补充未经核验的机构推断。
- 与已存档论文的直接关系包括 [Credit Assignment Survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/)、[SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/)、[VIMPO](/papers/2606.20008-vimpo-value-implicit-policy-optimization-llms/)、[ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/)、[CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/) 与 [SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/)。

## 一句话结论

2026 年 5-7 月的 RL 信用分配研究开始围绕 token、segment、turn、memory operation 和 workflow role 五种 credit unit 形成可比较的方法谱系；compact agent 的关键增量是把“摘要或记忆写入后，各 rollout 的有效状态是否仍可比较”单独列为 estimator 条件，并分别发展出同状态局部重采样、belief proxy、hindsight counterfactual、source provenance mask 与 compressed-state critic 等路线。

## 阅读目标与判断边界

本笔记关注：

1. 2026 年 5 月至检索截止日，RL credit assignment 出现了哪些高相关新方法。
2. 每种方法把 credit 分给什么单元，使用什么识别信号，通过什么算子进入 policy loss。
3. ECHO 与 memory / context compaction 方法之间的真实差异，尤其是 state comparability 与 provenance 的边界。
4. 哪些结论来自论文事实，哪些属于作者主张，哪些属于本地跨论文综合。

判断边界：

- 该时间段大量工作仍是 arXiv v1，方法名称、结果与会议状态可能继续变化。
- 跨论文结果使用不同 backbone、环境、reward、rollout budget 和 baseline recipe，本文不制作性能排行榜。
- “credit 更准确”至少包含局部预测、因果贡献、归因可解释性和低方差四种含义。不同论文通常只覆盖其中一部分。
- 本文对公式做统一抽象，统一符号不代表原论文使用相同 objective。

证据写法：

- 论文事实：官方摘要、HTML、正文公式、表格或论文集页面直接给出的内容。
- 作者主张：论文对机制和实验现象的解释。
- 本地分析：跨论文统一、条件审计与可复验推断。

## 论文脉络

### 1. 研究问题、背景和价值

长推理和 agentic RL 常以终局成功 $R(\tau)$ 训练整条 trajectory。最粗的写法会把同一个 trajectory advantage 广播给全部生成 token：

$$
\mathcal L_{\mathrm{PG}}
=
-\sum_t \widehat A(\tau)\log \pi_\theta(a_t\mid s_t).
$$

这会把三个问题混在一起：

1. **定位**：关键决策发生在哪个 token、步骤或 turn。
2. **估值**：该局部决策相对当前 state 改变了多少成功概率或 return。
3. **分配**：局部信号以 mask、权重、附加 reward、局部 advantage 或 GAE 的哪种形式进入梯度。

compact agent 还会改变 policy state。设第 $k$ 次 memory action 生成 $M_{k+1}^{(i)}$，后续有效状态为：

$$
s_{k+1}^{(i)}
=
\bigl(o_{\le k}^{(i)},M_{k+1}^{(i)}\bigr).
$$

不同 rollout 写入不同摘要、删除不同证据或选择不同 source turn 后，$s_{k+1}^{(i)}$ 已经分叉。此时 prompt-level group reward 仍可作为初始任务条件下的 baseline；若直接把组内差值解释成某个 memory action 在固定 $s_k$ 下的局部优势，状态差异会与 memory utility 混合。Memory-R2 把这一点称为 group-relative comparison 的公平性问题。更审慎的表述是：其局部条件可比性不足，方差和归因混杂会增加；是否形成严格统计偏差还取决于 baseline 是否 action-independent、样本复用方式与归一化实现。

### 2. 统一分析框架

本地将方法写成四元组：

$$
\text{CA method}
=
(\text{credit unit},\ \text{identification signal},\ \text{assignment operator},\ \text{comparability condition}).
$$

统一 policy loss 可写为：

$$
\mathcal L
=
-\sum_t w_t\,\widehat A_t\log\pi_\theta(a_t\mid s_t),
$$

其中 $w_t$ 可以是 hard mask、judge weight、surprisal gate、graph progress 或 hindsight relevance；$\widehat A_t$ 可以来自 group outcome、local rerollout、critic / TD、Bayesian likelihood ratio 或 counterfactual continuation。这个分解能避免把“找到关键 token”和“估计该 token 的 causal effect”视为同一个问题。

| 轴 | 常见选择 | 主要风险 |
| --- | --- | --- |
| Credit unit | token / segment / turn / memory operation / role | 单元太细会增加噪声与成本，单元太粗会稀释关键决策 |
| Identification signal | critic、模型内部信号、judge、graph、counterfactual、provenance | proxy calibration、judge bias、近似等价、额外 rollout |
| Assignment operator | mask、乘法权重、附加 process reward、局部 group advantage、GAE | 尺度失配、重复计权、正负 credit 不对称 |
| Comparability | 同 prompt、同 state rerollout、action-conditioned peers、state critic | 状态分叉、critic bootstrap error、样本稀疏 |

### 3. 2026 年 5 月：边界、重置与同状态比较

| 工作 | Credit unit | 信号与分配 | 证据边界 |
| --- | --- | --- | --- |
| [SIOP](https://arxiv.org/abs/2605.04984), 05-06 | turn | 用模型自身诱导的 outcome-potential state 给 turn 构造势函数 reward | 无 verifier 场景可用，语义 outcome cluster 的质量决定信号上限 |
| [BEACON](https://arxiv.org/abs/2605.06078), 05-07 | milestone / segment | milestone 划分后做段内 temporal shaping，再融合局部和全局 advantage | milestone 质量与任务结构强相关 |
| [GEAR](https://arxiv.org/abs/2605.11853), 05-12 | adaptive segment | answer-conditioned teacher divergence 决定边界和权重 | 依赖 privileged answer 与 teacher calibration |
| [Memory-R2](https://arxiv.org/abs/2605.21768), 05-20 | memory operation | 从相同 intermediate memory state 做 local rerollout，LoGo-GRPO 融合 local / global objective | 条件可比性最清楚，额外 rollout 成本较高 |
| [DelTA](https://arxiv.org/abs/2605.21467), 05-20 | token | 用 token-gradient discrimination 方向设置侧别系数 | 属于梯度代理，因果解释有限 |
| [OPPO](https://arxiv.org/abs/2605.21851), 05-21 | token | 累积 oracle-conditioned likelihood ratio，递归估计成功概率与 token advantage | 只需额外 forward，依赖 oracle / teacher 分布质量 |
| [SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/), 05-25 | reset 后缀 | 自定位错误点，从同一前缀重采样 suffix，只更新后缀 | 直接产生局部 counterfactual，定位错误会传入采样 |
| [GraphGPO](https://arxiv.org/abs/2605.26684), 05-26 | graph edge / step | 聚合 rollout 为 state-transition graph，用到 goal 的距离下降构造 edge advantage | 图中 state 合并与距离是近似；arXiv 标注 ICML 2026 accepted |
| [CARL](https://arxiv.org/abs/2605.27788), 05-27 | tool-boundary segment | critic 从单个 binary outcome 学习各 tool-use segment 的 signed advantage | 聚焦何时调用工具，critic 误差仍会进入 credit |
| [GDCR / SAPO](https://arxiv.org/abs/2605.29697), 05-28 | search step | 训练期 entity-relation graph 衡量新检索 / 引用实体到答案的距离 | 依赖可构造的 task graph 与 answer entity |
| [MMPO](https://arxiv.org/abs/2605.30159), 05-28 | summary / memory turn | 用“当前进展与缺失信息”探针得到 Belief Entropy，给摘要增加 bounded intermediate reward | belief clarity 属于自监督 proxy，低熵也可能来自过度自信 |

这一阶段的共同趋势是找到自然边界，并在边界处获得更条件化的信号。Memory-R2 和 SRPO 通过重采样加强 counterfactual 可比性；BEACON、GEAR、GraphGPO 与 GDCR 通过结构先验减少全序列稀释；MMPO 开始把 compact state 的可读性直接写进 reward。

### 4. 2026 年 6 月：估值器、memory credit 与 provenance

| 工作 | Credit unit | 信号与分配 | 证据边界 |
| --- | --- | --- | --- |
| [RREDCoT](https://arxiv.org/abs/2606.06475), 06-04 | reasoning segment | 模型自身近似 reward redistribution，减少 MC generation | state-value proxy 的校准决定收益 |
| [MemoPilot](https://arxiv.org/abs/2606.08656), 06-07 | memory turn | turn-wise reward 与 context-independent turn advantage 训练 memory copilot | 冻结执行 LLM，任务集中在序贯博弈；arXiv 标注 ICML 2026 accepted |
| [PBSD](https://arxiv.org/abs/2606.09348), 06-08 | turn | answer-conditioned teacher 的 posterior / prior ratio 分解为支持或削弱答案的 turn signal | privileged answer 提供强信号，也引入 train-test 信息差 |
| [HIPIF](https://arxiv.org/abs/2606.10507), 06-09 | subgoal / folded segment | subgoal process reward、hierarchical reflection 与 information folding 联合训练 | 结构化 subgoal 同时改变探索与 credit，贡献较难拆分 |
| [FlowTracer](https://arxiv.org/abs/2606.10646), 06-09 | token | attention DAG 上做 answer-targeted conserved flow，以 throughput 塑造 token reward | attention flow 提供结构归因，仍不等于干预后的因果效应；arXiv 标注 ICML 2026 accepted |
| [APPO](https://arxiv.org/abs/2606.12384), 06-10 | procedure / token decision point | 不确定性与 continuation likelihood gain 选择 branch，procedure-level advantage 缩放 | work in progress；branch score 和 rollout budget 共同影响效果 |
| [SGCD](https://arxiv.org/abs/2606.12634), 06-10 | sibling divergence segment | 外部 LLM 总结成功 / 失败 sibling 差异，detached weight 重标 GRPO gradient | distillation 只作权重，judge 成本与偏差保留 |
| [HSD](https://arxiv.org/abs/2606.15576), 06-14 | divergence token / suffix | 成功 peer 作为 path-conditioned self-teacher，把 dense signal 集中到分歧点 | 依赖组内存在成功轨迹 |
| [HiMPO](https://arxiv.org/abs/2606.16285), 06-15 | memory-write token | 相同 pre-write state 下替换 old / new memory，再用 hindsight relevance gate 过滤，memory advantage 只作用于 `<mem>` tokens | 更接近局部 memory utility，仍依赖 target outcome 与 recoverability scorer |
| [SC-GRPO](https://arxiv.org/abs/2606.18810), 06-17 | token | 用模型自身 verified trajectory 构造 self-conditioned teacher，KL divergence 重标 GRPO gradient | 自举质量受成功样本覆盖限制 |
| [STARE](https://arxiv.org/abs/2606.19236), 06-17 | token | surprisal quantile 识别 entropy-critical token，重加权 advantage | 优化稳定性信号与任务贡献可能错位 |
| [VIMPO](/papers/2606.20008-vimpo-value-implicit-policy-optimization-llms/), 06-18 | token | policy / reference log-ratio 与完整 KL 构造 implicit TD value / advantage | 省去独立 critic，reference 选择与近似递推形成新假设 |
| [Drowning in Routine](https://arxiv.org/abs/2606.22164), 06-20 | turn / trajectory | 从 decision density $\rho$ 分析 signal dilution，给出 turn / trajectory SNR 比例随 $\rho^{-1/2}$ 变化的条件性结果 | 属于简化假设下的诊断理论，不能直接给出 estimator |
| [G2PO](https://arxiv.org/abs/2606.22995), 06-22 | graph edge | 全局 state-transition graph 上聚合 value，以 edge-centric TD advantage 更新 | state equivalence 与 graph coverage 是关键近似 |
| [BiPACE](https://arxiv.org/abs/2606.25556), 06-24 | action-conditioned state cluster | hidden-state geometry 近似 behavioral equivalence，再用 action-conditioned peer baseline | critic-free，cluster 质量决定局部可比性 |
| [SWE-MeM](https://arxiv.org/abs/2606.28434), 06-26 | memory segment / token | 从准确的 compressed context 切分 trajectory，配合 token mean 与 memory-quality / overflow 等规则 mask | 工程路径完整，规则具有 coding-agent 特异性 |
| [CRAFT](https://arxiv.org/abs/2606.29476), 06-28 | token | 复用 GRPO sibling rollouts 与 teacher / student gap，估计 signed counterfactual importance | group-level 形式更强，单 trajectory 近似依赖 exchangeability |
| [ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/), 06-30 | source turn / finding / selection span | 最终 reconstruction trace 生成 positive-only hard mask，把组内正 advantage 路由到被使用的来源 | 直接保留 evidence provenance，识别“使用过”仍弱于“因果必要” |
| [TRIAGE](https://arxiv.org/abs/2606.32017), 06-30 | action segment / role | judge 标注 decisive progress、useful exploration、no-progress、regression，bounded role reward 加到 outcome advantage | judge 看不到最终 outcome 以减少泄漏，role label 仍可能有系统偏差 |

6 月的变化集中在 estimator。Bayesian ratio、自蒸馏 divergence、attention flow、graph TD、action-conditioned peer 与 counterfactual sibling 都试图在额外 rollout、critic bias 和近似假设之间重新取舍。memory 路线同时分成三支：对 compact state 的质量打分、对 memory write 做局部反事实、沿 source provenance 路由最终 advantage。

### 5. 2026 年 7 月：校准、错误定位与单 rollout critic

| 工作 | Credit unit | 信号与分配 | 证据边界 |
| --- | --- | --- | --- |
| [DASH](https://arxiv.org/abs/2607.00482), 07-01 | answer-commitment segment | 根据中间答案向正确答案靠近或偏离分配正负 credit，漂移后递增惩罚 | 适合可识别中间答案的 reasoning，迁移到开放 agent 需要新 parser / judge |
| [PivoARL](https://arxiv.org/abs/2607.03702), 07-04 | pivotal state / suffix / reflection | structured reflection 找最早 pivotal error，从该 state retry；正确 prefix、错误 suffix 和 reflection 分别获得信号 | self-reflection 的定位准确率决定局部更新质量 |
| [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/), 07-06 | execution / summary token | shared actor 生成 summary 与 action，独立 critic + token-level normalization + cross-segment GAE 分配 final task reward | 解决 compressed-state temporal credit，critic calibration 与 opaque summary provenance 保留不足 |
| [SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/), 07-08 | token / observation gap | 每 prompt 单 rollout，强化 critic、双侧 stale-token mask 与 skip-observation GAE | 重点是 async temporal estimator 和系统就绪度，语义局部归因较弱 |
| [TACO](https://arxiv.org/abs/2607.07976), 07-08 | tail token | 比较 sampled-token surprisal 与局部 entropy，软抑制 implausible token 的正向 credit | 只校准正 credit，tail risk 与任务贡献仍是代理关系 |

截至 7 月 13 日，最新公开工作更关注 credit 的可靠性：TACO 限制低概率 token 获得过强正向更新，PivoARL 与 DASH 定位错误或漂移，SAO 与 CompactionRL 用 critic 支持单 rollout 和分段轨迹。该阶段仍缺少统一的 attribution benchmark。

### 6. Compact 场景的专门比较

| 方法 | 被训练的 compact action | 局部 credit 来源 | State comparability | Advantage 如何落下 | 主要缺口 |
| --- | --- | --- | --- | --- | --- |
| Memory-R2 | memory write / update / delete | 同一 intermediate memory state 的 local rerollout | 强：显式固定 pre-action state | local group advantage 给 memory operation，global objective 保留端到端任务信号 | rerollout 成本与局部 horizon 选择 |
| MMPO | recursive summary | Belief Entropy 与最终 outcome | 中：比较 belief clarity，未直接构造同状态 action pair | bounded memory reward 加入 outcome；后续子轨迹回报归给 summary tokens | confidence proxy 可能误校准 |
| MemoPilot | 每轮 memory update | turn reward 与跨 rollout turn advantage | 中：设计 context-independent turn estimator | turn-level advantage 训练 memory copilot | 执行模型冻结，任务范围较窄 |
| HiMPO | memory write tokens | old / new memory 在同一 pre-write state 下的 recoverability 差值，再乘 hindsight gate | 强：局部替换对照 | memory-specific advantage 只给 memory tokens，trajectory advantage 给其他行为 | scorer 与 target outcome 依赖 |
| SWE-MeM | 何时、压什么、如何压 | final reward、critic / segment estimator 与规则 mask | 中：从真实 compressed state 继续 | per-token mean；memory-quality、late compact、overflow、invalid tool mask 修正 | 规则可迁移性有限 |
| ECHO | finding、source selection、reconstruction | 最终被选择的 source-indexed trace | 中：保留来源，但仍使用 prompt-level group advantage | $\widetilde A_q=A_+\mu_q$，只更新 final response、selected source action / finding 与 selection span | positive-only；使用记录不等于边际贡献；递归依赖会断开 |
| CompactionRL | opaque full-prefix summary | compressed-state critic、local GAE 与后续 token distance | 由 critic 条件化：无需组内同 state 比较 | 成功和失败均可产生 signed token advantage，summary 与 execution tokens 同训 | critic bootstrap / calibration；缺少 source provenance |
| Fine-Mem | memory operation | chunk QA step reward + evidence-anchored global reward attribution | 中：局部 QA 增加直接监督 | local step reward 与 evidence-based redistribution 共同训练 | 首次 preprint 早于检索窗；需要辅助 QA / evidence anchor |

ECHO 的 advantage 分配可以写成：

$$
A^{(n)}
=
\frac{R(\tau^{(n)})-\operatorname{mean}_iR(\tau^{(i)})}
{\operatorname{std}_iR(\tau^{(i)})+\epsilon},
\qquad
\widetilde A_q^{(n)}
=
\max(A^{(n)},0)\,\mu_q^{(n)}.
$$

$\mu_q=1$ 的位置包括 final response、最终 reconstruction 使用到的 source turn 对应 action / finding，以及 memory-selection span。其作用是改变梯度路由，组内 advantage 的数值来源仍是完整 trajectory reward。由此得到两个边界：

1. provenance mask 回答“最终 policy context 使用了哪些来源”。
2. 同状态 counterfactual 回答“在相同 pre-write state 下，换一个 memory action 会怎样”。

这两个问题互补。ECHO 没有直接修复 group advantage 的局部状态可比性；Memory-R2 / HiMPO 更接近局部 counterfactual。CompactionRL 用 $V(s_t)$ 和 GAE 条件化每个 compressed state，省去同 prompt 多 rollout 的组内比较，同时把误差来源转移到 critic 拟合和 boundary bootstrap。

一个值得验证的本地组合是：

$$
A_t^{\mathrm{hybrid}}
=
m_t^{\mathrm{provenance}}\,A_t^{\mathrm{local/critic}}.
$$

其中 provenance DAG 决定 credit 可达位置，local rerollout 或 compressed-state critic 决定 signed magnitude。该公式属于本地综合建议，没有来源论文报告这一完整组合。若继续发展，还需要递归 provenance、负向 credit、mask coverage 与 critic calibration 的联合诊断。

### 7. 结论链条

1. 5 月的方法主要寻找边界、重置点和同状态局部对照，开始从 trajectory reward 中分离可行动的局部单元。
2. 6 月的方法扩展 estimator，使用 teacher likelihood、attention flow、graph、judge、sibling rollout 和 memory-specific counterfactual。
3. ECHO 把 source trace 变成 gradient route，解决 opaque summary 删除 provenance 后难以回传 credit 的问题。
4. compact 场景需要额外审计有效状态可比性。prompt-level reward normalization、局部 memory utility 与后续 compressed-state value 分别回答不同层级的问题。
5. 7 月的方法把重点推进到正向 credit 校准、pivotal error localization、single-rollout critic 与跨 compaction boundary 的 temporal credit。
6. 当前没有一种方法同时提供低成本、严格因果、双向 credit、递归 provenance、可靠 value calibration 和跨任务验证。

## 关键实验/定理

### 结果 1：State comparability 是 compact credit 的独立变量

- 设置：比较 Memory-R2、HiMPO、ECHO 与 CompactionRL 如何评价 memory / summary action。
- Baseline：同 prompt trajectory-level GRPO advantage。
- 指标：是否固定 pre-write state、是否构造 counterfactual、是否有 state-conditioned value、是否保留 source trace。
- 结果：Memory-R2 与 HiMPO 显式固定局部 pre-write state；ECHO 保留 provenance 并使用 prompt-level group advantage；CompactionRL 用独立 critic 条件化 compressed state。
- 证据定位：[Memory-R2 abstract / method](https://arxiv.org/abs/2605.21768)、[HiMPO abstract / method](https://arxiv.org/abs/2606.16285)、[ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/)、[CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/)。
- 对照是否可比：这些论文使用不同任务与模型，只能比较 estimator 条件，不能比较最终分数。
- 支持的最窄结论：compact action 会改变后续有效 state，credit estimator 应明确声明局部比较条件。
- 解读：future work 需要把 state comparability 与 credit granularity 分开报告。

### 结果 2：ECHO 提供 provenance routing，因果贡献仍是近似

- 设置：ECHO 用最终 reconstruction 的 selected source ids 构造 token hard mask，只保留正 group advantage。
- Baseline：dense all-token GRPO-style credit。
- 指标：credit mask coverage、selected source、正负 advantage、最终任务准确率与轨迹规模。
- 结果：论文消融显示 traceable credit 与更高准确率、稳定性相关；source mask 只覆盖最终 trace，未递归追踪 source turn 自身依赖。
- 证据定位：[ECHO official abstract / HTML](https://arxiv.org/abs/2606.31650)；本地 [ECHO 论文笔记的方法与 ablation](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/)。
- 对照是否可比：内部 ablation 共享主要训练配置；缺少多 seed 和 Memory-R2 / HiMPO / Fine-Mem 直接对照。
- 支持的最窄结论：source-indexed reconstruction 能提供可复用的 gradient routing trace。
- 解读：被选中说明 policy 使用过该证据；必要性、充分性与边际贡献还需要删除、替换或同状态 rerollout 测试。

### 结果 3：7 月新工作把校准和 temporal estimator 推到训练主路径

- 设置：TACO、PivoARL、DASH、SAO 与 CompactionRL 分别处理正向 tail credit、pivotal error、segment drift、single-rollout GAE 与 compaction segment。
- Baseline：trajectory-level GRPO、generic PPO 或各论文最接近的 agentic RL baseline。
- 指标：credit localization、训练稳定性、任务成功率、rollout / critic 成本。
- 结果：五篇论文均报告局部机制带来正向效果；证据分散于 reasoning、coding 与 agent benchmarks，统计和 compute matching 程度不同。
- 证据定位：[TACO](https://arxiv.org/abs/2607.07976)、[PivoARL](https://arxiv.org/abs/2607.03702)、[DASH](https://arxiv.org/abs/2607.00482)、[SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/)、[CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/)。
- 对照是否可比：不具备统一 protocol。
- 支持的最窄结论：credit assignment 正在与 entropy calibration、retry、async rollout 和 context management 合并设计。
- 解读：算法质量和系统效率需要在相同 rollout token、critic FLOPs、actor update 与 wall-clock 下复验。

### 结果 4：正式发表更新强化了 memory / search 的 step-level 路线

- 设置：检查 ACL 2026 与 Findings 的正式论文集页面。
- 结果：[Fine-Mem](https://aclanthology.org/2026.acl-long.900/) 用 chunk QA reward 与 evidence-anchored attribution 训练 memory operation；[CriticSearch](https://aclanthology.org/2026.findings-acl.596/) 用可见完整 trace 与 gold answer 的 frozen asymmetric critic 给 search turn dense reward；[ELPO](https://aclanthology.org/2026.acl-long.504/) 用 binary-search rollout tree 定位首个不可恢复错误并做 hierarchical advantage；[CW-GRPO](https://aclanthology.org/2026.acl-long.1462/) 用 LLM judge 的 round contribution weight 缩放 outcome advantage。
- 证据定位：[ACL Anthology Fine-Mem](https://aclanthology.org/2026.acl-long.900/)、[CriticSearch](https://aclanthology.org/2026.findings-acl.596/)、[ELPO](https://aclanthology.org/2026.acl-long.504/)、[CW-GRPO](https://aclanthology.org/2026.acl-long.1462/) 官方论文集页面。
- 对照是否可比：四篇论文使用不同任务、模型与 estimator，本节只确认正式发表状态和 credit unit，不比较性能。
- 时间解释：这些页面在 7 月正式发布，其中部分方法首次 preprint 早于 5 月；它们属于 venue-status 更新和强相关基线。
- 支持的最窄结论：memory operation、search turn 与 irrecoverable step 已成为正式会议论文中的稳定 credit unit。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 评测协议 | 跨论文综合，不执行统一训练；证据来自官方论文页、正文和本地已审计笔记。 |
| 统计报告 | 多数 2026 preprint 缺统一 seeds、CI、显著性与 attribution error 指标。 |
| Baseline 是否 tuned | 各论文披露程度不同；不能从跨论文分数反推 estimator 优劣。 |
| Baseline 是否 compute-matched | local rerollout、teacher forward、judge call、critic、graph construction 的成本通常未统一对齐。 |
| Baseline 是否 implementation-matched | 单篇内部消融较接近；跨论文实现不匹配。 |
| Baseline 是否覆盖强替代方案 | compact 论文之间的直接对照很少，ECHO、Memory-R2、HiMPO、MMPO、SWE-MeM、CompactionRL 尚缺同框架比较。 |
| Baseline 是否存在弱化风险 | generic GRPO / PPO 容易成为较弱基线；strong critic、same-state rerollout、source-aware mask 应纳入同一矩阵。 |
| 结论边界 | 本文支持方法分类、假设比较与复验设计，不支持统一性能排名。 |
| 主要成本轴 | rollout 数、teacher / judge forwards、critic FLOPs、graph memory、summary tokens、环境重放、wall-clock。 |
| 主要质量轴 | task return、attribution fidelity、credit sign accuracy、state comparability、gradient concentration、negative-credit coverage。 |

推荐的统一评测协议：

1. **Controlled pivotal-step benchmark**：预先植入可删除、替换或恢复的关键 action，测 credit precision / recall 与 sign accuracy。
2. **Same-state intervention**：从同一 cached state 重放多个 memory / tool / reasoning action，估计局部 return 差值。
3. **Gradient accounting**：报告各 token、turn、role、memory action 获得的梯度质量与 mask coverage。
4. **State audit**：报告组内有效 state 的相似度、singleton rate、cluster size 与 critic explained variance。
5. **Cost matching**：同时对齐 rollout tokens、environment steps、teacher / judge calls、critic FLOPs、GPU hours 和 wall-clock。
6. **Compact audit**：分别报告 peak context、累计生成 token、summary 长度、事实遗漏、递归误差与 source provenance recall。
7. **双向诊断**：分别评估成功轨迹中的无用 action 是否被强化、失败轨迹中的有用 action 是否保留正 credit。

## 证据链强度评估

### 强证据

- arXiv API 的精确检索可复核，212 条原始结果提供明确搜索底稿；补充查询覆盖没有使用精确词组的核心 compact 方法。
- Memory-R2、HiMPO、ECHO 与 CompactionRL 的官方正文对 credit source 和 update target 有清晰公式或流程，可做机制层比较。
- ACL Anthology 提供 Fine-Mem、CriticSearch、ELPO 与 CW-GRPO 的正式论文集元数据和摘要。

### 中等强度证据

- 5-7 月方法沿边界定位、counterfactual、critic、provenance 和 calibration 演进的趋势由多篇独立论文支持，但发表密度也受 arXiv 命名与检索词影响。
- ECHO 的内部 ablation 支持 traceable mask；Memory-R2 / HiMPO 的 intervention 支持局部 memory credit。它们尚未在统一环境直接比较。
- 多篇论文在 arXiv comment 中标注 ICML 2026 accepted，本文只把该状态视为作者提交的元数据，未据此提高实验结论强度。

### 需要谨慎的推论

- attention、surprisal、entropy、teacher divergence、judge label 与 provenance 都是局部贡献代理；代理和真正干预效应之间可能存在系统偏差。
- group baseline 在 memory state 分叉后必然产生严格 bias 的说法需要具体 estimator 推导。更稳妥的结论是局部条件失配会提高混杂与方差，某些归一化和复用方式会进一步产生偏差。
- critic 路线消除了组内等待后，value calibration、bootstrap 与 async staleness 成为主要误差来源。
- provenance mask 证明使用关系，因果必要性需要删除 / 替换干预；positive-only mask 也会减少失败轨迹中的纠错信号。

## OpenReview / 审稿意见吸收

- Page type: not-applicable
- Match confidence: high
- Observed at: 2026-07-13
- Venue status: composite；来源混合 arXiv preprint、ACL 2026 / Findings 正式论文与少量 OpenReview 页面。
- Public reviews: 本次没有发现能够覆盖整个方法集合的统一公开 review corpus。
- Ratings / confidence: 不适用。
- Reviewer consensus: 不适用。
- Main criticisms: 跨论文共同风险包括 proxy validity、state mismatch、judge / critic bias、额外采样成本、统计不足与 compute mismatch。
- Author response: 各来源状态不同，本综合不合并为统一 rebuttal 结论。
- 对可信度的影响: 机制分类可以直接使用；方法优劣和因果准确性仍需同框架复验。

## 本地讨论补充

### 1. ECHO 相关工作的最短判断

- **最接近 ECHO 的 credit 方向**：Fine-Mem 同样沿“最终使用到的 evidence”回传 reward；HiMPO 对 memory write 做局部替换；Memory-R2 从同 state rerollout；CompactionRL 用 critic 跨 summary boundary 传递 signed advantage。
- **ECHO 的独特点**：source id 同时服务 context reconstruction 和 gradient routing，训练 trace 与推理证据路径共享数据结构。
- **ECHO 的当前边界**：final-trace、positive-only、无递归 provenance、无局部 counterfactual。它更适合作为可追踪 credit router，完整 causal estimator 仍需其他组件。

### 2. 对“聚合 reward 是否受 trace set 不同影响”的延伸

同一 prompt 下，每条 rollout 的 trace set 不同本来就是 policy exploration 的一部分。组内均值可以估计 prompt 条件下的相对 outcome。若训练目标进一步声称某个 selected memory 或 aggregated trace 的局部 advantage，trace set 差异就会进入局部归因：

```text
same prompt
  -> rollout A -> memory / trace set A -> later state A -> reward A
  -> rollout B -> memory / trace set B -> later state B -> reward B

reward A - group mean
  = memory action effect
  + later policy / tool / observation effect
  + interaction terms
  + sampling noise
```

因此，group reward 能训练完整 policy，局部 memory credit 的解释需要额外条件。Memory-R2 用同状态 rerollout 缩小条件差异，HiMPO 用 old / new memory replacement 估计局部 utility，ECHO 用 provenance mask 缩小更新范围，CompactionRL 用 state critic 分解 temporal return。四种方法处理的是同一混合项的不同部分。

### 3. 下一轮值得跟踪的组合

- `same-state local advantage + recursive provenance mask`：同时提高局部可比性与 credit reachability。
- `signed critic advantage + source coverage constraint`：保留失败轨迹中的有用证据，控制 critic 对无来源 summary token 的误更新。
- `counterfactual deletion benchmark + total compute matching`：把归因 fidelity 与训练收益、rollout 成本放在同一表中。
- `workflow-role credit + memory provenance`：把 search、compact、aggregate、verify、finish 等 role 分开，再追踪它们使用的来源。

## 主要启发

- Credit assignment 方法应同时声明 credit unit、识别信号、分配算子和 state comparability 条件。
- compact action 既改变后续 observation，也改变训练样本边界；memory quality、temporal value 与 provenance 需要分层建模。
- ECHO 说明可追踪的 context representation 能直接改善 gradient routing；Memory-R2 与 HiMPO 说明局部反事实能降低 memory blame leakage。
- actor-critic 支持 single-rollout 与 compressed-state conditioning，也引入 value calibration 和额外训练计算。
- 后续论文应把 attribution fidelity、task performance 与 total compute 三类结果同时报告。

## 局限

1. 检索截止到 2026-07-13 14:38 CST，后续新版本和当天晚些时候发布的条目未覆盖。
2. 全网搜索依赖公开索引和搜索引擎可见性，无法保证覆盖封闭投稿、未索引项目和不同术语下的全部工作。
3. 核心表以 LLM reasoning / agentic RL 为主，经典 MARL、robotics 与 neuroscience 方法只在其直接影响 LLM credit 时纳入。
4. 大量条目只完成 abstract / method-level 筛选，只有已存档论文与 compact 核心论文接受了更深公式审计。
5. 方法数量增长很快，单个时间窗口容易高估短期术语趋势；正式复现、引用和 venue 结果仍需持续更新。

## 跨论文关系

- 与已有论文的作者或机构关系：CompactionRL 与 SAO 共享 Tsinghua KEG / Z.AI 作者群；ECHO 为 Peking University / Baidu / USTC 合作，当前没有与前者核验到直接作者重叠。
- 与 [Credit Assignment Survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/)：survey 截止 early 2026，本综合补充 2026-05-01 至 2026-07-13 的方法增量，并增加 compact state comparability 轴。
- 与 [SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/)：SRPO 代表 reset / same-prefix counterfactual；Memory-R2 把同类思想迁移到 memory state。
- 与 [VIMPO](/papers/2606.20008-vimpo-value-implicit-policy-optimization-llms/) 和 [SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/)：VIMPO 使用 implicit value，SAO / CompactionRL 使用显式 critic，三者形成 critic-free 到 critic-based temporal credit 谱系。
- 与 [ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/) 和 [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/)：ECHO 强调 source provenance 与 positive mask，CompactionRL 强调 opaque summary 上的 signed critic / GAE；两者共同说明 context representation 决定可实现的 credit 粒度。

## Reference Intake Brief

### Target

- Intended target system: 新增 RL credit assignment 专题综合文档。
- Existing related assets: `content/utility/papers-index.md`；[Credit Assignment Survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/)；[SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/)；[VIMPO](/papers/2606.20008-vimpo-value-implicit-policy-optimization-llms/)；[ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/)；[CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/)；[SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/)。
- Proposed form: 新建 composite Markdown，更新唯一索引行、controlled tags 与对应论文的关系章节。

### Reusable Elements

1. `credit unit × identification signal × assignment operator × comparability condition` 四轴审计框架。
2. compact 方法对照表与 ECHO advantage 路由公式。
3. 2026 年 5-7 月核心论文时间线及正式发表更新。
4. attribution fidelity、state comparability 与 compute matching 的统一复验协议。

### Risks

- Copyright/over-copying: 只转述机制、必要公式和少量官方摘要事实，不复制原文长段或完整实验表。
- Unsourced or unverifiable claims: 跨论文统一和 hybrid objective 均标为本地分析；会议状态以官方论文集或 arXiv comment 的证据等级分别记录。
- Tone/brand mismatch: 采用技术归档与证据审计语气，不使用排行榜式结论。
- Safety/compliance issues: 主题属于通用 RL 训练方法，没有直接滥用操作细节。
- Overlap with existing assets: 本文更新 survey 时间窗，单篇精读仍由各自论文笔记承担。

### Skipped

| Material | Reason |
| --- | --- |
| 212 条 arXiv 原始结果逐条列表 | 大量结果属于通用 RL、MARL、neuroscience 或只在背景中提及 credit assignment，完整转录会降低专题信号。 |
| 未公开 OpenReview 内容 | 无法验证或不具备公开访问权限。 |
| 跨论文性能排名 | 模型、任务、reward、rollout budget、critic / judge 成本和 baseline recipe 不可比。 |
| 新增全部来源作者档案 | Composite 没有单一作者集合；来源作者资料在后续单篇归档时分别核验。 |

### Recommendation

Decision: merge

Why: 该综合补齐现有 credit assignment survey 在 2026 年 5 月之后的快速增量，并把 compact state comparability、provenance routing 与 signed temporal advantage 放进同一审计框架，便于继续判断 ECHO 及后续 memory / agent RL 方法。
