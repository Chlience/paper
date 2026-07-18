export const PAPER_REVIEW_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'all', label: '全部' }),
  Object.freeze({ id: 'pending', label: '待审阅' }),
  Object.freeze({ id: 'needs-review', label: '需复审' }),
  Object.freeze({ id: 'approved', label: '已审阅' }),
]);

export const PAPER_REVIEW_STATUSES = Object.freeze(
  PAPER_REVIEW_DEFINITIONS.filter(({ id }) => id !== 'all').map(({ id }) => id),
);

const reviewStatusSet = new Set(PAPER_REVIEW_STATUSES);
const reviewFilterSet = new Set(PAPER_REVIEW_DEFINITIONS.map(({ id }) => id));
const reviewLabels = new Map(PAPER_REVIEW_DEFINITIONS.map(({ id, label }) => [id, label]));

export const normalizePaperReviewStatus = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  return reviewStatusSet.has(normalized) ? normalized : 'pending';
};

export const normalizePaperReviewFilter = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  return reviewFilterSet.has(normalized) ? normalized : 'all';
};

export const paperReviewLabel = (value = '') =>
  reviewLabels.get(normalizePaperReviewFilter(value)) ?? reviewLabels.get('pending');

export const countPaperReviewStatuses = (papers = []) => {
  const counts = Object.fromEntries(PAPER_REVIEW_DEFINITIONS.map(({ id }) => [id, 0]));
  counts.all = papers.length;
  for (const paper of papers) counts[normalizePaperReviewStatus(paper?.reviewStatus)] += 1;
  return counts;
};

export const paperMatchesReviewFilter = (paper, filter = 'all') => {
  const normalizedFilter = normalizePaperReviewFilter(filter);
  return normalizedFilter === 'all' || normalizePaperReviewStatus(paper?.reviewStatus) === normalizedFilter;
};
