import fs from 'node:fs/promises';
import process from 'node:process';
import { generatedFile } from './content/repository.mjs';

const data = JSON.parse(await fs.readFile(generatedFile, 'utf8'));
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

if (!Array.isArray(data.papers) || data.papers.length === 0) {
  fail('No generated papers found.');
} else {
  const pinnedPapers = data.papers.filter((paper) => paper.pinned);
  for (let index = 0; index < pinnedPapers.length; index += 1) {
    if (data.papers[index]?.slug !== pinnedPapers[index].slug) {
      fail('Pinned papers must precede unpinned papers.');
      break;
    }
    if (
      index > 0 &&
      String(pinnedPapers[index - 1].firstArchivedAt).localeCompare(String(pinnedPapers[index].firstArchivedAt)) < 0
    ) {
      fail('Pinned papers should stay sorted by newest First-Archived-At.');
      break;
    }
  }
  if (data.papers.some((paper) => paper.slug === '2026-06-23-chinese-frontier-model-reports-timeline')) {
    fail('The migrated Chinese model timeline must stay outside the paper inventory.');
  }
}

if (process.exitCode) process.exit();
console.log('Pinned paper check passed.');
