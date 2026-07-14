# 国产前沿模型技术报告时间线总览

First-Archived-At: 2026-06-23 18:40
Updated-At: 2026-07-14 10:19
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
- Local archive: [2606.13392 MiniMax Sparse Attention / MiniMax-M3](/papers/2606.13392-minimax-sparse-attention-m3/)
- Local archive: [2606.30406 MOPD / Xiaomi MiMo](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/)
- Related systems and method nodes: [2211.17192 Speculative Decoding](/papers/2211.17192-fast-inference-transformers-speculative-decoding/), [2512.02556 DeepSeek-V3.2 / DSA](/papers/2512.02556-deepseek-v3-2-open-large-language-models/), [2606.12370 Qwen Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/), [2602.06036 DFlash](/papers/2602.06036-dflash-block-diffusion-speculative-decoding/), [DSPARK-2026-06-27 DSpark](/papers/2026-06-27-dspark-confidence-scheduled-speculative-decoding/), [2511.14617 Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/), [2026-06-17 slime](/papers/2026-06-17-slime-rl-scaling-framework/), [2026-06-19 Muon 综合](/papers/2026-06-19-muon-optimizer-keller-jordan-synthesis/)

## 作者与关系

这条时间线主要由六个国产模型组织构成：DeepSeek-AI、Qwen Team / Alibaba、Kimi Team / Moonshot AI、MiniMax、GLM-5 Team / Z.ai / Zhipu AI / Tsinghua University、Xiaomi MiMo。它们的报告大多采用团队署名，作者列表按字母序或贡献组呈现，因此更适合按组织、技术路线和系统依赖建图，逐人关系只在跨论文重复出现且已核验的作者上保留。

DeepSeek 线从 [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) 的 fine-grained experts / shared experts 走向 V2 的 MLA + sparse FFN 合流，再走向 V3 的 FP8 / DualPipe / MTP，经过 R1 的 reasoning RL，随后用 DSA 与 V4 的 CSA/HCA hybrid attention、mHC、Muon、deterministic kernels 和 agent sandbox 汇合到 million-token context，并用 DSpark / DeepSpec 把 speculative decoding 推进到 DeepSeek-V4 production serving。Qwen 线从 Qwen2.5 的模型族和 reward / long-context 基座，走到 Qwen3 的 thinking control 与 strong-to-weak distillation，再由 Bebop 把 [speculative decoding](/papers/2211.17192-fast-inference-transformers-speculative-decoding/) 中 $1-\mathrm{TV}(p,q)$ 的接受率语言转成 MTP rollout 的 rejection sampling / TV loss recipe。Kimi 线从 k1.5 的 long-context RL recipe，走到 K2 的 open agentic intelligence，再到 K2.5 的 visual agentic intelligence，并由 Seer 解释 Moonshot 生态里同步 RL rollout 的系统压力。GLM 线从 GLM-5 的 agentic engineering 与 slime 异步 RL，走到 GLM-5.2 的 1M long-horizon coding agent，并在 IndexShare、KVShare、TV loss 和 anti-hack 上持续把 sparse attention、MTP 与 RL 闭环结合起来。MiniMax 线先用 M1 的 Lightning Attention 和 CISPO 处理长输出 RL 成本，再用 MiniMax-M3 / MSA 走向 1M context 的 native sparse softmax attention 与多模态/协作模型。Xiaomi MiMo 线在 [MOPD](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/) 中把多领域 RL teachers 的能力整合写成 student on-policy rollout、teacher prefill、reverse KL / policy-gradient advantage 和 top-k distillation 的 post-training recipe，并在 MiMo-V2-Flash 中给出部署证据。

## 一句话结论

国产前沿模型技术报告在 2024-2026 年的主线，可以读成一次连续的工程迁移：先用 MoE、MLA、长上下文和低精度训练把 frontier base model 做到可训练、可服务；随后用 verifiable reward、long-CoT、GRPO/OMD/CISPO 等方法把推理能力从模型先验里释放出来；再把 rollout、工具环境、checkpoint、sparse attention、MTP 和 anti-hack 写进训练闭环，使模型报告从 benchmark 展示转向 agentic production system 的公开拆解。

## 公司技术特色

几家公司的路线已经形成明显分工。它们都在做 MoE、长上下文、RL 和 agent，但最用力的位置不同：有的先压低 base model 训练和服务成本，有的先把 reasoning / agent data pipeline 做成产品能力，有的把长上下文当作架构问题，有的把它当作 coding agent 的系统问题。把这些差异放在一起看，比单看榜单更容易判断每份报告的技术含金量。

