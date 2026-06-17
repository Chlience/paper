# slime v0.3.0 / main 文档快照：RL Scaling 后训练框架分析

Date: 2026-06-17
Sort-Time: 2026-06-17 13:26
Version: slime latest release `v0.3.0`; docs snapshot `main@243773c`; docs last updated 2026-06-17

## Source

- Title: slime v0.3.0 / main@243773c Documentation / Quick Start Snapshot
- Documentation: https://thudm.github.io/slime/zh/
- Quick Start: https://thudm.github.io/slime/zh/get_started/quick_start.html
- Repository: https://github.com/THUDM/slime
- Latest release read: `v0.3.0`, published 2026-05-31, tag commit `bf14dc2`
- Repository snapshot read: `main@243773cfdfe6413f1d0d7693b217c9e1d88ecdbc`, committed 2026-06-17 10:08 CST
- Docs page version signal: `docs-latest` badge; Chinese docs and Quick Start footer both show last updated 2026-06-17
- Requested URL note: `https://thudm.github.io/slime/zh/get_started` redirects to `/zh/get_started/`, which returned 404 at read time; this note uses the accessible `/zh/get_started/quick_start.html` page.
- Citation authors from repository README: Zilin Zhu, Chengxing Xie, Xin Lv and slime Contributors; corresponding author: Xin Lv.

## 版本快照

本页明确固定两个版本维度：

1. **可复现实验版本**：GitHub latest release 为 `v0.3.0`，发布时间为 2026-05-31，release commit 为 `bf14dc2`。release note 中列出的环境为 SGLang `v0.5.12.post1`、Megatron `1dcf0dafa`。
2. **文档快照版本**：官方文档页面跟随 `main` 和 `docs-latest` 更新。本次阅读对应 `main@243773c`，中文文档与 Quick Start 页面显示最后更新于 2026-06-17。

因此，本文对 slime 的判断基于“`v0.3.0` release 能力 + 2026-06-17 main 文档快照”。若用于复现实验，优先 pin `v0.3.0`、Docker image digest、SGLang/Megatron 版本和训练脚本 commit；`slimerl/slime:latest` 与 `git pull` 更适合快速体验。

## 作者与关系

- Project / Organization: `THUDM/slime`，官方文档署名 slime Team，仓库由 THUDM GitHub organization 维护。
- Citation authors: Zilin Zhu、Chengxing Xie、Xin Lv and slime Contributors；README 标注 Xin Lv 为 corresponding author。
- GitHub release owner / major maintainer signal: `v0.3.0` release 由 `zhuzilin` 发布；contributors API 显示 `zhuzilin`、`fzyzcjy`、`yitianlian`、`lilei199908` 等贡献靠前。
- 与 GLM / Zhipu / Tsinghua 生态关系：官方文档说明 slime 是 GLM-5.2、GLM-5.1、GLM-5、GLM-4.7、GLM-4.6、GLM-4.5 背后的 RL 训练框架。`2602.15763` GLM-5 技术报告中，Xin Lv 是 tech lead，Chengxing Xie 与 Zilin Zhu 出现在 core contributors 中，构成直接人员重叠。
- 与已存档论文作者重叠：与 [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 直接重叠；与 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) / [2026-06-16](/papers/2026-06-16-verl-rl-optimization-algorithms/) 暂未确认直接作者重叠，但主题上同属大规模 RL post-training infrastructure；与 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 通过 train-rollout logprob consistency、TIS 和 backend mismatch 形成系统问题连接。
- 跨机构桥接：slime 文档连接 THUDM / Tsinghua、Z.ai / GLM 系列、SGLang 社区、Megatron-LM 生态和后训练开源社区；同时有 vime、Miles、Relax、APRIL、TritonForge 等下游系统把 slime 作为 RL substrate 使用。

## 一句话结论

