// Synthetic source and observations for contract tests; these are not archived research claims.
export const v3Paper = `# Deterministic parse cache — synthetic fixture

First-Archived-At: 2026-09-05 09:00
Updated-At: 2026-09-05 09:00
Review-Status: pending

## Source

- Workflow version: v3
- Material type: framework-docs
- Analysis modules: docs, system
- Canonical source: https://example.org/parse-cache/v1
- Title: Deterministic parse cache — synthetic fixture
- Responsible organization: Fixture authors
- Published / updated: 2026-09-05
- Version / revision read: v1, https://example.org/parse-cache/v1
- Accessed: 2026-09-05
- Reading scope: 虚构规范 Section 1–3 的完整示意；没有实际论文或性能测量，仅用于验证归档契约。
- Key figure decision: omit
- Key figure rationale: 四次调用的示意可用文字完整表达。
- Review status: page-type=not-checked; match-confidence=not-applicable; observed-at=2026-09-05; venue-status=unknown

## 一句话结论

在输入、解析器版本和配置共同确定解析结果且返回对象不可变的条件下，缓存已解析结果可以减少重复解析调用，实际时间收益仍需测量。

## 论文脉络

### 贡献与方法总览

该设计把重复解析替换为对不可变结果的复用。请求带入文本、版本与配置，用三者共同组成键；命中时返回已保存的语法树，未命中时调用确定性解析器并保存结果，再返回同一结果。缓存内容属于运行时状态，解析器代码保持不变。这个接口保持解析结果，并减少相同键重复进入解析器的次数；它没有给出时延保证。定义与行为见 Section 2。

#### 缓存为何保持结果

键相同意味着决定解析结果的三项输入相同，确定性解析器必然返回相同树。不可变性确保一次调用不会污染后续返回。配置缺失于键或解析器依赖未记录的外部状态时，该等价关系不成立。缓存查找与存储仍有成本，调用次数下降不能单独证明时间下降。

### 问题与边界

该示意只考察单进程顺序调用中的重复工作，未定义并发、淘汰或持久化策略。

## 关键实验/定理

### 相同键的重复调用可以复用解析结果

- 证据定位：Section 2 定义，Section 3 的四次调用示意，https://example.org/parse-cache/v1#example
- 观察：本地示意演算中，请求顺序为 x、y、x、y，版本与配置保持一致，缓存初始为空；直接路径调用解析器四次，缓存路径调用两次，返回的树序列相同。这不是实测性能数据。
- 判别性与局限：演算固定输入、解析器和配置，仅比较是否复用结果；确定性与不可变性支持输出等价。它未计入查找和存储成本，不能识别实际时延收益。
- 支持的最窄结论：在上述条件和请求序列下，复用保存结果把解析器调用数从四次降到两次，并保持返回值。

## 局限

状态依赖、可变返回值或不完整缓存键会破坏等价性；该示意没有测量时间、内存和并发行为。

## 作者与关系

Fixture authors 为虚构规范责任主体，没有个人作者或机构映射。

## 跨论文关系

暂无高置信跨论文关系。
`;

export const v3TheoryPaper = v3Paper
  .replace('Material type: framework-docs', 'Material type: research-paper')
  .replace('Analysis modules: docs, system', 'Analysis modules: theory')
  .replace('### 相同键的重复调用可以复用解析结果', '### 固定键和不可变结果足以保证命中结果一致')
  .replace(/- 观察：[^\n]+/, '- 观察：Section 2 假设结果由完整缓存键唯一确定且不可变；对相同键，命中路径返回此前对该键计算的值，因而与再次调用确定性解析器的值相同。')
  .replace(/- 判别性与局限：[^\n]+/, '- 判别性与局限：这是给定假设下的等价性推导；若键遗漏配置，则相同键可对应不同解析结果，证明前提不再满足。该结论不蕴含时间或内存收益。')
  .replace(/- 支持的最窄结论：[^\n]+/, '- 支持的最窄结论：完整键、确定性和不可变性足以保证命中时返回值与重算一致。');

export const v3Insight = `
## 主要启发

### 缓存键需要覆盖决定结果的外部条件

Section 2 的键定义使原先只按文本识别重复输入的判断增加了版本与配置条件；这两项变化都可能改变同一文本的解析结果，因此缓存的等价类必须由完整决定条件定义。这个判断限于确定性计算和不可变返回值；共享可变结果还需要单独处理状态隔离。
`;