| 组织 | 最稳定的技术风格 | 代表性设计 | 当前强项 | 主要审计点 |
| --- | --- | --- | --- | --- |
| DeepSeek | 从底层架构、训练系统和推理系统一起压成本 | DeepSeekMoE、MLA、aux-loss-free routing、FP8、DualPipe、DSA、CSA/HCA、mHC、Muon、deterministic kernels、OPD、DSpark / DeepSpec | trillion-scale MoE、训练经济性、million-token context、train/inference consistency、production speculative serving | CSA/HCA/mHC/Muon 独立消融、V4 完整成本账本、1M context 真实工作流复验、DSpark 线上 telemetry 与 scheduler/kernel 公开度 |
| Qwen / Alibaba | 模型族工程 + 后训练 recipe + 开源生态落地 | Qwen2.5/Qwen3 模型族、thinking budget、strong-to-weak distillation、Bebop MTP rejection sampling / TV loss、SGLang/vLLM PR | release 覆盖面、distillation efficiency、agent/tool eval、RL rollout acceleration | API MoE 与主训练成本、Bebop 依赖 Qwen3.5/3.6/3.7 内部模型、acceptance 与硬件吞吐外部复验 |
| Moonshot / Kimi | long-context RL 到 agentic / visual agent 的数据和系统闭环 | k1.5 OMD-style RL、partial rollout、long2short、K2 tool synthesis、MuonClip、checkpoint engine、K2.5 visual RL / Agent Swarm、Seer grouped rollout | 长 CoT、多工具 agent、software engineering、visual agentic workload | tool harness 与 simulator 透明度、reward/rubric 可复验性、swarm 与 checkpoint 系统成本 |
| MiniMax | 长输出和长上下文的 attention / objective 协同优化 | M1 Lightning Attention + CISPO、M3 MSA、Index Branch、block sparse softmax、kernel co-design | long-output RL 成本、1M context sparse softmax、open-weight multimodal M3 | M3 428B 完整训练 recipe、MSA 在完整模型上的 ablation、H800/SM100 kernel 路线差异 |
| GLM / Z.ai | agentic engineering production stack | GLM-5 744B-A40B、DSA、slime、TITO、double-sided IS、GLM-5.2 IndexShare/KVShare、critic PPO、anti-hack | long-horizon coding agent、1M context serving、agentic RL infra、防 reward hacking | GLM-5.2 完整技术报告、anti-hack precision/recall、IndexShare/KVShare 质量损失、parallel OPD 细节 |
| Xiaomi MiMo | 多领域 teacher 能力整合 + agentic RL post-training | MiMo-V2-Flash、MOPD、same-origin RL teachers、teacher prefill、reverse KL / PG advantage、top-k distillation、large-scale code agent environments | multi-teacher capability integration、单模型吸收多个 domain RL teacher、MiMo series RL infrastructure | MOPD code / teacher service trace、MiMo-V2-Flash 完整训练账本、异源 teacher 失效边界、teacher RL 总成本 |

DeepSeek 的特色是把“能力增长”持续翻译成系统账本。V2 的 MLA 和 DeepSeekMoE 处理 KV cache 与 active compute，V3 的 FP8 / DualPipe / auxiliary-loss-free routing 处理训练吞吐和 MoE 稳定性，V4 的 CSA/HCA、heterogeneous KV cache、deterministic kernels 和 OPD 把百万上下文、低精度、post-training 和部署一致性放在一张图里。DSpark 继续补上 serving 侧的动态验证预算：DFlash parallel backbone 负责长候选块，低秩 Markov head 处理块内局部依赖，confidence scheduler 按请求置信度和 engine load 裁剪 target verification 长度。它的报告最值得追踪底层机制，因为很多后续国产路线都会复用或回应这些工程语言。

Qwen 的特色是把模型族、蒸馏和开源生态组织成可扩展发布面。Qwen2.5/Qwen3 把 dense/MoE、thinking/non-thinking、tool-use、math/code、long context 和小模型 distillation 放进统一 family；Bebop 又把 speculative decoding 的 $1-\mathrm{TV}(p,q)$ 接受率关系落成 MTP rollout recipe，并通过 SGLang/vLLM 进入推理引擎。它的优势是把研究点快速变成模型族和工具链选项，代价是内部模型版本、训练预算和 API MoE 细节常常需要额外追问。

Xiaomi MiMo 的特色是把多个领域 RL teacher 的能力整合拆成独立工程阶段。MOPD 先让 Math、IF、SWE 等 domain teachers 从同一 SFT checkpoint 分叉并各自做 RL，再让 student 在自己的 on-policy trajectory 上接受 teacher prefill 分布指导。这个设计把 teacher signal 放进 token-level reverse KL / policy-gradient advantage，保留每个 domain 独立调 recipe 的便利，也给 MiMo-V2-Flash 这种单一模型整合多 teacher 能力提供路径。它最需要复验的地方是 teacher prefill service 的真实成本、同源 teacher 条件和 MiMo-V2-Flash 完整训练账本。

