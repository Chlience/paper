const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const htmlResiduePattern = /<!--|-->|<[^>]*>|&(?:#x[\da-f]+|#\d+|[a-z][a-z\d]*);/i;
const controlResiduePattern = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const datasetCoverageStatuses = new Set(['partial', 'pending', 'published', 'unavailable']);
const editionStatuses = new Set([
  'adapter-pending',
  'no-edition',
  'partial',
  'pending',
  'published',
  'unavailable',
]);

const issue = (code, subject, message) => ({ code, subject, message });

const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(String(value)).protocol);
  } catch {
    return false;
  }
};

const isValidTimestamp = (value) =>
  typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));

const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
};

export const validateConferenceRegistry = (registry) => {
  const errors = [];
  if (registry?.schemaVersion !== 1 || !Array.isArray(registry?.areas) || !Array.isArray(registry?.venues)) {
    return [issue('registry-shape', 'registry.json', 'Expected schemaVersion 1 with areas and venues arrays.')];
  }
  const areaIds = new Set();
  for (const area of registry.areas) {
    if (!idPattern.test(area?.id ?? '') || !area?.label) {
      errors.push(issue('area-shape', area?.id ?? 'unknown', 'Area needs a kebab-case id and label.'));
    }
    if (areaIds.has(area.id)) errors.push(issue('duplicate-area', area.id, 'Area IDs must be unique.'));
    areaIds.add(area.id);
  }
  const venueIds = new Set();
  for (const venue of registry.venues) {
    if (!idPattern.test(venue?.id ?? '') || !venue?.acronym || !venue?.name) {
      errors.push(issue('venue-shape', venue?.id ?? 'unknown', 'Venue needs id, acronym, and name.'));
    }
    if (venueIds.has(venue.id)) errors.push(issue('duplicate-venue', venue.id, 'Venue IDs must be unique.'));
    venueIds.add(venue.id);
    if (!areaIds.has(venue.ccfAreaId)) {
      errors.push(issue('unknown-venue-area', venue.id, `Unknown CCF area: ${venue.ccfAreaId}.`));
    }
    if (venue.ccfRank !== 'A') errors.push(issue('venue-rank', venue.id, 'Registry contains only CCF-A venues.'));
    if (!editionStatuses.has(venue.edition2026?.status)) {
      errors.push(issue('edition-status', venue.id, `Invalid edition2026 status: ${venue.edition2026?.status ?? 'missing'}.`));
    }
    if (
      venue.edition2026?.status === 'published' &&
      (!venue.edition2026.adapter ||
        !isHttpUrl(venue.edition2026.homepage) ||
        !isHttpUrl(venue.edition2026.acceptedListUrl))
    ) {
      errors.push(
        issue(
          'published-edition-source',
          venue.id,
          'Published editions need an adapter plus HTTP(S) homepage and accepted-list URLs.',
        ),
      );
    }
  }
  if (registry.venues.length !== 58) {
    errors.push(issue('venue-count', 'registry.json', `Expected 58 CCF-A venues, found ${registry.venues.length}.`));
  }
  return errors;
};

