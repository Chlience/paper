# verl v0.8.0 与 V1 异步训练数据面技术笔记

First-Archived-At: 2026-06-16 18:19
Updated-At: 2026-07-13 21:34

## Source

- Workflow version: v2
- Material type: composite
- Canonical source: https://github.com/verl-project/verl/releases/tag/v0.8.0
- Title: verl v0.8.0 与 V1 异步训练数据面
- Responsible organization: verl-project contributors；ByteDance Seed 发起并持续参与维护
- Code/Project: https://github.com/verl-project/verl
- Documentation: https://verl.readthedocs.io/en/latest/
- Architecture paper: https://arxiv.org/abs/2409.19256
- Stable release: https://github.com/verl-project/verl/releases/tag/v0.8.0
- Current main snapshot: https://github.com/verl-project/verl/tree/30119a253087bff86c12d329d2d8dd43c589705f
- OpenReview / Review page: 本材料由 release、文档和源码组成，公开审稿页不适用；HybridFlow 论文的审稿状态见其独立笔记。
- Published / updated: v0.8.0 发布于 2026-06-01；main 快照与文档复核于 2026-07-13
- Current version read: stable v0.8.0，tag commit `7aed6b230776f963fa09509c10d9c3a767d1102c`；main `0.9.0.dev`
- Version / revision read: main commit `30119a253087bff86c12d329d2d8dd43c589705f`；`extend_guide.rst` 更新于 2026-06-23；TransferQueue 文档更新于 2026-06-08；fully async 文档更新于 2026-05-25
- Accessed: 2026-07-13
- Subjects: LLM reinforcement learning infrastructure；asynchronous rollout；TransferQueue；ReplayBuffer；rollout correction；agent workflow；on-policy distillation

## 作者与关系

- verl 由社区 contributor 共同维护，单个 release、文档页和实现模块的责任人不同；本笔记以项目版本为分析单位，不把模块贡献者合并成一份论文作者表。
- [Xibin Wu](/authors/xibin-wu/): ByteDance、ByteDance Seed。
- [Guangming Sheng](/authors/guangming-sheng/): The University of Hong Kong、ByteDance Seed。
- [Haibin Lin](/authors/haibin-lin/): ByteDance Seed。
- [Yuxuan Tong](/authors/yuxuan-tong/): Tsinghua University、ByteDance Seed。
- [Yingru Li](/authors/yingru-li/): xAI、The Chinese University of Hong Kong、ByteDance。

关系说明：Xibin Wu 发布 v0.8.0，并持续参与 HybridFlow、verl 与 Laminar；Guangming Sheng 是 HybridFlow 第一作者，并参与 DAPO 基础设施与 Laminar；Haibin Lin 跨 HybridFlow、DAPO、MegaScale 与 Laminar；Yuxuan Tong 连接 DAPO、OTB、TRM 与 verl 工程线；Yingru Li 维护 rollout correction 页面，其研究连接 train-inference mismatch、OTB、TRM 与三策略修正接口。
- one-step-off 与 legacy fully async 文档标注 `meituan-search` 团队，形成同一条资源解耦、partial rollout 和 checkpoint engine 工程线；OPD 页面由 Jacob Helwig 维护，v0.8.0 将该模块扩展到多训练后端、多个教师和 fully async trainer。
- 跨机构桥接主要由 ByteDance Seed 发起的 HybridFlow/verl 主线与 Meituan Search、Ascend TransferQueue、外部推理后端及社区算法贡献者共同完成。

## 一句话结论

verl 当前 main 正把 `sync`、`colocate_async` 与 `separate_async` 收敛到同一套 V1 trainer 数据面：AgentLoop 异步写入轨迹字段，TransferQueue 保存状态与 tensor，ReplayBuffer 按样本年龄取样或淘汰，checkpoint engine 同步权重，rollout/old/current logprob 与版本跨度指标共同约束异步 RL 的训练语义。

本地评价：这条统一数据面是当前最值得跟踪的核心信号。v0.8.0 只稳定交付了 TransferQueue sync trainer，fully async 与 TransferQueue 的统一仍列为后续工作；main `0.9.0.dev` 已出现完整 V1 路径，同时保留阈值命名与实现口径不一致、失败 group 处理未闭合、`separate_async` 强制 bypass correction 等开发期边界。

## 阅读目标与判断边界

本笔记关注：

1. v0.8.0 稳定版已经交付哪些能力，2026-07-13 的 main 又新增了哪些开发中接口。
2. AgentLoop、TransferQueue、ReplayBuffer、trainer 与 checkpoint engine 如何组成一条异步数据流。
3. partial rollout 让一条轨迹跨越多个参数版本后，三种 logprob 和 freshness 指标分别承担什么作用。
4. 官方性能数字支持哪些局部结论，以及 agent 工具环境、OPD、MTP 与核心 trainer 的边界。

判断边界：

- 本材料是 release、滚动文档与源码快照的组合；框架能力随 commit 变化，配置名不能脱离版本引用。
- legacy `verl.experimental.fully_async_policy` 的实验对应独立 experimental 实现；main V1 trainer 需要单独完成端到端验证，两者共享设计动机，控制面和配置接口已有变化。
- 性能结果主要来自官方文档和项目 W&B，缺少多 seed、误差条、独立复验与统一硬件基线。
- 本笔记概括 PPO/GRPO/DAPO 等算法模块在系统中的位置；各算法的效果判断以其独立论文笔记为准。

证据写法：

