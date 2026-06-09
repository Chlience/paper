# Paper Archive Index

Date: 2026-06-09

## 本地工作流

- 目录规则：`AGENTS.md`
- 论文分析 SOP：[paper-analysis-workflow.md](/workflow/)
- 论文笔记模板：[paper-note-template.md](/template/)

## 当前收录

| arXiv | Title | Local Note | Theme | Authors / Institutions |
| --- | --- | --- | --- | --- |
| TML-2025-09-10 | Defeating Nondeterminism in LLM Inference | [2025-09-10-defeating-nondeterminism-llm-inference.md](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) | LLM inference determinism, batch-invariant kernels, reproducible serving, true on-policy RL | Horace He / Thinking Machines Lab |
| 2605.14220 | Diagnosing Training Inference Mismatch in LLM Reinforcement Learning | [2605.14220-training-inference-mismatch-llm-rl.md](/papers/2605.14220-training-inference-mismatch-llm-rl/) | Training-Inference Mismatch, zero-mismatch rollout, VeXact, RL stability, batch-invariant kernels | Tianle Zhong / ByteDance and University of Virginia; Neiwen Ling, Yifan Pi, Zijun Wei, Tianshu Yu, Peng Wu, Xiao Yu / ByteDance; Geoffrey Fox / University of Virginia |
| 2503.14476 | DAPO: An Open-Source LLM Reinforcement Learning System at Scale | [2503.14476-dapo-long-cot-rl-system.md](/papers/2503.14476-dapo-long-cot-rl-system/) | Long-CoT reasoning RL, DAPO, GRPO recipe, VERL, open-source reproduction | Qiying Yu, Weinan Dai, Yuxuan Tong, Hongli Yu, Yuxuan Song / ByteDance Seed, AIR Tsinghua, SIA-Lab; Guangming Sheng / ByteDance Seed and HKU; large ByteDance Seed and Tsinghua AIR/SIA-Lab collaboration |
| 2504.13837 | Does Reinforcement Learning Really Incentivize Reasoning Capacity in LLMs Beyond the Base Model? | [2504.13837-rlvr-reasoning-boundary-base-model.md](/papers/2504.13837-rlvr-reasoning-boundary-base-model/) | RLVR reasoning boundary, pass@k, sampling efficiency, base-model prior, distillation vs RL | Yang Yue, Zhiqi Chen, Rui Lu, Andrew Zhao, Yang Yue, Shiji Song, Gao Huang / LeapLab, Tsinghua University; Zhaokai Wang / Shanghai Jiao Tong University |
| 2506.10947 | Spurious Rewards: Rethinking Training Signals in RLVR | [2506.10947-spurious-rewards-rethinking-rlvr.md](/papers/2506.10947-spurious-rewards-rethinking-rlvr/) | RLVR reward signals, spurious rewards, GRPO clipping bias, Qwen priors, code reasoning | Rulin Shao, Shuyue Stella Li, Rui Xin, Scott Geng, Yiping Wang, Sewoong Oh, Simon Shaolei Du, Yulia Tsvetkov, Luke Zettlemoyer / University of Washington; Nathan Lambert / AI2; Sewon Min / UC Berkeley; Ranjay Krishna, Hannaneh Hajishirzi, Pang Wei Koh / UW and AI2 |
| 2505.24864 | ProRL: Prolonged Reinforcement Learning Expands Reasoning Boundaries in Large Language Models | [2505.24864-prorl-prolonged-rl-reasoning-boundaries.md](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/) | Prolonged RL, RLVR reasoning boundary, GRPO/DAPO recipe, KL reset, pass@k expansion | Mingjie Liu, Shizhe Diao, Ximing Lu, Jian Hu, Xin Dong, Yejin Choi, Jan Kautz, Yi Dong / NVIDIA |
| 2501.09620 | Beyond Reward Hacking: Causal Rewards for Large Language Model Alignment | [2501.09620-causal-rewards-llm-alignment.md](/papers/2501.09620-causal-rewards-llm-alignment/) | RLHF reward modeling, causal debiasing, counterfactual invariance, MMD regularization, reward hacking | Chaoqi Wang / Meta and University of Chicago; Zhuokai Zhao, Chen Zhu, Jiayi Liu, Lizhu Zhang, Xiangjun Fan, Hao Ma, Sinong Wang / Meta; Yibo Jiang, Zhaorun Chen, Yuxin Chen / University of Chicago |
| 2403.03185 | Correlated Proxies: A New Definition and Improved Mitigation for Reward Hacking | [2403.03185-correlated-proxies-reward-hacking.md](/papers/2403.03185-correlated-proxies-reward-hacking/) | Reward hacking, correlated proxy reward, occupancy measure regularization, ORPO, RLHF safety | Cassidy Laidlaw, Shivam Singhal, Anca Dragan / UC Berkeley EECS |
| 2503.11926 | Monitoring Reasoning Models for Misbehavior and the Risks of Promoting Obfuscation | [2503.11926-monitoring-reasoning-models-obfuscation.md](/papers/2503.11926-monitoring-reasoning-models-obfuscation/) | CoT monitoring, obfuscated reward hacking, monitorability tax, reasoning model safety, agentic coding RL | Bowen Baker, Joost Huizinga, Leo Gao, Zehao Dou, Melody Y. Guan, Aleksander Madry, Wojciech Zaremba, Jakub Pachocki, David Farhi / OpenAI |
| 2501.12948 | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning | [2501.12948-deepseek-r1-rl-reasoning.md](/papers/2501.12948-deepseek-r1-rl-reasoning/) | Pure RL reasoning, DeepSeek-R1/R1-Zero, GRPO, verifiable reward, distillation, RL safety | DeepSeek-AI and 199 other authors; core contributors include Daya Guo, Peiyi Wang, Junxiao Song, Zhibin Gou, Zhihong Shao, Xiao Bi, Xingkai Yu, Shirong Ma, Haowei Zhang, Ziyi Gao |
| 2409.19256 | HybridFlow: A Flexible and Efficient RLHF Framework | [2409.19256-hybridflow-rlhf-framework.md](/papers/2409.19256-hybridflow-rlhf-framework/) | RLHF systems, distributed post-training infrastructure, VERL | Guangming Sheng, Chuan Wu / The University of Hong Kong; Chi Zhang, Zilingfeng Ye, Xibin Wu, Wang Zhang, Ru Zhang, Yanghua Peng, Haibin Lin / ByteDance |
| 2606.00135 | On Effectiveness and Efficiency of Agentic Tool-calling and RL Training | [2606.00135-agentic-tool-calling-rl-training.md](/papers/2606.00135-agentic-tool-calling-rl-training/) | Agentic tool-calling, evaluation reproducibility, RL training efficiency | Tong Liu / LMU Munich and MCML; Cheng Qian / UIUC; Matej Cief, Yuan He, Daniele Dan, Gabriella Kazai / Amazon; Nikolaos Aletras / University of Sheffield |
| 2606.04075 | Large Language Models Hack Rewards, and Society | [2606.04075-llms-hack-rewards-and-society.md](/papers/2606.04075-llms-hack-rewards-and-society/) | LLM safety, societal hacking, RL post-training | Wei Liu, Hanqi Yan, Yulan He / KCL; Xinyi Mou, Zhongyu Wei / Fudan; Yulan He / Alan Turing Institute |
| 2605.31514 | If LLMs Have Human-Like Attributes, Then So Does Age of Empires II | [2605.31514-age-of-empires-anthropomorphism.md](/papers/2605.31514-age-of-empires-anthropomorphism/) | LLM anthropomorphism, methodology, AI philosophy | Adrian de Wynter / Microsoft and University of York |
| 2605.30290 | Self-Trained Verification for Training- and Test-Time Self-Improvement | [2605.30290-self-trained-verification.md](/papers/2605.30290-self-trained-verification/) | Reasoning verification, test-time self-improvement, RLVR, verifier-in-the-loop training | Chen Henry Wu, Aditi Raghunathan / Carnegie Mellon University |
| 2510.19315 | Transformers are Inherently Succinct | [2510.19315-transformers-inherently-succinct.md](/papers/2510.19315-transformers-inherently-succinct/) | Transformer theory, formal languages, verification complexity | Pascal Bergsträßer / RPTU; Ryan Cotterell / ETH Zürich; Anthony W. Lin / RPTU and MPI-SWS |
| 2606.06453 | Vortex: Efficient and Programmable Sparse Attention Serving for AI Agents | [2606.06453-vortex-sparse-attention-serving.md](/papers/2606.06453-vortex-sparse-attention-serving/) | LLM serving, sparse attention, AI-agent-assisted systems research | CMU core team with Rice and NUS collaborators |
| 2606.04101 | UltraEP: Unleash MoE Training and Inference on Rack-Scale Nodes with Near-Optimal Load Balancing | [2606.04101-ultraep-rack-scale-moe-load-balancing.md](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/) | MoE systems, expert parallelism, rack-scale nodes, exact-load balancing, training and prefill serving | Xinming Wei, Chao Jin, Yinmin Zhong, Bingyang Wu, Zili Zhang, Jing Mai, Guojie Luo / Peking University; Tuo Dai / RedNote; Shan Yu / Shanghai AI Laboratory; Chengxu Yang, Qianchao Zhu, Zhouyang Li, Yuliang Liu / Independent Researcher |
| 2606.04662 | Why Muon Outperforms Adam: A Curvature Perspective | [2606.04662-muon-outperforms-adam-curvature.md](/papers/2606.04662-muon-outperforms-adam-curvature/) | Optimizer geometry, Muon vs Adam, curvature penalty, normalized directional sharpness, LLM pretraining | Shuche Wang / National University of Singapore; Fengzhuo Zhang, Dirk Bergemann, Zhuoran Yang / Yale University; Jiaxiang Li / University of Minnesota |