slime 是把 Megatron 训练、SGLang rollout、Ray 资源管理、Data Buffer、custom generation / reward、动态采样、partial rollout、TIS、低精度 rollout、delta weight sync 和 agentic workflow 接到同一条 RL 后训练闭环里的生产级框架；它的核心取舍是深度押注 Megatron + SGLang 的 native 控制面，用更少抽象换取大 MoE、长轨迹和 agentic RL 的吞吐、可调试性和实现一致性。

## 阅读目标与判断边界

本笔记关注：

1. slime 文档如何定义 RL scaling 框架的边界。
2. Quick Start 暴露出的实际训练数据流、参数关系、资源拓扑和复现风险。
3. `v0.3.0` 相比早期版本对 agentic RL、fully async、variable batch 和 train-rollout consistency 的推进。
4. slime 与 GLM-5、VERL/HybridFlow、TIM/VeXact、Seer、Bebop、tool-calling RL 的关系。

判断边界：

- 官方文档与 release note 是工程材料，主要提供设计、接口和能力声明，缺少论文式 ablation。
- Quick Start 推荐 `latest` Docker 和 `git pull`，适合一小时上手；严格复现需要 pin release、commit、image digest、SGLang/Megatron 版本、模型配置和数据版本。
- 文档强调大规模 MoE 和 agentic workload，但很多性能结论依赖硬件、SGLang 版本、Megatron fork、网络拓扑、router policy 和 rollout 长度分布。

## 作者可能的思考路径

大规模 RL 后训练的早期框架主要围绕 PPO/GRPO、reference/reward model 和分布式训练编排展开。进入 long-CoT、tool use、coding agent 和 sandbox agent 后，主要瓶颈逐渐转向 rollout：样本长度高度不均衡，工具或环境返回带来复杂轨迹，reward/verifier 逻辑经常需要接外部系统，推理后端的 KV cache、路由、低精度、权重更新和 session affinity 会直接影响训练效率。

如果把每类任务都做成独立 trainer，框架会很快碎片化。作者更自然的路线是保留两个已经成熟的后端：Megatron 处理训练并行、checkpoint、优化器和大模型能力，SGLang 处理 serving、routing、prefix cache、PD disaggregation、低精度 rollout 和多节点推理。slime 在外层提供 RL loop、Data Buffer、custom generation / reward hooks、Ray 资源编排和一致性检查，让不同任务通过数据生成函数进入同一条训练路径。

这一路线的直觉是：agentic RL 的差异主要发生在“如何生成 trajectory、如何计 reward、哪些 token 参与 loss、样本何时进入训练”，训练核与 rollout backend 应尽量复用生产级引擎。于是 slime 把复杂度放在 Sample、loss_mask、metadata、rollout function、reward function、router policy 和 engine 参数透传上，同时用 CI、debug replay 和 train-rollout logprob 检查约束 silent failure。

## 论文脉络

### 1. slime 解决的核心问题

slime 面向 LLM post-training 的 RL scaling。官方文档把能力拆成两类：

- 高性能训练：连接 Megatron 与 SGLang，让 training backend 与 rollout backend 各自使用成熟优化。
- 灵活数据生成：通过 custom data generation、server-based engine、reward/verifier 和 environment interaction 支持任意训练数据生成流程。

这说明 slime 的定位是一条“采样、奖励、缓存、训练、同步、评估、调试”闭环，覆盖范围超过单个 RL 算法实现。它把 math、code、search、tool、sandbox、multi-agent 和 long-horizon workflow 都当作 data generation 变体。

### 2. 架构：Megatron training + SGLang rollout + Data Buffer

README 的架构图把系统分成三块：

- `training (Megatron)`：从 Data Buffer 读取样本，训练 actor / critic / reference 相关角色，并把参数同步给 rollout 模块。
- `rollout (SGLang + router)`：生成新数据，计算或接入 reward/verifier，把样本写入 Data Buffer。
- `data buffer`：管理 prompt、custom data、partial samples、rollout 生成方法和 agentic workflow 产出的 `Sample`。

这个结构把 RL 训练拆成两个异步程度可调的生产系统：训练系统负责梯度和权重，推理系统负责在线采样和环境交互。Data Buffer 是连接点，也是处理 partial rollout、动态过滤、variable batch 和 agent trajectory 的关键层。