Kimi 的特色是把长上下文 RL 直接推向真实 agent 任务。k1.5 关心长 CoT、partial rollout 和 long2short，K2 关心 MCP tool ecosystem、synthetic tool data、self-critique reward 和 checkpoint engine，K2.5 继续扩到视觉、浏览器、OS 和 Agent Swarm。它的路线经常把模型能力、工具环境、reward harness 和运行预算绑在一起看，适合观察“agentic capability”如何从单题推理扩展到长任务执行。

MiniMax 的特色是把长序列成本放在 attention 结构和 RL objective 两端同时处理。M1 用 Lightning Attention 支撑 long-output reasoning，再用 CISPO 修正 token-level clipping 对 reflection token 的学习信号；M3/MSA 则保留 softmax attention 语义，用 GQA-group block selection、Index Branch、KL alignment 和 kernel co-design 让 1M context 稀疏化。它更像“序列效率实验室”：一边试 hybrid / linear attention，一边试 native sparse softmax，重点是把长输出和长上下文变成可训练、可服务的成本曲线。

GLM 的特色是把 agentic engineering 写成 production stack。GLM-5 把 744B-A40B MoE、DSA、MTP、slime、TITO 和 double-sided IS 合在一起，GLM-5.2 又把 1M context、IndexShare、KVShare、Bebop-style TV loss、critic PPO 和 anti-hack module 放到 coding agent release 里。它的技术重点常常落在“训练闭环是否能在长轨迹工具任务中稳定运行”：rollout 服务、compaction、OPD、反作弊、train-rollout consistency 都比单个 benchmark 更重要。

## 论文脉络

如果只看单篇报告的排行榜，国产模型技术路线很容易被读成一串分数刷新。MMLU、AIME、LiveCodeBench、SWE-bench、RULER、TAU-bench 都在表格里发光，但真正的变化藏在表格下面：每一代报告都在回答同一个更硬的问题，怎样把更长的上下文、更稀疏的参数、更长的推理、更复杂的工具环境放进一个可训练、可推理、可复现调试的系统。

DeepSeek 线的起点可以前移到 2024 年 1 月的 [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)。这篇 ACL 论文先把 MoE 的效率问题拆成专家专门化问题：fine-grained expert segmentation 把 full-size FFN expert 切成更多 smaller experts，并同步增加激活专家数，使 total / active compute 大致守恒；shared expert isolation 用固定激活的 shared experts 承载通用知识，让 routed experts 更集中地学习差异化模式。2B controlled validation 说明它优于 Hash Layer / Switch / GShard，16B / 145B 实验把这条 sparse FFN 路线推到可扩展模型设置。

到 2024 年 5 月，DeepSeek-V2 把服务成本中的两个瓶颈拆开：attention 侧用 MLA 将每个 token 的 KV 压成 latent KV，并用 decoupled RoPE 单独保存位置分支，使低秩 KV 压缩和 RoPE 位置能力可以同时存在；FFN 侧用 [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) 的 shared/routed experts 扩大 total capacity，再用 device-limited routing、expert/device/communication balance losses 和训练期 token dropping 控制专家负载与跨设备通信。论文报告相对 DeepSeek 67B 节省 42.5% 训练成本、减少 93.3% KV cache、最大生成吞吐提升到 5.76 倍。这里出现了后续多篇技术报告反复继承的底层判断：开放模型要继续放大，能力、显存、通信、推理吞吐必须同时进入模型设计。

到 2024 年 12 月，Qwen2.5 和 DeepSeek-V3 代表两种扩展方式。Qwen2.5 是模型族工程：open-weight dense family、proprietary API MoE、18T token 分阶段数据 mixture、151K BBPE tokenizer、SFT/DPO/GRPO/offline-online RL、Qwen2.5-Math/Coder/QwQ 和长上下文扩展放在同一条发布线里。它需要区分 128K open-weight context 与 Turbo / Qwen2.5-1M 的 1M context，后者依赖 progressive context expansion、YaRN 和 DCA。DeepSeek-V3 沿 V2 的 MLA / [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) 系统线继续放大到 671B total / 37B active：auxiliary-loss-free balance 用 expert bias 影响 top-K routing，减少辅助损失梯度对专家专门化的干扰；MTP 在主 next-token loss 之外增加未来 token 预测信号；DualPipe 把 pipeline communication 和 MoE all-to-all 放进计算间隙；FP8 用 fine-grained scaling 和高精度 accumulation 降低训练成本。V3 的 2.788M H800 GPU hours 训练账本让这类报告开始具有系统审计价值，模型分数之外，训练经济性本身成为技术论点。

