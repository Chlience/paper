# DeepGEMM main: Tensor Core Kernel Library and Mega MoE 技术笔记

Date: 2026-06-19
Sort-Time: 2026-06-19 14:50

## Source

- Title: DeepGEMM: clean and efficient BLAS kernel library on GPU
- Repository: https://github.com/deepseek-ai/DeepGEMM
- Mega MoE / FP8xFP4 update PR: https://github.com/deepseek-ai/DeepGEMM/pull/304
- Mega MoE benchmark PR: https://github.com/deepseek-ai/DeepGEMM/pull/316
- Latest GitHub release checked: https://github.com/deepseek-ai/DeepGEMM/releases/tag/v2.1.1.post3, published 2025-10-15
- Main version read: `88965b078186ee7510ab9fc4f1d5ebc19adfa8d1`, committed 2026-06-01; README accessed 2026-06-19
- Authors: Chenggang Zhao, Zhean Xu, Liang Zhao, Jiashi Li, Chenhao Xu, Anyi Xu, Shengyu Liu, Kexing Zhou, Kuai Yu
- Released / citation year: 2025
- Subjects: GPU kernels, FP8 / FP4 / BF16 GEMM, grouped GEMM, MoE, Mega MoE, MQA indexer, HyperConnection, JIT, SM90/SM100

## 作者与关系

- [Chenggang Zhao](/authors/chenggang-zhao/): GitHub `LyricZhao` identifies DeepSeek-AI infra affiliation and prior NVIDIA / SenseTime / Tsinghua background; also first author of DeepEP.
- [Zhean Xu](/authors/zhean-xu/): Scholar profile identifies DeepSeek AI and verified Tsinghua email; X profile `@zheanxu` states AI infra at DeepSeek.
- Liang Zhao: DeepGEMM and DeepEP citation author; recurring DeepSeek author-list credit, but no stable personal public profile was verified in this pass.
- Jiashi Li: DeepGEMM and DeepEP citation author; also credited in DeepSeek DualPipe and FlashMLA repositories; author page requires a separate verification pass.
- [Chenhao Xu](/authors/chenhao-xu/): personal homepage states current DeepSeek system engineer role focused on LLM infra and GPU kernels; TileKernels metadata exposes `xch@deepseek.com`.
- Anyi Xu: DeepGEMM citation author; no high-confidence personal profile found in this pass.
- [Shengyu Liu](/authors/shengyu-liu/): personal homepage states DeepSeek-AI MLSys / kernel design work; Scholar profile uses DeepSeek AI verified email; GitHub `interestingLSY` is linked by profile search.
- Kexing Zhou: DeepGEMM citation author; profile pass found a Scholar profile tied to PKU computer architecture/co-design, but DeepSeek-specific personal evidence needs follow-up.
- Kuai Yu: DeepGEMM and DeepEP citation author; recurring DeepSeek infra credit, but no high-confidence personal profile found in this pass.

关系判断：

- 同机构作者群：当前按 DeepSeek-AI systems / kernel contributor group 记录。DeepGEMM citation 没有给逐作者机构拆分。
- 跨机构桥接：Chenggang Zhao 连接 NVIDIA / SenseTime / Tsinghua 背景；Zhean Xu 有 Tsinghua 邮箱线索；Chenhao Xu 和 Kexing Zhou 提供 PKU 侧线索；这些都是个人公开档案或 profile pass 线索，不等价于仓库贡献分工。
- 与已存档作者重叠：与 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 的 DeepSeek-V4 appendix 中 Chenggang Zhao、Chenhao Xu、Jiashi Li、Shengyu Liu 等系统作者线索重叠；与 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 的 DeepSeek-AI 组织作者线存在同一公司/系统生态关系。
- 与已存档论文的主题或方法关系：强连接 [2026-06-19 DeepEP](/papers/2026-06-19-deepep-expert-parallel-communication/)、[2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)、[2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)、[2205.14135](/papers/2205.14135-flashattention-io-aware-exact-attention/)、[2307.08691](/papers/2307.08691-flashattention-2-parallelism-work-partitioning/) 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)。
- 作者页决策：已为 Chenggang Zhao、Zhean Xu、Chenhao Xu、Shengyu Liu 建立 `authors.json` 档案。Liang Zhao、Jiashi Li、Anyi Xu、Kexing Zhou、Kuai Yu 当前记为 `needs-follow-up` 或团队级 recurring credit。

