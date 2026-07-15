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
    id: 'acl-oral',
    venueId: 'acl',
    venueAcronym: 'ACL',
    ccfAreaId: 'ai',
    title: 'Structured Reasoning for Agents',
    authors: ['José García', 'Lin Chen'],
    presentationNormalized: 'oral',
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
    presentationNormalized: 'poster',
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
    presentationNormalized: 'spotlight',
    domains: [{ id: 'evaluation', label: '评测' }],
    contributionType: { id: 'benchmark', label: '基准' },
    coreContribution: 'A benchmark for policy evaluation under shift.',
    classificationConfidence: 0.78,
  },
  {
    id: 'acl-virtual',
    venueId: 'acl',
    venueAcronym: 'ACL',
    ccfAreaId: 'ai',
    title: 'Remote Participation for Language Research',
    authors: ['Sam Lee'],
    presentationNormalized: 'virtual',
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
    presentationNormalized: 'other',
    domains: [{ id: 'nlp', label: '自然语言处理' }],
    contributionType: { id: 'analysis', label: '分析' },
    coreContribution: 'An analysis presented in another format.',
    classificationConfidence: 0.7,
  },
];

const parsed = readConferenceFilterState(
  '?q=Jos%C3%A9+agent&venue=acl&area=ai&presentation=oral&domain=nlp&contribution=method&page=2',
);
assert.equal(parsed.query, 'José agent');
assert.equal(parsed.venue, 'acl');
assert.equal(parsed.page, 2);

const roundTrip = createConferenceFilterParams(parsed);
assert.equal(roundTrip.get('q'), 'José agent');
assert.equal(roundTrip.get('venue'), 'acl');
assert.equal(roundTrip.get('page'), '2');

const searchIndex = createConferenceSearchIndex(papers);
assert.deepEqual(
  filterConferencePapers(papers, { query: 'jose agent' }, searchIndex).map((paper) => paper.id),
  ['acl-oral'],
);
assert.deepEqual(
  filterConferencePapers(papers, { area: 'ai', contribution: 'benchmark' }, searchIndex).map(
    (paper) => paper.id,
  ),
  ['icml-spotlight'],
);
assert.deepEqual(
  sortConferencePapers(papers).map((paper) => paper.id),
  ['acl-oral', 'icml-spotlight', 'cvpr-poster', 'acl-virtual', 'other-presentation'],
);
assert.deepEqual(
  sortConferencePapers(papers, 'confidence').map((paper) => paper.id),
  ['acl-oral', 'icml-spotlight', 'acl-virtual', 'other-presentation', 'cvpr-poster'],
);

const page = paginateConferencePapers(papers, 7, 2);
assert.equal(page.page, 3);
assert.equal(page.totalPages, 3);
assert.deepEqual(page.items.map((paper) => paper.id), ['other-presentation']);

const initialBatch = papers.slice(0, 2);
const limitedModeResults = filterConferencePapers(
  initialBatch,
  parsed,
  createConferenceSearchIndex(initialBatch),
);
const limitedModePage = paginateConferencePapers(limitedModeResults, parsed.page, 30);
assert.equal(limitedModePage.totalItems, 1);
assert.equal(limitedModePage.page, 1);
assert.deepEqual(limitedModePage.items.map((paper) => paper.id), ['acl-oral']);

console.log('conference-filter checks passed');