2025 年 1 月的两篇报告把焦点从 base model 转到 post-training。DeepSeek-R1 证明 strong base model 上的 outcome-based RL 可以诱导 long-CoT、反思、验证和策略切换。R1-Zero 从 V3-Base 出发，用 rule-based verifiable reward 和 GRPO 训练，AIME 2024 pass@1 从 15.6% 提升到 77.9%；R1 再用 cold-start SFT、两阶段 RL、rejection sampling、general SFT 和 safety/helpfulness reward model 把这种能力整理成更可读、更通用的产品形态。Kimi k1.5 在同一时间把问题推向更长上下文和更复杂任务：先用高难 prompt、可靠 verifier 和 long-CoT warmup 抬高可奖励轨迹的概率，再用 OMD-style policy optimization、sampled reward baseline、length penalty 和 curriculum 推动长推理策略，随后用 partial rollout 复用长轨迹 prefix，最后通过 model merging、shortest rejection sampling、DPO 和第二阶段 RL 做 long2short。这里的重点是把 RL 写成 prompt/reward、采样分布、rollout 系统和部署 token budget 的联合工程，单个 objective 只覆盖其中一层。

这一阶段最容易产生一个误解：只要 final-answer reward 足够可靠，推理能力就会自然增长。后续报告很快暴露了更具体的成本。长 CoT 会提高输出长度，rollout 会占据训练 wall-clock，代码 reward 依赖测试质量，工具轨迹会产生长尾，低概率 reflection token 会被 clipping 吃掉，训练 engine 和 inference engine 的 logprob 还可能不一致。于是从 2025 年中开始，国产模型报告逐渐把 RL objective、rollout infrastructure 和 serving kernel 写进同一张图里。

Qwen3 代表控制接口的系统化。它将 dense/MoE 模型族、thinking / non-thinking 双模式、thinking budget、36T token 多语预训练、四阶段后训练和 strong-to-weak distillation 组织在一起：Long-CoT cold start 先塑造 `<think>...</think>` 轨迹，Reasoning RL 用 3,995 个 query-verifier pairs 和 GRPO 强化可验证推理，Thinking Mode Fusion 用 `/think`、`/no_think` 和空 `<think></think>` block 把低延迟回答和长推理合入同一模型，General RL 再补 instruction following、format、agent、RAG 和偏好对齐。Qwen3-235B-A22B 负责开源旗舰，Qwen3-8B 等小模型通过 off-policy response distillation 和 on-policy logits KL distillation 获得 reasoning 能力。最值得关注的是 distillation vs RL 对照：同一 8B 起点上，on-policy distillation 报告 AIME'24 74.4、pass@64 93.3、GPU hours 1800；直接 RL 为 67.6、pass@64 90.0、GPU hours 17920。这里的转向很明确：reasoning 能力来自训练步数，也来自把大模型搜索到的分布更有效地转移给小模型。

Qwen/Bebop 把另一个瓶颈指向 rollout 生成成本。原始 [speculative decoding](/papers/2211.17192-fast-inference-transformers-speculative-decoding/) 已经证明，draft 分布 $q$ 的样本可以按 $\min(1,p/q)$ 被 target 分布 $p$ 概率接受，失败时从 residual distribution 采样，最终输出分布仍保持为 $p$，期望接受率等于 $1-\mathrm{TV}(p,q)$。Bebop 把这条公式放进 Qwen 内部 RL rollout：MTP acceptance degradation 主要来自 policy entropy fluctuation，target-only verification 会受 top-1 约束，rejection sampling 和 end-to-end TV loss 能把训练目标对准 distribution overlap。它报告 Qwen3.5-35A3B mixed RFT data、global batch size 256、sequence length 256K、冻结 backbone 训练 5-step MTP，并在 async RL 中给出 `1.5-1.8x` per-step latency reduction。这个节点让“speculative decoding”从 serving trick 变成 post-training 吞吐 recipe。

MiniMax-M1 则沿另一条路径处理长输出成本。它把 Lightning Attention + MoE 作为长上下文和长输出底座，用 CISPO 修改 PPO/GRPO 类 token clipping 的学习信号。作者观察到 long-CoT 中的 `Wait`、`Recheck`、`However` 等 reflection token 往往初始概率低，更新后 ratio 高，容易被 token-level clipping 排除。CISPO 把 clipping 从 token update 转为 clipped importance weight，使这些 token 继续通过 log probability 提供梯度。这个报告的价值在于，它把 long-output reasoning RL 的问题写成架构效率、objective efficiency、reward/data curriculum 和 staged length expansion 的联合问题。