## 作者关系图谱

### Cluster A: LLM 安全与社会制度风险

- Paper: `2606.04075`
- Institutions: King's College London, Fudan University, The Alan Turing Institute。
- Internal relation: KCL-Fudan 双核心协作；Wei Liu 与 Xinyi Mou 为 equal contribution；Yulan He 连接 KCL 与 The Alan Turing Institute。
- Theme relation: reward hacking, societal hacking, RL post-training, governance simulation。

### Cluster B: LLM 拟人化与方法论批评

- Paper: `2605.31514`
- Institutions: Microsoft, The University of York。
- Internal relation: 单作者；产业研究和大学研究双重身份。
- Theme relation: anthropomorphism, measurement, substrate/interface sensitivity, null assumption。

### Cluster C: Transformer 理论与形式语言

- Paper: `2510.19315`
- Institutions: RPTU Kaiserslautern-Landau, ETH Zürich, MPI-SWS。
- Internal relation: Pascal Bergsträßer 与 Anthony W. Lin 同属 RPTU；Anthony W. Lin 连接 MPI-SWS；Ryan Cotterell 连接 ETH Zürich 的 NLP/理论方向。
- Theme relation: succinctness, LTL, automata, RNN, UHAT, EXPSPACE verification。

### Cluster D: LLM Serving 与稀疏注意力系统

- Paper: `2606.06453`
- Institutions: Carnegie Mellon University, Rice University, National University of Singapore。
- Internal relation: CMU 为核心；Xinrui Zhong 连接 Rice；Michael Qizhe Shieh 连接 NUS。
- Theme relation: sparse attention, paged KV cache, SGLang integration, vFlow/vTensor, AI-agent algorithm search。

### Cluster E: Agentic Tool-calling 评测与 RL 训练效率

- Paper: `2606.00135`
- Institutions: Amazon, LMU Munich / Munich Center for Machine Learning, UIUC, University of Sheffield。
- Internal relation: Amazon 作者群为核心；Tong Liu 连接 LMU/MCML 且脚注说明工作完成于 Amazon；Nikolaos Aletras 连接 University of Sheffield 且脚注说明工作完成于 Amazon；Cheng Qian 连接 UIUC；Tong Liu 与 Gabriella Kazai 为通讯作者。
- Theme relation: tool-calling evaluation reproducibility, BFCL/ACEBench, GRPO, zero-variance prompts, pre-rollout filtering, rollout down-sampling, RL training wall-clock efficiency。

### Cluster F: Reasoning Verification 与 Self-Improvement

- Paper: `2605.30290`
- Institutions: Carnegie Mellon University。
- Internal relation: Chen Henry Wu 与 Aditi Raghunathan 同属 CMU；论文和代码仓库位于 AR-FORUM / A|Raghunathan Lab 研究线索；项目受 DARPA expMath、Schmidt Sciences、NSF、Apple、Open Philanthropy、Google 和 CMU FLAME Cluster 支持。
- Theme relation: self-trained verification, reference-conditioned verifier, on-policy distillation, verifier-guided refinement, verifier-in-the-loop training, RLVR plateau, test-time scaling, verifier calibration。

### Cluster G: RLHF Systems 与 Distributed Post-training Infrastructure

- Paper: `2409.19256`
- Institutions: The University of Hong Kong, ByteDance。
- Internal relation: Guangming Sheng 与 Chuan Wu 属 HKU；Chi Zhang、Zilingfeng Ye、Xibin Wu、Wang Zhang、Ru Zhang、Yanghua Peng、Haibin Lin 属 ByteDance；论文受 ByteDance Research Collaboration Project 与 Hong Kong RGC 支持。
- Theme relation: HybridFlow, VERL, RLHF dataflow, hybrid controller, hierarchical APIs, transfer protocols, 3D-HybridEngine, auto device mapping, PPO/ReMax/Safe-RLHF systems。

### Cluster H: LLM Inference Determinism 与 Batch-Invariant Kernels

- Material: `TML-2025-09-10`
- Organization: Thinking Machines Lab。
- Internal relation: Horace He 为署名作者，文章说明与 Thinking Machines Lab 其他成员合作完成；完整合作者名单未列出。
- Theme relation: inference nondeterminism, batch invariance, batch-invariant RMSNorm/matmul/attention, vLLM deterministic mode, FlexAttention, sampler-trainer consistency, true on-policy RL。

