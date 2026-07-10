# DeepSeek-V3.2-Exp: Boosting Long-Context Efficiency with DeepSeek Sparse Attention 论文笔记

First-Archived-At: 2026-06-24 20:36
Updated-At: 2026-06-24 20:36

## Source

- Title: DeepSeek-V3.2-Exp: Boosting Long-Context Efficiency with DeepSeek Sparse Attention
- arXiv: 无单独 arXiv 条目；后续正式 DeepSeek-V3.2 报告见 <https://arxiv.org/abs/2512.02556>
- PDF: <https://github.com/deepseek-ai/DeepSeek-V3.2-Exp/blob/main/DeepSeek_V3_2.pdf>
- Code/Project: <https://github.com/deepseek-ai/DeepSeek-V3.2-Exp>
- Model: <https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp>
- Release page: <https://api-docs.deepseek.com/news/news250929>
- Kernels: TileLang examples, DeepGEMM indexer logit kernels, FlashMLA sparse attention kernels；入口见项目 README。
- OpenReview / Review page: 未发现可可靠匹配的 OpenReview、ARR 或会议公开审稿页。
- Authors: DeepSeek-AI；contact: `research@deepseek.com`
- Submitted / Published: 2025-09-29 release；README 在 2025-11-17 记录 indexer RoPE implementation discrepancy 修复。
- Current version read: GitHub main PDF / README，访问与归档时间为 2026-06-24；PDF 共 6 页。
- Subjects: DeepSeek Sparse Attention, DSA, lightning indexer, fine-grained token selection, MLA, MQA mode of MLA, 128K context, sparse continued pre-training, long-context inference cost。

## 作者与关系

- DeepSeek-AI: DeepSeek-AI.

## 一句话结论

DSA 是 DeepSeek 把 128K MLA 模型推向细粒度稀疏注意力的一次可控架构替换：先用 dense attention 分布训练一个轻量 lightning indexer，再让主模型只对每个 query 的 top-k MLA latent KV entry 做核心注意力；在 2.1B token indexer warm-up 与 943.7B token sparse continued pre-training 后，DeepSeek-V3.2-Exp 在公开 benchmark 上基本贴近 V3.1-Terminus，同时显著降低长上下文 inference cost，但结论依赖超大规模适配预算、私有训练细节和专用 kernel 栈。

## 阅读目标与判断边界

这份笔记关注：

1. DSA 的结构本体：lightning indexer、top-k token selection、MLA/MQA 实例化。
2. DSA 的训练路径：dense warm-up、sparse training、post-training 复用、RL 配置。
3. 报告证据强度：benchmark、training curve、H800 cost figure 和未披露项。
4. 与 GLM-5、GLM-5.2、DeepSeek-V4、MiniMax-M3、Vortex、TIM / deterministic inference 的关系。

判断边界：

- 报告是 6 页技术 release，篇幅和披露细节达不到完整 peer-reviewed paper 的充分程度；很多系统、训练、数据和硬件细节停留在摘要级别。
- 公开 PDF 给出了 token 数、步数、学习率和 top-k，但没有训练卡数、拓扑、并行方式、训练 wall-clock 或 GPU hours。
- cost figure 来自 DeepSeek 自身 H800 service benchmark，图中未给出机器可读数值表；这里只记录方向性结论和披露口径。
- 评测主要是 V3.1-Terminus vs V3.2-Exp 的内部 controlled comparison；它能说明 DSA 替换后的质量保持，无法单独证明 DSA 相对所有稀疏注意力替代方案的最优性。

## 论文脉络

### 1. 研究问题、背景和价值

V3.1-Terminus 已经具备 128K context 和 MLA 的 KV cache 压缩能力，但长上下文仍会让核心 attention cost 随序列长度近似二次增长。对于 128K 甚至更长的 prompt，prefill 和 decode 的 token position 越靠后，attention cost 越高，工程瓶颈会从模型参数计算转向 attention / KV 访问路径。

DSA 处理的是一个很具体的问题：保留 DeepSeek-V3.1-Terminus 的模型能力与 MLA 结构基础，同时把每个 query 真正参与 softmax attention 的 key-value entry 数量从全量历史 tokens 降到固定 top-k。若 selector 足够准确，主模型就能在长上下文中只读取高价值历史 token。

### 2. 已有解决方案与不足

