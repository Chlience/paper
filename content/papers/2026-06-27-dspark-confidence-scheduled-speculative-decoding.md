# DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation 论文笔记

First-Archived-At: 2026-06-28 14:28
Updated-At: 2026-06-28 14:28
Review-Status: approved
Reviewed-At: 2026-07-18 17:42

## Source

- Title: DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation
- arXiv: 未发现 DSpark 独立 arXiv 条目；相关 target model 报告见 [DeepSeek-V4](https://arxiv.org/abs/2606.19348)
- PDF: [GitHub PDF](https://github.com/deepseek-ai/DeepSpec/blob/main/DSpark_paper.pdf)；[raw PDF](https://raw.githubusercontent.com/deepseek-ai/DeepSpec/main/DSpark_paper.pdf)
- Code/Project: [DeepSpec](https://github.com/deepseek-ai/DeepSpec)；[DeepSeek-V4-Pro-DSpark checkpoint](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-DSpark)；[DeepSeek-V4-Flash-DSpark checkpoint](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-DSpark)
- OpenReview / Review page: 未发现可靠公开 OpenReview / ARR / 会议 reviewer comments。
- Authors: [Xin Cheng](/authors/xin-cheng-deepseek/), Xingkai Yu, Chenze Shao, Jiashi Li, Yunfan Xiong, Yi Qian, Jiaqi Zhu, Shirong Ma, Xiaokang Zhang, Jiasheng Ye, Qinyu Chen, Chengqi Deng, Jiping Yu, Damai Dai, Zhengyan Zhang, Yixuan Wei, Yixuan Tan, Wenkai Yang, Runxin Xu, Yu Wu, Zhean Xu, Xuanyu Wang, Muyang Chen, Rui Tian, Xiao Bi, Zhewen Hao, Shaoyuan Chen, Huanqi Cao, Wentao Zhang, Anyi Xu, Huishuai Zhang, Dongyan Zhao, Wenfeng Liang.
- Submitted: GitHub repo created 2026-06-26；PDF metadata CreationDate `D:20260627040849Z`；DeepSpec main observed 2026-06-28.
- Current version read: GitHub `deepseek-ai/DeepSpec` main，repo updated 2026-06-28，MIT License；PDF 33 页；Hugging Face DSpark checkpoint lastModified 2026-06-27.
- Subjects: speculative decoding, semi-autoregressive generation, DFlash backbone, Markov head, confidence head, Sequential Temperature Scaling, hardware-aware prefix scheduler, DeepSeek-V4 serving, DeepSpec.

## 作者与关系

- [Xin Cheng](/authors/xin-cheng-deepseek/): Peking University / DeepSeek-AI.
- [Xingkai Yu](/authors/xingkai-yu/): DeepSeek-AI.
- [Chenze Shao](/authors/chenze-shao/): DeepSeek AI.
- [Jiashi Li](/authors/jiashi-li/): DeepSeek AI.
- [Yunfan Xiong](/authors/yunfan-xiong/): Peking University.
- Yi Qian, Jiaqi Zhu, Shirong Ma, Xiaokang Zhang, Jiasheng Ye, Qinyu Chen, Chengqi Deng, Jiping Yu, Zhengyan Zhang, Yixuan Wei, Yixuan Tan, Wenkai Yang, Zhean Xu, Xuanyu Wang, Muyang Chen, Rui Tian, Xiao Bi, Zhewen Hao, Shaoyuan Chen, Huanqi Cao, Wentao Zhang, Anyi Xu: DSpark 标题页标注 DeepSeek-AI。
- [Damai Dai](/authors/damai-dai/), [Runxin Xu](/authors/runxin-xu/), [Yu Wu](/authors/yu-wu-deepseek/), [Wenfeng Liang](/authors/wenfeng-liang/): DeepSeek 系列、MoE、R1 / alignment 或组织层高频作者。
- [Huishuai Zhang](/authors/huishuai-zhang/), [Dongyan Zhao](/authors/dongyan-zhao/): Peking University.

## 一句话结论

DSpark 是 DeepSeek 把并行 drafter 推向生产 serving 的一套完整方案：用 DFlash 式 parallel backbone 先一次生成长候选块，再用低秩 Markov head 注入块内局部自回归依赖，随后用 calibrated confidence head 和硬件感知 prefix scheduler 按请求与负载动态裁剪 target verification 长度。离线 Qwen3 / Gemma 实验显示 accepted length 稳定超过 Eagle3 和 DFlash；DeepSeek-V4 线上流量显示 DSpark 在中等 SLA 下把 aggregate throughput 提升约 51%--52%，并在更高 tok/s/user 约束下维持 MTP-1 基线难以达到的并发区间。

## 阅读目标与判断边界

本笔记关注：

1. DSpark 如何把 DFlash 的 parallel draft capacity 和 autoregressive dependency modeling 组合起来。
2. confidence-scheduled verification 如何在保持 lossless speculative decoding 的前提下减少高并发验证浪费。
3. DeepSpec 开源训练框架、DeepSeek-V4 DSpark checkpoints 和线上 deployment 证据能支撑哪些结论。
4. DSpark 与 DFlash、Bebop/MTP、Seer、DeepSeek-V4、TIM/VeXact 的关系。

判断边界：

- DSpark 的最终输出质量仍由 target model verification 维持；论文主要讨论 latency、accepted length、throughput 和 serving frontier。
- 线上部署数据来自 DeepSeek-V4 生产系统 telemetry，外部团队很难完整复现同样硬件、traffic、ZOS、sparse attention kernel 和 V4 architecture。
- DeepSpec 开源 repo 支持 Qwen3 / Gemma 的公开训练与评估，但 DeepSeek-V4 内部训练框架 HAI-LLM、线上 scheduler 和 kernel 改动没有完整开源。
- 未发现 DSpark 独立 arXiv / OpenReview 条目；可信度主要来自 DeepSeek 官方 PDF、repo、checkpoint、代码配置和线上 telemetry 描述。

## 论文脉络

### 1. 研究问题、背景和价值

Speculative decoding 的基本公式可以写成：

```text
L = (T_draft + T_verify) / tau
```

其中 `tau` 是每轮平均接受 token 数，`T_draft` 是 draft model 生成候选块的时间，`T_verify` 是 target model 并行验证的时间。要提升速度，可以缩短 draft 时间、提高接受长度，或减少无价值 verification。

DFlash 已经证明 parallel drafter 可以一次生成较长候选块，降低 `T_draft` 对 block size 的敏感度。但 parallel drafter 的每个位置独立预测，缺少块内依赖，后缀 token 容易发生多模态组合错误。例如上下文同时支持 "of course" 和 "no problem" 时，独立位置预测可能组合出 "of problem"。这会让后面位置的 acceptance 快速下降。

同时，在生产 serving 中，长候选块还有系统侧问题。固定验证所有候选 token 在轻负载下成本可接受，在高并发下会占用 target model batch capacity；低置信后缀被拒绝的概率高，验证它们会降低总体吞吐。DSpark 处理的核心问题就是：如何保留 parallel draft 的低延迟和长块能力，同时让验证预算随请求难度与硬件负载变化。

### 2. 已有解决方案与不足

Eagle / Eagle3 这类 autoregressive drafter 能显式使用前序 draft token，因此后续位置的条件一致性较强；代价是 draft latency 近似随 block size 线性增加。为了控制 latency，autoregressive drafter 往往浅而短，第一位置的预测能力受限。

DFlash 等 parallel drafter 的结构优势相反：draft latency 对 block size 不敏感，可以使用更深 backbone 和更长 block，第一位置预测能力强；代价是后缀独立性带来 acceptance decay。

已有 adaptive speculative decoding 方法会用 confidence threshold 或 bandit policy 调整 draft / verify 长度，但很多设计面向单请求或静态阈值。生产 serving 的关键变量是系统负载：同一个候选 token 在低负载下值得验证，在高负载下可能挤占其他请求的 target forward capacity。因此 DSpark 把 verification length selection 表述为全局 expected throughput 最大化。

### 3. 作者可能的思考路径

作者可能先看到一个反直觉现象：parallel drafter 即使后缀衰减，整体 accepted length 仍可能超过 autoregressive drafter。原因是 speculative decoding 是严格 prefix survival，第一位置权重最高；parallel drafter 可以用更深 backbone 提高第一 token 准确率，进而放大整块收益。

下一步自然得到一个组合式设计：保留 parallel backbone 负责重计算部分，在 logits 输出处加一个极轻量 sequential correction，让第 `k` 个 draft token 看到已经采样出来的第 `k-1` 个 token。这样可以处理局部搭配和短程 mode consistency，同时避免把整个 drafter 改回高延迟 autoregressive model。

系统侧思路则来自 production serving 的 capacity curve：真实 target engine 的 `SPS(B)` 随 batch token 数变化，而且有离散硬件 cliff。若每个候选 prefix 有 survival probability `a_{r,j}`，系统应该优先把验证预算分给 survival probability 高、expected accepted tokens 回报高的位置，并用 profiled throughput table 判断是否继续扩展 batch。

### 4. 核心假设或切入点

核心假设有四条：

1. Parallel backbone 的第一 token capacity 很有价值，不能为了块内依赖直接回退到全自回归 draft。
2. 块内多模态冲突主要需要局部条件信号即可缓解，低秩 Markov transition bias 足够带来显著收益。
3. 每个 draft position 的 target-draft total variation distance 可以作为 analytical acceptance label，用于训练 confidence head。
4. Verification budget 在生产 serving 中需要按 engine load 与 request confidence 共同分配，静态阈值或固定长度都会浪费 batch capacity。

### 5. Semi-autoregressive generation

DSpark 的 draft model 分两段：

1. Parallel stage: 以 DFlash 为实例的 parallel backbone 一次 forward 产生 `h_1...h_gamma` 和 base logits `U_1...U_gamma`。论文对 DFlash 做一个小改动：把 anchor token 自身作为第一个预测位置，用 `anchor + gamma-1 masks` 产生 `gamma` 个 draft logits，减少 draft computation。
2. Sequential stage: 在每个位置的 base logits 上加 prefix-dependent transition bias：

```text
p_k(v | x_0, x_<k) =
  softmax(U_k(v) + B_k(x_0, x_<k, v))
```

默认实现是 Markov head，只依赖上一 draft token：

```text
B(x_{k-1}, .) = W_1[x_{k-1}] @ W_2
```

其中 `W_1` 是 token lookup，`W_2` 是 logit projection，rank 默认为 256。这个设计把完整 `V x V` transition matrix 降成低秩矩阵，存储和每步计算都较小。论文还评估了 RNN head，它能记录块内更长 prefix，但收益主要出现在更长 proposal length，部署复杂度更高，因此默认使用 Markov head。

### 6. Confidence head 与 STS calibration

Confidence head 输出每个位置的条件存活概率 `c_k`：在前面 token 都被接受的条件下，第 `k` 个 draft token 通过 target verification 的概率。它使用 backbone hidden state 和上一 token 的 Markov embedding：

```text
c_k = sigmoid(w^T [h_k; W_1[x_{k-1}]])
```

训练标签来自 target distribution `p_t` 与 draft distribution `p_d` 的 total variation distance：

```text
c*_k = 1 - 0.5 * ||p_d_k - p_t_k||_1
```

这个标签与 speculative decoding 的 rejection sampling 接受率一致，也连接 [2211.17192](/papers/2211.17192-fast-inference-transformers-speculative-decoding/) 和 [2606.12370 Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/) 中的 TV overlap 语言。

因为 scheduler 需要 cumulative survival probability 的绝对值，raw confidence 只会排序还不够。DSpark 使用 Sequential Temperature Scaling (STS) 在 held-out validation set 上逐位置校准累计乘积 `prod_{i<=k} c_i`，降低 Expected Calibration Error (ECE)。

### 7. Hardware-aware prefix scheduler

对活跃请求 `r=1...R`，每个请求的第 `j` 个 prefix survival probability 是：

```text
a_{r,j} = prod_{i<=j} c_{r,i}
```

若请求 `r` 被分配 verification length `ell_r`，目标模型这一轮看到的 token batch size 是：

```text
B = sum_r (1 + ell_r)
```

expected accepted tokens 是：

```text
tau = sum_r (1 + sum_{j<=ell_r} a_{r,j})
```

Engine 在 batch size `B` 下的 profiled steps-per-second 是 `SPS(B)`。Scheduler 最大化：

```text
Theta = tau * SPS(B)
```

算法将所有候选 prefix extension 按 `a_{r,j}` 从高到低排序，逐个加入，并用 profiled cost table 做 `O(1)` 查询。论文中的同步理论版本在 `Theta <= Theta_best` 时 early stop，以保证 admission decision 不依赖未来 draft token，维持 lossless speculative decoding 的 non-anticipating property。

Appendix A 给出反例：如果 retrospective search 在看到 `x_1` 后再决定是否 admit 第一个 token，那么 `x_1=A` 与 `x_1=B` 会导致不同 admission length，输出分布从 target `(0.7, 0.3)` 偏成 `(0.85, 0.15)`。这个反例说明 scheduler 的因果性是 correctness 条件的一部分。

### 8. Production adaptation

真实 DeepSeek-V4 serving 中有两个额外约束：

1. `SPS(B)` 是离散、阶梯状、带硬件 cliff 的 curve。
2. Zero-Overhead Scheduling (ZOS) 和 continuous CUDA graph replay 需要下一步 batch size 提前确定。

DSpark 因此采用异步近似：用两步前的 confidence 预测确定 dynamic top-K capacity limit，当前 step 的候选仍按最新 cumulative confidence 排序。这样调度 latency 被隐藏到 pipeline 中。由于容量 limit 来自历史信息，当前 token realization 不会反向影响 admission decision，作者认为这形成 causal barrier，可以在去掉 early-stopping 后仍保持 exact target distribution。

在 kernel 层，variable-length query 通过 flatten 所有 request 的 tokens 并用 marker tensor 表达逻辑依赖。DeepSeek-V4 架构中主要需要修改 index-attention 和 compress kernels，使动态 scheduler 可以处理不同请求的不同 verification prefix。

### 9. Training

公开 DeepSpec 配置和论文描述共同给出训练路线：

- Target model 冻结，draft model 共享并冻结 target embedding 与 LM head，只训练 parallel backbone、sequential block 和 confidence head。
- 训练从 target sequence 随机采样多个 anchor positions，组成 `gamma` token blocks。
- Loss 由 cross-entropy、TV distribution matching、confidence BCE 三项组成，位置权重为 `w_k = exp(-(k-1)/gamma)`。
- 默认权重：`alpha_ce=0.1`，`alpha_tv=0.9`，`alpha_conf=1.0`。
- DeepSpec `config/dspark/dspark_qwen3_4b.py` 使用 `block_size=7`、`num_draft_layers=5`、`target_layer_ids=[1,9,17,25,33]`、`num_anchors=512`、`markov_rank=256`、`global_batch_size=512`、`num_train_epochs=10`。
- DeepSpec 公开数据流程使用 `mlabonne/open-perfectblend`，重新用 target model 生成 responses，再构建 target cache。README 提醒默认 `Qwen/Qwen3-4B` target cache 约 38 TB。

### 10. 结论链条

论文的结论链条是：

1. Parallel drafter 的第一 token capacity 高，但后缀独立性导致 acceptance decay。
2. 低秩 Markov head 可以用很小额外延迟注入局部 dependency，保留 parallel backbone 的速度。
3. Confidence head 可以预测每个 prefix 的 survival probability，STS 校准后可用于 expected throughput 计算。
4. Hardware-aware scheduler 把 verification budget 分配给高回报候选 token，并随 engine load 收缩或放宽预算。
5. 离线 accepted length 改善证明 DSpark drafter quality 强于 Eagle3 和 DFlash；线上 telemetry 显示动态验证预算能把高并发 serving frontier 外移。

## 关键实验/定理

### 结果 1: Qwen3 / Gemma 离线 accepted length 主结果

- 设置：Target models 为 Qwen3-4B、Qwen3-8B、Qwen3-14B、Gemma4-12B；训练数据为 Open-PerfectBlend prompts，经 target model 用 recommended sampling params 重新生成 responses；non-thinking mode；每个 drafter 训练 10 epochs；评测 GSM8K、MATH500、AIME25、MBPP、HumanEval、LiveCodeBench、MT-Bench、Alpaca、Arena-Hard。
- Baseline：DFlash parallel drafter；Eagle3 autoregressive / TTT drafter。作者在同一训练框架和同一数据上重训 baseline，Eagle3 horizon 与 block size 对齐到 7；Eagle3 1 layer，DFlash / DSpark 5 layers。
- 指标：每轮 accepted length `tau`，包含 target-generated bonus token。
- 结果：Qwen3-4B 上 DSpark 在 9 个 benchmark 分别为 6.11、5.70、4.89、5.13、5.38、4.86、3.64、3.54、3.29；对应 DFlash 为 5.40、4.85、4.15、4.40、4.74、4.18、3.07、2.96、2.83。Qwen3-8B 与 14B 也保持同向优势。论文报告 DSpark 相比 Eagle3 的 macro-average accepted length 分别提升 30.9%、26.7%、30.0%，相比 DFlash 分别提升 16.3%、18.4%、18.3%。
- 解读：主结果较好地支持 DSpark 的 draft quality 改善。需要注意，离线结果禁用了 confidence scheduler，因此它验证的是 semi-autoregressive drafter 本身。

### 结果 2: Position-wise conditional acceptance 解释 parallel 与 semi-autoregressive 的差异

- 设置：Qwen3-4B target model，在 math/code/chat 三类 benchmark 上统计第 `k` 个位置的 conditional acceptance，即只在前 `k-1` 个 draft tokens 已被接受时统计第 `k` 个 token。
- Baseline：DFlash、Eagle3、DSpark。
- 指标：position-wise conditional acceptance rate。
- 结果：DFlash 第一位置明显高于 Eagle3，例如 Math 上约 0.88 vs 0.81，Chat 上约 0.72 vs 0.53；后续位置 DFlash 衰减明显，例如 Code 从约 0.87 降到 0.78，Chat 从约 0.72 降到 0.63。Eagle3 后续位置稳定或上升，Chat 可从约 0.53 到 0.74。DSpark 保留高初始接受率，并显著缓解后缀衰减。
- 解读：这解释了 DSpark 的结构取舍。Parallel backbone 解决第一 token capacity，Markov head 解决后缀局部一致性。

### 结果 3: Draft depth、proposal length 与 latency overhead

- 设置：Qwen3-4B target；block size / proposal length ablation；batch size 128 下测 per-round engine latency，context length 取 512、1024、2048、4096 的均值。
- Baseline：5-layer DFlash；不同层数的 DSpark；Markov head 与 RNN head。
- 指标：accepted length、relative gain、per-round latency。
- 结果：2-layer DSpark 已超过 5-layer DFlash。proposal length 增大时，DSpark 相对 DFlash 的收益扩大；`gamma=7` 时 math/code/chat 分别约 +16%/+15%/+18%，`gamma=15` 时扩大到 +30%/+26%/+22%。Markov head 到 RNN head 的额外收益有限。draft length 从 4 到 16 时，DSpark sequential head 只增加约 0.2%--1.3% full-round latency。
- 解读：一点局部自回归就能换来显著 acceptance 改善，且 target verification 在该 batch size 下仍主导 latency。

### 结果 4: Confidence head threshold 与 calibration

- 设置：Qwen3-4B，离线 threshold sweep；单独评估 confidence head，不使用 production hardware-aware scheduler。
- Baseline：threshold 0 等价固定长度验证；不同 confidence threshold。
- 指标：平均 accepted / rejected tokens、acceptance rate、Expected Calibration Error、ROC-AUC。
- 结果：提高 threshold 后 rejected tokens 下降，acceptance rate 上升。Chat workload 从 45.7% 提到 95.7%；Math 从 76.9% 到 92.5%；Code 从 67.6% 到 92.0%。Reliability diagram 显示 raw confidence 有较强 discrimination，AUC 约 0.81--0.90，但 ECE 为 3%--8%；STS 后平均 ECE 约 1%。
- 解读：confidence head 能识别低价值后缀，STS 对 scheduler 需要的绝对概率很关键。静态 threshold 只是诊断，线上核心仍是 load-aware scheduler。

### 结果 5: DeepSeek-V4 production deployment

- 设置：DeepSeek-V4-Flash preview 与 DeepSeek-V4-Pro preview；DSpark-5，最大 draft length `gamma=5`；parallel backbone 为 3 个 MoE layers，含 mHC 和 sliding window attention 128；Markov head；confidence head 经 STS calibration。对照是前生产基线 MTP-1。
- Baseline：MTP-1。论文说明 MTP-1 在 V4 preview release 两周后被 DSpark 取代；静态 MTP-3/5 在高并发下会因 verification overhead 降低 aggregate throughput。
- 指标：aggregate output throughput token/s/GPU、per-user generation speed tok/s/user、concurrent requests、平均 verification budget。
- 结果：V4-Flash 在 80 tok/s/user SLA 下，DSpark aggregate throughput 比 MTP-1 高 51%；在 120 tok/s/user SLA 下，名义 throughput 高 661%，作者明确将它解释为进入 baseline 难以支持的高 interactivity 区间。V4-Pro 在 35 tok/s/user SLA 下 throughput 高 52%；在 50 tok/s/user SLA 下名义高 406%。在 matched practical throughput levels 上，DSpark 将 per-user generation speed 提升 60%--85% (V4-Flash) 和 57%--78% (V4-Pro)。
- 解读：线上证据是本文最有工程价值的部分。作者对高 SLA 下大百分比做了谨慎解释：重点是 frontier shift 与非退化并发能力，常规倍数应看中等 SLA 或 matched throughput 比较。

### 结果 6: Load-adaptive verification budget

- 设置：同 DeepSeek-V4 live traffic；观察不同并发下 throughput 和 per-request verification budget。
- Baseline：MTP-1 静态验证预算。
- 指标：throughput 与平均 target verification budget。
- 结果：中等并发区间内，V4-Flash 少于 200 concurrent requests、V4-Pro 少于 150 concurrent requests 时，scheduler 会把验证预算从 MTP-1 的静态 2 tokens 扩展到约 4--6 tokens；并发上升、target capacity 接近饱和后，平均验证长度平滑下降。
- 解读：这直接支持 DSpark 的系统主张：低负载时用 idle compute 换 per-user speed，高负载时剪掉低置信后缀以保护 batch capacity。

### 实验设置与 baseline 审计

| 维度 | 记录 |
| --- | --- |
| 模型与初始化 | 离线 target: Qwen3-4B/8B/14B、Gemma4-12B；线上 target: DeepSeek-V4-Flash preview、DeepSeek-V4-Pro preview。Draft model 共享并冻结 target embedding / LM head。 |
| 数据与任务 | Open-PerfectBlend 1.3M samples，chat 17.6%、math 39.4%、code 38.9%、instruction-following 4.1%；只用 prompts，responses 由 target model 重新生成。评测覆盖 GSM8K、MATH500、AIME25、MBPP、HumanEval、LiveCodeBench、MT-Bench、Alpaca、Arena-Hard。 |
| RL / 训练配置 | 这篇论文聚焦 speculative decoding，不涉及 RL objective。Draft training 使用 CE、TV distribution matching、confidence BCE；position weight `exp(-(k-1)/gamma)`。 |
| 系统配置 | DeepSpec 默认单节点 8 GPUs；DeepSpec Qwen3-4B public config: BF16、global batch 512、10 epochs、torch compile、no shard。线上 DeepSeek-V4 部署使用 ZOS、CUDA graph replay、DeepSeek-V4 sparse attention kernels 和 internal HAI-LLM training framework。 |
| 技术报告训练配置 | Qwen3 DSpark public config: block size 7、5 draft layers、target feature layers `[1,9,17,25,33]`、512 anchors、Markov rank 256。DeepSeek-V4 DSpark: 3 MoE layers、mHC、sliding window attention 128、maximum block `gamma=5`。 |
| 训练硬件与拓扑 | 公开 DeepSpec 默认假设单节点 8 GPUs；论文没有披露完整 V4 DSpark 训练集群、GPU 型号、节点数和通信拓扑。 |
| 并行方式与框架 | DeepSpec 训练脚本每个 visible GPU 一个 worker；数据准备可用 SGLang / vLLM / TGI 等 OpenAI-compatible inference engine；内部 V4 training 使用 HAI-LLM hidden state communication 与 anchor-bounded sequence packing。 |
| 训练数据规模与组成 | Open-PerfectBlend 1.3M samples；V4 DSpark 训练数据细节未完整披露。 |
| 训练过程与超参 | Public config: lr 6e-4、warmup ratio 0.04、max grad norm 1.0、loss alpha 0.1/0.9/1.0、max length 4096、num anchors 512、10 epochs。 |
| 训练时间 / GPU hours / 成本 | 未披露总 GPU hours、wall-clock time、V4 DSpark 训练成本。 |
| 未披露项 | DeepSeek-V4 DSpark 训练数据、线上 engine capacity table、CUDA graph / ZOS 具体实现、kernel details、traffic mix、error bars、多 seed、完整 memory overhead。 |
| 评测协议 | 离线标准 speculative decoding，temperature 1.0，accepted length 包含 bonus token。线上报告 live traffic telemetry，scatter 是原始样本，solid lines 是 fitted performance frontiers。 |
| 统计报告 | 未见多 seed、置信区间或显著性检验。线上 telemetry 没有公开原始数据。 |
| Baseline 是否 tuned | DFlash 与 Eagle3 在同框架同数据重训，Eagle3 horizon 与 block size 对齐；线上 baseline 是生产 MTP-1。静态 MTP-3/5 作为弱部署选择被文字说明，没有给完整表格。 |
| Baseline 是否 compute-matched | 离线 training framework 和数据对齐较好；draft layers 设置不同是结构约束的一部分。线上比较为 production baseline 对照，硬件/traffic 一致性由作者描述。 |
| Baseline 是否 implementation-matched | 离线同框架较强；线上 MTP-1 与 DSpark 都在 DeepSeek-V4 serving engine 中。 |
| Baseline 是否覆盖强替代方案 | 覆盖 Eagle3、DFlash、MTP-1；没有统一复现 Medusa、P-EAGLE、PARD/DART、DDTree、Domino、DFlare、TETRIS、SpecBound 等同期系统。 |
| Baseline 是否存在弱化风险 | V4 线上 baseline 是 single-token MTP-1，因为静态多 token MTP 高并发吞吐差；这能代表 DeepSeek 生产基线，但不等价于所有 tuned MTP / adaptive scheduler。 |
| 结论边界 | DSpark 对 DeepSeek-V4 生产系统的证据强；跨模型、跨 inference engine、跨硬件 capacity curve 的迁移需要重新 profiling 和 kernel support。 |

## 证据链强度评估

### 强证据

- 方法机制与速度公式一致：parallel backbone 提高第一 token capacity，Markov head 改善后缀局部一致性，scheduler 降低低置信验证浪费。
- 离线结果覆盖 4 个 target models 和 9 个任务，baseline 在同一 DeepSpec 框架和数据上重训。
- 线上 DeepSeek-V4 telemetry 直接展示 production frontier shift，并把高 SLA 下的极大比例收益解释为可服务区间扩展。
- Appendix A 明确指出 scheduler 因果性与 lossless guarantee 的关系，避免把 retrospective search 误写成安全优化。

### 中等强度证据

- STS calibration 使 confidence head 的 ECE 降到约 1%，但公开图表只覆盖 Alpaca 等有限分析。
- DeepSpec repo 提供训练和评估代码，降低了公开复验门槛；默认 target cache 约 38 TB，使完整公开训练仍有很高存储成本。
- V4 DSpark checkpoints 已公开，但线上 scheduler、kernel 修改和 HAI-LLM 训练优化仍主要是报告描述。

### 需要谨慎的推论

- DSpark 在 DeepSeek-V4 上的生产收益不能直接外推到所有 vLLM / SGLang / TensorRT-LLM 部署；关键取决于 target model size、batch capacity curve、traffic concurrency、KV/cache 约束和 variable-length query kernel。
- MTP-1 是强生产基线，但 tuned MTP + adaptive verification、Bebop TV-trained MTP heads、DFlash + external scheduler 等组合仍需要同系统对照。
- 论文没有报告任务质量、用户满意度或 exact sampler consistency 的独立审计；lossless correctness 依赖 production verification 实现严格遵守 speculative sampling。

## OpenReview / 审稿意见吸收

- Venue status: 技术报告 / GitHub PDF；未发现 DSpark 独立 arXiv 或会议投稿页。观察日期 2026-06-28。
- Public reviews: 未发现可靠匹配的 OpenReview / ARR / 会议公开审稿页；搜索标题、DSpark、DeepSpec、OpenReview 和相关作者组合无可靠结果。
- Ratings / confidence: 无公开 rating / confidence。
- Reviewer consensus: 无公开 reviewer comments。
- Main criticisms: 无公开 reviewer comments；本地可信度边界主要来自 baseline 覆盖、线上 telemetry 不公开、训练成本与 kernel 细节披露不足。
- Author response: 未发现公开 rebuttal。
- 对本文可信度的影响: 不能写成已获会议 reviewer 背书；可以作为 DeepSeek-AI 官方技术报告、开源代码、公开 checkpoint 和 production telemetry 支撑的系统论文处理。

## 本地讨论补充

### 1. 讨论收敛点

- 初始归档结论：DSpark 是 DFlash 后的生产化 speculative decoding 节点。DFlash 解决 parallel draft quality；DSpark 进一步解决 parallel long block 的后缀一致性和高并发 verification waste。
- DSpark 的 scheduler 部分和算法部分同样重要。只看 accepted length 会低估 production serving 中 batch capacity 与 SLA frontier 的影响。

### 2. 修正后的理解

- HF checkpoint 的 `arxiv:2606.19348` 指向 DeepSeek-V4 技术报告，当前未发现 DSpark 独立 arXiv 条目；Source 中将其记录为相关 target model 报告。
- DeepSpec 开源 repo 是算法训练框架，当前支持 DSpark、DFlash、Eagle3；它提供 Qwen3/Gemma 公开复验路径，但 DeepSeek-V4 线上部署仍依赖内部 serving stack。

### 3. 后续复验指标

- 在 SGLang / vLLM 中复验 DSpark 的 exact target distribution、sampler consistency、batch-invariant behavior 和 variable verification length。
- 记录每个 workload 的 confidence calibration、accepted length、verification budget、draft latency、target latency、KV memory 和 throughput frontier。
- 对 DSpark、DFlash、Bebop/MTP、Eagle3、Seer grouped speculative decoding 做同 target / 同 backend / 同 concurrency 的统一对照。
- 对 DeepSpec public configs 测试不同 target cache layers、Markov rank、block size、anchor count 和训练数据规模的成本收益曲线。

## 主要启发

- Speculative decoding 的下一步重点会从“draft 更长”推进到“验证预算可调”。长候选块只在 scheduler 能按负载裁剪时稳定提升 production throughput。
- Semi-autoregressive drafter 是一个很实用的折中：并行 backbone 保留吞吐，局部 transition head 提供块内一致性。
- Confidence calibration 是系统优化变量。未校准的 confidence 可能仍能排序，但 expected throughput optimization 需要概率大小可靠。
- Lossless speculative decoding 的正确性条件会进入 scheduler 设计，admission decision 的时间顺序需要像 sampler 一样审计。
- DeepSpec 的 38 TB target cache 警示：draft model 训练的“开源可复现”还受 hidden-state cache、storage、target forward 成本约束。

## 局限

1. DSpark 独立公开审稿与 arXiv 条目暂缺，外部可信度主要来自官方报告和代码。
2. DeepSeek-V4 production setup 没有公开完整原始 telemetry、capacity table、kernel code、traffic distribution 和训练成本。
3. 离线实验报告 accepted length，没有直接报告任务准确率、采样分布一致性审计和用户级 quality metric。
4. 公开 DeepSpec 训练默认 target cache 极大，完整复验门槛高。
5. Baseline 没有覆盖所有同期 adaptive speculative scheduling 和 tuned MTP variants。

## 跨论文关系

- 与已有论文的作者关系：DSpark 与 [Engram](/papers/2601.07372-conditional-memory-engram-scalable-lookup/)、[DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)、[DeepSeek-R1](/papers/2501.12948-deepseek-r1-rl-reasoning/) 和 [DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 有大量 DeepSeek 作者网络重叠；本轮新增 Chenze Shao、Jiashi Li、Yunfan Xiong 作者档案，并为 Xin Cheng、Xingkai Yu 补 DSpark 来源。
- 与已有论文的主题关系：继承 [2211.17192](/papers/2211.17192-fast-inference-transformers-speculative-decoding/) 的 rejection sampling / TV acceptance 机制，直接使用 [2602.06036 DFlash](/papers/2602.06036-dflash-block-diffusion-speculative-decoding/) 作为 parallel backbone，补充 [2606.12370 Bebop](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/) 的 MTP / TV loss 路线和 [2511.14617 Seer](/papers/2511.14617-seer-online-context-learning-llm-rl/) 的 rollout serving 路线。
- 与已有论文的方法或系统关系：[DeepSeek-V4](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 是 DSpark 的 target serving 环境，涉及 CSA/HCA、mHC、ZOS、deterministic kernels 和 variable-length sparse attention kernels；[TIM/VeXact](/papers/2605.14220-training-inference-mismatch-llm-rl/) 与 [inference determinism](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 提供后续复验语言。
- 跨论文关系定位：连接 speculative decoding / rollout acceleration、DeepSeek-V4 production serving、Engram / DeepSeek author network 与 DeepSeek 系列。

## Reference Intake Brief

### Target

- Intended target system: 新增论文笔记；更新 `content/utility/papers-index.md`；更新 `data/authors.json`。
- Existing related assets: `content/utility/papers-index.md`；[2211.17192](/papers/2211.17192-fast-inference-transformers-speculative-decoding/)、[2602.06036](/papers/2602.06036-dflash-block-diffusion-speculative-decoding/)、[2606.12370](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/)、[2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/)、[2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/)、[2601.07372](/papers/2601.07372-conditional-memory-engram-scalable-lookup/)。
- Proposed form: 新建独立 Markdown 文档，更新当前收录、speculative decoding 和 DeepSeek 系列跨论文关系。

### Reusable Elements

1. Semi-autoregressive drafter: parallel backbone + Markov/RNN sequential head。
2. Confidence labels from TV distance and STS calibration。
3. Hardware-aware prefix scheduler: `Theta = tau * SPS(B)`。
4. Causality condition for lossless scheduler admission。
5. Production DSpark / MTP-1 comparison under DeepSeek-V4 live traffic。

### Risks

- Copyright/over-copying: 只保留短句、公式和结果摘要，不复制长段原文。
- Unsourced or unverifiable claims: DSpark 独立 arXiv / reviewer comments 未找到；V4 telemetry 不能独立复算。
- Tone/brand mismatch: 作为技术报告处理，不写成会议 accepted paper。
- Safety/compliance issues: 推理加速系统论文，无直接双用途安全操作细节。
- Overlap with existing assets: 与 DFlash / Bebop / DeepSeek-V4 重叠较强，本条作为 DSpark 机制与线上 scheduler 节点。

### Skipped

| Material | Reason |
| --- | --- |
| DSpark 独立 arXiv | 未发现可靠独立条目；HF checkpoint 标签指向 DeepSeek-V4 arXiv:2606.19348。 |
| 公开 reviewer comments | 未发现 OpenReview / ARR / 会议公开审稿页。 |
| 完整 33 人作者逐人建档 | 多数 DeepSeek 内部作者缺少稳定个人 profile / X 交叉证据；本轮只补等贡 / contact authors 和既有核心作者。 |
| DeepSeek-V4 production raw telemetry | 论文只给图与聚合描述，未公开原始数据。 |

### Recommendation

Decision: merge

Why: DSpark 补齐了本地 speculative decoding 图谱中从 DFlash 离线 drafter 到 DeepSeek-V4 production serving 的关键系统节点。它把 draft architecture、confidence calibration、硬件感知验证预算和线上吞吐 frontier 放在同一条证据链中，能与 DFlash、Bebop、Seer、DeepSeek-V4 和 TIM/VeXact 形成稳定关系。
