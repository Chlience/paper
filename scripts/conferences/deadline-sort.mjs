const isoDatePattern = /\b\d{4}-\d{2}-\d{2}\b/g;

const isValidIsoDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const getEarliestSubmissionDeadlineDate = (value) => {
  if (typeof value !== 'string') return null;

  const dates = value.match(isoDatePattern)?.filter(isValidIsoDate) ?? [];
  return dates.length > 0 ? dates.sort()[0] : null;
};

const compareStableLabel = (left, right) =>
  String(left.acronym ?? left.id ?? '').localeCompare(
    String(right.acronym ?? right.id ?? ''),
    ['zh-CN', 'en'],
    { numeric: true },
  );

export const compareConferencesBySubmissionDeadline = (left, right) => {
  const leftDate = getEarliestSubmissionDeadlineDate(
    left.latestEdition?.submissionDeadline,
  );
  const rightDate = getEarliestSubmissionDeadlineDate(
    right.latestEdition?.submissionDeadline,
  );

  if (leftDate && rightDate) {
    return leftDate.localeCompare(rightDate) || compareStableLabel(left, right);
  }
  if (leftDate) return -1;
  if (rightDate) return 1;
  return compareStableLabel(left, right);
};
