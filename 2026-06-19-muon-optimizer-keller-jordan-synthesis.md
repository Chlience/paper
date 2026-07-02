# Muon Optimizer 技术博客与资料综合分析

First-Archived-At: 2026-06-19 22:20
Updated-At: 2026-06-19 22:20

## Source

主来源：

- Title: Muon: An optimizer for hidden layers in neural networks
- URL: https://kellerjordan.github.io/posts/muon/
- Author: Keller Jordan
- Date: 2024-12-08
- Current version read: 页面显示 2024-12-08；已注意到 2025-07-12 增补 stochastic spectral descent / RMSspectral 小节。
- Implementation: https://github.com/KellerJordan/Muon
- Related benchmark code: https://github.com/KellerJordan/modded-nanogpt

补充来源：

- Muon is Scalable for LLM Training: https://arxiv.org/abs/2502.16982
- Moonlight implementation/project: https://github.com/MoonshotAI/Moonlight
- Kimi K2: Open Agentic Intelligence, MuonClip section: https://arxiv.org/html/2507.20534v1
- Why Muon Outperforms Adam: A Curvature Perspective: https://arxiv.org/abs/2606.04662，本地笔记：[2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/)
- Convergence of Muon with Newton-Schulz: https://arxiv.org/abs/2601.19156
- Muown: Row-Norm Control for Muon Optimization: https://arxiv.org/abs/2605.10797
- Gram Newton-Schulz: A Fast, Hardware-Aware Newton-Schulz Algorithm for Muon: https://tridao.me/blog/2026/gram-newton-schulz/
- Shampoo: https://arxiv.org/abs/1802.09568
- SOAP: https://arxiv.org/abs/2409.11321

## 作者与关系

- Keller Jordan: `kellerjordan.github.io` 个人研究博客作者，GitHub 账号为 `KellerJordan`，维护 `Muon`、`modded-nanogpt`、`cifar10-airbench` 等训练 speedrun / optimizer 实验仓库；About 页面直接链接 `https://x.com/kellerjordan0`。
- Muon implementation citation authors: Keller Jordan, Yuchen Jin, Vlado Boza, Jiacheng You, Franz Cesista, Laker Newhouse, Jeremy Bernstein。Keller Jordan 的仓库 README 以该列表给出 Muon 引用格式。
- Moonlight / Kimi Team: `Muon is Scalable for LLM Training` 由 Kimi Team / Moonshot AI 主导，核心补充是 large-scale Muon 的 weight decay、per-parameter update scale、Distributed Muon 和 Moonlight MoE 预训练结果。
- Kimi K2 Team: 在 K2 report 中把 Muon 扩展为 MuonClip，加入 QK-Clip 控制 attention logits 爆炸，用于 1T total parameter MoE 的长程预训练。
- Dao-AILab / Tri Dao 资料线: Gram Newton-Schulz 由 Jack Zhang、Noah Amsel、Berlin Chen、Tri Dao 署名，目标是降低 Muon 中 Newton-Schulz 正交化步骤的 kernel 开销。[Tri Dao](/authors/tri-dao/) 已有本地作者档案。
- 曲率机制资料线: [2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/) 的 Shuche Wang、Fengzhuo Zhang、Jiaxiang Li、Dirk Bergemann、Zhuoran Yang 从 Hessian / NDS 角度解释 Muon 相比 Adam 的局部几何收益。

## 一句话结论

Muon 的核心技术含量在于把隐藏层矩阵参数的 momentum update 映射到近似半正交方向：它用低精度 Newton-Schulz 近似 polar factor，让更新能量更均匀地覆盖矩阵奇异方向；后续大模型实践表明，Muon 想稳定扩展到 LLM pretraining，还需要 weight decay、shape-aware update scale、AdamW/Muon 参数分组、分布式 full-matrix orthogonalization 和 attention logit 控制。

## 阅读目标与判断边界

本篇关注：

