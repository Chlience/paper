# SPORK：用同模型自推测重叠工具执行与推理

Updated: 2026-07-16

资料：[完整论文笔记](/papers/2607.03333-spork-self-speculative-agentic-inference/)；[arXiv v1](https://arxiv.org/abs/2607.03333v1)；[官方代码](https://github.com/baihuajun24/spork/tree/31d5ab6f0740d5b5aa26e6a745dc97bcff5139a3)。

适用范围：使用 open-weight 大语言模型、流式生成、任意 assistant prefix completion、token logprobs 和跨请求 prefix KV Cache 的工具型 agent。论文只对适合提前执行的只读工具启用 speculation，主要收益区间位于 thinking mode、数秒级工具延迟和仍有 serving capacity 的场景。

## 核心结论

SPORK 让正在生成 reasoning 的目标模型从共享 KV prefix 开出一个强制工具调用 probe。Probe 预测同一轮未来的工具名与参数；置信度足够高时，controller 提前执行只读工具，让工具执行与 main request 剩余的 Chain-of-Thought（CoT）decode 重叠。

Main 最终生成 Action 后，系统对工具名和规范化参数做完整匹配。匹配时直接接收预执行结果；不匹配时丢弃该结果并执行 main 的最终调用。失败 probe 中与 main 相同的 token 前缀还可以交给目标模型验证，减少 tool-call suffix 的重复 decode。

三项设计分别处理一项成本：D1 用 prefix-cache fork 减少 probe 开销，D2 用置信度 gate 提高完整调用接受率，D3 用 target verification 复用拒绝分支的 token 前缀。主收益来自 action-level tool overlap，D3 主要改善 miss path。

最有力的端到端证据来自 Qwen3-32B + GAIA：$P_{95}$ 从 131.9 秒降至 108.1 秒，下降 18%。Qwen3.5-35B-A3B 的 GAIA、HotpotQA 和 tau2 分别报告 16%、20% 和 16% 的 $P_{95}$ 下降，其中 GAIA 只有 53 个样本；Qwen3-32B 的其它任务、快速 4B 和 no-think 设置还覆盖 10% 下降、基本持平与净变慢。各组使用的 serving mode、baseline 和 D1/D2/D3 组合不同，适合逐组读取。

## 1. 工具调用为什么形成串行等待

典型 ReAct turn 沿下面的关键路径推进：

```text
Main: [prefill][reasoning decode][tool-call decode]
Tool:                                              [tool execution]
Next:                                                               [next turn]
```

模型只有在完整 Action 生成后才启动工具，下一轮又要等待 Observation 返回。论文测得工具执行占端到端 wall time 的 16%（tau2-bench，2 秒模拟 floor）、19%（GAIA）和 37%（BrowseComp）。BrowseComp 的工具延迟中位数为 1.19 秒，$P_{95}$ 达 70 秒。

Token-level speculative decoding 可以缩短 reasoning 或 Action 的 decode，工具执行仍位于后续串行路径。Parallel tool calling 只覆盖同一时刻已经确定且彼此独立的多个调用；workflow prewarming 又需要预先知道执行图。开放式 agent 的工具身份和参数会在 reasoning 过程中逐步形成。

SPORK 把工具执行移入 main 尚在 decode 的时间窗口：

![Figure 6: SPORK 方法总览](/images/papers/2607.03333-spork-self-speculative-agentic-inference/fig-1-method-overview.png)

Figure 6 上方是串行 baseline，下方是 SPORK：D1 在 main 首 token 后 fork probe，D2 通过后提前执行工具，main 完整生成 tool call 后再决定接受预执行结果或串行执行 main 调用。D3 只负责复用 probe 与 main 一致的 token 前缀，后文再展开。

Image Source: [arXiv HTML image / Figure 6](https://arxiv.org/html/2607.03333v1/figures/fig2_method_overview_v2.png).

## 2. 核心切入点：工具身份常常先于完整参数稳定

论文在 Qwen3-32B 上从 reasoning 早期强制补入 tool-call opener，让同一个模型直接续写未来 Action。Fork-at-start 的工具名准确率如下：

| Benchmark | Tool-name accuracy |
| --- | ---: |
| GAIA | 98.3% |
| tau2-bench | 74.6% |
| BrowseComp | 83.7% |
| HotpotQA | 99.6% |
| BFCL | 99.2% |

GAIA、tau2-bench 和 BFCL 使用 position-0 replay；BrowseComp 与 HotpotQA 使用 online first-token probe。跨 benchmark 数值主要支持 early-intent 现象覆盖，精确差异还包含 protocol 差异。

完整 arguments exact match 的范围只有 7.6%–83.9%。GAIA 的 argument exact match 从 CoT 0% 位置的 7.6%，上升到 CoT 80% 的 61.0%，think-end 达到 97.5%。

这个差异给出 SPORK 的调度信号：模型往往很早就暴露“要调用哪个工具”，具体参数则在后续 reasoning 中继续收敛。系统可以先 probe，再按置信度决定何时承担工具执行成本。

Probe 使用当前 target model 的 checkpoint、chat history 和已生成 prefix。参数身份一致提高了 probe 与 main 的行为相关性，也省去第二个 served model；每次 probe 仍是一条独立逻辑 request，会消费 decode slot、KV pages 和调度容量。

## 3. D1、D2、D3 怎样把早期意图变成可用 overlap

下面沿 Figure 6 的 D1、D2、D3 分别看 probe 开销、dispatch 判断和 reject recovery。

### 3.1 D1：Prefix-cache fork

朴素 probe 会重新 prefill 完整 system prompt、user input 和 history。论文在 15K context、Qwen3-32B 上测得约 1.3 秒 prefill 加 0.3 秒短 decode，总计约 1.6 秒；main 与 probe 同时启动还会产生 prefill contention。

D1 先启动流式 main request，等待首个 token 返回，再提交携带当前 assistant prefix 的 raw completion probe。Main 的 prefix KV 已经进入 vLLM/SGLang cache，probe prefill 因而降至约 0.05 秒，连同短 decode 后总开销约 0.35 秒。论文报告 main 的 TPOT（Time Per Output Token）只增加 0.22%，落在测得的 0.3% batching noise 内。

首 token 后启动用于获得 prefix-cache hit；参数稳定性由后续 D2 判断。

### 3.2 D2：Adaptive confidence gate

D2 根据工具名 token 的置信度选择是否 dispatch。论文定义 minimum probability：

$$
c=\min_{i=2}^{L}\exp(\ell_i),
$$

其中 $\ell_i$ 是工具名 span 内第 $i$ 个 token 的 top-1 logprob。当前 probe 没有达到阈值时，main 继续生成；controller 随后从更长的 observed reasoning prefix 发起新 probe。公开 runner 默认按约 50 tokens 的 cadence 重试，单 turn 默认最多累计 5 次尝试，active probes 彼此串行。

GAIA 的 997 个 probes 上，$\theta=0.90$ 得到 88% precision、100% recall 和 0.937 F1，并过滤 77% probes。Turn-level strict full-call acceptance 从 D1 的约 0.22 提升到 D1+D2 的约 0.37。

阈值在同一批 probes 上按 F1 选择，没有 held-out calibration。论文公式与公开默认 runner 对 tool-name span 的截取也存在差异，因此这组数字支持 confidence gating 的方向，复现精确阈值仍需核对 span extraction。

### 3.3 D3：把 rejected probe 转成 draft tokens

完整调用不匹配时，probe body 经常仍与 main 的最终 tool call 共享较长前缀。论文给出两组 workload-specific 统计：GAIA 的 657 个 rejected events 中，匹配前缀中位数为 18 tokens、均值 21.1；BrowseComp 的 1,268 对样本中，中位数为 27、均值 29.5，82% 至少匹配 10 tokens。

D3 在 main 到达 `<tool_call>` boundary 后，把 probe body 交给 speculative-decoding proposer。Target model 验证这些 draft tokens，接受最长 exact greedy prefix；第一次 mismatch 后，main 继续自回归生成 suffix。

论文用 BrowseComp 做离线算术估计：50-token tool call 的 rejected turn 可以减少约 0.6 秒 decode，按 turn 摊销约 0.31 秒。这项收益缺少独立在线 D3 ablation。正文数字来自 paper engine mode；公开 SPORK-HTTP 通过 runtime monkey patch 实现同一 D3 机制，当前缺少与 paper path 的性能等价证据，并发隔离与版本兼容也仍受限。

### 3.4 Commit、fallback 与工具语义

Accepted path 同时要求：置信度 gate 允许提前执行，main 最终工具名与规范化参数完全匹配，工具属于允许 speculate 的只读集合。Reject path 会丢弃 speculative result，随后执行 main 的最终调用；D3 只保留 target model 验证过的 token prefix。

完整参数相同仍可能遇到时间语义差异。搜索、数据库读取或网页内容会随执行时刻变化，提前读取可能产生不同 Observation。生产集成需要为工具定义可接受时间窗口、cache policy、幂等键和审计记录。

## 4. 成本模型怎样判断是否值得 speculate

设串行 baseline 为

$$
T_{\mathrm{base}}=T_{\mathrm{dec}}+T_{\mathrm{tool}},
$$

$\alpha$ 是按 tool-call turn 统计的 strict acceptance，$t_{\mathrm{overlap}}$ 是 accepted turn 实际隐藏的工具时间，$T_{\mathrm{oh}}$ 是 rejected turn 的额外开销，$T_{\mathrm{base}}^{*}$ 是 D3 回收 token prefix 后的 miss 成本。期望延迟为

$$
\mathbb{E}[T]
=T_{\mathrm{base}}-\alpha t_{\mathrm{overlap}}
+(1-\alpha)\left(T_{\mathrm{base}}^{*}-T_{\mathrm{base}}+T_{\mathrm{oh}}\right).
$$

未启用 D3 时，精确 break-even 条件为

$$
\alpha t_{\mathrm{overlap}} \geq (1-\alpha)T_{\mathrm{oh}}.
$$

这条式子把三项设计放到同一张成本账中：

| 设计 | 改变的主要变量 | 直接作用 |
| --- | --- | --- |
| D1 | 降低 $T_{\mathrm{oh}}$ | 让 probe 更早完成，减少 miss 开销 |
| D2 | 提高 $\alpha$，同时影响 $t_{\mathrm{overlap}}$ | 延后预测提高准确率，也会缩短剩余 overlap window |
| D3 | 降低 $T_{\mathrm{base}}^{*}$ | 回收 rejected probe 的 token decode |

实际 overlap 还有一个直接上限：

$$
t_{\mathrm{overlap}}
\leq \min\left(T_{\mathrm{tool}},\ T_{\mathrm{main,remain}}\right).
$$

工具超过剩余 reasoning window 的部分仍位于关键路径。BrowseComp 的 mean tool time 为 8.92 秒，mean realized overlap 只有 1.03 秒，展示了这个饱和边界。Reasoning 过短也会使 probe 开销进入关键路径；论文在 no-think tau2 设置中报告 0.79× speedup。该点缺少独立样本数和完整配置，主要支持 reasoning 过短时可能净变慢的定性边界。

## 5. 实验结果应该怎样读

### 5.1 实验范围

- 模型：Qwen3-32B、Qwen3-4B、Qwen3.5-35B-A3B；
- 硬件：NVIDIA H20-3e 143 GiB，bf16，TP=1；
- 推理设置：temperature 0、seed 42、thinking mode；
- Serving：vLLM 0.19.1；
- 任务：GAIA、HotpotQA、tau2-bench，工具时延从亚秒级到数秒级；
- Baseline：engine 路径使用 vLLM n-gram speculative decoding，HTTP 路径使用 serial baseline。

单个 model/benchmark pair 内的 model、hardware 和 serving mode 基本对齐。跨模型主图混合 engine/HTTP、ngram/serial 以及不同的 D1/D2/D3 组合，适合展示迁移线索，无法作为统一配置的 scaling curve。

### 5.2 关键数字

| Model / benchmark | N | Baseline $P_{95}$ | SPORK $P_{95}$ | 论文报告变化 |
| --- | ---: | ---: | ---: | ---: |
| Qwen3-32B / GAIA | 165 | 131.9 s | 108.1 s | -18% |
| Qwen3-32B / HotpotQA | 200 | 约 44 s | 约 42 s | -6% |
| Qwen3-32B / tau2 | 155 | 约 138 s | 约 123 s | -10% |
| Qwen3.5-35B-A3B / HotpotQA | 200 | 18.9 s | 15.2 s | -20% |
| Qwen3.5-35B-A3B / tau2 | 155 | 59.4 s | 49.8 s | -16% |

Qwen3-4B 的 GAIA aggregate speedup 只有约 1.03×，HotpotQA 基本持平；tau2 的 mean latency 从 21.2 秒降至 18.5 秒，约 1.15×。快速模型留下的 reasoning window 更短，因而更接近 break-even。

论文报告所有已测设置的 aggregate accuracy 降幅均在 1 percentage point 内。真实搜索 API 与 serving batching 会产生 nondeterminism，这项结果支持聚合质量大体持平；逐轨迹、逐 token 等价仍未建立。

### 5.3 Tool latency 与接受率怎样影响收益

Tau2 controlled sweep 中，完整 D1+D2+D3 从 0.5 秒工具 floor 的约 1.09×，上升到 5 秒时的约 1.18×。趋势与成本模型一致：工具足够慢时可隐藏时间增加，随后受 remaining decode 限制而饱和。

同模型 probe 也展示了接受率的价值。独立 Qwen3-4B probe 在 tau2 更快，延迟为 0.315 秒，而 self probe 为 0.970 秒；self 的完整参数一致率更高，tau2 为 0.792 vs. 0.590，HotpotQA 为 0.296 vs. 0.161，GAIA 为 0.109 vs. 0.056。Tau2 的 wasted tools 为 154 vs. 317。

当 probe 已经能在 tool floor 前完成，提高 $\alpha$ 可能比继续压缩 probe latency 更重要。Cross-model arm 使用一张额外 GPU；同模型 probe 在高并发下的资源竞争仍需独立测量。

## 6. SPORK 与已有系统的关系

| 系统 | 暴露给 runtime 的信号 | 主要优化粒度 | SPORK 的位置 |
| --- | --- | --- | --- |
| [Speculative Decoding](/papers/2211.17192-fast-inference-transformers-speculative-decoding/) | draft tokens | token decode | D3 延续 target verification；D1/D2 将 speculation 扩展到工具 Action |
| [Parrot](/papers/2405.19888-parrot-semantic-variable-llm-serving/) | Semantic Variable、application DAG | LLM task | Parrot 使用显式应用语义，SPORK 使用运行中的模型状态 |
| [ThunderAgent](/papers/2602.13692-thunderagent-program-aware-agentic-inference/) | program phase、tool lifecycle、KV footprint | program/session | SPORK 提供单 turn speculative branch，可接入 program-aware scheduler |
| [DSpark](/papers/2026-06-27-dspark-confidence-scheduled-speculative-decoding/) | drafter confidence | token scheduling | SPORK 用 tool-name confidence 选择外部 Action 的 dispatch 时机 |
| [Leyline](/papers/2606.01065-leyline-kv-cache-directives-agentic-inference/) | canonical-history KV directive | 跨 turn state | SPORK branch commit 后再对 canonical history 应用 directive |

Parrot、ThunderAgent 与 SPORK 分别从应用 DAG、跨轮 program 生命周期和单轮预测分支向 runtime 暴露不同层次的语义。组合后的 runtime 需要让 main decode、probe、工具任务与跨轮恢复共享 admission budget，并把 `commit`、`reject`、`cancel` 转换为显式动态图事件。

## 7. 适用条件与证据边界

收益更容易出现在以下条件下：较长 thinking decode、数秒级只读工具、较高 strict full-call acceptance、可共享 prefix KV，以及能容纳额外 probe request 的 serving capacity。

当前证据边界包括：

1. 工具策略只覆盖 read-only speculation；write、支付、消息发送和其它非幂等操作需要隔离执行、事务、幂等键或补偿机制。
2. D1/D2 依赖 streaming、arbitrary-prefix completion、token logprobs 和跨请求 prefix cache；多数 closed-source chat API 无法直接运行。
3. D3 本身需要 engine-side 注入。论文的 `HTTP mode` 使用 stock vLLM，只运行 D1+D2；仓库的 `SPORK-HTTP` 会 monkey-patch vLLM 的 `GPUWorker` 和 drafter，可运行 D1+D2+D3，`/spork/*` 只是控制接口。它当前把 draft 写入同一个 slot，新 draft 会覆盖旧状态，因此评测端一次只能运行一个 agent request（`workers=1`，与 tensor parallel 数量无关）。默认最多保留 20 个 draft tokens，也会截短论文在 BrowseComp 中观测到的 29.5-token 平均可复用前缀。Heavy batching 还会让 probe 竞争 decode slots、KV Cache 与 memory bandwidth。
4. Training-free 只表示无需训练新增参数；controller、probe traffic、工具策略和 D3 integration 会带来系统成本。
5. Qwen3.5 原生 XML tool format 的 parse success 为 97%，fork name accuracy 只有 4.5%；改用 JSON prompting 后得到主结果，说明 tool serialization alignment 属于核心适用条件。
6. 公开仓库缺少论文使用的 GAIA internal search backend；HotpotQA 的 MediaWiki 路径与论文内部服务尚未建立实现等价性；tau2 使用 single-turn、no-user-simulator action match，不能与官方 leaderboard reward 直接比较。
7. Baseline 包含 serial、vLLM n-gram speculative decoding 和 4B cross-model probe；Speculative Actions、DualSpec、PASTE 等 action-level 系统缺少同硬件端到端比较。
8. 主图配置异质，统计报告缺少置信区间和系统化多 seed latency analysis；Qwen3.5 GAIA 只有 53 个样本，tau2 sweep 还存在 N=43 与 N=155 的记录冲突。
9. Aggregate quality 只支持总体准确率大体持平；时变 Observation 与逐轨迹等价仍缺少证据。
10. D2 的 88% precision / 100% recall 来自同一数据上的阈值选择，论文公式与公开代码的 confidence span extraction 存在差异；D3 的约 0.6 秒 rejected-turn decode recovery 来自离线估计，缺少独立在线消融。

## 8. 分享顺序

一场 10–12 分钟的分享可以沿下面的顺序推进：

1. **问题，2 分钟**：画出串行 ReAct 时间线，说明 16%–37% 的 tool wait 如何进入关键路径。
2. **观察，1 分钟**：展示 tool-name accuracy 与 argument exact 的差异，建立“工具身份先稳定”的 intuition。
3. **机制，3 分钟**：沿 Figure 6 讲 main、probe、D1/D2、tool task、strict verification 和 D3 fallback。
4. **成本模型，1 分钟**：解释 $\alpha t_{\mathrm{overlap}}$、$T_{\mathrm{oh}}$ 与 remaining decode window。
5. **证据，3 分钟**：保留 D1 的 1.6 秒到 0.35 秒、GAIA $P_{95}$ 下降 18% 和 tau2 latency sweep。
6. **边界，2 分钟**：强调只读工具、thinking mode、serving capacity、D3 engine integration 和配置异质性。

最后可以收束为三句话：

- Agent 在完整 Action 输出前，往往已经暴露下一次工具的身份。
- SPORK 用共享 prefix KV、置信度 gate 和 target verification，把这个在线信号转化为工具执行与 reasoning decode 的重叠。
- 现有证据最有力地支持慢工具、thinking mode 和 spare serving capacity；吞吐、时变读取和生产级并发仍需复验。

## 9. 常见问题

### 同一个模型怎样预测自己尚未生成的 Action？

Probe 复用 main 已经生成的 reasoning prefix，再强制加入 tool-call opener。它查询的是“从当前中间状态继续生成工具调用会得到什么”，因此可以在 main 自由生成完整 reasoning 前暴露未来 Action 候选。

### 提前执行错误工具会改变 Agent 结果吗？

论文只允许合适的只读工具进入 speculation。Main 最终调用与 probe 完整匹配时才接收预执行结果；不匹配时丢弃结果并执行 canonical call。时间敏感读取仍可能因执行时刻变化而得到不同 Observation，需要部署方单独约束。

### SPORK 与常规 speculative decoding 有什么区别？

D1/D2 在 action level 提前执行外部工具，优化 decode 与 tool execution 的串行关系；D3 在 token level 验证 rejected probe，减少 fallback 的 tool-call decode。两层机制共同出现在一个 turn 中。

### 工具越慢，收益会一直增加吗？

收益受 probe dispatch 后剩余 main decode 限制。工具超出这个窗口的部分仍位于关键路径，因此 realized overlap 会在 $T_{\mathrm{main,remain}}$ 附近饱和。

### Thinking mode 为什么有利于 SPORK？

较长 CoT 同时提供更多 early-intent 信息和更大的 overlap window。No-think 或快速 4B 模型的 main decode 较短，probe 更容易进入关键路径，论文已经观察到接近 break-even 或净变慢的设置。

### Training-free 是否意味着没有额外成本？

Training-free 省去额外 predictor 训练和第二个 checkpoint；每个 active turn 会增加 probe tokens、逻辑 request、KV pages、调度竞争和可能被丢弃的工具执行。
