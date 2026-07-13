# Paper Archive Index

First-Archived-At: 2026-06-21
Updated-At: 2026-07-13

## 本地工作流

- 目录规则：`AGENTS.md`
- 内容目录：论文笔记 `content/papers/`；公开索引和模板 `content/utility/`；作者数据 `data/authors.json`；内部 SOP `internal/`
- 论文分析 SOP：[paper-analysis-workflow.md](/workflow/)
- 论文笔记模板：[paper-note-template.md](/template/)

## 当前收录

| 简称 | 时间 | 核心信号 |
| --- | --- | --- |
| [Gemma 4](/papers/2607.02770-gemma-4-technical-report/) | 2026年7月 | 把 dense / MoE、thinking、长上下文、QAT、MTP drafter 与 encoder-free multimodality 组合进开放模型族。 |
| [HiLS-Attention](/papers/2607.02980-hils-attention-infinite-context/) | 2026年7月 | 用 hierarchical softmax 分配 chunk mass，再在选中 chunk 内做 token attention，实现可训练的长上下文稀疏注意力。 |
| [SPORK](/papers/2607.03333-spork-self-speculative-agentic-inference/) | 2026年7月 | 让目标模型从共享 KV prefix 自预测下一次工具调用，提前执行只读工具，并用 target verification 回收失败 probe 的 token 前缀。 |
| [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/) | 2026年7月 | 把同一策略生成的 context summary 纳入 PPO，用全 batch token 归一化和跨 segment GAE 在固定峰值上下文内训练长程 coding agent。 |
| [LLM-as-a-Verifier](/papers/2607.05391-llm-as-a-verifier/) | 2026年7月 | 把评分 token 的概率期望、重复评估与 criteria decomposition 组合成连续 verifier，再用概率 pivot tournament 扩展多轨迹选择。 |
| [SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/) | 2026年7月 | 用每 prompt 单 rollout、强化 critic 与双侧 token mask 替代异步 GRPO 的组内等待和 group baseline。 |
| [Grape](/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/) | 2026年7月 | 把相依 LLM task 的静态 prompt、流式上游输出和 decode 拆成微任务，用跨 task 增量 prefill、SLO 约束调度与关键路径 KV 抢占控制尾延迟。 |
| [RL Credit Assignment Watch](/papers/2026-07-13-rl-credit-assignment-may-july-landscape/) | 2026年7月 | 按 token、segment、turn、memory 和 workflow role 归纳 2026 年 5-7 月方法，并把 compact 后的 state comparability 与 provenance routing 作为独立判断轴。 |
| [Learned Environment Roadmap](/papers/2026-07-13-agentic-rl-learned-environment-evolution/) | 2026年7月 | 把 Agentic RL 的环境供给串成从可复位 sandbox、有状态模拟、可执行环境合成到 language world model 的演进路线，并以 real-sim 校准闭环约束策略利用模拟误差。 |
| [国产模型报告时间线](/papers/2026-06-23-chinese-frontier-model-reports-timeline/) | 2026年6月 | 按 MoE / 长上下文、reasoning RL、agentic infrastructure 三条主线串联 2024-2026 年国产前沿模型演进。 |
| [Seed2.0](/papers/2607.00248-seed2-model-card-real-world-complexity/) | 2026年6月 | 用产品任务分布重构模型评测，将能力、成本与真实工作流案例放进同一模型卡。 |
| [ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/) | 2026年6月 | 把 selective memory / compact / context reconstruction 做成可训练 slot。 |
| [SPIRAL](/papers/2606.23595-spiral-learning-search-aggregate/) | 2026年6月 | 把 search traces、set construction、aggregation trace 放进同一个 RL 目标。 |
| [Self-Improving Agents](/papers/2026-06-25-self-improving-agents-era-experience-survey/) | 2026年6月 | 把 agent 自改进抽象为 trace-to-capability 流水线，覆盖 skills、memory、environment、model 与 meta-layer。 |
| [DSpark](/papers/2026-06-27-dspark-confidence-scheduled-speculative-decoding/) | 2026年6月 | 用 Markov head、置信度校准和硬件感知前缀调度，把并行 drafter 推进生产 serving。 |
| [MOPD](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/) | 2026年6月 | 让 student 在自身轨迹上接受多个领域 teacher 的 token-level reverse-KL 信号，整合 RL teacher 能力。 |
| [GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/) | 2026年6月 | 把 1M context、IndexShare / IndexCache 与 MTP speculative decoding 接入长程 coding agent。 |
| [slime](/papers/2026-06-17-slime-rl-scaling-framework/) | 2026年6月 | 把 Megatron training、SGLang rollout、Ray、custom reward 与异步权重同步接入同一 RL 后训练闭环。 |
| [DLA](/papers/2606.10650-dynamic-linear-attention/) | 2026年6月 | 用 representation drift 动态决定 state 边界，在固定 cache 内自适应合并 linear-attention states。 |
| [HydraHead](/papers/2606.20097-hydrahead-head-wise-hybrid-attention/) | 2026年6月 | 用 causal patching 找到 retrieval-critical heads，只为这些 heads 保留 full attention。 |
| [Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/) | 2026年6月 | 以 TV loss 训练 MTP heads，并用 probabilistic rejection sampling 提高 RL rollout 接受率。 |
| [verl](/papers/2026-06-16-verl-rl-optimization-algorithms/) | 2026年6月 | 把 RL objectives 与 rollout correction、fully async、distillation、MTP 等执行模块组织为可组合训练管线。 |
| [VIMPO](/papers/2606.20008-vimpo-value-implicit-policy-optimization-llms/) | 2026年6月 | 从 policy / reference log-ratio 构造隐式 value recurrence，省去独立 critic 并形成 token-level PPO advantage。 |
| [FlashMemory](/papers/2606.09079-flashmemory-deepseek-v4-lookahead-sparse-attention/) | 2026年6月 | 预测未来 token 的 KV chunk 需求，将冷 KV 移到 CPU 并按需预取，压缩物理 KV footprint。 |
| [MiniMax Sparse Attention](/papers/2606.13392-minimax-sparse-attention-m3/) | 2026年6月 | 用 group-aware index branch 选择 KV blocks，再对选中块执行精确 softmax attention。 |
| [Beneficial-Trait RL](/papers/2026-06-18-openai-beneficial-rl/) | 2026年6月 | 用少量 beneficial-trait RL data 强化诚实、纠错与风险意识，并测量跨域 alignment persistence。 |
| [Vortex](/papers/2606.06453-vortex-sparse-attention-serving/) | 2026年6月 | 用 vFlow / vTensor 把动态 sparse-attention selector 与 paged KV execution 编译到同一 SGLang decode 路径。 |
| [SocioHack](/papers/2606.04075-llms-hack-rewards-and-society/) | 2026年6月 | 把制度规则编码为 reward sandbox，验证 RL model 会发现形式合规但偏离制度意图的策略。 |
| [UltraEP](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/) | 2026年6月 | 基于 post-gating exact load 逐 microbatch / layer 规划 expert replica 与 token reroute，统一 MoE 训练和 prefill 负载均衡。 |
| [Muon Curvature](/papers/2606.04662-muon-outperforms-adam-curvature/) | 2026年6月 | 将 Muon 相对 Adam 的训练优势归因于更低的 directional curvature penalty，step-size 的解释力较弱。 |
| [SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/) | 2026年5月 | 从失败轨迹重置并重采样错误点后的 continuation，只更新后缀 token 以集中 credit assignment。 |
| [TIM / VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/) | 2026年5月 | 构造 trainer / rollout bitwise-aligned 基线，证明微小 logprob mismatch 可触发 RL collapse。 |
| [Tool-Calling RL](/papers/2606.00135-agentic-tool-calling-rl-training/) | 2026年5月 | 识别 tool-calling evaluation harness 的敏感性，并用 pre-rollout filtering 与 variance-aware downsampling 减少无效 RL compute。 |
| [Anthropomorphism](/papers/2605.31514-age-of-empires-anthropomorphism/) | 2026年5月 | 用 Age of Empires II 作为 substrate control，说明类人行为测试不足以支持类人内在属性归因。 |
| [STV](/papers/2605.30290-self-trained-verification/) | 2026年5月 | 把 reference solution 作为 verifier privileged signal，经 OPD + verdict RL 蒸馏到无 reference verifier，并用于训练与测试时自改进。 |
| [Credit Assignment Survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/) | 2026年4月 | 统一 reasoning 与 agentic RL 的 token / step / turn / trajectory credit-assignment 问题。 |
| [DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) | 2026年4月 | 以 CSA / HCA、MoE、MTP / OPD 和系统协同实现百万 token 训练、推理与 agent 能力。 |
| [Caution](/papers/2604.04648-caution-pessimism-best-of-n-reward-hacking/) | 2026年4月 | 用 reward-feature prediction error 估计 OOD uncertainty，在 Best-of-N selection 时执行 pessimistic correction。 |
| [DFlash](/papers/2602.06036-dflash-block-diffusion-speculative-decoding/) | 2026年2月 | 把 block diffusion 用作 speculative drafter，并用 target hidden features 条件化整块候选生成。 |
| [Qwen3-Coder-Next](/papers/2603.00729-qwen3-coder-next-agentic-coding/) | 2026年2月 | 用 executable environments、repo mid-training、tool-calling RL 与 expert distillation 提升低 active-compute coding agent。 |
| [Kimi K2.5 / PARL](/papers/2602.02276-kimi-k2-5-visual-agentic-intelligence/) | 2026年2月 | trainable orchestrator + frozen subagents，用 parallel / finish / performance reward 训练并行编排。 |
| [OTB](/papers/2602.07078-optimal-token-baseline-long-horizon-llm-rl/) | 2026年2月 | 推导 token-level variance-minimizing baseline，并用 logit-gradient proxy 近似长轨迹 policy-gradient 权重。 |
| [MaxRL](/papers/2602.02710-maximum-likelihood-reinforcement-learning/) | 2026年2月 | 把 binary-outcome RLVR 写成成功 rollout likelihood 最大化，优化 pass@k 覆盖。 |
| [GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) | 2026年2月 | 把 DSA / MTP / Muon 模型栈、软件工程 mid-training、agentic RL 与异步 rollout 组合为 agentic engineering pipeline。 |
| [ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/) | 2026年2月 | 把跨多轮 LLM 调用与工具等待建模为带 Reasoning / Acting 状态的 LLM Program，据此执行 KV pause / restore，并在 KV 释放后跨节点选择恢复位置。 |
| [LLM-in-Sandbox](/papers/2601.16206-computer-environments-agentic-intelligence/) | 2026年1月 | 把通用计算机抽象为最小 Docker sandbox，验证文件、代码和外部资源能提升非代码任务与可训练 agent 能力。 |
| [Engram](/papers/2601.07372-conditional-memory-engram-scalable-lookup/) | 2026年1月 | 用 hashed N-gram lookup 和 context-aware gating 增加可离线扩展的 conditional memory。 |
| [Trust Region Masking](/papers/2512.23075-trust-region-masking-long-horizon-llm-rl/) | 2025年12月 | 用序列级 max-token divergence 约束 rollout-policy mismatch，控制长轨迹 surrogate error。 |
| [Interplay](/papers/2512.07783-interplay-pretraining-midtraining-rl-reasoning/) | 2025年12月 | 用合成环境拆分 pre / mid / RL training，识别 primitive seed、edge of competence 与 bridge data 条件。 |
| [RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/) | 2025年12月 | 按硬件特性拆分 trainer、rollout、environment 和 reward，并用 bounded-staleness async 实现多任务 agentic RL。 |
| [Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/) | 2025年11月 | 利用同 prompt rollout 的上下文相关性做 divided rollout、speculative scheduling 和 suffix-tree reuse。 |
| [Span Query](/papers/2511.02749-span-queries-cache-attention-locality/) | 2025年11月 | 让客户端声明可重排 message spans，以表达式树重写提升 KV cache 与 attention locality。 |
| [BroRL](/papers/2510.01180-brorl-broadened-rl-exploration/) | 2025年10月 | 把 RLVR scaling 轴扩展到 rollout width，并用 correct-mass decomposition 解释宽采样收益。 |
| [ImpossibleBench](/papers/2510.20270-impossiblebench-test-case-exploitation/) | 2025年10月 | 构造 specification 与 tests 冲突的 coding tasks，用 cheating rate 测量 test-case exploitation。 |
| [Laminar](/papers/2510.12633-laminar-asynchronous-rl-post-training/) | 2025年10月 | 以 trajectory-level async、relay workers 和 dynamic repack 解耦 rollout 长尾、训练和权重同步。 |
| [Transformer Succinctness](/papers/2510.19315-transformers-inherently-succinct/) | 2025年10月 | 证明某些语言族的 Transformer 表示只需多项式规模，而 LTL / RNN / automata 需要指数或双指数规模。 |
| [DeepSeek Sparse Attention](/papers/2025-09-29-deepseek-v3-2-exp-dsa-long-context-efficiency/) | 2025年9月 | 在每层用 dense attention 蒸馏的 lightning indexer 为每个 query 选择最多 2048 个 MLA latent KV positions，并让全部 query heads 共享该层 top-k，将 core attention 降为 $O(Lk)$。 |
| [Batch-Invariant Inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) | 2025年9月 | 用 batch-invariant RMSNorm、matmul 与 attention kernel 消除 temperature=0 推理的批次依赖漂移。 |
| [RL Skill Composition](/papers/2509.25123-rl-compositional-skill-acquisition/) | 2025年9月 | 在受控任务中证明 RL 可组合 base model 已掌握的 atomic skills，形成未见组合能力。 |
| [LoRAFusion](/papers/2510.00206-lorafusion-efficient-lora-fine-tuning/) | 2025年9月 | 用 split-graph kernel fusion 与 multi-adapter packing 同时减少 LoRA memory traffic 和 pipeline bubbles。 |
| [Kimi K2](/papers/2507.20534-kimi-k2-open-agentic-intelligence/) | 2025年7月 | 用大规模 MoE、MuonClip、工具数据和 agentic RL 构建开放的软件工程智能体模型。 |
| [MiniMax-M1](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) | 2025年6月 | 用 Lightning Attention、CISPO 和大规模 RL rollout 降低长 CoT 的 test-time compute 成本。 |
| [Spurious Rewards](/papers/2506.10947-spurious-rewards-rethinking-rlvr/) | 2025年6月 | 通过随机、格式和错误答案 reward 实验，揭示 pretrained prior 与 clipping bias 可产生伪 RLVR 增益。 |
| [Inference-Time Reward Hacking](/papers/2506.19248-inference-time-reward-hacking-llms/) | 2025年6月 | 证明 Best-of-n 会因 proxy winner's curse 出现先升后降，并提出 Best-of-Poisson / HedgeTune。 |
| [Qwen3](/papers/2505.09388-qwen3-technical-report/) | 2025年5月 | 用 thinking / non-thinking 双模式、thinking budget 和 strong-to-weak distillation 统一推理与通用能力。 |
| [Entropy Mechanism](/papers/2505.22617-entropy-mechanism-rl-reasoning-language-models/) | 2025年5月 | 把 RLVR 训练能力上限关联到 policy entropy 消耗，并分析 advantage update 的熵动力学。 |
| [ProRL](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/) | 2025年5月 | 用高温探索、动态采样、周期 reference / optimizer reset 延长 RL，测试 reasoning boundary 扩展。 |
| [MegaScale-MoE](/papers/2505.11432-megascale-moe-communication-efficient-training/) | 2025年5月 | 围绕 attention SP、FFN EP、communication overlap 和 compressed communication 重构生产 MoE 训练路径。 |
| [RLVR Reasoning Boundary](/papers/2504.13837-rlvr-reasoning-boundary-base-model/) | 2025年4月 | 用 pass@k 区分 sampling efficiency 与新增 reasoning capacity，评估 RLVR 是否突破 base model 边界。 |
| [DAPO](/papers/2503.14476-dapo-long-cot-rl-system/) | 2025年3月 | 用 Clip-Higher、Dynamic Sampling、token-level loss 与 overlong shaping 构成可复现 long-CoT RL recipe。 |
| [CoT Monitoring](/papers/2503.11926-monitoring-reasoning-models-obfuscation/) | 2025年3月 | 验证 CoT monitor 对 agent reward hacking 的检测优势，并量化直接训练规避 monitor 的 monitorability tax。 |
| [Process Supervision Theory](/papers/2502.10581-do-we-need-to-verify-step-by-step-process-supervision-theory/) | 2025年2月 | 证明在 coverage 条件下 outcome reward 可经 reward imputation 支持过程级学习，给出过程监督的优势边界。 |
| [Kimi k1.5](/papers/2501.12599-kimi-k1-5-scaling-rl-llms/) | 2025年1月 | 把 long-CoT、verifiable reward、partial rollout 与 long2short 组合为长上下文 reasoning RL recipe。 |
| [Causal Reward Model](/papers/2501.09620-causal-rewards-llm-alignment/) | 2025年1月 | 用 MMD independence regularization 削弱 reward model 对 length、sycophancy 等伪相关特征的依赖。 |
| [DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/) | 2025年1月 | 用 outcome-based RL 从强 base model 诱导 long-CoT、自验证与策略切换，再通过 SFT / RL / distillation 转为可用模型。 |
| [DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/) | 2024年12月 | 把 auxiliary-loss-free MoE balancing、MTP、FP8 与 DualPipe 组合成高效大规模训练系统。 |
| [Qwen2.5](/papers/2412.15115-qwen2-5-technical-report/) | 2024年12月 | 把 18T 预训练、SFT / DPO / GRPO 与长上下文扩展组织为通用、代码和数学模型族。 |
| [Muon](/papers/2026-06-19-muon-optimizer-keller-jordan-synthesis/) | 2024年12月 | 用 low-precision Newton-Schulz 把 momentum matrix 近似正交化，并给出 LLM scaling 所需的更新尺度和参数分组。 |
| [HybridFlow](/papers/2409.19256-hybridflow-rlhf-framework/) | 2024年9月 | 用跨模型 single-controller 与模型内 multi-controller 统一编排 RLHF dataflow 和并行执行。 |
| [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/) | 2024年5月 | 用 MLA 压缩 KV cache，并与 DeepSeekMoE 组合降低训练与推理成本。 |
| [Lightning Attention](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/) | 2024年5月 | 把 causal linear attention 拆成块内矩阵乘和块间 recurrent state，提供 IO-aware GPU kernel。 |
| [Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/) | 2024年5月 | 用 Semantic Variable 暴露 LLM application DAG、shared prompt 和性能目标，驱动应用级 serving 调度。 |
| [Correlated Proxies / ORPO](/papers/2403.03185-correlated-proxies-reward-hacking/) | 2024年3月 | 以 occupancy shift 定义 correlated proxy failure，并用 ORPO 约束策略访问分布。 |
| [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) | 2024年1月 | 用细粒度专家切分和共享专家隔离提高 routed expert 的专门化程度。 |
| [Math-Shepherd](/papers/2312.08935-math-shepherd-automatic-process-supervision/) | 2023年12月 | 用 continuation 成功率自动生成 step-level pseudo labels，训练 PRM 并接入 PPO。 |
| [Ring Attention](/papers/2310.01889-ring-attention-blockwise-transformers-near-infinite-context/) | 2023年10月 | 让 KV blocks 沿设备 ring 轮转，在保持 exact attention 的条件下把上下文扩展到多设备。 |
| [DeepSpeed Ulysses](/papers/2309.14509-deepspeed-ulysses-long-sequence-training/) | 2023年9月 | 用 sequence-sharded 与 head-sharded 之间的 all-to-all 布局转换扩展极长序列训练。 |
| [SARATHI](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/) | 2023年8月 | 把长 prefill 切成 compute-sized chunks，与 decode 共同 batching，提高 serving 利用率。 |
| [FlashAttention-2](/papers/2307.08691-flashattention-2-parallelism-work-partitioning/) | 2023年7月 | 通过减少 non-matmul FLOPs、提升 sequence parallelism 和调整 warp 分工提高 attention kernel 利用率。 |
| [GKD](/papers/2306.13649-on-policy-distillation-language-models/) | 2023年6月 | 让 student 在自生成轨迹上匹配 teacher 分布，缓解 teacher-forcing 与部署时的分布偏移。 |
| [PRM800K](/papers/2305.20050-lets-verify-step-by-step-process-supervision/) | 2023年5月 | 用 80 万人工 step labels 训练 PRM，并以大规模 Best-of-N 验证过程监督的选择能力。 |
| [Speculative Decoding](/papers/2211.17192-fast-inference-transformers-speculative-decoding/) | 2022年11月 | 用 draft model 生成候选、target model 并行验证，并以 rejection / residual correction 保持目标分布。 |
| [FlashAttention](/papers/2205.14135-flashattention-io-aware-exact-attention/) | 2022年5月 | 用 SRAM tiling、online softmax 与 backward recomputation 减少 exact attention 的 HBM traffic。 |
| [Chinchilla](/papers/2203.15556-training-compute-optimal-large-language-models/) | 2022年3月 | 重新估计 compute-optimal frontier，指出参数量和训练 token 应随算力近似等比例增长。 |
| [KL Estimators](/papers/2020-03-07-schulman-kl-divergence-approximations/) | 2020年3月 | 给出 k1 / k2 / k3 KL estimators 的偏差、方差和控制变量关系，作为 RL drift 诊断基础。 |
| [Kaplan Scaling Laws](/papers/2001.08361-scaling-laws-neural-language-models/) | 2020年1月 | 拟合 loss 对参数、数据与计算的 power law，建立早期 compute-efficient pretraining scaling law。 |
| [ZeRO](/papers/1910.02054-zero-memory-optimizations-trillion-parameter-models/) | 2019年10月 | 按 data-parallel rank 分片 optimizer state、gradient 与 parameter，降低大模型训练的显存复制。 |

## 后续新增论文沉淀规范

详细流程见 [paper-analysis-workflow.md](/workflow/)，新增笔记使用 [paper-note-template.md](/template/)。

最低要求：

- 新增论文必须沉淀为独立 Markdown 文件。
- 新增论文必须更新本索引的 `当前收录` 表，并按首次公开月份从新到旧排列；同月条目保留现有相对顺序。
- 新增论文必须在对应笔记中分析作者与机构关系，并在 `data/authors.json` 中维护稳定作者事实。
- 阅读后的交流环节若产生有效修正、核心表述、指标清单或跨论文关系，必须回写对应笔记；核心信号发生变化时同步更新 `当前收录`。
- 若出现重复作者、同一实验室连续论文、主题演化、引用关系或方法复用，并且该关系能改变跨论文理解，必须写入对应论文的 `跨论文关系`。
- 对技术博客、项目文档或工程报告，可使用稳定来源 ID 组成文件 slug；作者、机构、主题和跨材料关系仍写入对应笔记。
- 面向站点展示的已存档论文链接统一使用 `/papers/<slug>/` 形式；工作流、模板、索引页面分别使用 `/workflow/`、`/template/`、`/archive/`。
