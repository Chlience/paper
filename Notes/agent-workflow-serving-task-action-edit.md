# Agent Workflow 推理加速：task、action 与 edit 三个边界

Updated: 2026-07-15

这份工作分享讨论三篇 2026 年的 Agent 推理系统论文：Grape、SPORK 与 Leyline。三篇工作的共同问题是：成熟 LLM serving engine 已经能够高效执行单次请求，完整 Agent System 仍会在相依 task、工具 Action 和历史 edit 之间形成串行等待。它们分别利用预声明依赖、模型的 early intent 和 policy 的 context mutation 信号，把优化粒度从 request 推进到 micro-task、speculative branch 和 semantic span。

核心判断可以压缩为一句话：**Agent 推理系统的下一层接口，需要让 runtime 把依赖、推测与状态语义传给 serving engine，同时用 commit、reject、invalidate 和 version 约束这些优化。**

## 术语

- **Agent System**：模型、prompt、tools、memory、permission、hooks、scheduler、verifier 和用户界面的完整系统。
- **Agent loop**：一次动态执行循环，例如 `reasoning → Action → tool → Observation → reasoning`。
- **Agent scaffold**：包围模型的 prompt、tool schema、handoff、context builder 和控制规则。它会改变模型实际看到的分布与可用动作。
- **Workflow**：task 及其数据依赖。本文说 Grape workflow 时，特指预先声明拓扑的 LLM task graph；动态 ReAct loop 由更上层 runtime 管理。
- **Runtime**：执行 Agent loop 或 workflow，维护 session、tool lifecycle、branch、context 和错误恢复的运行层。
- **Serving engine**：执行模型 prefill / decode、batching、KV Cache 和 kernel 的底层系统，例如 vLLM、SGLang。
- **Orchestrate**：本文按 plan / decompose / schedule 理解；它描述上层如何组织 task，不等同于 GPU scheduler 的 batch 调度。
- **Credit assignment / rewards**：本文按 rewards 流程理解。三篇论文都属于 inference-time systems work，没有新增模型训练目标或 rewards；接入 Agentic RL 时仍要明确哪些已提交事件进入 trajectory 与 rewards。
- **Task / Action / edit boundary**：本分享用于统一三篇论文的本地分析框架，分别表示相依 LLM task 的切换点、模型决定工具调用的时刻，以及 policy 修改已提交历史的时刻。

## 1. 背景

### 1.1 真实使用场景：性能目标已经从单次模型调用扩展到完整 Agent System

强模型与复杂 Agent System 已经共同构成 coding、search、research 和数据处理工具。一次任务通常包含多次模型调用、工具等待、重试、context compaction 和历史编辑。用户最终感知的是任务完成质量、端到端延迟与成本，单次请求的 tokens/s 只覆盖其中一部分。

一条简化时间线如下：

```text
plan / task A decode
  → 等待完整中间结果
  → task B 集中 prefill
  → reasoning decode
  → 完整 tool call 生成
  → tool execution
  → Observation commit
  → compaction / context edit
  → edit point 后重新 prefill
  → 下一轮
```

这条路径可以粗略写成：

$$
T_{\mathrm{workflow}}
=T_{\mathrm{queue}}
+T_{\mathrm{prefill}}
+T_{\mathrm{decode}}
+T_{\mathrm{tool}}
+T_{\mathrm{repair}}
-T_{\mathrm{overlap}}.
$$

其中，$T_{\mathrm{repair}}$ 覆盖 retry、compaction、message edit 和 cache invalidation 后的重算；$T_{\mathrm{overlap}}$ 表示被并行隐藏的工作。Grape 和 SPORK 主要扩大 overlap，Leyline 主要降低 edit 后的 repair work。

### 1.2 LLM serving 已经成熟的能力

- continuous batching 把不同请求的 decode iteration 合入同一 batch；
- PagedAttention 和 block allocator 提升 KV Cache 的容量利用率；
- prefix / radix cache 复用相同前缀；
- chunked prefill 缩小长 prefill 对 decode 的阻塞；
- speculative decoding 用 draft 与 target verification 减少 token decode 时间；
- prefill-decode disaggregation、KV transfer 和 program-aware scheduling 正在完善多阶段 serving。

这些机制大多以 request 或 token 为主要对象。Agent runtime 已经知道 task dependency、tool schema、context fate 和 branch 状态，serving engine 通常只能看到一组独立 prompt。上下层信息缺口留下三段串行边界：