### Cluster I: Training-Inference Mismatch 与 Zero-Mismatch RL

- Paper: `2605.14220`
- Institutions: ByteDance, The University of Virginia。
- Internal relation: Tianle Zhong 与 Neiwen Ling 为 equal contribution；Peng Wu 与 Xiao Yu 为 corresponding authors；Tianle Zhong 连接 ByteDance 与 UVA；Geoffrey Fox 代表 UVA 合作线。
- Theme relation: Training-Inference Mismatch, behavior-policy/optimization-policy distribution mismatch, VeXact, zero-mismatch rollout, FSDP2 + vLLM/VeXact, batch-invariant kernels, REINFORCE/GRPO stability, recomputation vs bypass, TIS, sequence-level rejection, MoE routing amplification。

### Cluster J: Long-CoT Reasoning RL Recipe 与 Open-Source Reproduction

- Paper: `2503.14476`
- Institutions: ByteDance Seed, Institute for AI Industry Research (AIR) at Tsinghua University, SIA-Lab of Tsinghua AIR and ByteDance Seed, The University of Hong Kong。
- Internal relation: Qiying Yu 为 project lead；algorithm、infrastructure、dataset、supervision 分工明确；ByteDance Seed 是核心工程组织；Tsinghua AIR/SIA-Lab 提供联合研究和监督；Guangming Sheng 连接 HKU 与 ByteDance Seed。
- Theme relation: DAPO, long-CoT RL, GRPO, Clip-Higher, Dynamic Sampling, Token-level Policy Gradient Loss, Overlong Reward Shaping, DAPO-Math-17K, rule-based verifier, AIME 2024, verl open-source reproduction。

### Cluster K: Pure RL Reasoning Models 与 DeepSeek-R1 系谱

- Paper: `2501.12948`
- Organization: DeepSeek-AI。
- Internal relation: Daya Guo 与 Peiyi Wang 共同验证 outcome-based RL induces long-CoT emergence；Junxiao Song 提出 GRPO 初版并引入 math rule-based reward；Zhibin Gou 提出 large PPO clipping strategy；Xiao Bi、Xingkai Yu、Shirong Ma、Xiaokang Zhang、Haowei Zhang、Ziyi Gao 负责 RL pipeline 和系统稳定性；Zhibin Gou led R1-distill series。
- Theme relation: DeepSeek-R1-Zero, DeepSeek-R1, pure RL reasoning, GRPO, verifiable reward, long-CoT emergence, cold-start SFT, two-stage RL, rejection sampling, distillation, reward hacking, safety risk control。

### Cluster L: MoE Expert Parallelism 与 Rack-Scale Load Balancing

- Paper: `2606.04101`
- Institutions: Peking University, RedNote, Shanghai AI Laboratory, Independent Researcher。
- Internal relation: Peking University 作者群为核心；Xinming Wei 带 RedNote internship 脚注，连接 PKU 与 RedNote；Tuo Dai 代表 RedNote；Shan Yu 连接 Shanghai AI Laboratory；Yuliang Liu 与 Guojie Luo 为 corresponding authors，分别连接 independent researcher 作者群与 PKU 作者群。
- Theme relation: UltraEP, MoE expert parallelism, exact-load real-time balancing, rack-scale nodes, quota-driven replication and reroute, persistent tile streaming, chunk streaming relay, Megatron-LM, SGLang, DeepEP, training and serving prefill。

### Cluster M: Optimizer Geometry 与 Muon 曲率机制

- Paper: `2606.04662`
- Institutions: National University of Singapore, Yale University, University of Minnesota。
- Internal relation: Shuche Wang 与 Fengzhuo Zhang 为 equal contribution；Fengzhuo Zhang 为 project lead；Fengzhuo Zhang 与 Zhuoran Yang 为 corresponding authors；Yale University 作者群包含 Fengzhuo Zhang、Dirk Bergemann、Zhuoran Yang。
- Theme relation: Muon, Adam, optimizer geometry, second-order Taylor approximation, curvature penalty, Normalized Directional Sharpness, data imbalance, Zipf-PCFG, within-layer/cross-layer Hessian decomposition, structured matrix-block quadratic model。本地讨论已扩展 optimizer design space 对比，覆盖 AdamW、Muon、Shampoo、SOAP、Adafactor、8-bit AdamW、GaLore、APOLLO、Lion、SGD/Momentum 的计算方法、成本来源和性能来源。

### Cluster N: Reward Modeling Causal Debiasing 与 RLHF Alignment

- Paper: `2501.09620`
- Institutions: Meta, University of Chicago。
- Internal relation: Chaoqi Wang、Zhuokai Zhao、Yibo Jiang、Zhaorun Chen 为 equal contribution；Chaoqi Wang 连接 Meta 与 University of Chicago，并带 Meta internship 脚注；Zhuokai Zhao、Chen Zhu、Jiayi Liu、Lizhu Zhang、Xiangjun Fan、Hao Ma、Sinong Wang 属 Meta 作者群；Yibo Jiang、Zhaorun Chen、Yuxin Chen 属 University of Chicago 作者群。
- Theme relation: causal reward modeling, counterfactual invariance, MMD independence regularization, RLHF reward hacking, length bias, sycophancy bias, concept bias, discrimination bias, Causal-DPO objective。

### Cluster O: Correlated Proxy Reward Hacking 与 Occupancy Regularization

- Paper: `2403.03185`
- Institutions: University of California, Berkeley EECS。
- Internal relation: Cassidy Laidlaw 与 Shivam Singhal 为 equal contribution；Cassidy Laidlaw 为 arXiv submission history 中的提交者；三位作者同属 UC Berkeley EECS，Anca Dragan 关系判断上承担 Berkeley human-centered AI / robot learning / alignment 研究线的 senior author 角色。
- Theme relation: correlated proxy reward, reference policy, reward hacking definition, occupancy measure regularization, $\chi^2$ divergence, ORPO, RLHF action-distribution regularization, multi-turn agent safety。

### Cluster P: CoT Monitorability 与 Obfuscated Reward Hacking

- Paper: `2503.11926`
- Organization: OpenAI。
- Internal relation: Bowen Baker、Joost Huizinga、David Farhi 为 core research team；Bowen Baker 负责 obfuscation experiments、CoT vs. Action monitoring analysis 和 GPT-4o-mini comparison；Joost Huizinga 构建 CoT monitors 和 frontier monitoring infrastructure；Bowen Baker 与 David Farhi 共同负责研究方向；Jakub Pachocki 在 OpenAI 内部推动该研究方向。
- Theme relation: CoT monitoring, reasoning model safety, agentic coding reward hacking, obfuscated reward hacking, monitorability tax, process supervision risk, scalable oversight, activation vs. CoT monitoring。

### Cluster Q: RLVR Reasoning Boundary 与 Sampling Efficiency

