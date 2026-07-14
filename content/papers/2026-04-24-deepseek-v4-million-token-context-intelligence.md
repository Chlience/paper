# DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence 论文笔记

First-Archived-At: 2026-04-25 14:30
Updated-At: 2026-07-14 09:50

## Source

- Title: DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence
- Official release: https://api-docs.deepseek.com/news/news260424
- arXiv: https://arxiv.org/abs/2606.19348v1
- HTML: https://arxiv.org/html/2606.19348v1
- TeX Source: https://arxiv.org/e-print/2606.19348
- DOI: https://doi.org/10.48550/arXiv.2606.19348
- Technical report PDF: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek_V4.pdf
- Model card: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro
- Model collection: https://huggingface.co/collections/deepseek-ai/deepseek-v4
- Inference code: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/tree/main/inference
- Authors: DeepSeek-AI and 318 other authors; arXiv submitter Wenfeng Liang.
- Released: 2026-04-24
- arXiv submitted: 2026-04-26
- Current version read: arXiv v1, official release, PDF, HTML/TeX source, Hugging Face model card and inference `config.json` / `model.py`, accessed 2026-06-24.
- Subjects: Computation and Language (cs.CL); Artificial Intelligence (cs.AI); model architecture, MoE systems, long-context inference, post-training, agentic AI.
- Review / OpenReview: 未发现 DeepSeek-V4 官方公开审稿 forum；OpenReview 检索主要返回引用该报告的其它论文或附件。

## 作者与关系

- DeepSeek-AI: DeepSeek-AI.
- Appendix Research & Engineering: 报告按 first name 字母序列出大量作者，且用 `*` 标记已离队成员。完整列表过长，本笔记记录为 DeepSeek-AI 组织论文。
- 与 DeepSeek-R1 / DeepSeek-V3 系谱重叠的显著作者线索包括 Wenfeng Liang、Xiao Bi、Xingkai Yu、Junxiao Song、Peiyi Wang、Shirong Ma、Zhibin Gou、Zhihong Shao、Ziyi Gao、Daya Guo、Haowei Zhang、Runxin Xu、Ruoyu Zhang、Yu Wu、Z.F. Wu、Zhuoshu Li 等。
- 与 mHC 相关作者线索：report 引用 `2512.24880` mHC 论文，DeepSeek-V4 appendix 中出现 Zhenda Xie、Huanqi Cao、Chenggang Zhao、Chengqi Deng、Jialiang Huang、Wangding Zeng、Wenfeng Liang 等与 mHC / DeepSeek 系列工程相关的同名作者。

## 一句话结论

DeepSeek-V4 的核心是把“百万 token 上下文”做成一个端到端系统能力：在扩大 Mixture-of-Experts (MoE) 规模之外，V4-Pro 用 1.6T total / 49B active parameters，V4-Flash 用 284B total / 13B active parameters，二者通过 Compressed Sparse Attention (CSA) / Heavily Compressed Attention (HCA) hybrid attention 压缩 key-value cache (KV cache) 与 attention FLOPs，通过 Manifold-Constrained Hyper-Connections (mHC) 稳定深层残差传播，通过 Muon 提升预训练收敛，再配合 deterministic kernels、heterogeneous KV cache、on-disk prefix reuse、FP4 Quantization-Aware Training (QAT)、On-Policy Distillation (OPD) 多专家合并和 agent sandbox，使 1M context、long-horizon agent、长思考推理和高效部署共同成立。

## 阅读目标与判断边界

本笔记关注：

1. DeepSeek-V4 如何从架构层降低 1M context 的 FLOPs 和 KV cache。
2. CSA / HCA、mHC、Muon、MoE、Multi-Token Prediction (MTP) 之间的角色分工。
3. DeepSeek-V4 的训练与推理 infra 如何支撑长上下文和 post-training。
4. post-training 为什么从 mixed RL 转向 specialist training + on-policy distillation。
5. 它和本地已存档 DeepSeek-R1、Muon、training-inference mismatch (TIM)、inference determinism、Lightning Attention、MiniMax-M1、Vortex、HybridFlow、tool-use RL 的关系。

判断边界：

- 该材料是 preview technical report 与 model card，很多 benchmark 来自官方或内部 evaluation framework，复现性取决于公开权重、serving stack、prompt、tool harness 和采样设置。
- DeepSeek-V4 报告强调系统 recipe，缺少若干关键 ablation：CSA vs HCA 配比、mHC 独立收益、Muon vs AdamW、OPD vs mixed RL、FP4 QAT 对能力的影响等。
- V4-Pro-Max / Flash-Max 的 benchmark 是 reasoning-effort mode 下的系统表现，包含更长上下文和更高 token budget，不能和低预算模式直接等价比较。
- 报告包含大量 agentic tool-use 和 sandbox infra，但没有公开完整训练数据、reward model、Group Relative Policy Optimization (GRPO) 超参和所有 internal benchmark 样本。

## 论文脉络

### 1. 研究问题、背景和价值

DeepSeek-R1、OpenAI o 系列和后续 reasoning models 证明 test-time scaling 可以提升推理能力，但长 CoT、长上下文检索、agentic workflow 和多轮工具调用都把 attention 变成主要瓶颈。普通 attention 在长度 $n$ 上有 $O(n^2)$ 的计算和 KV 读写压力；即使用 FlashAttention / paged KV cache 优化，1M context 和长 horizon agent 仍会受 FLOPs、KV cache、prefill、decode latency 和 serving memory 限制。

DeepSeek-V4 的问题定义是：如果未来模型需要常态化支持 1M context、长思考推理、agentic coding、search、enterprise workflow 和在线学习，那么模型架构、kernel、训练框架、KV cache、rollout service、post-training 目标必须同时重构。

### 2. 已有解决方案与不足

DeepSeek-V4 面对的是长上下文和 reasoning scaling 共同放大的系统问题：

1. 精确 dense attention：FlashAttention、paged KV cache 和 context parallelism 能降低常数和显存碎片，但 1M context 下仍保留接近二次复杂度的读写和计算压力。
2. 固定窗口 / block sparse attention：SWA、block sparse、检索式稀疏注意力能降成本，但在 token-exact retrieval、跨文档证据定位和长链依赖上存在信息遗漏风险。
3. GQA / MLA / KV cache 压缩：这些方法能减少 KV cache，但百万上下文下 decode FLOPs、prefill、state cache layout 和共享前缀复用仍是系统瓶颈。
4. 单一混合 RL：把数学、代码、agent、指令跟随等目标放入统一 RL stage 容易产生领域间干扰，DeepSeek-V4 转向 specialist training 后再用 OPD 合并。
5. 常规 rollout service：长 horizon agent 任务会出现抢占、硬件错误、sandbox 状态非幂等、token budget 变化和 length bias，需要 Write-Ahead Log (WAL)、trajectory log 与可恢复执行。

