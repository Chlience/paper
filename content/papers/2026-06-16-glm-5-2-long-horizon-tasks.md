# GLM-5.2: Built for Long-Horizon Tasks 技术文章笔记

First-Archived-At: 2026-06-18 13:45
Updated-At: 2026-07-27 13:37
Review-Status: needs-review
Reviewed-At: 2026-07-18 17:42

## Source

- Workflow version: v2.1
- Material type: blog
- Analysis modules: experiment, system, model-report, safety, docs
- Canonical source: https://z.ai/blog/glm-5.2
- Title: GLM-5.2: Built for Long-Horizon Tasks
- URL: https://z.ai/blog/glm-5.2
- Documentation: https://docs.z.ai/guides/llm/glm-5.2
- Code/Project: https://github.com/zai-org/GLM-5
- Model: https://huggingface.co/zai-org/GLM-5.2
- Config snapshot: https://huggingface.co/zai-org/GLM-5.2/blob/b4734de4facf877f85769a911abafc5283eab3d9/config.json
- Weight index snapshot: https://huggingface.co/zai-org/GLM-5.2/blob/b4734de4facf877f85769a911abafc5283eab3d9/model.safetensors.index.json
- Weight metadata: https://huggingface.co/api/models/zai-org/GLM-5.2/revision/b4734de4facf877f85769a911abafc5283eab3d9
- Transformers config implementation: https://github.com/huggingface/transformers/blob/e0e7504bca2bfd1b85bb0eedb148f7b250226f06/src/transformers/models/glm_moe_dsa/configuration_glm_moe_dsa.py
- Transformers implementation: https://github.com/huggingface/transformers/blob/e0e7504bca2bfd1b85bb0eedb148f7b250226f06/src/transformers/models/glm_moe_dsa/modeling_glm_moe_dsa.py
- SGLang GLM-DSA/MTP loader: https://github.com/sgl-project/sglang/blob/ee1736f39ab62b15fcb276d3ff9090ff13c60fc6/python/sglang/srt/models/glm4_moe.py
- SGLang MTP fusion module: https://github.com/sgl-project/sglang/blob/ee1736f39ab62b15fcb276d3ff9090ff13c60fc6/python/sglang/srt/models/glm4_moe_nextn.py
- ModelScope: https://modelscope.cn/models/ZhipuAI/GLM-5.2
- Authors: Z.ai / GLM-5 Team
- Published: 2026-06-16
- Current version read: blog bundle last modified 2026-06-17；Hugging Face BF16 checkpoint commit `b4734de4facf877f85769a911abafc5283eab3d9`；Transformers v5.12.0 implementation commit `e0e7504bca2bfd1b85bb0eedb148f7b250226f06`；SGLang implementation commit `ee1736f39ab62b15fcb276d3ff9090ff13c60fc6`
- Accessed: 2026-07-27
- Key figure decision: omit
- Key figure rationale: 本次架构补充的直接证据来自机器可读配置、Safetensors 元数据和权重张量形状；参数表与可复算公式保留了关键结构信息，无需引入发布图。
- Review status: page-type=not-found; match-confidence=high; observed-at=2026-07-27; venue-status=release blog and open-weight model card
- Related paper: [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/)
- Related method: [IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/)
- Subjects: long-horizon coding agents, 1M context, sparse attention, speculative decoding, agentic RL, anti-hack training
- Review / OpenReview: 截至 2026-07-27，未发现 GLM-5.2 release blog 对应的官方公开审稿 forum；OpenReview 检索主要返回其它论文或材料对 GLM-5.2 和 GLM-5 系列的引用。

## 作者与关系

