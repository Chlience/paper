# Agent Workflow 推理系统：从跨任务流水、工具推测到可编辑 KV Cache

First-Archived-At: 2026-07-14 10:57
Updated-At: 2026-07-14 11:13

## Source

- Workflow version: v2
- Material type: composite
- Canonical source: /papers/2026-07-13-grape-micro-task-agentic-workflow-serving/
- Title: Agent Workflow 推理系统：从跨任务流水、工具推测到可编辑 KV Cache
- Responsible organization: Chlience Paper Archive（本地综合）
- Primary materials: [Grape](/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/)、[SPORK](/papers/2607.03333-spork-self-speculative-agentic-inference/)、[Leyline](/papers/2606.01065-leyline-kv-cache-directives-agentic-inference/)
- Grape source: Hailong Yang 主页公布题名与 SC 2026 接收状态；全文为本地 12 页匿名稿
- SPORK source: https://arxiv.org/abs/2607.03333
- Leyline source: https://arxiv.org/abs/2606.01065
- Published / updated: 2026-07-14
- Current version read: Grape supplied anonymous manuscript；SPORK arXiv v1 与官方代码 commit `31d5ab6f0740d5b5aa26e6a745dc97bcff5139a3`；Leyline arXiv v1 HTML / PDF / TeX
- Accessed: 2026-07-14
- Subjects: agent workflow；LLM serving；micro-task scheduling；tool speculation；KV Cache mutation；ReAct

## 作者与关系

- 本材料由本地归档综合，没有单一论文作者，也不为 composite 新建作者档案。
- Grape 公开可确认关联作者为 [Siqi Wang](/authors/siqi-wang/) 与 [Hailong Yang](/authors/hailong-yang/)，来自 Beihang University 系统研究团队。
- SPORK 由 [Huajun Bai](/authors/huajun-bai/)、Weiwei Lv、[Huichuan Zheng](/authors/huichuan-zheng/)、[Youyou Lu](/authors/youyou-lu/) 与 [Jiwu Shu](/authors/jiwu-shu/) 完成，连接 Tsinghua University 与 Meituan。
- Leyline 由 Bole Ma、[Jan Eitzinger](/authors/jan-eitzinger/) 与 [Harald Köstler](/authors/harald-koestler/) 完成，来自 Erlangen National High Performance Computing Center（NHR@FAU）。
- 三组作者之间未发现已核验的人员重叠。三篇工作通过主题形成清晰接口：Grape 优化预声明 task graph，SPORK 优化 ReAct turn 中的 future action，Leyline 优化跨 turn 的 canonical context mutation。

## 一句话结论

Agent Workflow 的主要 serving 浪费分布在 task、action 和 edit 三个边界：Grape 用微任务图把已知依赖的下游 prefill 提前到上游 decode 期间，SPORK 从共享 prefix KV fork 同模型 probe 预测下一次只读工具调用，Leyline 让 policy 用 span directive 编辑已提交历史并选择位置摊销或真正遗忘；三者共同指向一个带动态分支、上下文版本和资源预算的 Agent execution IR，但当前论文尚未给出联合实现或可相加的端到端收益。

## 阅读目标与判断边界

本笔记关注：

1. 为什么 continuous batching、prefix cache 和常规 speculative decoding 仍会在 Agent Workflow 中留下串行等待。
2. Grape、SPORK、Leyline 分别利用“已知结构、未来动作信号、已演化状态”提前或复用哪段计算。
3. 三种机制如何进入同一个 ReAct / pipeline runtime，以及联合系统还缺少哪些语义与资源协议。

判断边界：

- Grape 实验使用预声明的固定 LLM task DAG；ReAct 的条件循环、retry 和动态 fan-out 未进入 TaskFlow 评测。
- SPORK 直接优化 ReAct-style loop，适用工具限于可提前执行的 read-only 集合，最终接受要求 serialized name 与 arguments 完全匹配。
- Leyline `AMORTIZE` 保留被替换 span 对 downstream KV 的历史影响；删除、纠错和隐私场景需要 `FORGET` re-prefill。
- 三篇论文的模型、硬件、workload、指标和 baseline 各不相同，结果只能支持各自机制，无法用于横向性能排名。
- “统一 runtime”部分属于本地系统综合，论文没有联合实验；其中的 API、调度顺序和一致性协议是设计建议。

证据写法：

- 论文事实：三篇正文、附录、图表和公开代码直接给出的机制、配置、数字与限制。
- 作者主张：论文对适用场景、正确性和系统接口的解释。
- 本地分析：task/action/edit 三层统一、组合顺序、资源冲突和 execution IR 设计。
- 关键判断回链到三篇独立笔记及其 section / figure / table / page 定位。

## 论文脉络

### 1. 一个 Agent 请求在哪里等待

模型服务已经具备 continuous batching、paged KV Cache、prefix reuse 和 chunked prefill。把这些能力直接接到 Agent runtime 后，一条 coding 或 search 轨迹仍可能出现这样的时间线：

