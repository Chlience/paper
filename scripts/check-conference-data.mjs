import {
  readConferenceRegistry,
  readLatestEditionCalendar,
} from './conferences/paths.mjs';
import {
  validateConferenceRegistry,
  validateLatestEditionCalendar,
} from './conferences/validate.mjs';
import { getCatalogVenues } from './conferences/catalog-scope.mjs';

const [registry, latestEditionCalendar] = await Promise.all([
  readConferenceRegistry(),
  readLatestEditionCalendar(),
]);
const validationDate = new Date().toISOString().slice(0, 10);
const errors = [
  ...validateConferenceRegistry(registry),
  ...validateLatestEditionCalendar(latestEditionCalendar, registry, {
    asOf: validationDate,
  }),
];

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[${error.code}] ${error.subject}: ${error.message}`);
  }
  process.exitCode = 1;
} else {
  const catalogVenues = getCatalogVenues(registry);
  const acceptedPapersLinks = catalogVenues.filter(
    (venue) => latestEditionCalendar.venues[venue.id]?.acceptedPapersUrl,
  ).length;
  console.log(
    `Conference directory check passed: ${registry.venues.length} registry venues, ` +
      `${catalogVenues.length} public venues, ${acceptedPapersLinks} accepted-papers links.`,
  );
}
