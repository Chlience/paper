const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const issue = (code, subject, message) => ({ code, subject, message });

const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(String(value)).protocol);
  } catch {
    return false;
  }
};

const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
};

export const validateConferenceRegistry = (registry) => {
  const errors = [];
  if (
    registry?.schemaVersion !== 1 ||
    !Array.isArray(registry?.areas) ||
    !Array.isArray(registry?.venues)
  ) {
    return [
      issue(
        'registry-shape',
        'registry.json',
        'Expected schemaVersion 1 with areas and venues arrays.',
      ),
    ];
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
    if (venueIds.has(venue.id)) {
      errors.push(issue('duplicate-venue', venue.id, 'Venue IDs must be unique.'));
    }
    venueIds.add(venue.id);
    if (!areaIds.has(venue.ccfAreaId)) {
      errors.push(issue('unknown-venue-area', venue.id, `Unknown CCF area: ${venue.ccfAreaId}.`));
    }
    if (venue.ccfRank !== 'A') {
      errors.push(issue('venue-rank', venue.id, 'Registry contains only CCF-A venues.'));
    }
    if (!venue.publisher || !isHttpUrl(venue.dblpUrl)) {
      errors.push(
        issue(
          'venue-source',
          venue.id,
          'Venue needs a publisher and an HTTP(S) DBLP stream URL.',
        ),
      );
    }
  }

  if (registry.venues.length !== 58) {
    errors.push(
      issue('venue-count', 'registry.json', `Expected 58 CCF-A venues, found ${registry.venues.length}.`),
    );
  }

  const excludedVenueIds = registry.catalogScope?.excludedVenueIds;
  if (!Array.isArray(excludedVenueIds)) {
    errors.push(
      issue(
        'catalog-scope-shape',
        'registry.json',
        'catalogScope.excludedVenueIds must be an array of registry venue IDs.',
      ),
    );
  } else {
    const seenExcludedVenueIds = new Set();
    for (const venueId of excludedVenueIds) {
      if (seenExcludedVenueIds.has(venueId)) {
        errors.push(issue('duplicate-catalog-exclusion', venueId, 'Catalog exclusions must be unique.'));
      }
      if (!venueIds.has(venueId)) {
        errors.push(issue('unknown-catalog-exclusion', venueId, 'Catalog exclusion is not in registry venues.'));
      }
      seenExcludedVenueIds.add(venueId);
    }
  }
  return errors;
};

