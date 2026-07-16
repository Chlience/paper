# 2026 CCF-A 会议论文目录维护指南

`/conferences/` 提供 2026 年 CCF-A 会议论文的快速检索入口。目录层保存会议、论文、展示类型、呈现方式、领域、核心贡献类型和来源状态；经过深度阅读的论文仍按现有论文存档工作流写入 `content/papers/`。目录论文可以通过 `notePath` 关联已有笔记。

## 收录边界

- CCF 基线固定为第 7 版目录快照，共 10 个领域、58 个 A 类会议。快照来源和发布日期记录在 `data/conferences/registry.json`。公开目录按当前研究重点排除 CVPR 与 ICCV，因此展示 56 个会议。
- `acm-sigops-atc` 按会议谱系将 ACM SIGOPS ATC 2026 映射到原 `USENIX ATC` 目录项。SIGOPS 官方确认社区与研究范围延续；CCF 官网尚未单独更新后继会议名称或评级，后续目录快照需要继续复核这项映射。
- 公开目录的自动采集覆盖 ACL、ICML、ASPLOS、USENIX Security。CVPR 的既有原始数据和适配器继续保留，用于审计或显式同步；其余会议先保留在 registry 中，通过覆盖状态说明 2026 年数据是否可用。
- 论文范围限定为主会 Main Full/Regular paper。Findings、short paper、demo、workshop、industry companion track 等条目不进入目录。
- 数据源优先使用会议官网、官方 proceedings、ACL Anthology、CVF Open Access、OpenReview 或主办方公开的结构化数据。聚合站点可以用于排查数量差异，不能作为落库来源。
- `presentationTypeNormalized` 将官方展示标签归并为 `oral`、`featured`、`poster`、`other` 和 `unknown`。Spotlight 与 Highlight 的原始称呼保存在 `presentationTypeRaw`，统一归入 `featured`。
- `presentationModeNormalized` 独立记录 `in-person`、`virtual`、`hybrid`、`proceedings-only`、`other` 和 `unknown`。该字段描述呈现或参会方式，不参与展示层级排序。
- 页面层级筛选只列出 Oral、Spotlight/Highlight、Poster 三项；`other` 和 `unknown` 继续保存在数据层，用于来源审计和后续映射更新。
- `recognition` 独立保存 Best Paper、Honorable Mention 等荣誉，避免与 oral/poster 展示等级混合。
- 自动分类用于检索和初筛。领域、贡献类型和核心贡献摘要仍需在高价值论文进入深度笔记时人工复核。

## 数据布局

### Registry 与 taxonomy

`data/conferences/registry.json` 是会议主数据：

- `ccfSnapshot`：CCF 目录版本、发布日期、勘误日期和官方链接。
- `catalogScope`：公开目录排除的会议 ID。当前为 CVPR 与 ICCV；完整 CCF 基线仍保留 58 个会议。
- `areas`：10 个 CCF 领域及稳定 ID。
- `venues`：58 个 A 类会议；每条包含稳定 `id`、简称、全称、CCF 领域、出版社、DBLP 链接和 `edition2026` 配置。
- `edition2026`：2026 届状态、官网、accepted-list 链接和适配器标识。`adapter-pending` 表示 registry 已覆盖，采集适配器仍待接入。

`data/conferences/latest-editions.json` 保存完整 58 个会议在 2026 目录年度内的最新完整届次，包括年份、主论文截稿文本、正式会期和官方来源 URL。多轮或滚动投稿保留官方口径；只有同时公布截稿与会期的届次才进入该快照。公开目录的 56 个会议必须使用 2026 届；排除但保留用于审计的原始会议可以回退到更早的最新完整届次，当前只有双年会 ICCV 使用 2025 届。构建与校验会按 venue ID 连接日期快照，并拒绝缺项、未知会议、公开会议旧届次、未来届次、无来源和无效日期范围。

`data/conferences/taxonomy.json` 保存页面筛选使用的领域和核心贡献类型。领域与 CCF 大类分开维护：CCF 大类描述会议归属，taxonomy 描述单篇论文的研究主题。贡献类型包括方法、系统、模型架构、理论、数据集/基准、评测、实证分析、工具、应用、综述等。

### 年度数据集

每个已接入会议对应一个 `data/conferences/2026/<venue-id>.json`，主体结构如下：

```json
{
  "schemaVersion": 2,
  "year": 2026,
  "venueId": "icml",
  "coverageStatus": "published",
  "source": {
    "url": "https://official.example/accepted-papers",
    "adapter": "official-source-adapter",
    "contentHash": "sha256...",
    "lastSuccessfulSyncAt": "2026-07-15T00:00:00.000Z"
  },
  "papers": []
}
```

论文记录的主要字段分成四组：