```text
规划 LLM decode
  → 下游 LLM 等完整中间结果
  → 下游集中 prefill
  → reasoning decode
  → 完整 tool call 生成
  → 远程工具执行
  → Observation 写回
  → 旧工具输出被截断或替换
  → edit point 之后重新 prefill
  → 下一轮
```

GPU kernel 可以很快，workflow completion 仍受三段串行成本约束：

$$
T_{\mathrm{workflow}}
=
T_{\mathrm{queue}}
+T_{\mathrm{prefill}}
+T_{\mathrm{decode}}
+T_{\mathrm{tool}}
+T_{\mathrm{repair}}
-T_{\mathrm{overlap}}.
$$

$T_{\mathrm{repair}}$ 表示 retry、compaction、message edit 或 cache invalidation 后的重新计算。通用 serving 优化主要压缩单次请求内的 $T_{\mathrm{prefill}}$ 与 $T_{\mathrm{decode}}$；Agent Workflow 还需要扩大 $T_{\mathrm{overlap}}$，并控制 $T_{\mathrm{repair}}$。

三篇论文分别定位一条边界：

| 边界 | 运行时已经知道什么 | 原串行路径 | 对应工作 |
| --- | --- | --- | --- |
| Task boundary | 预声明的数据依赖和已出现的 token chunk | 上游完整 decode → 下游完整 prefill | Grape |
| Action boundary | main prefix 与逐渐稳定的 next-tool intent | reasoning / action decode → tool execution | SPORK |
| Edit boundary | policy 确认要删除或替换的历史 span | message edit → suffix re-prefill | Leyline |

这张表给出分享的主线：**利用已知结构、预测未来动作、维护演化状态。**

### 2. 第一处等待：下游必须等完整中间结果吗

设 task A 生成中间文本 $Y_A$，task B 的 prompt 为

$$
P_B=S_B\Vert U_B\Vert Y_A,
$$

其中 $S_B$ 是 system / template，$U_B$ 是外部输入。朴素 engine 将 task B 视为原子请求，等 $Y_A$ 完整生成后再 prefill 全部 $P_B$。然而 $S_B\Vert U_B$ 从 workflow 启动时已经确定，$Y_A$ 也会逐 token 到达。

Grape 先计算静态段，再把 $Y_A$ 的 chunks 增量追加到同一 causal KV state：

```text
task A decode:     [C1][C2][C3][C4]
                        │   │   │   │
task B prefill: [static][C1][C2][C3][C4]
task B decode:                          [decode...]
```

task B 的 decode 仍等待 prompt 完整；等待期间的大部分 prefill 已经执行，task switch 不再集中产生一段长 prefill burst。

#### 2.1 TaskFlow 如何下降到 micro-task

TaskFlow 用 `add_variable` 定义 `InputVar`、`IntermediateVar`、`OutputVar`，用 `add_task(prompt, task_output)` 从变量引用恢复依赖。lowering 后：

| TaskFlow 元素 | Micro-task IR |
| --- | --- |
| 已知模板与 `InputVar` | static node |
| 运行时到达的 `IntermediateVar` | dynamic prefill node |
| autoregressive generation | dynamic decode node |
| task 内完整依赖 | strong edge |
| 上游 token chunk 流入下游 | partial edge |

这里的 dynamic 描述 token 内容和 decode 次数在运行时确定，控制拓扑仍由 workflow 预先声明。论文的 code、summary、search 三类 workload 都是固定 pipeline。ReAct 的 `reasoning → action → observation` 循环需要上层 runtime 负责。证据定位：[Grape 笔记](/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/) Section 5.1、本地讨论补充；论文 Section III-B/C、Figure 6-7、PDF pp.4-5。

#### 2.2 细粒度并行引入新的调度问题

micro-task 增多后，所有可提前执行的 prefill 都进入 batch 会扩大 KV residency，并影响 foreground decode 的 token SLO。Grape 通过三项机制收敛调度空间：

1. 用拓扑距离把接近输出关键节点的微任务赋予更高优先级。
2. 离线拟合单轮执行成本 $T=F(N_{\mathrm{seq}},N_{\mathrm{batch}})$，让候选 batch 满足当前最紧 token SLO。
3. 以微任务为单位抢占 KV，优先回收离 active critical node 更远的状态。

相对实现匹配的 `vLLM-opt`，论文报告平均 token latency 加速 1.15×、P95 token latency 加速 3.80×、吞吐提高 1.16×，SLO attainment 为 98.10% 对 83.46%。最大增量集中在 P95，符合减少 task-switch prefill 尖峰的机制。证据定位：Grape Section IV-B-H、Figures 12-19、PDF pp.8-10。

这条路径仍留下一个问题：真实 ReAct agent 的下一条 tool edge 直到模型生成过程中才出现。已知 DAG 可以被流水化，未知 action 需要另一种信号。

### 3. 第二处等待：工具必须等完整 Action 吗

典型 ReAct turn 的关键路径为：

```text
(re)prefill → reasoning decode → tool-call decode → tool execution → Observation
```

