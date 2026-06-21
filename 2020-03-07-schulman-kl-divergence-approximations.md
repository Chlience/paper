# Approximating KL Divergence 技术博客笔记

First-Archived-At: 2026-06-21 10:17
Updated-At: 2026-06-21 10:17

## Source

- Title: Approximating KL Divergence
- URL: http://joschu.net/blog/kl-approx.html
- Author: [John Schulman](/authors/john-schulman/)
- Posted: 2020-03-07
- Current version read: web article accessed 2026-06-21；页面显示 `Posted on 2020/03/07`
- Related source: John Schulman homepage, http://joschu.net/
- Related paper: Proximal Policy Optimization Algorithms, https://arxiv.org/abs/1707.06347
- Related follow-up: On a few pitfalls in KL divergence gradient estimation for RL, https://arxiv.org/abs/2506.09477
- Type: technical blog / estimator note

## 作者与关系

- [John Schulman](/authors/john-schulman/): 个人博客作者。当前主页显示其为 Thinking Machines cofounder and chief scientist；此前在 Anthropic Alignment Science；更早是 OpenAI cofounder，并在 OpenAI 领导 ChatGPT 创建和 2022-2024 post-training team。主页还显示其 UC Berkeley PhD advisor 为 [Pieter Abbeel](/authors/pieter-abbeel/)。

关系判断：

