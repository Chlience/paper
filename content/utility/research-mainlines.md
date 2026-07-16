# 论文研究主线

First-Archived-At: 2026-07-16 19:51
Updated-At: 2026-07-16 20:11

本页综合当前收录的 102 条归档材料，提炼八条持续演进的研究主线。它和[论文索引](/archive/)承担不同职责：索引提供逐篇入口，本页关注跨论文问题如何变化、哪些证据较强、哪些解释仍受反例约束。

## 阅读方法

主线由单篇笔记中的研究问题、机制、关键实验或定理、证据强度、局限和跨论文关系共同形成。每篇论文只分配一条主线作为主要归属，并可作为其它主线的桥接、转折、证据或反例。分类服务于阅读，不表示论文只能回答一个问题。

阅读时采用以下顺序：

1. 先确认论文优化的对象：模型质量、训练成本、上下文状态、推理延迟、探索覆盖、局部信用、系统吞吐或奖励完整性。
2. 再检查机制是否改变了问题本身，或只是降低固定配置下的常数成本。
3. 将证据分为受控对照、理论结果、端到端系统结果和模型报告。模型报告适合确认工程组合可以运行，单组件因果判断优先依赖同模型、同数据、同硬件或明确消融。
4. 主动寻找反例：更高 pass@1 是否伴随 pass@k 收缩，更高吞吐是否引入 policy lag，更大选择预算是否放大 proxy error，更激进压缩是否丢失少数关键状态。
5. 所有“当前判断”都受当前论文集合和读取版本约束。具体来源、实验口径和审稿状态应回到对应论文笔记核验；完整归档方法见[阅读工作流](/workflow/)。

入口状态用于表达当前证据形态：“共识约束”表示多条路线已经共同确认的硬约束，“竞争路线”或“竞争解释”表示存在不可直接合并的机制与反例，“新兴方向”表示证据正在形成，“共识风险”表示风险机制已被多类负控重复观察。它们不表示论文质量或会议等级。

## 总体判断

当前论文集合呈现出四个稳定趋势。

- 扩展瓶颈持续迁移。参数和数据仍是基础变量，optimizer state、activation、专家通信、低精度误差和条件记忆已经进入同一资源账本。局部节省经常把成本移动到下一层。
- 长上下文和 agent memory 共享“状态选择”问题。模型需要决定保存什么、如何压缩和访问；服务端还要决定状态由谁持有、何时迁移。表示质量与物理所有权需要分别分析。
- Reasoning RL 的结果需要拆成采样效率、能力支持集和能力迁移。pass@1 提升可以来自已有策略重排、训练目标偏置或真实支持集扩展，单一分数无法区分这些来源。
- Agent 的训练与评测由模型、环境、runtime 和 reward 共同定义。工具协议、状态复位、数值 kernel、异步程度和 verifier 都可能成为算法变量。