MiniMax-M3 / MSA 则说明 MiniMax 并未只沿 Lightning / linear attention 一条路走。MSA 在 GQA 上加 Index Branch，为每个 query token 和 GQA group 选择少量 KV blocks，再由 Main Branch 对选中 blocks 做精确 softmax attention；Index Branch 用 KL loss 对齐 Main Branch teacher，并配合 gradient detach、40B token indexer warmup 和 local block 稳定训练。109B / 6B active MoE 实验中，Full baseline 和 MSA-PT 都使用 3T tokens，MSA-CPT 从 2.6T full-attention checkpoint 继续 400B tokens；1M context 下报告 28.4x attention FLOPs reduction、14.2x prefill 和 7.6x decode wall-clock speedup。M3 model card 进一步给出 428B total / 23B active、1M context、native multimodality，但完整 428B training recipe 仍待更细报告。

Kimi K2 进一步把重点从推理题移到 agentic workload。它是 1.04T total / 32B active 的 open-weight MoE，预训练侧用 MuonClip 稳定大规模训练：在 Muon 的矩阵更新上加入 weight decay、update RMS matching 和 QK-Clip，监控每个 attention head 的最大 QK logit，并在 optimizer step 后缩放 query/key projection weights，约束后续 forward 的 attention logit 范围。post-training 侧先构造 3000+ real MCP tools 和 20000+ synthetic tools，再生成 agents、tasks 和 simulator trajectories，用 tests、环境状态和规则过滤成功轨迹；RL 阶段把 Verifiable Rewards Gym、自评 rubric reward、Budget Control、PTX loss、temperature decay、checkpoint engine 和 partial rollout 接成闭环。K2 的强项集中在 software engineering 和 tool-use：SWE-bench Verified agentic single 65.8 / multi 71.6，Tau2 micro 66.1，ACEBench 76.5。这里模型报告描述的对象扩展为数据生成系统、工具模拟系统、reward 系统和训练/推理切换系统。

进入 2026 年，Kimi K2.5 和 GLM-5 把 agentic 能力继续向两个方向拉开。K2.5 建在 K2 之上，加入 MoonViT-3D、256K context、zero-vision SFT、visual RL、Token Efficient RL、DEP 和 Agent Swarm。它关心的任务范围从单轮文本和代码扩展到视觉理解、长视频、浏览搜索、OS 操作、并行 sub-agent orchestration。GLM-5 则把“agentic engineering”明确定义为从 vibe coding 到 autonomous engineering 的迁移：744B total / 40B active MoE、MLA、Muon Split、parameter-sharing MTP、DSA、200K context、slime 异步 RL、TITO、direct double-sided IS、DP-aware routing 和 PD disaggregation 共同服务长轨迹工具任务。