1. Keller Jordan 原文如何定义 Muon，以及为什么选择 Newton-Schulz 做正交化。
2. Muon 相比 AdamW、Shampoo、SOAP 的设计位置。
3. Moonlight、Kimi K2、Gram Newton-Schulz、Muown 等后续资料如何补齐规模、稳定性和 kernel 成本问题。
4. 对实际训练 recipe 的可执行判断：哪些参数用 Muon，哪些参数保留 AdamW，需要记录哪些诊断指标。

判断边界：

- Muon 的证据主要集中在 pretraining 和 competitive small-LM / large-LM training；SFT、RL、adapter fine-tuning 的公开证据更稀疏。
- Keller Jordan 原文中的 speedrun 证据很有工程价值，但部分结果来自 X 帖和仓库日志，不等同于同行评审论文的完整实验矩阵。
- Moonlight / Kimi K2 证明 Muon 可以进入大规模训练系统，但这些报告同时改变了模型架构、数据、scale、clip 和系统实现，不能把全部收益单独归因于 Muon 本体。
- 后续 Muown、Gram Newton-Schulz 等资料仍在快速演化；本篇按 2026-06-19 可见资料归档。

## 论文脉络

### 1. 研究问题、背景和价值

LLM pretraining 的默认 optimizer 长期是 AdamW。AdamW 的优势是稳定、调参经验成熟、对 sparse / noisy gradient 友好；代价是 optimizer state 显存高，并且它对每个 coordinate 做 diagonal scaling，较少利用 Transformer 中线性层权重天然是矩阵这一结构。

Muon 处理的问题可以表述为：对隐藏层的 2D weight matrix，是否应该把 update 当作矩阵方向来处理，并显式利用行、列、奇异方向和 operator norm 等结构？如果矩阵 update 的 singular spectrum 很尖锐，少数方向占据大部分更新能量，训练可能在高频出现“只沿少数方向改变”的现象。Muon 的做法是对 momentum update 做正交化，把奇异值拉到接近同一尺度。

这个问题的价值直接对应训练成本：如果优化器能用更少 token 或更少 FLOPs 达到同等 loss / benchmark，pretraining 成本会大幅下降。Moonlight 报告进一步把它放到 scaling-law 语境中，声称在 compute-optimal training 下 Muon 约用 AdamW 52% 的 training FLOPs 达到同等表现。

### 2. 已有解决方案与不足

AdamW 解决了深度学习训练中的许多稳定性问题，但它的 adaptive scaling 是 element-wise 的。对于矩阵参数，element-wise 二阶矩不直接表达行、列、奇异方向和 operator norm 等结构。

Shampoo 使用 structured preconditioning，为矩阵或张量每个 mode 维护 preconditioner，能捕捉比 AdamW 更丰富的结构信息。代价是 preconditioner state、inverse root / eigendecomposition、refresh frequency 和分布式实现都更重。SOAP 在 Shampoo 的 preconditioner eigenbasis 中运行 Adam-like second moment，降低部分频繁 eigendecomposition 带来的损失，但仍保留矩阵 preconditioner 和 basis rotation 成本。

Muon 选择另一条路线：不维护完整二阶 preconditioner，也不计算 SVD；它对当前 momentum matrix 做一次低成本的近似 polar projection。这样牺牲了部分 curvature-estimation 能力，换来更少 optimizer state 和更轻的矩阵结构利用方式。

### 3. 作者可能的思考路径

Muon 的 idea 可以从三条既有线索自然收敛出来：

1. Transformer hidden weights 是矩阵，update 也应该允许矩阵范数和奇异值结构进入 optimizer 设计。
2. Shampoo / spectral descent 的理论线索显示，去掉 preconditioner accumulation 后，某些 structured matrix optimizer 会导向 $UV^\top$ 形式的正交化更新。
3. 直接 SVD 太慢，Newton-Schulz 迭代可以用矩阵乘法近似 polar factor，且在现代 GPU 上可用 bf16 跑出低 overhead。

Keller Jordan 原文把这条思路压缩成一个工程可用定义：先像 SGD-momentum 一样得到 update matrix，再用 Newton-Schulz5 把它近似替换为半正交矩阵，然后只作用在 hidden layer 的 2D 参数上。

### 4. Muon 的算法定义

