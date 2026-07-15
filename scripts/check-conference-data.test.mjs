import assert from 'node:assert/strict';
import test from 'node:test';
import taxonomy from '../data/conferences/taxonomy.json' with { type: 'json' };
import {
  classifyContributionType,
  classifyDomains,
  classifyPaper,
  extractCoreContribution,
} from './conferences/classify.mjs';
import {
  mergePapers,
  normalizeAuthors,
  normalizePaper,
  normalizePresentationMode,
  normalizePresentationType,
  normalizeTrack,
  sortPapersById,
  stablePaperId,
} from './conferences/normalize.mjs';
import {
  validateConferenceDatasets,
  validateConferenceRegistry,
} from './conferences/validate.mjs';
import { getPresentationModeBadge } from '../src/lib/conference-presentation.mjs';

const venue = {
  id: 'testconf',
  acronym: 'TEST',
  name: 'Test Conference',
  ccfAreaId: 'artificial-intelligence',
  edition2026: { status: 'published', adapter: 'fixture' },
};

test('stablePaperId prefers official IDs and falls back to normalized titles', () => {
  const officialA = stablePaperId({ venueId: 'acl', year: 2026, officialId: '42', title: 'First title' });
  const officialB = stablePaperId({ venueId: 'acl', year: 2026, officialId: '42', title: 'Changed title' });
  const titleA = stablePaperId({ venueId: 'acl', year: 2026, title: '  A Better Model! ' });
  const titleB = stablePaperId({ venueId: 'acl', year: 2026, title: 'a better model' });
  assert.equal(officialA, officialB);
  assert.equal(titleA, titleB);
});

test('track, presentation type, and presentation mode normalization preserve separate axes', () => {
  assert.equal(normalizeTrack('Main Research Track'), 'main');
  assert.equal(normalizeTrack('Findings of ACL'), 'findings');
  assert.equal(normalizeTrack('Findings Full Paper'), 'findings');
  assert.equal(normalizeTrack('Industry Research Paper'), 'industry');
  assert.equal(normalizeTrack('Short Research Paper'), 'short');
  assert.equal(normalizeTrack('Workshop Full Paper'), 'workshop');
  assert.equal(normalizeTrack('Demo Research Paper'), 'demo');
  assert.equal(normalizePresentationType('Spotlight Poster'), 'featured');
  assert.equal(normalizePresentationType('Highlight Poster'), 'featured');
  assert.equal(normalizePresentationType('Featured presentation'), 'featured');
  assert.equal(normalizePresentationType('Oral presentation'), 'oral');
  assert.equal(normalizePresentationType('Virtual Presentations'), 'unknown');
  assert.equal(normalizePresentationMode('In-Person (TBC)'), 'in-person');
  assert.equal(normalizePresentationMode('Virtual'), 'virtual');
});

test('presentation mode badges normalize official capitalization without rewriting raw data', () => {
  assert.equal(
    getPresentationModeBadge({
      presentationModeRaw: 'virtual',
      presentationModeNormalized: 'virtual',
    }),
    'Virtual',
  );
  assert.equal(
    getPresentationModeBadge({
      presentationModeRaw: 'In-Person (TBC)',
      presentationModeNormalized: 'in-person',
    }),
    'In-person',
  );
});

test('author normalization decodes nested entities before deduplication and preserves unknown entities', () => {
  assert.deepEqual(normalizeAuthors(['M&amp;uuml;ller', 'Müller', 'A &unknown;', 'architec\u0002t']), [
    'Müller',
    'A &unknown;',
    'architect',
  ]);
});

test('automatic classification uses title, abstract, and contribution evidence', () => {
  const classified = classifyPaper(
    {
      title: 'A Benchmark for Evaluating Vision-Language Models',
      abstract: 'We introduce a new dataset and benchmark for measuring compositional visual reasoning.',
      sourceTopics: ['computer vision'],
      ccfAreaId: 'artificial-intelligence',
    },
    taxonomy,
  );
  assert.equal(classified.primaryDomainId, 'computer-vision');
  assert.equal(classified.contributionType.id, 'dataset-benchmark');
  assert.match(classified.coreContribution, /introduce/i);
  assert.ok(classified.classificationConfidence >= 0.5);
});

