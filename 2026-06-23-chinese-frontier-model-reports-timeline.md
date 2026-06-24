# 国产前沿模型技术报告时间线总览

First-Archived-At: 2026-06-23 18:40
Updated-At: 2026-06-24 16:40
Pinned: true

## Source

- Local archive: [2401.06066 DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)
- Local archive: [2405.04434 DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)
- Local archive: [2412.15115 Qwen2.5](/papers/2412.15115-qwen2-5-technical-report/)
- Local archive: [2412.19437 DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/)
- Local archive: [2501.12948 DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/)
- Local archive: [2501.12599 Kimi k1.5](/papers/2501.12599-kimi-k1-5-scaling-rl-llms/)
- Local archive: [2505.09388 Qwen3](/papers/2505.09388-qwen3-technical-report/)
- Local archive: [2506.13585 MiniMax-M1](/papers/2506.13585-minimax-m1-cispo-lightning-attention/)
- Local archive: [2507.20534 Kimi K2](/papers/2507.20534-kimi-k2-open-agentic-intelligence/)
- Local archive: [2602.02276 Kimi K2.5](/papers/2602.02276-kimi-k2-5-visual-agentic-intelligence/)
- Local archive: [2602.15763 GLM-5](/papers/2602.15763-glm-5-agentic-engineering/)
- Local archive: [2026-04-24 DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)
- Local archive: [2026-06-16 GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/)
- Related systems and method nodes: [2606.12370 Qwen Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/), [2511.14617 Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/), [2026-06-17 slime](/papers/2026-06-17-slime-rl-scaling-framework/), [2026-06-19 Muon 综合](/papers/2026-06-19-muon-optimizer-keller-jordan-synthesis/)

## 作者与关系

这条时间线主要由五个国产模型组织构成：DeepSeek-AI、Qwen Team / Alibaba、Kimi Team / Moonshot AI、MiniMax、GLM-5 Team / Z.ai / Zhipu AI / Tsinghua University。它们的报告大多采用团队署名，作者列表按字母序或贡献组呈现，因此更适合按组织、技术路线和系统依赖建图，逐人关系只在跨论文重复出现且已核验的作者上保留。

DeepSeek 线从 [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) 的 fine-grained experts / shared experts 走向 V2 的 MLA + sparse FFN 合流，再走向 V3 的 FP8 / DualPipe / MTP，经过 R1 的 reasoning RL，最后在 V4 汇合到 million-token context、Muon、deterministic kernels 和 agent sandbox。Qwen 线从 Qwen2.5 的模型族和 reward / long-context 基座，走到 Qwen3 的 thinking control 与 strong-to-weak distillation，再由 Bebop 补上 MTP rollout acceleration。Kimi 线从 k1.5 的 long-context RL recipe，走到 K2 的 open agentic intelligence，再到 K2.5 的 visual agentic intelligence，并由 Seer 解释 Moonshot 生态里同步 RL rollout 的系统压力。GLM 线从 GLM-5 的 agentic engineering 与 slime 异步 RL，走到 GLM-5.2 的 1M long-horizon coding agent。MiniMax-M1 则提供另一条长输出路线，用 Lightning Attention 和 CISPO 处理 test-time compute 与 RL objective 的成本。

## 一句话结论

国产前沿模型技术报告在 2024-2026 年的主线，可以读成一次连续的工程迁移：先用 MoE、MLA、长上下文和低精度训练把 frontier base model 做到可训练、可服务；随后用 verifiable reward、long-CoT、GRPO/OMD/CISPO 等方法把推理能力从模型先验里释放出来；再把 rollout、工具环境、checkpoint、sparse attention、MTP 和 anti-hack 写进训练闭环，使模型报告从 benchmark 展示转向 agentic production system 的公开拆解。

## 论文脉络

如果只看单篇报告的排行榜，国产模型技术路线很容易被读成一串分数刷新。MMLU、AIME、LiveCodeBench、SWE-bench、RULER、TAU-bench 都在表格里发光，但真正的变化藏在表格下面：每一代报告都在回答同一个更硬的问题，怎样把更长的上下文、更稀疏的参数、更长的推理、更复杂的工具环境放进一个可训练、可推理、可复现调试的系统。

