# 国产前沿模型技术报告时间线

First-Archived-At: 2026-06-23 18:40
Updated-At: 2026-07-22 17:20
Review-Status: approved
Reviewed-At: 2026-07-18 17:42

## Source

- Workflow version: synthesis-v1
- Material type: composite
- Analysis modules: survey, model-report, system, experiment
- Responsible organization: Chlience Paper Archive（本地综合）
- Search services: [arXiv](https://arxiv.org/)、官方技术报告、官方模型仓库、模型卡与发布页
- Search window: 2024-01-01 至 2026-07-22 17:20 CST
- Research question: 国产前沿模型组织如何在技术报告和官方发布材料中推进基础架构、推理强化学习、长上下文、Agent 系统与训练—服务协同，公开证据的强度如何变化？
- Classification axes: 组织路线；模型世代；技术层级；披露深度；证据类型
- Key figure decision: omit
- Key figure rationale: 时间、组织、技术层级和证据等级需要联合比较，正文时间线与披露矩阵比单份报告原图更能表达主线。
- Published / updated: 2026-07-22
- Current version read: 检索截止时可访问的本地技术报告笔记、官方论文、官方模型仓库与发布页
- Accessed: 2026-07-22
- Subjects: Frontier Models；Technical Reports；MoE；Long Context；Reasoning RL；Agentic Systems；Training Systems

### 检索与纳入协议

核心集合覆盖总部或主要研发组织位于中国、且公开了前沿通用模型技术材料的团队。材料按证据类型分为完整技术报告、方法论文、官方模型卡或仓库、官方发布说明四级。完整报告能够支持训练配方与系统机制判断；模型卡和发布说明可确认版本、能力范围与官方主张，无法自动提供可复现实验。媒体报道、未署名截图和路线图传闻不进入时间线。

检索从 DeepSeek、Qwen、Moonshot AI / Kimi、MiniMax、Z.ai / GLM 与 Xiaomi MiMo 的官方组织入口开始，随后核对 arXiv、代码仓库和本地归档。每个节点记录首次公开时间、材料类型、主要技术层级和最窄结论。截止时间内未找到 Moonshot 官方 Kimi K3 技术材料，因此不纳入；Qwen3.5 / 3.6、MiniMax M2.7 等只有官方仓库或模型卡级材料的节点予以纳入并降低证据等级。

## 综合判断

2024—2026 年国产前沿模型的公开路线经历了三次重心移动。第一阶段围绕 MoE、MLA、长上下文和低精度训练建立可训练、可服务的基础模型；第二阶段用可验证奖励、长链推理与蒸馏把 reasoning 变成稳定的后训练能力；第三阶段把 rollout、工具环境、压缩上下文、稀疏注意力、多 token 预测和反奖励利用机制接入训练与服务系统。技术报告逐步从单次 benchmark 汇报发展为训练、推理、Agent 环境和部署协同的系统说明。

不同组织形成了可辨认的技术路线。DeepSeek 公开基础架构与训练系统最连续；Qwen 以完整模型族、多模态和开放生态扩展覆盖面；Kimi 把长上下文强化学习和视觉 Agent 串成产品路线；MiniMax 长期聚焦高效注意力、长输出与稀疏上下文；GLM 将异步 RL、长程 coding 与上下文压缩结合；Xiaomi MiMo 强调多教师 on-policy 蒸馏与高效 Agent 模型。2026 年新增官方模型卡提高了时间线的新鲜度，机制判断仍以完整报告和方法论文为主要依据。

## 核心问题与边界

### 时间线比较的对象

本文的比较对象限定为“公开材料中能够复核的技术路线”，组织的全部内部能力在范围外。一个模型版本可能具有很强的产品表现，公开材料只给出模型卡；另一个版本可能公开训练配方和消融。两者在时间线上都可以出现，证据强度必须分开。

技术层级分为五层：基础架构与数据；预训练和低精度系统；推理与强化学习后训练；长上下文、记忆和 Agent 环境；推理服务与生产部署。单个节点可以跨层，例如 DeepSeek-V3 同时披露 MoE、FP8、DualPipe 与 MTP，GLM-5.2 同时涉及长上下文、critic PPO、压缩轨迹和服务优化。

### 结论成立条件

- “国产”用于组织范围，不用于判断技术来源的国别纯度。各团队大量复用全球公开研究并形成自己的系统组合。
- benchmark 结果只在同一报告内部支持能力变化；不同模型的提示、工具、上下文、采样和评测版本不一致。
- 官方模型卡支持版本事实与官方主张，训练细节缺失时不推断具体算法。
- 技术连续性需要由报告、代码、作者或官方后续材料支持；名称相近或发布日期相邻不足以建立继承关系。

## 分类框架

### 技术层级

| 层级 | 核心问题 | 代表公开信号 |
| --- | --- | --- |
| 基础架构 | 参数与激活怎样分配，长上下文怎样建模 | MoE、MLA、稀疏/线性注意力、混合注意力、多模态骨干 |
| 预训练系统 | 如何稳定扩展 tokens、并行和数值精度 | FP8、并行调度、数据治理、负载均衡、优化器 |
| 后训练 | 如何形成推理、遵循与 Agent 行为 | 可验证奖励、RL、蒸馏、过程信号、反奖励利用 |
| Agent 与上下文 | 如何执行长程工具任务并保持状态 | 工具环境、sandbox、memory、context compaction、长程 coding |
| 服务系统 | 如何控制时延、吞吐和显存 | MTP、speculative decoding、稀疏 KV、prefix cache、调度器 |

### 披露深度与证据类型

| 等级 | 材料 | 可以支持的结论 | 不能直接支持的结论 |
| --- | --- | --- | --- |
| A | 完整技术报告 + 训练细节 + 实验/消融 | 机制、训练配方、内部对照与部分系统成本 | 独立复现、跨组织性能排序 |
| B | 方法论文 + 对应模型或系统映射 | 局部机制与特定实验 | 完整模型训练栈 |
| C | 官方模型卡 / 仓库 | 版本、模型范围、官方列出的架构和能力 | 未公开的训练算法、预算和因果增益 |
| D | 官方发布说明 | 发布时间、产品接口和高层主张 | 可复现机制与精确对照 |

每条当前判断同时使用“组织路线 × 模型世代 × 技术层级 × 披露深度 × 证据类型”。这一结构允许 Qwen3 报告与 Qwen3.6 模型卡出现在同一组织路线中，同时保留不同证据强度。

## 演进脉络

### 2024：高效基础架构与训练系统形成连续路线

[DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/) 以细粒度专家和共享专家提高 MoE 专门化；[DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/) 将 MLA 与 sparse FFN 组合，直接面向训练与服务效率；[Qwen2.5](/papers/2412.15115-qwen2-5-technical-report/) 以模型族、数据、长上下文和 post-training 建立通用开放基座；[DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/) 进一步组合 FP8、DualPipe、无辅助损失负载均衡与多 token 预测。

这一阶段最稳定的公开信号是“架构—训练—服务”共同设计。MoE 降低每 token 激活参数，MLA 和后续稀疏注意力降低长上下文的 KV 与注意力成本，低精度与并行调度保证这些结构能够稳定扩展。

### 2025：推理强化学习与 Agent 能力进入主报告

[DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/) 展示可验证奖励驱动的推理强化学习与蒸馏路线；[Kimi k1.5](/papers/2501.12599-kimi-k1-5-scaling-rl-llms/) 把长上下文、在线 RL 和长链推理组合；[Qwen3](/papers/2505.09388-qwen3-technical-report/) 将 thinking control、模型族和 strong-to-weak distillation 放进统一报告；[MiniMax-M1](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 组合 Lightning Attention 与 CISPO，聚焦长输出推理的训练成本；[Kimi K2](/papers/2507.20534-kimi-k2-open-agentic-intelligence/) 把开放 MoE 模型、Muon 训练和工具 Agent 汇合为 agentic intelligence 路线。

公开重心由“基座能否扩展”推进到“能力怎样通过 RL 稳定形成”。可验证任务提供低成本 outcome reward，蒸馏把大模型推理转移到不同规模，Agent 数据与工具执行开始进入能力定义。

### 2026：长程 Agent、稀疏上下文与训练—服务协同

[Kimi K2.5](/papers/2602.02276-kimi-k2-5-visual-agentic-intelligence/) 把视觉输入、长上下文和 Agent 能力合并；[GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) 公开 agentic engineering 与异步 RL 系统；[DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 将 million-token context、混合稀疏注意力、训练稳定性、Muon 和 Agent sandbox 组合；[GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/) 继续推进长程 coding、压缩轨迹、critic PPO 与服务优化。

[MiniMax Sparse Attention / MiniMax-M3](/papers/2606.13392-minimax-sparse-attention-m3/) 给出原生稀疏 softmax attention 与长上下文路线；[MOPD / Xiaomi MiMo](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/) 让 student 在自己的 on-policy 分布上接受多个领域 teacher 的 token-level 指导，[MiMo-V2-Flash 官方仓库](https://github.com/XiaomiMiMo/MiMo-V2-Flash) 进一步公开混合滑动窗口/全局注意力、MTP、rollout 路由复用、prefix cache 和细粒度调度等模型卡级信息。

官方仓库增加了两个需要分级记录的后续节点。[Qwen3.6 官方仓库](https://github.com/QwenLM/Qwen3.6) 同时保留 Qwen3.5 / 3.6 材料：Qwen3.5 侧重多模态训练、Gated Delta Networks 与稀疏 MoE，Qwen3.6 强调 agentic coding 和 thinking preservation；这些信息属于官方模型卡级证据。[MiniMax-M2.7 官方仓库](https://github.com/MiniMax-AI/MiniMax-M2.7) 披露模型自演进与 Agent 团队等官方主张，当前缺少与完整技术报告同等的训练细节，因此作为 C 级节点保留。

### 六条组织路线

- **DeepSeek：** DeepSeekMoE → V2 → V3 → R1 → V3.2 → V4。连续公开 MoE、MLA/稀疏注意力、低精度训练、并行系统、推理 RL 与超长上下文，机制披露密度最高。
- **Qwen：** Qwen2.5 → Qwen3 → Qwen3.5 / 3.6。模型族、多模态、thinking control 与开放生态覆盖广；最新节点的证据从完整报告转为官方仓库，需要保留等级差异。
- **Kimi：** k1.5 → K2 → K2.5。长上下文 RL、开放 agentic intelligence 与视觉 Agent 形成连续产品路线；截止时没有可纳入的官方 K3 材料。
- **MiniMax：** M1 → M2 系列 → M3。Lightning Attention、CISPO、稀疏 softmax attention 与长上下文保持连续；M2.7 的自演进主张仍需方法报告支持。
- **GLM：** GLM-5 → GLM-5.2。slime 异步 RL、critic 路线、压缩上下文、长程 coding 和推理服务形成紧密系统组合。
- **Xiaomi MiMo：** MOPD → MiMo-V2-Flash。多教师 on-policy 蒸馏连接多领域 RL 能力，服务侧强调混合注意力、MTP、缓存和调度。

## 跨材料比较

| 组织路线 | 当前代表材料 | 架构重点 | 后训练 / Agent 重点 | 系统重点 | 当前证据等级 |
| --- | --- | --- | --- | --- | --- |
| DeepSeek | V3、R1、V4 | MoE、MLA、混合稀疏注意力 | 可验证 RL、reasoning、Agent sandbox | FP8、DualPipe、长上下文与推理协同 | A/B，连续报告较完整 |
| Qwen | Qwen3、Qwen3.5 / 3.6 | MoE、多模态、Gated Delta Networks | thinking control、蒸馏、agentic coding | 开放模型族与部署仓库 | Qwen3 为 A；3.5/3.6 为 C |
| Kimi | k1.5、K2、K2.5 | 长上下文 MoE、多模态 | 长链 RL、工具与视觉 Agent | 大规模 rollout 与 Agent 服务 | A/B；暂无官方 K3 节点 |
| MiniMax | M1、M2.7、M3 | Lightning / sparse softmax attention | CISPO、自演进与 Agent 团队主张 | 1M context 与协作模型 | M1/M3 为 A/B；M2.7 为 C |
| GLM | GLM-5、GLM-5.2 | 稀疏架构与长上下文 | 异步 RL、critic PPO、context compaction | slime、长程 coding 与服务优化 | A/D 组合，方法细节分散于多材料 |
| Xiaomi MiMo | MOPD、MiMo-V2-Flash | 混合滑动窗口/全局注意力、MTP | 多教师 on-policy distillation | rollout 路由复用、prefix cache、调度 | B/C |

### 训练信息披露矩阵

| 路线 | 数据与预训练 | 优化器 / 数值系统 | RL 目标与 reward | Agent 环境 | 服务指标 |
| --- | --- | --- | --- | --- | --- |
| DeepSeek | 报告相对完整 | FP8、并行、负载均衡与优化器连续披露 | R1 与后续材料较清楚 | V4 / Agent 材料开始具体化 | 多份报告给出成本或吞吐信号 |
| Qwen | Qwen2.5 / Qwen3 较完整 | 训练系统细节有限于报告披露 | thinking control 与蒸馏清楚，最新版本较简略 | 官方仓库列出 Agent 能力 | 最新模型卡以能力和用法为主 |
| Kimi | k1.5 / K2 披露训练路线 | K2 对优化器与规模有直接材料 | 长上下文 RL 和 Agent post-training 明确 | 工具与视觉任务覆盖广 | 完整 serving 成本仍有限 |
| MiniMax | M1 / M3 局部详细 | 高效注意力和长输出训练清楚 | CISPO 具体；M2.7 自演进细节不足 | 模型卡声明 Agent 团队 | 长上下文效率是持续主题 |
| GLM | 报告与发布文档结合 | 异步 RL 系统强，完整预训练细节分散 | critic、token loss、压缩轨迹逐步公开 | coding / terminal 环境具体 | 生产声明多，统一成本表较少 |
| Xiaomi MiMo | MOPD 与模型卡互补 | attention、MTP 和缓存信息明确 | 多教师 on-policy 蒸馏有方法论文 | 大量 code / Agent 任务由官方仓库声明 | prefix cache 与调度有实现级线索 |

## 证据强度

| 结论 | 强度 | 直接证据与限制 |
| --- | --- | --- |
| 国产前沿模型已形成 MoE、长上下文、推理 RL 与 Agent 系统的连续公开路线 | 强 | 六个组织均有多代官方材料，本地完整报告可追溯；路线连续性限定在公开节点 |
| 公开重心从基础架构推进到训练—环境—服务协同 | 中强 | 2026 报告同时覆盖 RL、Agent 环境、context 与 serving；各团队披露深度不一致 |
| DeepSeek 的机制披露连续性当前最高 | 中强 | 2024—2026 多份完整报告和方法材料连续；“最高”只针对本文六条路线和公开细节，不评价内部研发 |
| Qwen3.5 / 3.6、MiniMax M2.7 的官方主张代表已验证的训练机制增益 | 弱 | 当前主要是官方仓库或模型卡，缺少同设置消融和完整训练报告 |
| 各组织 benchmark 可以直接形成统一前沿排名 | 弱 | 评测版本、工具、scaffold、采样、上下文和报告口径不同 |
| 长上下文正在由单一架构指标转为 Agent 训练与服务系统问题 | 中强 | DeepSeek-V4、GLM-5.2、MiniMax-M3、Kimi 与 MiMo 材料从不同层面给出一致信号；统一成本对照仍少 |

证据等级约束结论范围。官方发布能够确认版本和组织主张；只有训练细节、机制消融和可复查系统指标同时出现时，才提高机制结论的强度。

## 当前判断

阅读国产模型报告时，最有效的入口是“组织路线 × 技术层级 × 披露深度”，榜单只作为单份材料内部的结果证据。DeepSeek 适合追踪基础架构和训练系统的连续演进；Qwen 适合观察模型族、多模态与开放生态；Kimi 适合观察长上下文 RL 和视觉 Agent；MiniMax 适合观察高效注意力与长输出；GLM 适合观察异步 RL、上下文压缩和长程 coding；MiMo 适合观察多教师蒸馏与 Agent 服务协同。

2026 年的共同约束已经从参数规模转向有效训练与执行路径：怎样在长上下文中降低注意力和 KV 成本，怎样让 rollout 与工具环境持续供给可验证经验，怎样限制 reward hacking，怎样把 MTP、稀疏注意力、缓存和调度转化为端到端 Agent 时延。报告质量审计应以这些变量为核心，模型规模与平均 benchmark 作为补充。

后续更新应坚持材料分级。完整技术报告可以改变机制判断；官方模型卡更新版本事实和候选路线；传闻不建立节点。若 Qwen3.6、MiniMax M2.7 或新的 Kimi 版本发布完整报告，需要补充直接证据并重新评估相关结论。

## 开放问题

1. Qwen3.5 / 3.6 与 MiniMax M2.7 的完整训练数据、预算、RL 配方和消融何时公开？
2. 超长上下文模型在真实 Agent 轨迹中的有效信息利用率、累计 token 成本与端到端时延如何统一报告？
3. 不同组织的 Agent benchmark 怎样对齐工具、scaffold、上下文管理、采样和环境版本？
4. 可验证奖励、critic、蒸馏和 anti-hack 机制在生产训练中各自贡献多少，能否获得同预算消融？
5. 多模态 Agent 的视觉 token、工具状态与语言记忆如何共同进入长程训练？
6. 模型卡级“自演进”主张需要哪些可复查日志、基线和外部评测才能上升为机制证据？

## 局限

- 本文只覆盖有稳定官方来源且进入本地关注范围的六条组织路线，不能代表中国全部模型团队。
- 公开材料具有选择性，未披露的训练和系统细节无法从 benchmark 反推。
- 官方仓库会持续更新，Qwen3.5 / 3.6、MiniMax M2.7 和 MiMo-V2-Flash 的描述可能在截止时间后变化。
- 不同报告的 benchmark、上下文协议和工具系统不可直接比较，本文不提供统一模型排名。
- 组织路线判断以公开材料为依据，作者流动、供应链和未公开合作不在本文范围内。
- 本次改写加入多个 2026 官方模型卡节点；这些节点主要属于 C 级证据，后续机制判断仍依赖完整技术报告与可复查实验。

## 更新记录

- 2026-06-23：根据国产前沿模型技术报告综合请求建立初始时间线。
- 2026-07-18：完成上一版本内容审阅。
- 2026-07-22：取得正式主线身份并迁出论文目录；改用日期无关稳定标题和独立综合结构；加入 Qwen3.5 / 3.6、MiniMax M2.7 与 MiMo-V2-Flash 官方材料，明确排除未找到官方材料的 Kimi K3，并更新证据等级与当前判断。
