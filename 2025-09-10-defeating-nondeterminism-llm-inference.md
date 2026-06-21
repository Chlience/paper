# Defeating Nondeterminism in LLM Inference 技术文章笔记

First-Archived-At: 2026-01-30 15:10
Updated-At: 2026-01-30 15:10

## Source

- Title: Defeating Nondeterminism in LLM Inference
- Source: Thinking Machines Lab: Connectionism
- URL: https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/
- Code/Project: https://github.com/thinking-machines-lab/batch_invariant_ops
- Author: Horace He, in collaboration with others at Thinking Machines Lab
- Published: 2025-09-10
- Current version read: web article accessed 2026-01-30
- DOI: https://doi.org/10.64434/tml.20250910
- Type: technical blog / engineering note

## 作者与关系

- Horace He: Thinking Machines Lab，文章署名作者。
- Thinking Machines Lab: 文章与代码的发布组织；代码仓库 `batch_invariant_ops` 属于 `thinking-machines-lab` GitHub organization。

关系判断：

- 同机构作者群：文章没有列出完整合作者名单，只说明 Horace He 与 Thinking Machines Lab 其他成员协作完成。
- 跨机构桥接：未发现外部机构共同作者；文章引用并讨论 vLLM、SGLang、PyTorch、FlexAttention、FlashAttention、FlashInfer 等开源系统。
- 与已存档作者重叠：未发现与当前归档论文作者重叠。
- 与已存档论文的主题或方法关系：与 `2409.19256` 和 `2606.00135` 关系最强。前者讨论 RLHF/VERL 如何把训练和 rollout 编排起来；本文讨论 rollout inference 的数值确定性，以及 sampler 与 trainer 的 logprob 一致性。与 `2606.06453` 同属 LLM serving / kernel / attention 系统效率方向。
- 需要后续确认：代码仓库和 vLLM/FlexAttention 集成可能持续演化；后续引用时需确认对应 commit、vLLM PR 和实际支持的模型/kernel 范围。

## 一句话结论

这篇文章指出，LLM 推理在 `temperature=0` 下仍然出现不同输出，主要来源通常是 batch 不变性缺失：服务端负载改变 batch size、prefill/decode 切分、KV cache 布局和 attention split 策略，进而改变浮点 reduction 顺序；作者通过 batch-invariant RMSNorm、matmul 和 attention kernel 展示了可复现推理的实现路径，并把它连接到真正 on-policy RL 中 sampler 与 trainer 的数值一致性问题。

## 阅读目标与判断边界

本笔记关注：

1. 文章如何解释 LLM inference nondeterminism 的真实来源。
2. batch invariance 与 run-to-run determinism 的区别。
3. RMSNorm、matmul、attention 三类 reduction kernel 如何实现 batch-invariant。
4. 这件事对 RLHF/RLVR、VERL、tool-calling RL 的 sampler/trainer 一致性意味着什么。

判断边界：

- 这是一篇工程博客，证据来自作者实现、示例和实验展示，正式论文式 peer review 信息有限。
- 文章目标是同一硬件/软件栈内的 inference determinism，跨 GPU 架构、CUDA 版本、kernel 实现的 bitwise 一致性仍需额外约束。
- 公开代码是 companion library，文章提到部分 FlexAttention 内部改动当时尚未完全包含在代码 release 中。
- 本文关注 inference forward 和 serving 调度，不覆盖训练 backward 中的完整确定性问题。

## 论文脉络

### 1. 问题背景

很多用户以为 `temperature=0` 的 LLM 推理应该完全确定，因为 greedy sampling 总是选择最高概率 token。实际的 LLM API、vLLM、SGLang 等推理服务中，同一个 prompt 多次请求仍可能出现不同 completion。

常见解释是 GPU 并发、浮点非结合律和 atomic add 导致累加顺序随机。文章认为这个解释抓住了数值差异的底层条件，但没有指出 LLM inference endpoint 中最常见的触发机制。现代 LLM forward pass 里的常见 kernel 大多可以做到 run-to-run deterministic，即同一 kernel、同一输入、同一环境重复运行得到 bitwise 相同输出。

关键矛盾在服务系统层：对服务器来说，完整输入包含当前同时处理的所有请求；对单个用户来说，其他请求和服务器负载属于不可控环境变量。服务端负载改变 dynamic batching 和 chunking，进而改变该用户请求的 kernel shape 和 reduction order。

### 2. 核心假设或切入点

