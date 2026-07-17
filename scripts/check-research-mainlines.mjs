import process from 'node:process';
import {
  loadResearchMainlines,
  validateResearchMainlines,
} from './content/research-mainlines.mjs';

const args = new Set(process.argv.slice(2));
const allowedArgs = new Set(['--require-current', '--help']);
const unknownArgs = [...args].filter((arg) => !allowedArgs.has(arg));

if (unknownArgs.length > 0) {
  console.error(`Unknown argument(s): ${unknownArgs.join(', ')}`);
  process.exitCode = 2;
} else if (args.has('--help')) {
  console.log(`Usage: node scripts/check-research-mainlines.mjs [--require-current]

Validates the v2 research-mainline graph and its paper coverage.

  --require-current  Require every current paper to be covered, including papers
                     newer than the recorded manual snapshot.`);
} else {
  const source = await loadResearchMainlines();
  const result = await validateResearchMainlines(source, {
    requireCurrent: args.has('--require-current'),
  });

  for (const item of result.errors) {
    console.error(`ERROR [${item.code}] ${item.subject}: ${item.message}`);
  }
  for (const item of result.advisories) {
    console.warn(`ADVISORY [${item.code}] ${item.subject}: ${item.message}`);
  }

  if (!result.valid) {
    console.error(`Research mainline check failed with ${result.errors.length} error(s).`);
    process.exitCode = 1;
  } else {
    const status = args.has('--require-current') ? 'current corpus' : `snapshot ${source.snapshot.asOf}`;
    console.log(
      `Research mainline check passed for ${source.lines.length} lines, ${source.nodes.length} nodes, ` +
        `${source.relations.length} relations, and ${source.materials.length} materials (${status}).`,
    );
  }
}