工具名经常比完整 arguments 更早稳定。SPORK 在 main 返回首个 token 后，从共享 prefix KV 创建同模型 probe，并强制补入 tool-call opener。probe 达到置信度阈值后，controller 可以提前执行只读工具，让外部等待与剩余 reasoning decode 重叠。

```text
Serial
Main    [ reasoning ........ tool-call ] [ tool execution ] [ Observation ]

SPORK
Main    [ reasoning ........................ tool-call ]
Probe      [ forced tool-call probe ]
Tool              [ speculative execution ............. ]
Hit                                              [ strict match ][ reuse result ][ Observation ]
Miss                                             [ discard speculative result ]
D3                                 [ verify prefix ][ finish actual call ]
Fallback                                                     [ execute actual tool ][ Observation ]
```

#### 3.1 D1、D2、D3 分别控制一项成本

| 设计 | 动作 | 改变的成本 | 论文信号 |
| --- | --- | --- | --- |
| D1 Prefix-cache fork | 首 token 后复用 main prefix KV 发 probe | 降低 probe prefill overhead | 15K context 下约 1.6 s→0.35 s；main TPOT +0.22% |
| D2 Confidence gate | 用 tool-name span 的 minimum token probability 决定 dispatch / retry | 提高 strict acceptance，减少 wasted tools | GAIA、$\theta=0.90$：88% precision、100% recall；turn acceptance 约 0.22→0.37 |
| D3 Partial-token accept | rejected probe 作为 draft，由 target model 验证匹配前缀 | 回收 miss branch 的 tool-call decode | BrowseComp 首次 mismatch 中位 27 tokens，约节省 0.6 s/rejected turn |

probe 的预执行结果只有在 serialized tool name 和 arguments 与 main 完全一致时才会复用。miss 时，controller 丢弃 speculative result，让 main 完成最终 call；D3 复用 target model 验证通过的 greedy token prefix，随后串行执行实际工具并正常提交 Observation。证据定位：[SPORK 笔记](/papers/2607.03333-spork-self-speculative-agentic-inference/) Sections 5.3-5.6；论文 Sections 4.1-4.3、Figure 6。

#### 3.2 推测何时值得执行

令 $\alpha$ 为按 tool-call turn 统计的 strict acceptance，$t_{\mathrm{overlap}}$ 为实际隐藏的工具时间，$T_{\mathrm{oh}}$ 为 probe 与错误执行开销。未启用 D3 时，break-even 条件为

$$
\alpha t_{\mathrm{overlap}}
\ge
(1-\alpha)T_{\mathrm{oh}}.
$$

可隐藏时间同时受工具和剩余 main decode 限制：

$$
t_{\mathrm{overlap}}
\le
\min(T_{\mathrm{tool}},T_{\mathrm{main,remain}}).
$$

多秒 thinking、较慢工具、稳定 schema、高 exact acceptance 和闲余 serving capacity 会扩大收益。no-think、快速本地工具、heavy batching 和格式分歧会让 probe 进入关键路径；论文的 no-think tau2 speedup 降至 0.79×。

Qwen3-32B / GAIA 主结果中，P95 从 131.9 s 降至 108.1 s，下降 18%（N=165）。这个数字属于 slow-tool、thinking-mode 和论文给定 engine configuration。跨模型主图混合 D1/D2/D3 组合与 serving mode，适合用作迁移线索。证据定位：SPORK Figure 10、Sections 6.2-6.6。

推测工具执行让当前 turn 更短，Observation 随后进入 canonical history。长程 Agent 会压缩或替换旧记录，新的问题从“下一步是什么”转为“过去哪些状态还能保留”。

### 4. 第三处等待：编辑历史后必须重算整个 suffix 吗

设历史为 $A\Vert B\Vert C$，policy 将旧工具输出 $B$ 替换为短 stub $R$。常规 radix cache 命中 $A$，随后重新 prefill $R\Vert C$。$C$ 的 token 内容没有变化，绝对位置和它已吸收的上文状态却已经变化，直接复用旧 KV 会破坏位置或语义。

Leyline 引入四元 directive：

$$
D=(s_{\mathrm{start}},s_{\mathrm{end}},R,m),
$$

$m$ 在 `AMORTIZE` 与 `FORGET` 中选择。

#### 4.1 `AMORTIZE`：校正位置并保留历史影响

令

$$
\Delta=|R|-(s_{\mathrm{end}}-s_{\mathrm{start}}).
$$

MLA 将位置集中在 RoPE band $K_{\mathrm{pe}}$。对后缀位置 $i$，Leyline 计算

$$
K^{\mathrm{new}}_{\mathrm{pe}}[i+\Delta]
=
\mathcal R(\Delta)K^{\mathrm{old}}_{\mathrm{pe}}[i],
$$

利用 $\mathcal R(\Delta)\mathcal R(i)=\mathcal R(i+\Delta)$ 恢复新位置。未改 prefix 继续 radix match，replacement fresh prefill，suffix 的 $K_{\mathrm{nope}}$ 与 $V$ 保留。