export const validateLatestEditionCalendar = (
  calendar,
  registry,
  { asOf = calendar?.verifiedAt } = {},
) => {
  if (calendar?.schemaVersion !== 3 || !calendar?.venues || typeof calendar.venues !== 'object') {
    return [
      issue(
        'latest-edition-calendar-shape',
        'latest-editions.json',
        'Expected schemaVersion 3 with a venues object.',
      ),
    ];
  }

  const errors = [];
  if (!isValidIsoDate(calendar.verifiedAt)) {
    errors.push(
      issue('latest-edition-verified-at', 'latest-editions.json', 'verifiedAt must use YYYY-MM-DD.'),
    );
  }

  const asOfValid = isValidIsoDate(asOf);
  if (!asOfValid) {
    errors.push(
      issue('latest-edition-as-of', 'latest-editions.json', 'Validation date must use YYYY-MM-DD.'),
    );
  }

  const freshnessPolicy = calendar.freshnessPolicy;
  const freshnessPolicyValid =
    freshnessPolicy &&
    isValidIsoDate(freshnessPolicy.baselineAt) &&
    isValidIsoDate(calendar.verifiedAt) &&
    freshnessPolicy.baselineAt <= calendar.verifiedAt &&
    Number.isInteger(freshnessPolicy.postConferenceGraceDays) &&
    freshnessPolicy.postConferenceGraceDays >= 0 &&
    freshnessPolicy.postConferenceGraceDays <= 365 &&
    Number.isInteger(freshnessPolicy.recheckIntervalDays) &&
    freshnessPolicy.recheckIntervalDays >= 1 &&
    freshnessPolicy.recheckIntervalDays <= 365;
  if (!freshnessPolicyValid) {
    errors.push(
      issue(
        'latest-edition-freshness-policy',
        'latest-editions.json',
        'freshnessPolicy needs a baselineAt date no later than verifiedAt plus postConferenceGraceDays and recheckIntervalDays between 0 and 365.',
      ),
    );
  }

  const registryVenueIds = new Set(registry.venues.map((venue) => venue.id));
  const excludedVenueIds = new Set(registry.catalogScope?.excludedVenueIds ?? []);
  const asOfYear = asOfValid ? Number(asOf.slice(0, 4)) : null;
  for (const [venueId, latestEdition] of Object.entries(calendar.venues)) {
    if (!registryVenueIds.has(venueId)) {
      errors.push(issue('latest-edition-unknown-venue', venueId, 'Venue is not in registry.json.'));
    }

    const conferenceRanges = [
      ...String(latestEdition?.conferenceDates ?? '').matchAll(
        /(\d{4}-\d{2}-\d{2})–(\d{4}-\d{2}-\d{2})/g,
      ),
    ];
    const submissionDeadline = String(latestEdition?.submissionDeadline ?? '');
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
          new Date(start).getUTCFullYear() === latestEdition?.year
        );
      });
    const maximumEditionYear = asOfYear === null ? null : asOfYear + 1;

    if (
      !Number.isInteger(latestEdition?.year) ||
      latestEdition.year < 2000 ||
      (maximumEditionYear !== null && latestEdition.year > maximumEditionYear) ||
      !submissionDeadlineValid ||
      !conferenceRangesValid
    ) {
      errors.push(
        issue(
          'latest-edition-shape',
          venueId,
          `Entry needs an edition year no later than ${maximumEditionYear ?? 'the validation horizon'}, deadline text, and one or more ordered YYYY-MM-DD–YYYY-MM-DD conference ranges.`,
        ),
      );
    }

    const nextEditionCheck = latestEdition?.nextEditionCheck;
    const nextEditionCheckValid =
      nextEditionCheck === undefined ||
      (nextEditionCheck &&
        ['not-announced', 'schedule-incomplete'].includes(nextEditionCheck.status) &&
        isValidIsoDate(nextEditionCheck.checkedAt) &&
        Array.isArray(nextEditionCheck.sourceUrls) &&
        nextEditionCheck.sourceUrls.length > 0 &&
        nextEditionCheck.sourceUrls.every(isHttpUrl));
    const conferenceEnd = conferenceRangesValid
      ? Math.max(
          ...conferenceRanges.map((range) => Date.parse(`${range[2]}T00:00:00Z`)),
        )
      : Number.NaN;
    const asOfTimestamp = asOfValid ? Date.parse(`${asOf}T00:00:00Z`) : Number.NaN;
    const nextEditionCheckAt =
      nextEditionCheckValid && nextEditionCheck
        ? Date.parse(`${nextEditionCheck.checkedAt}T00:00:00Z`)
        : Number.NaN;
    const nextEditionCheckTimingValid =
      !nextEditionCheck ||
      (Number.isFinite(nextEditionCheckAt) &&
        Number.isFinite(conferenceEnd) &&
        nextEditionCheckAt >= conferenceEnd &&
        (!asOfValid || nextEditionCheckAt <= asOfTimestamp));
    if (!nextEditionCheckValid || !nextEditionCheckTimingValid) {
      errors.push(
        issue(
          'latest-edition-next-check',
          venueId,
          'nextEditionCheck needs a supported status, an in-range checkedAt date after the conference, and official HTTP(S) sources.',
        ),
      );
    }

    if (
      asOfValid &&
      freshnessPolicyValid &&
      conferenceRangesValid &&
      isValidIsoDate(calendar.verifiedAt) &&
      !excludedVenueIds.has(venueId)
    ) {
      const validNextCheckAt =
        nextEditionCheckValid && nextEditionCheckTimingValid ? nextEditionCheckAt : Number.NaN;
      const baselineCheckAt = Number.isFinite(validNextCheckAt)
        ? validNextCheckAt
        : Date.parse(`${freshnessPolicy.baselineAt}T00:00:00Z`);
      const dayMs = 24 * 60 * 60 * 1000;
      const reviewDueAt = Math.max(
        conferenceEnd + freshnessPolicy.postConferenceGraceDays * dayMs,
        baselineCheckAt + freshnessPolicy.recheckIntervalDays * dayMs,
      );
      if (asOfTimestamp > conferenceEnd && asOfTimestamp > reviewDueAt) {
        errors.push(
          issue(
            'latest-edition-review-overdue',
            venueId,
            `Latest-edition review was due by ${new Date(reviewDueAt).toISOString().slice(0, 10)}. Update the edition or record nextEditionCheck.`,
          ),
        );
      }
    }
    if (!['high', 'medium', 'unknown'].includes(latestEdition?.confidence)) {
      errors.push(
        issue('latest-edition-confidence', venueId, 'confidence must be high, medium, or unknown.'),
      );
    }
    if (
      !Array.isArray(latestEdition?.sourceUrls) ||
      latestEdition.sourceUrls.length === 0 ||
      latestEdition.sourceUrls.some((url) => !isHttpUrl(url))
    ) {
      errors.push(
        issue('latest-edition-source', venueId, 'Dates need at least one official HTTP(S) source URL.'),
      );
    }
    if (latestEdition?.acceptedPapersUrl && !isHttpUrl(latestEdition.acceptedPapersUrl)) {
      errors.push(
        issue(
          'latest-edition-accepted-papers-url',
          venueId,
          'acceptedPapersUrl must use HTTP(S) when present.',
        ),
      );
    }
  }

  for (const venueId of registryVenueIds) {
    if (!Object.hasOwn(calendar.venues, venueId)) {
      errors.push(
        issue('latest-edition-missing-venue', venueId, 'Every registry venue needs a latest-edition entry.'),
      );
    }
  }
  return errors;
};
