# Efficient Serving for Agentic LLM Workflows via Micro-Task-Level Parallelism 论文笔记

First-Archived-At: 2026-07-13 10:26
Updated-At: 2026-07-15 14:07

## Source

- Workflow version: v2
- Material type: research-paper
- Canonical source: https://thomas-yang.github.io/
- Title: Efficient Serving for Agentic LLM Workflows via Micro-Task-Level Parallelism
- Authors: 当前匿名稿未披露完整作者列表；公开可确认关联作者为 [Siqi Wang](/authors/siqi-wang/) 和 [Hailong Yang](/authors/hailong-yang/)
- Responsible organization: Beihang University research group；论文 PDF 本身未披露机构
- PDF: 本地提供的 12 页匿名稿 `/home/chlience/main.pdf`
- Code/Project: 未发现公开代码仓库或项目页
- OpenReview / Review page: 未发现可公开访问的正式审稿页
- Submitted: 未披露；PDF metadata 显示文件创建于 2026-04-09
- Published / updated: 2026-07，Hailong Yang 主页公布 Grape 被 SC 2026 接收
- Current version read: 12 页匿名 PDF，未标注版本号，PDF metadata 的 creation date 为 2026-04-09
- Version / revision read: supplied anonymous manuscript，读取于 2026-07-13
- Accessed: 2026-07-15
- Subjects: agentic LLM serving；micro-task scheduling；incremental prefill；SLO-aware scheduling；KV Cache management

`Canonical source` 是当前可公开核验标题、Grape 简称和 SC 2026 接收状态的作者主页。论文全文来自用户提供的匿名 PDF；公开 proceedings 尚未出现，因此完整作者名单、最终 camera-ready 版本和 artifact 状态仍待后续核验。

## 作者与关系

- [Siqi Wang](/authors/siqi-wang/): Beihang University.
- [Hailong Yang](/authors/hailong-yang/): Beihang University；历史机构：University of Michigan.

公开关系证据来自 Hailong Yang 的主页：2026 年 7 月新闻把 Grape 的 SC 接收与 Siqi Wang 关联，Selected Publications 同时列出论文全名；该主页也确认 Hailong Yang 为北航计算机学院教授。由此可以建立北航系统研究线，但无法恢复匿名稿的作者顺序、共同一作、通讯作者和完整机构列表。

## 一句话结论

Grape 把相依 LLM task 的静态 prompt、流式上游输出和 decode 拆成可调度的微任务，利用跨 task 增量 prefill 重叠原本串行的 prefill / decode，再用服务级目标约束的 batch 构造和关键路径感知 KV Cache 抢占控制尾延迟。

本地评价：最有价值的新增机制是跨 task 增量 prefill。它把 Parrot 式应用数据流继续下降到一次 LLM 调用内部的 prefill / decode 边界，并把 Sarathi 式 chunked prefill 扩展到依赖调用之间。相对实现匹配的 `vLLM-opt`，完整 Grape 的平均延迟和吞吐收益分别为 1.15 倍和 1.16 倍，P95 延迟收益达到 3.80 倍；论文只单独消融了 memory optimization，因此这组数字支持完整系统，无法继续拆分 incremental prefill、scheduler 与 memory manager 的独立贡献。

## 阅读目标与判断边界

本笔记关注：

1. 下游 task 如何在上游 decode 尚未结束时安全启动 prefill，以及这种改写省掉了什么等待。
2. TaskFlow、微任务图、SLO 约束调度和 KV Cache 抢占如何组成一条完整执行路径。
3. 论文的尾延迟、吞吐和 SLO 证据相对最强 baseline 能支持多大的结论。

判断边界：

- 论文 PDF 匿名且没有公开 artifact；作者、机构、venue 和实现状态分别按本地 PDF 与公开作者主页记录。
- SC 2026 接收状态由作者主页直接支持，尚未由会议 proceedings 页面复核。
- 论文把工具视为轻量步骤，实证范围集中于 LLM-only workflow；涉及浏览器、sandbox、搜索、长时 API 和异步工具的 agent serving 需要另行评估。
- 论文使用“数学等价”描述分块 prefill。这里将理想因果计算等价与有限精度、batch 形态和采样轨迹一致性分开讨论。

证据写法：

- 论文事实：正文、图表和本地 PDF 直接给出的机制、配置与数字。
- 作者主张：摘要、引言、结论和结果解释中的归因。
- 本地分析：对机制成立条件、baseline 强度、外部有效性和跨论文位置的判断。
- 关键判断附章节、图号和 PDF 页码；页码按 PDF 文件页序计数。

## 论文脉络

### 1. 研究问题、背景和价值

一个 agentic workflow 往往由多次相依 LLM 调用组成。上游 agent 先 decode 中间结果，下游 agent 再把该结果插入自己的 prompt，完成一次完整 prefill 后开始 decode。通用 serving engine 通常把每次调用视为原子请求，因此依赖调用按 task 串行推进。

