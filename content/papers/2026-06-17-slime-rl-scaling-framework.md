# slime v0.3.0 / main@680824d：Agentic RL 数据契约与异步边界

First-Archived-At: 2026-06-17 13:26
Updated-At: 2026-07-13 21:54

## Source

- Workflow version: v2
- Material type: framework-docs
- Canonical source: https://github.com/THUDM/slime
- Title: slime: An LLM post-training framework for RL Scaling
- Authors: Zilin Zhu, Chengxing Xie, Xin Lv and slime Contributors
- Responsible organization: THUDM / slime maintainers；Z.ai 提供 GLM 生产使用语境
- Code/Project: https://github.com/THUDM/slime
- Documentation: https://thudm.github.io/slime/
- Quick Start: https://thudm.github.io/slime/zh/get_started/quick_start.html
- Release page: https://github.com/THUDM/slime/releases/tag/v0.3.0
- Published / updated: 项目引用年份为 2025；`v0.3.0` 发布于 2026-05-31；读取的 `main` 快照提交于 2026-07-07
- Current version read: latest release `v0.3.0`；repository `main@680824dd5e01a2e83750bf87fc366ec6fa98766c`
- Version / revision read: release tag `bf14dc21f9500746447f2572d0692e981c4d2a7e`；main commit message `Support routed_experts_start_len (#2185)`；`setup.py` 在 main 中仍标记 `0.3.0`
- Accessed: 2026-07-13
- Subjects: RL infrastructure, agentic RL, rollout systems, token provenance, asynchronous training

## 作者与关系

- [Zilin Zhu](/authors/zilin-zhu/): Z.ai；历史机构：WeChat AI。
- [Chengxing Xie](/authors/chengxing-xie/): Tsinghua University；Zhipu AI。
- [Xin Lv](/authors/xin-lv/): Zhipu AI；历史机构：Tsinghua University。
- slime Contributors: THUDM；Z.ai。

三位引用作者都参与 [GLM-5](/papers/2602.15763-glm-5-agentic-engineering/)；Xin Lv 是 slime 引用条目的通讯作者，Zilin Zhu 是主要 maintainer，Chengxing Xie 的公开主页将 slime 与 SGLang 列为核心开源工作。机构关系由清华大学 / THUDM 与 Z.ai 的联合模型和系统工作连接，SGLang 与 Megatron-LM 则提供 rollout serving 和 distributed training 两个后端。

## 一句话结论

slime 的核心贡献是把工具调用、subagent 与 context compaction 产生的非规则 agent execution 物化为 token-aligned `Sample`，再用 `loss_mask`、behavior logprob 与共享 `group_id` / `rollout_id` 保持 token provenance 和 rollout-level loss accounting；Megatron、SGLang、Ray、Data Buffer 与权重同步围绕这份数据契约组成 RL 闭环。

本地评价：`v0.3.0` 已把 agent module、fan-out aggregation、fully async 和 delta weight sync 纳入 release。当前 `main` 继续强化 token metadata 与 rollout-aware batching。它公开的 fully async 路径目前是一条跨 batch 的 completed-first generation queue，尚未提供显式 staleness gate、版本化 replay policy 或 partial trajectory resume，因此其能力边界应写成“持续采样并容忍一定 off-policy”，避免概括为完整的 stale-aware asynchronous RL runtime。

## 阅读目标与判断边界

本笔记关注：

1. slime 如何把字符串消息、工具 observation、subagent 分支和 compaction 结果转换成可反传的 token 序列。
2. `group_id` / `rollout_id` 如何影响 fan-out 后的训练步计数、loss 分母与 reward 分配。
3. `train_async.py`、`fully_async_rollout.py`、partial rollout、Truncated Importance Sampling (TIS，截断重要性采样) 分别解决哪一层问题。
4. release 声明、当前实现、GLM 生产报告和性能结论之间的证据边界。

判断边界：

- `v0.3.0@bf14dc2` 是稳定 release；`main@680824d` 是后续实现快照。两者在 fan-out 字段名和 reward 语义上已有变化，文中分别记录。
- 框架 README、release note、文档、代码和测试属于第一方工程证据。它们能够证明接口和执行路径，无法替代吞吐、收敛与跨框架 benchmark。
- [GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) 报告的 direct double-sided importance sampling、stale sample dropping 和生产调度属于 GLM 系统证据；当前开源 slime 快照只公开了其中一部分通用接口。
- 关键行为以固定 commit 的代码为准。`main` 文档与实现仍有漂移，例如 coding-agent README 写 `reward / K`，当前 `TrajectoryManager` 代码给每个 sibling 完整 trajectory reward。

证据写法：

- **项目事实**：release note、固定 commit 代码、官方文档或测试直接给出的行为。
- **作者主张**：README 和 release 对 agent-first、production use、性能或适用范围的表述。
- **本地分析**：根据控制流、张量字段和 loss reducer 重建的语义与风险。

## 论文脉络

### 1. 研究问题、背景和价值

单轮数学 RL 的一条 rollout 通常可以写成固定结构：prompt、response、reward。agent workload 会连续改变这份结构。模型输出 tool call，环境返回 observation；subagent 从主会话分叉；context compaction 用新摘要替换旧上下文；一次 agent execution 最终可能产出多个长度不同、训练掩码不同的片段。环境耗时也呈长尾分布，原始 prompt group 中最慢的一条轨迹会延迟整个训练 batch。

