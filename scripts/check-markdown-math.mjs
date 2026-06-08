import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const generatedFile = path.join(repoRoot, 'src/generated/paper-data.json');
const data = JSON.parse(await fs.readFile(generatedFile, 'utf8'));

const optimizerPaper = data.papers.find((paper) => paper.slug === '2606.04662-muon-outperforms-adam-curvature');

if (!optimizerPaper) {
  console.error('Missing optimizer paper fixture for Markdown math check.');
  process.exit(1);
}

if (!optimizerPaper.html.includes('class="katex"')) {
  console.error('Expected Markdown LaTeX to render to KaTeX HTML.');
  process.exit(1);
}

if (optimizerPaper.html.includes('\\(') || optimizerPaper.html.includes('\\)')) {
  console.error('Expected rendered HTML to remove raw inline math delimiters.');
  process.exit(1);
}

console.log('Markdown math check passed.');