| 边界 | Runtime 已知信息 | 原串行路径 | 论文 |
| --- | --- | --- | --- |
| Task | 预声明依赖、静态 prompt、逐步到达的上游 token | 上游完整 decode → 下游完整 prefill | Grape |
| Action | main prefix、逐渐稳定的 next-tool intent、tool side-effect class | 完整 reasoning / tool-call decode → tool execution | SPORK |
| Edit | policy 要替换的 span、语义目标、当前 context version | edit → suffix re-prefill | Leyline |

### 1.3 当前状态

- 三篇工作都给出了局部收益，说明 Agent 语义进入 serving interface 后可以减少关键路径等待。
- 三篇工作覆盖不同 workload、模型、硬件和指标，headline 数字无法横向排名，也无法直接相加。
- Grape 评测固定 LLM task DAG；SPORK 评测动态 ReAct-style tool loop；Leyline 评测 history mutation。三者尚未在同一 runtime 联合实现。
- 细粒度执行会增加 KV residency、额外 decode、工具请求和状态版本。每种优化都需要 admission control 与回退路径。
- 完整 Agent System 的正确性包含 token 数值、Action、context state 和外部副作用四层；单一 exact-match 或 cache equation 只覆盖其中一部分。

### 1.4 启示

- Agent serving 的优化单位正在从 request 扩展到 micro-task、speculative branch 和 semantic span。
- Runtime 与 serving engine 之间需要显式 contract，携带 dependency、confidence、side effect、span、mode 和 version。
- 每项提前执行都需要 `commit / reject / cancel`；每项状态复用都需要 `invalidate / replay / forget`。
- 性能评测需要回到 workflow makespan、tail latency、goodput、GPU-seconds/success 和 task success。
- Agentic RL rollout 复用这些推理路径时，还要保留 trajectory lineage、token mask、tool event 与 rewards 归属。

## 2. 关键工作给出的信号

### 2.1 Grape：执行单元可以从 task 下沉到 micro-task