### 3. Quick Start 暴露的训练闭环

Quick Start 的核心约束是：

```text
rollout_batch_size * n_samples_per_prompt
=
global_batch_size * num_steps_per_rollout
```

左边是每轮 rollout 产生的样本数，右边是训练阶段消耗的样本数。默认 `num_steps_per_rollout=1`，对应 on-policy 训练语义。这个约束很重要，因为一旦启用 fully async、partial rollout、dynamic sampling、variable global batch size 或外部 rollout engine，样本新鲜度、样本数量和训练步数之间的关系就需要重新审计。

算法层面，slime 支持 GRPO、GSPO、Reinforce++、Reinforce++ Baseline 和 PPO；Quick Start 中还暴露 `--use-tis`，用于在 rollout policy 与 training anchor 有差异时做截断重要性采样。

### 4. 资源拓扑：训推分离、训推一体和 router

默认配置下，Actor 与 Rollout 资源分开指定：训练使用 `actor_num_nodes * actor_num_gpus_per_node`，rollout 使用 `rollout_num_gpus`。通过 `--colocate` 可以让训练和推理共享 GPU；若设置 `--rollout-num-gpus 0`，slime 只启动 router，本地不启动 SGLang server。

这个设计让 slime 覆盖三种常见形态：

- 小规模上手：同一组 GPU 上 colocate actor 与 rollout。
- 大规模训练：训练和 rollout 分离，分别调资源与显存。
- 外部 serving：slime 只管理训练和 router 接入，rollout engine 由外部部署。

SGLang 参数通过 `--sglang-` 前缀透传，Megatron 参数也尽量保留原生控制面。这个选择让 slime 可以直接使用上游 engine 的新功能，例如 DP Attention、DeepEP MoE、PD disaggregation、FP8 KV cache、delta weight sync 和 debug-only mode。

### 5. Dynamic Sampling 与 Partial Rollout

Quick Start 中的 dynamic sampling 继承 DAPO 类训练的经验：先 over-sampling 更多 prompt group，再用 reward variance 过滤全对或全错组。示例使用 `check_reward_nonzero_std`，只有组内 reward 标准差大于 0 的样本组会进入训练。

Partial rollout 处理 dynamic sampling 中被 abort 的半成品请求。启用 `--partial-rollout` 后，已经生成一部分的样本会缓存到 buffer，下一个 rollout 阶段继续生成，减少浪费。这里的重点是，rollout 系统不只生成完整 response，还维护了可继续、可丢弃、可过滤的中间状态。

这和 [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/) 的 Dynamic Sampling、[2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/) 的 zero-variance prompt filtering、[2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/) 的 rollout long-tail 优化形成同一问题谱系：RL 的有效梯度来自少数有区分度的轨迹，系统需要减少无效生成和无效反传。

### 6. Agentic RL：custom generate / reward 与 loss mask

文档把多轮工具使用拆成三个步骤：

1. 数据准备：把 session、tool、user profile 等额外字段合并进 `metadata`。
2. 自定义生成函数：模拟“模型输出动作、执行工具、拼接 observation”的循环。
3. 自定义奖励函数：对完整轨迹打分。

关键工程点是 `loss_mask`。模型生成的 thinking、action、answer token 设为 1；工具或环境返回的 observation token 设为 0。这样训练目标对准模型自己的动作和推理，环境文本只作为上下文条件存在。

`v0.3.0` 进一步把 agentic RL 做成一等路径：新增 `slime/agent` 模块、sandbox-based coding-agent RL 示例、OpenAI/Anthropic-compatible adapters、trajectory merging、rollout grouping、variable global batch-size training 和 fully async mainline。这说明 slime 的 agent 方向已经从 custom example 上升到框架层能力。

### 7. 低精度 rollout 与大 MoE 训练