- 项目事实：release note、文档、配置和源码直接给出的功能、默认值、实验数字与 TODO。
- 维护者主张：项目对吞吐收益、可扩展性与稳定性的解释。
- 本地分析：对版本边界、数据流语义、代码与注释差异、实验归因和外部有效性的判断。
- 源码判断固定到 `30119a253087bff86c12d329d2d8dd43c589705f`，避免把后续 main 变化回填为当前事实。

## 论文脉络

### 1. 研究问题、背景和价值

LLM RL 的一次更新同时调用 rollout engine、工具或环境、reward/verifier、reference/critic 和训练引擎。长 CoT 与 agentic workload 进一步加入长尾生成、异步工具等待、多轮状态和外部服务。同步 batch 需要等组内最慢轨迹完成，训练 GPU 与推理 GPU 因阶段边界产生空闲；扩大 rollout 并行度只能缓解平均吞吐，长尾仍会形成 barrier。

异步化会引入另一组变量：样本由哪个参数版本生成、生成期间是否发生权重切换、trainer 消费时已经落后多少版本、行为策略概率由谁保存、组内轨迹是否完整。此时系统调度和策略梯度估计共享同一批状态，二者需要进入同一条可审计数据流。

verl 的价值因此分成两层：算法层提供 advantage、policy loss、KL 与 rollout correction；执行层负责编排模型、轨迹、数据传输、资源与参数版本。当前 V1 演进的重点位于执行层，它试图让同步和异步模式共用 trainer 主循环与轨迹数据面。

### 2. 已有解决方案与不足

- HybridFlow 的 single-controller / multi-controller 抽象能够表达 PPO、GRPO 等多模型 dataflow，但大量 `DataProto` 经过中心 `RayPPOTrainer`，控制器同时承担编排与数据搬运。
- colocate sync 让训练与 rollout 复用 GPU，部署简单；阶段切换、长尾等待和 KV 清理形成显著气泡。
- one-step-off 把下一批 generation 与当前 batch update 重叠，样本通常落后一个权重版本；批次级 barrier 和长尾仍然存在。
- legacy fully async 把 rollouter、MessageQueue、trainer、ParameterSynchronizer 分开，并加入 `staleness_threshold` 与 `partial_rollout`；它位于 `experimental` 路径，数据面和新 trainer 尚未统一。
- TransferQueue 先解决中心控制器的数据搬运问题。v0.8.0 将它接入 sync trainer，release 当时明确把 fully async integration 留到下一版本。
- rollout correction 文档给出行为、proximal 与 current 三策略框架；系统仍需把对应 logprob、参数版本和 trajectory mask 随样本可靠传递。

这些路径分别解决局部瓶颈。V1 的目标是让 AgentLoop 生产轨迹、TransferQueue 传递字段、ReplayBuffer 决定样本、trainer 执行目标、checkpoint engine 更新推理服务，共用一份状态语义。

### 3. 作者可能的思考路径

以下为基于版本演进的本地重建：

1. 先用 HybridFlow 把 RLHF 表达成可组合 dataflow，并支持 FSDP、Megatron 与不同 rollout engine。
2. 从 long-CoT 训练日志中识别 generation 长尾与阶段等待，先实现 one-step-off，再用独立 rollouter 和流式样本推进 fully async。
3. 观察中心 trainer 传递全部 tensor 的扩展性问题，引入 TransferQueue，把状态元数据和实际数据存储分开。
4. 把 AgentLoop 收敛为“非阻塞接收 prompt、完成后写轨迹”的契约，把采样策略收敛为可替换 ReplayBuffer。
5. 让 `sync`、`colocate_async`、`separate_async` 只通过 hooks、资源布局和 checkpoint 行为改变执行方式，复用 reward、logprob、advantage 与 update 主循环。
6. 为 partial rollout 增加参数版本区间，为 replay 增加 freshness 阈值，为 rollout mismatch 增加三策略修正和诊断指标。

### 4. 核心假设或切入点

V1 数据面依赖四个假设：

1. **轨迹字段可物化**：prompt、response、mask、rollout logprob、reward 和版本标签可以在生产者与消费者之间独立存取。
2. **执行模式可局部化**：同步和异步的主要差异可以封装在采样时机、资源切换与权重同步 hooks 中，trainer 的 RL 计算顺序保持一致。
3. **陈旧性可观测**：prompt 派发 step、轨迹使用的最早/最晚权重版本和 trainer 当前 step 足以构造可操作的 freshness 指标。
4. **分布偏移可控制**：保存逐 token 行为 logprob，并配合淘汰、importance sampling、rejection sampling 或 bypass PPO，可以把异步偏移限制在可训练范围。

第四个假设具有 workload 依赖性。长轨迹上的 ratio 连乘会提高方差，截断会引入偏差；工具环境还会改变状态转移和轨迹长度。因此 freshness threshold 与 correction 需要通过训练质量、ESS、ratio 和长度分布共同校准。

### 5. 方法 / 系统 / 理论框架

#### 5.1 两个版本快照必须分开

| 能力 | v0.8.0 stable，2026-06-01 | main `0.9.0.dev`，2026-07-13 | 判断 |
| --- | --- | --- | --- |
| 入口与 trainer | release 推荐新的 TransferQueue sync trainer，并弃用当时的 `main_ppo.py` | `main_ppo.py` 已变成 V1/V0 开关，默认 `trainer.use_v1: true`；`main_ppo_v0.py` 计划在 v0.9.0 移除 | 入口在连续重构，命令必须绑定版本 |
| TransferQueue | 正式接入 sync trainer；fully async integration 标为下一 release 计划 | V1 三种 trainer mode 均初始化 TransferQueue 与 ReplayBuffer | 统一数据面属于 main 开发态能力 |
| fully async | 独立 experimental trainer 已可运行，并有 DAPO、GRPO、tool-use 实验 | `separate_async` 进入 V1 registry，共用 trainer base | legacy 实验支持方向，尚未直接验证 V1 实现 |
| OPD | FSDP、Megatron、VeOmni；文本/多模态；单/多教师；sync/fully async；reverse KL 与 forward top-k KL | 继续作为 trainer pipeline 的可选 dense teacher signal | 早期 async OPD recipe 已无法代表完整支持面 |
| agent 接入 | uni-agent、function tool、按样本路由工具环境 | AgentLoopManager 可整体替换；black-box gateway 通过 uni-agent 接入 | trainer 定义轨迹契约，环境实现由外部模块承担 |