资料：[论文笔记](/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/)；规范公开信息来自 [Hailong Yang 主页](https://thomas-yang.github.io/)，正文依据本地提供的 12 页匿名稿。

#### 主要贡献

Grape 把一次 LLM task 拆成 static prefill、dynamic prefill 和 decode micro-task。若下游 task B 的 prompt 为

$$
P_B=S_B\Vert U_B\Vert Y_A,
$$

$S_B$ 与 $U_B$ 在 workflow 启动时已经确定，$Y_A$ 是上游 task A 逐步生成的输出。Grape 先计算 $S_B\Vert U_B$，再把 $Y_A$ 的 token chunk 增量追加到下游 KV state。task B 的 decode 仍然等待完整 prompt，等待期间的大部分 prefill 已经完成。

系统由三层组成：

1. TaskFlow 用 `InputVar / IntermediateVar / OutputVar` 和 `add_task` 声明数据依赖；
2. lowering 把 task 转成 static / dynamic node，以及 strong / partial edge；
3. SLO-aware scheduler 与 critical-path-aware KV preemption 控制 micro-task 的执行顺序和容量压力。

#### 关键证据

- 相对同 vLLM 基座、实现匹配度最高的 `vLLM-opt`，完整 Grape 的平均 agentic inter-token latency 加速 1.15×，P95 加速 3.80×，throughput 提高 1.16×。
- Grape 与 `vLLM-opt` 的平均 SLO attainment 分别为 98.10% 与 83.46%。
- KV memory optimization 的独立平均 throughput 增益为 1.06×；图维护和优先级开销低于总 inference time 的 0.7%。
- 证据定位：论文 Sections III–IV，Figures 12–19，PDF pp.4–10。

最稳妥的解释是：完整 Grape 的收益方向与平滑 task-switch prefill burst 一致，主要增量集中在 token-gap tail。论文只单独消融 memory optimization，无法把结果继续拆分给 incremental prefill、scheduler 和 memory manager。论文也没有报告 final-answer latency 或 workflow makespan 的 P95，3.80× 不能直接写成用户任务完成延迟加速。

#### 局限

- 三类 workload 都是预声明 topology 的固定 pipeline；condition、loop、retry、dynamic fan-out、nested agent 和长时工具尚未进入 TaskFlow 实证。
- 两个模型为 Llama3-8B 和 Qwen3-14B，硬件为 1–2 张 A100 40GB；大型 MoE、多节点和现代 PD disaggregation 仍待验证。
- `vLLM-opt` 是核心 baseline。相对 Parrot 的 2.30× average / 8.49× P95 混入了 engine implementation gap。
- 论文缺少公开代码、完整作者列表、请求规模、arrival process、重复实验、置信区间和输出一致性检查。

#### 给框架的信号

Workflow frontend 可以把“哪些 token 已经确定”下降为 engine 可调度的数据依赖。静态 DAG 只是第一步；完整 runtime 还要让 loop、branch、retry 和 tool event 动态改变图状态。

### 2.2 SPORK：工具 Action 可以在完整 reasoning 结束前推测执行

资料：[论文](https://arxiv.org/abs/2607.03333)、[代码](https://github.com/baihuajun24/spork)、[论文笔记](/papers/2607.03333-spork-self-speculative-agentic-inference/)。

#### 主要贡献

SPORK 让当前 target model 充当自己的 next-tool predictor。main stream 生成首个 token 后，runtime 从共享 prefix KV 创建 probe，并强制补入 tool-call opener。probe 预测的只读工具调用达到 confidence threshold 后，runtime 提前执行工具，让 tool latency 与 main 的剩余 Chain-of-Thought decode 重叠。

三个设计分别控制成本模型中的不同变量：

| 设计 | 机制 | 主要作用 |
| --- | --- | --- |
| D1 | Prefix-cache fork | 降低 probe prefill cost |
| D2 | Tool-name span confidence gate | 提高 accepted overlap，减少错误工具执行 |
| D3 | 把 rejected probe 当作 draft，由 target verification 接收匹配 token prefix | 回收 miss branch 的 tool-call decode |

论文要求完整 tool call 精确匹配后才采用预计算结果；公开 strict runner 比较 tool name 与规范化参数字典等值。miss branch 丢弃 speculative result，main stream 完成真实调用并走串行 fallback。

#### 关键证据

- 工具等待在论文 workload 中占 wall time 的 16%–37%。
- Qwen3-32B 在五个 benchmark 的 fork point 上，next-tool name accuracy 为 74.6%–99.6%。
- D1 在 15K context 下把 probe cost 从约 1.6 s 降到 0.35 s；论文报告 main TPOT overhead 约 0.22%。
- Qwen3-32B / GAIA 上，P95 per-query wall time 从 131.9 s 降到 108.1 s，下降 18%，样本数为 165。
- tau2 tool-latency sweep 中，tool floor 从 0.5 s 增至 5 s 时，mean speedup 从 1.09 增至 1.18，符合论文成本模型的方向。
- 证据定位：论文 Sections 3–6，Figures 6、10、14，Appendices A–H。

D2 的论文定义与公开代码存在需要复验的差异。论文声称对 tool-name span 求 minimum probability，并将首 token 解释为 opening quote；公开 Qwen 强制前缀已经包含该 quote。默认 Qwen runner 对前 16 个生成 tokens 丢弃首 token 后取 minimum，窗口可能进入 arguments。论文的 88% precision / 100% recall 以 name match 为标签，在同一批 probes 上选择阈值；它不能直接解释为完整调用正确率。

D3 也包含两组口径：GAIA 的 657 个 rejected events 中位匹配前缀为 18 tokens；BrowseComp 的 1268 pairs 中位为 27 tokens。论文给出的 0.6 s/rejected turn 来自 BrowseComp 的离线算术估计，缺少独立在线 D3 ablation。

#### 适用条件

在未启用 D3 的简化模型中，令 $\alpha$ 为按 tool-call turn 统计的 strict acceptance，$t_{\mathrm{overlap}}$ 为 accepted turn 实际隐藏的时间，$T_{\mathrm{oh}}$ 为 rejected turn 的额外 probe 与错误工具执行开销。break-even 条件是

$$
\alpha t_{\mathrm{overlap}}\geq (1-\alpha)T_{\mathrm{oh}}.
$$

可隐藏时间还满足

$$
t_{\mathrm{overlap}}
\leq
\min(T_{\mathrm{tool}},T_{\mathrm{main,remain}}).
$$

多秒 thinking、慢工具、稳定 schema、高 exact acceptance 和 spare serving capacity 会扩大收益。论文在 Section 6.6 报告 no-think tau2 speedup 为 0.79×，说明 probe 也可能延长关键路径；该点没有披露独立样本数和完整配置，适合作为定性失败边界。

#### 局限

- 论文实证只覆盖 read-only tools；write tools 需要额外的 transaction、rollback 或 idempotency 机制，当前证据尚未覆盖。
- 完整调用匹配只约束结果采用条件；公开 runner 使用规范化参数等值，网络搜索和数据库读取仍可能随时间返回不同 Observation。
- 跨模型主图混合 engine / HTTP serving mode 与不同 D1/D2/D3 组合，迁移结论要按 panel 读取。
- 高并发下的 probe admission、KV pressure、tool quota、multi-tenant fairness 与 cancellation 尚未系统评估。
- 公开 sidecar 参考实现使用 server-level proposer state、要求 `workers=1`、默认最多注入 20 个 draft tokens；论文 D3 数字来自 engine integration，生产并发隔离需要重新实现。

#### 给框架的信号

未知的 future Action 也可以进入 runtime graph，前提是 branch lifecycle 与 side-effect class 成为一等对象。`fork / dispatch / commit / reject / cancel` 需要同时约束 KV、工具执行和 trajectory 记录。

### 2.3 Leyline：context edit 需要 policy 到 KV Cache 的 directive

资料：[论文](https://arxiv.org/abs/2606.01065)、[论文笔记](/papers/2606.01065-leyline-kv-cache-directives-agentic-inference/)。

#### 主要贡献

Leyline 把 agent policy 的历史编辑表达成四元 directive：

$$
D=(s_{\mathrm{start}},s_{\mathrm{end}},R,m),
$$

其中 span $[s_{\mathrm{start}},s_{\mathrm{end}})$ 被 replacement $R$ 替换，$m$ 选择两种语义模式：

- `AMORTIZE`：保留未修改 prefix，fresh prefill replacement，并对后缀 KV 做位置校正；后缀仍保留原 span 已经传播进去的历史影响。
- `FORGET`：从保留 prefix 后重新 prefill replacement 和 suffix，用重算重建当前 active model context。

在 Multi-head Latent Attention（MLA）中，位置集中在 RoPE band $K_{\mathrm{pe}}$。若替换使后缀位置整体移动

$$
\Delta=|R|-(s_{\mathrm{end}}-s_{\mathrm{start}}),
$$

则 Leyline 对后缀位置 $i$ 应用

$$
K^{\mathrm{new}}_{\mathrm{pe}}[i+\Delta]
=\mathcal R(\Delta)K^{\mathrm{old}}_{\mathrm{pe}}[i].
$$

这个位置校正利用 RoPE rotation closure。它保证的是位置重标后的 replay contract；`AMORTIZE` 不承诺与替换后 prompt 的完整 re-prefill 等价。

#### 关键证据

- 17K token 合成 message-edit workload 上，standard SGLang radix cache hit 为 49.6%，splice 为 60.8%，提高 11.2 pp。
- 并发 $C=8$ 时，replay p50 从 5533 ms 降到 5292 ms，减少 241 ms；$C=16$ 时从 7166 ms 增至 7211 ms，差异为 45 ms 且论文标为 noise。
- debug-gym policy 实验的 headline 为 `keep_all` 10/32 到 truncation policy 15/33，精确差约 14.2 pp，论文按显示的一位小数写 14.3 pp；Table 2 的 treatment 行只合计 14/32，结果规模无法完全核对。两组都走 standard re-prefill，这项小样本信号只涉及 policy。
- 一条 50-step real trace 的 wall time 下降 5.3%。论文将约 95% timing win 归于 fp32 rotation mitigation，但缺少 `fp32 off` arm；公开数字只支持 Role B L2 在该单轨迹上 timing-neutral。另一条 radix hit 91.6% 的 trace 中 splice 慢 0.6%。
- Appendix G 的长轨迹 first-token agreement 在四个 MLA 模型上差异很大：DSv2-Lite 的 single / multi-edit 为 100% / 100%，GLM 为 81% / 90%，Moonlight 为 56% / 57%，JoyAI 为 12% / 4%。位置代数成立后仍需逐模型 fidelity canary。
- 证据定位：论文 Sections 3–5，Equation 1，Table 2，Appendix B Table 3，Appendices Q、T、U。

#### 局限

- 核心 $\Delta$-rotation kernel 沿用同团队 Irminsul 的基础；Leyline 的主要新贡献位于 mutation framing、directive contract、mode 与 radix integration。
- 高效 splice 证据集中于 MLA。GQA/MHA 的代数可扩展，live-model 行为更容易偏向 re-prefill reference，仍需 boundary recomputation 等机制。
- `AMORTIZE` 保留 stale influence，适合展示压缩或允许持久影响的 memory policy；纠错、隐私和合规场景的当前 active context 需要 `FORGET`。旧 radix 副本、日志、artifact 与外部副作用仍由 storage / audit 层清理。
- policy leg、mechanism leg 与 real-trace leg 分离，当前没有完整的 policy × splice 联合消融。
- 论文描述了未来 artifact release，当前没有可定位的公开代码仓库。

#### 给框架的信号

Context mutation 需要显式 control plane。runtime 负责声明 span、replacement、mode 与 expected version，serving engine 负责 architecture-specific kernel、radix state、transaction 和 tenant isolation。

### 2.4 三篇工作共同给出的信号

| 维度 | Grape | SPORK | Leyline |
| --- | --- | --- | --- |
| 优化对象 | 已知 task dependency | future tool Action | 已提交 history mutation |
| 新执行单元 | micro-task | speculative branch | semantic span / directive |
| 主要收益 | 提前做下游 prefill | 隐藏 tool wait | 减少 suffix repair work |
| 关键保证 | causal dependency | strict call match + target verification | mode-aware position / active-context contract |
| 主要资源代价 | 更多 ready work 与 KV residency | probe decode、branch KV、tool quota | rotation、replacement prefill、pinned KV |
| 主要失败边界 | dynamic loop 与 tool-heavy workflow | no-think、快工具、低 acceptance | 高 radix headroom、stale influence、架构差异 |

共同信号有三点：

1. 应用层语义可以转成 serving optimization hint；hint 需要可验证 contract。
2. 更细粒度会扩大调度空间和状态量；收益取决于 operating envelope 与 resource admission。
3. 性能优化会改变执行顺序、临时分支和 cache state；统一 runtime 必须维护 canonical state 与 lineage。

## 3. 真正的优化对象：Agent runtime 中的边界

三篇论文没有尝试替代完整 Agent System。它们分别优化 system 已经定义好的三个边界：

- **Task slot**：哪些 prompt token 已知，哪些下游计算已经 ready；
- **Action slot**：next-tool intent 是否足够稳定，能否安全创建 speculative branch；
- **Edit slot**：哪个 canonical span 需要替换，目标是摊销位置变化还是重建当前模型上下文。

模型继续负责 reasoning、plan、tool selection 和 response generation。Agent System 继续负责 permission、hook、scheduler、context policy 与 verifier。Serving runtime 负责把这些决策下降为可调度、可回退、可审计的执行原语。

这一分工对 Agentic RL 也很重要：

- 三篇工作没有改变 credit assignment / rewards 设计；
- rewards 应绑定 canonical committed trajectory；SPORK rejected probe 与 speculative tool result 只进入 observability，不进入训练 trajectory；
- Grape 改变 chunk 和 batch composition，RL rollout 需要记录 inference determinism、rollout logprob 与 trainer recomputation 差异；
- Leyline `AMORTIZE` 下的模型内部状态仍携带旧 span 影响，rendered transcript 与实际 conditioning state 存在差异。训练或评测若要求 transcript 可重放，应优先使用 `FORGET` 或显式记录 mode 与原始 context provenance。

## 4. 三类接入路线：从静态 workflow 到可变 Agent state

### 4.1 预声明 workflow 优化

适合固定 multi-stage pipeline，例如 query rewrite → search → answer → safety check。TaskFlow 或类似 IR 可以完整暴露依赖，Grape 式 incremental prefill 容易做局部等价检查和 scheduler ablation。

- 优点：状态和依赖清楚，baseline 容易构造；
- 风险：对动态 ReAct、retry 和 fan-out 的外部有效性有限；
- 首要验证：final-answer makespan、token-gap tail、KV watermark 和 logits / token 一致性。

### 4.2 完整白盒 Agent loop 优化

适合可 hook 的 ReAct runtime。SPORK 直接插入每个 turn，在 main/probe/tool 之间建立异步事件；runtime 可以看到 tool schema、read-only class 和 strict serialization。

- 优点：接近真实 Agent loop，能够直接测 tool-wait overlap；
- 风险：branch 与 tool 会争用 serving capacity，错误推测还会消耗外部 API quota；
- 首要验证：turn acceptance、realized overlap、wasted tool cost、P95/P99 latency 与 task success。

### 4.3 可变 context 的 system-in-loop 优化

适合会执行 compaction、stale-output eviction、retry cleanup 和 history rewrite 的长程 Agent System。Leyline 让 policy 通过 directive 选择位置摊销或当前 active context 重建。

- 优点：把 context management intent 与 KV 实现连接起来；
- 风险：`AMORTIZE` 的内部状态与显示文本存在语义差异，架构 kernel 与多租户事务要求较高；
- 首要验证：cache hit、saved prefill、logit / token agreement、stale-information probe、transaction 与 tenant isolation。

这三条路线适合顺序验证。静态 workflow 用于建立依赖与数值基线，白盒 loop 用于验证异步 branch，mutable state 用于验证 context contract。联合系统放在单项机制通过后再做。

## 5. 框架层需要补充的能力

### 5.1 一个 versioned Agent execution IR

统一 IR 至少需要以下身份：

```text
ContextVersion = (session_id, version_id)
Branch          = (context_version, branch_id, parent_prefix)
SemanticSpan    = (message_id, token_start, token_end, provenance)
ComputeNode     = (task_id, phase, input_versions, output_version)
Directive       = (span, replacement, mode, expected_version)
```

Grape 的 node / edge、SPORK 的 branch、Leyline 的 directive 都绑定同一个 `ContextVersion`。一次 edit 会生成新的 canonical version：`AMORTIZE` 可以把允许保留旧影响的 suffix state 迁移到新版本，`FORGET` 或更严格的语义要求会使消费旧 span 的 downstream state 失效并触发 re-prefill。一次 rejected probe 只释放 branch-local state；真实 Observation commit 后才生成下一版 canonical context。

### 5.2 三个 control plane

| Control plane | 原语 | 责任 |
| --- | --- | --- |
| Compute | node、strong/partial edge、ready、preempt | 已知 LLM work 的依赖与执行 |
| Speculation | fork、probe、dispatch、commit、reject、cancel | future Action 的预测、验证与副作用隔离 |
| State | span、version、replacement、mode、invalidate | canonical context mutation 与 KV 一致性 |

动态 runtime 还要补充 `tool_start / tool_complete / tool_cancel`、transactional multi-directive commit、prefix reference count / copy-on-write，以及 read-only、idempotent write、transactional write、non-reversible write 四类 side-effect metadata。

### 5.3 统一 scheduler 与 admission control

Grape 的 downstream prefill 与 SPORK probe 都希望利用 decode 阶段的闲余计算，Leyline 又会改变 KV 生命周期。三项收益会竞争 batch slots、KV pages 和工具并发。统一 scheduler 至少需要估计：

- expected overlap 或 saved re-prefill；
- probe / rotation / recompute cost；
- KV bytes 与预计持有时间；
- foreground token SLO 风险；
- tool quota、wasted execution 与 side-effect risk；
- context version 失效概率。

静态优先级可以作为起点，生产部署需要根据实时 trace 决定 admit、defer、preempt 或 fallback。

### 5.4 统一 observability 与正确性账本

每个 Agent turn 至少记录：

- session、context version、task、branch 和 span identity；
- prefill / decode / tool / repair 的开始与结束时间；
- main/probe/micro-task 的 batch share、KV bytes、preempt 与 recompute；
- tool arguments、side-effect class、dispatch、cancel、strict acceptance 和 Observation freshness；
- directive span、replacement、mode、cache hit、rotation 与 invalidation；
- final answer latency、workflow makespan、task success 和 GPU-seconds/success；
- Agentic RL 场景中的 trajectory ID、behavior model version、token mask、rollout logprob、reward 与 committed-event lineage。

正确性按四层分别检查：

1. **Token / numerical**：增量 prefill、rotation 和 target verification 是否满足声明的数值 contract；
2. **Action**：工具名、arguments、schema 和 freshness 是否满足采用条件；
3. **State**：canonical context、branch、span 与 version 是否一致；
4. **External side effect**：工具执行能否丢弃、取消、回滚或审计。

## 6. 复现与落地规划

### 6.1 先建立同一条可观测 baseline

选择一个支持 thinking、真实只读工具和 context compaction 的白盒 Agent loop，在同一模型、engine、硬件与任务集上记录 task / Action / edit 三类 boundary。第一轮只回答：主要 wall time 位于哪里，P50/P95/P99 有何差异，KV 与 batch 何时成为瓶颈。

### 6.2 建议的实现顺序

1. **SPORK D1/D2**：公开代码和机制最完整，适合快速验证 early intent、prefix fork、confidence gate 与 tool overlap。复现时先修正并锁定 confidence span extraction；D3 作为独立 engine feature 随后加入。
2. **Grape-style fixed pipeline**：用两个相依 LLM task 验证 static prefill 与 streamed dynamic prefill，再增加 SLO-aware scheduler；公开 artifact 缺失时先实现最小路径。
3. **Leyline contract harness**：先实现 `AMORTIZE / FORGET` 的 API 与 full re-prefill oracle；MLA splice 放在语义测试通过后。当前 artifact 缺失使这一步复现风险最高。
4. **统一 context version 与 branch event**：三项单独通过后，再把它们放进同一 runtime。

这个顺序优先利用公开 artifact，同时让每一步只引入一种新状态：branch、dependency graph、mutable context。

### 6.3 联合实验

在同一 trace 上做 2×2×2 factorial ablation：

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

每个单元报告 workflow makespan、P50/P95/P99、throughput、GPU-seconds/success、KV peak、tool waste、context correctness 与 task success。Agentic RL rollout 额外报告 accepted trajectory/s、rollout / trainer $\Delta\log p$、reward 与 time-to-quality。

### 6.4 继续条件

- 单项机制在论文 operating envelope 内能够复现方向性收益；
- 同一 scaffold / Agent loop 中仍有收益，runtime hook 没有覆盖或抵消机制；
- correctness contract、fallback 和 failure boundary 均有自动测试；
- 收益在固定资源、固定任务与固定输出质量下成立；
- 联合配置的增益能够通过 factorial ablation 归因。

## 7. 40 分钟分享节奏

| 时间 | 内容 | 希望听众带走的判断 |
| ---: | --- | --- |
| 0–6 min | 背景、术语与一条 Agent critical path | request-level serving 指标无法覆盖完整 Agent 体验 |
| 6–16 min | Grape：Task boundary | 预声明依赖可以下降到 token chunk 与 micro-task |
| 16–26 min | SPORK：Action boundary | next-tool intent 可以早于完整 arguments 稳定，收益取决于 acceptance × overlap |
| 26–34 min | Leyline：Edit boundary | context mutation 需要声明位置摊销与 active-context 重建的不同 contract |
| 34–38 min | 统一 runtime 与 Agentic RL 关系 | canonical version、branch lineage 和 committed trajectory 是共同状态 |
| 38–40 min | 复现顺序与讨论问题 | 先做单项可证伪实验，再验证资源交互 |

结束时保留三个问题：

1. production trace 的主要等待位于 task、Action 还是 edit boundary？
2. 哪些应用语义可以安全地下沉到 serving engine，验证条件是什么？
3. 性能优化改变执行顺序和内部状态后，trajectory、rewards 与用户可见语义是否仍保持声明的一致性？

## 8. 参考资料

1. Grape, *Efficient Serving for Agentic LLM Workflows via Micro-Task-Level Parallelism*：[本地论文笔记](/papers/2026-07-13-grape-micro-task-agentic-workflow-serving/)，[公开标题与 SC 2026 状态](https://thomas-yang.github.io/)。
2. SPORK, *Self-Speculative Forking to Accelerate Agentic LLM Inference*：[arXiv](https://arxiv.org/abs/2607.03333)，[GitHub](https://github.com/baihuajun24/spork)，[本地论文笔记](/papers/2607.03333-spork-self-speculative-agentic-inference/)。
3. Leyline, *KV Cache Directives for Agentic Inference*：[arXiv](https://arxiv.org/abs/2606.01065)，[本地论文笔记](/papers/2606.01065-leyline-kv-cache-directives-agentic-inference/)。
4. 综合证据与统一 runtime 推演：[Agent Workflow Serving Stack](/papers/2026-07-14-agent-workflow-serving-grape-spork-leyline/)。
5. Parrot：[本地论文笔记](/papers/2405.19888-parrot-semantic-variable-llm-serving/)。
6. SARATHI：[本地论文笔记](/papers/2308.16369-sarathi-chunked-prefill-decode-maximal-batching/)。
7. ThunderAgent：[本地论文笔记](/papers/2602.13692-thunderagent-program-aware-agentic-inference/)。
8. Speculative Decoding：[本地论文笔记](/papers/2211.17192-fast-inference-transformers-speculative-decoding/)。