DeepSeek 线的起点可以前移到 2024 年 1 月的 [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)。这篇 ACL 论文先把 MoE 的效率问题拆成专家专门化问题：fine-grained expert segmentation 把 full-size FFN expert 切成更多 smaller experts，并同步增加激活专家数，使 total / active compute 大致守恒；shared expert isolation 用固定激活的 shared experts 承载通用知识，让 routed experts 更集中地学习差异化模式。2B controlled validation 说明它优于 Hash Layer / Switch / GShard，16B / 145B 实验把这条 sparse FFN 路线推到可扩展模型设置。

到 2024 年 5 月，DeepSeek-V2 把服务成本中的两个瓶颈拆开：attention 侧用 MLA 将每个 token 的 KV 压成 latent KV，并用 decoupled RoPE 单独保存位置分支，使低秩 KV 压缩和 RoPE 位置能力可以同时存在；FFN 侧用 [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) 的 shared/routed experts 扩大 total capacity，再用 device-limited routing、expert/device/communication balance losses 和训练期 token dropping 控制专家负载与跨设备通信。论文报告相对 DeepSeek 67B 节省 42.5% 训练成本、减少 93.3% KV cache、最大生成吞吐提升到 5.76 倍。这里出现了后续多篇技术报告反复继承的底层判断：开放模型要继续放大，能力、显存、通信、推理吞吐必须同时进入模型设计。

到 2024 年 12 月，Qwen2.5 和 DeepSeek-V3 代表两种扩展方式。Qwen2.5 是模型族工程：open-weight dense family、proprietary API MoE、18T token 分阶段数据 mixture、151K BBPE tokenizer、SFT/DPO/GRPO/offline-online RL、Qwen2.5-Math/Coder/QwQ 和长上下文扩展放在同一条发布线里。它需要区分 128K open-weight context 与 Turbo / Qwen2.5-1M 的 1M context，后者依赖 progressive context expansion、YaRN 和 DCA。DeepSeek-V3 沿 V2 的 MLA / [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) 系统线继续放大到 671B total / 37B active：auxiliary-loss-free balance 用 expert bias 影响 top-K routing，减少辅助损失梯度对专家专门化的干扰；MTP 在主 next-token loss 之外增加未来 token 预测信号；DualPipe 把 pipeline communication 和 MoE all-to-all 放进计算间隙；FP8 用 fine-grained scaling 和高精度 accumulation 降低训练成本。V3 的 2.788M H800 GPU hours 训练账本让这类报告开始具有系统审计价值，模型分数之外，训练经济性本身成为技术论点。

2025 年 1 月的两篇报告把焦点从 base model 转到 post-training。DeepSeek-R1 证明 strong base model 上的 outcome-based RL 可以诱导 long-CoT、反思、验证和策略切换。R1-Zero 从 V3-Base 出发，用 rule-based verifiable reward 和 GRPO 训练，AIME 2024 pass@1 从 15.6% 提升到 77.9%；R1 再用 cold-start SFT、两阶段 RL、rejection sampling、general SFT 和 safety/helpfulness reward model 把这种能力整理成更可读、更通用的产品形态。Kimi k1.5 在同一时间把问题推向更长上下文和更复杂任务：先用高难 prompt、可靠 verifier 和 long-CoT warmup 抬高可奖励轨迹的概率，再用 OMD-style policy optimization、sampled reward baseline、length penalty 和 curriculum 推动长推理策略，随后用 partial rollout 复用长轨迹 prefix，最后通过 model merging、shortest rejection sampling、DPO 和第二阶段 RL 做 long2short。这里的重点是把 RL 写成 prompt/reward、采样分布、rollout 系统和部署 token budget 的联合工程，单个 objective 只覆盖其中一层。

这一阶段最容易产生一个误解：只要 final-answer reward 足够可靠，推理能力就会自然增长。后续报告很快暴露了更具体的成本。长 CoT 会提高输出长度，rollout 会占据训练 wall-clock，代码 reward 依赖测试质量，工具轨迹会产生长尾，低概率 reflection token 会被 clipping 吃掉，训练 engine 和 inference engine 的 logprob 还可能不一致。于是从 2025 年中开始，国产模型报告逐渐把 RL objective、rollout infrastructure 和 serving kernel 写进同一张图里。

