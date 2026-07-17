import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildMainlineViews,
  loadResearchMainlines,
  validateResearchMainlines,
} from './content/research-mainlines.mjs';

const facetIds = [
  'resource-frontier',
  'context-state',
  'agent-runtime',
  'agent-environments',
  'reasoning-boundary',
  'credit-verification',
  'rl-systems',
  'reward-integrity',
];

const detail = {
  scope: ['范围。'],
  evolution: ['演进。'],
  divergences: ['分歧。'],
  judgment: ['判断。'],
  openQuestions: ['问题。'],
};

const fixtureSource = () => ({
  schemaVersion: 2,
  snapshot: {
    asOf: '2026-07-17',
    updatedAt: '2026-07-17T00:00:00+08:00',
    sourceRevision: 'abcdef0',
    updateMode: 'manual',
  },
  facets: facetIds.map((id, index) => ({ id, name: `Facet ${index + 1}`, order: index + 1 })),
  lines: [
    {
      id: 'formal-line',
      name: 'Formal line',
      status: 'formal',
      facets: ['resource-frontier'],
      question: 'How does the method evolve?',
      detail: structuredClone(detail),
      statusBasis: {
        kind: 'archived-plus-external',
        nodeIds: ['external-base', 'archived-method'],
      },
    },
    {
      id: 'candidate-line',
      name: 'Candidate line',
      status: 'candidate',
      facets: ['agent-runtime'],
      question: 'Will another comparable method appear?',
      currentState: 'One archived method is available.',
      evidenceGap: 'No comparable predecessor has been verified.',
      promotionCondition: 'Add a second related method or a recognized direct predecessor.',
      detail: structuredClone(detail),
    },
  ],
  nodes: [
    {
      id: 'external-base',
      name: 'External Base',
      kind: 'method',
      firstPublic: {
        value: '2020-01',
        precision: 'month',
        sourceUrl: 'https://example.org/external-base',
      },
      source: {
        archiveState: 'external',
        canonicalUrl: 'https://example.org/external-base',
        title: 'External Base',
      },
      recognition: [
        {
          kind: 'multiple-strong-followups',
          sourceUrl: 'https://example.org/recognition',
          note: 'Several strong follow-ups use the mechanism.',
        },
      ],
      summary: 'An external predecessor.',
    },
    {
      id: 'archived-method',
      name: 'Archived Method',
      kind: 'system',
      firstPublic: {
        value: '2025-02-03',
        precision: 'day',
        sourceUrl: '/papers/paper-a/',
      },
      source: {
        archiveState: 'full-note',
        materialSlug: 'paper-a',
        canonicalUrl: '/papers/paper-a/',
        title: 'Archived Method',
      },
      summary: 'An archived system method.',
    },
    {
      id: 'candidate-method',
      name: 'Candidate Method',
      kind: 'protocol',
      firstPublic: {
        value: '2026-06',
        precision: 'month',
        sourceUrl: '/papers/paper-b/',
      },
      source: {
        archiveState: 'embedded',
        materialSlug: 'paper-b',
        canonicalUrl: '/papers/paper-b/',
        title: 'Candidate Method',
      },
      summary: 'The current candidate method.',
    },
  ],
  memberships: [
    {
      lineId: 'formal-line',
      nodeId: 'external-base',
      role: 'core',
      importance: 'supporting',
      priorProblem: 'The original mechanism is expensive.',
      optimization: 'It establishes the baseline mechanism.',
    },
    {
      lineId: 'formal-line',
      nodeId: 'archived-method',
      role: 'core',
      importance: 'primary',
      priorProblem: 'The baseline does not scale.',
      optimization: 'It scales the mechanism.',
    },
    {
      lineId: 'candidate-line',
      nodeId: 'candidate-method',
      role: 'core',
      importance: 'primary',
      priorProblem: 'The current protocol loses state.',
      optimization: 'It preserves state.',
    },
  ],
  relations: [
    {
      id: 'external-to-archived',
      from: 'external-base',
      to: 'archived-method',
      nature: 'problem-response',
      directed: true,
      contexts: [
        {
          lineId: 'formal-line',
          priorProblem: 'The predecessor does not scale.',
          optimization: 'The successor adds scalable execution.',
        },
      ],
      evidence: [
        {
          kind: 'paper-explicit',
          sourceUrl: 'https://example.org/archived-method',
          locator: 'Section 2',
          claim: 'The paper identifies and addresses the predecessor limitation.',
        },
      ],
    },
  ],
  materials: [
    {
      slug: 'paper-a',
      firstPublic: { value: '2025-02-03', precision: 'day' },
      uses: [
        {
          lineId: 'formal-line',
          role: 'contribution',
          nodeIds: ['archived-method'],
          note: 'Introduces the archived method.',
        },
      ],
    },
    {
      slug: 'paper-b',
      firstPublic: { value: '2026-06', precision: 'month' },
      uses: [
        {
          lineId: 'candidate-line',
          role: 'contribution',
          nodeIds: ['candidate-method'],
          note: 'Introduces the candidate method.',
        },
      ],
    },
  ],
});