## 一句话结论

DeepGEMM 的核心价值是把 DeepSeek 大模型系统中反复出现的 tensor-core 热路径收敛到一个轻量 JIT CUDA kernel library：它从最初的 FP8 GEMM / MoE grouped GEMM，扩展到 FP4、SM100、V3.2 lightning indexer 的 MQA scoring、mHC/HC 和 Mega MoE；其中 Mega MoE 把 EP dispatch、两个 FP8xFP4 expert GEMM、SwiGLU 和 EP combine 融合并重叠 NVLink 通信与 tensor-core 计算，说明 DeepSeek 的 MoE kernel 栈已经从“单个 GEMM 极限优化”推进到“通信-计算一体化的专家 MLP mega-kernel”。

## 阅读目标与判断边界

本笔记关注：

1. DeepGEMM 在 DeepSeek MoE / long-context 系统栈中承担什么计算层角色。
2. FP8、FP4、grouped GEMM、masked GEMM、MQA indexer 和 Mega MoE 的关系。
3. 它和 DeepEP、DeepSeek-V4、UltraEP、FlashAttention 系列之间的分层关系。
4. 哪些性能声明来自官方 README / PR，哪些需要本地复验。

判断边界：

- DeepGEMM 是项目仓库和工程文档，不是完整论文；本笔记按技术项目材料归档。
- 当前 README 已包含 2026-04-16 Mega MoE / FP8xFP4 / FP4 Indexer update，而 latest release tag 仍是 2025-10-15 的 `v2.1.1.post3`。本笔记以 main commit `88965b0` 为主。
- README 性能声明和 PR benchmark 只代表作者给定形状、硬件、软件栈和 baseline 的结果。
- DeepGEMM 不替代 cuBLAS/CUTLASS 的通用覆盖面；它面向 DeepSeek/LLM/MoE 常见形状做小而专的 kernel set。

## 论文脉络

### 1. 研究问题、背景和价值

大模型训练和推理里，大多数 FLOPs 来自 GEMM。Dense Transformer 主要是 attention 和 MLP GEMM；MoE 模型进一步引入 grouped GEMM，因为每个 expert 处理的 token 数不同，但 expert 权重形状相同。DeepSeek-V3/R1/V4 这类 fine-grained MoE 使用大量 routed experts、top-k routing、FP8/FP4 低精度和长上下文结构，使 GEMM 热路径出现几类新要求：

- Dense FP8 / BF16 GEMM 需要接近 tensor-core 峰值。
- MoE forward / backward 需要 grouped GEMM，且只在 M axis 上分组。
- Inference decode 的 expert token count 可能通过 CUDA graph 或 mask 表示。
- FP8 / FP4 scale factor layout 要适配 TMA、UE8M0、SM90/SM100 差异。
- Sparse/compressed attention 的 indexer 需要 MQA scoring 这类非标准 GEMM-like kernel。
- mHC/HC、MTP、MegaMoE 等 V4/V3.2 组件要求更多小而定制的 kernel。

DeepGEMM 的价值在于把这些固定在 DeepSeek 系统内部的形状和数据布局做成公开、轻量、JIT 的 kernel library。它不是只追求一个 `matmul` API，而是围绕 LLM/MoE 生产形状设计少量核心 kernel 函数。

### 2. 已有解决方案与不足

常见路线包括 cuBLAS、CUTLASS、Triton、自研 CUDA 和框架自带 grouped GEMM。它们各自有优势，但在 DeepSeek 这类 MoE + 低精度 + 固定形状系统中会留下空白：

- cuBLAS 覆盖广，但不一定暴露 MoE grouped / masked layout 和 FP4 scale factor 细节。
- CUTLASS/CuTe 功能强，但模板和代数层较重，学习和快速定制成本高。
- Triton 写法简洁，但对某些极限 tensor-core / TMA / SM100 路径不一定达到作者需要的性能。
- 手写 monolithic kernel 容易积累重复代码，难以统一 JIT cache、环境变量和 profiling。