保留 $K_{\mathrm{nope}}$ 与 $V$ 意味着原 span 已经传播到 downstream hidden state 的影响仍存在。`AMORTIZE` 提供 positional replay-equivalence，适合允许这种持久影响的计算摊销。它无法承担敏感信息删除或错误 observation 纠正。

#### 4.2 `FORGET`：支付重算成本获得语义删除

`FORGET` 从保留 prefix 后重新 prefill replacement 和 suffix。redaction、retention deletion、错误 tool output 修正需要这条路径。两种 mode 把性能与语义选择放到 agent policy，serving 层按声明执行。

#### 4.3 两条实验腿必须分开读

- Mechanism leg：17K 合成 message-edit workload 中，SGLang radix hit 49.6%→Leyline 60.8%，并发 $C=8$ 的 p50 5533→5292 ms，下降 241 ms；$C=16$ 延迟反而增加 45 ms，收益受 workload 和并发影响。
- Policy leg：debug-gym 中 `keep_all` 10/32（31.2%），`truncate_older_than(n=2,max_chars=200)` 15/33（45.5%），增加 14.3 pp。两臂都走 standard re-prefill，结果只支持截断 policy。
- Real trace：一条低 radix-hit 的 50-step trace 中，full configuration 的 wall time 下降 5.3%，first-token 48/50 相同；cache hit 只从 27.6% 变为 27.8%，约 95% timing win 来自 fp32 rotation mitigation，Role B cache reuse 在该轨迹上 timing-neutral。另一条 radix hit 91.6% 的 trace 中 splice 慢 0.6%。

证据定位：[Leyline 笔记](/papers/2606.01065-leyline-kv-cache-directives-agentic-inference/)；论文 Sections 3-5、Equation 1、Table 2、Appendix B Table 3、Appendix T/Q。

### 5. 三篇论文如何形成一个 runtime

三项机制可以放进一条 Agent 执行时间线：

```text
Turn boundary
  │
  ├─ Leyline: 对 canonical context v 执行 directive
  │      ├─ AMORTIZE: splice + position correction
  │      └─ FORGET: prefix-trimmed re-prefill
  │
  ├─ Grape: 将已知 task graph lowering 为 ready micro-tasks
  │      └─ 上游 decode chunk → 下游 incremental prefill
  │
  ├─ SPORK: main 首 token 后创建 branch-local probe
  │      ├─ confidence pass → read-only tool async execute
  │      ├─ strict match → reuse speculative result
  │      └─ reject → discard result + target-verify token prefix
  │                       └─ finish main call → execute actual tool
  │
  └─ Observation commit → canonical context v+1
```

执行顺序很重要。先完成 canonical history 的 directive，再从新版本建立 main prefix；SPORK probe 继承该 context version，并保留 branch-local KV。strict match 只控制 speculative result 能否复用；miss 分支释放临时结果，由 main 完成实际 call、串行执行工具，再将真实 Observation 提交到 canonical history。Leyline 处理已经提交的 state，错误预测不会进入 canonical history。

#### 5.1 三个 control plane

| Control plane | 主要原语 | 责任 | 论文来源 |
| --- | --- | --- | --- |
| Compute plane | node、strong/partial edge、ready、preempt | 已知 LLM 计算的依赖与调度 | Grape |
| Speculation plane | fork、probe、dispatch、commit、reject、cancel | 未来 action 的预测、验证和副作用隔离 | SPORK |
| State plane | span、version、replacement、mode、invalidate | canonical context 编辑与 KV 一致性 | Leyline |

统一 IR 至少需要以下身份：

```text
ContextVersion = (session_id, version_id)
Branch          = (context_version, branch_id, parent_prefix)
SemanticSpan    = (message_id, token_start, token_end, provenance)
ComputeNode     = (task_id, phase, input_versions, output_version)
Directive       = (span, replacement, mode, expected_version)
```

`expected_version` 提供 compare-and-swap 语义，防止 policy 基于旧 history 编辑新 context。`input_versions` 让 Leyline edit 能定位已经消费旧 span 的 Grape micro-task，并选择继续保留、定向失效或 re-prefill。

#### 5.2 动态图需要补充的事件

Grape 当前 TaskFlow 能表达预声明 node 和数据流。组合 SPORK / Leyline 后，runtime 还需要：

- `fork / commit / reject / cancel`：管理 speculative branch。
- `tool_start / tool_complete / tool_cancel`：把异步工具纳入事件图。
- `context_edit / invalidate / replay`：处理 canonical history 版本变化。
- reference count 或 copy-on-write：保护 main / probe shared prefix KV。
- transactional multi-directive commit：一次应用多个 span edits，并在失败时保持旧版本可用。
- side-effect class：区分 read-only、idempotent write、transactional write 与不可回滚操作。

这组事件构成对 Grape 静态 DAG 的上层扩展。Grape engine 可以继续执行已就绪的 LLM micro-task，动态编排由 Agent runtime 维护。

### 6. 组合收益为何无法直接相加

三项优化争用相同资源：

