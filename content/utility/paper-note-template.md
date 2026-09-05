# <Paper Title> 论文笔记

First-Archived-At: YYYY-MM-DD HH:mm
Updated-At: YYYY-MM-DD HH:mm
Review-Status: pending
<!-- 用户明确确认后用 approved 并记录 Reviewed-At。后续修订保留原有 Review-Status 和 Reviewed-At；仅实质内容变化更新 Updated-At。v3 允许同一分钟归档多篇，时间如实记录。 -->

<!-- 本模板用于 archive-core；analysis-only 直接回答。阅读流程见 /workflow/；方向综合使用 /synthesis-workflow/ 和 /mainline-template/。填写时删除占位，按材料调整章节顺序。 -->

## Source

- Workflow version: v3
- Material type: research-paper
- Analysis modules: experiment
- Canonical source: <official URL>
- Title: <title>
- Authors: <paper author block; use Responsible organization for team documents>
- Published / updated: <publication date>
- Version / revision read: <version and direct link; observation date for an unversioned page>
- Accessed: YYYY-MM-DD
- Reading scope: <sections and appendices actually read; material gaps affecting the judgment>
- Key figure decision: omit
- Key figure rationale: <why text or tables suffice, or why the figure cannot be included>
- Review status: page-type=not-checked; match-confidence=not-applicable; observed-at=YYYY-MM-DD; venue-status=unknown

<!--
Material type: research-paper / technical-report / model-card / survey / blog / framework-docs。
Analysis modules: experiment / system / theory / model-report / survey / safety / docs；多个值用逗号分隔。
Authors 与 Responsible organization 至少一项。只保留实际采用的来源链接，固定所读版本。
图片使用 include 时至少嵌入一张本地图片并标注 Image Source，可删除 omit 理由。
Review status 的状态定义见 SOP：not-found / unavailable 添加 Review lookup；metadata-only / proceedings / commentary 添加带 URL 的 Review evidence；official-review 添加文末审稿章。未核验保留 not-checked，不声称没有评审。
-->

## 一句话结论

<用自然语言写清首要贡献、区别性机制、主要结果与会改变真值的边界；不使用公式或 TeX 数学定界符。索引核心信号从本节提炼。>

## 论文脉络

### 问题与已有缺口

<说明研究对象、用户关心的问题、已核验基线与剩余缺口；必要背景和核心假设可以合并。>

### 贡献与方法总览

<说明首要贡献及必要辅助贡献；从输入或假设开始，按执行或依赖顺序交代关键对象、操作、传递关系和最终输出、训练信号或论证结论。先消歧角色与版本。只读本节应能复述完整链条。>

### <首要机制或关键论证，按实际内容命名>

<解释关键操作如何工作、设计理由、成立条件和证据定位。公式解释用途、变量、方向与实现后果；需要时用对应原定义的具体例子。单阶段可合并进总览，多阶段按解释需要分节，不设固定编号或统一字数。>

## 关键实验/定理

### <该证据检验的主张>

- 证据定位：<同版本章节、图表、定理、页码或具体 URL / code path / commit>
- 观察：<实际报告的结果及必要设置、比较对象与指标口径；区分作者报告、本地计算与独立复现>
- 判别性与局限：<对照固定和改变了什么，能区分哪些解释，尚不能排除什么；理论说明假设与适用域>
- 支持的最窄结论：<证据足以支持的判断，保留条件；可以是证据不足或负面结论>

<!-- 关键证据可以有多项，不预设数量。按 Analysis modules 补充影响结论的条件，详见 internal/paper-analysis-modules.md。复用前文设置时明确引用，不复制数字。 -->

## 局限

<按受影响主张说明成立边界、混杂因素、访问或披露缺口及其判断后果；已展开的限制简短引用。>

## 作者与关系

<按论文作者块记录论文时机构、顺序和明确角色；共同机构可合并。只检查本地同名、别名与已有 profile，机构无法映射到个人时明确说明。>

<!-- archive-core 不新建或扩充 profile，普通作者只复用已有 profile。enrichment 限定指定作者与字段；完整作者关系或 profile 完善请求才扩展到作者顺序前两位、明确共同一作和通讯作者。只有请求代表论文或 profile 完善时，已核验主页明确选中的工作才写入 representativePapers。 -->

## 跨论文关系

<只保留有证据且改变理解的引用、方法关系或本地比较；无可靠关系写“暂无高置信跨论文关系。”。本地论文用 /papers/<slug>/，作者用 /authors/<slug>/。>

<!--
以下模块仅在有实际内容时添加。

## 主要启发

### <有证据支持的新判断>

说明原有判断的可归因来源、触发认识变化的区分性证据、新判断与成立边界。直接定位原文，细节可引用前文证据；没有独立认识更新时省略本节，不预设数量或自然段配额。迁移有具体目标时，再交代抽象关系、目标实例化和可证伪预测；未验证外推明确标注。

## OpenReview / 审稿意见吸收

仅在实际读取正式评审内容并使用 page-type=official-review 时添加。

- 已读材料：<decision / meta-review / 选读 review / rebuttal 的实际范围>
- 证据定位：<对应材料的直接 URL>
- 主要质疑：<影响核心结论的质疑；仅有 decision 时不推断 reviewer 共识>
- 作者回应：<实际回应；区分未读取和未在已读材料中披露>
- 对结论的影响：<对应主张维持、收缩或待验证的原因>
-->
