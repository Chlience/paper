import assert from 'node:assert/strict';
import {
  createConferenceFilterParams,
  createConferenceSearchIndex,
  filterConferencePapers,
  paginateConferencePapers,
  readConferenceFilterState,
  sortConferencePapers,
} from '../src/lib/conference-filter.mjs';

const papers = [
  {
    id: 'acl-oral-virtual',
    venueId: 'acl',
    venueAcronym: 'ACL',
    ccfAreaId: 'ai',
    title: 'Structured Reasoning for Agents',
    authors: ['José García', 'Lin Chen'],
    presentationTypeRaw: 'Oral',
    presentationTypeNormalized: 'oral',
    presentationModeRaw: 'Virtual',
    presentationModeNormalized: 'virtual',
    domains: [{ id: 'nlp', label: '自然语言处理' }],
    contributionType: { id: 'method', label: '方法' },
    coreContribution: 'A constrained decoding method for agent planning.',
    classificationConfidence: 0.92,
  },
  {
    id: 'cvpr-poster',
    venueId: 'cvpr',
    venueAcronym: 'CVPR',
    ccfAreaId: 'graphics',
    title: 'Video World Models',
    authors: ['Mira Patel'],
    presentationTypeRaw: 'Poster',
    presentationTypeNormalized: 'poster',
    presentationModeRaw: '',
    presentationModeNormalized: 'unknown',
    domains: [{ id: 'vision', label: '计算机视觉' }],
    contributionType: { id: 'architecture', label: '架构' },
    coreContribution: 'A long-context architecture for video prediction.',
    classificationConfidence: 'medium',
  },
  {
    id: 'icml-spotlight',
    venueId: 'icml',
    venueAcronym: 'ICML',
    ccfAreaId: 'ai',
    title: 'Reliable Offline Evaluation',
    authors: ['Ada Wong'],
    presentationTypeRaw: 'Spotlight',
    presentationTypeNormalized: 'featured',
    presentationModeRaw: '',
    presentationModeNormalized: 'unknown',
    domains: [{ id: 'evaluation', label: '评测' }],
    contributionType: { id: 'benchmark', label: '基准' },
    coreContribution: 'A benchmark for policy evaluation under shift.',
    classificationConfidence: 0.78,
  },
  {
    id: 'cvpr-highlight',
    venueId: 'cvpr',
    venueAcronym: 'CVPR',
    ccfAreaId: 'graphics',
    title: 'Highlighted Vision Evaluation',
    authors: ['Grace Hopper'],
    presentationTypeRaw: 'Highlight',
    presentationTypeNormalized: 'featured',
    presentationModeRaw: '',
    presentationModeNormalized: 'unknown',
    domains: [{ id: 'vision', label: '计算机视觉' }],
    contributionType: { id: 'analysis', label: '分析' },
    coreContribution: 'An analysis of visual evaluation protocols.',
    classificationConfidence: 0.76,
  },
  {
    id: 'acl-virtual-only',
    venueId: 'acl',
    venueAcronym: 'ACL',
    ccfAreaId: 'ai',
    title: 'Remote Participation for Language Research',
    authors: ['Sam Lee'],
    presentationTypeRaw: '',
    presentationTypeNormalized: 'unknown',
    presentationModeRaw: 'Virtual',
    presentationModeNormalized: 'virtual',
    domains: [{ id: 'nlp', label: '自然语言处理' }],
    contributionType: { id: 'analysis', label: '分析' },
    coreContribution: 'An empirical analysis of remote participation.',
    classificationConfidence: 0.74,
  },
  {
    id: 'other-presentation',
    venueId: 'acl',
    venueAcronym: 'ACL',
    ccfAreaId: 'ai',
    title: 'Alternative Presentation Format',
    authors: ['Taylor Kim'],
    presentationTypeRaw: 'Demo',
    presentationTypeNormalized: 'other',
    presentationModeRaw: '',
    presentationModeNormalized: 'unknown',
    domains: [{ id: 'nlp', label: '自然语言处理' }],
    contributionType: { id: 'analysis', label: '分析' },
    coreContribution: 'An analysis presented in another format.',
    classificationConfidence: 0.7,
  },
];