Qwen3 代表控制接口的系统化。它将 dense/MoE 模型族、thinking / non-thinking 双模式、thinking budget、36T token 多语预训练、四阶段后训练和 strong-to-weak distillation 组织在一起：Long-CoT cold start 先塑造 `<think>...</think>` 轨迹，Reasoning RL 用 3,995 个 query-verifier pairs 和 GRPO 强化可验证推理，Thinking Mode Fusion 用 `/think`、`/no_think` 和空 `<think></think>` block 把低延迟回答和长推理合入同一模型，General RL 再补 instruction following、format、agent、RAG 和偏好对齐。Qwen3-235B-A22B 负责开源旗舰，Qwen3-8B 等小模型通过 off-policy response distillation 和 on-policy logits KL distillation 获得 reasoning 能力。最值得关注的是 distillation vs RL 对照：同一 8B 起点上，on-policy distillation 报告 AIME'24 74.4、pass@64 93.3、GPU hours 1800；直接 RL 为 67.6、pass@64 90.0、GPU hours 17920。这里的转向很明确：reasoning 能力来自训练步数，也来自把大模型搜索到的分布更有效地转移给小模型。

MiniMax-M1 则沿另一条路径处理长输出成本。它把 Lightning Attention + MoE 作为长上下文和长输出底座，用 CISPO 修改 PPO/GRPO 类 token clipping 的学习信号。作者观察到 long-CoT 中的 `Wait`、`Recheck`、`However` 等 reflection token 往往初始概率低，更新后 ratio 高，容易被 token-level clipping 排除。CISPO 把 clipping 从 token update 转为 clipped importance weight，使这些 token 继续通过 log probability 提供梯度。这个报告的价值在于，它把 long-output reasoning RL 的问题写成架构效率、objective efficiency、reward/data curriculum 和 staged length expansion 的联合问题。

Kimi K2 进一步把重点从推理题移到 agentic workload。它是 1.04T total / 32B active 的 open-weight MoE，预训练侧用 MuonClip 稳定大规模训练：在 Muon 的矩阵更新上加入 weight decay、update RMS matching 和 QK-Clip，监控每个 attention head 的最大 QK logit，并在 optimizer step 后缩放 query/key projection weights，约束后续 forward 的 attention logit 范围。post-training 侧先构造 3000+ real MCP tools 和 20000+ synthetic tools，再生成 agents、tasks 和 simulator trajectories，用 tests、环境状态和规则过滤成功轨迹；RL 阶段把 Verifiable Rewards Gym、自评 rubric reward、Budget Control、PTX loss、temperature decay、checkpoint engine 和 partial rollout 接成闭环。K2 的强项集中在 software engineering 和 tool-use：SWE-bench Verified agentic single 65.8 / multi 71.6，Tau2 micro 66.1，ACEBench 76.5。这里模型报告描述的对象扩展为数据生成系统、工具模拟系统、reward 系统和训练/推理切换系统。

进入 2026 年，Kimi K2.5 和 GLM-5 把 agentic 能力继续向两个方向拉开。K2.5 建在 K2 之上，加入 MoonViT-3D、256K context、zero-vision SFT、visual RL、Token Efficient RL、DEP 和 Agent Swarm。它关心的任务范围从单轮文本和代码扩展到视觉理解、长视频、浏览搜索、OS 操作、并行 sub-agent orchestration。GLM-5 则把“agentic engineering”明确定义为从 vibe coding 到 autonomous engineering 的迁移：744B total / 40B active MoE、MLA、Muon Split、parameter-sharing MTP、DSA、200K context、slime 异步 RL、TITO、direct double-sided IS、DP-aware routing 和 PD disaggregation 共同服务长轨迹工具任务。

DeepSeek-V4 和 GLM-5.2 又把长上下文推到 million-token 级别。DeepSeek-V4 用 1.6T total / 49B active 的 V4-Pro 和 284B total / 13B active 的 V4-Flash 组成双模型路线，通过 CSA/HCA hybrid attention、mHC、Muon、deterministic kernels、heterogeneous KV cache、on-disk KV cache 和 OPD 处理 1M context 下的 FLOPs、KV cache、serving memory 和 post-training consistency。GLM-5.2 则把 1M context 明确落在 long-horizon coding agent 上，用 IndexShare / IndexCache 降低 DSA indexer 成本，用 MTP IndexShare + KVShare + rejection sampling + TV loss 提高 speculative decoding acceptance，用 slime 和 critic-based PPO 处理 compaction 后的超长轨迹训练，并把 anti-hack module 纳入 coding RL。

