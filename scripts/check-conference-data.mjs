import {
  readConferenceDatasets,
  readConferenceRegistry,
  readConferenceTaxonomy,
  readPreviousEditionCalendar,
} from './conferences/paths.mjs';
import {
  validateConferenceDatasets,
  validateConferenceRegistry,
  validateConferenceTaxonomy,
  validatePreviousEditionCalendar,
} from './conferences/validate.mjs';

const [registry, taxonomy, previousEditionCalendar, datasets] = await Promise.all([
  readConferenceRegistry(),
  readConferenceTaxonomy(),
  readPreviousEditionCalendar(),
  readConferenceDatasets(),
]);
const errors = [
  ...validateConferenceRegistry(registry),
  ...validateConferenceTaxonomy(taxonomy),
  ...validatePreviousEditionCalendar(previousEditionCalendar, registry),
  ...validateConferenceDatasets(datasets, registry, taxonomy),
];

if (errors.length > 0) {
  for (const error of errors) console.error(`[${error.code}] ${error.subject}: ${error.message}`);
  process.exitCode = 1;
} else {
  const paperCount = datasets.reduce((sum, dataset) => sum + dataset.papers.length, 0);
  console.log(`Conference data check passed: ${registry.venues.length} venues, ${datasets.length} datasets, ${paperCount} papers.`);
}