test('classification uses word boundaries and venue priors without generic network pollution', () => {
  const average = classifyDomains(
    { title: 'Average Storage Latency', ccfAreaId: 'architecture-systems' },
    taxonomy,
  );
  const coverage = classifyDomains(
    { title: 'Coverage Guarantees for Learning', ccfAreaId: 'artificial-intelligence' },
    taxonomy,
  );
  assert.ok(!average.domains.some((domain) => domain.id === 'information-retrieval'));
  assert.ok(!coverage.domains.some((domain) => domain.id === 'information-retrieval'));

  const cvpr = classifyDomains(
    {
      venueId: 'cvpr',
      title: 'A Neural Network for Image Reconstruction',
      ccfAreaId: 'artificial-intelligence',
    },
    taxonomy,
  );
  const acl = classifyDomains(
    {
      venueId: 'acl',
      title: 'Sparse MoE Routing for Experts',
      ccfAreaId: 'artificial-intelligence',
    },
    taxonomy,
  );
  assert.equal(cvpr.primaryDomainId, 'computer-vision');
  assert.ok(!cvpr.domains.some((domain) => domain.id === 'computer-networks'));
  assert.equal(acl.primaryDomainId, 'natural-language-processing');
  assert.ok(!acl.domains.some((domain) => domain.id === 'computer-networks'));

  const rag = classifyDomains(
    {
      venueId: 'acl',
      title: 'Efficient RAG for Long-Context Question Answering',
      ccfAreaId: 'artificial-intelligence',
      sourceTopics: ['machine learning', 'knowledge graph', 'agent planning', 'natural language'],
    },
    taxonomy,
  );
  const spelledOutRag = classifyDomains(
    {
      venueId: 'cvpr',
      title: 'Vision-Based Retrieval-Augmented Generation under Visual Degradations',
      ccfAreaId: 'artificial-intelligence',
      sourceTopics: ['computer vision', 'natural language processing'],
    },
    taxonomy,
  );
  const brainRouting = classifyDomains(
    {
      venueId: 'icml',
      title: 'Adaptive Flow Routing in Brain Networks',
      ccfAreaId: 'artificial-intelligence',
    },
    taxonomy,
  );
  assert.ok(rag.domains.some((domain) => domain.id === 'information-retrieval'));
  assert.ok(spelledOutRag.domains.some((domain) => domain.id === 'information-retrieval'));
  assert.ok(!brainRouting.domains.some((domain) => domain.id === 'computer-networks'));

  const positional = classifyContributionType(
    { title: 'Rotary Positional Embedding', abstract: '', sourceTopics: [] },
    taxonomy,
  );
  assert.notEqual(positional.contributionType.id, 'survey-position');

  const genericPerspective = classifyContributionType(
    {
      title: 'Ethical Perspectives for Language Models',
      abstract: 'We propose a method and establish a taxonomy of observed failures.',
      sourceTopics: [],
    },
    taxonomy,
  );
  const positionPaper = classifyContributionType(
    {
      title: 'When Collaboration Helps Language Models',
      abstract: 'This position paper argues for a multi-model evaluation protocol.',
      sourceTopics: [],
    },
    taxonomy,
  );
  const questionnaireSurvey = classifyContributionType(
    {
      title: 'Valid Survey Simulations for Response Generation',
      abstract: 'We propose a model for generating questionnaire responses.',
      sourceTopics: [],
    },
    taxonomy,
  );
  const taxonomyAware = classifyContributionType(
    {
      title: 'Taxonomy-Aware Representation Alignment',
      abstract: 'We introduce a taxonomy-aware learning method.',
      sourceTopics: [],
    },
    taxonomy,
  );
  assert.notEqual(genericPerspective.contributionType.id, 'survey-position');
  assert.equal(positionPaper.contributionType.id, 'survey-position');
  assert.notEqual(questionnaireSurvey.contributionType.id, 'survey-position');
  assert.notEqual(taxonomyAware.contributionType.id, 'survey-position');
});

test('normalization produces an auditable main-track record', () => {
  const paper = normalizePaper(
    {
      officialId: 'paper-7',
      title: 'Fast Distributed Training',
      authors: ['Ada Lovelace', ' Alan Turing '],
      abstract: 'We present a distributed system that reduces training communication.',
      trackRaw: 'Full Research Paper',
      presentationTypeRaw: 'Poster',
      presentationModeRaw: 'Virtual',
      sourceTopics: ['z-topic', 'a-topic', 'z-topic'],
      recognition: ['Z Award', 'A Award', 'Z Award'],
    },
    { venue, year: 2026, sourceUrl: 'https://example.com/accepted' },
    taxonomy,
  );
  assert.equal(paper.trackNormalized, 'main');
  assert.equal(paper.presentationTypeNormalized, 'poster');
  assert.equal(paper.presentationModeNormalized, 'virtual');
  assert.deepEqual(paper.authors, ['Ada Lovelace', 'Alan Turing']);
  assert.deepEqual(paper.sourceTopics, ['a-topic', 'z-topic']);
  assert.deepEqual(paper.recognition, ['A Award', 'Z Award']);
  assert.equal(paper.sourceUrl, 'https://example.com/accepted');
  assert.equal(paper.classifierVersion, 'rules-v3');
});

