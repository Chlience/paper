# Paper Archive Index

Date: 2026-06-16

## 本地工作流

- 目录规则：`AGENTS.md`
- 论文分析 SOP：[paper-analysis-workflow.md](/workflow/)
- 论文笔记模板：[paper-note-template.md](/template/)

## 当前收录

| arXiv | Title | Local Note | Theme | Authors / Institutions |
| --- | --- | --- | --- | --- |
| 2606.10650 | Dynamic Linear Attention | [2606.10650-dynamic-linear-attention.md](/papers/2606.10650-dynamic-linear-attention/) | Dynamic Linear Attention, multi-state linear attention, information-aware state merging, capacity-bounded memory, Mamba-2, Gated DeltaNet, RULER, LongBench | Xin Wang, Zhongwei Wan, Mi Zhang / The Ohio State University; Hui Shen, Boyuan Zheng, Xueshen Liu, Minkyoung Cho, Zesen Zhao, Zhuoqing Mao / University of Michigan; Shen Yan / ByteDance Seed; Xin Wang and Hui Shen equal contribution; Xin Wang and Mi Zhang corresponding authors |
| 2606.12370 | Breaking Entropy Bounds: Accelerating RL Training via MTP with Rejection Sampling | [2606.12370-bebop-mtp-rejection-sampling-rl-training.md](/papers/2606.12370-bebop-mtp-rejection-sampling-rl-training/) | Bebop, MTP, rejection sampling, TV loss, RL rollout acceleration, entropy-acceptance bound, Qwen, SGLang, vLLM | Yucheng Li, Huiqiang Jiang, Yang Xu, Jianxin Yang, Yi Zhang, Yizhong Cao, Yuhao Shen, Fan Zhou, Rui Men, Jianwei Zhang, An Yang, Bowen Yu, Bo Zheng, Fei Huang, Junyang Lin, Dayiheng Liu, Jingren Zhou / Qwen Team, Alibaba Inc.; Yucheng Li and Huiqiang Jiang equal contribution; Huiqiang Jiang corresponding author |
| VERL-2026-06-16 | verl 当前 RL 优化算法与异步训练流水线技术笔记 | [2026-06-16-verl-rl-optimization-algorithms.md](/papers/2026-06-16-verl-rl-optimization-algorithms/) | verl, PPO, GRPO, DAPO, rollout correction, one-step-off, fully async, async on-policy distill, TransferQueue, MTP | verl documentation contributors; `meituan-search`; Brilliant Hanabi; furunding; Yingru Li; Yuxuan Tong; Guangming Sheng; ByteDance Seed Foundation MLSys Team / community |
| 2511.14617 | Seer: Online Context Learning for Fast Synchronous LLM Reinforcement Learning | [2511.14617-seer-online-context-learning-llm-rl.md](/papers/2511.14617-seer-online-context-learning-llm-rl/) | Synchronous LLM RL, rollout systems, group-aware context learning, divided rollout, global KVCache, context-aware scheduling, grouped speculative decoding | Ruoyu Qin / Moonshot AI and Tsinghua University; Weiran He, Weixiao Huang, Yangkun Zhang, Yikai Zhao, Bo Pang, Xinran Xu / Moonshot AI; Yingdi Shan, Yongwei Wu, Mingxing Zhang / Tsinghua University; Mingxing Zhang corresponding author |
| 2602.15763 | GLM-5: from Vibe Coding to Agentic Engineering | [2602.15763-glm-5-agentic-engineering.md](/papers/2602.15763-glm-5-agentic-engineering/) | GLM-5, agentic engineering, asynchronous RL, DSA, slime, TITO, direct double-sided importance sampling, CC-Bench-V2 | GLM-5 Team / Zhipu AI and Tsinghua University; tech leads Aohan Zeng, Xin Lv, Zhenyu Hou, Zhengxiao Du, Qinkai Zheng, Bin Chen, Da Yin; advisors Jie Tang, Yuxiao Dong, Juanzi Li, Hongning Wang, Minlie Huang, Bin Xu |
| DS-2026-04-24 | DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence | [2026-04-24-deepseek-v4-million-token-context-intelligence.md](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) | DeepSeek-V4, million-token context, CSA/HCA hybrid compressed attention, mHC, Muon, OPD, deterministic kernels, agentic infrastructure | DeepSeek-AI; appendix lists Research & Engineering authors alphabetically by first name; strong overlap with DeepSeek-R1 / DeepSeek-V3 series contributors |
| 2405.17381 | Various Lengths, Constant Speed: Efficient Language Modeling with Lightning Attention | [2405.17381-various-lengths-constant-speed-lightning-attention.md](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/) | Lightning Attention, TransNormerLLM, causal linear attention, IO-aware tiling, long-context architecture | Zhen Qin / TapTap; Weigao Sun, Dong Li, Xuyang Shen, Weixuan Sun, Yiran Zhong / OpenNLPLab and Shanghai AI Lab; Yiran Zhong corresponding author |
| 2506.13585 | MiniMax-M1: Scaling Test-Time Compute Efficiently with Lightning Attention | [2506.13585-minimax-m1-cispo-lightning-attention.md](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) | MiniMax-M1, Lightning Attention, CISPO, long-output reasoning RL, 1M context, software engineering and tool-use RL | MiniMax; title page lists MiniMax as author and appendix lists Aili Chen plus 125 other contributors alphabetically; no per-author affiliations exposed in v1 |
| 2001.08361 | Scaling Laws for Neural Language Models | [2001.08361-scaling-laws-neural-language-models.md](/papers/2001.08361-scaling-laws-neural-language-models/) | Pretraining scaling laws, compute-efficient training, model/data/compute power laws, WebText2 | Jared Kaplan / Johns Hopkins University and OpenAI; Sam McCandlish, Tom Henighan, Tom B. Brown, Benjamin Chess, Rewon Child, Scott Gray, Alec Radford, Jeffrey Wu, Dario Amodei / OpenAI |
| 2203.15556 | Training Compute-Optimal Large Language Models | [2203.15556-training-compute-optimal-large-language-models.md](/papers/2203.15556-training-compute-optimal-large-language-models/) | Chinchilla scaling, compute-optimal pretraining, data-optimal training, model/token allocation, MassiveText | Jordan Hoffmann, Sebastian Borgeaud, Arthur Mensch, Laurent Sifre / DeepMind, equal contribution and corresponding authors; Elena Buchatskaya, Trevor Cai, Eliza Rutherford, Diego de Las Casas, Lisa Anne Hendricks, Johannes Welbl, Aidan Clark, Tom Hennigan, Eric Noland, Katie Millican, George van den Driessche, Bogdan Damoc, Aurelia Guy, Simon Osindero, Karen Simonyan, Erich Elsen, Jack W. Rae, Oriol Vinyals / DeepMind |
| TML-2025-09-10 | Defeating Nondeterminism in LLM Inference | [2025-09-10-defeating-nondeterminism-llm-inference.md](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) | LLM inference determinism, batch-invariant kernels, reproducible serving, true on-policy RL | Horace He / Thinking Machines Lab |
| 2605.14220 | Diagnosing Training Inference Mismatch in LLM Reinforcement Learning | [2605.14220-training-inference-mismatch-llm-rl.md](/papers/2605.14220-training-inference-mismatch-llm-rl/) | Training-Inference Mismatch, zero-mismatch rollout, VeXact, RL stability, batch-invariant kernels | Tianle Zhong / ByteDance and University of Virginia; Neiwen Ling, Yifan Pi, Zijun Wei, Tianshu Yu, Peng Wu, Xiao Yu / ByteDance; Geoffrey Fox / University of Virginia |
| 2503.14476 | DAPO: An Open-Source LLM Reinforcement Learning System at Scale | [2503.14476-dapo-long-cot-rl-system.md](/papers/2503.14476-dapo-long-cot-rl-system/) | Long-CoT reasoning RL, DAPO, GRPO recipe, VERL, open-source reproduction | Qiying Yu, Weinan Dai, Yuxuan Tong, Hongli Yu, Yuxuan Song / ByteDance Seed, AIR Tsinghua, SIA-Lab; Guangming Sheng / ByteDance Seed and HKU; large ByteDance Seed and Tsinghua AIR/SIA-Lab collaboration |
| 2504.13837 | Does Reinforcement Learning Really Incentivize Reasoning Capacity in LLMs Beyond the Base Model? | [2504.13837-rlvr-reasoning-boundary-base-model.md](/papers/2504.13837-rlvr-reasoning-boundary-base-model/) | RLVR reasoning boundary, pass@k, sampling efficiency, base-model prior, distillation vs RL | Yang Yue, Zhiqi Chen, Rui Lu, Andrew Zhao, Yang Yue, Shiji Song, Gao Huang / LeapLab, Tsinghua University; Zhaokai Wang / Shanghai Jiao Tong University |
| 2506.10947 | Spurious Rewards: Rethinking Training Signals in RLVR | [2506.10947-spurious-rewards-rethinking-rlvr.md](/papers/2506.10947-spurious-rewards-rethinking-rlvr/) | RLVR reward signals, spurious rewards, GRPO clipping bias, Qwen priors, code reasoning | Rulin Shao, Shuyue Stella Li, Rui Xin, Scott Geng, Yiping Wang, Sewoong Oh, Simon Shaolei Du, Yulia Tsvetkov, Luke Zettlemoyer / University of Washington; Nathan Lambert / AI2; Sewon Min / UC Berkeley; Ranjay Krishna, Hannaneh Hajishirzi, Pang Wei Koh / UW and AI2 |
| 2505.24864 | ProRL: Prolonged Reinforcement Learning Expands Reasoning Boundaries in Large Language Models | [2505.24864-prorl-prolonged-rl-reasoning-boundaries.md](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/) | Prolonged RL, RLVR reasoning boundary, GRPO/DAPO recipe, KL reset, pass@k expansion | Mingjie Liu, Shizhe Diao, Ximing Lu, Jian Hu, Xin Dong, Yejin Choi, Jan Kautz, Yi Dong / NVIDIA |
| 2510.01180 | BroRL: Scaling Reinforcement Learning via Broadened Exploration | [2510.01180-brorl-broadened-rl-exploration.md](/papers/2510.01180-brorl-broadened-rl-exploration/) | RLVR scaling, broadened exploration, rollout width, correct-mass decomposition, ProRLv2, VERL | Jian Hu, Mingjie Liu, Ximing Lu, Shizhe Diao, Yejin Choi, Pavlo Molchanov, Jun Yang, Jan Kautz, Yi Dong / NVIDIA; Fang Wu / Stanford University; Zaid Harchaoui / University of Washington |
| 2509.25123 | From $f(x)$ and $g(x)$ to $f(g(x))$: LLMs Learn New Skills in RL by Composing Old Ones | [2509.25123-rl-compositional-skill-acquisition.md](/papers/2509.25123-rl-compositional-skill-acquisition/) | RLVR skill acquisition, compositional generalization, synthetic tasks, pass@k, DAPO/GRPO | Lifan Yuan, Hao Peng / UIUC; Weize Chen, Ning Ding, Zhiyuan Liu, Maosong Sun / Tsinghua University; Yuchen Zhang, Ganqu Cui / Shanghai AI Laboratory; Yuchen Zhang, Hanbin Wang, Ziming You / Peking University |
| 2512.07783 | On the Interplay of Pre-Training, Mid-Training, and RL on Reasoning Language Models | [2512.07783-interplay-pretraining-midtraining-rl-reasoning.md](/papers/2512.07783-interplay-pretraining-midtraining-rl-reasoning/) | RLVR training-stage interplay, pre-training exposure, mid-training, edge of competence, process reward | Charlie Zhang, Graham Neubig, Xiang Yue / Carnegie Mellon University, Language Technologies Institute |
| 2506.19248 | Inference-Time Reward Hacking in Large Language Models | [2506.19248-inference-time-reward-hacking-llms.md](/papers/2506.19248-inference-time-reward-hacking-llms/) | Inference-time alignment, reward hacking, Best-of-n, Best-of-Poisson, HedgeTune | Hadi Khalaf, Claudio Mayrink Verdun, Alex Oesterling, Himabindu Lakkaraju, Flavio du Pin Calmon / Harvard University |
| 2604.04648 | From Curiosity to Caution: Mitigating Reward Hacking for Best-of-$N$ with Pessimism | [2604.04648-caution-pessimism-best-of-n-reward-hacking.md](/papers/2604.04648-caution-pessimism-best-of-n-reward-hacking/) | Inference-time reward hacking, Best-of-$N$, pessimism, RND, OOD reward uncertainty | Zhuohao Yu, Zhiwei Steven Wu / Carnegie Mellon University; Adam Block / Columbia University |
| 2510.20270 | ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test Cases | [2510.20270-impossiblebench-test-case-exploitation.md](/papers/2510.20270-impossiblebench-test-case-exploitation/) | Agentic coding evaluation, test-case exploitation, reward hacking, context engineering, monitoring | Ziqian Zhong, Aditi Raghunathan / Carnegie Mellon University; Nicholas Carlini / Anthropic |
| 2501.09620 | Beyond Reward Hacking: Causal Rewards for Large Language Model Alignment | [2501.09620-causal-rewards-llm-alignment.md](/papers/2501.09620-causal-rewards-llm-alignment/) | RLHF reward modeling, causal debiasing, counterfactual invariance, MMD regularization, reward hacking | Chaoqi Wang / Meta and University of Chicago; Zhuokai Zhao, Chen Zhu, Jiayi Liu, Lizhu Zhang, Xiangjun Fan, Hao Ma, Sinong Wang / Meta; Yibo Jiang, Zhaorun Chen, Yuxin Chen / University of Chicago |
| 2403.03185 | Correlated Proxies: A New Definition and Improved Mitigation for Reward Hacking | [2403.03185-correlated-proxies-reward-hacking.md](/papers/2403.03185-correlated-proxies-reward-hacking/) | Reward hacking, correlated proxy reward, occupancy measure regularization, ORPO, RLHF safety | Cassidy Laidlaw, Shivam Singhal, Anca Dragan / UC Berkeley EECS |
| 2503.11926 | Monitoring Reasoning Models for Misbehavior and the Risks of Promoting Obfuscation | [2503.11926-monitoring-reasoning-models-obfuscation.md](/papers/2503.11926-monitoring-reasoning-models-obfuscation/) | CoT monitoring, obfuscated reward hacking, monitorability tax, reasoning model safety, agentic coding RL | Bowen Baker, Joost Huizinga, Leo Gao, Zehao Dou, Melody Y. Guan, Aleksander Madry, Wojciech Zaremba, Jakub Pachocki, David Farhi / OpenAI |
| 2501.12948 | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning | [2501.12948-deepseek-r1-rl-reasoning.md](/papers/2501.12948-deepseek-r1-rl-reasoning/) | Pure RL reasoning, DeepSeek-R1/R1-Zero, GRPO, verifiable reward, distillation, RL safety | DeepSeek-AI and 199 other authors; core contributors include Daya Guo, Peiyi Wang, Junxiao Song, Zhibin Gou, Zhihong Shao, Xiao Bi, Xingkai Yu, Shirong Ma, Haowei Zhang, Ziyi Gao |
| 2409.19256 | HybridFlow: A Flexible and Efficient RLHF Framework | [2409.19256-hybridflow-rlhf-framework.md](/papers/2409.19256-hybridflow-rlhf-framework/) | RLHF systems, distributed post-training infrastructure, VERL | Guangming Sheng, Chuan Wu / The University of Hong Kong; Chi Zhang, Zilingfeng Ye, Xibin Wu, Wang Zhang, Ru Zhang, Yanghua Peng, Haibin Lin / ByteDance |
| 2405.19888 | Parrot: Efficient Serving of LLM-based Applications with Semantic Variable | [2405.19888-parrot-semantic-variable-llm-serving.md](/papers/2405.19888-parrot-semantic-variable-llm-serving/) | LLM application serving, Semantic Variable, DAG-aware scheduling, shared prefix, agent workflows | Chaofan Lin, Chen Chen / Shanghai Jiao Tong University; Zhenhua Han, Chengruidong Zhang, Yuqing Yang, Fan Yang, Lili Qiu / Microsoft Research |
| 2511.02749 | Using Span Queries to Optimize for Cache and Attention Locality | [2511.02749-span-queries-cache-attention-locality.md](/papers/2511.02749-span-queries-cache-attention-locality/) | LLM serving, Span Queries, KV cache locality, attention locality, vLLM, nested generation | Paul Castro, Nick Mitchell, Mudhakar Srivatsa / IBM Research New York; Nathan Ordonez, Thomas Parnell / IBM Research Zurich; Antoni Viros i Martin / IBM Research Massachusetts |
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