文章的核心概念是 batch invariance。

batch invariance 指同一个 batch 元素的数值结果不应依赖 batch size、该元素在 batch 中的位置、以及同批次其他元素。数学上，第一条样本的 `x @ W` 应该只由这条样本和权重决定。高性能 kernel 为了吞吐，会根据 batch size、tile shape、tensor-core 指令、Split-K 或 Split-KV 策略改变计算路径，导致同一条样本在不同 batch 条件下产生不同浮点结果。

因此，LLM inference 的用户侧非确定性可以写成一条链：

1. 在线服务负载变化。
2. dynamic batching / chunked prefill / decode scheduling / prefix cache 行为变化。
3. kernel shape 和切分策略变化。
4. RMSNorm、matmul、attention 中的 reduction order 变化。
5. logits 出现微小差异。
6. 自回归生成在某个 token 分叉，之后输出轨迹扩大差异。

### 3. 方法 / 系统 / 理论框架

作者给出的解决方向是让 Transformer 关键 forward kernel 具备 batch invariance。

RMSNorm：

- RMSNorm 需要对 hidden dimension 做 reduction。
- 常规做法在 batch 足够大时可以让每个 batch element 由一个 core 或固定 thread/block 处理。
- batch 很小时，为了提高 GPU 利用率，kernel 可能改用 split reduction，把单个 reduction 切给多个 core。
- batch-invariant RMSNorm 要求同一元素的 reduction order 不受 batch size 影响。最直接做法是固定每个元素的 reduction 策略，接受小 batch 下的一些性能损失。

Matmul：

- matmul 本质上也是点乘后的 reduction。
- 高性能 matmul 会按输出 tile 分配 work，并可能在 M/N 太小时使用 Split-K、stream-k、不同 tile size 或不同 tensor-core instruction。
- 这些选择会改变 reduction order，破坏 batch invariance。
- 文章建议用固定 kernel configuration 和固定 tile/reduction 策略来保持 batch-invariant；作者的未充分优化 Triton kernel 相比 cuBLAS 约有 20% 性能损失。

Attention：

- attention 同时涉及 feature dimension 和 sequence dimension 的 reduction。
- inference 中还会遇到 KV cache、paged layout、chunked prefill、prefix caching、decode query length 很小等系统因素。
- 如果 attention kernel 把 KV cache 中旧 token 和当前新 token 分开 reduction，同一个 query token 在 prefill 和 decode/partial prefill 中会走不同 reduction order。
- 作者的解决方向是先更新 KV cache 和 page table，让 attention kernel 看到一致布局。
- 对 decode 中常见的 Split-KV / FlashDecoding，固定 split 数仍会随 query token 数改变 reduction 结构；文章提出固定 split-size，让 KV 长度按固定块大小切分，从而保持每个 token 的 reduction order 稳定。

实现：

- 作者在 vLLM 上做 deterministic inference demo。
- 使用 vLLM 的 FlexAttention backend。
- 使用 `torch.Library` 以低侵入方式替换相关 PyTorch operators。
- 公开代码仓库为 `thinking-machines-lab/batch_invariant_ops`。

### 4. 结论链条

文章的结论链条是：

1. 浮点非结合律解释了为什么不同 reduction order 会得到不同数值。
2. 典型 LLM forward kernel 本身通常可以 run-to-run deterministic。
3. 在线 inference endpoint 的 batch size、chunking 和 KV layout 会随服务负载变化。
4. 常规高性能 kernel 对 batch shape 缺少 invariance，导致用户侧非确定性。
5. 对 RMSNorm、matmul、attention 实现 batch-invariant kernel 后，`temperature=0` 推理可以达到完全一致输出。
6. 对 RLHF/RLVR，sampler 与 trainer 数值一致性会影响 on-policy 假设；deterministic inference 是 true on-policy RL 的基础条件之一。

## 关键实验/定理

### 结果 1：temperature 0 仍会出现多种 completions

- 设置：使用 `Qwen/Qwen3-235B-A22B-Instruct-2507`，同一个 prompt “Tell me about Richard Feynman”，`temperature=0`，生成 1000 次，每次 1000 tokens。
- 指标：unique completions 数量。
- 结果：普通推理得到 80 个不同 completions；最常见 completion 出现 78 次。前 102 个 token 相同，第 103 个 token 附近开始分叉。
- 解读：greedy sampling 理论上确定，但 logits 的微小数值差异足以在接近并列的 token 位置改变后续轨迹。

