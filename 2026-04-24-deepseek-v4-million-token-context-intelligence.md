# DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence 论文笔记

Date: 2026-06-16
Sort-Time: 2026-06-16 17:22

## Source

- Title: DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence
- Official release: https://api-docs.deepseek.com/news/news260424
- Technical report PDF: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek_V4.pdf
- Model card: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro
- Model collection: https://huggingface.co/collections/deepseek-ai/deepseek-v4
- Inference code: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/tree/main/inference
- Authors: DeepSeek-AI；appendix author list alphabetically by first name.
- Released: 2026-04-24
- Current version read: PDF and Hugging Face model card, accessed 2026-06-16.
- Subjects: model architecture, MoE systems, long-context inference, post-training, agentic AI.

## 作者与关系

- DeepSeek-AI: 论文署名组织；report 联系邮箱为 `research@deepseek.com`。
- Appendix Research & Engineering: 报告按 first name 字母序列出大量作者，且用 `*` 标记已离队成员。完整列表过长，本笔记记录为 DeepSeek-AI 组织论文。
- 与 DeepSeek-R1 / DeepSeek-V3 系谱重叠的显著作者线索包括 Wenfeng Liang、Xiao Bi、Xingkai Yu、Junxiao Song、Peiyi Wang、Shirong Ma、Zhibin Gou、Zhihong Shao、Ziyi Gao、Daya Guo、Haowei Zhang、Runxin Xu、Ruoyu Zhang、Yu Wu、Z.F. Wu、Zhuoshu Li 等。
- 与 mHC 相关作者线索：report 引用 `2512.24880` mHC 论文，DeepSeek-V4 appendix 中出现 Zhenda Xie、Huanqi Cao、Chenggang Zhao、Chengqi Deng、Jialiang Huang、Wangding Zeng、Wenfeng Liang 等与 mHC / DeepSeek 系列工程相关的同名作者。

关系判断：

- 同机构作者群：论文以 DeepSeek-AI 作为统一署名，未给逐作者机构拆分。
- 跨机构桥接：title page 和 appendix 没有展示跨机构 affiliation；当前按 DeepSeek-AI 内部研究工程组织记录。
- 与已存档作者重叠：与 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 直接重叠明显，是 DeepSeek-R1 / V3 / V3.2 系谱的后续系统报告；与 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/) 存在 Yinmin Zhong 同名线索，但 UltraEP 中 Yinmin Zhong 属 Peking University，需要后续确认是否同一人；与 [2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/) 存在 Chaofan Lin 同名线索，机构不同，需要后续确认。
- 与已存档论文的主题或方法关系：强连接 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/)、[2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)、[2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/)、[2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)、[2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/)、[2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/)、[2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/)、[2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 和 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/)。
- 需要后续确认：是否会有 arXiv 版本或 Nature/会议版本；V4-Pro / V4-Flash 后续正式版是否改变架构、权重精度、tool schema 或 benchmark 设置；mHC / CSA / HCA 各自的独立论文是否补充更完整 ablation。

## 一句话结论

DeepSeek-V4 的核心是把“百万 token 上下文”做成一个端到端系统能力：在扩大 MoE 规模之外，V4-Pro 用 1.6T total / 49B active parameters，V4-Flash 用 284B total / 13B active parameters，二者通过 CSA/HCA hybrid attention 压缩 KV 与 attention FLOPs，通过 mHC 稳定深层残差传播，通过 Muon 提升预训练收敛，再配合 deterministic kernels、heterogeneous KV cache、on-disk prefix reuse、FP4 QAT、OPD 多专家合并和 agent sandbox，使 1M context、long-horizon agent、长思考推理和高效部署共同成立。

## 阅读目标与判断边界

本笔记关注：

1. DeepSeek-V4 如何从架构层降低 1M context 的 FLOPs 和 KV cache。
2. CSA / HCA、mHC、Muon、MoE、MTP 之间的角色分工。
3. DeepSeek-V4 的训练与推理 infra 如何支撑长上下文和 post-training。
4. post-training 为什么从 mixed RL 转向 specialist training + on-policy distillation。
5. 它和本地已存档 DeepSeek-R1、Muon、TIM、inference determinism、Lightning Attention、MiniMax-M1、Vortex、HybridFlow、tool-use RL 的关系。

判断边界：