这些不足使 V4 的方法必须跨越 architecture、optimizer、kernel determinism、KV cache、post-training 和 agent infrastructure。它的重点是改变百万上下文的成本曲线，同时保留足够的局部精细信息和全局可寻址能力。

### 3. 作者可能的思考路径

V4 的出发点是一个成本曲线判断：1M context 如果只作为 demo，可以靠 serving trick 撑住；如果要进入 reasoning、agentic coding 和 enterprise workflow，训练、post-training、KV cache、prefill、decode 和复现一致性都会同时承压。单独扩大窗口会把 dense attention、KV cache 和工具轨迹的成本一起放大。

attention 侧的自然分解是把历史信息分层处理。局部邻近 token 需要精细表示，适合 sliding window / uncompressed tail；远距离证据需要可寻址，但不能让每个 query dense attend 全部历史，于是 CSA top-k compressed entries 和 HCA global compressed memory 承担长程访问。

规模继续上去后，稳定性又成为独立压力。深层 MoE 的 residual propagation、optimizer geometry、router/backbone 同步更新和 activation outlier 都可能触发 loss spike，所以 mHC、Muon、Anticipatory Routing 和 SwiGLU Clamping 服务的是训练动态稳定性。

最后，百万上下文的能力需要在 post-training 和 serving 中保持一致。batch-dependent kernels、KV cache 层级、on-disk prefix cache、TileLang / MegaMoE 和 specialist -> OPD pipeline 共同解决同一个问题：让长上下文能力从预训练设置迁移到多领域 RL、agent sandbox 和真实部署。

### 4. 核心假设或切入点

DeepSeek-V4 的核心假设是：百万 token 上下文只有在 attention 复杂度、KV cache 布局、训练稳定性和 post-training 目标同时改变时，才会从“可演示能力”变成“可常态使用能力”。具体切入点包括：

1. 长上下文能力的第一性瓶颈是成本曲线；CSA/HCA 的价值在于把 1M context 的 FLOPs 和 KV cache 降到可服务区间。
2. 压缩注意力需要局部精细分支和全局粗粒度记忆同时存在，避免只靠压缩导致 token-level 证据丢失。
3. trillion-scale MoE 的训练稳定性需要残差传播、优化器更新、router 动态和低精度路径一起控制。
4. deterministic / batch-invariant kernel 是 post-training、rollout、debug 和 train/inference alignment 的共同基础。
5. 多领域能力整合更适合 specialist training + OPD 的两阶段组织，统一 RL 混合训练容易把强领域能力相互稀释。

### 5. 总体架构

DeepSeek-V4 保留 DeepSeek-V3 的几条主线：

- Transformer decoder 架构。
- [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)：细粒度 routed experts + shared expert。
- Multi-Token Prediction (MTP)，深度仍为 1。
- auxiliary-loss-free load balancing，并加入轻量 sequence-wise balance loss 防止单序列极端不平衡。

关键新增包括：

- mHC, Manifold-Constrained Hyper-Connections：加强 residual connections。
- CSA / HCA hybrid attention：降低长上下文 attention FLOPs 和 KV cache。
- Muon optimizer：用于多数模块，AdamW 保留给 embedding、prediction head、RMSNorm 权重、mHC 静态 bias / gate 等。
- deterministic / batch-invariant kernel、TileLang、MegaMoE、heterogeneous KV cache、on-disk KV cache storage。

模型规模：

| Model | Layers | Hidden | Total Params | Activated Params | Context |
| --- | ---: | ---: | ---: | ---: | ---: |
| DeepSeek-V4-Flash | 43 | 4096 | 284B | 13B | 1M |
| DeepSeek-V4-Pro | 61 | 7168 | 1.6T | 49B | 1M |

MoE 配置：

- Flash: 1 shared expert + 256 routed experts；每 token 激活 6 routed experts；expert intermediate hidden dimension 2048。
- Pro: 1 shared expert + 384 routed experts；每 token 激活 6 routed experts；expert intermediate hidden dimension 3072。
- 前 3 个 MoE layers 使用 Hash routing，按 input token ID 的预定义 hash 选择 target experts。
- router affinity activation 从 `Sigmoid` 改为 `Sqrt(Softplus)`。

### 6. mHC：把 residual stream 扩展成受约束的多槽状态

标准 Hyper-Connections 将 residual stream 从 $\mathbb R^d$ 扩展到 $\mathbb R^{n_{\mathrm{hc}}\times d}$。第 $l$ 层更新为：

$$
X_{l+1}
=
B_lX_l+C_lF_l(A_lX_l),
$$

其中 $A_l$ 从多槽 residual state 中混出 layer input，$F_l$ 是当前 layer，$C_l$ 把 layer output 写回多槽 state，$B_l$ 则描述 residual state 自身如何传播。

DeepSeek-V4 的 mHC 把 $B_l$ 约束到 doubly stochastic matrices 的 Birkhoff polytope：

$$
B_l\in\mathcal M
=
\{M\in\mathbb R^{n\times n}\mid M\mathbf 1=\mathbf 1,\mathbf 1^\top M=\mathbf 1^\top,M\ge 0\}.
$$

这样 $\|B_l\|_2\le 1$， residual mapping 是 non-expansive，深层堆叠时更稳定。$B_l$ 由 raw parameter 经过 exponential 和 Sinkhorn-Knopp row/column normalization 投影得到，论文使用 20 次迭代。$A_l$ 和 $C_l$ 也通过 sigmoid 保证非负和有界。

直觉上，普通 residual connection 是一条主通道；mHC 把 residual state 扩成多个槽位，并用受约束的混合矩阵在槽位之间传递信息。它提供了新的 scaling axis，但代价是 activation memory、pipeline communication 和 kernel 复杂度增加。报告通过 fused mHC kernels、选择性 recomputation 和调整 DualPipe 1F1B overlap，把 mHC wall-time overhead 控制到 overlapped 1F1B pipeline stage 的 6.7%。

### 7. CSA：压缩后再 sparse attention

CSA, Compressed Sparse Attention，先把每 $m$ 个 token 的 KV 压缩成 1 个 compressed entry，再用 DeepSeek Sparse Attention 选择 top-k compressed entries 做 core attention。

Flash 和 Pro 的 CSA 共同参数：

- compression rate $m=4$。
- indexer query heads $n_h^I=64$。
- indexer head dimension $c_I=128$。
- sliding window size $n_{\mathrm{win}}=128$。

差异：

- Flash attention top-k = 512。
- Pro attention top-k = 1024。

CSA 的关键是学习 token-level compressor，直接丢 token 会带来过强的信息损失。给定 hidden states $H\in\mathbb R^{n\times d}$，先得到两组 KV entries 和 compression weights：

$$
C_a=HW_{a}^{KV},\quad C_b=HW_b^{KV},
$$

