import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { instance as createVizInstance } from '@viz-js/viz';
import { renderMarkdown } from './content/markdown.mjs';

const repoRoot = process.cwd();
const generatedPath = path.join(repoRoot, 'src', 'generated', 'mainline-data.json');

const relationNatureLabels = {
  'direct-inheritance': '直接继承',
  'problem-response': '问题响应',
  'combination-reuse': '组合复用',
  'parallel-route': '平行路线',
  'counterexample-correction': '反例修正',
};

const evidenceKindLabels = {
  'paper-explicit': '论文明确陈述',
  'official-successor': '作者或官方续作',
  'mechanism-experiment': '机制与实验依据',
};

const recognitionKindLabels = {
  'top-venue': '顶会正式论文',
  'multiple-strong-followups': '多项重要后续沿用',
  'official-successor': '官方后续工作',
  'production-adoption': '生产系统采用',
  'widely-used-benchmark': '广泛使用的评测基准',
  'year-adjusted-citation-impact': '同年份高引用影响',
};

const asArray = (value) => (Array.isArray(value) ? value : value == null ? [] : [value]);
const dotQuote = (value) => JSON.stringify(String(value ?? ''));
const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const renderDetail = (value) => {
  const items = asArray(value).map((item) => String(item ?? '').trim()).filter(Boolean);
  if (items.length === 0) return '';
  const safeItems = items.map((item) =>
    item.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
  );
  if (safeItems.length === 1) return renderMarkdown(safeItems[0]);
  return renderMarkdown(safeItems.map((item) => `- ${item}`).join('\n'));
};

