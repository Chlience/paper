# verl 当前 RL 优化算法与异步训练流水线技术笔记

First-Archived-At: 2026-06-16 18:19
Updated-At: 2026-06-16 18:19

## Source

- Title: verl 当前 RL 优化算法与异步训练流水线技术笔记
- URL: https://verl.org.cn/en/latest/algo/ppo.html
- URL: https://verl.org.cn/en/latest/algo/grpo.html
- URL: https://verl.org.cn/en/latest/algo/dapo.html
- URL: https://verl.org.cn/en/latest/algo/rollout_corr.html
- URL: https://verl.org.cn/en/latest/algo/rollout_corr_math.html
- URL: https://verl.org.cn/en/latest/advance/one_step_off.html
- URL: https://verl.org.cn/en/latest/advance/fully_async.html
- URL: https://verl.org.cn/en/latest/advance/async-on-policy-distill.html
- URL: https://verl.org.cn/en/latest/data/transfer_queue.html
- URL: https://verl.org.cn/en/latest/advance/mtp.html
- Authors: verl documentation contributors; one-step-off and fully async pages list `https://github.com/meituan-search`; async on-policy distill lists Brilliant Hanabi and furunding; rollout correction page lists Yingru Li; DAPO implementation and run page lists Yuxuan Tong and Guangming Sheng.
- Current version read: verl docs latest pages, accessed 2026-06-16.
- Subjects: LLM RL systems, PPO/GRPO/DAPO, rollout correction, asynchronous RL training, on-policy distillation, TransferQueue, MTP.

## 作者与关系

