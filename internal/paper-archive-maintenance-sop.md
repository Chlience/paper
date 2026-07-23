# Paper Archive Maintenance SOP

Updated-At: 2026-07-22

## 目的

本文承载公开工作流之外的仓库维护细则，包括索引、标签、作者数据、图片、公式、删除、验证和提交。分析判断以 `content/utility/paper-analysis-workflow.md` 为准。

## 发布文件

一篇新论文通常修改：

- `content/papers/<slug>.md`
- `content/utility/papers-index.md`
- `data/paper-tags.json`
- 必要时修改 `data/authors.json`
- `Key figure decision: include` 时添加 `public/images/papers/<slug>/...`

研究主线保存在 `content/mainlines/<slug>.md`，不进入论文索引或标签。新增论文不自动更新主线；主线文章中的 `/papers/<slug>/` 链接声明成员关系并生成论文页回链。

## 索引与标签

`当前收录` 固定为 `简称 | 时间 | 核心信号` 三列。每篇论文恰好一行，按首次公开月份从新到旧排列，同月保持现有相对顺序。核心信号用一个可独立成立的自然语言句子说明研究对象、区别性机制和主要结果；省略某个边界会改变结论真值时，将该边界写入句子。

`data/paper-tags.json` 必须覆盖全部论文。每个数组包含一个主标签和最多三个辅助标签，标签 ID 来自 `data/tag-taxonomy.json`。新增标签前先检查首选名称和 aliases；标签拆分、合并或改名需要审计全部分配与站点锚点。

## 本地审阅状态

每篇论文头部声明 `Review-Status`：

- `pending`：分析已经归档，等待用户审阅；新增论文默认使用该状态。
- `approved`：用户已经确认核心贡献、直接证据、结论边界与局限，同时记录 `Reviewed-At: YYYY-MM-DD HH:mm`。
- `needs-review`：已审阅笔记在 `Reviewed-At` 之后发生实质更新，保留上次审阅时间并等待再次确认。

`pending` 不记录 `Reviewed-At`。`approved` 的 `Updated-At` 不得晚于 `Reviewed-At`；`needs-review` 的 `Updated-At` 必须晚于 `Reviewed-At`。排版、错字和链接维护不改变审阅状态。`/papers/` 通过 `?review=pending`、`?review=needs-review` 和 `?review=approved` 提供可收藏的筛选入口。

## 作者数据

作者身份和公开账号按 `internal/author-x-account-search-sop.md` 分层核验。`data/authors.json` 只保存稳定字段和来源；个人主页明确重点展示的论文保存在 `representativePapers`，并与构建器汇总的本站论文笔记分开。每个 profile 至少关联一篇剩余论文；删除或改名后运行反向完整性检查。

同名作者需要逐篇确认时使用 `matchByName: false`，并只在属于该作者的 `Source -> Authors` 中显式链接作者页。当前 schema 只允许同一规范化姓名下的一位 tracked profile。

## 公式

- 行内公式使用 `$...$`。
- 块级公式使用 `$$...$$`。
- equation、aligned 或 split 等环境外层仍使用 `$$...$$`。
- 数学表达式不放入反引号代码样式。
- 普通美元金额和 shell 变量使用代码样式，避免被公式解析器误判。
- 索引核心信号和 `一句话结论` 不使用公式或 TeX 数学定界符，相关机制与结果改用自然语言描述。

## 图片

每篇 v2.1 笔记在 `Source` 记录图片准入结果：

- `Key figure decision: include`：原材料存在能够解释首要贡献、机制、训练信号、主结论或失败边界的高价值图，正文至少嵌入一张本地图片。
- `Key figure decision: omit`：没有达到准入标准的图片，并用 `Key figure rationale` 说明信息价值、版权、安全或材料形态原因。

图片数量由信息价值决定。架构、系统路径、训练信号、主结论和失败边界图优先；装饰图和少量数字可完整转成表格时省略。综述中的 taxonomy、领域地图和概念层级图在能显著降低阅读成本时属于高价值图。

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

主线只响应用户明确的建立、更新、合并、拆分、改名或删除请求。文章使用 `synthesis-v1`，固定保存在 `content/mainlines/`。主线身份不依赖审阅状态；文章内容的 `pending`、`approved` 和 `needs-review` 沿用论文文章的时间顺序约束。

主线图片放入 `public/images/mainlines/<slug>/`。主线不分配 `data/paper-tags.json`，不写入 `content/utility/papers-index.md`，不计入论文数量。全局搜索和论文页回链由生成数据提供。

## 本地验证

```bash
npm run test:workflow
npm run check:workflow
npm run check:mainlines
npm run check:metadata
npm run check:math
npm run test:search
npm run test:pins
git diff --check
```

production build、生成页面检查和部署由 GitHub Actions 完成。`dist/` 与 `src/generated/` 不进入 commit。

## 提交

检查 `git status --short` 和完整差异，只 stage 当前任务文件。完整改动验证通过后创建本地 commit，不自动 push。提交完成后再次检查工作区，确认剩余内容属于其它任务或历史遗留。
