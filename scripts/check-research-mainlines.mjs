import process from 'node:process';
import { loadResearchMainlines, validateResearchMainlines } from './content/research-mainlines.mjs';

const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => arg !== '--help')) {
  console.error(`Unknown argument(s): ${[...args].filter((arg) => arg !== '--help').join(', ')}`);
  process.exitCode = 2;
} else if (args.has('--help')) {
  console.log(`Usage: node scripts/check-research-mainlines.mjs

Validates request-defined mainline articles, their independent synthesis contract,
local paper links, and separation from the paper inventory.`);
} else {
  const entries = await loadResearchMainlines();
  const result = await validateResearchMainlines(entries);
  for (const item of result.errors) console.error(`ERROR [${item.code}] ${item.subject}: ${item.message}`);
  if (!result.valid) {
    console.error(`Research mainline check failed with ${result.errors.length} error(s).`);
    process.exitCode = 1;
  } else {
    console.log(`Research mainline check passed for ${entries.length} request-defined mainlines.`);
  }
}