DeepSeek-V4 和 GLM-5.2 又把长上下文推到 million-token 级别。DeepSeek 先用 V3.2-Exp / DSA 将 MLA path 改成 lightning indexer + top-k sparse selection，并用 2.1B token dense indexer warm-up 与 943.7B token sparse continued pre-training 建立长上下文稀疏化路线；V4 再把 DSA 推到 compressed KV entries 上，形成 CSA/HCA hybrid attention。V4-Pro 用 1.6T total / 49B active，V4-Flash 用 284B total / 13B active；公开 inference config 显示 CSA `compress_ratio=4` 与 HCA `compress_ratio=128` 在层级上交错，所有 compressed attention 层叠加 128-token sliding-window local branch。它还把 expert waves 写进 MegaMoE：把 experts 切成 wave 后，当前 wave 做 expert compute，下一 wave 做 token transfer，上一 wave 发送 combine 结果，报告给出相对 non-fused EP `1.50-1.73x` 加速，latency-sensitive / RL rollout 场景最高 `1.96x`。DSpark 则把 V4 serving 的下一层瓶颈指向 speculative verification：在 DeepSeek-V4-Flash / Pro live traffic 中，confidence-scheduled prefix verification 让低负载请求使用更长验证预算，高负载请求收缩低置信后缀，从而把 accepted length 结论推进到 throughput-interactivity frontier。GLM-5.2 则把 1M context 明确落在 long-horizon coding agent 上，用 IndexShare / [IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/) 降低 DSA indexer 成本，用 MTP IndexShare + KVShare + rejection sampling + TV loss 提高 speculative decoding acceptance，用 slime 和 critic-based PPO 处理 compaction 后的超长轨迹训练，并把 anti-hack module 纳入 coding RL。

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
| 2025-09 | [V3.2-Exp / DSA precursor](/papers/2512.02556-deepseek-v3-2-open-large-language-models/) | DeepSeek Sparse Attention, lightning indexer, fine-grained top-k token selection, sparse continued pretraining | 2.1B token dense indexer warm-up + 943.7B token sparse continued pre-training；H800 long-context inference cost 降低 | 2025-12 正式归档为 arXiv `2512.02556`；indexer 质量、top-k 召回和任务损失仍需更多公开 stress test |
| 2026-02 | Kimi K2.5 | MoonViT-3D, visual RL, Agent Swarm, 256K context | 将 K2 backbone 扩展到视觉、长视频、OS/browser/search 和并行 agent | swarm / visual agent 依赖复杂工具环境 |
| 2026-02 | GLM-5 | 744B-A40B, DSA, Muon Split, MTP, slime async RL | agentic engineering pipeline 与 200K context / async rollout / TITO 结合 | 内部 benchmark、reward 和 harness 占比较高 |
| 2026-04 | DeepSeek-V4 | 1M context, CSA/HCA interleaving, mHC, Muon, deterministic kernels, OPD, MegaMoE expert waves | V4-Pro 1.6T / 49B active；V4-Flash 284B / 13B active；expert waves 对 non-fused EP `1.50-1.73x`，latency-sensitive 最高 `1.96x` | 预览报告，CSA/HCA/mHC/Muon/expert waves 的独立 ablation 尚不完整 |
| 2026-06 | GLM-5.2 | 1M long-horizon coding agent, IndexShare, KVShare, slime, anti-hack | 把 1M context、MTP、critic-based PPO、anti-hack 放入 release surface | release blog 粒度低于完整技术报告 |
| 2026-06 | [2606.12370 Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/) | MTP rejection sampling, TV loss, RL rollout acceleration, entropy-acceptance bound | Qwen3.5-35A3B mixed RFT data，global batch size 256，sequence length 256K；MTP + RS 带来 `1.5-1.8x` per-step RL latency reduction | 依赖 Qwen 内部模型/系统；TV coverage 超出 pre-RL entropy range 时仍需复验 |
| 2026-06 | [DSpark](/papers/2026-06-27-dspark-confidence-scheduled-speculative-decoding/) | semi-autoregressive drafter, DFlash backbone, Markov head, calibrated confidence head, hardware-aware prefix scheduler, DeepSpec | DeepSeek-V4-Flash 在 80 tok/s/user SLA 下 throughput 高于 MTP-1 51%；DeepSeek-V4-Pro 在 35 tok/s/user SLA 下高 52%；公开 DSpark checkpoints 和 DeepSpec 训练框架 | 线上 telemetry、capacity table、traffic mix、V4 DSpark 训练数据和 kernel 细节未公开；未发现 DSpark 独立 arXiv / OpenReview |
| 2026-06 | [MiniMax-M3 / MSA](/papers/2606.13392-minimax-sparse-attention-m3/) | GQA block sparse attention, Index Branch, KL alignment, 1M context, native multimodality | 109B MoE 3T token 对照；MSA-CPT 400B；1M context 下 28.4x attention FLOPs reduction、14.2x prefill、7.6x decode | 完整 M3 428B training recipe、MSA full-model ablation 和 kernel 路线仍待补 |
| 2026-06 | [2606.30406 MOPD](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/) | multi-teacher on-policy distillation, reverse KL, PG advantage, top-k distillation, same-origin teachers, MiMo-V2-Flash | Qwen3-30B-A3B controlled study 中 MOPD normalized score 0.9373，高于 Mix-RL 0.8818；MiMo-V2-Flash 多项 benchmark 达到或超过 RL teacher | 强外部 teacher 实验显示 distribution mismatch 会退化；teacher prefill overhead、GPU hours 和完整 MiMo training recipe 未公开 |

### 训练配置披露审计