| 组 | 字段 | 含义 |
| --- | --- | --- |
| 标识 | `id`, `officialId`, `venueId`, `year` | `id` 由会议、年份与官方 ID 生成；官方 ID 缺失时使用规范化标题生成稳定哈希 |
| 原始事实 | `title`, `authors`, `trackRaw`, `presentationTypeRaw`, `presentationModeRaw`, `recognition`, `publicationStatus`, `paperUrl`, `pdfUrl` | 适配器从官方来源提取的论文事实 |
| 规范化 | `trackNormalized`, `presentationTypeNormalized`, `presentationModeNormalized`, `status` | 两个展示轴及其他统一枚举，供校验和页面筛选 |
| 可用性 | `authorStatus`, `abstractStatus` | 上游暂缓公开作者或摘要时保存 `embargoed`，对应字段保持为空，避免把占位文本当作论文事实 |
| 分类与溯源 | `domains`, `primaryDomainId`, `contributionType`, `coreContribution`, `classificationConfidence`, `classifierVersion`, `sourceUrl`, `firstSeenAt`, `lastSeenAt` | 规则分类结果、来源和增量观察时间 |

`src/generated/conference-data.json` 由 `npm run build:conferences` 生成，包含页面需要的扁平论文列表、56 个公开目录会议的覆盖状态和预计算 facet。该文件位于 `.gitignore`，部署和本地开发都会重新生成。页面 HTML 只内嵌默认排序的前 30 篇；`/data/conference-papers-2026.json` 在构建时生成瘦身查询索引，浏览器异步加载后启用完整筛选，避免把全量数据写入首屏 HTML。网络请求失败时页面进入“首批数据模式”，仍可筛选已内嵌记录，并明确显示该模式的实际记录数。

覆盖表的状态列只显示同步状态；最新一届时间列显示 2026 目录年度内最新完整届次的主论文截稿与正式会期，并链接官方日期依据。表格同时显示每场会议已提取核心贡献的论文数。会议 roster 可以完整发布，而摘要仍处于部分公开状态；此时 roster 状态维持“已同步”，核心贡献列用于说明自动分类的可用范围。

## 适配器

已接入来源使用以下适配方式：

- ACL：以 ACL Anthology 的 `2026.acl-long` 官方卷为录用主清单，并与官方公开日程表合并摘要及两个展示轴。`Underline/Whova Session Name` 提供 Oral/Poster 类型，`Presentation mode` 提供 In-Person/Virtual 方式；Virtual session 没有对应 Oral/Poster 信息时，展示类型保留 `unknown`。标题包含 TeX、上标或少量官方拼写差异时，适配器仅对未匹配条目执行高阈值、唯一候选的 token 相似度回退。`2026.acl-short` 的 short papers 不进入目录。
- CVPR：适配器与原始数据仅用于历史审计或显式同步，公开目录和默认定时同步均排除该会议。数据以官方 presentation 日程表为录用主清单，用 CVF Open Access 和 CVPR 官方 Miniconf JSON 补充出版状态、论文链接与摘要。
- ICML：读取 ICML 官方 Miniconf JSON，合并同一标题的 poster/oral 事件，仅保留 `ICML.cc/2026/Conference` Main Conference。独立 Position Paper Track、TMLR、Annals of Statistics 等受邀轨道均排除。
- ASPLOS：读取官方 program 页面中的 research-paper session，提取标题、作者和日程支持的展示信息。当前页面没有逐篇稳定 ID 和摘要，ID 暂由规范化标题生成；标题更正可能需要在更新 PR 中人工迁移旧记录。
- USENIX Security：读取官方 accepted-papers / technical-sessions 页面，保留官方论文链接、摘要和日程信息；独立 poster track 不进入主会论文集。HTML 注释与 embargo 占位文本在解析入口移除，未公开作者或摘要通过状态字段表达。

适配器应输出统一的原始论文对象：

```js
{
  officialId,
  title,
  authors,
  abstract,
  sourceTopics,
  trackRaw,
  presentationTypeRaw,
  presentationModeRaw,
  recognition,
  publicationStatus,
  authorStatus,
  abstractStatus,
  status,
  sourceUrl,
  paperUrl,
  pdfUrl
}
```

`title`、作者信息和官方来源 URL 是最低可用信息。作者列表为空仅允许用于官方明确标记 `authorStatus: "embargoed"` 的记录。摘要与 topic 会提高自动分类质量；摘要仍处于封存状态时写入 `abstractStatus: "embargoed"`，并保持摘要与核心贡献为空。适配器需要在写入前确认条目属于 Main Full/Regular 范围，并对异常低数量、解析为空或页面结构变化直接报错。

## 增量更新语义

同步过程按以下顺序执行：

