import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  methodOverviewBaselineCompatibilityMap,
  summarizeAdvisories,
  validateArchiveCollections,
  validateArchiveTimes,
  validateMethodOverviewBaseline,
  validatePaperRecord,
} from './content/paper-workflow.mjs';
import { authorsFile, repoRoot, readPaperEntries } from './content/repository.mjs';
import { validateV21Compatibility } from './content/paper-reading-contract.mjs';
import { validateTagConfiguration } from './content/tagging.mjs';

const indexPath = path.join(repoRoot, 'content', 'utility', 'papers-index.md');
const legacyManifestPath = path.join(repoRoot, 'internal', 'paper-workflow-legacy-slugs.json');
const v21ManifestPath = path.join(repoRoot, 'internal', 'paper-workflow-v21-slugs.json');
const v2ManifestPath = path.join(repoRoot, 'internal', 'paper-workflow-v2-slugs.json');
const methodOverviewBaselinePath = path.join(
  repoRoot,
  'internal',
  'paper-workflow-method-overview-baseline.json',
);
const entries = await readPaperEntries();
const indexMarkdown = await fs.readFile(indexPath, 'utf8');
const profiles = JSON.parse(await fs.readFile(authorsFile, 'utf8'));
const legacyManifest = JSON.parse(await fs.readFile(legacyManifestPath, 'utf8'));
const v21Manifest = JSON.parse(await fs.readFile(v21ManifestPath, 'utf8'));
const v2Manifest = JSON.parse(await fs.readFile(v2ManifestPath, 'utf8'));
const methodOverviewBaselineManifest = JSON.parse(
  await fs.readFile(methodOverviewBaselinePath, 'utf8'),
);
if (!Array.isArray(legacyManifest.slugs)) {
  throw new TypeError('internal/paper-workflow-legacy-slugs.json must contain a slugs array.');
}
if (!Array.isArray(v2Manifest.slugs)) {
  throw new TypeError('internal/paper-workflow-v2-slugs.json must contain a slugs array.');
}
const legacyPaperSlugs = new Set(legacyManifest.slugs);
if (!Array.isArray(v21Manifest.slugs)) throw new TypeError('v2.1 compatibility slugs must be an array.');
const v21PaperSlugs = new Set(v21Manifest.slugs);
const v2PaperSlugs = new Set(v2Manifest.slugs);
const methodOverviewBaseline = methodOverviewBaselineCompatibilityMap(
  methodOverviewBaselineManifest,
);
const knownPaperSlugs = new Set(entries.map((entry) => entry.slug));
const records = await Promise.all(
  entries.map(async (entry) => ({ ...entry, markdown: await fs.readFile(entry.sourcePath, 'utf8') })),
);

const exists = async (repoRelativePath) => {
  try {
    await fs.access(path.join(repoRoot, repoRelativePath));
    return true;
  } catch {
    return false;
  }
};

const errors = [];
const advisories = [];

errors.push(...validateTagConfiguration(knownPaperSlugs));

for (const record of records) {
  const result = await validatePaperRecord({
    slug: record.slug,
    markdown: record.markdown,
    indexMarkdown,
    knownPaperSlugs,
    legacyPaperSlugs,
    v2PaperSlugs,
    v21PaperSlugs,
    methodOverviewBaseline,
    imageExists: exists,
  });
  errors.push(...result.errors);
  advisories.push(...result.advisories);
}

const timeResult = validateArchiveTimes(records);
errors.push(...timeResult.errors);
advisories.push(...timeResult.advisories);
const collectionResult = validateArchiveCollections({ records, profiles, indexMarkdown, knownPaperSlugs });
errors.push(...collectionResult.errors);
advisories.push(...collectionResult.advisories);
const methodOverviewBaselineResult = validateMethodOverviewBaseline({
  records,
  manifest: methodOverviewBaselineManifest,
});
errors.push(...methodOverviewBaselineResult.errors);
errors.push(...validateV21Compatibility({ records, manifest: v21Manifest }).errors);

for (const item of errors) {
  console.error(`ERROR [${item.code}] ${item.subject}: ${item.message}`);
}

for (const group of summarizeAdvisories(advisories)) {
  console.warn(`ADVISORY [${group.code}] ${group.count}`);
  for (const item of group.examples) console.warn(`  ${item.subject}: ${item.message}`);
}

if (errors.length > 0) {
  console.error(`Paper workflow check failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log(
    `Paper workflow check passed for ${records.length} papers and ${Array.isArray(profiles) ? profiles.length : 0} author profiles.`,
  );
}