const wrapGraphLabel = (name, date) => {
  const text = String(name ?? '').trim();
  const parts = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  if (parts.length <= 1) {
    for (let offset = 0; offset < text.length; offset += 20) {
      lines.push(text.slice(offset, offset + 20));
    }
  } else {
    for (const part of parts) {
      const next = current ? `${current} ${part}` : part;
      if (current && next.length > 22) {
        lines.push(current);
        current = part;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }

  lines.push(String(date ?? ''));
  return lines.filter(Boolean).join('\n');
};

const relationEvidenceKind = (relation) => {
  const kinds = new Set(asArray(relation.evidence).map((evidence) => evidence.kind));
  if (kinds.has('paper-explicit')) return 'paper-explicit';
  if (kinds.has('official-successor')) return 'official-successor';
  return 'mechanism-experiment';
};

const relationAppliesToLine = (relation, lineId) =>
  asArray(relation.contexts).some((context) => context.lineId === lineId);

const relationDotAttributes = (relation) => {
  const evidenceKind = relationEvidenceKind(relation);
  const isCounterexample = relation.nature === 'counterexample-correction';
  const attributes = {
    id: `graph-relation-${relation.id}`,
    class: isCounterexample
      ? 'relation-counterexample'
      : evidenceKind === 'mechanism-experiment'
        ? 'relation-local'
        : evidenceKind === 'official-successor'
          ? 'relation-official'
          : 'relation-explicit',
    color: isCounterexample ? '#a64d1f' : '#60716d',
    fontcolor: isCounterexample ? '#7e3516' : '#52635f',
    penwidth: evidenceKind === 'official-successor' ? 2 : 1.4,
    style: evidenceKind === 'mechanism-experiment' ? 'dashed' : 'solid',
    arrowhead: isCounterexample ? 'tee' : 'normal',
    arrowsize: 0.72,
    tooltip: `${relationNatureLabels[relation.nature] ?? relation.nature} · ${evidenceKindLabels[evidenceKind] ?? evidenceKind}`,
  };
  return Object.entries(attributes)
    .map(([key, value]) => `${key}=${dotQuote(value)}`)
    .join(', ');
};

const buildGraphDot = (line, methods, relations) => {
  const nodeStatements = methods.map((method) => {
    const external = method.archiveStatus === 'external';
    const attributes = {
      id: `graph-method-${line.id}-${method.id}`,
      class: external ? 'method-node method-external' : 'method-node method-archived',
      label: wrapGraphLabel(method.name, method.dateLabel || method.date),
      href: `#method-${method.id}`,
      tooltip: `${method.name} · ${method.dateLabel || method.date}${external ? ' · 未归档' : ''}`,
      shape: 'box',
      style: external ? 'rounded,dashed,filled' : 'rounded,filled',
      color: external ? '#a27832' : '#6f817c',
      fillcolor: external ? '#fff9e9' : '#f4faf7',
      fontcolor: '#18313a',
      fontname: 'Arial',
      fontsize: 11,
      margin: '0.13,0.09',
      target: '_self',
    };
    const serialized = Object.entries(attributes)
      .map(([key, value]) => `${key}=${dotQuote(value)}`)
      .join(', ');
    return `  ${dotQuote(method.id)} [${serialized}];`;
  });

  const visibleEdges = relations.map((relation) => {
    if (relation.nature === 'parallel-route' || relation.directed === false) {
      const attributes = {
        id: `graph-relation-${relation.id}`,
        class: 'relation-parallel',
        color: '#82908c',
        style: 'dotted',
        dir: 'none',
        constraint: false,
        tooltip: relationNatureLabels[relation.nature] ?? '平行路线',
      };
      const serialized = Object.entries(attributes)
        .map(([key, value]) => `${key}=${dotQuote(value)}`)
        .join(', ');
      return `  ${dotQuote(relation.from)} -> ${dotQuote(relation.to)} [${serialized}];`;
    }
    return `  ${dotQuote(relation.from)} -> ${dotQuote(relation.to)} [${relationDotAttributes(relation)}];`;
  });

  const chronologicalEdges = methods.slice(1).map((method, index) => {
    const previous = methods[index];
    return `  ${dotQuote(previous.id)} -> ${dotQuote(method.id)} [style=invis, weight=80, constraint=true];`;
  });

  return [
    `digraph ${dotQuote(`mainline-${line.id}`)} {`,
    '  graph [rankdir=LR, bgcolor="transparent", pad=0.18, nodesep=0.42, ranksep=0.72, outputorder=edgesfirst, splines=spline];',
    '  node [shape=box];',
    '  edge [fontname="Arial", fontsize=9];',
    ...nodeStatements,
    ...visibleEdges,
    ...chronologicalEdges,
    '}',
  ].join('\n');
};

const makeSvgAccessible = (svg, line) => {
  const titleId = `mainline-graph-title-${line.id}`;
  const descriptionId = `mainline-graph-description-${line.id}`;
  const title = `${line.name}的方法演进图`;
  const description = '方法节点从左到右按首次公开时间排列；箭头只表示有证据记录的关系。';
  const rootTitle = `<title id="${titleId}">${escapeHtml(title)}</title><desc id="${descriptionId}">${escapeHtml(description)}</desc>`;
  const result = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<g\b[^>]*>)\s*<title>[\s\S]*?<\/title>/g, '$1')
    .replace(
      /<svg\b/,
      `<svg class="mainline-dag" role="group" aria-labelledby="${titleId} ${descriptionId}" focusable="false"`,
    )
    .replace(/(<svg\b[^>]*>)/, `$1${rootTitle}`)
    .replaceAll('xlink:href=', 'href=')
    .replaceAll('xlink:title=', 'aria-label=')
    .replaceAll('&#45;', '-');

  if (/<script\b|<foreignObject\b|\son[a-z]+\s*=|javascript:/i.test(result)) {
    throw new Error(`Unsafe SVG output generated for ${line.id}.`);
  }
  for (const match of result.matchAll(/\shref="([^"]+)"/g)) {
    if (!match[1].startsWith('#method-')) {
      throw new Error(`Unexpected SVG link for ${line.id}: ${match[1]}`);
    }
  }
  return result;
};

const validationErrors = (result) => {
  if (result == null || result === true) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.errors)) return result.errors;
  if (result.valid === false) return [result.message || 'Research mainline validation failed.'];
  return [];
};

const formatValidationIssue = (item) => {
  if (typeof item === 'string') return item;
  const prefix = [item?.code && `[${item.code}]`, item?.subject].filter(Boolean).join(' ');
  return `${prefix}${prefix ? ': ' : ''}${item?.message ?? String(item)}`;
};