const fixtureRepo = await fs.mkdtemp(path.join(os.tmpdir(), 'paper-mainlines-'));
await fs.mkdir(path.join(fixtureRepo, 'content', 'papers'), { recursive: true });
await Promise.all(
  [
    ['paper-a', '2026-07-15 10:00'],
    ['paper-b', '2026-07-16 10:00'],
  ].map(([slug, archivedAt]) =>
    fs.writeFile(
      path.join(fixtureRepo, 'content', 'papers', `${slug}.md`),
      `# ${slug}\n\nFirst-Archived-At: ${archivedAt}\nUpdated-At: ${archivedAt}\n`,
    ),
  ),
);

const validateFixture = (source, options = {}) =>
  validateResearchMainlines(source, { repoRoot: fixtureRepo, requireCurrent: true, ...options });

const errorCodes = (result) => new Set(result.errors.map((item) => item.code));

test('the current v2 snapshot has eight stable facets and at least 46 unique fine-grained lines', async () => {
  const source = await loadResearchMainlines();
  const result = await validateResearchMainlines(source, { requireCurrent: true });

  assert.deepEqual(result.errors, []);
  assert.equal(source.schemaVersion, 2);
  assert.equal(source.facets.length, 8);
  assert.ok(source.lines.length >= 46);
  assert.equal(new Set(source.lines.map((line) => line.id)).size, source.lines.length);
  assert.ok(source.lines.some((line) => line.status === 'formal'));
  assert.ok(source.lines.some((line) => line.status === 'candidate'));
});

test('the minimal v2 contract validates and build views preserve one graph source', async () => {
  const source = fixtureSource();
  const result = await validateFixture(source);
  const views = buildMainlineViews(source);

  assert.deepEqual(result.errors, []);
  assert.equal(views.nodes, source.nodes);
  assert.equal(views.memberships, source.memberships);
  assert.equal(views.relations, source.relations);
});

test('a method may belong to more than two mainlines without primary-secondary limits', async () => {
  const source = fixtureSource();
  for (const [index, lineId] of ['candidate-line', 'candidate-line-two', 'candidate-line-three'].entries()) {
    if (index > 0) {
      source.lines.push({
        ...structuredClone(source.lines[1]),
        id: lineId,
        name: `Candidate line ${index + 1}`,
      });
    }
    source.memberships.push({
      lineId,
      nodeId: 'archived-method',
      role: 'cross-line-dependency',
      importance: 'supporting',
      priorProblem: 'The candidate reuses the archived mechanism.',
      optimization: 'The same method contributes from another angle.',
    });
  }

  assert.deepEqual((await validateFixture(source)).errors, []);
  assert.equal(source.memberships.filter((item) => item.nodeId === 'archived-method').length, 4);
});