test('paper ID sorting canonicalizes adapter output without mutating author order', () => {
  const papers = [
    { id: 'paper-b', authors: ['Second', 'First'] },
    { id: 'paper-a', authors: ['Lead', 'Coauthor'] },
  ];
  const sorted = sortPapersById(papers);
  assert.deepEqual(sorted.map((paper) => paper.id), ['paper-a', 'paper-b']);
  assert.deepEqual(sorted[1].authors, ['Second', 'First']);
  assert.deepEqual(papers.map((paper) => paper.id), ['paper-b', 'paper-a']);
});

test('merge keeps first-seen provenance and tombstones source omissions', () => {
  const previous = [
    {
      id: 'kept',
      title: 'Old title',
      firstSeenAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      status: 'active',
    },
    {
      id: 'missing',
      title: 'Missing paper',
      firstSeenAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      status: 'active',
    },
  ];
  const merged = mergePapers(previous, [{ id: 'kept', title: 'Corrected title', status: 'active' }], '2026-02-01T00:00:00.000Z');
  assert.equal(merged.find((paper) => paper.id === 'kept').firstSeenAt, '2026-01-01T00:00:00.000Z');
  assert.equal(merged.find((paper) => paper.id === 'missing').status, 'source-missing');
});

test('merge leaves observation timestamps stable for unchanged papers', () => {
  const paper = {
    id: 'stable',
    title: 'Stable paper',
    status: 'active',
    firstSeenAt: '2026-01-01T00:00:00.000Z',
    lastSeenAt: '2026-01-02T00:00:00.000Z',
  };
  const incoming = { id: 'stable', title: 'Stable paper', status: 'active' };
  const [merged] = mergePapers([paper], [incoming], '2026-02-01T00:00:00.000Z');
  assert.equal(merged.firstSeenAt, paper.firstSeenAt);
  assert.equal(merged.lastSeenAt, paper.lastSeenAt);
});

test('merge migrates legacy virtual presentation fields without changing observation time', () => {
  const legacy = {
    id: 'legacy-virtual',
    title: 'Legacy virtual paper',
    presentationRaw: 'Virtual',
    presentationNormalized: 'virtual',
    status: 'active',
    firstSeenAt: '2026-01-01T00:00:00.000Z',
    lastSeenAt: '2026-01-02T00:00:00.000Z',
  };
  const incoming = {
    id: 'legacy-virtual',
    title: 'Legacy virtual paper',
    presentationTypeRaw: '',
    presentationTypeNormalized: 'unknown',
    presentationModeRaw: 'Virtual',
    presentationModeNormalized: 'virtual',
    status: 'active',
  };
  const [merged] = mergePapers([legacy], [incoming], '2026-02-01T00:00:00.000Z');
  assert.equal(merged.presentationTypeNormalized, 'unknown');
  assert.equal(merged.presentationModeNormalized, 'virtual');
  assert.equal(Object.hasOwn(merged, 'presentationRaw'), false);
  assert.equal(Object.hasOwn(merged, 'presentationNormalized'), false);
  assert.equal(merged.lastSeenAt, legacy.lastSeenAt);
});

test('core contribution extraction prefers explicit contribution sentences', () => {
  const result = extractCoreContribution(
    'Prior work is expensive. We propose a cache-aware scheduler that reduces tail latency. Experiments cover three clusters.',
  );
  assert.match(result, /^We propose/);
});

test('core contribution excerpts stay within 24 words per source', () => {
  const result = extractCoreContribution(
    'We propose a carefully designed method that combines many separate components to improve accuracy, efficiency, reliability, robustness, interpretability, and reproducibility across several realistic deployment settings.',
  );
  assert.ok(result.replace(/\.\.\.$/, '').split(/\s+/).length <= 24);
});

