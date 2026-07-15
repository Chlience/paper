import {
  readConferenceDatasets,
  readConferenceRegistry,
  readConferenceTaxonomy,
} from './conferences/paths.mjs';
import {
  validateConferenceDatasets,
  validateConferenceRegistry,
  validateConferenceTaxonomy,
} from './conferences/validate.mjs';

const [registry, taxonomy, datasets] = await Promise.all([
  readConferenceRegistry(),
  readConferenceTaxonomy(),
  readConferenceDatasets(),
]);
const errors = [
  ...validateConferenceRegistry(registry),
  ...validateConferenceTaxonomy(taxonomy),
  ...validateConferenceDatasets(datasets, registry, taxonomy),
];

if (errors.length > 0) {
  for (const error of errors) console.error(`[${error.code}] ${error.subject}: ${error.message}`);
  process.exitCode = 1;
} else {
  const paperCount = datasets.reduce((sum, dataset) => sum + dataset.papers.length, 0);
  console.log(`Conference data check passed: ${registry.venues.length} venues, ${datasets.length} datasets, ${paperCount} papers.`);
}