这条路径产生两类浪费。第一，autoregressive decode 通常受内存带宽限制，单步计算量小，GPU 计算单元利用率有限；下游 task 仍在等待，空闲计算资源无法吸收其 prefill。第二，每次 task 切换都触发较长 prefill，当前请求和同 batch 请求的 token 间隔都会出现尖峰。论文把中间输出和最终输出的相邻 token 间隔统一称为 agentic inter-token latency，并将其作为服务级目标的一部分。证据定位：Section I、Section II-B，Figure 2-3，PDF pp.1-3。

这一问题的工程价值主要体现在尾延迟和单位 GPU 吞吐。若中间 token 对用户或 orchestrator 可见，稳定 token 间隔还会影响取消、流式监控和预算控制。许多生产 agent 会隐藏中间推理，最终 workflow completion latency 仍是更直接的用户指标；论文没有报告这一指标。

### 2. 已有解决方案与不足

- vLLM、Orca 等 serving engine 在独立调用内部做 continuous batching 和 KV Cache 管理，缺少 workflow 依赖信息。
- Parrot 用 Semantic Variable 暴露 application DAG、prompt 结构和 prefix reuse，但调度单元仍以完整 LLM task 为主。
- Sarathi / Sarathi-Serve 将单个请求的 prefill 分块，与 decode 组成更平滑的 batch；其原始问题模型没有覆盖“上游生成的 token 同时成为下游 prompt”这一跨 task 数据流。
- Autellix 等 program-aware 系统关注调用级优先级和 head-of-line blocking，仍需要一个更细的执行单元来利用 task 内部空闲资源。

Grape 的切入点由这些系统自然顺承：应用层已经知道依赖图，LLM engine 已经具备 chunked prefill 和 continuous batching，因此可以把 prompt 的静态段、动态 `IntermediateVar` 段和 decode 分别暴露给同一个调度器。

### 3. 作者可能的思考路径

以下是基于论文提出前系统背景的本地重建：

1. 先观察 task 边界的 latency trace，确认尖峰对应完整 prefill，而大多数 decode iteration 的 GPU 计算利用率较低。
2. 展开下游 prompt，发现 system text、user input 和一部分模板在上游完成前已经确定，只有 `IntermediateVar` 依赖上游输出。
3. 利用 causal Transformer 的前缀状态可增量延伸这一性质，先算静态段，再随上游 decode token 分块追加动态 prefill。
4. 细粒度执行会扩大调度空间和 KV 占用，于是增加关键路径优先级、每轮 batch 执行时间约束，以及微任务粒度的 KV 抢占。

这条思路把“任务尚未完成”细化为“下游哪些 token 仍未知”，从数据依赖直接推出可提前执行的计算。

### 4. 核心假设或切入点

设下游 task 的 prompt 为

$$
P_B = S_B \Vert U_B \Vert Y_A,
$$

其中 $S_B$ 是固定 system / template token，$U_B$ 是已知输入，$Y_A$ 是上游 task A 逐 token 生成的中间结果。粗粒度执行等待完整 $Y_A$，随后一次性 prefill $P_B$。Grape 先 prefill $S_B \Vert U_B$，再将 $Y_A$ 按 chunk $C_1,\ldots,C_m$ 追加到同一 causal KV state。

若每层状态包含已有 key/value、位置编号和 causal mask，增量执行可以写成

$$
H(P \Vert C_1 \Vert \cdots \Vert C_m)
= H(\cdots H(H(P), C_1), \ldots, C_m).
$$

这里的等号依赖相同 token 序列、位置编码、mask、模型参数和理想算术。它说明每个新 token 只读取此前 prefix，因而 chunk 边界不会改变语义依赖。实际 GPU kernel 可能因 batch composition、reduction order 和精度改变末位数值；若 logits 经过采样，微小差异仍可能放大成不同输出轨迹。证据定位：Section II-C，Figure 4，PDF p.3；数值边界为本地分析。

### 5. 方法 / 系统框架

#### 5.1 TaskFlow 与自动 lowering

前端提供两组声明式原语：

- `add_variable` 把状态分为 `InputVar`、`IntermediateVar` 和 `OutputVar`。
- `add_task(prompt, task_output)` 用 prompt template 和输出变量建立 task，并从变量引用隐式恢复 task 间数据依赖。

lowering 阶段把每个 task 分成 prefill 与 decode，再以 `IntermediateVar` 边界切分 prefill。固定 system prompt 和 `InputVar` 进入 static node；依赖上游输出的 prompt 段和 decode 进入 dynamic node。task 内严格顺序用 strong edge 表示，跨 task 的 token streaming 用带权 partial edge 表示；edge weight 就是每次传输和 prefill 的 token chunk 大小，由离线 operator profiling 选择。证据定位：Section III-B/C，Figure 6-7，PDF pp.4-5。

![Figure 5: Grape 的分层设计](/images/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/fig-5-design-overview.png)

Figure 5: Grape 由 TaskFlow、微任务转换、微任务感知调度器和关键路径感知 KV Cache 管理器组成。Image Source: PDF crop from supplied anonymous manuscript, p.4, Figure 5.

![Figure 7: TaskFlow 到微任务图的转换](/images/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/fig-7-taskflow-transformation.png)