对矩阵参数 $W_t$，设梯度为 $G_t$，momentum buffer 为 $B_t$。Muon 先做 momentum 累积：

$$
B_t = \mu B_{t-1} + G_t
$$

实际实现常使用 Nesterov-style momentum。随后对 $B_t$ 做近似正交化。若 $B_t = U S V^\top$，理想的 Muon direction 是：

$$
O_t = U V^\top
$$

参数更新为：

$$
W_{t+1}=W_t-\eta O_t
$$

Keller Jordan 的实现用 Newton-Schulz 多项式迭代近似这个 $UV^\top$。核心形式是：

$$
X \leftarrow aX + b(XX^\top)X + c(XX^\top)^2X
$$

并使用调过的系数：

$$
(a,b,c)=(3.4445,-4.7750,2.0315)
$$

实践中常用 5 步迭代，输入先按 Frobenius norm 归一化，宽高方向按较小 Gram matrix 做转置优化，并用 bf16 执行。

### 5. 参数分组：Muon 只覆盖隐藏层矩阵

Muon 的默认 recipe 是 hybrid optimizer：

- hidden linear matrices: Muon。
- embedding、lm head、norm、bias、gain、1D 参数: AdamW。
- Conv 参数: 可把后几维 flatten 成矩阵后应用 Muon，但首层或输入层仍需要谨慎处理。
- Transformer Q/K/V: Keller Jordan 和后续实现都提示，Q、K、V 分开做 Muon 通常比合并成一个 QKV 大矩阵更好。

这条分组规则很关键。Muon 的优势来自矩阵 update geometry；embedding / output head 的训练动态和 hidden projection 不完全相同，直接全量替换 AdamW 容易引入不稳定或质量下降。

### 6. 为什么正交化可能有效

Keller Jordan 原文的直觉是：SGD-momentum 和 Adam 在 Transformer 2D 参数上产生的 update matrix 往往 condition number 很高，接近低秩。正交化会抬高原本很小的 singular directions，让“少数主方向支配更新”的现象缓和。

[2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/) 给出更可诊断的解释：在 matched validation loss 下，Muon 和 Adam 的 first-order decrease 接近；差距主要来自二阶 Hessian curvature penalty。作者定义 Normalized Directional Sharpness：

$$
S_F(W;Z)=\frac{\langle Z,H[Z]\rangle}{\lVert Z\rVert_F^2}
$$

并发现 Muon 的 update norm 与 Adam 接近，优势主要来自更低 NDS。这个结果把“正交化让方向更好”具体化为：Muon 的 update direction 更少暴露在高曲率方向上。

从设计直觉到曲率证据，可以形成一条链：

1. 普通 update 的奇异值谱尖锐，能量集中在少数方向。
2. Muon 把非零奇异值拉到接近同一尺度。
3. 更新能量更均匀地分散到矩阵方向。
4. 在某些 LLM pretraining landscape 中，这会降低 directional sharpness。
5. 较低 curvature penalty 转化为更大的 realized one-step loss decrease。

### 7. 与 Shampoo / SOAP 的关系

Shampoo 对矩阵梯度维护行/列 preconditioner，可粗略写成：

$$
L_t=\sum_i G_iG_i^\top,\quad R_t=\sum_i G_i^\top G_i
$$

更新近似为：

$$
L_t^{-1/4}G_tR_t^{-1/4}
$$

如果移除 preconditioner accumulation，只看当前 $G=USV^\top$，会得到近似 $UV^\top$ 的正交化方向。这解释了 Muon 和 Shampoo 的邻近关系：Muon 可以看作 momentum-before-orthogonalization 的轻量矩阵结构优化器。

SOAP 则把 Adam 放到 Shampoo preconditioner 的 eigenbasis 中运行。它比 Muon 更接近 structured second-order preconditioning，代价也更高。Muon 的工程位置更轻：只保留一份 momentum state，额外成本集中在每步正交化 matmul。

## 关键实验/定理

### 结果 1：Keller Jordan 原文中的 speedrun 证据

Keller Jordan 原文报告了几类经验结果：