### 结果 2：batch-invariant kernel 可让输出完全一致

- 设置：同上，开启作者实现的 batch-invariant kernels。
- 指标：1000 次 completion 是否一致。
- 结果：1000 次 completions 完全一致。
- 解读：至少在作者实验栈中，batch/slicing 导致的非确定性可以通过 kernel invariance 处理。

### 结果 3：性能成本可控但仍明显

- 设置：单 GPU Qwen3-8B API server，请求 1000 条序列，输出长度 90 到 110。
- 指标：总耗时。
- 结果：vLLM default 约 26 秒；未优化 deterministic vLLM 约 55 秒；改进 attention kernel 后约 42 秒。
- 解读：确定性实现带来吞吐损失，当前实现仍可用于科研复现、评测和高价值 debug 场景；大规模线上部署需要进一步优化。

### 结果 4：true on-policy RL

- 设置：RLVR 实验，policy 从 Qwen2.5-VL instruct 8B 初始化，max rollout length 4096；比较无 off-policy correction、importance weighting、bitwise-identical sampler/trainer 三种情况。
- 指标：reward、sampler/trainer logprob KL divergence。
- 结果：无 off-policy correction 的训练中途 reward collapse；importance weighting 可平滑训练；sampler 与 trainer bitwise 一致时 KL divergence 保持 0，训练也能平滑进行。
- 解读：推理和训练之间的数值差异会让名义 on-policy 的训练带有 off-policy 成分；严格一致的 sampler/trainer 可去掉这类偏差。

## 证据链强度评估

### 强证据

- 文章对 run-to-run determinism 与 batch invariance 的区分清晰，解释了为什么单个 kernel 重复运行确定，在线 endpoint 仍对用户呈现非确定性。
- RMSNorm、matmul、attention 的 reduction 结构分析具体，对照了 LLM inference 中真实的 dynamic batching、chunked prefill、KV cache 和 Split-KV 问题。
- 1000 次 completion 实验直观展示了微小数值差异如何在自回归生成中放大。
- RLVR 示例把 inference determinism 和 on-policy RL 直接连接起来，和后续 RLHF/RLVR 系统研究关系紧密。

### 中等强度证据

- 性能实验规模较小，主要说明可用性，还不能代表大规模 serving 的最终成本。
- batch-invariant matmul 性能对比基于未充分优化实现，后续优化空间和硬件依赖都较大。
- Qwen3-235B 和 Qwen3-8B 实验展示强，但模型、kernel、GPU、vLLM 配置变化后仍需复验。

### 需要谨慎的推论

- batch invariance 解决的是在线 serving 中由 batch/slicing 变化引发的数值差异；跨硬件、跨驱动、跨 CUDA、跨 kernel 版本的 bitwise 一致还需要更强约束。
- deterministic inference 对科研和 RL 训练价值很高，但线上产品是否值得承担额外延迟，需要按场景权衡。
- RLVR 中 reward collapse 与 off-policy correction 的关系需要更多任务和算法复验；本文实验足以说明风险存在，但还不能推出所有 RL 失败都来自 sampler/trainer 数值差异。

## 主要启发

- 对 LLM serving 来说，“确定性”要以单个用户请求为视角定义。服务端把并发请求视为输入，用户把并发负载视为环境随机性，这会改变系统语义。
- 推理评测、回归测试、benchmark 复现、RL rollout 数据生成，都应记录 serving backend、batching 策略、attention backend、KV cache 策略和 deterministic mode。
- 对 VERL/HybridFlow 这类框架，训练 backend 与 rollout backend 的数值一致性是 hidden contract。框架只负责调度还不够，sampler 和 trainer 的 logprob 也需要可校验。
- tool-calling RL 和 long-horizon agent RL 更容易放大这个问题，因为早期 token 或工具调用参数的小差异会改变后续工具返回、轨迹长度和 reward。
- batch-invariant kernel 提供了一个可复现优先的模式：debug、ablation、RL 数据生成可以开启；追求吞吐的生产 serving 可在风险可接受时关闭。

## 局限

1. 文章是技术博客，未提供论文式完整 appendix、硬件矩阵和大规模多模型 benchmark。
2. 公开代码覆盖的 operator 和 backend 范围有限，文章中部分 FlexAttention 改动需要后续 upstream。
3. 性能仍有明显损失，尤其 attention 和小 batch 场景需要进一步优化。
4. MoE、量化 kernel、speculative decoding、多 GPU tensor parallel、跨节点通信 reduction 等场景仍需单独验证 batch invariance。
5. 文章没有系统比较 SGLang、TensorRT-LLM、TGI、DeepSpeed Inference 等 serving stack 的 determinism 差异。
6. RLVR 实验说明 sampler/trainer 一致性的重要性，但没有给出多任务、多算法的大规模统计结论。