- 该材料是 preview technical report 与 model card，很多 benchmark 来自官方或内部 evaluation framework，复现性取决于公开权重、serving stack、prompt、tool harness 和采样设置。
- DeepSeek-V4 报告强调系统 recipe，缺少若干关键 ablation：CSA vs HCA 配比、mHC 独立收益、Muon vs AdamW、OPD vs mixed RL、FP4 QAT 对能力的影响等。
- V4-Pro-Max / Flash-Max 的 benchmark 是 reasoning-effort mode 下的系统表现，包含更长上下文和更高 token budget，不能和低预算模式直接等价比较。
- 报告包含大量 agentic tool-use 和 sandbox infra，但没有公开完整训练数据、reward model、GRPO 超参和所有 internal benchmark 样本。

## 论文脉络

### 1. 问题背景

DeepSeek-R1、OpenAI o 系列和后续 reasoning models 证明 test-time scaling 可以提升推理能力，但长 CoT、长上下文检索、agentic workflow 和多轮工具调用都把 attention 变成主要瓶颈。普通 attention 在长度 $n$ 上有 $O(n^2)$ 的计算和 KV 读写压力；即使用 FlashAttention / paged KV cache 优化，1M context 和长 horizon agent 仍会受 FLOPs、KV cache、prefill、decode latency 和 serving memory 限制。

DeepSeek-V4 的问题定义是：如果未来模型需要常态化支持 1M context、长思考推理、agentic coding、search、enterprise workflow 和在线学习，那么模型架构、kernel、训练框架、KV cache、rollout service、post-training 目标必须同时重构。

### 2. 总体架构

DeepSeek-V4 保留 DeepSeek-V3 的几条主线：

- Transformer decoder 架构。
- DeepSeekMoE：细粒度 routed experts + shared expert。
- MTP, Multi-Token Prediction，深度仍为 1。
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
- 前 3 个 MoE layers 使用 Hash routing。
- router affinity activation 从 `Sigmoid` 改为 `Sqrt(Softplus)`。

### 3. mHC：把 residual stream 扩展成受约束的多槽状态

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

### 4. CSA：压缩后再 sparse attention

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

core attention 使用 shared key-value MQA：compressed KV entry 同时作为 key 和 value。为保持局部精细依赖，CSA 还加入 sliding window branch，让 query 额外访问最近 $n_{\mathrm{win}}$ 个 uncompressed KV entries。

### 5. HCA：更重压缩后 dense attention

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

HCA 的角色是用极低 KV 长度保留全局粗粒度信息；CSA 的角色是用较轻压缩 + top-k 选择保留更强的可寻址性。二者 interleaved 使用，构成 hybrid attention。

### 6. CSA/HCA 其它细节

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

### 7. Muon optimizer

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

### 8. General infrastructures

DeepSeek-V4 的系统贡献很重，报告几乎把模型架构和 infra 绑定起来：

- Fine-grained EP mega-kernel：把 MoE dispatch、Linear-1、activation、Linear-2、combine 拆成 expert waves，在单个 fused pipeline 中重叠通信、计算和内存访问。相对 non-fused baselines，一般 inference workloads 加速 1.50 到 1.73x，RL rollout / agent serving 等 latency-sensitive 场景最高 1.96x。
- TileLang：用于快速开发 fused kernels，支持 host codegen、SMT solver assisted integer analysis、可控数值精度和 bitwise reproducibility。
- Batch-invariant deterministic kernels：attention、matmul、attention backward、MoE backward、mHC small matrix multiplication 都做确定性处理，目标是 pretraining、post-training、inference 的 bitwise alignment。
- Contextual parallelism for CSA/HCA：处理 sequence packing、压缩边界跨 CP rank、compressed KV length 不一致等问题，通过 two-stage communication 先传边界 uncompressed KV，再 all-gather compressed KV。
- Tensor-level activation checkpointing：基于 TorchFX 自动追踪 minimal recomputation graph，避免手写 backward，同时实现细粒度 recomputation。
- Heterogeneous KV cache layout：把 classical KV cache 和 state cache 拆开，分别管理 CSA/HCA compressed KV、CSA indexer KV、SWA KV 和未满压缩 block 的 uncompressed tail states。
- On-disk KV cache storage：对 CSA/HCA 存 compressed KV entries，对 SWA 提供 full caching、periodic checkpointing、zero caching 三种策略，在 shared-prefix request 中减少重复 prefill。

这些内容和本地已存档的 inference determinism / TIM 主题高度相关：V4 明确把 batch invariance、bitwise deterministic 和 train/inference alignment 当成生产级基础设施，debug 只是其中一个使用场景。

### 9. Pre-training

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

### 10. Post-training