Figure 7: summarization workflow 从 task template 自动拆成 static / dynamic node、strong / partial edge，并把上游 decode chunk 流式送入下游 prefill。Image Source: PDF crop from supplied anonymous manuscript, p.4, Figure 7.

#### 5.2 关键路径优先级

论文先把所有直接产出 token 的微任务定义为 agentic-latency critical path，并按拓扑顺序赋予较高优先级。其余微任务继承最近下游关键节点的优先级，距离用最少 hop 衡量。这样会提前执行即将解除关键节点依赖的 static / dynamic prefill。证据定位：Section III-D，Figure 8，PDF pp.5-6。

这里的“critical path”是输出敏感的拓扑路径，和经典调度中的加权最长路径有差异。论文没有把预计服务时间、chunk FLOPs 或概率性 decode 长度纳入路径权重，也没有给出该优先级对最优 tail latency 的形式化保证。

#### 5.3 微 batch 约束与两阶段选择

Grape 用离线 profiling 拟合单次 forward 的执行时间：

$$
T = F(N_{\text{seq}}, N_{\text{batch}}),
$$

其中 $N_{\text{seq}}$ 表示 batch 中需要读取的总 sequence / KV 长度，$N_{\text{batch}}$ 表示本轮处理的 token 数。调度器取各 request 当前最高优先级微任务中最紧的 SLO，得到 $\mathrm{SLO}_{\min}$，再从 $T \leq \mathrm{SLO}_{\min}$ 导出可行的 $(N_{\text{seq}},N_{\text{batch}})$ 区域。

每轮选择分两阶段：

1. **SLO-aware fairness selection**：request 按 deadline urgency 排序；调度器 round-robin 地从每个 ready queue 取一个最高优先级微任务，只要 batch 仍处于可行区域，就尽量让更多 request 获得最低进度。
2. **微任务 prevision selection**：剩余容量按“与 queue head 的优先级距离”排序，优先推进最接近关键路径的后续微任务，提高 GPU 利用率。

该约束控制的是单次 forward 耗时。端到端 SLO 还包含排队、未来轮次、依赖解除、抢占和 request arrival；因此 $T \leq \mathrm{SLO}_{\min}$ 本身不足以推出严格的 request-level SLO guarantee。论文的 98.10% SLO attainment 提供经验支持，措辞上更适合称为 SLO-aware 或 SLO-constrained scheduling。证据定位：Section III-D，Figure 8-10，PDF pp.5-6；保证边界为本地分析。

#### 5.4 微任务级 KV Cache 抢占

显式并行会让更多 task 提前生成 KV。Grape 将抢占单位从整个 request 缩小到微任务，并计算每个 active 微任务到当前 active critical node 的图距离，优先回收距离最大的 KV。目标是降低过量回收和近期重算，同时避免关键请求因关键节点 KV 被回收而停顿。证据定位：Section III-E，Figure 11，PDF pp.6-7。

这个启发式主要使用拓扑距离。KV 体积、重算 FLOPs、预计重新使用时间和迁移成本没有进入评分函数，实验中的独立平均收益为 1.06 倍，说明该模块有效但增量有限。

### 6. 结论链条

1. task 级串行执行导致 decode 空闲计算无法被下游利用，同时 task 边界完整 prefill 造成 token-gap 尖峰。
2. 下游 prompt 中静态部分可以提前 prefill；上游 decode 输出可以按 chunk 增量追加到下游 KV，理想 causal 计算保持等价。
3. TaskFlow 把 prompt 变量边界降为 static / dynamic 微任务图，调度器获得跨 task overlap 的候选集合。
4. 优先级、微 batch 约束和两阶段选择在公平进度与提前 prefill 之间分配每轮容量；微任务级抢占处理新增 KV 压力。
5. 相对实现匹配的 `vLLM-opt`，Grape 的主要实证收益集中在 P95 token latency，同时保持约 15%-16% 的平均延迟与吞吐增益。

## 关键实验/定理

### 结果 1：相对实现匹配 baseline 的尾延迟收益最大

- 设置：Llama3-8B 运行在 1 张 A100 40GB；Qwen3-14B 运行在 2 张 PCIe 互联 A100 40GB；工作负载为 code、summary 和 search。
- Baseline：Parrot、vLLM，以及把 Parrot 优化移植到同一 vLLM 基座的 `vLLM-opt`。
- 指标：average latency、P95 latency，单位为 ms/token；不同 workload 使用不同 request arrival rate。
- 结果：相对 Parrot / vLLM / `vLLM-opt`，平均延迟加速分别为 2.30 / 1.29 / 1.15 倍，P95 延迟加速分别为 8.49 / 5.51 / 3.80 倍。
- 证据定位：Section IV-B，Figure 12-13，PDF p.8。
- 对照是否可比：`vLLM-opt` 的模型、底层 engine 和优化更接近，属于最关键对照；Parrot 只支持 Llama3，且论文明确指出其 operator、CUDA Graph 和 memory defragmentation 存在实现劣势。
- 支持的最窄结论：在论文给定的两种模型、A100 配置、三类 LLM-only workflow 和 arrival-rate 区间内，微任务执行显著缓解 token-gap 尾部尖峰，并带来中等幅度平均延迟改善。
- 解读：3.80 倍 P95 与 1.15 倍平均值的差异符合“消除 task-switch prefill burst”的机制预期；缺少多次重复、误差条和分位数置信区间，使尾部数字仍需独立复验。

