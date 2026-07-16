import assert from 'node:assert/strict';
import test from 'node:test';
import generatedDirectory from '../src/generated/conference-data.json' with { type: 'json' };
import latestEditionCalendar from '../data/conferences/latest-editions.json' with { type: 'json' };
import registry from '../data/conferences/registry.json' with { type: 'json' };
import { getCatalogVenues } from './conferences/catalog-scope.mjs';
import {
  compareConferencesBySubmissionDeadline,
  getEarliestSubmissionDeadlineDate,
} from './conferences/deadline-sort.mjs';
import {
  validateConferenceRegistry,
  validateLatestEditionCalendar,
} from './conferences/validate.mjs';

const clone = (value) => structuredClone(value);
const catalogVenues = getCatalogVenues(registry);
const firstCatalogVenueId = catalogVenues[0].id;
const validationCodes = (calendar) =>
  new Set(validateLatestEditionCalendar(calendar, registry).map((error) => error.code));

test('registry keeps the 58-venue baseline and excludes CVPR and ICCV from the 56-venue catalog', () => {
  assert.equal(registry.venues.length, 58);
  assert.deepEqual([...registry.catalogScope.excludedVenueIds].sort(), ['cvpr', 'iccv']);
  assert.equal(catalogVenues.length, 56);
  assert.equal(catalogVenues.some((venue) => venue.id === 'cvpr'), false);
  assert.equal(catalogVenues.some((venue) => venue.id === 'iccv'), false);
  assert.deepEqual(validateConferenceRegistry(registry), []);
});

test('latest-editions schema v2 covers every registry venue exactly once', () => {
  assert.equal(latestEditionCalendar.schemaVersion, 2);

  const registryVenueIds = registry.venues.map((venue) => venue.id).sort();
  const latestEditionVenueIds = Object.keys(latestEditionCalendar.venues).sort();
  assert.deepEqual(latestEditionVenueIds, registryVenueIds);
  assert.deepEqual(validateLatestEditionCalendar(latestEditionCalendar, registry), []);

  const missingVenue = clone(latestEditionCalendar);
  delete missingVenue.venues[firstCatalogVenueId];
  assert.ok(validationCodes(missingVenue).has('latest-edition-missing-venue'));

  const unknownVenue = clone(latestEditionCalendar);
  unknownVenue.venues['unknown-venue'] = clone(
    unknownVenue.venues[Object.keys(unknownVenue.venues)[0]],
  );
  assert.ok(validationCodes(unknownVenue).has('latest-edition-unknown-venue'));
});

test('every public catalog venue uses the 2026 edition', () => {
  for (const venue of catalogVenues) {
    assert.equal(
      latestEditionCalendar.venues[venue.id]?.year,
      2026,
      `${venue.id} must use its 2026 edition`,
    );
  }

  const staleCalendar = clone(latestEditionCalendar);
  staleCalendar.venues[firstCatalogVenueId].year = 2025;
  staleCalendar.venues[firstCatalogVenueId].conferenceDates = '2025-05-01–2025-05-05';
  assert.ok(validationCodes(staleCalendar).has('latest-edition-catalog-year'));
});

test('acceptedPapersUrl is optional and uses HTTP(S) when present', () => {
  const optionalUrls = clone(latestEditionCalendar);
  optionalUrls.venues[firstCatalogVenueId].acceptedPapersUrl = '';
  optionalUrls.venues[catalogVenues[1].id].acceptedPapersUrl = null;
  delete optionalUrls.venues[catalogVenues[2].id].acceptedPapersUrl;
  assert.equal(
    validationCodes(optionalUrls).has('latest-edition-accepted-papers-url'),
    false,
  );

  const validUrl = clone(latestEditionCalendar);
  validUrl.venues[firstCatalogVenueId].acceptedPapersUrl =
    'https://example.com/accepted-papers';
  assert.equal(validationCodes(validUrl).has('latest-edition-accepted-papers-url'), false);

  for (const invalidUrl of ['javascript:alert(1)', 'ftp://example.com/accepted-papers']) {
    const invalidCalendar = clone(latestEditionCalendar);
    invalidCalendar.venues[firstCatalogVenueId].acceptedPapersUrl = invalidUrl;
    assert.ok(
      validationCodes(invalidCalendar).has('latest-edition-accepted-papers-url'),
      `${invalidUrl} must be rejected`,
    );
  }
});