$$
Z_a=HW_a^Z,\quad Z_b=HW_b^Z.
$$

每个 compressed entry 用 $2m$ 个相邻 entry 通过 row-wise softmax 权重聚合，且相邻 compressed entry 的来源有 overlap。随后 lightning indexer 对 compressed blocks 打分：

$$
I_{t,s}
=
\sum_{h=1}^{n_h^I}
w^I_{t,h}\cdot
\mathrm{ReLU}(q^I_{t,h}\cdot K^{IComp}_s),
$$

再选 top-k compressed KV entries：

$$
C^{SprsComp}_t
=
\{C^{Comp}_s\mid I_{t,s}\in \mathrm{Top}\text{-}k(I_{t,:})\}.
$$

core attention 使用 shared key-value MQA：compressed KV entry 同时作为 key 和 value。由于 V4 的 query heads 很多，CSA/HCA 还使用 grouped output projection：先把 core attention 的多头输出按组分块，每组投到一个中间输出，再合并投回 hidden state。公开 inference config 中 Flash 的 `o_groups=8`，Pro 的 `o_groups=16`，`o_lora_rank=1024`；这一步减少大 head 数下的输出投影成本。

为保持局部精细依赖，CSA 还加入 sliding window branch，让 query 额外访问最近 $n_{\mathrm{win}}$ 个 uncompressed KV entries。

### 8. HCA：更重压缩后 dense attention

HCA, Heavily Compressed Attention，目标是更激进地压缩历史。它把每 $m'$ 个 token 压缩成 1 个 KV entry，省去 sparse top-k，在压缩后的 KV 上做 dense attention。

DeepSeek-V4 中：

$$
m'=128.
$$

HCA 的压缩形式是：

$$
C=HW^{KV},\qquad Z=HW^Z,
$$

$$
S_{m'i:m'(i+1)-1}
=
\mathrm{Softmax}_{row}(Z_{m'i:m'(i+1)-1}+B),
$$

$$
C^{Comp}_i
=
\sum_{j=m'i}^{m'(i+1)-1}
S_j\odot C_j.
$$

HCA 的角色是用极低 KV 长度保留全局粗粒度信息；CSA 的角色是用较轻压缩 + top-k 选择保留更强的可寻址性。报告正文说二者采用 interleaved hybrid configuration，公开 inference config 把这件事落实成每层一个 `compress_ratio`：

| `compress_ratio` | 层内路径 | 含义 |
| ---: | --- | --- |
| `4` | CSA | overlap compressor 产生 compressed KV，lightning indexer 选择 top-k compressed entries，再与 sliding-window uncompressed KV 一起进入 core attention。 |
| `128` | HCA | non-overlap compressor 产生更粗的 compressed KV，省去 DSA top-k，对全部 compressed entries 加上 sliding-window uncompressed KV 做 attention。 |
| `0` | compressed branch disabled | 只保留 sliding-window/uncompressed local path；公开 config 主要用于模型开头或 MTP block。 |

按公开 `compress_ratios` 展开，V4 的 hybrid attention 是跨层交错：

| Model | Main Transformer layers | CSA layers | HCA layers | `0` ratio main layers | Extra MTP slot |
| --- | ---: | ---: | ---: | ---: | --- |
| DeepSeek-V4-Flash | 43 | 21 层：2,4,...,42 | 20 层：3,5,...,41 | 2 层：0,1 | 1 个 `0` ratio slot |
| DeepSeek-V4-Pro | 61 | 30 层：2,4,...,60 | 31 层：0,1,3,5,...,59 | 0 | 1 个 `0` ratio slot |

这意味着 “hybrid” 的主要实现方式是层级交错：CSA 层负责可寻址的稀疏远程访问，HCA 层负责低成本的全局粗粒度汇聚，所有 compressed attention 层都叠加 128-token sliding-window local branch。V4-Pro 前两层先用 HCA 压缩，V4-Flash 前两层关闭 compressed branch；这类层级配比来自 inference config，报告正文没有给出消融解释。

### 9. CSA/HCA 其它细节

- Query / KV entry RMSNorm：在 core attention 前对每个 query head 和 compressed KV entry 做 RMSNorm，避免 attention logits 爆炸。
- Partial RoPE：对 query、KV entry 和 core attention output 的最后 64 维应用 RoPE；由于 compressed KV entry 同时作为 key 和 value，output 也做位置修正，使其携带相对位置信息。
- Sliding Window Attention branch：每个 query 额外访问最近 128 个 uncompressed KV entries，补足 block 内/近邻 token 信息。
- Attention Sink：为每个 head 加 learnable sink logit，让总 attention mass 可以小于 1，甚至接近 0。
- KV storage precision：RoPE dimensions 用 BF16，其余 KV dimensions 用 FP8，使 KV cache 约减半。
- CSA lightning indexer attention 使用 FP4，long-context 下加速 indexer 计算。
- top-k selector 中 index scores 从 FP32 到 BF16，报告称 2x 加速且保持 99.7% KV recall。

1M context 下，报告给出的效率结论：

- 相比 DeepSeek-V3.2，V4-Pro single-token inference FLOPs 为 27%，KV cache 为 10%。
- 相比 DeepSeek-V3.2，V4-Flash single-token inference FLOPs 为 10%，KV cache 为 7%。
- 相比 BF16 GQA8 / head dimension 128 baseline，V4 系列 KV cache 在 1M context 下约为 2%。

### 10. Muon optimizer

DeepSeek-V4 使用 Muon 更新大多数权重，AdamW 保留给 embedding、prediction head、RMSNorm、mHC static biases / gating factors 等模块。Muon 的主流程是：

$$
G_t=\nabla_W\mathcal L_t(W_{t-1}),
$$

$$
M_t=\mu M_{t-1}+G_t,
$$

$$
O'_t=\mathrm{HybridNewtonSchulz}(\mu M_t+G_t),
$$

$$
O_t=O'_t\cdot \sqrt{\max(n,m)}\cdot \gamma,
$$

$$
W_t=W_{t-1}(1-\eta\lambda)-\eta O_t.
$$

Hybrid Newton-Schulz 总共 10 步：前 8 步用 $(a,b,c)=(3.4445,-4.7750,2.0315)$ 快速把 singular values 推近 1，后 2 步用 $(2,-1.5,0.5)$ 稳定到 1。报告特别说明，V4 的 attention query / KV RMSNorm 能避免 attention logits 爆炸，因此没有使用 QK-Clip。

### 11. General infrastructures

DeepSeek-V4 的系统贡献很重，报告几乎把模型架构和 infra 绑定起来。这里需要把 expert waves、KV cache 和 rollout infra 写到机制层，否则只保留加速数字会丢掉这篇技术报告最有价值的部分。

