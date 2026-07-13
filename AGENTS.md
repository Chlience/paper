@/home/chlience/.codex/RTK.md
@/home/chlience/.codex/first_principles.md
@/home/chlience/.codex/git_commit.md

## 写作语气

- 中文输出避免使用先否定前项、再强调后项的对照句式。
- 避免通过否定别人或否定前项来强调观点。
- 优先使用直接、顺承、解释型表达。
- 例如，优先写“它由一条多阶段流水线组成”。

## 论文存档工作流

- 本目录只服务论文阅读、分析、作者关系跟踪和 Markdown 存档。
- 分析任何论文前，先查看 `content/utility/paper-analysis-workflow.md`。
- 新增论文笔记时，使用 `content/utility/paper-note-template.md` 的章节结构。
- 每篇论文必须沉淀为 `content/papers/<slug>.md`，并在 `content/utility/papers-index.md` 的 `当前收录` 表中保留唯一一行。表格固定使用 `简称 | 时间 | 核心信号` 三列；核心信号从 `一句话结论` 提炼为一条聚焦核心贡献的完整句子，不能写成 Theme 式关键词列表。
- 每篇论文必须包含 `Source`、`作者与关系`、`一句话结论`、`论文脉络`、`关键实验/定理`、`局限`、`跨论文关系`、`Reference Intake Brief`。
- 每篇论文阅读后的交流环节必须提炼并回写到对应 Markdown，优先放入 `本地讨论补充`；若交流内容改变跨论文关系或主题判断，同步更新对应论文的 `跨论文关系`，核心信号发生变化时再更新 `content/utility/papers-index.md`。
- 作者关系分析必须覆盖：作者机构、同机构关系、跨机构桥接、与已存档论文作者是否重叠、主题或引用关系。
- 完成每篇论文的 `作者与关系` 后，必须执行作者 profile pass：按 `internal/author-x-account-search-sop.md` 检索和交叉验证 homepage、GitHub、Scholar/DBLP/OpenReview、机构页和 X 候选，并据此更新 `data/authors.json`。搜索过程、候选账号、跳过原因和 `xConfidence` 不写入论文 Markdown；需要暂存时使用 `/tmp` 或未跟踪中间文件。
- 若新增论文和已有论文存在作者重叠、同一实验室连续产出、共同机构、主题延展、引用或方法复用，必须写入对应论文的 `跨论文关系`。
- `content/utility/papers-index.md` 只维护 `当前收录` 表及其简称、首次公开月份和核心信号。单篇作者关系与跨论文关系写入对应论文，稳定作者事实写入 `data/authors.json`。
- 删除论文时必须同步删除 `当前收录` 行，并在剩余论文的 `跨论文关系` 中删除或修订失效描述，同时审计 `data/authors.json`。作者 profile 在剩余论文中没有作者链接、姓名或别名关联时，必须在同一提交中删除；孤立作者会触发工作流硬错误。
- 论文笔记和 `content/utility/papers-index.md` 中指向已存档论文的 Markdown 链接必须使用站点路径 `/papers/<slug>/`；主题路由使用 `/topics/#tag-<id>`；工作流、模板、索引页面链接分别使用 `/workflow/`、`/template/`、`/archive/`；本地文件名用代码样式保留。
- 对安全或双用途论文，保留机制、风险、评测和防御启发，避免沉淀可直接滥用的操作细节。
- 以后所有完整改动在完成验证后必须创建本地 commit；`push` 只在用户明确要求时执行。