test('latest-editions validates verification date, deadlines, conference ranges, and sources', () => {
  const invalidVerifiedAt = clone(latestEditionCalendar);
  invalidVerifiedAt.verifiedAt = '2026-99-99';
  assert.ok(validationCodes(invalidVerifiedAt).has('latest-edition-verified-at'));

  const invalidDeadline = clone(latestEditionCalendar);
  invalidDeadline.venues[firstCatalogVenueId].submissionDeadline = '2025-02-30 AoE';
  assert.ok(validationCodes(invalidDeadline).has('latest-edition-shape'));

  const invalidConferenceRange = clone(latestEditionCalendar);
  invalidConferenceRange.venues[firstCatalogVenueId].conferenceDates =
    '2026-05-05–2026-05-01';
  assert.ok(validationCodes(invalidConferenceRange).has('latest-edition-shape'));

  for (const sourceUrls of [[], ['javascript:alert(1)']]) {
    const invalidSources = clone(latestEditionCalendar);
    invalidSources.venues[firstCatalogVenueId].sourceUrls = sourceUrls;
    assert.ok(validationCodes(invalidSources).has('latest-edition-source'));
  }
});

test('deadline ordering uses the earliest full date and sends undated entries to the end', () => {
  assert.equal(
    getEarliestSubmissionDeadlineDate(
      'Spring 2025-03-18 / Fall 2025-09-16, 23:59 AoE',
    ),
    '2025-03-18',
  );
  assert.equal(
    getEarliestSubmissionDeadlineDate('每年 02-01 / 05-01 / 11-01（IMWUT 多周期）'),
    null,
  );

  const fixtures = [
    {
      id: 'undated',
      acronym: 'Undated',
      latestEdition: { submissionDeadline: '每年 02-01' },
    },
    {
      id: 'later',
      acronym: 'Later',
      latestEdition: { submissionDeadline: '2026-01-01' },
    },
    {
      id: 'multi-cycle',
      acronym: 'Multi',
      latestEdition: { submissionDeadline: 'R1 2025-04-01 / R2 2026-02-01' },
    },
  ];

  assert.deepEqual(
    [...fixtures]
      .sort(compareConferencesBySubmissionDeadline)
      .map((conference) => conference.id),
    ['multi-cycle', 'later', 'undated'],
  );
});

test('generated directory contains only public conference-level data', () => {
  assert.equal(generatedDirectory.schemaVersion, 4);
  assert.deepEqual(Object.keys(generatedDirectory).sort(), [
    'areas',
    'catalogScope',
    'ccfSnapshot',
    'conferences',
    'schemaVersion',
    'verifiedAt',
  ]);
  assert.equal(generatedDirectory.conferences.length, 56);
  assert.equal(Object.hasOwn(generatedDirectory, 'papers'), false);
  assert.equal(Object.hasOwn(generatedDirectory, 'coverage'), false);
  assert.equal(Object.hasOwn(generatedDirectory, 'facets'), false);

  const generatedVenueIds = new Set(
    generatedDirectory.conferences.map((conference) => conference.id),
  );
  for (const excludedVenueId of registry.catalogScope.excludedVenueIds) {
    assert.equal(generatedVenueIds.has(excludedVenueId), false);
  }
  for (const conference of generatedDirectory.conferences) {
    assert.equal(Object.hasOwn(conference, 'papers'), false);
    assert.equal(Object.hasOwn(conference.latestEdition, 'papers'), false);
  }

  assert.deepEqual(
    generatedDirectory.conferences.map((conference) => conference.id),
    [...generatedDirectory.conferences]
      .sort(compareConferencesBySubmissionDeadline)
      .map((conference) => conference.id),
  );
});