- CIFAR-10 94% accuracy speedrun 从 3.3 A100-seconds 改进到 2.6 A100-seconds。
- NanoGPT speedrunning 中，达到 FineWeb 3.28 validation loss 的速度提升约 1.35x。
- 后续 774M、1.5B 参数语言模型训练中继续观察到训练速度改善。
- 1.5B transformer 在 HellaSwag 上达到 GPT-2 XL 级别表现的实验显示，Muon recipe 的训练时间短于 tuned AdamW baseline。

证据解读：这些结果的价值在于 competitive task baseline 经常被社区反复调优；它们较能缓解“AdamW baseline 未调好”的问题。局限是 speedrun 任务高度工程化，recipe、kernel、数据处理和 schedule 共同影响结果。

### 结果 2：Moonlight 把 Muon 扩展到大模型训练

`Muon is Scalable for LLM Training` 的核心补充包括：

- weight decay：vanilla Muon 在更大模型和更长 token 训练中会出现 weight / layer output RMS 增长，Moonlight 加入 AdamW-style decoupled weight decay。
- consistent update RMS：Muon 理论 update RMS 依赖矩阵 shape；Moonlight 通过 per-parameter update scale 调整，让不同 shape 的矩阵 update RMS 更一致，并和 AdamW 非矩阵参数共享超参。
- Distributed Muon：在 ZeRO-1 风格 optimizer state partitioning 下，Muon 需要 gather full gradient matrix 计算正交化，再切回本地 partition。
- scaling law：报告 Muon 在 compute-optimal training 下约用 AdamW 52% training FLOPs 达到同等 loss。
- Moonlight：3B active / 16B total MoE 模型用 Muon 训练 5.7T tokens，并在若干公开 benchmark 上推进同规模 Pareto frontier。

工程解读：Moonlight 说明 Muon 的规模化重点已经从“是否能正交化”转向“如何让 update scale、weight norm、分布式 full-matrix update 和 AdamW 参数分组共同稳定”。

### 结果 3：Kimi K2 的 MuonClip 处理 attention logit 爆炸

Kimi K2 report 进一步指出，大规模 Muon 训练更容易遇到 attention logits 爆炸。Kimi Team 提出 QK-Clip：在 Muon step 后，根据每个 attention head 的 max logit 对 query/key projection weights 做 rescale，以控制 logits 增长。

MuonClip 组合了：

- Muon。
- weight decay。
- consistent RMS matching。
- QK-Clip。

Kimi K2 report 称，使用 MuonClip 后，K2 在 15.5T tokens 预训练中没有观察到 loss spike。这个结果把 Muon 的稳定性边界推到更大 MoE，但也说明 Muon 在 frontier-scale attention 中需要显式控制 QK 动态。

### 结果 4：曲率论文给出 NDS 机制解释

[2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/) 的关键结论：

- Muon 与 Adam 的 first-order decrease 相近。
- Adam 的 second-order curvature penalty 明显更高。
- update norm 差距接近 1，主要差距来自 NDS。
- 数据越不均衡，Adam 的 NDS 增长越明显，Muon 的相对优势越大。
- structured matrix-block quadratic model 支持“Muon 均衡 high/low curvature modes 的 update energy”这一解释。

这篇论文把 Muon 从 speedrun 经验推到局部几何诊断。对工程复验而言，NDS 是比单纯 loss curve 更有解释力的指标。

### 结果 5：Newton-Schulz 理论与 kernel 后续

`Convergence of Muon with Newton-Schulz` 分析实践版 Muon：使用 momentum orthogonalization 和少数 Newton-Schulz steps。它证明 Muon with Newton-Schulz 和 exact SVD polar idealization 在 stationary point convergence rate 上相同到一个常数因子；该因子随迭代步数 $q$ 双指数趋近 1。

Gram Newton-Schulz 则关注系统成本。Tri Dao 资料线把 Muon 的正交化 step 改写为更硬件友好的 Gram Newton-Schulz，并报告可把 orthogonalization runtime 降低约 40%-50%，在一些流行架构上 optimizer step 最高接近 2x 加速，同时 validation perplexity 基本保持。

