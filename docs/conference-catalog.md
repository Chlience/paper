# CCF-A 会议目录维护指南

`/conferences/` 是一个轻量的会议信息目录。页面展示 CCF-A 会议的稳定元数据、最新届次、主论文截稿时间、正式会期和官方 Accepted Papers 入口，便于快速查看会议状态并跳转到官方论文列表。

目录不保存会议论文记录，也不抓取标题、作者、摘要、Oral/Poster 等逐篇信息。页面不提供论文关键词检索、分面筛选、分页查询或全量论文 JSON。

## 收录边界

- CCF 基线固定为第 7 版目录快照，共 10 个领域、58 个 A 类会议。快照来源和发布日期记录在 `data/conferences/registry.json`。
- 公开目录按 `catalogScope.excludedVenueIds` 应用展示范围。当前排除 CVPR 与 ICCV，页面展示 56 个会议；完整 CCF 基线仍保留 58 个会议。
- `acm-sigops-atc` 按会议谱系将 ACM SIGOPS ATC 映射到原 `USENIX ATC` 目录项。后续 CCF 目录快照发生变化时，需重新复核该映射。
- 最新届次优先使用会议或主办学会官方页面核对。多轮、滚动投稿和多会场会期保留官方口径，并在 `note` 中说明。
- `acceptedPapersUrl` 只指向会议官网、官方 proceedings、官方虚拟会议页或主办方认可的论文列表。官方尚未公布或链接尚待核验时保持为空，页面显示“待补充”。

## 数据布局

会议目录只使用两个源文件。

### `data/conferences/registry.json`

Registry 保存跨届次稳定的会议事实：

- `ccfSnapshot`：CCF 目录版本、发布日期、勘误日期和官方来源。
- `catalogScope`：公开页面排除的会议 ID。
- `areas`：CCF 领域及其稳定 ID。
- `venues`：会议的稳定 `id`、简称、全称、CCF 领域、等级、出版方和 DBLP 会议流入口。

Registry 不保存年份绑定的抓取器、同步状态或论文数据集配置。

### `data/conferences/latest-editions.json`

Latest editions 按 venue ID 保存页面展示的最新届次信息：

```json
{
  "schemaVersion": 2,
  "verifiedAt": "2026-07-16",
  "venues": {
    "icml": {
      "year": 2026,
      "submissionDeadline": "2026-01-28 AoE",
      "conferenceDates": "2026-07-06–2026-07-11",
      "acceptedPapersUrl": "https://icml.cc/virtual/2026/papers.html",
      "sourceUrls": [
        "https://icml.cc/Conferences/2026/CallForPapers"
      ],
      "confidence": "high",
      "note": "ICML 2026 main conference full paper。"
    }
  }
}
```

- `year`：最新可核对届次的年份。
- `submissionDeadline`：主论文截稿文本；多轮或滚动投稿保留完整轮次。
- `conferenceDates`：正式会期，使用 `YYYY-MM-DD–YYYY-MM-DD` 范围。
- `acceptedPapersUrl`：官方 Accepted Papers 或正式论文列表，未公布时使用空字符串。
- `sourceUrls`：用于核对截稿、会期和届次的官方依据。
- `confidence`：对当前届次信息完整性的维护信心。
- `note`：记录多轮截稿、会期范围、会议谱系或来源口径。

页面构建时按 venue ID 连接 registry 与 latest editions。两个文件必须保持 venue ID 唯一且完整对应。

## 页面行为

- `/conferences/` 的构建步骤连接两个元数据文件，生成轻量静态目录；页面不依赖运行时数据库或外部 API。
- 每个会议显示简称、全称、CCF 领域、最新届次、截稿、会期、日期依据和 Accepted Papers 入口。
- 会议按 `submissionDeadline` 中最早的完整 `YYYY-MM-DD` 日期升序排列。多轮投稿取最早一轮；缺少完整日期的条目排在末尾，并按会议简称稳定排序。
- 页面只输出会议级信息。仓库中不再维护 `data/conferences/<year>/` 论文数据集、论文 taxonomy、预计算 facets 或会议论文查询 JSON。
- Accepted Papers 链接使用 HTTP(S) 安全检查后输出，并保留官方 URL，便于用户判断列表范围和版本。

## 更新流程

会议元数据通过普通代码变更人工维护：

1. 从会议官网或主办学会页面确认最新届次、主论文截稿和正式会期。
2. 更新 `latest-editions.json` 的对应条目与 `verifiedAt`，在 `sourceUrls` 保留官方依据。
3. 官方公布录用论文后，补充 `acceptedPapersUrl`。链接应直达当届的官方列表，避免使用搜索结果页、非官方聚合页或单篇论文页。
4. 新增或调整会议身份、CCF 领域或公开目录范围时，同步更新 `registry.json`，并确认 `latest-editions.json` 存在同 ID 条目。
5. 运行会议元数据校验和完整静态站点构建，检查页面数量、日期、空链接状态和官方跳转。

会议目录不运行论文抓取适配器、周期性论文同步或自动论文数据 PR。上游页面改版不会触发本仓库对论文条目的增删。

## 与论文存档的边界

`content/papers/` 继续使用独立的论文阅读和 Markdown 存档工作流。会议目录的轻量化不改变以下任何内容：

- 单篇论文笔记 `content/papers/<slug>.md`。
- 论文存档索引 `content/utility/papers-index.md`。
- 论文分析流程 `content/utility/paper-analysis-workflow.md` 与笔记模板 `content/utility/paper-note-template.md`。
- 作者稳定事实与作者页数据 `data/authors.json`。
- 论文页、作者页、主题页、存档索引和站内论文搜索的构建与校验。

深度阅读一篇会议论文时，仍按论文存档工作流新增笔记。该笔记由内容建模、作者关系和跨论文链接管理，不回写会议目录或形成另一份会议论文数据。
