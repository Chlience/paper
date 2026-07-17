import fs from 'node:fs/promises';
import path from 'node:path';
import { getFirstArchivedAt } from './markdown.mjs';

const FACET_IDS = [
  'resource-frontier',
  'context-state',
  'agent-runtime',
  'agent-environments',
  'reasoning-boundary',
  'credit-verification',
  'rl-systems',
  'reward-integrity',
];

const LINE_STATUSES = new Set(['formal', 'candidate']);
const NODE_KINDS = new Set(['method', 'system', 'architecture', 'objective', 'estimator', 'protocol']);
const ARCHIVE_STATES = new Set(['full-note', 'embedded', 'external']);
const MEMBERSHIP_ROLES = new Set(['core', 'cross-line-dependency']);
const MEMBERSHIP_IMPORTANCE = new Set(['primary', 'supporting']);
const RELATION_NATURES = new Set([
  'direct-inheritance',
  'problem-response',
  'combination-reuse',
  'parallel-route',
  'counterexample-correction',
]);
const EVIDENCE_KINDS = new Set(['paper-explicit', 'official-successor', 'mechanism-experiment']);
const RECOGNITION_KINDS = new Set([
  'top-venue',
  'official-successor',
  'multiple-strong-followups',
  'production-adoption',
  'widely-used-benchmark',
  'year-adjusted-citation-impact',
]);
const MATERIAL_ROLES = new Set(['contribution', 'evidence', 'counterexample', 'boundary', 'synthesis']);
const STATUS_BASIS_KINDS = new Set(['multiple-archived-methods', 'archived-plus-external']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAPER_SLUG_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const HTTP_PATTERN = /^https?:\/\//i;
const PAPER_PATH_PATTERN = /^\/papers\/([^/]+)\/$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const GENERIC_DETAIL_MARKERS = [
  '本线围绕“',
  '当前入口节点包括',
  '并行路线在信息保留、额外计算、通信与部署前提上采用不同权衡',
  '当前证据支持将“',
  '怎样围绕“',
  '哪些收益能够扩展到更长任务、更大规模和真实负载',
];
const GENERIC_MEMBERSHIP_MARKER = '既有路线尚未完整回答：';

const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const isSourceUrl = (value) => HTTP_PATTERN.test(value ?? '') || PAPER_PATH_PATTERN.test(value ?? '');
const arraysEqual = (left, right) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const isValidCalendarDate = (value, precision) => {
  if (precision === 'month') {
    if (!MONTH_PATTERN.test(value ?? '')) return false;
    const [, month] = value.split('-').map(Number);
    return month >= 1 && month <= 12;
  }
  if (precision !== 'day' || !DAY_PATTERN.test(value ?? '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const isConnected = (nodeIds, edges) => {
  if (nodeIds.length < 2) return false;
  const adjacency = new Map(nodeIds.map((nodeId) => [nodeId, new Set()]));
  for (const [from, to] of edges) {
    if (!adjacency.has(from) || !adjacency.has(to)) continue;
    adjacency.get(from).add(to);
    adjacency.get(to).add(from);
  }
  const visited = new Set([nodeIds[0]]);
  const queue = [nodeIds[0]];
  for (let index = 0; index < queue.length; index += 1) {
    for (const next of adjacency.get(queue[index]) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return visited.size === nodeIds.length;
};

const dateMonth = (firstPublic) => String(firstPublic?.value ?? '').slice(0, 7);
const isClearlyAfter = (left, right) => {
  const leftMonth = dateMonth(left);
  const rightMonth = dateMonth(right);
  if (leftMonth !== rightMonth) return leftMonth > rightMonth;
  return left?.precision === 'day' && right?.precision === 'day' && left.value > right.value;
};

const issue = (code, subject, message) => ({ code, subject, message });

const duplicateValues = (values) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
};

const hasCycle = (nodeIds, edges) => {
  const adjacency = new Map(nodeIds.map((nodeId) => [nodeId, []]));
  const indegree = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
  for (const [from, to] of edges) {
    if (!adjacency.has(from) || !adjacency.has(to)) continue;
    adjacency.get(from).push(to);
    indegree.set(to, indegree.get(to) + 1);
  }
  const queue = [...indegree].filter(([, degree]) => degree === 0).map(([nodeId]) => nodeId);
  let visited = 0;
  for (let index = 0; index < queue.length; index += 1) {
    const nodeId = queue[index];
    visited += 1;
    for (const next of adjacency.get(nodeId)) {
      const nextDegree = indegree.get(next) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree === 0) queue.push(next);
    }
  }
  return visited !== nodeIds.length;
};

const readPaperInventory = async (repoRoot) => {
  const papersDir = path.join(repoRoot, 'content', 'papers');
  const fileNames = (await fs.readdir(papersDir)).filter((fileName) => fileName.endsWith('.md')).sort();
  return Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.slice(0, -3);
      const markdown = await fs.readFile(path.join(papersDir, fileName), 'utf8');
      return { slug, firstArchivedAt: getFirstArchivedAt(markdown) };
    }),
  );
};

