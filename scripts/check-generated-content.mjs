import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import latestEditionCalendar from '../data/conferences/latest-editions.json' with { type: 'json' };
import registry from '../data/conferences/registry.json' with { type: 'json' };
import { comparePapersForReviewFilter, PAPER_REVIEW_STATUSES } from '../src/lib/paper-review.mjs';
import { compareConferencesBySubmissionDeadline } from './conferences/deadline-sort.mjs';
import { generatedFile } from './content/repository.mjs';
import { tagDefinitions, tagFacets } from './content/tagging.mjs';

const paperData = JSON.parse(await fs.readFile(generatedFile, 'utf8'));
const conferenceData = JSON.parse(
  await fs.readFile('src/generated/conference-data.json', 'utf8'),
);

assert.equal(paperData.tagFacets.length, tagFacets.length);
assert.equal(paperData.tagRoutes.length, tagDefinitions.length);
for (const paper of paperData.papers) {
  assert.equal(paper.primaryTagId, paper.tagIds[0], `Primary tag ID mismatch for ${paper.slug}`);
  assert.equal(paper.primaryTag, paper.tags[0], `Primary tag mismatch for ${paper.slug}`);
  assert.ok(paper.tagIds.length >= 1 && paper.tagIds.length <= 4, `Invalid tag count for ${paper.slug}`);
  assert.ok(PAPER_REVIEW_STATUSES.includes(paper.reviewStatus), `Invalid review status for ${paper.slug}`);
  assert.ok(paper.coreSignal, `Missing core signal for ${paper.slug}`);
  assert.ok(paper.conclusion, `Missing conclusion for ${paper.slug}`);
  assert.match(paper.conclusionHtml, /^<p>[\s\S]*<\/p>\n$/, `Invalid conclusion HTML for ${paper.slug}`);
  assert.ok(!paper.html.includes('id="一句话结论"'), `Repeated conclusion section for ${paper.slug}`);
  assert.ok(!Object.hasOwn(paper, 'summary'), `Legacy summary field remains for ${paper.slug}`);
}

assert.deepEqual(
  paperData.papers.map(({ slug }) => slug),
  [...paperData.papers]
    .sort((left, right) => comparePapersForReviewFilter(left, right, 'all'))
    .map(({ slug }) => slug),
  'Generated papers must follow the canonical pinned and archive-time ordering.',
);
assert.ok(
  !paperData.papers.some((paper) => paper.materialType === 'composite'),
  'Research mainlines must stay outside generated paper data.',
);
assert.ok(
  !paperData.papers.some((paper) => paper.slug === '2026-06-23-chinese-frontier-model-reports-timeline'),
  'The migrated Chinese model timeline must stay outside the paper inventory.',
);

const trace = paperData.papers.find((paper) => paper.slug === '2607.13988-trace-turn-level-reward-assignment');
assert.equal(trace?.materialType, 'research-paper');
assert.ok(!Object.hasOwn(trace ?? {}, 'searchWindow'));
assert.match(trace?.html ?? '', /id="source"/);

for (const slug of ['nino-vieillard', 'gennady-pekhimenko', 'dongyang-ma-flashmemory']) {
  const author = paperData.authors.find((candidate) => candidate.slug === slug);
  assert.ok(author?.paperCount > 0, `Expected generated author ${slug} to retain linked papers.`);
}

const xiWang = paperData.authors.find((author) => author.slug === 'xi-wang-jhu');
assert.deepEqual(xiWang?.papers.map((paper) => paper.slug), ['2606.23525-self-compacting-language-model-agents']);
assert.ok(!xiWang?.coauthors.some((author) => author.name === 'Chao Jin'));

const selfCompact = paperData.papers.find((paper) => paper.slug === '2606.23525-self-compacting-language-model-agents');
assert.equal(selfCompact?.authorEntries.find((author) => author.slug === 'xi-wang-jhu')?.name, 'Xi Wang');

const megaScale = paperData.papers.find((paper) => paper.slug === '2505.11432-megascale-moe-communication-efficient-training');
assert.equal(megaScale?.authorEntries.length, 19);
assert.deepEqual(megaScale?.authorEntries.find((author) => author.name === 'Xi Wang'), { name: 'Xi Wang' });

const triDao = paperData.authors.find((author) => author.slug === 'tri-dao');
const triDaoPapers = new Set(triDao?.papers.map((paper) => paper.slug));
assert.ok(triDaoPapers.has('2205.14135-flashattention-io-aware-exact-attention'));
assert.ok(triDaoPapers.has('2307.08691-flashattention-2-parallelism-work-partitioning'));
assert.ok(!triDao?.coauthors.some((author) => author.name === 'Keller Jordan'));
assert.deepEqual(triDao?.representativePapers[0], {
  title: 'Marconi: Prefix Caching for the Era of Hybrid LLMs',
  url: 'https://arxiv.org/abs/2411.19379',
  year: 2025,
  venue: 'MLSys',
});

assert.equal(conferenceData.schemaVersion, 4);
assert.deepEqual(Object.keys(conferenceData).sort(), [
  'areas',
  'catalogScope',
  'ccfSnapshot',
  'conferences',
  'schemaVersion',
  'verifiedAt',
]);
assert.equal(conferenceData.conferences.length, 56);
for (const key of ['papers', 'coverage', 'facets']) assert.equal(Object.hasOwn(conferenceData, key), false);
const generatedVenueIds = new Set(conferenceData.conferences.map((conference) => conference.id));
for (const excludedVenueId of registry.catalogScope.excludedVenueIds) {
  assert.equal(generatedVenueIds.has(excludedVenueId), false);
}
for (const conference of conferenceData.conferences) {
  assert.equal(Object.hasOwn(conference, 'papers'), false);
  assert.equal(Object.hasOwn(conference.latestEdition, 'papers'), false);
}
assert.deepEqual(
  conferenceData.conferences.map(({ id }) => id),
  [...conferenceData.conferences]
    .sort(compareConferencesBySubmissionDeadline)
    .map(({ id }) => id),
);
assert.equal(latestEditionCalendar.schemaVersion, 3);

console.log(`Generated-content check passed for ${paperData.papers.length} papers and ${conferenceData.conferences.length} conferences.`);