const parsed = readConferenceFilterState(
  '?q=Jos%C3%A9+agent&venue=acl&area=ai&presentation=oral&mode=virtual&domain=nlp&contribution=method&page=2',
);
assert.equal(parsed.query, 'José agent');
assert.equal(parsed.venue, 'acl');
assert.equal(parsed.presentationType, 'oral');
assert.equal(parsed.presentationMode, 'virtual');
assert.equal(parsed.page, 2);

const legacyVirtual = readConferenceFilterState('?presentation=virtual');
assert.equal(legacyVirtual.presentationType, '');
assert.equal(legacyVirtual.presentationMode, 'virtual');
const legacySpotlight = readConferenceFilterState('?presentation=spotlight');
assert.equal(legacySpotlight.presentationType, 'featured');
assert.equal(legacySpotlight.presentationMode, '');
const legacyHighlight = readConferenceFilterState('?presentation=highlight');
assert.equal(legacyHighlight.presentationType, 'featured');

const roundTrip = createConferenceFilterParams(parsed);
assert.equal(roundTrip.get('q'), 'José agent');
assert.equal(roundTrip.get('venue'), 'acl');
assert.equal(roundTrip.get('presentation'), 'oral');
assert.equal(roundTrip.get('mode'), 'virtual');
assert.equal(roundTrip.get('page'), '2');

const searchIndex = createConferenceSearchIndex(papers);
assert.deepEqual(
  filterConferencePapers(papers, { query: 'jose agent' }, searchIndex).map((paper) => paper.id),
  ['acl-oral-virtual'],
);
assert.deepEqual(
  filterConferencePapers(papers, { query: 'oral virtual' }, searchIndex).map((paper) => paper.id),
  ['acl-oral-virtual'],
);
assert.deepEqual(
  filterConferencePapers(papers, { area: 'ai', contribution: 'benchmark' }, searchIndex).map(
    (paper) => paper.id,
  ),
  ['icml-spotlight'],
);
assert.deepEqual(
  filterConferencePapers(
    papers,
    { presentationType: 'oral', presentationMode: 'virtual' },
    searchIndex,
  ).map((paper) => paper.id),
  ['acl-oral-virtual'],
);
assert.deepEqual(
  filterConferencePapers(papers, { presentationType: 'featured' }, searchIndex).map(
    (paper) => paper.id,
  ),
  ['cvpr-highlight', 'icml-spotlight'],
);
assert.deepEqual(
  filterConferencePapers(papers, { presentationMode: 'virtual' }, searchIndex).map(
    (paper) => paper.id,
  ),
  ['acl-oral-virtual', 'acl-virtual-only'],
);
assert.deepEqual(
  sortConferencePapers(papers).map((paper) => paper.id),
  [
    'acl-oral-virtual',
    'cvpr-highlight',
    'icml-spotlight',
    'cvpr-poster',
    'other-presentation',
    'acl-virtual-only',
  ],
);
assert.deepEqual(
  sortConferencePapers(papers, 'confidence').map((paper) => paper.id),
  [
    'acl-oral-virtual',
    'icml-spotlight',
    'cvpr-highlight',
    'acl-virtual-only',
    'other-presentation',
    'cvpr-poster',
  ],
);

const modeChanged = papers.map((paper) => ({
  ...paper,
  presentationModeNormalized:
    paper.presentationModeNormalized === 'virtual' ? 'in-person' : 'virtual',
}));
assert.deepEqual(
  sortConferencePapers(modeChanged).map((paper) => paper.id),
  sortConferencePapers(papers).map((paper) => paper.id),
);

const page = paginateConferencePapers(papers, 7, 2);
assert.equal(page.page, 3);
assert.equal(page.totalPages, 3);
assert.deepEqual(page.items.map((paper) => paper.id), ['acl-virtual-only', 'other-presentation']);

const initialBatch = papers.slice(0, 2);
const limitedModeResults = filterConferencePapers(
  initialBatch,
  parsed,
  createConferenceSearchIndex(initialBatch),
);
const limitedModePage = paginateConferencePapers(limitedModeResults, parsed.page, 30);
assert.equal(limitedModePage.totalItems, 1);
assert.equal(limitedModePage.page, 1);
assert.deepEqual(limitedModePage.items.map((paper) => paper.id), ['acl-oral-virtual']);

console.log('conference-filter checks passed');