沿着时间线看，这些报告之间的差异很大，但压力方向高度一致。第一阶段处理“模型是否能被训练和服务”：MoE、MLA、KV cache、低精度、通信重叠。第二阶段处理“能力是否能被 RL 激发”：verifiable reward、long-CoT、GRPO、OMD、distillation、CISPO。第三阶段处理“能力是否能进入真实工作流”：工具环境、agentic data、rollout tail、checkpoint 切换、train-rollout consistency、长上下文 sparse attention、anti-hack。

到这个阶段，再用单一 benchmark 排序已经不够。一个模型在 AIME 上提高，可能来自 base prior、long-CoT token budget、verifier、RL 更新、distillation 或 sampling；一个模型在 SWE-bench 上提高，可能来自模型能力、agent scaffold、tool schema、测试环境、multi-attempt policy 或 internal verifier。国产技术报告最有价值的地方，恰好是它们把这些因素越来越多地公开写出来。真正需要追踪的也随之变化：哪些能力来自模型本体，哪些来自训练环境，哪些来自推理预算，哪些来自系统工程。

这条时间线最后留下的压力也更具体。未来的报告如果只给总分，会越来越难判断含金量；如果能同时给 base model 能力、post-training 数据、reward 设计、rollout policy、serving kernel、工具 harness、logprob consistency、anti-hack 和复现实验边界，它才真正提供可比较的技术信息。国产模型报告已经开始走到这一步，下一步的差别会更多体现在“系统闭环能否被外部审计”。

## 关键实验/定理

| 时间 | 报告 | 关键技术点 | 报告中最有用的证据 | 需要谨慎的地方 |
| --- | --- | --- | --- | --- |
| 2024-01 | [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) | fine-grained expert segmentation, shared expert isolation, 2B validation, 16B / 145B scaling | 2B controlled validation 优于 Hash Layer / Switch / GShard；16B 用约 40% FLOPs 接近 DeepSeek 7B / LLaMA2 7B | 16B 对 LLaMA2 受数据差异影响；145B 只训练 245B tokens |
| 2024-05 | DeepSeek-V2 | MLA latent KV + decoupled RoPE, [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) shared/routed experts, device-limited routing, 236B total / 21B active | 42.5% training cost saving, 93.3% KV cache reduction, 5.76x max generation throughput | baseline 是 2024 生态；长上下文主要由 NIAH 支撑 |
| 2024-12 | Qwen2.5 | 18T staged pretraining, open dense/API MoE family, SFT/DPO/GRPO, Qwen2.5-Math/Coder/QwQ, YaRN/DCA context extension | 72B-Instruct MATH 83.1, LiveCodeBench 55.5, RULER 128K 88.4 | API MoE、训练预算和 RL 细节公开有限；128K open-weight 与 1M Turbo 需要区分 |
| 2024-12 | DeepSeek-V3 | 671B total / 37B active, aux-loss-free bias routing, MTP, FP8 fine-grained scaling, DualPipe | 2.788M H800 GPU hours；MTP / FP8 / load balance proxy ablation | 成本表排除研发和消融；chat 对比受闭源 API 影响 |
| 2025-01 | DeepSeek-R1 | V3-Base 上的 outcome RL, GRPO, R1-Zero, distillation | R1-Zero AIME 2024 pass@1 15.6% -> 77.9%，cons@16 86.7% | 完整训练数据和内部框架未公开 |
| 2025-01 | Kimi k1.5 | 128K long-CoT RL, OMD-style update, length penalty, partial rollout, long2short | long-CoT MATH-500 96.2, AIME 77.5, LiveCodeBench 62.5 | 组件消融和系统收益多数依赖内部环境 |
| 2025-05 | Qwen3 | thinking/non-thinking, thinking budget, four-stage post-training, strong-to-weak logits distillation, Qwen3 MoE | Qwen3-8B distillation vs RL: 1800 GPU hours vs 17920 GPU hours，且 AIME 更高 | Qwen3 v1 和后续 2507 系列需要区分 |
| 2025-06 | MiniMax-M1 | Lightning Attention, long-output RL, CISPO, 1M context | CISPO 解释 clipping 下 reflection token 梯度丢失；M1-80K 长输出 recipe | CISPO 需要更多公开模型和 reward 设置复验 |
| 2025-07 | Kimi K2 | 1.04T MoE, MuonClip/QK-Clip, MCP/synthetic tools, Verifiable Rewards Gym, self-critique rubric, checkpoint engine | SWE-bench Verified agentic single 65.8 / multi 71.6；MuonClip 避免 logits 爆炸 | agentic harness、tool data 和 rubric reward 可复验性有限 |
| 2026-02 | Kimi K2.5 | MoonViT-3D, visual RL, Agent Swarm, 256K context | 将 K2 backbone 扩展到视觉、长视频、OS/browser/search 和并行 agent | swarm / visual agent 依赖复杂工具环境 |
| 2026-02 | GLM-5 | 744B-A40B, DSA, Muon Split, MTP, slime async RL | agentic engineering pipeline 与 200K context / async rollout / TITO 结合 | 内部 benchmark、reward 和 harness 占比较高 |
| 2026-04 | DeepSeek-V4 | 1M context, CSA/HCA, mHC, Muon, deterministic kernels, OPD | V4-Pro 1.6T / 49B active；V4-Flash 284B / 13B active；系统层覆盖 KV、kernel、sandbox | 预览报告，关键 ablation 尚不完整 |
| 2026-06 | GLM-5.2 | 1M long-horizon coding agent, IndexShare, KVShare, slime, anti-hack | 把 1M context、MTP、critic-based PPO、anti-hack 放入 release surface | release blog 粒度低于完整技术报告 |

