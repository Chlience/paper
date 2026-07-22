# What Preferences Can—and Cannot—Predict in Multi-Agent Online Learning 论文笔记

First-Archived-At: 2026-07-16 16:02
Updated-At: 2026-07-22 16:49
Review-Status: pending

## Source

- Workflow version: v2.1
- Material type: research-paper
- Analysis modules: theory
- Canonical source: [OpenReview forum](https://openreview.net/forum?id=5W30WwL8wt)
- Title: What Preferences Can—and Cannot—Predict in Multi-Agent Online Learning
- Authors: [Omar Abbadi](/authors/omar-abbadi/), [Rida Laraki](/authors/rida-laraki/), [Panayotis Mertikopoulos](/authors/panayotis-mertikopoulos/)
- Responsible organization: Moroccan Center for Game Theory, UM6P；Univ. Grenoble Alpes, CNRS, Inria, Grenoble INP, LIG
- arXiv: 截至 2026-07-22 未发现公开 arXiv 版本。
- PDF: [ICML 2026 camera-ready PDF](https://openreview.net/pdf/99ac87aeab1da5d4497587ae8832ee449cbcb8b4.pdf)
- Originally submitted PDF: [OpenReview attachment](https://openreview.net/attachment?id=5W30WwL8wt&name=originally_submitted_PDF)
- Code/Project: 未发现官方代码仓库；论文贡献为有限博弈与连续时间学习动力学的理论结果。
- OpenReview / Review page: [OpenReview](https://openreview.net/forum?id=5W30WwL8wt)
- Conference page: [ICML 2026 poster](https://icml.cc/virtual/2026/poster/66240)；该页面关联 [Oral 71186](https://icml.cc/virtual/2026/oral/71186)
- Poster: [ICML 2026 official poster](https://icml.cc/media/PosterPDFs/ICML%202026/66240.png)
- Submitted: OpenReview Note created 2026-01-24；first made public 2026-04-30。
- Published / updated: OpenReview published 2026-04-30, last modified 2026-06-24；Proceedings of the 43rd International Conference on Machine Learning, PMLR 306, 2026
- Current version read: ICML 2026 camera-ready，PMLR 306
- Version / revision read: OpenReview camera-ready PDF hash 99ac87aeab1da5d4497587ae8832ee449cbcb8b4
- Accessed: 2026-07-22
- License: CC BY 4.0
- Key figure decision: include
- Review status: page-type=official-review; match-confidence=high; observed-at=2026-07-22; venue-status=ICML 2026 spotlight
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

论文证明有限博弈的序数偏好图对连续时间 FTRL 的稳定集合施加必要约束；当候选区域来自子博弈时，对有利单边偏离闭合的纯策略集合（closed under better replies, club）足以保证其张成区域（span）渐近稳定，并在没有收益平局时构成等价判据；当候选区域来自一般纯策略集合时，三人反例展示了相同偏好方向下的动态不稳定，基于收益差幅度的聚合偏离约束（leaklessness）为一般张成区域提供可检验的吸引性充分条件。

直观地说，偏好图告诉我们“玩家想往哪个方向改”，具体收益差告诉我们“这个方向的推动有多强”。候选区域具有完整的子博弈结构时，方向信息已经足以判断稳定性；候选区域由若干不规则边界拼成时，还要比较各方向的推动强度。

## 阅读目标与判断边界

分析沿着四个问题展开：

1. 偏好图能够对 FTRL 长期稳定集合给出哪些必要条件。
2. 为什么子博弈的乘积结构能让偏好闭合推出动态稳定。
3. 一般纯策略集合缺少乘积结构时，聚合偏离不增条件（leaklessness）如何补充收益差大小。
4. 这些结论对多智能体奖励设定有什么含义，又能迁移到哪些学习系统。

判断边界：

- 论文研究有限标准式博弈与连续时间 FTRL；离散时间、有限步长、采样噪声和函数逼近只在动机层面被关联。
- 核心证据是定理、附录证明和显式构造的 $2\times2\times2$ 反例，没有大规模多智能体强化学习（MARL）实验。
- 策略流结论依赖陡峭型正则化函数与额外边界正则性；负熵正则化对应复制子动力学。欧氏正则化等非陡峭型方法无法直接继承全部策略流结论。
- leaklessness 为一般张成区域给出充分条件，论文仍未完成任意吸引子的必要且充分分类。
- 这里采用会议定稿版的定理编号；最初投稿版本的编号有所移动。

证据写法：

- 论文事实：正文定义、定理、反例、图和附录证明直接给出的内容。
- 作者主张：摘要、引言、结论和海报对理论意义的解释。
- 本地分析：对证明机制、奖励设定含义和迁移边界的重建。

## 论文脉络

### 1. 研究问题、背景和价值

先用一个简化例子：两台机器人共用一条狭窄通道。每台机器人都可以选择“前进”或“等待”，两台机器人的选择合在一起便形成一个纯策略组合（pure action profile）。安全通过可以获得正收益，相撞或等待过久会产生负收益。

固定第二台机器人的行动，只让第一台改变行动，这叫作单边偏离（unilateral deviation）。如果改变后第一台的收益更高，就从原来的纯策略组合向新的组合画一条箭头。对所有玩家、所有组合重复这一步，得到偏好图（preference graph）。这张图保留“变好、持平、变差”的方向，也就是序数信息；具体改善了 0.1 还是 100，则属于收益差的大小信息。

这里容易产生一个直觉：只要所有箭头方向相同，多智能体学习就会走向相同的长期结果。FTRL 的更新速度还会读取具体收益差，因此不同方向的相对推动强度也会改变轨迹。论文研究的核心问题由此出现：偏好图在什么条件下足以预测长期稳定区域？什么时候还需要收益差的数值？

长期结果也不一定收敛到一个纳什均衡（Nash equilibrium）。纳什均衡指任何单个玩家都无法通过独自换行动来提高收益。无遗憾学习只要求：运行足够久以后，玩家的累计收益与“事后看来最好的固定行动”之间的平均差距趋近于零。这个要求允许策略持续循环，所以论文把研究对象扩展到稳定集合和吸引子。

这个问题直接对应奖励设定（reward specification）：设计者经常先确定预期行为排序，再选择数值奖励实现该排序。多组数值奖励可以产生同一张偏好图；论文说明，长期学习行为仍可能随奖励差值变化。

证据定位：PDF Abstract、Section 1，pp. 1–2；Figure 1；ICML official poster。

### 2. 已有解决方案与不足

已有结果已经覆盖若干局部或特殊结构：

1. 严格纳什均衡与正则化学习的局部渐近稳定点相对应。这里的“严格”表示任何单边改动都会让改动者的收益严格下降。
2. 偏好图的终端强连通分量或汇均衡（sink equilibrium）必须包含在某些复制子动力学（replicator dynamics）的吸引子中。
3. 具有 club 条件的子博弈在复制子动力学或相关演化动力学下具有吸引性。
4. 势博弈（potential game）可以借助一个统一的势函数追踪变化；零和博弈与调和博弈常出现循环或复现。

这些结论留下两个空缺：

- “吸引子必须包含某种图结构”仍无法说明该图结构张成的混合策略区域本身是否稳定。
- 复制子动力学的面不变性与熵几何支撑了部分已有证明；更广的正则化函数和缺少乘积结构的张成区域需要新的证明工具。

论文依次建立必要条件、子博弈上的充分条件、一般集合上的反例，以及保留收益差大小的修复条件。

证据定位：PDF Section 1、Section 2、Section 5；Related Work，p. 13。

### 3. 作者可能的思考路径

本地分析可以把论文的推导路线还原为四个连续问题：

1. 如果候选稳定集合中存在一条通往外部的有利偏离，玩家就会获得持续离开的动力。这样的集合能否保持稳定？
2. 如果候选集合是一个完整子博弈，每位玩家的允许行动都能独立组合，偏好闭合能否保证所有外部行动都受到抑制？
3. 如果候选集合缺少某些行动组合，纯策略节点上的箭头能否继续控制混合策略内部的运动？三人二行动反例给出了否定答案。
4. 纯方向信息不够时，可以把所有玩家朝同一个外部组合偏离的收益变化加总。这个量就是聚合偏离强度（leakage），它能够进入 FTRL 能量函数的导数。

四步都在判断同一件事：候选张成区域附近的策略更新，是否持续把外部概率压低并把轨迹带回区域内部。

### 4. 基本对象：偏好图、张成区域与骨架

设玩家集合为 $N$，玩家 $i$ 的可选行动集合为 $A_i$。所有玩家各选一个行动后，得到纯策略组合空间

$$
A=\prod_{i\in N}A_i,
$$

其中乘积符号表示把每位玩家的一个行动组合起来。两名玩家各有两个行动时，$A$ 一共有四个纯策略组合。

玩家也可以随机选择行动。$\Delta(A_i)$ 表示玩家 $i$ 在自己行动集合上的概率分布，所有玩家的混合策略空间为

$$
X=\prod_{i\in N}\Delta(A_i).
$$

例如，第一台机器人以 70% 概率前进、30% 概率等待，就是一个混合策略。标准式博弈假设各玩家独立随机化；把每个人的分布合起来，就得到一个混合策略组合 $x\in X$。

现在比较两个纯策略组合 $\alpha$ 和 $\beta$。如果它们只在玩家 $i$ 的行动上不同，并且玩家 $i$ 在 $\beta$ 中的收益不低于在 $\alpha$ 中的收益，即

$$
u_i(\alpha)\leq u_i(\beta),
$$

偏好图中就有一条边 $\alpha\to\beta$。等号表示平局，此时两个方向都会有边。图本身只记录收益差的符号；$u_i(\beta)-u_i(\alpha)$ 的具体大小称为基数信息（cardinal information）。

接下来选取一组候选纯策略组合 $H\subseteq A$。论文会反复使用以下四个概念：

- 对有利回应闭合（closed under better replies, club）：从 $H$ 中任一点出发，只要某位玩家单边改动后收益不下降，改动后的组合仍在 $H$ 中。图上看，$H$ 没有指向外部的箭头。
- 对严格有利回应闭合（s-club）：只禁止严格提高收益的箭头离开 $H$；由平局形成的箭头可以通往外部。
- 汇均衡：一个非空、强连通且满足 club 的纯策略组合集合。“强连通”表示集合中任意两个节点都能沿有向箭头互相到达。
- 骨架（skeleton）：混合策略集合 $S\subseteq X$ 中包含的纯策略顶点，即 $\operatorname{skl}(S)=S\cap A$。

纯策略集合 $H$ 还会对应一个张成区域（span）：只保留那些不会给 $H$ 外部组合分配正概率的混合策略，形式化写作

$$
\operatorname{span}(H)
=
\{x\in X:\ x_\alpha=0,\ \forall \alpha\notin H\},
\qquad
x_\alpha=\prod_i x_{i,\alpha_i}.
$$

这里 $x_{i,\alpha_i}$ 是玩家 $i$ 选择行动 $\alpha_i$ 的概率，$x_\alpha$ 是所有玩家恰好组成 $\alpha$ 的联合概率。由于玩家独立随机化，联合概率等于各自概率的乘积。

乘积结构是全文最关键的分界。若 $B=\prod_i B_i$ 是一个子博弈，先为每位玩家选定允许行动 $B_i$，再允许这些行动任意交叉组合，便有

$$
\operatorname{span}(B)=\prod_i\Delta(B_i).
$$

这个区域是混合策略空间中的一个完整面（face），也就是把某些行动的概率固定为零后剩下的几何区域。如果两名玩家各有两个行动，而 $H$ 只包含四个组合中的三个，缺失的那个组合会使双方不能同时对某些行动分配正概率；此时 $\operatorname{span}(H)$ 由几个面拼接而成。一个玩家能否混合某个行动会依赖另一玩家赋予正概率的行动，这种耦合正是一般集合更难分析的原因。

证据定位：PDF Section 3.1，Definitions 1–2、Figure 3，p. 4。

### 5. FTRL 与稳定性口径

在线学习过程中，每位玩家给自己的每个行动维护一个累计收益分数。把玩家 $i$ 的全部行动分数记作向量 $y_i$。分数最高的行动看起来最有利，直接始终选择当前最高分行动会产生突变；正则化跟随领先者（Follow-the-Regularized-Leader, FTRL）加入正则化函数 $h_i$，让行动选择保持唯一并控制概率变化的几何形状：

$$
Q_i(y_i)
=
\arg\max_{x_i\in X_i}
\left\{\langle y_i,x_i\rangle-h_i(x_i)\right\},
$$

其中 $x_i\in X_i=\Delta(A_i)$ 是候选混合策略，$\langle y_i,x_i\rangle$ 是按行动概率加权的累计分数，$h_i(x_i)$ 是正则化代价。$Q_i$ 返回两者权衡后的最优分布。

分数随当前对局的预期收益持续增长：

$$
\dot y_i(t)=v_i(x(t)),
\qquad
x_i(t)=Q_i(y_i(t)).
$$

点号表示对时间求导。$v_i(x)$ 是玩家 $i$ 各行动面对其他玩家当前混合策略时的预期收益向量；某个行动当前收益越高，对应分数就增长得越快。第一条式子负责积累经验，第二条式子把经验转成下一刻的行动概率。

论文要求正则化函数可以按行动分解、在概率单纯形内部二阶光滑且强凸。概率单纯形就是“每项概率非负、全部概率之和为 1”形成的几何区域；强凸性保证 $Q_i$ 给出唯一选择。负熵正则化对应复制子动力学：一个行动的概率增长率由它相对平均收益的优势决定。欧氏正则化对应投影型动力学。

两类正则化在边界上的行为不同。负熵属于陡峭型正则化（steep regularizer），接近零概率时梯度发散，由它诱导的策略流会保留当前所在的面；欧氏正则化属于非陡峭型，轨迹可以在有限时间到达边界，也可能随后离开边界。这个区别会影响哪些稳定性定理能够只在策略空间中陈述。

稳定性分三层：

- 稳定（stable）：轨迹从足够接近目标集合的位置出发，之后始终保持接近。它回答“会不会跑远”。
- 吸引（attracting）：轨迹从某个邻域出发，随着时间增长逐渐接近目标集合。它回答“会不会回来”。
- 渐近稳定（asymptotically stable）：同时满足稳定与吸引。
- 吸引子（attractor）：目标集合本身在策略流下保持不变，并且渐近稳定。

论文区分 FTRL 分数动力学与策略流。FTRL 的未来由内部累计分数 $y$ 驱动；对于非陡峭型正则化，同一个策略 $x$ 可能对应多个分数状态，这些状态后续会产生不同轨迹。因此 FTRL 稳定性直接对所有可行的初始分数 $y(0)$ 作判断。

策略流（strategy flow）则直接在混合策略空间 $X$ 上描述 $x$ 如何变化，并把各个面的向量场接在一起。要让当前位置唯一决定未来方向，选择映射还需要额外的边界正则性；正文的部分策略流定理因此限定于陡峭型正则化。对完整博弈的陡峭型正则化，有限分数映射到内部策略 $X^\circ$，也就是每个行动概率都严格为正的区域。

证据定位：PDF Section 3.2，FTRL / SD definitions，pp. 4–5；Appendix C（attractor）、Appendix D（regularizer）、Appendix E（strategy dynamics）。

### 6. 必要条件：动态稳定迫使偏好闭合

论文给出两种强度不同的必要条件：

1. Proposition 1：若 $S$ 对策略流具有吸引性，则其骨架是 club。
2. Theorem 1：若 $S$ 在一般 FTRL 分数动力学下稳定，则其骨架是 s-club。

先看第二条为什么成立。假设骨架中有纯策略组合 $\alpha$，玩家 $i$ 单独换行动后到达骨架外的 $\beta$，而且

$$
u_i(\beta)>u_i(\alpha).
$$

从 $\alpha$ 附近开始时，其他玩家的策略在一小段时间内仍接近 $\alpha_{-i}$。收益函数连续，所以玩家 $i$ 的外部行动会在这段时间内保持分数增长优势。FTRL 随后提高该行动的概率，轨迹便离开原集合的任意足够小邻域。这与稳定性“从近处出发始终保持接近”的要求冲突。因此，稳定集合的骨架不能有严格获益的外向偏离，也就是必须满足 s-club。

平局解释了 Proposition 1 与 Theorem 1 的差别。若外向偏离收益相同，玩家没有严格动力离开，稳定性仍可能成立；同时也没有严格动力把邻近的外部轨迹拉回，吸引性会失败。策略流的吸引集合因此需要更强的 club 条件，把收益不下降的外向边也排除。

没有收益平局时，“收益不下降”与“收益严格上升”在两条不同纯策略组合之间等价，club 和 s-club 随之重合。

Theorem 1 还要覆盖非陡峭型正则化，此时策略轨迹可以接触或离开边界，无法直接依赖面的不变性。作者改在分数空间中选择初始状态：让获益偏离的玩家拥有足够时间移出稳定邻域，同时让其他玩家在这段时间内近似不动。这个构造把上面的直觉扩展到一般 FTRL 分数动力学。

证据定位：PDF Section 4，Proposition 1、Theorem 1，p. 5；proofs in Appendix F。

### 7. 连通性约束吸引子的几何形状

偏好图中的纯策略节点有时会形成循环：沿箭头从任意节点出发，都能到达集合中的其他节点。这样的集合称为强连通集合。Theorem 2 说明：若策略流吸引子 $\mathcal A$ 包含强连通纯策略集合 $H$，则

$$
\operatorname{span}(H)\subseteq\mathcal A.
$$

这条式子说，吸引子一旦包含循环中的全部纯策略顶点，也必须包含这些顶点能够张成的混合策略。它不能只收纳边界顶点，同时排除顶点之间的混合区域。链传递性（chain transitivity）允许用一串真实轨迹片段和任意小的连接误差在集合内移动；证明借它把图上的可达关系转成动力学中的近似轨迹，再按混合策略空间的面逐层归纳。

如果整张偏好图强连通，任何非空且没有外向边的骨架都会包含全部纯策略节点；这些节点张成整个策略空间 $X$。结合必要条件与 Theorem 2，策略流只能把整个 $X$ 作为吸引子，因此不存在真子集吸引子（proper attractor）。

Theorem 2 给出吸引子的最小几何范围。它只说明吸引子必须包含什么；$\operatorname{span}(H)$ 自身能否稳定，还要继续检查。

证据定位：PDF Section 4，Theorem 2，pp. 5–6；正文 proof sketch 与相应附录。

### 8. 子博弈：偏好信息足以刻画稳定性

现在回到结构最规整的候选区域。子博弈 $B=\prod_iB_i$ 为每位玩家规定一组内部行动，并包含这些行动的所有交叉组合。若 $B$ 满足 club，从任何内部纯策略组合单边切到外部行动都会严格降低偏离者的收益。有限博弈只有有限个比较，因此这些收益损失可以统一压到一个严格负的上界。

乘积结构使这个纯策略结论能够延伸到混合策略。其他玩家在各自的 $B_i$ 内如何混合，产生的每个交叉组合仍属于 $B$；外部行动的预期收益劣势就是各个纯策略劣势的加权平均。Theorem 3 因而得到：若子博弈 $B$ 是 club，则 $\operatorname{span}(B)$ 在 FTRL 下渐近稳定。

作者用 Fenchel 间隙记录“允许使用外部行动能多获得多少正则化目标值”。记 $h^\ast(y)$ 为在全部行动中优化后的正则化分数，$h_B^\ast(y)$ 为只允许 $B$ 中行动时的最优值，两者之差为

$$
F_B(y)=h^\ast(y)-h_B^\ast(y).
$$

$F_B$ 始终非负，因为全行动优化至少和受限优化一样好。当 FTRL 选择已经落在 $\operatorname{span}(B)$ 内时，外部行动没有提供额外最优值，间隙等于零。club 提供每个外部行动的收益劣势，乘积结构保证这些劣势在内部混合时继续成立，所以沿轨迹的 $F_B$ 会随外部概率质量下降。

这个量直接使用内部分数 $y$，因此同一个策略 $x$ 对应不同分数状态时仍能区分未来演化。它由此覆盖陡峭型与非陡峭型正则化，扩展了依赖 Bregman 散度（一种由凸函数生成的非对称距离）或面不变性的已有证明路线。

进一步得到：

- Corollary 1：没有收益平局时，$B$ 为 club 当且仅当 $\operatorname{span}(B)$ 在 FTRL 下渐近稳定。必要条件来自 Theorem 1，充分条件来自 Theorem 3。
- Corollary 2：在论文的策略流条件下，任意子博弈 $B$ 为 club 当且仅当它的张成区域是策略流吸引子。
- Corollary 3：在弱无环（weakly acyclic）且没有收益平局的博弈中，从任意纯策略组合都存在一条严格改善路径通往某个纯纳什均衡；最小策略流吸引子恰好是严格纳什均衡。

证据定位：PDF Section 5.1，Theorem 3、Corollaries 1–3，pp. 6–7；Fenchel-gap proof in Appendix G。

### 9. 一般张成区域：偏好闭合仍可能动态不稳定

子博弈结论依赖完整的交叉组合。一般纯策略集合 $H$ 可能缺少若干交叉组合，此时一个玩家能否混合某个行动会受到其他玩家支持集的限制。纯策略节点上的每条箭头都可以留在 $H$ 内，混合区域中的多个更新方向仍可能共同把轨迹带向外部。

Proposition 2 构造了一个 $2\times2\times2$ 三人博弈。每位玩家有两个行动，所以八个纯策略组合可以画成立方体的八个顶点。红色集合 $H$ 是唯一的真 club，它的张成区域由立方体的上、右、后三个面拼接而成；在负熵 FTRL 对应的复制子动力学下，这个区域仍然不稳定。

![Figure 1：偏好图闭合与 FTRL 动力学可以失配，也可以对齐](/images/papers/2026-04-30-preferences-multi-agent-online-learning/fig-1-preference-dynamics.png)

Figure 1：左侧给出 club span 附近轨迹向外逃逸的三人反例；右侧的六边循环同时具有偏好闭合和动力学吸引性。Image Source: [OpenReview camera-ready PDF, Figure 1, p. 2](https://openreview.net/pdf/99ac87aeab1da5d4497587ae8832ee449cbcb8b4.pdf), CC BY 4.0；本地图片为 PDF crop。

反例从上表面中心附近开始。前两位玩家在这里接近无差异状态，策略变化很慢；第三位玩家朝下表面的外部行动具有正收益差，因而先提高该行动的概率。等前两位玩家开始产生把轨迹带向另一个内部面的作用时，轨迹已经离开给定的小邻域。逃离发生在混合策略内部，逐个检查低维边界也看不到这条路径。

club 只检查每个纯策略顶点上的单步方向。混合策略会对多个纯策略收益取平均，各玩家更新的相对速度由收益差大小决定。一般 $H$ 缺少乘积结构时，逐边的序数闭合无法控制这些同时发生的平均运动；同一偏好图的不同数值收益实现便可能产生不同稳定性。

该反例也否定了 Biggar 与 Papadimitriou 关于复制子动力学局部源点的相关猜想，并说明最小吸引子可能无法表示为任何纯策略集合的张成区域。

证据定位：PDF Section 5.2，Proposition 2、Figure 1a，p. 7；Remarks G.4–G.5。

### 10. 聚合偏离不增条件：用收益差大小恢复一般张成区域的吸引性

反例缺少的关键信息是多个收益差的合计作用。为此，作者固定一个外部纯策略组合 $\alpha\notin H$，让每位玩家分别考虑“其他人维持当前混合策略 $x_{-i}$，只有我切换到 $\alpha_i$”。玩家 $i$ 的收益变化是

$$
u_i(\alpha_i,x_{-i})-u_i(x).
$$

第一项是单边切换后的预期收益，第二项是当前预期收益。正值表示该玩家受到朝 $\alpha_i$ 移动的推动。把所有玩家朝同一个外部组合 $\alpha$ 的收益变化相加，得到聚合偏离强度（aggregate leakage）：

$$
\ell_\alpha(x)
=
\sum_{i\in N}
\left[
u_i(\alpha_i,x_{-i})-u_i(x)
\right].
$$

用一个本地数值例说明：三位玩家朝 $\alpha$ 各自偏离的收益变化为 $+2$、$-1$ 和 $-3$ 时，聚合偏离强度为 $-2$。第一位玩家虽然想朝自己的 $\alpha_i$ 移动，另外两人的反向作用更强，三者共同形成 $\alpha$ 的概率在这一时刻下降。若三项改为 $+2$、$+1$ 和 $-0.5$，总和为 $+2.5$，外部组合的概率在这一时刻增长。

这个求和在复制子动力学中有直接含义。$x_\alpha=\prod_i x_{i,\alpha_i}$ 是所有玩家共同形成外部组合 $\alpha$ 的概率；当 $x_\alpha>0$ 时，

$$
\frac{d}{dt}\log x_\alpha
=
\sum_i\frac{\dot x_{i,\alpha_i}}{x_{i,\alpha_i}}
=
\ell_\alpha(x).
$$

乘积的对数导数等于各项对数导数之和，而复制子动力学中每一项正好是该行动相对玩家平均收益的优势。因此，$\ell_\alpha(x)$ 就是外部联合组合概率的瞬时相对增长率。

论文据此定义聚合偏离不增条件（leaklessness）。若对每个外部组合 $\alpha\notin H$ 和每个内部纯策略组合 $\beta\in H$ 都有

$$
\ell_\alpha(\beta)\leq0.
$$

则称 $H$ 为 leakless。收益的多线性保证：在 $H$ 张成区域内混合时，$\ell_\alpha(x)$ 是这些纯策略值的加权平均，所以仍然不大于零。strictly leakless 要求所有比较都严格小于零，并在有限集合上形成统一的负余量。

leaklessness 使用了收益差的具体数值。同一张偏好图可以对应不同的 $\ell_\alpha$，因此也可能通过或无法通过这项检查。

Proposition 3 给出蕴含链：

$$
\text{leakless}\Longrightarrow\text{s-club},
\qquad
\text{strictly leakless}\Longrightarrow\text{club}.
$$

当 $H$ 只有一个纯策略组合时，这些条件分别对应纯纳什均衡与严格纯纳什均衡的集合化形式。对固定 $H$，直接检查需要遍历玩家、内部组合与外部组合，成本为

$$
O\!\left(|N|\,|H|\,|A\setminus H|\right),
$$

构造聚合偏离图后，可以在 $O(|N||A|^2)$ 时间内寻找 leakless 集合。这里的“多项式时间”以已经完整列出的标准式收益表为输入；玩家数增加时，收益表本身仍可能指数增长。

证据定位：PDF Section 5.3，Definition 5、Proposition 3，pp. 7–8。

### 11. 聚合偏离不增条件对应的两个正向定理

要把“外部组合受到抑制”转成吸引子结论，需要一个沿轨迹持续下降的标量。这样的标量通常称为李雅普诺夫函数：它把高维策略状态压缩成一个非负数；只要离开目标集合时该数持续下降，轨迹就会被限制并逐渐靠近目标。

对一般陡峭型正则化，纯策略组合 $\alpha$ 与当前分数 $y$ 之间的 Fenchel 耦合为

$$
F_h(\alpha,y)=h(\alpha)+h^\ast(y)-\langle y,\alpha\rangle.
$$

Fenchel–Young 不等式保证它非负。后续证明只使用两个直观性质：当前分数越支持 $\alpha$，这个间隙越小；取指数后的 $\exp\{-F_h(\alpha,y)\}$ 便越大，可以看作靠近 $\alpha$ 的权重。把所有外部组合的权重加起来，得到

$$
\bar F_H(y)
=
\sum_{\alpha\notin H}
\exp\{-F_h(\alpha,y)\},
$$

它衡量分数状态对全部外部组合的总体支持程度。沿轨迹求导后，每个外部项的主要变化率由 $\ell_\alpha(x)$ 控制。strict leaklessness 提供统一的严格负余量，连续性再把这个负余量从张成区域延伸到附近。Theorem 4 因而证明：若 $H$ strictly leakless，则 $\operatorname{span}(H)$ 是满足论文正则性条件的策略流吸引子。

负熵正则化给出更具体的量。此时纯策略 $\alpha$ 的 Fenchel 权重等于联合概率 $x_\alpha$，所以外部能量可以直接写成

$$
\bar W_H(x)=\sum_{\alpha\notin H}x_\alpha.
$$

这就是一次联合采样落在 $H$ 外部的总概率。leaklessness 使内部附近的外部概率在一阶上不增长；当一阶项恰好为零时，club 提供严格的回流作用；不同外部组合之间的相互作用只留下随 $\bar W_H^2$ 缩小的二阶项。Theorem 5 得到：若 $H$ 同时 leakless 且为 club，则 $\operatorname{span}(H)$ 是复制子动力学的吸引子。

Theorem 5 使用了复制子方程与概率乘积的精确关系，因此条件可以从 strictly leakless 放宽为 leakless 加 club。一般正则化缺少这个外部概率公式，Theorem 4 继续需要严格负余量。

证据定位：PDF Section 5.3，Theorems 4–5、Figure 4，p. 8；相应附录证明。

### 12. 结论链条

把所有结果放在一起，可以按候选集合的形状和动力学类型读取：

| 想判断的对象 | 可检查条件 | 论文给出的结论 | 条件发挥的作用 |
| --- | --- | --- | --- |
| 任意 FTRL 稳定集合 $S$ | 查看骨架是否为 s-club | s-club 是必要条件 | 排除严格获益的外向偏离 |
| 任意策略流吸引集合 $S$ | 查看骨架是否为 club | club 是必要条件 | 同时排除平局形成的外向边 |
| 乘积型子博弈 $B$ | $B$ 为 club | $\operatorname{span}(B)$ 渐近稳定 | 完整交叉组合让纯策略劣势可对混合策略取平均 |
| 一般纯策略集合 $H$ | 只满足 club | 无法普遍保证稳定；三人反例给出失败实例 | 混合内部的相对更新速度仍依赖收益差大小 |
| 一般 $H$、满足条件的策略流 | strictly leakless | $\operatorname{span}(H)$ 是吸引子 | 统一负余量让一般 Fenchel 能量下降 |
| 一般 $H$、复制子动力学 | leakless 且为 club | $\operatorname{span}(H)$ 是吸引子 | 聚合偏离控制一阶外部概率，club 补充严格回流 |

因此可以先用偏好图做低成本筛选：骨架存在外向有利边时，候选集合直接被排除。候选集合是乘积型子博弈时，club 已经能够给出正向保证。候选集合缺少乘积结构时，还要读取收益差大小并检查聚合偏离；最终能使用哪条充分条件，由正则化函数和动力学类型决定。

## 关键定理

### 结果 1：稳定性给出可计算的序数必要条件

- 设置：有限标准式博弈；正则化函数可分解、内部光滑且强凸；一般 FTRL 稳定性与陡峭型正则化下的策略流分别处理。
- 假设：FTRL 使用连续时间累计收益分数。策略流结论还需要 Assumption 1：$s_i=1/\theta_i''$ 能够在边界以零延拓为全局利普希茨函数，即输入变化较小时，输出变化具有统一上界；这项条件带来陡峭性和面不变性。
- 结果：FTRL 稳定集合的骨架必为 s-club；策略流吸引集合的骨架必为 club。
- 证据定位：Section 4，Proposition 1、Theorem 1，p. 5。
- 适用域：前者覆盖论文正则化函数类下的 FTRL 分数动力学；后者覆盖满足 Assumption 1 的策略流。
- 对照是否可比：两个结论采用不同的动力学与稳定性前提；存在收益平局时，两者不能互换。
- 支持的最窄结论：骨架中出现通往外部的严格有利回应时，该集合不可能在 FTRL 下稳定。
- 直观含义：偏好图可以排除含有外向有利边的候选长期结果；通过筛选的集合还需要充分条件来确认稳定。

### 结果 2：club 完整刻画子博弈的张成区域

- 设置：$B=\prod_iB_i$ 为子博弈；FTRL 允许陡峭型与非陡峭型正则化函数。
- 假设：$B$ 具有乘积结构，并对收益不下降的单边偏离闭合；正则化函数满足正文的可分解、内部光滑与强凸条件。
- 结果：club 推出张成区域的渐近稳定性；没有收益平局时，club 也构成必要条件。
- 证据定位：Section 5.1，Theorem 3、Corollaries 1–2，p. 6。
- 适用域：Theorem 3 覆盖单个乘积型面；无平局时的等价结论按 FTRL 口径成立，策略流的等价结论还需要相应边界条件。
- 对照是否可比：两组等价结论分别要求没有收益平局，或限定为满足条件的策略流。
- 支持的最窄结论：在乘积型面上，序数偏好闭合足以控制局部混合策略动力学。
- 直观含义：子博弈包含内部行动的全部交叉组合，外部行动的收益损失可以统一进入 Fenchel 间隙的变化率。

### 结果 3：三人反例区分偏好闭合与动态稳定

- 设置：显式 $2\times2\times2$ 三人博弈；负熵 FTRL 对应的复制子动力学；$H$ 是唯一的真 club。
- 假设：候选 $H$ 是缺少乘积结构的一般纯策略集合，其张成区域由多个面拼接而成。
- 结果：$\operatorname{span}(H)$ 不稳定，且轨迹从混合策略内部逃离。
- 证据定位：Section 5.2，Proposition 2、Figure 1a，p. 7；Remarks G.4–G.5。
- 适用域：该存在性反例否定 club 对一般张成区域的普遍充分性，具体覆盖复制子动力学。
- 对照是否可比：这是存在性反例，足以否定一般蕴含，不提供失败频率。
- 支持的最窄结论：对缺少乘积结构的一般纯策略集合，club 单独不足以保证张成区域稳定；Proposition 2 给出一个 $2\times2\times2$ 反例。
- 直观含义：序数方向忽略了收益差大小，而收益差会改变多个玩家的相对运动速度与合计移动方向。

### 结果 4：聚合偏离不增条件为一般张成区域提供充分条件

- 设置：任意 $H\subseteq A$；一般策略流使用 strictly leakless，复制子动力学使用 leakless 加 club。
- 假设：对所有内部与外部纯策略组合，聚合偏离强度在张成区域上满足相应的非正或严格负条件。
- 结果：前者推出策略流吸引子，后者推出复制子动力学吸引子。
- 证据定位：Section 5.3，Theorems 4–5，p. 8。
- 适用域：Theorem 4 覆盖 Assumption 1 下的陡峭型正则化策略流；Theorem 5 限定于负熵正则化与复制子动力学。
- 对照是否可比：Theorem 5 的条件放宽依赖负熵与复制子方程的特殊结构。
- 支持的最窄结论：外部聚合偏离在张成区域上具有适当符号时，可以构造局部李雅普诺夫函数。
- 直观含义：leaklessness 对所有玩家朝同一外部组合的收益变化求和，补充了纯序数图缺失的幅度信息。

### 定理口径审计

| 维度 | 记录 |
| --- | --- |
| 理论对象 | 有限标准式博弈、纯策略偏好图、混合策略 FTRL |
| 正则化函数 | 可分解、内部光滑、强凸；部分策略流结论还需要陡峭性与边界正则性 |
| 时间口径 | 连续时间 |
| 稳定性对象 | 集合层面的稳定、吸引、渐近稳定与吸引子 |
| 收益平局 | club 与 s-club 在存在平局时不同；若干等价结论要求没有平局 |
| 正向覆盖 | club 子博弈；策略流下 strictly leakless 的一般张成区域；复制子动力学下 leakless 加 club |
| 反例覆盖 | 三人二行动负熵 FTRL，否定 club 对一般张成区域的普遍充分性 |
| 复杂度 | 相对显式收益表，固定 $H$ 的 leaklessness 检查为多项式 |
| 实证证据 | 无大规模实验；Figure 1 与 Figure 4 为解析构造和动力学示意 |
| 未覆盖 | 一般离散时间、随机反馈、部分可观测、函数逼近与大规模 MARL |

- 证据定位：PDF Section 3、Section 4、Section 5，p. 4–8；Definitions 1–5、Propositions 1–3、Theorems 1–5、Corollaries 1–3、Figures 1 / 3 / 4。
- 对照是否可比：各行覆盖的正则化函数、动力学与收益平局假设不同；表格用于限定定理范围，不用于排列性能强弱。
- 支持的最窄结论：会议定稿版的形式化结果覆盖有限博弈中的连续时间 FTRL 及其策略流，不能直接推出一般离散 MARL 系统的稳定性。

## 证据链强度评估

### 强证据

- 这是一项纯理论研究，证据由定理、证明与解析反例构成，实证基线不适用；可比对象是已有定理覆盖的动力学、正则化函数与张成区域类型。
- 必要条件、子博弈等价判据、反例与 leaklessness 充分条件都以正式定理或命题给出，并附证明。
- Proposition 2 是显式有限游戏反例；一个有效实例即可否定 club 对 arbitrary span 的普遍充分性。
- Theorem 3 与 Theorems 4–5 都给出明确的能量函数，结论与正则化函数、动力学边界可被逐项核对。
- 会议定稿版、ICML 官方海报、4 份公开评审与 spotlight 决定都把“序数约束、一般集合上的失败、基数信息恢复”视为论文主线。

### 中等强度证据

- 从连续时间 attractor 向离散时间算法的迁移依赖 stochastic approximation 条件；论文引言说明了联系，当前定理没有覆盖任意 learning rate。
- weakly acyclic 大型游戏的“典型性”解释依赖论文引用的外部概率结果，本笔记未独立复核该外部定理。
- leaklessness 的算法复杂度相对标准式收益表为多项式；玩家数增长时，收益表本身可能指数扩大。

### 需要谨慎的推论

- 论文没有证明 reward scale 或 cardinal realization 是所有 MARL 不稳定性的主要来源。
- strategy-flow attractor 结论不能直接当作 finite-step training convergence guarantee。
- arbitrary span 的充分条件没有形成完整分类；leaky set 仍可能因其他机制成为 attractor。
- ICML spotlight 与正面评审是 venue-level 质量信号；附录证明仍需独立形式化验证来提供更强的 correctness guarantee。

## OpenReview / 审稿意见吸收

- Reviewer consensus: 四位评审都认可问题的基础性、三段理论结构、显式反例与 leaklessness 的概念价值，当前可见的 `overall_recommendation` 均为 5。
- Main criticisms: 保留意见集中在 leaklessness 的条件强度、乘积结构的直观解释、Fenchel 间隙对非陡峭型正则化的作用、展示清晰度与应用桥接。
- Author response: 作者用支持集限制的非耦合性解释 subgame 边界，用 score-space 信息解释 Fenchel gap，并在 camera-ready 增设 Related Work、明确 `proper attractor` 口径；当前版本保留多组轨迹例子。
- 对可信度的影响: 四份 final justification 和 spotlight 决定提供正面外部校准；两份 review 的 confidence 为 2，理论正确性仍以原文假设、附录证明和后续独立验证为准。
- 访问结果：OpenReview API v2 认证请求成功，2026-07-22 可读取 18 条 Note，类型包含 submission、4 份 official review、4 份 rebuttal、acknowledgement、comment 与 decision。
- 决定：`Accept (spotlight)`。Decision Note 将必要性结果、subgame 完整刻画、三人反例与 leaklessness 列为主要贡献，并记录四位评审整体意见积极。
- 评分口径：下表保留 API 当前返回的数字，不补充未在表单中给出的 scale label。评审 1 的 `final_justification` 明确记录其在 rebuttal 后改为 accept；其他三位分别表示维持接收、维持积极意见或支持接收。API 未提供可还原的历史初始分数。

| Review | soundness | presentation | significance | originality | overall_recommendation | confidence |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 3 | 2 | 2 | 3 | 5 | 2 |
| 2 | 3 | 3 | 4 | 3 | 5 | 3 |
| 3 | 3 | 3 | 3 | 3 | 5 | 4 |
| 4 | 4 | 3 | 3 | 3 | 5 | 2 |

### Reviewer consensus

- 四位评审都认可问题的基础性、三段理论结构和显式反例的价值。
- leaklessness 被视为主要概念贡献；它在序数信息不足处引入收益差大小，并为一般张成区域提供可检验的稳定性条件。
- 评审对形式结果的 soundness 没有提出具体反例或证明缺口；两份 review 的 confidence 为 2，因此这一信号仍应与原文假设和附录证明一起阅读。

### Main criticisms

1. `leaklessness` 的条件强度、与 evolutionary stability 等既有概念的关系，以及非平凡 leakless set 的可得性需要更直接的说明。
2. 图结构、张成区域与面的几何、连续时间动力学三层抽象交替较快；评审希望看到结果路线图，以及乘积结构使序数信息充分的直观原因。
3. Theorem 3 使用 Fenchel 间隙处理非陡峭型正则化的关键差异需要展开；评审同时要求明确 `proper attractor` 的定义。
4. 与 MARL、reward design 和 mechanism design 的联系主要停留在动机层，论文尚未提供离散算法、现实环境验证或可执行的 reward-design pipeline。
5. 初稿的 related work 过于分散，图与首次引用距离较远，轨迹可视化和 toy simulation 仍可加强。

### Author response

- 作者用“非耦合的支持集限制”解释 subgame：每位玩家都可在不依赖其他玩家支持集选择的前提下留在该 face。一般 span 含有耦合区域，局部有利偏离会受其他玩家的 cardinal behavior 影响；leaklessness 用 aggregate unilateral gain 约束这类协调问题。
- 对 non-steep regularizer，作者说明 choice map 可把持续变化的 score $y$ 映射到同一 strategy $x$，只使用策略空间中的 Bregman divergence 会丢失这部分动态信息；Fenchel gap 保留 score-space 变化，因而能作为 setwise Lyapunov candidate。
- 对条件强度，作者指出显式标准式收益表下可以用多项式时间查找 leakless 集合，strict leaklessness 是严格纳什均衡的集合化扩展；论文也明确保留了它作为充分条件的地位。
- 对应用性，作者补充了多机器人通行、自动驾驶 reward penalty 和 preference-aligned learning 的例子，同时将 Markov game、离散 FTRL、噪声或 bandit feedback 留为后续工作。
- camera-ready 新增独立 Related Work 附录，并在 Theorem 2 处明确 `proper` 指 strategy space 的真子集；当前版本的 Figures 1、4、5 与 Appendix B 提供了多组 preference graph 和轨迹例子。这些内容回应了展示问题，实际应用与离散算法边界继续保留。

### 对可信度的影响

- 公开审稿往返为论文的问题价值、概念新意和主定理口径提供了正面外部校准，且四份 final justification 都支持接收。
- 评审的主要保留意见聚焦于条件解释、展示与应用桥接，它们支持将结论严格限定在有限标准式博弈的连续时间 FTRL 与策略流。
- Decision Note 包含 11 条自动 reference-correctness 告警；它们指向初稿书目字段的人名或完整性核对，应使用 camera-ready 作为当前阅读版本。

## 本地讨论补充

### 1. 讨论收敛点

- 这篇适合归入奖励设定与多智能体学习动力学的理论节点。它研究多组数值收益实现同一排序时能否保持长期稳定性；偏好模型训练属于另一个研究层级。
- 初次理解可以抓住“方向—形状—强度”三层：偏好图记录单边偏离方向，乘积结构描述候选区域形状，leaklessness 汇总收益差强度。
- 无遗憾保证的范围是长期平均收益差，逐时策略仍可持续循环；稳定集合与吸引子因此是必要的研究对象。
- 在复制子动力学中，当 $x_\alpha>0$ 时，$\ell_\alpha(x)$ 等于外部联合组合概率 $x_\alpha$ 的对数增长率。这个等式把 leaklessness 与“外部概率是否增长”直接连接起来。
- 实际使用时可以先用 club / s-club 排除候选集合，再对缺少乘积结构的张成区域计算聚合偏离；两步分别检查方向信息与收益差大小。

### 2. 修正后的理解

- 摘要中的“dynamically stable skeleton closed under profitable deviations”需要按正文拆开：一般 FTRL 稳定对应 s-club；策略流吸引对应 club；没有收益平局时二者重合。
- Theorem 3 对非陡峭型正则化也成立；一般张成区域的 Theorem 4 通过策略流陈述，覆盖范围更窄。
- 反例说明吸引子可能不等于任何纯策略集合的张成区域，因此基于张成区域的刻画只覆盖一类候选几何结构。

### 3. 冻结其他角色、联合训练与摘要—执行联合优化

把每个角色视为一条策略 $\pi_i$。冻结其他角色 $\pi_{-i}$、只更新 $\pi_i$ 时，其他策略构成固定环境；如果任务分布、环境版本、评估器、采样预算和随机性控制也保持一致，奖励差可以估计“在这些固定搭档下，$\pi_i$ 的条件贡献”。重复训练种子与评估置信区间仍然必要，因为采样波动和优化随机性会影响观测值。这个实验回答单角色归因问题，也只覆盖固定搭档条件。

所有角色同时更新时，联合策略写成

$$
x(t)=\bigl(\pi_1(t),\ldots,\pi_n(t)\bigr).
$$

每位角色看到的收益向量 $v_i(x(t))$ 会随其他策略一起变化。当前回合学到的最佳回应，下一回合可能面对已经改变的搭档；这正是论文研究的耦合学习动力学。多策略可以面向同一个任务联合训练，常见做法是让各策略共享团队奖励，并用各自的价值估计或优势函数分配信用。

共同奖励可以写成 $u_i(x)=R(x)$，所有角色由此形成同收益博弈。激励方向会更加一致，协调仍可能停在次优稳定点。一个简单例子是：两个角色都采用协议 A 时奖励为 6，都采用协议 B 时奖励为 10，一方单独改用 B 时奖励降为 0。从 $(A,A)$ 出发，任何单角色切换都会让团队变差，所以 $(A,A)$ 可以保持稳定；到达全局更优的 $(B,B)$ 需要协调探索或联合更新跨过中间低奖励区域。

从论文的判据看：

- 目标行为集合是乘积型子博弈且满足 club 时，连续时间 FTRL 能够获得渐近稳定保证。
- 目标集合包含角色间耦合约束、缺少完整交叉组合时，club 只完成序数筛选；收益差大小还要满足 strictly leakless，或在复制子动力学下满足 leakless 加 club，才能使用论文的吸引子保证。
- 这些结论约束“靠近目标后会不会离开、附近轨迹会不会回来”。全局任务最优性、探索能否进入目标吸引域和有限步训练速度需要另外验证。

若“compact / action”指 CompactionRL 中的摘要生成与任务执行，两者确实存在联合适应，同时还要区分参数结构：

| 设置 | 参数结构 | 动力学含义 | 主要回答 |
| --- | --- | --- | --- |
| 冻结其他角色，只训练一个角色 | 只有 $\theta_i$ 更新 | 固定搭档下的单策略优化 | 条件贡献与最佳回应 |
| 多个独立策略同时训练 | $\theta_1,\ldots,\theta_n$ 同时更新 | 各策略互相改变学习环境 | 联合适应与系统稳定性 |
| CompactionRL 的摘要与执行 | 同一个 $\theta$ 生成 summary token 和 execution token | 一条条件策略在两个时间阶段产生不同类型动作 | 压缩状态与后续执行的跨阶段信用分配 |

CompactionRL 的摘要先改变后续上下文，执行动作再基于该压缩状态完成任务；它在时间上更接近分层或序贯策略。共享 actor 表示摘要梯度与执行梯度会同时改动同一组参数，所以机制上具有联合适应和梯度干扰。把摘要器与执行器拆成独立参数 $\pi_{\mathrm{compact}}$ 和 $\pi_{\mathrm{action}}$，再用同一个终局奖励同时更新时，系统才更接近两条合作策略的联合训练；由于两者按先摘要、后执行的顺序交互，合适模型是合作型序贯博弈或马尔可夫博弈。

论文的有限标准式博弈假设每位玩家拥有独立行动分布，并研究连续时间 FTRL。共享参数、长程状态转移、终局稀疏奖励与有限步 PPO 超出了直接定理范围，因此这里的联系用于识别稳定性与信用分配风险，不能直接当作 CompactionRL 的收敛证明。

### 4. “稳定性条件”具体保证什么

先指定一个候选长期行为集合 $S$。它可以是一个联合策略，例如 $(B,B)$；也可以是一组允许持续循环或混合的策略。论文中的三个保证分别回答：

- 稳定：从 $S$ 足够近的位置出发，轨迹之后始终保持接近。小扰动不会让系统跑远。
- 吸引：从 $S$ 周围某个邻域出发，轨迹与 $S$ 的距离最终趋近于零。
- 渐近稳定：同时具备稳定与吸引。

这些都是局部或集合层面的动力学性质。它们与另外三个问题分开：

- 最优性：$S$ 的任务奖励是否为全局最高。
- 可达性：训练从当前初始化是否进入 $S$ 的吸引域。
- 效率：有限步、有限样本下需要多少更新才能靠近 $S$。

前面的协调例子中，$(A,A)$ 的奖励为 6，$(B,B)$ 的奖励为 10，而单方切换产生奖励 0。两个点都可能对单边偏离保持稳定。稳定性分析可以说明训练靠近 $(A,A)$ 后可能留在那里，也可以说明靠近 $(B,B)$ 后可能留在那里；全局奖励比较才会选出 $(B,B)$，协调探索决定训练能否从前者转移到后者。

论文的必要条件用于排除候选集合：骨架存在严格获益的外向偏离时，FTRL 稳定性无法成立。充分条件用于确认局部行为：乘积型子博弈满足 club，或一般集合满足相应 leaklessness 条件时，其张成区域具有渐近稳定或吸引子保证。定理没有从所有可能集合中自动选出任务奖励最高者。

### 5. 只有终局奖励时能知道哪些方向

考虑两个角色各有 A、B 两个行动。一次联合轨迹只执行了 $(A,A)$，最终奖励为 1。此时 $(B,A)$ 的奖励可以是 2，也可以是 0；两种收益函数都与已经观察到的数据一致，但前者鼓励角色 1 切换到 B，后者鼓励它留在 A。一个终局标量因此无法唯一确定单边偏离的奖励差

$$
u_i(a_i',x_{-i})-u_i(x).
$$

论文的连续时间方程直接使用精确的期望收益向量 $v_i(x)$，leaklessness 还需要比较每个内部纯策略组合与每个外部组合。只有采样到的终局奖励时，这些量都要经过额外估计。

训练仍然可以进行。令所有策略的共同目标为

$$
J(\theta_1,\ldots,\theta_n)
=
\mathbb E_{\tau\sim\pi_\theta}[R(\tau)].
$$

记录每个角色在轨迹中的行动对数概率后，角色 $i$ 可以用终局奖励估计局部策略梯度：

$$
\nabla_{\theta_i}J
=
\mathbb E\left[
\bigl(R(\tau)-b_i\bigr)
\sum_t\nabla_{\theta_i}
\log\pi_{\theta_i}(a_{i,t}\mid o_{i,t})
\right].
$$

$b_i$ 是与当前动作无关、用于降低方差的基线。终局奖励告诉算法整条轨迹表现如何，对数概率梯度告诉角色哪些已采样动作能够被提高或降低概率。多次同分布采样后，这个估计可以指向“当前联合策略附近，怎样调整 $\theta_i$ 才能提高期望奖励”。它没有恢复所有未尝试行动的精确收益表，方差也可能很高。

四层信息需要分开：

| 信息层级 | 终局奖励提供什么 | 还需要什么 |
| --- | --- | --- |
| 已执行联合轨迹的 $R(\tau)$ | 直接观测 | 多次评估用于估计均值与方差 |
| 每条策略的局部参数梯度 | 配合行动对数概率可以采样估计 | on-policy 数据、基线或 critic |
| 单边反事实奖励差 | 单条轨迹不能直接给出 | 冻结其他策略后重采样、环境模型或中心化 critic |
| 完整偏好图与 leaklessness | 需要覆盖大量内部—外部组合 | 显式收益表或系统性的反事实评估 |

中心化价值模型（centralized critic）可以学习 $Q(s,a_1,\ldots,a_n)$，再比较固定 $a_{-i}$ 时不同 $a_i$ 的估计值；差分奖励（difference reward）、留一法和配对干预也能构造近似的单边贡献。这些方法依赖模型泛化或额外采样，它们产生的是反事实估计。

多个策略同步更新时，某批数据估计的是采样时联合策略 $x_{\mathrm{old}}$ 附近的方向。其他策略更新后，收益面也会移动。小步当前策略采样（on-policy）更新、信赖域约束、策略快照或重要性修正用于控制这项漂移；异步或大步更新会加重方向陈旧问题。

CompactionRL 同样只有最终任务奖励。独立价值模型、广义优势估计（GAE）和跨 segment 位置修正把终局信号转换成摘要 token 与执行 token 的优势估计；这些优势属于学习得到的局部方向。冻结摘要器、冻结执行器或做配对 rollout 才能更直接地估计两类动作的条件贡献。

### 6. 后续复验指标

- 对多角色系统同时运行四种设置：单角色更新、其他角色更新、交替更新、全部角色同步更新；使用同一固定搭档池和共同任务集评估，分别报告条件贡献与联合系统收益。
- 对摘要—执行系统比较冻结摘要器、冻结执行器、独立参数联合训练和共享 actor 联合训练；同时记录最终任务奖励、摘要事实保真度，以及摘要 token 与执行 token 梯度的方向一致性。
- 对同一偏好图采样不同收益差大小，记录吸引子、吸引域与逃离时间是否变化。
- 在离散时间镜像下降（mirror descent）与乘法权重算法中扫描步长、噪声和异步更新，检查连续时间结论的稳健范围。
- 对候选 $H$ 同时记录 club、s-club、leakless、strictly leakless 与乘积型状态。
- 同时报告聚合偏离的符号和余量；接近零的余量对数值误差与估计噪声更敏感。
- 在 MARL 环境中明确如何把状态、行动与收益整理成标准式收益表，避免把局部阶段博弈结论直接扩展到长期马尔可夫博弈。

## 主要启发

- 偏好图是低成本的必要条件工具；它在子博弈上形成完整判据，在一般张成区域上需要补充收益差大小。
- 奖励设计需要同时校验排序方向与收益差幅度。维持相同偏好排序仍可能改变多智能体学习的长期集合行为。
- 冻结其他策略用于估计单策略在固定搭档下的条件贡献；联合训练用于寻找互相适配的系统策略。两类实验回答不同问题，适合分别报告。
- 终局奖励配合行动对数概率足以估计局部策略梯度；完整偏好图、单边反事实收益差和 leaklessness 需要额外干预、收益模型或中心化 critic。
- 一般张成区域的稳定性受到聚合单边收益变化控制；逐边检查无法覆盖多位玩家同时变化形成的混合策略内部移动。
- 能量函数的选择与正则化几何相互对应：Fenchel 间隙处理 club 子博弈，广义 Fenchel 耦合处理 strict leaklessness，外部概率质量利用复制子动力学的负熵结构。
- 结论对象应从单点均衡扩展到集合值吸引子，同时保留吸引子可能超出纯策略张成区域的可能性。

## 局限

1. 理论限定于有限标准式博弈；显式收益表会随玩家与行动数指数增长。
2. 主要结果覆盖连续时间 FTRL 与策略流；一般有限步、随机或异步学习仍待研究。
3. Theorem 4 的一般张成区域结果需要 strictly leakless 与策略流条件；较弱的 leakless 加 club 只在复制子动力学下得到保证。
4. leaklessness 是充分条件，论文尚未给出一般张成区域吸引子的完整必要且充分条件。
5. 收益平局会改变 club 与 s-club 的关系，并使部分等价结论失效。
6. 证据范围没有覆盖大规模 MARL、奖励模型训练或真实平台实验；面向 AI 安全与奖励设定的意义属于理论启发。
7. 反例证明一般蕴含失败，却未说明这种不稳定在某种自然博弈分布下的发生率。
8. 公开评审整体支持接收，其中两位评审的 confidence 为 2；评审信号适合校准贡献价值与展示质量，更强的证明正确性保证仍依赖独立形式化验证。
9. 正文动力学直接使用精确期望收益向量；只观察终局标量奖励时，偏好边、聚合偏离强度和稳定性证书都需要反事实估计，论文没有分析这项统计误差。

## 跨论文关系

- 与已有论文的作者或机构关系：三位作者在本地首次收录，暂无作者重叠；Omar Abbadi 的 UM6P–UGA cotutelle 与两位共同导师形成论文内部跨机构桥接。
- 与 [SocioHack](/papers/2606.04075-llms-hack-rewards-and-society/)：SocioHack 用模拟制度环境展示优化器会利用数值规则与制度意图之间的缺口；本论文从有限多智能体博弈给出更窄的形式化结论，即同一序数偏好设定的不同数值收益实现可能产生不同长期稳定集合。两者共同提示奖励审计需要同时检查排序与收益差大小。
- 与 [Credit Assignment Survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/)：该综述讨论团队奖励如何分配给智能体、行动与消息；本论文把收益函数视为已给定，研究所有玩家运行无遗憾学习后的渐近集合。两者分别位于奖励分配与博弈动力学两个层级。
- 与 [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/)：CompactionRL 让同一个 actor 生成摘要与执行动作，并用最终任务奖励联合训练两个阶段；这属于共享参数策略中的跨阶段信用分配。若摘要器和执行器拆成独立参数并同步更新，系统会更接近共同奖励下的多策略联合学习。其 critic 与 GAE 从终局奖励估计 token 级局部方向，并未直接观测摘要或执行动作的反事实收益差。本论文提示审计联合更新的稳定性与奖励差大小，同时其有限标准式、独立玩家和连续时间假设无法直接覆盖 CompactionRL 的序贯状态转移与 PPO。
- 与已有论文的方法或系统关系：暂无直接方法复用。论文的 FTRL 与复制子动力学理论采用连续时间口径，本地 LLM 强化学习条目多研究有限步策略优化；相关性主要来自奖励设定与多智能体交互。
