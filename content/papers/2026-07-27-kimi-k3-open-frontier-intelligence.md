# Kimi K3: Open Frontier Intelligence 技术报告笔记

First-Archived-At: 2026-07-27 23:57
Updated-At: 2026-07-28 11:47
Review-Status: pending

## Source

- Workflow version: v2.1
- Material type: technical-report
- Analysis modules: experiment, system, model-report, safety
- Canonical source: https://github.com/MoonshotAI/Kimi-K3
- Title: Kimi K3: Open Frontier Intelligence
- Authors: Kimi Team
- Responsible organization: Moonshot AI
- PDF: https://github.com/MoonshotAI/Kimi-K3/blob/521359a5cae5e79d02e5a2102c2cea9ce3b9b79a/k3_tech_report.pdf
- Model weights: https://huggingface.co/moonshotai/Kimi-K3
- Component code: [FlashKDA](https://github.com/MoonshotAI/FlashKDA), [MoonEP](https://github.com/MoonshotAI/MoonEP), [AgentENV](https://github.com/kvcache-ai/AgentENV)
- Product announcement: https://www.kimi.com/blog/kimi-k3
- Published / updated: product announced 2026-07-16; full model weights and technical report released 2026-07-27
- Current version read: PDF introduced in Git commit `521359a5cae5e79d02e5a2102c2cea9ce3b9b79a` on 2026-07-27
- Repository snapshot checked: `692ab492deeaf311b8c8d6f130096da69e94409b` on 2026-07-27
- MoonEP snapshot checked: `0f385f038fc33bec22e3bcf5a07a8a22693e754c` on 2026-07-28; functional implementation pinned to initial commit `51e64aa55310f6c6b464deabd80de2e8b5426d3f`
- Accessed: 2026-07-28
- Key figure decision: include
- Review status: page-type=not-found; match-confidence=high; observed-at=2026-07-27; venue-status=organization technical report and open-weight release
- Subjects: mixture-of-experts, hybrid linear attention, long context, native multimodality, agentic reinforcement learning, distributed systems

## 作者与关系

- Kimi Team: Moonshot AI.

报告采用团队署名，附录 A 按字母顺序列出贡献者，没有给出个人角色、作者顺序含义或通讯作者。附录中的 [Yifan Bai](/authors/yifan-bai-kimi/)、[Yulun Du](/authors/yulun-du/)、[Xinran Xu](/authors/xinran-xu/)、[Weiran He](/authors/weiran-he/) 和 [Weixiao Huang](/authors/weixiao-huang/) 已在本档案的 Kimi 系列论文中出现；团队级信息不足以进一步分配 K3 各模块的个人贡献。

MoonEP 仓库的引用信息将该组件归于 Yutian Chen、Cong Li、Yucheng Wang 和 Ming Wei。这个归因只覆盖公开的专家并行通信库，不能据此分配 K3 报告中完整专家并行方案或训练系统的个人贡献。

K3 延续 Moonshot AI 的 Kimi k1.5、Kimi K2 与 Kimi K2.5 研究线，并把 Kimi Linear、Attention Residuals、Muon、Agent Swarm 及长程智能体系统中的若干机制整合到同一个开放权重模型。

## 一句话结论

Kimi K3 的首要贡献是把三层 KDA 与一层全局注意力交错、跨块 Attention Residuals 和每个 token 激活 16 个路由专家的 Stable LatentMoE 组合成 2.78 万亿总参数、1042 亿激活参数、百万 token 上下文的原生多模态开放权重模型，并以九个领域—推理强度专家的强化学习和多教师在线策略蒸馏完成能力整合；报告的缩放律拟合将架构、数据与训练配方的合并收益估计为相对 Kimi K2 约 2.5 倍，广泛评测显示它整体接近当时最强闭源系统且仍落后于 Claude Fable 5 和 GPT-5.6 Sol，但缺少预训练 token 总量、算力成本、组件级消融和统一评测脚手架，因此无法把总体收益归因到单个机制。

## 论文脉络

### 1. 研究问题、背景和价值

K3 试图同时扩大五个彼此制约的维度：

1. **模型容量**：总参数从 K2 的 1.04 万亿扩大到 2.78 万亿，激活参数从 326 亿扩大到 1042 亿。
2. **上下文长度**：训练上下文从 128K 扩展到 1M，长程智能体轨迹可以跨越数百至数千次工具调用。
3. **模态范围**：图像和视频从训练开始就进入统一的下一 token 预测目标。
4. **后训练范围**：强化学习覆盖通用任务、通用智能体和编码智能体，并区分 low、high、max 三档推理强度。
5. **可部署性**：2.8 万亿参数、极稀疏专家、混合注意力和百万 token 状态必须在训练、强化学习和在线服务中持续运行。

这些维度存在直接耦合。长上下文增加注意力与缓存成本，更多专家加重负载不均和通信压力，视觉 token 增加序列长度与流水线波动，长程强化学习还要同时保存模型的缓存状态和外部环境状态。报告因此把模型结构、训练流程和系统实现放在同一条设计链上。

### 2. 已有解决方案与剩余缺口

- 全局 softmax 注意力能直接访问任意历史 token，百万长度下的计算和 KV cache 成本很高；线性注意力压缩历史状态，检索精度和全局内容交互能力通常较弱。
- 标准残差连接把此前各层的信息逐次累加到单个隐藏状态中，网络加深后，后层只能接收已经混合过的表示。
- 极稀疏 MoE 能增加总参数而控制单 token 计算量，896 个路由专家会放大专家负载不均、激活异常值、通信形状变化和专家训练不足。
- 预训练视觉编码器再接入语言模型可以复用视觉能力，跨目标联合优化可能产生梯度尖峰，视觉特征也受原对比学习目标约束。
- 单一领域、单一推理预算的强化学习策略容易形成专长分裂；直接混合所有任务训练会引入领域比例、轨迹长度与奖励尺度之间的竞争。
- 训练侧的均衡路由无法自动保证设备侧负载均衡，智能体轨迹的模型状态与沙箱状态也会跨训练迭代存续。

K3 的目标是让这些局部方案形成可共同缩放的完整系统，并用一个统一权重承载最终能力。

### 3. 作者可能的思考路径

以下为基于报告结构的本地重建。

第一步是把“扩展前沿模型”拆成序列、深度和宽度三条信息流。序列维度需要低成本保留长历史并周期性恢复全局交互；深度维度需要让后层选择此前阶段的表示；宽度维度需要增加专家数量并保持训练稳定。KDA、Attention Residuals 和 Stable LatentMoE 分别承担这三个位置。

第二步是检查每个结构改动能否映射到硬件执行。KDA 的衰减范围要允许 Tensor Core 执行全部分块，专家路由要同时满足统计均衡和设备均衡，视觉计算要进入流水线空隙，百万 token 状态要能跨设备、跨训练迭代和跨请求复用。FlashKDA、KDA 上下文并行、MoonEP、统一激活管理器和 KDA 感知前缀缓存由此进入方案。

第三步是把模型容量转换为统一能力。报告先用监督微调建立工具与长程任务的冷启动策略，再训练九个领域—推理强度专家，最后用多教师在线策略蒸馏（Multi-Teacher On-Policy Distillation，MOPD）整合为单一模型。量化感知训练和 EAGLE-3 草稿模型继续把部署约束纳入后训练。

### 4. 核心假设或切入点

1. 三类信息流可以分工：KDA 负责高效的递归长程混合，周期性 Gated MLA 负责无约束的全局内容交互，Attention Residuals 负责跨深度选择。
2. 极稀疏 MoE 的主要不稳定源可以分别处理：RMSNorm 控制路由分支尺度，SiTU-GLU 限制乘性激活上界，Quantile Balancing 控制专家负载。
3. 无显式位置编码（NoPE）与 KDA 的递归衰减足以承载位置信息，并允许上下文扩展时省去 RoPE 频率调整。
4. 九个同源强化学习专家与学生模型距离足够近，使逐 token 教师信号可以稳定整合多领域能力。
5. 动态冗余专家、固定大小的递归状态和可恢复微虚拟机能够把算法中的稀疏性与长程状态转换为可预测的系统执行。

### 5. 贡献全景

首要贡献是一个沿序列、深度和宽度联合缩放的模型—系统方案。它由三项结构机制构成：

- 序列方向：每个块使用三层 Kimi Delta Attention（KDA）和一层 Gated MLA，骨干末尾再加入一层 Gated MLA。
- 深度方向：Block Attention Residuals 让每层从嵌入和此前块输出中选择需要的表示。
- 宽度方向：Stable LatentMoE 把 896 个路由专家压到 3584 维潜空间，每个 token 选择 16 个路由专家，并保留两个全宽共享专家。

辅助贡献负责让首要贡献可训练、可后训练和可部署：

- MoonViT-V2 从头训练原生视觉路径，Per-Head Muon 调整大矩阵正交化的粒度。
- 8K、64K、256K、1M 的渐进式上下文课程与分散依赖的合成长序列提供长程训练信号。
- SFT、九个强化学习专家、MOPD、量化感知训练和 EAGLE-3 形成后训练路径。
- FlashKDA、KDA 上下文并行、MoonEP、长程强化学习基础设施、AgentENV 和混合缓存服务系统承载实际执行。

![Figure 2: Kimi K3 architecture across sequence, depth, width, and vision](/images/papers/2026-07-27-kimi-k3-open-frontier-intelligence/fig-2-kimi-k3-architecture.png)

Figure 2：Kimi K3 架构总览。图中 token mixing、layer mixing、channel mixing 和原生视觉路径分别对应混合 KDA–MLA、Attention Residuals、Stable LatentMoE 和 MoonViT-V2。Image Source: [Kimi K3 technical report, Figure 2, p. 3](https://github.com/MoonshotAI/Kimi-K3/blob/521359a5cae5e79d02e5a2102c2cea9ce3b9b79a/k3_tech_report.pdf).

### 6. 序列方向：KDA 保存压缩状态，Gated MLA 周期性恢复全局访问

单个 KDA 头接收当前 token 表示，产生查询、键、值、写入强度和逐通道保留因子。它先按通道衰减旧状态，再用 delta rule 写入当前键值：

$$
S_t =
\left(I-\beta_t k_t k_t^\top\right)
\operatorname{Diag}(\alpha_t)S_{t-1}
+\beta_t k_t v_t^\top,
\qquad
\tilde{o}_t=S_t^\top q_t
$$

$S_t$ 是固定大小的递归状态，$\alpha_t$ 是各键通道的保留因子，$\beta_t$ 控制当前写入强度。历史长度增加时，状态大小保持固定。K3 把序列划分为 chunk，chunk 内并行计算，chunk 之间传递状态。

Kimi Linear 的累积衰减倒数可能在有限精度中溢出，导致分块矩阵的对角部分需要逐位置计算。K3 将单步对数衰减下界固定为 $-5$。16-token tile 的累计对数衰减因此位于 $(-80,0)$，倒数仍在 BF16 动态范围内，对角与非对角 tile 都可使用 Tensor Core 的稠密矩阵乘法。这个改动同时连接了数学参数范围和内核执行路径。

每三层 KDA 后放置一层 Gated MLA。KDA 的固定状态负责低成本累积位置与近因信息，MLA 以压缩 KV 表示执行全局内容匹配，输入依赖的输出门控制各通道读出。所有 MLA 层采用 NoPE；位置线索来自 KDA 的递归顺序和衰减。骨干末尾额外的 MLA 保证最终表示经过一次全局交互。

这一路径的输入是 token 序列，阶段间传递 KDA 状态、MLA 压缩 KV 和隐藏表示，输出交给相邻的 MoE 层。成立边界包括 KDA 固定状态能否保留任务所需细节、周期性 MLA 的密度是否足够，以及百万长度下模型质量是否随距离稳定；报告提供了结构与系统可行性，缺少按上下文长度变化的质量曲线。

### 7. 深度方向：Block Attention Residuals 让层选择此前块表示

标准残差把所有历史层逐次累加成当前状态。Full Attention Residuals 给每层一个可学习伪查询，对嵌入和所有此前层输出计算 softmax 权重；直接保存所有层输出会带来较大的内存和通信成本。

K3 将 93 层按 12 层组成块，形成八个完整块和一个包含剩余层的末块。块内继续使用普通残差，块边界保存一个输出；后续模块只对嵌入和此前块输出做注意力选择。这样，跨深度可选表示的数量从层数降到块数，保存和通信量约为 $O(Nd)$，其中 $N$ 是块数、$d$ 是隐藏维度。

方法顺序为：当前层读取块级候选表示，伪查询生成选择权重，加权结果进入当前注意力或 MoE 模块，模块输出继续在块内累积，块结束时再产生新的候选表示。它给后层提供了跨深度访问路径，粒度受 12 层块大小限制；报告没有单独给出 K3 规模下 Full、Block 与普通残差的消融。

### 8. 宽度方向：Stable LatentMoE 依次处理容量、数值稳定和负载均衡

K3 的路由分支先把 7168 维隐藏表示下投影到 3584 维潜空间，再送入从 896 个专家中选出的 16 个专家；专家结果聚合后经过 RMSNorm 和上投影回到模型宽度。两个共享专家直接处理全宽输入。潜空间降低单个路由专家的参数与计算成本，使模型能增加专家数量。

极稀疏路由带来两个直接风险。聚合尺度随专家和权重变化，K3 在上投影前加入 RMSNorm；SwiGLU 的两个乘性分支都可能产生大值，K3 使用 SiTU-GLU，分别用参数 4 和 25 的平滑上限约束门分支和上投影分支，单坐标乘积绝对值上界为 100。

Quantile Balancing（QB）处理第三个风险。路由器为每个专家增加只参与 Top-k 选择的偏置，实际混合权重仍由原始分数归一化得到，因此偏置调整专家是否入选，不直接改变已选专家的混合比例。一个 batch 有 $m$ 个 token、$n$ 个专家、每个 token 选择 $k$ 个专家时，每个专家的目标负载为 $q=mk/n$。QB 根据每个 token 的第 $k+1$ 个分数形成入选阈值，再取全局 margin 的相应分位数更新每个专家偏置；新偏置从下一步开始生效。

报告 Figure 5 给出一个可逐项对应的例子：8 个 token、4 个专家、每个 token 选 1 个专家，对应目标负载为每个专家 2 个 token。原始 Top-1 选择产生 $(4,3,1,0)$；QB 对每个专家查看 8 个“原始分数减去当前 token 入选阈值”的 margin，把偏置调整到仅有 2 个 margin 越过阈值，下一批的示例选择成为 $(2,2,2,2)$。这里的 8 个 token 对应 $m$，4 个专家对应 $n$，每个 token 的单条边对应 $k=1$，每列保留的两个 margin 对应 $q=2$。实际训练用全局直方图和一次 all-reduce 近似分位数，避免收集数百万个 margin；推理时冻结最终偏置。

QB 直接追踪目标负载，减少固定步长偏置更新的慢适应和振荡。它保证统计路由更均衡，设备级严格均衡仍由 MoonEP 完成。

### 9. 原生视觉与 Per-Head Muon

MoonViT-V2 是 27 层、约 4 亿参数的视觉 Transformer，从训练开始就与文本共享下一 token 预测目标。图像和视频共享参数，视频使用帧内空间注意力、帧间时间注意力和时间池化；2×2 pixel shuffle 把视觉 token 数减少四倍，最高支持 3584×3584 输入。

报告选择从头训练视觉编码器，原因是接入 SigLIP 初始化的 MoonViT-3D 在联合训练中出现更高梯度范数和更多尖峰。Figure 6 支持优化更稳定，正文称两种初始化在视觉评测上相当，但没有给出对应分数表。

Per-Head Muon 把查询、键和值投影的动量正交化按注意力头分别执行。其目标是让每个头独立获得 Muon 的尺度与方向控制，减少整块矩阵正交化时不同头相互影响。报告将它与 K2 的权重裁剪、QB、余弦学习率、1% warmup 和 0.1 weight decay 共同用于预训练。

### 10. 预训练与百万 token 扩展

数据包括网页文本、代码、数学、知识和视觉材料。报告描述了规则与分类器过滤、精确和模糊去重、知识与数学内容改写、OCR、交错图文、视频和视觉编程数据；没有披露总 token 数和各类数据比例。

上下文课程按实际执行顺序分四阶段：

1. 预训练先使用 8K。
2. 预训练后段扩展到 64K。
3. cooldown 阶段进入 256K。
4. cooldown 末段扩展到 1M。

长文档和视频先去重、过滤与结构校验，再上采样以免被短序列淹没。合成数据把子任务和所需信息分散在整个 1M 序列中，使正确答案依赖远距离内容。NoPE 让扩展过程省去位置编码重标定，KDA 上下文并行负责将序列切到多设备。

这条流程证明了百万长度的训练和运行路径，报告没有单独呈现 1M 检索、推理质量随距离变化的系统实验，因此“支持 1M”主要表示模型配置、训练课程和服务能力。

### 11. 后训练：SFT、九个强化学习专家、MOPD

后训练解决两个相互关联的问题：先把预训练模型转成能够稳定使用工具、执行长程任务的策略，再把不同领域和计算预算形成的专长整合回一个可控模型。报告给出的执行顺序为：

```text
预训练 K3
  → SFT 冷启动
  → 三个领域 × 三档推理强度的强化学习
  → 九个专家策略
  → 多教师在线策略蒸馏
  → 统一 K3
```

这里的九个专家策略（expert models）是按领域和推理强度训练出的九组策略检查点；Stable LatentMoE 中的 896 个路由专家属于每层内部的前馈网络组件，两类“专家”位于不同系统层级。

#### 11.1 SFT 建立工具调用和长程执行的冷启动策略

此前 Kimi 系列的领域模型先合成复杂智能体轨迹，轨迹经过多阶段验证和人工参与标注，再统一序列化为 XTML（eXtensible Token Markup Language）对话格式。XTML 将推理过程、用户可见回答、工具调用和工具结果放入一致的消息结构，使后续强化学习从已经具备基本推理、工具使用和长程执行能力的策略开始。

这一阶段向强化学习传递三个对象：可继续优化的冷启动策略、按领域组织的指令与轨迹数据，以及用于估计单题初始 token 预算的行为基线。报告称数据集达到大规模并显著扩大复杂智能体任务覆盖，但没有披露样本数、合成与人工数据比例、验证通过率或各领域占比。

#### 11.2 三个领域与三档推理强度形成九个专家策略

强化学习没有按单个基准分别训练模型，而是把任务归入三个覆盖面较宽的领域：

| 领域 | 训练内容 |
| --- | --- |
| 通用任务 | 通用体验、视觉、推理、忠实性、搜索和知识工作 |
| 通用智能体 | 长程助手、深度研究和段落级写作 |
| 编码智能体 | 软件工程、编程体验、GPU kernel 和 Web 开发 |

每个领域分别训练 `low`、`high` 和 `max` 三档推理强度，共得到九个专家策略。Figure 8 显示，随着强化学习 FLOPs 增加，多类内部和公开评测的分数与平均工具调用步数整体上升；图中没有给出可复算的横轴数值、误差线和逐领域训练成本，因此它支持“增加当前配置的 RL 计算量伴随能力和执行长度共同增长”，仍不足以识别各任务族的独立收益。

推理强度通过逐题预算约束形成。冷启动模型先为问题 $x$ 估计初始 token 预算 $b_0(x)$；当轨迹 $y$ 的实际消耗超过倍率阈值时，任务奖励被覆盖为 $-1$：

$$
T(y)>\tau b_0(x)
\quad\Longrightarrow\quad
r_{\mathrm{task}}(y)=-1.
$$

通用任务的 $T(y)$ 计算思考 token；智能体任务计算累计输出 token，其中包括推理轨迹和工具调用参数。训练先用较大的 $\tau$ 得到 `max` 策略，同时设置绝对上限约束过量推理，再逐阶段降低 $\tau$ 得到 `high` 和 `low` 策略。倍率按领域由人工参与配置。三个强度分别对应不同的能力—token 预算工作点，并为最终模型的 `reasoning_effort` 控制提供训练条件。九个专家生成的轨迹还会共同收集，用于后续监督数据和多教师在线策略蒸馏；报告没有给出两类训练信号的混合比例。

#### 11.3 部分采样轨迹（partial rollout）让长程轨迹跨训练迭代续接

每轮强化学习为 $N$ 个问题各采样 $K$ 个回答，同时维护 $N K$ 条活跃轨迹。若等待所有长程任务结束，少量包含数百至数千次工具调用的轨迹会决定整轮耗时。K3 在完成轨迹数达到 $\lambda N K$ 时结束当前生成阶段，暂停其余轨迹并开始策略更新；暂停轨迹进入队列，在下一轮优先恢复。同一问题的 $K$ 条回答全部完成后，这组数据立即进入策略优化。

一条轨迹因此可能跨越多个策略版本。报告称策略优化器通过逐 token 正则化把更新限制在局部范围，从而处理高度陈旧的离策略数据，但没有公开正则公式、$\lambda$、轨迹陈旧度分布和对应稳定性消融。

续接还要求两类状态位于同一个逻辑位置：模型侧保存 KDA 递归状态和 MLA KV cache，环境侧保存文件系统、进程、内存和工具状态。外部 KV cache 与 AgentENV 微虚拟机分别负责这两类状态；只恢复其中一类会让模型上下文与外部世界状态失配。这里描述的是算法所需的状态语义，具体缓存与沙箱实现见 §13。

#### 11.4 奖励与训练环境覆盖可验证任务和开放式产物

K3 使用统一白盒强化学习环境，把工具接口、系统提示、上下文管理、技能、记忆和子智能体视为可组合模块。训练时按任务组动态生成不同配置，覆盖 Kimi Code、Claude Code、Codex、OpenClaw 和 Hermes 等脚手架形态，目标是减少策略对单一工具接口结构、提示词或上下文管理方式的依赖。

任务材料由分层知识图谱辅助生成：智能体从粗粒度种子概念开始搜索并递归扩展细粒度节点，再采样相关节点、检索公开论文、博客和代码仓库，合成知识、编码和视觉任务。训练信号按任务可验证性分两类：

- 可验证任务直接读取答案、程序测试、环境终态或执行性能。搜索和专业工作流检查答案与产物；视觉任务在隔离的 Python 环境中处理图像并接收执行结果；kernel 任务同时检查相对 PyTorch 参考实现的数值正确性、相对专家实现与硬件上限的性能，并检测缓存输入、降低精度等奖励投机；自主执行任务由独立验证器检查最终环境状态；Web 开发任务结合构建、功能、结构、像素检查和模型评审。
- 难以直接验证的通用任务使用智能体生成式奖励模型（Agentic Generative Reward Model，Agentic GRM）。评审模型依次读取产物、生成评分量规、按量规评价候选并把分项结果写入评分记录区（scorepad），最后通过候选间的二元比较形成分组奖励。

开放式产物容易通过增加篇幅获得更高评审分。K3 复用预算约束：冷启动模型先估计初始长度 $\ell_0$，当候选长度超过 $\sigma\ell_0$ 时，它在二元比较中直接判负。该规则约束输出长度，奖励模型本身的校准误差、量规偏差和领域外泛化仍需单独评估。

#### 11.5 MOPD 把九个专家策略整合为统一模型

多教师在线策略蒸馏（Multi-Teacher On-Policy Distillation，MOPD）先采样领域 $d$ 和推理强度 $e\in\{\mathrm{low},\mathrm{high},\mathrm{max}\}$，再让学生 $\pi_\theta$ 按自己的当前策略生成轨迹。与 $(d,e)$ 对应的教师 $\pi_{\mathrm{teacher}}^{(d,e)}$ 在学生实际到达的同一前缀上，为当前 token 给出逐 token 奖励：

$$
r_{\mathrm{opd}}^d(y_t\mid e,x,y_{<t})
=
\operatorname{clip}
\left(
\operatorname{sg}
\left[
\log
\frac{
\pi_{\mathrm{teacher}}^{(d,e)}(y_t\mid x,y_{<t})
}{
\pi_\theta(y_t\mid e,x,y_{<t})
}
\right],
-R_{\max},
R_{\max}
\right).
$$

教师相对更认可的学生 token 获得正信号，教师概率较低的 token 获得负信号；停止梯度（stop-gradient）让教师分数只承担训练信号，截断阈值 $R_{\max}$ 控制极端对数概率比。奖励定义在学生自己的状态分布上，因此能够覆盖统一模型实际生成时到达的前缀，并以密集 token 信号接入现有强化学习和 partial rollout 基础设施。

团队还测试了更细粒度的 Top-$k$ 蒸馏目标，在当前设置中没有观察到收敛速度或最终性能的明确优势。报告完整给出了 MOPD 奖励形式，尚未披露教师—学生距离、各教师采样比例、监督数据与在线蒸馏的权重，以及相对参数平均、离线蒸馏或直接混合强化学习的统一消融。以上后训练流程的直接证据位于技术报告 §4.1–§4.2、Figure 8 和 Equation 15，pp. 12–16。

### 12. 部署约束进入后训练

部署约束沿两条路径进入最终权重。第一条是贯穿 SFT 和强化学习的量化感知训练：占参数主体的路由专家权重使用 MXFP4，输入激活使用 MXFP8；注意力投影、潜 MoE 投影、共享专家和路由器保持更高精度。rollout 与训练采用相同量化方案，使策略更新直接观察部署精度下的行为。

第二条路径把预训练的多 token 预测（Multi-Token Prediction，MTP）层微调为 EAGLE-3 草稿模型。目标模型保持冻结，只更新草稿层和特征融合投影。草稿输入连接第 1、第 4 和最后一个 AttnRes 块的低、中、高层特征，拼接后投影回隐藏维度；融合矩阵初始化为只读取高层特征，使初始输入与 MTP 预训练阶段一致，再逐步学习使用低层和中层信息。

训练时把草稿模型展开七步。第一步读取目标侧特征，后续步骤使用此前草稿输出，复现推理时的递归草拟过程。无损投机采样中，目标分布 $p$ 与草稿分布 $q$ 的单步接受率为 $\sum_{x\in V}\min(p(x),q(x))$；K3 直接最小化其负对数：

$$
\mathcal{L}_{\mathrm{LK}}
=
-\log
\sum_{x\in V}
\min\bigl(p(x),q(x)\bigr).
$$

这项目标直接对应草稿 token 被目标模型接受的概率。训练在温度 1 下计算 $p$ 和 $q$，没有加入真实 token 的辅助交叉熵；草稿层继续沿用 MXFP4/MXFP8 量化感知配置。该阶段优化服务效率，目标模型的任务能力保持冻结。直接证据位于技术报告 §4.1.4、Equations 15–16，p. 14。

### 13. 系统执行路径

系统实现沿模型前向顺序解决四类问题：

1. **KDA 内核与上下文并行**：FlashKDA 重叠 chunk 内并行计算和跨 chunk 状态传播；设备内上下文并行切分序列；跨设备 KDA Context Parallelism 对每段计算固定大小的状态转移和局部状态，通过一次 all-gather 后按顺序组合。
2. **3T 级预训练**：Pipeline Parallelism、Virtual Pipeline、Expert Parallelism、ZeRO-1、Pipeline ZeRO-2 和 Context Parallelism共同切分模型、状态和序列。统一激活管理器配合 FP8、卸载与重计算，视觉前后向尽量放入流水线空隙。
3. **严格均衡专家并行**：MoonEP 保留路由器选出的逻辑专家和混合权重，根据当前层、当前微批次的实际 Top-k 结果重新安排物理执行位置。在线规划器为过载专家生成临时副本并迁移相应 token，使每个专家并行 rank 接收相同数量的真实 token；固定接收量继续转化为静态通信与计算形状。
4. **百万 token 强化学习与服务**：训练器和 rollout 共置于数百张 GPU 内，闲置前缀写回 CPU DRAM 的外部 KV cache 池；AgentENV 用 Firecracker 微虚拟机保存、暂停、恢复和派生外部环境状态；在线服务把 KDA 状态与 MLA KV 放进统一分页池，并以缓存亲和与预算控制调度请求。

#### 13.1 MoonEP 把路由负载转换为严格均衡的物理执行计划

MoonEP 接收每个 rank 上的隐藏状态、Top-k 专家编号、路由权重和本地 `tokens_per_expert` 统计。设每个源 rank 输入 $S$ 个 token，每个 token 选择 $K$ 个专家，总专家数为 $E$，专家并行 rank 数为 $R$。规划器首先确定每个目的 rank 应接收的真实路由条目数，以及各归属专家组偏离该容量的程度：

$$
C=SK,
\qquad
b_h=L_h-C.
$$

$C$ 是严格均衡时每个 rank 的真实 token—专家条目容量，$L_h$ 是归属专家组 $h$ 当前承载的全局条目数，$b_h>0$ 表示该组过载，$b_h<0$ 表示对应 rank 仍有接收余量。这里的平衡对象是专家计算条目；一个 token 选择 $K$ 个专家时会产生 $K$ 条记录，因此容量使用 $SK$。

官方参考实现依次完成两级分配。第一级反复选择当前最过载的归属专家组和余量最大的目的 rank，把足以填满该目的 rank 的配额从前者移出；一个欠载 rank 在一次分配后达到容量 $C$，之后不再接收其它归属组。第二级在每个过载归属组内部，反复配对“剩余 token 最多的专家”和“剩余接收配额最大的目的 rank”，分配两者的较小值。这个过程保持每个逻辑专家的 token 总数不变，只改变条目在哪个 rank 执行。由于一个目的 rank 最多接收一个远端归属组，而每个归属组包含 $E/R$ 个专家，它最多需要访问 $E/R$ 种远端专家；这对应报告中每 rank 预留不超过 $E/R$ 个冗余专家槽即可保证可行方案存在的上界。

规划结果继续进入权重与 token 的物理布局。每层的 gate、up 和 down 投影分别暴露一个形状为 $[E+B,H,H']$ 的连续虚拟内存映射（Virtual Memory Management，VMM）区域：前 $E$ 行映射所有 rank 的归属专家参数，后 $B$ 行是当前 rank 的预取槽。训练使用 $B=E/R$，规划器返回 `experts_to_copy`、直接通信目的位置和 `cu_seqlens`；后者说明每个专家或预取槽在分组 GEMM 输入中的结束位置。预取槽的物理内存来自跨层复用的进程级缓冲池，因此额外常驻空间按 $B$ 个专家投影计算，无需为每层分别分配。

![Figure 3: MoonEP symmetric expert-weight mapping and reusable prefetch slots](/images/papers/2026-07-27-kimi-k3-open-frontier-intelligence/fig-3-moonep-weight-buffer.png)

Figure 3：MoonEP 在每个 rank 上建立布局相同的连续专家权重视图。黄色区域是物理归属于当前 rank 的专家，蓝色区域通过对称内存映射访问其它 rank 的归属专家，粉色区域是跨层复用的本地预取槽。Image Source: [MoonEP repository, `weight_buffer.png`, commit `51e64aa`](https://github.com/MoonshotAI/MoonEP/blob/51e64aa55310f6c6b464deabd80de2e8b5426d3f/figure/weight_buffer.png).

前向阶段按照以下接口执行：

1. `dispatch` 汇总各 rank 的专家负载，运行 GPU 在线规划器，并把隐藏状态与路由权重直接写入远端通信缓冲区中的最终专家分组位置。
2. `prefetch_weight` 将计划使用的远端专家 gate、up 和 down 权重复制到本地预取槽；`cu_seqlens` 让分组 GEMM 只读取当前激活的专家行。
3. 专家计算在每个 rank 上处理恰好 $SK$ 个真实条目，再加每个虚拟内存分组所需的对齐填充。固定的真实条目数与有界填充共同形成静态 `NvS` 输入形状。
4. `combine` 按保存的通信计划把专家输出和路由权重还原到源 token 顺序。

反向阶段复用同一份计划，跳过再次规划。临时副本产生的 FP32 权重梯度写入独立的归并缓冲区，不进入训练框架对正式参数执行的梯度同步；`reduce_grad` 把这些梯度累加回逻辑专家的归属 rank，随后清空已消费的临时槽。最终只有归属专家持有优化器状态并执行参数更新，因此动态副本改变物理执行路径，同时保持原有 MoE 参数更新语义。

训练配置需要 $B=E/R$，使分组 GEMM 使用的专家权重均能预取到本地。只做前向的推理可以设置 $B<E/R$；超出预取槽的远端专家通过对称内存映射直接读取，结果保持一致，访问成本会上升。`zero_copy` 模式返回通信缓冲区视图，这些视图会被下一次 `dispatch` 或 `combine` 覆盖，跨通信调用保存激活时需要关闭该模式。以上执行链的直接证据来自技术报告 §5.2.1 与 Appendix E，以及固定到功能提交的 [MoonEP README](https://github.com/MoonshotAI/MoonEP/tree/51e64aa55310f6c6b464deabd80de2e8b5426d3f#readme)、[规划参考实现](https://github.com/MoonshotAI/MoonEP/blob/51e64aa55310f6c6b464deabd80de2e8b5426d3f/tests/planning_reference.py) 和 [端到端接口测试](https://github.com/MoonshotAI/MoonEP/blob/51e64aa55310f6c6b464deabd80de2e8b5426d3f/tests/test_e2e.py)。

模型状态和环境状态在这里分别处理：KDA/MLA 缓存保存模型已经读取的上下文，AgentENV checkpoint 保存文件系统、进程和内存等外部世界状态。partial rollout 要在下一迭代继续一条轨迹，两类状态都必须恢复到一致位置。

### 14. 结论链条

1. KDA、Gated MLA、Block Attention Residuals 与 Stable LatentMoE 分别扩展序列、深度和宽度的信息流。
2. 衰减下界、RMSNorm、SiTU-GLU、QB、Per-Head Muon 和原生视觉训练减少数值不稳定与路由失衡。
3. FlashKDA、KDA 上下文并行、MoonEP、激活管理和 AgentENV 将结构需求映射到训练、强化学习和服务路径。
4. 渐进式长上下文预训练提供 1M 配置，九个强化学习专家形成领域与推理强度专长，MOPD 将其整合为统一模型。
5. 缩放律拟合、广泛基准和系统运行数据共同支持 K3 已形成可训练、可服务的 2.8 万亿参数开放权重系统。
6. 组件级贡献、训练成本、百万长度质量和统一脚手架下的外部比较仍缺直接证据，最终结论限于报告所披露的复合系统及其评测设置。

## 关键实验结果

### 结果 1：缩放律拟合给出相对 K2 约 2.5 倍的总体缩放效率

- 设置：团队分别为 Kimi K2 与 Kimi K3 配置拟合验证损失随训练 FLOPs 变化的缩放律，并在独立缩放律实验中调节架构超参数。
- Baseline：Kimi K2 的 MLA MoE 架构；K3 同时改变层数、总参数、激活参数、专家数、激活专家数、注意力类型、上下文、视觉训练、数据和优化配方。
- 指标：达到同等拟合损失所需的训练 FLOPs。
- 结果：Figure 7 标注 K3 相对 K2 约有 2.5 倍缩放效率；Table 1 给出 K2 与 K3 的结构差异。
- 对照是否可比：两条曲线使用相同损失—FLOPs 口径，报告没有披露拟合方程、原始数据点、误差范围、数据配方对齐方式或各组件消融，比较只能支持复合方案的总体差异。
- 证据定位：Section 3.2, Figure 7 and Table 1, pp. 10–11 of the technical report.
- 支持的最窄结论：在团队未公开原始拟合数据的内部缩放律设置中，K3 架构、数据和训练配方的组合达到同等拟合损失约需 K2 的四成训练计算量。
- 解读：2.5 倍是整体系统的缩放律估计，不能分配给 KDA、Attention Residuals、Stable LatentMoE 或数据改进中的任一单项。

### 结果 2：从头训练的 MoonViT-V2 展现更稳定的联合优化轨迹

- 设置：比较从头训练、使用下一 token 预测目标的 MoonViT-V2 与 SigLIP 初始化的 MoonViT-3D 在预训练中的视觉塔梯度范数。
- Baseline：Kimi K2.5 使用的 SigLIP 初始化 MoonViT-3D。
- 指标：训练步中的 vision-tower gradient norm 及尖峰。
- 结果：MoonViT-V2 的梯度范数更低、尖峰更少；正文称其视觉评测与初始化基线相当。
- 对照是否可比：梯度曲线属于同一预训练消融，报告未给出两种设置的完整超参数、随机种子、最终视觉分数表和训练成本。
- 证据定位：Section 2.4, Figure 6, pp. 9–10 of the technical report.
- 支持的最窄结论：在报告展示的内部联合预训练消融中，从头训练 MoonViT-V2 的视觉塔梯度轨迹较 SigLIP 初始化方案稳定。
- 解读：这支持“从头训练可改善当前配置的优化稳定性”，对最终能力相当的判断仍依赖未展示的内部评测。

### 结果 3：广泛基准显示 K3 整体位于当时开放权重模型前列

- 设置：K3 多数结果使用 max 推理强度、temperature 1.0；单轮任务使用 top-p 0.95，智能体任务使用 top-p 1.0。编码任务分别使用 Kimi Code、Claude Code 或 Codex 等模型特定脚手架。
- Baseline：Claude Fable 5、GPT-5.6 Sol、Claude Opus 4.8、GPT-5.5、GLM-5.2 等报告内模型。
- 指标：推理、知识、编码、智能体和视觉共数十个基准的 pass rate、准确率、F1 或 Elo。
- 结果：K3 在 GPQA Diamond 为 93.5，Terminal-Bench 2.1 为 88.3，FrontierSWE 为 81.2，SWE-Marathon 为 42.0，BrowseComp 为 91.2；GDPval-AA v2 为 1686 Elo，低于 Fable 5 的 1747 和 GPT-5.6 Sol 的 1736。研究级推理 HLE-Full 无工具为 43.5、有工具为 56.0，CritPt 为 23.4。
- 对照是否可比：模型使用不同推理强度、工具、脚手架、价格来源和部分第三方结果；许多分数是单次或排行榜快照，缺少方差和统一调用预算。
- 证据定位：Section 6.1.2–6.1.4, Table 2, pp. 25–28 of the technical report.
- 支持的最窄结论：在报告截至 2026-07-24 汇总的异构评测协议中，K3 在多项编码与智能体任务领先多数列出的开放和闭源模型，整体仍落后于 Claude Fable 5 与 GPT-5.6 Sol，研究级推理差距更明显。
- 解读：表格支持广度和相对位置，无法把分数差异单独归因于基座模型、推理预算、脚手架或工具。

### 结果 4：MoonEP 给出严格设备负载均衡的构造与资源上界

- 设置：理论部分处理任意当前层、当前微批次的 Top-k 路由结果。组件仓库另在单台八卡 H20、EP=8 上比较 MoonEP 与 DeepEP v2；通信基准使用每 rank 8192 个 token、384 个专家、7168 隐藏维、Top-8 路由、32 个 SM，按固定随机种子生成相同路由，在 20 次预热后测量 50 次迭代的跨 rank 平均延迟。
- Baseline：仓库的实测基线是 DeepEP v2 elastic expanded dispatch / reduced combine。ECHO、UltraEP 和 AcclEP 属于方法比较对象或实现启发来源，没有进入同一张实测对照图。
- 指标：每个 rank 的真实 token—专家条目数、冗余专家槽上界、静态缓冲区形状，以及随专家最大负载违反率 `maxvio` 变化的 planning、prefetch、dispatch、combine 延迟。`maxvio` 定义为 $\max_e(T_e/\bar{T})-1$，其中 $T_e$ 是专家 $e$ 的实际条目数，$\bar{T}$ 是严格均衡时的专家平均条目数。
- 结果：报告证明总专家数为 $E$、专家并行 rank 数为 $R$ 时，每个 rank 最多预留 $E/R$ 个冗余专家槽即可保证严格均衡方案存在；均衡后每个 rank 处理固定的 $SK$ 个真实条目。仓库在 `maxvio` 目标值 0.2、1、10 和 20 上报告 MoonEP 通信延迟随失衡程度基本保持稳定，dispatch 总时间包含在线规划和权重预取，combine 延迟在各设置下低于 DeepEP v2；README 的端到端训练图还显示 MoonEP 迭代时间保持稳定，而 DeepEP 在高失衡设置下发生显存不足。
- 对照是否可比：通信脚本对两种库使用相同路由、输入、SM 预算、对齐方式和计时器；MoonEP 的 communication 图没有计入可与后续计算重叠的 `grad_reduce`。端到端图只由 README 给出，没有同仓库数值表。全部结果限于单机 H20、EP=8 和合成路由，缺少 K3 实际专家数、Top-16、完整训练集群拓扑、重复运行方差、规划器故障统计，以及与调优后 UltraEP 的同硬件比较。
- 证据定位：Technical report Section 5.2.1, pp. 19–20; Appendix E, Theorems 1–2, pp. 44–46; [MoonEP README and figures at `51e64aa`](https://github.com/MoonshotAI/MoonEP/tree/51e64aa55310f6c6b464deabd80de2e8b5426d3f#readme); [`benchmarks/bench_vs_deepep.py`](https://github.com/MoonshotAI/MoonEP/blob/51e64aa55310f6c6b464deabd80de2e8b5426d3f/benchmarks/bench_vs_deepep.py).
- 支持的最窄结论：对任意当前路由结果，MoonEP 的构造可在每 rank 至多增加 $E/R$ 个冗余专家槽的条件下形成严格 token 负载均衡；官方单机 H20、EP=8 基准进一步支持其静态执行形状能隔离合成专家失衡对通信和迭代时间的影响。
- 解读：证明覆盖方案存在性和最坏资源上界，仓库基准覆盖一个具体单机实现。K3 完整训练中的吞吐收益及其对跨节点网络、实际路由分布和 Top-16 配置的敏感性仍待直接测量。

### 结果 5：AgentENV 支持长程强化学习所需的环境状态续接

- 设置：K3 训练与评测使用基于 Firecracker 的微虚拟机沙箱，支持增量 checkpoint、resume、pause、fork 和 snapshot。
- Baseline：报告描述早期容器运行时曾出现内核崩溃与死锁，没有提供同任务、同资源的端到端基准表。
- 指标：checkpoint、resume、启动延迟、内存超配率以及累计创建的沙箱和镜像数量。
- 结果：最低 checkpoint 延迟 133 ms、resume 延迟 49 ms，大规模启动低于 1 秒，真实负载中内存超配率最高 6.5 倍；K3 训练和评测累计创建 51,219,741 个沙箱，涉及 1,505,678 个镜像。
- 对照是否可比：这些数字分别为最低延迟、最高超配率和累计规模，硬件、状态大小、延迟分布和容器基线未统一披露。
- 证据定位：Section 5.3.2, pp. 21–22 of the technical report; https://github.com/kvcache-ai/AgentENV.
- 支持的最窄结论：AgentENV 已在 K3 工作负载中大规模运行，并提供 partial rollout 跨迭代续接所需的环境状态生命周期操作。
- 解读：累计规模证明使用广度，不能直接推出每条轨迹的平均效率或相对容器方案的加速倍数。

### 结果 6：网络安全评测显示显著能力与明确高风险边界

- 设置：Tier 1 评估当前代码库中的漏洞发现与可复现性；Tier 2 在隔离环境中评估端到端利用能力，并与 GLM-5.2 比较。外部闭源模型因拒答未进入同表。
- Baseline：内部 Tier 2 以 GLM-5.2 为基线；外部 UK AI Security Institute 与 NIST CAISI 评估提供独立参照。
- 指标：人工确认漏洞比例、此前未知漏洞数量、内部任务完成数、ExploitBench、模拟网络步骤数和任意代码执行任务数。
- 结果：Tier 1 人工审阅候选中约 70% 被确认真实，六个项目中有 16 个此前未知问题；Tier 2 内部 36 项中 K3 完成 14 项、GLM-5.2 完成 8 项。外部评估中 ExploitBench 为 32% 对 24%，模拟网络为 17 对 11 步，任意代码执行为 0/41。
- 对照是否可比：内部比较排除了因安全策略拒答的前沿闭源模型；任务集、提示、工具、尝试预算和目标选择由报告团队控制。外部结果覆盖不同任务，适合确认方向，不能与内部 14/36 合并。
- 证据定位：Section 6.2.2, pp. 30–31 of the technical report.
- 支持的最窄结论：K3 在受控评测中已表现出真实漏洞发现和部分端到端利用能力，并在所列内部与外部设置中超过 GLM-5.2；对加固目标和完整利用链仍存在明显缺口。
- 解读：该结果同时是能力证据和风险信号，模型权重开放会降低高能力安全研究工具的获取门槛。

- 系统条件：报告披露 PP、VP、EP、ZeRO-1、Pipeline ZeRO-2、CP、低精度训练、CPU DRAM 与 NVMe 卸载等组件；没有披露预训练 GPU 型号与数量、集群拓扑、并行度配置、利用率、训练时长和故障统计。
- 指标定义：缩放效率来自拟合损失对应的 FLOPs；基准按各自官方或报告协议；AgentENV 数字包含最低、最高或累计值；安全指标来自内部和外部两组不同评测。
- 成本归因：报告没有给出预训练与后训练 GPU-hours、能耗或总成本。Section 6.4 的推理成本混合 Kimi 内部测量、公开图表和按 token 定价，适合描述当时服务价格下的任务成本，不能作为统一硬件效率测量。
- 未披露项：预训练总 token 与数据比例、训练算力和 wall-clock、全部模型与优化超参数、QB 与 AttnRes 的 K3 级组件消融、强化学习数据量和奖励权重、partial rollout 陈旧度统计、MOPD 教师差异、百万长度质量曲线、推理吞吐与尾延迟、安全对齐数据和更广泛危险能力评测。
- 威胁模型：开放权重模型在有源码、可运行目标和工具环境的条件下执行漏洞发现或利用任务；攻击者可以多轮运行代码和检查结果，目标从常见用户态软件延伸到内核与模拟企业网络。
- 披露边界：本笔记只保留能力层级、汇总指标、评测限制和防御含义，省略具体漏洞位置、目标利用链和可复用操作步骤。报告公开了部分高风险技术细节，实际部署应结合隔离执行、网络与凭证最小权限、行为审计、速率限制和模型更新后的重复评测。

## 主要启发

1. **模型缩放指标应同时覆盖信息流和执行路径。** K3 把序列、深度、宽度对应到 KDA–MLA、Attention Residuals、LatentMoE，再分别配置内核、通信、内存和缓存机制。
2. **统计均衡与设备均衡是两个环节。** QB 调整下一个训练步的专家入选阈值，MoonEP 根据当前路由结果形成设备级严格均衡计划。
3. **长程强化学习包含两类持久状态。** 模型侧要保存 KDA/MLA 缓存，环境侧要保存沙箱状态；只恢复其中一类无法继续原轨迹。
4. **部署约束可以提前进入训练目标。** MXFP4/MXFP8 量化感知训练与 EAGLE-3 草稿层微调都在最终权重形成前处理服务约束。
5. **复合模型报告需要组件归因表。** K3 的总体结果很强，下一步最有价值的证据是固定数据与算力后分别移除 KDA 衰减下界、AttnRes、LatentMoE 稳定组件、QB、Per-Head Muon 和系统模块。

## 局限

1. 约 2.5 倍缩放效率是架构、数据和训练配方的合并结果。报告只给拟合曲线示意，缺少原始点、拟合式、置信区间和组件消融。
2. 预训练没有披露总 token、数据混合比例、GPU 型号与数量、并行度、训练时长、GPU-hours、能耗和成本，外部无法复算训练效率。MoonEP 仓库补充了单机 H20、EP=8 的组件基准，仍缺 K3 实际专家数、Top-16 和完整训练拓扑下的端到端测量。
3. 1M 上下文有模型配置、课程、基础设施和部分长程智能体结果支撑，缺少统一的长度—质量—延迟—显存曲线。
4. Figure 6 支持视觉训练稳定性，正文声称视觉能力相当却没有对应评分表；原生多模态从头训练的净收益仍待完整消融。
5. 九个强化学习专家和 MOPD 的流程明确，训练数据规模、奖励权重、逐 token 正则化、教师—学生距离、partial rollout 陈旧度和领域间迁移消融不足。
6. Table 2 混合不同模型的推理强度、工具、脚手架、上下文管理和排行榜时间，模型本体与运行时系统的贡献无法完全分离。
7. 成本效率图混合内部成本、公开图表和 API 定价，价格变化、缓存折扣、并发和服务实现都会改变结论。
8. 网络安全评测显示高风险双用途能力；报告没有形成覆盖生物、化学、自主复制、欺骗等领域的完整系统卡，也没有充分披露开放权重发布后的风险缓解框架。
9. 完整权重采用自定义 Kimi K3 License，2.8 万亿参数与百万上下文对部署硬件要求很高；权重可获得性与普通研究团队的可复现性仍有距离。

## 跨论文关系

- 与 [Kimi K2](/papers/2507.20534-kimi-k2-open-agentic-intelligence/)：K2 提供 1.04 万亿参数 MoE、MuonClip、工具数据和智能体强化学习基础；K3 扩大模型宽度与深度，改用混合 KDA–MLA、Stable LatentMoE 和 Per-Head Muon，并把 K2 作为缩放效率基线。
- 与 [Kimi K2.5](/papers/2602.02276-kimi-k2-5-visual-agentic-intelligence/)：K2.5 将视觉、Agent Swarm、PARL 和 token 预算控制接入 K2；K3 从头训练 MoonViT-V2，将推理强度扩展为九个专家并以 MOPD 整合，同时复用 partial rollout 与量化感知训练思路。
- 与 [Kimi k1.5](/papers/2501.12599-kimi-k1-5-scaling-rl-llms/)：k1.5 建立 Moonshot AI 的长上下文强化学习与策略优化路径；K3 将其推进到百万 token、多领域智能体和多档推理强度。
- 与 [DeepSeek-V2](/papers/2405.04434-deepseek-v2-mla-moe-efficient-llm/) 和 [DeepSeekMoE](/papers/2401.06066-deepseekmoe-expert-specialization/)：K3 的周期性全局注意力沿用 MLA 的压缩 KV 思路，Shared/Routed expert 组织延续细粒度专家与共享专家路径；K3 新增潜空间专家、QB 与设备级严格均衡。
- 与 [DeepSeek-V3](/papers/2412.19437-deepseek-v3-technical-report/)：两者都采用无辅助损失的专家负载均衡和低精度大规模 MoE 训练；K3 用分位数更新偏置，并由 MoonEP 在执行端实现严格均衡。
- 与 [UltraEP](/papers/2606.04101-ultraep-rack-scale-moe-load-balancing/)：UltraEP 在路由后依据精确负载规划专家副本和 token 迁移；MoonEP 追求每个 rank 完全相同的 token 数，并给出冗余专家槽的最坏上界。
- 与 [MOPD](/papers/2606.30406-mopd-multi-teacher-on-policy-distillation/)：K3 把多教师在线策略蒸馏用于三个领域、三档推理强度的九个专家整合，提供了该方法在更大模型和长程智能体系统中的部署实例。
- 与 [EAGLE-3](/papers/2503.01840-eagle-3-training-time-test/)：K3 将预训练 MTP 层改造成 EAGLE-3 草稿层，读取 AttnRes 的低、中、高层表示并直接优化接受率。
- 与 [DLA](/papers/2606.10650-dynamic-linear-attention/) 和 [HydraHead](/papers/2606.20097-hydrahead-head-wise-hybrid-attention/)：三者都在固定状态或有限全局注意力预算下保留长上下文；K3 采用固定 3:1 的层级 KDA–MLA 混合，DLA 动态决定状态边界，HydraHead 按注意力头选择完整注意力。
- 与 [RollArt](/papers/2512.22560-rollart-disaggregated-agentic-rl-training/)：RollArt 通过分离训练、推理和环境资源处理异步长程强化学习；K3 使用共置训练、partial rollout、外部 KV cache 和可恢复微虚拟机处理同类轨迹生命周期问题。
