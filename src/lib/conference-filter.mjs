export const CONFERENCE_PAGE_SIZE = 30;

export const CONFERENCE_FILTER_DEFAULTS = Object.freeze({
  query: '',
  venue: '',
  area: '',
  presentationType: '',
  presentationMode: '',
  domain: '',
  contribution: '',
  sort: 'presentation',
  page: 1,
});

const PRESENTATION_TYPE_ORDER = new Map([
  ['oral', 0],
  ['featured', 1],
  ['poster', 2],
  ['other', 3],
  ['unknown', 4],
]);

const CONFERENCE_TEXT_COLLATOR = new Intl.Collator(['zh-CN', 'en'], {
  numeric: true,
  sensitivity: 'base',
});

const CONFIDENCE_SCORE = new Map([
  ['high', 1],
  ['medium', 0.66],
  ['low', 0.33],
  ['unknown', 0],
]);

const asString = (value) => (value == null ? '' : String(value).trim());

export const normalizeConferenceSearchText = (value) =>
  asString(value)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const getAuthorText = (authors) =>
  Array.isArray(authors)
    ? authors
        .map((author) => (typeof author === 'string' ? author : author?.name))
        .filter(Boolean)
        .join(' ')
    : asString(authors);

export const getConferencePaperSearchText = (paper) =>
  normalizeConferenceSearchText(
    [
      paper?.title,
      getAuthorText(paper?.authors),
      paper?.coreContribution,
      paper?.venueAcronym,
      paper?.venueName,
      paper?.trackRaw,
      paper?.presentationTypeRaw,
      paper?.presentationModeRaw,
      ...(paper?.domains ?? []).map((domain) => domain?.label ?? domain?.id),
      paper?.contributionType?.label,
    ]
      .filter(Boolean)
      .join(' '),
  );

export const createConferenceSearchIndex = (papers = []) =>
  new Map(papers.map((paper) => [paper.id, getConferencePaperSearchText(paper)]));