| 报告 | 训练数据 / 阶段 | 硬件与并行公开度 | 训练时间 / 成本公开度 | 当前归档判断 |
| --- | --- | --- | --- | --- |
| DeepSeek-V2 | 8.1T pretraining tokens；long-context 1000 steps；SFT 1.5M instances | H800 cluster；16-way zero-bubble PP；8-way EP；ZeRO-1；不使用 TP | 每 1T tokens 172.8K H800 GPU hours；完整 GPU 数、wall-clock 和美元成本未披露 | 训练效率信息较强，完整成本账本不足 |
| Qwen2.5 | 18T pretraining tokens；SFT / DPO / GRPO；Turbo progressive context expansion | 训练硬件、并行方式和 API MoE 规格未完整公开 | GPU hours、wall-clock、美元成本未披露 | 模型族报告强，成本复查弱 |
| DeepSeek-V3 | 14.8T pretraining；YaRN context extension；SFT + RM + GRPO | 2048 H800；16-way PP；64-way EP spanning 8 nodes；ZeRO-1 DP | total 2.788M H800 GPU hours；5.576M USD；成本排除研发和消融 | 当前样本中训练账本最完整 |
| DeepSeek-R1 | R1-Zero 10,400 steps；max length 32,768 -> 65,536；R1 多阶段 SFT/RL/distillation | vLLM rollout、DualPipe、跨节点 EP、MTP 等系统模块公开；具体硬件/并行度未完整公开 | GPU hours、wall-clock、美元成本未披露 | RL recipe 细，资源账本不足 |
| Kimi k1.5 | long-CoT warmup、OMD-style RL、partial rollout、long2short | Megatron + vLLM + Mooncake/RDMA；集群规模未披露 | GPU hours、wall-clock、美元成本未披露 | recipe 价值高，成本审计弱 |
| Qwen3 | 36T tokens；S1 >30T、S2 ~5T、S3 数千亿 long-context tokens | 训练硬件和并行方式未完整公开 | distillation vs RL 报告 1,800 vs 17,920 GPU hours；主训练成本未披露 | distillation 对照强，主训练账本弱 |
| MOPD / MiMo-V2-Flash | Qwen3-30B-A3B controlled study 使用同 SFT checkpoint、Math/IF/SWE domain RL teachers；MiMo-V2-Flash README 披露 27T pretraining、MOPD 和 large-scale agentic RL | teacher prefill service 异步化方向公开；训练硬件、teacher serving topology、GPU 数、并行方式未完整公开 | MOPD Stage 3 成本、teacher RL 总成本、GPU hours、wall-clock 和美元成本未披露 | multi-teacher integration 机制强，完整成本账本和系统 trace 待补 |
| Qwen Bebop | Qwen3.5-35A3B mixed RFT data；global batch size 256；sequence length 256K；冻结 backbone 训练 5-step MTP，评估 $\gamma=3$ | SGLang / vLLM MTP implementation 相关；训练硬件和并行方式未完整公开 | 报告 `1.5-1.8x` per-step RL latency reduction；GPU hours、wall-clock、美元成本未披露 | MTP/TV recipe 强，资源账本和外部复验不足 |
| MiniMax-M1 | 7.5T continual pretraining；1M context extension；40K -> 80K RL | 训练硬件和并行方式未完整公开 | GPU hours、wall-clock、美元成本未披露 | long-output RL recipe 强，资源账本不足 |
| Kimi K2 | 15.5T pretraining；400B at 4K + 60B at 32K annealing | H800 cluster；PP16；EP16；ZeRO-1；FP8 activations；CPU offload | 完整 GPU 数、wall-clock、GPU hours、美元成本未披露 | 系统配置较清楚，成本账本不足 |
| Kimi K2.5 | text/vision joint pretraining、long-context mid-training、visual / agentic RL | DEP、LLM Gateway、100,000 concurrent agent tasks；集群规模未披露 | GPU hours、wall-clock、美元成本未披露 | multimodal/agentic 系统强，训练资源弱 |
| GLM-5 | 28.5T pretraining + mid-training；32K / 128K / 200K 三段 | Megatron-LM / SGLang / slime；PD disaggregation、DP attention、FP8 rollout；具体 GPU 数未披露 | GPU hours、wall-clock、美元成本未披露 | pipeline 细，成本账本不足 |
| DeepSeek-V3.2-Exp / DSA | 从 128K DeepSeek-V3.1-Terminus checkpoint 出发；2.1B token dense indexer warm-up；943.7B token sparse continued pre-training | H800 long-context inference cost 被重点报告；训练集群、并行方式和 GPU 数未完整公开 | GPU hours、wall-clock、美元成本未披露 | DSA 机制和成本方向清楚，训练资源账本不足 |
| DeepSeek-V4 | Flash 32T；Pro 33T；4K -> 16K -> 64K -> 1M | 关键 kernel / CP / deterministic infra 公开；训练集群和并行度未完整公开 | GPU hours、wall-clock、美元成本未披露 | 预览报告，资源账本待补 |
| DSpark | Open-PerfectBlend 1.3M samples public path；Qwen3 / Gemma draft training；DeepSeek-V4 DSpark 训练数据未完整披露 | DeepSpec 默认单节点 8 GPUs；public config 含 block size 7、5 draft layers、target feature layers、Markov rank；V4 线上使用 ZOS、CUDA graph replay 和 sparse attention kernels | V4 DSpark 总 GPU hours、wall-clock、训练成本未披露；线上 telemetry 无原始数据 | serving module 证据强，跨 engine / 跨硬件迁移需要重新 profiling |
| GLM-5.2 | release blog 未公开完整 pretraining；parallel OPD 约两天 | serving / slime / OPD 机制公开；训练硬件和并行方式未完整公开 | pretraining GPU hours、wall-clock、美元成本未披露 | release 级信息，等待完整技术报告 |
| MiniMax-M3 / MSA | 109B 实验 3T tokens；MSA-CPT 400B；long-context 140B；M3 428B 完整训练未展开 | 109B 效率实验报告 H800；开源 repo 主要面向 SM100 | M3 完整 GPU hours、wall-clock、美元成本未披露 | MSA 机制强，M3 训练账本待补 |

## 证据链强度评估

### 强证据