test('dataset validation accepts independent presentation type and mode fields', () => {
  const basePaper = {
    id: 'testconf-2026-a',
    officialId: 'official-a',
    venueId: 'testconf',
    year: 2026,
    title: 'A Safe Paper',
    authors: ['Ada Lovelace'],
    trackNormalized: 'main',
    presentationTypeNormalized: 'oral',
    presentationModeNormalized: 'virtual',
    publicationStatus: 'accepted',
    status: 'active',
    domains: [{ id: taxonomy.domains[0].id }],
    primaryDomainId: taxonomy.domains[0].id,
    contributionType: { id: 'unknown' },
    coreContribution: '',
    classificationConfidence: 0.4,
    classificationStatus: 'title-only',
    sourceUrl: 'https://example.com/accepted',
    paperUrl: '',
    firstSeenAt: '2026-01-01T00:00:00.000Z',
    lastSeenAt: '2026-01-01T00:00:00.000Z',
  };
  const registry = { venues: [venue] };
  const dataset = {
    schemaVersion: 2,
    year: 2026,
    venueId: 'testconf',
    coverageStatus: 'published',
    source: { url: 'https://example.com', adapter: 'fixture' },
    papers: [basePaper],
  };
  assert.deepEqual(validateConferenceDatasets([dataset], registry, taxonomy), []);

  const unsafe = {
    ...dataset,
    papers: [
      { ...basePaper, authors: [], title: 'Unknown &future; entity' },
      {
        ...basePaper,
        id: 'testconf-2026-b',
        publicationStatus: 'published',
        paperUrl: '',
      },
      {
        ...basePaper,
        id: 'testconf-2026-c',
        officialId: 'official-c',
        authorStatus: 'embargoed',
        abstractStatus: 'embargoed',
        coreContribution: '<!-- hidden -->\u0002',
        classificationStatus: 'automatic',
      },
      {
        ...basePaper,
        id: 'testconf-2026-d',
        officialId: 'official-d',
        sourceUrl: 'javascript:alert(1)',
        notePath: 'papers/relative',
      },
      {
        ...basePaper,
        id: 'testconf-2026-e',
        officialId: 'official-e',
        domains: [],
        primaryDomainId: 'missing-domain',
        classificationConfidence: 1.4,
        firstSeenAt: 'not-a-timestamp',
      },
      {
        ...basePaper,
        id: 'testconf-2026-f',
        officialId: 'official-f',
        presentationTypeNormalized: 'virtual',
        presentationModeNormalized: 'oral',
        presentationRaw: 'Virtual',
      },
    ],
  };
  const codes = new Set(validateConferenceDatasets([unsafe], registry, taxonomy).map((error) => error.code));
  assert.ok(codes.has('paper-authors'));
  assert.ok(codes.has('paper-html-residue'));
  assert.ok(codes.has('paper-control-residue'));
  assert.ok(codes.has('duplicate-official-id'));
  assert.ok(codes.has('paper-publication-url'));
  assert.ok(codes.has('paper-embargoed-authors'));
  assert.ok(codes.has('paper-embargoed-abstract'));
  assert.ok(codes.has('paper-url'));
  assert.ok(codes.has('paper-note-path'));
  assert.ok(codes.has('paper-domains'));
  assert.ok(codes.has('paper-primary-domain'));
  assert.ok(codes.has('paper-classification-confidence'));
  assert.ok(codes.has('paper-observation-time'));
  assert.ok(codes.has('paper-presentation-type'));
  assert.ok(codes.has('paper-presentation-mode'));
  assert.ok(codes.has('paper-presentation-legacy'));
});

test('registry and dataset validation enforce edition and adapter coverage contracts', () => {
  const registry = {
    schemaVersion: 1,
    areas: [{ id: 'artificial-intelligence', label: 'AI' }],
    venues: Array.from({ length: 58 }, (_, index) => ({
      id: `venue-${index}`,
      acronym: `V${index}`,
      name: `Venue ${index}`,
      ccfAreaId: 'artificial-intelligence',
      ccfRank: 'A',
      edition2026: {
        status: index === 0 ? 'invalid-status' : 'adapter-pending',
        adapter: '',
      },
    })),
  };
  assert.ok(validateConferenceRegistry(registry).some((error) => error.code === 'edition-status'));

  const configuredRegistry = {
    venues: [venue],
  };
  assert.ok(
    validateConferenceDatasets([], configuredRegistry, taxonomy).some(
      (error) => error.code === 'missing-dataset',
    ),
  );
  const mismatchedDataset = {
    schemaVersion: 2,
    year: 2026,
    venueId: 'testconf',
    coverageStatus: 'published',
    source: { url: 'https://example.com', adapter: 'old-adapter' },
    papers: [],
  };
  assert.ok(
    validateConferenceDatasets([mismatchedDataset], configuredRegistry, taxonomy).some(
      (error) => error.code === 'dataset-adapter',
    ),
  );
});