- Grape 用 decode 阶段的空闲计算推进下游 prefill。
- SPORK 同时增加 probe decode、KV pages 和可能的工具请求。
- Leyline rotation、replacement prefill 和 Role B trie pin 改变 KV 生命周期。

Grape 与 SPORK 都希望占用 decode 剩余容量。若 scheduler 无条件接纳 probe，foreground token SLO 和下游 incremental prefill 会被拖慢。一个示意性 admission score 可以从期望净收益出发：

$$
G_{\mathrm{probe}}
=
\hat\alpha\min(\hat T_{\mathrm{tool}},\hat T_{\mathrm{main,remain}})
-\hat T_{\mathrm{probe}}
-(1-\hat\alpha)\hat C_{\mathrm{tool,waste}}
-\lambda M_{\mathrm{KV}}
-\mu R_{\mathrm{SLO}},
$$

其中 $C_{\mathrm{tool,waste}}$ 是 miss 时被丢弃的工具执行、API 配额和并发槽成本，$M_{\mathrm{KV}}$ 是新增 KV 占用，$R_{\mathrm{SLO}}$ 是对前台 batch 的预测风险。只有 $G_{\mathrm{probe}}>0$ 且工具安全等级允许时 dispatch。

Leyline 也需要比较 saved re-prefill 与持有成本：

$$
G_{\mathrm{splice}}
=
T_{\mathrm{suffix\ prefill\ saved}}
-T_{\mathrm{rotation/reindex}}
-C_{\mathrm{pinned\ KV}}
-C_{\mathrm{semantic\ risk}}.
$$

`FORGET` 场景中的 $C_{\mathrm{semantic\ risk}}$ 可以视为不可接受，直接选择 re-prefill。两项 score 都属于组合系统建议，三篇论文尚未联合验证。

### 7. 四个需要主动避免的误读

1. **把 Grape 当作 ReAct scheduler**：论文 TaskFlow 是预声明 task dataflow；动态 loop、retry 和 tool blocking 需要上层 runtime。
2. **把 SPORK 当作常规 token speculative decoding**：主收益来自提前执行外部工具，D3 才属于 target-verified token recovery。
3. **把 Leyline `AMORTIZE` 当作语义删除**：后缀状态仍保留原 span 的历史影响；`FORGET` 承担真正遗忘。
4. **把三篇 headline speedup 相乘**：指标、baseline、硬件、workload 和资源竞争都不一致，联合收益需要同一 trace 的 factorial ablation。

### 8. 一条可执行的落地路线

#### 阶段 A：先建立可观测基线

对 production trace 记录：

- task boundary 的 static/dynamic prompt 长度、prefill burst 和 P50/P95/P99 token gap；
- 每个 ReAct turn 的 reasoning、tool-call decode、tool execution、Observation commit 时间；
- message edit 的 span 位置、suffix 长度、radix hit loss、re-prefill tokens；
- main/probe/micro-task 的 KV bytes、batch slots、取消和抢占；
- final answer latency、workflow makespan、goodput 和每完成任务 GPU-seconds。

缺少这些分解时，系统无法判断瓶颈属于 task、action 还是 edit boundary。

#### 阶段 B：按风险从低到高接入

1. 在固定多阶段 pipeline 上启用 Grape 式 incremental prefill，先验证 logits / token / outcome 与 baseline 的差异。
2. 只为高延迟、read-only、结果可丢弃的工具开启 SPORK D1/D2；建立 strict serialization 和 observation freshness window。
3. 将 D3 作为独立 engine feature 验证并发隔离，避免共享全局 proposer state。
4. 对纯展示压缩或可容忍持久影响的 span 尝试 Leyline `AMORTIZE`；纠错、合规和隐私一律走 `FORGET`。
5. 引入 context version、branch-local KV 和 dynamic graph events，再做联合 admission control。

#### 阶段 C：使用 factorial ablation 验证组合

同一模型、engine、硬件、trace 和 arrival process 下运行：

| 配置 | Grape | SPORK | Leyline |
| --- | --- | --- | --- |
| `000` | off | off | off |
| `100` | on | off | off |
| `010` | off | on | off |
| `001` | off | off | on |
| `110` | on | on | off |
| `101` | on | off | on |
| `011` | off | on | on |
| `111` | on | on | on |

每个单元报告延迟分位数、吞吐、GPU-seconds、KV watermark、tool waste、context edit correctness 与 task success。这个设计可以识别互补收益与资源争用。

### 9. 现场分享节奏

| 时间 | 内容 | 希望听众带走的判断 |
| ---: | --- | --- |
| 0-5 min | 一条 Agent critical path 与三个串行边界 | token engine 速度无法直接代表 workflow 速度 |
| 5-15 min | Grape：task boundary | 预声明依赖可以下降到 token chunk 与 micro-task |
| 15-25 min | SPORK：action boundary | next-tool intent 可早于完整 arguments 稳定，收益由 acceptance×overlap 决定 |
| 25-33 min | Leyline：edit boundary | KV mutation 需要显式 mode，位置摊销与真正遗忘使用不同路径 |
| 33-40 min | 统一 runtime 与实验设计 | 三个 control plane 需要 context version、branch isolation 和共同资源预算 |