![Figure 12: 平均 token 延迟](/images/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/fig-12-average-latency.png)

Figure 12: 两种模型、三类 workflow 下 Parrot、vLLM、`vLLM-opt` 与 Grape 的平均 token 延迟。Image Source: PDF crop from supplied anonymous manuscript, p.8, Figure 12.

![Figure 13: P95 token 延迟](/images/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/fig-13-p95-latency.png)

Figure 13: 两种模型、三类 workflow 下的 P95 token 延迟；Grape 的主要优势集中在尾部。Image Source: PDF crop from supplied anonymous manuscript, p.8, Figure 13.

### 结果 2：吞吐、SLO 与资源利用率形成一致但规模不同的证据

- 设置：同上；SLO 对 search 设置为 TTFT < 1.0 s 且 TBT < 40 ms，对 summary / code 设置为 TTFT < 1.5 s 且 TBT < 60 ms。TTFT 是 Time to First Token，TBT 是 Time Between Tokens。
- Baseline：吞吐与 Parrot、vLLM、`vLLM-opt` 对比；SLO attainment 只比较 Grape 与 `vLLM-opt`；memory ablation 比较 Grape 与关闭 memory optimization 的版本。
- 指标：tokens/s、Model FLOPs Utilization (MFU)、SLO attainment rate、memory-pressure throughput 和 runtime overhead。
- 结果：吞吐相对 Parrot / vLLM / `vLLM-opt` 分别提高 2.86 / 1.33 / 1.16 倍；MFU 相对 `vLLM-opt` 在 Llama3 / Qwen3 上最高提高 1.15 / 1.16 倍；memory optimization 平均提高吞吐 1.06 倍；Grape 与 `vLLM-opt` 的平均 SLO attainment 为 98.10% 与 83.46%；图维护和优先级开销低于总推理时间的 0.7%，一次性 profiling 约 5 分钟。
- 证据定位：Section IV-B-E/H，Figure 14-17、19，PDF pp.8-10。
- 对照是否可比：`vLLM-opt` 仍是最可信对照。MFU、memory ablation 和 scheduler overhead 的报告较直接，但未给出 profiling model 的预测误差。
- 支持的最窄结论：论文配置下，完整 Grape 在降低 agentic inter-token latency tail 的同时保持约 16% 吞吐增益，并让给定 TTFT / TBT SLO 的经验达成率接近 98%；现有消融无法把这些收益单独归因给 incremental prefill。
- 解读：SLO 数据支持策略有效性，仍属于经验达成率；每轮 forward 约束没有构成严格端到端保证。

### 结果 3：匿名生产部署提供方向性外部证据

- 设置：Company A 使用 Model B 服务 document processing 和 data analysis workflow，arrival rate 为 0.6-1.4 request/s。
- Baseline：`vLLM-opt`。
- 指标：throughput。
- 结果：Grape 平均吞吐提高 1.14 倍。
- 证据定位：Section IV-F，Figure 18，PDF p.9。
- 对照是否可比：底层 baseline 名称一致，模型、硬件、请求长度、工具组成和运行周期均未披露。
- 支持的最窄结论：Grape 已在一个未披露细节的生产环境中得到约 14% 吞吐收益，说明机制具备初步部署可行性。
- 解读：这项结果的复验性较低，适合作为外部有效性的方向信号，无法支持跨公司、跨模型的普遍收益判断。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 评测协议 | code 使用 MetaGPT 风格五阶段 workflow 与 LiveCodeBench 输入；summary 对 arXiv 文档分块顺序摘要；search 使用 query rewriter、searcher、answer generator、safety checker 与 HotpotQA 输入。arrival rate 从图中按 workload 扫描，论文未披露 arrival process、请求总数、warmup 和 run duration。 |
| 统计报告 | 报告平均值、P95 和跨配置平均 speedup；没有 repetitions、seed、error bar、confidence interval 或显著性检验。 |
| Baseline 是否 tuned | Parrot、vLLM 的具体调参范围未披露；`vLLM-opt` 明确吸收 Parrot 优化，降低了基础实现差异。 |
| Baseline 是否 compute-matched | 同模型实验看起来使用同一 A100 配置；Parrot 仅在 Llama3 上评估，Qwen3 不具备完整三方可比性。 |
| Baseline 是否 implementation-matched | `vLLM-opt` 与 Grape 最接近；Parrot 使用自建 engine，论文承认其 operator 实现、CUDA Graph 缺失和 memory defragmentation 开销较弱。 |
| Baseline 是否覆盖强替代方案 | 覆盖 vLLM、Parrot 和实现匹配版本；未覆盖 Autellix、SGLang program runtime、现代 PD disaggregation 或其他 workflow scheduler。 |
| Baseline 是否存在弱化风险 | 相对 Parrot 的 2.30-8.49 倍受底层 engine 差异明显影响；判断核心应放在相对 `vLLM-opt` 的 1.15 / 1.16 / 3.80 倍。 |
| 结论边界 | 两个 8B/14B dense 模型、1-2 张 A100、LLM-only 静态 workflow；没有大型 MoE、多节点、H100/H200、长时工具或动态控制流。 |
| 模型与初始化 | Llama3-8B；Qwen3-14B；没有训练或权重修改。 |
| 数据与任务 | LiveCodeBench code 输入、arXiv long-document summary、HotpotQA search；未披露样本规模、prompt / output length distribution 和具体 sampling 参数。 |
| 系统配置 | Ubuntu 22.04、CUDA 12.9、cuDNN 9.10.2；Llama3 使用 1×A100 40GB，Qwen3 使用 2×A100 40GB，GPU 间为 PCIe。 |
| 框架基座 / paper base | Grape 基于 vLLM，负责 workflow frontend、微任务 graph lowering、scheduler 和 KV Cache preemption；模型执行沿用 vLLM engine。 |
| 框架版本与证据来源 | vLLM commit `b8b302c`，来自 Section IV-A；依赖、patch 和复现脚本未公开。 |
| 框架改动范围 | 新增 TaskFlow primitives、微任务转换、优先级与 batch constraint、两阶段 scheduler、微任务级 KV Cache memory manager。 |
| 成本 | 没有 GPU-hours 或成本报告；论文以 throughput、latency、MFU 和 runtime overhead 间接反映 serving cost。 |
| 未披露项 | 完整作者与机构、artifact、请求到达分布、长度分布、sampling 配置、运行次数、误差范围、质量一致性、production 模型 / 硬件 / 运行周期。 |

