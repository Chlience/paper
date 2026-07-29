# ThunderAgent：把多轮 Agent 变成可调度的 LLM Program

Updated: 2026-07-16

资料：[完整论文笔记](/papers/2602.13692-thunderagent-program-aware-agentic-inference/)；[arXiv v3](https://arxiv.org/abs/2602.13692)；[官方代码](https://github.com/ThunderAgent-org/ThunderAgent/tree/7ddc8610270e56d3b109eed8796b3a4360fc67c9)；[项目主页](https://thunderagent.ai/)；[ICML 2026 Spotlight](https://icml.cc/virtual/2026/poster/62040)。

适用范围：高并发、多轮、工具调用占比较高的 Agent serving 与 RL rollout。Agent 会在 LLM reasoning、工具执行和下一轮恢复之间反复切换，推理后端可以暴露 token 数、KV Cache 容量与 pause / restore 接口，上层 runtime 可以传递稳定的 `program_id` / `trajectory_id` 和 termination signal。

## 核心结论

常规推理系统把一次 chat completion 当作调度单位，Agent 的一次任务却跨越许多 LLM request、工具调用和 sandbox 生命周期。调度器看到的是一批相互独立的请求，真实运行对象是一条持续携带上下文、KV Cache、工具资源和 backend placement 的 program。

ThunderAgent 把这条跨轮状态表示为 LLM Program，再按 Reasoning / Acting phase 决定 KV 的保留、释放和恢复。正在生成 token 的 reasoning program 获得较高保护；等待工具的 acting program 可以随内存压力降低保留优先级；KV 已释放的 program 进入全局 waiting queue，从有容量的节点重新 prefill 并继续执行。工具环境也复用同一个生命周期信号完成回收和异步准备。

这套设计处理的是三个相互牵制的目标：保留 KV 可以减少 re-prefill，释放 KV 可以增加当前 GPU 的有效工作，解除固定 placement 可以改善跨节点负载。论文中的 Space-Time Product（STP）负责组织成本来源，公开 runtime 最终执行的是 phase priority、shortest-first、容量检查和全局恢复等局部启发式。

论文在所测高并发 Agent workload 中，相对 vLLM 报告 $1.48\times$–$3.58\times$ 的 steps/min 提升；固定模型的 RL rollout 实验中，mini-SWEAgent 和 OpenHands 分别达到 $1.79\times$ 与 $3.92\times$。这些数字支持采样与 serving 吞吐改善，完整 RL 训练时间、policy quality、交互尾延迟和公平性仍需单独测量。

## 1. 工具等待为什么会变成 KV Cache 问题

一条 ReAct program 会反复经过下面的时间线：

```text
Program A

                Round 1                             Acting                Round 2
                ----------------------------------  --------------------  ---------------------------
LLM / GPU       prefill -> reasoning -> tool call   idle                  resume / re-prefill -> decode
Tool / CPU      idle                                tool execution        idle
KV retained     build KV                            keep resident         reuse KV -> decode
KV evicted      build KV                            release HBM           re-prefill -> decode
```

工具执行期间，Program A 暂时不使用 GPU 计算，上一轮生成的 KV 仍然有价值。工具一旦返回，下一轮可以从这份 KV 继续 decode；KV 若已被驱逐，完整历史需要重新 prefill。

保留所有 acting KV 看起来能够避免重算。高并发下，这份“保险”会占据大量 HBM，让真正 ready 的 reasoning program 无法进入 batch。固定把同一 session 发回原 backend 也能提高 KV hit rate，同时把长上下文和慢工具积累在少数节点，其他节点可能仍有空闲容量。

论文在被测 workload 中观察到三类具体损耗：

- KV 被驱逐后，re-prefill 可把平均端到端 latency 放大到最高 $7.14\times$。
- 两节点 OpenHands rollout 在 90 分钟内有 37 分钟出现超过 20% 的节点内存差，峰值达到 51%。
- GPU scheduler 与 tool orchestrator 缺少共同 termination signal 时，结束任务的 sandbox、socket、端口和磁盘资源可能继续保留。

问题由此从“怎样提高 cache hit rate”转成“哪一条 program 的 KV 此刻值得占用 HBM，以及它恢复时应该落到哪个节点”。Request id 无法回答这个问题，因为它只覆盖一轮调用。

## 2. 核心切入点：调度对象应该覆盖完整 Agent 生命周期

ThunderAgent 定义：

$$
P=\langle \mathit{ID},c,\mathcal{T},\mathcal{L},\tau,s\rangle.
$$

| 字段 | 含义 | 调度价值 |
| --- | --- | --- |
| $\mathit{ID}$ | 跨轮稳定的 program id | 把多个 chat completion 归回同一任务 |
| $c$ | 上下文 token 数 / KV footprint | 估算保留、释放和重算成本 |
| $\mathcal{T}$ | 工具环境集合 | 关联 sandbox、端口、磁盘和外部资源 |
| $\mathcal{L}$ | 当前 backend placement | 记录 KV 所在节点；释放后可以清空 |
| $\tau$ | Reasoning 或 Acting phase | 区分当前 GPU 有效工作与工具等待 |
| $s$ | Active、Paused、Terminated | 驱动恢复、回收和生命周期 hook |

一次 program 的状态变化可以写成：

```text
New
  │
  ▼
Active / Reasoning ──tool call──▶ Active / Acting
       ▲                              │
       │                         tool returns
       └──────────────────────────────┘

Memory pressure: Active ──pause──▶ Paused ──restore──▶ Active
Task completed:  Active / Paused ───────────▶ Terminated
```

`pause` 释放 KV 并清空 placement：

$$
P\leftarrow\langle \mathit{ID},c,\mathcal{T},\varnothing,\tau,\mathrm{Paused}\rangle.
$$

`restore` 在新 backend 上重新构建 KV：

$$
P\leftarrow\langle \mathit{ID},c,\mathcal{T},\mathcal{L}',\tau,\mathrm{Active}\rangle.
$$

这里发生的是“释放后重算并重新 placement”。ThunderAgent 没有把一份 live KV 从一个 GPU 直接迁移到另一个 GPU。这个区别决定了它何时值得使用：节点负载差异越大，重新 placement 越有价值；上下文越长，re-prefill 代价越高，迁移自由度就越昂贵。

## 3. STP 怎样把三类浪费放进同一张成本图

论文使用 Space-Time Product 描述一段资源在一段时间内的占用：

$$
\mathrm{Cost}_x=\int_0^{t_x}M_x(t)\,dt.
$$

随后把总成本写成：

$$
\mathrm{Cost}_{\mathrm{total}}\approx
\mathrm{Cost}_{\mathrm{decode}}+
\mathrm{Cost}_{\mathrm{prefill}}+
\mathrm{Cost}_{\mathrm{recompute}}+
\mathrm{Cost}_{\mathrm{unused}}+
\mathrm{Cost}_{\mathrm{caching}}.
$$

这五项给出了系统设计的路线：

| 成本 | 发生原因 | ThunderAgent 的对应机制 |
| --- | --- | --- |
| decode / prefill | 完成模型计算 | 保留为 productive work |
| recompute | KV 被释放后重新 prefill | phase-first 与 shortest-first 控制释放对象 |
| unused | 某些节点空闲，program 被 placement 限制在其它节点 | 全局 waiting queue 重新选择 backend |
| caching | 等待工具的 KV 长时间占据 HBM | acting reservation aging 与真实容量检查 |

这组总式是 accounting taxonomy。公开实现没有在线测量五项成本并求解一个统一目标，runtime 使用 program phase、token length、acting elapsed time 和 backend capacity 作为代理量。

STP 还需要固定归一化口径。若观察窗口和总容量都固定，同时把所有 memory-time 分到“使用”或“未使用”，总和可能接近 $C\times T$，对策略失去区分力。真正进入局部推导的部分主要是 re-prefill：在固定 chunk size、重算时间近似随上下文长度线性增长时，重算期间 KV 从 0 增长到 $c_i$，于是

$$
\mathrm{Cost}_{\mathrm{recompute}}\propto c_i^2.
$$

这给 shortest-first 一个直觉基础：释放较短 program 的 KV，未来重算成本通常较低。它仍是 whole-program eviction 下的 heuristic，后文会看到这一点。

## 4. ThunderAgent 实际怎样调度一条 program

LLM Program 定义了调度状态，STP 解释了成本来源。运行时把它们落成六个动作：

1. **接收生命周期事件。** Agent server 为每条轨迹传递稳定的 `program_id`。LLM 请求开始、模型发出 tool call、工具返回和任务结束时，runtime 分别更新上下文长度 $c$、Reasoning / Acting phase、Active / Paused / Terminated status、backend placement 与工具环境。
2. **按 phase 确定工作优先级。** Tool call 把 program 从 Reasoning 切到 Acting；工具返回后再切回 Reasoning。Reasoning program 已经可以消耗 GPU 并推进任务，因此获得更高的保留与恢复优先级；Acting program 正在等待外部结果，内存压力出现时先让出容量。
3. **分别检查恢复预算与物理容量。** 可选的 acting decay 根据工具已等待时间降低 KV 的有效预留量，用于判断 backend 能否接纳 waiting program。恢复完成后，scheduler 再按完整 token 数检查真实 KV 占用，保证物理容量安全。
4. **容量超限时主动 pause。** Scheduler 先选择 Acting program，再选择 Reasoning program；同一 phase 内优先选择上下文较短者。`pause` 释放整条 program 的 KV、清空原 backend placement，并把 program 放入全局 waiting queue。
5. **从全局队列选择新节点恢复。** Scheduler 按 Reasoning、new program、Acting 的优先组挑选候选，再用 Best Fit Decreasing 将候选放入有容量的 backend。恢复到新节点时通过 re-prefill 重建 KV，随后继续 decode。
6. **用 termination signal 回收整条任务。** Program 进入 Terminated 后，runtime 清除 scheduler 与 KV accounting；生命周期 hook 通知上层 orchestrator 释放 sandbox、socket、端口和磁盘。接近恢复的 program 还可以异步准备工具环境。

这条控制链把四个信号分工固定下来：phase 表示当前推进价值，context length 近似表示未来重算成本，backend capacity 触发 pause / restore，全局队列决定新的 placement。具体决策先从 phase 开始，因为相同长度的 KV 在 Reasoning 和 Acting 阶段具有不同的即时价值。

### 4.1 Phase-first：先判断 program 此刻是否需要 GPU

论文给出两条抽象 score：

$$
S_{\mathrm{restore}}(P)=\frac{1}{c_P}+\mathbb{I}(\tau=\mathbf R),
$$

$$
S_{\mathrm{pause}}(P)=\frac{1}{c_P}+\mathbb{I}(\tau=\mathbf A).
$$

它们表达两层优先级：

- 恢复时先考虑 reasoning program，因为它已经能够产生 GPU 有效工作。
- 释放时先考虑 acting program，因为它正在等待工具。
- 同一 phase 内偏向短 program，降低未来 re-prefill 的估计成本。

公开代码的恢复路径还加入 new-program 中间优先级和 Best Fit Decreasing placement。论文 score 适合解释调度方向，无法完整替代当前实现。

### 4.2 Acting decay：降低的是保护权重，真实 KV 仍然存在

工具时长未知时，ThunderAgent 给 acting KV 加入随 elapsed time 下降的有效预留权重：

$$
D_{\mathrm{eff}}
=
\sum_{\tau=\mathbf R}c_p
+
\sum_{\tau=\mathbf A}c_q f(t_q).
$$

论文配置使用 $f(t)=2^{-t}$。这个量表示调度器愿意继续为 acting KV 保护多少虚拟容量。真实物理占用仍为：

$$
D_{\mathrm{physical}}
=
\sum_{\tau=\mathbf R}c_p
+
\sum_{\tau=\mathbf A}c_q,
\qquad
D_{\mathrm{physical}}\ge D_{\mathrm{eff}}.
$$

公开代码 `main@7ddc861` 把两层容量检查分开：

1. `remaining_capacity_with_decay()` 只判断某个 backend 是否允许 optimistic resume。
2. program 恢复后，`remaining_capacity()` 用完整 token 数检查真实 KV 是否超出容量。
3. 真实占用超限时，`_pause_until_safe()` 先释放较短 acting program，再处理 reasoning program。

设 backend 容量为 100，reasoning KV 为 60，acting KV 的真实大小为 40。工具刚启动时，$D_{\mathrm{eff}}=100$。等待一段时间后若 $f(t)=0.25$，调度器只继续保护 10，虚拟占用降到 70。此时可以恢复一条 20-token reasoning program；真实占用会暂时升到 120，随后物理容量检查释放那条 40-token acting KV，使真实占用回到 80。

因此，elapsed-time decay 更接近 KV reservation aging 或 replacement policy。它没有减少已经分配的 HBM，也没有直接预测工具还要运行多久。

这一点在不同工具时长分布下尤其重要：

- 严格 memoryless 的工具延迟中，已经等待多久无法改变条件剩余时间，仅凭 $t$ 不能改善预测。
- heavy-tail 或混合快慢模式中，等待越久可能意味着进入 slow mode，降低保留优先级更有依据。
- 近确定性工具中，等待越久通常越接近返回，固定指数衰减可能过早释放即将复用的 KV。

论文附录推导的是满足 time-homogeneous 相对衰减与边界条件时的函数形状，没有给出通用最优衰减率。当前代码也把 `use_acting_token_decay` 设为可选配置。

### 4.3 Shortest-first：有用的近似，不保证每次都全局最优

释放目标可以写成：

$$
\min_S\sum_{i\in S}c_i^2
\quad\text{s.t.}\quad
\sum_{i\in S}c_i\ge\Delta C.
$$

较短 program 的平方重算成本低，升序选择通常合理。Whole-program eviction 允许超额释放后，greedy 会遇到离散组合边界。例如候选长度为 $\{4,6,7\}$，需要释放 7：

- shortest-first 选择 4 和 6，成本为 $4^2+6^2=52$；
- 直接选择 7，成本为 $7^2=49$。

附录中的全局最优论证使用了拆分或精确替换长 program 的步骤，实际系统不能任意拆分一条 program。技术分享中更稳的结论是：$c^2$ 为 shortest-first 提供重算成本直觉，Appendix G.3 的两个 workload 为它提供经验支持，离散全局最优仍需要额外条件。

### 4.4 全局 waiting queue：释放 KV 后重新获得 placement 自由度

Session pinning 把 program 和原 backend 绑定在一起。ThunderAgent pause 一条 program 后已经失去 KV locality，继续保留这个绑定只会限制调度。它把 paused program 放入全局队列，从所有 backend 中寻找可容纳的恢复位置。

```text
Backend 0: [long acting KV][reasoning KV][full]
Backend 1: [reasoning KV][free capacity]

pause acting program on Backend 0
        │
        ▼
global waiting queue
        │
        ├── restore on Backend 0 when capacity returns
        └── restore on Backend 1 and re-prefill there
```

这里用 re-prefill 成本换取跨节点负载平衡。收益需要三个条件共同成立：节点间确实存在容量差异，别的节点有可用空间，重新 prefill 的成本低于继续等待原节点的机会成本。

### 4.5 Tool resource manager：让 termination 同时结束 GPU 与 sandbox 生命周期

Program 进入 Terminated 后，hook-based garbage collection 可以触发 sandbox、socket、端口、磁盘与计算资源的 teardown。全局队列中的高优先级 program 接近恢复条件时，runtime 还可以异步准备工具环境，减少恢复后的同步初始化等待。

论文将这一组机制归因为约 10% 的 latency 改善和 $4.2\times$ disk memory savings。GC 与异步 preparation 没有独立消融；固定代码快照中的核心 `ThunderAgent/` 包主要实现 program / backend state、pause / restore、全局队列和 `/release_program`，通用 sandbox teardown 与 prewarm 仍由具体 workload 或 orchestrator 集成。

## 5. 实验结果应该怎样读

### 5.1 实验范围

- 模型：GLM-4.6 355B、Qwen3 235B、Qwen3-8B，部分消融使用 GLM-4.5-fp8 / MiniMax M2.5；
- 任务：SWE-Bench Lite、ToolOrchestra on HLE、OpenHands on ScienceAgentBench、R2E-Gym；
- Agent：OpenHands、mini-SWEAgent、ToolOrchestra；
- 硬件：主要使用 H100 集群，附录包含 A100 portability；
- Baseline：vLLM、Continuum，以及 RL rollout 中的 vLLM + SGLang Gateway；
- 主指标：steps per minute，一步包含 reasoning 与 acting。

这些实验直接覆盖多轮工具型 workload，证据强于只使用合成长宽分布。论文没有完整披露 baseline 版本、调参网格、随机种子和置信区间，精确倍率仍依赖 serving 与工具环境配置。

### 5.2 关键数字

| 场景 | Baseline | ThunderAgent 结果 | 最窄支持结论 |
| --- | --- | --- | --- |
| 高并发 Agent serving | vLLM | $1.48\times$–$3.58\times$ steps/min | 所测 workload 中 program-aware scheduling 提高持续吞吐 |
| 高并发 Agent serving | Continuum | $1.17\times$–$3.31\times$ steps/min | 相对 multi-turn serving baseline 仍有增量 |
| mini-SWEAgent rollout | vLLM + SGLang Gateway | 375.4 → 671.8 steps/min，$1.79\times$ | 固定 GLM-4.6、$N=144$ 和两台 $8\times$H100 下采样吞吐提高 |
| OpenHands rollout | vLLM + SGLang Gateway | 69.1 → 270.8 steps/min，$3.92\times$ | 同配置口径下 OpenHands rollout 增益更大 |
| Tool resource management | 无该组件 | 约 10% latency 改善，$4.2\times$ disk savings | 具体 orchestrator 中整组 lifecycle 机制有效 |

Rollout 表测量固定模型生成轨迹的速度。训练器更新、policy lag、最终任务质量和完整 RL wall-clock 没有进入该实验，因此 $3.92\times$ 不能直接理解成 RL 训练端到端加速。

### 5.3 消融告诉了我们什么

在 GLM-4.5-fp8 + mini-SWEAgent 的固定配置中：

| 组件 | Throughput |
| --- | ---: |
| vLLM baseline | 375 steps/min |
| + local program-aware scheduling | 602 steps/min |
| + global waiting queue | 672 steps/min |

local scheduler 贡献了主要增量，全局队列继续带来跨节点收益。Local package 同时包含 phase priority、shortest-first 和可选 decay，表格无法把三者进一步正交拆分。

### 5.4 KV hit rate 为什么不能单独代表系统好坏

高 KV hit rate 说明重算较少，也可能意味着大量等待工具的 program 长时间占据 HBM。随机工具 workload 中，论文观察到较低 KV hit 与较高 steps/min 同时出现，因为调度器释放 stale acting KV，让更多 ready reasoning program 进入 GPU。

因此至少要同时观察：

- completed steps/min 与 program completion time；
- KV hit rate、re-prefill tokens 和重算时间；
- 每个 backend 的物理 KV occupancy；
- reasoning / acting program 数量；
- pause / restore 次数与全局队列等待时间；
- P50 / P95 / P99 latency 与 per-program fairness。

## 6. ThunderAgent 与相邻系统的关系

| 系统 | Runtime 能看到什么 | 主要优化粒度 | 与 ThunderAgent 的分工 |
| --- | --- | --- | --- |
| vLLM / SGLang | 单次 request、token、KV blocks | request / batch | ThunderAgent 在其上补充跨轮 program lifecycle |
| KV-aware routing / session pinning | session id、prefix locality | session placement | ThunderAgent 允许释放 KV 后重新选择 backend |
| Continuum / tiered cache | multi-turn session、TTL、offload | KV retention | ThunderAgent 用显式 phase 和 program status 控制 working set |
| [SPORK](/papers/2607.03333-spork-self-speculative-agentic-inference/) | main/probe branch、tool-call confidence | 单 turn speculation | 在一个 program 内提前执行预测的只读工具 |
| [Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/) | Semantic Variable、application DAG | LLM application | 同样把上层语义暴露给 serving runtime |
| [RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/) / [slime](https://github.com/THUDM/slime) | trajectory、sample、训练归属 | RL rollout pipeline | ThunderAgent 聚焦采样侧 KV 与工具生命周期 |

这些机制覆盖不同粒度的 runtime：Parrot 暴露应用 DAG 的显式语义，ThunderAgent 管理 program 的长期状态、工具等待与跨节点 placement，SPORK 在单个 turn 中 fork probe，让工具执行覆盖剩余 reasoning。组合系统还需要统一 admission budget、KV accounting、priority、commit / reject / cancel 事件和 foreground decode contention。

## 7. 适用条件与证据边界

收益更容易出现在以下条件下：高并发、多轮工具调用、上下文长度差异较大、工具等待具有长尾、节点之间出现 KV footprint 不均衡，以及 re-prefill 成本仍低于等待原节点的机会成本。

当前边界包括：

1. 低并发、短上下文、短工具调用或高度均匀的 session 分布会降低 program-aware scheduling 的增量。
2. 论文以 throughput 为主，在线交互场景还需要 tail latency、deadline、starvation 和 fairness 策略。
3. Time decay 只使用 elapsed acting time；工具类别、输入大小、RPC queue、编译进度和下载进度可以支持更准确的 remaining-time / return-probability 预测。
4. Shortest-first 依赖 $c^2$ 重算近似，whole-program eviction 下缺少无条件全局最优保证。
5. 全局恢复会增加 re-prefill；极长上下文或跨节点容量差异较小时，迁移自由度可能抵不过重算成本。
6. Tool manager 的收益依赖 sandbox、镜像、文件系统、端口和失败恢复协议；开源核心包没有提供与所有 orchestrator 通用的完整实现。
7. Baseline 版本、调参、容器配置、重复运行和置信区间披露有限。
8. RL rollout 中的 pause / restore / recompute 会改变 batch composition 和数值执行路径；policy lag、rollout/trainer logprob consistency 与最终训练质量尚未验证。
9. 当前代码快照中的 elapsed-time decay 默认关闭；NVIDIA Dynamo 的实验性移植也使用严格的 non-decayed resume gate，说明 LLM Program abstraction 可以独立于具体 decay policy 发挥作用。

## 8. 分享顺序

一场 12–15 分钟的分享可以沿下面的路径推进：

1. **问题，2 分钟**：画出 `reasoning → tool wait → re-prefill`，说明保 KV、释放 HBM 与固定 placement 的冲突。
2. **抽象，2 分钟**：展开 $P=\langle \mathit{ID},c,\mathcal T,\mathcal L,\tau,s\rangle$，强调跨轮 program 才是实际资源所有者。
3. **成本，2 分钟**：用 STP 表格连接 recompute、unused 和 caching 三类开销，并说明它是 accounting map。
4. **调度，4 分钟**：讲 phase-first、acting reservation aging、物理容量检查、shortest-first 和全局 waiting queue。
5. **证据，2 分钟**：保留 serving 的 $1.48\times$–$3.58\times$、rollout 的 $1.79\times$ / $3.92\times$ 和 375→602→672 消融。
6. **边界，2 分钟**：强调 throughput 口径、time-decay 假设、shortest-first 反例、tool manager 集成与 RL 闭环缺口。

最后可以收束为三句话：

- 多轮 Agent 的资源状态跨越 request，调度对象也需要跨越 request。
- ThunderAgent 用 LLM Program 把 phase、KV、placement 和 tool lifecycle 放进同一个 runtime 状态，再以 pause / restore 与全局队列控制 GPU working set。
- 最稳定的贡献是 program abstraction 和跨节点调度自由度；具体 decay、驱逐和预测策略仍应根据工具延迟分布与 HBM 压力选择。

## 9. 常见问题

### ThunderAgent 会把 KV 从一张 GPU 迁移到另一张 GPU 吗？

不会进行 live KV migration。Program pause 后释放 KV，进入全局队列；恢复到新 backend 时通过 re-prefill 重建 KV。系统交换的是 placement 自由度与重算成本。

### 等待工具时为什么不一直保留 KV？

保留 KV 可以省去未来 re-prefill，同时持续占用 HBM。高并发下，这些 KV 会阻止 ready reasoning program 进入 GPU。调度器需要比较未来重算收益和当前容量机会成本。

### Time decay 是否在预测工具剩余时长？

它只根据已等待时间降低 acting KV 的有效保护权重。真实 KV 大小保持不变，公开实现仍通过完整 token accounting 保证物理容量安全。工具剩余时间预测需要额外的 tool type、queue、输入规模或进度特征。

### Shortest-first 为什么可能失效？

Program 是不可分割的释放单位，greedy 可能为了达到容量目标而过度释放多个短 program。$c^2$ 说明短上下文通常更便宜，无法自动解决离散子集选择和 overshoot。

### ThunderAgent 的目标是提高 KV hit rate 吗？

主目标是提高 completed steps 与系统吞吐。KV hit rate 是中间指标；释放部分等待工具的 KV 可能降低命中率，同时让更多 reasoning program 运行，从而提高总体产出。

### $3.92\times$ rollout 加速能直接变成 RL 训练加速吗？

该数字来自固定模型的 OpenHands 采样侧 steps/min。完整训练还包含权重更新、checkpoint / weight sync、policy lag、数据过滤和 trainer idle time，需要端到端测量。

### SPORK 和 ThunderAgent 应该怎样组合？

ThunderAgent 维护 program 生命周期、全局容量与跨节点 placement；SPORK 为当前 turn 创建 speculative tool branch。统一 runtime 需要共享 program id、KV ownership、priority、tool task 状态和 cancel / commit 协议，并协调 probe、工具执行、跨轮恢复与 foreground decode 的资源竞争。