V4 post-training 的关键变化是：用 specialist training + OPD 取代混合 RL 合并阶段。

第一阶段：specialist training。

- 按 mathematics、coding、agent、instruction following 等域分别训练 expert models。
- 每个 expert 先做 domain-specific SFT，再用 GRPO 做 RL。
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

- Generative Reward Model：hard-to-verify tasks 使用 rubric-guided RL data 和 GRM；actor 本身也作为 GRM，联合提升 judging 与 generation。
- Tool-call schema：引入 `|DSML|` special token 和 XML-style tool invocation，降低 escaping failures 和 tool-call errors。
- Interleaved thinking：tool-calling 场景保留跨轮 reasoning history；普通对话新用户消息到来时仍丢弃旧 reasoning content。
- Quick Instruction：用 `<|action|>`、`<|query|>`、`<|authority|>` 等 special tokens 复用已有 KV cache 执行辅助任务，减少小模型重复 prefill。
- FP4 QAT：MoE expert weights 和 CSA indexer QK path 做 FP4 quantization-aware training；inference / rollout 使用 native FP4 quantized weights，保持采样与部署一致。
- Token-granular WAL rollout service：可抢占 rollout 中每生成一个 token 就写 WAL，并保存未完成请求 KV cache；硬件错误时可用 WAL 重建，避免从头重采导致 length bias。
- DSec sandbox：Rust API gateway / Edge / Watcher + 3FS，支持 Function Call、Container、microVM、fullVM 四种执行 substrate，并做 trajectory logging 和 preemption-safe resumption。

### 11. Evaluation chain

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
- Search：agentic search 优于 RAG，且成本略高于标准 RAG。
- White-collar tasks：30 个中文专业任务，人评中 V4-Pro-Max 相对 Opus-4.6-Max non-loss rate 63%，主要强在 task completion 和 content quality。
- Internal R&D coding benchmark：30 个高质量任务，V4-Pro-Max pass rate 67%，接近 Opus 4.5 的 70，低于 Opus 4.6 Thinking 的 80。

## 关键实验/定理

### 结果 1：1M context efficiency

- 设置：比较 DeepSeek-V3.2、DeepSeek-V4-Pro、DeepSeek-V4-Flash 在 1M context 下 single-token inference FLOPs 和 accumulated KV cache。
- 指标：等效 FP8 FLOPs、KV cache size。
- 结果：V4-Pro 为 V3.2 的 27% FLOPs 和 10% KV cache；V4-Flash 为 V3.2 的 10% FLOPs 和 7% KV cache。
- 解读：这是本文最核心的系统证据。V4 的价值首先来自长上下文成本曲线改变，再由更大模型和 post-training 转化为能力。

### 结果 2：Base model 能力与 parameter efficiency

- 设置：V3.2-Base、V4-Flash-Base、V4-Pro-Base 在统一内部框架评测。
- 指标：world knowledge、language reasoning、code/math、long context。
- 结果：V4-Flash-Base 用更小 active parameters 在多数项超过 V3.2-Base；V4-Pro-Base 在 MMLU-Pro、Simple-QA verified、FACTS Parametric、LongBench-V2 等任务有显著提升。
- 解读：支持“架构 + 数据 + 训练优化”共同提升；参数扩大只是其中一个因素。

### 结果 3：Reasoning effort modes

- 设置：Non-think、High、Max 三种模式，V4-Flash 和 V4-Pro。
- 指标：MMLU-Pro、GPQA Diamond、HLE、LiveCodeBench、Codeforces、HMMT、IMOAnswerBench、Apex、agent benchmarks。
- 结果：复杂任务上 Max 通常优于 High，High 显著优于 Non-think。例如 V4-Pro HLE 从 7.7 到 34.5 到 37.7，LiveCodeBench 从 56.8 到 89.8 到 93.5。
- 解读：V4 沿用并系统化了 test-time compute scaling。对知识任务，参数规模仍关键；对 reasoning/code，token budget 能大幅提升表现。

### 结果 4：Agentic workloads

- 设置：SWE、Terminal Bench、BrowseComp、HLE with tools、MCPAtlas、Toolathlon、内部 R&D coding benchmark。
- 指标：resolved / acc / pass@1 / Elo / internal pass rate。
- 结果：V4-Pro-Max SWE Verified 80.6，Terminal Bench 67.9，MCPAtlas Public 73.6，内部 R&D coding pass rate 67。
- 解读：报告显示 V4 已是强 agentic model，但在 Terminal Bench、SWE Pro、HLE with tools、GDPval-AA 等任务上仍和最强闭源模型存在差距。agent 结果强依赖 harness 和 tool policy。