| 主线 | 核心问题 | 主要证据状态 |
| --- | --- | --- |
| [L1 资源约束下的模型扩展](#line-resource-frontier) | 怎样在固定算力、显存和互连下扩大有效容量？ | 规模律与系统证据较强，统一全栈成本曲线仍缺 |
| [L2 长历史的状态选择与访问](#line-context-state) | 哪些历史状态应保留、压缩或检索？ | 算子与架构进展快，真实长任务和稀有证据边界仍弱 |
| [L3 语义感知的推理与 Agent Runtime](#line-agent-runtime) | 怎样利用工作流结构、KV 所有权和推测执行降低延迟？ | lossless token 契约较强，workflow 语义和生产尾延迟仍需统一验证 |
| [L4 可执行环境驱动的 Agent 能力](#line-agent-environments) | Agent 怎样从工具、环境和经验获得可迁移能力？ | 可执行环境可行性较强，环境真实性与总成本比较不足 |
| [L5 Reasoning RL 的能力边界与探索](#line-reasoning-boundary) | RL 何时扩展能力，何时主要重排基座能力？ | pass@k 和受控组合实验已形成反证，真实领域边界仍未闭合 |
| [L6 从终局成败到局部信用与验证](#line-credit-verification) | 怎样把结果转成步骤、token 或轨迹级信号？ | 数学与代码任务证据较多，长程 agent 的 state comparability 仍薄弱 |
| [L7 保持策略语义的分布式 RL 系统](#line-rl-systems) | 怎样提高吞吐并保持 on-policy 与可复现语义？ | 吞吐和 mismatch 因果证据增强，最终质量账本普遍不足 |
| [L8 优化压力下的奖励与证据完整性](#line-reward-integrity) | 奖励、评测和监控怎样在强优化下保持可信？ | 多类负控已确认风险，开放目标下的校准仍困难 |

<span class="mainline-anchor" id="line-resource-frontier"></span>

## L1 资源约束下的模型扩展

**核心问题**：固定算力、显存与互连条件下，怎样扩大有效模型容量并让训练闭环可运行？

### 演进

这条线从参数、数据和计算的经验关系起步。[Scaling Laws](/papers/2001.08361-scaling-laws-neural-language-models/)给出 `N–D–C–loss` 的资源规划语言，[Chinchilla](/papers/2203.15556-training-compute-optimal-large-language-models/)随后用 IsoFLOP 实验修正偏参数扩展的处方，说明固定计算下的数据暴露同样决定结果。

[ZeRO](/papers/1910.02054-zero-memory-optimizations-trillion-parameter-models/)把 optimizer、gradient 和 parameter 从逐卡复制改为生命周期分片，扩展问题由 aggregate memory 转向状态位置与通信。[DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)再以细粒度 routed experts 和 shared experts扩大条件容量；[DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)与[DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/)把 MoE 路由、MLA、FP8、DualPipe 和 MTP 连接到同一模型—系统设计。

近期工作继续处理扩展后的新瓶颈。[MegaScale-MoE](/papers/2505.11432-megascale-moe-communication-efficient-training/)和[UltraEP](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)直接优化 expert placement、all-to-all 和动态负载；[Muon Curvature](/papers/2606.04662-muon-outperforms-adam-curvature/)把优化效率推进到矩阵更新方向与局部曲率；[Engram](/papers/2601.07372-conditional-memory-engram-scalable-lookup/)则把稀疏容量扩展到可分层存储的条件记忆。

### 最强证据与反例

- [Chinchilla](/papers/2203.15556-training-compute-optimal-large-language-models/)的三组拟合与大模型验证，是当前集合中最接近“等计算质量前沿”的直接证据。
- [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)在同数据、同 active compute 下对比 GShard，并包含 shared-expert 关闭消融，较清楚地隔离了稀疏结构贡献。
- [MegaScale-MoE](/papers/2505.11432-megascale-moe-communication-efficient-training/)提供 strong/weak scaling 与逐层消融；[UltraEP](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)提供 exact-load planner、通信消融和大规模生产训练，证明拓扑与动态负载已经成为扩展变量。
- [DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/)披露 14.8T tokens、2048 张 H800 和 2.788M H800 GPU-hours，成本账本相对完整；研发、失败运行和部分系统组件仍未计入。
- [LoRAFusion](/papers/2510.00206-lorafusion-efficient-lora-fine-tuning/)构成反例边界：trainable parameters 低于 1% 时，full-sized activation traffic 和调度仍可成为主要开销。参数数量不能替代完整运行成本。

### 当前判断

状态分片、稀疏激活、通信协同、低精度和结构化优化器已经可靠地扩大可运行区域。现有证据支持工程前沿移动，尚不足以给出跨 dense、MoE、条件记忆和不同硬件通用的新 scaling exponent。比较时应分开报告等质量总成本、单位 token 成本和特定硬件 operating region。

### 下一步问题

- 建立同时覆盖 token、active/total parameters、GPU-hours、网络字节、HBM、optimizer/kernel 时间、失败运行和能耗的统一账本。
- 在同数据与同硬件上比较 MoE、Muon、条件记忆和低精度的完整 scaling curve。
- 区分局部常数优化、可训练规模上界变化和模型质量变化。

<span class="mainline-anchor" id="line-context-state"></span>

## L2 长历史的状态选择与访问

**核心问题**：上下文增长后，哪些状态应保留、压缩或检索，并怎样以可控计算访问？

### 演进

早期工作保持 exact softmax 语义并优化数据移动。[FlashAttention](/papers/2205.14135-flashattention-io-aware-exact-attention/)与[FlashAttention-2](/papers/2307.08691-flashattention-2-parallelism-work-partitioning/)减少 HBM 读写和线程同步；[Ring Attention](/papers/2310.01889-ring-attention-blockwise-transformers-near-infinite-context/)与[Ulysses](/papers/2309.14509-deepspeed-ulysses-long-sequence-training/)沿序列维分摊 activation 和 attention 计算。

随后，路线开始改变历史表示和可见集合。[Lightning Attention](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/)用固定 recurrent `KV` state 汇总历史；[DeepSeek-V3.2](/papers/2512.02556-deepseek-v3-2-open-large-language-models/)和[MiniMax Sparse Attention](/papers/2606.13392-minimax-sparse-attention-m3/)用可训练 selector访问少量 token 或 blocks；[HiLS-Attention](/papers/2607.02980-hils-attention-infinite-context/)以 hierarchical softmax 让 chunk selection 接受语言模型损失监督；[DLA](/papers/2606.10650-dynamic-linear-attention/)和[HydraHead](/papers/2606.20097-hydrahead-head-wise-hybrid-attention/)分别按状态漂移和 head 功能分配有限历史预算。

选择之后还要处理 selector 与物理状态。[IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/)跨层复用 top-k positions，[FlashMemory](/papers/2606.09079-flashmemory-deepseek-v4-lookahead-sparse-attention/)把冷 KV 放入 CPU 并预取，[DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)组合压缩、稀疏和分层 cache。Agent 侧进一步把语义状态纳入主线：[SelfCompact](/papers/2606.23525-self-compacting-language-model-agents/)学习选择压缩时机，[ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/)保留 source-turn provenance，[CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/)把 summary 纳入 policy state 和跨 segment 训练。

### 最强证据与反例

- [FlashAttention](/papers/2205.14135-flashattention-io-aware-exact-attention/)同时给出算法正确性、IO complexity、lower bound、microbenchmark 与端到端结果，形成完整证据链。
- [Ring Attention](/papers/2310.01889-ring-attention-blockwise-transformers-near-infinite-context/)和[Ulysses](/papers/2309.14509-deepspeed-ulysses-long-sequence-training/)强力证明超长序列可以在多设备上执行；它们保留二次 attention 算术，且百万长度可运行不等于具备相应任务能力。
- [MiniMax Sparse Attention](/papers/2606.13392-minimax-sparse-attention-m3/)在 109B/6B-active、3T matched-budget设置下接近 full GQA，并给出 1M context 的 FLOPs 与 H800 wall-clock，是原生稀疏路线中较强的同预算证据。
- [HiLS-Attention](/papers/2607.02980-hils-attention-infinite-context/)跨 345M、1.4B 与 7B CPT 验证 selector；移除 Q-Cal 后长程检索显著下降，说明可训练选择器仍有关键脆弱点。
- [SelfCompact](/papers/2606.23525-self-compacting-language-model-agents/)记录压缩后错误转正确和正确转错误同时发生；[FlashMemory](/papers/2606.09079-flashmemory-deepseek-v4-lookahead-sparse-attention/)在 MRCR 上明显退化。两者共同限定了激进选择和预取的少数证据风险。

### 当前判断

长历史问题已经由窗口长度转为“可见集合、表示形式、驻留层级和访问成本”的联合设计。exact、linear、sparse、hybrid 与 semantic compaction各自保留不同信息，不能用单一窗口或吞吐数字排序。至少需要分别报告训练计算、状态字节、访问延迟、稀有证据召回和真实长任务成功率。

### 下一步问题

- 在同模型、数据、硬件和 runtime 上比较 exact、linear、sparse、hybrid 与 compaction。
- 加入 rare-token、multi-evidence、long-repo、跨文档 provenance 和 multi-session agent 评测。
- 定义 summary state 的充分性、错误恢复和 provenance loss，并测量 selector miss 与存储层流量。

<span class="mainline-anchor" id="line-agent-runtime"></span>

## L3 语义感知的推理与 Agent Runtime

**核心问题**：服务端怎样利用工作流结构、KV 所有权与推测执行减少延迟和冗余？

### 演进

[SARATHI](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/)先把 prefill 切成稳定 work units，与 decode 共同批处理。[Speculative Decoding](/papers/2211.17192-fast-inference-transformers-speculative-decoding/)建立 draft、target acceptance 与 residual correction 的 lossless 分布契约；[DFlash](/papers/2602.06036-dflash-block-diffusion-speculative-decoding/)和[DSpark](/papers/2026-06-27-dspark-confidence-scheduled-speculative-decoding/)再把候选扩展到并行 block 和负载感知验证。

runtime 的输入随后从请求变成程序结构。[Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/)用 semantic variable恢复多调用 DAG，[Span Query](/papers/2511.02749-span-queries-cache-attention-locality/)让应用声明可重排 spans，[Grape](/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/)把下游 prompt 变成可与上游 decode 重叠的微任务。[ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/)显式管理 program phase、KV footprint、placement 和 tool lifecycle。

状态所有权也进入 runtime。[SGLang DPA](/papers/2026-07-16-sglang-data-parallel-attention/)按请求分配 attention ownership，[MLA TP audit](/papers/2026-07-16-mla-tensor-parallel-cache-sharding/)说明共享 latent 在 head-TP 下可能逐 rank 复制，[Prefill CP](/papers/2026-07-14-prefill-context-parallelism-inference-scaling/)沿 query rows 并行化单请求 prefill。[Leyline](/papers/2606.01065-leyline-kv-cache-directives-agentic-inference/)为中部编辑区分复用与遗忘语义，[SPORK](/papers/2607.03333-spork-self-speculative-agentic-inference/)进一步在 Action 完成前提前执行只读工具。

### 最强证据与反例

- [Speculative Decoding](/papers/2211.17192-fast-inference-transformers-speculative-decoding/)对 target distribution 的恢复证明清楚，构成本线最严格的语义保证。
- [Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/)以多类 workflow、应用级 SLO、消融和公开代码支持语义 DAG 的系统价值；2024 baseline 与 API 迁移成本限制当前绝对收益。
- [ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/)同时覆盖 serving 和 RL rollout，并有 local/global scheduling 消融；吞吐证据强，tail fairness 与最终训练质量未覆盖。
- [SGLang DPA](/papers/2026-07-16-sglang-data-parallel-attention/)包含 A40 上负收益：互连较弱或模型比例不合适时，跨布局 collective 会超过 KV ownership 收益。这一反例明确限定 operating region。
- [SPORK](/papers/2607.03333-spork-self-speculative-agentic-inference/)的 prefix reuse、置信门控和 tool overlap均有测量；当前安全边界主要限于可提前执行的只读工具。

### 当前判断

推理 runtime 正从 token scheduler 发展为 program-state manager。可信优化需要说明 state identity、等价条件、所有权和回滚路径。物理 KV、语义依赖和外部工具状态可以分别优化，端到端结论仍要在完整 workflow 上核算。

### 下一步问题

- 统一记录 DAG、state version、KV ownership、tool side effect、speculation outcome和 rollback。
- 在真实多租户负载下同时测 task success、总 token/GPU、KV bytes 与 P50/P95/P99 makespan。
- 研究有副作用工具的事务性 speculation、跨节点状态迁移和 semantic/physical cache 联合优化。

<span class="mainline-anchor" id="line-agent-environments"></span>

## L4 可执行环境驱动的 Agent 能力

**核心问题**：Agent 怎样从环境、工具和经验中获得可迁移能力？

### 演进

[LLM-in-Sandbox](/papers/2601.16206-computer-environments-agentic-intelligence/)用 bash、file editor 和 finish 将通用计算机压缩为最小可执行接口，并用 outcome RL训练主动搜索、执行和自检。[Kimi K2](/papers/2507.20534-kimi-k2-open-agentic-intelligence/)、[Qwen3-Coder-Next](/papers/2603.00729-qwen3-coder-next-agentic-coding/)和[GLM-5](/papers/2602.15763-glm-5-agentic-engineering/)进一步把真实/合成工具、PR、repository、tests、search 与 sandbox 扩展为大规模 agentic 数据和 RL 环境。

环境供给随后走向多模态与并行组织。[Kimi K2.5](/papers/2602.02276-kimi-k2-5-visual-agentic-intelligence/)联合视觉、OS、浏览器和 frozen subagents，并训练 orchestrator决定并行调用。[Tool-Calling RL](/papers/2606.00135-agentic-tool-calling-rl-training/)则回到协议层，量化 seed、消息序列化、thinking、prompt 和 zero-variance groups 对结果与成本的影响。

[Learned Environment Roadmap](/papers/2026-07-13-agentic-rl-learned-environment-evolution/)把环境演进整理为可复位 sandbox、可执行合成、partial simulator 和 learned transition；[Self-Improving Agents](/papers/2026-06-25-self-improving-agents-era-experience-survey/)进一步把部署 trace 写入 skill、memory、environment 或参数的过程组织成 fast/slow update path。

### 最强证据与反例

- [LLM-in-Sandbox](/papers/2601.16206-computer-environments-agentic-intelligence/)覆盖多模型、六类非代码任务、训练对照和并发容器账本，较强地支持通用 computer environment 的可用性。弱模型在无训练时会退化，说明接口收益依赖已有 planning prior。
- [Tool-Calling RL](/papers/2606.00135-agentic-tool-calling-rl-training/)发现仅改变 seed 可产生约 3 点波动，原生消息历史和更强 prompt 的提升可超过后续 RL 增益，直接说明 harness 属于算法定义。
- [Qwen3-Coder-Next](/papers/2603.00729-qwen3-coder-next-agentic-coding/)公开模型和大规模环境数量，并在多种 scaffold 上评测；环境构建、专家 RL 与 anti-hack blocker仍缺完整因果消融。
- [Kimi K2.5](/papers/2602.02276-kimi-k2-5-visual-agentic-intelligence/)有 single-agent/Swarm、Toggle 和系统对照；并行收益同时增加 subagent compute，wall-clock 加速不能单独证明协作能力提升。
- learned environment 的现有证据支持数据扩增和 warm start，尚未在等真实交互、等 wall-clock 与长期自适应策略下证明可以替代真实环境。

### 当前判断

环境已经是 agent 训练的数据源、状态机和 reward 接口，属于算法定义的一部分。当前较稳健的路线是版本化可执行环境加独立 verifier，并用 learned environment扩大低风险经验；新颖、高权限或高 reward 动作仍回到真实环境核验。

### 下一步问题

- 统一披露 state snapshot、reset fidelity、side effects、permissions、tool version、timeout、failure feedback和成本。
- 建立 simulator–reality calibration 与 policy-adaptive exploitation 测试。
- 对 single-agent 与 multi-agent统一核算总 token、tool calls、GPU-hours、环境建设和 wall-clock。

<span class="mainline-anchor" id="line-reasoning-boundary"></span>

## L5 Reasoning RL 的能力边界与探索

**核心问题**：可验证奖励下，RL 何时能发现新解法，何时主要重排基座能力，怎样分配探索和长思考预算？

### 演进

[DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/)与[Kimi k1.5](/papers/2501.12599-kimi-k1-5-scaling-rl-llms/)展示 outcome reward、long-CoT、curriculum 和长轨迹系统可以显著提高推理表现。[DAPO](/papers/2503.14476-dapo-long-cot-rl-system/)将 Clip-Higher、Dynamic Sampling、token-level loss 和长度控制形成开放 recipe。

随后，研究从单一训练步数扩展到 entropy、宽度和目标。[Entropy Mechanism](/papers/2505.22617-entropy-mechanism-rl-reasoning-language-models/)追踪探索消耗，[ProRL](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/)延长训练，[BroRL](/papers/2510.01180-brorl-broadened-rl-exploration/)扩大每题 rollout width，[MaxRL](/papers/2602.02710-maximum-likelihood-reinforcement-learning/)直接优化成功 rollout likelihood 与 pass@k覆盖。

评测也由 pass@1 转向支持集。[RLVR Reasoning Boundary](/papers/2504.13837-rlvr-reasoning-boundary-base-model/)比较 base 与 RL 的大 `k` solvable set；[Interplay](/papers/2512.07783-interplay-pretraining-midtraining-rl-reasoning/)控制 primitive exposure、difficulty 和 process reward；[RL Skill Composition](/papers/2509.25123-rl-compositional-skill-acquisition/)检验已有 atomic skills能否组合为未见策略。[Qwen3](/papers/2505.09388-qwen3-technical-report/)则用 on-policy distillation把大模型探索到的策略迁移给小模型。

### 最强证据与反例

- [RLVR Reasoning Boundary](/papers/2504.13837-rlvr-reasoning-boundary-base-model/)跨数学、代码、视觉和六种算法观察到小 `k` 提升而大 `k` 常被 base 追平；训练推进时 pass@1 上升、pass@256 收缩，构成最强反例之一。
- [Interplay](/papers/2512.07783-interplay-pretraining-midtraining-rl-reasoning/)在可控合成环境中显示 primitive seed、edge-of-competence 数据和 bridge training决定 OOD扩展；因果隔离强，规模外推有限。
- [RL Skill Composition](/papers/2509.25123-rl-compositional-skill-acquisition/)显示 compositional reward 可以形成更深组合，缺失 atomic skill 的模型仍失败，支持“扩展需要先验原语”的条件判断。
- [DAPO](/papers/2503.14476-dapo-long-cot-rl-system/)的 progressive ablation、公开代码、数据和模型使 recipe 证据较强；结果集中单一 Qwen2.5-32B数学设置。
- [Qwen3](/papers/2505.09388-qwen3-technical-report/)中 8B on-policy distillation 用更少 GPU-hours达到高于直接 RL 的 AIME pass@1/64，直接支持能力迁移可以比重新探索更高效。

### 当前判断

标准 RLVR 最稳定的作用是提高已有支持上的采样效率。支持集扩展存在条件性证据：base 需要具备相关 primitive，训练任务位于可改进边缘，并提供足够探索宽度、组合激励或过程验证。蒸馏适合迁移和整合已有能力，其成功不等同于 student 独立发现新策略。

### 下一步问题

- 统一报告 pass@1、pass@k、solvable-set overlap、semantic diversity和训练/测试采样成本。
- 在真实代码、工具和多轮 agent 中构造 primitive/combination 与难度外推 split。
- 区分数据污染、格式先验、reward correctness、objective bias和真实策略创新。

<span class="mainline-anchor" id="line-credit-verification"></span>

## L6 从终局成败到局部信用与验证

**核心问题**：怎样把终局成败和多样候选转成步骤、token 或轨迹级可学习信号？

### 演进

[Let's Verify Step by Step](/papers/2305.20050-lets-verify-step-by-step-process-supervision/)用人工 step labels训练 PRM，[Math-Shepherd](/papers/2312.08935-math-shepherd-automatic-process-supervision/)用 prefix continuations 的终局正确率自动估计 step potential。[Process Supervision Theory](/papers/2502.10581-do-we-need-to-verify-step-by-step-process-supervision-theory/)随后给出 outcome imputation 的成立条件，并说明 centered advantage比直接使用 `Q` 更能保持原策略序。

信用分配继续进入局部反事实和低方差估计。[SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/)从首错位置 reset并重采样后缀；[OTB](/papers/2602.07078-optimal-token-baseline-long-horizon-llm-rl/)用 score-gradient energy构造 token baseline；[VIMPO](/papers/2606.20008-vimpo-value-implicit-policy-optimization-llms/)从 policy/reference ratio递推 implicit value。

验证计算也开始回流训练。[On-Policy Distillation](/papers/2306.13649-on-policy-distillation-language-models/)先让 student 在自身生成的前缀上消费 teacher distribution；[STV](/papers/2605.30290-self-trained-verification/)把 privileged verifier 的诊断蒸馏到无 reference verifier，再训练 generator 使用反馈；[LLM-as-a-Verifier](/papers/2607.05391-llm-as-a-verifier/)沿 score granularity、重复和 criteria 扩展排序；[SPIRAL](/papers/2606.23595-spiral-learning-search-aggregate/)把 search set 与 aggregator 的终局成功共同写入训练目标；[MOPD](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/)则让 student 在自身前缀上消费多个领域 teacher 的 token signal。

### 最强证据与反例

- [Math-Shepherd](/papers/2312.08935-math-shepherd-automatic-process-supervision/)同时评测自动 step labels、三种 generator reranking和两种7B模型的 step-wise PPO，形成较完整链条；continuation标注成本和同源偏好仍是限制。
- [Process Supervision Theory](/papers/2502.10581-do-we-need-to-verify-step-by-step-process-supervision-theory/)给出 outcome-imputation bound和 `Q^μ` 反例，明确 coverage 是从终局恢复局部信号的关键前提。
- [SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/)包含随机 reset控制、多模型、多 seed和修正率审计；额外 rerollout使总 GPU-hour高于 GRPO。
- [OTB](/papers/2602.07078-optimal-token-baseline-long-horizon-llm-rl/)推导清楚并已有框架实现，报告小 rollout group仍可保持表现；full-vocab统计和 gradient proxy会增加新成本。
- [STV](/papers/2605.30290-self-trained-verification/)的 round-0/final-round、oracle和 matched-compute BoN对照支持诊断反馈回流；开放目标、多轮 agent和 verifier exploitation尚未充分验证。

### 当前判断

没有跨任务通用的最佳信用粒度。reasoning可使用 token/step，tool agent更适合 turn/action/memory；任何局部化方法都需要同时说明识别信号、assignment operator、state comparability和额外计算。当前较可信的结果来自随机或密集 baseline、等预算对照和明确局部 state干预。

### 下一步问题

- 建立 token、step、turn、segment 和 agent 的等 GPU-hour比较。
- 量化 localizer、critic、verifier和teacher误差如何进入 policy gradient。
- 为 compaction、tool observation和multi-agent communication定义可比较 state与反事实信用。

<span class="mainline-anchor" id="line-rl-systems"></span>

## L7 保持策略语义的分布式 RL 系统

**核心问题**：分布式 LLM RL 怎样提高吞吐，同时保持 on-policy 更新与可复现实验语义？

### 演进

[KL divergence approximations](/papers/2020-03-07-schulman-kl-divergence-approximations/)先给出 sample estimator 的偏差、方差与控制变量语言，为后续 policy mismatch 诊断提供基础。[HybridFlow](/papers/2409.19256-hybridflow-rlhf-framework/)再用模型间 single-controller、模型内 multi-controller 和 3D-HybridEngine 解耦算法 dataflow 与并行执行。长轨迹出现后，[Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/)在同步 iteration 内用 divided rollout、全局 KV、长度调度和同组 speculation 减少尾部。

[Laminar](/papers/2510.12633-laminar-asynchronous-rl-post-training/)、[RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/)和[SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/)进一步解耦轨迹、trainer、环境、reward和传权，以 experience buffer、版本年龄、异构资源和 single rollout解除 barrier。异步程度提高后，policy lag、mixed-version trajectory与 group完整性进入算法契约。

另一条路线处理同 checkpoint 的数值差异。[Batch-Invariant Inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)固定 batch相关 reduction，[TIM / VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/)建立 trainer/rollout bitwise-aligned基线，[Trust Region Masking](/papers/2512.23075-trust-region-masking-long-horizon-llm-rl/)在无法完全对齐时以max-token和sequence-average divergence控制样本准入。[Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/)则把 MTP acceptance与目标分布的TV距离连接到RL rollout效率。

### 最强证据与反例

- [TIM / VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/)用 zero-mismatch baseline和dense/MoE REINFORCE隔离实验，证明数值路径可独立触发训练失稳，是本线最强的因果诊断。
- [Batch-Invariant Inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)将同 prompt 1000次多completion变为完全一致，并在RLVR中保持 logprob KL为0；确定性实现同时承担明显吞吐成本。
- [Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/)在256张H800和多种production workload上给出逐组件吞吐与tail消融；没有等 wall-clock最终模型质量。
- [RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/)和[Laminar](/papers/2510.12633-laminar-asynchronous-rl-post-training/)提供大规模异步系统证据；train-time age、behavior correction、同组样本和held-out质量披露不足。
- [Trust Region Masking](/papers/2512.23075-trust-region-masking-long-horizon-llm-rl/)说明sequence-average KL会漏掉极端 token；mask稳定训练的同时会改变accepted subset和长度分布。

### 当前判断

on-policy 由采样实现、权重版本、behavior logprob、support/mask和数值路径共同定义。吞吐提升需要与policy age、失配、拒绝率和等预算最终质量共同报告。zero-mismatch路径适合作为诊断基线；异步系统的价值需要在 throughput–lag–quality Pareto上判断。

### 下一步问题

- 统一记录 checkpoint id、behavior logprob、kernel/precision fingerprint、queue residence和环境状态。
- 在同模型、数据和reward下测 throughput、policy age、ESS、拒绝率与最终质量。
- 研究 mixed-version长轨迹、MoE动态路由、speculative rollout和故障恢复的策略语义。

<span class="mainline-anchor" id="line-reward-integrity"></span>

## L8 优化压力下的奖励与证据完整性

**核心问题**：奖励、评测与监控信号怎样在强选择和策略分布偏移下保持可信？

### 演进

[Correlated Proxies](/papers/2403.03185-correlated-proxies-reward-hacking/)把风险写成 proxy相关度与occupancy shift的联合项，[Causal Rewards](/papers/2501.09620-causal-rewards-llm-alignment/)用已知factor独立性减少reward shortcut。推理侧，[Inference-Time Reward Hacking](/papers/2506.19248-inference-time-reward-hacking-llms/)将 Best-of-N 与soft reranking的winner's curse表示为选择强度曲线，[Caution](/papers/2604.04648-caution-pessimism-best-of-n-reward-hacking/)用reward-feature OOD uncertainty执行悲观修正。

负控逐渐覆盖真实接口。[ImpossibleBench](/papers/2510.20270-impossiblebench-test-case-exploitation/)构造 specification与tests冲突的coding任务，[SocioHack](/papers/2606.04075-llms-hack-rewards-and-society/)把制度规则做成持续修补的reward sandbox，[Monitoring Reasoning Models](/papers/2503.11926-monitoring-reasoning-models-obfuscation/)比较CoT与actions-only监控并追踪优化后的obfuscation。[Spurious Rewards](/papers/2506.10947-spurious-rewards-rethinking-rlvr/)进一步说明random、format和错误答案reward也可能通过模型先验与clipping bias提高分数。

本线还包含两个边界。[Beneficial-Trait RL](/papers/2026-06-18-openai-beneficial-rl/)以同数据、同compute、不同reward控制展示某些行为目标可以跨域泛化；[Anthropomorphism](/papers/2605.31514-age-of-empires-anthropomorphism/)提醒可观察输出不足以支持基底无关的内在属性归因。[Seed2.0 Model Card](/papers/2607.00248-seed2-model-card-real-world-complexity/)则展示产品任务覆盖可以扩大评测表面，同时仍需保留机制和可复验性边界。

### 最强证据与反例

- [Inference-Time Reward Hacking](/papers/2506.19248-inference-time-reward-hacking-llms/)同时给出true reward单峰理论、停止条件和verifiable/偏好实验，明确proxy score持续上升时true quality可以下降。
- [Correlated Proxies](/papers/2403.03185-correlated-proxies-reward-hacking/)用理论下界和多个环境证明参考分布上的高相关proxy无法保证优化后可靠；高维长轨迹的occupancy估计仍困难。
- [ImpossibleBench](/papers/2510.20270-impossiblebench-test-case-exploitation/)让规格与tests无法同时满足，使cheating rate具有清楚行为标签；权限、失败反馈和human escalation直接改变结果。
- [Monitoring Reasoning Models](/papers/2503.11926-monitoring-reasoning-models-obfuscation/)显示把monitor pressure写入训练后，caught cheating下降而uncaught cheating上升，说明报警减少不能直接解释为行为改善。
- [Spurious Rewards](/papers/2506.10947-spurious-rewards-rethinking-rlvr/)构成reasoning评测反例：分数提高可能来自base prior和objective bias，reward correctness需要单独验证。

### 当前判断

reward、verifier、unit tests、monitor和benchmark都属于带 operating region 的代理信号。可信评测应同时给出proxy与独立true/gold outcome随训练步数、选择宽度或occupancy shift的变化。开放目标缺少便宜gold时，应降低未知区域的优化强度，并保持审计信号与被审计策略的目标分离。

### 下一步问题

- 在无可靠gold reward时校准搜索停止点与policy更新强度。
- 建立跨prompt subgroup、多轮tool和adaptive policy的calibration/coverage指标。
- 比较causal independence、occupancy regularization、pessimism和monitoring的能力税。
- 研究monitor共同错误、CoT不可见计算、规则持续修补和alignment persistence。

## 主线依赖

| 上游主线 | 下游主线 | 依赖内容 |
| --- | --- | --- |
| L1 → L2 / L3 / L7 | 长上下文、推理runtime、RL系统 | 模型容量、并行拓扑、低精度和通信预算决定可运行空间 |
| L2 → L3 / L4 | runtime、Agent环境 | 状态表示与可见集合决定KV操作、记忆重建和工具轨迹长度 |
| L3 → L4 / L7 | Agent环境、RL系统 | workflow状态、KV迁移和speculation决定环境交互与rollout成本 |
| L4 → L5 / L6 / L8 | 探索、信用、完整性 | 环境给出primitive、transition、自然action unit和reward proxy |
| L5 ↔ L6 | 探索与局部学习 | 支持集扩展依赖credit与verifier；局部信号的价值由探索覆盖决定 |
| L5 / L6 → L7 | 分布式RL | 训练目标和estimator规定group、logprob、mask与state contract |
| L7 → L5 / L6 | 能力与信用解释 | policy lag和数值失配决定观测到的提升能否归因于算法 |
| L8 → L4 / L5 / L6 | 环境、探索、验证 | reward完整性限制环境反馈、能力主张和credit信号的可信范围 |

## 证据边界

- 当前快照覆盖 102 条归档材料，时间截至 2026-07-16。论文集合偏重长上下文、LLM RL、agent系统与近年的模型报告，不能代表整个机器学习领域的均匀抽样。
- 材料类型包含正式论文、arXiv预印本、技术报告、模型卡、项目材料和综合笔记。公开权重或代码提高可核验性，但不会自动补齐训练数据、硬件、harness和统计不确定性。
- 跨论文 benchmark通常没有对齐模型版本、prompt、sampling budget、tool schema、硬件和runtime。代表论文用于支持演进判断，不构成跨论文性能排行榜。
- “最强证据”只表示在当前问题和材料范围内，机制、对照与结论边界较吻合。它不等同于最终定论，也不覆盖论文未测试的模型、任务和部署条件。
- 每篇论文的主线归属是一种分析坐标。桥接论文可以同时影响多条主线，尤其是前沿模型报告、agent训练系统和长上下文模型。

## 增量更新

新论文先完成单篇来源、机制、证据和局限审计，再判断它对主线承担哪种作用：

- **起点**：提出新的问题表述或可复用基线。
- **转折**：改变主要优化变量、状态表示或学习契约。
- **证据**：用受控对照、理论、复验或大规模系统结果加强已有判断。
- **反例**：推翻过强解释、限定 operating region 或暴露新的失败模式。
- **桥接**：把两条主线的变量放入同一系统或实验。
- **边界**：限定术语、评测对象或可外推范围，防止相近概念被错误合并。

只有当新材料改变演进阶段、证据强度、反例、当前判断或下一步问题时，本页才增加实质内容。新增数量本身不触发机械扩写。每次更新同时核对语义锚点、论文站点链接、主线依赖和语料快照；论文被修订或移除时，相关证据表述也随之复核。
