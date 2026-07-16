import fs from 'node:fs/promises';
import {
  getCatalogExcludedVenueIds,
  getCatalogVenues,
} from './conferences/catalog-scope.mjs';
import {
  generatedConferenceFile,
  readConferenceRegistry,
  readLatestEditionCalendar,
  writeJson,
} from './conferences/paths.mjs';
import {
  validateConferenceRegistry,
  validateLatestEditionCalendar,
} from './conferences/validate.mjs';

const failOnErrors = (errors) => {
  if (errors.length === 0) return;
  throw new Error(
    errors.map((error) => `[${error.code}] ${error.subject}: ${error.message}`).join('\n'),
  );
};

const build = async () => {
  const [registry, latestEditionCalendar] = await Promise.all([
    readConferenceRegistry(),
    readLatestEditionCalendar(),
  ]);
  failOnErrors([
    ...validateConferenceRegistry(registry),
    ...validateLatestEditionCalendar(latestEditionCalendar, registry),
  ]);

  const excludedVenueIds = getCatalogExcludedVenueIds(registry);
  const catalogVenues = getCatalogVenues(registry);
  const areaById = new Map(registry.areas.map((area, index) => [area.id, { ...area, index }]));
  const conferences = catalogVenues
    .map((venue) => ({
      id: venue.id,
      acronym: venue.acronym,
      name: venue.name,
      ccfAreaId: venue.ccfAreaId,
      ccfAreaLabel: areaById.get(venue.ccfAreaId)?.label ?? venue.ccfAreaId,
      ccfRank: venue.ccfRank,
      publisher: venue.publisher,
      dblpUrl: venue.dblpUrl,
      latestEdition: latestEditionCalendar.venues[venue.id],
    }))
    .sort((left, right) => {
      const leftArea = areaById.get(left.ccfAreaId)?.index ?? Number.MAX_SAFE_INTEGER;
      const rightArea = areaById.get(right.ccfAreaId)?.index ?? Number.MAX_SAFE_INTEGER;
      return (
        leftArea - rightArea ||
        left.acronym.localeCompare(right.acronym, ['zh-CN', 'en'], { numeric: true })
      );
    });

  const leakedVenueIds = conferences
    .map((conference) => conference.id)
    .filter((venueId) => excludedVenueIds.has(venueId));
  if (leakedVenueIds.length > 0) {
    throw new Error(`Excluded venues leaked into generated directory: ${leakedVenueIds.join(', ')}.`);
  }

  const areas = registry.areas
    .map((area) => ({
      ...area,
      conferenceCount: conferences.filter((conference) => conference.ccfAreaId === area.id).length,
    }))
    .filter((area) => area.conferenceCount > 0);

  const data = {
    schemaVersion: 4,
    verifiedAt: latestEditionCalendar.verifiedAt,
    ccfSnapshot: registry.ccfSnapshot,
    catalogScope: {
      venueCount: conferences.length,
      excludedVenueIds: [...excludedVenueIds],
    },
    areas,
    conferences,
  };

  await writeJson(generatedConferenceFile, data);
  const size = (await fs.stat(generatedConferenceFile)).size;
  const acceptedPapersLinks = conferences.filter(
    (conference) => conference.latestEdition.acceptedPapersUrl,
  ).length;
  console.log(
    `Generated ${conferences.length} conference directory entries with ${acceptedPapersLinks} accepted-papers links (${Math.round(size / 1024)} KiB).`,
  );
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