- 时间线逐条连接到已归档论文或技术报告，材料来源以 primary source 为主。
- MoE、MLA/稀疏注意力、长上下文、RLVR、MTP、agentic RL 和 serving 优化在多家公司报告中重复出现，支撑“工程迁移”主线。
- 训练配置披露审计把数据、硬件、并行、成本和未披露项分开，便于比较公开透明度。

### 中等强度证据

- 跨公司归纳依赖公开报告的粒度，报告写法、benchmark、prompt、sampling budget 和 harness 不完全一致。
- 部分条目来自 release blog 或 preview report，证据强度低于完整 technical report。

### 需要谨慎的推论

- 该时间线覆盖本地已归档材料，不能代表国产模型生态的完整样本。
- 跨模型性能比较受版本、工具环境、judge、internal verifier 和安全策略影响，适合看趋势，不适合直接排定模型强弱。

## 主要启发

- 国产前沿模型报告的重心已经从单一 benchmark 展示扩展到训练系统、serving 系统、agentic harness 和成本账本。
- 评估模型报告质量时，需要把能力分数、训练披露、系统可复验性和安全/anti-hack 机制分开记录。
- 后续新增国模论文时，应同步更新时间线、公司技术特色、跨论文关系和未披露项，避免索引只积累条目名。

## OpenReview / 审稿意见吸收

- Venue status: 当前档案未记录公开 peer-review 状态。
- Public reviews: 当前档案未记录可可靠匹配的 OpenReview / ARR / 会议 reviewer comments。
- Ratings / confidence: 无公开评分可用于校准。
- Reviewer consensus: 暂无。
- Main criticisms: 暂无公开 reviewer 质疑可引用；可信度主要由论文、技术报告、项目证据和本地一致性检查决定。
- Author response: 暂无公开 rebuttal 记录。
- 对本文可信度的影响: 按未完成公开审稿吸收处理，结论需要依赖实验设置、baseline 强度、复现证据和跨论文一致性校准。

## 局限

这份总览依赖本地已归档笔记和对应 primary source，覆盖范围偏向已经读过并沉淀的国产技术报告。很多报告是团队级 technical report 或 release blog，缺少公开 peer review、完整训练数据、多 seed、置信区间和第三方复现。跨模型比较也受到版本、prompt、sampling budget、tool harness、scaffold、judge、internal verifier 和安全策略影响。

时间线采用首次公开或提交时间，部分条目的当前阅读版本晚于首次提交，例如 Kimi K2 当前读 v2，DeepSeek-R1 当前读 v2 / Nature 相关版本，GLM-5.2 是 release blog。后续如果某家发布独立论文版本、代码复现、权重更新或 benchmark 修订，需要回到对应条目更新版本边界。

## 跨论文关系

- 本文是国产模型报告的综合导航节点；DeepSeek 主线由 [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)、[DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)、[DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/)、[DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/) 和 [DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 连接 MoE / MLA、reasoning RL 与 million-token system。
- [Qwen2.5](/papers/2412.15115-qwen2-5-technical-report/) / [Qwen3](/papers/2505.09388-qwen3-technical-report/)、[Kimi k1.5](/papers/2501.12599-kimi-k1-5-scaling-rl-llms/) / [Kimi K2](/papers/2507.20534-kimi-k2-open-agentic-intelligence/) / [Kimi K2.5](/papers/2602.02276-kimi-k2-5-visual-agentic-intelligence/)、[GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) / [GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/) 和 [MiniMax-M1](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) / [MiniMax-M3](/papers/2606.13392-minimax-sparse-attention-m3/) 构成跨公司对照，比较重点集中在 reasoning、agentic workload、长上下文和公开训练账本。
- [MOPD](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/)、[Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/) 和 [DSpark](/papers/2026-06-27-dspark-confidence-scheduled-speculative-decoding/) 将时间线中的 teacher-signal integration、MTP 与 speculative decoding 分别落实为独立方法节点，适合用于核对模型报告中的简写主张。

## Reference Intake Brief

### Target

- Intended target system: 新增国产模型技术报告时间线总览。
- Existing related assets: `content/utility/papers-index.md`，[DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)、DeepSeek、Qwen、Kimi、MiniMax、GLM、Xiaomi MiMo / MOPD 系列独立笔记。
- Proposed form: 根目录 Markdown 综合条目，并在 archive index 中提供入口。

### Reusable Elements

1. 国产模型技术报告从 base model efficiency 到 reasoning RL，再到 agentic production system 的三阶段脉络。
2. DeepSeek / Qwen / Kimi / GLM / MiniMax / Xiaomi MiMo 的组织级路线对照。
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

### Recommendation

Decision: merge

Why: 这条时间线可以作为后续阅读国产模型技术报告的入口，把单篇报告中的架构、RL、系统和 agentic 线索串成一条可维护的地图。
