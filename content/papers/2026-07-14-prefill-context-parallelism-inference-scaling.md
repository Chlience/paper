# 推理侧 Prefill Context Parallelism：为何有效，以及 CP / SP / UP 的边界

First-Archived-At: 2026-07-14 20:25
Updated-At: 2026-07-16 12:25

## Source

- Workflow version: v2
- Material type: composite
- Canonical source: /papers/2512.02556-deepseek-v3-2-open-large-language-models/
- Title: 推理侧 Prefill Context Parallelism：为何有效，以及 CP / SP / UP 的边界
- Responsible organization: Chlience Paper Archive（本地综合）
- Primary implementation roadmap: [SGLang Context Parallelism roadmap #21788](https://github.com/sgl-project/sglang/issues/21788)、[Prefill CP refactor roadmap #27252](https://github.com/sgl-project/sglang/issues/27252)
- Primary SGLang PRs: [DSA Prefill CP #12065](https://github.com/sgl-project/sglang/pull/12065)、[round-robin / fused MoE / FP8 #13959](https://github.com/sgl-project/sglang/pull/13959)、[CP state refactor #17213](https://github.com/sgl-project/sglang/pull/17213)、[Qwen3 MHA/GQA CP #18233](https://github.com/sgl-project/sglang/pull/18233)、[key all-gather overlap #20438](https://github.com/sgl-project/sglang/pull/20438)、[all-reduce fusion #21249](https://github.com/sgl-project/sglang/pull/21249)、[attention CP / MoE DP decoupling #22003](https://github.com/sgl-project/sglang/pull/22003)、[MLA Prefill CP #23292](https://github.com/sgl-project/sglang/pull/23292)、[batch size > 1 #23269](https://github.com/sgl-project/sglang/pull/23269)、[CP KV resharding #25846](https://github.com/sgl-project/sglang/pull/25846)、[GLM-5.2 DSA cache layer split #29421](https://github.com/sgl-project/sglang/pull/29421)
- Parallelism background: [DeepSeek-V3.2](https://arxiv.org/abs/2512.02556v1)、[Context Parallelism for Scalable Million-Token Inference](https://arxiv.org/abs/2411.01783)、[Ring Attention](https://arxiv.org/abs/2310.01889)、[Striped Attention](https://arxiv.org/abs/2311.09431)、[DeepSpeed Ulysses](https://arxiv.org/abs/2309.14509)、[Megatron sequence parallelism](https://arxiv.org/abs/2205.05198)、[LoongServe](https://arxiv.org/abs/2404.09526)
- Inference SP implementation references: [SGLang TP-SP WIP #12820](https://github.com/sgl-project/sglang/pull/12820)、[vLLM sequence-parallel compiler pass](https://docs.vllm.ai/en/latest/design/fusions/#sequence-parallelism-enable-sp)
- Decode boundary reference: [SGLang DeepSeek-V3.2 DCP #18167](https://github.com/sgl-project/sglang/pull/18167)
- Decode cache ownership synthesis: [MLA TP cache sharding](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/)
- Published / updated: 本综合 2026-07-14；所读 SGLang PR / roadmap 覆盖 2025-10 至 2026-07，其中 #29421 于 2026-07-09 合入
- Current version read: SGLang `main` 公开 PR、issue 与 roadmap 截至 2026-07-14；DeepSeek-V3.2 arXiv v1；其余论文读取 arXiv 当前公开版本；vLLM developer-preview 文档截至访问日
- Version / revision read: PR 状态以 2026-07-14 GitHub 页面为准；开放 PR 和 roadmap 只用于说明实现方向，不视为稳定 release 契约
- Accessed: 2026-07-14
- Subjects: inference parallelism；long-context prefill；context parallelism；sequence parallelism；Ulysses Parallelism；DSA；MLA；KV Cache；TTFT

## 作者与关系

- 本材料由本地归档综合，没有单一论文作者，也不为 composite 新建作者档案。
- SGLang PR 链由社区贡献者与维护者持续完成，覆盖 DeepSeek-V3.2、GLM-5.2、Qwen3、DeepSeek-V3 / R1 和 Kimi K2.5 等模型路径。PR 之间构成实现依赖与能力演进，不能据此推断论文作者分工。
- DeepSeek-AI 提供 DSA / MLA 架构与 DeepSeek-V3.2 报告；Meta 的 inference CP 工作、UC Berkeley 的 Ring Attention、DeepSpeed Ulysses 与 NVIDIA Megatron sequence parallelism 提供不同的 distributed-attention 基础。
- 这些团队之间的人员关系不属于本综合重点。稳定作者与机构事实保留在各独立论文笔记；这里追踪机制和实现关系。

## 一句话结论

Prefill CP 将单条长请求的 query token 沿 context 维分到多个 rank，在每个 rank 保持全局 KV 或全局 attention state 可见性，并用因果负载均衡、通信重叠和并行组解耦把 dense attention 或 DSA indexer 的高增长计算并行化；这套数学分解可覆盖 MHA、GQA、MLA 与 DSA，生产级扩展仍取决于 KV 所有权、attention backend、跨节点拓扑、批量请求元数据和按请求弹性选择 CP degree。

## 阅读目标与判断边界

本笔记关注：

1. 推理 Prefill 中到底是哪部分计算允许沿 context 维拆分，以及 TTFT 为什么可能下降。
2. SGLang 多组 PR 如何从 DeepSeek-V3.2 DSA 专用路径演进到 MHA/GQA、MLA、多 batch、PD disaggregation 和 KV 分片。
3. CP、Megatron SP 与 Ulysses Parallelism（UP）在张量布局、collective、内存目标和适用阶段上的区别。
4. Prefill CP 能否扩展到更广模型和生产场景，以及需要满足哪些量化条件。

判断边界：

- 本综合以公开 PR 描述、代码变更说明、官方 roadmap 和论文为证据。PR benchmark 通常缺少完整重复实验、方差与统一 baseline，适合解释机制和局部增量。
- SGLang 早期代码与 flag 使用 `NSA` 名称，DeepSeek-V3.2 正式报告将方法命名为 DSA。这里统一称 DSA；旧 flag 仅作为实现历史保留。
- `UP` 在本文中专指 Ulysses Parallelism，也常写作 Ulysses-SP。该缩写缺少跨框架统一标准；`USP` 通常指 Unified Sequence Parallelism，属于另一套组合命名。
- `CP` 在不同框架中同时存在宽义与窄义。本文采用操作性定义：只要一条请求的 context / query rows 分布到多个 rank，并通过通信恢复全局 attention 语义，就纳入 context scale-out 谱系；SGLang query-sharded + KV all-gather、Ring pass-KV/pass-Q 和 Ulysses layout transpose 因而可以放在同一张数据流图上比较。Megatron 通常把 `CP` 专门用于 Ring 类 context sharding，Ulysses 原论文则将自身称为 sequence parallelism。文中讨论具体实现时始终使用 SGLang CP、Ring CP 或 UP，避免把本文分类当作统一框架命名。
- 训练侧 SP / CP / UP 还需要处理 backward、gradient 与保存 activation。本文聚焦 inference forward、TTFT、KV residency 和 serving 调度。
- 截至 2026-07-14，#25846、#12820、#18167 和 #27252 等材料仍处于开放或 roadmap 状态；其设计只能支撑方向性判断。

证据写法：

- 论文事实：论文公式、算法、图表和公开 PR 直接给出的结构、数字与状态。
- 作者或维护者主张：PR motivation、roadmap 与论文对瓶颈、性能和泛化范围的解释。
- 本地分析：成本模型、张量形状推导、术语统一、可扩展性判断和部署建议。

记号约定：

- $B$：batch size；$L$：本次新 Prefill token 数；$C$：已缓存 context token 数。
- $H$：model hidden size；$h_q$ / $h_{kv}$：query / KV head 数；$d$：head dimension。
- $P$：context-parallel degree；$k$：稀疏 attention 每个 query 选取的 KV token 数。
- 张量按 batch-major 行向量习惯书写，例如 $X\in\mathbb R^{B\times L\times H}$。

## 论文脉络

### 1. 长 Prefill 为什么成为单条请求的关键路径

自回归推理包含两个计算形态差异很大的阶段：

```text
Prefill:  一次处理 L 个新 token，生成首个输出 token 所需状态，并写入 L 份 KV
Decode:   每步处理一个或少量 query token，读取已缓存的 C+L 个 KV，逐 token 串行推进
```

对 dense causal attention，第 $i$ 个 Prefill query 需要读取位置 $0$ 到 $i$ 的 KV。一个序列的有效 query-key pair 总量为：

$$
A(L)=\sum_{i=0}^{L-1}(i+1)=\frac{L(L+1)}{2}.
$$

FlashAttention 会避免在 HBM 中物化完整 $L\times L$ attention matrix，并通过 tiling、online softmax 降低 IO；有效 pair 的计算量仍随 $L^2$ 增长。投影与 MLP 等 token-local 算子大致随 $L$ 线性增长。于是足够长的 Prefill 同时具备三个特征：

1. 单条请求包含大量互相独立的 query rows，可以分给多张卡。
2. attention 或 selector 有足够大的计算量，可以覆盖 collective 延迟。
3. TTFT 直接包含整段 Prefill，缩短该阶段会直接缩短用户等待首 token 的时间。

DeepSeek-V3.2 的 DSA 改变了第二项的内部构成。对每个 query，lightning indexer 仍需要给全局历史位置打分并选出 top-$k$；selected core attention 只访问 $k=2048$ 个 latent KV positions。忽略常数后可写成：

$$
T_{\mathrm{DSA}}(L)
\approx
\alpha d_{\mathrm{idx}}\frac{L(L+1)}{2}
+\beta h_q d kL
+\gamma LH^2.
$$

三项分别近似表示全历史 indexer、selected sparse attention 和投影 / MLP。DSA 将主 attention 从 $O(L^2)$ 降到 $O(Lk)$，indexer 仍保留小维度、低精度的近二次项。长 Prefill CP 因此会重点分摊 query-side indexer 与 selected attention；它也会分摊 rank-local token projections 和 MoE 输入，但具体收益取决于 CP、TP、EP 的组合方式。

DeepSeek-V3.2 正式报告还说明短序列 Prefill 使用 masked MHA 来模拟 DSA，以获得更适合短 context 的 kernel 效率。逻辑 selector 集合保持不变，实际 attention closure 和 CP break-even threshold 会随长短序列 backend 变化。生产系统应分别 profile masked-MHA 和 sparse Prefill 路径。

### 2. 先把 CP、SP、UP 放在同一张张量图上

这些术语在训练框架和推理框架中存在重载。可靠区分方式是记录四件事：**长期分片的张量、attention 时谁拥有完整 sequence、使用什么 collective、主要优化哪类成本。**

#### 2.1 TP：理解其他三者所需的基线

Tensor Parallelism（TP）沿 hidden、head 或 weight 维切分模型参数和 GEMM。典型 attention rank 持有完整 sequence 上的一部分 heads：

$$
Q_r\in\mathbb R^{B\times L\times (h_q/P)\times d}.
$$

TP 适合让大模型权重放入多卡，并分摊每个 token 的线性层与 head 计算。每个 rank 仍覆盖完整 $L$，长 sequence 的 context residency 没有随 TP degree 同比例下降；每层 row/column-parallel linear 还会引入 all-reduce、reduce-scatter 或 all-gather。

#### 2.2 CP：沿一条请求的 context / query-row 维分片

Context Parallelism（CP）把同一条请求的 token positions 分给多个 rank。rank $r$ 持有 query index 集合 $I_r$：

$$
X_r=X[:,I_r,:]\in\mathbb R^{B\times |I_r|\times H},
\qquad |I_r|\approx L/P.
$$

attention 的每一行在获得全局 KV 后可以独立计算：

$$
O_{I_r}
=
\operatorname{softmax}
\left(
\frac{Q_{I_r}K^\top}{\sqrt d}+M_{I_r}
\right)V.
$$

因此 CP 的核心契约是：query rows 可以分片；每个 local query 必须能够访问其完整因果历史。全局可见性可以通过多种数据流建立：

- all-gather K/V，再对 local Q 计算；
- K/V blocks 沿 ring 轮转，local Q 逐块累积 online-softmax state；
- Q 沿 ring 轮转，在 KV owner 上计算 partial output，再把结果送回 query owner；
- 通过 all-to-all 把 sequence partition 转成 head partition，使每个 rank 对一部分 heads 持有完整 sequence。

SGLang DSA Prefill CP 的主路径属于第一类。Meta inference CP 的 pass-KV / pass-Q 属于第二、三类。Ulysses 属于第四类。

#### 2.3 SP：Megatron 语义下的 TP activation sequence sharding

Megatron Sequence Parallelism（SP）与 TP 配套，把 residual、dropout、LayerNorm / RMSNorm 等原本在 TP ranks 间复制的 $[B,L,H]$ activation 沿 sequence 维切成 $[B,L/P,H]$。典型变换为：

```text
TP path:     AllReduce(Y) → RMSNorm(full sequence)
TP + SP:     ReduceScatter_seq(Y) → RMSNorm(local sequence) → AllGather_seq
```

SP 的直接目标是减少 TP 路径中常驻的 per-token activation，并为 GEMM 与 collective overlap 建立数据布局。进入需要完整 sequence 的 attention / linear 路径时，activation 仍会 all-gather；attention 通常继续以“完整 sequence + 部分 heads”执行。

训练阶段需要保存 forward activation 供 backward 使用，SP 的显存价值很大。推理阶段无需保存反向图，SP 仍可降低长 Prefill 的瞬时 working set，并把 all-reduce 改写为可融合的 reduce-scatter / all-gather。vLLM 的 developer-preview 实现明确把 SP 作为 AsyncTP GEMM-collective fusion 的前置变换，并只在 token 数超过硬件相关阈值时启用。SGLang #12820 的 TP-SP WIP 在 36K 输入上报告 DeepSeek-V3 / V3.2 TTFT 分别下降约 10% / 7%，同时降低 RMSNorm activation 峰值；该 PR 当前仍未合入。

FlashAttention-2 文献中的“sequence parallelism”还可以表示单 GPU kernel 内把 sequence blocks 分给更多 thread blocks。它属于 kernel work partition，与这里的跨 GPU Megatron SP 分处不同层级。

#### 2.4 UP：Ulysses 的 sequence-to-head layout transpose

Ulysses Parallelism（UP）在 attention 外保持 sequence sharding：

$$
[B,L/P,h_q,d].
$$

进入 attention 前执行 all-to-all，把 layout 转为完整 sequence 和部分 heads：

$$
[B,L/P,h_q,d]
\xrightarrow{\mathrm{AllToAll}}
[B,L,h_q/P,d].
$$

每个 rank 对自己负责的 head subset 执行完整序列 attention；第二次 all-to-all 将输出恢复为 sequence-sharded layout，交给后续算子：

$$
[B,L,h_q/P,d]
\xrightarrow{\mathrm{AllToAll}}
[B,L/P,h_q,d].
$$

UP 的优势来自可逆 layout 转换：attention 外的 activation 随 $P$ 分片，attention 内无需逐 ring step 交换 KV。它的并行 degree 受 head 可分性约束。MHA 有较多 KV heads，映射通常自然；GQA 的 KV heads 更少；MQA / MLA 只有一个或很少的 KV group，往往需要复制、特殊 all-to-all 或与 ring 组合。UP 最早面向训练，原理也可用于 Prefill inference，serving 还需要处理 KV 持久化、variable-length batch、partial prefill 和 decode。

#### 2.5 四种布局的直接对照

| 方案 | 长期分片对象 | attention 时每 rank 看到什么 | 主要 collective | 直接优化目标 | 主要约束 |
| --- | --- | --- | --- | --- | --- |
| TP | weights / hidden / heads | 完整 $L$，部分 heads | all-reduce / all-gather / reduce-scatter | 模型容量与 token compute | 跨节点 TP 通信较重，context 常完整驻留 |
| Megatron SP | TP 之间的 residual / Norm activation | 通常完整 $L$，部分 heads | reduce-scatter + all-gather | activation memory、TP collective fusion | 依附 TP；对 attention 全局 context 本身的分摊有限 |
| SGLang Prefill CP | 同一请求的 query / hidden token rows | local Q，all-gather 后的全局 K/V | all-gather + reorder | 长 Prefill TTFT、query-side compute | KV 通信与复制、因果负载均衡、backend 适配 |
| Ring CP | query rows 与分布式 KV blocks | local Q + 逐轮到达的 KV，或 local KV + 逐轮 Q | P2P SendRecv + output merge | 超长 context compute 与 KV capacity | $P$ 轮同步、block size、通信隐藏与调度复杂度 |
| UP | attention 外 sequence，attention 内 heads | 完整 $L$，部分 heads | 两次 all-to-all | 长序列 activation 与 exact attention | head / KV-head 可分性、all-to-all 拓扑 |

这张表给出本文的操作性分类：context scale-out 描述“沿一条请求的 context 扩展 attention”的目标；Ring 和 Ulysses 描述两种执行算法；Megatron SP 主要描述 TP activation 的驻留方式。框架命名没有形成统一层级，阅读工程文档时应继续追踪 tensor layout 与 collective，不能只凭 `CP` 或 `SP` 缩写判断数据流。

### 3. SGLang DSA Prefill CP 的实际前向路径

以 batch size 为 1、CP degree 为 $P$ 的初版路径为例，embedding 后 hidden state 为：

$$
X\in\mathbb R^{L\times H}.
$$

#### 3.1 分片后，整层保持 local token layout

SGLang #12065 将 token rows 分给 CP ranks：

$$
X_r\in\mathbb R^{(L/P)\times H}.
$$

每个 rank 只为本地 token 计算 Q、K/V latent、DSA indexer query 和后续 MoE / MLP 输入。隐藏状态在多层之间继续保持 sequence-sharded layout，避免每层开头重新复制完整 $X$。初版说明中，相关 MLA GEMM 权重没有再按 attention TP 切分，因此每个 rank 以复制权重处理更少 token；后续 CP+TP 路径通过独立并行组扩展这项限制。

```text
Embedding output [L, H]
        │ split / reorder by token ownership
        ├─ rank 0: X[I0] [L/P, H]
        ├─ rank 1: X[I1] [L/P, H]
        └─ rank P-1: X[IP-1] [L/P, H]

Each layer on rank r
  local projections / indexer-Q / MLP or MoE routing input
        │
  local K or latent-KV ── all-gather + rerange ── full K/KV view
        │                                      │
  local Q ─────────────────────────────────────┘
        │
  local attention output [L/P, H]
        │
  keep sequence-sharded into next layer

Final required state / output ── gather + restore token order
```

#### 3.2 local Q 为什么必须获得全局 K/V

假设 rank $r$ 拥有位置集合 $I_r$。任意 $i\in I_r$ 的 DSA indexer 需要在全部合法历史位置 $j\le i$ 上求分数和 top-$k$：

$$
J_i=\operatorname{TopK}_{j\le i}\,s(q_i^{\mathrm{idx}},k_j^{\mathrm{idx}}).
$$

selected attention 随后访问 $J_i$ 对应的 latent KV。只保留本 rank 的 K/V 会遗漏其他 rank 持有的历史位置。#12065 因而执行 key / KV all-gather，并在 token 被 zigzag 重排后恢复全局顺序。实际 attention 中每个 rank 的 Q 数量约为 $1/P$，可见 KV 覆盖整条请求。

这里的 exactness 来自 query-row independence：每一行都使用与单 rank 相同的候选 K、causal mask、top-$k$ 和 selected KV。分片只改变行在哪张卡执行。FP8 KV、top-$k$ tie、collective reduction order和 batch-dependent kernel 仍可能引入数值路径差异，需要单独做 logits / token / task-level parity。

#### 3.3 初版同时带来一个重要内存边界

all-gather 之后每个 rank 都能看到完整 KV，#18233 的 Qwen3 路径还明确为每个 CP rank 分配 full-sequence KV cache，以简化 cache 管理和复用。因此这类 CP 首先提供 **Prefill compute parallelism 和 TTFT 收益**；persistent KV capacity 未必随 $P$ 增长。

后续有三条不同的 cache 路线：

1. **临时 gather、持久 sequence shard**：#25846 计划让每个 Prefill CP rank 物理保存 $1/P$ sequence KV，PD transfer 时由 decode 侧从所有 ranks 重组。该 PR 当前开放。
2. **按 layer shard**：#29421 已为 GLM-5.2 DSA 合入 layer ownership，每个 rank 保存互斥 layer range，使用时从 owner broadcast；CP=4、8192 tokens 的 per-rank KV/indexer cache 从 0.77 GB 降到 0.20 GB，约下降 74%。
3. **Ring KV ownership**：每个 rank 持久保存自己的 KV blocks，attention 时逐块 pass-KV 或 pass-Q，避免每 rank 长期物化完整 context。

这三条路线分别按 sequence、layer 和通信时间切分 KV。它们改变内存上界、transfer protocol 和 collective 形态，不能只用一个 `CP size` 参数概括。

### 4. Prefill CP 为什么能够降低 TTFT

#### 4.1 query-row compute 接近按 $P$ 分摊

若 token ownership 已经负载均衡，dense causal attention 或 DSA indexer 的总 query-key pairs 可以近似均分：

$$
A_r=\sum_{i\in I_r}(i+1)\approx \frac{A(L)}{P}.
$$

DSA selected attention 和 token-local layers 也按 local query 数缩小：

$$
T_{\mathrm{compute},P}
\approx
\frac{T_{\mathrm{indexer}}+T_{\mathrm{sparse\ attn}}+T_{\mathrm{token\ local}}}{P}.
$$

实际比例会受 TP/EP、GEMM shape、MoE routing 和 GPU saturation 影响。$L/P$ 太小时，local GEMM / attention kernel 低于饱和区，继续增加 $P$ 会降低并行效率。

#### 4.2 长度增长让 compute 更容易覆盖通信

all-gather K/V 的数据量通常随 $L$ 线性增长；dense attention 和 DSA indexer 的工作量随 $L^2$ 增长。简化到一个 layer，每个 rank 的 logical receive volume 对应：

$$
T_{\mathrm{comm}}
\approx
\lambda(P)
+\frac{2BLh_{kv}d\,b}{\mathrm{BW}}\frac{P-1}{P},
$$

其中 $b$ 是每元素 bytes，$\lambda(P)$ 表示 collective 启动和同步成本。对于 DSA indexer，可把 $h_{kv}d$ 替换成 index-key / latent-KV 的实际宽度。随着 $L$ 增长，理想 compute saving 近似按 $L^2(1-1/P)$ 增长，通信 bytes 近似按 $L$ 增长。长 Prompt 因而更容易满足：

$$
T_{\mathrm{compute},1}(L)\left(1-\frac1P\right)
>
T_{\mathrm{comm}}
+T_{\mathrm{reorder}}
+T_{\mathrm{sync}}
+T_{\mathrm{underfill}}.
$$

这个不等式是 CP admission 的基本条件。短 prompt、PCIe 或弱跨节点互联、很大的 CP degree、较小 KV 压缩比都会扩大右侧。

#### 4.3 因果三角结构需要主动负载均衡

把连续 token 等长切给 ranks 会产生明显 straggler。若 rank $r$ 持有区间 $[rL/P,(r+1)L/P)$，其 attention pair 数近似为：

$$
A_r^{\mathrm{contiguous}}
\approx
\frac{(2r+1)L^2}{2P^2}.
$$

最后一个 rank 的工作量约为第一个 rank 的 $2P-1$ 倍。所有 rank 必须等待最慢者，理想 $1/P$ 分摊会失效。

#12065 使用 zigzag：先切成 $2P$ 个连续 blocks，再把首尾对称 blocks 配给同一 rank。例如 $P=4$ 时：

```text
rank 0: block 0 + block 7
rank 1: block 1 + block 6
rank 2: block 2 + block 5
rank 3: block 3 + block 4
```

早期 block 的短历史与后期 block 的长历史互补。#13959 增加 interleave / round-robin：token $i$ 交给 $i\bmod P$，使每个 rank 在整个 sequence 上均匀取样，DSA indexer 工作更接近均衡。代价是 position、KV page、输出与 batch metadata 都要支持非连续布局。

Striped Attention 给出同样的系统信号：causal triangle 的主要问题来自 token ownership，均匀条带化位置可以显著改善 ring attention 的 workload balance。SGLang CP v2 roadmap #27252 也将旧 `in-seq-split` / `round-robin-split` 统一命名为 `zigzag` / `interleave`，说明 layout strategy 已经成为独立 runtime abstraction。

#### 4.4 通信需要进入计算流水

#20438 发现同步 `key_all_gather` 已成为 DeepSeek-V3.2 Prefill 的显著瓶颈。PR 使用双 CUDA stream，让 key all-gather / rerange 与 query `rotate_activation` 重叠。这个改动揭示了 CP 性能的第二层条件：

$$
T_{\mathrm{layer}}
\approx
T_{\mathrm{local\ compute}}
+\max(T_{\mathrm{remaining\ comm}},0),
$$

其中可被 query projection、RoPE / activation rotation、前后 layer work 隐藏的通信不再完整进入关键路径。可重叠窗口不足时，collective 会直接加到 TTFT。

#21249 又让 all-reduce fusion 能在 CP sub-communication group 中工作。CP 改变 parallel group 后，原有 fused collective 容易失效；恢复这些优化属于端到端收益的一部分。单独加一个 attention CP kernel通常不足以保留原 serving stack 的性能。

#### 4.5 attention 与 MoE 需要使用独立并行轴

早期实现把 `attention_cp_size` 与 `moe_dp_size` 绑定，attention 想用更多 context ranks 时，MoE 也被迫改变 DP / EP layout。#17213 引入 attention TP / CP 和 MoE CP 的独立 group coordinator；#22003 进一步支持 `attention_cp_size != moe_dp_size`，允许只对 attention 应用 CP、保持 MoE 路径不变。

这项解耦决定了 CP 能否进入生产配置：

- attention 的最佳 degree 主要由 $L$、$h_{kv}$、backend 和互联决定；
- MoE 的最佳 DP / EP degree 主要由 expert 数、token load、all-to-all 和容量决定；
- 强制二者相同会让一个子系统为另一个子系统的瓶颈支付额外通信或复制成本。

### 5. 多组 PR 展示了“能运行”到“可扩展”的距离

| 时间 / PR | 新增能力 | 它解决的扩展障碍 | 仍保留的边界 |
| --- | --- | --- | --- |
| 2025-11 #12065 | DeepSeek-V3.2 DSA Prefill CP；local Q + full KV；zigzag | 首次把长 DSA Prefill query rows 分给多 rank | single batch、single node、模型专用、KV 全量 gather |
| 2026-01 #13959 | interleave、DSA multi-batch 路径、fused MoE、FP8 KV | 因果 / indexer balance 与生产 dtype / MoE 兼容 | benchmark 混合 token layout 与 MoE tuning，无法隔离 CP 总收益 |
| 2026-02 #17213 | attention CP / TP / MoE CP group 与 scheduler refactor | CP+DP+TP 组合和模型泛化的并行状态基础 | 大量模型 / backend 分支仍存在 |
| 2026-03 #18233 | Qwen3-MoE MHA/GQA Prefill CP | 从 DSA 扩到 dense/GQA attention | full-sequence KV 在 CP ranks 复制；依赖 FA backend 路径 |
| 2026-03 #20438 | key all-gather 与 query compute 重叠 | 消除同步 collective 的关键路径空洞 | overlap 大小依赖 layer shape、stream 与 backend |
| 2026-04 #21249 | CP subgroup 上 all-reduce fusion | 恢复 CP 打开后丢失的原有 fusion | 依赖下游 collective / FlashInfer 支持 |
| 2026-04 #22003 | attention CP 与 MoE DP degree 解耦 | 让 attention 和 expert 路径独立选并行度 | CP+EP 的 all-to-all 拓扑仍需优化 |
| 2026-05 #23292 | FA3 absorbed-MLA Prefill CP | 扩到 DeepSeek-V3/R1、Kimi K2.5 等 MLA 模型 | backend-specific closure；MLA、DSA、GQA 路径仍分化 |
| 2026-05 #23269 | generic CP metadata 支持 batch > 1 | serving batch 不再局限单请求 | ragged length、prefix hit 与每请求 elastic degree 仍复杂 |
| 2026-05 #25846，开放 | Prefill CP KV 按 sequence 物理 reshard | 让 persistent KV capacity 随 CP 增长，支持 PD transfer | cache ownership、eviction consensus 和 decode 重组尚在演进 |
| 2026-07 #29421 | GLM-5.2 DSA cache 按 layer split | 每 rank KV/index cache 下降约 74%，接入 PD transfer | DSA + interleave + PD 专用条件；使用层需要 owner broadcast |
| 2026-06 起 #27252，roadmap | 统一 `--enable-prefill-cp` 与 zigzag/interleave strategy API | 从 model/backend branches 收敛为 layout-owned runtime | roadmap 明确技术细节仍会变化，迁移尚未全部完成 |

这条演进链说明 Prefill CP 的首个数学原型相对直接；通用能力还需要跨模型 attention dispatch、parallel-state composition、ragged metadata、cache ownership、PD transfer、fusion 和 scheduler 共同配合。

### 6. 现有性能数字应如何解释

#### 6.1 #13959 证明实现细节仍能显著改变 TTFT

#13959 在 8×H20 141GB、DeepSeek-V3.2-Exp、单并发、输出 1 token 的配置下，比较旧 CP + DeepEP 路径与 round-robin + tuned fused MoE：

| 输入长度 | 旧 CP + DeepEP TTFT | round-robin + tuned fused MoE | 变化 |
| ---: | ---: | ---: | ---: |
| 1K | 303.49 ms | 205.60 ms | -32.25% |
| 16K | 1858.31 ms | 1692.13 ms | -8.94% |
| 64K | 7695.75 ms | 7011.81 ms | -8.89% |

这个表比较的是 **两种已经启用 CP 的实现配置**。增量同时包含 token layout 与 fused MoE tuning，无法回答“CP 相对 CP=1 提升多少”。它支持的最窄结论是：负载布局和非 attention 路径会显著影响 CP 的端到端 TTFT；只比较 attention kernel 容易高估或低估真实收益。

#### 6.2 #20438 提供时间线证据，缺少完整端到端统计

#20438 的 Nsight Systems profile 显示，改动前 NCCL key all-gather 与 query rotation 串行，改动后 alt stream 上的 gather / rerange 与 default stream compute 重叠。PR 页面没有提供完整输入长度矩阵、重复次数与端到端置信区间。它对因果机制的证据较强，对生产 speedup 大小的证据有限。

#### 6.3 #29421 证明 CP 还可以扩展 KV 容量

#29421 在 GLM-5.2-FP8、78 layers、CP=4、8192 tokens 上报告 per-rank KV/indexer cache 从 0.77 GB 降到 0.20 GB。这个结果直接测量 layer sharding 的 allocation 变化，约等于理想 $1/P$ 的量级。运行时还需要在非 owner layer 上 broadcast，因此内存收益与 latency 需要分别评估。

#### 6.4 Ring inference CP 给出跨节点强扩展上界

《Context Parallelism for Scalable Million-Token Inference》使用 pass-KV / pass-Q exact ring attention，在 16 nodes、128×H100 上报告 Llama3-405B 的 1M Prefill 为 77 s、parallelization efficiency 93%、MFU 63%，128K Prefill 为 3.8 s。该系统通过分布式 KV ownership、ring communication 和算法选择器覆盖 full Prefill、persistent-KV Prefill 与 Decode。

这组结果说明 CP 的算法可以跨节点扩展；它使用 dense GQA、固定模型和专用实现，无法直接代表 SGLang DSA all-gather 路径。两者共同支持一个更稳健的判断：**长 Prefill 提供足够计算强度时，context 维可以成为 TP 之外的有效 scale-out 轴；collective 形式需要随 Q/KV 比例和拓扑变化。**

### 7. Prefill CP 能否扩展到更广模型

#### 7.1 数学机制的适用范围

| 模型 / attention | 可分片部分 | 全局依赖 | 更合适的实现倾向 | 关键边界 |
| --- | --- | --- | --- | --- |
| Dense MHA | query rows、QKV projection、MLP | 每个 Q 需要完整 causal K/V | all-gather、Ring CP 或 UP | $L^2$ compute 很大；MHA KV 通信也大 |
| GQA | query rows | 完整但较少 KV heads | pass-KV / Q-sharded CP；UP 在 KV-head degree 内可用 | 较小 $h_{kv}$ 有利于 KV communication |
| MQA | query rows | 单个 KV head 的完整 history | Q-sharded / Ring CP | UP 的 head partition 空间较小，KV 复制需审计 |
| MLA | query rows、latent-KV attention | 完整 latent KV 与 RoPE state | absorbed-MLA Q-sharded CP、Ring variant | projection absorption、FA3 / backend 和 cache layout 耦合 |
| DSA | local query indexer + selected attention | 全局 index keys、global top-$k$、selected latent KV | SGLang zigzag/interleave CP | distributed top-$k$、index cache 与 KV ownership 更复杂 |
| Block sparse / local attention | query blocks | mask 覆盖到的 remote blocks | topology-aware block ownership | sparsity 已降低 compute，通信更容易暴露 |
| Linear / recurrent attention | token blocks或 recurrent state | associative state / scan boundary | parallel scan、state handoff | 执行原语变成 scan，直接复用 softmax CP 收益模型会失真 |

#18233 和 #23292 已分别证明 MHA/GQA 与 MLA 可以接入同一上层 CP 概念。#23292 还指出 MLA CP 可复用 DSA CP 的 zigzag split、latent-KV gather、KV replication pool write、per-layer communicator 和 LM-head gather，主要新增 FA3 absorbed-MLA closure。这个复用关系说明 layout 与 metadata 可以模型无关；attention closure、cache materialization 与 selector 仍需要架构适配。

#### 7.2 DSA 的额外扩展难点：全局 top-k

当前 Q-sharded 路径让每个 rank 获得完整 index K，然后在本地对自己的 Q 求 top-$k$。如果进一步把 index K 按 sequence shard 并避免 gather，每个 rank 只能得到 local candidates：

$$
J_{i,r}=\operatorname{TopK}_{j\in K_r}s(q_i,k_j).
$$

全局结果需要再合并各 rank 的 local top-$k$：

$$
J_i=\operatorname{TopK}\left(\bigcup_{r=0}^{P-1}J_{i,r}\right).
$$

这会增加 candidate score communication、merge kernel、index remapping 与 selected KV routing。#18167 的 Decode DCP 选择保留完整 indexer K cache，并只按当前 rank 的 KV ownership 过滤最终 indices，正是为了控制这层复杂度。未来 DSA CP 的内存扩展需要在“复制 index K”和“distributed top-$k$”之间选择。

### 8. 能否扩展到更广 serving 场景

#### 8.1 多请求与 variable length

batch size > 1 要求每条请求独立维护：

- local token ownership 和 position IDs；
- causal boundary 与 prefix-cache hit 长度；
- gather 后的 KV offset、page table 和输出恢复顺序；
- 每个 rank 的有效 query-key pair 与 padding；
- 请求完成、取消、抢占和 cache eviction 的一致状态。

#13959 先为 DSA round-robin 路径处理 multi-batch，#23269 将 batch > 1 纳入 generic context-parallel metadata。生产负载还有 ragged context、不同 prefix hit 和混合 Prefill / Decode。静态按 token 数均分只控制一部分负载，scheduler 还要估计每请求的有效 pair、backend kernel region 和 cache transfer。

#### 8.2 Partial Prefill 与 prefix cache

多轮请求只有 $L$ 个新 token，已有 $C$ 个 token 命中 persistent KV。local Q 数由 $L$ 决定，attention history 由 $C+L$ 决定。此时 pass-KV 与 pass-Q 的优劣发生变化：

- full Prefill 中 $L$ 大，GQA 的 KV heads 少，传 KV 容易被大量 attention compute 隐藏；
- high-hit partial Prefill 中 $L\ll C$，传完整 cached KV 很昂贵，传较小的 Q 到 KV owners 往往更合适；
- pass-Q 需要把 partial attention output 合并并送回 query owner，额外 all-to-all 会进入关键路径。

因此 Prefill CP 的 production API 需要同时接收 new-token length、cached-KV length、KV-head ratio、topology 和当前 bandwidth，动态选择 all-gather、pass-KV、pass-Q 或 CP=1。一个固定 flag 难以覆盖所有 prefix-hit 区间。

#### 8.3 Prefill / Decode disaggregation

PD disaggregation 中，Prefill CP group 生成的 KV 最终需要交给 Decode workers。若每个 Prefill rank 都保留完整 KV，传输接口简单，内存和网络会重复；若 KV 按 sequence 或 layer 分片，Decode 侧需要从多个 source ranks 拉取并恢复自己的 layout。

#25846 为 sequence-sharded KV 增加 owner tracking、mirrored availability 和 eviction consensus；#29421 为 layer-sharded cache 增加 shard-aware registration、bootstrap handshake 和 all-rank transfer。#29421 修复记录还显示，一个遗漏的 all-rank transfer 条件会表现为首 token 正常、随后输出重复。这说明 KV sharding 同时改变内存管理、正确性协议和故障面。

#### 8.4 多租户调度与弹性 CP degree

把 $P$ 张 GPU 分给一条长请求可以缩短 TTFT；同一批 GPU 也可以通过 DP 同时服务 $P$ 条请求。系统需要在 single-request latency 与 cluster goodput 之间选择：

$$
P^*(r)
=
\arg\min_P
\left[
\widehat T_{\mathrm{TTFT}}(r,P)
+\lambda\,\widehat C_{\mathrm{opportunity}}(r,P)
+\mu\,\widehat R_{\mathrm{SLO}}(r,P)
\right].
$$

$C_{\mathrm{opportunity}}$ 表示这些 ranks 无法同时处理其他请求的机会成本。高并发短 prompt 通常更适合 DP / continuous batching；低并发超长 prompt、明确 TTFT SLO 或单卡无法容纳的 context 更适合较大 CP degree。

LoongServe 的 elastic sequence parallelism 提供了这类 scheduler 的早期系统证据：根据请求和阶段动态调整 parallel degree，并管理 KV migration 与 fragmentation。SGLang 当前 PR 链主要完善固定 CP group 内的执行能力；更广泛 scale 还需要按请求、按阶段弹性分配 ranks。

#### 8.5 跨节点拓扑

单节点 NVLink / NVSwitch 适合 all-gather；跨节点带宽和延迟会使同步 gather 更快暴露。可扩展部署通常使用二维分解：

```text
within node:   TP / TP+SP，利用高带宽互联分片模型权重
across nodes:  CP ring / hierarchical CP，交换较窄的 Q 或 KV
optional:      PP 分层，服务更大模型或建立 pipeline
```

GQA / MLA 的 KV 表示较窄，使 pass-KV 跨节点更有吸引力。MHA 的 KV 较宽，ring overlap、hierarchical collective 或 pass-Q threshold 更关键。拓扑应进入性能模型，`P` 相同的单节点与多节点配置不能共享一个静态阈值。

#### 8.6 Chat 之外的长序列推理

query-row independence 还出现在多类 forward-only workload：

- 长视频 / 多图 VLM 把视觉 patches 展开为很长的 decoder context，Prefill CP 可以分摊 self-attention；视觉 encoder 与 cross-attention 需要单独定义 token ownership。
- 长文档 reranking、embedding 或 bidirectional encoder 对所有 query rows 做 full attention，CP 仍可使用；没有 causal triangle 时负载均衡更直接，最终 pooling需要额外 reduction。
- RL 训练中的 reward model、critic、reference logprob recomputation 会批量处理长轨迹，inference CP 可以降低单个超长 sample 的 forward latency；trainer侧 backward仍由训练 CP / SP / UP处理。
- 离线 prompt ingestion、KV预热和大规模 prefix materialization拥有长 Prefill计算，也可能使用较大 CP degree；吞吐目标会要求更严格的 GPU-seconds对照。

这些场景共享 sequence维计算，调度目标和输出契约各不相同。Chat TTFT、offline throughput、verifier batch latency和 encoder pooling应分别建立 baseline。

### 9. Prefill CP 与 Decode CP 属于两个 operating region

Prefill 有 $L$ 个 query rows，可以分摊大量 compute。Decode 每一步通常只有 batch 中每条请求的一个 Q，单请求内部的 query parallelism 很低。Decode CP（DCP）更常见的目标是：

1. 把长 context KV 分散到更多设备，扩大 cache capacity；
2. 消除 TP 在 GQA / MQA / MLA 上造成的 KV head replication；
3. 每个 rank 对本地 KV 计算 partial attention，再合并 online-softmax state 或 output。

Decode 每个 token 都要执行 collective，且自回归 step 之间串行。通信更容易进入 token latency。SGLang #18167 的开放 DeepSeek-V3.2 DCP PR 报告 TP8+DCP8 理论上可将 KV capacity 扩大 8×，同时在其 4K/1.5K、H20×8 测试中出现 8%-13% 性能下降，主要优化项仍是通信。

[MLA TP cache sharding](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/) 进一步把 Decode operating region 写成缓存账本：DP Attention 沿请求减少副本，DCP 沿 token 分片，TPLA 沿 latent feature 分片，量化与分层缓存分别改变字节数和 HBM 驻留比例。这里继续聚焦 Prefill 的 query-row compute parallelism 与 TTFT。

所以 Prefill CP 成立的高计算强度条件不会自动迁移到 Decode。部署时至少分别选择：

$$
P_{\mathrm{prefill}}=f(L,C,\mathrm{backend},\mathrm{topology}),
\qquad
P_{\mathrm{decode}}=g(C,B,\mathrm{KV\ capacity},\mathrm{TP}).
$$

### 10. CP、SP、UP 应如何组合

#### 10.1 TP + SP：优化单个 model-parallel group 的 activation 与 collective

TP 负责 weight/head sharding，SP 让 residual / Norm activation 在 TP ranks 间按 sequence 驻留，并为 AsyncTP fusion 提供 reduce-scatter / all-gather layout。它适合 token 数较大的 Prefill。Decode token 数很小时，sequence shard underfill，SP pass 通常应由阈值关闭。

#### 10.2 TP + CP：常见的多节点长 Prefill结构

每个 CP rank 可以对应一个 TP group：节点内 TP 放下模型，节点间 CP 分摊 context。Meta inference CP 采用类似思路，通常固定节点内 TP=8，再增加 CP nodes。SGLang #17213 的 attention TP / CP group refactor也为这类二维布局提供基础。

#### 10.3 UP 与 Ring CP：同一目标下的不同 attention dataflow

UP 将 full sequence 集中到 head owners；Ring CP 让 full sequence KV 以 blocks 流过 query owners。选择取决于：

- $h_q$ / $h_{kv}$ 是否足够分给 UP ranks；
- all-to-all 与 ring P2P 在当前 topology 上的效率；
- 是否需要 persistent sequence-sharded KV；
- batch 是否 ragged，partial Prefill 是否高 cache hit；
- attention backend 是否能对 local blocks做 exact merge。

Unified Sequence Parallelism（USP）类工作会把 Ulysses 与 Ring 组织成二维网格，用 UP 处理一个维度、Ring 处理另一个维度。这类组合适合更高 degree，也增加了 process-group、layout transpose 和 kernel 复杂度。

#### 10.4 SP 与 CP 可以叠加，收益来源要分别计量

SP 减少 TP activation replication，CP 分摊一条请求的 query/context work。二者可以形成二维布局；每层可能同时出现 TP reduce-scatter/all-gather 与 CP KV collective。若通信链没有融合或重叠，叠加后的 collective 会竞争 NVLink / NIC。性能实验需要报告：

- TP、SP、CP degree 和 rank mapping；
- 每类 collective bytes、时间和 overlap%；
- peak activation、persistent KV 与 temporary gather buffer；
- attention、MLP、MoE、reorder 和 idle time 分解。

### 11. 一个更完整的 Prefill CP 成本模型

对给定请求和 degree $P$，可把 TTFT 写成：

$$
T_P(L,C)
=
\frac{T_{\mathrm{parallelizable}}(L,C)}{P\eta_{\mathrm{kernel}}(P,L)}
+T_{\mathrm{serial}}
+T_{\mathrm{collective}}(P,L,C)
+T_{\mathrm{layout}}
+T_{\mathrm{imbalance}}
-T_{\mathrm{overlap}}.
$$

其中：

- $\eta_{\mathrm{kernel}}$ 表示 local token 数变化后的 GPU 利用率；
- $T_{\mathrm{serial}}$ 包含 scheduler、未分片算子和必须串行的控制路径；
- $T_{\mathrm{collective}}$ 取决于 all-gather、all-to-all、ring 及 topology；
- $T_{\mathrm{layout}}$ 包含 split、position/KV reindex、padding 和 output restore；
- $T_{\mathrm{imbalance}}$ 来自 causal pairs、ragged batch、MoE routing 和 cache hit 差异；
- $T_{\mathrm{overlap}}$ 受 stream、dependency 和可用 compute window 限制。

speedup 与 parallel efficiency 分别为：

$$
S(P)=\frac{T_1}{T_P},
\qquad
E(P)=\frac{S(P)}{P}.
$$

production admission 应寻找满足 SLO 且 GPU-seconds 可接受的最小 $P$，而非追求最大的 $S(P)$。当 $P$ 增加到 local Q 过少或 collective 暴露时，$E(P)$ 会快速下降。

### 12. 三层可扩展性结论

#### 12.1 数学层：广泛成立

softmax attention、DSA 和多数 query-based sparse attention 都可以沿 query rows 分片。只要 local Q 获得全局 K/V、selector state 或可合并的 partial attention state，计算语义可以保持。MHA、GQA、MLA 与 DSA 的 PR 已覆盖主要架构族。

#### 12.2 实现层：正在从专用分支收敛

SGLang roadmap 明确指出早期支持只覆盖少量模型。#18233、#23292 扩大架构范围，#27252 继续把 zigzag/interleave、metadata、gather 和 attention dispatch 收敛到 strategy-owned abstraction。当前 backend、cache format、quantization、MTP、MoE 和 CUDA graph 仍可能需要专门 gate。

#### 12.3 生产层：需要弹性、拓扑感知和 KV 协议

稳定 scale 需要同时满足：

1. 按 $L$、$C$、prefix hit 和 SLO 选择 CP degree / algorithm。
2. 在 DP goodput 与单请求 TTFT 之间做 admission。
3. 为 sequence/layer-sharded KV 建立 owner、transfer、eviction、failure recovery 协议。
4. 支持 ragged multi-batch、取消、抢占、chunked Prefill 与 PD disaggregation。
5. 按节点拓扑组织 TP、SP、CP、EP / PP，测量 collective contention。
6. 对每个 model/backend/quantization 组合保持数值与 task-level parity。

基于这三层，最审慎的判断是：Prefill CP 很可能成为超长请求的常规 scale-out 维度，启用策略会长期保持 workload-dependent；短请求与高并发负载仍由 DP、continuous batching、prefix cache 和 chunked Prefill承担主要效率收益。

### 13. 部署决策表

| 现场条件 | 优先判断 | 推荐方向 | 需要警惕 |
| --- | --- | --- | --- |
| 单条 64K-1M full Prefill，低并发 | attention / indexer 已主导 TTFT | TP fit model + CP scale context | local Q underfill、跨节点 gather |
| 多条短 prompt，高并发 | queue goodput 主导 | DP + continuous batching，CP=1 或小 degree | CP 占用多 replicas 的机会成本 |
| 高 prefix-hit partial Prefill | $L\ll C$ | pass-Q / adaptive CP，或直接 CP=1 | 搬运完整 cached KV |
| GQA / MLA 长 Prefill | KV 表示较窄 | pass-KV、Q-sharded CP | backend-specific absorbed path |
| MHA 长 Prefill | compute 与 KV bytes 都大 | Ring CP / UP / topology-aware gather | MHA KV communication |
| DSA 长 Prefill | indexer 近二次项明显 | interleave / zigzag Q-sharded CP | global top-$k$、index cache replication |
| PD disaggregation | Prefill 和 Decode layout 不同 | explicit KV reshard / layer ownership | all-rank transfer、eviction consistency |
| Decode KV 容量不足 | KV replication 主导 | DCP / distributed KV | per-token collective 与 TPOT 下降 |
| TP activation 峰值或 GEMM comm 暴露 | Prefill token 数大 | TP + SP / AsyncTP fusion | SP threshold、static divisibility |
| head 数多、all-to-all 强 | sequence activation 主导 | UP | GQA/MQA/MLA head-degree 限制 |

### 14. 需要主动避免的误读

1. **把 CP 的 all-gather 当作复制整段 hidden 后再重复算 attention**：SGLang 路径主要复制 K/KV 可见性，Q rows 和多数 token-local work仍按 rank 分片。
2. **把 DSA 的 $O(Lk)$ 当作全部 Prefill 成本**：lightning indexer 仍扫描全历史，并保留小常数的近二次项；CP 对这部分尤其有价值。
3. **把 #13959 的 8.9%-32% 当成 CP 对 CP=1 的收益**：该数字比较旧 CP + DeepEP 与新 token layout + tuned fused MoE。
4. **把 Prefill CP 等同于 KV capacity 扩展**：full-KV replication 路径主要降低 TTFT；sequence/layer sharding或 Ring ownership 才直接扩大 per-rank cache capacity。
5. **把 SP 当作 attention context sharding**：Megatron SP 主要减少 TP residual / Norm activation，并为 collective fusion改写布局。
6. **只凭 UP / CP 名称判断层级**：Ulysses 原论文把 UP 归入 sequence parallelism；本文按 context scale-out 数据流将其与 Ring CP、all-gather CP 对照。它通过 all-to-all 完成 sequence-to-head layout transpose，并受 head 可分性约束。
7. **把 Prefill CP 的收益直接外推到 Decode**：Decode 的 Q 数很少，collective 逐 token 发生，优化目标更多转向 KV capacity 和 replication。
8. **用最大 CP degree 作为默认值**：production 应选择满足 TTFT SLO 的最小 degree，并计入 GPU-seconds 与其他请求的排队影响。

### 15. 结论链条

1. 长 Prefill 的 dense attention 或 DSA indexer包含大量可独立执行的 query rows。
2. CP 沿 query/context 维切分这些 rows，每个 rank 的本地工作接近 $1/P$。
3. exactness 要求 local Q 能访问完整 causal K/V、global selector candidates 或可合并的 partial state。
4. 长度增长使近二次 compute 比线性 KV communication 更快增长，形成通信可隐藏的 operating region。
5. causal triangle、ragged batch 和 MoE routing会破坏理想均分，zigzag/interleave 与独立 parallel groups用于控制 straggler。
6. SGLang PR 链已经把 DSA 专用实现扩到 MHA/GQA、MLA、多 batch、fusion、PD transfer 和 layer-sharded cache。
7. 当前 roadmap仍在统一模型/backend 分支，说明数学泛化已较清楚，runtime 泛化仍在建设。
8. 更广生产部署需要 elastic CP、topology-aware collective、KV ownership protocol 和 Prefill/Decode 分阶段选择。

## 关键实验/定理

### 结果 1：SGLang DSA CP 的 query-row 分片保持全局 attention 语义

- 设置：DeepSeek-V3.2 DSA，embedding 后按 CP rank 分片 hidden rows；local Q 数约 $L/P$；K / latent KV all-gather 后供每个 rank 使用。
- Baseline：单 rank 或非 CP 路径的完整 sequence attention / indexer。
- 指标：GSM8K accuracy parity 与 PR 中的模型级 correctness tests；#23292 还对 MLA rank-local CP output 和 single full-sequence FA3 output做 parity。
- 结果：#12065、#17213、#18233、#23292 的 accuracy tests报告通过；#23292 kernel parity覆盖 CP=2/4 和多个 block size，容差 `atol=5e-3, rtol=1e-3`。
- 证据定位：[PR #12065](https://github.com/sgl-project/sglang/pull/12065)、[#17213](https://github.com/sgl-project/sglang/pull/17213)、[#18233](https://github.com/sgl-project/sglang/pull/18233)、[#23292](https://github.com/sgl-project/sglang/pull/23292)。
- 对照是否可比：同模型路径的数值 / 任务 parity，适合检查执行正确性；GSM8K 样本和非确定性不足以证明 bitwise equivalence。
- 支持的最窄结论：query-row CP 在获得全局 KV 与正确 position / order metadata 后可以保持任务级行为；不同 collective 和低精度路径仍需更强 parity suite。

### 结果 2：round-robin 与 MoE backend 会改变已启用 CP 的端到端 TTFT

- 设置：DeepSeek-V3.2-Exp，8×H20 141GB，单并发，1K-64K random inputs，输出 1 token。
- Baseline：旧 CP + DeepEP；对照为 round-robin CP + tuned fused MoE。
- 指标：mean TTFT。
- 结果：1K 下降 32.25%，16K 下降 8.94%，64K 下降 8.89%。
- 证据定位：[PR #13959 Benchmarking and Profiling](https://github.com/sgl-project/sglang/pull/13959)。
- 对照是否可比：模型、硬件和 CP 主路径一致；token layout 与 MoE backend同时变化，属于 bundled optimization。
- 支持的最窄结论：CP 端到端效率依赖因果分片和非 attention backend；这些数字无法量化 CP 对 CP=1 的独立收益。

### 结果 3：通信重叠决定 CP saving 能否进入关键路径

- 设置：DeepSeek-V3.2 DSA Prefill CP；比较 synchronous key all-gather 与 dual-stream overlap。
- Baseline：default stream 上 gather 后再执行 query rotation。
- 指标：Nsight Systems kernel timeline。
- 结果：改动后 alt stream 的 gather / rerange 与 default stream query compute重叠，PR 描述通信被隐藏。
- 证据定位：[PR #20438 Performance Profiling](https://github.com/sgl-project/sglang/pull/20438)。
- 对照是否可比：同一 operator timeline；PR 未提供完整 workload matrix 和 E2E 统计。
- 支持的最窄结论：同步 gather 确实会成为 Prefill bottleneck，dual-stream 可创造 overlap；实际 TTFT gain 需按模型与长度复验。

### 结果 4：KV ownership 决定 CP 是否同时扩展内存

- 设置：GLM-5.2-FP8，78 layers，CP=4，8192 tokens，DSA Prefill CP interleave。
- Baseline：每个 rank 分配全部 layers 的 KV/indexer cache。
- 指标：per-rank cache allocation。
- 结果：layer split 后 0.77 GB/rank 降到 0.20 GB/rank，约下降 74%。
- 证据定位：[PR #29421 Summary](https://github.com/sgl-project/sglang/pull/29421)。
- 对照是否可比：同模型和 context 的内存对照；PR 缺少独立 TTFT / throughput 表。
- 支持的最窄结论：按 layer 分片可以把 persistent cache memory 接近按 CP degree 分摊；broadcast 与 PD transfer 会增加运行时复杂度。

### 结果 5：Ring CP 可以跨节点强扩展长 Prefill

- 设置：Llama3-405B、128×H100、16 nodes、1M context；exact ring pass-KV / pass-Q 系统。
- Baseline：论文的 TP / CP 与模型化对照。
- 指标：Prefill latency、parallelization efficiency、MFU。
- 结果：1M Prefill 77 s、parallelization efficiency 93%、MFU 63%；128K Prefill 3.8 s。
- 证据定位：[arXiv 2411.01783 Abstract、Sections 3-4](https://arxiv.org/html/2411.01783)。
- 对照是否可比：论文内对照完整度较高；模型、dense GQA、kernel 和网络拓扑与 SGLang DSA 路径不同。
- 支持的最窄结论：长 dense Prefill 在合适 ring algorithm 和 topology 下可以扩展到多节点；跨架构迁移需要重新选择 collective 与 KV layout。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 评测协议 | 主要证据来自 SGLang PR microbenchmark / accuracy tests 与 Meta inference CP 论文；没有统一 benchmark。 |
| 统计报告 | PR 多数缺少方差、置信区间和重复次数；Meta CP 报 scaling efficiency / MFU。 |
| Baseline 是否 tuned | #13959 对照中 tuned fused MoE 只出现在新路径；适合测 bundled optimization，弱于 CP causal ablation。 |
| Baseline 是否 compute-matched | 各 PR 内大致同模型 / 硬件；#22003 并行配置变化较大，因此本文不把其 latency 数字当成 CP 独立收益。 |
| Baseline 是否 implementation-matched | #20438 timeline、#29421 allocation较匹配；跨论文数字无法直接比较。 |
| Baseline 是否覆盖强替代方案 | SGLang PR 缺少统一 TP、PP、Ring CP、UP、chunked Prefill 与 DP goodput对照。 |
| Baseline 是否存在弱化风险 | 有。旧 CP 路径可能丢失 fusion、使用不同 MoE backend 或受到 single-batch 限制。 |
| 结论边界 | 机制和能力演进证据较强；production Pareto frontier 仍需统一 trace / topology / cost 实验。 |
| 模型与初始化 | DeepSeek-V3.2 / V3.2-Exp、GLM-5.2、Qwen3-MoE、DeepSeek-V3、Llama3-405B。 |
| 数据与任务 | random token inputs、GSM8K / MMLU accuracy checks；Meta CP 使用合成长度与 serving 场景。 |
| 系统配置 | H20 / H100；TP/CP/DP/EP 组合随 PR 变化；#13959 为 8×H20，Meta CP 扩到 128×H100。 |
| 框架基座 / paper base | SGLang attention / MoE / scheduler / cache / PD transfer；FA3、FlashMLA、DeepEP / fused MoE、NCCL；Meta 自研 exact ring inference CP。 |
| 框架版本与证据来源 | GitHub PR merge commit / status 与 arXiv 页面；开放 roadmap 和 developer-preview 文档按 2026-07-14 快照读取。 |
| 框架改动范围 | model forward、parallel state、CP metadata、attention backend、KV pool、cache ownership、PD connector、collective fusion 与 CUDA streams。 |
| 未披露项 | 多数 PR 的完整硬件拓扑、功耗、GPU-seconds、P95/P99、arrival process、跨租户 fairness 与统一 CP=1 baseline。 |

## 证据链强度评估

### 强证据

- query-row 分片的数学语义清楚：local Q 在获得完整 causal KV 或可合并 partial state 后可以独立计算。
- #12065 直接记录 local tensor shape、full-KV all-gather、zigzag ownership 和初版限制；后续 PR 可以逐项映射到这些限制。
- #18233 与 #23292 分别把路径扩到 MHA/GQA 和 MLA，支持架构层的可迁移性。
- #20438 的 timeline 直接定位 synchronous gather，#29421 的 allocation 直接定位 cache memory。
- Meta inference CP 给出多节点、百万 token 的 end-to-end scaling 证据。

### 中等强度证据

- #13959 的 TTFT 改善方向与负载均衡 / MoE backend 机制一致；bundled changes限制了归因精度。
- SGLang CP v2 strategy abstraction有明确模块和接口设计，迁移尚在进行，最终实现可能调整。
- vLLM inference SP 与 SGLang TP-SP WIP共同说明 SP 可用于 Prefill inference；硬件、模型和 compiler gate限制了通用性。
- LoongServe 支持按请求 / phase 弹性 sequence parallel 的系统价值；它与当前 SGLang CP implementation存在代际与框架差异。

### 需要谨慎的推论

- SGLang 当前缺少覆盖 DSA、MLA、GQA、MHA、不同 KV hit、不同 CP degree 和跨节点拓扑的统一公开矩阵。
- PR merge 状态说明代码进入 `main`，production maturity还需要 release、回归、故障恢复与多租户验证。
- full-KV all-gather CP 的 TTFT 收益无法自动推出 KV capacity收益；#25846 / #29421 所代表的 ownership 设计需要单独计量。
- sparse attention 已减少 core compute，在更高 sparsity 或更短 $L$ 下，communication可能更早成为主导。
- CP、SP、UP 的名称在框架间不统一，部署结论应绑定 tensor layout和 collective。

## OpenReview / 审稿意见吸收

- Page type: not-applicable
- Match confidence: high
- Observed at: 2026-07-14
- Venue status: 本材料为 SGLang PR / roadmap 与多篇公开论文的本地综合；DeepSpeed Ulysses、Ring Attention、Striped Attention、LoongServe、Megatron SP 和 inference CP 各自 venue 状态不在此统一重判。
- Public reviews: GitHub PR review提供实现级 correctness / integration反馈；它不等同于匿名论文评审。
- Ratings / confidence: 无统一评分。
- Reviewer consensus: 暂无可合并的跨材料 reviewer consensus。
- Main criticisms: 本地审计重点为 bundled benchmark、模型/backend 专用分支、full-KV replication、跨节点 topology、elastic scheduling 与 Prefill/Decode外推。
- Author response: 各 PR 通过 review thread、fix commit和后续 PR 迭代；未形成统一 rebuttal。
- 对可信度的影响: 核心数学机制与 PR 演进链可信度较高；通用 production speedup和最优并行度需要统一实验确认。

## 本地讨论补充

### 1. 讨论收敛点

- 推理侧 CP 的价值集中在单请求 TTFT 和超长 context容量，衡量时应同时报告 latency、GPU-seconds、cluster goodput 和 persistent KV bytes。
- SGLang DSA Prefill CP 的当前直观模型是“Q 按 token 分片，K/KV 全局可见，hidden 在层间继续分片”。这个模型足以解释计算收益，也直接暴露 KV复制边界。
- SP、UP 和 CP 的名称容易形成同级错觉。更可靠的层级是：SP 管 TP activation；UP / Ring / all-gather是 global attention dataflow；CP描述 context scale-out目标。
- Prefill CP 的核心优化对象随模型变化：dense MHA 主要是 $L^2$ attention；DSA 主要是小维度 $L^2$ indexer + $Lk$ selected attention；MLA 还要处理 projection absorption和 latent KV backend。
- Decode 侧的 MLA latent replication、DP Attention、DCP 与训练期可分片表示已经拆到独立综合；Prefill CP 保留长 prompt 计算、cache materialization 与跨阶段 transfer 的边界。

### 2. 修正后的理解

- CP 能提高效率的根因来自 query-row independence和长 Prefill 的高 arithmetic intensity。all-gather 本身会增加工作，收益取决于被分摊 compute能否覆盖它。
- 因果负载均衡属于 correctness之外的一级性能机制。等 token 数不等于等 attention pairs；zigzag和 interleave直接决定 straggler。
- KV Cache分片决定 CP 的第二类价值。full-KV replication侧重 latency；sequence / layer ownership和 Ring侧重容量与跨阶段 transfer。
- “支持一个模型”只证明 attention closure和当前 layout可用；通用 serving还要通过 batch metadata、cache protocol、parallel group、fusion和scheduler五层。

### 3. 后续复验指标

- 同模型、同 backend、同量化下 CP=1/2/4/8 的 TTFT、P95/P99、GPU-seconds和 parallel efficiency。
- 1K-1M context、0%-99% prefix hit、batch 1-32、MHA/GQA/MLA/DSA 的完整矩阵。
- attention/indexer、projection、MoE、collective、reorder、padding和 idle time分解；每类 collective bytes和 overlap%。
- persistent KV、temporary gather buffer、activation、allocator fragmentation和 PD transfer bytes。
- zigzag / interleave / contiguous 的 per-rank query-key pairs、kernel time和 straggler ratio。
- CP 与 DP / TP / TP+SP / PP / Ring / UP / chunked Prefill 的 latency-goodput Pareto。
- logits max error、KL、greedy common prefix、task accuracy和 batch-invariance检查。
- 取消、抢占、rank failure、cache eviction和 PD source缺失时的一致性恢复。

## 主要启发

- 长上下文推理的并行度应从“模型有多少参数”扩展到“当前请求有多少新 Q、多少 cached KV、使用何种 attention和拓扑”。
- CP 的可复用抽象应拥有 token layout、metadata、global-attention primitive和 KV ownership；模型只提供 attention-specific closure与 cache representation。
- Prefill/Decode、full/partial Prefill需要各自的通信算法选择器。Q/KV bytes比、cache hit和可重叠窗口比固定模型名称更适合作为决策变量。
- 并行优化的真实边界经常位于相邻子系统：MoE、fusion、PD transfer和cache eviction都可能决定 attention CP 的端到端效果。
- 论文或 PR 报告 CP 收益时，应同时给出 CP=1 baseline、相同 MoE/backend、collective分解、memory layout和 GPU-seconds，减少 bundled optimization造成的归因歧义。

## 局限

1. 本综合跨越论文与持续变化的 PR，代码路径、flag和状态会继续演进。
2. SGLang PR benchmark缺少统一实验协议，部分结果同时改变 token layout、MoE backend、量化或并行配置。
3. 公开材料对多租户、抢占、故障恢复、功耗和成本披露有限。
4. UP 的 serving适配主要依据张量布局和训练系统证据，缺少与当前 SGLang CP 的同栈端到端对照。
5. vLLM developer-preview SP 和 SGLang开放 WIP只说明 inference SP方向，稳定支持范围需按 release复验。
6. DSA distributed top-$k$、sequence-sharded index cache和跨节点 sparse-attention kernel仍缺少完整公开实现对照。
7. Meta inference CP的 128-GPU结果证明一个 dense GQA operating region，跨模型、稀疏 attention和不同网络的外部有效性仍需验证。

## 跨论文关系

- 与 [DeepSeek-V3.2](/papers/2512.02556-deepseek-v3-2-open-large-language-models/)：DSA 将 core attention降到 $O(Lk)$，lightning indexer仍扫描全历史；SGLang Prefill CP按 query rows分摊 indexer和 selected attention，并处理全局 index/KV可见性。
- 与 [Ring Attention](/papers/2310.01889-ring-attention-blockwise-transformers-near-infinite-context/)：Ring Attention提供 local Q + rotating KV blocks + online-softmax merge；SGLang初版使用 full-KV all-gather。两者实现同一 CP契约，内存上界和通信流水不同。
- 与 [DeepSpeed Ulysses](/papers/2309.14509-deepspeed-ulysses-long-sequence-training/)：Ulysses通过两次 all-to-all在 sequence-sharded和 head-sharded布局间转换，提供 UP这一 attention dataflow；它与 query-sharded / Ring CP共享 context scale-out目标。
- 与 [FlashAttention](/papers/2205.14135-flashattention-io-aware-exact-attention/) 和 [FlashAttention-2](/papers/2307.08691-flashattention-2-parallelism-work-partitioning/)：FlashAttention家族优化 rank内 exact-attention IO和kernel work partition；CP优化 rank间 query/context分解。二者通常叠加。
- 与 [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)：MLA缩小需要缓存和传输的 KV representation，projection absorption决定 Prefill CP backend能否直接使用 latent KV；#23292把这一结构接入 FA3 CP closure。
- 与 [MLA TP cache sharding](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/)：该综合接续本笔记的 Decode CP 边界，比较 head-TP replicated latent、DP Attention request ownership、DCP sequence ownership 与 latent-dimension sharding；本笔记保留 Prefill query sharding、causal balance 和 TTFT 主线。
- 与 [GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/)：GLM-5.2同样使用 DSA / 长上下文；#29421为其 Prefill CP增加 cache layer split和 shard-aware PD transfer，补充该笔记中的系统部署路径。
- 与 [IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/)：IndexCache减少 DSA跨层重复 indexer计算，Prefill CP分摊保留下来的 query-side indexer。两者可叠加，compute下降后 CP communication会更早暴露。
- 与 [SARATHI](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/)：SARATHI沿时间将长 Prefill切成 chunks以改善 mixed batching；CP沿空间把同一 Prefill分给多 ranks。production scheduler需要联合选择 chunk size与 CP degree。
- 与 [Batch-Invariant Inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：CP改变 reduction order、batch layout和kernel shape；RL rollout或严格复现场景仍需检查 logits / sampling的一致性。

## Reference Intake Brief

### Target

- Intended target system: 新增推理侧 Prefill Context Parallelism综合文档，回答效率机制、CP / SP / UP定义和生产扩展边界。
- Existing related assets: DeepSeek-V3.2、Ring Attention、DeepSpeed Ulysses、DeepSeek-V2、GLM-5.2、[MLA TP cache sharding](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/)、IndexCache、SARATHI和 Batch-Invariant Inference笔记；`content/utility/papers-index.md`。
- Proposed form: 新建 composite Markdown，并在相关独立笔记中加入反向关系。

### Reusable Elements

1. query-row independence、全局 KV可见性与 CP break-even不等式。
2. TP / Megatron SP / SGLang Prefill CP / Ring CP / UP的统一张量布局表。
3. 从 #12065 到 #29421 的能力演进链与“数学、实现、生产”三层扩展结论。
4. Prefill / partial Prefill / Decode的分阶段 algorithm selection与弹性 CP admission模型。
5. 面向后续论文写作的 benchmark审计项：CP=1、implementation matching、collective分解、KV ownership和 GPU-seconds。

### Risks

- Copyright/over-copying: 使用机制重述、少量关键数字、原创公式和对照表，不复制论文或 PR长段落。
- Unsourced or unverifiable claims: 公式中的成本分解标为本地分析；PR状态、数字和限制均链接到官方页面。
- Tone/brand mismatch: 使用系统分析语气，区分 capability、performance和 production maturity。
- Safety/compliance issues: 无直接安全风险。
- Overlap with existing assets: 独立笔记保留各论文完整证据；本综合负责术语统一、PR演进和 serving扩展判断。

### Skipped

| Material | Reason |
| --- | --- |
| 未合入 PR的稳定 CLI用法 | flag与 CP v2迁移仍会变化，避免把 roadmap写成 release契约。 |
| #22003 latency数字的因果比较 | 前后 MoE DP / EP并行配置变化较大，无法归因于单一 CP机制。 |
| #18167 DCP作为 Prefill收益证据 | 该 PR优化 Decode KV容量，且报告当前通信导致性能下降。 |
| 全部 SGLang CP代码逐文件审计 | 当前目标是跨 PR机制与扩展性；关键模块和接口已经定位。 |
| 本地 production build | 归档工作流规定由 GitHub Actions执行。 |

### Recommendation

Decision: merge

Why: 多组 PR已经形成从 DSA query分片、负载均衡和通信重叠，到模型泛化、并行组解耦、batch metadata与 KV ownership的完整演进链。结合 Ring、Ulysses和 Megatron SP后，可以清楚解释 Prefill CP为何有效、它与 SP / UP如何分层，以及向更广模型和 production serving扩展仍需完成哪些条件。
