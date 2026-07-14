# DeepSeek-V3.2-Exp: Boosting Long-Context Efficiency with DeepSeek Sparse Attention 论文笔记

First-Archived-At: 2026-06-24 20:36
Updated-At: 2026-07-14 09:42

## Source

- Workflow version: v2
- Material type: technical-report
- Canonical source: <https://github.com/deepseek-ai/DeepSeek-V3.2-Exp>
- Title: DeepSeek-V3.2-Exp: Boosting Long-Context Efficiency with DeepSeek Sparse Attention
- Authors: DeepSeek-AI
- Responsible organization: DeepSeek-AI
- arXiv: 无单独 arXiv 条目；后续正式 DeepSeek-V3.2 报告见 <https://arxiv.org/abs/2512.02556>
- PDF: <https://github.com/deepseek-ai/DeepSeek-V3.2-Exp/blob/87e509a2e5a100d221c97df52c6e8be7835f0057/DeepSeek_V3_2.pdf>
- Code/Project: <https://github.com/deepseek-ai/DeepSeek-V3.2-Exp/tree/87e509a2e5a100d221c97df52c6e8be7835f0057>
- Model: <https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp>
- Release page: <https://api-docs.deepseek.com/news/news250929>
- Supplemental source: 后续正式报告 [DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models](https://arxiv.org/html/2512.02556v1)，其 Section 2 明确说明 V3.2 与 V3.2-Exp 使用相同 DSA 架构，并补充 parity evaluation。
- Kernels: [TileLang examples](https://github.com/tile-ai/tilelang/tree/main/examples/deepseek_v32)、[DeepGEMM indexer logit kernels](https://github.com/deepseek-ai/DeepGEMM/pull/200)、[FlashMLA sparse attention kernels](https://github.com/deepseek-ai/FlashMLA/pull/98)。
- OpenReview / Review page: 未发现可可靠匹配的 OpenReview、ARR 或会议公开审稿页。
- Contact: `research@deepseek.com`
- Published / updated: 2025-09-29 release；README 在 2025-11-17 记录 indexer RoPE implementation discrepancy 修复。
- Current version read: 2025-09-29 六页官方 PDF、README、官方 inference demo，以及 2025-12-02 的后续正式报告 v1。
- Version / revision read: project `main@87e509a2e5a100d221c97df52c6e8be7835f0057`，该 commit 包含 2025-11-17 RoPE 修复说明；arXiv `2512.02556v1`。
- Accessed: 2026-07-13
- Subjects: DeepSeek Sparse Attention, DSA, lightning indexer, fine-grained token selection, MLA, MQA mode of MLA, 128K context, sparse continued pre-training, long-context inference cost。

## 作者与关系

- DeepSeek-AI: DeepSeek-AI。

2025-09-29 技术报告只署名机构。2025-12-02 的完整 DeepSeek-V3.2 报告公开了团队作者列表，这份后续名单无法支持把 V3.2-Exp 中的具体 DSA 设计归因给某位个人。

## 一句话结论

DSA 把可训练 token selector 接入 128K MLA：每个 Transformer 层用独立 lightning indexer 为每个 query 选择最多 2048 个 causal MLA latent KV entries，同一层的 128 个 query heads 共享这组 token positions；2.1B token dense warm-up 蒸馏主 attention 分布，随后用 943.7B token sparse continued pre-training 让主模型适配稀疏可见集合。它把 core attention 的全序列复杂度从 $O(L^2)$ 降到 $O(Lk)$，indexer 仍为 $O(L^2)$；公开结果支持 DeepSeek-V3.1-Terminus 到 V3.2-Exp 这条迁移路线在 128K benchmark 上基本保持质量并降低长位置推理成本，结论范围受超大适配预算、未披露训练资源和专用 kernel 栈约束。

## 阅读目标与判断边界

这份笔记关注：

1. DSA 的结构本体：lightning indexer、top-k token selection、MLA/MQA 实例化。
2. DSA 的训练路径：dense warm-up、sparse training、post-training 复用、RL 配置。
3. 报告证据强度：benchmark、training curve、H800 cost figure 和未披露项。
4. 与 GLM-5、GLM-5.2、DeepSeek-V4、MiniMax-M3、Vortex、TIM / deterministic inference 的关系。

判断边界：

- 核心证据来自 2025-09-29 的 6 页技术报告；2025-12-02 正式报告只用于核验“架构相同”和补充后续 parity evidence，后续模型结果不会回填成 9 月 release 当时已经完成的证据。
- 这份材料属于机构技术 release，没有同行评审；很多系统、训练、数据和硬件细节停留在摘要级别。
- 公开 PDF 给出了 token 数、步数、学习率和 top-k，但没有训练卡数、拓扑、并行方式、训练 wall-clock 或 GPU hours。
- 官方 inference demo 可以核对 selector shape、mask broadcasting、每层 indexer 和 RoPE layout；它是可读参考实现，生产成本还依赖 DeepGEMM、FlashMLA、TileLang 与未完整公开的 serving 配置。
- cost figure 来自 DeepSeek 自身 H800 service benchmark，原报告没有机器可读数值表；这里保留曲线和方向性解读，不从图像反推精确吞吐。
- 评测主要是 V3.1-Terminus vs V3.2-Exp 的内部 controlled comparison；它能说明 DSA 替换后的质量保持，无法单独证明 DSA 相对所有稀疏注意力替代方案的最优性。

证据写法：

- 论文事实：2025-09-29 PDF 的公式、表格、图和官方代码直接给出的结构、配置与结果。
- 作者主张：报告对“质量保持”“训练稳定”和“端到端加速”的归因。
- 本地分析：层内共享与跨层独立的实现解释、训练目标盲区、复杂度边界和跨论文比较。

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

#### 5.1 Indexer、selector 与 selected softmax

DSA 在每个 attention 层执行三步：lightning indexer 为 causal positions 打分，selector 取 top-k token positions，core attention 在这组位置上重新做 softmax。报告省略了层下标；为了说明跨层语义，这里把第 $\ell$ 层写成：

$$
I_{t,s}^{(\ell)}=
\sum_{j=1}^{H_I}w_{t,j}^{I,(\ell)}
\operatorname{ReLU}\!\left(
\mathbf q_{t,j}^{I,(\ell)}\cdot
\mathbf k_s^{I,(\ell)}
\right).
$$

$$
\mathcal S_t^{(\ell)}=
\operatorname{TopK}_{s\le t}\!\left(I_{t,s}^{(\ell)}, k\right),
\qquad
\mathbf u_t^{(\ell)}=
\operatorname{Attn}\!\left(
\mathbf h_t^{(\ell)},
\{\mathbf c_s^{(\ell)}:s\in\mathcal S_t^{(\ell)}\}
\right).
$$

| 层次 | 实际对象 | 结果 |
| --- | --- | --- |
| Lightning indexer | query token 与每个 causal token position 的轻量相似度 | 当前位置及历史位置各得到一个标量 $I_{t,s}^{(\ell)}$ |
| Top-k selector | 对位置维度排序 | 每层、每个 query 得到 $k=2048$ 个 token positions |
| Core attention | 当前层对应位置的 MLA latent KV entries | 在 selected set 内重新归一化 softmax，集合外位置的 attention weight 为 0 |

官方配置给出 64 个 indexer heads、128 维 index head 和 `index_topk=2048`。多个 indexer heads 在 ReLU 后通过 query-dependent 权重汇成一个位置分数，因此它们用于形成一组候选位置，没有为 128 个 core attention heads 分别产生 128 组 top-k。

Reference code 实际执行 `min(index_topk, end_pos)`：当当前位置之前可见 token 少于 2048 时，所有 causal positions 都进入 core attention；序列超过该阈值后才形成固定上限的稀疏集合。

证据定位：2025-09-29 PDF Section 1，Equations 1-2，Figure 1；官方代码 `inference/config_671B_v3.2.json` 与 `inference/model.py -> Indexer.forward`，快照 `87e509a`。

![Figure 1: DSA instantiated under MLA](/images/papers/2025-09-29-deepseek-v3-2-exp-dsa-long-context-efficiency/fig-1-dsa-architecture.png)

Figure 1: DSA 在 MLA 下的 attention architecture。绿色路径由 lightning indexer 生成 top-k token positions，灰色 core attention 只读取选中的 latent KV entries。Image Source: [DeepSeek-V3.2 arXiv HTML Figure 2](https://arxiv.org/html/2512.02556v1/x2.png)；后续报告明确说明其 DSA architecture 与 V3.2-Exp 相同。

#### 5.2 “共享 top-k”具体共享什么

共享范围需要按层区分：

- **同一层、同一 query token**：indexer 返回的 `topk_indices` 没有 core attention head 维度。代码把同一个 index mask broadcast 到该层 128 个 query heads，因此这些 heads 访问相同的 token positions。
- **不同 Transformer 层**：每个 `Block` 创建自己的 `MLA`，每个 `MLA` 再创建自己的 `Indexer`、`kv_cache` 与 `pe_cache`。所以 $\mathcal S_t^{(\ell)}$ 与 $\mathcal S_t^{(m)}$ 可以不同，selector 参数和当前层 KV 也彼此独立。
- **相同 token position 被多层选中时**：第 $\ell$ 层读取 $\mathbf c_s^{(\ell)}$，第 $m$ 层读取 $\mathbf c_s^{(m)}$。共享的是序列位置编号 $s$，各层没有共享同一份 KV tensor。

一个直观表示是：

$$
\begin{aligned}
\text{Layer }\ell &: \mathcal S_t^{(\ell)}=\{2,17,42,\ldots\},
& \text{all heads read }\{\mathbf c_2^{(\ell)},\mathbf c_{17}^{(\ell)},\mathbf c_{42}^{(\ell)},\ldots\};\\
\text{Layer }m &: \mathcal S_t^{(m)}=\{5,17,81,\ldots\},
& \text{all heads read }\{\mathbf c_5^{(m)},\mathbf c_{17}^{(m)},\mathbf c_{81}^{(m)},\ldots\}.
\end{aligned}
$$

位置 17 同时出现只说明两层都认为该历史 token 相关。两层使用各自经过层变换后的 latent KV 表示。后续 FlashMemory 为物理 KV residency 构造跨代表层的 union mask，属于 serving memory policy；V3.2-Exp 的原始 DSA 本身没有把各层 top-k 合并成全局 attention set。

证据定位：官方代码 `inference/model.py -> Indexer.forward` 的 `topk_indices`、`MLA.forward` 的 `index_mask.unsqueeze(2)`，以及 `Block.__init__` / `Transformer.__init__` 的逐层实例化，快照 `87e509a`。

#### 5.3 MQA mode 与 masked MHA prefill

MLA 的 MHA mode 与 MQA mode 是同一组 MLA 参数的两种等价计算路径。DSA 把选择单元定义为 latent KV entry：一个历史位置的 latent vector 被当前 query token 的所有 query heads 共享，因此 selector 只需返回一组 positions。

- Decode reference path 采用 MQA mode：把 MLA up-projection 权重吸收到 query/output 侧，直接对 latent KV cache 做 attention。
- Prefill reference path 会先展开 head-specific K/V，以 masked MHA 形式执行；同一 `index_mask` 仍广播给全部 heads，所以逻辑可见集合保持一致。
- 原报告进一步说明，短序列 prefill 使用 masked MHA 来模拟 DSA，以取得更适合短 context 的 kernel 效率。

因此，MQA mode 描述的是层内 latent KV entry 如何被多个 query heads 共享，以及 core attention 如何重写计算。它不表示不同 Transformer 层共享 selector、top-k set 或 KV cache。

证据定位：2025-09-29 PDF Section 1、Appendix A、Figure 4；Section 3 `Inference Costs`；官方代码 `MLA.forward` 的 `MHA prefill` / `MQA decode` 两条分支。

#### 5.4 复杂度与真实执行成本

对长度为 $L$ 的整段序列，作者把 dense core attention 写成 $O(L^2)$，DSA core attention 写成 $O(Lk)$。这个降阶只覆盖选中 KV 后的主 attention。lightning indexer 仍需比较 query 与历史位置，整段复杂度为 $O(L^2)$，只是 index head 数、维度、数值精度和算子常数更小。

端到端路径更接近：

$$
T_{\mathrm{DSA}}=
T_{\mathrm{index}}
+T_{\mathrm{topk}}
+T_{\mathrm{gather}}
+T_{\mathrm{sparse\ attn}}
+T_{\mathrm{other\ model}}.
$$

Indexer 的打分原语确实仍是 query-key 点积，并且每个 query 都要扫描全部 $S$ 个历史位置。节省来自两种点积后续承载的工作量不同：indexer 只需生成每个位置的一个排序分数，推理时直接做 top-k；core attention 还要让 128 个 attention heads 计算主 QK score、执行 softmax、读取 value / latent KV 并完成加权聚合。令 $c_{\mathrm{index}}$ 表示 indexer 扫描一个历史位置的成本，$c_{\mathrm{core}}$ 表示 dense core attention 处理一个位置的成本，则当 $S>k$ 时，单个 decode query 的 attention 路径可近似写成：

$$
T_{\mathrm{dense}}(S)\approx S c_{\mathrm{core}},
\qquad
T_{\mathrm{DSA}}(S)\approx S c_{\mathrm{index}}+T_{\mathrm{topk+gather}}+k c_{\mathrm{core}}.
$$

因此，收益条件更准确地写成：

$$
S(c_{\mathrm{core}}-c_{\mathrm{index}})
>
k c_{\mathrm{core}}+T_{\mathrm{topk+gather}}.
$$

官方配置可以提供一个 MHA-style 的直观量级：dense core 的每个历史位置约包含 $128\times(128+64)=24576$ 个 QK 乘加项，以及 $128\times128=16384$ 个 value 聚合乘加项；indexer 约包含 $64\times128=8192$ 个打分乘加项，再把 64 个 index heads 聚合为一个位置分数。这个估算忽略了 MLA/MQA 重写、FP8、访存、softmax、top-k 与 kernel 融合，只用于说明 $c_{\mathrm{index}}<c_{\mathrm{core}}$ 的来源，不能替代 latency 测量。最后一个 query 位于 128K context 时，$k/S=2048/131072=1/64$，昂贵的 core attention 只处理约 1.56% 的历史位置；indexer 仍处理全部位置。

官方 `model.py` 是语义参考实现，其中可见先形成 dense core scores、再应用 `index_mask` 的写法。生产收益需要 DeepGEMM indexer kernel 与 FlashMLA sparse attention kernel 在物理执行上只对 selected KV 完成 core attention；若执行引擎仍先算完整 core scores 再 mask，主要计算节省不会兑现。

所以 $O(L^2)\rightarrow O(Lk)$ 是 core attention 的优化目标，不能直接当成整个模型的复杂度。真实收益取决于 FP8 indexer、top-k、KV layout、sparse FlashMLA kernel、batching 和通信；上下文越长，省下的 dense core attention 越容易覆盖 selector 的固定与二次扫描成本。这也解释了后续 GLM-5.2 的 IndexShare / IndexCache 为什么继续压低 indexer 开销。

证据定位：2025-09-29 PDF Section 3 `Inference Costs`；官方配置 `inference/config_671B_v3.2.json`；官方代码 `inference/model.py -> Indexer.forward / MLA.forward`；官方 README 的 TileLang、DeepGEMM 和 FlashMLA kernel 入口，快照 `87e509a`。

### 6. 训练框架

continued pre-training 由两个阶段组成，数据分布与 V3.1-Terminus 的 128K long-context extension data 对齐。

| 阶段 | 训练对象 | Attention pattern | 目标 | 关键配置 |
| --- | --- | --- | --- | --- |
| Dense warm-up | 只训练 lightning indexer；冻结主模型 | dense attention | 用 dense main attention 分布监督 indexer | LR `1e-3`；1000 steps；每步 16 条 128K sequences；合计 2.1B tokens |
| Sparse training | 训练主模型与 indexer | DSA top-k sparse attention | 主模型适配稀疏可见集合；indexer 继续对齐选中集合上的 main attention 分布 | LR `7.3e-6`；top-k = 2048 KV tokens/query；15000 steps；每步 480 条 128K sequences；合计 943.7B tokens |

Dense warm-up 的 teacher signal 来自主模型 dense attention：先把所有 attention heads 上的主 attention scores 求和，再沿 sequence dimension 做 L1 normalize，得到目标分布 `p_{t,:}`。indexer 用 KL loss 对齐：

$$
\mathcal L^I_{\mathrm{warm}}=
\sum_t D_{\mathrm{KL}}\!\left(
p_{t,:}\;\middle\|\;\operatorname{Softmax}(I_{t,:})
\right).
$$

Sparse training 只在 selected set `S_t` 上继续对齐：

$$
\mathcal S_t=\{s:I_{t,s}\in\operatorname{TopK}(I_{t,:})\},
$$

$$
\mathcal L^I_{\mathrm{sparse}}=
\sum_t D_{\mathrm{KL}}\!\left(
p_{t,\mathcal S_t}\;\middle\|\;
\operatorname{Softmax}(I_{t,\mathcal S_t})
\right).
$$

报告中特别说明：indexer input 从 computational graph 中 detach，indexer 只由 $\mathcal L^I$ 更新，主模型只由 language modeling loss 更新。这样可以把 selector imitation 与主模型 sparse adaptation 分开诊断；LM loss 不会直接穿过不可微 top-k membership 去训练 indexer，indexer loss 也不会借输入 hidden state 改写主干表示。

公式还留下一项实现歧义。$p_{t,\mathcal S_t}$ 是完整 teacher distribution 在 selected set 上的限制，报告没有说明送入 KL 前是否再次归一化。KL 的标准定义要求两边都是归一化分布，因此实现通常需要对 selected mass 归一化，公开材料不足以确认具体处理。另一个可审计边界是：sparse stage 只在当前 top-k 集合内计算 alignment，集合外被漏掉的高 teacher-mass token 没有直接 selector gradient；dense warm-up 的初始 recall、top-k 集合稳定性和后续主模型适配因此共同决定最终质量。

证据定位：2025-09-29 PDF Section 2.1，Equations 3-4；训练配置见同节 `Dense Warm-up Stage` 与 `Sparse Training Stage`。关于归一化和集合外梯度的说明属于本地分析。

### 7. Post-training 与 RL

continued pre-training 后，DeepSeek-V3.2-Exp 的 post-training 继续使用与 sparse continued pre-training 相同的 sparse attention。报告强调 post-training pipeline、algorithm 和 data 与 V3.1-Terminus 保持一致，以便隔离 DSA 的影响。

post-training 包含两部分：

| 部分 | 做法 | 说明 |
| --- | --- | --- |
| Specialist distillation | 从同一个 sparse continued-pretrained base checkpoint 训练领域 specialist，再用 specialist 生成 final checkpoint 的领域数据 | 覆盖 writing、general QA、mathematics、competitive programming、logical reasoning、agentic coding、agentic search；thinking mode 与 non-thinking mode 使用不同模型产数 |
| Mixed RL | 使用 GRPO，把 reasoning、agent、human alignment 合并到一个 RL stage | reasoning / agent tasks 使用 rule-based outcome reward、length penalty、language consistency reward；general tasks 使用 per-prompt rubric 的 generative reward model |

这部分的证据主要服务于“DSA 引入后 post-training 没有明显失稳”。它没有展开 GRPO 细节，也没有给出 rollout infrastructure、KL 配置、batch size、训练卡数或 RL wall-clock。

证据定位：2025-09-29 PDF Section 2.2；RL 曲线见 Section 3、Figure 2。原报告明确把 pipeline、algorithm 和 data 与 V3.1-Terminus 对齐，但没有提供逐项配置表，因而“对齐”仍是作者披露口径。

### 8. 结论链条

1. Dense MLA 的历史 attention mass 若集中在少量位置，轻量 indexer 就有机会学习其排序结构。
2. Dense warm-up 先给 selector 一个全历史 teacher，避免从随机 top-k 直接进入不可微集合选择。
3. Sparse continued pre-training 让主模型在 2048-token 可见集合上重新适配；943.7B token 预算说明这次架构替换包含大规模能力恢复过程。
4. 层内共享 top-k 使每个 latent KV entry 能同时服务 128 个 query heads，为 sparse kernel 提供可合并的工作单元；各层独立选择继续保留层级表示差异。
5. H800 service 曲线表明节省的 dense core attention 在长 token position 上超过 indexer、top-k 和 gather 成本；短上下文收益需要单独看 masked MHA 路径与交叉点。
6. 因此，报告最窄可支持的结论是：在 DeepSeek-V3.1-Terminus 的 128K checkpoint、指定训练预算和官方 kernel 栈下，DSA 可以完成高质量 sparse retrofit。现有证据还不足以给出低预算迁移、跨模型迁移或统一硬件加速比例。

## 关键实验/定理

### 结果 1：DSA 替换后的 benchmark 质量基本贴近 V3.1-Terminus

- 设置：DeepSeek-V3.1-Terminus vs DeepSeek-V3.2-Exp；V3.2-Exp 在 V3.1-Terminus 128K checkpoint 上通过 DSA continued training 与相同 post-training pipeline 得到。
- Baseline：DeepSeek-V3.1-Terminus 是同源前代强基线。
- 指标：通用、搜索 agent、代码、代码 agent、数学 benchmark。
- 结果：多数任务持平或小幅波动；GPQA-Diamond、Humanity's Last Exam、HMMT 2025 较低，报告解释为 V3.2-Exp 生成 reasoning tokens 更少，使用 comparable token length 的 intermediate checkpoints 时差距会缩小。
- 证据定位：2025-09-29 PDF Section 3、Table 1。
- 对照是否可比：初始化来源和 post-training pipeline / algorithm / data 按作者披露保持一致；V3.2-Exp 额外接受 2.1B + 943.7B token continued pre-training，缺少同等 compute 的 dense continuation control。
- 支持的最窄结论：完整训练后的 V3.2-Exp 在这组公开 benchmark 上与 V3.1-Terminus 接近。该表无法单独估计“只替换 attention、训练预算不变”时的因果效果。
- 解读：输出长度是 reasoning 结果的混杂变量。作者提到 comparable-length intermediate checkpoints 会缩小差距，但没有公开这些 checkpoint 的逐项表格，所以这项归因按作者解释保留。

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
- 证据定位：2025-09-29 PDF Section 3、Figure 2。
- 对照是否可比：两条曲线来自同系列模型与作者声称相同的 RL pipeline，任务和 step axis 对齐；报告没有给出 seed、误差带、rollout backend、batch size 或完整 GRPO 配置。
- 支持的最窄结论：在这两项任务和这次训练 run 中，DSA checkpoint 的 accuracy / output-length trajectory 没有出现肉眼可见的系统性崩溃。
- 解读：该图提供训练可行性信号，证据强度不足以推出 DSA 在任意 RL engine、top-k kernel 或随机种子下都稳定。

### 结果 3：长上下文 inference cost 明显下降

- 设置：实际 service 部署在 H800 GPU clusters；按 H800 租用价 2 USD / GPU hour 估算 token cost；比较 token position 0K、32K、64K、96K、128K 下的 prefill 与 decoding cost。
- Baseline：DeepSeek-V3.1-Terminus。
- 指标：Cost per million tokens。
- 结果：图 3 显示 V3.2-Exp 在长 token position 下的 prefill 和 decoding cost 曲线明显低于 V3.1-Terminus；短位置存在 selector / sparse path 开销与成本交叉区间，收益随 token position 增长而扩大。
- 证据定位：2025-09-29 PDF Section 3、Figure 3；官方仓库 `cost.jpg`。
- 对照是否可比：同一 H800 租价口径与同系列模型提高了内部比较可比性；报告没有披露 batch、并发、TP/DP/EP、SLO、prompt mix、输出长度、功耗或重复次数。
- 支持的最窄结论：在 DeepSeek 的 H800 service 配置与美元换算口径下，DSA 降低了 128K 长位置 token 的 GPU-time cost。图中指标不能直接替代 latency、throughput 或跨硬件成本结论。
- 解读：曲线支持“省下的 dense core attention 逐渐超过 indexer/top-k/gather 开销”。作者为短序列 prefill 另用 masked MHA path，也说明 sparse execution 需要按序列长度选择 kernel。

![Figure 2: V3.1-Terminus and V3.2-Exp inference cost by token position](/images/papers/2025-09-29-deepseek-v3-2-exp-dsa-long-context-efficiency/fig-2-inference-cost.png)

Figure 2: DeepSeek-V3.1-Terminus 与 DeepSeek-V3.2-Exp 在 H800 clusters 上的 prefilling / decoding cost。纵轴按 2 USD / GPU hour 换算为每百万 token 成本；该图展示作者 service 配置下的成本曲线。Image Source: [official repository `cost.jpg` at `87e509a`](https://github.com/deepseek-ai/DeepSeek-V3.2-Exp/blob/87e509a2e5a100d221c97df52c6e8be7835f0057/cost.jpg).

### 结果 4：后续公开评测没有显示明显长上下文回退

- 设置：2025-12 的正式 DeepSeek-V3.2 报告回顾 V3.2-Exp release，补充 2025-11-10 ChatbotArena Elo、Artificial Analysis Long Context Reasoning（AA-LCR）和 Fiction.liveBench。
- Baseline：DeepSeek-V3.1-Terminus。
- 指标：ChatbotArena Elo 和两项第三方 long-context evaluation。
- 结果：报告称两代模型 ChatbotArena Elo 接近；V3.2-Exp 在 AA-LCR reasoning mode 高 4 分，并在 Fiction.liveBench 多项指标上领先。
- 证据定位：DeepSeek-V3.2 arXiv v1 Section 2.2 `Parity Evaluation`。
- 对照是否可比：这些评测发生在 release 后并使用此前未见测试集，能减少原报告内部 benchmark 的同源性；正式报告只给摘要式描述，没有完整复现实验设置、逐项表格或不确定性。
- 支持的最窄结论：截至 2025-11，选取的外部公开评测没有暴露 V3.2-Exp 相对 V3.1-Terminus 的明显长上下文退化。这项后验观察无法证明所有 long-context workload 都保持质量。
- 解读：后续证据提高了“DSA retrofit 没有系统性破坏长上下文能力”的可信度，同时仍需要 selector recall、层级失败案例和统一 harness 下的直接测量。

### 实验设置与 baseline 审计

数字密集项优先用表格记录，正文保留判断和边界。

| 维度 | 记录 |
| --- | --- |
| 模型与初始化 | 从 context length 已扩到 128K 的 DeepSeek-V3.1-Terminus base checkpoint 开始 continued pre-training，得到 DeepSeek-V3.2-Exp。 |
| 架构改动 | 报告称相对 V3.1-Terminus 的唯一架构改动是引入 DeepSeek Sparse Attention。DSA 由 lightning indexer 与 fine-grained token selection 组成。 |
| DSA top-k | 每个 attention 层、每个 query token 最多选择 2048 个 token positions；可见长度不超过 2048 时保留全部 causal positions。该层 128 个 query heads 共享 positions，不同层独立选择并读取各自 latent KV。 |
| Indexer architecture | 官方配置为 64 index heads、head dimension 128；各层独立实例化 `Indexer`。index heads 聚合成每个历史位置一个 scalar score。 |
| 数据与任务 | continued pre-training 两阶段的数据分布与 V3.1-Terminus 的 128K long-context extension data 完全对齐；具体数据来源、配比和去重策略未披露。 |
| Dense warm-up | 冻结主模型，只训练 indexer；dense attention；LR `1e-3`；1000 steps；每步 16 条 128K sequences；总计 2.1B tokens。 |
| Sparse continued pre-training | 引入 top-k sparse selection，训练主模型与 indexer；LR `7.3e-6`；15000 steps；每步 480 条 128K sequences；总计 943.7B tokens。 |
| Indexer loss | dense warm-up 在全序列上用 $D_{\mathrm{KL}}(p_{t,:}\|\operatorname{Softmax}(I_{t,:}))$；sparse training 在 selected set $\mathcal S_t$ 上计算 KL。报告未说明 $p_{t,\mathcal S_t}$ 是否重新归一化。 |
| Gradient / detach | sparse training 中 detach indexer input；indexer 只吃 `L_I`，主模型只吃 LM loss。 |
| Post-training | 与 V3.1-Terminus 使用相同 pipeline、algorithm、data；包括 specialist distillation 与 mixed RL。 |
| RL 配置 | 采用 GRPO；reasoning / agent tasks 使用 rule-based outcome reward、length penalty、language consistency reward；general tasks 使用 per-prompt rubric 的 generative reward model。 |
| 训练硬件与拓扑 | 未披露训练卡型、卡数、集群拓扑、interconnect、pipeline / tensor / data / expert parallel 配置。 |
| 并行方式与框架 | 报告未披露训练框架和并行策略；README inference 示例暴露 `MP` model-parallel 转换、SGLang `tp 8` / `dp 8` / `--enable-dp-attention` 启动口径，这些属于 inference/run-local surface，不能反推训练配置。 |
| 框架基座 / paper base | 模型基座是 DeepSeek-V3.1-Terminus 128K MLA checkpoint；训练框架未披露；公开 inference demo 是 custom PyTorch reference path，生产 kernel 入口包括 DeepGEMM、FlashMLA 和 TileLang。 |
| 框架版本与证据来源 | project `main@87e509a`；官方 PDF、README、`inference/model.py`、`config_671B_v3.2.json`；生产 serving engine 和 kernel release 组合没有形成单一可复现版本清单。 |
| 框架改动范围 | 模型层新增 per-layer indexer、top-k mask 与 sparse core attention；reference code 同时实现 masked MHA prefill 和 MQA decode；生产路径新增 indexer logit、paged variant 和 sparse FlashMLA kernel。 |
| Kernel / implementation | indexer 支持 FP8；reference code 显示 64-head indexer、layer-local caches、head-shared mask 和非交错 indexer RoPE。README 指向高性能 kernel，但没有公开完整 production scheduler / serving configuration。 |
| 训练时间 / GPU hours / 成本 | continued pre-training token 数披露，训练 wall-clock、GPU hours 和训练成本未披露。 |
| Inference cost 口径 | H800 GPU clusters 实际 service benchmark；按 2 USD / GPU hour 估算 cost per million tokens；图中覆盖 prefill 与 decoding。该指标是 GPU-time 的美元代理，无法直接给出 latency、throughput 或能耗。 |
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
- 官方 reference code 直接显示 per-layer indexer、head-shared top-k mask、layer-local KV cache、masked MHA prefill、MQA decode 和 indexer 非交错 RoPE，可用于核对逻辑语义。
- 模型权重、配置和 kernel 入口公开，能够复查 `index_n_heads=64`、`index_head_dim=128`、`index_topk=2048` 及关键算子边界。

### 中等强度证据

- V3.1-Terminus 是同源强基线，benchmark table 支持完整迁移 pipeline 后整体质量基本保持；额外 945.8B continued-training tokens 和缺少 compute-matched dense control 限制了架构因果归因。
- RL training curves 支持训练稳定性，但只有两项任务曲线，缺少 full RL 配置与多 seed。
- H800 cost figure 支持长上下文成本下降，但没有机器可读成本表和端到端 serving 配置细节。
- 2025-12 正式报告补充 ChatbotArena 与两项 release 后 long-context evaluation，方向与原报告一致；复现实验设置与逐项结果仍不完整。

### 需要谨慎的推论

- 943.7B sparse adaptation 是这次成功迁移使用的预算，报告没有做 budget ablation，因此它提供充分条件的实例，不构成必要预算下界。GLM-5 后续报告的更小适配预算也提示预算需求会随 checkpoint、数据和训练 recipe 变化。
- Sparse-stage KL 只写到当前 selected set，报告未披露 restricted teacher mass 的归一化方式；集合外 token 缺少直接 selector gradient，dense warm-up recall 和 top-k 稳定性具有关键作用。
- indexer 仍然扫描历史 token；长 context 下的最终瓶颈可能转移到 indexer logit、top-k、KV gather 和 sparse attention kernel。
- README 2025-11-17 记录 indexer RoPE layout bug，说明 DSA 对 RoPE layout、MLA layout 和 indexer path 一致性非常敏感。
- 报告没有训练卡数、并行方式、训练成本和数据组成，无法做独立 compute accounting。

## OpenReview / 审稿意见吸收

- Page type: not-found
- Match confidence: high
- Observed at: 2026-07-13
- Venue status: GitHub / Hugging Face release 技术报告；无独立会议投稿状态。
- Public reviews: 未发现可匹配的 OpenReview、ARR 或会议公开审稿页。
- Ratings / confidence: 无。
- Reviewer consensus: 无。
- Main criticisms: 不适用；本地证据审计识别出的开放问题包括 indexer bottleneck、top-k consistency、实现一致性和真实长上下文场景覆盖。
- Author response: 无公开审稿回应；README 2025-11-17 对 indexer RoPE discrepancy 做了工程修复说明。
- 对可信度的影响: 机制、配置和训练数字具有清楚的官方可追溯性；质量归因与成本外推仍主要依赖内部 benchmark，外部独立复现有限。

## 本地讨论补充

### 1. 讨论收敛点

- DSA 的全称是 DeepSeek Sparse Attention，由 DeepSeek 在 DeepSeek-V3.2-Exp 技术报告中提出；GLM-5 报告中的 DSA 是采用和适配。
- DSA 的“sparse”发生在每层 core attention 的逻辑可见集合：每个 query 先由该层 lightning indexer 对历史 token 打分，再只取 top-k MLA latent KV entries 执行 selected softmax。
- 同一层的全部 query heads 共享一组 top-k token positions，各 Transformer 层独立打分和选择。相同位置被多层选中时，各层读取自己的 latent KV tensor。
- MQA mode 说明 latent KV entry 在层内被多个 query heads 共享；prefill 可以用 masked MHA 做等价执行。这一术语不表示跨层共享 KV cache。
- DSA 与 MiniMax-M3 的 MSA 有相似训练语言：二者都用 trainable selector / index branch 与 KL alignment 处理 sparse softmax attention；DSA 是 token-level MLA latent selection，MSA 是 GQA-based block sparse selection。
- DSA 和 TIM / deterministic inference 的关系在工程层：top-k selector、RoPE layout、kernel path、batch / prefill / decode mode 差异会改变实际可见集合或数值路径；进入 RL rollout 后，这些差异需要用 train-rollout consistency 语言审计。

### 2. 修正后的理解

- $O(L^2)\rightarrow O(Lk)$ 只描述 core attention。端到端路径仍包含 $O(L^2)$ indexer、top-k、gather、sparse attention 和其它模型计算，成本图用于验证这些项相加后的实际结果。
- Indexer 与传统 attention 都使用 query-key 点积；indexer 将全历史扫描压缩为低成本排序，昂贵的多头 QK、softmax、KV 读取和 value 聚合只覆盖 top-k。128K context、$k=2048$ 时，最后一个 query 的 core attention 可见比例为 $1/64$，indexer 的全量扫描仍是后续需要继续优化的成本项。
- Dense warm-up 先建立 selector 的全历史排序能力，sparse training 再让主模型适配。943.7B token 是报告采用的充分预算实例，公开材料没有给出最低适配预算。
- 原始 DSA 管理“该层 attention 能看到哪些 token”；FlashMemory 后续管理“哪些 chunk 的各层 KV 需要驻留 GPU”。逻辑选择与物理驻留是相邻的两个系统层级。
- GLM-5.2 的 IndexShare / IndexCache 可以看作 DSA 采用方对 indexer 成本与一致性问题的后续工程回应。

### 3. 后续复验指标

- indexer top-k recall：top-k set 对 dense attention mass 的覆盖率，按层、head、token position、task 类型分解。
- cross-layer overlap：测量 $\mathcal S_t^{(\ell)}$ 的 Jaccard overlap、代表层 union 膨胀和共享 indices 对 recall / HBM / latency 的影响。
- long-context quality vs cost frontier：固定输出长度和采样参数，比较 DSA、MSA、CSA/HCA、sliding-window、linear attention。
- rollout/trainer consistency：同 prompt、同 seed、同 temperature 下，indexer top-k set、selected KV ids、logprob、sampled token 是否跨 engine / batch size / prefill chunk 保持一致。
- indexer bottleneck：在 128K、256K、1M context 下分解 indexer logit、top-k、KV gather、sparse attention、MoE 和 sampling 成本。

## 主要启发

- 可训练稀疏注意力需要同时设计 selector supervision、层内共享粒度、sparse kernel 和主模型适配预算。
- Dense warm-up + sparse adaptation 把“学会选择”和“适配被选择的信息集合”分成两个阶段；selector 与主模型 loss 分离后，recall、membership drift 和 LM recovery 可以分别诊断。
- 对长上下文模型，性能表必须和 cost table 同时读。V3.2-Exp 的价值主要在“质量基本保持 + 长位置 token 成本下降”这个组合。
- DSA 把后续工程问题推进到 selector 成本、跨层复用、KV residency、sparse serving 和确定性 top-k，分别连接 GLM-5.2、FlashMemory、Vortex 与 TIM。

## 局限

1. 报告没有披露训练硬件、卡数、并行方式、训练 wall-clock、GPU hours 和数据组成；训练成本无法独立核算。
2. 质量对照缺少 compute-matched continued training baseline，也缺少与其他 sparse / linear / compressed attention 路线的同模型对照。
3. H800 cost figure 没有机器可读数值和完整 serving 配置，外部用户很难复现相同 cost curve。
4. reasoning benchmark 受 output token length 影响，GPQA/HLE/HMMT 的差距需要用长度控制实验解释。
5. indexer RoPE discrepancy 说明 DSA 的实现 surface 较复杂；RoPE layout、MLA mode、top-k selector、sparse kernel 任一处不一致都可能影响质量。
6. Sparse-stage KL 对 restricted teacher distribution 的归一化和集合外漏选 token 的处理没有披露，selector recall 的训练机制仍缺少关键实现细节。

## 跨论文关系

- 与已有论文的作者或机构关系：2025-09 报告只署名 DeepSeek-AI，无法确认个人作者重叠；机构层面由 [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/) 的 MLA、[DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/) 的 MoE / FP8 基座延伸到 [DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 的 CSA/HCA。
- 与 [GLM-5](/papers/2602.15763-glm-5-agentic-engineering/) 和 [GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/)：GLM-5 把 DSA 迁移到另一模型并报告 20B token sparse adaptation，说明 943.7B 不是可直接推广的必要预算；GLM-5.2 的 IndexShare / IndexCache 进一步处理跨层 indices 复用与 indexer 成本。
- 与 [MiniMax Sparse Attention](/papers/2606.13392-minimax-sparse-attention-m3/) 和 [HiLS-Attention](/papers/2607.02980-hils-attention-infinite-context/)：DSA 用 dense attention KL 蒸馏 token selector，MSA 用 GQA block selector 与 KL alignment，HiLS 用 landmark hierarchy 让 selector 直接受 LM loss 监督。三者的差异集中在选择粒度、监督路径和 sparse kernel layout。
- 与 [FlashMemory](/papers/2606.09079-flashmemory-deepseek-v4-lookahead-sparse-attention/)：DSA 的 per-layer top-k 决定逻辑 attention visibility；FlashMemory 从代表层预测 chunk 级 union residency，并为相关 CSA 层取回各自 KV pages。两者覆盖选择与物理驻留两个相邻层级。
- 与 [Vortex](/papers/2606.06453-vortex-sparse-attention-serving/)：DSA 定义模型原生 token selection，Vortex 处理 paged KV、ragged batch、prefix cache 条件下如何执行 sparse attention。
- 与 [TIM](/papers/2605.14220-training-inference-mismatch-llm-rl/) 和 [Batch-Invariant Inference](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：DSA 的 top-k membership、RoPE layout 与 MHA/MQA kernel path 会改变可见集合和 logprob，属于 RL rollout / trainer consistency 需要审计的结构性来源。

## Reference Intake Brief

### Target

- Intended target system: 修订既有 DSA 论文笔记，收紧 selector 共享语义、复杂度边界、训练目标和成本证据。
- Existing related assets: `content/utility/papers-index.md`；[DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/)、[DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/)、[DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/)、[DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)、[GLM-5](/papers/2602.15763-glm-5-agentic-engineering/)、[GLM-5.2](/papers/2026-06-16-glm-5-2-long-horizon-tasks/)、[MiniMax-M3](/papers/2606.13392-minimax-sparse-attention-m3/)、[Vortex](/papers/2606.06453-vortex-sparse-attention-serving/)。
- Proposed form: 原位更新 Markdown、索引核心信号和官方图片资产。

### Reusable Elements

1. DSA 机制拆解：per-layer lightning indexer、head-shared top-k、layer-local KV 与 selected softmax。
2. 训练审计：dense warm-up 2.1B tokens、sparse adaptation 943.7B tokens、selected-set KL 的公开歧义和 detach 边界。
3. 系统分层：DSA logical visibility -> GLM-5.2 index reuse -> FlashMemory physical residency -> Vortex sparse execution。

### Risks

- Copyright/over-copying: 仅保留公式、数字与短语级技术名词，正文为本地分析和转述。
- Unsourced or unverifiable claims: 训练硬件、并行方式、数据组成、训练时间均标注未披露；selected-set KL 归一化和集合外梯度明确标为本地分析；cost figure 只做方向性解读。
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

Why: DSA 是 GLM-5、GLM-5.2、DeepSeek-V4 与 FlashMemory 的关键上游节点。修订后的笔记把层内共享、跨层独立、训练目标歧义和 core / end-to-end complexity 分开说明，并保留训练资源与 production serving 配置未披露的边界。