- verl 文档整体属于 verl / ByteDance Seed Foundation MLSys Team 维护的工程材料集合；不同页面由社区 contributor 分别维护。
- one-step-off 与 fully async 文档均列出 `https://github.com/meituan-search`，说明这两条异步训练路线在实现和实验上有连续工程线索。
- async on-policy distill 文档列出 Brilliant Hanabi 与 furunding，路线重点从 reward-based RL 转向 teacher top-k token distribution 的 KL 蒸馏目标。
- rollout correction 文档列出 Yingru Li，并直接连接 “When Speed Kills Stability: Demystifying RL Collapse from the Training-Inference Mismatch” 这条 train/inference mismatch 研究线。
- DAPO 文档列出 Yuxuan Tong 与 Guangming Sheng 作为开源实现和实验运行贡献者；Guangming Sheng 同时是 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 的作者之一，连接 HybridFlow/VERL 原始系统论文与当前 recipe 化工程实践。
- 与已存档材料的关系：该技术笔记把 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 的 RLHF dataflow 框架、[2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/) 的 DAPO recipe、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 的 train-inference mismatch、[2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/) 的 synchronous rollout 优化，以及 [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 的 asynchronous agentic RL 系统串成一条工程演化线。

## 一句话结论

verl 当前 RL 优化已经形成两层结构：PPO/GRPO/DAPO/OPO/GPG/DPPO/OTB 等算法模块负责控制梯度信号、优势估计和 trust region，one-step-off、fully async、async on-policy distill、TransferQueue、MTP 等系统模块负责把 rollout、teacher query、logprob、actor update 和参数同步重叠起来；两层之间的共同边界变量是 `rollout_log_probs`、`old_log_probs`、当前 `log_prob`、staleness 和 rollout correction。

## 论文脉络

这篇技术笔记整理的材料是一组 verl 官方文档和 recipe。它们共同描述了 verl 从同步 PPO/GRPO 训练循环，逐步扩展到 long-CoT reasoning RL、异步 rollout、on-policy distillation、rollout correction 和样本级数据流系统的过程。

脉络可以分成三层：

1. 算法层：PPO 提供 clipped trust region；GRPO 用 group sampling 取代 critic；DAPO 为 long-CoT reasoning RL 增加 Clip-Higher、dynamic sampling、token-level loss 和 overlong reward shaping；OPO、GPG、OTB、DPPO 分别处理 baseline、简化 policy gradient、方差诊断和 divergence trust region。
2. 分布层：rollout correction 把 `π_rollout`、`π_old`、`π_θ` 拆开，用 TIS、RS、bypass/decoupled mode 处理 rollout behavior policy 与 training anchor 之间的偏移。
3. 系统层：one-step-off 做批次级 rollout/train 重叠；fully async 做样本级流式训练、staleness control 和 partial rollout；async on-policy distill 把 teacher top-k 查询纳入异步流水线；TransferQueue 与 MTP 分别处理样本数据面和 rollout 推理侧加速。

这条线的核心矛盾是：越接近严格 on-policy，训练语义越清晰，系统气泡越明显；越充分异步化，硬件利用率越高，logprob 归属、样本新鲜度和分布校正越重要。

## 关键实验/定理

- one-step-off 文档报告，DAPO 32B 训练中 rollout 阶段约占总时间 70%；在 Qwen2.5-Math-7B + DAPO 示例中，FSDP2 路径总时间从 `19h18m` 降到 `15h34m`，Megatron 路径从 `18h21m` 降到 `13h06m`。
- fully async 文档报告，Qwen2.5-Math-7B + DAPO 在 32/64/128 卡设置下获得约 2 倍级别收益；128 卡 fully async + staleness + partial rollout 的 400 步总时间从 `1 天 16 小时 48 分` 降到 `17 小时 22 分`。Qwen3-30B-A3B + GRPO 设置报告约 `1.72x` 端到端收益。
- rollout correction 的关键公式是三策略分解：`π_rollout` 负责数据收集，`π_old` 负责 PPO anchor，`π_θ` 是当前更新策略。TIS 使用 $\rho_t=\pi_{\text{old}}(a_t\mid s_t)/\pi_{\text{rollout}}(a_t\mid s_t)$ 修正行为策略偏移，PPO/GRPO 使用 $r_t(\theta)=\pi_\theta(a_t\mid s_t)/\pi_{\text{old}}(a_t\mid s_t)$ 控制策略更新漂移。
- async on-policy distill 的关键目标是 teacher top-k 支持上的 token-level sparse KL，系统证据来自 one-step-off / two-step-off scheduler 对 rollout、teacher retrieval、actor update 和 weight sync 的重叠。
- TransferQueue 文档报告其与 verl 集成已在 DAPO 64 节点 1024 卡规模测试，用于优化主机内存利用和数据传输。
- MTP 文档报告 rollout 接受率可提升约 14%，但在 H20 设置下整体吞吐可能无提升甚至下降，说明 speculative decoding 收益受硬件、模型大小和实现开销共同限制。

## 主线：on-policy 正确性与吞吐之间的张力

LLM RL 的基础循环很直观：当前 actor 生成 response，reward 或 verifier 打分，reference 或 critic 提供额外信号，trainer 根据 logprob 和 advantage 更新 actor。同步实现最容易推理，因为每一批训练样本都来自最新策略，`rollout`、`old policy` 和当前更新的策略之间关系清晰。

这个同步循环在长输出 reasoning RL 里很快遇到系统瓶颈。rollout 会占据大量 wall-clock 时间，输出长度有长尾，某些 prompt 会生成很久，GPU 在等待最慢 response 时产生空闲。DAPO 32B 的 one-step-off 文档把这个问题说得很直接：rollout 阶段约占总时间的 70%，继续增加资源也无法直接缩短长尾生成持续时间。fully async 文档进一步把问题抽象成 rollout 与 train 的资源隔离、流式消费和参数新鲜度控制。

因此，verl 当前优化路线可以按一个问题理解：怎样在不破坏训练目标可解释性的前提下，让 rollout、logprob、reward/teacher、actor update 和参数同步同时工作。

这个问题有两个层面。算法层决定每个 token 或每条 response 的梯度如何计算，系统层决定样本以什么参数版本生成、何时进入训练、是否允许陈旧、怎样修正分布偏移。

## 算法层：从 PPO 到 DAPO、OPO、GPG、DPPO

PPO 是 verl 的基础接口形态。它保留 actor-critic、GAE、clipped surrogate objective 和 KL 控制。核心比率是：

$$
r_t(\theta)=\frac{\pi_\theta(a_t\mid s_t)}{\pi_{\text{old}}(a_t\mid s_t)}
$$

典型 clipped loss 用 `clip_ratio` 限制策略更新幅度。verl 文档里还支持 KL reward penalty、actor KL loss、双裁剪 PPO 等扩展。PPO 的优点是稳定、成熟、易诊断；代价是 critic 训练和 value estimation 会增加模型、显存和系统复杂度。

GRPO 去掉 critic，依赖同一 prompt 的多条采样 response 做组内相对优势估计。它需要 `rollout.n > 1`，把一个 prompt 扩成多个候选，然后用组内 reward 统计量构造 advantage。GRPO 在 reasoning RL 中很常见，因为 verifier reward 往往是序列级结果，组内比较能替代 critic 的一部分功能。它也把系统压力转移到了 rollout：同一 prompt 要生成多条 response，长尾和 group-level scheduling 会更加明显，这正是 Seer、fully async、DAPO dynamic sampling 关心的地方。

DAPO 是当前 verl recipe 里最重要的 reasoning RL 组合之一。它在 GRPO 类训练循环上增加四个关键动作：

1. `clip_ratio_low` 和 `clip_ratio_high` 解耦，上界通常设得更高，例如 `0.28`，允许正向改进样本获得更大更新空间。
2. dynamic sampling with group filtering 会过滤掉组内全对或全错的 prompt，只保留能提供学习信号的组。
3. `loss_agg_mode="token-mean"` 把策略梯度损失按 token 聚合，避免长 response 在序列级聚合里被弱化。
4. overlong reward shaping 对接近最大长度的 response 加线性惩罚，减少模型靠无限延长 CoT 占用上下文。

DAPO 的 clipping 代码形态是：

$$
\ell_1=-A_t r_t,\quad
\ell_2=-A_t\,\mathrm{clip}(r_t,1-\epsilon_{\text{low}},1+\epsilon_{\text{high}})
$$

$$
\ell=\max(\ell_1,\ell_2)
$$

这个设计和我们之前讨论的 DAPO / GRPO 争议直接相关：dynamic sampling 会改变训练数据分布，token-level loss 会改变长 response 的梯度权重，overlong shaping 会改变模型对长度的偏好。它们提升效果时，需要同时追踪 pass@k、response length、有效组比例、clip fraction 和 reward distribution。

OPO 的切入点是 baseline。它同样使用 group sampling，但把组内长度加权 reward 作为理论最优 reward baseline，并强调 exact on-policy 训练。配置上要求 `ppo_mini_batch_size` 等于 `train_batch_size`，并关闭 entropy 与 KL regularization。OPO 的价值在于减少策略变化和熵崩溃，适合对 on-policy 约束更敏感的实验。

GPG 更激进。它保留组策略梯度，省去 critic、reference model 和 KL penalty，直接优化 RL objective。文档中把它定位为简单且高效的 reasoning baseline。工程上它降低了 reference/critic 计算成本，但稳定性更多依赖优势函数和数据分布本身。

OTB 处理的是 token-level baseline 和梯度方差诊断。它通过 logit-gradient proxy 近似梯度平方范数，在低额外成本下输出 `signal_strength`、`total_power`、`pure_noise` 等指标。对长 CoT RL 来说，这类指标比只看 reward 更接近“更新是否有效”。

DPPO 试图把 trust region 从 PPO 的概率比率启发式推进到策略散度近似，例如 Binary-KL 或 Binary-TV。文档的实验说明它希望在控制 train-inference mismatch 的同时提高稳定性。它和 rollout correction、TIM/VeXact 的关系很紧：都把“训练看到的策略分布”和“生成样本的行为策略分布”当成核心问题。

可以用一张表概括算法层：

| 模块 | 主要优化对象 | 关键变量 | 典型收益 | 主要代价 |
| --- | --- | --- | --- | --- |
| PPO | 稳定策略更新 | $r_t(\theta)$、GAE、KL、clip | 稳定、成熟、可诊断 | critic 与 reference 成本高 |
| GRPO | critic-free group advantage | `rollout.n`、group reward mean/std | 适合 verifier reward | rollout 成本和长尾更明显 |
| DAPO | long-CoT reasoning RL recipe | clip higher、dynamic sampling、token-mean、overlong shaping | AIME 类任务效果强 | 数据分布和长度偏好被 recipe 改写 |
| OPO | exact on-policy baseline | 长度加权 reward baseline | 降低策略波动和熵崩溃 | 对 batch 与 on-policy 约束更严格 |
| GPG | 极简 policy gradient | 修正 advantage、无 critic/reference | 系统成本低 | 稳定性更依赖 reward 和采样质量 |
| OTB | token-level 方差控制 | gradient variance proxy、token baseline | 看见梯度噪声结构 | 需要额外 logit/proxy 统计 |
| DPPO | divergence-based trust region | Binary-KL / Binary-TV mask | 控制 mismatch 与更新范围 | 实现和调参更复杂 |

## logprob 层：三个策略必须分清

异步 RL 最容易出错的地方是把几种 logprob 混在一起。verl 的 rollout correction 文档把它拆成三种策略：

$$
\pi_{\text{rollout}},\quad \pi_{\text{old}},\quad \pi_\theta
$$

其中 `π_rollout` 是真正生成样本的行为策略，`π_old` 是 PPO/GRPO 更新开始时的 anchor，`π_θ` 是 actor update 过程中正在变化的当前策略。

两类分布漂移对应两种比率：

$$
\rho_t=\frac{\pi_{\text{old}}(a_t\mid s_t)}{\pi_{\text{rollout}}(a_t\mid s_t)}
$$

$$
r_t(\theta)=\frac{\pi_\theta(a_t\mid s_t)}{\pi_{\text{old}}(a_t\mid s_t)}
$$

`ρ_t` 修正 rollout policy 到 old policy 的差距，`r_t` 是 PPO/GRPO 当前更新本身的比率。同步训练且 rollout engine 与 trainer engine 完全一致时，`π_rollout` 和 `π_old` 可以近似相等。异步训练、不同后端、不同精度、FP8 rollout、vLLM/SGLang 与 Megatron/FSDP 之间的数值差异都会让这个近似变弱。

verl 的 rollout correction 提供三种常见路径：

1. decoupled mode：保留三策略。rollout 端产出 `rollout_log_probs`，trainer 更新前重新计算 `old_log_probs`，再用 `old_log_probs - rollout_log_probs` 生成 truncated importance sampling 权重。
2. bypass mode：把 `old_log_probs` 设为 `rollout_log_probs`，直接把实际行为策略当作 PPO anchor。fully async 默认更偏向这个路径，因为 old logprob 与 token 必须对应生成时的参数版本。
3. bypass + policy gradient：在部分设置下使用 `π_θ / π_rollout` 的 IS 或 RS correction，配合无 PPO clip 的 policy gradient loss。

这也是理解 fully async 的关键。训练端仍然会在 actor update 中计算当前 `log_prob`，因为梯度来自当前参数；问题在于 anchor 应该来自 trainer 重新打分，还是直接使用 rollout 端伴随样本保存的 `rollout_log_probs`。一旦样本来自旧参数，或 rollout backend 与 train backend 数值路径不同，保存 rollout logprob 就成为算法正确性的基础设施。

## 系统层一：one-step-off 把 rollout 和 train 先重叠起来

one-step-off 是最小侵入的异步化。它把 actor/trainer 与 rollouter 资源分开，在训练当前批次时异步生成下一批样本。流程大致是：

1. driver 从 dataloader 取下一批 prompt。
2. 同步 actor 权重到 rollout workers。
3. rollout workers 异步生成下一批 response。
4. trainer 等上一批 generation future 完成后，计算 reward、ref logprob、advantage，并更新 actor。

这样每一步训练使用前一步生成的样本，参数保持单步离策略。文档强调它使用 NCCL 参数同步，常见延迟低于数百毫秒；在 Qwen2.5-Math-7B + DAPO 示例里，FSDP2 路径从 `19h18m` 降到 `15h34m`，Megatron 路径从 `18h21m` 降到 `13h06m`。

one-step-off 的工程判断很清晰：如果 rollout 长尾已经让 trainer 大量等待，先把 generation 和 update 重叠；如果等待项 `wait_prev_gen` 仍然很高，再考虑调整 rollout 资源、停止条件和 response length 分布。

它的边界也很清楚：只能重叠一轮，仍然要等上一批 generation 完成，长尾样本仍可能拖住下一步训练。

## 系统层二：fully async 把样本变成流

fully async 把 one-step-off 的批次级重叠推进到流式样本级。系统由四个角色组成：

- Rollouter：逐样本生成 response，并把样本写入队列。
- MessageQueue：缓存 rollout 产生的样本。
- Trainer：从队列取到 `require_batches * ppo_mini_batch_size` 个样本后执行训练。
- ParameterSynchronizer：按 `trigger_parameter_sync_step` 控制 trainer 与 rollouter 的参数同步。

核心控制量有三个：

1. `trigger_parameter_sync_step`：同步前 trainer 做多少次本地更新。越大越省同步开销，样本 freshness 越低。
2. `staleness_threshold`：允许使用陈旧样本的最大比例。`0` 接近同步流式训练，`>0` 允许 rollouter 在 trainer 更新后继续提供旧样本。
3. `partial_rollout`：参数同步时中断正在生成的样本，保存状态，更新参数后恢复，减少等待活跃长样本完成的时间。

fully async 文档给出四种模式：

| 模式 | 关键参数 | 语义 | 适合场景 |
| --- | --- | --- | --- |
| 在线策略管道 | `trigger_parameter_sync_step=1`, `staleness_threshold=0` | 最接近同步 on-policy | 小规模、稳定性优先 |
| 流式离线策略管道 | `trigger_parameter_sync_step>1`, `staleness_threshold=0` | 一次产生更多样本，trainer 分批消费 | 对陈旧敏感但想减少气泡 |
| 带陈旧样本的异步流管道 | `staleness_threshold>0`, `partial_rollout=False` | 同步后可立即消费旧样本 | 追求吞吐且可接受轻度 off-policy |
| 带 partial rollout 的异步流管道 | `staleness_threshold>0`, `partial_rollout=True` | 中断并恢复长 rollout | 长尾明显的 long-CoT / tool-use |

实验上，Qwen2.5-Math-7B + DAPO 在 32/64/128 卡上大约达到 2 倍级别收益；128 卡设置下，结合 streaming、staleness 和 partial rollout 后，400 步总时间从 `1 天 16 小时 48 分` 降到 `17 小时 22 分`。30B GRPO 设置也报告约 `1.72x` 端到端收益。文档也提醒，`staleness_threshold` 过大可能影响模型效果，建议小于 1。

fully async 的算法代价集中在 logprob 与分布控制。文档明确要求 `actor_rollout_ref.actor.use_rollout_log_probs=True`，因为 old logprob 必须和生成 token 的参数版本绑定。默认 `algorithm.rollout_correction.bypass_mode=True` 使用 rollout logprob；当启用 decoupled correction 时，训练引擎还需要重新计算 logprob，对应 AReaL Decoupled PPO 类路线。

## 系统层三：async on-policy distill 用 dense teacher signal 替代稀疏 reward

async on-policy distill 面向另一个瓶颈：reward-based RL 的信号稀疏、高方差、reward engineering 成本高。它让学生 actor 用当前策略采样，然后向更强教师学习每个 token 位置的 top-k 分布。优化目标是 teacher top-k 支持上的 token-level sparse KL：

$$
\mathrm{KL}(P_{\text{teacher}}\|Q_{\text{student}})
$$

这个目标比序列级 reward 更密集，也更容易直接定位每个 token 的更新方向。系统上它有三个阶段：学生 rollout、教师 top-k logprob 查询、actor KL update。严格同步时这三个阶段互相等待，于是文档提供 one-step-off 和 two-step-off 调度器：

- one-step-off：actor update 时做 rollout，teacher retrieval 时做权重同步。
- two-step-off：teacher retrieval 时同时做 rollout 和 actor update，并交错权重同步。

two-step-off 适合教师查询耗时明显高于权重同步的场景。监控指标也对应这条流水线：`wait_prev_gen`、`wait_prev_teacher`、`sync_rollout_weights`、`get_teacher_knowledge`、`actor/kl_loss`、`perf/mfu/actor`。

它和 RL 的关系可以这样理解：on-policy distillation 仍然关心学生当前 state distribution，因此它保留了 on-policy 的一部分优势；训练信号来自教师分布，减少了 verifier/reward 稀疏性。代价是需要可扩展教师服务，教师吞吐会变成新的系统瓶颈。

## 数据面：TransferQueue 让异步样本流不再全压在 controller 上

fully async 和 distill 都需要让样本在多个计算任务之间流动。传统 `DataProto` 全部经过 `RayPPOTrainer`，单 controller 会成为数据搬运瓶颈。TransferQueue 的设计把元数据和实际 tensor 数据分开：

- control plane 记录每个样本的生产状态和消费状态。
- data plane 使用分布式 storage backend 保存 TensorDict。
- consumer 先拿 `BatchMeta`，再从存储后端取实际数据。

这个设计支持样本级调度、不同任务独立消费同一数据字段、可插拔存储后端以及自定义 sampler。文档提到 TransferQueue x verl 已在 DAPO 64 节点 1024 卡规模测试，用于优化主机内存利用和数据传输。对 fully async 来说，它是从“单控制器驱动批次”走向“样本级数据网关”的关键。

## 推理侧加速：MTP 需要看硬件和模型形态

MTP 在 verl 文档里既可用于训练，也可用于 rollout speculative decoding。配置上可以只加载 MTP 参数、训练 MTP 参数，或在 rollout 中通过 vLLM/SGLang 开启推测解码。

这里的工程结论很实际：启用 MTP 可以提高接受率，但在 H20 上整体 rollout 吞吐未必提升，甚至可能下降。文档给出的建议是当前推理阶段优先谨慎开启 MTP，尤其要看模型大小、GPU Tensor Core 性能和推测解码实现开销。

这点和 Seer 的 grouped speculative decoding 形成对照。MTP 是模型结构层的 draft 能力，Seer 用同 prompt group 的 token pattern 生成 grouped draft；二者都服务 rollout 加速，但收益受 batch、硬件、接受率和调度结构共同限制。

## 选择路线时看四个问题

第一，看训练是否必须严格 on-policy。若目标是复现实验或诊断算法，优先选择同步 GRPO/DAPO/OPO，并保守使用 rollout correction。若目标是长时间大规模训练，允许轻度 off-policy，fully async 的 `staleness_threshold` 和 `partial_rollout` 更有价值。

第二，看瓶颈在 rollout、teacher、logprob 还是 update。`wait_prev_gen` 高说明 rollout 侧或长尾是主因；`wait_prev_teacher` 高说明教师服务是瓶颈；`sync_rollout_weights` 高说明参数同步或网络需要优化；actor MFU 低且 rollouter idle 低说明数据流或 trainer 资源可能失衡。

第三，看 reward 信号是否足够密集。数学 verifier reward 适合 GRPO/DAPO；如果存在更强教师且需要低方差 token-level guidance，async on-policy distill 更直接。

第四，看 mismatch 指标。需要记录 `rollout_log_probs`、当前训练 logprob、KL、K3、chi2 token/sequence、IS effective sample size、RS masked fraction。若这些指标异常，吞吐提升可能只是把错误样本更快送进 update。

## 跨论文关系

- [2020-03-07 Schulman KL approximation](/papers/2020-03-07-schulman-kl-divergence-approximations/) 提供 `K3` 指标的数学来源：$k_3=(r-1)-\log r$ 是无偏、非负、低方差 KL value estimator。verl 中记录 KL/K3/chi2 时，应继续区分 drift 诊断值、KL reward penalty 和可微 KL loss。
- [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 提供 verl 的原始系统抽象：RLHF 被看作多模型 dataflow，single-controller 编排模型间流程，multi-controller 处理模型内分布式执行。当前 one-step-off、fully async、TransferQueue 是这条系统线在 post-training workloads 上继续扩展。
- [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/) 是 DAPO recipe 的论文背景。verl 当前 DAPO 文档把 Clip-Higher、dynamic sampling、token-level loss、overlong reward shaping 落到了配置和代码层。
- [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 与 rollout correction 强相关。verl 当前文档把 TIM 风险工程化为三策略框架、TIS、RS、bypass/decoupled mode 和 mismatch 指标。
- [2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/) 提供另一条路线：在保持 synchronous/on-policy 语义下，用 group-aware scheduling、global KVCache 和 grouped SD 降低 rollout long-tail。它和 fully async 的取舍正好互补。
- [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 中的 slime / asynchronous RL / TITO / double-sided IS 与 verl fully async 的方向接近，都在用系统异步性换取 agentic RL 吞吐，同时需要 freshness 和 importance ratio 控制。
- [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 的 CISPO 与这里的 off-policy correction 在形式上都使用 importance ratio，但用途不同：CISPO 的 clipped importance value 更偏 loss contribution range 控制，verl rollout correction 直接面对 `π_rollout` 到 `π_old` 的行为策略偏移。

## 实践判断

verl 当前最重要的变化，是把“RL 算法”扩展成“算法目标 + 数据新鲜度 + logprob 归属 + 参数同步 + 样本流调度”的一体化问题。只讨论 PPO/GRPO loss 已经不足以解释训练效果；同一个 DAPO loss，在同步 colocate、one-step-off、fully async、partial rollout、bypass correction、decoupled correction 下，样本分布和梯度估计都会发生变化。

一个稳健的训练实验应该同时记录三类指标：

- 质量指标：reward、pass@k、majority@k、AIME/Math benchmark、response length distribution。
- 算法指标：KL、entropy、clip fraction、advantage distribution、IS weight、ESS、RS masked fraction。
- 系统指标：gen time、old logprob time、update actor time、wait_prev_gen、wait_prev_teacher、sync_rollout_weights、trainer/rollouter idle ratio、partial rollout ratio。

只有这三类指标同时改善，才能说明优化确实提升了训练效率。若 wall-clock 下降但 mismatch、staleness、length distribution 或 ESS 恶化，需要把收益解释为系统吞吐收益，而不能直接解释为算法改进。

## 证据链强度评估

### 强证据

- verl 文档给出 one-step-off、fully async、TransferQueue、MTP 等模块的具体配置、指标和时间对比，可支撑系统吞吐方向的判断。
- rollout correction 部分把 `rollout_log_probs`、`old_log_probs` 和当前 `log_prob` 分清，公式上能解释 staleness 下的行为策略修正。
- 指标清单覆盖 quality、algorithm 和 system 三层，能直接指导后续实验记录。

### 中等强度证据

- 多数性能数字来自官方文档、示例配置或 W&B 链接，可信度高于概念描述，但仍缺少独立复验。
- MTP 的硬件差异结果说明收益受模型、decode 长度、显存带宽和 kernel overhead 共同影响，不能只按接受率判断。

### 需要谨慎的推论

- fully async、partial rollout 和 correction 的组合空间很大，不同 reward、context length、GPU 拓扑和推理引擎会改变最优配置。
- 文档随版本快速变化，本笔记适合作为架构理解和实验 checklist，具体参数需要绑定 verl commit 与运行日志。

## 主要启发

- RL 后训练系统要把算法目标、样本新鲜度、logprob 归属和参数同步作为同一条闭环来设计。
- 判断异步优化是否有效，需要同时看 wall-clock、staleness、importance weight、有效样本量和任务质量。
- 面向 agentic rollout 时，慢环境、长 decode、teacher query 和 reward 计算都应进入调度器的状态变量。

## OpenReview / 审稿意见吸收

- Venue status: 当前档案未记录公开 peer-review 状态。
- Public reviews: 当前档案未记录可可靠匹配的 OpenReview / ARR / 会议 reviewer comments。
- Ratings / confidence: 无公开评分可用于校准。
- Reviewer consensus: 暂无。
- Main criticisms: 暂无公开 reviewer 质疑可引用；可信度主要由论文、技术报告、项目证据和本地一致性检查决定。
- Author response: 暂无公开 rebuttal 记录。
- 对本文可信度的影响: 按未完成公开审稿吸收处理，结论需要依赖实验设置、baseline 强度、复现证据和跨论文一致性校准。

## 局限

- verl 文档更新速度快，具体配置名、支持引擎和默认值需要以后续官方页面为准。
- 多数实验结果来自文档给出的配置和 W&B 链接，本笔记没有独立复现实验。
- fully async、partial rollout 和 rollout correction 的组合空间很大，不同模型、硬件、reward、序列长度下可能表现不同。
- async on-policy distill 的结论依赖教师质量、teacher server 吞吐和 top-k 分布覆盖；它不能直接替代所有 verifier reward 或 preference reward 场景。

## Reference Intake Brief

- 核心问题：同步 on-policy LLM RL 在 long-CoT / tool-use 场景下会被 rollout 长尾和多阶段等待拖慢。
- 算法主线：PPO 提供稳定 trust region，GRPO 降低 critic 成本，DAPO 提供 long-CoT recipe，OPO/GPG/OTB/DPPO 分别处理 baseline、简化 policy gradient、方差诊断和 divergence trust region。
- 系统主线：one-step-off 做批次级重叠，fully async 做样本级流式异步，async on-policy distill 把教师查询纳入重叠流水线，TransferQueue 承接样本级数据管理。
- 关键变量：`rollout_log_probs`、`old_log_probs`、当前 `log_prob`、`staleness_threshold`、`trigger_parameter_sync_step`、`partial_rollout`、`rollout_is_weights`、`modified_response_mask`。
- 可复用判断：吞吐提升必须和 mismatch 指标、长度分布、ESS、clip fraction、最终任务指标一起看。
- 后续跟踪：verl fully async 与 Seer synchronous rollout 优化、TIM/VeXact zero-mismatch 路线、GLM-5/slime async RL、MiniMax-M1/CISPO importance ratio 控制之间的工程取舍。