## 证据链强度评估

### 强证据

- 跨 task 增量 prefill 的数据依赖和执行改写写得清楚，TaskFlow 到微任务图的 lowering 有具体 node / edge 原语和示例。
- `vLLM-opt` 提供同 engine 的实现匹配 baseline，使 Grape 自身增量收益可以与 Parrot 的底层实现差异分开观察。
- latency、throughput、MFU、SLO、memory ablation、overhead 和 execution timeline 在同一机制链上相互支持。
- Hailong Yang 的官方主页同时给出论文全名和 SC 2026 接收信息，venue 状态具有直接公开来源。

### 中等强度证据

- 三类 workload 覆盖 code、summary 和 search，能够说明机制跨多个静态 workflow 生效；样本和长度分布未披露，代表性仍有限。
- 1.15-1.16 倍的平均性能收益规模合理，3.80 倍 P95 也符合减少 prefill burst 的方向；尾部统计缺少误差范围。
- 匿名生产结果显示 1.14 倍吞吐收益，说明系统具备部署路径；环境细节不足以支持可复验比较。

### 需要谨慎的推论

- “遵守微 batch 约束即可保证 SLO”需要加入 queueing 和未来依赖的条件；当前证据支持经验性 SLO 改善。
- “分块 prefill 数学等价”在理想因果计算上成立；有限精度 kernel、动态 batch 和 stochastic sampling 的输出一致性没有验证。
- “工具通常轻量”对 file operation 可能成立，browser、sandbox、search、database、remote API 和长时 code execution 会改变关键路径与 KV 生命周期。
- 中间 token 对用户可见是 agentic latency 的产品假设；隐藏中间推理的系统更关心 final answer latency、workflow makespan 和 cost。

## OpenReview / 审稿意见吸收

- Page type: not-found
- Match confidence: high
- Observed at: 2026-07-15
- Venue status: Hailong Yang 官方主页列为 SC 2026 accepted；会议 proceedings 页面尚未公开核验
- Public reviews: 未发现公开 reviewer comments、meta review 或 rebuttal
- Ratings / confidence: 未公开
- Reviewer consensus: 无公开材料可吸收
- Main criticisms: 无公开 reviewer 意见；本地审计关注统计报告、baseline 覆盖、严格 SLO 保证、工具时延、动态 workflow、数值一致性和 artifact 缺失
- Author response: 未公开
- 对可信度的影响: SC 2026 接收信息提升系统贡献与完整性的外部可信度；缺少公开 reviews 和 artifact，使 P95、SLO guarantee、生产泛化和实现细节仍需按论文自身证据审慎判断

## 本地讨论补充

### 1. 讨论收敛点

- 论文中的 “agentic workflow” 采用预声明的 LLM task dataflow graph：`add_variable` 与 `add_task` 建立 `InputVar` / `IntermediateVar` / `OutputVar` 依赖，再 lowering 成带 strong / partial edge 的微任务 DAG。三类实证都是固定 pipeline：product planner → framework designer → project planner → code generator → test validator 的 MetaGPT 风格 code workflow、顺序 refine 摘要，以及 query rewriter → searcher → answer generator → safety checker。`dynamic node` 的 dynamic 指 token 内容在运行时才出现，控制拓扑仍预先声明；partial edge 表示上游 token chunk 流式进入下游 prefill，条件分支语义未披露。ReAct 的 reasoning → action → observation 循环、运行时停止条件、条件分支、retry 和动态 fan-out 未进入 TaskFlow 语义或实验；若上层 runtime 将一段 ReAct 执行展开为已知 task graph，Grape 的增量 prefill 机制可能用于其中的就绪 LLM 阶段，动态编排仍由上层负责。
- Grape 的核心贡献可以压缩为“跨 task incremental prefill + workflow-aware scheduling”，TaskFlow 和 memory manager 分别承担可编程入口与资源压力控制。
- 评估时以 `vLLM-opt` 为主 baseline。相对 Parrot 的大幅收益混入 engine implementation gap，适合说明完整系统效果，较难单独归因于微任务设计。
- 平均延迟、吞吐和 P95 的收益结构显示它主要平滑 task-switch prefill burst，整体算力效率提升处于约 15% 量级。