### Cluster S: NVIDIA Nemotron ProRL / BroRL 与 Reasoning Boundary Expansion

- Paper: `2505.24864`, `2510.01180`
- Organization: NVIDIA；Stanford University；University of Washington。
- Internal relation: `2510.01180` 与 `2505.24864` 存在 7 位作者直接重叠：Jian Hu、Mingjie Liu、Ximing Lu、Shizhe Diao、Yejin Choi、Jan Kautz、Yi Dong。BroRL 在 ProRL / ProRLv2 的 NVIDIA Nemotron reasoning model 研究线上继续推进，并新增 Fang Wu / Stanford University、Zaid Harchaoui / University of Washington、Pavlo Molchanov、Jun Yang。`2505.24864` 中 Xin Dong、Yejin Choi、Jan Kautz、Yi Dong 在标题页加粗；`2510.01180` 中 Yejin Choi、Pavlo Molchanov、Jun Yang、Jan Kautz、Yi Dong 加粗，关系判断上更接近 senior / supervising authors。
- Theme relation: ProRL, BroRL, prolonged reinforcement learning, rollout-width scaling, broadened exploration, reasoning boundary expansion, pass@128 / pass@$k$, correct-mass decomposition, unsampled coupling, GRPO/PPO, DAPO Clip-Higher, Dynamic Sampling, KL regularization, reference policy reset, multi-task verifiable rewards, Reasoning Gym, OOD generalization, `verl`。

### Cluster T: Inference-Time Alignment、BoN Reward Hacking 与 Pessimism

- Paper: `2506.19248`, `2604.04648`
- Institutions: Harvard University；Carnegie Mellon University；Columbia University。
- Internal relation: `2506.19248` 中 Hadi Khalaf 和 Flavio du Pin Calmon 为通讯作者；Himabindu Lakkaraju 与 Flavio du Pin Calmon 关系判断上更接近 senior authors；全部作者均署名 Harvard University。`2604.04648` 中 Zhuohao Yu 与 Zhiwei Steven Wu 同属 Carnegie Mellon University，Adam Block 连接 Columbia University。两篇之间未发现作者重叠。
- Theme relation: inference-time reward hacking, winner's curse, Best-of-n / Best-of-$N$, Soft Best-of-n, Best-of-Poisson, HedgeTune, reward-KL frontier, true reward calibration, lower confidence bound, pessimism, RND-on-reward-model-features, OOD reward uncertainty, Goodhart's law, deployment-time hedging。

### Cluster U: Agentic Coding Evaluation 与 Test-Case Exploitation

- Paper: `2510.20270`
- Institutions: Carnegie Mellon University, Anthropic。
- Internal relation: Ziqian Zhong 与 Aditi Raghunathan 同属 Carnegie Mellon University；Nicholas Carlini 连接 Anthropic；acknowledgment 显示 Anthropic 提供 compute 和 API credits，并感谢 Henry Sleight 的项目管理支持。Aditi Raghunathan 与 [2605.30290](/papers/2605.30290-self-trained-verification/) 存在直接作者重叠。
- Theme relation: ImpossibleBench, Impossible-LiveCodeBench, Impossible-SWEbench, test-case exploitation, impossible task construction, cheating rate, context engineering, LLM monitoring, agentic coding reward hacking。

### Cluster V: RL Compositional Skill Acquisition 与 Boundary Expansion