DeepGEMM 的 README 明确说它借鉴 CUTLASS/CuTe 概念，但减少对重模板/代数的依赖，保留有限数量的核心 kernel。这个选择把库定位成“可读、可改、专用形状高性能”的中间层。

### 3. 作者可能的思考路径

可以把 DeepGEMM 的形成理解为几个约束同时收紧后的结果。

第一，DeepSeek-V3/R1 已经把 FP8 训练、MoE、DeepSeekMoE 和 large-scale RL rollout 放进生产系统。此时单纯依赖通用 GEMM 库会限制对 scale factor layout、MoE token packing 和 framework metadata 的控制。

第二，MoE 的 expert MLP 形状高度重复。每个 expert 的 hidden / intermediate hidden 相同，差异主要是每个 expert 收到的 token 数。这样 grouped GEMM 不需要完全通用的 group shape，只需要优化 M-axis grouping，反而可以更简洁。

第三，DeepSeek-V4/V3.2 引入更多模型内核：CSA/HCA indexer、mHC/HC、FP4 QAT、MegaMoE、deterministic kernels。它们都不是传统 BLAS 可以完整覆盖的对象，但都和 tensor-core / memory layout / JIT 编译相关。

第四，DeepEP 已经把 token dispatch/combine 做成 `ElasticBuffer` 和 handle。专家 MLP 的输入 layout、scale factor layout 和 per-expert token count 可以直接进入 DeepGEMM。Mega MoE 进一步说明，通信和计算之间的边界在固定拓扑下可以融合。

### 4. 核心假设或切入点

DeepGEMM 的核心假设是：frontier LLM 系统需要一个面向自身数据布局、低精度格式和 MoE shape 的小型 kernel library，而不是把所有矩阵乘都交给通用库。

具体包括：

- 常见 LLM shapes 足够稳定，可以为它们做 JIT specialization。
- FP8/FP4 scale factor layout 是性能和正确性的核心，不是前后处理细节。
- MoE grouped GEMM 可以利用 shared N/K shape 和 M-axis grouping。
- 对 long-context / compressed attention 系统，indexer scoring kernel 和 GEMM 一样需要纳入同一性能栈。
- 当通信和计算的阶段边界固定时，Mega MoE 可以通过融合和 overlap 消除中间 buffer 与 launch overhead。

### 5. 方法 / 系统 / 理论框架

#### 5.1 Dense GEMM：NT 为主，SM100 扩展 layout

DeepGEMM 的命名遵循 `D = C + A @ B`，README 说明输入形状 layout 以 NT 为核心，即 A 非转置、B 转置。SM90 实现主要支持 NT memory layout，SM100 实现扩展到 NT/TN/NN/TT。

FP8 scale factor 处理是核心约束之一：

- SM90 要求 LHS scaling factor 为 FP32。
- SM100 要求 packed UE8M0，4 个 UE8M0 pack 到一个 `torch.int`。
- 输入转置、FP8 casting 等操作通常要求用户在前序 kernel 中处理或融合。

这个设计说明 DeepGEMM 不追求“把所有准备工作包进 GEMM API”，而是把 GEMM kernel 本身做窄，让上游 framework 或前序 kernel 负责 layout/cast 融合。

#### 5.2 MoE grouped GEMM：contiguous 与 masked layout

DeepGEMM 的 grouped GEMM 和传统 CUTLASS grouped GEMM 不同。它只在 M-axis 上分组，N 和 K 固定。这正好适配 MoE experts：每个 expert 权重矩阵形状相同，不同 expert 的 token 数不同。

Contiguous layout 用于 training forward 或 inference prefill。token 会按 expert 拼接到一个连续 tensor 中，每个 expert segment 需要按 GEMM M block size 对齐。这个 layout 和 DeepEP dispatch 输出的 per-expert token counts 天然连接。

Masked layout 用于 inference decoding，尤其是 CUDA graph 启用时 CPU 不知道每个 expert 实际接收 token 数的情况。用户提供 mask tensor，kernel 只计算有效部分。README 明确给出一个用例：DeepEP low-latency kernels 的输出可以作为 masked grouped GEMM 输入。

