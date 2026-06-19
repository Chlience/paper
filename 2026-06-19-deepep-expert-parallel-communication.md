# DeepEP V2 / main: Expert Parallel Communication Library 技术笔记

Date: 2026-06-19
Sort-Time: 2026-06-19 14:40

## Source

- Title: DeepEP: an efficient expert-parallel communication library
- Repository: https://github.com/deepseek-ai/DeepEP
- Legacy V1 docs: https://github.com/deepseek-ai/DeepEP/blob/main/docs/legacy.md
- Latest GitHub release checked: https://github.com/deepseek-ai/DeepEP/releases/tag/v1.2.1, published 2025-09-16
- Main version read: `af9a0403188392824fc3057452822235873e0612`, committed 2026-06-15; README accessed 2026-06-19
- Authors: Chenggang Zhao, Shangyan Zhou, Liyue Zhang, Chengqi Deng, Zhean Xu, Yuxuan Liu, Kuai Yu, Jiashi Li, Liang Zhao
- Released / citation year: 2025
- Subjects: MoE expert parallelism, GPU communication kernels, all-to-all dispatch/combine, FP8, RDMA, NVLink, NCCL Gin, JIT kernels

## 作者与关系

- [Chenggang Zhao](/authors/chenggang-zhao/): GitHub `LyricZhao` profile identifies DeepSeek-AI infra affiliation and prior NVIDIA / SenseTime / Tsinghua background; profile pass found Scholar and OpenReview records tied to DeepSeek AI.
- [Shangyan Zhou](/authors/shangyan-zhou/): GitHub `sphish` profile identifies DeepSeek-AI affiliation and personal site `sy-zhou.com`.
- Liyue Zhang: DeepEP citation author; profile pass found DeepSeek/OpenReview publication ties but no stable personal homepage or GitHub profile with enough independent evidence in this pass.
- [Chengqi Deng](/authors/chengqi-deng/): GitHub `KinglittleQ` profile identifies DeepSeek-AI and ZJULearning membership; Scholar/OpenReview show DeepSeek-related papers.
- [Zhean Xu](/authors/zhean-xu/): Scholar profile identifies DeepSeek AI and verified Tsinghua email; X profile `@zheanxu` states AI infra at DeepSeek.
- Yuxuan Liu: DeepEP citation author; profile pass found a public employment profile stating LLM infrastructure work at Hangzhou DeepSeek, but no stable author homepage/GitHub/Scholar profile with enough cross-validation.
- Kuai Yu: DeepEP and DeepGEMM citation author; recurring DeepSeek infra credit, but no high-confidence personal profile found in this pass.
- Jiashi Li: DeepEP and DeepGEMM citation author; also credited in DeepSeek DualPipe and FlashMLA repositories, but the public profile evidence should be re-checked before creating an author page.
- Liang Zhao: DeepEP and DeepGEMM citation author; recurring DeepSeek author-list credit, but no stable personal profile found in this pass.

关系判断：