| 子系统 | 原始瓶颈 | V4 做法 | 直接收益 |
| --- | --- | --- | --- |
| Fine-grained Expert Parallelism (EP) / MegaMoE | MoE dispatch、expert GEMM、combine 之间存在批级等待，小 batch rollout 更难隐藏通信 | 把 experts 切成多个 expert waves，并在 mega-kernel 内调度 wave 级 pipeline | 一般 inference workloads 相对 non-fused baselines 加速 1.50 到 1.73x；RL rollout / agent serving 最高 1.96x |
| TileLang kernel stack | 手写 fused kernel 成本高，数值一致性和 host 调用也要一起处理 | 支持 host codegen、SMT solver assisted integer analysis、精度控制和 bitwise reproducibility | 更快迭代 fused kernels，并服务 exact KL、deterministic kernel 等路径 |
| Batch-invariant deterministic kernels | attention / matmul / sparse backward / MoE backward 的 batch 形状和并行归约会改变 bit pattern | attention、matmul、attention backward、MoE backward、mHC small matmul 都做确定性实现 | 支撑 pretraining、post-training、rollout、debug 和 train/inference alignment |
| Contextual Parallelism (CP) for CSA/HCA | sequence packing 后 compressed KV length 不齐，压缩块还会跨 CP rank 边界 | two-stage communication：先传边界 uncompressed KV，再 all-gather compressed KV，并用 fused select-and-pad 重排 | 让 compressed attention 在长序列训练中继续使用 CP |
| KV cache / on-disk prefix cache | CSA、HCA、SWA、indexer 和 uncompressed tail 的 cache 尺寸、更新规则不同，PagedAttention 假设被破坏 | 分成 classical KV cache 与 state cache；磁盘只完整存 compressed KV，SWA 提供三种存储策略 | 降低 1M context serving memory，并支持 shared-prefix request 复用 |
| RL / OPD rollout infra | 百万 token rollout 的 per-token 字段、teacher logits、抢占和 sandbox 状态都会放大内存与正确性风险 | teacher hidden-state cache、token-granular WAL、metadata/heavy fields 分离、DSec trajectory log | 让 OPD、长上下文 RL、agentic evaluation 在生产集群里可恢复、可追溯 |

Fine-grained EP 的关键在 expert waves。常规 EP 路径会把 token all-to-all、expert 计算和结果回传组织成较粗的阶段；当 batch 足够大时，GEMM 可以覆盖一部分通信，RL rollout 和高吞吐 agent serving 中的长尾小 batch 会让通信暴露出来。V4 把专家集合切成多个 wave，每个 wave 只包含一小部分 experts；某个 wave 内专家的通信完成后，就立刻启动 Linear-1、activation、Linear-2，无需等待其它 experts。

wave pipeline 的 steady state 可以写成下表：

| 时刻 | 当前 wave | 下一 wave | 已完成 wave |
| --- | --- | --- | --- |
| warmup | 接收 routed tokens | 等待调度 | 无 |
| steady state | 执行 expert compute | 继续 token transfer | 发送 combine 结果 |
| drain | 完成剩余 compute | 无 | 完成结果回传 |

这样，MoE 路径从“批级 all-to-all + GEMM + combine”变成 wave 级流水线。报告强调 full overlap 取决于 computation-communication ratio，而不只取决于带宽；按 V4-Pro 的 token-expert pair 计算量和通信量估算，每 1 GBps interconnect bandwidth 可以隐藏约 6.1 TFLOP/s compute。报告还记录了几个硬件/实现启发：dispatch 阶段采用 pull-based remote read 以避免细粒度 push 的通知延迟；mega-kernel 会同时拉高 compute、memory、network 负载，因此 power headroom 也会限制性能；更低延迟的跨 GPU signaling 会让未来的 push primitive 更自然。

KV cache 也需要单独读。DeepSeek-V4 的 hybrid attention 同时引入 CSA/HCA compressed KV、CSA lightning indexer KV、Sliding Window Attention (SWA) KV 和未满压缩块的 uncompressed tail state。它们的大小、可见范围、eviction 规则和对齐要求都不同，所以不能简单套用单一 PagedAttention block abstraction。V4 把 cache 拆成两类：

| Cache 类型 | 存储内容 | 关键约束 |
| --- | --- | --- |
| classical KV cache | CSA/HCA compressed KV entries；每个 cache block 覆盖一段原始 tokens 并产生对应 compressed entries | block 大小需要兼容 CSA ratio 4 与 HCA ratio 128；可用二者 least common multiple 的倍数处理不同层 |
| state cache | 最近 SWA KV entries，以及 CSA/HCA 尚未凑满压缩块的 uncompressed tail states | 每个 sequence 分配固定大小 state cache，状态随当前位置更新 |
| on-disk compressed cache | 共享前缀的 CSA/HCA compressed KV entries | 命中前缀时可直接读 compressed entries；末尾不完整压缩块需要重新 prefill |
| on-disk SWA cache | full caching、periodic checkpointing、zero caching 三种策略 | SWA 体积约为 compressed CSA/HCA KV 的 8 倍，需要在存储写入量和重算量之间取舍 |

Post-training infra 的几个细节也应保留。full-vocabulary OPD 采用 teacher hidden-state cache：系统缓存 teacher last-layer hidden states，训练时按 teacher head 重构 logits，避免物化所有 teacher logits；样本按 teacher index dispatch，使一个 mini-batch 内最多只加载一个 teacher head，并用 TileLang kernel 计算 exact KL。rollout service 使用 token-granular Write-Ahead Log (WAL)：每生成一个 token 就写日志，抢占时保存未完成请求的 KV cache；硬件错误后可用 WAL tokens 重建 KV cache。报告特别指出，从头重采未完成请求会引入 length bias，因为短回复更容易在中断前完成。DSec sandbox 再用 Function Call、Container、microVM、fullVM 四种 substrate 和 trajectory log 处理 agent 任务的非幂等执行、抢占恢复和 provenance。

这些内容和本地已存档的 inference determinism / TIM 主题高度相关：V4 明确把 batch invariance、bitwise deterministic 和 train/inference alignment 当成生产级基础设施，debug 只是其中一个使用场景。

### 12. Pre-training

数据：

- DeepSeek-V4-Flash 使用 32T tokens。
- DeepSeek-V4-Pro 使用 33T tokens。
- 数据包含数学、代码、网页、长文档、科学论文、技术报告、多语言与 agentic coding data。
- 继续沿用 DeepSeek-V3 tokenizer，vocab size 128K；增加少量 context construction special tokens。
- 采用 sample-level attention masking。

训练 schedule：

- Flash max batch size 75.5M tokens，peak LR $2.7\times 10^{-4}$，end LR $2.7\times 10^{-5}$。
- Pro max batch size 94.4M tokens，peak LR $2.0\times 10^{-4}$，end LR $2.0\times 10^{-5}$。
- sequence length 从 4K 渐进扩到 16K、64K、1M。
- Flash 前 1T tokens 先用 dense attention warmup；在 64K length 引入 sparse attention。
- sparse attention 引入时先 warm up CSA lightning indexer，再长时间 sparse attention 训练。