P95 改善显著大于平均延迟，可以用稀疏 burst 分布理解。设常规 decode token 的间隔为 $d$，task boundary 或受同 batch 长 prefill 阻塞的 token 间隔为 $b$，后者占比为 $p$ 且 $b\gg d$，则平均值约为：

$$
\mathbb E[T]=(1-p)d+pb.
$$

Grape 对常规 decode 路径的 $d$ 改动有限，主要通过静态 prompt 提前 prefill、上游 token 流式追加、单轮 batch SLO 约束和关键路径调度，把 $b$ 压到更小的 $b'$。平均值中的改善会被较小的 $p$ 加权；当 boundary stalls 及其 head-of-line blocking 影响覆盖尾部 5% 以上样本时，P95 会直接从 burst 区间下降，因此分位数收益可以明显大于均值。长 prefill 还会拖慢同 batch 的 decode requests，使有效尾部样本比例高于 task boundary 自身的出现比例。

论文这里的 P95 是 token-level agentic inter-token latency：它把中间 task 输出与最终输出放进同一 token 时间序列，跨 task 的输出空档会计入分位数。论文没有报告 final-answer latency 或 workflow makespan 的 P95，因此 3.80 倍结果最直接支持“task-switch token gap 被显著压缩”，对用户端任务完成尾延迟的收益仍需单独测量。

进一步按机制梳理，可以得到以下层次。除 memory optimization 外，现有结果把 lowering、incremental prefill 与 scheduler 作为完整栈评测，因此完整系统数字在前两行只构成共同证据：

| 收益来源 | 直接作用 | 论文证据 | 本地判断 |
| --- | --- | --- | --- |
| 跨 task incremental prefill | 将下游静态 prompt 和逐步到达的上游输出提前转成 KV，与上游 bandwidth-bound decode 重叠；下游 decode 启动前需要补做的 prefill 更少 | 完整 Grape 相对 `vLLM-opt` 的平均延迟 / 吞吐为 1.15 / 1.16 倍，MFU 最高提高 1.15 / 1.16 倍；execution timeline 显示 task-boundary bubble 被填充 | 机制上提供主要并行机会；总 prefill token workload 大体保留，收益方向与时间重排、资源互补和等待隐藏一致，独立贡献尚无消融 |
| SLO-aware / critical-path scheduler | 控制每轮 mixed prefill-decode batch 的预计执行时间，优先推进直接产出 token 或即将解除关键依赖的微任务 | 完整 Grape 的 P95 相对 `vLLM-opt` 提高 3.80 倍，SLO attainment 从 83.46% 提高到 98.10% | 机制上用于把 overlap 转成较低 tail 并约束对 foreground decode 的干扰；当前结果支持完整调度栈，尚未隔离该 scheduler 的独立贡献 |
| graph-aware KV preemption | 在提前执行增加 KV 占用后，优先回收远离 active critical node 的微任务 KV，减少关键路径停顿和近期重算 | memory optimization 独立平均提高吞吐 1.06 倍 | 独立证据只覆盖平均吞吐；它对 P95 的独立贡献没有报告，适合作为容量保护机制解读 |
| vLLM engine 与既有 Parrot 优化 | 提供 optimized operators、CUDA Graph 和更好的 memory management | Grape 相对 Parrot 的平均 / P95 收益达到 2.30 / 8.49 倍，显著高于相对 `vLLM-opt` 的 1.15 / 3.80 倍 | 这部分反映完整实现栈差异，不能计入微任务并行本身的纯增量收益 |

论文没有提供“保留微任务图、分别关闭 incremental prefill / 新 scheduler”的完整正交消融，因此 1.15-1.16 倍平均收益无法继续精确拆分。KV memory optimization 的 1.06 倍也不能直接从总 speedup 中相减，因为它与 arrival rate、cache pressure 和调度选择存在交互。

收益较大的工作负载通常具有多级 LLM 依赖、较长上游 decode、较多已知下游静态 prompt，以及能够容纳 mixed prefill-decode 的 GPU 余量。工具执行占据主要 wall time、下游 prompt 几乎全部依赖最后才得到的外部结果、动态图频繁改变，或 GPU 已被高效独立请求持续饱和时，可隐藏的 prefill 窗口会缩小，Grape 的端到端收益也会收缩。

### 2. 修正后的理解

