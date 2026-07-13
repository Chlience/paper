# Agentic RL Learned Environment 演进路线：从可执行 Sandbox 到可校准世界模型

First-Archived-At: 2026-07-13 16:59
Updated-At: 2026-07-13 16:59

## Source

- Workflow version: v2
- Material type: composite
- Canonical source: /papers/2601.16206-computer-environments-agentic-intelligence/
- Title: Agentic RL Learned Environment 演进路线：从可执行 Sandbox 到可校准世界模型
- Responsible organization: Chlience Paper Archive（本地综合）
- Search services: [arXiv](https://arxiv.org/)、[OpenReview](https://openreview.net/)、官方项目页与代码仓库
- Search window: 2024-06-01 至 2026-07-13 16:55 CST
- Published / updated: 2026-07-13
- Current version read: 检索截止时可访问的 arXiv abstract / HTML、OpenReview / 会议页面、官方项目页与已有本地论文笔记
- Accessed: 2026-07-13
- Subjects: Agentic Reinforcement Learning；Learned Environment；World Model；Environment Synthesis；Tool Use；Sim-to-Real

### 纳入协议与术语边界

本路线纳入三类直接改变 Agent 学习环境供给方式的工作：学习状态转移或反馈的 world model / surrogate；自动生成有状态可执行环境的系统；把用户、工具或 UI 的动态响应接入在线 RL 的模拟器。只提供 trainer、rollout scheduler 或 sandbox isolation 的系统作为基础节点保留，不进入 learned environment 核心集合。只在静态数据上训练工具调用格式、没有环境交互或状态转移的工作不进入时间线。

这里采用一个严格区分：

- **Learned environment** 学习 $\hat T_\phi(o_{t+1}\mid h_t,a_t,z)$，由模型直接生成动作后的 observation，有时同时生成 reward 或终止信号。
- **Executable environment synthesis** 生成环境规格、数据库和程序 $F_z$，轨迹中的状态转移仍由程序执行得到：$s_{t+1}=F_z(s_t,a_t)$。
- **Partial simulator** 只模拟用户、网页描述或开放式反馈，数据库、代码测试和最终状态检查仍由可执行组件负责。
- **Internal world model** 把动作后果预测能力写入 Agent 本身，用于规划、表示学习或辅助 reward，未必承担外部 rollout service。

## 作者与关系

- 本材料由本地归档综合，没有单一论文作者，也不为 composite 新建作者档案。
- [Huatong Song](/authors/huatong-song/) 与 [Wayne Xin Zhao](/authors/wayne-xin-zhao/) 同时出现在 [Computer Environments](/papers/2601.16206-computer-environments-agentic-intelligence/) 和 [SWE-World](https://arxiv.org/abs/2602.03419) 中，连接通用 Docker sandbox 与代码执行 surrogate 两条路线。
- Huaxiu Yao 同时出现在 [DreamGym](https://arxiv.org/abs/2511.03773) 和 [Agent World Model](https://arxiv.org/abs/2602.10090) 中，连接 reasoning-based experience model 与代码驱动环境生成。
- WebWorld 与 Qwen-AgentWorld 存在 Yuxin Zuo、Zikai Xiao、Fei Huang、Jianhong Tu、Bowen Yu 等作者重叠，形成从 open-web world model 到多领域 language world model 的直接延展。
- AgentGym、$\tau$-bench、ToolSandbox、WebDreamer、DreamGym、SWE-World、EnvFactory 与 Qwen-AgentWorld 来自多个独立团队。它们的共同关系主要落在环境接口、状态转移建模、模拟数据生成和 real-sim 校准，机构事实以各官方标题页为准。

## 一句话结论

Agentic RL 的环境供给在 2024-2026 年经历了从统一可复位 sandbox、有状态用户与工具模拟、代码驱动环境合成，到用真实交互轨迹训练 language world model 的连续演进；当前证据最支持 real environment 提供状态与验证锚点、learned environment 扩大低成本 rollout、周期性真实交互修正分布偏移的混合闭环。

## 阅读目标与判断边界

本材料关注：

1. Learned environment 在 Agentic RL 中具体替代了真实环境的哪一部分。
2. 从 benchmark simulator 到可训练 world model 的关键技术转折。
3. 可执行合成环境与模型生成状态转移各自解决什么问题。
4. 当前证据是否足以支持完全依赖 learned environment 完成 RL。

判断边界：

- 时间线聚焦语言、Web、工具调用、GUI 和软件工程 Agent，没有展开机器人、自动驾驶和传统 model-based RL。
- 不同论文使用不同模型、任务、训练预算、agent scaffold 和评测器，表中结果用于证明机制可行性，不构成性能排名。
- 大量 2026 工作仍是 arXiv v1，数据、代码、模型权重、会议状态和结果可能继续变化。
- “模拟准确”至少包含格式合法、局部转移正确、长程状态一致、reward 正确和对 policy exploitation 稳健五层含义。现有论文通常只覆盖其中一部分。

证据写法：

- 论文事实：官方摘要、HTML、表格、附录、代码或会议页面直接给出的设计和数字。
- 作者主张：论文对成本、泛化、sim-to-real 和 world model 价值的解释。
- 本地分析：跨论文统一、阶段划分、风险模型和推荐架构。

## 论文脉络

### 1. 真实环境为什么会成为 RL 瓶颈

Agentic RL 需要 policy 在环境中反复执行动作。对一个环境规格 $z$，可执行环境可以写成：

$$
E_z=(\mathcal S,\mathcal A,T_z,O_z,R_z,\rho_{0,z}).
$$

一次长度为 $H$ 的 rollout 依次产生：

$$
s_0\sim\rho_{0,z},\qquad
a_t\sim\pi_\theta(\cdot\mid h_t),\qquad
s_{t+1}=T_z(s_t,a_t),\qquad
o_{t+1}=O_z(s_{t+1}).
$$

在数学题里，环境可能只包含答案 verifier；进入 Web、软件工程和业务工具后，$T_z$ 会扩展成浏览器、数据库、文件系统、依赖、测试、账号权限和用户响应。训练成本随环境数量、每个 prompt 的 rollout 数和轨迹长度一起增长：

$$
C_{\mathrm{rollout}}
\approx
N_{\mathrm{task}}N_{\mathrm{sample}}
\left(C_{\mathrm{reset}}+\sum_{t=1}^{H}(C_{\mathrm{policy},t}+C_{\mathrm{env},t})\right).
$$

这里的压力包含环境构建、镜像维护、reset、网络等待、外部 API 费用、并发隔离和最终验证。RL 还会不断改变 policy，旧轨迹难以长期代替 on-policy interaction。环境供给由此从辅助工程变成训练规模的直接约束。

### 2. Learned environment 改写了哪项成本

Learned environment 用参数化模型近似状态转移：

$$
\hat o_{t+1},\hat r_t,\hat d_t
\sim
M_\phi(\cdot\mid h_t,a_t,z),
$$

其中 $d_t$ 表示 episode 是否结束。真实执行的边际成本由一次模型推理替代，环境复制和向量化也更容易。代价集中到预先收集真实 transition、训练环境模型和持续校准。

Policy 最终关心真实环境回报 $J_E(\pi)$，使用 learned environment 优化时得到的是 $J_{\hat E}(\pi)$。两者差值可以写成：

$$
\Delta(\pi)=J_E(\pi)-J_{\hat E}(\pi).
$$

当 policy 逐渐访问训练数据覆盖较弱的动作和状态时，$\Delta(\pi)$ 会扩大。单步误差 $\epsilon$ 在简化假设下会随 horizon 累积到 $O(H\epsilon)$；策略主动偏向 simulator 的错误区域后，误差还会和分布偏移耦合。Learned environment 因此承担经验放大器的角色，真实环境继续承担 ground truth、分布刷新和最终验收。

### 3. 六阶段演进

#### 阶段一：先把环境变成可调用、可复位的服务，2024 年中

[AgentGym](https://arxiv.org/abs/2406.04151) 把 14 类 Web、游戏、工具、编程和 embodied 环境封装成统一的 `createEnv`、`observation`、`step` 与 `reset` 服务，解决多环境并发探索的接口问题。[$\tau$-bench](https://arxiv.org/abs/2406.12045) 随后把 LLM user simulator、领域 API、政策约束和数据库终态检查放入同一对话；[ToolSandbox](https://arxiv.org/abs/2408.04682) 进一步加入有状态工具、隐式状态依赖、on-policy 用户模拟和中间 milestone 评估。

这一阶段的环境转移主要由真实程序和数据库执行，LLM 负责用户侧响应。它建立了后来 learned environment 必须兼容的 contract：每条 trajectory 需要独立状态、动作必须引起可追踪的变化、reset 必须可靠、reward 必须能对最终状态验收。

#### 阶段二：世界模型先进入推理期预演，2024 年末

[WebDreamer](https://arxiv.org/abs/2411.06559) 让 LLM 预测多个候选 Web action 的结果，再由 value function 选择要在真实网站执行的动作。世界模型此时只负责 imagination，真实环境仍执行最终选择。这个设计证明了自然语言状态转移可以支持 model-based planning，也暴露了多步模拟的误差累积问题。

推理期预演的成本收益有限于每次决策。把模拟轨迹用于训练，才能让一次 world-model 调用产生可复用的 policy improvement，这成为下一阶段的压力来源。

#### 阶段三：模拟轨迹开始参与 Agent 自改进，2025 年

[WebEvolver](https://arxiv.org/abs/2504.21024) 让 world model 同时承担 virtual web server 和 inference look-ahead，生成完整合成轨迹参与 self-improvement。论文报告模拟深度超过 2 后质量明显下降，说明长程 transition fidelity 会直接限制训练数据价值。

[MUA-RL](https://arxiv.org/abs/2508.18669) 把 LLM-simulated user 接入多轮 tool-use RL，使用户可以补充私有信息、回应澄清和改变当前需求。[CodeGym](https://arxiv.org/abs/2509.17325) 选择另一条路径：从代码问题抽取原子函数，生成 callable tools，并继续使用代码执行验证状态和 reward。[CWM](https://arxiv.org/abs/2510.02387) 则从 Python interpreter 和 Docker 轨迹学习代码世界规律，把 world modeling 写进 Agent 的中间训练和推理能力。

这几项工作形成三种不同角色：用户模拟器扩展交互分支；可执行环境生成扩大工具和任务覆盖；内部 world model 提升 Agent 对动作后果的预测。三者都在降低真实环境采样依赖，只有第一和第三类会直接让模型生成动态反馈。

#### 阶段四：环境本身成为可优化的训练对象，2025 年末

[GEM](https://arxiv.org/abs/2510.01051) 将异步向量化环境接口、24 个环境和多个 RL 框架接入统一 gym，补齐规模化 rollout 的系统层。[UI-Simulator](https://arxiv.org/abs/2510.14969) 用 LLM 生成结构化 UI 状态、转移与训练轨迹，并通过 `Grow` 策略优先扩展对当前 Agent 更有价值的任务。[Environment Tuning](https://arxiv.org/abs/2510.10197) 使用课程、可操作纠错反馈和细粒度进度奖励改善 tool-use RL 冷启动。

[DreamGym](https://arxiv.org/abs/2511.03773) 把这些组件组合成 reasoning-based experience model、真实数据初始化的 replay buffer 和自适应任务 curriculum。它明确用合成 transition 收集在线 RL rollout，并在 synthetic training 与 sim-to-real warm start 两种设置中评估。这一步使 learned environment 从推理工具发展为 RL experience service。

#### 阶段五：学习型转移与可执行合成形成两条互补路线，2026 年初

2026 年初的工作快速分叉：

| 路线 | 代表工作 | 环境响应来源 | 主要价值 | 主要风险 |
| --- | --- | --- | --- | --- |
| 通用真实 sandbox | [Computer Environments](/papers/2601.16206-computer-environments-agentic-intelligence/) | Docker、文件系统、shell、网络和程序执行 | 最小通用计算机接口，支持 outcome-RL 学习环境探索 | 镜像、并发、安全和动态依赖仍需维护 |
| 完整 mock world | [SYNTHAGENT](https://arxiv.org/abs/2601.22511) | LLM 用户模拟器 + mock tool system | 联合生成任务、用户私有信息、工具与 rubric | 教师偏差和 mock tool fidelity |
| Learned SWE surrogate | [SWE-World](https://arxiv.org/abs/2602.03419) | 真实 Agent-environment 数据训练的 LLM surrogate | 预测中间执行结果和最终测试反馈，直接支持 Docker-free RL | 测试语义错误、policy exploitation、仓库分布迁移 |
| Internal world model RL | [RWML](https://arxiv.org/abs/2602.05842) | Agent 预测 next textual state，真实 state 提供对齐 | 用 sim-to-real embedding gap 学动作后果 | 提升内部表示，外部环境成本仍存在 |
| Executable environment synthesis | [Agent World Model](https://arxiv.org/abs/2602.10090) | 自动生成的代码、数据库和工具执行 | 1000 个可执行环境，状态与 reward 可检查 | 生成规格的真实性与任务分布覆盖 |
| LLM tool simulator + learned reward | [CM2](https://arxiv.org/abs/2602.12268) | LLM 模拟工具，checklist judge 评分 | 快速覆盖开放式多轮任务 | transition 与 reward 同时受模型偏差影响 |
| Large-scale Web world model | [WebWorld](https://arxiv.org/abs/2602.14721) | 由 100 万级真实 Web 轨迹训练的 world model | 30+ 步、多格式模拟，并生成 Agent 训练轨迹 | Web freshness、隐藏状态和 judge-based fidelity |

这次分叉说明，环境规模和环境真实性可以分别优化。可执行环境生成保留严格状态机和 verifier；learned surrogate 获得更低的边际 rollout 成本和更开放的 observation。真实任务中常见的设计会把二者组合：世界模型负责低风险探索和任务扩增，执行器负责关键转移、reward 与抽样复验。

#### 阶段六：从单域 surrogate 走向多领域 language world model，2026 年中

[EnvFactory](https://arxiv.org/abs/2605.18703) 在 2026 年 5 月继续加强可执行路线：从真实资源自动探索并验证有状态工具环境，再通过 topology-aware sampling 和 refinement 生成自然的多轮轨迹。它直接回应纯 LLM simulator 的 hallucination 和早期 synthetic environment 过度单轮化问题。

[Qwen-AgentWorld](https://arxiv.org/abs/2606.24597) 在 2026 年 6 月把 learned environment 推到多领域 foundation model：使用超过 1000 万条、覆盖 7 个领域的真实环境 interaction trajectories，通过 CPT、SFT 和 RL 三阶段训练 world model；RL 阶段用规则与 rubric 混合 reward 提高模拟 fidelity。模型既作为解耦 simulator 为 Agentic RL 提供数千环境，也作为 Agent backbone 的 world-model warm-up。

这条路线的当前终点带来一个重要判断：更强的 learned environment 依赖更多真实环境数据作为训练基础。它把真实交互的高成本前置并摊薄到大量后续 rollout，同时仍需要 real-environment evaluation 判断 policy 是否学会了 simulator artifact。

### 4. 统一比较框架

逐篇比较时，模型名称和 benchmark 分数很容易掩盖环境差异。四个变量更能决定一套方案是否适合 RL：

| 比较轴 | 要回答的问题 | 强实现 | 常见薄弱点 |
| --- | --- | --- | --- |
| State authority | 谁保存 canonical state | 数据库、文件系统、VM snapshot、版本化结构状态 | 只保留自然语言历史，隐藏状态丢失 |
| Transition authority | 谁决定 $s_{t+1}$ | 程序执行或经过真实 transition 训练并校准的模型 | 通用 LLM 按常识补全结果 |
| Reward authority | 谁判断任务完成 | unit test、数据库 goal state、规则 verifier | 同一 simulator 同时生成结果和评分 |
| Grounding loop | 新 policy 和动态内容如何回流 | on-policy real audit、replay refresh、版本化 snapshot | 一次离线蒸馏后长期固定 |

可以进一步用五元组描述环境方案：

$$
\mathcal E_{\mathrm{agent}}
=
(\text{state carrier},\text{transition source},\text{reward source},
\text{refresh policy},\text{risk gate}).
$$

“是否使用 Docker”只决定 state carrier 和部分 transition source。动态用户、实时网页、API 返回和 reward verification 仍需要分别设计，因此 Docker 与 learned environment 可以同时存在于一条 rollout 中。

### 5. 当前更稳健的混合闭环

把 learned environment 直接放到 policy 旁边还不够。更稳健的系统需要四个参数和生命周期相互独立的组件：

```text
real executable environments
        |
        v
versioned transitions + verifier results
        |
        v
environment model M_phi ----> synthetic rollout pool
        ^                              |
        |                              v
real audit <---- uncertainty gate <---- policy pi_theta
        |
        v
replay refresh + simulator recalibration
```

- **Policy $\pi_\theta$** 只负责选择动作，通过 synthetic 与 real rollout 的混合 return 更新。
- **Environment model $M_\phi$** 从真实 transition 学习；在一次 policy optimization window 内冻结，避免 policy 与 simulator 同步漂移。
- **Verifier $V_\psi$** 优先使用测试、规则、数据库差分或独立模型；关键 reward 保留可复查证据。
- **Risk gate $g$** 根据 uncertainty、ensemble disagreement、状态新颖度、动作权限和 reward 重要性决定调用 simulator 或真实执行器。

动态内容可以按三层处理：稳定工具逻辑进入可执行环境；可变化但允许复现的内容使用 timestamped snapshot、record/replay 和版本化数据库；必须实时获取的价格、新闻、库存或账号状态通过真实 API 采样，并把响应写入 trace 供后续 simulator refresh。这样可以同时获得可复现训练和真实分布校准。

Policy 与 environment model 可以共享 tokenizer、base checkpoint 或架构，训练参数需要保持分离。若同一参数同时扮演 Agent、环境和 reward judge，三者可能形成共同偏差，policy improvement 也难以区分真实能力增长和 simulator agreement。资源有限时可以共享冻结 backbone，再使用独立 adapter / head，并让最终 reward 继续来自外部 verifier。

### 6. 结论链条

1. 2024 年的环境平台先解决统一接口、独立状态、reset 和可执行 reward，为在线 Agent 学习建立基础 contract。
2. 用户模拟和 Web action imagination 证明 LLM 可以承担部分环境动态，同时保留数据库或真实网站作为状态锚点。
3. 2025 年的 WebEvolver、UI-Simulator 和 DreamGym 开始把模型生成 transition 转成训练 experience，环境模型由推理辅助组件进入 RL 数据面。
4. CodeGym、Agent World Model 与 EnvFactory 表明，可执行环境生成能够扩大任务分布，并保持严格状态转移与 reward verification。
5. SWE-World、WebWorld 与 Qwen-AgentWorld 表明，真实交互数据可以蒸馏成专用 surrogate，分别覆盖代码、Web 和多领域 Agent 环境。
6. 当前证据共同支持混合闭环：learned environment 承担规模和课程，真实环境承担校准、关键动作执行和最终验收。

## 关键实验/定理

### 跨论文机制证据

- 证据定位：[WebEvolver Section 4.4](https://arxiv.org/html/2504.21024)、[DreamGym abstract](https://arxiv.org/abs/2511.03773)、[SWE-World abstract](https://arxiv.org/abs/2602.03419)、[Agent World Model abstract](https://arxiv.org/abs/2602.10090)、[WebWorld Sections 3-6](https://arxiv.org/html/2602.14721)、[EnvFactory abstract](https://arxiv.org/abs/2605.18703)、[Qwen-AgentWorld abstract](https://arxiv.org/abs/2606.24597)。
- 对照是否可比：每篇论文内部的同 backbone 或同 benchmark 对照可以支持各自机制判断；跨论文的模型、环境、训练预算、Agent scaffold 和 verifier 不一致，不能直接比较分数高低。
- 支持的最窄结论：真实交互训练的 surrogate、reasoning experience model 和代码驱动合成环境都能在各自实验范围内产生有下游价值的 Agent 训练经验；长期移除真实环境采样仍缺少统一证据。

| 工作 | 设置与关键结果 | 证据定位 | 支持的最窄结论 |
| --- | --- | --- | --- |
| WebEvolver | world-model synthetic data 在初轮 self-improvement 之外再带来约 4% 增益；模拟深度大于 2 时 intrinsic score 明显下降 | [arXiv HTML, Sec. 4.4](https://arxiv.org/html/2504.21024) | Web world model 可以扩充训练轨迹，长程 rollout 受误差累积限制 |
| DreamGym | WebArena 上相对所列 baselines 提升超过 30%；昂贵环境中只用 synthetic interactions 可匹配论文中的 GRPO / PPO 结果 | [arXiv abstract](https://arxiv.org/abs/2511.03773) | reasoning experience model 能作为 RL warm start 或部分 rollout 来源 |
| SWE-World | SWE-bench Verified 上 Qwen2.5-Coder-32B 从 6.2% 提升到 Docker-free SFT 52.0%、RL 55.0%，再配合 TTS 达 68.2% | [arXiv abstract](https://arxiv.org/abs/2602.03419) | 代码环境的 learned surrogate 可以支持训练与候选筛选 |
| Agent World Model | 生成 1000 个代码和数据库驱动环境，平均每个环境约 35 个工具，并用其执行大规模多轮 tool-use RL | [arXiv abstract](https://arxiv.org/abs/2602.10090) | 可执行环境生成可以同时扩大环境数量和保留可验证 reward |
| WebWorld | 使用 100 万级真实 Web 轨迹训练，支持 30+ 步模拟；由其合成轨迹训练 Qwen3-14B，在 WebArena 提升 9.2 points | [arXiv HTML, Fig. 1 and Sec. 5](https://arxiv.org/html/2602.14721) | 大规模真实 transition 能训练有下游价值的单域 world model |
| EnvFactory | 85 个验证环境、7 个领域生成 2575 条 SFT / RL 轨迹；Qwen3 系列在 BFCLv3、MCP-Atlas 和对话工具 benchmark 上获得增益 | [arXiv abstract](https://arxiv.org/abs/2605.18703) | 少量经过验证的有状态环境也能形成有效训练分布 |
| Qwen-AgentWorld | 超过 1000 万条真实 interaction trajectories、7 个领域、CPT-SFT-RL 三阶段；作为 simulator 的 Agentic RL 优于论文中的 real-environment-only 训练 | [arXiv abstract](https://arxiv.org/abs/2606.24597) | 多领域 language world model 已能承担解耦 RL simulator 和模型 warm-up 两种角色 |

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 评测协议 | 覆盖 WebArena、VisualWebArena、Mind2Web-Live、SWE-bench Verified、$\tau$-Bench、BFCL、MCP-Atlas、ALFWorld 等；环境、Agent scaffold 与成功判定差异很大。 |
| 统计报告 | 多数工作报告单一 aggregate score，公开摘要通常没有多 seed、置信区间和 simulator exploitation stress test。 |
| Baseline 是否 compute-matched | 普遍缺少等 wall-clock、等 token、等真实交互次数和等环境建设成本的统一对照。 |
| Baseline 是否 implementation-matched | 单篇内部对照通常共享 backbone；跨论文 trainer、tool schema、prompt、history serialization 和 verifier 不一致。 |
| Baseline 是否覆盖强替代方案 | 新工作通常覆盖 real environment、通用 LLM simulator 或 SFT baseline；很少同时覆盖强 executable synthesis、hybrid routing 和在线 simulator refresh。 |
| 结论边界 | 现有结果支持 learned environment 提升数据规模和 warm start；长期完全替代真实环境、开放世界 freshness 和 adversarial policy robustness 仍缺少充分证据。 |
| 训练数据规模 | 从 DreamGym 的 real-data replay、WebWorld 的 100 万级 Web 轨迹扩展到 Qwen-AgentWorld 的 1000 万级多领域轨迹，说明 simulator fidelity 仍高度依赖真实数据。 |
| Reward 来源 | unit test / DB goal、规则、rubric、LLM judge 和混合 reward 并存；transition 与 reward 同源时需要额外审计。 |
| 训练成本 | 多数论文未公开完整 environment collection、simulator training、policy RL 和真实复验的总成本账本。 |

## 证据链强度评估

### 强证据

- AgentGym、ToolSandbox、Computer Environments、Agent World Model 和 EnvFactory 都提供可执行状态或代码路径，环境 contract 与 reward 来源可以直接检查。
- SWE-World 明确使用真实 Agent-environment 交互训练 surrogate，并同时报告 SFT、RL 和 TTS 结果，证明 learned execution feedback 能进入完整优化链。
- WebWorld 与 Qwen-AgentWorld 披露真实 transition 数据规模、训练阶段和下游 Agent 使用方式，形成从 simulator intrinsic quality 到 policy extrinsic gain 的证据链。

### 中等强度证据

- DreamGym 跨多个环境展示 synthetic RL 和 sim-to-real 收益，但 experience model 的长程误差、policy-induced distribution shift 与真实交互成本仍需更细拆分。
- MUA-RL、SYNTHAGENT 和 CM2 支持 LLM 用户或工具模拟器参与 RL；结果同时受 simulator prompt、teacher model 和 reward judge 影响。
- Executable environment synthesis 的 OOD 增益说明环境多样性有价值，生成任务与真实用户意图之间的覆盖仍依赖 benchmark proxy。

### 需要谨慎的推论

- Simulator intrinsic score 提高不能单独推出真实任务回报同步提高，需要真实环境中的 extrinsic evaluation。
- Synthetic-only 训练在某组 benchmark 上匹配 real-environment RL，尚不足以证明开放世界部署可以移除真实环境采样。
- 更大的 world model 可能降低转移误差，也会提高每步模拟成本；完整经济性需要把真实数据收集、world-model training 和 policy rollout 一起计入。
- Policy 可能发现 simulator 的稳定错误模式。常规 held-out transition accuracy 很难覆盖这种自适应 exploitation。

## OpenReview / 审稿意见吸收

- Page type: proceedings
- Match confidence: high
- Observed at: 2026-07-13
- Venue status: DreamGym 与 Environment Tuning 为 ICLR 2026 Poster；CodeGym 的 arXiv 页面标注 accepted to ICLR 2026；其余核心节点以 arXiv preprint、TMLR 或项目发布状态为主。
- Public reviews: 本综合未逐篇吸收所有 reviewer thread，只使用可可靠匹配的会议状态和论文当前版本。
- Ratings / confidence: 不跨论文合并评分。
- Reviewer consensus: 不适用；本材料是跨论文路线综合。
- Main criticisms: 公共证据反复指向 simulator fidelity、长程误差、真实环境对照和成本披露不足。
- Author response: 按各论文公开页面处理，本综合不代替单篇审稿记录。
- 对可信度的影响: 正式接收提高 DreamGym、Environment Tuning 和 CodeGym 的来源稳定性；2026 年最新 learned environment 结论仍需要后续复现与正式审稿校准。

## 本地讨论补充

### 1. 讨论收敛点

- Docker 是软件工程和通用计算机环境的常见执行后端，负责隔离、依赖、文件系统和真实程序语义。Agentic RL 的动态环境还可能来自用户、数据库、网页、外部 API 与 reward verifier，因此一条 trajectory 可以同时经过 Docker、LLM simulator 和 live service。
- Learned environment 的直接价值是摊薄环境交互成本和扩大课程分布。它的输出属于预测，关键状态和 reward 需要真实执行或独立 verifier 周期性校准。
- 动态内容与未来状态通过 snapshot、record/replay、时间戳和 live refresh 分层处理。训练重现使用冻结快照，部署有效性通过实时样本复验。

### 2. 修正后的理解

- “构建一个 Docker 让模型调用工具”覆盖了可执行工具环境的一类实现。用户模拟、搜索、浏览器、远程 API 和 learned surrogate 会在 Docker 之外继续提供 observation。
- “learned env”需要注明模型学习的是用户、observation transition、reward、完整环境，还是 Agent 内部后果预测。四种对象的风险和训练作用差异很大。
- 当前路线逐渐形成 `real traces -> environment model -> synthetic rollout -> policy update -> real audit` 的循环。真实环境从逐条 rollout 后端转为数据锚点、风险门禁和验收后端。

### 3. 后续复验指标

- 单步 transition accuracy、$k$ 步 rollout consistency 与 hidden-state constraint violation。
- Synthetic / real trajectory 上的 policy return gap，以及随训练 step 变化的 gap。
- Simulator-only、real-only、hybrid 三组在等 wall-clock、等模型 token 和等真实交互预算下的比较。
- Policy 对 simulator exploit 的发现率、真实复验失败率和 uncertainty gate 召回率。
- 环境 freshness：网页、API、依赖和数据库版本变化后的性能衰减与 refresh 成本。

## 主要启发

- Learned environment 的论文应把 simulator intrinsic fidelity、Agent extrinsic return 和 sim-to-real gap 分开报告。
- 环境模型、policy 和 reward model 应保留独立参数、版本和日志；共享 base model 时至少冻结环境侧 checkpoint，并使用独立 verifier。
- 可执行环境生成适合状态和 reward 要求严格的工具任务；learned transition 适合扩大开放 observation、多样用户和低风险探索。
- 真实环境预算应集中到新颖状态、高不确定动作、高权限操作、最终 reward 和随机审计样本。
- 总成本需要包含环境建设、真实 trace 收集、simulator 训练、synthetic rollout、真实复验和 simulator refresh。

## 局限

1. 检索覆盖 2024 年中至 2026 年 7 月的语言 Agent 主线，可能遗漏使用其他术语描述 environment distillation、experience model 或 digital twin 的工作。
2. 多数最新论文缺少统一 benchmark、相同 Agent backbone 和相同真实交互预算，演进路线反映机制变化，无法给出严格收益排序。
3. Qwen-AgentWorld、EnvFactory、SWE-World 等仍处于快速更新期，代码、权重和完整训练账本的可复验程度不同。
4. Learned reward 与 learned transition 的误差会相互作用，现有论文很少提供联合误差分解。
5. 安全边界主要来自论文设计与本地系统分析，缺少针对 simulator exploitation、权限升级和恶意环境反馈的统一评测。

## 跨论文关系

- 与 [Computer Environments](/papers/2601.16206-computer-environments-agentic-intelligence/)：它提供真实 Docker sandbox 和通用 computer interface，本路线把它放在 real-executable anchor，SWE-World 则沿同一作者线学习代码执行反馈。
- 与 [Agentic Tool-calling RL](/papers/2606.00135-agentic-tool-calling-rl-training/)：后者分析多轮工具 RL 的评测敏感性、零方差 prompt 和训练成本，本路线进一步定位环境 transition、simulator 和 verifier 如何改变这些测量。
- 与 [Self-Improving Agents](/papers/2026-06-25-self-improving-agents-era-experience-survey/)：后者把 environment / tool boundary 视为 trace-to-capability 的一个写入层，本路线细化该层从 executable harness 到 learned simulator 的发展。
- 与 [RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/)、[slime](/papers/2026-06-17-slime-rl-scaling-framework/)：它们负责 policy rollout、trainer 和资源调度；learned environment 作为新的 rollout backend，需要接入同样的异步生命周期、版本控制和权重隔离。
- 与 [SocioHack](/papers/2606.04075-llms-hack-rewards-and-society/)：环境和 reward proxy 一旦存在系统漏洞，RL policy 会持续优化该漏洞；learned simulator 增加了可被策略利用的新代理层。

## Reference Intake Brief

### Target

- Intended target system: Agentic RL learned environment 专题路线文档。
- Existing related assets: `content/utility/papers-index.md`、`data/tag-taxonomy.json`、`data/paper-tags.json`、[Computer Environments](/papers/2601.16206-computer-environments-agentic-intelligence/)、[Self-Improving Agents](/papers/2026-06-25-self-improving-agents-era-experience-survey/)。
- Proposed form: 新建单篇 composite Markdown，同步当前收录与主题标签；关系只写入本篇和对应论文的 `跨论文关系` 章节。

### Reusable Elements

1. 六阶段演进：环境接口、有状态模拟、推理期 world model、模拟训练 experience、双路线分叉、多领域 language world model。
2. 四轴审计：state authority、transition authority、reward authority、grounding loop。
3. 混合闭环：真实 trace、冻结 simulator、synthetic rollout、uncertainty gate、real audit 与 replay refresh。

### Risks

- Copyright/over-copying: 全文采用统一抽象和转述，只保留必要的论文数字与直接链接。
- Unsourced or unverifiable claims: 关键事实链接到官方 arXiv / HTML；架构建议和阶段划分标为本地分析。
- Tone/brand mismatch: 保持技术归档语气，不使用产品宣传式结论。
- Safety/compliance issues: 保留 simulator exploitation、权限和 reward 风险，不记录可直接滥用的工具操作流程。
- Overlap with existing assets: 现有 Computer Environments 负责真实 sandbox 单篇分析，Self-Improving Agents 负责更宽的 trace-to-capability taxonomy；本篇只聚焦 RL environment 的学习与合成。

### Skipped

| Material | Reason |
| --- | --- |
| 传统机器人、自动驾驶和视频 world model | 范围集中在语言 Agent、Web、工具、GUI 和软件工程 RL。 |
| 纯 sandbox isolation / orchestration 系统 | 作为实现依赖保留，未直接改变环境 transition 的生成方式。 |
| 只使用静态 synthetic trajectories 的 tool-use SFT | 缺少在线状态转移或环境交互，不进入 learned environment 核心路线。 |
| 跨论文性能排行榜 | backbone、环境、prompt、训练预算和 verifier 不可比。 |

### Recommendation

Decision: merge

Why: 该综合把分散的 sandbox、simulator、executable synthesis 和 language world model 工作放到同一环境 contract 下，能够直接回答 learned environment 在 Agentic RL 中替代什么、保留什么，以及当前可复用的混合架构。