export const validatePreviousEditionCalendar = (calendar, registry) => {
  if (calendar?.schemaVersion !== 1 || !calendar?.venues || typeof calendar.venues !== 'object') {
    return [
      issue(
        'previous-edition-calendar-shape',
        'previous-editions.json',
        'Expected schemaVersion 1 with a venues object.',
      ),
    ];
  }

  const errors = [];
  if (!isValidIsoDate(calendar.verifiedAt)) {
    errors.push(
      issue('previous-edition-verified-at', 'previous-editions.json', 'verifiedAt must use YYYY-MM-DD.'),
    );
  }
  const registryVenueIds = new Set(registry.venues.map((venue) => venue.id));
  const calendarVenueIds = Object.keys(calendar.venues);
  for (const venueId of calendarVenueIds) {
    const previousEdition = calendar.venues[venueId];
    if (!registryVenueIds.has(venueId)) {
      errors.push(issue('previous-edition-unknown-venue', venueId, 'Venue is not in registry.json.'));
    }
    const conferenceRanges = [
      ...String(previousEdition?.conferenceDates ?? '').matchAll(
        /(\d{4}-\d{2}-\d{2})–(\d{4}-\d{2}-\d{2})/g,
      ),
    ];
    const submissionDeadline = String(previousEdition?.submissionDeadline ?? '');
    const submissionDates = submissionDeadline.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    const submissionDeadlineValid =
      (submissionDates.length > 0 || /每(?:年|月)/.test(submissionDeadline)) &&
      submissionDates.every(isValidIsoDate);
    const conferenceRangesValid =
      conferenceRanges.length > 0 &&
      conferenceRanges.every((range) => {
        const start = isValidIsoDate(range[1]) ? Date.parse(`${range[1]}T00:00:00Z`) : Number.NaN;
        const end = isValidIsoDate(range[2]) ? Date.parse(`${range[2]}T00:00:00Z`) : Number.NaN;
        return (
          Number.isFinite(start) &&
          Number.isFinite(end) &&
          start <= end &&
          new Date(start).getUTCFullYear() === previousEdition?.year
        );
      });
    if (
      !Number.isInteger(previousEdition?.year) ||
      previousEdition.year < 2000 ||
      previousEdition.year > 2025 ||
      !submissionDeadlineValid ||
      !conferenceRangesValid
    ) {
      errors.push(
        issue(
          'previous-edition-shape',
          venueId,
          'Entry needs a prior year, deadline text, and one or more ordered YYYY-MM-DD–YYYY-MM-DD conference ranges.',
        ),
      );
    }
    if (!['high', 'medium', 'unknown'].includes(previousEdition?.confidence)) {
      errors.push(
        issue('previous-edition-confidence', venueId, 'confidence must be high, medium, or unknown.'),
      );
    }
    if (
      !Array.isArray(previousEdition?.sourceUrls) ||
      previousEdition.sourceUrls.length === 0 ||
      previousEdition.sourceUrls.some((url) => !isHttpUrl(url))
    ) {
      errors.push(
        issue('previous-edition-source', venueId, 'Dates need at least one official HTTP(S) source URL.'),
      );
    }
  }
  for (const venueId of registryVenueIds) {
    if (!Object.hasOwn(calendar.venues, venueId)) {
      errors.push(issue('previous-edition-missing-venue', venueId, 'Every registry venue needs a previous-edition entry.'));
    }
  }
  return errors;
};

export const validateConferenceTaxonomy = (taxonomy) => {
  const errors = [];
  if (taxonomy?.schemaVersion !== 1 || !Array.isArray(taxonomy?.domains) || !Array.isArray(taxonomy?.contributionTypes)) {
    return [issue('taxonomy-shape', 'taxonomy.json', 'Expected domains and contributionTypes arrays.')];
  }
  for (const [groupName, definitions] of [
    ['domain', taxonomy.domains],
    ['contribution', taxonomy.contributionTypes],
  ]) {
    const ids = new Set();
    for (const definition of definitions) {
      if (!idPattern.test(definition?.id ?? '') || !definition?.label || !Array.isArray(definition?.aliases)) {
        errors.push(issue(`${groupName}-shape`, definition?.id ?? 'unknown', 'Definition needs id, label, and aliases.'));
      }
      if (ids.has(definition.id)) errors.push(issue(`duplicate-${groupName}`, definition.id, 'IDs must be unique.'));
      ids.add(definition.id);
    }
  }
  return errors;
};