结束时保留一张判断表：

| 问题 | 首选机制 | 上线前必须回答 |
| --- | --- | --- |
| 固定 pipeline 的 task switch prefill 尖峰 | Grape | 拓扑是否已知，增量 prefill 是否保持可接受的一致性 |
| thinking 后串行等待慢只读工具 | SPORK | exact acceptance、可隐藏窗口、工具副作用和 spare capacity 是否足够 |
| history edit 破坏 suffix cache | Leyline | 需要 `AMORTIZE` 还是 `FORGET`，架构 kernel 是否支持，已有 radix headroom 多大 |

## 关键实验/定理

### 结果 1：三篇 headline 数字回答不同问题

| 工作 | 最关键实现匹配结果 | 证据定位 | 最窄结论 |
| --- | --- | --- | --- |
| Grape | 相对 `vLLM-opt`：平均 token latency 加速 1.15×、P95 加速 3.80×、throughput 提高 1.16× | Section IV-B/C，Figures 12-14，PDF pp.8-9 | 固定 LLM task DAG 上的跨 task incremental prefill 主要缓解 task-boundary tail burst |
| SPORK | Qwen3-32B / GAIA：P95 131.9→108.1 s，-18%，N=165 | Figure 10，Sections 6.2-6.6 | thinking-mode、慢工具和给定 acceptance 下，action-level speculation 能隐藏部分 tool wait |
| Leyline | radix hit 49.6%→60.8%；$C=8$ p50 5533→5292 ms | Appendix B，Table 3，PDF pp.15-18 | MLA 合成 message-edit workload 上，splice 可恢复 suffix KV work，并在部分并发区间降低延迟 |

- 证据定位：Grape Section IV-B/C、Figures 12-14、PDF pp.8-9；SPORK Figure 10、Sections 6.2-6.6；Leyline Appendix B、Table 3、PDF pp.15-18。
- 对照是否可比：每篇内部对照都匹配主要实现路径；三篇的模型、workflow、指标和 latency 口径不同，跨论文数字只能分别解释。
- 支持的最窄结论：三组 headline 数字分别支持跨 task incremental prefill、action-level speculation 和 history splice 在各自 operating region 内减少局部等待，无法据此推出三种机制组合后的加速比。

Grape 报 ms/token 与 throughput，SPORK 报 per-query P95 wall time，Leyline mechanism 报 replay cache hit 与 p50。分享中保留原指标，使每个数字继续对应原始优化目标。

### 结果 2：正确性保证分布在不同层级

| 层级 | Grape | SPORK | Leyline |
| --- | --- | --- | --- |
| Token / math | causal incremental prefill 在理想算术下等价；有限精度轨迹未完整验证 | D3 只接收 target-verified prefix | $\delta$-rotation 校正位置；bf16 pool 存在 1%-3% per-K-entry floor |
| Action | 固定 task dependency | name+serialized args exact match 后才采用工具结果 | directive 精确指向 rendered token span |
| State | append-only IntermediateVar 流 | reject branch 不进入 canonical history | `AMORTIZE` 保留原影响；`FORGET` re-prefill |
| Side effect | 工具基本未进入实证 | read-only manifest；write / non-idempotent 串行 | 只能编辑模型 context / KV，无法撤销外部写操作 |

- 证据定位：Grape Sections III-A/III-C 与 Section V；SPORK Sections 4.1-4.4、6.6；Leyline Sections 3-4、Appendices G/H/Q。
- 对照是否可比：三篇分别验证 causal task 流、target-verified action prefix 和位置校正后的 KV replay，正确性对象位于不同层级，不能互相替代或合并成单一等价性证明。
- 支持的最窄结论：联合 runtime 需要同时维护数值、action、state 与 external side effect 四层契约，每篇论文覆盖其中一部分。

### 结果 3：联合性能取决于资源交互

- Grape 把更多下游 prefill 提前到 decode 阶段，KV residency 上升。
- SPORK probe 与 main 共享 prefix，同时新增 decode slot、branch KV 和工具流量。
- Leyline splice 保存 prefill compute，Role B trie pin 不降低 peak allocator watermark。
- 三篇论文都显示收益具有 operating envelope：Grape 的 P95 增益大于均值；SPORK no-think 出现 0.79×；Leyline 在高 radix-hit trace 中慢 0.6%。
- 证据定位：Grape Figures 12-18；SPORK Figure 14 与 no-think appendix；Leyline Section 5、Appendices T/U。
- 对照是否可比：三项退化信号来自不同模型、workflow 和负载区间，适合提炼共同 admission 变量，无法作为 compute-matched 的联合性能对照。
- 支持的最窄结论：统一 scheduler 需要按 expected gain、SLO risk、KV pressure 和 side-effect class 做 admission，静态优先级无法覆盖全部组合状态。

### 实验设置与 baseline 审计