- 同机构作者群：当前按 DeepSeek-AI infrastructure / systems contributor group 记录。仓库 citation 没有给逐作者机构拆分。
- 跨机构桥接：Chenggang Zhao 的公开 GitHub profile 给出 NVIDIA / SenseTime / Tsinghua 背景；Chengqi Deng 连接 ZJULearning；Zhean Xu 的 Scholar profile带 Tsinghua 邮箱线索。这些是公开档案线索，具体项目内分工仍以 DeepSeek-AI 仓库 citation 为准。
- 与已存档作者重叠：与 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 中 DeepSeek-V4 appendix 的 Chenggang Zhao、Chengqi Deng 等 DeepSeek 系统作者线索重叠；与 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 的 DeepSeek-AI 组织作者线存在同一公司/系统生态关系。
- 与已存档论文的主题或方法关系：强连接 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)、[2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)、[2026-06-17](/papers/2026-06-17-slime-rl-scaling-framework/)、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)、[2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 和 [1910.02054](/papers/1910.02054-zero-memory-optimizations-trillion-parameter-models/)。
- 作者页决策：已为 Chenggang Zhao、Shangyan Zhou、Chengqi Deng、Zhean Xu 建立 `authors.json` 档案。Liyue Zhang、Yuxuan Liu、Kuai Yu、Jiashi Li、Liang Zhao 当前记为 `needs-follow-up` 或团队级 recurring credit，等待更多独立主页、GitHub、Scholar、OpenReview 或 X 证据。

## 一句话结论

DeepEP 的核心价值是把 MoE expert parallelism 中最频繁、最敏感的 token dispatch / combine 做成专用通信层：V1 用 NVSHMEM、RDMA 和 zero-SM hook 支撑 DeepSeek-V3/R1 风格的高吞吐与低延迟路径；V2 把 EP API 收敛到 `ElasticBuffer`，切到更轻量的 NCCL Gin backend，通过 JIT、解析式 SM/QP 配置和新的 GEMM layout，在 V3-like 训练形状上用更少 SM 达到同等或更高带宽，并把后续 PP、CP、Engram 等通信原语纳入同一个低 SM 占用设计方向。

## 阅读目标与判断边界

本笔记关注：

1. DeepEP 在 MoE 系统栈中解决什么瓶颈。
2. V1 到 V2 的主要架构变化：NVSHMEM 到 NCCL Gin，`Buffer` 到 `ElasticBuffer`，auto-tuning 到解析式资源配置。
3. 它和 DeepGEMM、UltraEP、DeepSeek-V4、slime/rollout 系统的关系。
4. 哪些性能声明来自仓库 README，哪些仍需要在本地硬件和框架组合上复验。

判断边界：

- DeepEP 是项目仓库和工程文档，不是完整论文；本笔记按 `paper-analysis-workflow.md` 中的技术项目材料归档。
- 当前 README 描述的是 main 分支 V2 设计；最新 GitHub release 仍显示 `v1.2.1`。因此本笔记以 main commit `af9a040` 为主，release tag 只作为版本状态记录。
- README 的性能表是 DeepSeek/仓库作者给出的 benchmark；硬件拓扑、NCCL/NVSHMEM 版本、RDMA 配置、PyTorch 和 framework integration 会影响复现结果。
- DeepEP 只处理通信和 metadata / buffer interface；expert compute kernel、activation、GEMM layout 和 fused MoE 性能还需要结合 [DeepGEMM](/papers/2026-06-19-deepgemm-tensor-core-kernels/) 或框架侧实现判断。

## 论文脉络

### 1. 研究问题、背景和价值

MoE 模型把每个 token 路由到少数专家。专家分布在不同 GPU rank 上时，前向和反向都需要把 token activations 发给对应专家，再把专家输出按原 token 顺序合并回来。这就是 expert parallelism 的核心通信路径：

1. router / gate 产生 `topk_idx` 和 `topk_weights`。
2. dispatch 把 token activations 按专家位置发往目标 rank。
3. 目标 rank 对本地专家做 MLP / GEMM。
4. combine 把专家输出按 token 聚合回源 rank。

在大 MoE 中，这条路径会同时遇到三个瓶颈：

- token all-to-all 的 NVLink / RDMA 带宽。
- dispatch/combine kernel 自身占用的 SM，可能和专家 GEMM 抢算力。
- routing metadata、receive count、buffer layout 和 CUDA stream event 对 framework 的同步压力。

DeepEP 的价值在于把这个热路径单独工程化。它不是普通 collective 的薄包装，而是针对 MoE dispatch/combine 的数据形状、低精度、token metadata 和 overlapping 方式提供专用接口。对于 DeepSeek-V3/R1、DeepSeek-V4、slime 或 SGLang/Megatron 这类 MoE training / inference / rollout 栈，DeepEP 决定了专家并行的基础通信成本。

### 2. 已有解决方案与不足

通用通信方案可以用 NCCL all-to-all、PyTorch distributed 或点对点 send/recv 实现 token exchange，但它们通常没有同时覆盖 MoE 的几个特性：

- token 到 expert 的不规则路由。
- FP8 dispatch / BF16 combine 等低精度路径。
- dispatch 和 combine 与 GEMM 的 layout 约定。
- 训练和 inference prefill 的高吞吐路径。
- decode 阶段的小 batch 低延迟路径。
- 通信和计算 overlap 时的 SM 占用控制。

DeepEP V1 选择 NVSHMEM 和 RDMA，把高吞吐 normal kernels 与低延迟 pure-RDMA kernels 分开；它提供 hook-based receiving，让部分 RDMA traffic 在后台发生并尽量不占计算 SM。这个路线对 DeepSeek-V3/R1 当时的生产设定直接有用，但接口复杂、buffer 管理复杂、部分路径需要 auto-tuning，且 V1 文档自己提醒 queue-based buffer 设计会带来复杂性和潜在 deadlock 风险。

V2 的重构把问题转向更统一的接口和更低的运行时复杂度：用 NCCL Gin backend 复用 NCCL communicator，全部 kernel JIT 编译，把 high-throughput 和 low-latency API 合到 `ElasticBuffer`，并用解析式方法计算 SM 和 QP 数，减少 V1 风格的集群特定 auto-tuning。

### 3. 作者可能的思考路径

可以把 DeepEP 的演进理解为一次从“为 V3/R1 的生产路径做专用高性能实现”到“抽出 MoE 通信层稳定 API”的过程。

第一步是确认 MoE 的通信路径有明确结构。普通 all-to-all 只关心 bytes 和 ranks，而 MoE dispatch/combine 还知道 token、expert、top-k、source rank、target rank、combine weight 和 backward 对偶关系。这些结构可以换来更紧凑的 layout、更少的同步和更好的 overlap。

第二步是区分 prefill/training 和 decode。训练与 prefill token 数较多，目标是高吞吐、带宽饱和和与 GEMM overlap；decode token 数少，目标是降低 microsecond 级 latency 和避免通信 kernel 占用计算 SM。V1 用 normal kernels 和 low-latency kernels 分开处理这两种模式。

第三步是减少系统集成成本。V1 依赖 NVSHMEM，配置和调试门槛较高；V2 切到 NCCL Gin，利用已有 NCCL communicator，减少 backend 重量。统一 `ElasticBuffer` 以后，framework 侧只需要围绕同一个 buffer 和 handle cache 管理 dispatch/combine。

第四步是把通信层和计算层的边界重新对齐。DeepEP V2 README 明确提到新 GEMM layout，而 DeepGEMM 的 Mega MoE 又把 EP dispatch、GEMM、SwiGLU 和 combine 融合到一个更大的 kernel。说明 DeepSeek 的系统方向是先把通信和计算分别做成可控原语，再在固定 shape / 固定拓扑上融合。

### 4. 核心假设或切入点

DeepEP 的核心假设是：MoE expert parallelism 的通信路径足够重要、足够规则，值得脱离通用 collective 单独做成一层。

这个假设包含几条工程判断：

- token dispatch / combine 是 MoE training、prefill serving、RL rollout 中的高频瓶颈。
- 通信 kernel 占用 SM 会直接压缩专家 GEMM 的算力空间，因此 SM 数和 stream event 是一等接口。
- MoE 的 metadata 足以让通信布局和后续 GEMM layout 协同优化。
- 低精度 dispatch 可以减少带宽压力，但 combine、梯度和数值一致性仍需按训练/推理目标分别处理。
- 在大规模系统中，通信 backend 的可集成性和可调试性与单次 kernel 峰值同样重要。

### 5. 方法 / 系统 / 理论框架

#### 5.1 V1：NVSHMEM、normal / low-latency 双路径

V1 文档描述了两类 EP kernels：

- normal kernels：用于训练和 inference prefilling，支持 NVLink 和 RDMA forwarding，面向高吞吐。
- low-latency kernels：用于 inference decoding，小 batch，使用 pure RDMA，强调 microsecond latency。

在 DeepSeek-V3/R1 pretraining setting 中，V1 normal kernels 使用 4096 tokens per batch、7168 hidden、top-4 groups、top-8 experts、FP8 dispatch 和 BF16 combining。文档给出的 H800 / CX7 数据中，intranode EP8 达到约 153 GB/s dispatch、158 GB/s combine；internode EP16/32/64 在 RDMA bottleneck bandwidth 上约 43-58 GB/s。

低延迟测试使用 128 tokens per batch、7168 hidden、top-8 experts。V1 文档给出 EP8 dispatch 77 us、combine 114 us；EP256 dispatch 194 us、combine 360 us。这个表说明 decode 小 batch 关注的不是总 TFLOPs，而是 routing、network、metadata 和同步形成的端到端延迟。

#### 5.2 V2：NCCL Gin backend 与 `ElasticBuffer`

V2 的 README 把几项变化放在同一组：

- Fully JIT。
- NCCL Gin backend。
- `ElasticBuffer` 统一 high-throughput 和 low-latency API。
- 支持更大的 scale-up / scale-out domain，README 写到 up to EP2048。
- 解析式 SM/QP count calculation。
- V3-like legacy training 下，SM usage 从 24 降到 4-6，同时保持等价或更好性能。

这里最重要的是 `ElasticBuffer`。它用 MoE settings 初始化：`num_max_tokens_per_rank`、`hidden`、`num_topk`、`use_fp8_dispatch` 等。调用方可以通过 `ElasticBuffer.get_buffer_size_hint` 预估 buffer 大小，并通过 `get_theoretical_num_sms(num_experts, num_topk)` 获取通信 kernel 的理论 SM 数。这样框架可以把通信资源作为显式变量，而不只是调用一个黑盒 all-to-all。

#### 5.3 dispatch / combine 语义

V2 示例中，dispatch 输入包括：

- `x`: token hidden states，支持 BF16 或 FP8 data + scale factors。
- `topk_idx`: 每个 token 选到的 experts。
- `topk_weights`: combine 权重。
- `num_experts`、`num_max_tokens_per_rank`、`expert_alignment`。

dispatch 输出包括接收端 token tensor、接收端 expert index/weight、`EPHandle` 和 `EventOverlap`。`handle` 里包含后续 combine 所需的 routing metadata，其中的 per-expert received token counts 可以直接给专家 GEMM 使用。

这个 handle 设计很关键：forward dispatch 的 metadata 在 backward combine 中复用；forward combine 的反向又是 dispatch。训练语义要求 replica / routing metadata 不能改变参数更新含义，只能改变物理数据路径。DeepEP 把这个约束压进 handle 和 buffer API，减少 framework 层重复计算和错误同步。

#### 5.4 0 SM PP / CP / Engram 的方向

V2 README 还列出实验性 0 SM primitives：

- Engram with RDMA。
- Pipeline parallelism with RDMA。
- Context parallelism with Copy Engine。

这些功能仍被标为 experimental。它们显示 DeepEP 的边界正在从 MoE EP 通信扩展到更一般的 distributed memory movement：让通信尽量使用 NIC、copy engine 或 backend runtime，而把 SM 留给计算 kernel。这个方向和 Thinking Machines 的 batch-invariant kernels、TIM/VeXact 的 rollout/trainer一致性不是同一个问题，但都会把底层 kernel path 提升为训练/推理行为变量。

#### 5.5 性能表该怎么读

V2 README 在 V3-like 设置下测试 8K tokens per batch、7168 hidden、top-8 experts、FP8 dispatch、BF16 combining。表中 SM90 / CX7 / EP8x2 的 dispatch 和 combine bottleneck bandwidth 分别为 90 GB/s 与 81 GB/s，使用 12 个 SM；SM90 / EP8x4 为 61 GB/s 与 61 GB/s，使用 6 个 SM；SM100 intranode EP8 在 NVLink 上最高约 726 GB/s dispatch、740 GB/s combine。

这些结果应理解为 logical bandwidth。README 也提醒 EP8x2 的 90 GB/s 包含 local rank traffic。实际部署时，物理网络、routing、rank placement、local traffic 占比和 framework overhead 都会影响端到端 token/s。

### 6. 结论链条

DeepEP 的结论链条可以压缩为：

1. MoE expert parallelism 的 dispatch/combine 是独立瓶颈。
2. 通用 collective 无法充分利用 MoE 的 token/expert/top-k 结构。
3. V1 用 NVSHMEM + RDMA 专门优化 DeepSeek-V3/R1 训练、prefill 和 decode 路径。
4. V2 用 NCCL Gin + `ElasticBuffer` + JIT + 解析式资源配置降低系统集成和 SM 成本。
5. DeepEP 和 DeepGEMM 的接口边界正在收敛，尤其在 Mega MoE 这种 fused path 上。
6. 对上层 RL rollout / serving 系统而言，DeepEP 是性能基础，也是 determinism、train/inference mismatch 和 load balancing 审计需要记录的底层变量。

## 关键实验/定理

### 结果 1：V2 在 V3-like shape 上降低 SM 占用

- 设置：8K tokens per batch、7168 hidden、top-8 experts、FP8 dispatch、BF16 combining。
- 指标：dispatch / combine bottleneck bandwidth 和通信 kernel 使用 SM 数。
- 结果：README 声明 V2 相比 V1 peak performance 最高 1.3x，同时最多节省 4x SM count；V3-like legacy training 下 SM usage 从 24 降到 4-6。
- 解读：DeepEP 的目标不只是提高通信带宽，还要让通信少占 SM，为专家 GEMM 留出计算资源。

### 结果 2：SM100 intranode EP8 接近 NVLink 逻辑带宽上限

- 设置：SM100、EP8、NVLink intranode。
- 指标：logical bottleneck bandwidth。
- 结果：README 给出 max perf 配置下 dispatch 726 GB/s、combine 740 GB/s；min #SM 配置下 dispatch 643 GB/s、combine 675 GB/s。
- 解读：V2 能在 intranode 高带宽域中用 SM 数换带宽，并把这一 tradeoff 暴露给使用方。

### 结果 3：V1 low-latency decode 路径给出 microsecond 级 EP latency baseline

- 设置：H800 + CX7 RDMA，128 tokens per batch，7168 hidden，top-8 experts，FP8 dispatch，BF16 combine。
- 指标：dispatch/combine latency 和 RDMA bandwidth。
- 结果：V1 文档给出 EP8 dispatch 77 us、combine 114 us；EP256 dispatch 194 us、combine 360 us。
- 解读：decode 阶段的系统目标和 training/prefill 不同。V2 取消 0 SM RDMA low-latency EP，说明低延迟路径与统一 buffer/backend 之间存在取舍。

## 证据链强度评估

### 强证据

- 官方 README、legacy docs 和 citation block 明确说明 DeepEP 的定位、作者、V1/V2 差异、接口和性能表。
- UltraEP 笔记记录了 UltraEP 论文中对 DeepEP `hybrid-ep` branch 的使用，说明 DeepEP 已成为 MoE EP 系统论文的 baseline/依赖。
- DeepGEMM Mega MoE 测试代码直接把 DeepEP `ElasticBuffer` 作为 legacy baseline 的一部分，说明两者在工程上已经形成接口关系。

### 中等强度证据

- README 的 V2 性能表来自官方仓库，具有工程参考价值，但缺少完整 benchmark harness、cluster topology 和可复现日志。
- 作者 profile pass 对部分 DeepSeek infra 作者有较强公开证据，但项目内具体贡献分工仍未公开。

### 需要谨慎的推论

- 不能把 DeepEP README 的 bandwidth 直接外推到任意 RDMA/NVLink 集群。
- 不能把 DeepEP 的通信优化等同于 MoE 端到端加速；expert load balance、GEMM layout、activation、scheduler 和 framework 同步同样关键。
- V2 main 分支和 latest release tag 的时间线不完全一致；生产使用应固定 commit、NCCL/NVSHMEM/PyTorch/CUDA 版本。

## 本地讨论补充

### 1. 讨论收敛点

- 本地分析把 DeepEP 定位为 DeepSeek MoE 系统栈的“通信层 primitive”，而不是完整 MoE runtime。
- DeepEP 与 DeepGEMM 的边界是 dispatch/combine 与 expert compute；Mega MoE 开始把这条边界融合。
- DeepEP 与 UltraEP 的关系是基础通信与实时 load balancing 的关系：DeepEP 优化给定 routing 下的数据搬运，UltraEP 进一步改变 physical expert placement / reroute plan。

### 2. 修正后的理解

- V1 到 V2 的关键变化不只是换 backend，还包括 API 抽象、SM/QP 配置方式和 GEMM layout 协同。
- 低 SM 占用是 DeepEP 的核心指标之一，因为 MoE 系统的总吞吐取决于通信和专家 GEMM 同时运行时的资源竞争。

### 3. 后续复验指标

- 固定 commit 后复测 EP8、EP16、EP32、EP64 的 dispatch/combine latency 和 logical/physical bandwidth。
- 记录 communication kernel SM count、QP count、NVLink/RDMA utilization、CPU synchronization 次数。
- 在 Megatron/SGLang/slime 中测端到端 tokens/s，并拆分 router、dispatch、GEMM、combine、scheduler overhead。
- 对 RL rollout 场景记录 batch composition、kernel path、precision path 和 logprob reproducibility。

## 主要启发

- MoE 系统优化需要同时看通信和计算。只优化 expert GEMM 或只优化 all-to-all 都容易遗漏端到端瓶颈。
- 通信 kernel 的 SM 占用应该作为调度变量暴露给上层，而不是隐藏在 collective 内部。
- `handle` / metadata 复用是训练语义正确性的关键：它保证 forward routing 和 backward aggregation 对齐。
- 对大 MoE RL 系统，DeepEP 这类底层通信路径应进入实验记录，否则 rollout/trainer mismatch 和性能差异很难复查。

## 局限

1. README benchmark 没有完整公开所有硬件拓扑、rank placement、traffic mix 和 framework overhead。
2. V2 main 和 latest release tag 的状态需要使用者自己固定版本。
3. V2 notes 明确说明 buffer size consumption 比 V1 更大，0 SM RDMA low-latency EP 不再支持，Engram/PP/CP 仍是 experimental。
4. DeepEP 不解决 expert load imbalance；这需要 UltraEP/EPLB/MegaMoE/framework scheduler 等上层或旁路系统。
5. 作者个人档案仍有部分 weak evidence，不能把同名作者跨论文自动合并。

## 跨论文关系

- 与 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)：UltraEP 把 DeepEP 作为 MoE EP communication baseline / 依赖之一，同时处理 DeepEP 本身不解决的 exact-load balancing、expert replication 和 reroute。
- 与 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)：DeepSeek-V4 报告里的 MegaMoE、fine-grained EP、deterministic kernels 和 low-bandwidth tolerance 都需要类似 DeepEP 的通信 primitive 支撑。
- 与 [2026-06-19](/papers/2026-06-19-deepgemm-tensor-core-kernels/)：DeepEP 处理 token 在专家并行域中的物理移动，DeepGEMM 处理专家 MLP / GEMM / Mega MoE 计算。两者在 Mega MoE 中开始融合。
- 与 [2026-06-17](/papers/2026-06-17-slime-rl-scaling-framework/)：slime 的大 MoE RL recipes 直接受 SGLang/Megatron/DeepEP 这样的底层 EP 能力影响。
- 与 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 和 [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：DeepEP 改变 token routing 的物理执行路径；若用于 rollout/trainer 闭环，需要记录 kernel、precision、batch 和 metadata path，避免性能优化引入难以复查的数值差异。

## Reference Intake Brief

### Target

- Intended target system: 新增技术项目笔记 / DeepSeek MoE expert-parallel communication 文档。
- Existing related assets: `papers-index.md`；[2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)；[2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)；[2026-06-17](/papers/2026-06-17-slime-rl-scaling-framework/)。
- Proposed form: 新建独立 Markdown 文档，并更新索引中的 DeepSeek MoE system cluster。

### Reusable Elements

1. V1/V2 EP communication API 与 benchmark 数字。
2. DeepEP / DeepGEMM / UltraEP 的分层关系。
3. 面向 MoE RL rollout 的复验指标。

### Risks

- Copyright/over-copying: 只摘录短字段和表格数值，正文使用本地分析重述。
- Unsourced or unverifiable claims: 性能声明标注为 README / docs 来源；未把官方 benchmark 写成普遍结论。
- Tone/brand mismatch: 按工程材料记录，避免营销化表述。
- Safety/compliance issues: 无安全滥用细节。
- Overlap with existing assets: 与 UltraEP 和 DeepSeek-V4 强重叠，但本篇新增的是 DeepEP 通信库自身。

### Skipped

| Material | Reason |
| --- | --- |
| DeepEP experimental branches full code review | 本次目标是项目主线分析，不逐 PR 审计 zero-copy、eager、hybrid-EP、AntGroup-Opt 分支。 |
| 本地 benchmark | 当前环境没有目标 GPU / RDMA / NCCL 集群。 |
| 弱证据作者页 | Kuai Yu、Anyi Xu 等 DeepSeek team 作者需要更多独立公开档案再建作者页。 |

### Recommendation

Decision: merge

Why: DeepEP 是 DeepSeek MoE 系统栈的底层通信节点，能把 UltraEP、DeepSeek-V4、slime、TIM/VeXact 和 DeepGEMM 的系统关系连接起来。