训练器最终仍需要回答四个精确问题：哪些 token 由 behavior policy 实际采样，哪些 token 可以反传，一次 execution 被拆成多个片段后应计作几个 rollout，这些 token 来自哪个模型版本。任何一项失真都可能让代码正常运行，同时改变优化目标。

slime 的价值由此集中到 rollout 与 trainer 的边界。它保留 Megatron 负责训练并行、优化器和 checkpoint，保留 SGLang 负责高吞吐生成、路由和 KV cache，再用 `Sample`、Data Buffer 和 Ray 把环境交互转换成训练数据。框架能否支持 agentic RL，取决于这条转换是否保存 token provenance、aggregation identity 与 behavior-policy information。

### 2. 已有解决方案与不足

通用 RLHF 框架已经能够编排 actor、reference、reward、rollout 和 checkpoint。agent execution 增加了三类额外约束：

1. **字符串协议与 token 目标的差异**：agent runtime 交换 message、JSON、tool result 或 streamed text，policy gradient 需要 behavior policy 实际采样的 token ID 与 logprob。
2. **一条 execution 与多个训练样本的差异**：subagent 和 compaction 会生成多个 segment；直接展平会放大它们在 batch 与 loss 中的权重。
3. **持续 generation 与 policy update 的差异**：异步队列可以隐藏长尾等待，也会让旧权重生成的样本跨过新权重更新边界。

只提供 custom rollout hook 可以接入环境，却不能自动解决这些语义。框架还需要检查 token / mask / logprob 对齐，保留 sibling identity，定义 reward 如何随 fan-out 传播，并说明异步样本的新鲜度控制方式。

### 3. 作者可能的思考路径

本地重建如下：Megatron 与 SGLang 已分别覆盖大模型训练和 serving 优化，重复实现后端会增加 checkpoint、并行策略和数值一致性成本。更直接的路线是固定两端能力，把任务差异压缩到“如何生成 `Sample`、如何给 reward、哪些 token 进入 loss”。

math、search、tool use、coding agent 和 sandbox agent 随后都可复用同一外层闭环：custom generation 负责执行 workflow，custom reward 负责评价结果，`Sample` 保存训练所需的 token-level state，Data Buffer 负责 prompt group 与中断样本，Megatron 消费统一字典。异步优化也能作为 rollout function 或 training driver 插入，无需复制训练核。

这一路线换来的主要工程责任是数据契约。hook 越自由，框架越需要在展平、batch split、loss reduction、logprob correction 和 debug replay 处建立强校验。

### 4. 核心假设或切入点

slime 依赖四个核心假设：

1. 多数任务差异可以表达为 generation / reward workflow，训练 backend 可以保持稳定。
2. token-aligned `Sample` 足以承载 policy action、environment context、behavior logprob、状态和扩展 metadata。
3. 一次 execution 的多个 sibling segment 共享 aggregation identity 后，训练器可以恢复 rollout-level 计数。
4. Megatron 与 SGLang 的深度集成能够换取大 MoE、长上下文与 serving 特性的快速接入，代价是版本耦合和较窄的 backend portability。

### 5. 方法 / 系统 / 理论框架

#### 5.1 两个版本快照需要分开阅读

| 维度 | `v0.3.0@bf14dc2` | `main@680824d` |
| --- | --- | --- |
| 对外版本 | latest release，2026-05-31 | `setup.py` 仍为 `0.3.0`，代码继续演进 |
| fan-out identity | `Sample.group_id`；旧 `rollout_id` 只保留写入兼容 | `Sample.rollout_id` |
| coding-agent reward | `fan_out_sample_segments` 把 trajectory reward 写成 `reward / K` | `TrajectoryManager.get_trajectory` 给每个 sibling 完整 trajectory reward |
| token append | 主要由各 rollout / adapter 自行维护 | `Sample.append_response_tokens` 集中检查 token、mask、logprob、top-p 与 routed-expert metadata 长度 |
| fully async | 持久 background worker + completed queue | 主体语义相同，engine 数量计算适配新 topology helper |
| agent runtime | E2B sandbox、Anthropic/OpenAI adapter、segment merge | message tree、Claude Code / Codex harness、branch-aware trajectory export 继续扩展 |

这个差异直接影响复现。引用 `v0.3.0` 时应使用 `group_id` 和 release 的 reward 分配；讨论当前能力时应附 `main` commit，避免把两套字段与语义混成一个稳定 API。

