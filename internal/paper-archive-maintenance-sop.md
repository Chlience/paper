# Paper Archive Maintenance SOP

Updated-At: 2026-09-05

## 目的

本文承载公开工作流之外的仓库维护细则，包括索引、标签、作者数据、图片、公式、删除、验证和提交。分析判断以 `content/utility/paper-analysis-workflow.md` 为准。

## 发布文件

一篇新论文通常修改：

- `content/papers/<slug>.md`
- `content/utility/papers-index.md`
- `data/paper-tags.json`

作者 `enrichment` 实际创建或更新 profile 时修改 `data/authors.json`；`Key figure decision: include` 时添加 `public/images/papers/<slug>/...`。核心归档没有对应触发条件时不创建这些附加资产。

研究主线保存在 `content/mainlines/<slug>.md`，不进入论文索引或标签。新增论文不自动更新主线；主线文章中的 `/papers/<slug>/` 链接声明成员关系并生成论文页回链。

## 索引与标签

`当前收录` 固定为 `简称 | 时间 | 核心信号` 三列。每篇论文恰好一行，按首次公开月份从新到旧排列，同月保持现有相对顺序。核心信号用一个可独立成立的自然语言句子说明研究对象、区别性机制和主要结果；省略某个边界会改变结论真值时，将该边界写入句子。

`data/paper-tags.json` 必须覆盖全部论文。每个数组包含一个主标签和最多三个辅助标签，标签 ID 来自 `data/tag-taxonomy.json`。新增标签前先检查首选名称和 aliases；标签拆分、合并或改名需要审计全部分配与站点锚点。

## 本地审阅状态

v3 的首次归档时间和更新时间按实际发生的分钟记录，允许同一分钟归档多篇；slug 承担身份与相同时间下的排序。旧版时间冲突规则仅在旧版记录之间保留。

每篇论文头部声明 `Review-Status`：

- `pending`：分析已经归档，等待用户审阅；新增论文默认使用该状态。
- `approved`：用户已经完成过核心贡献、直接证据、结论边界与局限的确认，同时记录 `Reviewed-At: YYYY-MM-DD HH:mm`。

`Review-Status` 只使用 `pending` 和 `approved`。`pending` 不记录 `Reviewed-At`；`approved` 必须记录分钟精度的 `Reviewed-At`。后续修订保留原有 `Review-Status` 和 `Reviewed-At`；仅实质内容变化更新 `Updated-At`，纯排版、拼写和不改变来源身份的链接维护保留时间，审阅动作只更新审阅字段。因此 `approved` 文章允许 `Updated-At` 晚于 `Reviewed-At`。`/papers/` 通过 `?review=pending` 和 `?review=approved` 提供可收藏的筛选入口。

## 分析契约与兼容

科学判断与完成验收以 `content/utility/paper-analysis-workflow.md` 为唯一规范来源；本文件只规定仓库操作。新笔记使用 v3，模板提供核心章节、`Reading scope`、证据字段和条件章节。总览独立交代完整执行链与训练信号，详解和主要启发均按内容组织；不在维护 SOP 复制标题编号、自然段配额或语义关键词表。

legacy、v2 与 v2.1 保留原契约校验。v2.1 兼容名单在 `internal/paper-workflow-v21-slugs.json`；既有方法总览基线 `internal/paper-workflow-method-overview-baseline.json` 只服务 v2.1。两者只随迁移缩减，不能新增记录。验证器固定 v2.1 原有 `Updated-At`；时间变化而仍声明 v2.1 会阻止提交。实质回写的笔记迁移到 v3，同时移除对应兼容记录；旧版事实、用户判断、`First-Archived-At` 与审阅历史保留。纯格式或链接维护不触发迁移。

归档授权范围内的后续交流回流到机制、证据、局限、关系或主要启发，不新增公开的 `本地讨论补充`。旧笔记仅因事实纠错、一句话结论真值变化或用户明确要求维护而回写。

## 作者数据