const main = async () => {
  const model = await import('./content/research-mainlines.mjs');
  const load = model.load ?? model.loadResearchMainlines ?? model.loadMainlineSource;
  const validate = model.validate ?? model.validateResearchMainlines ?? model.validateMainlineSource;
  const buildMainlineViews = model.buildMainlineViews;

  if (typeof load !== 'function' || typeof validate !== 'function' || typeof buildMainlineViews !== 'function') {
    throw new Error('scripts/content/research-mainlines.mjs must export load, validate, and buildMainlineViews.');
  }

  const source = await load({ repoRoot });
  const validation = await validate(source, { repoRoot });
  const errors = validationErrors(validation);
  if (errors.length > 0) {
    throw new Error(errors.map(formatValidationIssue).join('\n'));
  }
  for (const advisory of validation?.advisories ?? []) {
    console.warn(`Mainline advisory ${formatValidationIssue(advisory)}`);
  }

  const prepared = (await buildMainlineViews(source, { repoRoot })) ?? {};
  const preparedLines = Array.isArray(prepared) ? prepared : prepared.lines ?? [];
  const preparedById = new Map(preparedLines.map((line) => [line.id, line]));
  const nodes = prepared.nodes ?? source.nodes ?? [];
  const memberships = prepared.memberships ?? source.memberships ?? [];
  const relations = prepared.relations ?? source.relations ?? [];
  const facets = prepared.facets ?? source.facets ?? [];
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const facetsById = new Map(facets.map((facet) => [facet.id, facet]));
  const viz = await createVizInstance();
  const undirectedTableTarget = (relation) => {
    const fromDate = nodesById.get(relation.from)?.firstPublic?.value ?? '';
    const toDate = nodesById.get(relation.to)?.firstPublic?.value ?? '';
    if (fromDate === toDate || fromDate.startsWith(toDate) || toDate.startsWith(fromDate)) {
      return relation.to;
    }
    return fromDate.localeCompare(toDate) <= 0 ? relation.to : relation.from;
  };

  const lines = [];
  for (const sourceLine of source.lines ?? preparedLines) {
    const preparedLine = preparedById.get(sourceLine.id) ?? {};
    const line = { ...sourceLine, ...preparedLine };
    const lineMemberships = memberships.filter((membership) => membership.lineId === line.id);
    const lineNodeIds = new Set(lineMemberships.map((membership) => membership.nodeId));
    const lineRelations = relations.filter(
      (relation) =>
        relationAppliesToLine(relation, line.id) && lineNodeIds.has(relation.from) && lineNodeIds.has(relation.to),
    );

    const methods = lineMemberships
      .map((membership) => {
        const node = nodesById.get(membership.nodeId);
        if (!node) throw new Error(`Missing method node ${membership.nodeId} for ${line.id}.`);
        const incomingRelations = lineRelations.filter((relation) => {
          if (relation.nature === 'parallel-route' || relation.directed === false) {
            return undirectedTableTarget(relation) === node.id;
          }
          return relation.to === node.id;
        });
        const relativeContexts = incomingRelations
          .map((relation) => ({
            relation,
            context: asArray(relation.contexts).find((context) => context.lineId === line.id),
          }))
          .filter((entry) => entry.context);
        const contextualCopy = (field) => [
          ...new Set(
            relativeContexts
              .map(({ relation, context }) => {
                const copy = context[field];
                if (!copy) return '';
                if (relativeContexts.length === 1) return copy;
                const predecessorId = relation.to === node.id ? relation.from : relation.to;
                return `${nodesById.get(predecessorId)?.name ?? predecessorId}：${copy}`;
              })
              .filter(Boolean),
          ),
        ];
        const relativePriorProblems = contextualCopy('priorProblem');
        const relativeOptimizations = contextualCopy('optimization');
        const incoming = incomingRelations.map((relation) => {
          const fromId = relation.to === node.id ? relation.from : relation.to;
          const from = nodesById.get(fromId);
          const evidence = asArray(relation.evidence).map((item) => ({
            kind: item.kind,
            label: evidenceKindLabels[item.kind] ?? item.kind,
            url: item.sourceUrl,
            locator: item.locator,
            claim: item.claim,
          }));
          return {
            relationId: relation.id,
            fromId,
            fromName: from?.name ?? fromId,
            nature: relation.nature,
            natureLabel: relationNatureLabels[relation.nature] ?? relation.nature,
            evidenceKind: relationEvidenceKind(relation),
            evidenceLabel: evidenceKindLabels[relationEvidenceKind(relation)] ?? relationEvidenceKind(relation),
            evidenceUrl: evidence[0]?.url ?? '',
            evidence,
            note: evidence.map((item) => item.claim).filter(Boolean).join('；'),
          };
        });
        const sourceInfo = node.source ?? {};
        const archiveStatus = sourceInfo.archiveState ?? 'external';
        return {
          id: node.id,
          name: node.name,
          date: node.firstPublic?.value ?? '',
          dateLabel: node.firstPublic?.value ?? '',
          datePrecision: node.firstPublic?.precision ?? 'month',
          archiveStatus,
          paperPath: archiveStatus !== 'external' && sourceInfo.materialSlug ? `/papers/${sourceInfo.materialSlug}/` : '',
          sourceUrl: sourceInfo.canonicalUrl || node.firstPublic?.sourceUrl || '',
          sourceLabel: sourceInfo.title || 'Canonical source',
          recognition: asArray(node.recognition).map((item) => ({
            kind: item.kind,
            label: recognitionKindLabels[item.kind] ?? item.kind,
            url: item.sourceUrl,
            note: item.note,
          })),
          summary: node.summary ?? '',
          role: membership.role,
          importance: membership.importance,
          priorProblem: relativePriorProblems.length > 0 ? relativePriorProblems.join('；') : membership.priorProblem,
          optimization: relativeOptimizations.length > 0 ? relativeOptimizations.join('；') : membership.optimization,
          incoming,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, 'zh-CN'));

    const detail = line.detail ?? {};
    const facetIds = line.facets ?? line.facetIds ?? [];
    const candidate = line.candidate ?? line;
    const view = {
      id: line.id,
      name: line.name,
      question: line.question,
      status: line.status,
      statusLabel: line.statusLabel || (line.status === 'candidate' ? '候选方向' : '正式主线'),
      facetIds,
      primaryFacetId: facetIds[0] ?? '',
      facetLabels: facetIds.map((facetId) => facetsById.get(facetId)?.name ?? facetId),
      methodCount: methods.length,
      relationCount: lineRelations.length,
      latestDate: methods.at(-1)?.date ?? '',
      scopeHtml: renderDetail(detail.scope),
      evolutionHtml: renderDetail(detail.evolution),
      divergencesHtml: renderDetail(detail.divergences),
      judgmentHtml: renderDetail(detail.judgment),
      openQuestionsHtml: renderDetail(detail.openQuestions),
      currentState: candidate.currentState ?? '',
      evidenceGap: candidate.evidenceGap ?? '',
      promotionCondition: candidate.promotionCondition ?? '',
      methods,
      relations: lineRelations,
      graphSvg: '',
    };

    if (view.status === 'formal' && methods.length > 0) {
      const dot = buildGraphDot(view, methods, lineRelations);
      const svg = viz.renderString(dot, { engine: 'dot', format: 'svg_inline' });
      view.graphSvg = makeSvgAccessible(svg, view);
    }
    lines.push(view);
  }

  const snapshot = source.snapshot ?? prepared.snapshot ?? {};
  const output = {
    snapshot: typeof snapshot === 'string' ? snapshot : snapshot.asOf,
    updatedAt: typeof snapshot === 'object' ? snapshot.updatedAt ?? snapshot.asOf : snapshot,
    paperCount: (source.materials ?? prepared.materials ?? []).length,
    facets: facets.map((facet, index) => ({
      id: facet.id,
      name: facet.name,
      description: facet.description ?? '',
      order: facet.order ?? index,
    })),
    lines,
  };

  await fs.mkdir(path.dirname(generatedPath), { recursive: true });
  await fs.writeFile(generatedPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generated ${lines.length} research mainline pages with ${lines.filter((line) => line.graphSvg).length} static graphs.`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
