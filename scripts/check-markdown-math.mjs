import fs from 'node:fs/promises';
import process from 'node:process';
import { renderMarkdown } from './content/markdown.mjs';
import { readPaperEntries, readUtilityEntries } from './content/repository.mjs';

const paperEntries = await readPaperEntries();
const paperSlugs = new Set(paperEntries.map(({ slug }) => slug));
const markdownEntries = [
  ...paperEntries,
  ...readUtilityEntries().filter((entry) => entry.fileName === 'papers-index.md'),
];

const texMacroPattern =
  /\\(?:pi|theta|phi|psi|alpha|beta|gamma|delta|epsilon|varepsilon|lambda|mu|sigma|tau|rho|eta|omega|mathrm|mathcal|mathbb|operatorname|frac|sum|prod|log|exp|sqrt|hat|tilde|bar|mathbf|left|right|mid|infty|approx|leq|geq|neq|cdot|times|top|star|nabla|partial|mathsf|text)(?![A-Za-z])/;

const stripFencedCodeBlocks = (markdown) => markdown.replace(/```[\s\S]*?```/g, '');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const renderedPapers = new Map();
for (const entry of markdownEntries) {
  const source = await fs.readFile(entry.sourcePath, 'utf8');
  const markdown = stripFencedCodeBlocks(source);
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

  if (paperSlugs.has(entry.slug)) {
    renderedPapers.set(entry.slug, renderMarkdown(source));
  }
}

const optimizerPaperHtml = renderedPapers.get('2606.04662-muon-outperforms-adam-curvature');

if (!optimizerPaperHtml) {
  fail('Missing optimizer paper fixture for Markdown math check.');
}

if (!optimizerPaperHtml.includes('class="katex"')) {
  fail('Expected Markdown LaTeX to render to KaTeX HTML.');
}

if (optimizerPaperHtml.includes('\\(') || optimizerPaperHtml.includes('\\)')) {
  fail('Expected rendered HTML to remove raw inline math delimiters.');
}

const unsupportedTextSmallCapsPaper = [...renderedPapers].find(([, html]) =>
  html.includes('<mtext>\\textsc</mtext>'),
);

if (unsupportedTextSmallCapsPaper) {
  fail(
    `${unsupportedTextSmallCapsPaper[0]} renders unsupported \\textsc markup; use a KaTeX-supported text command.`,
  );
}

console.log('Markdown math check passed.');