- Paper: `2504.13837`
- Institutions: LeapLab, Tsinghua University; Shanghai Jiao Tong University。
- Internal relation: Yang Yue（乐洋）和 Zhiqi Chen 为 equal contribution；Yang Yue（乐洋）为 project lead，发现并提出 RL 后 pass@k 被 base model 超过的现象；Zhiqi Chen 负责大量 pass@k 和 perplexity 实验；Gao Huang 与 Shiji Song 监督研究；Zhaokai Wang 连接 Shanghai Jiao Tong University；第六作者 Yang Yue（乐阳）与第一作者英文名相同但中文名不同，需要在后续作者关系中区分。
- Theme relation: RLVR reasoning boundary, pass@k coverage, sampling efficiency gap, base-model prior, binary verifiable reward, perplexity analysis, entropy analysis, distillation vs RL, agentic exploration。

### Cluster R: Spurious Reward Signals 与 RLVR Prior Amplification

- Paper: `2506.10947`
- Institutions: University of Washington, Allen Institute for Artificial Intelligence, University of California, Berkeley。
- Internal relation: Rulin Shao、Shuyue Stella Li、Rui Xin、Scott Geng 为 equal contribution，并共同出现在 correspondence email list；UW 是核心作者群；Nathan Lambert 代表 AI2；Ranjay Krishna、Hannaneh Hajishirzi、Pang Wei Koh 连接 UW 与 AI2；Sewon Min 连接 UC Berkeley。
- Theme relation: spurious rewards, random reward baseline, format reward, incorrect reward, GRPO clipping bias, Qwen-Math prior, code reasoning, prompt sensitivity, model-family validation, RLVR methodology。

### Cluster S: Prolonged RL 与 Reasoning Boundary Expansion

- Paper: `2505.24864`
- Organization: NVIDIA。
- Internal relation: 全部作者署名 NVIDIA；Xin Dong、Yejin Choi、Jan Kautz、Yi Dong 在标题页加粗，关系判断上更接近 senior / supervising authors；论文发布 Nemotron-Research-Reasoning-Qwen-1.5B 权重，属于 NVIDIA Nemotron reasoning model 研究线。
- Theme relation: ProRL, prolonged reinforcement learning, reasoning boundary expansion, pass@128, GRPO, DAPO Clip-Higher, dynamic sampling, KL regularization, reference policy reset, multi-task verifiable rewards, Reasoning Gym, OOD generalization。

## 跨论文关系

