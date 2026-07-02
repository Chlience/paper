# Self-Improving Agents in the Era of Experience: A Survey of Self- to Meta-Evolution 论文笔记

First-Archived-At: 2026-06-28 14:18
Updated-At: 2026-06-28 14:18

## Source

- Title: Self-Improving Agents in the Era of Experience: A Survey of Self- to Meta-Evolution
- OpenReview: [https://openreview.net/forum?id=IUltZSgLMm](https://openreview.net/forum?id=IUltZSgLMm)
- PDF: [OpenReview PDF](https://openreview.net/pdf?id=IUltZSgLMm)；[GitHub PDF](https://github.com/FrontisAI/Awesome-Self-Improving-Agents/blob/main/Self_Improving_Agents.pdf)
- Code/Project: [FrontisAI/Awesome-Self-Improving-Agents](https://github.com/FrontisAI/Awesome-Self-Improving-Agents)；[project website](https://frontisai.github.io/Awesome-Self-Improving-Agents/)
- OpenReview / Review page: OpenReview Archive direct upload；API metadata 显示 `replyCount = 0`，未发现公开 reviewer comments 或 rebuttal。
- Authors: Che Jiang, Jincheng Zhong, Yu Fu, Kai Tian, Junlin Yang, Kaikai Zhao, Yuchong Wang, Tianwei Luo, Weizhi Wang, Yuxin Zuo, Guoli Jia, Xingtai Lv, Dianqiao Lei, Sihang Zeng, Yuru Wang, Zhenzhao Yuan, Xinwei Long, Ermo Hua, Can Ren, Xin Jiang, Shulei Xie, Yuanchun Zheng, Youbang Sun, Biqing Qi, Ning Ding, Kaiyan Zhang, Bowen Zhou.
- Submitted: OpenReview `pdate` 2026-06-24 16:00 UTC；`cdate` 2026-06-25 08:57 UTC；version 2；license `CC BY 4.0`。
- Current version read: PDF title page date 2026-06-25；PDF parser reports 88 pages and LaTeX/pdfTeX generated PDF.
- Subjects: self-improving agents, Era of Experience, harness agent, runtime adaptation, skills, memory, executable environment, agent RL, continual learning, meta-evolution, longitudinal evaluation, safety governance.

## 作者与关系

- Che Jiang: Tsinghua University / Horizon Research, Frontis.AI；project lead and core contributor。OpenReview profile `~Che_Jiang1` records Tsinghua PhD student, Bowen Zhou as PhD advisor, Google Scholar and DBLP links.
- Jincheng Zhong, Yu Fu, Kai Tian, Junlin Yang, Kaikai Zhao, Yuchong Wang, Tianwei Luo: core contributors on title page.
- [Ning Ding](/authors/ning-ding/): corresponding author；Tsinghua University / Shanghai AI Laboratory / THU-C3I profile in local archive；recurring RLVR and reasoning intelligence author.
- [Kaiyan Zhang](/authors/kaiyan-zhang/): project lead and corresponding author；OpenReview profile records Frontis.AI principal researcher from 2026 and Tsinghua PhD background；homepage links GitHub `iseesaw`, Google Scholar and X `OkhayIea`.
- [Bowen Zhou](/authors/bowen-zhou/): corresponding author；Tsinghua University / Shanghai AI Laboratory / TsinghuaC3I profile in local archive；advisor relation appears in Che Jiang and Kaiyan Zhang OpenReview profiles.

## 一句话结论

这篇 survey 把 self-improving agents 从模型自我训练扩展为部署后 runtime system 的 trace-to-capability 问题：harness 将交互 trace 编译成可验证 experience，再分别写入 skills、memory、environment/tool boundary、model parameters 或 meta-layer。它的主要贡献是给 self-improvement 提供系统分层、评测目标和安全攻击面语言；主要边界是综述性 taxonomy 强，实证证据和 benchmark protocol 依赖被引用工作。

## 阅读目标与判断边界

本笔记关注：

1. 这篇 survey 如何定义 self-improving agent，以及它如何把 model、harness、user side、environment side 放入同一对象。
2. skills、memory、environment、parameter update、meta-evolution 五类 adaptation surface 的边界。
3. evaluation 和 safety 部分给后续 agent RL / tool-use / coding-agent 论文带来的可复用指标。

判断边界：

- 这是一篇 survey 和 taxonomy 论文，没有新模型训练结果或统一 benchmark leaderboard。
- PDF / OpenReview 版本是 2026-06-25 附近的早期公开版本；README 仍有 “Survey coming soon” 类状态语义，项目材料可能继续更新。
- 本文保留安全机制、风险面和防御启发，省略可直接复现攻击链的操作细节。

## 论文脉络

### 1. 研究问题、背景和价值

论文的核心问题是：部署后的 agentic AI 如何把交互经验转化为稳定能力。作者把这一问题称为 trace-to-capability problem，完整链路包括 capture experience、assign to update surface、verify value、preserve control。

在这个定义下，agent 的能力来源不只来自 base model 参数。agent 运行时的 harness 会捕获 action trace、tool result、failure case、user preference、workflow artifact 和 verifier feedback。经验可以被写成 skill，也可以进入 memory，或者改变 tool/environment boundary，达到一定稳定性后进入 model training data 或 meta-controller。

这个视角的价值在于把近期几个分散方向放入同一语言中：coding agent 的 skill file、persistent memory、tool protocol、agent RL、continual learning、post-deployment update、meta-agent orchestration 和 safety governance 都变成 self-improvement 的不同更新面。

### 2. 已有解决方案与不足

论文把已有 agent 系统分成三代：

1. Task-bounded loops：WebGPT、SayCan、ReAct、Reflexion 等系统以单次任务或短 episode 为主，状态主要留在当前上下文或局部反思中。
2. Persistent / reusable runtimes：Voyager、MetaGPT、AutoGen、LangGraph、SWE-agent、OpenHands 等系统引入长期 artifacts、skills、workflow 和 tool state，但多数更新机制仍由人设计。
3. Productized / self-evolving runtimes：Claude Code、Codex、Cursor、OpenClaw、Hermes Agent 等系统把已部署 harness 自身变成工程对象，runtime trace 可以反向影响 skill、memory、tooling 和训练过程。

已有文献的问题是粒度分散。skill papers 关注程序化复用，memory papers 关注持久状态，environment/tool papers 关注交互边界，RL/continual learning papers 关注参数巩固，safety papers 关注新攻击面。survey 的目标是建立一套统一对象和更新路径。

### 3. 作者可能的思考路径

作者可能从一个工程观察出发：现代 coding / research / tool-use agent 的提升常常先发生在 harness 侧。开发者先沉淀 prompt、skill、memory、script、tool schema、verifier 和 workflow，再把高频成功路径或失败修正转化为训练数据。于是 self-improvement 的第一性对象应是“部署系统随经验变化的全过程”，随后才是参数更新。

这个想法自然引出 fast path 和 slow path。fast path 在 harness 中更新 skill/memory/tooling，反馈周期短，风险由 admission test、versioning、permission 和 runtime isolation 控制。slow path 将经验整理为训练样本或偏好信号，反馈周期长，风险由 data curation、verifier quality、privacy、distribution shift 和 safety regression 控制。

### 4. 核心假设或切入点

核心假设有三条：

1. Experience 需要经过筛选、压缩、归因和验证后才能成为能力更新材料。
2. 不同经验应进入不同 update surface，盲目把所有 trace 写入参数会放大噪声、隐私和安全风险。
3. self-improvement 的评测要沿时间轴观察同一个 agent system，记录 gain、retention、stability、cost、path attribution 和 safety delta。

### 5. 方法 / 系统 / 理论框架

论文将时刻 `t` 的 agent 写成：

```text
A_t = <M_{theta_t}, H_t, U_t, E_t>
```

其中 `M_{theta_t}` 是 base model，`H_t` 是可变 runtime harness，`U_t` 是 user-facing interface，`E_t` 是 environment-facing interface。harness 负责 context construction、action routing、trace capture、state update 和 safety control。

trace 到 experience 的形式化路径是：

```text
0 = t_0 < t_1 < t_2 < ...
tau_i = { alpha | time(alpha) in [t_{i-1}, t_i) }
z_i = H_{t_i}(tau_i)
Z_T = { z_i : 1 <= i <= N(T) }
H_{t_i}^+ = Phi_H(H_{t_i}, z_i)
theta_{s_k}^+ = Phi_M(theta_{s_k}, Z_{s_k})
```

这里 `z_i` 是经过 filtered / compressed / attributed / verified 的 experience，已经脱离 raw log 的直接堆叠形态。`Phi_H` 对应 runtime fast path，`Phi_M` 对应参数侧 slow path。

#### Skills

skills 将程序性经验变成可复用 procedure。论文用 skill bank 表示：

```text
S_t = { sigma_1,t, ..., sigma_n_t,t }
sigma_i,t = <M, I, R, A>
```

`M` 是 manifest/frontmatter metadata，`I` 是 instruction body，例如 `SKILL.md`，`R` 是 references、schemas、tests、audit records，`A` 是 artifact bundle，包括 scripts、assets、templates、helper code。skill lifecycle 包括 creation、use、evolution，更新算子写成 `S_{t_i}^+ = Phi_S(S_{t_i}, z_i)`。

#### Memory

memory 保留状态、证据、历史和用户偏好。论文按 representation、organization、operations、evolution 四组维度组织 memory：

- Representation: raw logs / active context、episodic trajectories、summaries / semantic abstractions。
- Organization: flat append-only、tiered / hierarchical、relational / associative。
- Operations: write admission、compression、consolidation、retrieval / activation、revision。
- Evolution: content evolution、mechanism evolution、policy evolution。

在这个框架里，skill 更像 procedure，memory 更像 state and evidence。两者在 agent runtime 中会相互支持，例如 memory 记录 failure trace，skill update 将稳定修正写成可执行步骤。

#### Environment

environment 决定 agent 可体验、可执行、可验证的边界。论文用 action diversity、feedback density、task horizon 三个轴描述 learnable environment。action 更丰富会扩大搜索空间，feedback 更密会改善 credit assignment，task horizon 更长会接近真实任务，但三者组合会提高归因和验证难度。

论文把环境演化分成三层：

1. Executability：agent 能否在环境中执行任务，例如 CLI-Anything、OpenHarness、ResearchGym、DevOps-Gym。
2. Protocolization：artifact 能否跨 tool / host / agent 迁移，例如 MCP、A2A、AG-UI、CUBE。
3. Learnability：环境是否提供 episodes、rewards、verifiers 和 attribution，足以支持 RL 或 continual improvement。

#### RL and Continual Learning

参数侧路径从 repeated harness-side lessons 开始。作者给出 trace-to-training selection：

```text
I_{s_k} = S_{O_{s_k}}(Z_{s_k}; H_{s_k})
tilde Z_{s_k} = { (z_i, y_hat_i) : i in I_{s_k}, y_hat_i = a_{O_{s_k}}(z_i; H_{s_k}) }
```

selection 取决于 objective、privacy、attribution、verifier availability、permission、trace quality 和 task coverage。随后模型更新可写成：

```text
theta_{s_k}^+ = argmax_theta J_{s_k}(theta)
J_{s_k}(theta) = E_{(z_i, y_hat_i) ~ tilde Z_{s_k}}[J_{O_{s_k}}(pi_theta; z_i, y_hat_i)]
```

论文将参数侧巩固分为三类：pre-deployment vertical agent training，training harness functional units，以及 post-deployment training from live traces。

#### Meta-Evolving Agents

meta-evolution 处理“谁控制更新”和“更新什么”。论文区分：

1. TaskAgent self-evolution：TaskAgent 更新 durable content assets，例如 skills、memory、preferences、domain/task knowledge、subagent artifacts。
2. TaskAgent meta-learning：TaskAgent 改变 retrieval、skill use、context construction、routing、policy parameters、update / validation strategies。
3. Meta-evolving agents：专门 meta-layer 治理持续优化，可以改 TaskAgent 的机制、策略，也可以改 meta-layer 自己的 state、rules、evaluation protocols、selection policies 和 controls。

### 6. 结论链条

论文的结论链条是：

1. self-improvement 首先是 experience infrastructure 问题。
2. experience 的短期复用主要发生在 harness 侧，包括 skills、memory 和 environment boundary。
3. 参数侧更新需要 selection、attribution、verifier 和 privacy gate，适合作为慢速 consolidation。
4. 当更新对象扩展到 update policies / validation protocols / meta-controller，系统进入 meta-evolution。
5. evaluation 必须沿时间轴观测同一 agent 的 gain、retention、stability、cost、path 和 safety。
6. safety 从 static alignment 扩展为 process governance，核心风险来自可变 skill、memory、tool/protocol、feedback loop 和 whole harness drift。

## 关键实验/定理

### 结果 1: Harness agent formalization

- 设置：survey formal model；把 agent 写成 `A_t = <M_{theta_t}, H_t, U_t, E_t>`。
- Baseline：传统 task-loop agent 或单模型能力评测。
- 指标：conceptual coverage；是否能同时解释 runtime update 和 parameter update。
- 结果：该表示把 base model、mutable harness、user interface、environment interface 放入一个对象，并支持 fast path `Phi_H` 和 slow path `Phi_M`。
- 解读：这让“agent 能力变化”可以按 update surface 归因，而不必全部归到模型参数。

### 结果 2: Skill bank schema

- 设置：把 reusable procedure 表示为 `sigma_i,t = <M, I, R, A>`。
- Baseline：prompt snippet、tool doc、workflow 脚本和测试记录散落在不同系统里。
- 指标：skill 可检索、可执行、可审计、可版本化的程度。
- 结果：metadata、instruction、references、artifacts 四元组能覆盖当前 agent skill package 的主要组成。
- 解读：skill 变成 experience reuse 的工程单位，也成为供应链、安全审计和自动更新的对象。

### 结果 3: Environment learnability axes

- 设置：按 action diversity、feedback density、task horizon 分析 environment。
- Baseline：只看任务分数或工具数量。
- 指标：可执行性、反馈密度、长程归因、verifier 可用性。
- 结果：environment 的 learnability 取决于可执行动作、反馈和任务跨度的组合；protocol 互通只解决 artifact 传输，仍需要 episode / reward / verifier 才能支持学习。
- 解读：tool-calling RL、coding agent RL 和 research agent 训练需要把 environment design 视为训练信号设计。

### 结果 4: SIP-Bench style longitudinal evaluation

- 设置：论文提出 wrapping existing benchmarks 的协议，包含 `T0` initial agent、`T1` post-adaptation、`T2` post-drift。
- Baseline：单次静态 benchmark score。
- 指标：held-out gain、backward retention、longitudinal stability、improvement efficiency、path attribution、safety non-regression。
- 结果：self-improvement 需要在 replay / adapt / held-out partitions 上测量同一系统随时间变化。
- 解读：这给后续 agent RL 和 deployed agent evaluation 提供最低记录字段，尤其适合补齐当前 benchmark 对 retention 和 safety delta 的缺口。

### 结果 5: Moving attack surface taxonomy

- 设置：按 mutable surface 分类安全风险，包括 skill library、memory store、tool/protocol layer、feedback/adaptation loop、whole evolving harness。
- Baseline：固定模型 snapshot alignment。
- 指标：persistence、permission、feedback corruption、composition failure、recertification burden。
- 结果：每个 mutable surface 都有相应风险和防御，例如 admission tests、least privilege、registry audits、memory lifecycle control、evaluator isolation、constrained update、continuous red-teaming。
- 解读：安全问题从“模型输出是否安全”扩展到“更新过程是否受控”，后续系统需要把 versioning、audit、rollback 和 hard stops 作为一等机制。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 模型与初始化 | 无新模型训练；survey 引用多类 agent / RL / memory / skill / environment 系统。 |
| 数据与任务 | 无统一新数据集；README paper list 统计 331 unique cited entries、379 unique manuscript citation keys、379 cited BibTeX records。 |
| RL / 训练配置 | 无原创 RL 训练配置；第 6 节给出 trace selection 与 model update 的抽象目标。 |
| 系统配置 | 无新系统部署配置；重点在 harness / runtime / environment / protocol taxonomy。 |
| 技术报告训练配置 | 未披露，因为本文是 survey。 |
| 训练硬件与拓扑 | 未披露。 |
| 并行方式与框架 | 仅作为相关工作覆盖，例如 agent RL、post-training infrastructure、tool/runtime systems。 |
| 训练数据规模与组成 | 未披露原创训练数据。 |
| 训练过程与超参 | 未披露。 |
| 训练时间 / GPU hours / 成本 | 未披露。 |
| 未披露项 | citation inclusion criteria、paper scoring protocol、taxonomy inter-annotator agreement、SIP-Bench 的完整 benchmark implementation。 |
| 评测协议 | 提出 longitudinal SI evaluation 目标和 SIP-Bench wrapper 思路，但未给出完整可复现实验结果。 |
| 统计报告 | 无原创统计检验。 |
| Baseline 是否 tuned | 不适用。 |
| Baseline 是否 compute-matched | 不适用。 |
| Baseline 是否 implementation-matched | 不适用。 |
| Baseline 是否覆盖强替代方案 | taxonomy 覆盖面广；本文属于综述型框架整理，未设置比较型实验。 |
| Baseline 是否存在弱化风险 | 主要风险来自 survey selection bias 和项目仓库持续更新。 |
| 结论边界 | 适合用作概念地图和 checklist；不应当单独作为某一更新机制有效性的实验证据。 |

## 证据链强度评估

### 强证据

- 形式化框架覆盖当前 deployed agent 的主要组成：model、harness、user interface、environment interface。
- skills / memory / environment / RL / meta-evolution 的分层能解释现有系统中的真实工程对象，例如 `SKILL.md`、persistent memory、MCP-like protocol、agent RL traces 和 meta-controller。
- evaluation 部分的 gain / retention / stability / cost / path / safety 字段与已存档 tool-calling RL、STV、TIM/VeXact、Seer、slime 等材料高度一致。

### 中等强度证据

- 三代 agent 历史划分有解释力，但边界会随产品和开源系统快速变化。
- Environment 三轴和 learnability 三层提供清晰语言，但具体量化指标仍需各 benchmark 落地。
- Meta-evolution taxonomy 能覆盖 task-agent self-update 到 meta-layer governance，但当前公开系统的完整闭环证据有限。

### 需要谨慎的推论

- “Era of Experience” 是组织性叙事，实际系统是否达到 post-deployment self-improvement 需要纵向数据支撑。
- 将 runtime traces consolidate 到 parameters 的收益依赖 verifier、privacy gate、deduplication 和 attribution；survey 给出框架，未给出统一门槛。
- SIP-Bench 仍是 protocol proposal，后续需要开源实现、跨系统复验和 safety regression 记录。

## OpenReview / 审稿意见吸收

- Venue status: OpenReview.net Archive entry，observed on 2026-06-28。
- Public reviews: 0 public replies by OpenReview API `replyCount`。
- Ratings / confidence: 无公开 rating / confidence。
- Reviewer consensus: 无公开 reviewer comments。
- Main criticisms: 无公开 reviewer comments；本地可信度边界来自 survey 体裁、引用选择和缺少原创实验。
- Author response: 未发现公开 rebuttal。
- 对本文可信度的影响：OpenReview 页面提供稳定元数据和 PDF 来源，但没有 peer-review 信号。笔记将本文定位为 taxonomy / roadmap，而非已被公开审稿验证的 benchmark 结论。

## 本地讨论补充

### 1. 讨论收敛点

- 这篇 survey 适合作为“self-improving agents”专题入口，连接 agent harness、skill library、memory、tool protocol、agent RL、verifier feedback 和 safety governance。
- 它对本地 archive 最有用的概念是 trace-to-capability：每个后续论文都可以问 trace 进入了哪个 update surface，谁验证它，收益是否长期保留，安全 profile 是否变化。

### 2. 修正后的理解

- self-improvement 的单位应按 deployed system 记录，而不只按 model checkpoint 记录。对 coding/research/product agent，harness 侧更新往往先于参数更新。
- evaluation 需要区分 held-out gain 和 backward retention。单次 benchmark 提升无法说明系统真的从经验中稳定获益。
- safety 需要跟踪更新过程。skill、memory、tool protocol、feedback loop 和 meta-controller 都可能引入持久风险。

### 3. 后续复验指标

- 对每个 agent paper 记录 `update surface`: skill / memory / environment / parameter / meta-layer。
- 对每个 self-improvement claim 记录 `T0/T1/T2`、adaptation budget、held-out tasks、retention tasks、safety delta。
- 对每个 parameter consolidation claim 记录 selection rule、verifier source、privacy filter、deduplication、path attribution。

## 主要启发

- 对 agent 产品：把 traces 编译成 skill / memory / tool change 之前要有 admission test、versioning、audit trail 和 rollback。
- 对 RL 后训练：tool-calling 和 coding-agent RL 不只是 policy optimization，还包含 environment design、feedback density、verifier quality 和 harness consistency。
- 对 benchmark：self-improvement 评测需要长期 replay，至少报告 gain、retention、stability、cost、path attribution 和 safety non-regression。
- 对安全：post-deployment modification 应进入 threat model，固定模型的安全评测覆盖不到后续 skill/memory/tool 更新序列。

## 局限

1. 论文是 survey，缺少原创实验和统一 benchmark 复现，因此不提供某个机制优于另一个机制的直接实证结论。
2. taxonomy 覆盖面很广，部分边界依赖作者判断，例如 skill 与 memory、meta-learning 与 meta-evolution 的分界。
3. README 和 PDF / OpenReview 元数据存在轻微不同步：README citation stub 仍用组织作者和 placeholder title，OpenReview / PDF 已给出完整作者列表。
4. GitHub repo API 显示项目仓库没有显式 license；OpenReview PDF license 为 `CC BY 4.0`。引用 PDF 内容以 OpenReview license 为主，项目列表复用仍需注意仓库 license 状态。
5. 安全部分给出攻击面和防御方向，但缺少可验证的 end-to-end invariant 或 recertification protocol。

## 跨论文关系

- 与 `papers-index.md` 中已有论文的作者关系：[Ning Ding](/authors/ning-ding/) 和 [Bowen Zhou](/authors/bowen-zhou/) 已在 [2505.22617 Entropy Mechanism](/papers/2505.22617-entropy-mechanism-rl-reasoning-language-models/) 与 [2509.25123 RL skill acquisition](/papers/2509.25123-rl-compositional-skill-acquisition/) 中出现；Kaiyan Zhang 本次新增，并通过 TsinghuaC3I / Frontis.AI 连接 OpenPRM、TTRL、MARTI、SSRL 等 self-evolving / scalable RL 线索。
- 与已有论文的主题关系：[2604.09459 credit assignment survey](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/) 处理 reasoning-to-agentic credit assignment，本 survey 处理完整 deployed agent self-improvement stack；两者共同构成 agent RL 的 map 层。
- 与已有论文的方法或系统关系：[SLIME-2026-06-17](/papers/2026-06-17-slime-rl-scaling-framework/)、[2602.15763 GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) 和 [2511.14617 Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/) 对应 survey 第 6 节的 runtime-to-parameter consolidation 和 rollout infrastructure；[2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/) 对应 environment / tool-calling learnability；[2605.30290](/papers/2605.30290-self-trained-verification/) 对应 verifier feedback self-improvement；[2025-09-10 inference determinism](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 与 [2605.14220 TIM/VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/) 对应 longitudinal evaluation 所需的 rollout consistency。
- 新增后应更新的索引 cluster：新增 “Self-Improving Agents、Harness 与 Experience Infrastructure” cluster，并把本文设为 self-improving agents 主题入口。

## Reference Intake Brief

### Target

- Intended target system: 新增论文笔记、更新 `papers-index.md`、更新 `authors.json`。
- Existing related assets: `papers-index.md`；[SLIME-2026-06-17](/papers/2026-06-17-slime-rl-scaling-framework/)；[2602.15763](/papers/2602.15763-glm-5-agentic-engineering/)；[2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/)；[2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/)；[2605.30290](/papers/2605.30290-self-trained-verification/)；[2604.09459](/papers/2604.09459-credit-assignment-reasoning-agentic-llm-rl/)。
- Proposed form: 新建独立 Markdown 文档，并在 archive index 中作为 self-improving agents umbrella 节点。

### Reusable Elements

1. `A_t = <M_{theta_t}, H_t, U_t, E_t>` 作为 agent runtime 统一对象。
2. trace-to-capability checklist：capture、assign、verify、preserve control。
3. SIP-Bench style fields：gain、retention、stability、cost、path attribution、safety delta。
4. Moving attack surface taxonomy：skill、memory、tool/protocol、feedback loop、whole harness。

### Risks

- Copyright/over-copying: 本笔记使用 paraphrase 和少量公式，不复制 PDF 大段文本。
- Tone/brand mismatch: 使用本 archive 的论文分析语气，区分 paper facts、author claims 和 local analysis。
- Safety/compliance issues: 安全部分保留风险面和防御方向，省略可操作滥用步骤。
- Overlap with existing assets: 与 `Awesome-Self-Improving-Agents` 网站功能不同，本笔记提供本地 cross-paper graph 和可信度边界。

### Skipped

| Material | Reason |
| --- | --- |
| 公开 reviewer comments | OpenReview API `replyCount = 0`，未发现公开 review / rebuttal。 |
| 全 27 位作者逐一 profile | 当前跨论文图谱只需要 project leads、corresponding authors 和已有重复作者；其余作者保留在本文作者列表。 |

### Recommendation

Decision: merge

Why: 该 survey 给本地 agent RL、tool-use、self-verification、runtime harness 和 safety 论文提供统一组织语言，适合作为 self-improving agents 主题入口。归档时需标注其 survey 属性和缺少公开审稿信号。
