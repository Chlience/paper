import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const generatedFile = path.join(repoRoot, 'src/generated/paper-data.json');
const pinnedOverviewSlug = '2026-06-23-chinese-frontier-model-reports-timeline';

const data = JSON.parse(await fs.readFile(generatedFile, 'utf8'));

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

if (!Array.isArray(data.papers) || data.papers.length === 0) {
  fail('No generated papers found.');
} else {
  const pinnedPapers = data.papers.filter((paper) => paper.pinned);
  const overview = data.papers.find((paper) => paper.slug === pinnedOverviewSlug);

  if (!overview) {
    fail(`${pinnedOverviewSlug} is missing from generated papers.`);
  } else if (!overview.pinned) {
    fail(`${pinnedOverviewSlug} should be marked pinned.`);
  }

  if (data.papers[0]?.slug !== pinnedOverviewSlug) {
    fail(`${pinnedOverviewSlug} should be the first generated paper.`);
  }

  for (let index = 1; index < pinnedPapers.length; index += 1) {
    const previous = pinnedPapers[index - 1];
    const current = pinnedPapers[index];
    if (String(previous.firstArchivedAt).localeCompare(String(current.firstArchivedAt)) < 0) {
      fail('Pinned papers should stay sorted by newest firstArchivedAt.');
      break;
    }
  }
}

if (process.exitCode) {
  process.exit();
}

console.log('Pinned paper check passed.');
