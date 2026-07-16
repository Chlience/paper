import fs from 'node:fs/promises';
import {
  getCatalogDatasets,
  getCatalogExcludedVenueIds,
  getCatalogVenues,
} from './conferences/catalog-scope.mjs';
import {
  generatedConferenceFile,
  readConferenceDatasets,
  readConferenceRegistry,
  readConferenceTaxonomy,
  readLatestEditionCalendar,
  writeJson,
} from './conferences/paths.mjs';
import {
  validateConferenceDatasets,
  validateConferenceRegistry,
  validateConferenceTaxonomy,
  validateLatestEditionCalendar,
} from './conferences/validate.mjs';

const failOnErrors = (errors) => {
  if (errors.length === 0) return;
  throw new Error(errors.map((error) => `[${error.code}] ${error.subject}: ${error.message}`).join('\n'));
};

const build = async () => {
  const [registry, taxonomy, latestEditionCalendar, datasets] = await Promise.all([
    readConferenceRegistry(),
    readConferenceTaxonomy(),
    readLatestEditionCalendar(),
    readConferenceDatasets(),
  ]);
  failOnErrors([
    ...validateConferenceRegistry(registry),
    ...validateConferenceTaxonomy(taxonomy),
    ...validateLatestEditionCalendar(latestEditionCalendar, registry),
    ...validateConferenceDatasets(datasets, registry, taxonomy),
  ]);

  const areaById = new Map(registry.areas.map((area) => [area.id, area]));
  const datasetByVenue = new Map(datasets.map((dataset) => [dataset.venueId, dataset]));
  const excludedVenueIds = getCatalogExcludedVenueIds(registry);
  const catalogVenues = getCatalogVenues(registry);
  const catalogDatasets = getCatalogDatasets(datasets, registry);
  const papers = catalogDatasets
    .flatMap((dataset) => dataset.papers)
    .filter((paper) => paper.status === 'active')
    .sort(
      (a, b) =>
        a.venueAcronym.localeCompare(b.venueAcronym) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
    );
  const coverage = catalogVenues.map((venue) => {
    const dataset = datasetByVenue.get(venue.id);
    const activePapers = dataset?.papers.filter((paper) => paper.status === 'active') ?? [];
    const activePaperCount = activePapers.length;
    const coreContributionCount = activePapers.filter((paper) =>
      String(paper.coreContribution ?? '').trim(),
    ).length;
    const sourceMissingCount = dataset?.papers.filter((paper) => paper.status === 'source-missing').length ?? 0;
    return {
      venueId: venue.id,
      venueAcronym: venue.acronym,
      venueName: venue.name,
      ccfAreaId: venue.ccfAreaId,
      ccfAreaLabel: areaById.get(venue.ccfAreaId)?.label ?? venue.ccfAreaId,
      status: dataset?.coverageStatus ?? venue.edition2026.status,
      paperCount: activePaperCount,
      coreContributionCount,
      sourceMissingCount,
      sourceUrl: dataset?.source?.url || venue.edition2026.acceptedListUrl || venue.edition2026.homepage || '',
      lastSuccessfulSyncAt: dataset?.source?.lastSuccessfulSyncAt ?? '',
      note: dataset?.coverageNote ?? '',
      latestEdition: latestEditionCalendar.venues[venue.id],
    };
  });

  const countPapers = (predicate) => papers.filter(predicate).length;
  const facets = {
    venues: coverage
      .filter((venue) => venue.paperCount > 0)
      .map((venue) => ({ id: venue.venueId, label: venue.venueAcronym, count: venue.paperCount })),
    areas: registry.areas.map((area) => ({
      id: area.id,
      label: area.label,
      count: countPapers((paper) => paper.ccfAreaId === area.id),
    })),
    presentationTypes: [
      ['oral', 'Oral'],
      ['featured', 'Spotlight / Highlight'],
      ['poster', 'Poster'],
      ['other', 'Other'],
      ['unknown', 'Unspecified'],
    ]
      .map(([id, label]) => ({
        id,
        label,
        count: countPapers((paper) => paper.presentationTypeNormalized === id),
      }))
      .filter((option) => option.count > 0),
    presentationModes: [
      ['in-person', 'In-person'],
      ['virtual', 'Virtual'],
      ['hybrid', 'Hybrid'],
      ['proceedings-only', 'Proceedings-only'],
      ['other', 'Other'],
      ['unknown', 'Unspecified'],
    ]
      .map(([id, label]) => ({
        id,
        label,
        count: countPapers((paper) => paper.presentationModeNormalized === id),
      }))
      .filter((option) => option.count > 0),
    domains: taxonomy.domains.map(({ id, label }) => ({
      id,
      label,
      count: countPapers((paper) => paper.domains.some((domain) => domain.id === id)),
    })),
    contributions: taxonomy.contributionTypes.map(({ id, label }) => ({
      id,
      label,
      count: countPapers((paper) => paper.contributionType.id === id),
    })),
  };

  const generatedAtCandidates = catalogDatasets
    .map((dataset) => dataset.source?.lastSuccessfulSyncAt)
    .filter(Boolean)
    .sort();
  const data = {
    schemaVersion: 3,
    generatedAt: generatedAtCandidates.at(-1) ?? new Date().toISOString(),
    year: 2026,
    ccfSnapshot: registry.ccfSnapshot,
    catalogScope: {
      venueCount: catalogVenues.length,
      excludedVenueIds: [...excludedVenueIds],
    },
    coverage,
    papers,
    facets,
  };
  const leakedVenueIds = new Set(
    [
      ...data.coverage.map((item) => item.venueId),
      ...data.papers.map((item) => item.venueId),
      ...data.facets.venues.map((item) => item.id),
    ].filter((venueId) => excludedVenueIds.has(venueId)),
  );
  if (leakedVenueIds.size > 0) {
    throw new Error(`Excluded venues leaked into generated catalog: ${[...leakedVenueIds].join(', ')}.`);
  }

  await writeJson(generatedConferenceFile, data);
  const size = (await fs.stat(generatedConferenceFile)).size;
  console.log(
    `Generated ${papers.length} conference papers from ${catalogDatasets.length} catalog venue datasets (${Math.round(size / 1024)} KiB).`,
  );
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