#### 5.3 V3.2 MQA indexer scoring

README 记录 DeepGEMM 支持 DeepSeek V3.2 lightning indexer 的 weighted ReLU MQA logits。这个 kernel 有 non-paged prefill 和 paged decode 两个版本。

以非 paged `fp8_mqa_logits` 为例，它把 query、KV、weights、每个 query 可访问的 key 起止范围组合起来，对每个 token 计算 token-to-token logits。核心形式是先做 query 和当前 KV entry 的 head-wise dot product，再 ReLU、乘 head weights、求和。

这个 kernel 的存在说明 DeepGEMM 已经超出传统 GEMM。DeepSeek 的 compressed/sparse attention 需要一个高性能 indexer，决定哪些历史 token/blocks 会被 core attention 访问。Indexer 性能会影响 1M context 的 prefill/decode 成本。

#### 5.4 Mega MoE：通信与专家 MLP 一体化

Mega MoE 是 DeepGEMM 当前最重要的新方向。README 描述它将以下步骤融合并重叠：

1. EP dispatch。
2. Linear 1，FP8xFP4。
3. SwiGLU。
4. Linear 2，FP8xFP4。
5. EP combine。

它使用 PyTorch symmetric memory buffer，多进程启动，要求把 FP4 weights 和 UE8M0 scale factor 转换为特定 layout。`tests/test_mega_moe.py` 中的 baseline 是 DeepEP `ElasticBuffer` dispatch + DeepGEMM grouped GEMM + activation + combine；fused path 则调用 `deep_gemm.fp8_fp4_mega_moe`。

这个设计的系统含义很强：MoE expert MLP 的总时间不再只是两次 grouped GEMM 的时间，还包含 dispatch/combine、中间 activation、scale factor layout conversion、NVLink traffic 和 launch overhead。Mega MoE 把这些阶段作为一个整体调度，并用 NVLink 通信和 tensor core compute overlap 争取端到端加速。

#### 5.5 JIT 与环境控制

DeepGEMM 全部 kernel 通过轻量 JIT 编译，不需要安装阶段编译 CUDA kernel。README 记录了 JIT cache、NVRTC/NVCC 切换、PTXAS verbose、local memory assertion、SASS/PTX dump、lineinfo、compiler path、runtime API loading 等环境变量。

这对系统研发很重要：性能 kernel 的真实问题经常出现在某个 shape、某个 compiler version、某个 layout 上。JIT cache 和 dump/profiling 选项让 DeepGEMM 更像一个可调试的 kernel lab，而不是单纯二进制依赖。

### 6. 结论链条

DeepGEMM 的结论链条可以压缩为：

1. DeepSeek MoE / long-context 系统需要比通用 BLAS 更贴近模型数据布局的 kernel 层。
2. FP8/FP4 scale factor、M-axis grouped GEMM、masked decode、V3.2 indexer 和 mHC/HC 都进入了同一套性能问题。
3. JIT specialization 让少量核心 kernel 覆盖高价值 shape。
4. Mega MoE 把 DeepEP 通信和 DeepGEMM 计算融合，说明单 kernel peak TFLOPs 已经不足以描述端到端 MoE 性能。
5. 对 DeepSeek-V4、UltraEP、slime 和 RL rollout 系统，DeepGEMM 是计算层基础变量，也会影响 determinism、precision path 和 trainer/rollout consistency。

## 关键实验/定理

### 结果 1：DeepGEMM 官方 README 记录 H800 FP8 性能上探

- 设置：DeepGEMM README news 记录 2025-04-18 后一系列 PR。
- 指标：FP8 GEMM peak TFLOPS。
- 结果：README 称 H800 上最高达到 1550 TFLOPS，并指向 #74、#78、#81、#86 和 commit `340d988`。
- 解读：这说明 DeepGEMM 早期目标是把 FP8 GEMM 做到接近专家调优库的水平，但需要回到具体 PR 和 benchmark harness 才能判断 shape 覆盖。

### 结果 2：Mega MoE 在 V4 shapes 上给出 1.5x 以上 legacy speedup