固定窗口、局部块稀疏和压缩注意力可以降低成本，但它们常把 token 是否被读取交给位置模式或粗粒度块规则。长上下文 retrieval、agent trajectory、代码仓库上下文和搜索式任务中，重要 token 可能分散在很远位置，固定模式容易漏掉稀疏但关键的证据。

线性注意力和 Lightning Attention 这类 recurrent / state-based 路线能降低长序列复杂度，但它们改变信息汇聚方式，需要额外处理与 softmax attention 的能力差异。DeepSeek 这里选择的路线更贴近原 MLA：仍然做 softmax attention，只把候选 KV entry 通过可训练 indexer 先筛到 top-k。

### 3. 作者可能的思考路径

1. 以 V3.1-Terminus 128K checkpoint 为起点，避免从零训练稀疏模型。
2. 把 dense attention 的分布当作 selector 的 teacher，让 indexer 学会哪些历史位置值得保留。
3. 在 indexer 可用后切入 sparse pattern，让主模型继续训练以适配 top-k 可见集合。
4. post-training 阶段沿用 V3.1-Terminus 的 pipeline、algorithm 和 data，把变量集中到 DSA 架构替换。
5. 用公开 benchmark、RL training curve 和 H800 service cost 曲线同时检查质量、训练稳定性和部署收益。

这条路径的核心是先学习“dense 模型实际关注什么”，再把这个关注分布转成工程上可执行的 top-k sparse attention。

### 4. 核心假设或切入点

DSA 的核心假设是：dense MLA attention 中真正影响输出的历史位置只占一小部分；一个低成本 indexer 可以近似 dense attention 的排序结构，主模型经过继续训练后能在 top-k 历史位置上恢复大部分质量。

这个假设包含三个子条件：

- selector 条件：lightning indexer 的 score 与 dense attention 的重要性排序足够一致。
- adaptation 条件：主模型能通过 sparse continued pre-training 适配被裁剪后的可见上下文。
- kernel 条件：indexer 与 sparse attention 的实际实现成本低于 dense MLA path，并且 top-k、RoPE、KV layout 等细节稳定可复现。

### 5. 方法 / 系统 / 理论框架

DSA 的推理路径可以拆成三层。

| 层次 | 做法 | 作用 |
| --- | --- | --- |
| Indexer | 对 query token `h_t` 与历史 token `h_s` 计算 index score `I_{t,s}` | 给每个 query 建立历史 token 排序 |
| Selector | 取每个 query 的 top-k index scores | 把候选 KV entry 从全历史压缩到 `k` 个 |
| Core attention | 在选出的 MLA latent KV entries `{c_s}` 上执行 attention | 保留 softmax attention 语义，同时降低主 attention 的候选规模 |

报告给出的 index score 为：

```text
I_{t,s} = sum_{j=1}^{H_I} w^I_{t,j} * ReLU(q^I_{t,j} · k^I_s)
```

其中 `H_I` 是 indexer heads 数量，`q^I` 和 `w^I` 来自 query token，`k^I` 来自历史 token。报告选择 ReLU 是出于吞吐考虑，并强调 indexer head 数少且可用 FP8 实现。

top-k 之后，attention output 为：

```text
u_t = Attn(h_t, { c_s | I_{t,s} in Top-k(I_{t,:}) })
```

这里的 `{c_s}` 是 MLA latent KV entry。DSA 在 MLA 下实例化时使用 MQA mode of MLA，因为 kernel 层希望每个 KV entry 被多个 query head 共享；这也是 DSA 能和 MLA KV 压缩结合的关键工程约束。报告 appendix 说明，V3.1-Terminus 中 MHA mode 用于 training / prefilling，MQA mode 用于 decoding；DSA 把 sparse attention 设计放到更适合共享 KV entry 的 MQA-style path。

一个重要边界是：indexer 仍需要为 query 扫描历史 token。报告明确写到 lightning indexer 的复杂度仍为 `O(L^2)`，只是它的计算量远小于 V3.1-Terminus 的 MLA core attention。主模型核心 attention 从 `O(L^2)` 降到 `O(Lk)`，其中 `k << L`。这解释了后续 GLM-5.2 的 IndexShare / IndexCache、以及 TISA 一类 follow-up 为什么继续针对 indexer bottleneck 做优化。

### 6. 训练框架