export const validateConferenceDatasets = (datasets, registry, taxonomy) => {
  const errors = [];
  const venues = new Map(registry.venues.map((venue) => [venue.id, venue]));
  const domainIds = new Set(taxonomy.domains.map((domain) => domain.id));
  const contributionIds = new Set(taxonomy.contributionTypes.map((type) => type.id));
  const datasetVenueIds = new Set();
  const paperIds = new Set();

  for (const dataset of datasets) {
    if (dataset?.schemaVersion !== 2 || dataset?.year !== 2026 || !Array.isArray(dataset?.papers)) {
      errors.push(issue('dataset-shape', dataset?.venueId ?? 'unknown', 'Dataset needs schemaVersion 2, year 2026, and papers.'));
      continue;
    }
    const venue = venues.get(dataset.venueId);
    if (!venue) errors.push(issue('unknown-dataset-venue', dataset.venueId, 'Venue is not in registry.'));
    if (datasetVenueIds.has(dataset.venueId)) errors.push(issue('duplicate-dataset', dataset.venueId, 'Only one dataset per venue is allowed.'));
    datasetVenueIds.add(dataset.venueId);
    if (!dataset.source?.url || !dataset.source?.adapter || !dataset.coverageStatus) {
      errors.push(issue('dataset-source', dataset.venueId, 'Dataset needs source URL, adapter, and coverageStatus.'));
    }
    if (!datasetCoverageStatuses.has(dataset.coverageStatus)) {
      errors.push(issue('dataset-coverage', dataset.venueId, `Invalid coverage status: ${dataset.coverageStatus}.`));
    }
    for (const sourceUrl of [dataset.source?.url, ...(dataset.source?.urls ?? [])].filter(Boolean)) {
      if (!isHttpUrl(sourceUrl)) {
        errors.push(issue('dataset-source-url', dataset.venueId, `Dataset source URL must use HTTP(S): ${sourceUrl}`));
      }
    }
    if (venue && dataset.source?.adapter !== venue.edition2026?.adapter) {
      errors.push(
        issue(
          'dataset-adapter',
          dataset.venueId,
          `Dataset adapter ${dataset.source?.adapter ?? 'missing'} does not match registry adapter ${venue.edition2026?.adapter ?? 'missing'}.`,
        ),
      );
    }

    const localIds = new Set();
    const officialIds = new Set();
    for (const paper of dataset.papers) {
      const subject = `${dataset.venueId}:${paper?.title ?? paper?.id ?? 'unknown'}`;
      const authors = Array.isArray(paper?.authors) ? paper.authors : [];
      if (!paper?.id || !paper?.title || !Array.isArray(paper?.authors)) {
        errors.push(issue('paper-shape', subject, 'Paper needs id, title, and authors.'));
      }
      if (localIds.has(paper.id) || paperIds.has(paper.id)) errors.push(issue('duplicate-paper', subject, 'Paper IDs must be unique.'));
      localIds.add(paper.id);
      paperIds.add(paper.id);
      if (paper.officialId) {
        if (officialIds.has(paper.officialId)) {
          errors.push(issue('duplicate-official-id', subject, `Official ID must be unique within ${dataset.venueId}.`));
        }
        officialIds.add(paper.officialId);
      }
      if (paper.venueId !== dataset.venueId || paper.year !== dataset.year) {
        errors.push(issue('paper-venue-year', subject, 'Paper venue and year must match its dataset.'));
      }
      if (!['main', 'findings', 'industry', 'demo', 'workshop', 'short', 'other', 'unknown'].includes(paper.trackNormalized)) {
        errors.push(issue('paper-track', subject, `Invalid normalized track: ${paper.trackNormalized}.`));
      }
      if (!['oral', 'featured', 'poster', 'other', 'unknown'].includes(paper.presentationTypeNormalized)) {
        errors.push(
          issue(
            'paper-presentation-type',
            subject,
            `Invalid presentation type: ${paper.presentationTypeNormalized}.`,
          ),
        );
      }
      if (
        !['in-person', 'virtual', 'hybrid', 'proceedings-only', 'other', 'unknown'].includes(
          paper.presentationModeNormalized,
        )
      ) {
        errors.push(
          issue(
            'paper-presentation-mode',
            subject,
            `Invalid presentation mode: ${paper.presentationModeNormalized}.`,
          ),
        );
      }
      if (Object.hasOwn(paper, 'presentationRaw') || Object.hasOwn(paper, 'presentationNormalized')) {
        errors.push(
          issue(
            'paper-presentation-legacy',
            subject,
            'Legacy presentation fields must be migrated to presentationType and presentationMode fields.',
          ),
        );
      }
      if (paper.publicationStatus && !['accepted', 'scheduled', 'published'].includes(paper.publicationStatus)) {
        errors.push(issue('paper-publication', subject, `Invalid publication status: ${paper.publicationStatus}.`));
      }
      if (!['active', 'source-missing', 'withdrawn'].includes(paper.status)) {
        errors.push(issue('paper-status', subject, `Invalid paper status: ${paper.status}.`));
      }
      if (paper.publicationStatus === 'published' && !paper.paperUrl) {
        errors.push(issue('paper-publication-url', subject, 'Published papers need a paperUrl.'));
      }
      if (paper.authorStatus && !['embargoed'].includes(paper.authorStatus)) {
        errors.push(issue('paper-author-status', subject, `Invalid author status: ${paper.authorStatus}.`));
      }
      if (paper.abstractStatus && !['embargoed'].includes(paper.abstractStatus)) {
        errors.push(issue('paper-abstract-status', subject, `Invalid abstract status: ${paper.abstractStatus}.`));
      }
      if (authors.length === 0 && paper.authorStatus !== 'embargoed') {
        errors.push(issue('paper-authors', subject, 'Papers need authors unless the official author list is embargoed.'));
      }
      if (authors.length > 0 && paper.authorStatus === 'embargoed') {
        errors.push(issue('paper-embargoed-authors', subject, 'Embargoed author names must not be persisted.'));
      }
      if (
        paper.abstractStatus === 'embargoed' &&
        (paper.coreContribution || paper.classificationStatus !== 'title-only')
      ) {
        errors.push(issue('paper-embargoed-abstract', subject, 'Embargo placeholders cannot be used as classification evidence.'));
      }
      for (const [field, value] of [
        ['title', paper.title],
        ['coreContribution', paper.coreContribution],
        ...authors.map((author) => ['author', author]),
      ]) {
        if (htmlResiduePattern.test(String(value ?? ''))) {
          errors.push(issue('paper-html-residue', subject, `${field} contains an HTML entity or comment marker.`));
        }
        if (controlResiduePattern.test(String(value ?? ''))) {
          errors.push(issue('paper-control-residue', subject, `${field} contains a control character.`));
        }
      }
      if (paper.trackNormalized !== 'main') {
        errors.push(issue('paper-scope', subject, 'MVP accepts Main Full/Regular papers only.'));
      }
      const paperDomains = Array.isArray(paper.domains) ? paper.domains : [];
      if (paperDomains.length === 0) {
        errors.push(issue('paper-domains', subject, 'Paper needs at least one classified domain.'));
      }
      for (const domain of paperDomains) {
        if (!domainIds.has(domain.id)) errors.push(issue('paper-domain', subject, `Unknown domain: ${domain.id}.`));
      }
      if (!paper.primaryDomainId || !paperDomains.some((domain) => domain.id === paper.primaryDomainId)) {
        errors.push(issue('paper-primary-domain', subject, 'primaryDomainId must reference one of the paper domains.'));
      }
      if (!contributionIds.has(paper.contributionType?.id)) {
        errors.push(issue('paper-contribution', subject, `Unknown contribution type: ${paper.contributionType?.id}.`));
      }
      if (
        typeof paper.classificationConfidence !== 'number' ||
        !Number.isFinite(paper.classificationConfidence) ||
        paper.classificationConfidence < 0 ||
        paper.classificationConfidence > 1
      ) {
        errors.push(issue('paper-classification-confidence', subject, 'classificationConfidence must be a number from 0 to 1.'));
      }
      if (!paper.sourceUrl || !paper.firstSeenAt || !paper.lastSeenAt) {
        errors.push(issue('paper-provenance', subject, 'Paper needs sourceUrl, firstSeenAt, and lastSeenAt.'));
      }
      if (
        (paper.firstSeenAt && !isValidTimestamp(paper.firstSeenAt)) ||
        (paper.lastSeenAt && !isValidTimestamp(paper.lastSeenAt))
      ) {
        errors.push(issue('paper-observation-time', subject, 'Observation times must be valid timestamps.'));
      } else if (Date.parse(paper.firstSeenAt) > Date.parse(paper.lastSeenAt)) {
        errors.push(issue('paper-observation-order', subject, 'firstSeenAt cannot be later than lastSeenAt.'));
      }
      for (const [field, value] of [
        ['sourceUrl', paper.sourceUrl],
        ['paperUrl', paper.paperUrl],
        ['pdfUrl', paper.pdfUrl],
      ]) {
        if (value && !isHttpUrl(value)) {
          errors.push(issue('paper-url', subject, `${field} must use HTTP(S).`));
        }
      }
      if (paper.notePath && !/^\/(?!\/)/.test(paper.notePath)) {
        errors.push(issue('paper-note-path', subject, 'notePath must be a site-absolute path.'));
      }
    }
  }
  for (const venue of registry.venues) {
    const requiresDataset = Boolean(venue.edition2026?.adapter) || venue.edition2026?.status === 'published';
    if (requiresDataset && !datasetVenueIds.has(venue.id)) {
      errors.push(issue('missing-dataset', venue.id, 'Configured or published 2026 venues need a dataset.'));
    }
  }
  return errors;
};
