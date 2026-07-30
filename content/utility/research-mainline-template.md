# Research Mainline Template

First-Archived-At: 2026-07-22 17:20
Updated-At: 2026-07-30 09:37

> 本模板用于用户明确请求建立的跨材料研究主线。单篇论文、报告、模型卡、博客与已发表综述使用 [Paper Note Template](/template/)。完整规则见 [Research Synthesis Workflow](/synthesis-workflow/)。

```markdown
# 日期无关的稳定主线标题

First-Archived-At: YYYY-MM-DD HH:mm
Updated-At: YYYY-MM-DD HH:mm
Review-Status: pending
<!-- Review-Status 只使用 pending 或 approved。pending 不记录 Reviewed-At；用户确认后改为 approved 并记录 Reviewed-At。后续修订只更新 Updated-At，保留原有 Review-Status 和 Reviewed-At。 -->

## Source

- Workflow version: synthesis-v1
- Material type: composite
- Analysis modules: survey, experiment
- Responsible organization: Chlience Paper Archive（本地综合）
- Search services: arXiv、正式论文集、官方项目页与代码仓库
- Search window: YYYY-MM-DD 至 YYYY-MM-DD HH:mm TZ
- Research question: 一个可由材料支持、限定或推翻的问题
- Classification axes: 主题专属轴一；主题专属轴二；主题专属轴三
- Key figure decision: omit
- Key figure rationale: 比较表完整承载核心关系，原材料没有更高信息价值的单图。
- Published / updated: YYYY-MM-DD
- Current version read: 实际读取的版本、页面与仓库状态
- Accessed: YYYY-MM-DD
- Subjects: 主题一；主题二

### 检索与纳入协议

记录检索词、同义机制、检索服务、首次公开与版本口径、纳入条件、排除条件、覆盖缺口和明确排除项。

## 综合判断

用一至三段给出研究对象、主要演进、当前最强结论和关键成立条件。

## 核心问题与边界

解释问题为何存在、本文覆盖什么、排除什么，以及跨材料比较的成立边界。

## 分类框架

从研究问题推导主题专属分类轴，定义每个轴的取值、含义和主要风险。

## 演进脉络

按时间或问题演进组织材料，强调压力、机制变化和后续影响，避免逐篇摘要堆叠。

## 跨材料比较

| 材料 | 共同字段一 | 共同字段二 | 直接证据 | 主要边界 |
| --- | --- | --- | --- | --- |
| 材料 A | ... | ... | ... | ... |
| 材料 B | ... | ... | ... | ... |

## 证据强度

| 结论 | 强度 | 直接证据与限制 |
| --- | --- | --- |
| 具体结论 A | 中强 | 说明直接证据、可比性和成立条件 |
| 具体结论 B | 待验证 | 说明缺少的对照、数据或复验 |

## 当前判断

回答研究问题，并区分已被直接证据支持的判断、跨材料推断和推荐的复验路径。

## 开放问题

列出能够改变当前判断的关键问题。

## 局限

记录检索、版本、证据、可比性、成本和适用范围限制。

## 更新记录

- YYYY-MM-DD：根据用户的方向总结请求建立主线。
```

`Key figure decision: include` 时，至少嵌入一张本地图片，并在附近记录 `Image Source`。主线图片使用 `public/images/mainlines/<slug>/`；图片数量由信息价值决定。