- 下游 task 无需等待完整上游文本：静态 prompt 可以立即形成 KV，上游每产生一段文本，下游就继续追加 KV。下游 decode 仍需等待其完整 prompt；收益来自把这段等待期间的 prefill 工作提前完成。
- 微任务图暴露的是数据已知程度。static node 对应已知 token，dynamic node 对应运行时才出现的 token 或 decode，partial edge 把已知程度随 token streaming 向下游传播。
- 论文的 critical path 由“本轮是否直接产出 token”定义，服务时间预测只进入 batch 约束。更完整的 scheduler 可以把 graph distance、remaining service time、KV bytes 和 deadline slack 合并。
- 工具等待加入后，图中会出现不占 GPU、完成时间不确定的外部节点。此时 incremental prefill 仍可用于工具前后的 LLM 段，program placement、pause / restore 和 sandbox lifecycle 需要由另一层 runtime 处理。

### 3. 后续复验指标

- final-answer latency、workflow makespan、P50 / P95 / P99 token gap 和 SLO goodput curve。
- prompt / output length distribution、arrival process、run duration、重复次数和置信区间。
- monolithic prefill 与 chunked cross-task prefill 的 logits、token 和最终输出一致性。
- $F(N_{\text{seq}},N_{\text{batch}})$ 在不同 prefill / decode mix、tensor parallel、cache pressure 下的预测误差。
- static / dynamic fanout、condition、loop、retry、cancellation、nested agent 和异构模型的 TaskFlow expressivity。
- browser、sandbox、search 和 remote API 等非轻量工具下的 end-to-end goodput 与 KV residency。
- critical-path distance 与 cost-aware eviction、LRU / FCFS、recompute-aware eviction 的直接对照。

## 主要启发

- agent serving 的优化边界可以从 request、task 继续下降到“prompt 中哪些 token 已经确定”，这为跨调用 overlap 提供了更精确的依赖单元。
- workflow frontend 和 LLM engine 之间需要一个可 lowering 的中间表示；变量边界、static / dynamic node 和 streaming edge 足以驱动一批执行优化。
- tail latency 优化应直接观察 task-switch prefill burst，平均 TPOT 容易掩盖少数高延迟 token；TBT 分布和分位数更适合该问题。
- SLO 调度需要区分单轮 kernel budget 与 request-level deadline。离线性能模型可以构造可行 batch，queueing 和未来 work estimate 决定端到端保证。
- 细粒度并行会增加 KV 占用；execution graph 能为抢占提供语义信息，后续可进一步引入 KV bytes、重算成本和预计复用时间。

## 局限

1. TaskFlow 展示的是静态 prompt template 和数据流变量，论文没有证明对 condition、loop、retry、dynamic fanout、tool blocking、error handling 与 nested agent 的表达能力。
2. 论文将工具视为轻量并聚焦 LLM-only workflow；真实 agent 的 sandbox、browser、search 和异步 API 可能主导 end-to-end latency。
3. agentic latency 将中间 task token 纳入用户可感知序列；许多产品只展示最终输出，需要额外报告 final-answer latency 和 workflow completion time。
4. 两个模型只覆盖 8B / 14B 与 1-2 张 A100 PCIe，缺少大型 MoE、H100/H200、多节点、prefill-decode disaggregation 和异构模型证据。
5. 论文没有披露请求数量、到达过程、长度分布、sampling 参数、运行周期、重复次数、误差条和置信区间，P95 大幅收益的统计稳定性待复验。
6. `vLLM-opt` 是最关键 baseline；相对它的平均延迟和吞吐收益约 15%-16%。相对 Parrot 的更大数字受到 Parrot engine 实现限制影响。
7. 单轮执行模型 $F(N_{\text{seq}},N_{\text{batch}})$ 没有报告预测误差，也没有显式建模微任务类型混合、cache residency、kernel path、tensor parallel 和 memory pressure。
8. 关键路径优先级与 preemption 主要依赖拓扑 hop，缺少 weighted service time、KV volume、recompute FLOPs 和 time-to-reuse。
9. 增量 prefill 的输出质量、logits 一致性和 stochastic sampling 轨迹没有验证；动态 batch 可能引入数值差异。
10. 当前匿名稿没有公开代码、完整作者信息和正式 proceedings 页面；生产实验也隐藏模型、硬件和 workload 细节。

## 跨论文关系

