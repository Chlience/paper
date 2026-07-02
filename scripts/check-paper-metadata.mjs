import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const generatedFile = path.join(repoRoot, 'src/generated/paper-data.json');

const excludedMarkdownFiles = new Set([
  'AGENTS.md',
  'DESIGN.md',
  'PRODUCT.md',
  'README.md',
  'author-x-account-search-sop.md',
]);

const maintenanceScanExemptFiles = new Set([
  'paper-analysis-workflow.md',
  'paper-note-template.md',
]);

const forbiddenPaperMaintenancePatterns = [
  /关系判断/,
  /作者\s*profile\s*pass/i,
  /Author\s+profile\s+pass/i,
  /作者页决策/,
  /Grok broad/i,
  /Grok CLI/i,
  /SuperGrok/i,
  /xConfidence/,
  /not-found/,
  /账号搜索/,
  /X\s*\/\s*GitHub/i,
  /逐人\s*X/,
  /逐作者档案/,
  /全量作者\s*profile/i,
  /全作者\s*X/,
  /全体作者\s*X/,
  /homepage\s*\/\s*GitHub\s*\/\s*Scholar/i,
];

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const readMarkdownFiles = async () => {
  const files = await fs.readdir(repoRoot);
  return files.filter((file) => file.endsWith('.md') && !excludedMarkdownFiles.has(file)).sort();
};

const getTopLevelField = (markdown, name) =>
  markdown.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';

for (const file of await readMarkdownFiles()) {
  const markdown = await fs.readFile(path.join(repoRoot, file), 'utf8');
  for (const legacyField of ['Date', 'Archive-Time', 'Sort-Time']) {
    if (getTopLevelField(markdown, legacyField)) {
      fail(`${file} still uses legacy top-level field ${legacyField}.`);
    }
  }

  if (!getTopLevelField(markdown, 'First-Archived-At')) {
    fail(`${file} is missing First-Archived-At.`);
  }

  if (!getTopLevelField(markdown, 'Updated-At')) {
    fail(`${file} is missing Updated-At.`);
  }

  if (!maintenanceScanExemptFiles.has(file)) {
    for (const pattern of forbiddenPaperMaintenancePatterns) {
      if (pattern.test(markdown)) {
        fail(`${file} contains paper-maintenance text matching ${pattern}.`);
      }
    }
  }
}

try {
  const data = JSON.parse(await fs.readFile(generatedFile, 'utf8'));
  for (const paper of data.papers ?? []) {
    if (!paper.firstArchivedAt) fail(`${paper.slug} is missing generated firstArchivedAt.`);
    if (!paper.updatedAt) fail(`${paper.slug} is missing generated updatedAt.`);
    for (const legacyKey of ['date', 'archiveTime', 'sortTime']) {
      if (Object.hasOwn(paper, legacyKey)) {
        fail(`${paper.slug} still exposes generated legacy key ${legacyKey}.`);
      }
    }
  }

  const trmIndex = data.papers.findIndex((paper) => paper.slug === '2512.23075-trust-region-masking-long-horizon-llm-rl');
  const ulyssesIndex = data.papers.findIndex((paper) => paper.slug === '2309.14509-deepspeed-ulysses-long-sequence-training');
  if (trmIndex === -1 || ulyssesIndex === -1 || trmIndex > ulyssesIndex) {
    fail('Expected TRM to sort before DeepSpeed Ulysses by first archived time.');
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

if (process.exitCode) {
  process.exit();
}

console.log('Paper metadata check passed.');