训练稳定性：

- Anticipatory Routing：step $t$ 用当前网络参数 $\theta_t$ 算 features，但 routing indices 使用历史参数 $\theta_{t-\Delta t}$ 预计算。目标是打断 router 与 backbone 同步更新造成的 outlier 正反馈。系统只在 loss spike 后短时触发该模式，并把额外 wall-clock overhead 限制到总体可忽略。
- SwiGLU Clamping：SwiGLU linear component clamp 到 $[-10,10]$，gate component upper bound clamp 到 10，用于抑制 MoE outliers。

### 13. Post-training

V4 post-training 的关键变化是：用 specialist training + OPD 取代混合 RL 合并阶段。

第一阶段：specialist training。

- 按 mathematics、coding、agent、instruction following 等域分别训练 expert models。
- 每个 expert 先做 domain-specific Supervised Fine-Tuning (SFT)，再用 GRPO 做 RL。
- 为三种 reasoning effort mode 训练不同配置：Non-think、Think High、Think Max。
- 不同 mode 使用不同 length penalty 与 context window，控制 reasoning token 长度。
- Think Max 通过特殊 system prompt 诱导最大 reasoning effort。

第二阶段：multi-teacher OPD, On-Policy Distillation。

统一 student policy 在自己的 on-policy trajectories 上学习多个 teacher 的 full-vocabulary logits。目标写成：

$$
\mathcal L_{\mathrm{OPD}}(\theta)
=
\sum_{i=1}^{N}
w_i\cdot
D_{\mathrm{KL}}(\pi_\theta\|\pi_{E_i}).
$$

报告强调 full-vocabulary reverse KL 比 token-level KL estimate 方差更低、更稳定。工程上，为避免 materialize 超过 100K vocab 的多 teacher logits，系统只缓存 teacher last-layer hidden states，训练时再通过对应 prediction head 重构 logits，并用 TileLang kernel 计算 exact KL。

其它 post-training 机制：

- Generative Reward Model (GRM)：hard-to-verify tasks 使用 rubric-guided RL data 和 GRM；actor 本身也作为 GRM，联合提升 judging 与 generation。
- Tool-call schema：引入 `|DSML|` special token 和 XML-style tool invocation，降低 escaping failures 和 tool-call errors。
- Interleaved thinking：tool-calling 场景保留跨轮 reasoning history；普通对话新用户消息到来时仍丢弃旧 reasoning content。
- Quick Instruction：用 `<|action|>`、`<|query|>`、`<|authority|>` 等 special tokens 复用已有 KV cache 执行辅助任务，减少小模型重复 prefill。
- FP4 QAT：MoE expert weights 和 CSA indexer QK path 做 FP4 quantization-aware training；inference / rollout 使用 native FP4 quantized weights，保持采样与部署一致。
- Token-granular WAL rollout service：可抢占 rollout 中每生成一个 token 就写 WAL，并保存未完成请求 KV cache；硬件错误时可用 WAL 重建，避免从头重采导致 length bias。
- DSec sandbox：Rust API gateway / Edge / Watcher + 3FS，支持 Function Call、Container、microVM、fullVM 四种执行 substrate，并做 trajectory logging 和 preemption-safe resumption。

### 14. Evaluation chain

Base model 对比：

- V4-Flash-Base 以 13B active / 284B total，在多数 benchmark 上超过 V3.2-Base 的 37B active / 671B total，说明架构效率和数据/训练改进带来很强 parameter efficiency。
- V4-Pro-Base 以 49B active / 1.6T total，在 world knowledge、long-context、coding、math 多数项超过 V3.2-Base 和 V4-Flash-Base。
- 关键数值：V4-Pro-Base MMLU-Pro 73.5、Simple-QA verified 55.2、FACTS Parametric 62.6、LongBench-V2 51.5；V3.2-Base 对应为 65.5、28.3、27.1、40.2。

Instruct / Max mode：

- DS-V4-Pro Max 在 LiveCodeBench pass@1 达 93.5、Codeforces rating 3206、Apex Shortlist 90.2、SWE Verified 80.6。
- 长上下文：MRCR 1M MMR 83.5，CorpusQA 1M ACC 62.0；报告称 MRCR 超过 Gemini-3.1-Pro，但低于 Claude Opus 4.6。
- Agent：Terminal Bench 2.0 为 67.9，MCPAtlas Public 73.6，Toolathlon 51.8。
- 与闭源 frontier 比较中，V4-Pro Max 在 coding 和部分 long-context/agent tasks 很强，在 GPQA、HLE、Apex、GDPval-AA 等仍落后最强闭源模型。

真实任务：

- 中文 functional / creative writing 中，V4-Pro 相对 Gemini-3.1-Pro 在官方内部评测中胜率较高；但在最难 high-complexity / multi-turn prompts 上 Claude Opus 4.5 仍有优势。
- Search：agentic search 优于 retrieval-augmented generation (RAG)，且成本略高于标准 RAG。
- White-collar tasks：30 个中文专业任务，人评中 V4-Pro-Max 相对 Opus-4.6-Max non-loss rate 63%，主要强在 task completion 和 content quality。
- Internal R&D coding benchmark：30 个高质量任务，V4-Pro-Max pass rate 67%，接近 Opus 4.5 的 70，低于 Opus 4.6 Thinking 的 80。

## 关键实验/定理

### 结果 1：1M context efficiency

- 设置：比较 DeepSeek-V3.2、DeepSeek-V4-Pro、DeepSeek-V4-Flash 在 1M context 下 single-token inference FLOPs 和 accumulated KV cache。
- Baseline：DeepSeek-V3.2 是同系列前代强基线，BF16 GQA8 / head dimension 128 是 KV cache 理论参照。这个实验的 baseline 较清楚，能直接回答 CSA/HCA 与新 KV layout 对 1M context 成本曲线的影响。
- 指标：等效 FP8 FLOPs、KV cache size。
- 结果：V4-Pro 为 V3.2 的 27% FLOPs 和 10% KV cache；V4-Flash 为 V3.2 的 10% FLOPs 和 7% KV cache。
- 解读：这是这篇报告最核心的系统证据。V4 的价值首先来自长上下文成本曲线改变，再由更大模型和 post-training 转化为能力。

### 结果 2：Base model 能力与 parameter efficiency