continued pre-training 由两个阶段组成，数据分布与 V3.1-Terminus 的 128K long-context extension data 对齐。

| 阶段 | 训练对象 | Attention pattern | 目标 | 关键配置 |
| --- | --- | --- | --- | --- |
| Dense warm-up | 只训练 lightning indexer；冻结主模型 | dense attention | 用 dense main attention 分布监督 indexer | LR `1e-3`；1000 steps；每步 16 条 128K sequences；合计 2.1B tokens |
| Sparse training | 训练主模型与 indexer | DSA top-k sparse attention | 主模型适配稀疏可见集合；indexer 继续对齐选中集合上的 main attention 分布 | LR `7.3e-6`；top-k = 2048 KV tokens/query；15000 steps；每步 480 条 128K sequences；合计 943.7B tokens |

Dense warm-up 的 teacher signal 来自主模型 dense attention：先把所有 attention heads 上的主 attention scores 求和，再沿 sequence dimension 做 L1 normalize，得到目标分布 `p_{t,:}`。indexer 用 KL loss 对齐：

```text
L_I = sum_t D_KL(p_{t,:} || Softmax(I_{t,:}))
```

Sparse training 只在 selected set `S_t` 上继续对齐：

```text
S_t = { s | I_{t,s} in Top-k(I_{t,:}) }
L_I = sum_t D_KL(p_{t,S_t} || Softmax(I_{t,S_t}))
```

报告中特别重要的一句是：indexer input 从 computational graph 中 detach，indexer 只由 `L_I` 训练，主模型只由 language modeling loss 优化。这使 selector learning 与 main LM adaptation 分开，降低 indexer 通过主 loss 走捷径的风险，也让 KL alignment 的含义更清楚。

### 7. Post-training 与 RL

continued pre-training 后，DeepSeek-V3.2-Exp 的 post-training 继续使用与 sparse continued pre-training 相同的 sparse attention。报告强调 post-training pipeline、algorithm 和 data 与 V3.1-Terminus 保持一致，以便隔离 DSA 的影响。

post-training 包含两部分：

| 部分 | 做法 | 说明 |
| --- | --- | --- |
| Specialist distillation | 从同一个 pre-trained DeepSeek-V3.2 base checkpoint 训练领域 specialist，再用 specialist 生成 final checkpoint 的领域数据 | 覆盖 writing、general QA、mathematics、competitive programming、logical reasoning、agentic coding、agentic search；thinking mode 与 non-thinking mode 使用不同模型产数 |
| Mixed RL | 使用 GRPO，把 reasoning、agent、human alignment 合并到一个 RL stage | reasoning / agent tasks 使用 rule-based outcome reward、length penalty、language consistency reward；general tasks 使用 per-prompt rubric 的 generative reward model |

这部分的证据主要服务于“DSA 引入后 post-training 没有明显失稳”。它没有展开 GRPO 细节，也没有给出 rollout infrastructure、KL 配置、batch size、训练卡数或 RL wall-clock。

## 关键实验/定理

### 结果 1：DSA 替换后的 benchmark 质量基本贴近 V3.1-Terminus

- 设置：DeepSeek-V3.1-Terminus vs DeepSeek-V3.2-Exp；V3.2-Exp 在 V3.1-Terminus 128K checkpoint 上通过 DSA continued training 与相同 post-training pipeline 得到。
- Baseline：DeepSeek-V3.1-Terminus。
- 指标：通用、搜索 agent、代码、代码 agent、数学 benchmark。
- 结果：多数任务持平或小幅波动；GPQA-Diamond、Humanity's Last Exam、HMMT 2025 较低，报告解释为 V3.2-Exp 生成 reasoning tokens 更少，使用 comparable token length 的 intermediate checkpoints 时差距会缩小。
- 解读：这组结果支持“DSA 可在强模型上保持可接受质量”的结论；它同时提示输出长度是混杂变量，部分 reasoning 分数降低不能直接归因于 sparse attention 本身。