## 局限

这份总览依赖本地已归档笔记和对应 primary source，覆盖范围偏向已经读过并沉淀的国产技术报告。很多报告是团队级 technical report 或 release blog，缺少公开 peer review、完整训练数据、多 seed、置信区间和第三方复现。跨模型比较也受到版本、prompt、sampling budget、tool harness、scaffold、judge、internal verifier 和安全策略影响。

时间线采用首次公开或提交时间，部分条目的当前阅读版本晚于首次提交，例如 Kimi K2 当前读 v2，DeepSeek-R1 当前读 v2 / Nature 相关版本，GLM-5.2 是 release blog。后续如果某家发布独立论文版本、代码复现、权重更新或 benchmark 修订，需要回到对应条目更新版本边界。

## Reference Intake Brief

### Target

- Intended target system: 新增国产模型技术报告时间线总览。
- Existing related assets: `papers-index.md`，[DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)、DeepSeek、Qwen、Kimi、MiniMax、GLM 系列独立笔记。
- Proposed form: 根目录 Markdown 综合条目，并在 archive index 中提供入口。

### Reusable Elements

1. 国产模型技术报告从 base model efficiency 到 reasoning RL，再到 agentic production system 的三阶段脉络。
2. DeepSeek / Qwen / Kimi / GLM / MiniMax 的组织级路线对照。
3. 后续阅读模型报告时的方法机制 / 继承关系 / baseline / harness / rollout / reward / serving 审计框架。

### Risks

- Copyright/over-copying: 只保留关键数值和路线判断。
- Unsourced or unverifiable claims: 只使用本地已归档 source 与 primary report 信息。
- Tone/brand mismatch: 保持技术归档语气，避免口号式排名。
- Safety/compliance issues: agentic / coding / tool-use 只记录评测、风险和系统边界，不展开可执行滥用细节。
- Overlap with existing assets: 单篇细节仍以独立笔记为准，此条目只负责时间线和跨报告脉络。

### Skipped

| Material | Reason |
| --- | --- |
| 全量榜单更新 | 需要实时检索并统一 harness，超出这篇时间线目标。 |
| 未归档国产报告 | 先基于本地已读材料生成；后续补读后可扩展。 |
| 逐作者 profile pass | 本条为综合文章，不新增个人作者判断。 |

### Recommendation

Decision: merge

Why: 这条时间线可以作为后续阅读国产模型技术报告的入口，把单篇报告中的架构、RL、系统和 agentic 线索串成一条可维护的地图。
