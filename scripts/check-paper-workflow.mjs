import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { readAuthorProfiles } from './content/authors.mjs';
import {
  findRecurringUnprofiled,
  summarizeAdvisories,
  validateArchiveTimes,
  validateAuthorProfiles,
  validatePaperRecord,
} from './content/paper-workflow.mjs';
import { repoRoot, readPaperEntries } from './content/repository.mjs';

const indexPath = path.join(repoRoot, 'content', 'utility', 'papers-index.md');
const entries = await readPaperEntries();
const indexMarkdown = await fs.readFile(indexPath, 'utf8');
const profiles = await readAuthorProfiles();
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
    imageExists: exists,
  });
  errors.push(...result.errors);
  advisories.push(...result.advisories);
}

const timeResult = validateArchiveTimes(records);
errors.push(...timeResult.errors);
advisories.push(...timeResult.advisories);
errors.push(...validateAuthorProfiles(profiles).errors);
advisories.push(...findRecurringUnprofiled(records, profiles));

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
  console.log(`Paper workflow check passed for ${records.length} papers and ${profiles.length} author profiles.`);
}
