# <Paper Title> 论文笔记

First-Archived-At: YYYY-MM-DD HH:mm
Updated-At: YYYY-MM-DD HH:mm

## Source

- Title:
- arXiv:
- PDF:
- Code/Project:
- OpenReview / Review page:
- Authors:
- Submitted:
- Current version read:
- Subjects:

## 作者与关系

- Author A: Institution in this paper.
- Author B: Institution in this paper；历史机构：previously verified affiliations if already known and not already listed in the paper-time institution.

写法要求：本节作者条目在冒号后直接写发表该论文时的机构。若有额外已核验历史机构，再写 `历史机构：...`；历史机构中不重复列出已在当前机构中出现的机构。

## 一句话结论

用一段话说明论文最核心贡献或判断。

## 阅读目标与判断边界

本笔记关注：

1. 
2. 
3. 

判断边界：

- 
- 

数学公式写法：

- 行内公式使用 `$...$`，例如 `$\pi_\theta$`。
- 独立公式使用 `$$...$$` 包裹；不要把数学表达式写进反引号代码样式。

## 论文脉络

### 1. 研究问题、背景和价值


### 2. 已有解决方案与不足


### 3. 作者可能的思考路径


### 4. 核心假设或切入点


### 5. 方法 / 系统 / 理论框架

<!-- 若有架构图、训练流程图或标签构造图，直接放在解释该机制的小节下方，并写 source URL 与重要性。示例：

![Figure 1: short description](/images/papers/<paper-slug>/fig-1-short-name.png)

Redrawn from Figure X of `<paper title>`. Source: `<source URL>`. 重要性：
-->

### 6. 结论链条


## 关键实验/定理

### 结果 1

- 设置：
- Baseline：
- 指标：
- 结果：
- 解读：

<!-- 若有主结论图或失败边界图，直接放在对应结果小节的表格或解读附近。 -->

### 结果 2

- 设置：
- Baseline：
- 指标：
- 结果：
- 解读：

### 实验设置与 baseline 审计

数字密集项优先用表格记录，正文保留判断和边界。

| 维度 | 记录 |
| --- | --- |
| 模型与初始化 |  |
| 数据与任务 |  |
| RL / 训练配置 |  |
| 系统配置 |  |
| 技术报告训练配置 |  |
| 训练硬件与拓扑 |  |
| 并行方式与框架 |  |
| 训练数据规模与组成 |  |
| 训练过程与超参 |  |
| 训练时间 / GPU hours / 成本 |  |
| 未披露项 |  |
| 评测协议 |  |
| 统计报告 |  |
| Baseline 是否 tuned |  |
| Baseline 是否 compute-matched |  |
| Baseline 是否 implementation-matched |  |
| Baseline 是否覆盖强替代方案 |  |
| Baseline 是否存在弱化风险 |  |
| 结论边界 |  |

## 证据链强度评估

### 强证据

- 

### 中等强度证据

- 

### 需要谨慎的推论

- 

## OpenReview / 审稿意见吸收

- Venue status:
- Public reviews:
- Ratings / confidence:
- Reviewer consensus:
- Main criticisms:
- Author response:
- 对本文可信度的影响:

## 本地讨论补充

### 1. 讨论收敛点

- 

### 2. 修正后的理解

- 

### 3. 后续复验指标

- 

## 主要启发

- 
- 
- 

## 局限

1. 
2. 
3. 

## 跨论文关系

- 与 `content/utility/papers-index.md` 中已有论文的作者关系：
- 与已有论文的主题关系：
- 与已有论文的方法或系统关系：
- 新增后应更新的索引 cluster：

链接规范：若指向已存档论文，使用 `[2504.13837](/papers/2504.13837-rlvr-reasoning-boundary-base-model/)` 这类站点路径；本地文件名只用代码样式。若指向已建档作者，使用 `[Tri Dao](/authors/tri-dao/)` 这类作者页路径。

## Reference Intake Brief

### Target

- Intended target system: 新增论文笔记 / 具体专题文档。
- Existing related assets: `content/utility/papers-index.md`；已存档论文链接使用 `/papers/<slug>/`。
- Proposed form: 新建独立 Markdown 文档 / 更新已有文档。

### Reusable Elements

1. 
2. 
3. 

### Risks

- Copyright/over-copying:
- Unsourced or unverifiable claims:
- Tone/brand mismatch:
- Safety/compliance issues:
- Overlap with existing assets:

### Skipped

| Material | Reason |
| --- | --- |
| 公开 reviewer comments | 未发现 OpenReview/ARR/会议公开审稿页，或无法可靠匹配到当前论文版本。 |
|  |  |

### Recommendation

Decision: merge / revise then merge / skip / ask user

Why:
