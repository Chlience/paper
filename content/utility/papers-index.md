# Paper Archive Index

First-Archived-At: 2026-06-21
Updated-At: 2026-08-25

## 本地工作流

- 目录规则：`AGENTS.md`
- 内容目录：论文笔记 `content/papers/`；公开索引和模板 `content/utility/`；作者数据 `data/authors.json`；内部 SOP `internal/`
- 论文分析 SOP：[paper-analysis-workflow.md](/workflow/)
- 论文笔记模板：[paper-note-template.md](/template/)

## 当前收录

| 简称 | 时间 | 核心信号 |
| --- | --- | --- |
| [Kimi K3](/papers/2026-07-27-kimi-k3-open-frontier-intelligence/) | 2026年7月 | Kimi K3 将三层 KDA 与一层全局注意力交错、跨块 Attention Residuals 和每个 token 激活 16 个路由专家的 Stable LatentMoE 组合为 2.78 万亿总参数、1042 亿激活参数、百万 token 上下文的原生多模态模型；报告的缩放律拟合把架构、数据与训练配方的合并收益估计为相对 Kimi K2 约 2.5 倍，尚未拆分单个组件贡献。 |
| [SEED](/papers/2607.14777-seed-self-evolving-on-policy-distillation/) | 2026年7月 | 先用外部模型标注的轨迹—技能数据把策略训练成轨迹分析器，再让每轮最新策略从自身完整轨迹生成事后技能并对同批采样 token 做门控似然训练；三种小模型在 12 个汇总指标中取得 10 个最优或并列最优，但直接前作 OPID 未进入主表，且证据缺少多随机种子、技能正确性评测与总训练成本对齐。 |
| [CriPO](/papers/2607.18082-cripo-rubric-rl-self-distillation/) | 2026年7月 | 把评分量规聚合后的学习信号丢失拆成当前采样未覆盖和已满足但整体优势非正两类，用评分项条件自教师注入缺失行为，并以反事实自教师定位 token 后局部改写优势；两种 Qwen3 小模型在五项裁判评测中较 GRPO 平均提高 3.2 和 1.4 分，证据缺少多随机种子与完整硬件条件。 |
| [Long-Horizon Agents Survey](/papers/202607.1328-towards-long-horizon-agents-survey/) | 2026年7月 | 用基础策略与运行时 harness 的组合关系以及 H1/H2/H3 分层，将长程能力统一为运行时系统和模型内部优化共同作用的系统属性。 |
| [HiLS-Attention](/papers/2607.02980-hils-attention-infinite-context/) | 2026年7月 | HiLS-Attention 用 landmark 压缩键、熵偏置与分层 softmax 训练 chunk 选择器，使 8K 训练的 345M 模型在 4M RULER 单针检索仍得 96 分，并在 512K 单 H800、batch size 1 的同 Triton 基线上将 prefill 与 decode 分别加速 13.5 倍和 15.7 倍。 |
| [SPORK](/papers/2607.03333-spork-self-speculative-agentic-inference/) | 2026年7月 | 让目标模型从共享 KV prefix 自预测下一次工具调用，提前执行只读工具，并用 target verification 回收失败 probe 的 token 前缀。 |
| [ReOPD](/papers/2607.04763-reopd-prefix-replay-agentic-distillation/) | 2026年7月 | 把教师 RL 轨迹回放为按轮次衰减采样的前缀，只让学生在当前步生成并接受教师分布监督，从而在学生蒸馏阶段关闭环境。 |
| [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/) | 2026年7月 | CompactionRL 用独立 critic 和按后续 token 数折扣的跨段优势训练上下文压缩轨迹；两个模型在启用压缩的 coding 评测中提高 Pass@1，但 SUPO 已覆盖摘要—执行联合训练与全 token 归一化，且论文未报告直接对照或总计算。 |
| [LLM-as-a-Verifier](/papers/2607.05391-llm-as-a-verifier/) | 2026年7月 | 把评分 token 的概率期望、重复评估与 criteria decomposition 组合成连续 verifier，再用概率 pivot tournament 扩展多轨迹选择。 |
| [SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/) | 2026年7月 | 用每 prompt 单 rollout、强化 critic 与双侧 token mask 替代异步 GRPO 的组内等待和 group baseline。 |
| [TRACE](/papers/2607.13988-trace-turn-level-reward-assignment/) | 2026年7月 | 在已知短答案的长程搜索中，用冻结参考模型测量工具边界后的答案可预测性变化并把多步时序差信用混入终局优势，使两种 Qwen3 Thinking 模型在同设置下较 GRPO 的 BrowseComp-Plus 分数分别提高 5.6 和 6.2 个百分点。 |
| [EcoSpec](/papers/2607.12696-ecospec-cost-aware-moe-speculative-decoding/) | 2026年7月 | EcoSpec 用轻量路由预测器估计草稿候选会新增的专家集合，并优先选择复用已有专家的验证路径；在八张 H200、Hugging Face Transformers、主要批量为一的研究原型中，三个大规模 MoE 的贪心解码平均加速从对应投机基线相对自回归的一点一零至一点二二倍提高到一点一五至一点三六倍，HBM 流量来自估算且批量为八时投机吞吐低于自回归。 |
| [W2S-OPD](/papers/2607.26246-w2s-opd-weak-to-strong-distillation/) | 2026年7月 | W2S-OPD 将较弱正负模型的 logits 差分叠加到冻结的强学生基座分布，再在学生自身轨迹上执行逐 token 反向 KL；Qwen3-8B 的强化学习前后对比设置相对直接 OPD 的数学与代码平均准确率分别提高 5.3 和 2.2 个百分点，跨模型家族与独立训练复验仍待验证。 |
| [SmoothAgent](/papers/2607.00151-smoothagent-lookahead-context-engineering/) | 2026年6月 | 把可提前确定的 context transformation 移入异步 lookahead stream，并用 SLO-aware scheduling 预建变换后 KV cache，降低 transform-point TTFT。 |
| [ECHO](/papers/2606.31650-echo-selective-turn-memory-agentic-rl/) | 2026年6月 | ECHO 为长程智能体保留带原始轮次标识的选择性记忆，用它重建有限上下文并将结果信用路由到被复用历史轮次及其选择动作，在 BrowseComp-Plus 上同时提高一次通过率并减少滚动摘要造成的轨迹膨胀。 |
| [SPIRAL](/papers/2606.23595-spiral-learning-search-aggregate/) | 2026年6月 | 从 8 条搜索轨迹随机构造 4 个四元集合，以聚合成功率的参与集合均值更新搜索轨迹，并用同集合内中心化 reward 训练共享策略的聚合轨迹。 |
| [Self-Improving Agents](/papers/2026-06-25-self-improving-agents-era-experience-survey/) | 2026年6月 | 把 agent 自改进抽象为 trace-to-capability 流水线，覆盖 skills、memory、environment、model 与 meta-layer。 |
| [DSpark](/papers/2026-06-27-dspark-confidence-scheduled-speculative-decoding/) | 2026年6月 | 用 Markov head、置信度校准和硬件感知前缀调度，把并行 drafter 推进生产 serving。 |
| [MOPD](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/) | 2026年6月 | 让 student 在自身轨迹上接受多个领域 teacher 的 token-level reverse-KL 信号，整合 RL teacher 能力。 |
| [GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/) | 2026年6月 | 把 1M context、IndexShare / IndexCache 与 MTP speculative decoding 接入长程 coding agent。 |
| [DLA](/papers/2606.10650-dynamic-linear-attention/) | 2026年6月 | 用 representation drift 动态决定 state 边界，在固定 cache 内自适应合并 linear-attention states。 |
| [HydraHead](/papers/2606.20097-hydrahead-head-wise-hybrid-attention/) | 2026年6月 | 用 causal patching 找到 retrieval-critical heads，只为这些 heads 保留 full attention。 |
| [Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/) | 2026年6月 | 以 TV loss 训练 MTP heads，并用 probabilistic rejection sampling 提高 RL rollout 接受率。 |
| [VIMPO](/papers/2606.20008-vimpo-value-implicit-policy-optimization-llms/) | 2026年6月 | 从 policy / reference log-ratio 构造隐式 value recurrence，省去独立 critic 并形成 token-level PPO advantage。 |
| [FlashMemory](/papers/2606.09079-flashmemory-deepseek-v4-lookahead-sparse-attention/) | 2026年6月 | 预测未来 token 的 KV chunk 需求，将冷 KV 移到 CPU 并按需预取，压缩物理 KV footprint。 |
| [MiniMax Sparse Attention](/papers/2606.13392-minimax-sparse-attention-m3/) | 2026年6月 | 用 group-aware index branch 选择 KV blocks，再对选中块执行精确 softmax attention。 |
| [Beneficial-Trait RL](/papers/2026-06-18-openai-beneficial-rl/) | 2026年6月 | 用少量 beneficial-trait RL data 强化诚实、纠错与风险意识，并测量跨域 alignment persistence。 |
| [SocioHack](/papers/2606.04075-llms-hack-rewards-and-society/) | 2026年6月 | 把制度规则编码为 reward sandbox，验证 RL model 会发现形式合规但偏离制度意图的策略。 |
| [UltraEP](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/) | 2026年6月 | 基于 post-gating exact load 逐 microbatch / layer 规划 expert replica 与 token reroute，统一 MoE 训练和 prefill 负载均衡。 |
| [Muon Curvature](/papers/2606.04662-muon-outperforms-adam-curvature/) | 2026年6月 | 将 Muon 相对 Adam 的训练优势归因于更低的 directional curvature penalty，step-size 的解释力较弱。 |
| [SelfCompact](/papers/2606.23525-self-compacting-language-model-agents/) | 2026年6月 | 用要求引用轨迹证据的任务专用 rubric 选择摘要时机，让同一模型在无需训练时压缩并重建长程 agent 上下文。 |
| [LRE](/papers/2606.20954-lre-learned-relevance-eviction/) | 2026年6月 | LRE 用日志中的未来复用信号训练轻量逻辑回归，对历史单元做查询无关打分并按预算逐字保留；单随机种子 AppWorld 中以零压缩器调用得到 41.1% 任务目标完成率、接近全历史的 44.0%，LoCoMo 上也是最佳受预算策略，但 Hard 与 LongMemEval 结果显示它尚未跨域占优，2048 token 只约束较旧历史。 |
| [TacoMAS](/papers/2605.09539-tacomas-test-time-coevolution-mas/) | 2026年5月 | 在单个查询内逐轮依据轨迹反馈改写代理能力，并每两轮按预算增删代理与重连通信图；四个工具基准相对各自最强基线平均提高 13.3 个准确率百分点，比较未统一推理预算。 |
| [RubricEM](/papers/2605.10899-rubricem-rubric-guided-meta-rl/) | 2026年5月 | 把评分量规贯穿深度研究智能体的阶段化执行、分阶段裁判奖励和反思记忆，在作者的搜索与 LLM 裁判协议下将 8B 模型四项长文基准均值从 SFT 的 49.2 提高到 55.5。 |
| [GraphGPO](/papers/2605.26684-graphgpo-graph-credit-assignment-agentic-rl/) | 2026年5月 | 将同一任务的分组轨迹合并为状态转移图，以后继状态到成功节点的最短路径构造逐步优势，并在状态可稳定合并、目标可验证的 ALFWorld、WebShop 和 Sokoban 设置中优于 GRPO 与 GiGPO。 |
| [SRPO](/papers/2605.25507-credit-assignment-resets-language-model-reasoning/) | 2026年5月 | 从失败轨迹重置并重采样错误点后的 continuation，只更新后缀 token 以集中 credit assignment。 |
| [TIM / VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/) | 2026年5月 | 构造 trainer / rollout bitwise-aligned 基线，证明微小 logprob mismatch 可触发 RL collapse。 |
| [Tool-Calling RL](/papers/2606.00135-agentic-tool-calling-rl-training/) | 2026年5月 | 量化 tool-calling 评测协议漂移，并用近期 all-correct 预测与 max-variance update 子采样压缩 GRPO wall-clock。 |
| [Anthropomorphism](/papers/2605.31514-age-of-empires-anthropomorphism/) | 2026年5月 | 用 Age of Empires II 作为 substrate control，说明类人行为测试不足以支持类人内在属性归因。 |
| [STV](/papers/2605.30290-self-trained-verification/) | 2026年5月 | 把 reference solution 作为 verifier privileged signal，经 OPD + verdict RL 蒸馏到无 reference verifier，并用于训练与测试时自改进。 |
| [Credit Assignment Survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/) | 2026年4月 | 统一 reasoning 与 agentic RL 的 token / step / turn / trajectory credit-assignment 问题。 |
| [Data-Scarcity RL Survey](/papers/2604.17312-rl-llm-data-scarcity-survey/) | 2026年4月 | 把 LLM 强化学习中的高成本外部监督与有限内部生成经验统一到 data、training、framework 三层九类干预点，并组织为一份覆盖 125 条文献记录的设计地图。 |
| [DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) | 2026年4月 | 以 CSA / HCA、MoE、MTP / OPD 和系统协同实现百万 token 训练、推理与 agent 能力。 |
| [Caution](/papers/2604.04648-caution-pessimism-best-of-n-reward-hacking/) | 2026年4月 | 用 reward-feature prediction error 估计 OOD uncertainty，在 Best-of-N selection 时执行 pessimistic correction。 |
| [AttnRes](/papers/2603.15031-attention-residuals/) | 2026年3月 | AttnRes 用输入相关的深度 softmax 聚合替代 PreNorm 的单位权重累积，并以块级表示和系统调度控制跨层状态成本；五个 194M–528M 激活参数 Kimi Linear MoE 设置均降低单次报告验证损失，48B/3B 的块级变体十五项下游数值十四升一平，但缺少随机种子、大规模 Full 对照和完整系统测量条件。 |
| [IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/) | 2026年3月 | 用 loss-guided layer search 或 multi-layer distillation 划分 Full / Shared 层，跨层复用 top-k positions 并跳过最多 75% 的 DSA indexer 计算。 |
| [DFlash](/papers/2602.06036-dflash-block-diffusion-speculative-decoding/) | 2026年2月 | 把 block diffusion 用作 speculative drafter，并用 target hidden features 条件化整块候选生成。 |
| [Qwen3-Coder-Next](/papers/2603.00729-qwen3-coder-next-agentic-coding/) | 2026年2月 | Qwen3-Coder-Next 在 80B 总参数中每步激活 3B 参数，并用可执行仓库任务、长上下文中训、多模板工具训练、软件工程强化学习与专家蒸馏构建编码智能体，在三种 SWE-Bench Verified scaffold 上达到 70.6% 至 71.3% 解决率，报告尚未拆分各训练组件的净贡献。 |
| [Kimi K2.5 / PARL](/papers/2602.02276-kimi-k2-5-visual-agentic-intelligence/) | 2026年2月 | trainable orchestrator + frozen subagents，用 parallel / finish / performance reward 训练并行编排。 |
| [OTB](/papers/2602.07078-optimal-token-baseline-long-horizon-llm-rl/) | 2026年2月 | 推导 token-level variance-minimizing baseline，并用 logit-gradient proxy 近似长轨迹 policy-gradient 权重。 |
| [MaxRL](/papers/2602.02710-maximum-likelihood-reinforcement-learning/) | 2026年2月 | 把 binary-outcome RLVR 写成成功 rollout likelihood 最大化，优化 pass@k 覆盖。 |
| [GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) | 2026年2月 | 把 DSA / MTP / Muon 模型栈、软件工程 mid-training、agentic RL 与异步 rollout 组合为 agentic engineering pipeline。 |
| [ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/) | 2026年2月 | 把多轮 tool-use 的 phase、KV footprint 与 backend placement 合并为 LLM Program，用 phase-first pause / restore 和全局 waiting queue 控制工具等待期间的 KV working set。 |
| [SDPO](/papers/2601.20802-reinforcement-learning-via-self-distillation/) | 2026年1月 | SDPO 在学生在线轨迹上用环境反馈条件化的 EMA 同模型重算下一词分布，将 Top-K 分布差转成 logit 级信用；Qwen3-8B 在 LiveCodeBench v6 上达到 48.8%，高于强 GRPO 的 41.2%，但依赖模型回溯能力与反馈质量。 |
| [SDFT](/papers/2601.19897-self-distillation-continual-learning/) | 2026年1月 | 让 student 在自身轨迹上接受 query-specific demonstration-conditioned EMA 同模型的 token distribution，在提升新任务准确率时显著减少旧能力遗忘。 |
| [OPSD](/papers/2601.18734-self-distilled-reasoner-opsd/) | 2026年1月 | OPSD 让学生先在只看题目时采样自身轨迹，再用固定初始模型在参考解答上下文中对相同前缀给出的完整词表分布和逐词表项裁剪前向 KL 更新学生，在 Qwen3-1.7B/4B/8B 的三项数学平均分上高于基础模型、SFT 与 GRPO，但总计算、统计方差和领域外泛化仍未对齐。 |
| [LatentMoE](/papers/2601.18089-latentmoe-accuracy-per-flop-parameter/) | 2026年1月 | LatentMoE 将路由专家移到低维潜空间，并把节省的权重读取与通信预算用于增加专家数和 Top-k；准确率优先变体在相近参数的 95B Transformer 与 73B Mamba–Attention 设置中，全部已报下游指标均高于标准 MoE，但万亿参数服务优势仍是模拟结果。 |
| [LLM-in-Sandbox](/papers/2601.16206-computer-environments-agentic-intelligence/) | 2026年1月 | LLM-in-Sandbox 只给模型 shell、文件编辑和完成信号，使部分模型—任务组合获得最高 15.5 个百分点增益，并让 Qwen3-4B 经文件型通用任务强化学习后把平均交互轮次从 23.7 降到 7.0，这些数值来自允许联网的特定环境配置。 |
| [Engram](/papers/2601.07372-conditional-memory-engram-scalable-lookup/) | 2026年1月 | 用 hashed N-gram lookup 和 context-aware gating 增加可离线扩展的 conditional memory。 |
| [Trust Region Masking](/papers/2512.23075-trust-region-masking-long-horizon-llm-rl/) | 2025年12月 | 用序列级 max-token divergence 约束 rollout-policy mismatch，控制长轨迹 surrogate error。 |
| [Interplay](/papers/2512.07783-interplay-pretraining-midtraining-rl-reasoning/) | 2025年12月 | 用合成环境拆分 pre / mid / RL training，识别 primitive seed、edge of competence 与 bridge data 条件。 |
| [RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/) | 2025年12月 | 用声明式 task-domain 硬件亲和映射、轨迹级环境状态机和带起始版本年龄上限的异步换权，协调 H800/H20/CPU/serverless 上的多任务 agentic RL。 |
| [DeepSeek-V3.2](/papers/2512.02556-deepseek-v3-2-open-large-language-models/) | 2025年12月 | 用 DSA 降低 128K attention 成本，再以四层 GRPO consistency control 和 85,267 条真实/合成 agent tasks 扩展 reasoning 与 tool-use。 |
| [Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/) | 2025年11月 | 利用同 prompt rollout 的上下文相关性做 divided rollout、speculative scheduling 和 suffix-tree reuse。 |
| [Span Query](/papers/2511.02749-span-queries-cache-attention-locality/) | 2025年11月 | 让客户端声明可重排 message spans，以表达式树重写提升 KV cache 与 attention locality。 |
| [DRPO](/papers/2510.04474-drpo-decoupled-reward-policy-optimization/) | 2025年10月 | DRPO 在正确 rollout 内部按长度奖励重加权、独立压低错误 rollout，使 7B 蒸馏推理模型平均生成长度减少 51% 时性能仅相对下降 2.6%；证据限于 8K 预算、每题 8 条采样和 token 长度效率口径。 |
| [BroRL](/papers/2510.01180-brorl-broadened-rl-exploration/) | 2025年10月 | 把 RLVR scaling 轴扩展到 rollout width，并用 correct-mass decomposition 解释宽采样收益。 |
| [ImpossibleBench](/papers/2510.20270-impossiblebench-test-case-exploitation/) | 2025年10月 | 构造 specification 与 tests 冲突的 coding tasks，用 cheating rate 测量 test-case exploitation。 |
| [Laminar](/papers/2510.12633-laminar-asynchronous-rl-post-training/) | 2025年10月 | 让完成轨迹独立进入 experience buffer，并以 CPU/RDMA relay 和同版本 repack 解除全局 batch / 权重同步 barrier。 |
| [Transformer Succinctness](/papers/2510.19315-transformers-inherently-succinct/) | 2025年10月 | 证明某些语言族的 Transformer 表示只需多项式规模，而 LTL / RNN / automata 需要指数或双指数规模。 |
| [Batch-Invariant Inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) | 2025年9月 | 用 batch-invariant RMSNorm、matmul 与 attention kernel 消除 temperature=0 推理的批次依赖漂移。 |
| [RL Skill Composition](/papers/2509.25123-rl-compositional-skill-acquisition/) | 2025年9月 | 在受控任务中证明 RL 可组合 base model 已掌握的 atomic skills，形成未见组合能力。 |
| [LoRAFusion](/papers/2510.00206-lorafusion-efficient-lora-fine-tuning/) | 2025年9月 | 用 split-graph kernel fusion 与 multi-adapter packing 同时减少 LoRA memory traffic 和 pipeline bubbles。 |
| [Tricks or Traps / Lite PPO](/papers/2508.08221-tricks-or-traps-lite-ppo/) | 2025年8月 | 在同一训练框架下、覆盖范围并不完全重合的 Qwen3 4B/8B Base 与对齐后数学强化学习实验中分别检查优势归一化、概率比裁剪、损失聚合和超长过滤，并将组内均值—批级标准差归一化与 token 级损失组成不训练价值模型的 Lite PPO；OpenReview 补充的一个 Qwen3-8B Base 三随机种子设置仍优于 GRPO 与 DAPO，但奖励范围异常、计算量未对齐和有限模型任务覆盖限制普适结论。 |
| [Kimi K2](/papers/2507.20534-kimi-k2-open-agentic-intelligence/) | 2025年7月 | 用大规模 MoE、MuonClip、工具数据和 agentic RL 构建开放的软件工程智能体模型。 |
| [MiniMax-M1](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) | 2025年6月 | 用 Lightning Attention、CISPO 和大规模 RL rollout 降低长 CoT 的 test-time compute 成本。 |
| [Spurious Rewards](/papers/2506.10947-spurious-rewards-rethinking-rlvr/) | 2025年6月 | 通过随机、格式和错误答案 reward 实验，揭示 pretrained prior 与 clipping bias 可产生伪 RLVR 增益。 |
| [Inference-Time Reward Hacking](/papers/2506.19248-inference-time-reward-hacking-llms/) | 2025年6月 | 证明 Best-of-n 会因 proxy winner's curse 出现先升后降，并提出 Best-of-Poisson / HedgeTune。 |
| [Qwen3](/papers/2505.09388-qwen3-technical-report/) | 2025年5月 | 用 thinking / non-thinking 双模式、thinking budget 和 strong-to-weak distillation 统一推理与通用能力。 |
| [Entropy Mechanism](/papers/2505.22617-entropy-mechanism-rl-reasoning-language-models/) | 2025年5月 | 把 RLVR 训练能力上限关联到 policy entropy 消耗，并分析 advantage update 的熵动力学。 |
| [ProRL](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/) | 2025年5月 | 用高温探索、动态采样、周期 reference / optimizer reset 延长 RL，测试 reasoning boundary 扩展。 |
| [MoESD](/papers/2505.19645-moesd-sparse-moe-speculative-decoding/) | 2025年5月 | 在单步解码已使专家加载趋于饱和、模型仍受内存带宽限制的中等批量区间，用投机验证复用已加载专家；Qwen2-57B-A14B 在两张 H800 上最高加速 2.29 倍，适用范围依赖路由均衡、MoE 前馈网络成本占比和具体硬件。 |
| [MegaScale-MoE](/papers/2505.11432-megascale-moe-communication-efficient-training/) | 2025年5月 | 围绕 attention SP、FFN EP、communication overlap 和 compressed communication 重构生产 MoE 训练路径。 |
| [RLVR Reasoning Boundary](/papers/2504.13837-rlvr-reasoning-boundary-base-model/) | 2025年4月 | 用 pass@k 区分 sampling efficiency 与新增 reasoning capacity，评估 RLVR 是否突破 base model 边界。 |
| [DAPO](/papers/2503.14476-dapo-long-cot-rl-system/) | 2025年3月 | 在 Qwen2.5-32B 与 AIME 2024 设置中，用解耦裁剪、动态采样、token 级损失和超长奖励整形将朴素 GRPO 的 avg@32 从 30 提高到 50，并开源代码、数据与模型。 |
| [CoT Monitoring](/papers/2503.11926-monitoring-reasoning-models-obfuscation/) | 2025年3月 | 验证 CoT monitor 对 agent reward hacking 的检测优势，并量化直接训练规避 monitor 的 monitorability tax。 |
| [EAGLE-3](/papers/2503.01840-eagle-3-training-time-test/) | 2025年3月 | EAGLE-3 去除特征回归约束，用多层目标特征融合和训练时多步自生成展开直接训练草稿 token 分布；LLaMA-3.1-8B 在 MT-Bench 从 EAGLE-2 的 3.16 倍提高到 4.40 倍，6.47 倍是单批量研究原型峰值，SGLang 批量 64 为 1.38 倍。 |
| [Process Supervision Theory](/papers/2502.10581-do-we-need-to-verify-step-by-step-process-supervision-theory/) | 2025年2月 | 证明在 coverage 条件下 outcome reward 可经 reward imputation 支持过程级学习，给出过程监督的优势边界。 |
| [Kimi k1.5](/papers/2501.12599-kimi-k1-5-scaling-rl-llms/) | 2025年1月 | 把 long-CoT、verifiable reward、partial rollout 与 long2short 组合为长上下文 reasoning RL recipe。 |
| [Causal Reward Model](/papers/2501.09620-causal-rewards-llm-alignment/) | 2025年1月 | 用 MMD independence regularization 削弱 reward model 对 length、sycophancy 等伪相关特征的依赖。 |
| [DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/) | 2025年1月 | 用 outcome-based RL 从强 base model 诱导 long-CoT、自验证与策略切换，再通过 SFT / RL / distillation 转为可用模型。 |
| [DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/) | 2024年12月 | 把 auxiliary-loss-free MoE balancing、MTP、FP8 与 DualPipe 组合成高效大规模训练系统。 |
| [Qwen2.5](/papers/2412.15115-qwen2-5-technical-report/) | 2024年12月 | 把 18T 预训练、SFT / DPO / GRPO 与长上下文扩展组织为通用、代码和数学模型族。 |
| [HybridFlow](/papers/2409.19256-hybridflow-rlhf-framework/) | 2024年9月 | 用跨模型 single-controller 与模型内 multi-controller 统一编排 RLHF dataflow 和并行执行。 |
| [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/) | 2024年5月 | 把 per-head K/V cache 改成由 hidden state 下投影得到的共享 KV latent，并用 projection absorption 与 decoupled RoPE 避免恢复历史 K/V。 |
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