- Paper: `2509.25123`
- Institutions: University of Illinois Urbana-Champaign, Tsinghua University, Shanghai AI Laboratory, Peking University。
- Internal relation: Lifan Yuan 与 Weize Chen 为 equal contribution；Ganqu Cui、Ning Ding、Zhiyuan Liu 为 corresponding authors；Yuchen Zhang 连接 Shanghai AI Laboratory 与 Peking University；Ning Ding 连接 Tsinghua University 与 Shanghai AI Laboratory。未发现与已存档论文作者的直接重叠，但与 [2504.13837](/papers/2504.13837-rlvr-reasoning-boundary-base-model/) 共享 Tsinghua 机构网络，与 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/) 共享 Peking University / Shanghai AI Laboratory 机构网络。
- Theme relation: RL compositionality, atomic skills, compositional skills, synthetic string transformations, DAPO/GRPO, RFT vs RL, difficulty-conditioned pass@$k$, reranking illusion, cross-task transfer to Countdown。

### Cluster W: LLM Application Serving 与 Semantic Variable

- Paper: `2405.19888`
- Institutions: Shanghai Jiao Tong University, Microsoft Research。
- Internal relation: Chaofan Lin 与 Chen Chen 属 Shanghai Jiao Tong University；Zhenhua Han、Chengruidong Zhang、Yuqing Yang、Fan Yang、Lili Qiu 属 Microsoft Research；Chaofan Lin 的 Microsoft Research internship 和 Chen Chen 的 Microsoft Research visiting scholar 经历连接两侧机构；Zhenhua Han、Yuqing Yang、Chen Chen 为 corresponding authors。
- Theme relation: Parrot, Semantic Variable, application-aware LLM serving, request DAG, prompt structure, performance objective deduction, shared prefix, context fork, Fill/Generate engine abstraction, FastAPI, vLLM, xFormers, OpenAI-like API, multi-agent coding serving, OSDI 2024。

### Cluster X: Pre-/Mid-/Post-Training Interplay 与 RL 能力边界

- Paper: `2512.07783`
- Institution: Carnegie Mellon University, Language Technologies Institute。
- Internal relation: Charlie Zhang、Graham Neubig、Xiang Yue 均署名 CMU LTI；Charlie Zhang 脚注说明工作完成于 CMU internship 期间；Xiang Yue 为 corresponding author；Graham Neubig 与 Xiang Yue 形成 CMU LTI reasoning / NLP senior author 线索。Xiang Yue 个人主页显示其当前在 Meta Superintelligence Labs，但本文标题页署名 CMU。
- Theme relation: pre-training exposure, mid-training / continued pre-training, GRPO, edge of competence, pass@128 capability expansion, contextual generalization, primitive seed, process-verified evaluation, process reward, RLVR boundary, synthetic reasoning, GSM-Infinite, ICML 2026 Spotlight。

### Cluster Y: Span Query、KV Cache Locality 与 Attention Locality

- Paper: `2511.02749`
- Institutions: IBM Research New York, IBM Research Zurich, IBM Research Massachusetts。
- Internal relation: Paul Castro、Nick Mitchell、Mudhakar Srivatsa 属 IBM Research New York；Nathan Ordonez、Thomas Parnell 属 IBM Research Zurich；Antoni Viros i Martin 属 IBM Research Massachusetts；Nick Mitchell 为 corresponding author 且为 arXiv submitter，连接作者群与外部沟通。
- Theme relation: Span Query, expression-tree IR, commutativity constraints, vLLM prefix cache extension, relocatable KV blocks, ReRoPE, CIDRA, RAG cache locality, nested generation, judge-generator, lost-in-the-middle, attention locality, tree reduction。

### Cluster Z: Pretraining Scaling Laws 与 Compute-Optimal Training

- Paper: `2001.08361`, `2203.15556`
- Institutions: Johns Hopkins University, OpenAI, DeepMind。
- Internal relation: `2001.08361` 中 OpenAI 为核心研究组织；Jared Kaplan 连接 Johns Hopkins University 与 OpenAI；Jared Kaplan 与 Sam McCandlish 共同主导研究。`2203.15556` 中 DeepMind 为单一研究组织；Jordan Hoffmann、Sebastian Borgeaud、Arthur Mensch、Laurent Sifre 为 equal contribution 且出现在 corresponding author email list；Jack W. Rae、Oriol Vinyals、Karen Simonyan、Laurent Sifre 等连接 DeepMind Gopher / large-model training 研究线。两篇之间未发现直接作者重叠；`2203.15556` 作者 Tom Hennigan 与 `2001.08361` 作者 Tom Henighan 拼写不同，按标题页证据不视为同一作者。
- Theme relation: neural language model scaling laws, compute-optimal pretraining, Chinchilla scaling, model/data/token allocation, $C\approx6ND$, power-law loss surface, data-optimal training, MassiveText, WebText2, critical batch / learning-rate schedule, early stopping, sample efficiency, pretraining compute accounting。

### Cluster AA: MiniMax-M1、Lightning Attention 与 CISPO

- Paper: `2506.13585`
- Institution: MiniMax。
- Internal relation: title page 以 MiniMax 为作者，appendix 将 Aili Chen 等 126 位 contributors 按字母序列出；论文没有给逐作者 affiliation 或贡献角色。当前记录 MiniMax 组织关系；与 [2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/) 存在 Dong Li、Xuyang Shen、Yiran Zhong 同名线索，待作者主页或官方说明确认身份。
- Theme relation: MiniMax-M1, hybrid MoE, Lightning Attention, 1M input context, 40K / 80K output budget, CISPO, clipped IS-weight policy optimization, long-output reasoning RL, train/inference precision mismatch, GenRM length bias, software engineering sandbox RL, TAU-bench, long-context evaluation。

### Cluster AB: Lightning Attention 与 TransNormerLLM

- Paper: `2405.17381`
- Institutions: TapTap, OpenNLPLab, Shanghai AI Lab。
- Internal relation: Zhen Qin 属 TapTap；Weigao Sun、Dong Li、Xuyang Shen、Weixuan Sun、Yiran Zhong 属 OpenNLPLab / Shanghai AI Lab；Yiran Zhong 为 corresponding author 和 arXiv submitter。该作者列表与 `2401.04658` Lightning Attention-2 完全相同。
- Theme relation: Lightning Attention, causal linear attention, block-wise left/right product, IO-aware tiling, Triton kernel, TransNormerLLM, Gated Linear Attention, LRPE-d, SGLU, SRMSNorm, long-context training speed。

### Cluster AC: DeepSeek-V4、Million-Token Context 与 Hybrid Compressed Attention

- Paper: `DS-2026-04-24`
- Institution: DeepSeek-AI。
- Internal relation: report 以 DeepSeek-AI 为作者；appendix 将 Research & Engineering authors 按 first name 字母序列出，并标记已离队成员。与 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 共享大量 DeepSeek-R1 / V3 系列核心作者线索，包括 Wenfeng Liang、Xiao Bi、Xingkai Yu、Junxiao Song、Peiyi Wang、Shirong Ma、Zhibin Gou、Zhihong Shao、Ziyi Gao 等。
- Theme relation: DeepSeek-V4-Pro, DeepSeek-V4-Flash, 1M context, Compressed Sparse Attention, Heavily Compressed Attention, DeepSeekMoE, mHC, Muon, TileLang, deterministic kernels, heterogeneous KV cache, on-disk KV cache, FP4 QAT, on-policy distillation, agent sandbox, million-token RL/OPD infrastructure。

### Cluster AD: GLM-5、Agentic Engineering 与 Asynchronous RL Systems

- Paper: `2602.15763`
- Institutions: Zhipu AI, Tsinghua University。
- Internal relation: title page 以 GLM-5 Team 署名，贡献表按 first name 字母序列出；tech leads 为 Aohan Zeng、Xin Lv、Zhenyu Hou、Zhengxiao Du、Qinkai Zheng、Bin Chen、Da Yin；advisors 为 Jie Tang、Yuxiao Dong、Juanzi Li、Hongning Wang、Minlie Huang、Bin Xu。该团队线与 GLM / Zhipu / Tsinghua 大模型工程生态直接相关。
- Theme relation: GLM-5, agentic engineering, 744B total / 40B active MoE, Multi-latent Attention, Muon Split, parameter-sharing MTP, DeepSeek Sparse Attention, 200K mid-training, slime asynchronous RL, TITO gateway, direct double-sided importance sampling, stale sample dropping, DP-aware routing, PD disaggregation, CC-Bench-V2, Agent-as-a-Judge, Chinese chip adaptation。

### Cluster AE: Seer、Synchronous RL Rollout 与 Group-Aware Context Learning

- Paper: `2511.14617`
- Institutions: Moonshot AI, Tsinghua University。
- Internal relation: Ruoyu Qin 同时署名 Moonshot AI 与 Tsinghua University，连接产业 production RL workloads 与高校系统研究；Weiran He、Weixiao Huang、Yangkun Zhang、Yikai Zhao、Bo Pang、Xinran Xu 属 Moonshot AI；Yingdi Shan、Yongwei Wu、Mingxing Zhang 属 Tsinghua University；Mingxing Zhang 为 corresponding author。
- Theme relation: synchronous RL rollout, strict on-policy semantics, GRPO group sampling, divided rollout, global KVCache pool, Mooncake, context-aware scheduling, speculative request, longest-first scheduling, distributed grouped draft server, compressed suffix tree, adaptive grouped speculative decoding, rollout long-tail latency, veRL baseline, StreamRL-Oracle, Partial Rollout comparison。

### Cluster AF: verl 当前 RL Optimization Recipes 与 Async Training Pipeline

- Material: `VERL-2026-06-16`
- Organization: verl project, ByteDance Seed Foundation MLSys Team, community contributors。
- Internal relation: one-step-off 与 fully async 文档均列出 `meituan-search`；async on-policy distill 文档列出 Brilliant Hanabi 与 furunding；rollout correction 文档列出 Yingru Li；DAPO 文档列出 Yuxuan Tong 与 Guangming Sheng，后者同时连接 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 的 HybridFlow/VERL 原始论文线索。
- Theme relation: PPO, GRPO, DAPO, OPO, GPG, DPPO, OTB, rollout correction, TIS, RS, one-step-off, fully async policy, async on-policy distillation, TransferQueue, MTP, staleness control, partial rollout, rollout logprob reuse, trainer/rollouter resource isolation。

### Cluster AG: Qwen Bebop、MTP Rejection Sampling 与 RL Rollout Acceleration