| 维度 | Grape | SPORK | Leyline |
| --- | --- | --- | --- |
| Workflow | 固定 code / summary / search DAG | ReAct-style loop，GAIA / HotpotQA / tau2 / BrowseComp | message-edit replay 与 debug-gym |
| 模型 | Llama3-8B、Qwen3-14B | Qwen3-32B、Qwen3.5-35B-A3B、Qwen3-4B | 4 个 MLA 模型为主，附小型 GQA probes |
| 硬件 | 1-2×A100 40GB | H20，部分 TP=4 | H100/H200，部分 TP=4 |
| 强 baseline | 同 vLLM 基座的 `vLLM-opt` | 同 serving mode 的 serial / n-gram baseline | 同 SGLang 的 standard radix |
| 主指标 | ms/token、P95、throughput、SLO attainment | per-query P95 wall time、accuracy、acceptance | cache hit、p50/p99、solve rate、agreement |
| 统计缺口 | 样本数、arrival process、误差条未披露 | CI 和系统化多 seed latency 不足 | policy 样本少、单 threshold、无联合 ablation |
| 组合外推风险 | 动态 ReAct 未测 | probe 资源与 workflow prefill 竞争未测 | Grape/SPORK context version interaction 未测 |

## 证据链强度评估

### 强证据

- 三篇都把朴素串行路径拆成可定位阶段，并给出与机制变量对应的局部 measurement。
- Grape 的 TaskFlow lowering、SPORK 的 D1/D2/D3、Leyline 的 directive/mode/$\delta$-rotation 都能映射到具体 runtime primitive。
- 每篇都有实现匹配度较高的 baseline：`vLLM-opt`、同 mode serial/ngram、同 SGLang radix。

### 中等强度证据

- 三种机制各自在一个主要 operating region 展示了收益，方向与成本模型一致。
- SPORK 和 Leyline 覆盖真实 agent benchmark，Grape 覆盖三类 workflow；样本与 production trace 披露仍有限。
- 数值正确性通过 target verification、rotation replay 或 causal 结构获得部分支持，长期采样轨迹仍需独立复验。

### 需要谨慎的推论

- 三篇研究对象处于相邻层级，当前没有共同代码栈、统一 benchmark 或联合结果。
- Grape 的 “agentic workflow” 范围较窄，主要代表静态 LLM pipeline。
- SPORK 的只读工具仍可能随时间返回不同 observation；strict arguments match 不自动提供 observational equivalence。
- Leyline 的 policy gain 与 kernel gain 来自分离实验，`AMORTIZE` 还具有持久上下文影响。

## OpenReview / 审稿意见吸收

- Page type: not-applicable
- Match confidence: high
- Observed at: 2026-07-14
- Venue status: Grape 由作者主页记录为 SC 2026 accepted；SPORK 与 Leyline 当前为 arXiv v1。
- Public reviews: 三篇均未发现可可靠匹配的公开 reviewer comments；Grape 的公开 proceedings / artifact 尚待出现。
- Ratings / confidence: 无公开评分可统一校准。
- Reviewer consensus: 暂无。
- Main criticisms: 本地综合重点审计 workflow 范式、配置可比性、动态控制流、工具副作用、context mutation 语义和联合资源竞争。
- Author response: 暂无可用公开 rebuttal。
- 对可信度的影响: 单篇机制可以按各自证据读取；统一 Agent serving stack 属于有工程依据的本地设计，需要联合实现与 factorial ablation 才能形成系统结论。

## 本地讨论补充

### 1. 讨论收敛点

- 三篇论文可以沿“task / action / edit boundary”组织，无需把它们压缩成同一种 KV Cache 优化。
- Grape 与 SPORK 都在创造 overlap，Leyline 主要减少 mutation 后的 repair work；统一成本模型需要同时计算 overlap gain、repair saving 和资源机会成本。
- Canonical context version 是组合系统的中心状态。Task inputs、SPORK branch、tool result 和 Leyline directive 都必须绑定版本。

### 2. 修正后的理解

- Grape 的空间并行来自已知 task dataflow 中的跨 task overlap；SPORK 的时间推测来自当前 turn 对 future action 的 early intent；Leyline 处理 history 已经变化后的 state preservation。
- ReAct runtime 可以把已就绪 LLM 阶段提交给 Grape engine，同时保留动态 loop；SPORK 直接插入每个 ReAct turn；Leyline在 turn boundary 管 canonical state。
- Agent serving 的长期接口会从单一 prompt 扩展为 compute graph、speculation branch 和 state directive 三组协议。

### 3. 后续复验指标

- 同一 ReAct coding trace 上三机制的 2×2×2 factorial ablation。
- P50/P95/P99 workflow makespan、final-answer latency、GPU-seconds/success、tool waste 和 cancellation latency。
- main/probe/downstream prefill 的 batch share、KV bytes、prefix refcount、preemption/recompute 和 peak watermark。
- context edit 后的 logits KL、token common prefix、task success、hidden stale-information probe 与合规删除检查。
- dynamic loop、retry、fan-out、nested agents 和多模型 workflow 的 IR expressivity。