- 设置：V3.2-Base、V4-Flash-Base、V4-Pro-Base 在统一内部框架评测。
- Baseline：V3.2-Base 是直接前代基线；V4-Flash-Base 与 V4-Pro-Base 形成同一新架构下小 active / 大 active 对照。该组 baseline 能支持 parameter efficiency 判断，但训练数据、token budget、context schedule 和架构同时变化，不能把收益完全归因给某一个模块。
- 指标：world knowledge、language reasoning、code/math、long context。
- 结果：V4-Flash-Base 用更小 active parameters 在多数项超过 V3.2-Base；V4-Pro-Base 在 MMLU-Pro、Simple-QA verified、FACTS Parametric、LongBench-V2 等任务有显著提升。
- 解读：支持“架构 + 数据 + 训练优化”共同提升；参数扩大只是其中一个因素。

### 结果 3：Reasoning effort modes

- 设置：Non-think、High、Max 三种模式，V4-Flash 和 V4-Pro。
- Baseline：Non-think 是同模型低 reasoning budget 基线，High / Max 是逐步增加 test-time compute 的对照；Flash 与 Pro 还提供模型规模对照。这个设置能说明 token budget 的边际价值，但 Max mode 的特殊 prompt 和更高预算需要和默认 API 体验区分。
- 指标：MMLU-Pro、GPQA Diamond、HLE、LiveCodeBench、Codeforces、HMMT、IMOAnswerBench、Apex、agent benchmarks。
- 结果：复杂任务上 Max 通常优于 High，High 显著优于 Non-think。例如 V4-Pro HLE 从 7.7 到 34.5 到 37.7，LiveCodeBench 从 56.8 到 89.8 到 93.5。
- 解读：V4 沿用并系统化了 test-time compute scaling。对知识任务，参数规模仍关键；对 reasoning/code，token budget 能大幅提升表现。

### 结果 4：Agentic workloads

- 设置：SWE、Terminal Bench、BrowseComp、HLE with tools、MCPAtlas、Toolathlon、内部 R&D coding benchmark。
- Baseline：公开 benchmark 中对比 DeepSeek-V3.2、DeepSeek-R1 系列、其它开源/开放权重模型和闭源 frontier；内部 R&D coding benchmark 主要对照 Claude Opus 4.5 / 4.6 Thinking 等强闭源模型。agent baseline 强度取决于同一 harness、工具策略、timeout、上下文管理和 prompt disclosure。
- 指标：resolved / acc / pass@1 / Elo / internal pass rate。
- 结果：V4-Pro-Max SWE Verified 80.6，Terminal Bench 67.9，MCPAtlas Public 73.6，内部 R&D coding pass rate 67。
- 解读：报告显示 V4 已是强 agentic model，但在 Terminal Bench、SWE Pro、HLE with tools、GDPval-AA 等任务上仍和最强闭源模型存在差距。agent 结果强依赖 harness 和 tool policy。

### 结果 5：Infrastructure ablations in spirit

- 设置：MegaMoE fused EP / expert waves、mHC optimized implementation、deterministic kernels、FP4 QAT、OPD teacher scheduling、WAL rollout service。
- Baseline：MegaMoE 使用 non-fused EP 作为吞吐基线；expert waves 的对照重点是粗粒度 dispatch/compute/combine path 是否能隐藏通信；mHC 报告 optimized implementation 的 wall-time overhead；FP4 top-k selector 对比更高精度/更慢路径；OPD 和 WAL rollout 主要是机制描述，缺少完整公开消融。该组证据适合记录工程可行性，严格组件因果仍需独立 ablation。
- 指标：wall-clock overhead、speedup、memory pressure、stability。
- 结果：fine-grained EP 相对 non-fused baselines 加速 1.50 到 1.73x，latency-sensitive 最高 1.96x；报告给出 1 GBps interconnect bandwidth 可隐藏约 6.1 TFLOP/s compute 的 V4-Pro 平衡点；mHC overhead 控制到 6.7%；FP4 top-k selector 2x 加速且 KV recall 99.7%。
- 解读：这类证据偏工程报告，但对理解大模型落地很关键。expert waves 说明 V4 的 MoE serving 优化重点在于把通信暴露窗口缩到 wave 级，并让小 batch rollout 也能持续重叠通信、计算和 combine。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 模型设置 | DeepSeek-V4-Pro 为 1.6T total / 49B active MoE；DeepSeek-V4-Flash 为 284B total / 13B active MoE；二者支持 1M context，并使用 CSA/HCA hybrid attention、mHC、Muon、MTP、DeepSeekMoE 与 low-precision KV/cache path |
| Attention layer schedule | Flash main Transformer layers: ratio `0,0,4,128,4,128,...,4`，对应 21 个 CSA 层、20 个 HCA 层和前 2 个 compressed branch disabled 层；Pro main Transformer layers: `128,128,4,128,4,128,...,4`，对应 30 个 CSA 层和 31 个 HCA 层。两者公开 config 还为 MTP block 保留 1 个 `0` ratio slot。 |
| 训练设置 | Flash 使用 32T tokens；Pro 使用 33T tokens；sequence length 从 4K 渐进到 16K、64K、1M；Flash 前 1T tokens 做 dense attention warmup，后续引入 sparse / compressed attention 训练 |
| post-training 设置 | mathematics、coding、agent、instruction following 等域做 specialist SFT + GRPO，再通过 full-vocabulary OPD 合并到统一 student；同时引入 GRM、tool-call schema、interleaved thinking、Quick Instruction、FP4 QAT、token-granular WAL rollout 和 DSec sandbox |
| 技术报告训练配置 | 披露 Flash/Pro token budget、batch size / LR schedule、dense warmup、sparse attention 引入、Anticipatory Routing 与 SwiGLU Clamping；预览报告尚未给完整训练账本 |
| 未披露项 | 训练 GPU 数、硬件型号、节点数、并行度、wall-clock、GPU hours、美元成本、完整 OPD / GRM / RL 超参和 ablation grid |
| baseline 强度 | 1M context efficiency 的基线最直接；base model 和 reasoning modes 有同系列强对照；agent benchmark baseline 覆盖强模型但受 harness 影响；infra 部分提供关键数值但公开消融有限 |
| 可比性限制 | 大量 benchmark 使用官方或内部 evaluation framework；prompt、sampling、reasoning effort、tool budget、timeout、judge、context management 和 Max mode token budget 会改变横向排名 |
| 统计限制 | 报告主要给单点结果和系统指标，较少提供多 seed、置信区间、完整 ablation grid、第三方复现脚本和统一 agent harness 配置 |

## 证据链强度评估

### 强证据

- PDF 给出了完整架构、模型规模、CSA/HCA 公式、训练 schedule、post-training pipeline、inference cache layout 和大量工程细节。
- 模型权重、model card、inference 代码公开，便于后续复验至少一部分推理行为和部署约束。
- 1M context FLOPs / KV cache reduction、model size、训练 token 数、CSA/HCA 参数等是相对具体的系统指标。

### 中等强度证据

