import assert from 'node:assert/strict';
import test from 'node:test';
import * as tagging from './content/tagging.mjs';
import * as paperReview from '../src/lib/paper-review.mjs';

test('exports the paper review status taxonomy and filter helpers', () => {
  assert.deepEqual([...paperReview.PAPER_REVIEW_STATUSES], ['pending', 'approved']);
  assert.equal(paperReview.normalizePaperReviewFilter('needs-review'), 'all');
  assert.equal(paperReview.normalizePaperReviewFilter('unknown'), 'all');
  assert.equal(paperReview.paperMatchesReviewFilter({ reviewStatus: 'approved' }, 'approved'), true);
  assert.equal(paperReview.paperMatchesReviewFilter({ reviewStatus: 'pending' }, 'approved'), false);
  assert.deepEqual(
    paperReview.countPaperReviewStatuses([
      { reviewStatus: 'pending' },
      { reviewStatus: 'approved' },
    ]),
    { all: 2, pending: 1, approved: 1 },
  );
});

test('review filters use their visible lifecycle timestamp while preserving pins', () => {
  const papers = [
    {
      slug: 'newly-archived',
      firstArchivedAt: '2026-07-20 09:00',
      updatedAt: '2026-07-20 09:00',
      reviewedAt: '2026-07-20 10:00',
    },
    {
      slug: 'newly-reviewed',
      firstArchivedAt: '2026-07-18 09:00',
      updatedAt: '2026-07-21 08:00',
      reviewedAt: '2026-07-21 09:00',
    },
    {
      slug: 'pinned',
      firstArchivedAt: '2026-07-01 09:00',
      updatedAt: '2026-07-01 09:00',
      reviewedAt: '2026-07-01 10:00',
      pinned: true,
    },
  ];

  assert.deepEqual(paperReview.paperReviewSortDefinition('approved'), {
    field: 'reviewedAt',
    label: '审阅时间',
  });
  assert.deepEqual(paperReview.paperReviewSortDefinition('needs-review'), {
    field: 'firstArchivedAt',
    label: '归档时间',
  });
  assert.deepEqual(
    [...papers].sort((left, right) => paperReview.comparePapersForReviewFilter(left, right, 'all')).map(
      ({ slug }) => slug,
    ),
    ['pinned', 'newly-archived', 'newly-reviewed'],
  );
  assert.deepEqual(
    [...papers]
      .sort((left, right) => paperReview.comparePapersForReviewFilter(left, right, 'pending'))
      .map(({ slug }) => slug),
    ['pinned', 'newly-archived', 'newly-reviewed'],
  );
  assert.deepEqual(
    [...papers]
      .sort((left, right) => paperReview.comparePapersForReviewFilter(left, right, 'needs-review'))
      .map(({ slug }) => slug),
    ['pinned', 'newly-archived', 'newly-reviewed'],
  );
  assert.deepEqual(
    [...papers]
      .sort((left, right) => paperReview.comparePapersForReviewFilter(left, right, 'approved'))
      .map(({ slug }) => slug),
    ['pinned', 'newly-reviewed', 'newly-archived'],
  );
});

test('controlled tag validation rejects incomplete or stale assignments', () => {
  const assignments = structuredClone(tagging.paperTagAssignments);
  const [missingSlug, unknownSlug, duplicateSlug, overflowSlug] = Object.keys(assignments);
  delete assignments[missingSlug];
  assignments[unknownSlug] = ['unknown-route'];
  assignments[duplicateSlug] = ['agent-workflow', 'agent-workflow'];
  assignments[overflowSlug] = tagging.tagDefinitions.slice(0, 5).map((tag) => tag.id);
  assignments['deleted-paper'] = ['benchmark'];

  const errors = tagging.validateTagConfiguration(
    [missingSlug, unknownSlug, duplicateSlug, overflowSlug],
    { assignments },
  );
  const codes = new Set(errors.map((error) => error.code));

  for (const code of [
    'missing-paper-tags',
    'unknown-paper-tag',
    'duplicate-paper-tag',
    'too-many-paper-tags',
    'stale-paper-tags',
  ]) {
    assert.ok(codes.has(code), `Expected ${code}.`);
  }
});

test('leaf tag labels exclude deprecated archive-wide categories', () => {
  const labels = new Set(tagging.tagDefinitions.map((tag) => tag.label));
  for (const broadLabel of ['RL', 'Systems', 'Methodology', 'Safety', 'Theory']) {
    assert.equal(labels.has(broadLabel), false);
  }
});

test('controlled tag validation rejects ambiguous search terms', () => {
  const taxonomy = structuredClone(tagging.tagTaxonomy);
  taxonomy.facets[0].tags[1].aliases.push(taxonomy.facets[0].tags[0].label);
  const errors = tagging.validateTagConfiguration(Object.keys(tagging.paperTagAssignments), { taxonomy });

  assert.ok(errors.some((error) => error.code === 'ambiguous-tag-term'));
});
