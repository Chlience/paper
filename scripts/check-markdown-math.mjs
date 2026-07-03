import fs from 'node:fs/promises';
import process from 'node:process';
import { generatedFile, readPaperEntries, readUtilityEntries } from './content/repository.mjs';

const data = JSON.parse(await fs.readFile(generatedFile, 'utf8'));
const markdownEntries = [
  ...(await readPaperEntries()),
  ...readUtilityEntries().filter((entry) => entry.fileName === 'papers-index.md'),
];

const texMacroPattern =
  /\\(?:pi|theta|phi|psi|alpha|beta|gamma|delta|epsilon|varepsilon|lambda|mu|sigma|tau|rho|eta|omega|mathrm|mathcal|mathbb|operatorname|frac|sum|prod|log|exp|sqrt|hat|tilde|bar|mathbf|left|right|mid|infty|approx|leq|geq|neq|cdot|times|top|star|nabla|partial|mathsf|text)(?![A-Za-z])/;

const stripFencedCodeBlocks = (markdown) => markdown.replace(/```[\s\S]*?```/g, '');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

for (const entry of markdownEntries) {
  const markdown = stripFencedCodeBlocks(await fs.readFile(entry.sourcePath, 'utf8'));
  const lines = markdown.split('\n');

  lines.forEach((line, index) => {
    if (line.includes('\\(') || line.includes('\\)') || line.includes('\\[') || line.includes('\\]')) {
      fail(`${entry.file}:${index + 1} uses raw LaTeX math delimiters; use $...$ or $$...$$.`);
    }

    const codeSpanPattern = /`([^`]+)`/g;
    let match;
    while ((match = codeSpanPattern.exec(line))) {
      if (texMacroPattern.test(match[1])) {
        fail(`${entry.file}:${index + 1} contains TeX in inline code; wrap math with $...$ instead.`);
      }
    }
  });
}

const optimizerPaper = data.papers.find((paper) => paper.slug === '2606.04662-muon-outperforms-adam-curvature');

if (!optimizerPaper) {
  fail('Missing optimizer paper fixture for Markdown math check.');
}

if (!optimizerPaper.html.includes('class="katex"')) {
  fail('Expected Markdown LaTeX to render to KaTeX HTML.');
}

if (optimizerPaper.html.includes('\\(') || optimizerPaper.html.includes('\\)')) {
  fail('Expected rendered HTML to remove raw inline math delimiters.');
}

console.log('Markdown math check passed.');