这两类结果说明，Newton-Schulz 是 Muon 的关键工程点：数学上要足够接近 polar factor，系统上要把 matmul、对称 GEMM、restart 和 sharding 成本压下去。

### 结果 6：Muown 把 row norm drift 变成显式控制变量

`Muown: Row-Norm Control for Muon Optimization` 指出，Muon 在 scale 上对 weight decay 敏感，未使用 decoupled weight decay 时 matrix spectral norm 会漂移。作者把 spectral norm 分解为 row-magnitude factor 和 row-coherence factor，发现 row magnitude 是主要漂移来源。

Muown 的做法是把 row-magnitude vector 作为显式 optimizer variable 处理，同时对 direction component 保留 Muon。报告显示，Muown 在 FineWeb-Edu GPT-style pretraining 124M 到 2.7B 参数范围内优于 Muon、SOAP、AdamW 和 Lion，并扩大 near-optimal learning rate plateau。

这说明 Muon 的后续改进会继续围绕两件事展开：正交化方向本身，以及 weight / row / attention scale 的长期漂移控制。

## 证据链强度评估

### 强证据

- Muon 的定义和实现非常明确：momentum + Newton-Schulz orthogonalization + hidden matrix params。
- 多条独立资料都强调 hybrid 参数分组：矩阵用 Muon，embedding/head/norm/bias/1D 参数用 AdamW。
- Moonlight 对 weight decay 和 update RMS 的补充很重要，且有 scaling-law 和 MoE pretraining 证据。
- 曲率论文提供了可测量机制：Muon 的 NDS 更低，curvature penalty 更小。
- Convergence with Newton-Schulz 缩小了 exact polar theory 和实践版 NS 迭代之间的缺口。

### 中等强度证据

- Speedrun 证据经过竞争式调参，工程价值高；但它和一般 production training 的数据、batch、schedule、系统环境仍有差异。
- Moonlight / Kimi K2 证明 Muon 可以大规模使用；但大系统报告中变量很多，单独隔离 Muon 本体收益很难。
- Gram Newton-Schulz 的 kernel 加速有明确系统意义；其收益会受 GPU 代际、batch size、pipeline overlap 和 optimizer step 占比影响。
- Muown 对 row norm drift 的诊断合理，但作为 2026-05 新论文，还需要更多独立复现。

### 需要谨慎的推论

- Muon 在 pretraining 中强，不自动推出 SFT、RL、LoRA、adapter fine-tuning 全部适用。小 batch 或频繁 optimizer step 的 post-training 场景会放大 optimizer step 开销和稳定性问题。
- Muon 的“约 2x compute efficiency”来自特定 scaling-law 设置，不能直接换算为所有团队的 wall-clock 或成本下降。
- QK-Clip 解决的是大规模 attention logits 动态问题；它引入了额外训练干预，需要评估对模型质量、attention head 分工和 long-context 泛化的影响。
- 更新方向正交化可能提高 rare directions 的学习强度，也可能在某些任务中放大噪声方向；实际部署需要记录 layerwise update RMS、spectral norm、QK logits 和 loss spikes。

## 本地讨论补充

### 1. Muon 的技术含量判断

Muon 的技术含量主要集中在三层：

1. 数学抽象：把隐藏层矩阵权重的 update 视为矩阵对象，使用 spectral / polar geometry 约束更新方向。
2. 数值算法：用 5 步低精度 Newton-Schulz 替代 SVD，选择能快速抬升小 singular values 的多项式系数。
3. 训练系统：把 Muon 和 AdamW 分组、update scale、weight decay、QKV 拆分、ZeRO-style sharding、attention logit clipping、NS kernel 优化组合成可跑大模型的 recipe。

如果只看公式，Muon 很短；如果看从短公式到稳定训练 1T total parameter MoE 的路径，核心难点在 scale control 和系统落地。它的优势来自一个相对直接的矩阵几何 idea，但工程上有很多细节决定结果是否成立。

### 2. 与 AdamW 的关系

AdamW 仍然是最稳健的默认 optimizer，因为它适用于几乎所有参数类型，调参经验成熟，fine-tuning / RL 生态也围绕它建立。

