import path from 'node:path';
import MarkdownIt from 'markdown-it';
import {
  authorProfileIsReferenced,
  collectAuthorReferences,
  normalizeAuthorKey,
  splitAuthorNames,
} from './authors.mjs';
import { getFirstArchivedAt, getSection, getSourceField, getSourceFieldRaw, getTopLevelField } from './markdown.mjs';
import { PAPER_REVIEW_STATUSES } from '../../src/lib/paper-review.mjs';

export const REQUIRED_SECTION_GROUPS = [
  { name: 'Source', headings: ['Source'] },
  { name: '作者与关系', headings: ['作者与关系'] },
  { name: '一句话结论', headings: ['一句话结论'] },
  { name: '论文脉络', headings: ['论文脉络'] },
  {
    name: '关键实验/定理',
    headings: ['关键实验/定理', '关键实验结果', '主要实验结果', '关键定理', '文献扫描结果', '方法论论证'],
  },
  { name: '局限', headings: ['局限', '局限与待验证问题'] },
  { name: '跨论文关系', headings: ['跨论文关系'] },
];

export const V2_REQUIRED_SECTION_GROUPS = [
  ...REQUIRED_SECTION_GROUPS,
  { name: '证据链强度评估', headings: ['证据链强度评估'] },
  { name: 'OpenReview / 审稿意见吸收', headings: ['OpenReview / 审稿意见吸收'] },
  { name: '主要启发', headings: ['主要启发'] },
];

export const MATERIAL_TYPES = new Set([
  'research-paper',
  'technical-report',
  'model-card',
  'survey',
  'blog',
  'framework-docs',
]);

export const REVIEW_PAGE_TYPES = new Set([
  'official-review',
  'metadata-only',
  'proceedings',
  'commentary',
  'not-found',
  'not-applicable',
]);

export const ANALYSIS_MODULES = new Set([
  'experiment',
  'system',
  'theory',
  'model-report',
  'survey',
  'safety',
  'docs',
]);

const evidenceSectionGroup = REQUIRED_SECTION_GROUPS.find((group) => group.name === '关键实验/定理');

const exactMinutePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const exactDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const paperReviewStatusSet = new Set(PAPER_REVIEW_STATUSES);
const absoluteUrlPattern = /https?:\/\/[^\s)>；，。]+/gi;
const internalPaperPathPattern = /\/papers\/([^/#?\s)]+)\//g;
const markdownImagePattern = /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g;
const textualEvidenceLocatorPatterns = [
  /§\s*\d+(?:\.\d+)*/,
  /\b(?:section|sec|figure|fig|table|appendix|page|theorem|lemma|chapter)\.?(?=\s|[:#])\s*[:#]?\s*(?:[A-Z]?\d+(?:[._-]\d+)*|[A-Z]\b|["“`][^"”`]+["”`])/i,
  /\bp\.\s*\d+(?:-\d+)?/i,
  /\b(?:file|path)\b\s*[:#]?\s*`?[A-Za-z0-9_@+.-]+(?:\/[A-Za-z0-9_@+.-]+)+`?/i,
  /\bcommit\b\s*[:#]?\s*[0-9a-f]{7,40}\b/i,
  /\blines?\b\s*[:#]?\s*\d+(?:-\d+)?/i,
  /(?:第\s*)?[0-9一二三四五六七八九十]+(?:\.[0-9]+)*\s*(?:节|章|页)/,
  /(?:图|表|附录|定理|引理|页码|行号)\s*[:：]?\s*(?:[A-Z]?\d+(?:[._-]\d+)*|[A-Z]\b)/i,
  /(?:代码路径|文件)\s*[:：]?\s*`?[A-Za-z0-9_@+.-]+(?:\/[A-Za-z0-9_@+.-]+)+`?/,
];

const issue = (code, subject, message) => ({ code, subject, message });
const markdownParser = new MarkdownIt();
const maskHtmlComments = (markdown) =>
  markdown.replace(
    /<!--[\s\S]*?(?:-->|$)/g,
    (comment) => comment.replace(/[^\n]/g, ' '),
  );

const sectionForGroup = (markdown, group) => {
  for (const heading of group.headings) {
    const section = getSection(markdown, heading);
    if (section.trim()) return section;
  }
  return '';
};

const hasTraceableSource = (source, knownPaperSlugs, allowArchive = false) => {
  for (const match of source.matchAll(absoluteUrlPattern)) {
    if (isHttpUrl(match[0])) return true;
  }
  for (const match of source.matchAll(internalPaperPathPattern)) {
    if (knownPaperSlugs.has(match[1])) return true;
  }
  return allowArchive && /(?:^|[\s(])\/archive\/(?:$|[\s)])/m.test(source);
};

const resultBlocks = (section) => {
  const matches = [...section.matchAll(/^###\s+(.+)$/gm)];
  if (matches.length === 0) return section.trim() ? [{ title: 'section', body: section }] : [];
  const blocks = matches
    .map((match, index) => ({
      title: match[1].trim(),
      body: section.slice(match.index, matches[index + 1]?.index ?? section.length),
    }))
    .filter(({ title }) => !/^(?:实验设置|baseline\s*审计|术语|符号约定)/i.test(title));
  return blocks.length > 0 ? blocks : [{ title: 'section', body: section }];
};

const lineValue = (section, name) =>
  section.match(new RegExp(`^- ${name}:\\s*(.+)$`, 'mi'))?.[1]?.trim() ?? '';

const evidenceValue = (block) => block.match(/^- 证据定位[:：]\s*(.+)$/mi)?.[1]?.trim() ?? '';

const resultFieldValue = (block, name) =>
  block.match(new RegExp(`^- ${name}[:：][ \\t]*(.+)$`, 'mi'))?.[1]?.trim() ?? '';

const paperContextHeadingPattern = /^(\d+)\.\s+(.+)$/;
const methodOverviewHeadings = new Set([
  '贡献全景与方法总览',
  '方法总览与完整机制',
]);
const methodOverviewBaselineSchemaVersion = 1;
const methodOverviewBaselineCapturedAt = '2026-07-29 15:47';
const frozenMethodOverviewBaseline = new Map([
  ['2026-06-16-glm-5-2-long-horizon-tasks', '2026-07-27 14:54'],
  ['2026-07-27-kimi-k3-open-frontier-intelligence', '2026-07-28 11:47'],
  ['202607.1328-towards-long-horizon-agents-survey', '2026-07-21 10:14'],
  ['2503.01840-eagle-3-training-time-test', '2026-07-27 15:47'],
  ['2505.19645-moesd-sparse-moe-speculative-decoding', '2026-07-24 14:20'],
  ['2601.16206-computer-environments-agentic-intelligence', '2026-07-21 14:18'],
  ['2601.18734-self-distilled-reasoner-opsd', '2026-07-28 15:34'],
  ['2601.19897-self-distillation-continual-learning', '2026-07-29 10:39'],
  ['2603.00729-qwen3-coder-next-agentic-coding', '2026-07-21 14:18'],
  ['2605.09539-tacomas-test-time-coevolution-mas', '2026-07-22 11:03'],
  ['2605.10899-rubricem-rubric-guided-meta-rl', '2026-07-22 17:16'],
  ['2605.26684-graphgpo-graph-credit-assignment-agentic-rl', '2026-07-22 14:40'],
  ['2606.20954-lre-learned-relevance-eviction', '2026-07-29 11:32'],
  ['2607.00151-smoothagent-lookahead-context-engineering', '2026-07-29 13:35'],
  ['2607.02980-hils-attention-infinite-context', '2026-07-21 14:18'],
  ['2607.04763-reopd-prefix-replay-agentic-distillation', '2026-07-23 18:09'],
  ['2607.12696-ecospec-cost-aware-moe-speculative-decoding', '2026-07-24 15:15'],
  ['2607.13988-trace-turn-level-reward-assignment', '2026-07-22 15:28'],
  ['2607.14777-seed-self-evolving-on-policy-distillation', '2026-07-23 16:10'],
  ['2607.18082-cripo-rubric-rl-self-distillation', '2026-07-22 18:27'],
]);

export const methodOverviewBaselineCompatibilityMap = (manifest) => {
  if (
    manifest?.schemaVersion !== methodOverviewBaselineSchemaVersion ||
    manifest?.capturedAt !== methodOverviewBaselineCapturedAt
  ) return new Map();

  return new Map(
    (Array.isArray(manifest?.entries) ? manifest.entries : [])
      .filter((entry) => (
        typeof entry?.slug === 'string' &&
        typeof entry?.updatedAt === 'string' &&
        frozenMethodOverviewBaseline.get(entry.slug.trim()) === entry.updatedAt.trim()
      ))
      .map((entry) => [entry.slug.trim(), entry.updatedAt.trim()]),
  );
};

const levelThreeBlocks = (section) => {
  const lines = section.split('\n');
  const tokens = markdownParser.parse(maskHtmlComments(section), {});
  const headings = tokens.flatMap((token, index) => {
    if (
      token.type !== 'heading_open' ||
      token.tag !== 'h3' ||
      token.level !== 0 ||
      !token.map
    ) return [];
    return [{
      startLine: token.map[0],
      bodyStartLine: token.map[1],
      title: tokens[index + 1]?.content?.trim() ?? '',
    }];
  });

  return headings.map((heading, index) => {
    const parsed = heading.title.match(paperContextHeadingPattern);
    return {
      ...heading,
      number: parsed ? Number(parsed[1]) : null,
      name: parsed?.[2]?.trim() ?? heading.title,
      body: lines.slice(
        heading.bodyStartLine,
        headings[index + 1]?.startLine ?? lines.length,
      ).join('\n').trim(),
    };
  });
};

const methodOverviewBlock = (section) =>
  levelThreeBlocks(section).find((block) => block.number === 5);

const hasNestedMethodWrapper = (section) => {
  const overview = methodOverviewBlock(section);
  if (!overview) return false;
  const tokens = markdownParser.parse(maskHtmlComments(overview.body), {});
  return tokens.some((token, index) => (
    token.type === 'heading_open' &&
    token.tag === 'h4' &&
    token.level === 0 &&
    /^5\.\d+(?:\.\d+)*\s+\S/.test(tokens[index + 1]?.content?.trim() ?? '')
  ));
};

const hasSequentialPaperContextHeadings = (section) => {
  const headings = levelThreeBlocks(section);
  return (
    headings.length > 0 &&
    headings.every((heading, index) => heading.number === index + 1)
  );
};

const contributionMethodNarrative = (section) => {
  const headings = levelThreeBlocks(section);
  const methodHeadingIndex = headings.findIndex((heading) => heading.number === 5);
  if (methodHeadingIndex < 0) return '';

  const methodBlocks = [];
  for (const heading of headings.slice(methodHeadingIndex)) {
    if (/结论链/.test(heading.name)) break;
    methodBlocks.push(`${heading.title}\n${heading.body}`);
  }
  return methodBlocks.join('\n');
};

const methodDetailNarrative = (section) => {
  const headings = levelThreeBlocks(section);
  const methodHeadingIndex = headings.findIndex((heading) => heading.number === 5);
  if (methodHeadingIndex < 0) return '';

  const overview = headings[methodHeadingIndex];
  const detailBlocks = [];
  for (const heading of headings.slice(methodHeadingIndex + 1)) {
    if (/结论链/.test(heading.name)) break;
    detailBlocks.push(`${heading.title}\n${heading.body}`);
  }
  return detailBlocks.length > 0 ? detailBlocks.join('\n') : overview.body;
};

const hasDetailedMethodNarrative = (section) => {
  const semanticSignals = [
    /输入|初始条件|接收|给定|假设|定义|前提/,
    /操作|变换|计算|更新|优化|训练|执行|推导|证明|构造/,
    /传递|中间(?:表示|状态|对象)|输出|训练信号|奖励|目标函数|结论|定理|证明结果/,
    /作用|目的|解决|设计理由|设计原因|原因|约束|用于|为什么/,
    /证据定位|直接证据|边界|成立条件|失效|未披露|限制|尚未|缺少|§|\b(?:section|figure|table|equation|appendix)\b/i,
  ];
  return semanticSignals.every((pattern) => pattern.test(section));
};

const methodOverviewViolations = (section) => {
  const overview = methodOverviewBlock(section);
  if (!overview || !methodOverviewHeadings.has(overview.name)) {
    return [
      issue(
        'v21-method-overview-heading',
        '论文脉络',
        'Section 5 must be titled 贡献全景与方法总览 or 方法总览与完整机制.',
      ),
    ];
  }

  const headings = levelThreeBlocks(section);
  const overviewIndex = headings.findIndex((heading) => heading.number === 5);
  const detailHeadings = [];
  for (const heading of headings.slice(overviewIndex + 1)) {
    if (/结论链/.test(heading.name)) break;
    detailHeadings.push(heading);
  }

  const violations = [];
  if (
    (overview.name === '贡献全景与方法总览' && detailHeadings.length === 0) ||
    (overview.name === '方法总览与完整机制' && detailHeadings.length > 0)
  ) {
    violations.push(
      issue(
        'v21-method-overview-mode',
        '论文脉络',
        overview.name === '贡献全景与方法总览'
          ? 'Multi-stage overviews require promoted method detail sections after Section 5.'
          : 'Single-stage overviews must keep the complete mechanism inside Section 5.',
      ),
    );
  }

  const visibleOverview = maskHtmlComments(overview.body);
  const commonSignals = [
    ['首要贡献', /首要贡献|核心贡献/],
    ['起点或输入', /起点|输入|初始(?:条件|状态)|接收|给定|问题\s*(?:\$[^$]+\$|[A-Za-z])|prompt|采样|从.{0,24}出发/i],
    ['核心操作', /操作|变换|计算|更新|优化|训练|执行|推导|证明|构造|生成|采样|划分|重加权|聚合|匹配|约束/],
    ['最终输出', /最终|输出|训练信号|目标函数|结论|策略更新|只更新|更新后的|得到.{0,24}(?:分布|权重|信号|结果|结论)/],
    ['阶段作用', /作用|局部问题|目的|解决|用于|负责|支撑|使|保证|限制|控制|避免|提高|降低/],
  ];
  const requiredSignals = overview.name === '贡献全景与方法总览'
    ? [
        ...commonSignals,
        ['辅助贡献', /辅助贡献/],
        ['阶段或顺序', /端到端|执行链|论证链|执行顺序|论证顺序|流程|阶段|步骤|环节|路径|→/],
        ['阶段间传递', /传递|交给|进入|写入|送入|依据|得到|组成|→/],
      ]
    : [
        ...commonSignals,
        ['直接证据', /证据定位|直接证据|§|\b(?:section|figure|table|equation|appendix)\b/i],
        ['成立边界', /边界|成立条件|失效|未披露|限制|尚未|缺少/],
      ];
  const missing = requiredSignals
    .filter(([, pattern]) => !pattern.test(visibleOverview))
    .map(([name]) => name);

  if (missing.length > 0) {
    violations.push(
      issue(
        'v21-method-overview-chain',
        '论文脉络',
        `Section 5 must independently state the complete method map; missing signals: ${missing.join(', ')}.`,
      ),
    );
  }

  return violations;
};

const analysisModulesValue = (value = '') =>
  scalarValue(value)
    .split(/[,，]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const reviewStatusValue = (value = '') => {
  const fields = new Map();
  for (const item of scalarValue(value).split(';')) {
    const separator = item.indexOf('=');
    if (separator < 1) continue;
    fields.set(item.slice(0, separator).trim().toLowerCase(), item.slice(separator + 1).trim());
  }
  return fields;
};

const hasNamedField = (markdown, name) =>
  new RegExp(`^- ${name}[:：][ \\t]*\\S`, 'mi').test(markdown);

const scalarValue = (value = '') => value.trim().replace(/^`([^`]+)`$/, '$1').trim();

const canonicalValue = (value = '') => {
  const raw = scalarValue(value);
  return raw.match(/^\[[^\]]+\]\(([^)\s]+)\)$/)?.[1] ?? raw.match(/^<([^>\s]+)>$/)?.[1] ?? raw;
};

const isValidDate = (value) => {
  if (!exactDatePattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
};

const isValidMinute = (value) => {
  if (!exactMinutePattern.test(value)) return false;
  const [date, time] = value.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  return isValidDate(date) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};


const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
};

const hasEvidenceLocator = (value) => {
  for (const match of value.matchAll(absoluteUrlPattern)) {
    if (isHttpUrl(match[0])) return true;
  }
  return textualEvidenceLocatorPatterns.some((pattern) => pattern.test(value));
};

const isSafePaperImagePath = (imageUrl, expectedPrefix) => {
  if (/[\\%?#]/.test(imageUrl) || !imageUrl.startsWith(expectedPrefix)) return false;
  if (imageUrl.split('/').some((segment) => segment === '.' || segment === '..')) return false;
  return path.posix.normalize(imageUrl) === imageUrl;
};

const workflowVersionFor = (markdown) =>
  scalarValue(getSourceFieldRaw(getSection(markdown, 'Source'), 'Workflow version'));

const firstMarkdownTable = (markdown) => {
  const tokens = markdownParser.parse(markdown, {});
  const tableStart = tokens.findIndex((token) => token.type === 'table_open');
  if (tableStart < 0) return null;

  const rows = [];
  let row = null;
  let cell = null;

  for (const token of tokens.slice(tableStart)) {
    if (token.type === 'table_close') break;
    if (token.type === 'tr_open') row = [];
    if (token.type === 'th_open' || token.type === 'td_open') {
      cell = { text: '', links: [] };
    }
    if (token.type === 'inline' && cell) {
      cell.text = token.content.trim();
      cell.links = (token.children ?? [])
        .filter((child) => child.type === 'link_open')
        .map((child) => child.attrGet('href'))
        .filter(Boolean);
    }
    if ((token.type === 'th_close' || token.type === 'td_close') && row && cell) {
      row.push(cell);
      cell = null;
    }
    if (token.type === 'tr_close' && row) {
      rows.push(row);
      row = null;
    }
  }

  return rows.length > 0 ? { header: rows[0], rows: rows.slice(1) } : null;
};

const parseArchiveMonth = (value) => {
  const match = value.match(/^(\d{4})年([1-9]|1[0-2])月$/);
  return match ? Number(match[1]) * 12 + Number(match[2]) : null;
};

const mathDelimiterPattern = /(\$\$|\$[^$\n]+\$|\\\(|\\\)|\\\[|\\\]|\\begin\{|\\end\{)/;

export const parseArchiveCoreSignals = (indexMarkdown) => {
  const table = firstMarkdownTable(getSection(indexMarkdown, '当前收录'));
  const signals = new Map();
  if (!table) return signals;

  for (const row of table.rows) {
    if (row.length !== 3) continue;
    const paperPath = row[0].links.length === 1 ? row[0].links[0] : '';
    const slug = paperPath.match(/^\/papers\/([^/#?]+)\/$/)?.[1] ?? '';
    if (slug) signals.set(slug, row[2].text.trim());
  }
  return signals;
};

export const validateArchiveIndex = (indexMarkdown, knownPaperSlugs) => {
  const errors = [];
  const table = firstMarkdownTable(getSection(indexMarkdown, '当前收录'));
  if (!table) {
    errors.push(issue('missing-index-table', '当前收录', 'Archive index must contain the current collection table.'));
    return { errors };
  }

  const header = table.header.map((cell) => cell.text);
  if (header.length !== 3 || header.some((value, index) => value !== ['简称', '时间', '核心信号'][index])) {
    errors.push(issue('index-table-header', '当前收录', 'Expected columns: 简称, 时间, 核心信号.'));
  }

  const indexedCounts = new Map();
  let previousValidMonth = null;
  for (const [index, row] of table.rows.entries()) {
    const rowSubject = `row-${index + 1}`;
    if (row.length !== 3) {
      errors.push(issue('index-row-shape', rowSubject, 'Every archive index row must contain exactly three cells.'));
      continue;
    }

    const [titleCell, monthCell, signalCell] = row;
    const paperPath = titleCell.links.length === 1 ? titleCell.links[0] : '';
    const slug = paperPath.match(/^\/papers\/([^/#?]+)\/$/)?.[1] ?? '';
    const shortTitle = titleCell.text.match(/^\[([^\]]+)\]\(\/papers\/[^/#?]+\/\)$/)?.[1]?.trim() ?? '';
    const subject = slug || rowSubject;

    if (!slug) {
      errors.push(issue('index-paper-link', rowSubject, 'The short title must be a single /papers/<slug>/ link.'));
      continue;
    }
    if (!shortTitle) {
      errors.push(issue('missing-index-short-title', subject, 'Archive index short title is required.'));
    }

    indexedCounts.set(slug, (indexedCounts.get(slug) ?? 0) + 1);
    if (!knownPaperSlugs.has(slug)) {
      errors.push(issue('stale-index-entry', slug, 'Archive index links to a paper that is not archived.'));
    }

    const monthKey = parseArchiveMonth(monthCell.text);
    if (monthKey === null) {
      errors.push(issue('index-time-format', subject, 'Archive index time must use YYYY年M月.'));
    } else {
      if (previousValidMonth && monthKey > previousValidMonth.key) {
        errors.push(
          issue(
            'index-time-order',
            subject,
            `Archive index time must run newest to oldest; ${monthCell.text} appears after ${previousValidMonth.text}.`,
          ),
        );
      }
      previousValidMonth = { key: monthKey, text: monthCell.text };
    }

    const signal = signalCell.text.trim();
    const sentenceMarks = signal.match(/[。！？!?]/g) ?? [];
    if (!signal) {
      errors.push(issue('missing-core-signal', subject, 'Archive index core signal is required.'));
    } else if (signal.length < 8 || sentenceMarks.length !== 1 || !/[。！？!?]$/.test(signal)) {
      errors.push(issue('core-signal-format', subject, 'Core signal must be one complete natural-language sentence.'));
    } else if (mathDelimiterPattern.test(signal)) {
      errors.push(
        issue(
          'core-signal-math',
          subject,
          'Core signal must describe the contribution in natural language without formula delimiters.',
        ),
      );
    }
  }

  for (const [slug, count] of indexedCounts) {
    if (count > 1) {
      errors.push(issue('duplicate-index-entry', slug, `Archive index contains ${count} rows for this paper.`));
    }
  }
  for (const slug of knownPaperSlugs) {
    if (!indexedCounts.has(slug)) {
      errors.push(issue('missing-index-entry', slug, 'Paper is missing from the current collection table.'));
    }
  }

  return { errors };
};

export const validatePaperRecord = async ({
  slug,
  markdown,
  indexMarkdown,
  knownPaperSlugs,
  legacyPaperSlugs = new Set(),
  v2PaperSlugs = new Set(),
  methodOverviewBaseline = new Map(),
  imageExists,
}) => {
  const errors = [];
  const advisories = [];
  const source = getSection(markdown, 'Source');
  const workflowVersion = scalarValue(getSourceFieldRaw(source, 'Workflow version'));
  const isV2 = workflowVersion.toLowerCase() === 'v2';
  const isV21 = workflowVersion.toLowerCase() === 'v2.1';
  const isStructured = isV2 || isV21;
  const materialType = scalarValue(getSourceFieldRaw(source, 'Material type'));
  const canonicalSource = canonicalValue(getSourceFieldRaw(source, 'Canonical source'));
  const firstArchivedAt = getFirstArchivedAt(markdown);
  const updatedAt = getTopLevelField(markdown, 'Updated-At');
  const paperReviewStatus = getTopLevelField(markdown, 'Review-Status').toLowerCase();
  const reviewedAt = getTopLevelField(markdown, 'Reviewed-At');
  const updatedMinute = updatedAt.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)?.[0] ?? '';
  const visibleMarkdown = maskHtmlComments(markdown);
  const conclusion = getSection(markdown, '一句话结论');

  if (!workflowVersion && !legacyPaperSlugs.has(slug)) {
    errors.push(issue('missing-workflow-version', slug, 'New notes must declare Workflow version: v2.1.'));
  } else if (workflowVersion && !isStructured) {
    errors.push(issue('unsupported-workflow-version', slug, `Unsupported Workflow version: ${workflowVersion}.`));
  } else if (isV2 && !legacyPaperSlugs.has(slug) && !v2PaperSlugs.has(slug)) {
    errors.push(issue('deprecated-workflow-version', slug, 'New notes must use Workflow version: v2.1.'));
  }

  if (!firstArchivedAt || !updatedAt) {
    errors.push(issue('missing-archive-time', slug, 'First-Archived-At and Updated-At are required.'));
  }

  if (!paperReviewStatus) {
    errors.push(issue('missing-paper-review-status', slug, 'Review-Status is required.'));
  } else if (!paperReviewStatusSet.has(paperReviewStatus)) {
    errors.push(
      issue(
        'paper-review-status',
        slug,
        `Review-Status must be one of: ${PAPER_REVIEW_STATUSES.join(', ')}.`,
      ),
    );
  } else if (paperReviewStatus === 'pending') {
    if (reviewedAt) {
      errors.push(issue('paper-reviewed-at', slug, 'Pending notes must not declare Reviewed-At.'));
    }
  } else if (!isValidMinute(reviewedAt)) {
    errors.push(
      issue('paper-reviewed-at', slug, 'Approved and needs-review notes require Reviewed-At in YYYY-MM-DD HH:mm.'),
    );
  } else if (paperReviewStatus === 'approved' && updatedMinute && updatedMinute > reviewedAt) {
    errors.push(
      issue('paper-review-state-order', slug, 'A note updated after Reviewed-At must use Review-Status: needs-review.'),
    );
  } else if (paperReviewStatus === 'needs-review' && updatedMinute && updatedMinute <= reviewedAt) {
    errors.push(
      issue('paper-review-state-order', slug, 'needs-review requires Updated-At to be later than Reviewed-At.'),
    );
  }

  const requiredSectionGroups = isV21 ? REQUIRED_SECTION_GROUPS : V2_REQUIRED_SECTION_GROUPS;
  for (const group of requiredSectionGroups) {
    if (!sectionForGroup(markdown, group)) {
      errors.push(issue('missing-core-section', slug, `Missing or empty section: ${group.name}.`));
    }
  }
  if (mathDelimiterPattern.test(conclusion)) {
    errors.push(
      issue(
        'conclusion-math',
        slug,
        '一句话结论 must use natural-language descriptions instead of formula delimiters.',
      ),
    );
  }
  if (!hasTraceableSource(source, knownPaperSlugs)) {
    errors.push(issue('missing-source-link', slug, 'Source must contain an external URL or a valid archived paper link.'));
  }
  if (!indexMarkdown.includes(`/papers/${slug}/`)) {
    errors.push(issue('missing-index-link', slug, 'Archive index does not link to this paper slug.'));
  }
  if (/^\s*(?:- |\d+\. )\s*$/m.test(markdown)) {
    errors.push(issue('template-placeholder', slug, 'Blank list placeholder remains in the note.'));
  }

  if (!isStructured) {
    advisories.push(
      issue(
        'legacy-source-snapshot',
        slug,
        'Add Workflow version, Material type, Canonical source, and Accessed.',
      ),
    );
    if (!isValidMinute(firstArchivedAt) || !isValidMinute(updatedAt)) {
      advisories.push(issue('legacy-time-format', slug, 'Normalize timestamps to YYYY-MM-DD HH:mm.'));
    }
    const review = getSection(markdown, 'OpenReview / 审稿意见吸收');
    if (!lineValue(review, 'Page type') || !lineValue(review, 'Match confidence') || !lineValue(review, 'Observed at')) {
      advisories.push(issue('legacy-review-classification', slug, 'Add v2 review classification fields.'));
    }
    if (!/证据定位[:：]/.test(sectionForGroup(markdown, evidenceSectionGroup))) {
      advisories.push(
        issue(
          'legacy-evidence-location',
          slug,
          'Add section, figure, table, appendix, page, or URL evidence locations.',
        ),
      );
    }
  } else if (
    !isValidMinute(firstArchivedAt) ||
    !isValidMinute(updatedAt)
  ) {
    errors.push(issue('v2-time-format', slug, 'v2 timestamps must use YYYY-MM-DD HH:mm.'));
  } else if (updatedAt < firstArchivedAt) {
    errors.push(issue('v2-time-order', slug, 'Updated-At must not precede First-Archived-At.'));
  }

  if (isStructured) {
    const sourceField = (names) => scalarValue(getSourceFieldRaw(source, names));
    const accessed = sourceField('Accessed');
    const requiredFields = [
      ['Material type', materialType],
      ['Canonical source', canonicalSource],
      ['Title', sourceField('Title')],
      [
        'Authors or Responsible organization',
        sourceField(['Authors', 'Responsible organization']),
      ],
      [
        'Published / submitted date',
        sourceField(['Published / updated', 'Submitted', 'Published']),
      ],
      [
        'Version / revision read',
        sourceField(['Version / revision read', 'Current version read']),
      ],
      ['Accessed', accessed],
    ];

    for (const [name, value] of requiredFields) {
      if (!value) errors.push(issue('v2-source-field', slug, `Missing v2 Source field: ${name}.`));
    }
    if (!MATERIAL_TYPES.has(materialType)) {
      errors.push(issue('v2-material-type', slug, 'Material type is outside the supported v2 set.'));
    }
    if (canonicalSource && !isHttpUrl(canonicalSource)) {
      errors.push(
        issue(
          'v2-canonical-source',
          slug,
          'Canonical source must be an absolute URL.',
        ),
      );
    }
    if (accessed && !isValidDate(accessed)) {
      errors.push(issue('v2-accessed-date', slug, 'Accessed must use a valid YYYY-MM-DD date.'));
    }

    const modules = analysisModulesValue(sourceField('Analysis modules'));
    if (isV21) {
      if (modules.length === 0) {
        errors.push(issue('v21-analysis-modules', slug, 'v2.1 notes must declare at least one Analysis module.'));
      }
      if (new Set(modules).size !== modules.length) {
        errors.push(issue('v21-analysis-modules', slug, 'Analysis modules must not contain duplicates.'));
      }
      for (const moduleName of modules) {
        if (!ANALYSIS_MODULES.has(moduleName)) {
          errors.push(issue('v21-analysis-module', slug, `Unknown Analysis module: ${moduleName}.`));
        }
      }

    }

    for (const block of resultBlocks(sectionForGroup(markdown, evidenceSectionGroup))) {
      const locator = evidenceValue(block.body);
      if (!locator || !hasEvidenceLocator(locator)) {
        errors.push(issue('v2-evidence-location', slug, `Missing evidence location in ${block.title}.`));
      }
      if (isV2 && !resultFieldValue(block.body, '对照是否可比')) {
        errors.push(
          issue('v2-result-comparability', slug, `Missing comparability assessment in ${block.title}.`),
        );
      }
      if (!resultFieldValue(block.body, '支持的最窄结论')) {
        errors.push(
          issue(
            'v2-result-narrow-conclusion',
            slug,
            `Missing narrowest supported conclusion in ${block.title}.`,
          ),
        );
      }
    }

    if (isV2) {
      const review = getSection(markdown, 'OpenReview / 审稿意见吸收');
      for (const name of ['Page type', 'Match confidence', 'Observed at']) {
        if (!lineValue(review, name)) {
          errors.push(issue('v2-review-field', slug, `Missing review field: ${name}.`));
        }
      }
      if (lineValue(review, 'Page type') && !REVIEW_PAGE_TYPES.has(lineValue(review, 'Page type'))) {
        errors.push(issue('v2-review-page-type', slug, 'Page type is outside the supported v2 set.'));
      }
      if (
        lineValue(review, 'Match confidence') &&
        !/^(high|medium|low)$/i.test(lineValue(review, 'Match confidence'))
      ) {
        errors.push(issue('v2-review-confidence', slug, 'Match confidence must be high, medium, or low.'));
      }
      const observedAt = lineValue(review, 'Observed at');
      if (observedAt && !isValidDate(observedAt)) {
        errors.push(issue('v2-review-date', slug, 'Observed at must use a valid YYYY-MM-DD date.'));
      }
    }

    if (isV21) {
      const paperContext = sectionForGroup(
        markdown,
        REQUIRED_SECTION_GROUPS.find((group) => group.name === '论文脉络'),
      );
      const overviewIssueTarget =
        methodOverviewBaseline.get(slug) === updatedAt ? advisories : errors;
      if (!hasSequentialPaperContextHeadings(paperContext)) {
        errors.push(
          issue(
            'v21-paper-context-heading-sequence',
            slug,
            'Number level-three paper-context headings consecutively from 1, including each promoted method stage.',
          ),
        );
      }
      if (hasNestedMethodWrapper(paperContext)) {
        overviewIssueTarget.push(
          issue(
            'v21-method-wrapper-heading',
            slug,
            'Promote nested method headings to consecutive level-three sections and remove the wrapper heading.',
          ),
        );
      }
      const overviewIssues = methodOverviewViolations(paperContext);
      for (const overviewIssue of overviewIssues) {
        overviewIssueTarget.push({ ...overviewIssue, subject: slug });
      }

      const methodNarrative = contributionMethodNarrative(paperContext);
      const detailNarrative = methodDetailNarrative(paperContext);
      if (methodNarrative && !hasDetailedMethodNarrative(detailNarrative)) {
        advisories.push(
          issue(
            'v21-method-detail-narrative',
            slug,
            'Expand the detailed method sections with stage-level inputs, transformations, handoffs or outputs, rationale, evidence, and boundaries.',
          ),
        );
      }

      const keyFigureDecision = sourceField('Key figure decision').toLowerCase();
      const keyFigureRationale = sourceField('Key figure rationale');
      const expectedImagePrefix = `/images/papers/${slug}/`;
      const localPaperImages = [...visibleMarkdown.matchAll(markdownImagePattern)]
        .map((match) => (match[1] ?? match[2]).trim())
        .filter((imageUrl) => imageUrl.startsWith(expectedImagePrefix));

      if (!/^(include|omit)$/.test(keyFigureDecision)) {
        errors.push(
          issue(
            'v21-key-figure-decision',
            slug,
            'Key figure decision must be include or omit.',
          ),
        );
      } else if (keyFigureDecision === 'include' && localPaperImages.length === 0) {
        errors.push(
          issue(
            'v21-key-figure-required',
            slug,
            `Key figure decision include requires a local image under ${expectedImagePrefix}.`,
          ),
        );
      } else if (keyFigureDecision === 'omit' && !keyFigureRationale) {
        errors.push(
          issue(
            'v21-key-figure-rationale',
            slug,
            'Key figure decision omit requires a substantive Key figure rationale.',
          ),
        );
      } else if (keyFigureDecision === 'omit' && localPaperImages.length > 0) {
        errors.push(
          issue(
            'v21-key-figure-conflict',
            slug,
            'Key figure decision omit conflicts with a local paper image.',
          ),
        );
      }

      const reviewStatus = reviewStatusValue(sourceField('Review status'));
      const pageType = reviewStatus.get('page-type') ?? '';
      const matchConfidence = reviewStatus.get('match-confidence') ?? '';
      const observedAt = reviewStatus.get('observed-at') ?? '';
      const venueStatus = reviewStatus.get('venue-status') ?? '';

      if (!pageType || !matchConfidence || !observedAt || !venueStatus) {
        errors.push(
          issue(
            'v21-review-status',
            slug,
            'Review status must include page-type, match-confidence, observed-at, and venue-status.',
          ),
        );
      }
      if (pageType && !REVIEW_PAGE_TYPES.has(pageType)) {
        errors.push(issue('v21-review-page-type', slug, 'Review page-type is outside the supported set.'));
      }
      if (matchConfidence && !/^(high|medium|low)$/i.test(matchConfidence)) {
        errors.push(issue('v21-review-confidence', slug, 'Review match-confidence must be high, medium, or low.'));
      }
      if (observedAt && !isValidDate(observedAt)) {
        errors.push(issue('v21-review-date', slug, 'Review observed-at must use a valid YYYY-MM-DD date.'));
      }

      if (pageType === 'official-review') {
        const review = getSection(markdown, 'OpenReview / 审稿意见吸收');
        if (!review.trim()) {
          errors.push(issue('v21-official-review-section', slug, 'Official reviews require a review analysis section.'));
        } else {
          for (const name of ['Reviewer consensus', 'Main criticisms', 'Author response', '对可信度的影响']) {
            if (!lineValue(review, name)) {
              errors.push(issue('v21-official-review-field', slug, `Missing official review field: ${name}.`));
            }
          }
        }
      }

      if (modules.includes('experiment')) {
        for (const block of resultBlocks(sectionForGroup(markdown, evidenceSectionGroup))) {
          if (!resultFieldValue(block.body, '对照是否可比')) {
            advisories.push(
              issue('v21-module-experiment', slug, `Add comparability assessment in ${block.title}.`),
            );
          }
        }
      }
      const moduleFieldRules = new Map([
        ['system', ['系统条件', '指标定义', '成本归因']],
        ['theory', ['假设', '适用域']],
        ['model-report', ['未披露项']],
        ['survey', ['纳入范围']],
        ['safety', ['威胁模型', '披露边界']],
        ['docs', ['适用版本']],
      ]);
      for (const moduleName of modules) {
        for (const fieldName of moduleFieldRules.get(moduleName) ?? []) {
          if (!hasNamedField(markdown, fieldName)) {
            advisories.push(
              issue(`v21-module-${moduleName}`, slug, `Add the ${fieldName} field before module checks become strict.`),
            );
          }
        }
      }
    }
  }

  for (const match of visibleMarkdown.matchAll(markdownImagePattern)) {
    const imageUrl = (match[1] ?? match[2]).trim();
    if (/^https?:\/\//i.test(imageUrl)) continue;

    const expectedPrefix = `/images/papers/${slug}/`;
    if (!imageUrl.startsWith('/images/papers/')) {
      errors.push(issue('image-path', slug, `Local image path must start with ${expectedPrefix}.`));
      continue;
    }
    if (!imageUrl.startsWith(expectedPrefix)) {
      errors.push(issue('image-slug-mismatch', slug, `Image path must start with ${expectedPrefix}.`));
      continue;
    }
    if (!isSafePaperImagePath(imageUrl, expectedPrefix)) {
      errors.push(issue('image-path', slug, `Local image path must stay inside ${expectedPrefix}.`));
      continue;
    }
    const repoRelativePath = path.posix.join('public', imageUrl.slice(1));
    if (!(await imageExists(repoRelativePath))) {
      errors.push(issue('missing-image-file', slug, `Missing image file: ${repoRelativePath}.`));
    }
    const captionStart = match.index + match[0].length;
    const nextImage = visibleMarkdown.indexOf('![', captionStart);
    const captionEnd = Math.min(captionStart + 1000, nextImage === -1 ? visibleMarkdown.length : nextImage);
    const captionWindow = visibleMarkdown.slice(captionStart, captionEnd);
    if (!/Image Source:/i.test(captionWindow)) {
      errors.push(issue('missing-image-source', slug, `Image caption lacks Image Source: ${imageUrl}.`));
    }
  }

  return { errors, advisories };
};

export const validateMethodOverviewBaseline = ({ records, manifest }) => {
  const errors = [];
  const entries = manifest?.entries;
  if (!Array.isArray(entries)) {
    return {
      errors: [
        issue(
          'v21-method-overview-baseline-shape',
          'method-overview-baseline',
          'Method overview baseline must contain an entries array.',
        ),
      ],
    };
  }

  if (
    manifest.schemaVersion !== methodOverviewBaselineSchemaVersion ||
    manifest.capturedAt !== methodOverviewBaselineCapturedAt
  ) {
    errors.push(
      issue(
        'v21-method-overview-baseline-metadata',
        'method-overview-baseline',
        `Method overview baseline must keep schemaVersion ${methodOverviewBaselineSchemaVersion} and capturedAt ${methodOverviewBaselineCapturedAt}.`,
      ),
    );
  }

  const recordsBySlug = new Map(records.map((record) => [record.slug, record]));
  const seen = new Set();
  for (const entry of entries) {
    const slug = typeof entry?.slug === 'string' ? entry.slug.trim() : '';
    const baselineUpdatedAt =
      typeof entry?.updatedAt === 'string' ? entry.updatedAt.trim() : '';
    if (!slug || !isValidMinute(baselineUpdatedAt)) {
      errors.push(
        issue(
          'v21-method-overview-baseline-entry',
          slug || 'method-overview-baseline',
          'Each method overview baseline entry requires a slug and a valid Updated-At minute.',
        ),
      );
      continue;
    }
    if (seen.has(slug)) {
      errors.push(
        issue(
          'v21-method-overview-baseline-duplicate',
          slug,
          'Method overview baseline contains a duplicate slug.',
        ),
      );
      continue;
    }
    seen.add(slug);

    if (frozenMethodOverviewBaseline.get(slug) !== baselineUpdatedAt) {
      errors.push(
        issue(
          'v21-method-overview-baseline-not-frozen',
          slug,
          'Method overview baseline entries must come from the original frozen slug and Updated-At set.',
        ),
      );
      continue;
    }

    const record = recordsBySlug.get(slug);
    const source = record ? getSection(record.markdown, 'Source') : '';
    const workflowVersion = scalarValue(getSourceFieldRaw(source, 'Workflow version')).toLowerCase();
    if (!record || workflowVersion !== 'v2.1') {
      errors.push(
        issue(
          'v21-method-overview-baseline-entry',
          slug,
          'Method overview baseline entries must reference existing v2.1 papers.',
        ),
      );
      continue;
    }

    const currentUpdatedAt = getTopLevelField(record.markdown, 'Updated-At');
    const firstArchivedAt = getFirstArchivedAt(record.markdown);
    if (
      baselineUpdatedAt > methodOverviewBaselineCapturedAt ||
      firstArchivedAt > methodOverviewBaselineCapturedAt
    ) {
      errors.push(
        issue(
          'v21-method-overview-baseline-capture-boundary',
          slug,
          'Method overview baseline entries and their papers must predate the frozen capture minute.',
        ),
      );
    }
    if (currentUpdatedAt < baselineUpdatedAt) {
      errors.push(
        issue(
          'v21-method-overview-baseline-time-regression',
          slug,
          'Paper Updated-At precedes its frozen method overview baseline.',
        ),
      );
    }

    const paperContext = sectionForGroup(
      record.markdown,
      REQUIRED_SECTION_GROUPS.find((group) => group.name === '论文脉络'),
    );
    if (methodOverviewViolations(paperContext).length === 0) {
      errors.push(
        issue(
          'v21-method-overview-baseline-stale',
          slug,
          'Remove this paper from the method overview baseline because it now satisfies the contract.',
        ),
      );
    }
  }

  return { errors };
};

export const validateArchiveTimes = (records) => {
  const errors = [];
  const advisories = [];
  const times = new Map();

  for (const record of records) {
    const value = getFirstArchivedAt(record.markdown);
    const group = times.get(value) ?? [];
    group.push(record);
    times.set(value, group);
  }

  for (const [value, group] of times) {
    if (!value || group.length < 2) continue;
    for (const record of group) {
      const isStructured = ['v2', 'v2.1'].includes(workflowVersionFor(record.markdown).toLowerCase());
      const target = isStructured ? errors : advisories;
      target.push(
        issue(
          isStructured ? 'v2-archive-time-conflict' : 'legacy-archive-time-conflict',
          record.slug,
          `First-Archived-At ${value} is shared by ${group.map((item) => item.slug).join(', ')}.`,
        ),
      );
    }
  }

  return { errors, advisories };
};

export const validateAuthorProfiles = (profiles) => {
  const errors = [];
  if (!Array.isArray(profiles)) {
    return { errors: [issue('authors-shape', 'data/authors.json', 'Expected a JSON array.')] };
  }

  const slugOwners = new Map();
  const identityOwners = new Map();
  const directUrlFields = ['homepage', 'github', 'huggingFace', 'x'];

  for (const [index, profile] of profiles.entries()) {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      errors.push(issue('author-profile-shape', `profile[${index}]`, 'Each author profile must be an object.'));
      continue;
    }

    const slug = typeof profile.slug === 'string' ? profile.slug.trim() : '';
    const name = typeof profile.name === 'string' ? profile.name.trim() : '';
    const subject = slug || `profile[${index}]`;
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.push(issue('author-slug', subject, 'Author slug must be a non-empty ASCII slug.'));
    }
    if (!name) {
      errors.push(issue('author-name', subject, 'Author name must be a non-empty string.'));
    }
    if (profile.matchByName !== undefined && typeof profile.matchByName !== 'boolean') {
      errors.push(issue('author-match-by-name-shape', subject, 'matchByName must be a boolean when present.'));
    }

    if (slug && slugOwners.has(slug)) {
      errors.push(
        issue('author-slug-conflict', slug, `Slug is already used by ${slugOwners.get(slug)}.`),
      );
    } else if (slug) {
      slugOwners.set(slug, name);
    }

    let aliases = [];
    if (profile.aliases !== undefined && !Array.isArray(profile.aliases)) {
      errors.push(issue('author-aliases-shape', subject, 'aliases must be an array when present.'));
    } else {
      aliases = profile.aliases ?? [];
    }

    for (const identity of [name, ...aliases]) {
      if (typeof identity !== 'string') {
        errors.push(issue('author-alias', subject, 'Every alias must be a string.'));
        continue;
      }
      const key = normalizeAuthorKey(identity);
      if (!key) continue;
      const owner = identityOwners.get(key);
      if (owner && owner !== slug) {
        errors.push(
          issue(
            'author-identity-conflict',
            identity,
            `Normalized identity is shared by ${owner} and ${slug}.`,
          ),
        );
      } else if (slug) {
        identityOwners.set(key, slug);
      }
    }

    for (const fieldName of directUrlFields) {
      const value = profile[fieldName];
      if (value && (typeof value !== 'string' || !isHttpUrl(value))) {
        errors.push(issue('author-profile-url', subject, `${fieldName} must be a valid absolute HTTP URL.`));
      }
    }

    let representativePapers = [];
    if (profile.representativePapers !== undefined && !Array.isArray(profile.representativePapers)) {
      errors.push(
        issue(
          'author-representative-papers-shape',
          subject,
          'representativePapers must be an array when present.',
        ),
      );
    } else {
      representativePapers = profile.representativePapers ?? [];
    }
    if (representativePapers.length > 0 && !profile.homepage) {
      errors.push(
        issue(
          'author-representative-papers-homepage',
          subject,
          'representativePapers requires a verified homepage.',
        ),
      );
    }
    const representativePaperTitles = new Set();
    const representativePaperUrls = new Set();
    for (const [paperIndex, paper] of representativePapers.entries()) {
      if (!paper || typeof paper !== 'object' || Array.isArray(paper)) {
        errors.push(
          issue(
            'author-representative-paper-shape',
            `${subject}.representativePapers[${paperIndex}]`,
            'Every representative paper must be an object.',
          ),
        );
        continue;
      }

      const paperSubject = `${subject}.representativePapers[${paperIndex}]`;
      const title = typeof paper.title === 'string' ? paper.title.trim() : '';
      const url = typeof paper.url === 'string' ? paper.url.trim() : '';
      if (!title) {
        errors.push(
          issue('author-representative-paper-title', paperSubject, 'Representative paper title is required.'),
        );
      }
      if (!isHttpUrl(url)) {
        errors.push(
          issue(
            'author-representative-paper-url',
            paperSubject,
            'Representative paper URL must be an absolute HTTP URL.',
          ),
        );
      }
      if (
        paper.year !== undefined
        && (!Number.isInteger(paper.year) || paper.year < 1000 || paper.year > 9999)
      ) {
        errors.push(
          issue(
            'author-representative-paper-year',
            paperSubject,
            'Representative paper year must be a four-digit integer when present.',
          ),
        );
      }
      if (paper.venue !== undefined && (typeof paper.venue !== 'string' || !paper.venue.trim())) {
        errors.push(
          issue(
            'author-representative-paper-venue',
            paperSubject,
            'Representative paper venue must be a non-empty string when present.',
          ),
        );
      }

      const titleKey = normalizeAuthorKey(title);
      const urlKey = url.toLowerCase().replace(/\/+$/, '');
      if (
        (titleKey && representativePaperTitles.has(titleKey))
        || (urlKey && representativePaperUrls.has(urlKey))
      ) {
        errors.push(
          issue(
            'author-representative-paper-duplicate',
            paperSubject,
            'Representative papers must be unique by normalized title and URL.',
          ),
        );
      }
      if (titleKey) representativePaperTitles.add(titleKey);
      if (urlKey) representativePaperUrls.add(urlKey);
    }

    let sources = [];
    if (profile.sources !== undefined && !Array.isArray(profile.sources)) {
      errors.push(issue('author-sources-shape', subject, 'sources must be an array when present.'));
    } else {
      sources = profile.sources ?? [];
    }
    for (const source of sources) {
      const value = typeof source === 'string' ? source : source?.url;
      if (typeof value !== 'string' || !isHttpUrl(value)) {
        errors.push(issue('author-source-url', subject, 'Every source must contain a valid absolute HTTP URL.'));
      }
    }
    if (representativePapers.length > 0 && profile.homepage) {
      const homepageKey = String(profile.homepage).toLowerCase().replace(/\/+$/, '');
      const homepageIsSourced = sources.some((source) => {
        const value = typeof source === 'string' ? source : source?.url;
        return typeof value === 'string' && value.toLowerCase().replace(/\/+$/, '') === homepageKey;
      });
      if (!homepageIsSourced) {
        errors.push(
          issue(
            'author-representative-papers-source',
            subject,
            'representativePapers requires the verified homepage in sources.',
          ),
        );
      }
    }
  }

  return { errors };
};

export const findRecurringUnprofiled = (records, profiles) => {
  const profileKeys = new Set(
    profiles
      .filter((profile) => profile && typeof profile === 'object' && !Array.isArray(profile))
      .flatMap((profile) => [
        profile.name,
        ...(Array.isArray(profile.aliases) ? profile.aliases : []),
      ])
      .filter((name) => typeof name === 'string')
      .map(normalizeAuthorKey),
  );
  const mentions = new Map();

  for (const record of records) {
    const source = getSection(record.markdown, 'Source');
    for (const name of splitAuthorNames(getSourceField(source, ['Authors', 'Author']))) {
      const key = normalizeAuthorKey(name);
      const value = mentions.get(key) ?? { name, paperSlugs: new Set() };
      value.paperSlugs.add(record.slug);
      mentions.set(key, value);
    }
  }

  return [...mentions.entries()]
    .filter(([key, value]) => !profileKeys.has(key) && value.paperSlugs.size >= 2)
    .map(([, value]) => issue('recurring-unprofiled-author', value.name, `Appears in ${value.paperSlugs.size} papers.`))
    .sort((left, right) => left.subject.localeCompare(right.subject));
};

export const findOrphanAuthorProfiles = (records, profiles) => {
  if (!Array.isArray(profiles)) return [];
  const references = records.map((record) => {
    const source = getSection(record.markdown, 'Source');
    return collectAuthorReferences(record.markdown, getSourceField(source, ['Authors', 'Author']));
  });

  return profiles
    .filter((profile) => profile && typeof profile === 'object' && !Array.isArray(profile))
    .filter((profile) => !references.some((paperReferences) => authorProfileIsReferenced(profile, paperReferences)))
    .map((profile) =>
      issue(
        'orphan-author-profile',
        profile.slug || profile.name || 'unknown-author',
        'Author profile has no remaining archived paper reference.',
      ),
    )
    .sort((left, right) => left.subject.localeCompare(right.subject));
};

export const validateArchiveCollections = ({ records, profiles, indexMarkdown, knownPaperSlugs }) => ({
  errors: [
    ...validateArchiveIndex(indexMarkdown, knownPaperSlugs).errors,
    ...validateAuthorProfiles(profiles).errors,
    ...findOrphanAuthorProfiles(records, profiles),
  ],
  advisories: findRecurringUnprofiled(records, Array.isArray(profiles) ? profiles : []),
});

export const summarizeAdvisories = (advisories, limit = 5) => {
  const grouped = new Map();
  for (const advisory of advisories) {
    const group = grouped.get(advisory.code) ?? [];
    group.push(advisory);
    grouped.set(advisory.code, group);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([code, issues]) => ({ code, count: issues.length, examples: issues.slice(0, limit) }));
};
