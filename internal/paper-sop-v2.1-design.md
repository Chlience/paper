# Paper SOP v2.1 Design

Created-At: 2026-07-17
Status: Historical design record; single-paper v2.1 remains active, mainline coupling was superseded by `synthesis-v1` on 2026-07-22

## 目标

v2.1 降低单篇完整归档的固定维护成本，同时保留核心贡献、证据定位和结论边界质量。它延续 v2 的来源快照、时间、索引、图片和作者反向完整性能力，并调整公开笔记结构、作者核验范围、审稿表达和研究主线耦合。

## 审计基线

改版前仓库包含 102 篇论文和 352 个作者 profile。24 篇 v2 笔记平均 499 行，78 篇 legacy 笔记平均 382 行。24 篇 v2 的 `Reference Intake Brief` 全部使用 `merge`；正式公开审稿只在 1 篇中出现。主 SOP 已从 v2 设计时审计的 461 行增长到 731 行。

这些数据指向四个问题：固定章节和模板推动重复内容；准入决策位于用户已经指定归档之后；全作者深度 profile pass 扩大关键路径；新增全局功能容易与执行卡、模板和验证器发生契约漂移。

## 契约变化

1. 新笔记使用 `Workflow version: v2.1`。
2. 强制公开章节缩减为七个：`Source`、`作者与关系`、`一句话结论`、`论文脉络`、`关键实验/定理`、`局限`、`跨论文关系`。
3. `Reference Intake Brief` 退出新标准。
4. `Analysis modules` 显式声明 `experiment`、`system`、`theory`、`model-report`、`survey`、`safety`、`docs` 条件检查。
5. venue 与审稿状态进入 Source；完整审稿章节只由 `official-review` 触发。
6. 作者基础核验覆盖每位可解析作者，深入核验只由角色、跨论文价值、冲突或强候选触发。
7. 新论文拥有新发现关系；旧论文只在理解变化时回写。
8. 受控标签对单篇论文保持强制；当前主线已迁移到独立的 `content/mainlines/` 文章契约，本条为历史决策。
9. 五项人工语义门禁保护核心分析深度。

## 兼容策略

- `internal/paper-workflow-legacy-slugs.json` 冻结 v2 前历史条目。
- `internal/paper-workflow-v2-slugs.json` 冻结 v2.1 发布前已有 v2 条目。
- legacy 与 v2 继续按原结构读取；新 slug 使用 v2.1。
- 历史笔记发生实质更新时迁移到 v2.1，格式与链接维护不触发迁移。
- legacy advisory 保持有界输出；新规则不能增加兼容债务。

## 验证策略

立即作为硬错误的规则：

- v2.1 版本、时间、Source 快照和合法分析模块。
- 七个核心章节。
- 关键结果的证据定位和最窄结论。
- Review status 的类型、置信度、观察日期和 venue 状态。
- `official-review` 对应完整审稿分析章节。
- 索引、标签、图片、链接和作者数据结构完整性。

canary 阶段 advisory：

- `experiment` 的对照可比性。
- `system` 的系统条件、指标定义和成本归因。
- `theory` 的假设与适用域。
- 其它模块的未披露项、纳入范围、威胁模型、披露边界或适用版本。

下一篇用户指定论文作为真实 canary。完成后审查 advisory 的准确性，再把稳定且可自动判断的规则提升为硬错误。

## 契约维护门禁

任何强制要求变化都在同一次改动中同步：

1. `AGENTS.md`
2. 主 SOP 与 Definition of Done
3. 论文模板
4. 验证器和测试
5. fixture 或真实 canary

五项未对齐时保持建议级。

## 验收标准

- 主 SOP 可以一次通读，并把专项细则路由到内部文档。
- v2.1 fixture 只使用七个核心章节且通过硬检查。
- 非 `official-review` 材料不需要空审稿章节。
- 新 slug 使用 v2 时被拒绝，legacy 与冻结 v2 语料继续通过。
- 研究主线快照保持内部一致，新论文缺少主线分配不会阻塞工作流或站点构建。
- 工作流、元数据、公式、搜索、置顶和站点验证通过。