Muon 适合被理解为 pretraining 中 hidden matrix weights 的 specialized optimizer。实际 recipe 通常保留 AdamW 处理非矩阵参数和输入/输出层。这种混合方式让 Muon 获得矩阵结构收益，同时借用 AdamW 管理标量、向量和 token-embedding 动态。

### 3. 与 Shampoo / SOAP 的关系

Shampoo / SOAP 更像 structured preconditioning 路线：它们维护和使用更丰富的矩阵 curvature / covariance 坐标。Muon 更像 update-direction orthogonalization 路线：它省去重型 preconditioner，把当前 momentum update 推到半正交方向。

因此它们的取舍很清楚：

- Shampoo / SOAP: 更多状态、更多矩阵分解、更强 preconditioning 表达。
- Muon: 更少状态、更轻实现、更依赖正交化方向和 scale control。

### 4. 实践 checklist

如果在 LLM pretraining 中试 Muon，应至少记录：

- 参数分组：Muon params、AdamW params、embedding/head/norm/bias 是否正确排除。
- QKV 处理：Q/K/V 是否拆开正交化，MLA/GQA/MQA 等结构是否做专门处理。
- update scale：每个矩阵 shape 的 update RMS，是否匹配 AdamW 非矩阵参数。
- norm dynamics：weight RMS、spectral norm、row norm、layer output RMS。
- attention dynamics：per-head max QK logits，是否出现爆炸或长期 clip。
- optimizer cost：NS iterations、optimizer step wall-clock、pipeline overlap、DP/TP gather 成本。
- training quality：loss per token、validation loss per FLOP、wall-clock、downstream benchmark、loss spike 统计。
- geometry diagnostics：可行时记录 NDS、curvature penalty、layerwise NDS gap。

## 主要启发

- 对矩阵参数，optimizer 可以利用奇异值、谱范数和 operator-like geometry；这给 AdamW 的 element-wise scaling 之外提供了一个有实证支撑的设计空间。
- Muon 的最小核心是 momentum 后处理和矩阵正交化；这解释了它为什么能以较低 optimizer state 成本进入大规模训练。
- 大规模训练中的 Muon recipe 已经从单一 optimizer 变成一组约束：weight decay、update RMS、QKV split、AdamW auxiliary optimizer、distributed orthogonalization 和 QK-Clip。
- 曲率视角提供了复验方法：比较 optimizer 时应看 first-order gain、update norm、NDS 和 curvature penalty，而不只看 loss curve。
- 后续 Muon 变体的主要方向会围绕 scale drift、attention stability、Newton-Schulz kernel 和 post-training compatibility 展开。

## 局限

1. Keller Jordan 原文是技术博客，证据以 speedrun、仓库日志和社区复现为主；部分结果没有完整论文式 ablation。
2. Moonlight / Kimi K2 的大规模结果同时包含架构、数据、系统和 optimizer recipe 变化，隔离归因有限。
3. Muon 在 SFT、RL、LoRA、adapter、vision-language、多模态和 small-batch post-training 中的稳定证据仍不够系统。
4. 正交化每步依赖 full matrix；复杂 sharding、tensor parallel 和 expert parallel 下需要额外通信与 kernel 设计。
5. Muon 的优势和 batch size、模型宽度、矩阵 shape、数据长尾程度、learning-rate schedule、weight decay 强相关，不能直接套用单一超参。
6. QK-Clip、Muown、Gram Newton-Schulz 等后续方法仍在快速演化，长期主流 recipe 可能继续变化。

## 跨论文关系