| Benchmark | Metric | V3.1-Terminus | V3.2-Exp | Delta | 备注 |
| --- | --- | ---: | ---: | ---: | --- |
| MMLU-Pro | EM | 85.0 | 85.0 | 0.0 | 持平 |
| GPQA-Diamond | Pass@1 | 80.7 | 79.9 | -0.8 | 报告称与较短 reasoning tokens 相关 |
| Humanity's Last Exam | Pass@1 | 21.7 | 19.8 | -1.9 | 报告称 comparable token length checkpoint 可缩小差距 |
| BrowseComp | Acc. | 38.5 | 40.1 | +1.6 | search agent 提升 |
| BrowseComp-zh | Acc. | 45.0 | 47.9 | +2.9 | search agent 提升 |
| SimpleQA | Acc. | 96.8 | 97.1 | +0.3 | 小幅提升 |
| LiveCodeBench 2408-2505 | Pass@1 | 74.9 | 74.1 | -0.8 | 小幅下降 |
| Codeforces-Div1 | Rating | 2046 | 2121 | +75 | 提升 |
| Aider-Polyglot | Acc. | 76.1 | 74.5 | -1.6 | 下降 |
| SWE Verified | Agent mode | 68.4 | 67.8 | -0.6 | 小幅下降 |
| SWE-bench Multilingual | Agent mode | 57.8 | 57.9 | +0.1 | 持平 |
| Terminal-bench | Terminus 1 framework | 36.7 | 37.7 | +1.0 | 提升 |
| AIME 2025 | Pass@1 | 88.4 | 89.3 | +0.9 | 提升 |
| HMMT 2025 | Pass@1 | 86.1 | 83.6 | -2.5 | 报告称与较短 reasoning tokens 相关 |

### 结果 2：RL training curves 显示 sparse attention 后训练未明显失稳

- 设置：比较 V3.1-Terminus 与 V3.2-Exp 在 BrowseComp 与 SWE Verified 上的 RL training curves。
- Baseline：V3.1-Terminus。
- 指标：accuracy 与 average output tokens，训练曲线约覆盖 0 到 1400 steps。
- 结果：两个模型的 accuracy 都随训练推进而上升，曲线较接近。
- 解读：这是对 DSA post-training 稳定性的中等强度证据。它能支持“相同 RL pipeline 下 DSA 没有明显破坏训练曲线”，但缺少方差、seed、训练超参和 rollout backend 细节。

### 结果 3：长上下文 inference cost 明显下降

- 设置：实际 service 部署在 H800 GPU clusters；按 H800 租用价 2 USD / GPU hour 估算 token cost；比较 token position 0K、32K、64K、96K、128K 下的 prefill 与 decoding cost。
- Baseline：DeepSeek-V3.1-Terminus。
- 指标：Cost per million tokens。
- 结果：图 3 显示 V3.2-Exp 在长 token position 下 prefill 和 decoding cost 都明显低于 V3.1-Terminus。
- 解读：这符合复杂度分析：main core attention 从 `O(L^2)` 降到 `O(Lk)`。报告也承认 indexer 仍是 `O(L^2)`，整体收益依赖 indexer 的低常数、FP8 路径、top-k kernel 和 sparse FlashMLA 实现。

### 实验设置与 baseline 审计

数字密集项优先用表格记录，正文保留判断和边界。