- 与已有论文的作者或机构关系：公开证据把 [Siqi Wang](/authors/siqi-wang/) 和 [Hailong Yang](/authors/hailong-yang/) 连接到 Beihang University systems 研究线；当前档案中尚未发现与其他已存档论文的作者重叠。
- 与 [Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/)：Parrot 用 Semantic Variable 暴露 application DAG、prompt structure 和 prefix reuse；Grape 沿用这一类上层数据流视角，并继续 lowering 到 task 内 static prefill、dynamic prefill 和 decode 微任务。
- 与 [Sarathi](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/)：Sarathi 在单个请求内切分 prefill，与 decode 组成更平滑的 batch；Grape 把 chunked prefill 放到相依 task 之间，让上游 decode chunk 直接驱动下游增量 prefill。二者共同构成“chunk primitive + workflow dependency”的组合。
- 与 [Span Query](/papers/2511.02749-span-queries-cache-attention-locality/)：两篇论文都把 prompt 内部结构暴露给 runtime。Span Query 聚焦 span algebra、cache locality 和 attention locality，Grape 聚焦变量边界、跨 task streaming 和 SLO-aware scheduling。
- 与 [ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/)：ThunderAgent 管理 program lifecycle、tool wait、KV pause / restore 和多节点 placement；Grape 优化 LLM-only workflow 内部的 prefill / decode overlap。包含 sandbox 和异步工具的完整 runtime 可以由 program-level scheduler 管外部阶段，由 Grape 式 engine 管就绪 LLM 阶段。
- 与 [TML inference determinism](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：Grape 改变 chunk 和 batch composition，理想 causal prefill 语义保持等价，有限精度 reduction 与 sampling 输出仍可能改变；评测、cache reuse 和 RL rollout 场景应记录 batch-invariant determinism。
- 与 [SPORK](/papers/2607.03333-spork-self-speculative-agentic-inference/)：Grape 在预声明数据流 DAG 上拆分并调度 LLM 微任务，SPORK 在运行中的 ReAct 回路里推测下一次工具 Action。组合后的 runtime 需要把 `fork`、`commit`、`reject`、`cancel` 作为动态图事件，同时管理共享前缀引用计数、工具副作用和 GPU / tool admission。
- 与 [Leyline](/papers/2606.01065-leyline-kv-cache-directives-agentic-inference/)：Grape 的 partial edge 按上游追加 token 推进下游 prefill，Leyline 允许 policy 改写 canonical history。一次 edit 会同步改变 sequence length、partial-edge progress、重算成本和依赖就绪状态；`AMORTIZE` 保留被移除 span 对后续 token 的历史影响，`FORGET` 通过 prefix-trimmed re-prefill 重建语义。
- 综合关系见 [Agent Workflow Serving Stack](/papers/2026-07-14-agent-workflow-serving-grape-spork-leyline/)：该技术分享把 Grape、SPORK、Leyline 分别放入 task、action、edit 三类边界，并给出统一调度状态、资源冲突与实验矩阵。

## Reference Intake Brief

### Target

- Intended target system: 新增 Grape 论文笔记、索引当前收录行、作者档案和关键图；在对应论文关系章节补充双向关系。
- Existing related assets: `content/utility/papers-index.md`；[Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/)、[Sarathi](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/)、[Span Query](/papers/2511.02749-span-queries-cache-attention-locality/)、[ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/)、[TML inference determinism](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)。
- Proposed form: 新建独立 Markdown 文档，更新当前收录、两位可确认作者 profile 和五篇关联论文。

### Reusable Elements

1. 跨 task incremental prefill：静态 prompt 先算，上游 decode token 按 chunk 追加到下游 KV。
2. TaskFlow lowering：`InputVar` / `IntermediateVar` / `OutputVar` 降为 static / dynamic node 与 strong / partial edge。
3. 微 batch 可行域：用 $T=F(N_{\text{seq}},N_{\text{batch}})$ 和当前最紧 SLO 限制单轮 batch。
4. 两阶段 scheduler：deadline-aware round-robin 保证最低进度，critical-path prevision 填充剩余容量。
5. graph-aware KV preemption：以微任务为回收单位，利用关键路径距离降低阻塞。

### Risks

- Copyright/over-copying: 正文采用机制重建和数据摘要；缓存四张高价值 PDF crop，用于解释系统 lowering 与复查平均 / P95 主结论，均标明页码和来源形态。
- Unsourced or unverifiable claims: 匿名稿缺少完整作者、机构、版本和 artifact；只把作者主页直接支持的 Siqi Wang、Hailong Yang 与 SC 2026 状态写成公开事实。
- Tone/brand mismatch: 使用系统论文审计口径，区分作者主张、论文事实和本地分析。
- Safety/compliance issues: 论文是 serving systems 研究，无直接双用途操作流程。
- Overlap with existing assets: 与 Parrot、Sarathi、Span Query 和 ThunderAgent 关系紧密；Grape 的独立价值在跨 task 微任务 overlap 与 SLO-aware engine integration。

### Skipped

| Material | Reason |
| --- | --- |
| 完整作者与机构列表 | supplied PDF 匿名，公开作者主页只能确认两位关联作者，SC proceedings 尚未公开 |
| 公开 reviewer comments | 未发现可可靠匹配的公开 review、meta review 或 rebuttal 页面 |
| 代码与复现脚本 | PDF 和当前公开来源未提供 artifact URL |
| 逐点图表数值抄录 | 主结论可由平均 speedup、关键分位数和裁剪图复查，避免把论文复制成图表转录 |

### Recommendation

Decision: merge

Why: Grape 给出了从 workflow variable 到 engine 微任务的完整 lowering，完整系统相对实现匹配 baseline 的主要收益集中在 P95 agentic inter-token latency，方向上与减少 task-boundary prefill burst 一致。作者、artifact、正交消融、严格 SLO 保证和工具型 workload 仍有明确证据缺口，适合以带边界的系统论文笔记归档并等待 proceedings / code 更新。
