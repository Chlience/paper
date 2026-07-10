import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  summarizeAdvisories,
  validateArchiveCollections,
  validateArchiveTimes,
  validatePaperRecord,
} from './content/paper-workflow.mjs';
import { authorsFile, repoRoot, readPaperEntries } from './content/repository.mjs';

const indexPath = path.join(repoRoot, 'content', 'utility', 'papers-index.md');
const legacyManifestPath = path.join(repoRoot, 'internal', 'paper-workflow-legacy-slugs.json');
const entries = await readPaperEntries();
const indexMarkdown = await fs.readFile(indexPath, 'utf8');
const profiles = JSON.parse(await fs.readFile(authorsFile, 'utf8'));
const legacyManifest = JSON.parse(await fs.readFile(legacyManifestPath, 'utf8'));
if (!Array.isArray(legacyManifest.slugs)) {
  throw new TypeError('internal/paper-workflow-legacy-slugs.json must contain a slugs array.');
}
const legacyPaperSlugs = new Set(legacyManifest.slugs);
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

for (const record of records) {
  const result = await validatePaperRecord({
    slug: record.slug,
    markdown: record.markdown,
    indexMarkdown,
    knownPaperSlugs,
    legacyPaperSlugs,
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