| 维度 | 记录 |
| --- | --- |
| 模型与初始化 | 从 context length 已扩到 128K 的 DeepSeek-V3.1-Terminus base checkpoint 开始 continued pre-training，得到 DeepSeek-V3.2-Exp。 |
| 架构改动 | 报告称相对 V3.1-Terminus 的唯一架构改动是引入 DeepSeek Sparse Attention。DSA 由 lightning indexer 与 fine-grained token selection 组成。 |
| DSA top-k | sparse training 阶段每个 query token 选择 2048 个 key-value tokens。 |
| 数据与任务 | continued pre-training 两阶段的数据分布与 V3.1-Terminus 的 128K long-context extension data 完全对齐；具体数据来源、配比和去重策略未披露。 |
| Dense warm-up | 冻结主模型，只训练 indexer；dense attention；LR `1e-3`；1000 steps；每步 16 条 128K sequences；总计 2.1B tokens。 |
| Sparse continued pre-training | 引入 top-k sparse selection，训练主模型与 indexer；LR `7.3e-6`；15000 steps；每步 480 条 128K sequences；总计 943.7B tokens。 |
| Indexer loss | dense warm-up 在全序列上用 `D_KL(p_{t,:} || Softmax(I_{t,:}))`；sparse training 在 selected set `S_t` 上用 `D_KL(p_{t,S_t} || Softmax(I_{t,S_t}))`。 |
| Gradient / detach | sparse training 中 detach indexer input；indexer 只吃 `L_I`，主模型只吃 LM loss。 |
| Post-training | 与 V3.1-Terminus 使用相同 pipeline、algorithm、data；包括 specialist distillation 与 mixed RL。 |
| RL 配置 | 采用 GRPO；reasoning / agent tasks 使用 rule-based outcome reward、length penalty、language consistency reward；general tasks 使用 per-prompt rubric 的 generative reward model。 |
| 训练硬件与拓扑 | 未披露训练卡型、卡数、集群拓扑、interconnect、pipeline / tensor / data / expert parallel 配置。 |
| 并行方式与框架 | 报告未披露训练框架和并行策略；README inference 示例暴露 `MP` model-parallel 转换、SGLang `tp 8` / `dp 8` / `--enable-dp-attention` 启动口径，这些属于 inference/run-local surface，不能反推训练配置。 |
| Kernel / implementation | README 指向 TileLang research kernels、DeepGEMM indexer logit kernels、FlashMLA sparse attention kernels；indexer 可 FP8。 |
| 训练时间 / GPU hours / 成本 | continued pre-training token 数披露，训练 wall-clock、GPU hours 和训练成本未披露。 |
| Inference cost 口径 | H800 GPU clusters 实际 service benchmark；按 2 USD / GPU hour 估算 cost per million tokens；图中覆盖 prefill 与 decoding。 |
| 评测协议 | Benchmark table 覆盖 general、search agent、code、code agent、math；部分 benchmark 使用 agent mode 或 Terminus 1 framework。具体采样参数、pass@1 重复次数、judge 细节未披露。 |
| 统计报告 | 没有置信区间、seed、方差或显著性检验。 |
| Baseline 是否 tuned | V3.1-Terminus 是强基线；post-training pipeline 与数据对齐提高了比较可信度。 |
| Baseline 是否 compute-matched | 质量比较缺少严格 compute-matched control。V3.2-Exp 接受了 2.1B + 943.7B tokens 的 continued pre-training 适配；报告未给出同等 compute 下 V3.1-Terminus 继续训练 baseline。 |
| Baseline 是否 implementation-matched | 同源模型与同 post-training pipeline 支持 implementation alignment；DSA 需要新 indexer、top-k selector 和 sparse kernels，implementation surface 更复杂。 |
| Baseline 是否覆盖强替代方案 | 未与 MiniMax Sparse Attention、Native Sparse Attention、sliding-window / block-sparse / compressed attention、linear attention 等替代方案做同模型对照。 |
| Baseline 是否存在弱化风险 | V3.1-Terminus 是强模型，弱化风险较低；但 reasoning token length 变化会影响 GPQA/HLE/HMMT 解读。 |
| 结论边界 | 证据支持 DeepSeek 内部 V3.1-Terminus -> V3.2-Exp 的高质量 sparse retrofit；跨模型、跨硬件、跨 serving engine 的外推需要额外复验。 |

## 证据链强度评估

### 强证据

- DSA 机制、loss、top-k、训练步数、token 数、学习率和 detach 逻辑在报告中清楚披露。
- V3.1-Terminus 是同源强基线，post-training pipeline / algorithm / data 对齐，适合评估引入 DSA 的直接影响。
- 模型权重、README、inference code 入口与 kernel 入口公开，便于工程层复现和检查。

### 中等强度证据

- Benchmark table 支持整体质量基本保持，但缺少采样参数、方差和统计显著性。
- RL training curves 支持训练稳定性，但只有两项任务曲线，缺少 full RL 配置与多 seed。
- H800 cost figure 支持长上下文成本下降，但没有机器可读成本表和端到端 serving 配置细节。

### 需要谨慎的推论

- DSA 质量保持很可能需要 943.7B token 级别的 sparse adaptation；更准确的理解是“先用 dense path 监督 selector，再用大规模 continued pre-training 让主模型适配 sparse path”。
- indexer 仍然扫描历史 token；长 context 下的最终瓶颈可能转移到 indexer logit、top-k、KV gather 和 sparse attention kernel。
- README 2025-11-17 记录 indexer RoPE layout bug，说明 DSA 对 RoPE layout、MLA layout 和 indexer path 一致性非常敏感。
- 报告没有训练卡数、并行方式、训练成本和数据组成，无法做独立 compute accounting。