证据定位：[v0.3.0 `Sample`](https://github.com/THUDM/slime/blob/bf14dc21f9500746447f2572d0692e981c4d2a7e/slime/utils/types.py)、[v0.3.0 trajectory](https://github.com/THUDM/slime/blob/bf14dc21f9500746447f2572d0692e981c4d2a7e/slime/agent/trajectory.py)、[main `Sample`](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/slime/utils/types.py)、[main trajectory](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/slime/agent/trajectory.py)。

#### 5.2 真正贯穿系统的是 `Sample`

```text
prompt group
  -> DataSource / buffer
  -> SGLang generation <-> tool / sandbox / agent runtime
  -> Sample 或 list[Sample]
  -> reward + token metadata
  -> flatten + shared-ID validation
  -> rollout-aware DP / micro-batch schedule
  -> Megatron logprob / advantage / policy loss
  -> weight update -> SGLang engines
```

`Sample` 的关键字段可以分为四层：

| 层 | 字段 | 训练含义 |
| --- | --- | --- |
| token | `tokens`, `response_length`, `loss_mask` | 确定训练序列的 response 区域与可反传 token |
| behavior | `rollout_log_probs`, `weight_versions`, top-p token metadata, routed experts | 记录采样策略和推理路径，服务 mismatch correction 或 replay |
| aggregation | `group_index`, `index`, `group_id` / `rollout_id` | 区分 prompt group、具体 sample 与一次 execution 的 sibling segment |
| lifecycle | `status`, `remove_sample`, `metadata`, `train_metadata`, `session_id` | 表达完成、中断、截断、失败、过滤、路由和自定义 loss 信息 |

当前 `main` 的 `append_response_tokens` 对齐了三个数组：新增模型 token 必须携带 logprob，并追加 `loss_mask=1`；工具或环境 token 不携带采样 logprob，框架补零并追加 `loss_mask=0`；每次追加后检查长度。top-p sampling 还保存 ragged candidate token IDs 与 offsets，MoE routing replay 保存每个 token 的 routed experts。

这份结构同时承担数据与正确性契约。文本 `response` 只适合展示；policy gradient 应使用 SGLang 返回的 token IDs 和 logprobs。

证据定位：`main@680824d` 的 `slime/utils/types.py::Sample.append_response_tokens`、`_apply_meta_info`、`_validate_response_metadata_lengths`。

#### 5.3 String-in, token-out 保存 action provenance

coding-agent runtime 向 Anthropic / OpenAI compatible adapter 发送字符串消息。adapter 用 serving model 的 chat template 渲染 prompt IDs，再让 SGLang 返回 output IDs 与逐 token logprob。后续工具 observation 和 compacted message 仍会以字符串进入，因此 trajectory manager 需要把新 prompt 与已保存 token stream 对齐。

对齐规则可直观写成：

```text
模型原样采样的 token        -> loss_mask = 1, 保留 behavior logprob
tool / user / environment   -> loss_mask = 0, logprob 占位为 0
无法证明采样来源的旧前缀     -> 保留为上下文，loss_mask 改为 0
```

当新 prompt 与旧 sampled output 在某个 token 中间发生 drift，当前 adapter 会停止对无法证明 provenance 的保留部分反传。这个处理保护了训练目标：可读文本仍然连续，梯度只经过能够追溯到 rollout engine 的 token。

证据定位：`v0.3.0` 的 `examples/coding_agent_rl/README.md -> String-in, Token-out Trajectories`；`main@680824d` 的 `slime/agent/trajectory.py` 与 `tests/test_agent/test_trajectory_manager_branching.py`。

#### 5.4 共享 ID 修复 fan-out 计数，reward 语义需要另行定义

设一次 execution $r$ 产生 sibling 集合 $S_r$。第 $s$ 个 segment 的 token mask 为 $m_{s,t}$，整条 execution 的有效 token 数为：

$$
M_r = \sum_{s \in S_r}\sum_t m_{s,t}.
$$

slime 在展平前要求 sibling 使用同一个 `group_id` / `rollout_id`，随后为每个 sibling 写入同一个 $M_r$。默认 per-rollout reducer 的贡献近似为：

$$
L_r = \frac{1}{M_r}
\sum_{s \in S_r}\sum_t m_{s,t}A_s\ell_{s,t},
\qquad
L = \frac{1}{B}\sum_{r=1}^{B} L_r.
$$

$B$ 是该 train step 的 rollout 数。DP scheduler 也按共享 ID 分 step，因此一个 execution 产生 $K$ 个 segment 后仍占一个 rollout slot，segment 可以分到不同 micro-batch，整条 execution 的分母保持一致。

直观例子：

```text
execution r
  |- main-before-compact   400 trainable tokens
  |- subagent              300 trainable tokens
  `- main-after-compact    500 trainable tokens

shared ID = r
M_r = 1200
train-step count = 1 rollout
```

共享 ID 解决了计数与分母，$A_s$ 仍由 reward / advantage 逻辑决定。`v0.3.0` 的 helper 把 reward 分为 $R_r/K$；在没有额外尺度变换时，上式会让整条 execution 的梯度幅度随 $K$ 缩小。当前 `main` 代码让所有 sibling 继承完整 $R_r$，使相同 trajectory outcome 覆盖整条 token tree。`main` 的 coding-agent README 仍保留 `reward / K` 文字，构成需要 pin commit 的文档漂移。

还有一层独立风险：默认 `_post_process_rewards` 只有在展平后的样本数恰好等于 `rollout_batch_size * n_samples_per_prompt` 时，才按 `n_samples_per_prompt` 恢复 GRPO group。variable fan-out 改变样本数后，fallback 会把一维 reward 向量 reshape 成单个大组。共享 rollout ID 无法修复 prompt-group advantage normalization；这类 workload 应使用 `custom_reward_post_process` 或增加按 `group_index` / execution identity 的显式 grouping，并用单元测试锁定语义。

证据定位：`v0.3.0` 的 `slime/agent/trajectory.py::fan_out_sample_segments`；`main@680824d` 的 `slime/agent/trajectory.py::get_trajectory`、`slime/ray/rollout.py::_post_process_rewards`、`_convert_samples_to_train_data`、`_split_train_data_by_dp`；`slime/utils/dp_schedule.py::build_dp_schedule`；`slime/backends/megatron_utils/cp_utils.py::get_sum_of_sample_mean`。

#### 5.5 三种执行模式的异步程度不同

| 路径 | 实际调度粒度 | 权重更新前的行为 | 当前边界 |
| --- | --- | --- | --- |
| `train.py` | rollout batch | generate、train、update 顺序执行 | 同步闭环 |
| `train_async.py` | 相邻 batch overlap | 训练 batch $n$ 时提前生成 $n+1$；更新权重前等待 prefetched batch 返回 | one-batch pipeline；不支持 colocate |
| `fully_async_rollout.py` + `train_async.py` | 持久 in-flight trajectory pool | background worker 跨 `generate()` 调用持续补任务，调用方收集最先完成的 `rollout_batch_size` 个 group | completed-first queue；训练入口仍按 batch 消费 |

`train_async.py` 的关键控制流是：取回当前 batch，立即提交下一 batch，训练当前 batch；到 `update_weights_interval` 时先等待下一 batch，随后暂停 / 更新 rollout engines。它隐藏一个 rollout batch 与一个 train batch 的时间重叠。

fully async rollout 再增加一层持久队列。worker 的并发度为 `sglang_server_concurrency * engine_count`，完成的 group 写入 process-wide queue；每个 rollout call 收集最先完成的 target 数量。原始 prompt cohort 中的慢轨迹可以留在下一轮继续执行，当前 batch 不必等待它们，因此它主要减少 long-tail barrier。

当前实现仍有四个重要边界：

1. `ABORTED` group 会回到 Data Buffer，官方 README 明确写明 partial-style resume 尚未接通，重试会从头开始。
2. evaluation mode 直接报错，跨 rollout 的排序只提供 best-effort。
3. `weight_versions` 会被写入 `Sample`，默认 train-data conversion 没有传递该字段，也没有 `max staleness`、policy-lag threshold 或 stale-sample drop。
4. `_generate_rollout_async` 每次 drain 整个 completed queue，最后使用 `[:target]` 截断。若同一轮 drain 让 `collected` 超过 target，多余 group 没有显式回队；这属于需要 trace / test 复验的数据核算边界。

权重更新会让仍在生成的请求收到 abort 信号并重新排队；更新前已完成且留在 queue 的 group 可能在后续 batch 被消费。这个路径天然允许 behavior policy 与 current policy 出现版本差异，当前开源实现依赖 logprob correction 与训练配置处理偏移。

证据定位：`v0.3.0` 和 `main@680824d` 的 `train_async.py`、`slime/rollout/fully_async_rollout.py`；`examples/fully_async/README.md -> Limitations`。

#### 5.6 Partial rollout、dynamic sampling 与 Data Buffer

标准 `sglang_rollout` 会以 prompt group 为任务单位生成 `n_samples_per_prompt` 条 response。dynamic sampling 可以 over-sample group，再用 reward variance filter 保留有区分度的组。达到 target 后，系统 abort 剩余请求；开启 `--partial-rollout` 时，已生成的部分 response 会放回 buffer，在下一轮延续，并可用 `mask_offpolicy_in_partial_rollout` 屏蔽旧 token。

这里的 Data Buffer 是一个优先取出 buffered groups、随后读取 dataset 的 Python list。`add_samples` 要求每个 group 仍含完整的 `n_samples_per_prompt` 个成员。它适合 prompt-group requeue 和 partial sample reuse，当前代码没有版本索引、优先级采样、age-aware eviction 或 replay ratio 控制。

dynamic sampling 的另一个成本是未使用完成样本：当同一轮多个 task 同时完成而 target 已满，标准路径不会把所有 surplus completion 自动放回 buffer。评估 rollout efficiency 时需要分别统计 generated、accepted、filtered、aborted、resumed 和 discarded token。

证据定位：`main@680824d` 的 `slime/rollout/sglang_rollout.py::generate_rollout_async`、`abort`、`generate_rollout`；`slime/rollout/data_source.py::RolloutDataSourceWithBuffer`。

#### 5.7 Behavior logprob 把异步系统问题带入优化目标

令 SGLang 采样行为策略为 $\mu$，Megatron 在训练开始前重算的 anchor policy 为 $\pi_{\text{old}}$，当前 minibatch policy 为 $\pi_\theta$。普通 PPO ratio 为：

$$
r_t^{\text{PPO}}
= \exp\left(\log \pi_\theta(a_t\mid s_t)
- \log \pi_{\text{old}}(a_t\mid s_t)\right).
$$

slime 的 vanilla TIS 额外计算：

$$
w_t^{\text{TIS}}
= \operatorname{clip}\left(
\exp\left(\log \pi_{\text{old}}(a_t\mid s_t)
- \log \mu(a_t\mid s_t)\right),
C_{\text{low}}, C_{\text{high}}
\right),
$$

再用 $w_t^{\text{TIS}}$ 乘 policy-gradient loss。忽略 clipping 时，$r_t^{\text{PPO}}w_t^{\text{TIS}}$ 合并成 $\pi_\theta/\mu$。这把 trainer 重算 logprob 与 rollout behavior logprob 的差异显式带入 loss。

另一个选项 `--use-rollout-logprobs` 直接把 $\mu$ 作为 PPO old policy。参数检查禁止它与 `--use-tis` 同时开启。custom TIS function 还可以返回 rejection mask，并重建 loss reducer。

TIS 提供 token-level probability correction，policy version age 仍是独立变量。极旧 trajectory 可能产生高方差 ratio 或大量 clipping；当前开源快照没有根据 `weight_versions` 自动丢弃这类样本。GLM-5 报告的 stale dropping 和 direct double-sided IS 应作为生产系统的附加机制理解。

证据定位：`main@680824d` 的 `slime/backends/megatron_utils/loss.py::vanilla_tis_function`、`policy_loss_function`；`slime/utils/arguments.py` 的 `--use-rollout-logprobs`、`--use-tis` 及互斥检查。

#### 5.8 权重同步解决 transport，仍需单独定义 freshness policy

`v0.3.0` release 加入 full / delta weight sync，并支持 disk 与 NCCL transport。delta 路径只传变化字节，服务于训推分离和跨集群传权。当前 main 文档进一步描述 external SGLang engines：serving 可以运行在独立 Python 环境或硬件池；disk transport 通过 Hugging Face checkpoint / safetensors delta 与共享文件系统传递权重，NCCL transport 仍受网络和硬件兼容约束。

weight transport 回答“新参数如何到达 rollout engine”。同步频率、已排队样本年龄、允许跨越多少次 update、超过阈值后如何处理属于 freshness policy。当前 slime 提供 `update_weights_interval`、behavior logprob 和 `weight_versions` 观测字段，尚未把这些字段组合成公开的 bounded-staleness scheduler。

证据定位：[v0.3.0 release](https://github.com/THUDM/slime/releases/tag/v0.3.0)、`main@680824d` 的 `docs/en/advanced/delta-weight-sync.md` 与 `docs/en/advanced/external-rollout-engines.md`。

#### 5.9 Sandbox 是可替换的 environment backend

`v0.3.0` coding-agent 示例为每条 SWE sample 启动 E2B-compatible sandbox，agent 在其中执行 Read / Edit / Grep / Bash / subagent 等工具；生成 patch 后，再在第二个干净 sandbox 中评分。`slime.agent.sandbox.Sandbox` 抽象出 `exec`、`read_file`、`write_file` 与生命周期接口，文档明确允许替换为 Docker、Modal 或 local VM 实现。

因此，slime 的通用接口要求一个可异步调用、可隔离、可返回 observation 与 reward 的 environment backend。Docker 是常见实现选择，动态网页、远程 API、数据库和在线 simulator 可以通过网络服务或专门环境集群接入。框架负责把交互结果转换成 `Sample`；环境的安全隔离、镜像、网络策略、状态 reset 和 evaluator integrity 仍由具体 backend 负责。

multi-turn session 可以设置稳定 `session_id`，在 SGLang router 使用 consistent hashing 时作为 routing key，提高相同会话的 prefix-cache 命中率。这个优化会引入 per-session affinity，负载均衡需要同时考虑会话长度和 worker backlog。

证据定位：`v0.3.0` 的 `examples/coding_agent_rl/README.md`、`slime/agent/sandbox.py`；`main@680824d` 的 `docs/en/get_started/agent.md` 与 `slime/rollout/sglang_rollout.py::generate`。

### 6. 结论链条

1. agentic RL 的系统难点集中在 execution 到 trainable tokens 的转换。
2. slime 用 `Sample` 保存 token、mask、behavior logprob、状态和扩展 metadata，并允许 custom generation / reward 接入任意 workflow。
3. fan-out 后的共享 ID 与 whole-rollout denominator 保持 train-step 和 loss accounting；reward assignment 与 GRPO group reconstruction 仍需单独验证。
4. `train_async.py` 提供 batch overlap，fully async rollout 提供跨 batch 的 completed-first generation pool；这两层组合提高 overlap，同时引入 policy lag。
5. TIS 与 rollout logprob 处理 probability mismatch；版本 age、stale dropping 和 replay policy 仍需要显式系统机制。
6. `v0.3.0` 证明这些接口进入稳定 release，当前 main 展示了进一步实现；公开材料尚不足以量化它相对其他 RL systems 的吞吐或 time-to-score 优势。

## 关键实验/定理

### 结果 1：`v0.3.0` 将 agent-first 数据路径纳入 release

- 设置：比较官方 `v0.3.0` release note 与固定 tag 代码。
- Baseline：`v0.2.4` 之前的项目状态；release 没有提供受控性能对照。
- 指标：公开模块、接口、测试和版本依赖。
- 结果：release 新增 `slime/agent`、sandbox coding-agent RL、variable global batch size、fully async mainline、host-memory 优化、PPO / critic refactor、delta weight sync；环境升级到 SGLang `v0.5.12.post1` 与 Megatron `1dcf0dafa`。
- 证据定位：[GitHub release `v0.3.0`](https://github.com/THUDM/slime/releases/tag/v0.3.0)。
- 对照是否可比：能力清单可核验；没有同硬件、同 workload 的 latency / throughput benchmark。
- 支持的最窄结论：这些 agentic RL 与 weight-sync 路径已进入正式 release 并获得相应 CI 覆盖。
- 解读：release maturity 能说明接口可用范围，无法推出性能领先幅度。

### 结果 2：fan-out accounting 已进入 trainer 数据面

- 设置：审计 `Sample`、rollout flatten、DP schedule、context-parallel loss reducer 与 coding-agent trajectory export。
- Baseline：one execution 对应 one sample 的默认路径。
- 指标：shared-ID validation、train-step rollout count、whole-rollout mask denominator、reward 传播。
- 结果：`v0.3.0` 使用 `group_id`，current main 使用 `rollout_id`；两个版本都按共享 ID 聚合 sibling 并按 rollout 数构建 train step。current main 的 trajectory code 已从 `reward/K` 改为 full reward。
- 证据定位：[v0.3.0 rollout conversion](https://github.com/THUDM/slime/blob/bf14dc21f9500746447f2572d0692e981c4d2a7e/slime/ray/rollout.py)、[v0.3.0 trajectory](https://github.com/THUDM/slime/blob/bf14dc21f9500746447f2572d0692e981c4d2a7e/slime/agent/trajectory.py)、[main rollout conversion](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/slime/ray/rollout.py)、[main DP schedule](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/slime/utils/dp_schedule.py)、[main loss reducer](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/slime/backends/megatron_utils/cp_utils.py)、[main trajectory](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/slime/agent/trajectory.py)。
- 对照是否可比：这是实现不变量审计，没有训练曲线对照。
- 支持的最窄结论：variable fan-out 不会仅因 segment 数增加而占用更多 rollout slot，loss 可以按整条 rollout 的 token 总数归一化。
- 解读：batch/loss accounting 已得到系统支持；GRPO reward grouping 和算法级 credit assignment 仍要按 workload 配置。

### 结果 3：fully async 有 end-to-end smoke path，缺少收益测量

- 设置：Qwen2.5-0.5B-Instruct 的单节点 4 GPU GRPO smoke test；Qwen3.5-9B 的单节点 8 GPU 示例；Dapo-Math-17K；`train_async.py` + `generate_rollout_fully_async`。
- Baseline：仓库含普通 async short test，公开 README 没有给出两者的同条件 wall-clock 对比。
- 指标：多轮 end-to-end completion 与 CI 可执行性。
- 结果：0.5B 路径使用 1 张 actor GPU + 3 张 rollout GPU；9B 示例默认 4 + 4，均运行独立 actor / rollout 资源。测试证明路径可启动、生成和训练。
- 证据定位：[Qwen2.5-0.5B launcher](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/examples/fully_async/run-qwen2.5-0.5B-fully_async.sh)、[Qwen3.5-9B launcher](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/examples/fully_async/run-qwen3.5-9B-fully_async.sh)、[fully async smoke test](https://github.com/THUDM/slime/blob/680824dd5e01a2e83750bf87fc366ec6fa98766c/tests/test_qwen2.5_0.5B_fully_async_short.py)。
- 对照是否可比：没有报告吞吐、GPU utilization、tail latency、policy lag 或 time-to-score。
- 支持的最窄结论：fully async 路径有小模型端到端 smoke coverage。
- 解读：“更高效率”目前属于机制预期与作者主张，公开证据尚未量化收益。

### 结果 4：正确性覆盖面比性能证据更完整

- 设置：release CI 条目与 current CPU / GPU tests。
- Baseline：无。
- 指标：delta update、GPU placement、multi-sample、server-group indices、train-rollout logprob difference、trajectory branching。
- 结果：官方 release 明确列出上述 e2e / validation coverage，current main 继续保留 Sample metadata 与 agent trajectory tests。
- 证据定位：[v0.3.0 release 的 Environment and CI](https://github.com/THUDM/slime/releases/tag/v0.3.0)、[current tests directory](https://github.com/THUDM/slime/tree/680824dd5e01a2e83750bf87fc366ec6fa98766c/tests)。
- 对照是否可比：属于 invariant / regression checks。
- 支持的最窄结论：slime 将多类 RL silent failure 纳入自动检查。
- 解读：这是框架可信度的主要公开证据，也显示其当前材料更适合作为实现与 correctness reference。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 评测协议 | framework docs、release capability、固定 commit code audit、CI smoke；无统一系统 benchmark |
| 统计报告 | 未报告 seed、误差线、置信区间或显著性检验 |
| Baseline 是否 tuned | 不适用；没有公开受控 baseline |
| Baseline 是否 compute-matched | 不适用 |
| Baseline 是否 implementation-matched | 普通 async 与 fully async 都有示例，但缺少同条件结果 |
| Baseline 是否覆盖强替代方案 | 没有与 verl、AReaL、Laminar、RollArt 等做公开 benchmark |
| 结论边界 | 可判断功能、控制流和数据契约；无法判断性能领先和收敛质量 |
| 模型与初始化 | smoke / examples 覆盖 Qwen2.5-0.5B-Instruct、Qwen3.5-9B、Qwen3.6-35B-A3B coding agent；生产声明覆盖 GLM 系列 |
| 数据与任务 | Dapo-Math-17K、SWE coding-agent 数据格式及多类自定义 generation 示例 |
| RL / 训练配置 | 支持 PPO、GRPO、GSPO、CISPO、REINFORCE++ 等；具体 recipe 由脚本决定 |
| 系统配置 | Ray orchestration；Megatron training；SGLang rollout/router；可 colocate、disaggregate 或连接 external engines，`train_async.py` 禁止 colocate |
| 框架基座 / paper base | training: Megatron；rollout / serving: SGLang；orchestration: Ray；agent loop / sandbox / reward: custom hooks 与 `slime.agent` |
| 框架版本与证据来源 | `v0.3.0`: SGLang `v0.5.12.post1`、Megatron `1dcf0dafa`；current main commit `680824d`，package version 仍为 `0.3.0` |
| 框架改动范围 | 新增 RL loop、Sample / Data Buffer、Ray actors、weight sync、SGLang patches、agent adapters、trajectory conversion、loss / DP schedule integration |
| 训练硬件与拓扑 | fully async examples 为单节点 4 / 8 GPU；GLM production 硬件细节应到对应模型报告读取 |
| 训练时间 / GPU hours / 成本 | 未披露 |
| 未披露项 | 跨框架 throughput、长轨迹分布、queue age、staleness histogram、discarded-token ratio、time-to-score、故障恢复成本 |

## 证据链强度评估

### 强证据

- 固定 commit 代码完整展示 `Sample -> flatten -> rollout-aware schedule -> loss reducer` 路径，可以复核 fan-out accounting。
- `train_async.py` 与 `fully_async_rollout.py` 的控制流足以区分 batch overlap、completed-first queue、abort 和 requeue 语义。
- release tag、依赖版本、agent module、delta sync 与 CI 条目均有官方 release 记录。

### 中等强度证据

- coding-agent example 证明 sandbox、adapter、subagent / compaction segment 与 evaluator 可以接入同一训练闭环；它仍是一条特定 E2B / CLI / SWE workflow。
- 官方材料称 slime 支撑多代 GLM 的 RL training，提供 production adoption 信号；具体机制和收益需要由 GLM 报告补证。
- TIS 公式与 logprob 数据路径清晰，训练稳定性取决于 ratio 分布、policy lag、clipping rate 与 workload。

### 需要谨慎的推论

- completed-first queue 可以减少原始 cohort 的长尾等待；公开材料尚未量化 GPU utilization 或 time-to-score。
- `weight_versions` 的存在提供 provenance 字段，当前默认 trainer 没有据此执行 stale dropping。
- variable fan-out 已在 scheduler / reducer 层得到支持，默认 GRPO reward grouping 仍需要 workload-specific 处理。
- current main 与 release 共用 `0.3.0` package version，使用 `latest` image 或 branch name 难以保证行为稳定。

## OpenReview / 审稿意见吸收

- Page type: not-applicable
- Match confidence: high
- Observed at: 2026-07-13
- Venue status: 开源框架、release 与官方文档；没有对应公开 peer-review forum。
- Public reviews: 不适用。
- Ratings / confidence: 不适用。
- Reviewer consensus: 不适用。
- Main criticisms: 本地审计集中于 release / main 语义漂移、fully async 的实际粒度、staleness policy 缺失、fan-out reward 与 GRPO grouping。
- Author response: 不适用。
- 对可信度的影响: 机制结论以代码和 tests 为主；性能、收敛与 production scaling 结论保持较窄范围。

## 本地讨论补充

### 1. 讨论收敛点

- 索引核心信号已从“连接 Megatron、SGLang、Ray 与 custom reward”收紧到“用 token-aligned Sample 与共享 rollout identity 保存 agent execution 的训练归属”。前者描述组件集合，后者对应 slime 在 agentic RL 中更有区分度的贡献。
- fully async 的准确表述是“持续生成、跨 batch 的 completed-first queue”。trainer 仍按 batch 前进，Data Buffer 也没有演化成版本化 experience replay。
- `group_id` / `rollout_id` 负责 aggregation identity。reward assignment、advantage grouping 与 credit assignment 属于另外三层语义。

### 2. 修正后的理解

- `v0.3.0` 的 fan-out helper 使用 `reward / K`，current main trajectory manager 使用 full reward。二者在 whole-rollout denominator 下产生不同梯度尺度；复现实验必须 pin commit。
- 当前开源 slime 记录 `weight_versions`，没有发现基于版本年龄的 stale-sample threshold 或 drop path。GLM-5 的相关机制应保留在模型系统报告语境。
- standard partial rollout 可以缓存并延续被 abort 的部分生成；fully async path 当前只重新排队并从头开始。
- TIS 修正 behavior / trainer probability mismatch，无法单独限制样本年龄。

### 3. 后续复验指标

- 每个 train step 的 behavior weight-version histogram、mean / max policy lag、TIS clip fraction 与有效 token ratio。
- background queue depth、first-completion latency、P50 / P95 / P99 trajectory latency、abort / restart / discard token 数。
- 每条 execution 的 segment count $K$、whole-rollout mask sum、reward assignment 和最终 gradient norm。
- GRPO prompt group 在 variable fan-out 后的成员映射，检查 advantage mean / std 是否仍按原 prompt 计算。
- completed queue 单次 over-drain 时的 surplus group 去向，以及 checkpoint / resume 后的 buffer 一致性。

## 主要启发

- agentic RL framework 的核心抽象应包含 token provenance、aggregation identity、behavior-policy metadata 和 lifecycle state，custom hook 只负责开放执行入口。
- 异步系统需要同时公开 queue policy、weight-version policy 与 off-policy correction；“fully async”这个名称本身不足以推断三者。
- fan-out 后的正确性至少包含四项：训练步计数、loss 分母、reward 传播、advantage group reconstruction。
- exact sampled token IDs 与 logprobs 比 decoded text 更适合承担训练接口；发生 re-tokenization drift 时，masking 是保守而可审计的处理。
- weight transport 与 sample freshness 是两个控制面。delta sync 可以减少传输成本，仍需调度器定义何时更新和哪些旧样本可训练。

## 局限

1. 官方文档和 release 没有提供吞吐、tail latency、GPU utilization、time-to-score 或跨框架公平 benchmark。
2. `v0.3.0` 与 current main 的 `group_id` / `rollout_id`、reward assignment 和 agent trajectory 实现已经漂移，package version 仍相同。
3. fully async 默认路径没有 evaluation、partial resume、显式 staleness bound 或 stale dropping；completed queue over-drain 还需要数据核算测试。
4. 默认 GRPO reward normalization 依赖展平样本数恢复 prompt group，variable fan-out 下可能改变 advantage grouping。
5. custom generation / reward 把 tokenizer alignment、loss mask、tool observation、environment reset、reward integrity 和 failure handling 的大量责任交给集成方。
6. Megatron + SGLang 深度集成提供原生性能能力，也带来 CUDA stack、patched engine、model config 与 checkpoint conversion 的版本耦合。
7. production adoption 属于第一方声明；GLM 内部 queue、staleness、fault tolerance 和大规模硬件配置没有在框架文档中完整披露。

## 跨论文关系

- 与已有论文的作者或机构关系：Zilin Zhu、Chengxing Xie、Xin Lv 都参与 [GLM-5](/papers/2602.15763-glm-5-agentic-engineering/)；两份材料共同连接 THUDM / Tsinghua 与 Z.ai，slime 提供开源框架接口，GLM-5 提供生产模型训练语境。
- 与 [GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) 的方法关系：GLM-5 报告 TITO、direct double-sided IS、stale sample dropping、DP-aware routing 与 PD disaggregation；slime 的 release / main 公开 token-aligned trajectory、TIS、router、fully async 和 weight sync 的部分基础件。两者不能按功能名直接等同。
- 与 [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/) 的方法关系：CompactionRL 明确使用 slime asynchronous RL framework。slime 当前的 sibling ID 与 whole-rollout denominator解释了 variable segment 如何进入 trainer；CompactionRL 的 cross-segment advantage、critic 和 summary reward仍属于论文算法层。
- 与 [VERL](/papers/2026-06-16-verl-rl-optimization-algorithms/) 的系统关系：两者都在统一 RL 数据面连接 rollout 与 trainer。VERL V1 以 TransferQueue、ReplayBuffer 和版本指标组织多模式异步；slime 以 SGLang-native `Sample`、Data Buffer 和 custom rollout组织 agent workflow，当前公开 staleness policy 更弱。
- 与 [TIM / VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/) 的主题关系：slime 保存 rollout logprob、提供 TIS 与 consistency tests，直接面对 rollout engine / trainer engine 的 probability mismatch；VeXact 进一步系统化分析并修复实现级 mismatch。
- 与 [Laminar](/papers/2510.12633-laminar-asynchronous-rl-post-training/) / [RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/) 的系统关系：后两者公开了 trajectory-level buffer、inherent / bounded staleness、repack 或跨异构资源池调度及性能实验；slime release 更适合作为 SGLang-native agent data contract 与工程接口参考。

## Reference Intake Brief

### Target

- Intended target system: 更新已有 slime 框架笔记，并迁移到 paper workflow v2。
- Existing related assets: `content/utility/papers-index.md`、`data/authors.json`、`data/paper-tags.json`；GLM-5、CompactionRL、VERL、TIM / VeXact、Laminar、RollArt。
- Proposed form: 完整重写已有 Markdown 文档，保留原始首次归档时间。

### Reusable Elements

1. token-aligned `Sample` 与 string-in / token-out agent trajectory contract。
2. shared-ID fan-out accounting、whole-rollout denominator 与 reward semantics 审计框架。
3. sync / batch-overlap / completed-first fully async 的分层术语，以及 behavior logprob / TIS / staleness 的边界。

### Risks

- Copyright/over-copying: 只保留机制、字段、公式和短配置摘要，没有复制长篇官方说明。
- Unsourced or unverifiable claims: 关键行为定位到 release、固定 commit 文件或 tests；生产性能声明保持第一方语境。
- Tone/brand mismatch: 使用系统审计语言，避免把 capability list 写成性能结论。
- Safety/compliance issues: sandbox 部分保留隔离与 evaluator integrity，不包含可直接滥用的攻击流程。
- Overlap with existing assets: GLM-5 负责生产模型与完整 agentic engineering；当前条目负责开源 slime 数据契约和 runtime 边界。

### Skipped

| Material | Reason |
| --- | --- |
| 公开 reviewer comments | 该框架没有可可靠匹配的 OpenReview / ARR / 会议公开审稿页。 |
| 非官方性能转述 | 缺少固定版本、硬件、workload 和同条件 baseline。 |
| 下游生态项目能力清单 | 项目数量多且变化快，只保留能改变 slime 定位的高置信关系。 |

### Recommendation

Decision: merge

Why: v2 精修把 slime 的核心贡献收敛到 agent execution 的 token provenance 与 rollout accounting，并明确稳定 release、current main、生产系统主张和异步实现边界；该版本适合作为后续阅读 agentic RL infrastructure 的基准节点。
