@/home/chlience/.codex/RTK.md
@/home/chlience/.codex/first_principles.md
@/home/chlience/.codex/git_commit.md

## 写作语气

- 中文输出避免使用先否定前项、再强调后项的对照句式。
- 避免通过否定别人或否定前项来强调观点。
- 优先使用直接、顺承、解释型表达。例如，优先写“它由一条多阶段流水线组成”。
- 避免空泛、拟人化或用力过猛的修辞词，优先使用具体动作、状态、变量和结果。
- 中文技术术语先做目标领域词汇化检验：判断依据取自中文论文、文档和技术社区的实际使用状态；单个偶发用例只作弱证据，缺少充分证据时按未归一化处理。
- 未归一化的词按实际功能改写：实验分组写为“实验组/对照组/实验设置/系统配置/方法变体”，流程组成写为“阶段/环节/路径/分支”，结果地位写为“主要结果/汇总结论”，剩余能力或空间写为“余量/可优化空间”。
- 术语首次出现且功能性改写可能丢失与原文对应关系时，在中文译名或改写后以括号附英文原词。
- 直译词已是目标领域既定术语时直接保留；逐字引用中文原文时保留原词，逐字引用英文原文时保留英文。
- LLM、机器学习与系统论文中的 `experimental/study arm` 通常写为“实验组”“对照组”“实验设置”“系统配置”或“方法变体”；“臂”保留于多臂老虎机、临床试验既定术语或原文引用。

## 论文阅读与归档

- 本目录服务论文阅读、分析、作者关系、研究主线和 Markdown 存档。单篇科学判断以 `content/utility/paper-analysis-workflow.md` 为规范来源；归档骨架使用 `content/utility/paper-note-template.md`，模块细则见 `internal/paper-analysis-modules.md`，仓库操作见 `internal/paper-archive-maintenance-sop.md`。
- 分析、总结、解释默认 `analysis-only`，不修改仓库；归档、保存或提交尚未归档的分析使用 `archive-core`。`enrichment` 只限定用户要求或会改变核心判断的补充证据，不单独授予写入权限。研究方向综合使用 [综合 SOP](/synthesis-workflow/) 与 [主线模板](/mainline-template/)。
- 新笔记声明 `Workflow version: v3`；既有 legacy、v2、v2.1 按冻结范围兼容。达到实质回写条件时迁移，纯排版维护保留原契约。`internal/paper-workflow-v21-slugs.json` 和原方法总览基线只随迁移缩减，不接纳新材料。
- 先固定用户问题与所读版本，再重建机制、检验主张、收缩结论。`Reading scope` 如实记录实际读取范围和影响判断的缺口，区分未读、未披露和访问失败；来源不足以回答时交付已确定部分，不宣称完成整篇分析。
- `论文脉络` 是最重要的分析正文。总览独立解释首要贡献、必要辅助贡献、完整执行链或论证链、对象角色与最终输出或训练信号；详解展开关键操作、设计理由和成立边界，必要时给出可映射回定义的具体例子。使用 `贡献与方法总览` 入口，位置、编号和阶段拆分按解释需要决定，不要求推测作者心理过程。
- 每项核心证据记录 `证据定位`、`观察`、`判别性与局限`、`支持的最窄结论`。检查比较口径、关键替代解释和反例；区分事实、作者解释、本地判断与外推。结论和索引核心信号对齐首要贡献，使用独立自然语言句子，不使用公式、TeX 定界符或关键词列表。
- `主要启发` 可选，要求有来源的认识变化、证据和成立边界；没有独立认识更新时省略，不设数量或段落配额。迁移有具体目标时说明抽象关系与可证伪预测，不把缺少区分性证据的机制猜测写成稳定判断。
- `archive-core` 保留作者块、论文时机构、本地重名检查与已有 profile；普通作者只复用已有 profile。作者 `enrichment` 限定“指定作者 × 指定字段”，完整作者关系或 profile 完善请求才扩展到作者顺序前两位、明确共同一作和通讯作者。代表论文仅按已授权字段和已核验主页写入 `representativePapers`。
- 公开审稿按实际读取状态记录；未核验使用 `not-checked`，检索未匹配使用 `not-found`，访问失败使用 `unavailable`。正式评审只归纳已读材料，不由 decision 推断 reviewer 共识。无明确待解问题时不扩大检索。
- 后续交流仅在归档授权下按语义回写当前笔记的机制、证据、局限、跨论文关系或主要启发，不新增 `本地讨论补充`。旧笔记只在事实纠错、一句话结论真值变化或用户明确要求维护时回写；新增论文不自动更新主线。
- 本地 `Review-Status` 只使用 `pending` 和 `approved`。新增笔记使用 pending 且无 `Reviewed-At`；用户确认后 approved 并记录分钟精度的 `Reviewed-At`。后续修订保留原有 `Review-Status` 和 `Reviewed-At`；仅实质内容变化更新 `Updated-At`，审阅动作只更新审阅字段。v3 允许同一分钟归档多篇，时间如实记录。
- 归档更新论文文件、唯一索引行和一个主标签加最多三个辅助标签。删除论文必须先二次确认，再同步处理索引、标签、失效关系、主线引用、图片和无剩余论文关联的 profile。