## 主要启发

- Agent Workflow 优化的基本单位正在从 request 扩展到 micro-task、speculative branch 和 semantic span。
- 应用层拥有依赖、未来动作置信度和 context fate 等语义，serving 层拥有 batch、KV 和 kernel；高效系统需要显式接口交换这些信息。
- 每项提前执行都要配套 commit/reject/invalidate 语义，每项 KV 复用都要声明位置、内容和副作用保证。
- 性能指标应回到 workflow makespan、tail、goodput 和 GPU-seconds/success，单独的 token throughput 难以覆盖 agent 体验。

## 局限

1. 三篇论文没有联合代码栈和统一 benchmark，本综合的 runtime 架构属于设计推演。
2. Grape 使用静态 LLM-only DAG，无法直接证明动态 ReAct、sandbox 或 browser workload 的收益。
3. SPORK 依赖 open-weight serving features、thinking window、read-only tools 和 spare capacity；closed API 或 no-think 模型适配困难。
4. Leyline 高效路径集中于 MLA，`AMORTIZE` 的持久影响限制了语义适用范围，公开 artifact 当前不可定位。
5. 三篇 headline 指标和 baseline 各异，缺少统一成本、能耗、multi-tenant fairness 与 tail confidence interval。
6. 组合系统中的 branch isolation、tool transaction、context version、dynamic invalidation 和 cross-tenant authorization 仍需实现。

## 跨论文关系

- [Grape](/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/) 提供 compute plane：把变量依赖 lowering 为 static/dynamic node 与 streaming edge。
- [SPORK](/papers/2607.03333-spork-self-speculative-agentic-inference/) 提供 speculation plane：从 shared-prefix main fork future action，并以 strict match / target verification 控制提交。
- [Leyline](/papers/2606.01065-leyline-kv-cache-directives-agentic-inference/) 提供 state plane：用 span directive 与 semantic mode 处理 canonical history mutation。
- 与 [Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/)：Parrot 先把 LLM application dataflow 与 Semantic Variable 暴露给 serving；Grape 下沉到 micro-task，本综合再加入动态 branch 和 mutable state。
- 与 [SARATHI](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/)：SARATHI 提供请求内 chunked prefill primitive，Grape 将其延伸到跨 task token dataflow。
- 与 [ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/)：ThunderAgent 管 program phase、tool wait、pause/restore 与 placement，适合作为动态 orchestrator；本综合三机制补充其 compute overlap、action speculation 和 context edit control。
- 与 [Span Query](/papers/2511.02749-span-queries-cache-attention-locality/)：Span Query 让客户端声明 message span 可重排性，Leyline 让 policy 声明 span mutation；两者都说明 message structure 应进入 serving interface。
- 与 [Speculative Decoding](/papers/2211.17192-fast-inference-transformers-speculative-decoding/)：SPORK D3 继承 target verification，D1/D2 把 speculation 扩展到外部 tool action。

## Reference Intake Brief

### Target

- Intended target system: 面向 LLM systems / agent runtime 工程师的 35-45 分钟 Agent Workflow 技术分享文档。
- Existing related assets: 三篇独立笔记；`content/utility/papers-index.md`；Parrot、SARATHI、ThunderAgent、Span Query 与 Speculative Decoding 笔记。
- Proposed form: 新建 composite Markdown，保留单篇证据并提供统一问题模型、组合架构、落地顺序和复验方案。

### Reusable Elements

1. Task / action / edit 三个串行边界和统一 latency decomposition。
2. Compute / speculation / state 三个 control plane 与 versioned execution IR。
3. 面向 production trace 的分阶段接入、admission score 和 2×2×2 factorial ablation。

### Risks

- Copyright/over-copying: 使用机制重述、少量关键数字和原创组合图，不复制论文长段落。
- Unsourced or unverifiable claims: 联合 runtime 明确标为本地综合；单篇数字回链到 source。
- Tone/brand mismatch: 保持系统技术分享语气，避免性能排行和口号化结论。
- Safety/compliance issues: SPORK 仅讨论只读工具推测；Leyline 明确区分计算摊销与敏感信息删除。
- Overlap with existing assets: 单篇笔记负责完整证据，综合文档负责跨边界叙事和落地设计。

### Skipped

| Material | Reason |
| --- | --- |
| 三系统联合性能数字 | 当前没有共同实现或论文证据。 |
| Leyline 官方代码复现 | arXiv 未提供可定位仓库，附录 release 描述存在冲突。 |
| 完整 slide deck / PDF | 当前目标为可直接改编的 Markdown 技术分享文档。 |
| 动态工具写操作推测 | 需要 transaction / rollback / idempotency 设计，超出三篇实证。 |

### Recommendation

Decision: merge

Why: 三篇论文在 task、action、edit 三个边界形成互补问题分解，能够构成一场机制完整、证据边界清楚并可落到 runtime 设计的 Agent Workflow 技术分享。联合收益与实现缺口已经显式保留。