### 结果 5：Infrastructure ablations in spirit

- 设置：MegaMoE fused EP、mHC optimized implementation、deterministic kernels、FP4 QAT、OPD teacher scheduling、WAL rollout service。
- 指标：wall-clock overhead、speedup、memory pressure、stability。
- 结果：fine-grained EP 相对 non-fused baselines 加速 1.50 到 1.73x，latency-sensitive 最高 1.96x；mHC overhead 控制到 6.7%；FP4 top-k selector 2x 加速且 KV recall 99.7%。
- 解读：这类证据偏工程报告，但对理解大模型落地很关键。V4 的 long-context 能力来自架构和 infra 共同闭环。

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

## 本地讨论补充

### 1. 初版分析收敛

- DeepSeek-V4 和 [2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/) / [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 是同一大趋势下的两条路线：都把 long-output / long-context 成本视为 reasoning scaling 的核心瓶颈。Lightning Attention 用 linear / recurrent state；DeepSeek-V4 用 compressed sparse / heavily compressed attention。
- V4 的 attention 仍保留 softmax-style core attention，只是在 KV 维度和可见 blocks 上做压缩与选择。它和 Lightning Attention 的差异是：V4 牺牲 token-level完整 KV 可见性，通过学习压缩、top-k indexer、sliding window 和 HCA global compressed memory 来换取 1M context 可用性。
- V4 的 deterministic / batch-invariant kernels 说明 inference determinism 不再只是服务端复现问题，也直接进入 post-training、RL rollout、OPD、debug 和 train/inference alignment。

### 2. 后续复验指标

- 在公开权重上复测 MRCR、CorpusQA、needle-in-haystack、multi-hop QA、long-context code repo tasks，区分 compression error 与模型能力。
- 比较 V4-Pro / V4-Flash 在相同 reasoning token budget 下的 knowledge、reasoning、agent 差距，避免把 Max mode budget 当成模型本体能力。
- 对 CSA/HCA 做可解释性探针：top-k compressed block recall、sliding window dependence、HCA global memory 是否覆盖关键证据。
- 对 OPD 做教师选择敏感性测试：不同 teacher weights $w_i$、full-vocab KL vs token-level KL、on-policy sample distribution 对最终能力的影响。
- 对 FP4 QAT 和 native FP4 rollout 做 train/deploy consistency 检查，特别是 CSA indexer QK path。

## 主要启发

- 长上下文模型的关键不只在 attention formula，还在 KV cache layout、prefix reuse、state cache、disk cache、kernel determinism、rollout recovery 和 post-training data format。
- V4 提供了 DeepSeek 对“百万上下文智能”的系统定义：1M context 是 architecture + systems + post-training + product routing 的结果。
- Specialist RL + OPD 是一个值得跟踪的 post-training 方向。它把“多领域专家”合进一个 unified model，规避 weight merging 和 mixed RL 的退化风险。
- Tool-use 和 agentic training 的正确性进入系统层：WAL 避免抢占导致 length bias，sandbox trajectory log 避免非幂等命令重放错误。
- mHC、Muon、Anticipatory Routing、SwiGLU Clamping 显示 trillion-scale MoE 的稳定性越来越依赖残差传播、优化器几何和 router/backbone 动态。

## 局限

1. 该报告是 preview 版本，缺少 arXiv source、完整训练代码、所有数据组成、reward model 和 GRPO 细节。
2. CSA/HCA hybrid attention 缺少系统性公开 ablation，难以单独判断 compression、sparse top-k、HCA、sliding window、attention sink 各自贡献。
3. V4 的 benchmark 很强，但大量结果来自内部框架和官方评测；第三方复验需要统一 prompt、sampling、tool harness、context management 和 token budget。
4. Anticipatory Routing 与 SwiGLU Clamping 机制解释仍不充分，当前更像经验性稳定化 recipe。
5. 1M context 的实际价值需要更多真实场景验证，例如 cross-document citation、long repo editing、multi-session agent memory、long-horizon planning 和在线学习。
6. FP4/FP8/低精度路径对 rare-token retrieval、indexer top-k 和 train/inference logprob consistency 的影响需要更细评估。

## 跨论文关系

- 与 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/)：DeepSeek-R1 是 reasoning RL / GRPO / verifiable reward 的上游节点；DeepSeek-V4 把这条路线推向 1M context、agentic tool-use、specialist RL 和 OPD 统一模型。
- 与 [2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/)：V4 是 Muon 大规模 LLM 训练的系统应用案例；Muon 论文解释其曲率优势，V4 报告展示其在 trillion-scale MoE 中的工程化使用。
- 与 [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)：V4 明确把 batch-invariant / deterministic kernels 和 train-inference bitwise alignment 做成内核库目标，和这两篇关于 nondeterminism / TIM 的问题定义直接相接。
- 与 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)：UltraEP 讨论 MoE training / serving prefill 的 expert load balancing，V4 报告展示 DeepSeek 自身在 fine-grained EP、MegaMoE、communication-computation overlap、MoE determinism 上的工程方案。
- 与 [2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/) 和 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/)：三者都服务 long context / long output。Lightning Attention 用 recurrent/linear attention 降低长序列成本；MiniMax-M1 把 Lightning Attention 放进 long-output RL；DeepSeek-V4 用 CSA/HCA compressed attention 与 KV cache systems 支撑 1M context。
- 与 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/)、[2511.02749](/papers/2511.02749-span-queries-cache-attention-locality/) 和 [2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/)：V4 从模型内部压缩 KV 和 attention；这些 serving 论文从 sparse attention DSL、span query/cache locality、application DAG 显式化角度降低真实 workload 成本。
- 与 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 和 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/)：V4 post-training 展示了 ultra-long-context RL/OPD、rollout WAL、sandbox infra 和 tool-call schema 的生产级实现，补充了 RLHF/RLVR systems 与 tool-use RL 的工程侧细节。
- 新增后应更新的索引 cluster：新增 “DeepSeek-V4、Million-Token Context 与 Hybrid Compressed Attention” cluster，并连接 DeepSeek-R1、Muon、TIM、inference determinism、Lightning Attention、MiniMax-M1、UltraEP、Vortex、HybridFlow 和 tool-use RL。