- benchmark 覆盖广，包含 base model、instruct modes、long-context、agent 和内部真实任务，但大量评测由 DeepSeek 内部框架完成，prompt/harness/采样细节不完全开放。
- OPD、GRM、FP4 QAT、Quick Instruction、interleaved thinking 等设计描述清楚，但缺少单独 ablation。
- 训练稳定性方法 Anticipatory Routing / SwiGLU Clamping 是实用经验总结，报告承认机制尚未完全理解。

### 需要谨慎的推论

- “best open model” 类结论随 benchmark、采样预算、tool harness 和模型更新很快变化；更稳妥的长期结论是 V4 把 1M context efficiency 与强 open MoE 能力结合到同一个系统里。
- V4-Pro-Max 的能力包含更高 reasoning effort 和特殊 prompt；与普通 API 默认模式、low-latency mode 的体验存在差异。
- long-context benchmark MRCR / CorpusQA 不能完全代表真实 1M context agent workload；真实 workflow 还受 prompt structure、tool outputs、cache reuse、retrieval quality 和 memory policy 影响。
- CSA/HCA 的信息压缩可能对某些 token-exact retrieval、稀有事实定位、多跳依赖和跨文档 attribution 有损失，需要更多公开 stress tests。

## OpenReview / 审稿意见吸收

- 公开状态：截至 2026-06-24，本轮检索未发现 DeepSeek-V4 对应的官方 OpenReview forum 或公开 reviewer 评分；OpenReview 搜索结果主要是其它论文引用 DeepSeek-V4 技术报告。
- Venue 判断：当前按 arXiv 技术报告 + 官方 release/model card 处理，证据强度来自 arXiv HTML/TeX/PDF、Hugging Face 权重与推理代码、官方 API docs release 和后续第三方引用。
- 可吸收的外部审稿式问题：CSA/HCA/mHC/Muon 的单独 ablation 是否充分；1M context benchmark 是否能代表真实 repo、enterprise workflow 和 multi-session agent；Max mode 的 token budget 与普通部署是否可比；FP4/FP8 low-precision path 对 rare-token retrieval、indexer top-k 和 train/inference logprob consistency 的影响；agent benchmark harness 是否透明。
- 对归档判断的影响：把 DeepSeek-V4 作为 million-token context system report 和 DeepSeek 系列节点引用时证据较强；把具体组件的独立因果收益作为结论时，需要额外消融、统一 benchmark 或第三方复现支撑。

## 本地讨论补充

### 1. 初版分析收敛

- DeepSeek-V4 和 [2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/) / [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 是同一大趋势下的两条路线：都把 long-output / long-context 成本视为 reasoning scaling 的核心瓶颈。Lightning Attention 用 linear / recurrent state；DeepSeek-V4 用 compressed sparse / heavily compressed attention。
- V4 的 attention 仍保留 softmax-style core attention，只是在 KV 维度和可见 blocks 上做压缩与选择。它和 Lightning Attention 的差异是：V4 牺牲 token-level完整 KV 可见性，通过学习压缩、top-k indexer、sliding window 和 HCA global compressed memory 来换取 1M context 可用性。
- V4 的 deterministic / batch-invariant kernels 说明 inference determinism 不再只是服务端复现问题，也直接进入 post-training、RL rollout、OPD、debug 和 train/inference alignment。

### 2. CSA/HCA interleaved 检查补充

- CSA/HCA 的 interleaved 使用需要写成层级 schedule。公开 inference config 显示，V4-Pro 在 main Transformer blocks 中使用 31 个 HCA 层和 30 个 CSA 层；V4-Flash 使用 21 个 CSA 层、20 个 HCA 层，并在前两层关闭 compressed branch。
- `compress_ratio=4` 对应 CSA，触发 overlap compression 和 lightning indexer top-k；`compress_ratio=128` 对应 HCA，使用更重压缩和 compressed entries dense attention；`compress_ratio=0` 关闭 compressed branch，只走 sliding-window local path。
- 这次补充把 DSA 原始报告和 V4 连接得更清楚：V4 的 CSA 是 DSA 在 compressed KV entries 上的后续形态，HCA 负责另一条极重压缩的全局记忆路径。

### 3. expert waves / KV cache / rollout infra 检查补充

- expert waves 应该写入正文。它解释了 MegaMoE 的加速来源：按 expert wave 切分后，当前 wave 的 Linear-1/activation/Linear-2、下一 wave 的 token transfer、上一 wave 的 result sending 可以同时进行。该机制尤其服务 RL rollout 和高速 agent serving 中的长尾小 batch。
- V4 的 infra 还包含 kernel speedup 之外的系统判断。报告把 computation-communication ratio、pull-based dispatch、power headroom、communication primitive 延迟写成硬件协同建议；这些细节能帮助后续和 UltraEP、DeepEP、MoE serving 系统对照。
- heterogeneous KV cache 需要和 CSA/HCA 一起读：classical KV cache 存 compressed entries，state cache 存 SWA 与未满压缩块的 tail states；on-disk prefix cache 对 compressed KV 直接复用，对 SWA 在 full caching / periodic checkpointing / zero caching 之间取舍。
- OPD / WAL / DSec 的细节也有长期价值。teacher hidden-state caching 解决 full-vocabulary OPD 的 logits 物化问题；token-granular WAL 避免抢占后的 length bias；DSec trajectory log 处理 agent sandbox 的非幂等命令与 deterministic replay。

### 4. 后续复验指标

- 在公开权重上复测 MRCR、CorpusQA、needle-in-haystack、multi-hop QA、long-context code repo tasks，区分 compression error 与模型能力。
- 比较 V4-Pro / V4-Flash 在相同 reasoning token budget 下的 knowledge、reasoning、agent 差距，避免把 Max mode budget 当成模型本体能力。
- 对 CSA/HCA 做可解释性探针：layer-wise CSA top-k compressed block recall、sliding window dependence、HCA global memory 是否覆盖关键证据，以及 CSA/HCA/ratio-0 层级交错对不同任务的贡献。
- 对 OPD 做教师选择敏感性测试：不同 teacher weights $w_i$、full-vocab KL vs token-level KL、on-policy sample distribution 对最终能力的影响。
- 对 FP4 QAT 和 native FP4 rollout 做 train/deploy consistency 检查，特别是 CSA indexer QK path。
- 对 MegaMoE 做小 batch stress test：比较 expert wave 数量、EP group、interconnect bandwidth、pull/push dispatch primitive、power cap 对 RL rollout 和 agent serving latency 的影响。

## 主要启发

- 长上下文模型的关键同时覆盖 attention formula、KV cache layout、prefix reuse、state cache、disk cache、kernel determinism、rollout recovery 和 post-training data format。
- V4 提供了 DeepSeek 对“百万上下文智能”的系统定义：1M context 是 architecture + systems + post-training + product routing 的结果。
- Specialist RL + OPD 是一个值得跟踪的 post-training 方向。它把“多领域专家”合进一个 unified model，规避 weight merging 和 mixed RL 的退化风险。
- Tool-use 和 agentic training 的正确性进入系统层：WAL 避免抢占导致 length bias，sandbox trajectory log 避免非幂等命令重放错误。
- mHC、Muon、Anticipatory Routing、SwiGLU Clamping 显示 trillion-scale MoE 的稳定性越来越依赖残差传播、优化器几何和 router/backbone 动态。

## 局限

1. 该报告已有 arXiv HTML/TeX/PDF 与 Hugging Face model card/code，但仍缺完整训练代码、所有数据组成、reward model 和 GRPO 细节。
2. CSA/HCA hybrid attention 缺少系统性公开 ablation，难以单独判断 compression、sparse top-k、HCA、sliding window、attention sink 各自贡献。
3. V4 的 benchmark 很强，但大量结果来自内部框架和官方评测；第三方复验需要统一 prompt、sampling、tool harness、context management 和 token budget。
4. Anticipatory Routing 与 SwiGLU Clamping 机制解释仍不充分，当前更像经验性稳定化 recipe。
5. 1M context 的实际价值需要更多真实场景验证，例如 cross-document citation、long repo editing、multi-session agent memory、long-horizon planning 和在线学习。
6. FP4/FP8/低精度路径对 rare-token retrieval、indexer top-k 和 train/inference logprob consistency 的影响需要更细评估。

## 跨论文关系

- 与 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/)：DeepSeek-R1 是 reasoning RL / GRPO / verifiable reward 的上游节点；DeepSeek-V4 把这条路线推向 1M context、agentic tool-use、specialist RL 和 OPD 统一模型。
- 与 [DeepSeek-V3.2 / DSA](/papers/2512.02556-deepseek-v3-2-open-large-language-models/)：V4 的 CSA 是 DeepSeek Sparse Attention 在 compressed KV entries 上的后续形态。CSA 层使用 `compress_ratio=4`、lightning indexer 和 top-k sparse selection；HCA 层使用 `compress_ratio=128` 和 dense compressed attention，二者跨层交错构成 V4 的 hybrid attention stack。
- 与 [2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/)：V4 是 Muon 大规模 LLM 训练的系统应用案例；Muon 论文解释其曲率优势，V4 报告展示其在 trillion-scale MoE 中的工程化使用。
- 与 [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)：V4 明确把 batch-invariant / deterministic kernels 和 train-inference bitwise alignment 做成内核库目标，和这两篇关于 nondeterminism / TIM 的问题定义直接相接。
- 与 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)：UltraEP 讨论 MoE training / serving prefill 的 expert load balancing，V4 报告展示 DeepSeek 自身在 fine-grained EP、MegaMoE expert waves、communication-computation overlap、MoE determinism 上的工程方案。
- 与 [2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/) 和 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/)：三者都服务 long context / long output。Lightning Attention 用 recurrent/linear attention 降低长序列成本；MiniMax-M1 把 Lightning Attention 放进 long-output RL；DeepSeek-V4 用 CSA/HCA compressed attention 与 KV cache systems 支撑 1M context。
- 与 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/)、[2511.02749](/papers/2511.02749-span-queries-cache-attention-locality/) 和 [2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/)：V4 从模型内部压缩 KV 和 attention；这些 serving 论文从 sparse attention DSL、span query/cache locality、application DAG 显式化角度降低真实 workload 成本。
- 与 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 和 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/)：V4 post-training 展示了 ultra-long-context RL/OPD、rollout WAL、sandbox infra 和 tool-call schema 的生产级实现，补充了 RLHF/RLVR systems 与 tool-use RL 的工程侧细节。
- 关系状态：本笔记的 `跨论文关系` 已将 DeepSeek-V4 连接到 DeepSeek-R1、Muon、TIM、inference determinism、Lightning Attention、MiniMax-M1、UltraEP、Vortex、HybridFlow 和 tool-use RL。