- 同机构作者群：单作者技术博客；正文感谢 Jacob Hilton 和 Nisan Stiennon 提供反馈。
- 跨机构桥接：作者经历连接 UC Berkeley / OpenAI / Anthropic / Thinking Machines；本文在 RL、PPO、RLHF 和 post-training 实践中被广泛引用。
- 与已存档作者重叠：未发现与当前论文笔记的直接共同作者重叠；作者主页显示 [Pieter Abbeel](/authors/pieter-abbeel/) 为博士导师，Pieter Abbeel 已出现在 [2310.01889 Ring Attention](/papers/2310.01889-ring-attention-blockwise-transformers-near-infinite-context/)。
- 与已存档论文的主题或方法关系：与 [2026-06-16 verl](/papers/2026-06-16-verl-rl-optimization-algorithms/)、[2503.14476 DAPO](/papers/2503.14476-dapo-long-cot-rl-system/)、[2605.14220 TIM/VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/)、[2025-09-10 batch-invariant inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 关系很强。它提供 `K1/K2/K3` 这类 KL value estimator 的基础语言，后续 RLHF/RLVR 系统用这些量监控 policy drift、rollout/trainer mismatch 和 KL penalty。
- 需要后续确认：如果后续归档 TRPO、PPO、InstructGPT 或 RLHF 原始论文，应把 John Schulman 的作者页和这些材料补成更完整的 post-training / policy optimization cluster。

作者页决策：

- tracked: [John Schulman](/authors/john-schulman/)。原因是其为 PPO / TRPO / RLHF / post-training 关键作者，且本地档案已有多篇 RLHF/RLVR 材料依赖 PPO、KL 和 logprob ratio 语言。

## 一句话结论

这篇博客给出了 RL 实践中常用 KL 估计器 `k1/k2/k3` 的最小数学解释：在只能从 $q$ 采样并能计算 $p(x),q(x)$ 的场景下，$k_1=-\log r$ 是无偏但高方差的 $\mathrm{KL}[q,p]$ 估计器；$k_2=\frac12(\log r)^2$ 是低方差但有偏的二阶近似；$k_3=(r-1)-\log r$ 通过控制变量 $r-1$ 保持无偏、非负和低方差，其中 $r=p(x)/q(x)$。对 RLHF/RLVR 来说，它最适合作为 KL 数值估计和 drift 诊断的基础，而当 KL 项被当作可微 loss 或 reward penalty 使用时，还必须单独处理采样分布、stop-gradient、序列自回归依赖和 rollout/trainer logprob 归属。

## 阅读目标与判断边界

本笔记关注：

1. `k1/k2/k3` 三个 KL 估计器分别估计什么，为什么方差和偏差不同。
2. 控制变量 $r-1$ 为什么能把高方差无偏估计器改成低方差无偏估计器。
3. f-divergence / Fisher 二阶近似 / Bregman gap 这三种视角如何解释 `k2` 和 `k3`。
4. 这些估计器在 PPO/GRPO/RLHF/RLVR 中作为诊断量、reward penalty 或 loss 时的边界。

判断边界：

- 原文是一篇短技术博客，目标是解释 KL 数值估计；完整 RLHF loss 实现指南需要额外材料。
- 原文假设可以从 $q$ 采样，并能对样本计算 $p(x)$ 与 $q(x)$；如果样本来自第三个行为策略、异步 rollout policy 或 replay buffer，需要额外 importance correction。
- 原文主要讨论 scalar expectation estimator；LLM 自回归序列中的 KL gradient 还涉及 token prefix distribution 和 sampling policy 对参数的依赖。
- 2025 年后续论文 [2506.09477](https://arxiv.org/abs/2506.09477) 明确指出，把 KL 估计器直接拿去自动微分作为 KL regularization loss 可能得到错误梯度；本笔记把这个作为实践边界写入。

## 论文脉络

### 1. 研究问题、背景和价值

RL 和 post-training 系统经常需要知道两个分布有多远。PPO / TRPO 里，KL 用来约束新旧 policy 的距离；RLHF 里，KL 用来约束当前 policy 不要过度偏离 reference policy；异步 rollout 系统里，KL 或 logprob delta 用来诊断生成样本的行为策略和训练时优化策略是否一致。

直接计算 KL 往往很贵。对离散大词表语言模型，完整 KL 需要在每个 prefix 上遍历全 vocabulary；对连续 action policy 或复杂模型，积分没有解析式；在工程上，很多系统为了节省内存和网络传输，只保存已采样 token 的 logprob，而不保存完整分布。

因此实践中常用 Monte Carlo：从一个分布采样若干 $x$，对样本计算 logprob ratio，再平均得到 KL 估计。问题在于，最直接的无偏估计器方差很大，甚至单个样本可以为负；而 KL 本身非负。训练系统如果用这个量做 early stopping、policy drift threshold 或报警，会遇到噪声、负值、阈值难设和 batch 间波动。

这篇博客解决的问题是：在保持实现非常简单的前提下，能否获得一个无偏、低方差、单样本非负的 KL estimator？

### 2. 已有解决方案与不足

最朴素的估计器来自定义。设目标是：

$$
\mathrm{KL}[q,p] = \mathbb{E}_{x\sim q}\left[\log \frac{q(x)}{p(x)}\right].
$$

定义：

$$
r=\frac{p(x)}{q(x)}.
$$

则：

$$
k_1=-\log r.
$$

在 $x\sim q$ 下，$k_1$ 的期望正好是 $\mathrm{KL}[q,p]$，因此无偏。它的问题是方差高，因为 $-\log r$ 可以为正也可以为负；在有限 batch 里，sample mean 可能为负，尽管理论 KL 非负。

另一个经验上常见的估计器是：

$$
k_2=\frac{1}{2}(\log r)^2.
$$

它总是非负，且当 $p$ 和 $q$ 很接近时方差低。代价是它的期望对应另一个 f-divergence；当两个分布相距较远，bias 会变大。

原文的切入点是把这两个估计器统一起来：`k2` 的好处来自局部二阶近似，`k1` 的好处来自无偏。理想方案应同时保留这两点。

### 3. 作者可能的思考路径

从 RL 工程视角看，作者可能面对的是 PPO/TRPO 代码里常见的 `approx_kl` 监控问题。训练循环已经保存了 action 或 token 的 old logprob 和 new logprob，直接算 $\log q-\log p$ 很方便；但这个量在 minibatch 上波动大，用来 early stop 或调 KL coefficient 时体验不好。

如果只需要局部距离，Fisher geometry 提供了一个直觉：当两个分布很接近，各种光滑 f-divergence 的二阶项都等价于 Fisher information 给出的局部二次型。因此 $\frac12(\Delta \log p)^2$ 虽然有偏，却能在小步更新里表现得很好。

但 PPO/GRPO 训练不总停留在极小 KL 区间。若 policy 更新过大，biased estimator 会低估或高估 drift。于是自然会考虑控制变量：保留 $k_1$ 的无偏性，同时加一个期望为 0、且和 $k_1$ 负相关的项来降低方差。

唯一直接可用的零均值项是：

$$
\mathbb{E}_{x\sim q}[r-1]=0,
$$

因为：

$$
\mathbb{E}_{x\sim q}\left[\frac{p(x)}{q(x)}\right]=\sum_x p(x)=1.
$$

于是得到一族无偏估计器：

$$
k_\lambda=-\log r+\lambda(r-1).
$$

最优 $\lambda$ 需要知道 $p,q$ 的统计量，工程上不方便。原文选择 $\lambda=1$，因为 $\log r\le r-1$，从而单样本估计器非负。

### 4. 核心假设或切入点

原文依赖几个简单假设：

1. 样本 $x$ 来自 $q$。
2. 对每个样本能计算 $p(x)$ 和 $q(x)$，至少能计算 logprob difference。
3. 目标是估计 $\mathrm{KL}[q,p]$ 或 $\mathrm{KL}[p,q]$ 的数值；可微策略梯度需要另行推导。
4. $p$ 和 $q$ 通常比较接近，这让二阶近似解释 `k2` 的低 bias，也让 KL estimator 在 PPO/RLHF 里有实用意义。
5. 工程系统更偏好低方差、非负、容易阈值化的估计量。

### 5. 方法 / 系统 / 理论框架

#### 5.1 `k1`: 直接无偏估计器

目标：

$$
\mathrm{KL}[q,p]=\mathbb{E}_{x\sim q}\left[-\log r\right].
$$

估计器：

$$
k_1=-\log r.
$$

性质：

- 无偏。
- 单样本可以为负。
- 方差高，尤其当 $p$ 和 $q$ 很接近时，真实 KL 是二阶小量，但 $\log r$ 是一阶波动量；平均值很小，标准差相对很大。

在 PPO 里，这解释了为什么 naive approximate KL 可能出现负数。负数本身不表示真实 KL 为负，只表示有限样本和高方差估计器的波动。

#### 5.2 `k2`: 二阶低方差近似

估计器：

$$
k_2=\frac{1}{2}(\log r)^2.
$$

它的期望是一个 f-divergence。对光滑 f-divergence，当 $p$ 和 $q$ 接近时，它们共享同一个 Fisher 二阶局部几何：

$$
D_f(p_0,p_\theta)=\frac{f''(1)}{2}\theta^\top F\theta+O(\theta^3).
$$

对于 $\mathrm{KL}[q,p]$ 对应的 $f(x)=-\log x$，以及 `k2` 对应的 $f(x)=\frac12(\log x)^2$，都有 $f''(1)=1$。因此在小 KL 区间，`k2` 的 expectation 和 KL 的二阶项一致。

性质：

- 单样本非负。
- 方差低。
- 有偏；当 $p,q$ 距离变大，bias 会变得明显。

这解释了 `k2` 的工程吸引力：如果每次 policy update 都很小，它近似足够好，监控曲线更稳定。但它不适合在 drift 已经较大时继续当成精确 KL。

#### 5.3 `k3`: 控制变量 + Bregman gap

无偏控制变量族：

$$
k_\lambda=-\log r+\lambda(r-1).
$$

取 $\lambda=1$：

$$
k_3=(r-1)-\log r.
$$

性质：

- 无偏，因为 $\mathbb{E}_{q}[r-1]=0$。
- 非负，因为 $\log r\le r-1$。
- 方差显著低于 `k1`，通常接近或优于 `k2`。
- 当 $r$ 接近 1 时，Taylor 展开给出：

$$
(r-1)-\log r=\frac12(r-1)^2+O((r-1)^3),
$$

因此它也具有二阶距离的直觉。

Bregman 视角：`k3` 是凹函数 $\log r$ 与其在 $r=1$ 处切线之间的垂直差距；也可以看作 convex f-divergence 的 tangent gap。这个视角解释了为什么它天然非负。

#### 5.4 反向 KL 的对应估计器

若目标是：

$$
\mathrm{KL}[p,q]=\mathbb{E}_{x\sim p}\left[\log \frac{p(x)}{q(x)}\right],
$$

但仍在 $x\sim q$ 下估计，可以写成：

$$
\mathrm{KL}[p,q]=\mathbb{E}_{x\sim q}\left[r\log r\right].
$$

加入同样的零均值控制变量，得到非负估计器：

$$
r\log r-(r-1).
$$

这个形式在理解 forward KL / reverse KL 的采样分布差异时很有用。实践里先问清楚“样本来自谁”和“要估计哪一个方向的 KL”，公式才不会写反。

#### 5.5 原文数值实验

原文用一维 Gaussian 做 sanity check。

第一组：$q=N(0,1)$，$p=N(0.1,1)$，真实 KL 为 0.005。

| Estimator | bias / true | stdev / true |
| --- | ---: | ---: |
| `k1` | 0 | 20 |
| `k2` | 0.002 | 1.42 |
| `k3` | 0 | 1.42 |

第二组：$q=N(0,1)$，$p=N(1,1)$，真实 KL 为 0.5。

| Estimator | bias / true | stdev / true |
| --- | ---: | ---: |
| `k1` | 0 | 2 |
| `k2` | 0.25 | 1.73 |
| `k3` | 0 | 1.7 |

这两个实验说明：小 KL 时 `k2` 的 bias 几乎可以忽略，但 `k3` 同时保持无偏和低方差；大 KL 时 `k2` 的 bias 明显上升，`k3` 更稳。

### 6. 结论链条

原文结论可以压缩为：

1. KL 直接估计器 `k1=-log r` 无偏，但样本级方差高。
2. `k2=0.5(log r)^2` 是另一个 f-divergence，在 $p\approx q$ 时和 KL 共享 Fisher 二阶项，因此低 bias、低方差，但距离大时有偏。
3. $r-1$ 在 $x\sim q$ 下期望为 0，可作为控制变量加入 `k1`。
4. 选择 $\lambda=1$ 得到 `k3=(r-1)-log r`，它无偏、非负、低方差。
5. 对反向 KL，可以用 $r\log r-(r-1)$ 得到同类非负估计器。
6. 在 PPO/RLHF 中，`k3` 适合作为 policy drift / approx KL 的默认监控估计量；若把 KL 用作可微优化目标，还要重新推导梯度。

## 关键实验/定理

### 结果 1：控制变量让 `k1` 变成低方差无偏估计器

- 设置：$x\sim q$，$r=p(x)/q(x)$。
- 指标：估计器是否无偏、是否非负、方差是否低。
- 结果：$-\log r+\lambda(r-1)$ 对任意 $\lambda$ 都无偏；$\lambda=1$ 时得到 `k3=(r-1)-log r`，且由 $\log r\le r-1$ 保证非负。
- 解读：这是原文最核心的技巧。它把 KL 定义里的高方差 log ratio，改写成 log 曲线和切线之间的 gap。

### 结果 2：小 KL Gaussian 实验中 `k2` 和 `k3` 方差显著低于 `k1`

- 设置：$q=N(0,1)$，$p=N(0.1,1)$，真实 KL 为 0.005。
- 指标：bias / true 与 stdev / true。
- 结果：`k1` 的 stdev / true 为 20；`k2` 和 `k3` 都约为 1.42；`k2` 的 bias / true 为 0.002，`k3` 为 0。
- 解读：当 policy 更新很小，`k2` 也足够好；`k3` 进一步去掉了 bias，因此更适合默认记录。

### 结果 3：大 KL Gaussian 实验中 `k2` bias 变明显

- 设置：$q=N(0,1)$，$p=N(1,1)$，真实 KL 为 0.5。
- 指标：bias / true 与 stdev / true。
- 结果：`k2` 的 bias / true 上升到 0.25；`k3` 仍无偏，stdev / true 约 1.7。
- 解读：如果训练中 policy drift 已经变大，`k2` 的低方差会用 bias 换来稳定曲线；`k3` 更适合做阈值和跨实验对比。

## 证据链强度评估

### 强证据

- `k1` 无偏、`r-1` 零均值、`k3` 无偏非负都来自直接代数推导。
- `k2` 的二阶近似解释来自 f-divergence 的局部 Fisher 几何，能解释它为什么在 PPO 小步更新中表现好。
- Gaussian 实验虽然简单，但足以展示三种估计器的偏差/方差差异。

### 中等强度证据

- 原文没有覆盖高维语言模型、大词表、长序列和异步 rollout；把 `k3` 迁移到 LLM RL 需要额外处理 token/sequence 聚合。
- 原文没有系统比较不同 $\lambda$；$\lambda=1$ 的选择来自非负性和简洁性，并不保证在所有分布下方差最小。
- 原文实验只展示两个 Gaussian 位移场景，未覆盖 heavy-tail policy ratio、truncated sampling、top-p/top-k 或 temperature 采样。

### 需要谨慎的推论

- `k3` 是好的 KL value estimator，不自动等于正确的 KL loss gradient estimator。
- 如果样本来自 rollout policy $\pi_{\text{rollout}}$，而目标 KL 是 $\pi_\theta$ 对 reference 或 old policy 的 KL，必须先处理采样分布和 importance ratio。
- 对 LLM 自回归序列，按 token 求 `k3` 均值可以作为诊断；若要优化 sequence-level KL，需要考虑 prefix distribution 对后续 token 的影响。
- `k3` 非负不表示训练一定稳定。它只能更稳定地测量 drift；是否允许 drift，要由 reward、entropy、clip fraction、任务分布和安全边界一起判断。

## 本地讨论补充

### 1. 讨论收敛点

- 这篇博客在本地档案中的位置是 KL estimator 基础节点。它解释 `approx_kl`、`K3`、logprob delta 和 policy drift 指标为何存在。
- 在 PPO/GRPO 实践中，先区分三件事：估计 KL 数值、把 KL 作为 reward shaping、把 KL 作为可微 loss。三者公式可能长得像，但梯度路径和采样分布不同。
- 对长序列 RLHF/RLVR，建议同时记录 token-level `k3`、sequence accumulated logprob delta、clip fraction、entropy、IS effective sample size 和 rollout/trainer logprob mismatch。

### 2. 修正后的理解

- `k1` 负值属于高方差无偏估计器的有限样本现象。若训练日志中 `approx_kl` 常为负，先确认它用的是 `k1`、`k2` 还是 `k3`。
- `k2` 适合解释“为什么平方 log ratio 看起来像 KL”。它的合理性来自小步更新的二阶局部几何，不适合在 policy 已经大幅偏移时当精确 KL。
- `k3` 的优势是工程可诊断性：无偏、非负、低方差，适合 threshold、early stopping 和跨实验比较。
- Tang & Munos 2025 的后续提醒很关键：KL estimator 的值正确，不保证自动微分出来的 KL gradient 正确。实现里需要明确 stop-gradient、sampling policy 和 sequence dependency。

### 3. KL 方向与采样分布

- KL 的方向由期望所在的分布决定：

$$
\mathrm{KL}(P\|Q)=\mathbb{E}_{x\sim P}\left[\log P(x)-\log Q(x)\right].
$$

  因此最直接的 Monte Carlo 估计规则是：若样本来自 $P$，就用“采样分布 log_prob 减目标分布 log_prob”。
- Schulman `k3` 里的 $r$ 采用相反方向定义。若要估 $\mathrm{KL}(P\|Q)$ 且样本来自 $P$，朴素 `k1` 使用：

$$
\log P(x)-\log Q(x).
$$

  但 `k3` 定义：

$$
r=\frac{Q(x)}{P(x)}
$$

  也就是“目标分布 / 采样分布”。这个反向定义服务控制变量：

$$
\mathbb{E}_{x\sim P}[r-1]=\mathbb{E}_{x\sim P}\left[\frac{Q(x)}{P(x)}\right]-1=\sum_x Q(x)-1=0.
$$

  如果把 $r$ 定义成“采样分布 / 目标分布”，这个零均值性质一般不成立，`k3` 的无偏性也会丢失。
- PPO 里要分清 ratio 和 KL。surrogate loss 使用：

$$
r_t=\frac{\pi_{\mathrm{new}}(a_t\mid s_t)}{\pi_{\mathrm{old}}(a_t\mid s_t)}
$$

  这是 `new / old`。但 rollout batch 来自 $\pi_{\mathrm{old}}$，所以 early stopping 的 naive approximate KL 通常是：

$$
\mathrm{KL}(\pi_{\mathrm{old}}\|\pi_{\mathrm{new}})
\approx
\log \pi_{\mathrm{old}}(a_t\mid s_t)-\log \pi_{\mathrm{new}}(a_t\mid s_t).
$$

- `k3` 写法看起来方向相反，是因为它先定义 $r=\pi_{\mathrm{new}}/\pi_{\mathrm{old}}$，即目标分布 / 采样分布：

$$
k_3=(r-1)-\log r.
$$

  在样本来自 $\pi_{\mathrm{old}}$ 时，这仍然估计 $\mathrm{KL}(\pi_{\mathrm{old}}\|\pi_{\mathrm{new}})$。因此 `log_ratio = new_logprob - old_logprob` 加上 `exp(log_ratio)-1-log_ratio` 是合理的。
- RLHF reference KL 里，如果 response 来自当前 policy，并在这些 sampled tokens 上比较 reference，那么朴素 token estimator 是：

$$
\log \pi_{\mathrm{current}}(y_t\mid y_{<t},x)-\log \pi_{\mathrm{ref}}(y_t\mid y_{<t},x),
$$

  对应采样路径上的 $\mathrm{KL}(\pi_{\mathrm{current}}\|\pi_{\mathrm{ref}})$ 估计。它和 PPO update 内部的 $\mathrm{KL}(\pi_{\mathrm{old}}\|\pi_{\mathrm{new}})$ 是两个不同量。
- 审计实现时建议写出四元组：样本来自哪个 policy、目标 KL 方向是什么、ratio 定义是什么、使用 `k1/k2/k3` 哪个 estimator。常见符号错误是把 `new_logprob - old_logprob` 直接当作正的 $\mathrm{KL}(\pi_{\mathrm{old}}\|\pi_{\mathrm{new}})$，或把 `ref_logprob - current_logprob` 当作当前 policy 到 reference 的正 KL penalty。

### 4. 后续复验指标

- KL estimator 对比：`k1_mean`、`k2_mean`、`k3_mean`、std、p95/p99、负值比例。
- RL policy drift：current/ref logprob delta、current/old ratio、clip fraction、entropy、sequence-level KL。
- 异步 rollout：`π_rollout` vs `π_old` 的 logprob delta、TIS weight、ESS、rejection sampling mask、staleness。
- 长序列：token position bucket 下的 `k3`、prefix length bucket 下的 sequence KL、overlong samples 的 KL 分布。
- 实现审计：KL term 是否 detach、样本来自哪一个 policy、reference/old/rollout/current logprob 是否分别保存。

## 主要启发

- KL 监控指标要写清样本分布、目标分布和 estimator。`approx_kl` 这个名字不够，日志里应明确 `k1/k2/k3`、KL 方向和 ratio 定义。
- `k3` 是默认更稳的 drift 估计器：它继承 `k1` 的无偏性，同时获得 `k2` 近似级别的低方差和非负性。
- 小步 policy optimization 中，多种 divergence 局部等价；当更新变大，divergence 选择和 estimator bias 会影响阈值判断。
- 在 RLHF/RLVR 中，KL value estimator 和 KL gradient estimator 要分开设计。监控值、reward penalty、actor loss、rollout correction 对 stop-gradient 的要求不同。
- 对 post-training 系统，KL 同时是算法超参和系统一致性指标。rollout backend、trainer backend、precision、kernel path 和 batch behavior 都会改变实际 logprob landscape。

## 局限

1. 原文短小，数学推导集中在单样本 Monte Carlo estimator，没有覆盖完整 policy gradient。
2. 假设样本来自 $q$，而现代异步 RL 系统经常同时存在 rollout、old、current、reference 多个策略。
3. Gaussian 实验很清晰，但不能代表 LLM token distribution 的 heavy-tail ratio、长序列累积和截断生成。
4. `k3` 的非负性有利于日志诊断，但不能替代 reward hacking、style drift 或 safety drift 评估。
5. 若用于可微 KL regularization，需要参考后续 KL gradient pitfall 工作，不能只把 `k3.mean()` 放进 loss 后自动微分。

## 跨论文关系

- 与 [2026-06-16 verl](/papers/2026-06-16-verl-rl-optimization-algorithms/)：verl 笔记中提到 mismatch 指标应记录 KL、K3、chi2、IS effective sample size 等。本篇提供 K3 的数学来源，说明它为什么适合做 rollout/trainer policy drift 诊断。
- 与 [2503.14476 DAPO](/papers/2503.14476-dapo-long-cot-rl-system/)：DAPO 移除 explicit KL penalty 以扩大 reasoning exploration。本篇提供 KL penalty / KL diagnostic 的底层估计语言，有助于复验移除 KL 后的 policy drift、entropy collapse 和 style drift。
- 与 [2605.14220 TIM/VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/) 和 [2025-09-10 batch-invariant inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：这些材料把 rollout/trainer logprob mismatch 提升为系统稳定性问题。本篇的 `k3` 可作为数值差异的稳定估计量，但 mismatch 的根因还包括 kernel、batching、precision 和 engine path。
- 与 [2403.03185 correlated proxies](/papers/2403.03185-correlated-proxies-reward-hacking/)：ORPO / occupancy regularization 使用 KL 类约束控制 policy 偏移。本篇补充的是 KL 数值估计层；occupancy-level reward hacking 还需要超出 action KL 的状态分布分析。
- 与 [2506.13585 MiniMax-M1](/papers/2506.13585-minimax-m1-cispo-lightning-attention/)：CISPO 使用 clipped importance weight 控制 policy update；KL/K3 可作为 ratio clipping 之外的 drift 监控量，帮助判断 clip 只是在限幅，还是已经允许 policy 远离 reference/old。

## Reference Intake Brief

### Target

- Intended target system: 新增 John Schulman KL approximation 技术博客笔记；更新 `papers-index.md` 的 post-training / KL estimator 图谱；新增 John Schulman 作者档案。
- Existing related assets: [2026-06-16 verl](/papers/2026-06-16-verl-rl-optimization-algorithms/)、[2503.14476 DAPO](/papers/2503.14476-dapo-long-cot-rl-system/)、[2605.14220 TIM/VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/)、[2025-09-10 batch-invariant inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)。
- Proposed form: 新建独立 Markdown 文档并更新索引、作者档案和相关笔记反向链接。

### Reusable Elements

1. $k_1=-\log r$：无偏、高方差、可为负。
2. $k_2=\frac12(\log r)^2$：低方差、有偏、小 KL 时二阶近似好。
3. $k_3=(r-1)-\log r$：控制变量给出的无偏、非负、低方差估计器。
4. 反向 KL estimator：$r\log r-(r-1)$。
5. 方向规则：若 $x\sim P$，则 $\mathrm{KL}(P\|Q)$ 的 `k1` 是 `log P(x) - log Q(x)`；PPO ratio 的 `new / old` 和 approximate KL 的 `old || new` 属于不同用途。
6. 实践区分：KL value estimator、KL reward penalty、KL differentiable loss、rollout/trainer mismatch metric。

### Risks

- Copyright/over-copying: 原文很短，本笔记只保留公式、实验数值和本地分析，没有长段引用。
- Unsourced or unverifiable claims: 作者当前身份来自个人主页；后续职业变动需要重新确认。RLHF/RLVR 扩展判断来自本地已存档材料和 Tang & Munos 2025。
- Tone/brand mismatch: 作为技术博客归档，避免把它写成同行评审论文。
- Safety/compliance issues: 无直接安全滥用细节；主要是 RL 训练诊断。
- Overlap with existing assets: 与 verl/DAPO/TIM 笔记有重叠，本篇承担 estimator 基础层，不替代具体系统分析。

### Skipped

| Material | Reason |
| --- | --- |
| TRPO 原始论文 | 与 KL trust region 强相关，但本次用户输入聚焦 KL approximation blog；后续可单独归档 |
| InstructGPT / PPO 原始 RLHF 论文 | 需要完整论文级分析，暂作为背景 |
| Hugging Face 社区二次解读 | 可作为工程补充，但本篇优先归档原文和后续 KL gradient pitfall 论文 |

### Recommendation

Decision: merge

Why: 这篇博客是理解 RLHF/RLVR 中 `approx_kl`、`K3`、logprob ratio 和 policy drift 监控的基础材料。它把 KL 估计的偏差、方差、非负性和控制变量关系讲清楚，也为后续区分 KL 诊断值与 KL loss gradient 提供了清晰入口。