证据定位：v0.8.0 [release highlights](https://github.com/verl-project/verl/releases/tag/v0.8.0)；main [`main_ppo.py`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/trainer/main_ppo.py) 与 [`ppo_trainer.yaml`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/trainer/config/ppo_trainer.yaml)。

#### 5.2 V1 的统一数据流

V1 的主路径可以直观写成：

```text
Dataset / prompts
    -> AgentLoopManager.generate_sequences(...)
    -> AgentLoop workers + LLM/tool/reward services
    -> TransferQueue: trajectory fields + status/version tags
    -> ReplayBuffer.sample(...)
    -> reward -> old/ref logprob -> values -> advantage
    -> critic update -> actor update
    -> CheckpointEngine.update_weights(global_step)
    -> rollout replicas
```

`AgentLoopManager` 的替换契约只有两个核心条件：`generate_sequences` 对实际 rollout 保持非阻塞，轨迹完成后把 `prompt_ids`、`response_ids`、`response_mask` 等字段写入 TransferQueue。默认 `AgentLoopManagerTQ` 将一个 prompt 的 `rollout.n` 条 session 分配给 workers；同一 agent loop 还可以输出多条 trajectory，以 `{uid}_{session_id}_{index}` 作为 key。

TransferQueue 把轻量 tag 与 TensorDict value 分开。tag 记录 `status`、序列长度和参数版本，value 保存 token、mask、logprob、reward 及数据集字段。ReplayBuffer 先读取 tag 决定哪些 prompt group 可消费，再按 key 获取训练所需字段。trainer 完成 update 后清理已消费 key，并通过 checkpoint engine 向 rollout replicas 同步新权重。

这条路径缩小了中心 controller 的职责：controller 触发工作和观察元数据，tensor 由可插拔 storage backend 承载。默认 SimpleStorage 位于 CPU memory；Yuanrong 与 MooncakeStore 在文档中标为 beta，RayRDT 标为 alpha，生产选择仍需结合传输、容错和部署成熟度。

证据定位：main [`agent_loop_tq.py`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/trainer/ppo/v1/agent_loop_tq.py)、[`replay_buffer.py`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/trainer/ppo/v1/replay_buffer.py)、[`trainer_base.py`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/trainer/ppo/v1/trainer_base.py)；[extension guide](https://verl.readthedocs.io/en/latest/extend_guide.html)；[TransferQueue docs](https://verl.readthedocs.io/en/latest/data/transfer_queue.html)。

#### 5.3 三种 trainer mode 改变资源与时间关系

| V1 mode | 资源关系 | rollout 行为 | 权重与数据行为 | 当前边界 |
| --- | --- | --- | --- | --- |
| `sync` | trainer 与 rollout colocate | partial rollout 关闭 | 每步后同步权重；采样后 rollout replicas sleep 并丢弃 weights/KV | 语义最清楚，阶段气泡保留 |
| `colocate_async` | trainer 与 rollout colocate | FullyAsync client；默认预热一批；允许中断后续生成 | 采样结束时 abort/sleep，step 结束后同步并 resume | 共享 GPU 需要在 rollout/train 阶段切换，重叠空间受资源复用限制 |
| `separate_async` | standalone rollout 与 trainer 分离 | partial rollout；rollout 在 trainer update 时继续生产 | 默认每 4 个 local update 同步；要求非 naive checkpoint backend | 当前强制 `bypass_mode=True`；独立 reward-model pool；动态把闲置 trainer 切回 rollout 的策略仍是 TODO |

三种 mode 继承同一 `PPOTrainer`，通过 `on_train_begin`、`on_sample_begin/end`、`on_step_end` 等 hooks 改变 server 状态和权重同步。这个结构使算法模块能够复用，也让模式差异更容易通过 timing、queue 和 staleness 指标比较。

`separate_async` 还有两个明确约束：`train_batch_size = parameter_sync_step * ppo_mini_batch_size`；checkpoint engine backend 需要使用 NCCL、NIXL、Mooncake 等实现。源码注释写有“trainer 空闲时可切换到 rollout”，当前 `should_switch_to_rollout()` 固定返回 `False`，因此这项动态复用仍处于设计位。

证据定位：main [`trainer_sync.py`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/trainer/ppo/v1/trainer_sync.py)、[`trainer_colocate_async.py`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/trainer/ppo/v1/trainer_colocate_async.py)、[`trainer_separate_async.py`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/trainer/ppo/v1/trainer_separate_async.py)。

#### 5.4 三种 logprob 对应两段分布漂移

rollout correction 将策略分成：

$$
\pi_{\text{rollout}},\qquad \pi_{\text{old}},\qquad \pi_\theta.
$$

- $\pi_{\text{rollout}}$ 是实际生成 token 的行为策略。
- $\pi_{\text{old}}$ 是当前 PPO batch 的 proximal anchor，在同一批 mini-batch updates 中保持固定。
- $\pi_\theta$ 是正在更新的 actor。

Decoupled mode 分别处理两段漂移：

$$
\rho_t=\frac{\pi_{\text{old}}(a_t\mid s_t)}{\pi_{\text{rollout}}(a_t\mid s_t)},
\qquad
r_t(\theta)=\frac{\pi_\theta(a_t\mid s_t)}{\pi_{\text{old}}(a_t\mid s_t)}.
$$

$\rho_t$ 用于行为策略到 proximal policy 的 importance correction，$r_t$ 用于 PPO clipping。Bypass mode 令 $\pi_{\text{old}}=\pi_{\text{rollout}}$，直接把 rollout logprob 作为 old logprob，省去 trainer 的一次重算；它保留当前策略相对行为策略的 PPO ratio，同时失去独立 proximal anchor。

importance sampling 的粒度决定偏差与方差。完整 sequence ratio 在截断前具有标准 IS 语义，长 horizon 上乘积方差很高；截断后引入偏差。token-level truncated IS 控制方差，文档推导的 bias bound 随 horizon 增长，可写成 $O(T^2\Delta_{\max})$ 量级。系统吞吐因此需要与 IS weight、ESS、rejection fraction、KL/K3 和任务质量一起观察。

main V1 的 `separate_async` 在构造时直接把 `algorithm.rollout_correction.bypass_mode` 设为 `True`，并留下 Decoupled PPO TODO。这一实现状态说明当前 V1 独立异步路径已经传递行为 logprob，完整三策略 correction 仍待接通。

证据定位：[rollout correction](https://verl.readthedocs.io/en/latest/algo/rollout_corr.html) 与 [mathematical derivation](https://verl.readthedocs.io/en/latest/algo/rollout_corr_math.html)；main `trainer_base.py::_compute_old_log_prob` 和 `trainer_separate_async.py::__init__`。

#### 5.5 partial rollout 让一条轨迹成为版本混合物

`FullyAsyncLLMServerClient` 在权重切换时可以中断 generation，保留已生成 token，再用新权重继续请求。它为每条轨迹记录：

- `global_steps`：prompt 从 dataloader 派发时的版本标签。
- `min_global_steps`：该轨迹开始生成时使用的最早权重版本。
- `max_global_steps`：该轨迹结束生成时使用的最新权重版本。

由此得到：

$$
\text{span}=g_{\max}-g_{\min}+1,
$$

$$
\text{fresh-lag}=(g_{\text{train}}-1)-g_{\max},\qquad
\text{worst-lag}=(g_{\text{train}}-1)-g_{\min}.
$$

`span=1` 表示整条轨迹由同一权重版本生成；`span>1` 表示 token 分段来自不同 checkpoint。更精确的行为策略记号应写为 $\mu_{v(t)}$，每个 token 的 rollout logprob 为：

$$
\log \mu_{v(t)}(a_t\mid s_t).
$$

只要每个 token 保存其真实生成概率，token-level correction 仍有明确输入；把整条轨迹简写成单一 $\pi_{\text{rollout}}$ 时需要记住这层版本混合。sequence-level ratio、trajectory reward 和多轮工具状态会进一步放大 horizon 与版本切换的影响。

证据定位：main [`llm_server.py`](https://github.com/verl-project/verl/blob/30119a253087bff86c12d329d2d8dd43c589705f/verl/workers/rollout/llm_server.py) 中 `FullyAsyncLLMServerClient.generate`；`agent_loop_tq.py` 的版本 tags；`trainer_base.py` 的 off-policy metrics。

#### 5.6 `max_off_policy_threshold` 的注释与当前实现口径不同

配置把 `max_off_policy_threshold` 描述为“一条 trajectory 最多跨越多少个模型版本”，默认值为 8。当前 ReplayBuffer 的 `wait` 与 `drop` 条件实际使用：

$$
\text{age}=g_{\text{train}}-g_{\text{prompt}}+1.
$$

这里的 $g_{\text{prompt}}$ 来自 prompt 派发时保存的 `global_steps`。因此该阈值在当前 commit 中约束的是从 prompt 派发到 trainer 消费的样本年龄；真实 trajectory span 由 `max_global_steps - min_global_steps + 1` 单独记录和上报，尚未进入这段淘汰判断。

这一区别会影响长工具任务：队列等待、环境执行和生成中断都会增加 age；一条始终使用单一旧 checkpoint 的轨迹可能 age 很高而 span 为 1，一条很快完成但跨过一次权重同步的轨迹可能 age 较低而 span 为 2。生产配置应同时观察 age、span、fresh-lag 与 worst-lag，并明确 threshold 想控制哪一种风险。

ReplayBuffer 还有两个开发期 TODO：`failure` 状态的 prompt group 当前进入可采样集合，源码仍在询问是否过滤失败 session；drop path 也未决定当一个 session 超阈值时是否删除整个 GRPO group。两处都会影响组内样本数、advantage 统计和有效 batch，需要在大规模 GRPO 前复验。

证据定位：main `ppo_trainer.yaml` 的 sampler 配置；`replay_buffer.py::_has_enough_samples`、`_drop_max_off_policy_samples` 与 `sample`。

#### 5.7 工具环境、OPD 与 MTP 位于数据面两侧

工具调用由 AgentLoop 承担。官方 extension guide 支持无状态 function tool 和继承 `BaseTool` 的有状态工具，也允许整体替换 AgentLoopManager。legacy fully async 的 multi-turn 实验通过 `sandbox_fusion_tool_config.yaml` 连接 Sandbox Fusion。这个配置说明 sandbox 是可插拔工具后端；trainer 只接收 token、mask、reward 和轨迹元数据，不负责定义容器生命周期、网络权限或动态网页状态。

对 Claude Code、Codex、Trae 等 black-box agent，uni-agent gateway 提供兼容 message API、token-in-token-out、prefix-based trajectory tracking 和 session management。它把外部 agent runtime 转换为 V1 可消费的轨迹契约，环境隔离、认证和副作用控制仍由 gateway 与工具服务负责。

OPD 位于 reward signal 一侧。学生在自身 state distribution 上 rollout，教师返回 token-level knowledge；v0.8.0 已支持 reverse KL、forward top-k KL、多教师路由、文本/多模态和 sync/fully async。它复用 rollout、teacher server、TransferQueue 与 trainer pipeline，优化目标从稀疏 reward 扩展到 dense teacher signal。

MTP 位于 rollout engine 一侧。它可以提供 speculative tokens，也会引入 draft、verify 和调度开销。官方 H20 示例中 acceptance rate 提高约 14%，mimo-7B + SGLang 的 rollout throughput 反而下降约 50%，说明 acceptance rate 只能作为中间指标，最终判断需要 tokens/s、step time 和端到端训练时间。

#### 5.8 算法模块通过同一执行底座组合

| 层 | 代表模块 | 核心状态 | 与 V1 数据面的关系 |
| --- | --- | --- | --- |
| advantage / objective | PPO、GRPO、DAPO、OPO、GPG、OTB、DPPO | reward、values、advantage、mask、loss aggregation | ReplayBuffer 产出的完整 group 和 mask 决定统计语义 |
| rollout correction | bypass、decoupled、TIS、rejection sampling | rollout/old/current logprob、IS weight、ESS | 依赖轨迹携带真实行为概率和版本信息 |
| dense teacher signal | OPD、multi-teacher OPD | teacher logprob、routing key、KL loss | teacher service 与 rollout 并行，字段写入同一数据流 |
| inference acceleration | MTP、不同 rollout engine、checkpoint backend | acceptance、KV、weight version、sync time | 改变样本生产速度和 train-inference mismatch |

这一分层有助于实验归因。算法 loss、采样 freshness、推理后端和资源布局可以独立变化；报告时需要逐项固定或记录，端到端收益才有可解释基线。

### 6. 结论链条

1. agentic RL 的瓶颈来自多阶段 dataflow、长尾轨迹和外部环境，单纯优化 policy loss 无法消除执行气泡。
2. v0.8.0 已用 TransferQueue 将 sync trainer 的控制流与 tensor 数据流分开，legacy fully async 已验证独立 rollouter、partial rollout 与 checkpoint sync 的吞吐潜力。
3. main V1 进一步让三种 trainer mode 共用 AgentLoop、TransferQueue、ReplayBuffer 和 trainer base，统一数据面成为当前核心架构变化。
4. partial rollout 允许一条轨迹跨参数版本，rollout logprob、版本 span 与 staleness 指标成为训练语义的一部分。
5. 当前源码仍有版本口径、失败 group、group-level drop 和 decoupled correction 等未闭合项，开发分支能力应按 commit 试验后再进入生产结论。
6. 工具 backend、OPD 与 MTP 均可接入同一执行底座；它们分别改变环境交互、训练信号和样本生产速度，需要单独核算正确性与吞吐。

## 关键实验/定理

### 结果 1：TransferQueue 在 stable sync trainer 中报告 49.1% 端到端收益

- 设置：多模态 post-training，128×H100；TransferQueue 接入 single-controller sync trainer。
- Baseline：原 `RayPPOTrainer` 负责集中传递 `DataProto` 的路径。
- 指标：端到端性能；文档报告 49.1% gain，v0.8.0 release 另表述为最高 2×。
- 证据定位：[TransferQueue docs，Updates 与 verl showcase](https://verl.readthedocs.io/en/latest/data/transfer_queue.html)；[v0.8.0 release，Sync Trainer](https://github.com/verl-project/verl/releases/tag/v0.8.0)。
- 对照是否可比：设置细节和原始日志主要位于项目博客，公开页面没有完整训练配置与重复试验；两种收益表述不应合并成同一个精确数字。
- 支持的最窄结论：在一项 128×H100 多模态 workload 中，移除中心 controller 的 tensor 搬运瓶颈可显著提高端到端吞吐。

### 结果 2：legacy fully async 在 128×H20、7B long-CoT 上报告 2.35×

- 设置：Qwen2.5-Math-7B，DAPO，vLLM+FSDP2，28K max response，`rollout.n=16`，400 steps；async 使用 64 trainer + 64 rollout GPUs，`staleness_threshold=0.5`、`partial_rollout=True`。
- Baseline：128 GPU colocate sync，同样总 GPU 数和 `512×400` rollout 预算。
- 指标：总时间与 AIME 2024 `acc/mean@1`。
- 结果：`1d16h48m -> 17h22m`，2.35×；sync max/last 为 `0.3573/0.2958`，async 为 `0.3521/0.3094`。
- 证据定位：[fully async docs，Asynchronous Training on 7B Model](https://verl.readthedocs.io/en/latest/advance/fully_async.html)。
- 对照是否可比：总 GPU 与 rollout 数对齐；资源角色、old-logprob 路径和 sample ordering 改变。单条训练曲线缺少误差条。
- 支持的最窄结论：在该 long-CoT first-party run 中，资源分离、streaming、staleness 与 partial rollout 的组合显著缩短 wall-clock，最终点估计未显示明显质量下降。

### 结果 3：streaming 单独开启会改变训练轨迹

- 设置：同一 128-card 7B 实验，对照 colocate sync、stream off-policy pipeline，以及加入 stale samples 与 partial rollout 的组合。
- Baseline：colocate sync。
- 指标：400-step 时间与 AIME `acc/mean@1`。
- 结果：stream-only 路径用时 `1d1h53m`，max/last accuracy 为 `0.2844/0.2604`；完整 partial 组合用时 `17h22m`，max/last 为 `0.3521/0.3094`。
- 证据定位：[fully async docs，128-card mode experiment](https://verl.readthedocs.io/en/latest/advance/fully_async.html)。
- 对照是否可比：属于同一文档和 workload；中间表的 stale-only 行未给数字，组件贡献无法完整分解。
- 支持的最窄结论：样本顺序、staleness 与 partial rollout 的组合会改变 response length 和训练动态，streaming 本身没有形成稳定的单调收益。

### 结果 4：30B MoE 的 legacy fully async 收益为 1.72×

- 设置：Qwen3-30B-A3B-Base，GRPO，vLLM+Megatron，8K max response，128×H20，400 steps；async 采用 96 rollout + 32 trainer GPUs。
- Baseline：128 GPU colocate sync。
- 指标：总时间与 AIME 2024 `acc/mean@1`。
- 结果：`2d11h39m -> 1d10h41m`，1.72×；sync max/last 为 `0.3500/0.3208`，async 为 `0.3813/0.3448`。
- 证据定位：[fully async docs，30B Model Mode Experiment](https://verl.readthedocs.io/en/latest/advance/fully_async.html)。
- 对照是否可比：总 GPU 数一致，资源分配高度偏向 rollout；文档承认并行度整除约束限制了配置搜索。
- 支持的最窄结论：独立 rollout/train 在该 30B MoE workload 上仍有端到端收益，2.35× 的 7B 数字不能直接外推。

### 结果 5：multi-turn tool-use 实验报告 1.60×，sandbox 通过外部工具配置接入

- 设置：Qwen2.5-7B-Instruct 经 ReTool-SFT 后做 DAPO；32×H20；最多 16 user/assistant turns；工具路径为 `recipe/retool/sandbox_fusion_tool_config.yaml`。
- Baseline：32 GPU colocate sync；async 为 16 trainer + 16 rollout GPUs，`staleness_threshold=1`、`partial_rollout=True`。
- 指标：200-step 总时间与 AIME 2025 `acc/mean@30`。
- 结果：`22h28m -> 14h04m`，1.60×；最后 accuracy 为 `0.2056` 与 `0.2044`。
- 证据定位：[fully async docs，Multi-Turn Tool Calling](https://verl.readthedocs.io/en/latest/advance/fully_async.html)。
- 对照是否可比：总 GPU 数与 step 数对齐；单次曲线，工具执行耗时分布和 sandbox 服务容量未披露。
- 支持的最窄结论：该 Sandbox Fusion 数学工具 workload 中，partial tool rollout 可恢复并缩短训练时间；结果不覆盖动态网页、真实 API 副作用或复杂权限隔离。

### 结果 6：checkpoint engine 降低大模型权重同步时间

- 设置：H20 + Megatron；分别测试 7B、30B-A3B、235B-A22B 的一次 trainer-to-rollout 参数同步。
- Baseline：默认非 checkpoint-engine 路径。
- 指标：单次 sync time。
- 结果：7B `0.12s -> 0.02s`；30B `15.76s -> 4.38s`；235B `58.57s -> 23.70s`。
- 证据定位：[fully async docs，checkpoint-engine ablation](https://verl.readthedocs.io/en/latest/advance/fully_async.html)。
- 对照是否可比：同页同硬件的组件级 microbenchmark；未披露重复次数和网络拓扑。
- 支持的最窄结论：参数同步会随模型规模成为异步 pipeline 的显著 barrier，专用 checkpoint engine 在这些配置中降低了该组件时间。

### 结果 7：MTP acceptance 提高时，rollout throughput 仍可能下降

- 设置：mimo-7B，H20，SGLang，独立 rollout deployment。
- Baseline：关闭 MTP speculative decoding。
- 指标：acceptance rate 与 rollout throughput。
- 结果：acceptance rate 提高约 14%，throughput 下降约 50%。
- 证据定位：[MTP docs，Performance](https://verl.readthedocs.io/en/latest/advance/mtp.html)。
- 对照是否可比：同一示例中的开关对照；硬件、kernel 和 batch 细节不足，适用范围较窄。
- 支持的最窄结论：MTP 的中间接受率无法替代端到端吞吐测量。

### 实验设置与 baseline 审计

| 审计项 | 当前状态 | 对结论的影响 |
| --- | --- | --- |
| 版本一致性 | TQ 数字来自 v0.8 stable；fully async 数字来自 legacy experimental；V1 来自 main 源码 | V1 架构与 legacy 性能不能合并成同一已验证系统 |
| 计算预算 | 主要 fully async 表对齐总 GPU 数、step 和 rollout 数 | 支持 wall-clock 比较；资源角色与执行语义发生变化 |
| 质量比较 | 给出 max/last point estimates | 可排除明显崩溃，无法证明统计等价 |
| 重复试验 | 未见 seeds、置信区间或误差条 | 小幅质量差异保持低置信度 |
| baseline 强度 | colocate sync 是合理框架基线；未系统比较 Laminar、AReaL、slime、RollArt | 支持框架内收益，难以判断跨系统最优性 |
| component attribution | mode ablation 有缺行；资源分离、streaming、staleness、partial rollout 常一起变化 | 端到端 recipe 结论强于单组件因果结论 |
| tool environment | Sandbox Fusion 配置明确，服务容量和执行时长分布缺失 | 支持特定代码/数学工具 workload，外推到开放环境需复验 |

## 证据链强度评估

### 强证据

- stable release 明确区分 v0.8.0 的 TransferQueue sync trainer 与后续 fully async integration，版本边界可直接核验。
- main V1 的三种 mode、统一 TransferQueue 初始化、AgentLoopManager 契约、ReplayBuffer 和 checkpoint hooks 均有源码实现。
- rollout/old/current 三策略与 bypass/decoupled 计算路径在文档和 `trainer_base.py` 中相互对应。
- partial rollout 的 `min_global_steps`、`max_global_steps` 记录与 span/staleness 指标具有完整源码链路。

### 中等强度证据

- fully async、tool-use、checkpoint engine 和 TransferQueue 均给出具体硬件、模型或时间数字，足以支持项目内部工程判断。
- 这些结果来自维护团队与官方 W&B，缺少独立复验和统计不确定性，跨系统排名仍需统一 benchmark。
- v0.8.0 的 OPD 支持面有 release 与实现 PR 支撑，具体组合的稳定性仍取决于 backend 和配置。

### 需要谨慎的推论

- main V1 已具备统一代码路径，尚无证据证明它复现 legacy fully async 的全部吞吐与质量数字。
- `max_off_policy_threshold` 的配置描述与当前判断变量不同，生产上只设置该阈值不足以同时控制 age 和 within-trajectory span。
- point estimate 接近只能说明该 run 未出现显著退化，无法证明异步 correction 在不同 reward、长度和工具环境下保持等价。
- MTP、参数同步和数据传输的收益依赖模型形态、GPU、网络、batch、序列长度与 kernel，局部 microbenchmark 不能线性相加为端到端收益。

## OpenReview / 审稿意见吸收

- Page type: not-applicable
- Match confidence: high
- Match rationale: 分析对象明确为官方 release、文档和源码组合。
- Observed at: 2026-07-13
- Venue status: framework release / rolling documentation / development snapshot。
- Public reviews: 不适用；HybridFlow 架构论文、DAPO 算法论文和 OPD 论文分别在独立档案中吸收其审稿或发表状态。
- Ratings / confidence: 不适用。
- Reviewer consensus: 无统一 peer-review 对象。
- Main criticisms: 可信度主要受版本快速变化、first-party benchmarks、缺少误差条以及 stable/dev/experimental 三类证据混合影响。
- Author response: 不适用。
- 对本文可信度的影响: 架构和代码状态可高置信描述；性能外推与算法等价性维持中低置信度。

## 本地讨论补充

### 1. VERL 的核心信号应聚焦统一数据面

旧版核心信号把 PPO/GRPO/DAPO、rollout correction、fully async、distillation 和 MTP 全部并列，覆盖面过大。当前更聚焦的观察是：V1 让同步、共置异步和分离异步共用 AgentLoop、TransferQueue、ReplayBuffer 与 trainer base，并把参数版本和行为 logprob 作为轨迹字段管理。

算法目标仍然重要，它们通过这一执行底座组合。索引只保留数据面贡献，正文再解释 OPD、MTP 和各类 objective 的接入位置。

### 2. TransferQueue 提供数据交换，ReplayBuffer 定义训练样本

TransferQueue 负责状态可见性、字段存储和传输；ReplayBuffer 决定何时形成 batch、先取哪些 prompt、如何处理陈旧样本。两者组合才构成训练数据面。对于 GRPO，采样单位还涉及 prompt group 与多个 session，单条 trajectory 的删除可能改变组大小，因此 group-level policy 需要显式定义。

### 3. 当前等待年龄与轨迹版本跨度是两个变量

样本年龄回答“这个 prompt 从派发到现在经历了多少 trainer steps”；轨迹跨度回答“它生成期间实际用了多少个模型版本”。前者反映队列、环境和生成总延迟，后者反映单条轨迹内部的行为策略切换。二者都与 off-policy 风险相关，机制不同，适合分别设置告警和策略。

### 4. partial rollout 的 correction 应绑定到 token 版本

一条跨版本轨迹的行为策略随 token 改变。逐 token 保存 rollout logprob 能保留实际 behavior likelihood；只保存一个 trajectory-level checkpoint id 会丢失这层信息。长 horizon 下，sequence ratio 的乘积方差很大，工程上通常还需要截断、rejection、span 上限或直接丢弃过旧样本。

### 5. Sandbox 是工具后端，AgentLoop 是交互契约

VERL 提供 function tool、stateful tool、custom AgentLoop 与 uni-agent gateway。Docker、Sandbox Fusion、远程 API、浏览器或其他动态环境都可以位于该契约后方。训练框架关注 token、observation、mask、reward、异常状态和可复现标识；环境服务负责生命周期、权限、网络、资源限制和动态内容快照。

### 6. 论文写作中应分开 throughput 与 algorithm claim

推荐表述为：“在固定模型、总 GPU 数、rollout 预算和任务下，独立 rollout/train、streaming、staleness 与 partial rollout 的组合将 400-step wall-clock 从 A 降到 B；任务指标为对应 point estimate。”随后单列 correction、span、ESS 和 length distribution。

“异步训练保持 on-policy 等价”需要更强证据，包括真实 behavior logprob、版本分布、校正公式、有效样本量、重复 runs 和质量置信区间。当前官方实验更适合支撑系统吞吐结论。

### 7. 选择 mode 时先定位等待来源

- 复现算法或调试 reward 时，`sync` 提供最清晰的版本和 batch 边界。
- generation 长尾明显、GPU 资源仍需共置时，`colocate_async` 可利用预取与 resumable partial rollout，需观察阶段切换开销。
- rollout 和 trainer 可独立部署、长工具等待占主导时，`separate_async` 提供充分重叠；需要同时审计 checkpoint sync、queue depth、age/span、bypass ratio 与 standalone reward service。
- teacher query 成为主瓶颈时，OPD 的 teacher pool 和异步 retrieval 进入资源平衡问题。

## 主要启发

- 异步 RL 系统应把 trajectory 数据、参数版本、行为概率和消费状态作为同一份可追踪记录。
- freshness 至少包含派发年龄、轨迹版本跨度、最新版本 lag 和最坏版本 lag；单一 staleness 标量容易混淆不同风险。
- trainer mode 的抽象边界适合落在 hooks、ReplayBuffer、AgentLoop 与 checkpoint engine，算法 objective 可以在其上复用。
- 工具环境通过稳定轨迹契约接入训练，sandbox 实现与 RL trainer 可以独立演进。
- 训练效率报告需要同时包含 wall-clock、GPU 配置、样本预算、quality、ratio/ESS、长度分布和版本指标。

## 局限

- main `0.9.0.dev` 处于快速变化阶段，本笔记中的类名、默认值和 TODO 固定到 2026-07-13 commit。
- stable v0.8.0、legacy experimental fully async 与 main V1 的证据来自三个版本层，端到端能力不能直接拼接。
- 官方 fully async 实验缺少多 seed 与误差条，质量“基本保持”只由单次 point estimate 支撑。
- ReplayBuffer 对失败 session、超阈值 group 和自定义 sampler 的行为仍需在真实 GRPO/agent workload 中验证。
- `separate_async` 当前强制 bypass mode，完整 decoupled correction 的性能与稳定性尚无 V1 证据。
- TransferQueue 的非默认存储 backend 仍有 beta/alpha 状态，容错、恢复和大规模生产稳定性需要独立测试。
- 工具实验集中在 Sandbox Fusion 数学任务，缺少动态网页、长时 API、权限失败和有副作用工具的系统评测。

## 跨论文关系

- [HybridFlow](/papers/2409.19256-hybridflow-rlhf-framework/) 提供 verl 的原始多模型 dataflow 与 single-controller/multi-controller 抽象；V1 继续把中心数据搬运拆到 TransferQueue，并把执行模式收敛到 trainer hooks。
- [DAPO](/papers/2503.14476-dapo-long-cot-rl-system/) 提供 long-CoT GRPO recipe，也是 one-step-off、fully async 与 TransferQueue 大规模测试的主要 workload；系统提速与 DAPO 算法贡献需要分开归因。
- [TIM](/papers/2605.14220-training-inference-mismatch-llm-rl/) 解释 rollout backend、精度和参数延迟产生的行为策略偏移；verl 将其工程化为 rollout logprob、三策略 correction、K3/chi-square/ESS 等诊断。
- [Laminar](/papers/2510.12633-laminar-asynchronous-rl-post-training/) 同样围绕异步 rollout、参数同步和样本 freshness 设计系统；它提供跨框架比较时的重要 baseline。
- [Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/) 保持同步训练语义，通过 group-aware scheduling、KV reuse 与 speculative decoding 缩短 rollout；它与 verl fully async 代表两种不同的长尾处理位置。
- [RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/) 将 agentic RL 的 rollout 与训练资源分离，和 V1 `separate_async` 共享 disaggregation 方向。
- [On-Policy Distillation](/papers/2306.13649-on-policy-distillation-language-models/) 提供学生自生成状态上的教师信号；verl v0.8.0 把这类目标扩展成多后端、多教师、同步和异步执行模块。
- [MOPD](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/) 进一步研究多教师路由与聚合，可映射到 verl 的 `teacher_key` 和独立 teacher pools。
- [Agentic Tool-calling RL](/papers/2606.00135-agentic-tool-calling-rl-training/) 说明长 tool context 下 update 与无效 rollout 的成本；其 VERL 训练优化位于算法采样层，V1 数据面则负责承载轨迹和异步执行。
- [GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) 中的 slime、TITO 与异步 agent RL 展示另一套生产实践，可用于比较外部 agent runtime、token ownership 和 correction 设计。

## Reference Intake Brief

### Target

- 用于后续撰写或设计 agentic RL infrastructure、fully async rollout、sample freshness、rollout correction 与工具环境接入。

### Reusable Elements

- V1 的 `AgentLoopManager -> TransferQueue -> ReplayBuffer -> trainer -> checkpoint engine` 数据流。
- stable / development / experimental 三层版本审计方法。
- rollout/old/current 三策略与 age/span/fresh-lag/worst-lag 四类版本指标。
- 端到端效率实验的最窄结论、baseline 审计和论文写作表述。

### Risks

- main API 会继续变化；引用实现时必须保留 commit。
- first-party point estimates 支撑系统内部结果，跨框架泛化与算法等价性仍需复验。
- 配置注释、源码判断变量和 metric 名称可能处于迁移期，需同时读 config、sampler 和 logging path。

### Skipped

- 跳过 PPO、GRPO、DAPO、OPO、GPG、OTB 与 DPPO 的逐算法教程；它们会遮蔽本材料的数据面核心贡献，并已有独立论文或主题笔记。
- 跳过统一 reviewer 意见吸收；该 composite 没有单一公开审稿对象。
- 跳过未公开的生产集群细节和无法复核的稳定性归因。

### Recommendation

Decision: revise-then-merge

Why: 吸收统一 V1 数据面、三策略与版本指标；修订 stable/dev/experimental 混用、`max_off_policy_threshold` 语义和性能归因；保留 legacy fully async 数字作为方向性系统证据。