export const loadResearchMainlines = async ({ repoRoot = process.cwd() } = {}) => {
  const file = path.join(repoRoot, 'data', 'research-mainlines.json');
  return JSON.parse(await fs.readFile(file, 'utf8'));
};

export const validateResearchMainlines = async (
  source,
  { repoRoot = process.cwd(), requireCurrent = false } = {},
) => {
  const errors = [];
  const advisories = [];
  const addError = (code, subject, message) => errors.push(issue(code, subject, message));
  const addAdvisory = (code, subject, message) => advisories.push(issue(code, subject, message));

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { valid: false, errors: [issue('schema', 'root', 'Expected a JSON object.')], advisories };
  }
  if (source.schemaVersion !== 2) addError('schema-version', 'root', 'schemaVersion must equal 2.');

  const snapshot = source.snapshot ?? {};
  const snapshotDateValid = isValidCalendarDate(snapshot.asOf, 'day');
  if (!snapshotDateValid) addError('snapshot-date', 'snapshot.asOf', 'Expected a valid YYYY-MM-DD date.');
  if (!ISO_DATE_TIME_PATTERN.test(snapshot.updatedAt ?? '') || Number.isNaN(Date.parse(snapshot.updatedAt))) {
    addError('snapshot-updated-at', 'snapshot.updatedAt', 'Expected an ISO date-time.');
  } else if (snapshot.updatedAt.slice(0, 10) < snapshot.asOf) {
    addError('snapshot-updated-before-as-of', 'snapshot.updatedAt', 'updatedAt cannot be earlier than snapshot.asOf.');
  }
  if (!/^[0-9a-f]{7,40}$/i.test(snapshot.sourceRevision ?? '')) {
    addError('snapshot-revision', 'snapshot.sourceRevision', 'Expected a Git revision.');
  }
  if (snapshot.updateMode !== 'manual') {
    addError('snapshot-update-mode', 'snapshot.updateMode', 'Only manual updates are supported.');
  }

  for (const field of ['facets', 'lines', 'nodes', 'memberships', 'relations', 'materials']) {
    if (!Array.isArray(source[field])) addError('schema-array', field, `${field} must be an array.`);
  }
  if (errors.some((item) => item.code === 'schema-array')) return { valid: false, errors, advisories };

  const facetIds = source.facets.map((facet) => facet?.id);
  const lineIds = source.lines.map((line) => line?.id);
  const nodeIds = source.nodes.map((node) => node?.id);
  const relationIds = source.relations.map((relation) => relation?.id);
  const materialSlugs = source.materials.map((material) => material?.slug);
  const facetIdSet = new Set(facetIds);
  const lineIdSet = new Set(lineIds);
  const nodeIdSet = new Set(nodeIds);
  const materialSlugSet = new Set(materialSlugs);
  const nodesById = new Map(source.nodes.map((node) => [node.id, node]));
  const membershipsByLine = new Map(source.lines.map((line) => [line.id, []]));
  const relationsByLine = new Map(source.lines.map((line) => [line.id, []]));

  for (const [label, ids] of [
    ['facet', facetIds],
    ['line', lineIds],
    ['node', nodeIds],
    ['relation', relationIds],
    ['material', materialSlugs],
  ]) {
    for (const duplicate of duplicateValues(ids)) addError('duplicate-id', `${label}:${duplicate}`, 'ID must be unique.');
  }

  if (!arraysEqual([...facetIdSet].sort(), [...FACET_IDS].sort())) {
    addError('facet-catalog', 'facets', `Facet IDs must be exactly: ${FACET_IDS.join(', ')}.`);
  }
  for (const facet of source.facets) {
    if (!ID_PATTERN.test(facet.id ?? '')) addError('facet-id', facet.id ?? 'facet', 'Expected a stable kebab-case ID.');
    if (!nonEmpty(facet.name)) addError('facet-name', facet.id, 'name is required.');
    if (!Number.isInteger(facet.order)) addError('facet-order', facet.id, 'order must be an integer.');
  }

  for (const node of source.nodes) {
    const subject = node.id ?? 'node';
    if (!ID_PATTERN.test(node.id ?? '')) addError('node-id', subject, 'Expected a stable kebab-case ID.');
    if (!nonEmpty(node.name)) addError('node-name', subject, 'name is required.');
    if (!NODE_KINDS.has(node.kind)) addError('node-kind', subject, `Unknown kind: ${node.kind}.`);
    const firstPublic = node.firstPublic ?? {};
    if (!isValidCalendarDate(firstPublic.value, firstPublic.precision)) {
      addError('node-date', subject, 'firstPublic must preserve day or month precision.');
    }
    if (snapshotDateValid && (dateMonth(firstPublic) > snapshot.asOf.slice(0, 7) || firstPublic.value > snapshot.asOf)) {
      addError('node-after-snapshot', subject, 'firstPublic cannot be later than snapshot.asOf.');
    }
    if (!isSourceUrl(firstPublic.sourceUrl)) {
      addError('node-date-source', subject, 'firstPublic.sourceUrl must be HTTP(S) or a canonical /papers/<slug>/ path.');
    }
    const nodeSource = node.source ?? {};
    if (!ARCHIVE_STATES.has(nodeSource.archiveState)) {
      addError('node-archive-state', subject, `Unknown archiveState: ${nodeSource.archiveState}.`);
    }
    if (!isSourceUrl(nodeSource.canonicalUrl)) {
      addError('node-source-url', subject, 'source.canonicalUrl must be HTTP(S) or a canonical /papers/<slug>/ path.');
    }
    if (!nonEmpty(nodeSource.title) || !nonEmpty(node.summary)) {
      addError('node-copy', subject, 'source.title and summary are required.');
    }
    if (nodeSource.archiveState === 'external') {
      if (nodeSource.materialSlug) addError('external-material', subject, 'External nodes cannot claim a local materialSlug.');
      if (!HTTP_PATTERN.test(firstPublic.sourceUrl ?? '') || !HTTP_PATTERN.test(nodeSource.canonicalUrl ?? '')) {
        addError('external-source-url', subject, 'External nodes require public HTTP(S) source URLs.');
      }
      if (!(node.recognition?.length > 0)) {
        addError('external-recognition', subject, 'Every external node requires at least one recognition record.');
      }
    } else if (!materialSlugSet.has(nodeSource.materialSlug)) {
      addError('archived-material', subject, `Unknown materialSlug: ${nodeSource.materialSlug}.`);
    }
    if (nodeSource.archiveState !== 'external') {
      for (const [field, url] of [
        ['firstPublic.sourceUrl', firstPublic.sourceUrl],
        ['source.canonicalUrl', nodeSource.canonicalUrl],
      ]) {
        const localPath = String(url ?? '').match(PAPER_PATH_PATTERN);
        if (localPath && localPath[1] !== nodeSource.materialSlug) {
          addError('node-local-source-owner', `${subject}:${field}`, 'Local paper paths must match source.materialSlug.');
        }
      }
    }
    if (node.recognition != null && !Array.isArray(node.recognition)) {
      addError('recognition-array', subject, 'recognition must be an array.');
    }
    for (const recognition of node.recognition ?? []) {
      if (!RECOGNITION_KINDS.has(recognition.kind)) {
        addError('recognition-kind', subject, `Unknown recognition kind: ${recognition.kind}.`);
      }
      if (!HTTP_PATTERN.test(recognition.sourceUrl ?? '') || !nonEmpty(recognition.note)) {
        addError('recognition-source', subject, 'Recognition requires a sourceUrl and note.');
      }
    }
  }

  const membershipKeys = [];
  for (const membership of source.memberships) {
    const subject = `${membership.lineId ?? '?'}:${membership.nodeId ?? '?'}`;
    membershipKeys.push(subject);
    if (!lineIdSet.has(membership.lineId)) addError('membership-line', subject, 'Unknown lineId.');
    if (!nodeIdSet.has(membership.nodeId)) addError('membership-node', subject, 'Unknown nodeId.');
    if (!MEMBERSHIP_ROLES.has(membership.role)) addError('membership-role', subject, `Unknown role: ${membership.role}.`);
    if (!MEMBERSHIP_IMPORTANCE.has(membership.importance)) {
      addError('membership-importance', subject, `Unknown importance: ${membership.importance}.`);
    }
    if (!nonEmpty(membership.priorProblem) || !nonEmpty(membership.optimization)) {
      addError('membership-copy', subject, 'priorProblem and optimization are required.');
    }
    if (membership.priorProblem?.includes(GENERIC_MEMBERSHIP_MARKER)) {
      addError('membership-template-copy', subject, 'priorProblem must describe this method and line directly.');
    }
    const memberNode = nodesById.get(membership.nodeId);
    if (memberNode && membership.optimization?.trim() === memberNode.summary?.trim()) {
      addError('membership-summary-copy', subject, 'optimization must explain the line-specific improvement instead of repeating node.summary.');
    }
    membershipsByLine.get(membership.lineId)?.push(membership);
  }
  for (const duplicate of duplicateValues(membershipKeys)) {
    addError('duplicate-membership', duplicate, 'A node can appear only once within a line.');
  }
  const memberNodeIds = new Set(source.memberships.map((membership) => membership.nodeId));
  for (const nodeId of nodeIds) {
    if (!memberNodeIds.has(nodeId)) addError('node-membership', nodeId, 'Every node must belong to at least one line.');
  }

  const relationContextKeys = [];
  const relationEdgeKeys = [];
  const relationPairKeys = [];
  for (const relation of source.relations) {
    const subject = relation.id ?? 'relation';
    if (!ID_PATTERN.test(relation.id ?? '')) addError('relation-id', subject, 'Expected a stable kebab-case ID.');
    if (!nodeIdSet.has(relation.from) || !nodeIdSet.has(relation.to)) {
      addError('relation-endpoint', subject, 'Both relation endpoints must exist.');
    }
    if (relation.from === relation.to) addError('relation-self-loop', subject, 'Self-relations are not allowed.');
    if (!RELATION_NATURES.has(relation.nature)) addError('relation-nature', subject, `Unknown nature: ${relation.nature}.`);
    if (relation.nature === 'parallel-route' ? relation.directed !== false : relation.directed !== true) {
      addError('relation-direction', subject, 'Parallel routes must be undirected; all other relations must be directed.');
    }
    if (!Array.isArray(relation.contexts) || relation.contexts.length === 0) {
      addError('relation-contexts', subject, 'At least one line context is required.');
    }
    if (!Array.isArray(relation.evidence) || relation.evidence.length === 0) {
      addError('relation-evidence', subject, 'At least one evidence record is required.');
    }
    for (const context of relation.contexts ?? []) {
      const contextSubject = `${subject}:${context.lineId ?? '?'}`;
      relationContextKeys.push(contextSubject);
      const endpoints = relation.directed === false
        ? [relation.from, relation.to].sort().join('~')
        : `${relation.from}>${relation.to}`;
      relationEdgeKeys.push(`${context.lineId}:${relation.nature}:${endpoints}`);
      relationPairKeys.push(`${context.lineId}:${[relation.from, relation.to].sort().join('~')}`);
      if (!lineIdSet.has(context.lineId)) addError('relation-line', contextSubject, 'Unknown lineId.');
      const memberIds = new Set((membershipsByLine.get(context.lineId) ?? []).map((membership) => membership.nodeId));
      if (!memberIds.has(relation.from) || !memberIds.has(relation.to)) {
        addError('relation-membership', contextSubject, 'Both endpoints must be members of the relation line.');
      }
      if (!nonEmpty(context.priorProblem) || !nonEmpty(context.optimization)) {
        addError('relation-copy', contextSubject, 'priorProblem and optimization are required.');
      }
      relationsByLine.get(context.lineId)?.push(relation);
    }
    const fromNode = nodesById.get(relation.from);
    const toNode = nodesById.get(relation.to);
    if (relation.directed === true && fromNode && toNode && isClearlyAfter(fromNode.firstPublic, toNode.firstPublic)) {
      addError('relation-chronology', subject, 'Directed relations must point from an earlier method to a later method.');
    }
    for (const evidence of relation.evidence ?? []) {
      if (!EVIDENCE_KINDS.has(evidence.kind)) addError('evidence-kind', subject, `Unknown kind: ${evidence.kind}.`);
      if (!isSourceUrl(evidence.sourceUrl)) {
        addError('evidence-url', subject, 'Evidence requires HTTP(S) or a canonical /papers/<slug>/ path.');
      }
      if (!nonEmpty(evidence.locator) || !nonEmpty(evidence.claim)) {
        addError('evidence-copy', subject, 'Evidence requires locator and claim.');
      }
      const localEvidence = String(evidence.sourceUrl ?? '').match(PAPER_PATH_PATTERN);
      if (localEvidence && !materialSlugSet.has(localEvidence[1])) {
        addError('evidence-local-path', subject, `Evidence links to unknown material: ${localEvidence[1]}.`);
      }
    }
  }
  for (const duplicate of duplicateValues(relationContextKeys)) {
    addError('duplicate-relation-context', duplicate, 'A relation can have only one context per line.');
  }
  for (const duplicate of duplicateValues(relationEdgeKeys)) {
    addError('duplicate-relation-edge', duplicate, 'Duplicate relation edges are not allowed within a line.');
  }
  for (const duplicate of duplicateValues(relationPairKeys)) {
    addError('duplicate-relation-pair', duplicate, 'A method pair can have only one relation within a line.');
  }

  for (const line of source.lines) {
    const subject = line.id ?? 'line';
    if (!ID_PATTERN.test(line.id ?? '')) addError('line-id', subject, 'Expected a stable kebab-case ID.');
    if (!nonEmpty(line.name) || !nonEmpty(line.question)) addError('line-copy', subject, 'name and question are required.');
    if (!LINE_STATUSES.has(line.status)) addError('line-status', subject, `Unknown status: ${line.status}.`);
    if (!Array.isArray(line.facets) || line.facets.length === 0 || line.facets.some((id) => !facetIdSet.has(id))) {
      addError('line-facets', subject, 'facets must reference at least one known facet.');
    }
    if (new Set(line.facets ?? []).size !== (line.facets ?? []).length) addError('line-facet-duplicate', subject, 'facets must be unique.');
    const detail = line.detail ?? {};
    const requiredDetailFields = line.status === 'formal'
      ? ['scope', 'evolution', 'divergences', 'judgment', 'openQuestions']
      : ['scope'];
    for (const field of requiredDetailFields) {
      if (!Array.isArray(detail[field]) || detail[field].length === 0 || detail[field].some((item) => !nonEmpty(item))) {
        addError('line-detail', `${subject}.${field}`, 'Expected a non-empty string array.');
      }
    }
    if (
      line.status === 'formal' &&
      Object.values(detail).flat().some((item) =>
        GENERIC_DETAIL_MARKERS.some((marker) => String(item).includes(marker)),
      )
    ) {
      addError('line-template-copy', subject, 'Formal line details must use line-specific analysis instead of scaffold copy.');
    }
    const memberships = membershipsByLine.get(line.id) ?? [];
    const memberIds = new Set(memberships.map((membership) => membership.nodeId));
    const directedEdges = (relationsByLine.get(line.id) ?? [])
      .filter((relation) => relation.directed !== false && relation.nature !== 'parallel-route')
      .map((relation) => [relation.from, relation.to]);
    if (hasCycle([...memberIds], directedEdges)) addError('relation-cycle', subject, 'Directed relations must form a DAG within each line.');
    if (line.status === 'candidate') {
      if (memberships.length === 0) addError('candidate-method', subject, 'Candidate directions require a current method node.');
      for (const field of ['currentState', 'evidenceGap', 'promotionCondition']) {
        if (!nonEmpty(line[field])) addError('candidate-copy', `${subject}.${field}`, `${field} is required.`);
      }
      if (line.statusBasis != null) addError('candidate-status-basis', subject, 'Candidate directions cannot declare formal statusBasis.');
      continue;
    }

    const basis = line.statusBasis ?? {};
    if (!STATUS_BASIS_KINDS.has(basis.kind)) addError('status-basis-kind', subject, `Unknown statusBasis kind: ${basis.kind}.`);
    const basisIds = Array.isArray(basis.nodeIds) ? [...new Set(basis.nodeIds)] : [];
    if (basisIds.length < 2 || basisIds.some((nodeId) => !memberIds.has(nodeId))) {
      addError('status-basis-nodes', subject, 'statusBasis needs at least two unique nodes that belong to this line.');
    }
    const basisIdSet = new Set(basisIds);
    const basisEdges = (relationsByLine.get(line.id) ?? [])
      .filter((relation) => basisIdSet.has(relation.from) && basisIdSet.has(relation.to))
      .map((relation) => [relation.from, relation.to]);
    if (basisIds.length >= 2 && !isConnected(basisIds, basisEdges)) {
      addError('status-basis-connected', subject, 'statusBasis nodes must be connected by sourced relations within this line.');
    }
    const basisNodes = basisIds.map((nodeId) => nodesById.get(nodeId)).filter(Boolean);
    const archived = basisNodes.filter((node) => node.source?.archiveState !== 'external');
    const external = basisNodes.filter((node) => node.source?.archiveState === 'external');
    if (basis.kind === 'multiple-archived-methods' && archived.length < 2) {
      addError('status-basis-archived', subject, 'multiple-archived-methods requires two archived nodes.');
    }
    if (basis.kind === 'archived-plus-external') {
      if (archived.length < 1 || external.length < 1 || external.some((node) => !(node.recognition?.length > 0))) {
        addError('status-basis-external', subject, 'archived-plus-external requires archived and recognized external nodes.');
      }
      const hasQualifiedPredecessor = (relationsByLine.get(line.id) ?? []).some(
        (relation) =>
          relation.directed === true &&
          ['direct-inheritance', 'problem-response'].includes(relation.nature) &&
          external.some((node) => node.id === relation.from) &&
          archived.some((node) => node.id === relation.to),
      );
      if (!hasQualifiedPredecessor) {
        addError('status-basis-predecessor', subject, 'The external node must be a sourced direct predecessor of an archived node.');
      }
    }
    if ((relationsByLine.get(line.id) ?? []).length === 0) {
      addError('formal-relation', subject, 'Formal lines require at least one sourced relation.');
    }
  }

  for (const material of source.materials) {
    const subject = material.slug ?? 'material';
    if (!PAPER_SLUG_PATTERN.test(material.slug ?? '')) addError('material-slug', subject, 'Expected a paper slug.');
    const firstPublic = material.firstPublic ?? {};
    if (!isValidCalendarDate(firstPublic.value, firstPublic.precision)) {
      addError('material-date', subject, 'firstPublic must preserve day or month precision.');
    }
    if (snapshotDateValid && (dateMonth(firstPublic) > snapshot.asOf.slice(0, 7) || firstPublic.value > snapshot.asOf)) {
      addError('material-after-snapshot', subject, 'firstPublic cannot be later than snapshot.asOf.');
    }
    if (!Array.isArray(material.uses) || material.uses.length === 0) {
      addError('material-uses', subject, 'Every material needs at least one use.');
    }
    const useLineIds = [];
    for (const use of material.uses ?? []) {
      useLineIds.push(use.lineId);
      if (!lineIdSet.has(use.lineId)) addError('material-line', subject, `Unknown lineId: ${use.lineId}.`);
      if (!MATERIAL_ROLES.has(use.role)) addError('material-role', subject, `Unknown role: ${use.role}.`);
      if (!Array.isArray(use.nodeIds) || use.nodeIds.some((nodeId) => !nodeIdSet.has(nodeId))) {
        addError('material-nodes', subject, 'nodeIds must reference known nodes.');
      }
      if (use.role === 'contribution' && (use.nodeIds?.length ?? 0) === 0) {
        addError('material-contribution-nodes', `${subject}:${use.lineId}`, 'Contribution uses require at least one nodeId.');
      }
      for (const nodeId of use.nodeIds ?? []) {
        const node = nodesById.get(nodeId);
        if (node?.source?.materialSlug !== material.slug) {
          addError('material-node-owner', `${subject}:${nodeId}`, 'The node source must reference this material.');
        }
        if (!(membershipsByLine.get(use.lineId) ?? []).some((membership) => membership.nodeId === nodeId)) {
          addError('material-node-line', `${subject}:${nodeId}`, 'The node must be a member of the material use line.');
        }
      }
      if (!nonEmpty(use.note)) addError('material-note', subject, 'Each use needs a note.');
    }
    if (new Set(useLineIds).size !== useLineIds.length) {
      addError('material-use-duplicate', subject, 'A material can have only one use per line.');
    }
  }

  const materialNodeIds = new Set(
    source.materials.flatMap((material) =>
      (material.uses ?? []).flatMap((use) => use.nodeIds ?? []),
    ),
  );
  for (const node of source.nodes) {
    if (node.source?.archiveState !== 'external' && !materialNodeIds.has(node.id)) {
      addError(
        'node-material-use',
        node.id,
        'Every archived or embedded node must be listed by its source material use.',
      );
    }
    if (node.source?.archiveState === 'full-note') {
      const material = source.materials.find((item) => item.slug === node.source.materialSlug);
      if (material && dateMonth(node.firstPublic) !== dateMonth(material.firstPublic)) {
        addError('full-note-material-date', node.id, 'A full-note node and its owning material must share the same first-public month.');
      }
    }
  }

  let paperInventory = [];
  try {
    paperInventory = await readPaperInventory(repoRoot);
  } catch (error) {
    addError('paper-inventory', 'content/papers', error.message);
  }
  const paperSlugs = new Set(paperInventory.map((paper) => paper.slug));
  for (const slug of materialSlugSet) {
    if (!paperSlugs.has(slug)) addError('material-dangling', slug, 'Material does not have a paper Markdown file.');
  }
  const requiredPapers = paperInventory.filter(
    (paper) => requireCurrent || !paper.firstArchivedAt || paper.firstArchivedAt.slice(0, 10) <= snapshot.asOf,
  );
  for (const paper of requiredPapers) {
    if (!materialSlugSet.has(paper.slug)) {
      addError('material-missing', paper.slug, 'Paper is within the snapshot boundary but has no material coverage.');
    }
  }
  for (const paper of paperInventory) {
    if (
      !materialSlugSet.has(paper.slug) &&
      paper.firstArchivedAt &&
      paper.firstArchivedAt.slice(0, 10) > snapshot.asOf
    ) {
      addAdvisory('snapshot-outdated', paper.slug, 'Paper is newer than the mainline snapshot; run a manual update when ready.');
    }
  }

  return { valid: errors.length === 0, errors, advisories };
};

export const buildMainlineViews = (source) => ({
  snapshot: source.snapshot,
  facets: source.facets,
  lines: source.lines,
  nodes: source.nodes,
  memberships: source.memberships,
  relations: source.relations,
  materials: source.materials,
});

export const load = loadResearchMainlines;
export const validate = validateResearchMainlines;

export const researchMainlineConstants = {
  facetIds: FACET_IDS,
  lineStatuses: [...LINE_STATUSES],
  relationNatures: [...RELATION_NATURES],
  evidenceKinds: [...EVIDENCE_KINDS],
};