- 与 [2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/)：本篇提供 Muon 的上游设计、实现和后续工程资料；`2606.04662` 提供局部曲率解释。两者合起来覆盖“怎么做”和“为什么在某些 LLM pretraining 中有效”。
- 与 [2026-04-24 DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)：DeepSeek-V4 报告中 Muon 已进入 trillion-scale MoE pretraining recipe，包含 Hybrid Newton-Schulz、AdamW/Muon 分工和 BF16 gradient synchronization；本篇提供其 optimizer 背景。
- 与 [2602.15763 GLM-5](/papers/2602.15763-glm-5-agentic-engineering/)：GLM-5 使用 Muon Split，并把 optimizer 置于 agentic engineering 系统栈中；本篇解释 Muon Split 背后的参数分组和矩阵正交化逻辑。
- 与 [2203.15556 Chinchilla](/papers/2203.15556-training-compute-optimal-large-language-models/) 和 [2001.08361 scaling laws](/papers/2001.08361-scaling-laws-neural-language-models/)：Chinchilla / scaling laws 处理模型-数据-计算预算分配，Muon 处理同一计算预算下的 optimizer efficiency；两者都影响 pretraining cost frontier。
- 与 [2307.08691 FlashAttention-2](/papers/2307.08691-flashattention-2-parallelism-work-partitioning/) 和 [2205.14135 FlashAttention](/papers/2205.14135-flashattention-io-aware-exact-attention/)：FlashAttention 优化 attention kernel 的 IO 路径，Gram Newton-Schulz 优化 Muon 正交化 kernel；二者都是把数值算法和 GPU kernel co-design 结合起来降低训练/推理成本。
- 与 [2605.14220 TIM/VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/) 和 [TML batch-invariant inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：Muon 进入 RL/post-training 后，optimizer step、QK-Clip、inference backend 和 trainer backend 的一致性都可能影响 policy update；未来需要把 optimizer diagnostics 和 rollout/trainer consistency 一起记录。

## Reference Intake Brief

### Target

- Intended target system: 新增 Muon optimizer 综合技术博客笔记；更新 `papers-index.md` 的 optimizer geometry cluster；为 Keller Jordan 建立作者档案。
- Existing related assets: [2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/)、[2026-04-24 DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)、[2602.15763 GLM-5](/papers/2602.15763-glm-5-agentic-engineering/)、[2307.08691 FlashAttention-2](/papers/2307.08691-flashattention-2-parallelism-work-partitioning/)。
- Proposed form: 技术博客 + 多资料综合条目。

### Reusable Elements

1. Muon = momentum + Newton-Schulz orthogonalization + hidden matrix params。
2. Hybrid optimizer 参数分组规则。
3. weight decay / update RMS / distributed full-matrix orthogonalization / QK-Clip 作为大规模扩展要点。
4. NDS / curvature penalty 作为 Muon 机制复验指标。
5. Muon 与 Shampoo/SOAP/AdamW 的 optimizer design space 定位。
6. Muon 训练 checklist：update RMS、spectral norm、row norm、QK logits、optimizer step time、NDS。

### Risks

- Copyright/over-copying: 本笔记使用转述和必要公式摘要，未复制长段博客或论文正文。
- Unsourced or unverifiable claims: 对 benchmark 数字只保留来源报告的结论；对单独归因保持谨慎。
- Tone/brand mismatch: 中文表达遵循本目录规则，避免先否定再强调的对照句式。
- Safety/compliance issues: 内容为训练优化器机制和系统实现，无直接安全滥用细节。
- Overlap with existing assets: 与 `2606.04662` 有主题重叠；本篇定位为 Muon 设计与工程综合，`2606.04662` 保留曲率论文独立分析。

### Skipped

| Material | Reason |
| --- | --- |
| Keller Jordan 原文中的全部 X 结果链接 | 只保留主张和仓库/论文级证据，避免把临时社交媒体日志写成长期事实 |
| 完整 Newton-Schulz 收敛证明 | 本篇只记录结论和工程含义，证明细节留给 `2601.19156` |
| Muon+、AdaMuon、LoRA-Muon 等所有变体 | 本篇聚焦主线、规模化和稳定性资料，后续变体可单独建档 |
| Moonlight 全部 benchmark 表 | 只保留与 Muon scale-up 直接相关的结论 |

### Recommendation

Decision: merge。

Why: Muon 已从单篇技术博客扩展为 LLM pretraining optimizer 的重要路线；它连接矩阵几何、低精度数值迭代、GPU kernel、分布式 optimizer state 和大模型稳定性。本篇能作为后续阅读 Muon 变体、frontier system report 和 optimizer geometry 论文的入口节点。