- 设置：PR #316 在 DeepSeek-V4-Flash 和 DeepSeek-V4-Pro shapes 上测试 EP8，覆盖不同 batch size。
- 指标：time、compute TFLOPS、global memory GB/s、interconnect GB/s、相对 legacy speedup。
- 结果：V4-Flash shape 在 batch size 512/8192/32768 上分别为 1.73x、1.56x、1.62x speedup；V4-Pro shape 在同类 batch size 上分别为 1.54x、1.50x、1.54x speedup。batch size 1 也有 1.96x 和 1.61x。
- 解读：Mega MoE 的收益来自融合和 overlap，不只是单个 GEMM 更快。它特别适合 DeepSeek-V4 这种固定专家数、top-k、hidden/intermediate shape。

### 结果 3：V3.2 MQA indexer 进入 DeepGEMM kernel family

- 设置：README news 记录 2025-09-28 支持 lightning indexer scoring kernels。
- 指标：功能覆盖，而不是单一性能表。
- 结果：DeepGEMM 提供 prefill non-paged 和 decode paged MQA logits kernels。
- 解读：DeepGEMM 已经成为 DeepSeek compressed/sparse attention 的一部分，不再只是 MoE MLP kernel library。

## 证据链强度评估

### 强证据

- 官方 README 明确列出功能、接口、requirements、citation、Mega MoE 示例和环境变量。
- PR #316 给出 DeepSeek-V4-Flash / Pro shapes 的 Mega MoE benchmark 数字。
- `tests/test_mega_moe.py` 展示 fused Mega MoE 与 DeepEP + grouped GEMM baseline 的关系，并包含 correctness check 对比。

### 中等强度证据

- README news 中的 1550 TFLOPS、SM100 refactor、wgrad kernels 等指向多个 PR；完整判断需要逐 PR 和本地 benchmark。
- 作者 profile pass 对部分 DeepSeek kernel 作者有较强公开证据，但项目内具体分工未公开。

### 需要谨慎的推论

- 不能把 Mega MoE 的 V4 shape speedup 直接外推到任意 MoE 模型、任意 EP degree 或任意 interconnect。
- FP4 / FP8 speedup 需要同时看模型精度、QAT / scale factor recipe 和 trainer/rollout一致性。
- DeepGEMM 的轻量设计牺牲了通用性；它适合高价值固定 shape，不代表替代所有 GEMM backend。

## 本地讨论补充

### 1. 讨论收敛点

- 本地分析把 DeepGEMM 定位为 DeepSeek kernel infrastructure 的计算层 primitive。
- DeepEP 和 DeepGEMM 是 MoE 系统的左右两半：DeepEP 移动 token，DeepGEMM 计算 experts。Mega MoE 把两者融合成一个端到端专家 MLP path。
- DeepGEMM 的范围已经从 GEMM 扩展到 indexer / HC / Mega MoE，说明 DeepSeek 将 kernel library 作为模型架构的一部分来维护。

### 2. 修正后的理解

- DeepGEMM 不是“简单 FP8 GEMM 库”。截至 main `88965b0`，它已经是 FP8/FP4/BF16、MoE grouped/masked、indexer、HC 和 fused MoE 的集合。
- 对 DeepSeek-V4 这类系统，kernel library 和模型报告不能分开理解。V4 的 CSA/HCA、mHC、MegaMoE 和 deterministic kernels 都会把 kernel 细节变成模型能力和系统吞吐的条件。

### 3. 后续复验指标

- 分别测 dense GEMM、contiguous grouped GEMM、masked grouped GEMM、MQA indexer、Mega MoE。
- 固定 CUDA、compiler、NCCL、PyTorch、SM90/SM100、FP8/FP4 scale factor layout。
- 对 Mega MoE 拆解 dispatch、L1 GEMM、SwiGLU、L2 GEMM、combine、NVLink traffic 和 HBM traffic。
- 在 RL rollout/trainer 中记录 FP8/FP4 casting、scale factor packing、BF16 accumulation/output 和 logprob 路径。

## 主要启发