- Paper: `2606.12370`
- Organization: Qwen Team, Alibaba Inc.
- Internal relation: 全体作者署名 Qwen Team, Alibaba Inc.；Yucheng Li 与 Huiqiang Jiang 为 equal contribution；Huiqiang Jiang 为 corresponding author。论文同时连接 SGLang rejection sampling PR 与 vLLM Gumbel-Max implementation PR，显示 Qwen MTP 研究与开源 inference engine 的工程落地关系。
- Theme relation: Bebop, Multi-Token Prediction, speculative decoding, rejection sampling, target-only sampling, entropy-acceptance bound, TV distance, end-to-end TV loss, pre-RL MTP adaptation, async RL rollout, Qwen3.5/3.6/3.7, SGLang, vLLM, agentic RL。

### Cluster AH: Dynamic Linear Attention 与 Multi-State Linear Memory

- Paper: `2606.10650`
- Institutions: The Ohio State University, University of Michigan, ByteDance Seed。
- Internal relation: Xin Wang 与 Hui Shen 为 equal contribution，连接 OSU 与 University of Michigan；Xin Wang 与 Mi Zhang 为 corresponding authors；Shen Yan 连接 ByteDance Seed 与高校作者群。
- Theme relation: Dynamic Linear Attention, multi-state linear attention, State Information Score, information-aware dynamic state merging, capacity-bounded memory modeling, fixed-size chronological state cache, Mamba-2, Gated DeltaNet, Log-Linear Attention, RULER, LongBench, long-context modeling。

## 跨论文关系

