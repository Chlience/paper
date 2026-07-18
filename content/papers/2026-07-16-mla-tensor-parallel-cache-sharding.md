# MLA 在张量并行下的缓存复制：从压缩收益到可分片 Latent

First-Archived-At: 2026-07-16 12:25
Updated-At: 2026-07-17 19:25
Review-Status: approved
Reviewed-At: 2026-07-18 17:30

## Source

- Workflow version: v2
- Material type: composite
- Canonical source: /papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/
- Title: MLA 在张量并行下的缓存复制：从压缩收益到可分片 Latent
- Responsible organization: Chlience Paper Archive（本地综合）
- MLA architecture: [DeepSeek-V2](https://arxiv.org/abs/2405.04434)、[DeepSeek-V3 official inference implementation](https://github.com/deepseek-ai/DeepSeek-V3/blob/main/inference/model.py)、[DeepSeek-V3 official configuration](https://github.com/deepseek-ai/DeepSeek-V3/blob/main/inference/configs/config_671B.json)
- Production systems: [SGLang v0.4 / DP Attention](https://www.lmsys.org/blog/2024-12-04-sglang-v0-4/)、[SGLang GLM-5.2 cookbook](https://docs.sglang.io/cookbook/autoregressive/GLM/GLM-5.2)、[vLLM Context Parallelism design](https://docs.vllm.ai/projects/ascend/en/main/developer_guide/Design_Documents/context_parallel.html)、[FlashMLA](https://github.com/deepseek-ai/FlashMLA)、[HiSparse](https://www.lmsys.org/blog/2026-04-10-sglang-hisparse/)
- Parallel latent attention research: [TPLA](https://arxiv.org/abs/2508.15881)、[GLA / Hardware-Efficient Attention](https://arxiv.org/abs/2505.21487)、[GLA OpenReview](https://openreview.net/forum?id=HAjgxcHpzc)、[MLRA](https://arxiv.org/abs/2603.02188)、[MLRA code](https://github.com/SongtaoLiu0823/MLRA)
- Community measurement: [vLLM Kimi MLA DCP issue #40608](https://github.com/vllm-project/vllm/issues/40608)
- Published / updated: 本综合 2026-07-16；引用材料覆盖 2024-05 至 2026-07
- Current version read: 上述论文、官方仓库、框架文档、官方博客和公开 issue 截至访问日的可见版本
- Version / revision read: 框架能力与 issue 数字只代表对应页面记录的版本和硬件条件，开放 issue 不视为稳定 release 契约
- Accessed: 2026-07-16
- Subjects: Multi-head Latent Attention；Tensor Parallelism；KV Cache；DP Attention；Decode Context Parallelism；long-context inference

## 作者与关系

- 本材料由本地归档综合，没有单一论文作者，也不为 composite 新建作者档案。
- DeepSeek-AI 在 DeepSeek-V2 中提出 MLA，并在 DeepSeek-V3 官方推理实现中同时保留展开 K/V cache 与 absorbed latent cache 两条路径；这组代码提供了 TP 下缓存形状差异的直接证据。
- SGLang 与 vLLM 社区分别把 DP Attention、Decode Context Parallelism、P/D disaggregation、KV 量化和分层缓存推进到 serving 路径。框架贡献者与模型论文作者的关系以公开项目协作为限，不据此推断共同研究组织。
- TPLA 由 Xiaojuan Tang、Fanxu Meng、Pingzhi Tang、Yuxuan Wang、Di Yin、Xing Sun、Muhan Zhang 提出；GLA 由 Ted Zadouri、Hubert Strauss、Tri Dao 提出；两组工作分别探索既有 MLA 权重的后置分片和训练期可并行 latent attention。
- MLRA 由 Songtao Liu、Hongwu Peng、Zhiwei Zhang、Zhengyu Chen、Yue Guo 提出。论文署名机构分别覆盖 Pennsylvania State University、University of Connecticut、Carnegie Mellon University 与 UCLA，构成跨机构合作；该工作把独立低秩分支直接写入训练期架构。

## 一句话结论

MLA 把每个 token 的 K/V 压成共享 latent 与独立 RoPE 分支，常见 head-TP absorbed decode 会让每个 rank 保存同一请求的完整 latent cache，使其相对展开 K/V 的每卡压缩倍数按 $1/T$ 衰减；生产系统可通过 DP Attention 改变请求所有权、DCP/CP 沿序列分片、P/D 拆分阶段、量化或分层缓存降低驻留字节，TPLA、GLA 与 MLRA 则进一步处理 latent 表示本身的可分片性。

## 阅读目标与判断边界

本笔记关注：

1. MLA 的 compressed KV 在纯 tensor parallel 中为何经常按 rank 复制，以及它相对 head-sharded 展开 K/V 还能保留多少显存收益。
2. DP Attention、DCP/CP、P/D、低精度 KV 和分层缓存分别改变缓存宽度、副本数、序列归属或 HBM 驻留中的哪一项。
3. TPLA、GLA 与 MLRA 对既有权重兼容性、通信和训练要求的差别。

判断边界：

- “标准 MLA”描述模型表示与 attention 等价变换；“每个 TP rank 复制 latent cache”描述常见 absorbed kernel 的运行时布局。模型定义没有强制唯一的分布式布局。
- 下文比较纯 head-TP 下的每 rank core KV cache。权重、activation、allocator block、DSA index-key、MTP state、prefix cache 元数据与框架预留空间均需另行核算。
- 论文和官方博客中的加速数字来自不同模型、硬件、序列长度、batch 和 kernel，适合确认方案可行性，不能组成横向排行榜。
- 开放 issue 提供特定部署的容量测量，证据强度低于 release 文档和复现实验。

证据写法：

- 论文事实：论文公式、实验、官方代码张量形状或框架设计文档直接给出的内容。
- 作者或维护者主张：摘要、官方博客、项目说明和 issue 中对瓶颈与性能的解释。
- 本地分析：由配置与张量形状推导压缩比、盈亏点和部署判断。

记号约定：

- $L$：已缓存 token 数；$T$：attention tensor-parallel degree；$D$：attention data-parallel degree；$C$：context-parallel degree。
- $H$：query head 数；$d_k,d_v$：展开后的单 head key/value 维度。
- $d_c$：compressed KV latent 维度；$d_r$：单独缓存的 RoPE key 维度；$b$：每个 cache element 的字节数。

## 论文脉络

### 1. 一份压缩缓存为何会在更多 GPU 上逐渐失去优势

单卡视角下，MLA 的收益很直观。普通 MHA 为每个位置保留 $H$ 组 K/V；MLA 先把 hidden state 压到一个共享 latent $c_t^{KV}\in\mathbb R^{d_c}$，再在计算时用 up-projection 恢复各 head 所需的 key/value 表示。Decoupled RoPE 另存 $d_r$ 维位置分支，因此 absorbed decode 的持久 cache 近似为

$$
M_{\mathrm{MLA}}=L(d_c+d_r)b.
$$

Tensor parallel 通常沿 attention head 分配 query heads。展开 K/V 带有 head 维，每个 rank 保存 $H/T$ 个 local heads：

$$
M_{\mathrm{expanded/rank}}
=L\frac{H}{T}(d_k+d_v)b.
$$

共享 latent 没有 head 轴。常见 absorbed kernel 会让每个 rank 保存完整 $c_t^{KV}$ 与 RoPE key，使 local query heads 可以就地读取全部 latent：

$$
M_{\mathrm{MLA/rank}}
=L(d_c+d_r)b.
$$

二者的每 rank 压缩倍数为

$$
R_{\mathrm{TP}}
=\frac{M_{\mathrm{expanded/rank}}}{M_{\mathrm{MLA/rank}}}
=\frac{H(d_k+d_v)}{T(d_c+d_r)}.
$$

$R_{\mathrm{TP}}>1$ 表示 replicated MLA cache 仍小于 local-head 展开缓存；$R_{\mathrm{TP}}<1$ 表示在这个特定存储口径下，完整 latent 副本已大于每 rank 的展开 K/V 分片。盈亏点为

$$
T^*=\frac{H(d_k+d_v)}{d_c+d_r}.
$$

它揭示了两个同时成立的事实：MLA 降低单份缓存宽度，纯 head-TP 增加同一请求的 latent 副本数。扩大 $T$ 会线性削弱每卡压缩收益。

### 2. 官方实现中的两种 cache 形状

DeepSeek-V3 官方 `inference/model.py` 先令 `n_local_heads = n_heads / world_size`。`attn_impl="naive"` 的展开路径缓存形状包含 `n_local_heads`，因此 K/V 随 TP head 切分；`attn_impl="absorb"` 的 `kv_cache` 只包含 `kv_lora_rank`，`pe_cache` 只包含 `qk_rope_head_dim`，两者均没有 local-head 轴。

这段实现给出了问题的最短证据链：

```text
naive expanded cache
  [tokens, n_local_heads, qk_head_dim / v_head_dim]

absorbed MLA cache
  [tokens, kv_lora_rank] + [tokens, qk_rope_head_dim]
```

代码形状说明常见实现选择了 replication。它没有排除其他布局；DCP 与 TPLA 正是在保持 attention 语义的前提下重写这项布局选择。

以模型配置代入可以看到 TP degree 的影响：

| 模型 | 配置口径 | $R_{\mathrm{TP}}$ | TP8 | TP16 | TP32 | TP64 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| GLM-5.2 | $H=64,d_k=256,d_v=256,d_c=512,d_r=64$ | $56.9/T$ | $7.1\times$ | $3.6\times$ | $1.8\times$ | $0.89\times$ |
| DeepSeek-V3 | $H=128,d_k=192,d_v=128,d_c=512,d_r=64$ | $71.1/T$ | $8.9\times$ | $4.4\times$ | $2.2\times$ | $1.1\times$ |

GLM-5.2 的数字来自公开 `config.json`；DeepSeek-V3 的数字来自官方 671B inference config。该表只比较 cache element 数，不包含 dtype、scale、allocator 对齐和 DSA 等附加状态。它也不表示模型可以直接切换成普通 MHA；展开路径仍受模型权重、计算量和 kernel 约束。

### 3. 沿 latent 维切一刀为何需要通信

MLA 通过矩阵吸收把 up-projection 移到 query 与 output 一侧。对某个 head，content score 可以写成变换后 query 与完整 latent 的内积：

$$
s_{t,j}^{(h)}
=\widetilde q_t^{(h)\top}c_j^{KV}
+q_{t,R}^{(h)\top}k_{j,R}.
$$

若沿 $d_c$ 把 $c_j^{KV}$ 分给多个 rank，每个 rank 只能得到 content score 的部分和。Softmax 需要完整 logit 才能正确计算全局最大值与归一化项；value aggregation 与 output projection 也需要把各分片结果组合起来。于是 latent-dimension sharding 会把“读本地完整 latent”改成“计算局部贡献并执行 collective”。

沿序列轴分片也有相似约束。每个 rank 只保存一段 token 的 KV，先计算局部 max、exp-sum 和 value numerator，再通过 online-softmax merge 恢复全局结果。两种分片都能消除 cache replication，通信位置不同：latent 分片围绕 feature partial sum，context 分片围绕 token block 的 softmax state。

这也解释了纯 TP 实现为何倾向复制 latent。Decode 每步 query 很少，额外 collective 的固定延迟很敏感；让每个 rank 直接访问完整 latent 可以保持 kernel 简单，并用 local heads 提供并行度。上下文和并发升高后，复制占用逐渐超过通信代价，运行时才有动力切换 ownership。

### 4. 生产系统通过缓存所有权重排数据流

每个 rank 的持久缓存可以写成

$$
M_{\mathrm{HBM},r}
\approx
L_{\mathrm{owned},r}
\times d_{\mathrm{stored}}
\times b
\times \rho_{\mathrm{HBM},r}.
$$

$L_{\mathrm{owned},r}$ 是 rank $r$ 为该请求持有的 token 数，$d_{\mathrm{stored}}$ 是每 token 存储宽度，$b$ 是量化后的字节数，$\rho_{\mathrm{HBM},r}$ 是实际驻留在 GPU 的比例。若同一请求的完整历史在 $n_{\mathrm{replicas}}$ 个 attention ranks 上各保存一次，则 $\sum_r L_{\mathrm{owned},r}=Ln_{\mathrm{replicas}}$；sequence sharding 且无额外副本时，该和回到 $L$。现有方案分别修改不同项：

| 路线 | 直接改变的量 | 数据流 | 适合的工作负载 | 主要代价 |
| --- | --- | --- | --- | --- |
| DP Attention / hybrid DP-TP | $n_{\mathrm{replicas}}$ | 请求分配给 attention DP worker；MoE 前后执行 gather / redistribute | 高并发 decode、MoE serving | attention 权重或计算按 DP 复制；小 batch 难以填满 workers |
| DCP / Decode CP | $L_{\mathrm{owned}}$ | latent KV 沿 token 轴分片，合并局部 softmax state 与 output | 单请求超长上下文、容量受限 | 每个 decode step 增加 query 交换和结果归并 |
| Prefill CP | 单次 query/context 工作集与 Prefill cache ownership | prompt query 分片，按 backend all-gather KV 或重分片输出 cache | 长 prompt、TTFT 受限 | 短序列通信占比高；实现需处理 causal balance 与 cache reshard |
| P/D disaggregation | Prefill 与 Decode 各自的 $T,D,C$ | Prefill 用适合大矩阵的 TP/CP，传输 compressed KV 后由 Decode 采用 DP 或较低 attention TP | 阶段负载差异明显、可做独立扩缩容 | KV transport、路由、buffer 和跨节点网络成为新约束 |
| FP8 / FP4 KV | $b$ | 保持 ownership，压低每份 latent 的存储与读取字节 | 几乎所有支持对应 kernel 的部署 | 副本数不变；scale、精度和 kernel 需要联合验证 |
| Hierarchical / offloaded KV | $\rho_{\mathrm{HBM}}$ | 热块驻留 HBM，冷块放在 host memory，按需预取 | 1M context、HBM 容量主导 | cache miss 引入 H2D IO，依赖访问局部性和通信重叠 |

SGLang 的 DP Attention 给每个 DP worker 分配不同 batch；当 attention DP degree 等于原 TP degree 时，一条请求的 cache 只落在一个 attention worker，MoE 仍可以使用 expert parallel。官方 v0.4 博客在 8 张 H100 上报告最高 $1.9\times$ decode throughput，并明确把 MLA 单 KV head 在 TP8 下的重复缓存作为动机。

vLLM 的 DCP 复用 TP 通信域，把原本复制的 MLA KV 沿 sequence 维分片。MLA decode 中，各 rank 对本地 KV 计算 attention，再合并 output 与 log-sum-exp。公开 Kimi 部署 issue 给出的单次测量中，TP8、MTP3 配置的 KV capacity 从 DCP1 的 337,296 tokens 提高到 DCP4 的 1,126,528 和 DCP8 的 1,769,600；短上下文下 DCP1 延迟更低，128K 或高并发时 DCP8 才显示容量价值。该 issue 属于社区测量，模型、硬件和框架版本均不能直接外推到 GLM-5.2。

FlashMLA 的低精度 cache 和 sparse decode kernel 降低每份 cache 的字节与被选条目的读取量。DSA top-$k$ 只减少当前 attention step 的活跃读取；未来 token 的 selector 仍可能选中任意历史位置，因此完整历史状态需要留在 HBM、host memory 或其他 cache tier。IndexShare 进一步减少跨层 selector 调用次数，对 MLA latent cache 的每层持久容量没有直接除以共享层数的效果。

### 5. 表示层方案把 latent 本身改造成可分片结构

生产系统可以重排请求和序列 ownership；另一条路线直接修改 latent attention 的表示或运算分解。

TPLA 面向已训练 MLA checkpoint。它沿 latent 与每个 head 的输入维度构造分片，让各 rank 执行局部 attention，再通过 all-reduce 恢复输出；论文将其描述为无需重训的 drop-in 方案，并提供 Hadamard/PCA 校准路径来控制分片误差。它把长期 cache replication 换成逐步 collective，价值取决于上下文长度、TP degree、互连和 kernel 实现。

GLA 将 latent attention 重新设计为更容易并行切分的训练期架构。论文强调硬件友好的数据流与专用 kernel，并在 pretrained-from-scratch 设置下验证质量和速度。它需要新权重，适合作为下一代模型设计选择。

MLRA 把单个共享 latent 扩展为四个独立低秩分支，天然对应 TP4。每个 rank 持有一个分支并独立计算，跨 rank 组合输出。该设计同样需要训练新模型；论文的 2.9B 规模实验用于验证结构，离 GLM-5.2 或 DeepSeek-V3 级 production 部署仍有规模和 kernel 集成距离。

| 方案 | 既有 MLA checkpoint | 分片轴 | Decode 通信 | 公开证据范围 |
| --- | --- | --- | --- | --- |
| TPLA | 兼容；作者主张无需重训，可选校准 | latent / head input | 局部 attention 后 all-reduce | DeepSeek-V3、Kimi-K2，32K 等设置 |
| GLA | 需要按新架构训练 | parallel-friendly latent groups | 由架构与 kernel 协同设计 | COLM 2025 论文的训练与在线 serving 实验 |
| MLRA | 需要按新架构训练 | 四个独立 low-rank branches | 分支输出组合 | 2.9B 规模、TP4 原型 |

### 6. 部署选择取决于请求形态

高并发 decode 首先需要减少同一请求在 attention ranks 上的副本数。DP Attention 与 MoE EP/DeepEP 的组合通常最接近这项目标；FP8 KV 可继续压低单份 cache 字节。

低并发、单请求 1M context 更容易受单 worker 容量限制。DCP/CP 沿 token 轴分片可以把一条请求展开到多个 rank，同时需要测量每步 collective 是否超过本地 HBM 读取节省。HBM 仍不足时，hierarchical cache 再将冷块移到 host memory。

Prefill 与 Decode 的最优并行度往往不同。Prefill 有大量 query rows，较高 TP/CP 可以降低 TTFT；Decode 每步 query 很少，更偏好较低 attention TP、DP batching 与容量型 DCP。P/D disaggregation 允许两侧分别选择拓扑，并承担 compressed KV transfer。

判断某个配置是否有效，至少记录以下观测量：

1. 每请求、每层的 latent KV、RoPE key、DSA index-key 与 MTP state 字节。
2. 每个 rank 的请求副本数、owned tokens、KV block occupancy 与 allocator fragmentation。
3. Decode 每步 collective bytes、collective latency、HBM read bytes 与 attention kernel time。
4. 不同 context length 和并发下的 TTFT、inter-token latency、throughput 与可容纳 token 数。
5. P/D 场景的 KV transfer 时间、队列等待、路由倾斜和跨节点带宽利用率。

### 7. 结论链条

MLA 的模型级收益来自降低 $d_{\mathrm{stored}}$。Head-TP 可以切分 query heads，却无法直接把没有 head 轴的共享 latent 分给 local heads；常见 absorbed runtime 因而增加 $n_{\mathrm{replicas}}$，使相对压缩倍数按 $1/T$ 衰减。

现有系统沿两条路径处理这一边界。DP Attention、DCP/CP、P/D、量化与分层缓存分别重排请求、序列、阶段、dtype 和 residency；TPLA、GLA、MLRA 改变 latent 的运算分解或训练期结构。实际选择应围绕 cache ownership、逐步通信和工作负载进行联合测量。

## 关键实验/定理

### 结果 1：纯 head-TP 下的每 rank 压缩倍数按 $1/T$ 衰减

- 设置：用 DeepSeek-V3 官方实现的 naive / absorb cache 形状建立存储模型，并代入 GLM-5.2 与 DeepSeek-V3 公开配置。
- Baseline：按 local heads 分片的展开 K/V cache。
- 指标：每 rank cache element ratio $R_{\mathrm{TP}}$。
- 结果：GLM-5.2 为 $56.9/T$，DeepSeek-V3 为 $71.1/T$；GLM-5.2 在 TP8、TP16、TP32 下分别保留约 $7.1\times$、$3.6\times$、$1.8\times$ 的元素数优势。
- 证据定位：[DeepSeek-V3 `model.py`](https://github.com/deepseek-ai/DeepSeek-V3/blob/main/inference/model.py) 的 `n_local_heads` 与 cache allocation；[DeepSeek-V3 config](https://github.com/deepseek-ai/DeepSeek-V3/blob/main/inference/configs/config_671B.json)；[GLM-5.2 config](https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json)。
- 对照是否可比：同一公式内可比；不同 runtime 的 dtype、padding、scale 与 allocator 未纳入。
- 支持的最窄结论：replicated latent 相对 local-head expanded cache 的每卡优势会随 TP degree 增加而下降。
- 解读：模型报告中的单卡 KV 压缩比不能直接当作多卡 TP 的每 rank 容量收益。

### 结果 2：DP Attention 可以通过请求 ownership 消除 TP 域内单请求 cache 副本

- 设置：SGLang v0.4 在 8 张 H100 上测试 MLA/MoE decode，并把 attention 数据并行与 MoE 并行组合。
- Baseline：TP8 下每个 rank 重复 MLA KV 的 decode 路径。
- 指标：decode throughput。
- 结果：官方博客报告最高 $1.9\times$ throughput improvement。
- 证据定位：[SGLang v0.4 blog](https://www.lmsys.org/blog/2024-12-04-sglang-v0-4/) 的 Data Parallelism Attention 部分。
- 对照是否可比：博客给出同一系统中的方案比较，完整 workload 分布、重复次数与方差未统一披露。
- 支持的最窄结论：足够 batch 下，按请求切分 attention workers 能把复制容量转化为更多并发 KV，并提升 MLA/MoE decode throughput。
- 解读：它以 batch 维并行度换取 per-request cache ownership，低并发延迟仍需单独测量。

### 结果 3：TPLA 展示既有 MLA checkpoint 的后置 latent 分片可行性

- 设置：TPLA 在 32K context 等条件下测试 DeepSeek-V3 与 Kimi-K2，使用 tensor-parallel latent attention 和可选校准。
- Baseline：常规复制 latent 的 MLA TP 路径。
- 指标：推理速度与 commonsense / LongBench 质量。
- 结果：论文摘要与实验报告 DeepSeek-V3 $1.79\times$、Kimi-K2 $1.93\times$ speedup，并称质量保持。
- 证据定位：[TPLA arXiv](https://arxiv.org/abs/2508.15881) 的方法、32K 性能实验和质量表。
- 对照是否可比：论文内部对照可用于判断 TPLA；不同模型和硬件间数字不可互换。
- 支持的最窄结论：在论文覆盖的模型与设置中，既有 MLA 权重可以通过运算分解和 collective 减少 latent replication，无需完整重训。
- 解读：它提供 retrofit 路线；生产价值仍取决于 kernel、互连和精度校准复验。

### 结果 4：训练期可分片 latent attention 已有小中规模证据

- 设置：GLA 比较专用 kernel、训练质量与在线 serving；MLRA 在 2.9B 模型上比较 MLA 与四分支低秩架构。
- Baseline：各论文内部的 MLA 或 attention baseline。
- 指标：kernel speed、在线 latency/throughput、decode speed 与模型质量。
- 结果：GLA 报告优化 kernel 相对 FlashMLA 最高约 $2\times$，在线 latency/throughput 最高约 $2\times$；MLRA 报告相对 MLA 最高约 $2.8\times$ decode speedup。
- 证据定位：[GLA arXiv](https://arxiv.org/abs/2505.21487) 的 kernel 与 serving 实验；[MLRA arXiv](https://arxiv.org/abs/2603.02188) 的 TP4 与 2.9B 实验。
- 对照是否可比：两篇论文的模型、规模、硬件和 baseline 不同，只能分别读取。
- 支持的最窄结论：训练期把 latent 组织成并行友好结构可以降低 replication 或 kernel 障碍。
- 解读：这些结果支持模型—kernel 协同设计方向，尚不足以证明超大规模 production 的稳定收益。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 评测协议 | 公式推导使用公开配置；系统数字沿用各来源自身协议，不做跨来源排名 |
| 统计报告 | 多数官方博客与论文摘要未提供完整重复次数、方差和置信区间 |
| Baseline 是否 tuned | 各来源披露程度不同；SGLang/TPLA/GLA/MLRA 内部 baseline 可局部比较 |
| Baseline 是否 compute-matched | 方案改变通信、cache capacity 与 batch 可容纳量，严格 compute-match 不成立 |
| Baseline 是否 implementation-matched | 同一来源内相对接近；跨框架比较不满足 |
| Baseline 是否覆盖强替代方案 | 没有单一实验同时覆盖 DP Attention、DCP、TPLA、GLA、MLRA 与 offload |
| Baseline 是否存在弱化风险 | 新 kernel 对旧 baseline 的 kernel 版本和 tuning 可能影响速度差异 |
| 结论边界 | 方案分类与公式较稳；端到端收益必须在目标模型、拓扑、上下文和并发上复验 |
| 系统配置 | GLM-5.2/DeepSeek-V3 配置用于静态存储比；性能数字分别沿用来源配置 |
| 框架基座 / paper base | SGLang、vLLM、FlashMLA；TPLA、GLA、MLRA 各自原型 |
| 框架版本与证据来源 | 以访问日公开页面为准；社区 issue 的 commit/release 契约不完整 |
| 框架改动范围 | 涵盖 scheduler、attention parallel group、KV layout、collective、kernel 与 cache tier |
| 未披露项 | 统一硬件复现、完整通信 profile、质量回归、allocator 开销和 GLM-5.2 上的 TPLA/GLA/MLRA 集成均未披露 |

## 证据链强度评估

### 强证据

- DeepSeek-V3 官方实现直接展示展开 cache 带 local-head 维、absorbed latent cache 不带 local-head 维。
- GLM-5.2 与 DeepSeek-V3 的公开配置足以复算 $R_{\mathrm{TP}}$，公式与结果可独立核验。
- SGLang、vLLM 官方材料明确说明 DP Attention 与 DCP 分别沿 batch/request 和 sequence 维改变 KV ownership。

### 中等强度证据

- TPLA、GLA、MLRA 的论文实验支持各自方案，但模型规模、硬件、kernel 与精度协议不同。
- SGLang 博客与 HiSparse 博客提供 production-oriented 数字，缺少统一重复实验和完整统计量。
- vLLM issue 的 capacity 数字具体且可审计，仍属于单一社区环境。

### 需要谨慎的推论

- $T^*$ 是特定展开 K/V 与 replicated latent 存储口径的盈亏点，不能单独决定模型架构或 serving topology。
- TPLA 在 DeepSeek-V3/Kimi-K2 上的结果不能直接代表 GLM-5.2；GLA/MLRA 需要新权重，也不能作为现有 checkpoint 的即时配置项。
- DSA、IndexShare、MTP 和 allocator 会改变总 cache 账本，MLA core cache 公式只覆盖其中一部分。

## OpenReview / 审稿意见吸收

- Page type: commentary
- Match confidence: high
- Observed at: 2026-07-16
- Venue status: 本材料为 composite；GLA 公开页对应 COLM 2025，MLRA 对应 ICLR 2026 poster，TPLA 以公开 arXiv 版本为主要证据
- Public reviews: 没有覆盖整个综合主题的统一公开评审
- Ratings / confidence: 不适用于 composite
- Reviewer consensus: 无统一共识
- Main criticisms: 跨方案实验缺少共同模型、硬件、TP degree、context length、batch 与质量协议；架构级方案的超大规模验证有限
- Author response: 各来源分别说明自身设计，未提供统一回应
- 对可信度的影响: 公式与官方代码形状结论可信度较高；速度排名与 production 泛化维持来源内解读

## 本地讨论补充

### 1. 讨论收敛点

- 标准 MLA 需要缓存 compressed latent KV 与 decoupled RoPE key。纯 head-TP 的常见 absorbed 实现会让每个 rank 保存一份完整 cache，因为每组 local query heads 都依赖完整 latent。
- 展开 K/V 可以沿 head 维随 TP 分片，因此 replicated latent 相对 local expanded cache 的收益会下降。GLM-5.2 的理论比值为 $56.9/T$，它直接回应了“TP 是否反而降低 MLA 收益”的问题。
- DSA top-$k$ 控制当前 core attention 的活跃读取，IndexShare 减少跨层 indexer 次数；两者都不会让每层 MLA 历史 cache 自动按 top-$k$ 或四层共享比例缩小。
- 完整显存账本还包括 DSA index-key、MTP/KVShare state、block allocator、prefix reuse 和 offload staging。只看 compressed KV 会高估可用 context capacity。

### 2. 修正后的理解

- “MLA cache 很小”需要带上运行时条件：dtype、TP/DP/CP group、每请求副本数和 cache ownership。
- “KV 被 TP 切分”也需要注明分片轴。MHA/GQA 常沿 head 分片；MLA DCP 沿 token 分片；TPLA 沿 latent/feature 分片；DP Attention 沿请求分配。
- GLM-5.2 的 IndexShare 与 MLA TP 属于两个正交问题。前者处理 DSA selector 的跨层重复计算，后者处理 compressed KV 在设备间的持久布局。
- 生产部署可先调整运行时 ownership；训练期可分片 attention 适合模型设计阶段评估。两类方案可以叠加，验证指标也不同。

### 3. 后续复验指标

- 在 GLM-5.2 上固定模型、硬件与 batch，对比 TP-only、DP Attention、DCP、DP+DCP、P/D 的 cache bytes/rank 与 decode latency。
- 分别记录 128K、512K、1M context 的 HBM occupancy、collective time、FlashMLA kernel time、indexer time 与 MTP acceptance。
- 对 FP8 KV 与 hierarchical cache 记录精度变化、cache hit rate、H2D traffic 和 tail latency。
- 若集成 TPLA，验证 GLM-5.2 的质量校准、all-reduce bytes、TP degree scaling 和 sparse MLA/DSA kernel 兼容性。

## 主要启发

- KV 压缩公式需要同时包含表示宽度和分布式副本数；单卡压缩比无法完整描述多卡容量。
- Attention parallelism 的核心接口是“哪个 rank 持有哪条请求、哪些 token、哪些 latent 分量”，模型配置只给出张量维度。
- Prefill 与 Decode 的最优 ownership 可以不同，P/D 把这项差异变成可独立调度的系统边界。
- Sparse attention 减少活跃访问，分层缓存管理全量历史的驻留位置；两者结合后才能覆盖 1M context 的计算与容量问题。

## 局限

1. 公开材料没有提供 GLM-5.2 在 TP-only、DP Attention、DCP 与 P/D 下的统一端到端对照。
2. 存储公式忽略量化 scale、page/block 对齐、allocator fragmentation、prefix sharing 与框架 workspace。
3. TPLA、GLA、MLRA 的证据来自不同规模和实现，缺少同一超大模型上的横向复现。
4. DCP 与 DP Attention 的最佳组合依赖互连拓扑、batch 分布、context 长度与 MoE 通信，静态公式无法替代 profile。
5. 框架能力快速演进，开放 issue、cookbook 和实验性 HiSparse 路径可能在后续 release 改变接口或性能。

## 跨论文关系

- 与已有论文的作者或机构关系：本综合连接 DeepSeek-AI 的 MLA 原始设计、SGLang/vLLM serving 社区以及 TPLA、GLA、MLRA 三组并行 latent attention 研究；MLRA 额外形成 Penn State、UConn、CMU 与 UCLA 的跨机构合作。
- 与 [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)：DeepSeek-V2 定义 compressed KV 与 decoupled RoPE，并给出 93.3% KV cache reduction；本综合补上多卡 TP 下副本数对每 rank 收益的影响。
- 与 [DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/)：官方推理实现的 naive / absorb cache shape 提供 replicated latent 的直接代码证据，V3 配置也用于计算 $71.1/T$。
- 与 [GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/)：GLM-5.2 的 DSA、IndexShare、MTP 与 1M context 使总 cache ownership 更关键；本综合集中承接其 MLA TP 公式和解法分类。
- 与 [DeepSeek-V3.2 / DSA](/papers/2512.02556-deepseek-v3-2-open-large-language-models/) 及 [IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/)：DSA 和 IndexShare 分别减少 core attention 候选与 selector 次数，完整历史 MLA/index-key cache 的设备布局仍由 runtime 管理。
- 与国产模型演进总结 [2026-06-23](/papers/2026-06-23-chinese-frontier-model-reports-timeline/)：该文把 MLA、DSA、IndexShare、CSA/HCA 放在注意力演进轴上；本综合新增“压缩表示—分布式所有权”这一系统轴。

## Reference Intake Brief

### Target

- Intended target system: 新建 MLA tensor-parallel cache sharding 综合文章，并回链 GLM-5.2、DeepSeek-V2 与国产模型演进总结。
- Existing related assets: [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)；[GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/)；[国产模型演进总结](/papers/2026-06-23-chinese-frontier-model-reports-timeline/)。
- Proposed form: 新建 `2026-07-16-mla-tensor-parallel-cache-sharding.md`；将通用 MLA TP 公式与方案分类集中到该文，旧文保留各自主题内的摘要和关系链接。

### Reusable Elements

1. 存储模型：$M_{\mathrm{HBM},r}\approx L_{\mathrm{owned},r}d_{\mathrm{stored}}b\rho_{\mathrm{HBM},r}$，且完整副本满足 $\sum_r L_{\mathrm{owned},r}=Ln_{\mathrm{replicas}}$。
2. TP 压缩模型：$R_{\mathrm{TP}}=H(d_k+d_v)/[T(d_c+d_r)]$，以及 GLM-5.2、DeepSeek-V3 配置实例。
3. 系统分类：DP Attention 改请求 ownership，DCP/CP 改 token ownership，P/D 改阶段拓扑，量化与分层缓存改 bytes/residency。
4. 架构分类：TPLA 面向既有 checkpoint；GLA/MLRA 面向训练期可并行结构。

### Risks

- Copyright/over-copying: 只保留公式重建、实现形状、实验摘要和本地比较，没有复制来源长段落。
- Unsourced or unverifiable claims: 模型配置、代码形状和框架机制链接到一手来源；本地推导明确标注口径。
- Tone/brand mismatch: 采用机制、证据和边界导向的论文归档语气。
- Safety/compliance issues: 不涉及安全或双用途操作细节。
- Overlap with existing assets: GLM-5.2 原文已有完整解法表；新文承接通用内容，旧文压缩为模型特定结论与入口。

### Skipped

| Material | Reason |
| --- | --- |
| 非公开 GLM-5.2 集群配置推测 | 缺少一手证据，无法支撑 DP/CP degree 与收益判断 |
| 跨来源速度数字排名 | 模型、硬件、context、batch 与 baseline 不可比 |
| 将 TPLA/GLA/MLRA 写成现成 GLM-5.2 开关 | 公开 cookbook 尚未显示这类正式集成 |
| 仅由 top-$k$ 推导 KV 可删除比例 | 未来 query 的 selection 未知，无法安全删除完整历史状态 |

### Recommendation

Decision: merge

Why: MLA 的模型级压缩与多卡 serving 的缓存所有权分属两个分析层级。独立文章能稳定承接公式、代码证据、系统方案和训练期架构演进，同时让 GLM-5.2 保持清晰边界。
