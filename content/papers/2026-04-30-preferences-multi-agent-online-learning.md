# What Preferences Can—and Cannot—Predict in Multi-Agent Online Learning 论文笔记

First-Archived-At: 2026-07-16 16:02
Updated-At: 2026-07-16 16:02

## Source

- Workflow version: v2
- Material type: research-paper
- Canonical source: [OpenReview forum](https://openreview.net/forum?id=5W30WwL8wt)
- Title: What Preferences Can—and Cannot—Predict in Multi-Agent Online Learning
- Authors: Omar Abbadi, Rida Laraki, Panayotis Mertikopoulos
- Responsible organization: Moroccan Center for Game Theory, UM6P；Univ. Grenoble Alpes, CNRS, Inria, Grenoble INP, LIG
- arXiv: 截至 2026-07-16 未发现公开 arXiv 版本。
- PDF: [ICML 2026 camera-ready PDF](https://openreview.net/pdf/99ac87aeab1da5d4497587ae8832ee449cbcb8b4.pdf)
- Originally submitted PDF: [OpenReview attachment](https://openreview.net/attachment?id=5W30WwL8wt&name=originally_submitted_PDF)
- Code/Project: 未发现官方代码仓库；论文贡献为有限博弈与连续时间学习动力学的理论结果。
- OpenReview / Review page: [OpenReview](https://openreview.net/forum?id=5W30WwL8wt)
- Conference page: [ICML 2026 poster](https://icml.cc/virtual/2026/poster/66240)；该页面关联 [Oral 71186](https://icml.cc/virtual/2026/oral/71186)
- Poster: [ICML 2026 official poster](https://icml.cc/media/PosterPDFs/ICML%202026/66240.png)
- Submitted: OpenReview 公开记录发布于 2026-04-30；可检索元数据未给出更早的准确投稿日期。
- Published / updated: OpenReview published 2026-04-30, last modified 2026-06-24；Proceedings of the 43rd International Conference on Machine Learning, PMLR 306, 2026
- Current version read: ICML 2026 camera-ready，PMLR 306
- Version / revision read: OpenReview camera-ready PDF hash 99ac87aeab1da5d4497587ae8832ee449cbcb8b4
- Accessed: 2026-07-16
- Subjects: game theory；online learning；game dynamics；no-regret learning；follow-the-regularized-leader；stability

## 作者与关系

- [Omar Abbadi](/authors/omar-abbadi/)：Moroccan Center for Game Theory, UM6P；Univ. Grenoble Alpes, CNRS, Inria, Grenoble INP, LIG。
- [Rida Laraki](/authors/rida-laraki/)：Moroccan Center for Game Theory, UM6P。
- [Panayotis Mertikopoulos](/authors/panayotis-mertikopoulos/)：Univ. Grenoble Alpes, CNRS, Inria, Grenoble INP, LIG。

关系摘要：

- Omar Abbadi 是论文通讯作者。Inria POLARIS 2025 年报将其列为 UM6P–UGA 联合培养博士生，并记录 Rida Laraki 与 Panayotis Mertikopoulos 的共同指导关系。
- 团队由 Omar 的双机构身份连接 UM6P 的 Moroccan Center for Game Theory 与 Grenoble 的 CNRS / Inria / LIG 学术网络。
- Rida Laraki 与 Panayotis Mertikopoulos 的合作可追溯到 Higher Order Game Dynamics、Inertial Game Dynamics and Applications to Constrained Optimization 与 Learning in nonatomic games 等博弈学习工作，本论文延续了这条长期研究线。
- 三位作者此前共同完成 NeurIPS 2025 DynaFront workshop 论文 Preference Graphs and the Attractors of Regularized Learning in Games；本论文把该研究线扩展为 ICML 2026 的完整理论结果。
- 本地作者档案与既有论文中未发现三位作者的可靠重叠，本次均为首次收录。

## 一句话结论

论文把有限博弈的序数偏好图与连续时间 FTRL 的集合稳定性联系起来：偏好闭合给出稳定结果的必要约束；对 subgame，club 在一般 FTRL 下足以保证 span 渐近稳定、在无 ties 时形成等价判据，并在 strategy flow 下直接形成 attractor 等价判据；对一般纯策略集合，三人反例表明相同的偏好方向仍可能产生不稳定 span，作者因而引入依赖收益差幅度的 leaklessness，为一般 span 恢复可检验的吸引性充分条件。

## 阅读目标与判断边界

本笔记关注：

1. 偏好图能够对 FTRL 长期稳定集合给出哪些必要条件。
2. 为什么 subgame 的 product structure 允许偏好闭合推出动态稳定，而一般纯策略集合不具备该性质。
3. leaklessness 如何补回偏好图丢弃的 cardinal payoff 信息，以及它覆盖哪些 regularizer 与动力学。
4. 这些结论对多智能体 reward specification 的实际含义与迁移边界。

判断边界：

- 论文研究有限 normal-form game 与连续时间 FTRL；离散时间、有限步长、采样噪声和函数逼近只在动机层面被关联。
- 核心证据是定理、附录证明和显式构造的 $2\times2\times2$ 反例，没有大规模 MARL 实验。
- strategy flow 依赖 steep regularizer 与额外正则性；entropic regularizer 对应 replicator dynamics。Euclidean 等 non-steep regularizer 不自动继承所有 strategy-flow 结论。
- leaklessness 为一般 span 给出充分条件，论文没有完成任意 attractor 的必要且充分分类。
- 本笔记采用 camera-ready 的定理编号；最初投稿版本的编号与之存在移动。

证据写法：

- 论文事实：正文定义、定理、反例、图和附录证明直接给出的内容。
- 作者主张：摘要、引言、结论和 poster 对理论意义的解释。
- 本地分析：对 proof mechanism、reward specification 含义和迁移边界的重建。

## 论文脉络

### 1. 研究问题、背景和价值

多智能体系统中的长期结果常被写成 Nash equilibrium 收敛问题。一般有限博弈下，no-regret dynamics 可能循环、复现或表现出更复杂的集合极限；严格 Nash equilibrium 只能解释局部稳定点，实际相关对象经常是 strategy space 中的稳定集合与 attractor。

论文从更弱的信息开始：若只保留每个 pure profile 上“某位玩家单边换行动后变好、持平或变差”的方向，能否预测 payoff-driven learning 的长期结果？这些方向构成 preference graph，它保留 ordinal ordering，丢弃 payoff difference 的幅度。

这个问题直接对应 reward specification：设计者经常先确定预期行为排序，再选择数值 reward 实现该排序。多组数值 reward 可以诱导同一 preference graph；FTRL 的向量场仍读取具体 payoff，因此相同排序可能产生不同的长期行为。

证据定位：PDF Abstract、Section 1，pp. 1–2；Figure 1；ICML official poster。

### 2. 已有解决方案与不足

已有结果给出了若干局部或特殊结构：

1. strict Nash equilibrium 与 regularized learning 的局部渐近稳定点相对应。
2. preference graph 的 terminal components / sink equilibria 必须被某些 replicator attractor 包含。
3. club subgame 在 replicator 或相关 evolutionary dynamics 下具有吸引性。
4. potential game 可用 potential function 处理；zero-sum / harmonic game 常出现 recurrence。

这些结论留下两个空缺：

- “attractor 必须包含某种图结构”仍无法说明图结构自身张成的 mixed region 是否稳定。
- replicator 的 face invariance 与 entropy geometry 支撑了部分旧证明，难以直接扩展到更广的 regularizer 和任意非 product span。

论文把问题拆为必要性、subgame 充分性、一般集合反例、cardinal 条件恢复四步。

证据定位：PDF Section 1、Section 2、Section 5；Related Work，p. 13。

### 3. 作者可能的思考路径

本地分析可以把论文的推导路线重建为四步：

1. 先问必要性：若 stable / attracting set 的 pure skeleton 存在向外的 profitable deviation，可否沿一条一维 pure-profile edge 构造离开邻域的轨迹。
2. 再寻找正向情形：把候选集合限制为 product-form subgame，使每个 outside action 都能在单个 face 上与 inside action 比较，并尝试构造统一下降的 Fenchel gap。
3. 将 product structure 移除后测试原结论。三人二行动反例显示 club 无法控制 mixed-interior escape，从而确定 pure preference directions 丢失了必要信息。
4. 回到 FTRL energy 的导数，寻找能控制 outside mass 的 cardinal quantity。把所有玩家朝同一 outside profile 的 unilateral gain 相加，得到 leakage，并由其符号构造一般 span 的 Lyapunov energy。

这条路线让必要条件、特殊情形、反例和修复条件共享同一个问题：候选 span 附近的向量场是否具有一致向内 drift。

### 4. 基本对象：preference graph、span 与 skeleton

设玩家集合为 $N$，pure action profile 空间为

$$
A=\prod_{i\in N}A_i,
$$

mixed strategy profile 空间为

$$
X=\prod_{i\in N}\Delta(A_i).
$$

若 $\alpha,\beta\in A$ 只在玩家 $i$ 的行动上不同，且

$$
u_i(\alpha)\leq u_i(\beta),
$$

preference graph 中存在边 $\alpha\to\beta$。平局会生成双向边；图只保留符号，边权 $u_i(\beta)-u_i(\alpha)$ 属于额外的 cardinal information。

对 $H\subseteq A$：

- club：closed under better replies；任何 weakly profitable outgoing edge 都留在 $H$。
- s-club：closed under strict better replies；允许通往外部的 tie edge，不允许严格获益的 outgoing edge。
- sink equilibrium：非空、强连通且为 club 的 pure-profile 集合。
- skeleton：$S\subseteq X$ 中包含的 pure profiles，$\operatorname{skl}(S)=S\cap A$。
- span：所有 joint support 都落在 $H$ 内的 mixed profiles：

$$
\operatorname{span}(H)
=
\{x\in X:\ x_\alpha=0,\ \forall \alpha\notin H\},
\qquad
x_\alpha=\prod_i x_{i,\alpha_i}.
$$

若 $B=\prod_i B_i$ 是 subgame，$\operatorname{span}(B)=\prod_i\Delta(B_i)$ 是单个 face。一般 $H$ 的 span 可以是多个 faces 的并集，这个几何差异决定了后续正向结果的边界。

证据定位：PDF Section 3.1，Definitions 1–2、Figure 3，p. 4。

### 5. FTRL 与稳定性口径

每位玩家维护累计 payoff score $y_i$，通过 regularized choice map 选择 mixed action：

$$
Q_i(y_i)
=
\arg\max_{x_i\in X_i}
\left\{\langle y_i,x_i\rangle-h_i(x_i)\right\},
$$

$$
\dot y_i(t)=v_i(x(t)),
\qquad
x_i(t)=Q_i(y_i(t)).
$$

论文假设 regularizer decomposable、kernel 在内部二阶连续且强凸。negative entropy 产生 replicator dynamics；Euclidean regularizer 产生 projection-type dynamics。前者 steep，轨迹保持在初始 face 内；后者可以在有限时间接触或离开边界。

稳定性分三层：

- stable：足够接近集合的轨迹始终保持接近。
- attracting：某个邻域中的轨迹最终趋近集合。
- asymptotically stable：同时 stable 与 attracting。
- attractor：对相应 strategy flow 不变且 asymptotically stable 的集合。

FTRL stability 通过 score initialization $y(0)$ 定义，只量化 $x(0)=Q(y(0))\in\operatorname{Im}Q$ 的轨迹；对 full game 的 steep regularizer，$\operatorname{Im}Q=X^\circ$。strategy flow 则把 facewise vector fields 拼接到整个 $X$，其 attractor 需要对所有相邻 faces 上的初值满足不变性、稳定性与吸引性。这个初值域差异解释了正文为何分别陈述 FTRL 与 strategy-flow 结果。

strategy flow 需要 choice map 能在 faces 上拼成良定的向量场，因此部分定理明确限定于 steep regularizer。

证据定位：PDF Section 3.2，FTRL / SD definitions，pp. 4–5；Appendix C（attractor）、Appendix D（regularizer）、Appendix E（strategy dynamics）。

### 6. 必要条件：动态稳定迫使偏好闭合

论文给出两种强度不同的必要条件：

1. Proposition 1：若 $S$ 对 strategy flow 是 attracting，则其 skeleton 是 club。
2. Theorem 1：若 $S$ 在一般 FTRL score dynamics 下 stable，则其 skeleton 是 s-club。

两者在没有 payoff ties 时合并为同一个 closure 条件。存在 ties 时，stable 只排除离开 skeleton 的 strictly profitable deviation；吸引性的 strategy-flow 结论还排除 weakly profitable outgoing edge。

Theorem 1 的证明难点来自 non-steep regularizer 缺少 face invariance。作者在可比较的两个 pure profiles 附近构造 score initialization，让发生严格获益偏离的玩家有足够时间离开稳定邻域，同时让其他玩家在该时间尺度内近似不动，从而导出矛盾。

证据定位：PDF Section 4，Proposition 1、Theorem 1，p. 5；proofs in Appendix F。

### 7. 连通性约束 attractor 的几何形状

Theorem 2 说明：若 strategy-flow attractor $\mathcal A$ 包含 strongly connected pure-profile set $H$，则

$$
\operatorname{span}(H)\subseteq\mathcal A.
$$

因此，当整个 preference graph strongly connected 时，strategy flow 没有 proper attractor。其证明用 chain transitivity 把图上的改善路径传播到 mixed region，再按 faces / subfaces 归纳；attractor 不能只保留强连通骨架并排除骨架张成的内部混合策略。

这个结果限制 attractor 的最小几何范围，却没有说明 $\operatorname{span}(H)$ 本身一定稳定。

证据定位：PDF Section 4，Theorem 2，pp. 5–6；正文 proof sketch 与相应附录。

### 8. subgame：偏好信息足以刻画稳定性

Theorem 3：若 product-form subgame $B=\prod_iB_i$ 是 club，则 $\operatorname{span}(B)$ 在 FTRL 下 asymptotically stable。

证明构造 Fenchel gap：

$$
F_B(y)=h^\ast(y)-h_B^\ast(y).
$$

$F_B$ 非负，并在 $Q(y)\in\operatorname{span}(B)$ 时取零。club 条件配合 subgame 的 product structure，使 span 邻域中的每个 outside action 都能与 inside action 比较并得到一致向内的 payoff margin；由此可证明 $F_B$ 按 outside probability mass 的量级下降。

这个 energy function 同时覆盖 steep 与 non-steep regularizer，是论文相对只依赖 Bregman divergence / face invariance 的旧路线的重要扩展。

进一步得到：

- Corollary 1：无 ties 时，$B$ 为 club 当且仅当 $\operatorname{span}(B)$ 在 FTRL 下 asymptotically stable。
- Corollary 2：对任意 subgame，$B$ 为 club 当且仅当其 span 是 strategy-flow attractor。
- Corollary 3：在 weakly acyclic 且无 ties 的游戏中，minimal strategy-flow attractors 恰为 strict Nash equilibria。

证据定位：PDF Section 5.1，Theorem 3、Corollaries 1–3，pp. 6–7；Fenchel-gap proof in Appendix G。

### 9. 一般 span：偏好闭合仍可能动态不稳定

Proposition 2 构造一个 $2\times2\times2$ 三人博弈。红色 pure-profile set $H$ 是唯一 proper club，其 span 为 top、right、back 三个 faces 的并集；在 entropic FTRL / replicator dynamics 下，这个 span 仍不稳定。

反例从 top face 中心附近初始化。该点对前两位玩家近似静止，第三位玩家先获得朝 bottom face 的偏离激励；前两位玩家尚未来得及把轨迹带回 $H$ 的另一 face，轨迹已经离开任意给定的小邻域。escape 发生在 mixed interior，因此单独检查 proper subfaces 也无法发现失败。

这一步说明了 product structure 的作用：对一般 club $H$，所有 weakly profitable pure unilateral-deviation arcs 都留在 $H$ 内，但这种逐边 ordinal closure 仍无法控制多位玩家在 mixed profile 上的 aggregate drift。相同 preference graph 的 edge directions 不包含解决该问题所需的 payoff magnitude。

该反例同时推翻 Biggar & Papadimitriou 关于 replicator local sources 的相关 conjecture；其最小 attractor 甚至不必是 pure-profile span。

证据定位：PDF Section 5.2，Proposition 2、Figure 1a，p. 7；Remarks G.4–G.5。

### 10. leaklessness：用 cardinal payoff 恢复一般 span 的吸引性

对 outside pure profile $\alpha$，作者定义从当前 mixed profile $x$ 朝 $\alpha$ 的 aggregate leakage：

$$
\ell_\alpha(x)
=
\sum_{i\in N}
\left[
u_i(\alpha_i,x_{-i})-u_i(x)
\right].
$$

每一项是玩家 $i$ 单边切到 $\alpha_i$ 的即时收益，求和后衡量所有玩家朝同一个 outside profile 的合计 payoff drift。

$H$ 为 leakless，当且仅当对所有 $\alpha\notin H,\beta\in H$，

$$
\ell_\alpha(\beta)\leq0.
$$

strictly leakless 将不等号改为严格小于。它读取 pure deviation 的数值差，因此相同 ordinal graph 的不同 cardinal realization 可能有不同结论。

Proposition 3 给出蕴含链：

$$
\text{leakless}\Longrightarrow\text{s-club},
\qquad
\text{strictly leakless}\Longrightarrow\text{club}.
$$

singleton 情况退化为 pure Nash / strict Nash 的集合化版本。对固定 $H$，直接检查成本为

$$
O\!\left(|N|\,|H|\,|A\setminus H|\right),
$$

构造 leakage graph 后可在 $O(|N||A|^2)$ 时间内寻找 leakless set；该复杂度相对于显式 payoff table 为多项式。

证据定位：PDF Section 5.3，Definition 5、Proposition 3，pp. 7–8。

### 11. leaklessness 对应的两个正向定理

Theorem 4：若 $H$ strictly leakless，则 $\operatorname{span}(H)$ 是 strategy-flow attractor。证明使用 generalized Fenchel-coupling energy：

$$
\bar F_H(y)
=
\sum_{\alpha\notin H}
\exp\{-F_h(\alpha,y)\},
$$

其中

$$
F_h(x,y)=h(x)+h^\ast(y)-\langle y,x\rangle.
$$

沿轨迹求导后，主项由 $\ell_\alpha(x)$ 控制。strict leaklessness 在 span 上给出一致负 margin，连续性把 dissipativity 延伸到邻域。

Theorem 5 针对 entropic FTRL / replicator dynamics 放宽条件：若 $H$ 同时 leakless 且为 club，则 $\operatorname{span}(H)$ 是 replicator attractor。此时能量可直接取 outside mass

$$
\bar W_H(x)=\sum_{\alpha\notin H}x_\alpha.
$$

leakless 控制 inside–outside 一阶项，club 提供严格回流机制，outside–outside interaction 只贡献二阶小量。该结论利用 entropy geometry，不能直接推广到任意 regularizer。

证据定位：PDF Section 5.3，Theorems 4–5、Figure 4，p. 8；相应附录证明。

### 12. 结论链条

论文建立了如下层级：

$$
\begin{array}{c}
\text{FTRL stable}
\\
\Downarrow
\\
\text{skeleton is s-club}
\end{array}
\qquad
\begin{array}{c}
\text{strategy-flow attracting}
\\
\Downarrow
\\
\text{skeleton is club}
\end{array}
$$

对 subgame：

$$
\text{club}
\Longrightarrow
\text{FTRL asymptotic stability},
$$

并在无 ties 或 strategy-flow 的对应口径下得到等价关系。

对 arbitrary span：

$$
\text{club}
\nRightarrow
\text{dynamic stability},
$$

而 cardinal 条件恢复：

$$
\text{strictly leakless}
\Longrightarrow
\text{strategy-flow attractor},
$$

$$
\text{leakless}+\text{club}
\Longrightarrow
\text{replicator attractor}.
$$

本地分析：preference graph 适合作为必要条件筛选器；对 product-form subgame，它升级为完整判据；对一般集合，还需要 payoff magnitude 或更强的动力学结构。

## 关键实验/定理

### 结果 1：稳定性给出可计算的序数必要条件

- 设置：有限 normal-form game；decomposable、smooth、strongly convex regularizer；一般 FTRL stability 与 steep case 的 strategy flow 分开处理。
- 结果：stable FTRL set 的 skeleton 必为 s-club；strategy-flow attracting set 的 skeleton 必为 club。
- 证据定位：Section 4，Proposition 1、Theorem 1，p. 5。
- 对照是否可比：两个结论的动力学与稳定性前提不同，存在 ties 时不能互换。
- 支持的最窄结论：出现离开 skeleton 的严格 better reply 时，该集合不可能在 FTRL 下 stable。
- 解读：只读 preference graph 就能排除一批候选长期结果，但无法确认剩余候选一定稳定。

### 结果 2：club 完整刻画 subgame span

- 设置：$B=\prod_iB_i$ 为 subgame；FTRL 允许 steep 与 non-steep regularizer。
- 结果：club 推出 span 的 asymptotic stability；无 ties 时也构成必要条件。
- 证据定位：Section 5.1，Theorem 3、Corollaries 1–2，p. 6。
- 对照是否可比：等价结论分别要求无 ties 或限定 strategy flow。
- 支持的最窄结论：product-form face 上，ordinal closure 足以控制局部 mixed dynamics。
- 解读：subgame 的 product structure 让 outside action 的损失能统一进入 Fenchel-gap drift。

### 结果 3：三人反例分离 preferential 与 dynamic stability

- 设置：显式 $2\times2\times2$ game；entropic FTRL / replicator dynamics；$H$ 是唯一 proper club。
- 结果：$\operatorname{span}(H)$ 不稳定，且 escape 从 mixed interior 发生。
- 证据定位：Section 5.2，Proposition 2、Figure 1a，p. 7；Remarks G.4–G.5。
- 对照是否可比：这是存在性反例，足以否定一般蕴含，不提供失败频率。
- 支持的最窄结论：在一般 non-product pure-profile sets 这一类中，club 不是保证 span 稳定的充分条件；Proposition 2 给出一个 $2\times2\times2$ 反例。
- 解读：ordinal directions 忽略的 payoff magnitude 会改变多个玩家的相对运动时间尺度与 aggregate drift。

### 结果 4：leaklessness 为一般 span 恢复充分条件

- 设置：arbitrary $H\subseteq A$；strategy flow 使用 strictly leakless；replicator 使用 leakless + club。
- 结果：前者推出 strategy-flow attractor，后者推出 replicator attractor。
- 证据定位：Section 5.3，Theorems 4–5，p. 8。
- 对照是否可比：Theorem 5 的放宽依赖 entropy / replicator 的特殊结构。
- 支持的最窄结论：aggregate outside payoff drift 在 span 上具有适当符号时，可构造局部 Lyapunov energy。
- 解读：leaklessness 把“每条偏离方向”提升为“所有玩家朝同一 outside profile 的合计收益”，补充了纯序数图缺失的幅度信息。

### 定理口径审计

| 维度 | 记录 |
| --- | --- |
| 理论对象 | 有限 normal-form game、pure-profile preference graph、mixed-strategy FTRL |
| regularizer | decomposable、内部光滑、strongly convex；部分 flow 结论另需 steepness 与正则性 |
| 时间口径 | continuous time |
| 稳定性对象 | set-valued stable / attracting / asymptotically stable sets 与 attractors |
| ties | club 与 s-club 在存在 ties 时不同；若干 iff 结论要求 no ties |
| 正向覆盖 | club subgame；strategy flow 下的 strictly leakless arbitrary span；replicator 下 leakless + club |
| 反例覆盖 | 三人二行动 entropic FTRL，否定 club arbitrary span 的普遍充分性 |
| 复杂度 | 相对显式 payoff table，固定 $H$ 的 leaklessness 检查为多项式 |
| 实证证据 | 无大规模实验；Figure 1 / Figure 4 为解析构造与动力学示意 |
| 未覆盖 | 一般离散时间、stochastic feedback、partial observation、function approximation、大规模 MARL |

- 证据定位：PDF Section 3、Section 4、Section 5，p. 4–8；Definitions 1–5、Propositions 1–3、Theorems 1–5、Corollaries 1–3、Figures 1 / 3 / 4。
- 对照是否可比：各行覆盖的 regularizer、flow 与 ties 假设不同；表格用于限定 theorem scope，不用于把不同定理排列成性能强弱。
- 支持的最窄结论：camera-ready 的形式化结果覆盖有限博弈中的 continuous-time FTRL 与其 strategy flow，不能直接推出一般离散 MARL 系统的稳定性。

## 证据链强度评估

### 强证据

- 本文为纯理论研究，没有 empirical baseline；可比对象是既有定理覆盖的 dynamics、regularizer 与 span 类型。
- 必要条件、subgame equivalence、counterexample 与 leaklessness sufficiency 都以正式定理或命题给出，并附证明。
- Proposition 2 是显式有限游戏反例；一个有效实例即可否定 club 对 arbitrary span 的普遍充分性。
- Theorem 3 与 Theorems 4–5 都给出明确 energy function，结论与 regularizer / dynamics 边界可被逐项核对。
- camera-ready 与 ICML official poster 对“ordinal constraint、general failure、cardinal recovery”三段主线保持一致。

### 中等强度证据

- 从连续时间 attractor 向离散时间算法的迁移依赖 stochastic approximation 条件；论文引言说明了联系，当前定理没有覆盖任意 learning rate。
- weakly acyclic 大型游戏的“典型性”解释依赖论文引用的外部概率结果，本笔记未独立复核该外部定理。
- leaklessness 的算法复杂度相对 normal-form payoff table 为多项式；玩家数增长时，表本身可能指数扩大。

### 需要谨慎的推论

- 论文没有证明 reward scale 或 cardinal realization 是所有 MARL 不稳定性的主要来源。
- strategy-flow attractor 结论不能直接当作 finite-step training convergence guarantee。
- arbitrary span 的充分条件没有形成完整分类；leaky set 仍可能因其他机制成为 attractor。
- ICML Oral 是质量筛选信号，不能替代对附录证明的独立形式化验证。

## OpenReview / 审稿意见吸收

- Page type: metadata-only
- Match confidence: high
- Observed at: 2026-07-16
- Venue status: ICML 2026 accepted；ICML official event page将该 poster 关联为 Oral，OpenReview 搜索元数据标签显示 spotlight。
- Public reviews: 本次可公开检索到的 forum 索引显示稿件元数据与版本信息；未检索到可可靠匹配的 official review 正文。直接页面当前要求 browser challenge。
- Ratings / confidence: 未发现公开评分。
- Reviewer consensus: 无公开 review 内容可据此归纳；不从 Oral 决定反推具体 reviewer 共识。
- Main criticisms: 未发现可引用的公开 reviewer criticism。
- Author response: 未发现可引用的公开 rebuttal。
- 对可信度的影响: 接收与 Oral 提供 venue-level signal；具体可信度仍由定理假设、proof structure、反例与结论边界校准。

## 本地讨论补充

### 1. 讨论收敛点

- 这篇适合归入 reward specification 与 multi-agent learning dynamics 的理论节点。它研究数值 payoff 实现同一排序后是否保留长期稳定性，并未训练 preference model。
- 实际使用时可先用 preference graph 的 club / s-club 排除候选集合，再对 non-product span 计算 leakage；两步分别检查 ordinal 与 cardinal 条件。
- “相同偏好”只固定 unilateral-deviation 的方向。FTRL 仍根据 payoff vector 的具体数值更新，数值实现需要单独审计。

### 2. 修正后的理解

- 摘要中的“dynamically stable skeleton closed under profitable deviations”需要按正文拆开：一般 FTRL stable 对应 s-club；strategy-flow attracting 对应 club；无 ties 时二者重合。
- Theorem 3 对 non-steep regularizer 也成立；arbitrary span 的 Theorem 4 通过 strategy flow 陈述，覆盖范围更窄。
- counterexample 说明 attractor 可能不等于任何 pure-profile span，因此 span-based characterization 本身只覆盖一类候选几何结构。

### 3. 后续复验指标

- 对同一 preference graph 采样不同 payoff magnitudes，记录 attractor、basin 与 escape time 是否变化。
- 在 discrete-time mirror descent / multiplicative weights 中扫描 step size、noise 与 asynchronous update，检查连续时间结论的稳健范围。
- 对候选 $H$ 同时记录 club、s-club、leakless、strictly leakless 与 product-form 状态。
- 报告 leakage margin，而非只报告符号；接近零的 margin 对数值误差和估计噪声更敏感。
- 在 MARL 环境中明确 normal-form reduction 的 state、action 与 payoff table 如何获得，避免把局部 stage game 结论直接扩展到长期 Markov game。

## 主要启发

- preference graph 是低成本必要条件工具；它在 subgame 上形成完整判据，在一般 span 上需要 cardinal augmentation。
- reward design 需要同时校验排序方向与收益差幅度。维持相同偏好排序仍可能改变多智能体学习的长期集合行为。
- arbitrary span 的稳定性由 aggregate unilateral gains 控制；逐边检查缺少玩家间同时变化形成的 mixed-interior drift。
- energy function 的选择与 regularizer geometry 绑定：Fenchel gap 处理 club subgame，generalized Fenchel coupling 处理 strict leaklessness，outside mass 利用 replicator 的 entropy structure。
- 结论对象应从单点 equilibrium 扩展到 set-valued attractor，同时保留 attractor 可能超出 pure-profile span 的可能性。

## 局限

1. 理论限定于有限 normal-form game；显式 payoff table 会随玩家与行动数指数增长。
2. 主要结果是 continuous-time FTRL / strategy flow；一般 finite-step、stochastic 或 asynchronous learning 尚未覆盖。
3. Theorem 4 的 arbitrary-span 结果需要 strictly leakless 与 strategy-flow 条件；较弱的 leakless + club 只在 replicator dynamics 下得到保证。
4. leaklessness 是充分条件，论文没有给出 arbitrary-span attractor 的完整必要且充分条件。
5. ties 会改变 club / s-club 关系，并使部分 equivalence 失效。
6. 论文没有大规模 MARL、reward-model training 或真实平台实验，面向 AI safety / reward specification 的意义属于理论启发。
7. counterexample 证明一般蕴含失败，却不说明这种不稳定在某个自然 game distribution 下的发生率。
8. 当前未取得公开 reviewer 正文与 rating，无法吸收针对 proof assumptions 或 exposition 的具体外部质疑。

## 跨论文关系

- 与已有论文的作者或机构关系：三位作者在本地首次收录，暂无作者重叠；Omar Abbadi 的 UM6P–UGA cotutelle 与两位共同导师形成论文内部跨机构桥接。
- 与 [SocioHack](/papers/2606.04075-llms-hack-rewards-and-society/)：SocioHack 用模拟制度环境展示优化器会利用数值规则与制度意图之间的缺口；本论文从有限多智能体博弈给出更窄的形式化结论，即同一 ordinal preference specification 的不同 cardinal payoff realization 可能产生不同长期稳定集合。两者共同提示 reward audit 需要超出排序或表面合规。
- 与 [Credit Assignment Survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/)：survey 讨论团队 reward 如何分配到 agent / action / message；本论文把 payoff function 视为已给定，研究所有玩家运行 no-regret learning 后的 asymptotic set。两者分别位于 reward assignment 与 game-dynamics 两个层级。
- 与已有论文的方法或系统关系：暂无直接方法复用。论文的 FTRL / replicator 理论与本地 LLM RL 条目中的 finite-step policy optimization 口径不同，相关性主要来自 reward specification 与 multi-agent interaction。

## Reference Intake Brief

### Target

- Intended target system: 新增 ICML 2026 理论论文笔记。
- Existing related assets: [SocioHack](/papers/2606.04075-llms-hack-rewards-and-society/)；[Credit Assignment Survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/)；[Paper Archive Index](/archive/)。
- Proposed form: 新建独立 Markdown 文档，并更新作者档案、索引和主题标签。

### Reusable Elements

1. preference graph、club / s-club、span / skeleton 的四层术语体系。
2. subgame product structure 与 arbitrary span 的正反边界。
3. aggregate leakage 及其 generalized Fenchel-coupling energy。
4. 面向 reward specification 的 ordinal / cardinal 双层审计框架。

### Risks

- Copyright/over-copying: 仅保留公式、定理条件和短语级术语，主体为中文重建与本地分析；不复制论文长段落。
- Unsourced or unverifiable claims: Oral、版本、机构和定理均链接官方来源；discrete-time / MARL 迁移明确标为边界。
- Tone/brand mismatch: 保持理论对象、假设和结论逐层对应，避免把 game-theoretic result 扩写为通用工程保证。
- Safety/compliance issues: 论文不含可直接滥用的操作流程。
- Overlap with existing assets: 现有 reward-hacking / credit-assignment 笔记没有覆盖 preference graph 与 FTRL attractor theory，独立建档有增量价值。

### Skipped

| Material | Reason |
| --- | --- |
| 公开 reviewer comments | OpenReview forum 当前要求 browser challenge；搜索索引未暴露可可靠匹配的 official review 正文。 |
| Ratings / rebuttal | 未发现公开、可核验内容。 |
| arXiv source | 截至访问日未发现公开 arXiv 版本。 |
| 代码复现 | 未发现官方代码；贡献为理论定理与显式反例。 |
| 本地 PDF / poster 副本 | 官方 URL 稳定可引用；本次没有引入二进制资产。 |

### Recommendation

Decision: merge

Why: 论文给出清晰的必要条件、subgame 完整刻画、一般反例与 cardinal 恢复条件，能补充本地 archive 在 multi-agent learning dynamics 与 reward specification 理论上的空白；假设与迁移边界可以明确隔离。