test('stable IDs, references, and relation evidence are hard validation boundaries', async () => {
  const duplicate = fixtureSource();
  duplicate.nodes[1].id = duplicate.nodes[0].id;
  assert.ok(errorCodes(await validateFixture(duplicate)).has('duplicate-id'));

  const endpoint = fixtureSource();
  endpoint.relations[0].to = 'missing-node';
  assert.ok(errorCodes(await validateFixture(endpoint)).has('relation-endpoint'));

  const evidence = fixtureSource();
  evidence.relations[0].evidence = [];
  assert.ok(errorCodes(await validateFixture(evidence)).has('relation-evidence'));

  const duplicateEdge = fixtureSource();
  duplicateEdge.relations.push({
    ...structuredClone(duplicateEdge.relations[0]),
    id: 'duplicate-edge',
  });
  assert.ok(errorCodes(await validateFixture(duplicateEdge)).has('duplicate-relation-edge'));

  const templateDetail = fixtureSource();
  templateDetail.lines[0].detail.evolution = ['本线围绕“测试问题”按首次公开时间组织方法节点。'];
  assert.ok(errorCodes(await validateFixture(templateDetail)).has('line-template-copy'));

  const templateMembership = fixtureSource();
  templateMembership.memberships[0].priorProblem = '既有路线尚未完整回答：测试问题。';
  assert.ok(errorCodes(await validateFixture(templateMembership)).has('membership-template-copy'));

  const copiedSummary = fixtureSource();
  copiedSummary.memberships[0].optimization = copiedSummary.nodes[0].summary;
  assert.ok(errorCodes(await validateFixture(copiedSummary)).has('membership-summary-copy'));
});

test('external admission requires recognition and a sourced predecessor edge', async () => {
  const missingRecognition = fixtureSource();
  delete missingRecognition.nodes[0].recognition;
  assert.ok(errorCodes(await validateFixture(missingRecognition)).has('status-basis-external'));
  assert.ok(errorCodes(await validateFixture(missingRecognition)).has('external-recognition'));

  const missingPredecessor = fixtureSource();
  missingPredecessor.relations[0].nature = 'combination-reuse';
  assert.ok(errorCodes(await validateFixture(missingPredecessor)).has('status-basis-predecessor'));

  const disconnectedBasis = fixtureSource();
  disconnectedBasis.relations = [];
  assert.ok(errorCodes(await validateFixture(disconnectedBasis)).has('status-basis-connected'));
});

test('candidate promotion fields and preserved date precision are required', async () => {
  const compactCandidate = fixtureSource();
  compactCandidate.lines[1].detail = { scope: ['Candidate scope.'] };
  assert.deepEqual((await validateFixture(compactCandidate)).errors, []);

  const candidate = fixtureSource();
  candidate.lines[1].evidenceGap = '';
  assert.ok(errorCodes(await validateFixture(candidate)).has('candidate-copy'));

  const date = fixtureSource();
  date.nodes[0].firstPublic.precision = 'day';
  assert.ok(errorCodes(await validateFixture(date)).has('node-date'));

  const impossibleDate = fixtureSource();
  impossibleDate.nodes[0].firstPublic = {
    ...impossibleDate.nodes[0].firstPublic,
    precision: 'day',
    value: '2026-99-99',
  };
  assert.ok(errorCodes(await validateFixture(impossibleDate)).has('node-date'));

  const timestampWithoutTime = fixtureSource();
  timestampWithoutTime.snapshot.updatedAt = '2026-07-17';
  assert.ok(errorCodes(await validateFixture(timestampWithoutTime)).has('snapshot-updated-at'));

  const timestampBeforeSnapshot = fixtureSource();
  timestampBeforeSnapshot.snapshot.updatedAt = '2026-07-16T23:59:59+08:00';
  assert.ok(errorCodes(await validateFixture(timestampBeforeSnapshot)).has('snapshot-updated-before-as-of'));

  const missingSnapshotDate = fixtureSource();
  delete missingSnapshotDate.snapshot.asOf;
  assert.ok(errorCodes(await validateFixture(missingSnapshotDate)).has('snapshot-date'));

  const futureNode = fixtureSource();
  futureNode.nodes[2].firstPublic.value = '2026-07-18';
  futureNode.nodes[2].firstPublic.precision = 'day';
  assert.ok(errorCodes(await validateFixture(futureNode)).has('node-after-snapshot'));
});

