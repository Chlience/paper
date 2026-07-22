import fs from 'node:fs/promises';
import process from 'node:process';
import {
  buildMainlineRecords,
  loadResearchMainlines,
  validateResearchMainlines,
} from './content/research-mainlines.mjs';
import { generatedDir, generatedMainlineFile } from './content/repository.mjs';

const entries = await loadResearchMainlines();
const validation = await validateResearchMainlines(entries);
if (!validation.valid) {
  for (const item of validation.errors) console.error(`ERROR [${item.code}] ${item.subject}: ${item.message}`);
  process.exitCode = 1;
} else {
  const mainlines = buildMainlineRecords(entries);
  await fs.mkdir(generatedDir, { recursive: true });
  await fs.writeFile(
    generatedMainlineFile,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), mainlines }, null, 2)}\n`,
  );
  console.log(`Generated ${mainlines.length} request-defined research mainlines.`);
}