`archive-core` 从论文作者块记录作者与论文时机构，并执行本地重名、作者重叠和已有 profile 检查。用户明确要求作者分析、身份冲突影响归因或现有链接，或者作者关系属于核心结论时，才按 `internal/author-x-account-search-sop.md` 启用作者 `enrichment`。增强范围先绑定到指定作者和指定字段；完整作者关系或 profile 完善请求才扩展默认核心作者范围。`data/authors.json` 只保存稳定字段和来源；请求包含代表论文或 profile 完善时，个人主页明确重点展示的论文才写入 `representativePapers`，并与构建器汇总的本站论文笔记分开。每个 profile 至少关联一篇剩余论文；删除或改名后运行反向完整性检查。

同名作者需要逐篇确认时使用 `matchByName: false`，并只在属于该作者的 `Source -> Authors` 中显式链接作者页。当前 schema 只允许同一规范化姓名下的一位 tracked profile。

## 公式

- 行内公式使用 `$...$`。
- 块级公式使用前后各占一行的 `$$` 分隔符。
- equation、aligned 或 split 等环境外层仍使用 `$$...$$`。
- 数学表达式不放入反引号代码样式。
- 普通美元金额和 shell 变量使用代码样式，避免被公式解析器误判。
- 索引核心信号和 `一句话结论` 不使用公式或 TeX 数学定界符，相关机制与结果改用自然语言描述。

## 图片

每篇 v3 笔记在 `Source` 记录图片准入结果：

- `Key figure decision: include`：图片能显著帮助理解机制、数据路径、训练信号、主结论或失败边界，或者用户明确要求图片；正文至少嵌入一张本地图片。
- `Key figure decision: omit`：文字或表格能够完整表达核心机制和证据，或图片受版权、安全与材料形态限制；用 `Key figure rationale` 说明原因。

图片数量由解释价值决定。文字或表格足以清楚表达时使用 `omit`；综述中的 taxonomy、领域地图和概念层级图只有在能显著降低阅读成本时使用 `include`。

文件放入：

```text
public/images/papers/<paper-slug>/fig-<n>-<short-name>.<ext>
```

正文使用 `/images/papers/<paper-slug>/...`。每张图附近添加 `Image Source`，说明原始文件、截图、PDF crop 或本地示意图。优先使用许可清晰的 TeX source、HTML、项目页和官方仓库原图；保持坐标、图例、比例和关键标注完整。安全论文中含可直接滥用流程的图片改写为高层文字，并使用 `omit` 记录原因。

## 删除与反向完整性

删除论文、目录或图片前必须按项目高危操作规则取得二次确认。确认后：

1. 删除论文 Markdown 和 `当前收录` 唯一行。
2. 删除 `data/paper-tags.json` 分配。
3. 修订剩余论文中的失效链接和确实受影响的跨论文判断。
4. 清理只服务该论文的图片。
5. 审计 `data/authors.json`，删除失去全部论文关联的 profile。
6. 检查全部主线文章；删除失效链接，并在论证或成员关系变化时同步更新文章状态。

`missing-index-entry`、`stale-index-entry`、`duplicate-index-entry`、`orphan-author-profile` 和主线中的失效论文链接都是硬错误。

## 主线维护

主线只响应用户明确的建立、更新、合并、拆分、改名或删除请求。文章使用 `synthesis-v1`，固定保存在 `content/mainlines/`。主线身份不依赖审阅状态；文章内容使用 `pending` 和 `approved`，修订时沿用论文文章的状态保留规则。

主线图片放入 `public/images/mainlines/<slug>/`。主线不分配 `data/paper-tags.json`，不写入 `content/utility/papers-index.md`，不计入论文数量。全局搜索和论文页回链由生成数据提供。

## 本地验证

```bash
rtk npm run check:source
rtk git diff --check
```

常规归档完成后运行一次 `check:source`；失败时只重跑受影响检查和最终一次 `check:source`。production build、生成页面检查和部署由 GitHub Actions 完成；用户明确要求本地复现完整 CI 或排查构建差异时运行 `rtk npm run check:all`。`dist/` 与 `src/generated/` 不进入 commit。

## 提交

检查 `git status --short` 和完整差异，只 stage 当前任务文件。完整改动验证通过后创建本地 commit，不自动 push。提交完成后再次检查工作区，确认剩余内容属于其它任务或历史遗留。