## Reference Intake Brief

### Target

- Intended target system: 维护论文笔记 / DeepSeek-V4 long-context architecture 与 system report 文档。
- Existing related assets: `content/utility/papers-index.md`；已存档 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/)、[2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/)、[2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)、[2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/)。
- Proposed form: 维护独立 Markdown 文档，并同步 `content/utility/papers-index.md`。

### Reusable Elements

1. CSA / HCA hybrid attention 的压缩、sparse top-k、sliding window、attention sink、layer-wise interleaving 分解。
2. 1M context FLOPs 和 KV cache reduction 数值。
3. mHC residual stream 扩展与 Birkhoff polytope/Sinkhorn 稳定性语言。
4. Muon 在 trillion-scale MoE 中的工程配置。
5. fine-grained EP / MegaMoE expert waves，把 dispatch、expert compute 和 combine 变成 wave-level pipeline。
6. deterministic / batch-invariant kernels 和 TIM / inference determinism 的关系。
7. heterogeneous KV cache 与 on-disk prefix cache 的 layout 设计。
8. specialist training + full-vocabulary OPD 的 post-training recipe。
9. token-granular WAL rollout 和 DSec sandbox 的 agentic training system 设计。

### Risks

- Copyright/over-copying: 本笔记采用转述、必要公式和表格核心数值摘录，未复制长段原文。
- Unsourced or unverifiable claims: 主要事实来自 DeepSeek official release、Hugging Face model card 和 PDF 技术报告；内部评测结论按官方报告记录，独立复验另行标注。
- Tone/brand mismatch: 按本目录论文笔记风格，区分作者报告、证据强度和本地判断。
- Safety/compliance issues: 涉及 agent sandbox 和 tool-use infra，仅记录系统设计与评测，不沉淀可滥用的操作细节。
- Overlap with existing assets: 与 DeepSeek-R1、Muon、TIM、Lightning Attention、MiniMax-M1、UltraEP 存在强关系；这篇归档新增 DeepSeek-V4 百万上下文系统节点。

### Skipped

| Material | Reason |
| --- | --- |
| 完整 appendix author list | 名单过长，本笔记记录组织署名和关键重叠线索 |
| 所有 benchmark 表格逐项复刻 | 表格数量较多，本笔记保留关键维度和代表数值 |
| inference code 逐文件分析 | 当前任务聚焦论文分析；后续可单独分析 `inference/model.py` 和 `kernel.py` |
| DSec sandbox 实现细节 | 报告描述偏系统设计，本笔记只保留训练和评测相关机制 |

### Recommendation

Decision: maintain

Why: DeepSeek-V4 是本地 archive 中第一个完整覆盖 1M context open MoE architecture、compressed attention、deterministic kernel、post-training OPD 和 agentic infra 的系统报告，能把 DeepSeek-R1、Muon、TIM、MiniMax-M1、UltraEP 和 long-context serving 主题连接起来。