## Model Summary 结构

- 模型技术报告、模型发布仓库等材料的 `Model Summary` 优先采用紧凑的 `Field | Value` 两列表格，字段顺序参考 K3 GitHub：

  | Field | Value |
  | --- | --- |
  | Architecture | ... |
  | Total Parameters | ... |
  | Activated Parameters | ... |
  | Number of Layers | ... |
  | Number of Dense Layers | ... |
  | Attention-Layer Composition | ... |
  | Attention Hidden Dimension | ... |
  | Number of Attention Heads | ... |
  | Latent MoE Dimension | ... |
  | MoE Hidden Dimension (per Expert) | ... |
  | Number of Experts | ... |
  | Selected Experts per Token | ... |
  | Number of Shared Experts | ... |
  | Vocabulary Size | ... |
  | Context Length | ... |
  | Attention Mechanism | ... |
  | Activation Function | ... |
  | Vision Encoder | ... |
  | Parameters of Vision Encoder | ... |
  | Quantization | ... |
  | Modality | ... |

- 按具体模型保留适用字段；架构特有且影响理解或部署的配置可在相邻位置补充。官方材料未披露的关键字段写为“未披露”，本地推导值明确标注统计口径和证据来源。
- 总参数与激活参数、模型隐藏维度与注意力隐藏维度、MoE 潜空间与单专家隐藏维度、专家总数与每 token 选中专家数及共享专家数分别记录。量化项同时说明权重、激活值和量化感知训练状态；模态单列。

## 研究主线工作流

- 用户明确提出某个方向的总结、综述、进展或时间线请求时，直接建立一条正式主线；一次请求对应一条主线，不自动合并、拆分或改名。
- 主线保存在 `content/mainlines/<slug>.md`，公开路径为 `/mainlines/<slug>/`，使用 `content/utility/research-synthesis-workflow.md` 与 `content/utility/research-mainline-template.md` 的 `synthesis-v1` 独立结构。
- 主线标题和 slug 保持日期无关；检索时间窗、截止分钟、版本变化和时间阶段写入文章内部。
- 主线文章是问题、边界、分类、材料、证据强度和当前判断的唯一事实来源。每条主线使用自己的主题专属分类框架，不维护全局 facet。
- 主线身份无需审阅；文章内容使用 `pending` 和 `approved`，后续修订保留原有审阅状态与审阅时间。普通论文新增不会自动更新主线，只有用户明确要求时更新。
- 主线不进入论文索引、论文标签、论文数量或论文审阅筛选；进入全局检索。本地 `/papers/<slug>/` 链接声明成员关系，同一论文可进入多条主线，论文页回链由构建器生成。
- 主线可直接纳入外部原始材料。单篇笔记保留局部证据，主线保存规范化跨材料比较与逐结论证据强度。
- 主线固定章节为 `Source`、`综合判断`、`核心问题与边界`、`分类框架`、`演进脉络`、`跨材料比较`、`证据强度`、`当前判断`、`开放问题`、`局限`、`更新记录`。

## 通用发布规则

- v3 单篇笔记与 synthesis-v1 主线均在 `Source` 声明 `Key figure decision: include|omit`；`include` 至少嵌入一张带 `Image Source` 的本地图片，`omit` 必须填写 `Key figure rationale`。
- 站点链接使用 `/papers/<slug>/`、`/mainlines/<slug>/`、`/topics/#tag-<id>`、`/workflow/`、`/synthesis-workflow/`、`/template/`、`/mainline-template/` 和 `/archive/`。
- 安全或双用途材料保留机制、风险、评测和防御启发，避免沉淀可直接滥用的操作细节。
- 提交前由主执行者完成一次合并科学自审，检查回答对齐、机制复述、证据判别、结论校准和来源范围。核心证据冲突、结论高风险或用户明确要求独立复核时再启用独立审查者；只有修改作者档案或其它增强元数据时才增加元数据审计。自动检查不能替代人工判断。
- 修改强制工作流要求时，同步检查本文件、SOP、模板、验证器、测试和至少一个新契约 fixture 或真实 canary。
- 完整改动验证后创建本地 commit；`push` 只在用户明确要求时执行。

## 高危操作确认

- 执行递归删除、整目录删除、大范围清理、覆盖移动、不可逆 Git 操作或其它可能造成数据丢失的命令前，必须向用户二次确认。
- 用户确认前只做只读检查和风险说明；确认信息列出绝对路径、操作类型和主要风险。