## OpenReview / 审稿意见吸收

- Venue status: GitHub / Hugging Face release 技术报告；无独立会议投稿状态。
- Public reviews: 未发现可匹配的 OpenReview、ARR 或会议公开审稿页。
- Ratings / confidence: 无。
- Reviewer consensus: 无。
- Main criticisms: 无公开审稿意见；从报告本身和后续工作看，主要开放问题是 indexer bottleneck、top-k consistency、实现一致性和真实长上下文场景覆盖。
- Author response: 无公开审稿回应；README 2025-11-17 对 indexer RoPE discrepancy 做了工程修复说明。
- 对可信度的影响: 机制和训练数字可信度较高，因为来自官方技术报告；性能与成本结论需要按内部 benchmark 证据处理，外部独立复现仍不足。

## 本地讨论补充

### 1. 讨论收敛点

- DSA 的全称是 DeepSeek Sparse Attention，由 DeepSeek 在 DeepSeek-V3.2-Exp 技术报告中提出；GLM-5 报告中的 DSA 是采用和适配。
- DSA 的“sparse”发生在 core attention 的 KV 候选集合上：每个 query 先由 lightning indexer 对历史 token 打分，再只取 top-k MLA latent KV entries 执行 attention。
- DSA 与 MiniMax-M3 的 MSA 有相似训练语言：二者都用 trainable selector / index branch 与 KL alignment 处理 sparse softmax attention；DSA 是 token-level MLA latent selection，MSA 是 GQA-based block sparse selection。
- DSA 和 TIM / deterministic inference 的关系在工程层：top-k selector、RoPE layout、kernel path、batch / prefill / decode mode 差异会影响同一个 prompt 的 logprob 或生成轨迹；进入 RL rollout 后，这些差异需要用 train-rollout consistency 语言审计。

### 2. 修正后的理解

- DSA 的效率收益主要来自“核心 attention 候选数下降”。indexer 仍有 `O(L^2)` 描述，但常数和精度路径更轻，整体成本收益依赖 indexer 与 sparse kernel 的工程实现。
- DSA 的训练流程分成 warm-up 与 sparse adaptation 两段。dense warm-up 先训练 selector，sparse training 再让主模型适配；943.7B token 适配预算是技术结论的重要前提。
- GLM-5.2 的 IndexShare / IndexCache 可以看作 DSA 采用方对 indexer 成本与一致性问题的后续工程回应。

### 3. 后续复验指标

- indexer top-k recall：top-k set 对 dense attention mass 的覆盖率，按层、head、token position、task 类型分解。
- long-context quality vs cost frontier：固定输出长度和采样参数，比较 DSA、MSA、CSA/HCA、sliding-window、linear attention。
- rollout/trainer consistency：同 prompt、同 seed、同 temperature 下，indexer top-k set、selected KV ids、logprob、sampled token 是否跨 engine / batch size / prefill chunk 保持一致。
- indexer bottleneck：在 128K、256K、1M context 下分解 indexer logit、top-k、KV gather、sparse attention、MoE 和 sampling 成本。

## 主要启发

- 可训练稀疏注意力的关键在于同时设计 sparse kernel、selector teacher signal 和主模型 sparse pattern 适配预算。
- 对已有 dense/MLA 模型做 sparse retrofit 时，dense warm-up + sparse adaptation 是更稳妥的路径；selector 与主模型 loss 分离能让机制更容易诊断。
- 对长上下文模型，性能表必须和 cost table 同时读。V3.2-Exp 的价值主要在“质量基本保持 + 长位置 token 成本下降”这个组合。
- DSA 把后续研究问题从“如何做 sparse attention”推进到“如何让 selector 更便宜、更稳定、更可复现”，这直接连接 GLM-5.2 IndexShare、Vortex sparse serving、TIM / deterministic inference。

## 局限

1. 报告没有披露训练硬件、卡数、并行方式、训练 wall-clock、GPU hours 和数据组成；训练成本无法独立核算。
2. 质量对照缺少 compute-matched continued training baseline，也缺少与其他 sparse / linear / compressed attention 路线的同模型对照。
3. H800 cost figure 没有机器可读数值和完整 serving 配置，外部用户很难复现相同 cost curve。
4. reasoning benchmark 受 output token length 影响，GPQA/HLE/HMMT 的差距需要用长度控制实验解释。
5. indexer RoPE discrepancy 说明 DSA 的实现 surface 较复杂；RoPE layout、MLA mode、top-k selector、sparse kernel 任一处不一致都可能影响质量。

