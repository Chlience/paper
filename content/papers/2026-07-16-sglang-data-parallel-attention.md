# SGLang Data Parallel Attention：从请求所有权到 MoE 布局转换

First-Archived-At: 2026-07-16 15:51
Updated-At: 2026-07-16 15:58

## Source

- Workflow version: v2
- Material type: composite
- Canonical source: [SGLang DP、DPA 与 SMG 指南](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/docs_new/docs/advanced_features/dp_dpa_smg_guide.mdx)
- Title: SGLang Data Parallel Attention：从请求所有权到 MoE 布局转换
- Responsible organization: Chlience Paper Archive（本地综合）
- Code/Project: [sgl-project/sglang](https://github.com/sgl-project/sglang/tree/5cbea10e2fcd269809c26237c175a470719fc9fe)
- Initial implementation: [PR #1970: Support DP MLA](https://github.com/sgl-project/sglang/pull/1970)
- Release article: [SGLang v0.4](https://www.lmsys.org/blog/2024-12-04-sglang-v0-4/)
- Related changes and discussions: [PR #2061](https://github.com/sgl-project/sglang/pull/2061)、[PR #6121](https://github.com/sgl-project/sglang/pull/6121)、[Issue #16080](https://github.com/sgl-project/sglang/issues/16080)、[PR #22642](https://github.com/sgl-project/sglang/pull/22642)
- Initial implementation merged: 2024-11-16
- Published / updated: 2026-07-16（当前代码 revision）
- Current version read: SGLang `main` at `5cbea10e2fcd269809c26237c175a470719fc9fe`
- Version / revision read: 2026-07-16；仓库最新 release 为 `v0.5.15.post1`
- Accessed: 2026-07-16
- Subjects: Data Parallel Attention；MLA；KV Cache；Tensor Parallelism；Expert Parallelism；MoE serving；inference scheduling

## 作者与关系

- 这是一份基于框架文档、当前代码、release 文章和 PR / issue 的本地综合，没有单一论文作者。`data/authors.json` 因而无需新增论文作者 profile。
- [PR #1970](https://github.com/sgl-project/sglang/pull/1970) 由 GitHub contributor `ispobock` 提交，给出了最初的 DP MLA scheduler、IDLE forward mode、Attention DP 与 MoE TP 衔接路径；[PR #2061](https://github.com/sgl-project/sglang/pull/2061) 随后补入 CUDA Graph 支持。
- SGLang 项目把 DPA 从 DeepSeek-V2 / MLA 的专项优化扩展到更多模型和并行组合。[PR #6121](https://github.com/sgl-project/sglang/pull/6121) 记录了 Qwen2 / Qwen3 MoE 的适配与负结果；[PR #22642](https://github.com/sgl-project/sglang/pull/22642) 将 post-MoE 的 all-reduce 加本地切片融合为 reduce-scatterv 路径。
- 与本地已存档论文的作者没有可核验重叠。主题上直接连接 [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)、[MLA TP](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/) 和 [Prefill CP](/papers/2026-07-14-prefill-context-parallelism-inference-scaling/)；系统关系来自模型结构与 serving runtime 的组合，不据此推断作者合作关系。

## 一句话结论

SGLang DPA 在同一组全局 TP workers 内，把 Attention ranks 划成多个按请求拥有 KV Cache 的 DP groups，再通过 gather / dispatch / combine / reduce-scatter 把 DP-local Attention 与全局 TP 或 EP MoE 连接起来；对于缓存受限的高并发 MLA decode，它可把单条请求的 cache 副本数从 $T$ 降到 $T/D$，代价是 Attention 权重复制、层间 collective、空闲 rank 同步与跨 DP 负载均衡。

## 阅读目标与判断边界

这份分析关注：

1. `--tp`、`--dp-size`、Attention TP、MoE TP / EP 在当前 SGLang DPA 中分别代表什么，物理 GPU 数如何计算。
2. 一条请求从 scheduler 进入 decoder layer 后，token rows、KV Cache 和 hidden states 如何跨越 Attention 与 MoE 的并行布局。
3. DPA 的容量收益、通信成本和负载不均衡如何共同决定适用区间。
4. 初始 PR、后续适配与性能 issue 能支持哪些结论，哪些数字缺少统一对照。

判断边界：

- 代码机制以 commit [`5cbea10e`](https://github.com/sgl-project/sglang/tree/5cbea10e2fcd269809c26237c175a470719fc9fe) 为准。命令行行为会随 release 变化，部署时应以目标版本重新核对。
- 性能数字来自不同年份、模型、GPU、互连和 workload。它们用于建立 operating region，不能直接拼成跨硬件排名。
- MLA 的 latent cache 复制是 DPA 最清晰的收益场景。标准 MHA / GQA 可能已经沿 KV heads 做 TP 分片，缓存账本和通信账本需要按模型重算。
- 文中的 rank 表和张量记号是依据当前代码重建的最小例子；生产实现还包含 CUDA Graph、TBO、PD disaggregation、speculative decoding 与多个 communication backend 分支。

证据写法：

- 框架事实：官方指南、当前代码、合并 PR 或 release 直接给出的内容。
- 贡献者主张：PR 描述、issue 讨论或 release 文章中的归因。
- 本地分析：由 rank 公式、张量布局和实验条件推导出的容量模型、适用边界与排查方法。
- 关键判断附 `证据定位`，尽量落到文件、类、函数、PR 或 benchmark 条件。

## 论文脉络

### 1. TP 扩大后，MLA Cache 为什么会重复

以 DeepSeek-V2 / V3 的 MLA decode 为例。每个 token 写入共享的 compressed KV latent 和独立 RoPE key。Attention 的 query heads 可以沿 TP ranks 分片，压缩 latent 需要对所有 query heads 可见；常见 absorbed decode 路径因此在 TP ranks 上保存同一请求的 latent cache 副本。

设一个 serving 实例使用 $T$ 个 TP ranks，每个请求已经生成 $L$ 个 cache positions，每个位置的 MLA cache 宽度为 $d_c+d_r$，存储 dtype 为 $b$ bytes。忽略 allocator block、对齐和附加 metadata 时，一条请求在 TP-only 布局中的集群 cache 占用近似为：

$$
M_{\mathrm{TP}} \approx L(d_c+d_r)bT.
$$

TP degree 增大可以分摊模型权重和矩阵计算，cache 副本数也随 $T$ 增长。高并发 decode 的直接结果是：每个 rank 都保存相同请求的 latent，新增 GPU 带来的 KV 容量扩展低于预期。更完整的 MLA cache 公式与 MHA / GQA 对照见 [MLA TP](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/)。

DPA 选择另一种请求所有权：每条请求只交给一个 Attention DP group。group 内仍可保留 Attention TP 或 CP，group 外的 ranks 不保存该请求的 KV。设 Attention DP degree 为 $D$，Attention CP degree 为 $C$，每个 Attention group 的 TP degree 为：

$$
A=\frac{T}{DC}.
$$

当 $C=1$ 时，一条请求的 cache 副本近似从 $T$ 变为 $A=T/D$：

$$
M_{\mathrm{DPA}} \approx L(d_c+d_r)b\frac{T}{D},
\qquad
\frac{M_{\mathrm{DPA}}}{M_{\mathrm{TP}}}\approx\frac{1}{D}.
$$

这个比例描述同一 cache shape 的副本变化。真实容量还要扣除 Attention 权重复制、MoE 权重、CUDA Graph pool、page allocator 碎片和 runtime workspace。

### 2. DPA 复用同一组物理 workers

`--dp-size` 在 SGLang 里有两种资源语义。普通 data parallel controller 会为每个 DP replica 启动一组独立 TP workers；DPA 复用同一组全局 TP workers，在组内重新解释 Attention 的 rank topology。

| 配置 | 普通 DP | 启用 `--enable-dp-attention` |
| --- | --- | --- |
| `--tp 8 --dp-size 4` | 4 个 TP8 replica，共 32 张 GPU（未计 PP） | 1 个全局 TP8 worker 集，共 8 张 GPU（未计 PP） |
| 请求路由 | 选一个完整模型 replica | 选全局 TP group 内的一个 Attention DP group |
| Attention KV | replica 内按模型的 TP 布局保存 | 只由目标 Attention DP group 保存 |
| 共享 MLP / MoE | replica 内执行 | 通过全局 TP 或 EP 布局连接各 DPA batches |

证据位于 [`DataParallelController`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/managers/data_parallel_controller.py)：普通 DP 路径按 DP rank 创建 TP group，DPA 路径 `launch_dp_attention_schedulers` 只创建一个全局 TP group，并为每个 rank 计算逻辑 Attention DP rank。

当前参数约束的核心是：

$$
D>1,\qquad T\bmod D=0.
$$

如果还启用 Attention CP，则需要 $T$ 同时容纳 $D\times C\times A$。[`compute_dp_attention_world_info`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/layers/dp_attention.py) 使用 `(dp, cp, tp)` 的 rank layout，其中 Attention TP 变化最快。可以把当前公式压缩为：

```python
# 由当前实现化简出的 rank 关系；T 必须能被 D*C 整除
A = T // (D * C)
attention_dp_rank = global_tp_rank // (A * C)
attention_tp_rank = global_tp_rank % A
```

### 3. 一个 `TP=8, DP=4` 的 rank 例子

取 $T=8$、$D=4$、$C=1$，则 $A=2$。8 个物理 ranks 同时拥有两套身份：全局 TP rank 用于共享 MLP / MoE 路径，Attention rank 用于 DPA group 内计算。

| 全局 TP rank | Attention DP rank | Attention TP rank | 该 group 拥有的请求 |
| ---: | ---: | ---: | --- |
| 0 | 0 | 0 | `a, b` |
| 1 | 0 | 1 | `a, b` |
| 2 | 1 | 0 | `c` |
| 3 | 1 | 1 | `c` |
| 4 | 2 | 0 | `d, e, f` |
| 5 | 2 | 1 | `d, e, f` |
| 6 | 3 | 0 | 暂时无请求 |
| 7 | 3 | 1 | 暂时无请求 |

请求 `a` 的 KV 只出现在 ranks 0–1，副本数为 $A=2$；TP-only 下它会出现在 8 个 ranks。Attention projections 只在大小为 2 的 group 内分片，同时在 4 个 DPA groups 之间复制。DeepSeek MLA 实现中，[`DeepseekV2AttentionMLA`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/models/deepseek_v2.py) 使用 `attn_tp_rank` / `attn_tp_size` 构造 q、kv_b 和 o projection 的分片；部分 latent projection 使用 replicated linear。由此可以得到更准确的资源描述：DPA 复制 Attention 权重分片，减少每条请求的 KV 副本，MoE experts 仍可沿全局 TP / EP ranks 分布。

当 $D=T=8$ 时，$A=1$。每个 Attention DP rank 独立执行一组请求的 Attention，并拥有完整的 Attention heads。这个 full DPA 布局最大化 KV 容量；Attention 权重复制和跨阶段通信也达到该配置下的高位。partial DPA 允许在两者之间选择，例如 `TP=8, DP=2` 得到两个 Attention TP4 groups。

### 4. 一个 decoder layer 如何跨越两套布局

DPA 的核心执行链可以写成以下近似伪代码：

```python
local_rows = attention(local_batch, local_kv_cache)

# 进入共享 TP-MLP / TP-MoE 前，将各 DPA batch 映射到目标布局
shared_rows = gather_or_redistribute(local_rows, token_counts)
shared_rows = mlp_or_moe(shared_rows)

# 每个 Attention DP group 取回自己请求的 token rows
local_rows = reduce_scatter_to_owner(shared_rows, token_counts)
```

在上面的 8-rank 例子里，Attention 输入按 rank 可表示为：

```text
rank:       0    1    2   3    4      5      6   7
local rows: ab   ab   c   c   def    def     ∅   ∅
```

同一个 Attention TP group 内的 ranks 处理相同请求 rows，只分摊 heads / projections；不同 DPA groups 处理不同请求。进入普通 TP MoE 时，计算需要看到所有 DPA groups 的 token rows，于是 communicator 把 DP-local rows 转成全局 rows，再由 TP-sharded MLP / MoE 计算。输出经过 reduction 后按原始 token counts 切回 `ab`、`c`、`def` 与空区间。

[`ScatterMode`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/layers/communicator.py) 把这些状态显式编码为 `SCATTERED`、`TP_ATTN_FULL`、`FULL` 和 `MOE_FULL`。代码注释给出的 TP4 / DP2 例子与上面的推导一致：Attention 侧是 `[ab, ab, cd, cd]`，scattered 状态是 `[a, b, c, d]`，全局状态是每个 rank 都持有 `abcd`。

这种转换解释了 DPA 的主要通信成本。KV 不再跨所有 TP ranks 复制，hidden states 需要在 Attention 与共享 MLP / MoE 的边界交换。每个 decoder layer 都包含这条边界，因此互连带宽、token 数、padding 和 kernel 融合会直接影响收益。

### 5. DPA 与 EP 组合后，token 走 all-to-all

MoE 的 gate 已经给每个 token 选择少量 experts。启用 Expert Parallel 和 DeepEP 后，各 DPA rank 可以保留本地 token rows，随后把 token 直接 dispatch 给 expert owner：

```text
DPA-local rows
  -> gate / top-k expert ids
  -> all-to-all dispatch
  -> local expert compute
  -> all-to-all combine
  -> owner DPA rank
```

这条路径利用 MoE 固有的 token routing 完成跨 rank 重排，避免先把所有 DPA batches 物化为每个 rank 的完整 dense token buffer。当前官方指南因此把 DPA 与 EP 列为常见组合；[`parallel_state.py`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/distributed/parallel_state.py) 分别创建 Attention DP / CP / TP groups 与 MoE DP / EP / TP groups，说明两套 topology 可以独立配置。

EP 也会带来额外约束。expert load 取决于 gate 分布，all-to-all 对网络拓扑更敏感，小 batch 下每个 expert 得到的 token 太少，kernel utilization 会下降。[PR #6121](https://github.com/sgl-project/sglang/pull/6121) 在 4 张 A40 PCIe 上的 Qwen MoE 测试正好展示了这个边界：功能适配成功，DPA / EP 配置没有超过 TP baseline。

### 6. Scheduler 必须让 prefill、decode 与 idle ranks 同步

每个 Attention DP rank 维护自己的 local batch 和 KV Cache。某一时刻可能出现以下组合：

- DP0 正在执行长 prompt prefill；
- DP1、DP2 正在 decode；
- DP3 没有请求。

这些 ranks 随后仍要进入同一组 MoE / MLP collectives。缺少工作的 DP3 需要参与通信，prefill 与 decode ranks 也需要先对齐本轮 token 数、forward mode 和 CUDA Graph 条件。SGLang 在 [`scheduler_components/dp_attn.py`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/managers/scheduler_components/dp_attn.py) 中收集以下 metadata：

- 每个 DP rank 的 `num_tokens` 与 logprob token 数；
- 当前是 extend / prefill、decode 或 idle；
- CUDA Graph 是否可用；
- TBO microbatch 和 forward mode 信息。

本地没有请求、其他 DPA ranks 有工作时，scheduler 创建 `IDLE` batch。它保持 collective 调用序列一致，避免某个 rank 跳过 all-gather / all-reduce 后让整个 process group 等待不匹配的通信。初始 [PR #1970](https://github.com/sgl-project/sglang/pull/1970) 已经把 IDLE mode 列为必要组成，随后 [PR #2061](https://github.com/sgl-project/sglang/pull/2061) 才补齐 CUDA Graph 的动态 batch shape 处理。

这也说明负载均衡属于 DPA 的正确性外层和性能内层。请求路由均匀只能平衡请求数；不同 context length、prefill chunk 和 decode 剩余长度仍会制造 token imbalance。当前 [`DataParallelController`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/managers/data_parallel_controller.py) 支持 `round_robin`、`follow_bootstrap_room`、`total_requests`、`total_tokens` 和显式 `routed_dp_rank` 等策略，并维护 running / waiting requests 与 token budget。[Issue #16080](https://github.com/sgl-project/sglang/issues/16080) 记录了这套接口从简单 round-robin 向 token-aware 与 external routing 扩展的设计压力；issue 仍处于开放状态，当前代码已经落地其中多项能力。

### 7. Gather、padding 与 reduce-scatter 的当前实现

不同 DP ranks 的 token 数通常不相等。collective 需要确定全局 buffer shape，SGLang 在 [`dp_attention.py`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/layers/dp_attention.py) 中保留两种主要 padding / gather 模式：

| 模式 | 全局 buffer | 通信方式 | 适用考虑 |
| --- | --- | --- | --- |
| `MAX_LEN` | $D\times\max_i n_i$ | 等长 `all_gather` | shape 规则，CUDA Graph 捕获容易；imbalance 大时 padding 多 |
| `SUM_LEN` | $\sum_i n_i$ | 各 rank 写自己的 slice 后 `all_reduce` | extend / prefill 下减少最大长度 padding；会传递零填充的共享 buffer |

其中 $n_i$ 是 DP rank $i$ 的本轮 token 数。`dp_gather` 记录 local start、local count 和 global buffer length；`dp_scatter` 再从全局结果中切出当前 rank 的 `[start:start+n_i]`。环境变量 `SGLANG_DP_USE_GATHERV` 可以在满足限制时启用精确 variable-length all-gatherv，当前默认关闭，主要限制是 `attn_tp_size=1` 且使用 `SUM_LEN`。

post-MoE 的早期路径先做 all-reduce，再由每个 rank 本地 slice。两步在数学上等价于按 DPA owner 的 reduce-scatter。合并后的 [PR #22642](https://github.com/sgl-project/sglang/pull/22642) 加入 reduce-scatterv 融合路径，把通信轮数减半；当前实现通过 `dp_reduce_scatter_tensor` 和 backend capability 决定是否使用。TBO 还可以在独立 communication stream 上让一个 microbatch 的 gather / combine 与另一个 microbatch 的计算重叠。

[`forward_batch_info.py`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/model_executor/forward_batch_info.py) 保存 global token count、padding mode、本地 slice 与 global buffer length。某些可中断 prefill CUDA Graph shape 会强制选择 `MAX_LEN`。因此，看到 DPA 性能下降时，`dp_size` 只是起点；每轮 `n_i` 分布、padding ratio、graph capture 命中率、collective bytes 和 overlap 才能解释数据路径。

### 8. 可运行配置与逐步验证

下面的命令展示参数关系。模型大小、量化方式和 backend 需要按硬件调整。

#### 8.1 Full DPA + EP：高并发 MLA / MoE decode

```bash
python -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3 \
  --tp 8 \
  --dp-size 8 \
  --enable-dp-attention \
  --ep 8 \
  --moe-a2a-backend deepep \
  --moe-runner-backend deep_gemm \
  --load-balance-method total_tokens
```

这个配置使用 8 张 GPU。Attention TP degree 为 1，每个 DPA rank 拥有不同请求和对应 KV；MoE experts 沿 8 ranks 分布。模型能否放入显存还取决于 checkpoint dtype、quantization、expert layout 与 runtime memory fraction。

#### 8.2 Partial DPA：保留 Attention TP

```bash
python -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3 \
  --tp 8 \
  --dp-size 4 \
  --enable-dp-attention \
  --ep 8 \
  --moe-a2a-backend deepep \
  --load-balance-method total_tokens
```

这个配置仍使用 8 张 GPU，形成 4 个 Attention TP2 groups。相对 full DPA，它减少 Attention 权重复制和 group 数，单条请求保留 2 份 KV。相对 TP-only，它把单请求 KV 副本从 8 降至 2。

#### 8.3 先隔离 DPA 布局，再加入 EP

排查时可以先固定模型、dtype、request trace 和 `TP=8`，依次比较：

```text
A. TP-only:           --tp 8
B. partial DPA:       --tp 8 --dp-size 4 --enable-dp-attention
C. full DPA:          --tp 8 --dp-size 8 --enable-dp-attention
D. full DPA + EP:     C + --ep 8 --moe-a2a-backend deepep
```

每组至少同时记录：

| 账本 | 建议指标 |
| --- | --- |
| 容量 | KV bytes / request、可驻留请求数、cache hit / eviction、每 rank free memory |
| 调度 | 每个 DPA rank 的 running / waiting requests、prefill / decode / idle 时间、token imbalance |
| 通信 | gather、all-to-all、combine、reduce-scatter bytes 与耗时，padding ratio |
| kernel | Attention、expert GEMM、CUDA Graph 命中、TBO overlap |
| 服务 | request throughput、output tok/s、TTFT、ITL、P50 / P95 / P99 latency |

如果 B 已经低于 A，先检查 batch 是否足够填满 4 个 DPA groups、Attention 是否属于 cache-replication-heavy 路径、PCIe / NVLink 带宽与 token imbalance。只有 C 有收益、D 回落时，重点检查 expert token 数、all-to-all 拓扑和 backend。高 TTFT 与稳定 ITL 同时出现时，长 prefill 对其他 DPA ranks 的 collective 形成等待是常见候选，Prefill / Decode disaggregation 可以把阶段拆开。

### 9. PR 与 issue 展示的演进边界

#### 9.1 初始收益来自“容量换 batch”，同时包含版本级改动

[PR #1970](https://github.com/sgl-project/sglang/pull/1970) 在 8×H100 上测试 DeepSeek-V2：prefill throughput 从 17,941.92 提升到 21,658.78 tok/s，decode throughput 从 6,656.75 提升到 11,174.62 tok/s，约为 $1.21\times$ 和 $1.68\times$。PR 讨论还指出 DeepSeek-V2 的 Attention 权重复制会增加显存压力，建议用 FP8 权重缓解。

[SGLang v0.4 release 文章](https://www.lmsys.org/blog/2024-12-04-sglang-v0-4/) 使用 8×H100 80GB、DeepSeek Coder V2 FP8、输入 1 / 输出 512、10,000 prompts、关闭 Radix Cache 的设置，报告相对 v0.3 最高 $1.9\times$ decode throughput。这个数字属于版本对比，v0.4 同时包含 DPA、调度和 kernel 改进；它能支持“DPA 所在的新版本显著提升该 workload”，无法给出 DPA 单项的严格 ablation。

#### 9.2 CUDA Graph 与 collective 融合逐步回收固定成本

初始 PR 明确把 CUDA Graph 与 overlap 列为后续工作，[PR #2061](https://github.com/sgl-project/sglang/pull/2061) 两天后补入 DPA CUDA Graph。这个演进顺序说明 DPA 的 rank decomposition 先解决 KV ownership，生产性能还依赖动态 shape 与 graph capture。

[PR #22642](https://github.com/sgl-project/sglang/pull/22642) 在 Qwen3.5-397B-A17B-FP8、1×GB200 节点 4 GPUs、`DP4 EP4 TP4`、ISL 1000 / OSL 1、concurrency 4096 上，将 throughput 从 53,006 提升到 57,115 tok/s，约 $7.7\%$；GSM8K accuracy 均为 97.86。这个实验支持“post-MoE reduce-scatterv 融合在超高并发短输出 prefill workload 上减少通信开销”，尚未覆盖长 decode、跨节点或不同 DP imbalance。

#### 9.3 功能支持与性能收益需要分别验证

[PR #6121](https://github.com/sgl-project/sglang/pull/6121) 把 DPA 扩展到 Qwen2 / Qwen3 MoE，并在 4×A40 PCIe 上重复测试。其 offline throughput 约为：TP baseline 1,202 tok/s、`TP=DP=4` 约 1,028 tok/s、`TP=DP=EP=4` 约 732 tok/s。Serving 结果中，DPA 无 EP 的 median TTFT 约 2,406 ms，TP baseline 约 2,564 ms；median ITL 则约 48.66 ms 对 45.10 ms。贡献者多次复验并确认 patch 没有降低 TP baseline，DPA 在该模型、PCIe 拓扑和 workload 下仍缺少吞吐优势。

这个负结果划定了三项边界：标准 Attention 的 KV 可能已经沿 heads 分片，DPA 减少副本的收益较弱；PCIe collective 成本高于 NVLink / NVSwitch；4 ranks 与当前 batch 未必能同时填满 Attention DP 和 EP experts。当前官方指南已经把 DPA 支持范围扩展到 Qwen 等标准 Attention 模型，部署判断仍需以模型的 KV layout 和实测为准。

代码与文档还存在一处版本漂移：当前 [`server_args.py`](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/python/sglang/srt/server_args.py) 的 `--enable-dp-attention` help text 仍写着 DP size 应等于 TP size、支持 DeepSeek-V2 / Qwen MoE；同一文件的实际校验已经允许 `tp_size % dp_size == 0`，官方当前指南也给出 partial DPA 与更多模型支持。自动化脚本应检查运行时约束和目标 release 文档，避免只依赖 help text。

### 10. 什么时候 DPA 更可能有效

| 条件 | 倾向 | 原因 |
| --- | --- | --- |
| MLA / 单 latent KV、长 decode、高并发 | 强 DPA 候选 | TP-only 下 cache 副本多，减少副本可直接扩大 active batch |
| MoE + 高速 all-to-all | DPA + EP 候选 | gate routing 可以完成 token 布局重排，expert 权重继续分布 |
| 模型必须靠大 TP 才能放入显存 | partial DPA 候选 | 保留 Attention TP 分片，同时获得部分 KV ownership 收益 |
| 低并发、单请求 latency 优先 | TP-only 通常更稳 | DPA groups 难以填满，collective 与 idle 同步成本占比高 |
| 标准 MHA / GQA 已良好切分 KV heads | 需要实测 | cache 副本减少幅度可能不足以覆盖跨 DP 通信 |
| PCIe-only、expert token 很少 | 谨慎启用 DPA + EP | gather / all-to-all 延迟和小 GEMM utilization 容易主导 |
| prefill 长度差异很大 | 配合 token-aware routing 或 P/D | 一个 DP rank 的长 prefill 会延长共享 collective 的完成时间 |

DPA 的 break-even 可以写成一个简单判断：

$$
\text{新增并发带来的有效计算收益}
>
\text{Attention 权重复制成本}
+\text{层间通信成本}
+\text{DP 不均衡与空闲成本}.
$$

左侧主要通过更大的 resident KV capacity 和 active batch 体现；右侧取决于模型结构、互连、请求长度分布和 backend。只看平均 output tok/s 会掩盖 TTFT / ITL 与 tail latency 的变化，容量、通信、调度和服务四套指标需要一起记录。

### 11. 结论链条

1. MLA 的 compressed latent 对所有 query heads 可见，常见 TP decode 会让同一请求的 cache 在 TP ranks 上复制。
2. SGLang DPA 在同一全局 TP worker 集内建立 Attention DP groups，请求和 KV 由一个 group 拥有；普通 DP 则复制完整 TP worker groups。
3. 对 $T$ 个全局 ranks、$D$ 个 DPA groups 和 Attention CP degree $C$，每个 group 的 Attention TP degree为 $A=T/(DC)$；单请求 cache 副本近似从 $T$ 降到 $A$。
4. 每个 group 独立维护 prefill / decode / idle batch。共享 MLP / MoE 要求 scheduler 同步 metadata，并在层边界转换 token layout。
5. TP-MoE 路径使用 gather 与 reduce-scatter；EP 路径使用 expert dispatch / combine all-to-all。通信 backend、padding、graph capture 和 overlap 决定转换成本。
6. H100 MLA 结果展示了容量受限高并发 decode 的显著收益；A40 Qwen MoE 负结果展示了标准 Attention、PCIe 和低利用率下的边界。
7. 因而部署应先确认 KV 是否复制，再选择 full / partial DPA，最后用固定 trace 对容量、调度、通信、kernel 和 tail latency 做联合验证。

## 关键实验/定理

### 结果 1：初始 DP MLA 在 8×H100 上提高 DeepSeek-V2 吞吐

- 设置：DeepSeek-V2，8×H100；初始 PR 对比 DPA 开关前后。
- Baseline：原 TP Attention / TP MoE 路径。
- 指标：prefill 与 decode throughput。
- 结果：prefill 17,941.92 → 21,658.78 tok/s；decode 6,656.75 → 11,174.62 tok/s。
- 证据定位：[PR #1970 benchmark](https://github.com/sgl-project/sglang/pull/1970)。
- 对照是否可比：同一 PR 内的硬件与模型可比；公开描述没有完整列出每项 runtime flag、request length distribution 与显存占用。
- 支持的最窄结论：在该 MLA / H100 配置中，DPA 实现能够显著提高 throughput。
- 解读：cache ownership 释放的容量使更大有效 batch 成为可能；数字同时包含初始实现中的调度与数据路径变化。

### 结果 2：v0.4 在固定 decode workload 上达到最高 1.9×

- 设置：8×H100 80GB、DeepSeek Coder V2 FP8、随机输入 1 / 输出 512、10,000 prompts、Radix Cache disabled。
- Baseline：SGLang v0.3。
- 指标：decode throughput。
- 结果：v0.4 最高约 $1.9\times$。
- 证据定位：[SGLang v0.4 release article, Data Parallelism Attention](https://www.lmsys.org/blog/2024-12-04-sglang-v0-4/)。
- 对照是否可比：模型、硬件和 workload 固定；版本包含 DPA 之外的多项改动。
- 支持的最窄结论：集成 DPA 的 v0.4 在该短输入、长输出、高请求数场景显著超过 v0.3。
- 解读：它强化了 DPA 面向高并发 decode 的系统价值，不能单独估计 DPA 的净贡献。

### 结果 3：Qwen MoE / A40 PCIe 上，DPA 与 EP 没有超过 TP

- 设置：Qwen2 / Qwen3 MoE 适配，4×A40 PCIe，多次重复 benchmark。
- Baseline：TP-only，offline throughput 约 1,202 tok/s。
- 指标：offline throughput、median TTFT、median ITL。
- 结果：DPA 无 EP 约 1,028 tok/s；DPA + EP 约 732 tok/s。DPA 无 EP 的 median TTFT 略低，ITL 略高。
- 证据定位：[PR #6121 benchmark and discussion](https://github.com/sgl-project/sglang/pull/6121)。
- 对照是否可比：同一硬件与模型族，多次复验；PR discussion 中仍有配置与实现演进，结果不代表当前版本全部 backend。
- 支持的最窄结论：DPA 功能扩展到标准 Attention / Qwen MoE 后，在该 PCIe 配置没有形成吞吐收益。
- 解读：KV replication reduction、互连成本和 expert utilization 应逐模型核算。

### 结果 4：post-MoE reduce-scatterv 融合提高 7.7% 吞吐

- 设置：Qwen3.5-397B-A17B-FP8，1×GB200 node / 4 GPUs，`DP4 EP4 TP4`，ISL 1000、OSL 1、concurrency 4096。
- Baseline：all-reduce 后执行本地 `dp_scatter`。
- 指标：throughput 与 GSM8K accuracy。
- 结果：53,006 → 57,115 tok/s，约 $7.7\%$；accuracy 均为 97.86。
- 证据定位：[PR #22642](https://github.com/sgl-project/sglang/pull/22642)。
- 对照是否可比：同一 PR 内对照直接，功能等价性有 accuracy smoke test；workload 偏向长输入、单 token 输出和极高并发。
- 支持的最窄结论：融合 post-MoE reduction 与 DPA scatter 能减少该配置的通信轮次并提高吞吐。
- 解读：DPA 进入成熟阶段后的优化重点已经从 rank decomposition 延伸到每层 collective 数量与 variable-size buffer。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 评测协议 | 四组结果来自不同 PR / release；逐组保留模型、硬件、请求长度和并发口径 |
| 统计报告 | #6121 说明多次复验；其余以单组 throughput 为主，缺少方差与置信区间 |
| Baseline 是否 tuned | #22642 为同实现前后；#1970 与 v0.4 没有完整披露 baseline tuning |
| Baseline 是否 compute-matched | 同一组内 GPU 数大体一致；v0.3 / v0.4 属于 version-matched，内核与调度并非单变量 |
| Baseline 是否 implementation-matched | #22642 最强；#1970 次之；release version comparison 最弱 |
| Baseline 是否覆盖强替代方案 | 没有统一覆盖 TP-only、partial DPA、full DPA、DPA+EP、DPA+CP 与 P/D |
| Baseline 是否存在弱化风险 | v0.3 可能缺少 v0.4 的其他优化；A40 PCIe 结果可能低估高速互连上的 DPA + EP |
| 结论边界 | 只能建立按模型、拓扑与 workload 划分的 operating region |
| 模型与初始化 | DeepSeek-V2 / Coder V2、Qwen2/3 MoE、Qwen3.5-397B-A17B-FP8 |
| 数据与任务 | 合成 serving / offline benchmark；#22642 另含 GSM8K smoke test |
| 系统配置 | H100 8-GPU、A40 PCIe 4-GPU、GB200 4-GPU；跨节点结果缺失 |
| 框架基座 / paper base | SGLang serving runtime：scheduler、Attention、MoE、collective 和 CUDA Graph 路径 |
| 框架版本与证据来源 | 初始 PR 2024；当前代码 commit `5cbea10e`，2026-07-16；各结果保留原 PR revision |
| 框架改动范围 | DPA scheduler 与 rank groups、Attention / MoE layout conversion、CUDA Graph、reduce-scatterv、load balancing |
| 未披露项 | 多数实验缺少完整 command、每 rank memory、KV capacity、collective trace、P95 / P99 与统计方差 |

## 证据链强度评估

### 强证据

- 当前代码明确区分普通 DP 的多 TP replicas 与 DPA 的单全局 TP group，并给出 Attention DP / CP / TP rank 公式。
- communicator、DPA scheduler 和 forward metadata 代码共同显示 DP-local Attention、全局 / EP MoE、IDLE batch、padding 与 scatter 的完整连接链。
- #22642 是相同模型、硬件、配置下的 collective 前后对照，最适合支持 reduce-scatterv 融合的局部结论。

### 中等强度证据

- #1970 与 v0.4 的 H100 结果一致支持 MLA 高并发 decode 的收益方向，缺少完整的显存与 latency breakdown。
- #6121 的多次负结果可以约束 Qwen MoE / A40 PCIe 的适用边界，当前主干已经经历大量后续优化。
- #16080 与当前 controller 的差异显示 load balancing API 的演进，开放 issue 状态意味着 umbrella 目标仍未整体关闭。

### 需要谨慎的推论

- “DPA 将 KV 总容量提高 $D$ 倍”只在 KV 副本主导、cache shape 相同且其他显存开销可忽略时成立；真实倍率通常更低。
- “DPA + EP 总是优于 DPA + TP”缺少跨模型、跨互连的统一证据；A40 结果给出反例。
- full DPA 与 partial DPA 的最佳点依赖 Attention 权重、KV 长度、batch、all-to-all 和 latency SLO，无法从 `tp` / `dp` 两个参数直接确定。

## OpenReview / 审稿意见吸收

- Page type: not-applicable
- Match confidence: high
- Observed at: 2026-07-16
- Venue status: framework documentation / code / PR and issue synthesis
- Public reviews: 无学术审稿页
- Ratings / confidence: 不适用
- Reviewer consensus: 不适用
- Main criticisms: PR / issue 讨论主要关注 correctness、模型覆盖、通信成本、load balance 与 benchmark regression
- Author response: 贡献者通过 CUDA Graph、Qwen 适配、token-aware routing 与 reduce-scatterv 等后续改动逐步处理
- 对可信度的影响: 代码路径证据强，跨版本性能归因仍需使用者在目标硬件复验

## 本地讨论补充

### 1. 讨论收敛点

- “DPA 是 DP”这句话需要同时说明资源语义：它在 Attention 上按请求做数据并行，MoE / MLP 仍可使用同一组物理 ranks 的 TP 或 EP。
- `tp=8, dp=4` 启用 DPA 后使用 8 张 GPU，形成 4 个 Attention TP2 groups；这个例子可以消除把它误读成 32 张 GPU 的常见混淆。
- cache 副本减少只是收益来源；层间 layout conversion 和 scheduler barrier 决定收益能否转化为吞吐与 tail latency。

### 2. 修正后的理解

- DPA 的准确抽象是“request-owned Attention state + shared MLP / MoE execution”。KV、scheduler batch 和 Attention compute 属于 DP-local state，hidden states 在层边界进入共享计算布局。
- EP 的价值在于利用 gate 已经生成的稀疏 token–expert 关系执行重排；它仍然需要足够 token 数和高速互连。
- IDLE batch 是 collective 顺序一致性的组成部分，也会把负载不均衡转化为可观测空闲时间。

### 3. 后续复验指标

- 在同一 DeepSeek / Qwen checkpoint 上记录 TP-only、DPA2 / 4 / 8 与 DPA+EP 的每 rank KV bytes、Attention weight bytes 和最大 resident tokens。
- 对每轮 DPA token counts 计算 `max(n_i) / mean(n_i)`、padding ratio 与 idle rank ratio，并关联 P95 TTFT / ITL。
- 对 post-Attention gather、expert dispatch / combine 和 post-MoE reduce-scatter 分别计时，核对 TBO overlap 后的 critical path。
- 分开测 prefill-heavy、decode-heavy、mixed continuous batching 与 PD-disaggregated trace，避免单一 OSL 掩盖阶段差异。

## 主要启发

- 并行方案需要同时写清 state ownership 与 compute ownership。DPA 让 KV 和 Attention batch 按请求归属，shared MLP / MoE 继续跨 ranks 分布。
- KV 容量优化会在层边界形成新的通信。评估时应把减少的 cache bytes 与新增的 hidden-state bytes 放进同一账本。
- partial DPA 是重要的连续调节轴：它在 Attention TP 分片、KV 副本、权重复制和 DP 并发之间提供中间点。
- scheduler 的 token-aware routing、IDLE 比例和 P/D 拓扑会改变 DPA 的 tail latency，平均吞吐不足以描述生产表现。
- PR 的正结果、负结果和融合优化共同表明，DPA 是一套跨 scheduler、model executor、communicator 与 MoE backend 的系统机制。

## 局限

1. 当前公开资料缺少同一现代 SGLang release、同一模型和同一硬件下从 TP-only 到 partial / full DPA、EP、CP、PD 的完整 ablation。
2. 初始 DeepSeek 结果没有公开每 rank cache bytes、Attention weight bytes、resident batch 与 collective trace，容量收益与 kernel 收益难以严格分解。
3. Qwen 负结果来自较早版本和 A40 PCIe，不能直接外推到 NVLink / NVSwitch、GB200 或当前 communication backend。
4. 当前主干变化快，`server_args.py` help text 已出现与实际约束、官方指南不一致的版本漂移。
5. 推导忽略 page allocator、prefix sharing、KV quantization、speculative states、CP 与 pipeline parallelism；这些因素会改变真实 memory ratio。
6. DPA 与 PD disaggregation、MTP、DeepEP、CUDA Graph 的组合路径较多，这份分析没有逐项覆盖历史 correctness issue。

## 跨论文关系

- 与 [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)：DeepSeek-V2 提供 MLA compressed latent 与 MoE 结构；DPA 利用 Attention state 与 expert compute 的结构差异重排 serving 并行。
- 与 [MLA TP](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/)：该综合建立 MLA cache 的通用复制 / 分片账本；这里把其中的 request ownership 路线展开到 SGLang scheduler、rank groups、communicator 和 PR 演进。
- 与 [Prefill CP](/papers/2026-07-14-prefill-context-parallelism-inference-scaling/)：Prefill CP 沿单请求的 query / context 维分摊长 prompt 计算；DPA 沿请求维拆分 batches。二者处理不同并行轴，混合 prefill / decode 时会在 token counts 和 collective shape 上相互影响。
- 与 [Sarathi-Serve](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/)：chunked prefill 控制每轮 prefill token budget，能够缩小 DPA ranks 之间的 token imbalance；SGLang 在启用 data parallelism 时也会调整 chunked prefill size。
- 与 [UltraEP](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)：DPA+EP 把 token 交给 expert owner，UltraEP 进一步处理 expert replica 与 rack-scale token reroute；两者分别处理 Attention request ownership 与 MoE expert load ownership。

## Reference Intake Brief

### Target

- Intended target system: SGLang DPA 机制详解与部署判断文档。
- Existing related assets: [MLA TP](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/)、[Prefill CP](/papers/2026-07-14-prefill-context-parallelism-inference-scaling/)、`content/utility/papers-index.md`。
- Proposed form: 新建独立 Markdown 文档，并回链相关综合。

### Scope

- Must answer: DPA 的资源语义、rank topology、KV ownership、Attention / MoE layout conversion、scheduler 同步、通信实现、命令示例与性能边界。
- Evidence required: 官方指南、当前 commit 代码、初始与后续 PR、负结果和 load balancing issue。
- Exclusions: 不展开所有模型 adapter、所有 communication backend 源码和历史 correctness issue；不把跨版本 benchmark 拼成统一排名。

### Evidence map

- 定义与配置：官方 [DP / DPA / SMG guide](https://github.com/sgl-project/sglang/blob/5cbea10e2fcd269809c26237c175a470719fc9fe/docs_new/docs/advanced_features/dp_dpa_smg_guide.mdx)。
- Rank 与 cache ownership：`dp_attention.py`、`parallel_state.py`、`deepseek_v2.py`。
- Scheduler 与 routing：`data_parallel_controller.py`、`scheduler_components/dp_attn.py`、Issue #16080。
- Layout conversion：`communicator.py`、`forward_batch_info.py`、PR #22642。
- 性能正负证据：PR #1970、v0.4 release、PR #6121、PR #22642。

### Recommendation

Decision: merge

Why: DPA 已形成稳定的跨模块 serving 机制，代码、文档与 PR / issue 可以互相校验；与 MLA cache 综合和 Prefill CP 分别承担机制实现、缓存账本与单请求并行三种不同解释层。