const normalizePage = (value) => {
  const page = Number.parseInt(asString(value), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const normalizeSort = (value) => {
  const sort = asString(value);
  return ['presentation', 'venue', 'title', 'confidence'].includes(sort)
    ? sort
    : CONFERENCE_FILTER_DEFAULTS.sort;
};

const normalizePresentationTypeFilter = (value) => {
  const normalized = asString(value).toLocaleLowerCase();
  if (['spotlight', 'highlight'].includes(normalized)) return 'featured';
  if (normalized === 'virtual') return '';
  return normalized;
};

export const normalizeConferenceFilterState = (state = {}) => {
  const legacyPresentation = asString(state.presentationType ?? state.presentation).toLocaleLowerCase();
  const explicitMode = asString(state.presentationMode ?? state.mode).toLocaleLowerCase();
  return {
    query: asString(state.query ?? state.q),
    venue: asString(state.venue),
    area: asString(state.area),
    presentationType: normalizePresentationTypeFilter(legacyPresentation),
    presentationMode: explicitMode || (legacyPresentation === 'virtual' ? 'virtual' : ''),
    domain: asString(state.domain),
    contribution: asString(state.contribution),
    sort: normalizeSort(state.sort),
    page: normalizePage(state.page),
  };
};

export const readConferenceFilterState = (input = '') => {
  const params =
    input instanceof URLSearchParams
      ? input
      : new URLSearchParams(asString(input).replace(/^\?/, ''));

  return normalizeConferenceFilterState({
    query: params.get('q'),
    venue: params.get('venue'),
    area: params.get('area'),
    presentationType: params.get('presentation'),
    presentationMode: params.get('mode'),
    domain: params.get('domain'),
    contribution: params.get('contribution'),
    sort: params.get('sort'),
    page: params.get('page'),
  });
};

export const createConferenceFilterParams = (state = {}) => {
  const normalized = normalizeConferenceFilterState(state);
  const params = new URLSearchParams();

  if (normalized.query) params.set('q', normalized.query);
  if (normalized.venue) params.set('venue', normalized.venue);
  if (normalized.area) params.set('area', normalized.area);
  if (normalized.presentationType) params.set('presentation', normalized.presentationType);
  if (normalized.presentationMode) params.set('mode', normalized.presentationMode);
  if (normalized.domain) params.set('domain', normalized.domain);
  if (normalized.contribution) params.set('contribution', normalized.contribution);
  if (normalized.sort !== CONFERENCE_FILTER_DEFAULTS.sort) params.set('sort', normalized.sort);
  if (normalized.page > 1) params.set('page', String(normalized.page));

  return params;
};

const confidenceRank = (value) => {
  if (typeof value === 'number') return -(value > 1 ? value / 100 : value);
  const normalized = asString(value).toLocaleLowerCase();
  const numeric = Number.parseFloat(normalized);
  if (Number.isFinite(numeric)) return -(numeric > 1 ? numeric / 100 : numeric);
  return -(CONFIDENCE_SCORE.get(normalized) ?? CONFIDENCE_SCORE.get('unknown'));
};

const presentationTypeRank = (paper) =>
  PRESENTATION_TYPE_ORDER.get(
    asString(paper?.presentationTypeNormalized).toLocaleLowerCase(),
  ) ?? PRESENTATION_TYPE_ORDER.get('unknown');

const compareText = (left, right) =>
  CONFERENCE_TEXT_COLLATOR.compare(asString(left), asString(right));

export const sortConferencePapers = (papers = [], sort = CONFERENCE_FILTER_DEFAULTS.sort) => {
  const normalizedSort = normalizeSort(sort);

  return [...papers].sort((left, right) => {
    if (normalizedSort === 'venue') {
      return (
        compareText(left?.venueAcronym ?? left?.venueName, right?.venueAcronym ?? right?.venueName) ||
        presentationTypeRank(left) - presentationTypeRank(right) ||
        compareText(left?.title, right?.title)
      );
    }

    if (normalizedSort === 'title') {
      return compareText(left?.title, right?.title);
    }

    if (normalizedSort === 'confidence') {
      return (
        confidenceRank(left?.classificationConfidence) - confidenceRank(right?.classificationConfidence) ||
        presentationTypeRank(left) - presentationTypeRank(right) ||
        compareText(left?.title, right?.title)
      );
    }

    return (
      presentationTypeRank(left) - presentationTypeRank(right) ||
      compareText(left?.venueAcronym ?? left?.venueName, right?.venueAcronym ?? right?.venueName) ||
      compareText(left?.title, right?.title)
    );
  });
};

export const filterConferencePapers = (papers = [], state = {}, searchIndex) => {
  const normalized = normalizeConferenceFilterState(state);
  const tokens = normalizeConferenceSearchText(normalized.query).split(' ').filter(Boolean);

  const filtered = papers.filter((paper) => {
    if (normalized.venue && paper?.venueId !== normalized.venue) return false;
    if (normalized.area && paper?.ccfAreaId !== normalized.area) return false;
    if (
      normalized.presentationType &&
      paper?.presentationTypeNormalized !== normalized.presentationType
    ) {
      return false;
    }
    if (
      normalized.presentationMode &&
      paper?.presentationModeNormalized !== normalized.presentationMode
    ) {
      return false;
    }
    if (
      normalized.domain &&
      !(paper?.domains ?? []).some((domain) => domain?.id === normalized.domain)
    ) {
      return false;
    }
    if (
      normalized.contribution &&
      paper?.contributionType?.id !== normalized.contribution
    ) {
      return false;
    }

    if (tokens.length > 0) {
      const haystack = searchIndex?.get(paper?.id) ?? getConferencePaperSearchText(paper);
      if (!tokens.every((token) => haystack.includes(token))) return false;
    }

    return true;
  });

  return sortConferencePapers(filtered, normalized.sort);
};

export const paginateConferencePapers = (
  papers = [],
  requestedPage = 1,
  pageSize = CONFERENCE_PAGE_SIZE,
) => {
  const safePageSize = Math.max(1, Number.parseInt(String(pageSize), 10) || CONFERENCE_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(papers.length / safePageSize));
  const page = Math.min(normalizePage(requestedPage), totalPages);
  const start = (page - 1) * safePageSize;

  return {
    items: papers.slice(start, start + safePageSize),
    page,
    pageSize: safePageSize,
    totalItems: papers.length,
    totalPages,
    start: papers.length === 0 ? 0 : start + 1,
    end: Math.min(start + safePageSize, papers.length),
  };
};