Quick Start 明确支持 BF16 training + FP8 rollout。训练侧仍使用从 BF16 Hugging Face 权重转换来的 Megatron checkpoint，rollout 侧可以使用 FP8 inference；long-context rollout 还可以开启 `--sglang-kv-cache-dtype fp8_e4m3` 提升有效 KV cache 容量。

对于大 MoE，文档提供 GLM-4.7-Flash、GLM-5.2 744B-A40B、GLM-4.7、DeepSeek-R1 等多机示例入口。`v0.1.0` release 文档强调 FP8 rollout、DeepEP、MTP、offload、parameter update 和 CI；`v0.3.0` 则把 agent-first、fully async、delta weight sync 和 host-memory 优化继续推进。

### 8. Correctness：RL infra 里的 silent failure

slime 文档把正确性、可复现性和 CI 明确列为基础设施问题。`v0.3.0` release note 中新增了 train-rollout log-prob consistency 检查、delta weight update e2e、GPU placement、multi-sample training 和 server-group GPU indices 验证。

这和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 的 TIM/VeXact 直接相连：RL 训练里 rollout engine 与 trainer engine 的 logprob mismatch 会把名义 on-policy 更新变成带系统偏差的更新。slime 的方向是让 Megatron 与 SGLang 尽量 native，同时用 TIS、一致性检查和 debug replay 监控偏移。

## 关键实验/定理

这是工程文档，没有论文式定理。可沉淀的关键证据是“能力与验证面”：

| 证据 | 文档中的形式 | 解读 |
| --- | --- | --- |
| Production validation | 官方文档称 slime 支撑 GLM-5.2、GLM-5.1、GLM-5、GLM-4.7、GLM-4.6、GLM-4.5 的 RL training | 这是系统规模与真实闭环验证证据，强于 toy example |
| Quick Start path | Docker、HF/Megatron 权重转换、GLM4-9B 脚本、Dapo-Math-17K / AIME 示例 | 上手路径以 Megatron checkpoint 和 SGLang rollout 为默认 |
| Sample-count constraint | `rollout_batch_size * n_samples_per_prompt = global_batch_size * num_steps_per_rollout` | 明确采样与训练消费的闭环平衡条件 |
| Dynamic sampling | over-sampling + reward nonzero std filter | 过滤零方差 prompt group，提高有效样本比例 |
| Partial rollout | abort 后缓存半生成样本并后续继续 | 针对 rollout 长尾和被丢弃请求的系统优化 |
| Agentic hook | `custom-generate-function-path`、`custom-rm-path`、`metadata`、`loss_mask` | 把 tool / environment / sandbox 交互纳入统一 Sample |
| `v0.3.0` updates | agent module、coding-agent RL、fully async、variable batch、host-memory optimization、delta sync | slime 从通用 RL 框架推进到 agent-first RL infrastructure |
| CI / correctness | train-rollout logprob consistency、GPU placement、multi-sample、delta update validation | 直接回应 RL system silent failure |

## 与本地档案的关系

- 与 [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/)：GLM-5 报告给出 slime 在 production agentic RL 中的具体用法，包括异步 rollout、TITO、direct double-sided IS、stale sample dropping、DP-aware routing 和 PD disaggregation；slime 文档提供对应框架入口、版本快照和 Quick Start surface。
- 与 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) / [2026-06-16](/papers/2026-06-16-verl-rl-optimization-algorithms/)：HybridFlow / VERL 更像通用 RLHF/RLVR dataflow framework；slime 选择 Megatron + SGLang native 路线，并把 custom generation 与 SGLang serving 能力放到中心。
- 与 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) / [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：slime 的 TIS、train-rollout logprob consistency 和 debug replay 都服务同一个问题，即 rollout behavior policy 与 trainer optimization policy 的实现级一致性。
- 与 [2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/)：Seer 在 synchronous RL 里压低 rollout long-tail；slime 在 agentic workflow 中强调 fully async、partial rollout、external rollout engine 和 staleness control。两者分别代表同步优化和异步吞吐路线。
- 与 [2606.12370](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/)：Bebop 研究 MTP rejection sampling 提升 RL rollout acceptance；slime 文档与 GLM-5 线都把 MTP、低精度 rollout、SGLang serving 视为 production RL throughput 组件。
- 与 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/)：tool-calling RL 论文强调 harness、tool schema、zero-variance prompts 和 policy update cost；slime 提供 `metadata`、custom generate、loss mask、custom reward 和 dynamic sampling 等工程接口。
- 与 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/)：MiniMax-M1 关注 long-output RL objective 和 Lightning Attention 架构效率；slime 关注 rollout/training 系统层吞吐和 agent trajectory 组织。两者都说明长输出/agent RL 需要同时处理算法、架构和系统。
- 与 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)：UltraEP 处理 MoE expert load balancing；slime 的大 MoE RL 路线会直接受 EP、DeepEP、SGLang MoE serving 和 Megatron parallelism 影响。