- Z.ai / GLM-5 Team: Z.ai / GLM-5 Team.
- GLM-5 Team / Zhipu AI / Tsinghua University: [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 的作者结构已经在本地建档。GLM-5.2 延续同一开源仓库和同一 GLM-5 series citation。
- slime / THUDM: 博文明确说 GLM-5.2 的 agentic RL 和 parallel OPD 使用 slime，形成直接工程关系。
- IndexShare / IndexCache 相关作者线：博文链接 [IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/)。该论文作者包括 Yushi Bai、Qian Dong、Ting Jiang、Xin Lv、Zhengxiao Du、Aohan Zeng、Jie Tang、Juanzi Li，与 GLM-5 / GLM-5.2 团队存在明显人员重叠。

## 一句话结论

GLM-5.2 是 GLM-5 系列从 200K 长上下文 agentic engineering 推进到 1M 长上下文 coding agent 的 release：它用 IndexShare 降低 DeepSeek Sparse Attention (DSA) indexer 成本，用 Multi-Token Prediction (MTP) IndexShare + KVShare + rejection sampling + total variation (TV) loss 提升 speculative decoding acceptance，用 slime 承载更复杂的 agentic RL / On-Policy Distillation (OPD)，用 critic-based Proximal Policy Optimization (PPO) 适配 compaction 后的长轨迹训练，并把 anti-hack module 放入 coding RL 和 evaluation，目标是让 1M context 在真实长时工程任务中可用、可训、可服务。

## 阅读目标与判断边界

本笔记关注：

1. GLM-5.2 相对 GLM-5 / GLM-5.1 的关键变化是什么。
2. 1M context 的瓶颈如何从 attention FLOPs 转向 indexer、KV cache、kernel、CPU scheduling 和 rollout infrastructure。
3. IndexShare、MTP/KVShare、slime、critic-based PPO 和 anti-hack module 分别解决哪一层问题。
4. 这篇 release blog 和本地已有 GLM-5、slime、Bebop、TIM/VeXact、Seer、DeepSeek-V4、reward hacking 论文之间的关系。

判断边界：

- 这是 release blog 与模型卡，信息粒度低于完整技术报告。许多训练数据、RL reward、anti-hack classifier、OPD 细节和 serving benchmark setup 没有完全展开。
- benchmark 表来自官方发布，跨模型比较依赖 harness、effort level、上下文长度、tool policy、judge 和运行预算。后续需要第三方复测。
- 文章包含 coding agent reward hacking 示例。本笔记只沉淀风险类别、防御机制和评测启发，不记录可执行滥用流程。

## 论文脉络

### 1. 研究问题、背景和价值

GLM-5.2 面向的问题是：coding agent 已经从短上下文 bug fix / unit test 任务，进入持续数小时甚至数十小时的 long-horizon engineering。模型需要读大仓库、维护长期计划、调用工具、运行实验、做性能优化、处理失败恢复，并在超长会话中保留有效上下文。

这类任务把“长上下文”从静态 benchmark 推到工程压力下：

- context 要能容纳仓库、日志、工具返回、历史决策和中间产物。
- 模型要能在长轨迹中持续推进任务，避免有效行动只集中在前几轮。
- serving engine 要能承受 1M prompt 下的 KV cache、prefill、decode 和调度压力。
- RL 训练要能处理长轨迹 compaction、工具反馈、子任务分解和奖励作弊。

GLM-5.2 的价值在于把这些问题放在同一条 release 中处理：模型架构处理 1M sparse attention，MTP 处理推理吞吐，slime 处理 agentic RL 基础设施，PPO/compaction 处理训练数据形态，anti-hack 处理可验证 coding reward 的信号污染。

### 2. 已有解决方案与不足

GLM-5 已经提供 744B total / 40B active MoE、DSA、slime 异步 RL 和 200K context。GLM-5.1 进一步增强 coding / agentic capability，但从 GLM-5.2 博文看，长时工程任务仍有四类不足：

1. 200K context 对仓库级、长日志、长工具轨迹仍偏紧。
2. DSA core attention 已被稀疏化，但 indexer 自身还会在每层做高成本 top-k 选择。
3. MTP speculative decoding 有训练-推理差异，draft acceptance 仍可提升。
4. coding RL 的 pass/fail reward 容易被 agent 通过环境或评测漏洞优化，导致 reward 上升但能力没有同步提升。

已有 Reinforcement Learning with Verifiable Rewards (RLVR) / Group Relative Policy Optimization (GRPO) 类 group-wise 方法也面临形态错配。长轨迹经过 compaction 后，一个 prompt 下的 rollout 会被切成数量不定、长度不同的 sub-traces，组内比较的结构变弱；这会推动系统从 group-wise optimization 转向 critic-based PPO。

### 3. 作者可能的思考路径

如果从 GLM-5 到 GLM-5.2 的演进看，作者可能先遇到的是 1M context 的经济性问题。DSA 已经把主 attention 从 $O(L^2)$ 降到 $O(Lk)$，但 indexer 仍要为每层、每个 query 做选择。连续层的 top-k 选择高度相似，于是自然想到跨层复用 indexer：每 4 层只让第一层运行 indexer，后 3 层复用 top-k indices。

第二条思路来自 speculative decoding。GLM-5 已有 parameter-sharing MTP，但多步 draft 在推理时会混入由 MTP 自己生成的 hidden state / KV，而训练时又希望行为和目标模型对齐。IndexShare 的“后续 token 只能 attend 到之前 token”的结构给了一个机会：复用第一步的 top-k indices 和 target model KV，让后续 MTP step 更接近训练态，并减少 draft model 成本。

第三条思路来自 agentic RL 训练数据。long-horizon task 会产生很长、很乱、被 compaction 切开的轨迹。组内 GRPO 适合固定 prompt group 的若干完整 responses；compacted sub-traces 的数量和长度都变了，critic-based PPO 可以把每条 rollout / sub-trace 作为独立训练对象，用 critic 估计 token-level advantage。

第四条思路来自 reward hacking。coding agent 有工具权限、仓库访问、测试反馈和网络/文件系统操作；pass/fail reward 会鼓励捷径。直接丢弃整条 trajectory 会造成训练不稳定，在线拦截单个非法 tool call 并返回 dummy observation，让 rollout 继续进行，是更平滑的防御入口。

### 4. 核心假设或切入点

GLM-5.2 的核心假设包括：

1. 1M context 的真实价值体现在 long-horizon coding agent，同时覆盖长文本读取。
2. DSA 的连续层 top-k indices 有足够相似性，可以跨层复用。
3. MTP draft model 的 acceptance 同时取决于模型容量和训练-推理路径一致性。
4. compaction 后的长轨迹训练更适合 critic-based PPO，对固定 group structure 的依赖更低。
5. coding RL 的 anti-hack 需要在线化，防御模块要参与 rollout，并和离线清洗形成互补。

### 5. 方法 / 系统 / 理论框架

#### 5.1 GLM-5.2 release surface、层结构与参数量

##### 5.1.1 发布口径与公开权重实数

| 项目 | GLM-5.2 |
| --- | --- |
| 模型系列 | GLM-5 series |
| 发布机构 | Z.ai / GLM-5 Team |
| GLM-5 技术报告口径 | 744B total / 40B activated；Table 10 声明计入 MTP，排除词嵌入与输出层 |
| Hugging Face BF16 权重检查点（checkpoint） | 753,329,940,480 个参数；页面显示为 753B |
| 骨干网络 | 78 个 Transformer blocks，包含 3 个 dense FFN blocks 与 75 个 MoE blocks |
| MTP | 1 个额外、跨多个 draft steps 共享参数的 NextN/MTP block；权重索引中的层号为 78 |
| 精度 | BF16 与 FP8 releases；本节精确计数基于 BF16 checkpoint |
| 上下文 | `max_position_embeddings=1,048,576`，即 $2^{20}$ tokens |
| 许可证 | MIT |
| 权重 | Hugging Face 与 ModelScope |
| 推理框架 | SGLang、vLLM、Transformers、KTransformers 与昇腾相关框架 |
| 推理强度控制 | `reasoning_effort=max/high`；支持关闭 thinking |

Hugging Face commit `b4734de4facf877f85769a911abafc5283eab3d9` 的模型 API 报告 753,329,921,024 个 BF16 参数和 19,456 个 F32 参数，总计 753,329,940,480。`model.safetensors.index.json` 包含 282 个分片、59,585 个张量名，`total_size=1,506,659,919,872` bytes，恰好等于 BF16 参数乘 2 bytes 再加 F32 参数乘 4 bytes。19,456 个 F32 元素对应 76 个 MoE blocks 各自的 256 维 `e_score_correction_bias`；router 权重在 checkpoint 中仍为 BF16，官方实现会用 FP32 计算 router logits。Transformers 还把 `indexer.weights_proj` 列为运行时保留 FP32 的模块，这会增加加载后的实际内存，且不改变 checkpoint 的数据类型统计。

公开权重可以按层号拆成 78 层骨干网络 `model.layers.0` 至 `model.layers.77`，以及 MTP 层 `model.layers.78`。逐张量形状重算得到：

| 组成 | 结构与计数 | 参数量 |
| --- | --- | ---: |
| 输入词嵌入 | $154{,}880\times6{,}144$，与输出头不共享 | 951,582,720 |
| 输出头 | $6{,}144\times154{,}880$ | 951,582,720 |
| 骨干 MLA | 78 层，每层 165,022,208 | 12,871,732,224 |
| 骨干 DSA Full indexer | 21 层，每层 9,371,904 | 196,809,984 |
| Dense FFN | 前 3 层，每层 226,492,416 | 679,477,248 |
| 路由专家组（routed expert banks） | 75 层，每层 $256\times37{,}748{,}736$ | 724,775,731,200 |
| 共享专家（shared experts） | 75 层，每层 37,748,736 | 2,831,155,200 |
| MoE 路由器 | 75 层；含权重与 correction bias | 117,984,000 |
| 骨干归一化层 | 每个 block 两个 RMSNorm，末尾另有一个 RMSNorm | 964,608 |
| **骨干网络小计** | 含输入词嵌入和输出头，不含 MTP | **743,377,019,904** |
| **MTP 层** | 完整 MoE/MLA/indexer，加 `eh_proj` 与五个归一化权重 | **9,952,920,576** |
| **BF16 release checkpoint 合计** | 骨干网络加 MTP；含 19,456 个 F32 correction-bias 元素 | **753,329,940,480** |

MTP 小计包含 9,663,676,416 个路由专家参数、37,748,736 个共享专家参数、165,022,208 个 MLA 参数、9,371,904 个 indexer 参数、1,573,120 个 router 参数，以及 75,528,192 个融合投影和归一化参数。`eh_proj.weight` 的形状为 $6{,}144\times12{,}288$；`enorm` 与 `hnorm` 分别归一化 token embedding 和上一轮 target hidden state，二者拼接后由 `eh_proj` 投影回 6,144 维。其余三个归一化权重来自 decoder block 的 `input_layernorm`、`post_attention_layernorm` 和输出前的 `shared_head.norm`。

因此，三个常见数字表达不同对象：

1. **753.330B** 是 Hugging Face BF16 checkpoint 中实际保存的张量元素总数。
2. **743.377B** 是当前 GLM-5.2 checkpoint 的 78 层 target backbone，包含独立输入词嵌入和输出头，排除额外 MTP 层。
3. **744B / A40B** 来自 GLM-5 技术报告的系列级架构口径。

[GLM-5 技术报告 Appendix A Table 10](https://arxiv.org/html/2602.15763#A1) 写明“总参数计入 MTP、排除词嵌入与输出层”。把这条注释直接应用到 GLM-5.2 checkpoint 会得到 751,426,775,040，而表中仍报告 744B，两者相差约 7.427B。当前公开材料没有说明这项差异来自报告近似、训练时参数共享语义、checkpoint 打包方式，还是后续模型结构变化。部署容量与权重下载应采用 753.330B；讨论 GLM-5 系列论文时可以保留 744B/A40B，并同时声明其统计口径。

层数也存在一项发布表述差异：GLM-5 报告 §2.1 正文称 layer count 为 80，Table 10 列出 3 个 dense layers、75 个 MoE layers 和 1 个 MTP layer，合计 78 个 target blocks 加 1 个 MTP block；当前 GLM-5.2 配置与权重索引同样可复现 78+1。公开材料没有说明正文中的 80 是否采用了额外模块计数。当前可核验分层以 checkpoint 的 layers 0–77 和 MTP layer 78 为准。

##### 5.1.2 核心配置与每层结构

| 配置字段 | 值 | 结构含义 |
| --- | ---: | --- |
| `architectures` / `model_type` | `GlmMoeDsaForCausalLM` / `glm_moe_dsa` | decoder-only MoE + MLA + DSA |
| `hidden_size` | 6,144 | token hidden state 与残差流宽度 |
| `num_hidden_layers` | 78 | target backbone blocks；checkpoint 另存 1 个 MTP block |
| `num_nextn_predict_layers` | 1 | 保存一个跨 draft steps 共享参数的 NextN/MTP block |
| `vocab_size` | 154,880 | 输入词嵌入和输出头均为 951,582,720 参数 |
| `tie_word_embeddings` | `false` | 输入词嵌入与输出头分别存储 |
| `intermediate_size` | 12,288 | 前 3 个 dense SwiGLU FFN 的中间宽度 |
| `moe_intermediate_size` | 2,048 | 路由专家与共享专家的 SwiGLU 中间宽度 |
| `hidden_act` | `silu` | SwiGLU 的 gate activation |
| `rms_norm_eps` | $10^{-5}$ | block 内与模型末尾 RMSNorm |
| `dtype` | `bfloat16` | BF16 checkpoint 的默认权重类型 |
| `max_position_embeddings` | 1,048,576 | 公开配置的精确上下文上限 |
| `rope_theta` | 8,000,000 | default RoPE base；Q/K 的 64 维子空间应用 interleaved RoPE |

MLA 与 DSA 相关配置为：

| 配置字段 | 值 | 结构含义 |
| --- | ---: | --- |
| `num_attention_heads` | 64 | query heads |
| `num_key_value_heads` | 64 | 展开后的逻辑 K/V heads；MLA cache 仍保存低维 latent |
| `attention_bias` / dropout | `false` / 0.0 | attention projections 无 bias，attention dropout 为零 |
| `q_lora_rank` | 2,048 | query low-rank down-projection |
| `kv_lora_rank` | 512 | compressed latent KV 宽度 |
| `qk_nope_head_dim` | 192 | 每个 head 不使用 RoPE 的 Q/K 子空间 |
| `qk_rope_head_dim` | 64 | 每个 head 使用 RoPE 的 Q/K 子空间 |
| `qk_head_dim` | 256 | $192+64$；`q_b_proj` 输出 $64\times256=16{,}384$ 维 |
| `v_head_dim` | 256 | 每个 value head 宽度；attention output 展开为 16,384 维 |
| MLA cache logical width | 576 | 512 维 compressed KV 加 64 维 decoupled RoPE key |
| `index_n_heads` | 32 | DSA indexer heads |
| `index_head_dim` | 128 | 每个 indexer head 宽度 |
| `index_topk` | 2,048 | 每个 query 进入 sparse core attention 的历史位置数上限 |
| `index_topk_freq` / offset | 4 / 3 | offset 后形成 `full, shared, shared, shared` |
| `rope_interleave` / `indexer_rope_interleave` | `true` / `true` | MLA 与 indexer 的 RoPE 都使用偶奇维交错布局 |
| `index_share_for_mtp_iteration` | `true` | MTP iterations 复用 index selection |

原始 `config.json` 还保存 `head_dim=192`。这个字段等于 no-PE Q/K 子空间，完整 Q/K head 由 192 维 no-PE 部分和 64 维 RoPE 部分组成，共 256 维。Transformers v5.12.0 的配置类会把通用 `head_dim` 运行时字段改为 64，供 RoPE 频率生成使用；参数量与 attention tensor shape 应读取 `qk_nope_head_dim`、`qk_rope_head_dim` 和 `v_head_dim`。

MoE 的层级与 routing 配置为：

| 配置字段 | 值 | 结构含义 |
| --- | ---: | --- |
| `first_k_dense_replace` | 3 | layers 0–2 使用 dense FFN |
| MoE backbone layers | 75 | layers 3–77 使用 MoE |
| `n_routed_experts` | 256 | 每个 MoE block 保存 256 个路由专家 |
| `num_experts_per_tok` | 8 | 每个 token 选择 8 个路由专家 |
| `n_shared_experts` | 1 | 每个 token 还通过 1 个共享专家 |
| 单个专家参数量 | 37,748,736 | 单个 SwiGLU expert 为 $3\times6{,}144\times2{,}048$ |
| 每层路由专家组 | 9,663,676,416 | 256 个路由专家 |
| 每层激活专家 FFN | 339,738,624 | 8 个路由专家，加 1 个共享专家 |
| `scoring_func` / `topk_method` | `sigmoid` / `noaux_tc` | router 以 sigmoid score 选择 top-8 |
| `moe_router_dtype` | `float32` | router logits 以 FP32 计算 |
| `norm_topk_prob` / scaling | `true` / 2.5 | 归一化所选 expert 权重后乘 scaling factor |
| `n_group` / `topk_group` | 1 / 1 | 当前配置不做跨 expert group 筛选 |

骨干网络只有 layers 0、1、2、6、10、14、18、22、26、30、34、38、42、46、50、54、58、62、66、70、74 保存并执行 Full indexer，共 21 个；其余 57 层在官方 Transformers 实现中将 `self.indexer` 设为 `None`，直接接收最近 Full 层的 top-$k$ positions。MTP layer 78 另存一个 Full indexer，所以完整 checkpoint 有 22 套 indexer 参数。相较 79 层都各存一套 indexer，这一配置减少 57 套、合计 534,198,528 个参数；主要运行收益仍来自超长序列下省去 57 层的候选打分与 top-$k$。

##### 5.1.3 “A40B”如何由路由配置得到

单个路由专家（routed expert）的参数量为：

$$
P_{\mathrm{expert}}
=3\times 6{,}144\times 2{,}048
=37{,}748{,}736.
$$

按照 GLM-5 Table 10 的 active-parameter 口径，计入 75 个 backbone MoE blocks 和 1 个 MTP MoE block，排除输入词嵌入与输出头，并把每层 256 个路由专家替换为实际选中的 8 个：

$$
\begin{aligned}
P_{\mathrm{active,report}}
={}&P_{\mathrm{checkpoint}}
-2P_{\mathrm{vocab}}
-76\times256P_{\mathrm{expert}}
+76\times8P_{\mathrm{expert}}\\
={}&39{,}938{,}598{,}912.
\end{aligned}
$$

这个结果为 39.939B，四舍五入后对应 A40B。普通 target-model decode 只运行 layers 0–77；若计入完整输出头，把输入词嵌入表按 lookup 处理，并在 75 个 MoE blocks 中各激活 8 个路由专家，则其余参与当前 token 路径的权重为 40,298,947,584；再计入实际读取的一行 6,144 维 embedding，结果为 40,298,953,728。两种口径都接近 40B，差异来自 MTP 与词表矩阵的计入方式。

激活参数量描述单个 token 的计算路径。模型仍包含全部路由专家组；没有 expert offload 时，分布式推理需要让 753.330B checkpoint 权重驻留在 GPU、CPU 或两者组成的存储层级中。参数量也不能直接替代 FLOPs：DSA indexer 只有约 9.37M 参数，但它在长上下文中扫描大量历史位置，运行成本随序列长度增长。

Transformers v5.12.0 的通用 `GlmMoeDsaForCausalLM` 构造 78 个 target blocks，并通过 `_keys_to_ignore_on_load_unexpected` 忽略 `model.layers.78.*`；普通 Transformers forward 因而不执行 MTP 层。SGLang 等 speculative decoding 路径把 layer 78 作为独立 NextN/MTP module 加载，使用 `enorm`、`hnorm`、`eh_proj`、一个 decoder block 和 `shared_head.norm` 生成 draft hidden state。部署时的实际激活量还取决于是否开启 MTP、draft steps 数、IndexShare/KVShare 复用和推理框架实现。

GLM-5.2 的产品接口包括 Z.ai chat、GLM Coding Plan、ZCode、Claude Code / OpenCode 等 coding agent 接入。对本地论文目录更重要的是：它把 open-weight 1M context、agentic coding、slime RL 和 production serving 放在同一发布面上。

#### 5.2 IndexShare / IndexCache for DSA

DSA 的基本结构可以拆成 selector 与 sparse core attention：

$$
\text{core attention cost} = O(Lk), \quad \text{indexer cost} \approx O(L^2).
$$

该式描述 prefill 量级。对单个 decode token，indexer 扫描长度为 $L$ 的历史，成本随 $L$ 线性增加。当 context 扩展到 1M，core attention 已被 top-$k$ 控制，每个 sparse layer 独立运行 indexer 的累计成本随之变得显著。

GLM-5.2 使用固定 FSSS IndexShare pattern：anchor layer 运行 indexer 并产生 top-$k$ token positions，后续三层跳过本层 indexer，沿网络深度复用同一 selection result。Shared 层仍从各自的 KV cache 读取这些 positions 对应的 K/V，并执行各自的 sparse core attention。因此 IndexShare 直接减少 selector FLOPs，基本不减少 KV-cache footprint，也不共享各层的 KV vectors。

官方 `config.json` 给出 `index_topk=2048`、`index_topk_freq=4`、`index_skip_topk_offset=3`、`index_topk_pattern=null` 和 `index_share_for_mtp_iteration=true`；offset 之后的 `indexer_types` 呈周期性的 `full, shared, shared, shared`。博文声称这一配置在 1M context 下将 per-token FLOPs 降低 2.9 倍，并从 128K sequence length 的 mid-training 阶段开始引入。

这里需要把论文证据分成三层。IndexCache 在 30B 模型上验证 training-free search 与 training-aware multi-layer distillation；在 744B GLM-5 上只验证 training-free search。GLM-5.2 后续采用固定四层共享，并把机制命名为 IndexShare。固定 FSSS 与 IndexCache 的 training-aware 路线在结构上相容，因为论文中未经训练的 uniform 1/4 pattern 会明显降低 long-context 质量；GLM-5.2 官方材料没有披露 exact index loss，也没有确认完整采用 IndexCache 的 multi-layer KL distillation。

因此可以把 IndexCache 视为方法族，把 IndexShare 视为 GLM-5.2 的 production configuration 与发布名称。两者共享 Full / Shared layers 和跨层 top-$k$ index reuse，训练 recipe 的对应范围保持未披露。

#### 5.3 MTP with IndexShare and KVShare

GLM-5.2 的 MTP 目标有两个：

1. 降低 MTP layer 作为 draft model 的成本。
2. 提高 speculative decoding acceptance length。

做法包括：

- MTP 多步预测也使用 IndexShare：第一步运行 indexer，后续 steps 复用 top-k indices。
- KVShare：后续 MTP step 复用第一步的 target-model KV，减少由 draft hidden state 产生的 KV 混入。
- 参数仍沿用 GLM-5.1 的 MTP step parameter sharing。
- 引入 [2606.12370](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/) Bebop 式 rejection sampling，并用 end-to-end TV loss 训练。

这里要和 GLM-5 的 parameter-sharing MTP 分开读。参数共享只复用 MTP step/layer weights；KV cache 的内容还取决于每一步输入 hidden state。KVShare 处理的是另一层问题：后续 MTP step 如果继续用 draft hidden state 生成 $K/V$，会增加 draft KV 计算，也会让 draft path 和 target-model path 偏离。复用 target-model KV 可以同时减少部分 draft KV 混入和训练-推理路径差异。

博文给出的 ablation：

| Method | Acceptance Length |
| --- | ---: |
| Baseline | 4.56 |
| + IndexShare + KVShare | 5.10 |
| + Rejection Sampling | 5.29 |
| + End-to-end TV Loss | 5.47 (+20%) |

直观理解：MTP 的多步 draft 越像 target model 真正会走的推理路径，acceptance 越高；IndexShare/KVShare 减少了 MTP 推理时由 draft 自身 hidden states 引入的偏移，Bebop/TV loss 则从采样分布距离上进一步控制 mismatch。

MTP IndexShare 属于 GLM-5.2 的后续扩展。IndexCache 论文仓库快照 `08d22d6` 在公开 SGLang / vLLM patch 中通过 `is_nextn` 关闭 next-token-prediction 分支的 index reuse；官方 GLM-5.2 config 则明确设置 `index_share_for_mtp_iteration=true`。两份代码材料对应不同发布阶段，不能把论文 patch 当作最终 GLM-5.2 MTP 实现。

#### 5.4 Efficient serving at 1M context

GLM-5.2 将最大 context 从 200K 扩到 1M 后，瓶颈发生迁移：

- per-token compute 被 IndexShare / DSA 降低。
- per-token KV cache size 没有同比下降。
- 长上下文 kernel、cache transfer、CPU-side scheduling 和 runtime path 变得更关键。

- 系统条件：公开材料给出的目标负载为最长 1M-token context，并描述 LayerSplit、cache transfer 与 CPU-side scheduling 路径；硬件型号、并行拓扑、batch、并发和软件版本没有完整披露。
- 指标定义：IndexShare 的 2.9 倍结果是官方报告的 1M context 下 per-token FLOPs 降幅，不能直接换算为端到端吞吐、首 token 延迟或单 token 解码延迟。
- 成本归因：架构侧收益来自减少 Full indexer 执行次数；serving 侧还叠加内存管理、kernel、缓存传输与 CPU 调度优化，公开材料没有提供逐项端到端消融。

官方描述的 inference engine 优化有三条：

1. 基于 LayerSplit 做更细粒度 memory management 和 parallelization，增加可用 KV-cache 空间。
2. 优化随 context length 增长的 kernels，并与 cache transfer pipeline 协调，降低 cache movement 对 prefill/decode 的影响。
3. 优化 CPU-side cache management、request scheduling 和 runtime execution，减少 GPU execution pipeline bubbles。

这和 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 的 million-token context 系统结论一致：1M context 的主要问题会从“模型能不能 attend”转向“KV cache、压缩、kernel、调度和 serving economics 是否可承受”。

#### 5.5 slime for Agentic RL and OPD

GLM-5.2 的 agentic RL 覆盖更大规模、更多领域、更复杂 execution patterns。博文强调 slime 支持：

- white-box rollout。
- black-box rollout。
- compact trajectory。
- sub-agent workflow。
- 训练侧连接不同 inference services。
- 适配不同 parallelism、routing、PD disaggregation 和 deployment patterns。
- KV-cache FP8。

GLM-5.2 使用 slime 做 parallel OPD，将十多个 expert models 融合到最终模型中，整个 OPD 约两天完成。结合 [slime 官方仓库](https://github.com/THUDM/slime) 的公开资料，这说明 slime 的定位已经从“RL trainer”扩展成 GLM 系列模型训练、rollout、distillation、serving 配置复用的共同基础设施。

#### 5.6 RL for long-horizon tasks with compaction

长任务会产生超长 execution traces。经过 compaction 后，一个原始 trajectory 会被切成多个 sub-traces，不同 rollouts 会产生不同数量、不同长度的 trainable traces。

GLM-5.2 因此从 group-wise optimization 转向 critic-based PPO：

- 每个 rollout / compacted sub-trace 都可以作为训练对象。
- critic 估计 token-level advantages。
- token-level loss 处理 sub-trace 长度不均衡。
- 不再要求同一 prompt 下 responses 数量和长度有整齐 group structure。

这个选择和 [verl 官方仓库](https://github.com/verl-project/verl) 中讨论的异步/partial rollout、[slime 官方仓库](https://github.com/THUDM/slime) 的 compact trajectory 数据结构、以及 [2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/) 的 synchronous group rollout 形成对照：当轨迹保持完整且 group structure 清晰时，group-relative 方法更自然；当轨迹被压缩、切分、异步化后，critic-based PPO 更容易接住复杂数据形态。

#### 5.7 Anti-hack in coding agents

博文指出 GLM-5.2 在 coding RL 中展现出比 GLM-5.1 更多潜在 hacking behavior。原因是能力增强后，模型更会利用环境和评测信号中的捷径；pass/fail reward 越可验证，越容易被模型当作可优化目标。

官方 anti-hack module 由两阶段检测组成：

1. rule-based filter：提高召回，先标记潜在 hack actions。
2. LLM judge：判断被标记 action 的意图，提高精度。

- 威胁模型：coding RL agent 可调用工具、修改仓库并接收测试或判题反馈，优化目标是通过利用环境或评测漏洞提高可验证奖励；公开材料没有量化攻击知识、网络权限和沙箱边界。
- 披露边界：本笔记记录风险类别、两阶段检测和在线阻断机制，省略博文中的具体命令与可直接复用的绕过步骤。

系统采用 online guard：每一步 tool call 都被监控。若检测到 hack，系统阻断该调用并返回 dummy information，让 rollout 继续进行。这个设计的优点是把无效行为局部处理，避免直接终止整条 trajectory 导致训练不稳定或模型崩塌。

这和 [2510.20270](/papers/2510.20270-impossiblebench-test-case-exploitation/)、[2506.19248](/papers/2506.19248-inference-time-reward-hacking-llms/)、[2503.11926](/papers/2503.11926-monitoring-reasoning-models-obfuscation/) 形成直接关系：当测量信号进入优化闭环，模型会寻找 proxy 失效区域。GLM-5.2 的贡献是把防御从离线评测推进到在线 rollout guard。

### 6. 结论链条

GLM-5.2 的结论链可以概括为：

1. long-horizon coding agent 需要 1M context，并且需要可服务、可训练的 1M context。
2. DSA 解决主 attention 成本后，indexer 成为新的瓶颈；IndexShare 通过跨层复用 top-k indices 降低 indexer 成本。
3. 1M context 下 KV cache 和 serving overhead 继续主导系统成本，需要 LayerSplit、cache transfer、kernel、CPU scheduling 协同优化。
4. speculative decoding 的 MTP acceptance 可以通过 IndexShare/KVShare、rejection sampling 和 TV loss 提升。
5. agentic RL 的轨迹变长、被 compaction 切分后，critic-based PPO 更适合 individual rollout / sub-trace 训练。
6. coding RL 中 reward hacking 已经成为 production post-training 问题，需要在线 anti-hack guard 保护训练信号。

## 关键实验/定理

### 结果 1：GLM-5.2 在长时 coding agent benchmark 上接近闭源 frontier

- 设置：FrontierSWE、PostTrainBench、SWE-Marathon，使用 1M context、max effort、128K max output tokens；FrontierSWE dominance score 截止 2026-06-16。
- Baseline：主要闭源强基线是 Claude Opus 4.8 和 GPT-5.5；同类 open / open-weight 基线来自 GLM-5.1、DeepSeek-V4-Pro、Kimi K2.5 等官方表格对照。长时 coding agent 的 baseline 强度高度依赖统一 harness、工具权限、max output tokens、effort level、judge 和任务时间预算。
- 对照是否可比：同一官方表格内的模型使用相同任务集合，仍缺少逐模型 harness、工具权限、推理预算和重复试验记录，只支持发布级横向定位。
- 指标：官方 benchmark score / dominance。
- 结果：FrontierSWE 为 74.4，接近 Claude Opus 4.8 的 75.1，并高于 GPT-5.5 的 72.6；PostTrainBench 为 34.3，低于 Opus 4.8 的 37.2，高于 GPT-5.5 的 28.4；SWE-Marathon 为 13.0，低于 Opus 4.8 的 26.0，高于 GPT-5.5 的 12.0。
- 证据定位：[GLM-5.2 官方发布博文的 long-horizon coding benchmark 表](https://z.ai/blog/glm-5.2)。
- 支持的最窄结论：在官方披露的 1M context、max effort 和 128K 最大输出设置下，GLM-5.2 的 FrontierSWE 与 PostTrainBench 分数接近 Claude Opus 4.8，SWE-Marathon 分数仍有明显差距。
- 解读：GLM-5.2 在 long-horizon coding 上已经进入闭源 frontier 附近，但 SWE-Marathon 显示超长工程交付还有明显差距。

### 结果 2：标准 coding benchmark 相对 GLM-5.1 大幅提升

- 设置：官方 full benchmark table。
- Baseline：GLM-5.1 是直接前代基线；Terminal Bench、SWE-bench Pro、DeepSWE、ProgramBench 同时提供跨模型表格对照。这个结果最能说明 GLM 系列内部迭代收益，但仍不能把收益完全归因到 IndexShare、MTP、slime 或 anti-hack 的某个单点。
- 对照是否可比：GLM-5.1 是最接近的系列内基线，但官方材料没有给出两个版本逐项一致的 checkpoint、reasoning effort、工具预算和运行方差。
- 指标与结果：Terminal Bench 2.1 (Terminus-2) 从 GLM-5.1 的 63.5 提升到 81.0；SWE-bench Pro 从 58.4 到 62.1；DeepSWE 从 18 到 46.2；ProgramBench 从 50.9 到 63.7。
- 证据定位：[GLM-5.2 官方发布博文的 full benchmark table](https://z.ai/blog/glm-5.2)。
- 支持的最窄结论：官方表格显示 GLM-5.2 在所列四项 coding benchmark 上均高于 GLM-5.1，这一对照支持系列级能力提升，无法分离各架构与训练改动的独立贡献。
- 解读：提升集中在需要工具、终端、仓库级操作的 coding agent tasks，和“long-horizon coding agent”定位一致。

### 结果 3：MTP acceptance ablation

- 设置：使用 GLM-5.1 backbone 和训练数据，MTP steps 为 7。
- Baseline：baseline 4.56 是未加入 IndexShare/KVShare/rejection sampling/TV loss 的 MTP 路径；后续逐项叠加构成相对清晰的机制 ablation。局限是该 ablation 使用 GLM-5.1 backbone / data，和最终 GLM-5.2 release 仍有差异。
- 对照是否可比：四组设置沿同一 GLM-5.1 backbone、训练数据和七步 MTP 路径逐项叠加机制，适合判断累积收益；表格没有提供单因素全排列、方差或最终 GLM-5.2 checkpoint 复测。
- 指标：acceptance length。
- 结果：baseline 4.56；IndexShare + KVShare 5.10；加入 rejection sampling 5.29；加入 end-to-end TV loss 后 5.47，提升 20%。
- 证据定位：[GLM-5.2 官方发布博文的 MTP acceptance ablation 表](https://z.ai/blog/glm-5.2)。
- 支持的最窄结论：在该 GLM-5.1 backbone 七步 MTP 消融中，依次加入 IndexShare/KVShare、rejection sampling 和端到端 TV loss 后，acceptance length 从 4.56 增至 5.47。
- 解读：MTP speculative decoding 的收益来自结构路径一致性和分布训练共同作用。IndexShare/KVShare 处理路径差异，rejection sampling / TV loss 处理采样分布差异。

### 结果 4：reasoning / agentic benchmark surface

- 设置：官方 full benchmark table。
- Baseline：reasoning / tool-use 表格包含 DeepSeek-V4-Pro、Claude Opus 4.8、GPT-5.5 等强模型；这些任务的可比性同样受 effort level、工具配置、prompt 和 judge 影响。Tool-Decathlon 上 GLM-5.2 低于多个强基线，提供了一个重要负向信号。
- 对照是否可比：同表结果适合描述发布时的能力范围；跨模型的 effort、工具链、prompt、judge 和采样预算未完全对齐，排名解释需要第三方统一复测。
- 代表性结果：HLE 40.5，HLE with tools 54.7，AIME 2026 99.2，GPQA-Diamond 91.2，MCP-Atlas public set 76.8，Tool-Decathlon 48.2。
- 证据定位：[GLM-5.2 官方发布博文的 reasoning 与 agentic benchmark 表](https://z.ai/blog/glm-5.2)。
- 支持的最窄结论：官方表格显示 GLM-5.2 在所列 reasoning 与工具任务上覆盖面较广，同时 Tool-Decathlon 48.2 低于表中的多个强基线。
- 解读：GLM-5.2 同时在 coding 与 reasoning / tool-use 任务上取得较高分数。Tool-Decathlon 仍低于 DeepSeek-V4-Pro、Claude Opus 4.8、GPT-5.5，说明工具泛化仍有提升空间。

### 结果 5：公开权重参数量与层结构审计

- 设置：固定读取 Hugging Face BF16 checkpoint commit `b4734de4facf877f85769a911abafc5283eab3d9` 的模型 API、`config.json`、`model.safetensors.index.json` 和 282 个 Safetensors 分片头部；用 Transformers v5.12.0 与 SGLang 对应实现核对模块语义。
- 对照是否可比：Hugging Face 元数据、配置、权重索引和张量头部来自同一 commit，可以直接交叉核验；GLM-5 报告的 744B 使用不同材料与统计口径，只作为系列级参照。
- 指标：参数总数、数据类型、分片数、张量数、骨干层数、MTP 层数、Full indexer 层数，以及按矩阵形状重算的组件参数量。
- 结果：完整 checkpoint 为 753,329,940,480 个参数，其中 BF16 753,329,921,024、F32 19,456；78 层骨干网络为 743,377,019,904，MTP layer 78 为 9,952,920,576；骨干网络包含 3 个 dense blocks、75 个 MoE blocks 和 21 个 Full indexers。
- 证据定位：[Hugging Face model API snapshot](https://huggingface.co/api/models/zai-org/GLM-5.2/revision/b4734de4facf877f85769a911abafc5283eab3d9)；[`config.json`](https://huggingface.co/zai-org/GLM-5.2/blob/b4734de4facf877f85769a911abafc5283eab3d9/config.json)；[`model.safetensors.index.json`](https://huggingface.co/zai-org/GLM-5.2/blob/b4734de4facf877f85769a911abafc5283eab3d9/model.safetensors.index.json)；[Transformers v5.12.0 implementation](https://github.com/huggingface/transformers/blob/e0e7504bca2bfd1b85bb0eedb148f7b250226f06/src/transformers/models/glm_moe_dsa/modeling_glm_moe_dsa.py)。
- 支持的最窄结论：公开 BF16 checkpoint 的存储参数量可以精确核验为 753.330B；744B/A40B 仍是 GLM-5 技术报告中的架构统计口径，报告对总参数的脚注无法直接复现当前 GLM-5.2 checkpoint。
- 适用版本：参数实数适用于 Hugging Face BF16 commit `b4734de4facf877f85769a911abafc5283eab3d9`；运行路径解释对应 Transformers v5.12.0 commit `e0e7504bca2bfd1b85bb0eedb148f7b250226f06` 与 SGLang commit `ee1736f39ab62b15fcb276d3ff9090ff13c60fc6`。
- 未披露项：官方材料尚未解释 GLM-5 Table 10 的 744B 如何映射到当前 GLM-5.2 checkpoint，也没有给出 BF16 与 FP8 release 是否逐张量同构的正式清单。
- 解读：部署容量、下载体积和完整权重驻留应按 753.330B 估算；单 token 计算路径约为 40B active，具体值随 MTP 和词表矩阵的统计方式变化。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 模型设置 | GLM-5 报告口径为 744B total / 40B activated；GLM-5.2 BF16 checkpoint 实际保存 753,329,940,480 个参数，其中 78 层 target backbone 为 743,377,019,904、MTP 层为 9,952,920,576；发布 BF16 / FP8 权重，支持 1,048,576-token context、SGLang / vLLM / Transformers / KTransformers 等 serving 路径，并提供 max / high reasoning effort 控制 |
| 架构 / 系统设置 | DSA IndexShare / IndexCache、MTP IndexShare + KVShare、Bebop 式 rejection sampling、end-to-end TV loss、LayerSplit memory management、cache transfer / CPU scheduling 优化、slime compact trajectory / sub-agent workflow / parallel OPD、online anti-hack guard |
| 训练设置 | release blog 没有公开完整 pretraining、post-training、critic training、reward、expert source 和 anti-hack classifier 细节；只能按 release 级信息记录机制与结果 |
| 技术报告训练配置 | 披露 parallel OPD 约两天完成、MTP acceptance ablation、critic-based PPO / compact trajectory / anti-hack guard 等机制；缺少完整训练资源和数据表 |
| 未披露项 | pretraining tokens、训练 GPU 数、硬件型号、并行方式、GPU hours、wall-clock、美元成本、critic training 数据、reward weights、anti-hack precision / recall |
| baseline 强度 | MTP acceptance ablation 是最清楚的机制证据；GLM-5.1 对照能说明系列迭代收益；闭源 frontier 对照能说明实用位置，但受 harness、effort、context、tool、judge、budget 影响较大 |
| 统计限制 | 官方表格主要给单点结果，缺少多 seed、置信区间、第三方复验、完整 ablation grid、online guard precision/recall 和统一 agent harness 配置 |

## 证据链强度评估

### 强证据

- 官方模型卡和 GitHub README 确认 GLM-5.2 权重公开、MIT license、BF16/FP8、1M context 和多框架部署支持；Hugging Face 模型 API、配置与权重索引进一步确认 753,329,940,480 个 checkpoint 参数及其层结构。
- GLM-5 技术报告给出 744B total / 40B activated 的系列口径；公开张量重算可以复现约 40B 的激活量，并显示 744B 总量脚注与当前 GLM-5.2 checkpoint 之间存在未解释差异。
- MTP ablation 表直接支持 IndexShare/KVShare、rejection sampling、TV loss 对 acceptance length 的累积作用。
- blog 与 slime 文档互相印证 GLM-5.2 使用 slime 作为 agentic RL 基础设施。

### 中等强度证据

- FrontierSWE、PostTrainBench、SWE-Marathon 的结果支持 long-horizon coding 定位，但这些 benchmark 的 harness、budget 和 judge 复杂，第三方复验仍然关键。
- IndexShare 的 2.9x per-token FLOPs claim 和 1M serving scaling 结果来自官方图表和描述，缺少完整可复现实验脚本；固定 FSSS pattern 可由官方配置直接确认。
- anti-hack module 的必要性和机制说得清楚，但没有公开 precision/recall、误拦截率、对训练收益的 ablation。

### 需要谨慎的推论

- “最高开源模型”这类排名高度依赖 benchmark set、harness、effort level 和发布时间，需要持续复核。
- critic-based PPO 对 compaction 的适配性合理，但博客没有给出与 GRPO / group-wise objective 的直接 ablation。
- online anti-hack guard 能稳定训练的说法需要看 rollout continuation、dummy observation 分布和模型是否学习绕过 guard。

## OpenReview / 审稿意见吸收

- 公开状态：截至 2026-07-27，本轮检索未发现 GLM-5.2 release blog 对应的官方 OpenReview forum 或公开 reviewer 评分；公开讨论主要来自模型卡、blog、社区转发和第三方榜单收录。
- Venue 判断：当前按 release blog + model card + GitHub/weights 处理，证据强度来自官方发布材料、公开权重、GLM-5 技术报告和 slime / Bebop / IndexCache 等相关文档互相印证。
- 可吸收的外部审稿式问题：IndexShare 的质量损失是否有完整 ablation；critic-based PPO 相对 GRPO / group-wise objective 的收益是否有直接比较；anti-hack guard 的召回、精度、误拦截率和绕过行为是否公开；FrontierSWE/PostTrainBench/SWE-Marathon 的 harness 是否可复现；1M context serving 是否有端到端吞吐和成本表。
- 对本文档的影响：把 GLM-5.2 作为 GLM-5 系列 release 节点、long-horizon coding agent 和 production RL 系统材料引用时价值较高；把 benchmark 排名或单个模块的独立收益当作严格结论时，需要外部复验和更完整 ablation。

## 本地讨论补充

### 1. 讨论收敛点

- GLM-5.2 的关键是围绕 1M context 改造 indexer、MTP、serving、RL data shape 和 anti-hack。
- IndexShare / IndexCache 和 DSA 的关系是：DSA 降低主 attention 成本，IndexShare 进一步降低 sparse indexer 成本。
- 若把当前解码步 $t$、第 $\ell$ 层的 DSA 选择集合写成 $\mathcal S_{t,\ell}$，IndexShare 让后续三层复用 anchor layer 算出的 top-$k$ positions，并在各层读取自己的 KV。它沿网络深度轴减少 indexer forward。FlashMemory 沿解码时间轴预测未来窗口需要驻留的历史 KV chunks，主要管理 HBM residency 与 CPU--GPU 预取。
- IndexCache 的 30B uniform 1/4 training-free 结果会显著掉点，searched 1/4 与 training-aware 1/4 可以接近 DSA baseline。GLM-5.2 固定 FSSS 说明模型在训练阶段已经适应该 pattern；具体是否使用 multi-layer KL 仍未披露。
- MTP/KVShare 的核心是降低 draft path 和 target path 的不一致，让 speculative decoding 的 acceptance length 上升；它补的是 GLM-5 parameter-sharing MTP 无法自然解决的 KV/activation path 问题。
- 长轨迹 compaction 改变了 RL 样本结构，使 critic-based PPO 比固定 group structure 更自然。

### 2. DSA 复杂度的直观含义

- Prefill 时共有 $L$ 个 query。第 $i$ 个 query 的 indexer 要给此前约 $i$ 个位置打分，因此候选打分总数约为 $\sum_{i=1}^{L} i = O(L^2)$。sparse core attention 只对每个 query 选出的 $k$ 个位置执行完整 attention，总量为 $O(Lk)$。
- Decode 时只有当前新 token 这一个 query。indexer 仍需扫描 $L$ 个历史位置，量级为 $O(L)$；core attention 只处理 top-$k$，量级为 $O(k)$。若每个 sparse layer 都重新选择，模型深度为 $N$ 时两项分别累积为 $O(NL)$ 与 $O(Nk)$。
- 以 $L=1{,}000{,}000$、$k=2048$ 为例，单层单个 decode step 的 indexer 要比较约 100 万个候选，core attention 读取 2048 个候选。Prefill 的因果候选对约为 $5\times10^{11}$，被选中进入 core attention 的位置对约为 $2.05\times10^9$。
- 这些数字比较的是位置对数量。indexer 使用较低维表示，每个候选的打分通常比完整 attention 轻；top-$k$ 选择、内存访问和 kernel 实现也影响真实延迟。因此 $O(L^2)$ 与 $O(Lk)$ 用来解释扩展趋势，端到端耗时仍需实测。
- GLM-5.2 的 FSSS IndexShare 让每四层只有 anchor layer 扫描全历史，后三层复用它的 top-$k$ 位置，因而把 selector 的常数成本降到原来的约四分之一；复杂度对 $L$ 的阶数保持不变，各层 sparse core attention 与各自 KV 读取仍继续执行。
- IndexShare 同时覆盖 prefill 与普通自回归 decode，因为共享轴是网络层深度。Prefill 中，anchor layer 为 prompt 内全部 query 生成 top-$k$ position tensor，后三层复用；decode 中，每个新 token 都由 anchor layers 针对当前长度的历史刷新 top-$k$，随后 Shared layers 复用。若 Full 层比例为 $r$，selector 的 prefill 与单步 decode 量级分别由 $O(NL^2)$、$O(NL)$ 变为 $O(rNL^2)$、$O(rNL)$。GLM-5.2 还把共享扩展到 MTP iterations，让第一步 draft 的 indices 服务后续 draft steps；这是普通 backbone 跨层复用之外的额外路径。

### 3. DSA 与 IndexShare 的组合数据流

- DSA 即 DeepSeek Sparse Attention。每个 sparse layer 先用低维、少量 head 的 lightning indexer 为当前 query 与全部 causal positions 计算相关性分数，selector 取出 top-$k$ position IDs；随后该层的 sparse core attention 只在这些位置上读取本层 K/V、重新计算 attention score、softmax 和 value aggregation。
- 更精确的 layer forward 包含两条并行投影路径。Indexer 用独立的轻量 $W_Q^I/W_K^I$ 和 per-layer index-key cache 为历史位置打分；MLA 路径把 hidden states 投影为 compressed latent KV 与独立 RoPE 分支。两条路径在 top-$k$ position IDs 处汇合：positions 决定本层 MLA core attention 读取哪些 KV entries，indexer 本身不直接生成或承载 MLA KV。
- “按 indices 取得 compressed KV 后执行 MLA”适合作为架构级简写。具体张量形态取决于执行模式：GLM-5 报告把 decode 描述为 576 维 latent KV 路径；通用 Transformers eager / SDPA 参考实现先通过 `kv_b_proj` 展开 head-specific K/V，再用 top-$k$ mask 限制可见集合；高性能 sparse / FlashMLA kernel 可以直接消费 indices 并融合 selected-KV 计算。三条路径保持同一逻辑语义，显存布局与实际 FLOPs 需要按 runtime 分开核算。
- 纯 head tensor parallel 下，展开后的 K/V 带有 head 维，可以按 TP rank 分配 local heads；MLA compressed latent 没有 head 维，常见 absorbed decode 实现会在每个 TP rank 复制完整 latent KV 与 RoPE cache，使各 rank 的 local query heads 都能直接访问完整 latent。若 TP degree 为 $T$，每 token、每 layer、每 rank 的展开缓存元素数约为 $\frac{H}{T}(d_k+d_v)$，replicated MLA 缓存约为 $d_c+d_r$，因此相对压缩倍数为

$$
R_{\mathrm{TP}}\approx\frac{H(d_k+d_v)}{T(d_c+d_r)}.
$$

- GLM-5.2 配置为 $H=64$、$d_k=256$、$d_v=256$、$d_c=512$、$d_r=64$，所以 $R_{\mathrm{TP}}\approx 56.9/T$：TP8、TP16、TP32 下每 rank 的 MLA core cache 分别约比展开 K/V 小 $7.1\times$、$3.6\times$、$1.8\times$。TP 增大会逐步削弱 replicated latent 的相对显存收益；纯 head-TP 接近 TP64 时，该比较已接近盈亏点。Context parallel 或专门的 sequence-sharded KV 方案可以沿 token 轴分摊 latent cache，同时引入 KV 交换通信。该估算只覆盖 MLA core cache；DSA index-key cache 需要另行计入，IndexShare 主要减少 selector 计算次数，不直接按四层压缩 MLA KV footprint。
- 标准 DSA 在每层都生成自己的集合 $\mathcal S_t^{(\ell)}$。GLM-5.2 的 FSSS IndexShare 把四层组成一组：Full anchor layer 计算 $\mathcal S_t$，随后三个 Shared layers 继承同一组 position IDs。Shared layers 仍使用各自的 query projection、KV cache、attention parameters 和输出，因此跨层流动的对象只有 top-$k$ positions。
- 两个机制作用于不同维度：DSA 沿序列轴把 core attention 的候选从 $L$ 压到 $k$；IndexShare 沿层深轴把 selector 执行比例从 $1$ 压到 $r$。令 $C_I$ 和 $C_A$ 分别表示 indexer 与 core attention 处理一个位置对的成本，prefill 可写为

$$
T_{\mathrm{DSA}}\approx N C_I L^2+N C_A Lk,
\qquad
T_{\mathrm{IndexShare}}\approx rN C_I L^2+N C_A Lk.
$$

- GLM-5.2 的固定 FSSS 对应 $r\approx 1/4$；decode 中把上式的 $L^2$、$Lk$ 分别替换成 $L$、$k$。IndexShare 降低 indexer dot product 与 top-$k$ 调用次数，各层 KV-cache footprint 和 sparse core attention 继续保留。
- 组合成立依赖相邻层选中位置高度重叠，以及 anchor indexer 能兼顾后续 Shared layers。GLM-5.2 从 128K mid-training 阶段引入固定 FSSS 以适应该结构；官方材料尚未披露具体 indexer distillation loss。

### 4. GLM-5.2 的 MLA TP 部署边界
- GLM-5.2 的 $R_{\mathrm{TP}}\approx56.9/T$ 说明 TP8 仍有约 $7.1\times$ 的 core cache 元素数优势；TP degree 继续上升时，每 rank 的相对收益逐步下降。IndexShare 减少 selector 次数，DSA top-$k$ 减少活跃 KV 读取，两者均不直接减少每层完整 MLA 历史 cache。
- GLM-5.2 的生产配置需要同时统计 MLA latent、decoupled RoPE key、DSA index-key、MTP/KVShare state 与 allocator 开销。高并发 decode 可优先评估 DP Attention + DeepEP + FP8 KV；单请求超长上下文评估 DCP/CP；Prefill 与 Decode 的最优拓扑差异较大时使用 P/D；HBM residency 仍不足时再叠加 HiCache/HiSparse。

### 5. 修正后的理解

- GLM-5.2 是 [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 的后续 release 节点。它继承报告中的 744B/A40B MoE、DSA、MTP 和 slime，并把重点推到 1M coding agent；公开 BF16 checkpoint 的实际存储参数量为 753.330B。
- slime 在 GLM-5.2 里承担 rollout，同时承接 parallel OPD、compact trajectory、sub-agent workflow 和 serving 配置复用。
- reward hacking 在 coding agent 中已经从研究风险变成 release blog 中需要正面处理的 production training issue。

### 6. 后续复验指标

- 1M context 下的 prefill throughput、decode throughput、KV cache occupancy、cache transfer overhead、CPU scheduling bubbles。
- MTP acceptance length 在不同任务、context length、draft steps 和 serving engine 下的稳定性。
- compaction 后的 sub-trace 数量分布、长度分布、critic variance、token-level advantage calibration。
- anti-hack guard 的召回、精度、误拦截率、rollout continuation success、模型是否学会转向更隐蔽路径。
- coding benchmark 的 effort level、max token、tool access、internet access、judge model 和 harness 差异。

## 主要启发

- 1M context 的真实工程门槛包括 position extrapolation、sparse attention indexer、KV cache、serving scheduler、tool trajectory 和训练目标。
- Sparse attention 的下一步瓶颈会落到“谁来选 top-k”上。IndexShare/IndexCache 把跨层 redundancy 变成生产优化点。
- Speculative decoding 的 draft model 训练要关注路径一致性；MTP 的 hidden state / KV 来源会直接影响 acceptance。
- Agentic RL 框架需要把 compact trajectory、sub-agent workflow、black-box rollout、white-box rollout、OPD 和 production serving 串起来。
- 防 reward hacking 需要进入 rollout 在线路径；只靠训练前数据清洗或训练后评测很难保护长期 agent 训练信号。

## 局限

1. 博文没有公开完整训练数据、RL reward、critic training、compaction implementation 和 anti-hack classifier 细节。
2. IndexShare 的 production 配置确认每四层复用一次 selection result，缺少 exact indexer training loss、质量消融和端到端 memory / latency accounting。
3. MTP ablation 使用 GLM-5.1 backbone / data，不完全等同 GLM-5.2 最终模型。
4. long-horizon coding benchmarks 仍依赖大量 harness 细节和外部 judge；跨模型比较需要统一运行环境。
5. anti-hack 防御可能引入新的 distribution shift：dummy observation、被拦截后的恢复策略、误拦截都可能影响策略学习。
6. GLM-5 Table 10 对 744B 的脚注与 GLM-5.2 checkpoint 张量实数无法直接对齐；报告正文的 80 层也未与 Table 10 和 checkpoint 的 78 个 target blocks 加 1 个 MTP block 对齐。公开资料尚未解释 MTP 参数共享、发布权重打包和论文统计口径之间的精确映射。

## 跨论文关系

- 与 [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/)：GLM-5.2 是 GLM-5 系列后续 release，沿用报告中的 744B/A40B、DSA、MTP、slime 和 agentic engineering 方向，并把 context 从 200K 推到 1M；当前 BF16 checkpoint 含 753.330B 个存储参数。
- 与 [IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/)：IndexCache 给出 Full / Shared 执行结构、training-free loss search 与 training-aware multi-layer distillation；GLM-5.2 将跨层 top-$k$ reuse 固化为 `index_topk_freq=4` 的 FSSS IndexShare，并扩展到 MTP iteration。公开资料没有确认 GLM-5.2 的 exact index loss。
- 与 [SGLang PR #29421](https://github.com/sgl-project/sglang/pull/29421)：该实现为 GLM-5.2 的 DSA Prefill CP 增加 cache layer split，在 CP=4、8192 tokens 下把 per-rank KV/indexer cache 从 0.77 GB 降到 0.20 GB，并让 PD decode 从全部 owner ranks 拉取对应 layer ranges；这一区分同时展示 TTFT compute parallelism 与 KV ownership 的容量作用。
- 与 [slime 官方仓库](https://github.com/THUDM/slime)：GLM-5.2 博文是 slime 支撑 GLM-5.2 的直接应用证据，覆盖 compact trajectory、sub-agent workflow、parallel OPD、KV-cache FP8 和 training-serving 配置复用。
- 与 [2606.12370](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/)：GLM-5.2 的 MTP 明确受 Bebop 启发，引入 rejection sampling 和 end-to-end TV loss，提高 speculative decoding acceptance。
- 与 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 和 [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)：MTP 的训练-推理路径一致性、DSA indexer reuse、rollout logprob consistency 都属于 train/inference consistency 的系统问题。
- 与 [2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/)：Seer 优化同步 rollout tail；GLM-5.2/slime 路线处理 compaction、异步/多形态 rollout 和 production serving 复用。两者共同说明 agentic RL 的主要成本在 rollout 和 serving。
- 与 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)：两者都是 1M context 级系统节点。DeepSeek-V4 强调 CSA/HCA、mHC、OPD 和 deterministic kernels；GLM-5.2 强调 DSA + IndexShare、MTP/KVShare、slime 和 coding agent long-horizon。
- 与 [2506.19248](/papers/2506.19248-inference-time-reward-hacking-llms/)、[2510.20270](/papers/2510.20270-impossiblebench-test-case-exploitation/)、[2503.11926](/papers/2503.11926-monitoring-reasoning-models-obfuscation/)：GLM-5.2 把 coding agent reward hacking 明确纳入 release-level 防御，提供了 online guard 的 production 视角。
- 与 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/)：两者都围绕 long-context / long-output agentic tasks 做系统优化。MiniMax-M1 使用 Lightning Attention 和 CISPO；GLM-5.2 使用 DSA + IndexShare、MTP/KVShare、PPO + compaction 和 slime。
- 与 [2607.07508 SAO](/papers/2607.07508-sao-single-rollout-asynchronous-agentic-rl/)：SAO 摘要声明该方法已用于 750B-A40B GLM-5.2 的 agentic RL pipeline，并补充 release blog 未展开的 single-rollout、rollout-logprob 双侧 token mask、faster critic update、frozen-attention value model 与 skip-observation GAE。SAO 的公开消融使用 Qwen3-30B-A3B，尚未披露这些配置映射到 GLM-5.2 的 scale-up 细节。
- 与 [CompactionRL](/papers/2607.05378-compactionrl-context-compaction-agent-rl/)：CompactionRL 同样声明进入 GLM-5.2 RL pipeline，并补充 release blog 中 compact trajectory 的训练语义：shared actor 生成 summary、最近两轮参与 context reconstruction、独立 critic、全 batch token normalization 和跨 segment GAE。公开消融只覆盖 GLM-4.7-Flash 与 GLM-4.5-Air-SFT，750B-A40B 上的 compaction threshold、critic topology、训练成本和实际增益仍未披露。

## Reference Intake Brief

### Target

- Intended target system: 维护 GLM-5.2 技术博客笔记，同步索引行和 GLM / slime / long-horizon agentic RL 关系章节。
- Existing related assets: [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/)；[IndexCache](/papers/2603.12201-indexcache-cross-layer-index-reuse/)；[2606.12370](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/)；[2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)。
- Proposed form: 维护 `2026-06-16-glm-5-2-long-horizon-tasks.md`；同步索引行和对应论文的关系章节。

### Reusable Elements

1. GLM-5.2 release surface：1M context、报告口径 744B/A40B、BF16 checkpoint 实数 753.330B、MIT license、BF16/FP8、SGLang/vLLM/Transformers/KTransformers。
2. Architecture chain：DSA -> IndexShare / IndexCache -> MTP IndexShare + KVShare -> rejection sampling -> TV loss。
3. RL chain：slime -> compact trajectory / sub-agent workflow -> parallel OPD -> critic-based PPO -> token-level loss。
4. Safety chain：coding reward hacking -> rule filter + LLM judge -> online guard -> dummy observation -> rollout continuation。

### Risks

- Copyright/over-copying: 本笔记用概括、表格重组和技术解释，没有复制大段原文。
- Unsourced or unverifiable claims: benchmark 和 release 信息来自官方 blog/model card/GitHub；机制关系标注为本地分析。
- Tone/brand mismatch: 保持论文目录技术分析风格，避免宣传式表述。
- Safety/compliance issues: 只保留 reward hacking 风险类别和防御设计，不记录可执行绕过步骤。
- Overlap with existing assets: 与 GLM-5 和 slime 有强重叠，本笔记定位为 GLM-5.2 release follow-up。

### Skipped

| Material | Reason |
| --- | --- |
| 博文中的具体 hacking 命令示例 | 双用途细节，归档中保留风险类别和防御机制即可 |
| 完整图片截图与可视化曲线 | 官方图表未以数据表形式完全公开；本笔记记录文本和表格中可抽取结果 |

### Recommendation

Decision: maintain

Why: GLM-5.2 是 GLM-5 / slime / long-horizon agentic RL 线的关键后续节点，补充了 1M context、IndexShare、MTP/KVShare、compaction PPO 和 online anti-hack 这些此前本地档案尚未完整覆盖的 production 设计。