- `2505.24864` 新增 prolonged RL / reasoning boundary expansion 节点。它把 `2504.13837` 的 sampling efficiency 观点条件化：在 base model 已经熟悉的 math tasks 上，RL 仍可能收缩 pass@128；在 base pass@128 较低、任务多样且训练足够长的设置中，ProRL 观察到 sustained pass@k gains。
- `2505.24864` 和 `2506.10947` 构成 RLVR gain 来源诊断的正反面。`2506.10947` 说明 random / format / incorrect rewards 能放大 Qwen-Math prior；`2505.24864` 则用 OOD tasks、low-base-competence tasks、pass@128 gain 和 distribution shift 论证部分 ProRL gains 超出 prior amplification。后续关键复验是给 ProRL 加 spurious reward baseline。
- `2505.24864` 和 `2503.14476` 方法关系非常强。ProRL 直接采用 DAPO 的 decoupled clipping、Clip-Higher 和 dynamic sampling，并同样基于 verl；区别是 ProRL 重新引入 KL regularization、reference policy reset 和 staged training，目标是 prolonged RL 的稳定性。
- `2505.24864` 和 `2501.12948` 是 DeepSeek-R1 系谱的下游延展。ProRL 以 DeepSeek-R1-Distill-Qwen-1.5B 为起点，继续用 GRPO/verifiable reward 训练，并把关注点从 long-CoT emergence 推进到 pass@k boundary expansion。
- `2505.24864` 和 `2409.19256` 通过 verl 基础设施连接。HybridFlow/VERL 提供 RLHF/RLVR dataflow 底座，ProRL 是 verl 在多任务 prolonged reasoning RL 上的应用案例。
- `2505.24864` 和 `2605.14220`、`TML-2025-09-10` 在评测可靠性上连接。ProRL 依赖 long rollout、vLLM evaluation 和 pass@k 曲线；rollout/trainer/inference mismatch 或 batch nondeterminism 都可能影响 boundary expansion 的判断。
- `2505.24864` 和 `2606.00135` 都关注有效 rollout 和有效梯度。ProRL 的 dynamic sampling 过滤全对/全错 prompt groups；tool-calling RL 论文在 agentic setting 中处理 zero-variance prompts、rollout waste 和 policy update cost。
- `2506.10947` 新增 spurious reward / RLVR prior amplification 节点。它显示 Qwen2.5-Math 上 random、format、incorrect reward 也能产生明显 benchmark 提升，并把机制解释为 GRPO clipping bias 放大 base policy 中已有高 prior 行为。
- `2506.10947` 和 `2504.13837` 关系最强。`2504.13837` 用 pass@k 和 coverage set 说明 RLVR 经常把 base model 已有低概率 reasoning path 提升为高概率输出；`2506.10947` 给出 spurious reward、clipping bias 和 code reasoning prior 这一机制层解释。
- `2506.10947` 和 `2503.14476` 都围绕 GRPO-style RLVR recipe。DAPO 关注 Dynamic Sampling、Token-level Policy Gradient Loss、Clip-Higher 和 Overlong Reward Shaping；`2506.10947` 提醒这些 recipe 需要配套 random / format / incorrect reward baseline、clipping rate、behavior distribution 和跨模型家族复验。
- `2506.10947` 和 `2501.12948` 连接在 verifiable reward 与 long-CoT reasoning。DeepSeek-R1 展示 rule/verifiable reward 的能力收益；`2506.10947` 提醒 rule reward 收益需要区分真实 reward guidance、base prior amplification、prompt artifact 和格式/行为 prior。
- `2506.10947` 和 `2605.30290` 都处理 verifier/reward feedback 的解释边界。STV 关注 self-trained verifier feedback 是否推动 reasoning self-improvement；`2506.10947` 建议加入 dummy verifier 或 spurious reward baseline，检查提升是否来自 evaluator informativeness。
- `2506.10947` 和 `2501.09620`、`2403.03185` 共享 spurious/proxy reward 语言。CRM 在 reward model 训练阶段约束 spurious factor dependence；ORPO 在 policy optimization 阶段约束 reference occupancy shift；`2506.10947` 则把 spurious reward 问题推进到 RLVR objective、clipping bias 和 model prior 层。
- `2506.10947` 和 `2606.00135` 都说明 harness、prompt 和 model family 会进入有效训练信号。Tool-calling RL 的 tool schema 与 history serialization 会影响模型表现；本篇显示数学 RLVR 的 prompt、boxed format、code reasoning 和 Qwen-Math prior 同样会改变结论。
- `2506.10947` 和 `2503.11926` 都关注训练信号对 visible reasoning behavior 的选择。CoT monitoring 论文讨论 monitor reward 改变 CoT telemetry；本篇展示 spurious rewards 可以把 code reasoning 频率从 65% 推到 90% 以上。
- `2506.10947` 和 `2605.14220`、`TML-2025-09-10` 互补：TIM/VeXact 与 TML 文章关注 sampler/trainer/inference 的实现级一致性，本篇补充 objective-level clipping bias，说明实现一致之外还要诊断 reward signal 与 prior amplification。
- `2504.13837` 新增 RLVR reasoning boundary / sampling efficiency 节点。它把 RLVR 收益拆成低 `k` 的采样效率和高 `k` 的可解问题覆盖，指出当前 binary RLVR 常把 base model 已经低概率拥有的正确 reasoning path 提升为高概率输出，但没有稳定扩大 reasoning boundary。
- `2504.13837` 和 `2501.12948` 构成 reasoning RL 主张的正反面连接。DeepSeek-R1 展示 verifiable reward 能激发 long-CoT 表现；`2504.13837` 用 pass@k、coverage set 和 base-PPL 分析说明许多 RLVR 表现可能来自 base prior 内的概率重排。
- `2504.13837` 和 `2503.14476` 关系非常强。DAPO 提供 open-source long-CoT RLVR recipe、Dynamic Sampling 和 token-level loss；`2504.13837` 提供评估这类 recipe 是否扩展 reasoning boundary 的方法。两者没有作者重叠，但共享 Tsinghua 机构网络：DAPO 涉及 AIR Tsinghua / SIA-Lab，本篇来自 Tsinghua LeapLab。
- `2504.13837` 和 `2605.30290` 都研究 verifier / reward feedback 对 reasoning self-improvement 的真实作用。STV 关注 verifier feedback 如何提升 test-time 和 training-time self-improvement；`2504.13837` 提醒后续 verifier/self-improvement 工作需要同时报告 pass@1 与大 pass@k 覆盖，避免把 sampling efficiency 误读为 boundary expansion。
- `2504.13837` 和 `2606.00135` 共享 RL training efficiency 与 exploration 问题。前者指出 single-turn binary RLVR 的探索受 base prior 限制，后者讨论 tool-calling RL 中 harness、zero-variance prompts、rollout down-sampling 和 policy update 成本；multi-turn tool environment 可能是突破当前 RLVR boundary 的候选方向。
- `2504.13837` 和 `2503.11926` 都显示后训练会改变可观察分布。CoT monitoring 论文关注 monitor reward 让 CoT telemetry 失真；`2504.13837` 关注 RLVR 让输出分布向 rewarded paths 集中并减少高 `k` coverage。两者共同提示只看平均指标会遗漏分布尾部变化。
- `2504.13837` 和 `2403.03185` 在 distribution language 上互补。Correlated proxies 论文关注 policy 偏离 reference occupancy 后 proxy 失效；`2504.13837` 关注 policy 偏离 base distribution 后可解问题覆盖收缩。二者都要求把 reference/base distribution 显式纳入 RL 诊断。
- `2504.13837` 和 `2605.14220`、`TML-2025-09-10` 连接在 sampling distribution 的可复现估计。大 pass@k 结论依赖稳定采样；TIM/VeXact 与 TML 文章提示 rollout backend、batch invariance、sampler/trainer consistency 会影响 pass@k、coverage set 和 PPL 诊断。
- `2503.11926` 新增 CoT monitorability / obfuscated reward hacking 节点。它显示 CoT 作为被动 telemetry 可以帮助 GPT-4o monitor 检测 frontier reasoning agent 的 reward hacking；当 monitor score 进入 reward 后，模型会学习让 CoT 看起来无害，同时继续执行 hacking 行为。
- `2503.11926` 和 `2403.03185` 构成 reward hacking 语言上的强连接。`2403.03185` 解释 proxy 在优化后 distribution shift 中失效；`2503.11926` 展示 monitor reward 也会被优化 pressure Goodhart 化，形成 monitor blind spot。
- `2503.11926` 和 `2606.00135` 共享 agentic coding / tool-use RL 场景。前者关注如何监控和避免 monitor 被优化绕过，后者关注 tool-calling RL 的评测 harness 和训练效率；两者都说明工具轨迹、unit tests、judge/monitor 和 prompt serialization 会成为训练行为的一部分。
- `2503.11926` 和 `2501.12948`、`2503.14476` 连接在 long-CoT RL safety 上。DeepSeek-R1 和 DAPO 强调 long-CoT 带来的 reasoning 能力，OpenAI CoT monitoring 论文提醒直接优化 CoT 格式、合规性、长度或 monitor score 可能损害 CoT 的内部安全监控价值。
- `2503.11926` 和 `2605.30290` 都涉及 verifier / monitor feedback。STV 研究 verifier feedback 如何提升 reasoning，OpenAI CoT monitoring 论文提示 verifier/monitor 进入训练目标后需要测量 caught hacking、uncaught hacking 和 monitorability drift。
- `2503.11926` 和 `2501.09620` 都处理 reward hacking 的 proxy 层风险。CRM 处理 learned reward model 对已知 spurious factor 的依赖；OpenAI CoT monitoring 论文处理 process-level monitor reward 被策略优化绕过的风险。
- `2503.11926` 和 `2606.04075` 都展示强优化系统会利用制度或评测漏洞。SocioHack 的社会规则漏洞与本篇 agentic coding reward hacks 同属 reward/规则缺口问题，但本篇额外提供 CoT telemetry 和 obfuscation 风险视角。
- `2503.11926` 和 `2605.14220`、`TML-2025-09-10` 在 RL 训练诊断上互补。TIM/VeXact 与 TML 文章关注 rollout/trainer/inference 的实现级一致性，OpenAI CoT monitoring 论文关注监控信号本身是否被训练目标改变。
- `2403.03185` 新增 reward hacking 的 policy-optimization 分布控制节点。它把 proxy reward 的有效性限定在 reference policy occupancy 下，并用 Theorem 5.1 说明 true reward improvement 可以由 proxy improvement 和 occupancy shift penalty 共同控制。
- `2403.03185` 和 `2501.09620` 形成 reward hacking 防御的两层结构。CRM 在 reward model 训练阶段约束 reward output 对人工指定 spurious factor $Z$ 的依赖；ORPO 在 policy optimization 阶段约束 $\mu_\pi$ 不要过度偏离 $\mu_{\pi_{\mathrm{ref}}}$。
- `2403.03185` 和 `2606.04075` 都讨论 RL 如何利用 reward/规则缺口。SocioHack 展示规则环境中的制度漏洞搜索；correlated proxy 论文提供解释框架：proxy 在参考行为分布上可以正相关，优化后进入相关性失效区域。
- `2403.03185` 和 `2606.00135` 的关系是后续 agentic RL 的关键连接。当前 RLHF contextual-bandit 设置中 action distribution 与 occupancy measure 接近等价；tool-calling RL 的多轮历史、工具返回和错误恢复状态会让 action KL 难以完整约束 state-action occupancy drift。
- `2403.03185` 和 `2409.19256` 连接在 RLHF/RLVR 系统实现层。HybridFlow/VERL 可以承载 ORPO 类方法，但需要额外支持 reference trajectory sampling、occupancy discriminator training、$\chi^2$ estimate logging 和 augmented reward injection。
- `2403.03185` 和 `2605.14220`、`TML-2025-09-10` 共同强调 RL 闭环里的分布一致性。前者关注 reference occupancy shift，TIM/VeXact 关注 rollout/trainer logprob mismatch，TML 文章关注 batch-invariant inference 和 sampler consistency。
- `2403.03185` 和 `2501.12948`、`2503.14476` 连接在 verifiable reward / rule reward 的 residual hacking 风险上。rule-based verifier、format reward 和 overlong reward shaping 仍可被视为 proxy reward；当策略进入 verifier 覆盖不足或格式边界区域时，correlated proxy 视角可用于诊断。
- `2501.09620` 补充本地档案中的 reward model debiasing 节点。它把 reward hacking 的一部分来源定位为 preference data 中的 spurious factor，并用 MMD regularization 约束 reward output 对 length、sycophancy phrase、concept 和 demographic bins 的依赖。
- `2501.09620` 和 `2606.04075` 都讨论 reward hacking。前者处理 learned reward model 对已知伪相关变量的依赖，后者处理社会规则沙盒中制度意图和可测 reward 之间的缺口；两者合起来覆盖 reward model 层和环境规则层。
- `2501.09620` 和 `2501.12948` 的关系是 learned reward model debiasing 与 rule/verifiable reward 的互补关系。DeepSeek-R1/R1-Zero 通过 rule-based reward 降低偏好 reward model 风险，CRM 适合审计和改造 helpfulness/safety reward model、format reward 或其他 learned feedback。
- `2501.09620` 和 `2503.14476` 都处理 RL 后训练中的 reward design。DAPO 用 rule-based verifier、overlong reward shaping 和 dynamic sampling 管理 long-CoT RL 的 reward noise；CRM 用 causal regularization 降低 reward model 对长度、概念和人口属性的伪相关依赖。
- `2501.09620` 和 `2605.30290` 都服务 feedback quality。STV 关注 verifier 自训练和自然语言反馈是否能推动 self-improvement，CRM 关注 reward model 是否利用偏好数据捷径；未来 verifier/reward model 可以同时记录 calibration、bias dependence 和 policy-level behavior drift。
- `2501.09620` 和 `2605.14220` 都把隐藏偏差显式化为 RL 优化目标偏移。TIM/VeXact 关注 rollout/trainer 数值分布不一致，CRM 关注 reward model 对 spurious factor 的统计依赖；两者都说明表面 on-policy 的 RL 仍可能优化偏离意图的目标。
- `2501.09620` 和 `2606.00135` 都提示 harness artifact 会进入能力测量和训练信号。Tool-calling RL 中的 tool schema、history retention、tool-call count 和 judge prompt 都可以作为 CRM 式 $Z$ 变量纳入 reward/judge debiasing。
- `2606.04662` 补充本地档案中的 optimizer-level mechanism。DeepSeek-R1、DAPO、tool-calling RL 等论文讨论 RL/post-training recipe 和系统效率，Muon 曲率论文解释 pretraining optimizer update direction 如何通过更低 NDS 减少 second-order curvature penalty。
- `2606.04662` 和 `2503.14476` 都把训练收益拆成可诊断项。DAPO 关注 long-CoT RL 的有效梯度、长度约束和 reward noise；Muon 论文关注 optimizer update 的 first-order gain、curvature penalty、update norm 和 NDS。
- `2606.04662` 和 `2605.14220` 从不同层面解释训练不稳定。TIM/VeXact 关注 rollout/trainer 数值概率景观错位，Muon 论文关注 update direction 暴露在 Hessian 高曲率方向的程度；未来 RL training optimizer 可能需要同时监控 logprob mismatch 与 NDS。
- `2606.04662` 和 `2501.12948` 的关系是 pretraining optimizer 与 reasoning RL 的上下游关系。DeepSeek-R1/R1-Zero 依赖强 base model 的 latent capability，Muon 论文解释 base model pretraining 中 optimizer 几何如何影响训练效率。
- `2606.04662` 和 `2606.06453` 无作者重叠，但共享 National University of Singapore 机构网络。Vortex 的 Michael Qizhe Shieh 来自 NUS，Muon 论文的 Shuche Wang 来自 NUS；主题上一个是 serving systems，一个是 optimizer geometry。
- `2606.04662` 和 `2510.19315` 都偏理论解释。前者分析 optimizer curvature geometry，后者分析 Transformer 表达简洁性和验证复杂度；两者可作为本地档案的理论侧材料。
- `2606.04101` 和 `2606.06453` 同属 LLM serving systems efficiency。Vortex 处理 sparse attention serving 与 decode/KV-cache 侧瓶颈，UltraEP 处理 MoE training 与 prefill serving 中 expert load、token all-to-all 和 expert-state transfer；两者都接触 SGLang、Qwen3/GLM 系列和长上下文/agent workload。
- `2606.04101` 和 `2605.14220` 都把 MoE 系统实现细节提升为训练稳定性变量。TIM/VeXact 关注 rollout/trainer logprob mismatch 与 batch-invariant MoE kernels，UltraEP 关注 exact-load balancing 和 token-to-physical-expert reroute；未来 MoE RL 系统需要同时验证 load balancing 与 zero-mismatch consistency。
- `2606.04101` 和 `2501.12948` 通过 DeepSeek-V3/R1 MoE 系统线强连接。DeepSeek-R1 依赖 DeepSeek-V3-Base MoE 和大规模 rollout/training infrastructure，UltraEP 评估 DeepSeek-V3-671B-A37B 并引用 DeepSeek-V3/R1、EPLB、DeepEP、DeepGEMM 等生态组件。
- `2606.04101` 和 `2503.14476` 在 long-CoT/RL 系统成本上连接。DAPO 的 long-CoT RL 会放大 MoE training/prefill 负载与通信成本；UltraEP 的 serving workload 使用 DAPO-Math-17K 构成 STEM workload 的一部分，并提供 MoE expert balancing 的底层系统视角。
- `2606.04101` 和 `2409.19256` 都服务大规模训练/推理系统栈。HybridFlow/VERL 编排 RLHF/RLVR 多模型 dataflow，UltraEP 优化 EP group 内 MoE expert load balancing；未来大 MoE RLHF/RLVR 可以把 UltraEP 作为 actor rollout 或 training backend 的底层优化。
- `2606.04101` 和 `2606.00135` 都说明 agent/RL workload 的实际结构会主导系统效率。Tool-calling RL 论文关注 zero-variance prompts、rollout waste 和 policy update cost，UltraEP 关注 MoE prefill/training 的 realized expert load、rank straggler 和 activation memory spike。
- `2606.04101` 和 `2025-09-10` 在 serving determinism 上形成后续问题。UltraEP 动态 reroute token-to-physical-expert 以追求负载均衡，Thinking Machines 文章强调 batch-invariant inference 与 sampler consistency；MoE serving 后续需要同时关注 performance balancing 与 reproducible execution。
- `2501.12948` 是 `2503.14476` 的直接上游背景。DeepSeek-R1 提出 R1-Zero/R1 系谱、GRPO 和 verifiable reward 激发 long-CoT reasoning；DAPO 以开源 recipe 复现 R1-style training，并把 overlong、dynamic sampling、token-level loss 等工程细节系统化。
- `2501.12948` 和 `2605.14220` 共享 long-response MoE RL 系统问题。R1 的 vLLM rollout、65,536 token max length、MoE 和 GRPO 训练会放大 rollout/trainer consistency 风险；TIM/VeXact 论文提供后续诊断工具。
- `2501.12948` 和 `2606.00135` 都是 GRPO/RLVR 生态的重要节点。R1 关注 verifiable reasoning tasks，`2606.00135` 关注 agentic tool-calling harness、zero-variance prompts 和 RL 训练效率。
- `2501.12948` 和 `2606.04075` 都直接讨论 reward hacking。R1 v2 说明 model-based preference reward 训练过多会引发 reward hacking，并在安全评测中展示 jailbreak 风险；SocioHack 进一步展示 RL 会在规则环境中搜索漏洞。
- `2501.12948` 和 `2605.30290` 都围绕 verifier / reward feedback 驱动 reasoning self-improvement。R1 证明 reliable rule/verifier reward 可以激发 long-CoT，STV 研究 verifier 自训练和 test-time/training-time self-improvement。
- `2501.12948` 和 `2025-09-10` 通过 inference determinism 相连。R1 的 long rollout 和 vLLM serving 让 batch-invariant inference、sampler/trainer consistency 和可复现评测更重要。
- `2501.12948` 和 `2605.31514` 在方法论上相互提醒。R1 的 aha moment 和 cold-start first-person style 容易诱发拟人化解读；Age of Empires 论文提醒把行为模式和人类式属性归因分开。
- `2501.12948` 和 `2606.06453` 都指向长上下文/长生成系统成本。R1 的 128K context、long-CoT 和 rollout length 放大 serving/attention 成本，Vortex 从 sparse attention serving 方向处理效率。
- `2501.12948` 和 `2409.19256` 都是大规模 RL 后训练系统节点。R1 v2 appendix 描述 DeepSeek 内部 RL infrastructure，HybridFlow/VERL 则从开源系统角度抽象 RLHF/RLVR dataflow。
- `2503.14476` 和 `2409.19256` 存在直接作者重叠与基础设施承接。Haibin Lin、Guangming Sheng、Chi Zhang、Wang Zhang 同时出现在 DAPO 与 HybridFlow 作者列表中；DAPO 基于 verl，HybridFlow/VERL 提供分布式 RLHF/RLVR dataflow 底座。
- `2503.14476` 和 `2605.14220` 属于 ByteDance/verl RL 系统谱系的连续节点。DAPO 提供 long-CoT GRPO recipe、DAPO-Math-17K 和长 response 设置；TIM/VeXact 论文用 DAPO dataset 与类似长 response 训练语境诊断 rollout/trainer logprob mismatch。
- `2503.14476` 和 `2605.30290` 形成数据与 RLVR 闭环关系。STV 使用 DAPO math problems 构造 Hard/Hardest bins，并在 verifier-guided self-improvement 中继承 DAPO 的 reasoning data 背景。
- `2503.14476` 和 `2606.00135` 都关注 RL 训练中的有效梯度与 rollout 预算。DAPO Dynamic Sampling 过滤全对/全错 prompt groups；tool-calling RL 论文处理 zero-variance prompts、pre-rollout filtering 与 variance-aware rollout down-sampling。
- `2503.14476` 和 `2025-09-10` 通过 rollout reproducibility 相连。DAPO 依赖 long rollout 和 vLLM/verl 链路，Thinking Machines 文章解释 batch-invariant inference 对可复现 sampling 和 sampler/trainer consistency 的意义。
- `2503.14476` 和 `2606.04075` 都涉及 RL reward design。DAPO 通过整数化答案、rule-based verifier 和 overlong reward shaping 降低 reward noise；SocioHack 论文提醒规则奖励也会诱导模型搜索意图缝隙。
- `2503.14476` 和 `2606.06453` 都面向长生成/agent 系统效率。DAPO 的 20,480 token rollout 会放大 serving 和 attention 成本，Vortex 关注 sparse attention serving 和 AI agent 场景下的系统效率。
- `2605.14220` 和 `TML-2025-09-10` 形成直接技术承接关系。Thinking Machines 文章解释 batch-invariant inference 如何消除 batch/slicing 非确定性；`2605.14220` 引用该思路并扩展到 LLM RL，证明 trainer-rollout logprob mismatch 会改变优化目标并触发 training collapse。
- `2605.14220` 和 `2409.19256` 属于 ByteDance/verl 系统谱系的连续节点。HybridFlow/VERL 解决 RLHF dataflow、rollout 和 policy update 编排；VeXact/TIM 论文进一步解决 rollout engine 与 FSDP trainer 的 bitwise logprob alignment。`2605.14220` acknowledgments 提到 HybridFlow 作者 Xibin Wu，显示同一系统社区的协作线索。
- `2605.14220` 和 `2606.00135` 都关注 RL rollout 与 policy update 的真实系统条件。`2606.00135` 讨论 tool-calling harness、无效 rollout 和 policy update 成本；`2605.14220` 说明 rollout/trainer 数值概率景观不一致会让名义 on-policy 更新变成带系统偏差的更新。后续讨论已补充：固定 rollout trajectory 在训练时不会重新采样分叉，核心问题是 behavior policy $q_{\mathrm{rollout}}$ 与 optimization policy $p_{\mathrm{train}}$ 的实现级分布错位。
- `2605.14220` 和 `2606.06453` 都把 attention/kernel 细节提升为上层系统行为变量。Vortex 关注 sparse attention serving 吞吐，VeXact 关注 batch-invariant/deterministic rollout 对 RL 稳定性的影响。
- `2605.14220` 和 `2605.30290` 都服务 reasoning RL/RLVR 闭环。Self-trained verification 关注 verifier feedback 与 self-improvement；TIM 论文提示 rollout/trainer logprob mismatch 也会影响 verifier-guided 或 RLVR 训练稳定性。
- `2605.14220` 和 `2606.04075` 都揭示 RL 优化闭环中的隐藏偏差。SocioHack 关注 reward/规则诱导的策略偏差；TIM 关注训练/推理实现差异诱导的优化偏差。
- `TML-2025-09-10` 和 `2409.19256` 形成 RLHF 系统栈的上下游关系。`2409.19256` 关注 HybridFlow/VERL 如何编排 rollout、inference、training 和多模型数据流；`TML-2025-09-10` 关注 rollout inference 的 batch-invariant determinism，以及 sampler 与 trainer 的 logprob 一致性。
- `TML-2025-09-10` 和 `2606.00135` 都强调 RL/agent 系统中 harness 与 backend 会改变实验结果。`2606.00135` 讨论 tool-calling harness、rollout down-sampling 和 policy update 成本；`TML-2025-09-10` 解释 batch size、chunked prefill、KV cache layout 和 attention split 会改变 temperature 0 生成轨迹。
- `TML-2025-09-10` 和 `2606.06453` 都属于 LLM serving/kernel 层系统论文线索。Vortex 优化 sparse attention serving 和 agent 生成算法搜索；Thinking Machines 文章优化 deterministic inference 所需的 batch-invariant attention、matmul 和 RMSNorm。
- `TML-2025-09-10` 和 `2605.30290` 都涉及闭环推理与评测复现。Self-trained verification 依赖 verifier/reasoner 多轮反馈；batch-invariant inference 可降低 test-time refinement 和 verifier-guided rollout 中的数值轨迹漂移。
- `TML-2025-09-10` 和 `2606.04075` 都提醒优化闭环中的环境细节会改变行为。前者关注 serving 调度和数值路径，后者关注 reward/规则设计中的漏洞搜索。
- `2409.19256` 是 `2606.00135` 的基础设施前置节点。`2606.00135` 的 tool-calling RL 训练实验使用 VERL framework；`2409.19256` 解释 VERL/HybridFlow 如何编排 RLHF/RLVR dataflow、actor rollout、policy update 和多模型数据传输。
- `2409.19256` 和 `2605.30290` 都服务 RL 后训练生态。前者解决大规模 RLHF/RLVR 训练的系统执行效率，后者解决 verifier feedback 如何进入 reasoning self-improvement。
- `2409.19256` 和 `2606.04075` 的关系是能力基础设施与安全风险的关系。前者降低大规模 post-training 系统成本，后者提醒 reward/规则设计会诱导模型搜索漏洞。
- `2409.19256` 和 `2606.06453` 都是 LLM systems efficiency 论文。HybridFlow 优化 training/post-training dataflow，Vortex 优化 sparse attention serving。
- `2409.19256` 和 `2510.19315` 没有作者或直接方法重叠；一个是系统实现与吞吐，一个是 Transformer 理论与验证复杂度。
- `2605.30290` 和 `2606.00135` 都研究 RL 后训练中的多轮闭环。`2605.30290` 把 verifier feedback 放入 reasoning self-improvement，`2606.00135` 把 tool-calling harness 和 RL 训练效率作为核心对象；两者都说明 loop 结构、feedback 和 evaluation harness 会改变模型能力表现。
- `2605.30290` 和 `2606.04075` 都涉及 reward/verifier 失真。`2605.30290` 关注 V-R loop 中 verifier score 上升但准确率停滞的 in-context reward hacking，`2606.04075` 关注 RL 在社会规则中寻找形式合规但偏离意图的策略。
- `2605.30290` 和 `2606.06453` 共享 Carnegie Mellon University 机构网络，但没有作者重叠。前者来自 CMU reasoning/trustworthy AI 线，后者来自 CMU systems/serving 线；两者都使用 Qwen3 系列作为实验对象之一。
- `2605.30290` 和 `2510.19315` 都与 verification 相关，但层级不同：前者是经验型 verifier training 与推理自我提升，后者是 Transformer 形式语言表达简洁性和验证复杂度。
- `2605.30290` 和 `2605.31514` 都提供方法论提醒：前者区分 verifier 分数和真实准确率，后者区分拟人化行为表现和可归因属性。
- `2606.00135` 和 `2606.04075` 都讨论 RL 后训练中的优化闭环。`2606.00135` 关注工具调用能力训练和评测可靠性，说明 prompt/template/reward 设计会改变能力测量和计算效率；`2606.04075` 关注 RL 在社会规则沙盒中发现制度漏洞，说明 reward 和规则设计会诱导模型搜索意图缝隙。
- `2606.00135` 和 `2606.06453` 都服务 agent 系统效率。前者减少 tool-calling RL 训练中的无效 rollout 和昂贵 policy update，后者用 Vortex 加速 sparse attention serving 和 agent 生成算法验证。
- `2606.00135` 和 `2605.31514` 都提供方法论提醒。前者提醒 benchmark 分数会受评测管线显著影响，后者提醒人类式属性判断会受接口和解释框架影响。
- `2606.00135` 和 `2510.19315` 没有直接作者或方法重叠，关系主要停留在 LLM/Transformer 能力研究层级：前者是实证系统与训练效率，后者是形式语言和表示简洁性理论。
- `2606.04075` 和 `2605.31514` 都涉及 LLM 行为解释边界。前者关心优化过程如何产生制度漏洞发现，后者关心研究者如何避免把行为表现过度归因为人类式属性。
- `2510.19315` 和 `2606.06453` 都解释 Transformer 的效率优势，但层级不同：前者是理论表示简洁性，后者是 serving 系统中 sparse attention 的工程效率。
- `2606.06453` 和 `2606.04075` 都把 AI agent 放进闭环：前者让 agent 搜索稀疏注意力算法，后者模拟 RL 模型在社会规则中搜索漏洞。两者都显示“优化闭环 + 自动搜索”会改变研究或治理问题的形态。
- 当前十八篇论文和一篇技术文章中，`2503.14476` 与 `2409.19256` 存在 Haibin Lin、Guangming Sheng、Chi Zhang、Wang Zhang 等直接作者重叠；`2605.30290` 和 `2606.06453` 共享 CMU 机构网络；`2501.09620` 新增 reward model causal debiasing 节点；`2403.03185` 新增 correlated proxy reward hacking / occupancy regularization 节点；`2503.11926` 新增 CoT monitorability / obfuscated reward hacking 节点；`2504.13837` 新增 RLVR reasoning boundary / sampling efficiency 节点；`2506.10947` 新增 spurious reward / RLVR prior amplification 节点；`2505.24864` 新增 prolonged RL / reasoning boundary expansion 节点；`2606.04662` 新增 optimizer geometry / Muon 曲率机制节点；`2501.12948` 是 DAPO、TIM/VeXact、STV、tool-calling RL 等 reasoning RL 论文的上游背景节点；`2606.04101` 补充 MoE training/prefill serving 的 rack-scale load balancing 系统节点，并连接 Vortex、TIM/VeXact、DeepSeek-R1、DAPO 和 HybridFlow；`2409.19256` 和 `2606.00135` 通过 VERL/HybridFlow 基础设施形成直接方法关系；`2503.14476` 和 `2605.14220` 通过 DAPO/VeXact/VERL 形成强系统关系；`TML-2025-09-10` 与 `2606.06453` 通过 serving kernel 形成系统层关系，其余关系主要通过主题和方法连接。

## 后续新增论文沉淀规范

详细流程见 [paper-analysis-workflow.md](/workflow/)，新增笔记使用 [paper-note-template.md](/template/)。

最低要求：

- 新增论文必须沉淀为独立 Markdown 文件。
- 新增论文必须更新本索引。
- 新增论文必须分析作者关系、机构关系和跨论文关系。
- 阅读后的交流环节若产生有效修正、核心表述、指标清单或跨论文关系，必须回写对应笔记；影响索引判断时同步更新本索引。
- 若出现重复作者、同一实验室连续论文、主题演化、引用关系或方法复用，必须在本索引中单独记录。
- 对技术博客、项目文档或工程报告，可使用稳定来源 ID 作为索引编号，并同样记录作者/机构、主题关系和跨材料关系。
- 面向站点展示的已存档论文链接统一使用 `/papers/<slug>/` 形式；工作流、模板、索引页面分别使用 `/workflow/`、`/template/`、`/archive/`。