- MoE 性能优化已经从“更快 GEMM”推进到“expert path 端到端融合”。
- Scale factor layout 是低精度系统的一等设计对象；它影响 TMA、tensor core、memory layout 和数值复现。
- Indexer kernel 会成为长上下文 compressed/sparse attention 的关键瓶颈，不能只看 core attention。
- Mega MoE 这类 fused kernel 提高性能的同时，也增加了 debug、determinism 和版本固定的重要性。

## 局限

1. DeepGEMM 主线功能领先 latest release tag，使用时需要固定 commit。
2. 官方 benchmark 多为特定 DeepSeek shapes，缺少完整第三方复现。
3. FP4 / FP8 path 的模型质量影响需要结合 QAT、scale factor、accumulation 和 downstream benchmark 判断。
4. Mega MoE 依赖 symmetric memory、多进程、固定 EP 形状和 interconnect，集成成本高于单个 GEMM。
5. 部分作者的独立 profile 仍需后续补证据。

## 跨论文关系

- 与 [2026-06-19 DeepEP](/papers/2026-06-19-deepep-expert-parallel-communication/)：DeepEP 提供 dispatch/combine 通信原语，DeepGEMM 提供 expert GEMM / activation / Mega MoE 计算原语；Mega MoE 将二者融合。
- 与 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)：DeepSeek-V4 的 V4-Flash / V4-Pro shapes 直接出现在 Mega MoE benchmark 中；V4 的 CSA/HCA indexer、mHC、FP4 QAT 和 deterministic kernels 都和 DeepGEMM 功能面相连。
- 与 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)：UltraEP 处理 expert load balancing、replica 和 token reroute；DeepGEMM 处理每个 physical expert instance 上的 compute kernel。两者分别优化 MoE 的“负载放置”和“局部计算”。
- 与 [2205.14135](/papers/2205.14135-flashattention-io-aware-exact-attention/) / [2307.08691](/papers/2307.08691-flashattention-2-parallelism-work-partitioning/)：FlashAttention 系列提供 attention kernel 的 IO-aware / parallelism 语言；DeepGEMM 提供 GEMM/MoE kernel 的低精度、layout 和 fusion 语言。二者共同构成大模型 kernel stack。
- 与 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 和 [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：DeepGEMM 的 low-precision、fused 和 deterministic path 会影响 trainer/rollout logprob 一致性，需要作为实验元数据记录。

## Reference Intake Brief

### Target

- Intended target system: 新增技术项目笔记 / DeepSeek tensor-core and MoE kernel library 文档。
- Existing related assets: `papers-index.md`；[2026-06-19 DeepEP](/papers/2026-06-19-deepep-expert-parallel-communication/)；[2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)；[2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)。
- Proposed form: 新建独立 Markdown 文档，并更新索引中的 DeepSeek kernel infrastructure cluster。

### Reusable Elements

1. DeepGEMM 功能面：FP8/FP4/BF16、grouped/masked GEMM、MQA indexer、Mega MoE。
2. Mega MoE benchmark 与 DeepEP baseline 的关系。
3. 面向 low-precision MoE / long-context systems 的复验指标。

### Risks

- Copyright/over-copying: 只保留必要 API 名称和 benchmark 数字，正文为本地分析重述。
- Unsourced or unverifiable claims: 官方 PR benchmark 标注为 PR #316 来源，未泛化为所有场景结论。
- Tone/brand mismatch: 按工程材料记录，避免营销化表达。
- Safety/compliance issues: 无安全滥用细节。
- Overlap with existing assets: 与 DeepSeek-V4 和 DeepEP 重叠，但本篇新增的是 DeepGEMM kernel library 本身。

### Skipped

| Material | Reason |
| --- | --- |
| DeepGEMM 全 PR 逐项 code review | 本次目标是项目主线分析，不逐 PR 审计。 |
| 本地 benchmark | 当前环境没有目标 GPU / CUDA / SM90/SM100。 |
| 弱证据作者页 | Anyi Xu、Kuai Yu 等需要更多独立公开档案再建作者页。 |

### Recommendation

Decision: merge

Why: DeepGEMM 是 DeepSeek MoE / long-context kernel stack 的核心节点，能把 DeepEP、DeepSeek-V4、UltraEP、FlashAttention family 和 train/inference consistency 讨论连接起来。
