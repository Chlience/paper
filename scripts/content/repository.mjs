import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

export const repoRoot = process.cwd();
export const generatedDir = path.join(repoRoot, 'src/generated');
export const generatedFile = path.join(generatedDir, 'paper-data.json');
export const contentDir = path.join(repoRoot, 'content');
export const paperContentDir = path.join(contentDir, 'papers');
export const utilityContentDir = path.join(contentDir, 'utility');
export const dataDir = path.join(repoRoot, 'data');
export const authorsFile = path.join(dataDir, 'authors.json');

export const toRepoRelativePath = (targetPath) => path.relative(repoRoot, targetPath).split(path.sep).join('/');

const markdownEntry = (dir, fileName) => {
  const sourcePath = path.join(dir, fileName);
  return {
    fileName,
    file: toRepoRelativePath(sourcePath),
    sourcePath,
    slug: fileName.replace(/\.md$/, ''),
  };
};

export const readPaperEntries = async () => {
  const files = await fs.readdir(paperContentDir);
  return files
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) => markdownEntry(paperContentDir, fileName));
};

export const utilityPageDefinitions = [
  {
    ...markdownEntry(utilityContentDir, 'papers-index.md'),
    slug: 'archive',
    title: 'Paper Archive Index',
    path: '/archive/',
  },
  {
    ...markdownEntry(utilityContentDir, 'paper-analysis-workflow.md'),
    slug: 'workflow',
    title: 'Paper Analysis Workflow',
    path: '/workflow/',
  },
  {
    ...markdownEntry(utilityContentDir, 'paper-note-template.md'),
    slug: 'template',
    title: 'Paper Note Template',
    path: '/template/',
  },
];

export const readUtilityEntries = () => utilityPageDefinitions.map((entry) => ({ ...entry }));