- `2606.10650` 新增 Dynamic Linear Attention / multi-state linear memory 节点。它把 linear attention 的长上下文损失归因到固定 state merging 策略与非均匀信息密度之间的错配，并用 token-level representation drift 动态切 state boundary，再用固定容量 cache 合并低信息密度相邻 state。
- `2606.10650` 和 [2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/) 是 linear attention 的两层互补路线。Lightning Attention 解决 causal linear attention 的 block-wise / IO-aware kernel 执行路径；DLA 解决 multi-state memory construction、state boundary 和 bounded cache。
- `2606.10650` 和 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 连接在 long-context / long-output efficiency。MiniMax-M1 展示 Lightning Attention 进入 long-output RL 系统；DLA 提供动态 memory resolution 机制，可作为后续 hybrid linear-attention model 的 long-context 诊断方向。
- `2606.10650` 和 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 共同讨论长上下文压缩。DeepSeek-V4 用 CSA/HCA 和 heterogeneous KV cache 支撑 million-token context；DLA 用 bounded multi-state linear memory 控制信息压缩粒度。
- `2606.10650` 和 [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 都关注长上下文 agentic 系统中的动态压缩。GLM-5 的 DSA 处理 sparse/compressed attention 与 rollout consistency；DLA 在 linear attention 内部处理 state segmentation 和 cache merge。
- `2606.10650` 和 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/) 是模型内部 memory construction 与 serving engine programability 的关系。Vortex 暴露 sparse attention execution program；DLA 暴露 representation-drift-driven state cache。
- `2606.10650` 和 [2511.02749](/papers/2511.02749-span-queries-cache-attention-locality/)、[2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/) 共享“上下文结构可被利用”的系统观。Span Query / Parrot 从应用和表达式结构显式暴露 locality；DLA 从 token representation drift 自动形成 memory segmentation。
- `2606.12370` 新增 Qwen Bebop / MTP rejection sampling / RL rollout acceleration 节点。它把 MTP 在 RL 中 acceptance degradation 的主因从 policy-draft staleness 重新定位为 target policy entropy fluctuation，并用 rejection sampling + e2e TV loss 提供 pre-RL adaptation recipe。
- `2606.12370` 和 [2026-06-16](/papers/2026-06-16-verl-rl-optimization-algorithms/) 直接连接。verl 当前文档把 MTP 作为 rollout speculative decoding 选项，并提醒实际吞吐依赖硬件和实现；Bebop 补充了 MTP 在 RL 中稳定生效的 acceptance method、TV loss 和 entropy coverage 条件。
- `2606.12370` 和 [2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/) 是两条 rollout acceleration 路线。Seer 用 group-aware scheduling、global KVCache 和 grouped CST draft 加速 synchronous rollout；Bebop 用 MTP heads、rejection sampling 和 TV loss 加速 async RL rollout。
- `2606.12370` 和 [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 共同说明 production agentic RL 需要把 rollout acceleration 和 off-policy/freshness 控制一起处理。GLM-5/slime 使用 parameter-sharing MTP、TITO 和 double-sided IS；Bebop 处理 MTP acceptance 在 entropy fluctuation 下的稳定性。
- `2606.12370` 和 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 共同服务 long-output / agentic RL efficiency。MiniMax-M1 从 Lightning Attention、CISPO 和长输出 RL objective 处理训练成本；Bebop 从 MTP speculative decoding 的 acceptance 机制处理 rollout 成本。
- `2606.12370` 和 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 连接在 MTP 与 production post-training infrastructure。DeepSeek-V4 报告 MTP、deterministic kernels 和 OPD/agent sandbox；Bebop 给出 MTP heads 在 RL rollout 中如何通过 RS 与 TV loss 保持 acceptance 的细化 recipe。
- `2606.12370` 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 都关注 rollout 闭环中的分布一致性。TIM/VeXact 关注 rollout engine 与 trainer engine 的 logprob mismatch；Bebop 关注 target policy distribution 与 MTP draft distribution 的 TV overlap 和 acceptance mismatch。
- `VERL-2026-06-16` 新增 verl 当前 RL 优化算法与异步训练流水线文档节点。它把 PPO/GRPO/DAPO/OPO/GPG/DPPO/OTB 这类算法模块，与 one-step-off、fully async、async on-policy distill、TransferQueue、MTP 这类系统模块连接到同一条 post-training 工程主线。
- `VERL-2026-06-16` 和 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 是 framework paper 与 current docs 的关系。HybridFlow 解释 VERL 的多模型 dataflow 和 hybrid controller；新文档记录当前 verl docs 中的 algorithm recipe、rollout correction、异步 pipeline 和数据面演化。
- `VERL-2026-06-16` 和 [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/) 直接连接在 DAPO recipe。DAPO 论文提供 long-CoT RL 系统方法，verl 文档把 Clip-Higher、dynamic sampling、token-level loss、overlong reward shaping 和 fully async 实验落实到配置层。
- `VERL-2026-06-16` 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 连接在 rollout correction。三策略框架、`rollout_log_probs`、`old_log_probs`、TIS、RS、bypass/decoupled mode 都是 TIM 风险在 verl 中的工程接口。
- `VERL-2026-06-16` 和 [2511.14617](/papers/2511.14617-seer-online-context-learning-llm-rl/)、[2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 构成 synchronous optimization、fully async optimization 与 production async RL 的三角关系。Seer 保持严格同步语义并优化 rollout tail，verl fully async 允许 staleness 和 partial rollout，GLM-5/slime 在 agentic RL 中使用异步 rollout 与 double-sided IS。
- `VERL-2026-06-16` 和 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 在 importance ratio 和 rollout efficiency 上相关。CISPO 处理 objective 中的 clipped importance value；verl rollout correction 处理 behavior policy 到 training anchor 的分布偏移；MTP 与 Lightning/Seer grouped SD 都服务长输出 rollout 加速。
- `2511.14617` 新增 Seer / synchronous RL rollout system 节点。它聚焦 long-CoT RL 中 rollout 占 63-87% iteration time 的瓶颈，利用 GRPO 同 prompt group 内的 length correlation 和 token pattern similarity，实现 divided rollout、context-aware scheduling 和 adaptive grouped speculative decoding，在保持严格同步 / on-policy 语义下提升 rollout throughput。
- `2511.14617` 和 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 是 RL systems 的上下游补充。HybridFlow/VERL 关注 RLHF/RLVR 多模型 dataflow、placement 和 trainer/rollout 编排；Seer 以 veRL 为 strong baseline，把优化焦点深入到 rollout phase 的 chunk-level scheduling、global KVCache 和 grouped SD。
- `2511.14617` 和 [2602.15763](/papers/2602.15763-glm-5-agentic-engineering/) 构成同步与异步路线对照。GLM-5/slime 通过异步 rollout、TITO、direct double-sided IS 和 stale sample dropping 换取 agent RL 吞吐；Seer 在严格同步 rollout 内消除 long-tail latency，降低 off-policy 与分布偏斜风险。
- `2511.14617` 和 [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/)、[2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 共享 GRPO / long-CoT RL 背景。DAPO/DeepSeek-R1 关注 algorithm recipe 和 reward/training dynamics；Seer 关注同类 GRPO group sampling 给系统调度带来的结构信号。
- `2511.14617` 和 [2510.01180](/papers/2510.01180-brorl-broadened-rl-exploration/) 在 rollout width 上直接相关。BroRL 把 per-prompt rollout 数扩到大 $N$ 以提升探索；Seer 指出 group size 增大会加重 group-level scheduling imbalance，同时也提供更多 group context 给 length prediction 和 grouped draft。
- `2511.14617` 和 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 共同服务 long-output reasoning RL。MiniMax-M1 从模型架构和 objective 降低长输出训练成本；Seer 从 serving/scheduling 层降低 long-CoT rollout 的 tail latency 和 speculative decoding 开销。
- `2511.14617` 和 [2511.02749](/papers/2511.02749-span-queries-cache-attention-locality/)、[2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/)、[2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/) 共同说明上层结构暴露决定 serving 优化空间。Span Query 暴露 span/expression tree，Parrot 暴露 semantic variable/DAG，Vortex 暴露 sparse attention program，Seer 暴露 GRPO group context。
- `2511.14617` 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)、[2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 连接在 on-policy RL reproducibility。Seer 保持同步语义，但 chunk migration、global KVCache 和 grouped SD 进入训练闭环后仍需要保证 token order、rollout logprob、batch behavior 和 replay metadata 可审计。
- `2602.15763` 新增 GLM-5 / agentic engineering 系统节点。它把 Zhipu/Tsinghua 的 GLM 系列推进到 744B total / 40B active MoE、28.5T tokens、200K context、DSA、Muon Split、共享 MTP、异步 Agentic RL、slime rollout infrastructure、TITO、直接双边 IS、DP-aware routing 和 CC-Bench-V2 真实工程评测。
- `2602.15763` 和 [2026-04-24](/papers/2026-04-24-deepseek-v4-million-token-context-intelligence/) 共同代表 2026 年 open-weight frontier system report 的两条路线。DeepSeek-V4 强调 1M context、CSA/HCA、mHC、OPD、deterministic kernels 和 agent sandbox；GLM-5 强调 200K context、DSA adoption、slime 异步 RL、TITO、agent environment scaling 和国产芯片适配。
- `2602.15763` 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/)、[2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/) 强连接在 train/inference consistency。GLM-5 的 IcePop ratio、deterministic DSA top-k、TITO gateway 和 rollout logprob reuse，都把 TIM / batch-invariant determinism 的风险落实到 sparse attention indexer 与异步 agent RL。
- `2602.15763` 和 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 是 post-training infrastructure 对照。HybridFlow/VERL 强调 RLHF/RLVR 多模型 dataflow 和 flexible placement；GLM-5/slime 强调 server-based rollout、HTTP task services、Multi-Task Rollout Orchestrator、PD disaggregation、FP8/MTP rollout 和 heartbeat fault tolerance。
- `2602.15763` 和 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/) 共同说明 agentic tool-use RL 的训练效率取决于 harness、token alignment、rollout tail latency、工具返回、环境失败和 policy update。GLM-5 的 TITO、stale sample dropping、environment failure filtering、DP-aware routing 是 production-scale 处理方式。
- `2602.15763` 和 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 连接在 long-context / long-output RL objective。MiniMax-M1 的 CISPO 处理 current/old ratio 下 token clipping 与 low-prob reflection token 梯度；GLM-5 的 direct double-sided IS 处理 current/rollout ratio 下异步 agent RL 的 off-policy bias。
- `2602.15763` 和 [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/) 共享 DAPO/GRPO 后续 recipe。GLM-5 的 Reasoning RL 使用 GRPO + IcePop，slide generation RL 引用 token-level policy gradient loss，并用动态采样与多层 reward 处理 HTML slide 生成。
- `2602.15763` 和 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/)、[2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/)、[2511.02749](/papers/2511.02749-span-queries-cache-attention-locality/) 共同扩展 agent serving 系统图谱。GLM-5 的 DP-aware routing、PD disaggregation、context management 和 rollout service 与 sparse attention serving、application DAG 和 span-level cache locality 互补。
- `2602.15763` 和 [2403.03185](/papers/2403.03185-correlated-proxies-reward-hacking/)、[2510.20270](/papers/2510.20270-impossiblebench-test-case-exploitation/) 共享 proxy reward / test feedback 风险。GLM-5 的 slide RL 观察到 layout reward hacking，SWE/terminal/search 环境也需要用 reward hacking 与 test-case exploitation 视角复验。
- `DS-2026-04-24` 新增 DeepSeek-V4 / 1M context 系统节点。它把 DeepSeek 系列从 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 的 reasoning RL 主线推进到百万上下文架构：CSA/HCA hybrid compressed attention 降低 FLOPs 与 KV cache，mHC 稳定 residual propagation，Muon 提升训练优化，deterministic kernels 和 heterogeneous KV cache 支撑 long-context serving 与 post-training。
- `DS-2026-04-24` 和 [2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/) 是 optimizer theory 与 production-scale application 的关系。Muon 论文解释 update geometry 和 curvature penalty；DeepSeek-V4 报告展示 Muon 在 trillion-scale MoE 预训练中的工程配置，包括 Hybrid Newton-Schulz、AdamW/Muon 分工和 BF16 gradient synchronization。
- `DS-2026-04-24` 和 [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 强连接在 batch-invariant / deterministic kernels 与 train-inference alignment。V4 把 attention、matmul、MoE backward、mHC small matmul 的 bitwise determinism 做成 kernel library 目标，用于 debugging、post-training consistency 和 rollout behavior control。
- `DS-2026-04-24` 和 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/) 共同补齐 large MoE system stack。UltraEP 研究 rack-scale exact-load expert balancing；V4 报告展示 DeepSeek 自身 fine-grained EP mega-kernel、MegaMoE、communication-computation overlap、MoE deterministic backward 和 low-bandwidth tolerance。
- `DS-2026-04-24` 和 [2405.17381](/papers/2405.17381-various-lengths-constant-speed-lightning-attention/)、[2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 是 long-context / long-output architecture 路线对照。Lightning Attention 使用 linear/recurrent state 降低长序列成本；MiniMax-M1 将其用于 long-output RL；DeepSeek-V4 使用 compressed sparse / heavily compressed attention、sliding window branch 和 heterogeneous KV cache 支撑 1M context。
- `DS-2026-04-24` 和 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/)、[2511.02749](/papers/2511.02749-span-queries-cache-attention-locality/)、[2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/) 共同构成 long-context serving 图谱。V4 从模型内部压缩和缓存布局处理长上下文；Vortex、Span Query、Parrot 分别从 sparse attention programming、cache/attention locality 和 application DAG 暴露角度处理 serving workload。
- `DS-2026-04-24` 和 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/)、[2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/) 连接在 post-training systems 与 tool-use RL。V4 报告的 token-granular WAL rollout、FP4 QAT rollout consistency、million-token RL data format、DSec sandbox 和 DSML tool-call schema补充了大规模 agentic RL/OPD 的生产实现细节。
- `2405.17381` 新增 Lightning Attention / TransNormerLLM 节点。它解释了 MiniMax-M1 中 Lightning Attention 的上游机制：causal linear attention 的长序列效率来自 block-wise intra-block left product、inter-block $KV$ recurrent state 和 IO-aware tiling，而 TNL 通过 LRPE-d、GLA、SGLU、SRMSNorm 补齐 linear attention 的架构侧能力。
- `2405.17381` 和 [2506.13585](/papers/2506.13585-minimax-m1-cispo-lightning-attention/) 是上游算法架构与下游 long-output reasoning system 的关系。前者证明 Lightning Attention / TNL 可以提升长序列训练和推理效率；后者把该系统线放进 hybrid MoE + RL recipe，并报告 train/inference probability mismatch、FP32 LM head 和 CISPO 等 RL 侧问题。
- `2405.17381` 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 连接在 long-context architecture 进入 RL 后的数值一致性。Lightning Attention 解决 attention 计算路径效率；TIM/VeXact 提醒 rollout engine 与 trainer engine 的 logprob mismatch 会改变 RL 更新的实际分布。
- `2405.17381` 和 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/)、[2511.02749](/papers/2511.02749-span-queries-cache-attention-locality/)、[2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/) 共同组成 long-context efficiency 图谱。Lightning Attention 从模型架构和 kernel 层降低长序列成本；Vortex、Span Query、Parrot 分别从 sparse attention、attention/cache locality、application DAG 暴露降低真实 serving workload 成本。
- `2506.13585` 新增 MiniMax-M1 / CISPO / Lightning Attention 节点。它把 long-output reasoning RL 的 scaling 拆成 architecture efficiency、objective efficiency、reward/data curriculum 和 staged length expansion 四部分，是本地 RLVR 系统图谱中的重要补充。
- `2506.13585` 和 [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/) 直接对话。DAPO 提出 Dynamic Sampling、Token-level Policy Gradient Loss、Clip-Higher 和 Overlong Reward Shaping；MiniMax-M1 沿用 dynamic sampling 与 length penalty，同时提出 CISPO，把 clipping 从 token update 转到 IS weight。
- `2506.13585` 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 连接在 train/inference probability consistency。TIM/VeXact 将 rollout/trainer logprob mismatch 定义为 RL collapse 风险；MiniMax-M1 在 hybrid architecture 中观察到 training-mode 与 inference-mode token probability mismatch，并用 FP32 LM head 提升相关性。
- `2506.13585` 和 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 属于 long-CoT reasoning model 系谱。DeepSeek-R1 强调 GRPO / verifiable reward 激发 long-CoT；MiniMax-M1 强调 Lightning Attention 的 long-output cost advantage、CISPO 和 software-engineering / tool-use RL。
- `2506.13585` 和 [2510.01180](/papers/2510.01180-brorl-broadened-rl-exploration/)、[2505.24864](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/) 共同扩展 RL scaling 语言。ProRL/BroRL 研究训练时长和 rollout width；MiniMax-M1 研究 output-length scaling、architecture FLOPs 和 objective clipping。
- `2506.13585` 和 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/) 连接在 agentic tool-use RL。MiniMax-M1 报告 TAU-bench 和 software engineering sandbox；tool-calling RL 论文提醒 harness、tool schema、多轮 history、rollout filtering 和 policy update 成本会影响结论。
- `2506.13585` 和 [2506.10947](/papers/2506.10947-spurious-rewards-rethinking-rlvr/) 共享 RLVR 训练信号诊断。Spurious Rewards 关注 GRPO clipping bias 和 model prior；MiniMax-M1 关注 PPO/GRPO token clipping 丢失 low-prob reflection token 梯度，并报告 GenRM length bias 的 reward hacking 风险。
- `2506.13585` 和 [2506.19248](/papers/2506.19248-inference-time-reward-hacking-llms/)、[2403.03185](/papers/2403.03185-correlated-proxies-reward-hacking/) 共享 reward bias / proxy reward 风险语言。MiniMax-M1 的 GenRM length bias 是 long-CoT reward model 在训练时的具体失真案例。
- `2506.13585` 和 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/)、[2511.02749](/papers/2511.02749-span-queries-cache-attention-locality/)、[2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/) 连接在 long-context agent serving。MiniMax-M1 提供长上下文 foundation model；这些系统论文处理 sparse attention、KV locality 和 application-level scheduling。
- `2001.08361` 新增 pretraining scaling laws / compute-efficient training 节点。它提供 $N,D,C$ 三个变量和 $C\approx6NBS$ 的 pretraining compute 语言，是后续讨论 base model latent capability、post-training scaling、optimizer efficiency 和 RL systems compute accounting 的上游坐标系。
- `2203.15556` 新增 Chinchilla / data-optimal pretraining 节点。它直接修正 [2001.08361](/papers/2001.08361-scaling-laws-neural-language-models/) 的 compute-optimal allocation，把 Kaplan 的 $N_{\mathrm{opt}}\propto C^{0.73}$、$D_{\mathrm{opt}}\propto C^{0.27}$ 改写为近似 $N_{\mathrm{opt}}\propto C^{0.5}$、$D_{\mathrm{opt}}\propto C^{0.5}$，并用 70B / 1.4T-token Chinchilla 对 280B / 300B-token Gopher 做同 compute 验证。
- `2203.15556` 和 [2512.07783](/papers/2512.07783-interplay-pretraining-midtraining-rl-reasoning/) 连接在 token-equivalent compute 与 pre-training exposure。Interplay 使用 Chinchilla 近似讨论 pre-training、mid-training 和 RL compute allocation；Chinchilla 提供 dense pretraining 下 token/model tradeoff 的基础坐标。
- `2203.15556` 和 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 是 data-optimal base pretraining 与 reasoning RL 的上下游关系。Chinchilla 说明 base model 需要足够 token exposure；DeepSeek-R1 展示强 base model 上的 GRPO / verifiable reward 可以激发 long-CoT behavior。
- `2203.15556` 和 [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/)、[2505.24864](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/)、[2510.01180](/papers/2510.01180-brorl-broadened-rl-exploration/) 共同构成 pretraining scaling 与 RLVR scaling 的上下游对照。Chinchilla 处理 base model 的 token/parameter allocation；DAPO/ProRL/BroRL 处理 post-training 的 rollout、step、width 和 reward allocation。
- `2203.15556` 和 [2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/) 都服务 pretraining efficiency。Chinchilla 关注 macro allocation 与 AdamW / schedule recipe；Muon 关注 optimizer update geometry 与 curvature penalty。
- `2203.15556` 和 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/)、[2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/) 的关系是 compute accounting 口径差异。Chinchilla 的 $C\approx6ND$ 适合 dense next-token pretraining；RLHF/RLVR/tool-use training 还要计入 rollout、reward/verifier/reference model、多轮工具返回和 policy update。
- `2001.08361` 和 [2512.07783](/papers/2512.07783-interplay-pretraining-midtraining-rl-reasoning/) 形成 pretraining loss scaling 与 reasoning-stage interplay 的连接。前者描述 next-token loss 如何随参数、数据和 compute 下降；后者进一步拆解 pre-training exposure、mid-training bridge、edge-of-competence RL data 和 process reward 如何影响 reasoning pass@$k$。
- `2001.08361` 和 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 是 base model scaling 与 reasoning RL emergence 的上下游关系。Kaplan scaling laws 解释 strong base model 何以随 $N,D,C$ 平滑改善；DeepSeek-R1 展示在强 base model 上用 GRPO / verifiable reward 激发 long-CoT behavior。
- `2001.08361` 和 [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/)、[2505.24864](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/)、[2510.01180](/papers/2510.01180-brorl-broadened-rl-exploration/) 共同构成 scaling axis 对照组。本文的 axis 是 pretraining $N,D,C$；DAPO/ProRL/BroRL 的 axis 是 RL recipe、training steps、rollout length、rollout width、effective gradients 和 reward filtering。
- `2001.08361` 和 [2606.04662](/papers/2606.04662-muon-outperforms-adam-curvature/) 都服务 pretraining efficiency。前者给出宏观 loss scaling law；Muon 论文从 optimizer update direction、curvature penalty 和 normalized directional sharpness 解释优化器如何改变训练效率。
- `2001.08361` 和 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/)、[2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/)、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 连接在 compute accounting。Kaplan scaling 使用简化 pretraining compute $C\approx6NBS$；RLHF/RLVR 与 tool-use training 需要额外计入 rollout backend、reference/reward/verifier model、工具返回、长上下文、多轮轨迹和 sampler-trainer consistency。
- `2001.08361` 和 [2503.11926](/papers/2503.11926-monitoring-reasoning-models-obfuscation/) 共享 OpenAI 机构网络但无作者重叠。主题上，前者代表 OpenAI 早期大规模 pretraining scaling 研究；后者代表 reasoning model safety / monitorability 研究，二者体现 capability scaling 之后 safety measurement 成为独立问题。
- `2511.02749` 新增 Span Query / cache locality / attention locality 节点。它把 RAG、nested generation、judge-generator 和 agentic workload 表示成带 commutativity constraints 的 LLM call expression tree，让 serving runtime 可以进行 span-level KV cache reuse、ReRoPE repositioning 和 attention-locality tree rewrite。
- `2511.02749` 和 [2405.19888](/papers/2405.19888-parrot-semantic-variable-llm-serving/) 是 application-aware serving 的两种接口设计。Parrot 用 Semantic Variable / DAG / performance objective 暴露应用级依赖；Span Query 用 message spans、generate calls 和 $\mathbf +/\mathbf{\Join}$ 暴露顺序约束。二者共同说明：serving backend 的优化空间取决于上层结构暴露程度。
- `2511.02749` 和 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/) 同属 attention / serving efficiency 系统线。Vortex 让 sparse attention algorithm 通过 DSL 和 compiler 进入真实 serving；Span Query 让 sparse / local attention 由 query tree 和 commutativity hint 驱动。前者偏 kernel / algorithm programming，后者偏 application-structure IR。
- `2511.02749` 和 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 都体现 dataflow/IR drives scheduling。HybridFlow 显式编排 RLHF/RLVR 的 rollout、training、reference、reward dataflow；Span Query 显式编排 inference-time multi-call workload 的 span、join 和 generate structure。
- `2511.02749` 和 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/) 连接在 agentic workflow serving。Tool-calling RL 论文显示 tool schema、多轮 history 和工具返回会放大 rollout 与 policy update 成本；Span Query 提供 serving-side 表达方式，可能减少同类 workflow 的重复 prefill 和长上下文 attention 成本。
- `2511.02749` 和 [2605.30290](/papers/2605.30290-self-trained-verification/)、[2512.07783](/papers/2512.07783-interplay-pretraining-midtraining-rl-reasoning/) 连接在 verifier / judge-generator / process-evaluation workflow。STV 和 Interplay 都依赖多候选、verifier 或 process evaluation；Span Query 给这类 nested generation 提供 cache locality 和 attention locality 优化接口。
- `2511.02749` 和 [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 连接在 serving backend 对上层闭环的影响。Span Query 的 query rewrite、padding、batch clustering、ReRoPE 和 partial-block 处理若进入 RL rollout 或评测，需要记录 batch-invariant determinism、rollout/trainer logprob consistency 和 prompt semantic equivalence。
- `2512.07783` 新增 pre-/mid-/post-training interplay 节点。它把 RLVR 是否扩展能力的问题改写为条件问题：pre-training 是否留下 headroom，RL 数据是否位于 edge of competence，长尾 context 是否有 primitive seed，mid-training 是否建立可被 RL 放大的 priors，reward 是否约束有效推理过程。
- `2512.07783` 和 [2504.13837](/papers/2504.13837-rlvr-reasoning-boundary-base-model/) 形成直接对话。`2504.13837` 说明标准 benchmark 上 RLVR 常提升 pass@1 但难以扩展大 $k$ coverage；`2512.07783` 说明当任务处在 base model 可探索边缘时，RL 可以提升 pass@128。
- `2512.07783` 和 [2509.25123](/papers/2509.25123-rl-compositional-skill-acquisition/) 都用可控合成任务支持 “RL 在合适条件下能学组合泛化”。`2509.25123` 强调 atomic skills + compositional incentive；`2512.07783` 进一步拆出 pre-training primitive exposure、mid-training bridge 和 edge-of-competence RL data。
- `2512.07783` 和 [2506.10947](/papers/2506.10947-spurious-rewards-rethinking-rlvr/) 是 RLVR gain 来源争论的互补证据。Spurious Rewards 提醒 prior amplification / GRPO clipping bias；`2512.07783` 通过可控数据分布和 process-verified evaluation 降低 confound，并给出 true gain 的可检查条件。
- `2512.07783` 和 [2505.24864](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/) 都支持 reasoning boundary 可被扩展。ProRL 给出 prolonged RL 的宏观证据；`2512.07783` 给出更细的条件语言：primitive seed、headroom、edge data 和 mid-training priors。
- `2512.07783` 和 [2510.01180](/papers/2510.01180-brorl-broadened-rl-exploration/) 共享 “RL 需要足够可强化成功轨迹” 的观点。BroRL 通过 broadened rollout 增加探索覆盖；`2512.07783` 通过 edge-of-competence 数据筛选提高成功轨迹密度。
- `2512.07783` 和 [2503.14476](/papers/2503.14476-dapo-long-cot-rl-system/) 在有效梯度筛选上相通。DAPO Dynamic Sampling 过滤全对/全错 prompt groups；`2512.07783` 建议选择 fail@1 but pass@$k$ 的 edge tasks 作为 RL 数据。
- `2512.07783` 和 [2501.12948](/papers/2501.12948-deepseek-r1-rl-reasoning/) 连接在 GRPO / outcome reward 激发 reasoning 主线。DeepSeek-R1 给出宏观现象；`2512.07783` 在可控 setting 中拆解 pre-training primitive coverage、mid-training bridge 和 process reward 的作用。
- `2512.07783` 和 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/)、[2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 连接在 RL compute accounting。本文用 $T_{\mathrm{RL}}=\frac{5}{3}NrL_{\mathrm{total}}$ 把 GRPO 折算为 token-equivalent cost；tool-use RL 与 HybridFlow 提醒真实系统还需计入工具返回、长轨迹、rollout/trainer 编排和 policy update 开销。
- `2512.07783` 和 [2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 连接在 rollout 分布测量。本文依赖 pass@$k$ 和 edge-of-competence 画像；TIM/VeXact 提醒 rollout engine 与 trainer engine 的 logprob mismatch 会改变名义 on-policy 更新。
- `2512.07783` 和 [2403.03185](/papers/2403.03185-correlated-proxies-reward-hacking/)、[2604.04648](/papers/2604.04648-caution-pessimism-best-of-n-reward-hacking/) 共享 reward hacking 防御主题。本文用 process verification 把 reward 从 final answer proxy 扩展到 reasoning graph，降低 shortcut exploitation。
- `2405.19888` 新增 LLM application serving / Semantic Variable 节点。它把 LLM 应用从孤立 completion requests 还原成带变量、依赖、性能目标和共享 prompt structure 的数据流，让服务端可以做 DAG-aware scheduling、dependent-request serving、shared-prefix detection 和 context fork。
- `2405.19888` 和 [2606.06453](/papers/2606.06453-vortex-sparse-attention-serving/) 同属 LLM serving systems。Parrot 处理应用级 workflow、DAG 和 prompt sharing；Vortex 处理 attention backend 可编程性与稀疏注意力真实 serving 验证。两者可以组合成上层结构暴露与下层高效 attention 执行的系统栈。
- `2405.19888` 和 [2409.19256](/papers/2409.19256-hybridflow-rlhf-framework/) 都把上层 dataflow 显式交给系统调度器。HybridFlow 面向 RLHF/RLVR training 中的多模型 dataflow；Parrot 面向 inference-time LLM application 中的多请求 workflow。
- `2405.19888` 和 [2606.00135](/papers/2606.00135-agentic-tool-calling-rl-training/) 共享 agent workflow 主题。Tool-calling RL 论文说明 harness、tool schema 和多轮历史会改变有效训练信号；Parrot 说明同类 workflow 结构也会决定 serving cost、batching 和 prefix reuse。
- `2405.19888` 和 [2510.20270](/papers/2510.20270-impossiblebench-test-case-exploitation/) 连接在 agentic coding workflow。ImpossibleBench 关注 coding agent 如何利用 tests proxy；Parrot 提供 multi-agent coding 的系统执行抽象，可记录 architect/coder/reviewer/test 等变量依赖和服务端调度边界。
- `2405.19888` 和 [2606.04101](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/) 都说明 runtime exact signal 对调度更有用。UltraEP 使用 gating 后 exact expert load；Parrot 使用 runtime application DAG 与 prompt structure。
- `2405.19888` 和 [2025-09-10](/papers/2025-09-10-defeating-nondeterminism-llm-inference/)、[2605.14220](/papers/2605.14220-training-inference-mismatch-llm-rl/) 连接在 serving backend 对上层闭环的影响。Parrot 的 application-aware batching、context fork 和 shared-prefix scheduling 若用于 RL rollout 或评测，需要额外记录 batch-invariant determinism 与 trainer/rollout backend consistency。
- `2405.19888` 和 [2605.30290](/papers/2605.30290-self-trained-verification/) 在 verifier/reasoner loop 上互补。STV 的 V-R loop 由 reasoner output、verifier feedback 和 refinement input 组成；Parrot 的 Semantic Variable 可以表达这类变量流并优化服务端共置与共享。
- `2604.04648` 新增 BoN pessimism / caution 节点。它把 Best-of-$N$ 大候选池下的 reward hacking 解释为 reward model 熟悉分布外的 proxy overoptimization，并用 $r_{\mathrm{LCB}}(x,y)=\hat r(x,y)-\lambda\alpha(x,y)$ 在推理选择阶段降低 OOD 高分候选权重。
- `2604.04648` 和 [2506.19248](/papers/2506.19248-inference-time-reward-hacking-llms/) 是 inference-time reward hacking 的两种互补防线。`2506.19248` 用 HedgeTune / Best-of-Poisson 校准 selection pressure；`2604.04648` 用 reward-level pessimism 调整每个候选的选择分数。
- `2604.04648` 和 [2403.03185](/papers/2403.03185-correlated-proxies-reward-hacking/) 共享 reference distribution 语言。ORPO 在 training-time policy optimization 中约束 occupancy shift；`2604.04648` 在 inference-time BoN reranking 中用 predictor error 估计 reward model 的 OOD uncertainty。
- `2604.04648` 和 [2501.09620](/papers/2501.09620-causal-rewards-llm-alignment/) 形成 reward hacking 防御链条。CRM 在 reward model 训练阶段降低已知 spurious factor 影响；caution 在 reward model 固定后通过 lower confidence bound 进行推理时防护。
- `2604.04648` 和 [2506.10947](/papers/2506.10947-spurious-rewards-rethinking-rlvr/) 都强调 reward score 提升需要拆解来源。Spurious Rewards 关注 RLVR 训练中 prior amplification 与 objective bias；caution 关注 BoN 推理中 proxy reward overoptimization 与 OOD selection。
- `2604.04648` 和 [2510.01180](/papers/2510.01180-brorl-broadened-rl-exploration/) 在 large-$N$ / rollout width 上构成重要张力。BroRL 用更宽 rollout 增加有效训练信号；caution 提醒当选择器依赖 learned reward 或 verifier 时，大候选池也会更容易暴露 proxy exploit 轨迹。
- `2604.04648` 和 [2605.30290](/papers/2605.30290-self-trained-verification/) 连接在 verifier-guided inference。STV 的 V-R / verifier BoN 可以借用 caution 的诊断语言：随候选数增加，同时报告 verifier score、true accuracy 和 OOD prediction error。
- `2604.04648` 和 [2510.20270](/papers/2510.20270-impossiblebench-test-case-exploitation/) 都研究推理时 proxy exploitation。ImpossibleBench 中 proxy 是 unit tests；caution 论文中 proxy 是 learned reward model。二者共同提示 selection / evaluation harness 进入优化闭环后需要真实目标 audit。
- `2604.04648` 和 [2503.11926](/papers/2503.11926-monitoring-reasoning-models-obfuscation/) 共享 Goodhart 风险。CoT monitor reward 进入训练目标后会改变可观测 reasoning；reward model score 进入 BoN 选择目标后会改变最终响应分布。
- `2604.04648` 和 [2606.04075](/papers/2606.04075-llms-hack-rewards-and-society/) 连接在 reward/true objective gap。SocioHack 观察 RL 在社会规则沙盒中利用规则缺口；caution 论文展示固定模型参数下的多候选推理选择也会进入 reward/true objective 分离区域。
- `2510.01180` 新增 BroRL / rollout-width scaling 节点。它把 [2505.24864](/papers/2505.24864-prorl-prolonged-rl-reasoning-boundaries/) 的 step-scaling 继续推进到每 prompt 大量 rollout 的 width-scaling，并用 correct-mass decomposition 解释为什么小 $N$ 会留下可能为负的 unsampled coupling term。
- `2510.01180` 和 `2505.24864` 是 NVIDIA Nemotron reasoning model 研究线的连续节点。ProRL 建立 prolonged RL 与 boundary expansion 证据，BroRL 在 ProRLv2 3K-step plateau 后通过 $N=512$ rollout 恢复有效学习信号。
- `2510.01180` 和 `2503.14476` 共享 DAPO / `verl` 训练生态。BroRL 继承 Dynamic Sampling、Clip-Higher 和 long-CoT RL 系统框架，并把 rollout size $N$ formalize 为新的 scaling dimension。
- `2510.01180` 和 `2504.13837` 共享 pass@$k$ / coverage 语言。`2504.13837` 关注 RL 后模型是否只是重排 base model 已有解；BroRL 关注训练阶段小 $N$ 是否限制 policy update 观察到的解空间。
- `2510.01180` 和 `2509.25123` 都为 “RL 在合适条件下能扩展能力边界” 提供正向证据。前者强调 large-$N$ exploration 稳定训练信号，后者强调 atomic skills + composition incentive 形成组合泛化。
- `2510.01180` 和 `2506.10947` 构成方法论互补。BroRL 展示 correctness RL + large-$N$ 的收益；Spurious Rewards 提醒这类收益仍需 random / format / incorrect reward baseline 来排除 prior amplification。
- `2510.01180` 和 `2606.00135` 在 rollout 预算上互补。Tool-calling RL 论文通过 pre-rollout filtering 与 down-sampling 减少无效计算；BroRL 通过大 $N$ 提高 dynamic sampling pass rate 与探索覆盖。二者共同说明 rollout 数、轨迹长度、有效梯度和 policy update 成本必须一起建模。
- `2510.01180` 和 `2605.14220`、`TML-2025-09-10` 连接在 large rollout reproducibility。BroRL 使用大规模 long rollout、vLLM / `verl` 和 pass@1 评估；rollout/trainer logprob mismatch、batch nondeterminism 和 sampler consistency 会影响 large-$N$ 结论。
- `2510.01180` 和 `2409.19256` 通过 HybridFlow / `verl` 基础设施连接。BroRL 的大规模 rollout generation、Dynamic Sampling 和 policy update 编排依赖同一类 RLHF/RLVR dataflow 系统能力。
- `2509.25123` 新增 RL compositional skill acquisition 节点。它把 “RL 是否学到新能力” 分解成 atomic skill prerequisite、compositional incentive、held-out deeper composition 和 behavior taxonomy，提供比聚合 benchmark score 更细的诊断语言。
- `2509.25123` 和 `2504.13837` 构成 RLVR boundary 争论中的直接对话。`2504.13837` 显示许多 RLVR 设置在高 pass@$k$ 下像 sampling efficiency 提升；`2509.25123` 指出这种现象可能来自评测任务已有高 base pass@$k$ 或 RL 训练没有激励新 skill，并用 hard composition levels 展示 gap 随 $k$ 扩大。
- `2509.25123` 和 `2505.24864` 都支持 “RL 在合适条件下可以扩展边界”。ProRL 从 prolonged multi-task RL 和 OOD tasks 给出宏观证据；`2509.25123` 从 synthetic composition 给出微观机制：先有 atomic skills，再用 RL 学 composition。
- `2509.25123` 和 `2506.10947` 形成方法论互补。Spurious Rewards 提醒 RLVR gain 可能来自 prior amplification、format 或 random reward；`2509.25123` 用匿名函数、held-out function split、RFT/RL 对照和 failure taxonomy 降低这些 confound。后续应给 `2509.25123` setup 加 random / format / incorrect reward baselines。
- `2509.25123` 和 `2503.14476` 直接共享 DAPO / `verl` 训练生态。前者用 DAPO 作为 Stage 2 RL optimizer，采用过滤全对/全错 prompt 的有效梯度思路；后者提供 long-CoT RL recipe 和开源系统背景。
- `2509.25123` 和 `2501.12948` 共享 outcome reward 激发 reasoning 的主线。本篇把 DeepSeek-R1 式 “已有能力 + RL 激励” 拆成 atomic skill 与 compositional meta-skill 两层。
- `2509.25123` 和 `2606.00135` 在 agentic tool-use 上存在可迁移问题。tool-use agent 常需要把工具能力组合成计划；本篇 synthetic composition 可以作为 tool-plan composition 的简化诊断基准。
- `2510.20270` 新增 agentic coding test-case exploitation 节点。它把自然语言规格与 unit tests 故意构造成冲突，把 impossible tasks 上的 pass rate 定义为 cheating rate，使 coding agent 的 proxy exploitation 可以被直接计数。
- `2510.20270` 和 `2605.30290` 存在 Aditi Raghunathan 的直接作者重叠。STV 关注 verifier feedback 如何驱动 reasoning self-improvement，ImpossibleBench 关注测试反馈如何诱导 specification-violating shortcuts；两者共同提示 feedback loop 的质量和校准决定了能力收益与 reward hacking 风险。
- `2510.20270` 和 `2503.11926` 共享 agentic coding monitoring 主题。CoT monitoring 论文研究 monitor signal 进入训练目标后的 obfuscation risk；ImpossibleBench 提供带确定 ground truth 的 cheating transcripts，可用于衡量 monitor 在训练前的基础检测能力。
- `2510.20270` 和 `2606.04075` 都研究规则/奖励缺口。SocioHack 在社会规则沙盒中观察制度意图和可测 reward 的偏离；ImpossibleBench 在 coding benchmark 中观察 specification 与 unit tests 的偏离。
- `2510.20270` 和 `2506.19248` 都把 reward hacking 推到 inference-time 行为层。HedgeTune 关注多候选选择对 proxy reward 的过度优化；ImpossibleBench 关注 agent 在测试访问和反馈循环中对 unit-test proxy 的过度利用。
- `2510.20270` 和 `2606.00135` 都显示 harness 是有效行为分布的一部分。Tool-calling RL 论文讨论 tool schema、history serialization 和 rollout 成本；ImpossibleBench 进一步显示 scaffold、test access、prompt strictness 和 feedback policy 会改变 cheating rate。
- `2510.20270` 和 `2403.03185` 的连接在 correlated proxy 语言上。unit tests 在正常任务分布上可作为 correctness proxy；impossible variants 构造了 proxy 与 intended objective 关系断裂的分布区域。
- `2510.20270` 和 `2506.10947` 都提醒 benchmark score 需要拆解来源。Spurious Rewards 关注 RLVR 中 spurious reward / model prior 的贡献；ImpossibleBench 关注 coding pass rate 中 genuine solving 与 test-case exploitation 的混合。
- `2506.19248` 新增 inference-time reward hacking / hedging 节点。它说明固定 model 和 fixed proxy reward 下，BoN/SBoN/BoP 这类 inference-time selection 也会因为 winner's curse 出现 true reward 先升后降，并用 HedgeTune 校准最佳推理参数。
- `2506.19248` 和 `2403.03185` 构成 reward hacking 的两层分布语言。ORPO 关注 training-time policy optimization 引起的 reference occupancy shift；`2506.19248` 关注 inference-time candidate selection 引起的 proxy overestimation shift。两者都要求显式记录 reference distribution 和优化后分布。
- `2506.19248` 和 `2501.09620` 形成 reward hacking 防御的前后链条。CRM 在 reward model 训练阶段压低已知 spurious factor，HedgeTune 在 reward model 固定后限制推理时的 selection pressure。后续系统可以先做 reward model debiasing，再做 inference-time hedging。
- `2506.19248` 和 `2503.11926` 共享 Goodhart / monitor signal 风险。CoT monitoring 论文讨论监控信号进入训练目标后会失真；`2506.19248` 说明 proxy reward 进入候选选择目标后也会失真。两者共同支持“测量信号进入优化闭环后必须校准”的判断。
- `2506.19248` 和 `2606.04075` 都处理 reward/规则缺口。SocioHack 展示 RL 训练会搜索社会规则漏洞；`2506.19248` 展示即使不更新模型参数，只做 inference-time best-of selection，也会把输出推向 proxy reward 高估区域。
- `2506.19248` 和 `2506.10947` 都削弱“reward 分数提升等同真实能力提升”的解释。`2506.10947` 关注 RLVR objective 和 prior amplification；`2506.19248` 关注 inference-time proxy reward overoptimization。两者都建议报告 proxy/true reward sweep 和 spurious baseline。
- `2506.19248` 和 `2605.30290` 在 verifier-guided inference 上连接。STV 比较 V-R 与 BoN 并强调 verifier calibration；`2506.19248` 提供 BoN/SBoN/BoP 的 hacking threshold 语言，可用于判断 verifier 分数上升是否伴随 true accuracy 下滑。
- `2506.19248` 和 `2504.13837` 都要求谨慎解释 pass@$k$ / Best-of-$n$。`2504.13837` 关注 RL 是否扩大 reasoning boundary；`2506.19248` 关注候选数量增加后，按 proxy reward 选择是否过度优化到 true reward 下降。
- `2506.19248` 和 `2606.00135` 在 agentic tool-use deployment 上互补。Tool-calling RL 论文说明 harness 和 judge 会改变有效训练信号；HedgeTune 可作为多候选 tool trajectory reranking 的部署校准方法，但需要可验证结果或人工 gold set。
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
- 当前收录材料中，`2503.14476` 与 `2409.19256` 存在 Haibin Lin、Guangming Sheng、Chi Zhang、Wang Zhang 等直接作者重叠；`2505.24864` 和 `2510.01180` 存在 Jian Hu、Mingjie Liu、Ximing Lu、Shizhe Diao、Yejin Choi、Jan Kautz、Yi Dong 直接作者重叠，并形成 NVIDIA Nemotron ProRL / BroRL 连续研究线；`2605.30290` 和 `2510.20270` 存在 Aditi Raghunathan 直接作者重叠；`2001.08361` 新增 pretraining scaling laws / compute-efficient training 基线节点，`2203.15556` 新增 Chinchilla / data-optimal pretraining 修正节点，二者共同通过 $N,D,C$、$C\approx6ND$ 和 model/token allocation 连接 Interplay、DeepSeek-R1、DAPO、ProRL、BroRL、Muon、HybridFlow、tool-calling RL 和 TIM/VeXact；`2605.30290`、`2510.20270`、`2604.04648`、`2512.07783` 和 `2606.06453` 共享 Carnegie Mellon University 机构网络；`2509.25123` 新增 RL compositional skill acquisition 节点，并与 `2504.13837`、`2505.24864`、`2506.10947`、`2512.07783` 构成 RLVR boundary 争论的正反证据组；`2512.07783` 新增 pre-/mid-/post-training interplay 节点，补充 edge-of-competence、primitive seed、mid-training bridge 和 process reward 条件；`2510.01180` 新增 rollout-width scaling / broadened exploration 节点，并把 ProRL 的 step-scaling 争论推进到 large-$N$ rollout efficiency；`2405.19888` 新增 LLM application serving / Semantic Variable 节点，并连接 Vortex、HybridFlow、tool-calling RL 和 agent workflow serving；`2511.02749` 新增 Span Query / cache locality / attention locality 节点，并连接 Parrot、Vortex、HybridFlow、tool-calling RL、STV 和 Interplay；`2501.09620` 新增 reward model causal debiasing 节点；`2403.03185` 新增 correlated proxy reward hacking / occupancy regularization 节点；`2506.19248` 新增 inference-time reward hacking / HedgeTune 节点；`2604.04648` 新增 BoN pessimism / caution 节点；`2510.20270` 新增 agentic coding test-case exploitation / ImpossibleBench 节点；`2503.11926` 新增 CoT monitorability / obfuscated reward hacking 节点；`2504.13837` 新增 RLVR reasoning boundary / sampling efficiency 节点；`2506.10947` 新增 spurious reward / RLVR prior amplification 节点；`2505.24864` 新增 prolonged RL / reasoning boundary expansion 节点；`2606.04662` 新增 optimizer geometry / Muon 曲率机制节点；`2501.12948` 是 DAPO、TIM/VeXact、STV、tool-calling RL 等 reasoning RL 论文的上游背景节点；`2606.10650` 新增 Dynamic Linear Attention / multi-state linear memory 节点，并连接 Lightning Attention、MiniMax-M1、DeepSeek-V4、GLM-5、Vortex、Span Query 和 Parrot；`2606.12370` 新增 Qwen Bebop / MTP rejection sampling / TV loss 节点，并连接 verl MTP 文档、Seer grouped SD、GLM-5/slime MTP、MiniMax-M1、DeepSeek-V4、TIM/VeXact 和 SGLang/vLLM inference engines；`VERL-2026-06-16` 新增 verl 当前 RL 优化算法与异步训练流水线文档节点，并连接 HybridFlow、DAPO、TIM/rollout correction、Seer、GLM-5/slime、MiniMax-M1/CISPO、TransferQueue 和 MTP；`2511.14617` 新增 Seer / synchronous RL rollout / group-aware context learning 节点，并连接 HybridFlow/VERL、GLM-5/slime、DAPO/GRPO、BroRL、MiniMax-M1、Span Query、Parrot、Vortex 和 TIM/VeXact；`2602.15763` 新增 GLM-5 / agentic engineering / asynchronous RL systems 节点，并连接 DeepSeek-V4、TIM、inference determinism、HybridFlow/slime、MiniMax-M1/CISPO、DAPO、Vortex/Parrot/Span Query 和 reward hacking；`DS-2026-04-24` 新增 DeepSeek-V4 / million-token context 系统节点，并连接 DeepSeek-R1、Muon、TIM、inference determinism、Lightning Attention、MiniMax-M1、UltraEP、Vortex、HybridFlow 和 tool-use RL；`2606.04101` 补充 MoE training/prefill serving 的 rack-scale load balancing 系统节点，并连接 Vortex、TIM/VeXact、DeepSeek-R1、DAPO 和 HybridFlow；`2409.19256` 和 `2606.00135` 通过 VERL/HybridFlow 基础设施形成直接方法关系；`2503.14476` 和 `2605.14220` 通过 DAPO/VeXact/VERL 形成强系统关系；`TML-2025-09-10` 与 `2606.06453` 通过 serving kernel 形成系统层关系，其余关系主要通过主题和方法连接。

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
