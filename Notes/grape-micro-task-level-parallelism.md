# Grape：把相依 LLM 调用推进到微任务级并行

Updated: 2026-07-15

资料：[完整论文笔记](/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/)；正文依据本地提供的 12 页匿名稿；[Hailong Yang 主页](https://thomas-yang.github.io/)已将论文列为 SC 2026 accepted。

适用范围：预先声明控制拓扑的多阶段 DAG（Directed Acyclic Graph，有向无环图）工作流，执行节点以大语言模型（LLM）调用为主。运行时会产生不同长度的中间文本，task 拓扑保持预先定义。

## 核心结论

Grape 把相依 LLM task 的静态 prompt、流式上游输出和 decode 拆成可调度的微任务：下游先计算已经确定的静态 prompt，上游每生成一段中间结果，下游就把这段 token 增量 prefill 到自己的 Key-Value Cache（KV Cache）中。等上游输出完整到达时，下游 prompt 的大部分 prefill 已经完成，可以更快进入 decode。

Grape 基本保留原有 prefill token 的计算量，主要改变计算发生的时间和 batch 组合。它把 compute-intensive 的 prefill 填入 bandwidth-bound decode 留下的 GPU 计算余量，同时平滑 task 切换处的长 prefill burst。

这里的 overlap 指调度时间线上的交错推进，以及 continuous batching 中的 mixed prefill/decode batch；系统无需让两个 GPU kernel 并发运行。

相对底层实现最接近的 `vLLM-opt`，完整 Grape 的平均 agentic inter-token latency 加速 1.15×，P95 加速 3.80×，吞吐提高 1.16×。论文只对 memory optimization 给出独立消融，因此这些数字支持完整系统，尚不能继续拆分到 incremental prefill、scheduler 和 memory manager。

## 1. Task 边界为什么形成性能空档

一个相依工作流通常沿下面的路径推进：

```text
Task A: [prefill][decode y1, y2, ..., yn]
Task B:                                  [prefill static + y1...yn][decode]
```

通用 serving engine 把每次 LLM 调用视为原子请求。Task B 需要 Task A 的完整输出，于是它在 A decode 期间保持等待；A 完成后，B 再集中执行一次长 prefill。

这条路径产生两类可测的浪费：

- Decode 每步只处理少量 token，主要读取模型权重和历史 KV，通常受内存带宽限制，GPU 计算单元仍有余量。
- Task 切换触发长 prefill，当前 workflow 和同 batch 请求的 token 间隔都会出现尖峰。

论文把中间 task 输出与最终输出放入同一条 token 时间序列，并把相邻 token 的间隔称为 agentic inter-token latency。这个指标直接观察 task 切换带来的 token gap，也构成论文服务级目标的一部分。

Grape 将执行时间线改写为：

```text
Task A: [prefill][decode y1][y2] ... [yn]
Task B: [static prefill] [prefill C1][C2] ... [Cm][decode]
```

其中 `C1...Cm` 是 Task A 输出的 token chunks。Task B 的 decode 仍在完整 prompt 到齐后启动；被提前执行的是 prompt prefill。

## 2. 核心切入点：依赖的是 token，等待却发生在整个 task

设下游 Task B 的 prompt 为

$$
P_B = S_B \Vert U_B \Vert Y_A,
$$

其中 $S_B$ 是 system prompt 或模板，$U_B$ 是请求进入时已知的输入，$Y_A$ 是上游 Task A 逐 token 生成的中间结果。

Grape 分三步处理：

1. 立即 prefill $S_B \Vert U_B$，生成下游静态前缀的 KV。
2. 将 $Y_A$ 按 chunk $C_1,\ldots,C_m$ 流式送入 Task B，沿同一 causal KV state 继续 prefill。
3. $Y_A$ 完整到达后，Task B 从已经构建好的 KV state 开始 decode。

Partial edge 传递的是 token，随后由下游 task 在自己的 prompt prefix 下计算 KV；Grape 没有搬运或复用上游 task 的 KV。

这一改写依赖 causal Transformer 的前缀性质：新 token 只读取已有前缀。相同 token 序列、位置编号、causal mask 和模型参数下，分块追加与整段 prefill 具有相同的理想语义依赖。实际 GPU kernel 可能因 batch composition、reduction order 和有限精度产生末位数值差异，论文未报告 logits 或生成结果的一致性实验。

上式把 $Y_A$ 放在 prompt 尾部。若后面还有内容已知的 suffix，该 suffix 的 KV 仍依赖前面的 $Y_A$，需要等待对应 causal prefix 到齐后再计算。

Chunk 大小形成直接权衡：较大的 chunk 提高单次 operator 效率，较小的 chunk 增加上游 decode 与下游 prefill 的重叠机会。Grape 通过一次性离线 profiling 选择 partial edge 的权重，论文报告 profiling 约需 5 分钟。

## 3. 从 TaskFlow 到可执行微任务

Grape 由 frontend abstraction、graph lowering、scheduler 和 memory manager 四部分组成。

### 3.1 TaskFlow 声明数据依赖

开发者使用两组原语描述工作流：

- `add_variable` 声明 `InputVar`、`IntermediateVar` 和 `OutputVar`；
- `add_task(prompt, task_output)` 声明 prompt template 与输出变量。

变量引用隐式建立 task 之间的数据依赖。TaskFlow 因而同时保留应用层 DAG 和 prompt 内部的已知/未知边界。

### 3.2 Lowering 规则

| TaskFlow 信息 | 微任务图表示 | 执行含义 |
| --- | --- | --- |
| system prompt、`InputVar` | static node | 请求到达时 token 已确定，执行一次 prefill |
| `IntermediateVar` 注入段 | dynamic node | 中间 token 到达后分 chunk 增量 prefill |
| task 输出生成 | dynamic node | 迭代执行 decode，次数由运行时输出长度决定 |
| 同一 task 内的先后关系 | strong edge | source 完整结束后 destination 才能开始 |
| 上游 decode 到下游 prefill | partial edge | 每累计指定数量的 token 就触发一次下游执行 |

![Figure 7: TaskFlow 到微任务图的转换](/images/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/fig-7-taskflow-transformation.png)

Figure 7 展示 summarization workflow 的转换。图中的 dynamic 表示 token 内容或执行次数到运行时才确定，控制拓扑仍由 TaskFlow 预先声明。

Image Source: PDF crop from supplied anonymous manuscript, p.4, Figure 7.

## 4. 微任务变多之后，调度器怎样控制代价

更细的执行单元扩大了可选 batch 空间，也会增加 KV residency。Grape 用优先级、单轮 batch 约束和图感知抢占处理这两个问题。

### 4.1 关键路径优先级

论文先把所有直接产出 token 的微任务视为 agentic-latency critical nodes，并按拓扑顺序赋予较高优先级。其余微任务继承最近下游关键节点的优先级，距离按最少 hop 计算。

这个规则让调度器同时推进两类工作：当前需要产出 token 的 decode，以及即将解除关键节点依赖的 static/dynamic prefill。这里的 critical path 表示输出敏感的拓扑路径，未使用预计服务时间加权。

### 4.2 单轮微 batch 可行域

Grape 用离线 profiling 拟合一次 LLM forward 的执行时间：

$$
T = F(N_{\mathrm{seq}}, N_{\mathrm{batch}}),
$$

$N_{\mathrm{seq}}$ 表示本轮需要读取的总 sequence/KV 长度，$N_{\mathrm{batch}}$ 表示本轮处理的 token 数。调度器取各请求当前最高优先级微任务中最紧的 SLO（Service-Level Objective，服务级目标），形成约束

$$
T \leq \mathrm{SLO}_{\min}.
$$

这个不等式给出当前微 batch 的可行区域，使额外 prefill 不会让一次 forward 超出最紧的 token latency budget。完整请求仍包含排队、后续轮次、依赖解除和抢占，论文的约束提供单轮控制，端到端 SLO 由实验达成率支持。

### 4.3 两阶段选择

1. **SLO-aware fairness selection**：按请求的 deadline urgency 排序，再 round-robin 地从各 ready queue 选择最高优先级微任务，让尽量多的请求在本轮获得最低进度。
2. **Micro-task prevision selection**：用剩余容量提前执行更接近关键路径的后续微任务，填充 GPU 计算余量。

第一阶段控制 starvation 与当前 token latency，第二阶段把可用容量转化为未来 task 的 prefill 进度。

### 4.4 微任务级 KV Cache 抢占

提前执行下游 prefill 会增加并发 KV 占用。Grape 将抢占单位从完整 request 缩小到微任务，并优先回收离当前 active critical node 最远的 KV。

这个策略减少一次抢占释放过多 KV 的情况，也降低关键节点很快重算所引发的反复抢占。论文只说明 distance 由 execution flow 与 active critical node 决定，没有给出计算公式；KV bytes、重算 FLOPs 和预计复用时间也未进入已披露的评分规则。

## 5. 实验结果应该怎样读

### 5.1 实验范围

- 模型：Llama3-8B、Qwen3-14B；
- 硬件：1 张或 2 张 A100 40GB，双卡通过 PCIe 互联；
- 工作负载：MetaGPT 风格 code generation、顺序 long-document summarization、四阶段 LLM-powered search；
- Baseline：Parrot、vLLM，以及把 Parrot 优化移植到相同 vLLM 基座的 `vLLM-opt`。

`vLLM-opt` 的底层 engine 与 Grape 最接近，能够更好地观察 workflow 微任务机制的增量。论文只说明它吸收了 Parrot 的 optimizations，没有列出具体移植项；相对 Parrot 的 headline 数字同时包含 operator、CUDA Graph 和 memory management 的实现差异。

### 5.2 关键数字

| 维度 | Grape 相对 `vLLM-opt` | 最窄支持结论 |
| --- | --- | --- |
| 平均 agentic latency | 1.15× speedup | 完整系统带来中等幅度平均 token-gap 改善 |
| P95 agentic latency | 3.80× speedup | task-switch prefill burst 与同 batch 阻塞显著缓解 |
| Throughput | 1.16× | 重排与 overlap 提高单位 GPU token 产出 |
| SLO attainment | 98.10% vs. 83.46% | 给定 TTFT/TBT 阈值下，经验达成率明显提高 |
| Model FLOPs Utilization | Llama/Qwen 最高 1.15×/1.16× | mixed prefill-decode 更充分使用计算资源 |
| Memory optimization | 平均 1.06× throughput | graph-aware preemption 在 memory pressure 下有效 |
| Runtime overhead | 低于 inference time 的 0.7% | 图维护与优先级计算开销较小 |

TTFT 是 Time to First Token，TBT 是 Time Between Tokens，MFU 是 Model FLOPs Utilization。论文对 search 使用 `TTFT < 1.0 s, TBT < 40 ms`，对 summary/code 使用 `TTFT < 1.5 s, TBT < 60 ms`。

匿名生产环境还报告了相对 `vLLM-opt` 的 1.14× 平均吞吐提升。模型、硬件、请求长度和运行周期均未披露，这项结果适合说明部署可行性。

### 5.3 P95 为什么比平均值改善更多

设常规 decode token 间隔为 $d$，task 边界或同 batch 长 prefill 引起的间隔为 $b$，burst 占比为 $p$，平均值近似为

$$
\mathbb E[T] = (1-p)d + pb.
$$

Grape 对常规 decode 路径的 $d$ 影响较小，主要把稀疏但很高的 $b$ 压低。平均值中的变化会被 $p$ 加权；当这些 burst 覆盖尾部 5% 以上样本时，P95 会直接离开高延迟区间，因此分位数收益可以明显大于均值。

论文的 P95 对象是包含中间输出的 agentic inter-token latency。3.80× 最直接支持 token-gap tail 改善；final-answer latency 和 workflow makespan 的 P95 仍待测量。

## 6. Grape 与已有系统的关系

| 系统 | 暴露给 runtime 的结构 | 主要优化粒度 | Grape 的延展 |
| --- | --- | --- | --- |
| [Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/) | Semantic Variable、application DAG、shared prompt | LLM task | 将变量边界继续 lowering 为 static prefill、dynamic prefill 与 decode |
| [Sarathi](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/) | 单请求的 prefill chunks | 请求内 chunk | 让上游 decode chunk 直接驱动相依 task 的增量 prefill |
| Autellix | program progress、调用优先级 | LLM invocation | 在调用内部增加可提前执行的微任务 |
| [ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/) | program phase、tool wait、KV footprint | program lifecycle | Grape 可作为就绪 LLM 阶段的细粒度计算层 |

Grape 的独立信号来自两项组合：应用层依赖能够下降为 engine IR；chunked prefill 能够跨越相依 task 的边界。

## 7. 适用条件与证据边界

收益更容易出现在以下条件下：多级 LLM 依赖、较长上游 decode、较多已知的下游静态 prompt，以及仍能容纳 mixed prefill-decode 的 GPU 余量。

当前证据边界包括：

1. TaskFlow 覆盖预声明的静态控制拓扑；condition、loop、retry、dynamic fan-out、nested agent 和 cancellation 缺少语义与实验。
2. 论文把工具视为轻量步骤，评测集中于 LLM-only workflow；browser、sandbox、search API 和长时 code execution 会改变关键路径与 KV 生命周期。
3. 两个 dense 模型和 1–2 张 A100 尚未覆盖大型 MoE、多节点、H100/H200 与 prefill-decode disaggregation。
4. 论文未披露请求数量、arrival process、长度分布、sampling 参数、重复次数、误差条、置信区间和 SLO attainment 的精确聚合单位。
5. 完整正交消融缺失；incremental prefill 与 scheduler 的独立收益仍未隔离。
6. 论文未报告输出质量、logits 一致性、final-answer latency 或 workflow completion time。
7. 当前匿名稿缺少公开代码、完整作者列表和 camera-ready 版本；公开来源可确认 Siqi Wang、Hailong Yang 与 SC 2026 接收状态。

## 8. 分享顺序

一场 10–12 分钟的分享可以沿下面的顺序推进：

1. **问题，2 分钟**：画出 `上游 decode → 下游完整 prefill`，解释 decode 余量和 task-switch latency burst。
2. **核心 idea，2 分钟**：展开 $P_B=S_B\Vert U_B\Vert Y_A$，说明静态 prefill 与流式 incremental prefill。
3. **系统落地，3 分钟**：用 Figure 7 讲 TaskFlow、static/dynamic node、strong/partial edge。
4. **调度与显存，2 分钟**：说明 critical priority、$T=F(N_{\mathrm{seq}},N_{\mathrm{batch}})$、两阶段 selection 和 KV preemption。
5. **证据，2 分钟**：只保留相对 `vLLM-opt` 的 1.15× average、3.80× P95、1.16× throughput 与 98.10% SLO attainment。
6. **边界，1 分钟**：强调静态 DAG、LLM-only、小规模硬件、缺少完整消融和 final-answer latency。

最后可以收束为三句话：

- Agent workflow 的依赖可以细化到“哪些 prompt token 已经确定”。
- Grape 用跨 task incremental prefill 把等待时间转化为可重叠计算，再由 SLO-aware scheduler 和 graph-aware KV preemption 控制干扰。
- 现有证据最有力地支持 task-switch token-gap tail 改善；动态 agent runtime 与端到端完成时间仍是后续验证重点。

## 9. 常见问题

### 下游 task 会提前生成答案吗？

下游只提前构建 prompt KV。它的 decode 仍等待所有依赖 token 到齐，因此 Grape 没有引入 speculative downstream output。

### Grape 节省了多少 prefill 计算？

总 prefill 工作量大体保留。主要收益来自提前执行、跨 task overlap、prefill/decode 资源互补和 task-switch burst 平滑。

### 已经有 chunked prefill，为什么还需要 Grape？

Chunked prefill 提供执行原语；Grape 的 TaskFlow 与 partial edge 提供跨 task 数据依赖，使 engine 知道哪个下游 chunk 已经就绪，以及应该把它放入哪一轮 batch。

### 为什么需要专用 scheduler？

无约束的提前 prefill 会占用 forward budget 和 KV Cache，进而拖慢当前 decode。Grape 用单轮 SLO 可行域、关键路径优先级和微任务级抢占控制这些代价。

### 动态 ReAct agent 能直接使用吗？

论文没有给出完整支持。上层 runtime 可以把已经展开且依赖明确的 LLM 阶段交给 Grape 式 engine；branch、loop、retry、tool event 和 cancellation 仍需要动态图状态协议。