## 跨论文关系

- 与已有论文的作者关系：该报告只署名 DeepSeek-AI，无法确认个人作者重叠；机构层面连接 DeepSeek-V2/V3/R1/V4。
- 与已有论文的主题关系：[DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/) 提供 MLA 基础，[DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/) 提供大规模 MoE / FP8 / DualPipe 系统背景，[DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/) 提供 GRPO 与 reasoning RL 语境，[DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 在 million-token context 中继续发展 compressed sparse / heavily compressed attention。
- 与已有论文的方法或系统关系：[GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) 明确采用 DSA，并报告 20B token sparse attention adaptation；[GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/) 用 IndexShare / IndexCache 处理 DSA indexer 成本与 serving 复用；[MiniMax Sparse Attention](/papers/2606.13392-minimax-sparse-attention-m3/) 是另一条 trainable sparse softmax attention 路线；[Vortex](/papers/2606.06453-vortex-sparse-attention-serving/) 处理 sparse attention serving 程序化执行；[TIM](/papers/2605.14220-training-inference-mismatch-llm-rl/) 与 [batch-invariant inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 提供实现一致性审计语言。
- 跨论文关系定位：DeepSeek sparse attention / DSA 节点；DeepSeek efficient sparse architecture 系谱；GLM-5 / GLM-5.2 DSA 采用关系；MiniMax-M3 / DSA sparse attention 对照；Vortex / TIM long-context serving 与 consistency 关系。

## Reference Intake Brief

### Target

- Intended target system: 新增论文笔记；更新索引行和 DeepSeek / DSA / sparse attention 关系章节。
- Existing related assets: `content/utility/papers-index.md`；[DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)、[DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/)、[DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/)、[DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)、[GLM-5](/papers/2602.15763-glm-5-agentic-engineering/)、[GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/)、[MiniMax-M3](/papers/2606.13392-minimax-sparse-attention-m3/)、[Vortex](/papers/2606.06453-vortex-sparse-attention-serving/)。
- Proposed form: 新建独立 Markdown 文档；同步更新索引行和对应论文的关系章节。

### Reusable Elements

1. DSA 机制拆解：lightning indexer + top-k token selection + MLA/MQA instantiation。
2. 训练审计表：dense warm-up 2.1B tokens、sparse training 943.7B tokens、top-k 2048、post-training GRPO。
3. 跨论文关系：DeepSeek original DSA -> GLM-5 adoption -> GLM-5.2 IndexShare / IndexCache -> DeepSeek-V4 CSA/HCA -> MiniMax-M3 sparse attention 对照。

### Risks

- Copyright/over-copying: 仅保留公式、数字与短语级技术名词，正文为本地分析和转述。
- Unsourced or unverifiable claims: 训练硬件、并行方式、数据组成、训练时间均标注未披露；cost figure 只做方向性解读。
- Tone/brand mismatch: 避免把 release 文案直接当作 peer-reviewed claim；显式区分官方报告、内部 benchmark 和本地推论。
- Safety/compliance issues: 无直接双用途安全操作细节；内容聚焦模型效率、训练和评测。
- Overlap with existing assets: 与 GLM-5 / DeepSeek-V4 / MiniMax-M3 的 DSA 相关内容存在主题重叠，本条作为上游原始报告节点，由对应论文的关系章节说明差异。

### Skipped

| Material | Reason |
| --- | --- |
| 公开 reviewer comments | 未发现 OpenReview/ARR/会议公开审稿页，或无法可靠匹配到当前报告版本。 |
| 训练 GPU hours / wall-clock | 报告未披露，无法可靠推算。 |
| 训练并行方式 | README 只给出 inference / local run surface，不能反推训练并行配置。 |
| cost figure 精确数值 | PDF 图像没有机器可读数值表，避免从图片强行读数。 |

### Recommendation

Decision: merge

Why: DSA 是 GLM-5、GLM-5.2 和 DeepSeek-V4 sparse attention 讨论的关键上游节点；报告给出机制、训练 token 数、top-k、loss 和 cost 方向，足以进入 `当前收录`。本笔记继续保留“训练与系统细节未披露”的边界，避免把 release 证据读成完整论文证据。