## 本地讨论补充

- 本次归档把版本信息放在页面顶部，因为 slime 文档跟随 `latest/main` 更新，Quick Start 又推荐 Docker `latest` 与 `git pull`。后续引用 slime 性能或接口时，必须记录 release tag、docs snapshot、SGLang/Megatron 版本和 Docker image digest。
- 用户给出的 `/zh/get_started` 路径在本次读取时会跳转到一个 404 目录页；真正可访问的中文快速开始页面是 `/zh/get_started/quick_start.html`。索引和 Source 中保留这一点，避免后续误认为文档缺失。

## 主要启发

1. slime 的关键价值在于把 agentic RL 视为数据生成问题：trajectory、tool output、reward、loss mask 和 sample status 都进入统一 Sample，而训练核保持 Megatron 路线。
2. SGLang-native 是明确工程取舍：少做多 backend 抽象，换取 serving、routing、PD disaggregation、low precision、weight sync 和 debug 能力的原生可用性。
3. 版本管理比普通论文更重要。`latest` 文档、`latest` Docker 和 `git pull` 会让复现状态漂移；实验记录必须 pin tag/commit/image/engine。
4. Dynamic sampling、partial rollout、variable global batch 和 fully async 共同指向一个系统判断：RL 的瓶颈已经从单纯 policy update 扩展到 rollout 生成、缓存、过滤、重用和新鲜度控制。
5. 对 tool use / coding agent 训练，`loss_mask` 与 token capture 是核心正确性边界。工具返回进入上下文，但不应被当作模型 action 直接训练。

## 局限

1. 文档主要是工程入口与能力说明，缺少独立 ablation、吞吐表和跨框架公平 benchmark。
2. `slimerl/slime:latest` 与 `git pull` 便于上手，但会降低实验可复现性。
3. 单一 SGLang rollout backend 让系统能深度优化 SGLang，也会让 vLLM、TGI、TensorRT-LLM 等生态的直接比较更依赖外部 fork 或 vime 这类下游项目。
4. custom generation / reward 带来很强灵活性，也把 tokenization、loss mask、reward timing、tool observation capture 和 session routing 的正确性责任交给用户。
5. 文档中 B200 基本功能稳定但暂无 CI 保护；AMD、NPU、external rollout engine、heterogeneous hardware 的稳定性需要单独看平台文档和实际 CI。

## Reference Intake Brief

- Primary source: slime official documentation and Quick Start, Chinese docs snapshot updated 2026-06-17.
- Secondary source: GitHub release `v0.3.0`, repository README, GitHub API release/tag/main commit metadata.
- Archival target: RL systems / post-training infrastructure / agentic RL / rollout correctness.
- New local note ID: `SLIME-2026-06-17`.
- Cross-links required: GLM-5, VERL/HybridFlow, TIM/VeXact, Thinking Machines deterministic inference, Seer, Bebop, tool-calling RL, MiniMax-M1, UltraEP.
- Future follow-up: 如果继续分析 slime advanced docs，优先阅读 fully async、delta weight sync、external rollout engines、PD disaggregation、SGLang config、reproducibility、CI 和 agent adapters。