## 跨论文关系

- 与 `2409.19256` 的作者关系：未发现作者重叠。主题关系强。`2409.19256` 解决 RLHF/VERL 的多模型 dataflow、rollout 与 training backend 编排；本文补充 rollout inference 的 batch-invariant determinism 和 sampler/trainer 数值一致性。
- 与 `2606.00135` 的作者关系：未发现作者重叠。主题关系强。`2606.00135` 讨论 tool-calling RL 中 harness、rollout 和 policy update 成本；本文解释 rollout backend 的 batch/slicing 数值差异可能改变轨迹与 logprob，从而影响 on-policy 训练和评测可复现性。
- 与 `2606.06453` 的作者关系：未发现作者重叠。系统关系强。两者都关注 LLM serving 和 attention/kernel 层细节；Vortex 优化 sparse attention serving，本文优化 deterministic inference 所需的 batch-invariant attention。
- 与 `2605.30290` 的作者关系：未发现作者重叠。主题关系中等。Self-trained verification 依赖 verifier/reasoner 多轮闭环，本文提示推理 determinism 会影响 test-time refinement 和 verifier-guided rollout 的复现。
- 与 `2606.04075` 的作者关系：未发现作者重叠。主题关系中等。SocioHack 关注 RL 优化闭环中的 reward hacking；本文关注数值和 serving 调度带来的轨迹差异，二者都提醒优化闭环中的环境细节会改变行为。
- 与 `2510.19315` 的作者关系：未发现作者重叠。关系较弱；一个是 serving 数值系统，一个是 Transformer 理论复杂性。
- 与 `2605.31514` 的作者关系：未发现作者重叠。方法论关系中等；两者都提醒研究者把观察到的模型行为和接口/系统条件分开解释。
- 新增后应更新的索引 cluster：新增 “LLM Inference Determinism 与 Batch-Invariant Kernels” cluster，作为 RLHF/RLVR 系统和 LLM serving 系统之间的数值一致性节点。

## Reference Intake Brief

### Target

- Intended target system: `paper archive root` 论文与技术文章存档。
- Existing related assets: `papers-index.md`、`2409.19256-hybridflow-rlhf-framework.md`、`2606.00135-agentic-tool-calling-rl-training.md`、`2606.06453-vortex-sparse-attention-serving.md`。
- Proposed form: 新建独立 Markdown 文档，并更新总索引。

### Reusable Elements

1. batch invariance：单个样本的结果不依赖 batch size、batch position 和同批其他请求。
2. inference nondeterminism chain：load -> dynamic batching/chunking -> reduction order -> logits drift -> autoregressive divergence。
3. deterministic inference implementation：batch-invariant RMSNorm、matmul、attention，vLLM + FlexAttention + `torch.Library`。
4. true on-policy RL：sampler 与 trainer bitwise 一致时，logprob KL divergence 可保持 0。

### Risks

- Copyright/over-copying: 本笔记采用转述，只保留必要短语和实验数值。
- Unsourced or unverifiable claims: 文章事实来自 Thinking Machines Lab 原文和公开代码仓库；跨论文关系为本地分析判断。
- Tone/brand mismatch: 保持本目录技术笔记风格。
- Safety/compliance issues: 该文是推理可复现和系统确定性主题，无直接安全滥用流程。
- Overlap with existing assets: 与 `2409.19256`、`2606.00135`、`2606.06453` 有交叉，但本文作为 inference determinism 节点单独存档。

### Skipped

| Material | Reason |
| --- | --- |
| 原文全部代码示例 | 本地笔记只沉淀机制和结论，代码可通过源链接回看。 |
| 所有引用链接逐一展开 | 本文重点是原文主张和与本地论文关系，底层引用可后续按需补充。 |
| 未公开的内部 FlexAttention 改动 | 原文说明会后续 upstream，本地不推断实现细节。 |

### Recommendation

Decision: merge

Why: 该文补齐了本目录 RLHF/RLVR 系统线中的 inference determinism 和 sampler/trainer 一致性问题，是理解 VERL、tool-calling RL、LLM serving kernel 的关键基础材料。