## Reference Intake Brief

### Target

- Intended target system: 新增论文笔记 / DeepSeek-V4 long-context architecture 与 system report 文档。
- Existing related assets: `papers-index.md`；已存档 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/)、[2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/)、[2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)、[2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/)。
- Proposed form: 新建独立 Markdown 文档，并更新 `papers-index.md`。

### Reusable Elements

1. CSA / HCA hybrid attention 的压缩、sparse top-k、sliding window、attention sink 分解。
2. 1M context FLOPs 和 KV cache reduction 数值。
3. mHC residual stream 扩展与 Birkhoff polytope/Sinkhorn 稳定性语言。
4. Muon 在 trillion-scale MoE 中的工程配置。
5. deterministic / batch-invariant kernels 和 TIM / inference determinism 的关系。
6. specialist training + full-vocabulary OPD 的 post-training recipe。
7. token-granular WAL rollout 和 DSec sandbox 的 agentic training system 设计。

### Risks

- Copyright/over-copying: 本笔记采用转述、必要公式和表格核心数值摘录，未复制长段原文。
- Unsourced or unverifiable claims: 主要事实来自 DeepSeek official release、Hugging Face model card 和 PDF 技术报告；内部评测结论按官方报告记录，独立复验另行标注。
- Tone/brand mismatch: 按本目录论文笔记风格，区分作者报告、证据强度和本地判断。
- Safety/compliance issues: 涉及 agent sandbox 和 tool-use infra，仅记录系统设计与评测，不沉淀可滥用的操作细节。
- Overlap with existing assets: 与 DeepSeek-R1、Muon、TIM、Lightning Attention、MiniMax-M1、UltraEP 存在强关系，但本文新增的是 DeepSeek-V4 百万上下文系统节点。

### Skipped

| Material | Reason |
| --- | --- |
| 完整 appendix author list | 名单过长，本笔记记录组织署名和关键重叠线索 |
| 所有 benchmark 表格逐项复刻 | 表格数量较多，本笔记保留关键维度和代表数值 |
| inference code 逐文件分析 | 当前任务聚焦论文分析；后续可单独分析 `inference/model.py` 和 `kernel.py` |
| DSec sandbox 实现细节 | 报告描述偏系统设计，本笔记只保留训练和评测相关机制 |

### Recommendation

Decision: merge as a new paper note.

Why: DeepSeek-V4 是本地 archive 中第一个完整覆盖 1M context open MoE architecture、compressed attention、deterministic kernel、post-training OPD 和 agentic infra 的系统报告，能把 DeepSeek-R1、Muon、TIM、MiniMax-M1、UltraEP 和 long-context serving 主题连接起来。