1. 从 registry 选择公开目录范围内已配置的 2026 适配器，并抓取官方来源。使用 `--venue` 显式指定时可以同步保留的范围外原始数据。
2. 解析原始条目，合并同一论文的多个日程事件，过滤范围外 track。
3. 规范化标题、作者、track、展示类型、呈现方式和状态，生成稳定论文 ID。
4. 使用 `taxonomy.json` 对标题、摘要和官方 topic 运行确定性规则分类，并提取一条核心贡献句。分类器使用完整词或短语匹配，并为 ACL、CVPR、ICML、ASPLOS、USENIX Security 加入对应会议主领域先验；充分的跨领域证据仍可覆盖该先验。
5. 按论文 ID 与已有数据合并。首次发现写入 `firstSeenAt`；论文事实发生变化或从 `source-missing` 恢复时更新 `lastSeenAt`。数据集级 `lastSuccessfulSyncAt` 记录最近一次产生数据变更的成功同步时间；无内容变化的定时检查只保留在 Actions 日志中，从而避免空更新 PR。
6. 官方源暂时缺少既有论文时，将条目标记为 `source-missing` 并保留记录，便于人工判断页面分批发布、临时故障或撤稿。官方明确撤稿时使用 `withdrawn`。
7. 根据规范化结果计算 source content hash。内容未变化时保持数据文件稳定，定时任务不会制造空更新 PR。
8. 校验 58 个 registry 基线条目、56 个公开目录条目、唯一 ID、枚举、Main Full/Regular 边界和来源字段，再生成页面数据并执行完整站点构建。

抓取或校验失败会终止工作流。已有仓库数据继续可用，失败任务不会创建更新 PR。

## 本地运行

首次运行或依赖有变化时安装锁定依赖：

```bash
npm ci
```

抓取已配置会议并更新年度数据集：

```bash
npm run sync:conferences
```

排查解析器时可以复用已下载的官方原始文件，避免重复请求上游。设置 `CONFERENCE_SOURCE_CACHE_DIR` 后，适配器会按维护脚本中的固定文件名读取缓存，缺失文件仍回退到官方 URL：

```bash
CONFERENCE_SOURCE_CACHE_DIR=/tmp npm run sync:conferences -- --venue acl,icml
```

校验 registry、taxonomy、年度数据和筛选逻辑：

```bash
npm run check:conferences
```

只生成页面消费的数据：

```bash
npm run build:conferences
```

`npm run dev` 与 `npm run build` 已包含 conference data build。提交数据变更前建议按 CI 顺序运行：

```bash
npm run sync:conferences
npm run check:conferences
npm run build
```

## 定时任务与审核

`.github/workflows/sync-conferences.yml` 每周一 04:17 UTC（台北时间 12:17）运行，也支持 `workflow_dispatch` 手动触发。任务使用 Node.js 22 和 `npm ci`，默认跳过 `catalogScope` 中的 CVPR 与 ICCV，随后依次校验、构建，并通过 `peter-evans/create-pull-request` 更新固定 bot 分支及其 PR。

固定 bot 分支存在未合并 PR 时，下一次任务会先恢复该分支相对基线新增或修改的年度数据，再读取最新官方来源。这样可以让跨周待审 PR 中的 `firstSeenAt` 保持为首次 bot 发现时间，同时继续使用默认分支上的最新适配器与 taxonomy。无内容变化时 action 不创建新 PR；已有 bot PR 与默认分支无差异时会关闭该 PR，并按配置清理分支。

工作流只授予 `contents: write` 和 `pull-requests: write`。仓库还需要在 **Settings → Actions → General → Workflow permissions** 中允许 GitHub Actions 创建 pull request。自动 PR 只暂存 `data/conferences/2026/*.json`；registry、taxonomy、适配器和页面代码继续走普通人工提交。

合并前重点检查：

- 接受论文总数的变化是否与官方公告或分批发布时间一致。
- `source-missing`、`withdrawn` 和新增论文是否有合理来源。
- Oral、Spotlight/Highlight、Poster 类型以及 In-person、Virtual 方式的变化是否来自官方日程更新。
- Main Full/Regular 边界是否保持，尤其关注同页混排的 Findings、short、demo 和 workshop。
- 自动分类低置信度条目与核心贡献句是否仍适合检索。
- 来源 URL、论文 URL、同步时间和 adapter 标识是否完整。

人工合并保留在流程中。官方页面结构变化、数量突变或分类规则调整都可以在 PR 中发现并修正。

## 接入下一场会议

1. 在 `registry.json` 对应 venue 的 `edition2026` 中补齐官网、accepted-list URL、覆盖状态和稳定 adapter 标识。
2. 优先寻找官方 JSON、XML、BibTeX 或 proceedings API。HTML 页面适配器需要使用明确的结构选择器，并为页面改版准备失败保护。
3. 将官方字段映射到统一原始论文对象，明确 Main Full/Regular 的判断规则，以及展示类型和呈现方式各自的信息来源。
4. 增加解析与规范化测试，至少覆盖重复事件合并、范围外 track 过滤、缺失展示类型或呈现方式、稳定 ID 和异常低数量。
5. 运行同步、校验和完整构建，检查年度 JSON diff 与页面筛选结果。
6. 在本文的适配器列表中补充来源、边界判断和已知缺口。

会议官网先公布标题、随后补齐摘要或展示信息的情况很常见。适配器可以逐步丰富同一稳定 ID 的字段，增量合并会保留首次发现时间并更新最新观察时间。