test('parallel routes are undirected and directed line relations form a DAG', async () => {
  const parallel = fixtureSource();
  parallel.relations.push({
    id: 'parallel-branch',
    from: 'external-base',
    to: 'archived-method',
    nature: 'parallel-route',
    directed: true,
    contexts: [
      {
        lineId: 'formal-line',
        priorProblem: 'The routes make different trade-offs.',
        optimization: 'They remain parallel.',
      },
    ],
    evidence: [
      {
        kind: 'mechanism-experiment',
        sourceUrl: 'https://example.org/parallel',
        locator: 'Table 1',
        claim: 'The methods use distinct mechanisms.',
      },
    ],
  });
  assert.ok(errorCodes(await validateFixture(parallel)).has('relation-direction'));
  assert.ok(errorCodes(await validateFixture(parallel)).has('duplicate-relation-pair'));

  const cycle = fixtureSource();
  cycle.relations.push({
    id: 'reverse-edge',
    from: 'archived-method',
    to: 'external-base',
    nature: 'counterexample-correction',
    directed: true,
    contexts: [
      {
        lineId: 'formal-line',
        priorProblem: 'The successor exposes a boundary.',
        optimization: 'The earlier route is reconsidered.',
      },
    ],
    evidence: [
      {
        kind: 'mechanism-experiment',
        sourceUrl: 'https://example.org/reverse',
        locator: 'Section 4',
        claim: 'The experiment exposes the boundary.',
      },
    ],
  });
  const cycleCodes = errorCodes(await validateFixture(cycle));
  assert.ok(cycleCodes.has('relation-cycle'));
  assert.ok(cycleCodes.has('relation-chronology'));
});

test('every archived paper has one material record and valid node ownership', async () => {
  const missing = fixtureSource();
  missing.materials.pop();
  assert.ok(errorCodes(await validateFixture(missing)).has('material-missing'));

  const wrongOwner = fixtureSource();
  wrongOwner.materials[0].uses[0].nodeIds = ['candidate-method'];
  assert.ok(errorCodes(await validateFixture(wrongOwner)).has('material-node-owner'));

  const wrongLocalSource = fixtureSource();
  wrongLocalSource.nodes[1].firstPublic.sourceUrl = '/papers/not-the-owner/';
  assert.ok(errorCodes(await validateFixture(wrongLocalSource)).has('node-local-source-owner'));

  const mismatchedFullNoteDate = fixtureSource();
  mismatchedFullNoteDate.materials[0].firstPublic = { value: '2025-01', precision: 'month' };
  assert.ok(errorCodes(await validateFixture(mismatchedFullNoteDate)).has('full-note-material-date'));

  const emptyContribution = fixtureSource();
  emptyContribution.materials[0].uses[0].nodeIds = [];
  assert.ok(errorCodes(await validateFixture(emptyContribution)).has('material-contribution-nodes'));

  const futureMaterial = fixtureSource();
  futureMaterial.materials[1].firstPublic = { value: '2026-07-18', precision: 'day' };
  assert.ok(errorCodes(await validateFixture(futureMaterial)).has('material-after-snapshot'));

  const orphanNode = fixtureSource();
  orphanNode.nodes.push({
    ...structuredClone(orphanNode.nodes[2]),
    id: 'orphan-method',
    name: 'Orphan method',
  });
  assert.ok(errorCodes(await validateFixture(orphanNode)).has('node-membership'));
});

test('the CLI supports snapshot and strict manual-update modes', () => {
  for (const args of [[], ['--require-current']]) {
    const result = spawnSync(process.execPath, ['scripts/check-research-mainlines.mjs', ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Research mainline check passed/);
  }

  const unknown = spawnSync(process.execPath, ['scripts/check-research-mainlines.mjs', '--unknown'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown argument/);
});
