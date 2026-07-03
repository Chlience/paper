import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { authorsFile, generatedFile, repoRoot } from './content/repository.mjs';

const distDir = path.join(repoRoot, 'dist');
const legacyLocalRoot = ['', 'home', 'chlience', 'paper'].join('/');
const expectedSiteUrl = process.env.PUBLIC_SITE_URL ?? 'https://papers.chlience.com';
const expectedUmamiScriptSrc = 'https://umami.chlience.com/script.js';
const expectedUmamiWebsiteId = 'adb2da68-eff5-4878-9124-14cbde61f171';

const requiredSectionGroups = [
  { name: 'Source', headings: ['## Source'] },
  { name: '作者与关系', headings: ['## 作者与关系'] },
  { name: '一句话结论', headings: ['## 一句话结论'] },
  { name: '论文脉络', headings: ['## 论文脉络'] },
  {
    name: '关键实验/定理',
    headings: ['## 关键实验/定理', '## 关键实验结果', '## 主要实验结果', '## 关键定理', '## 文献扫描结果', '## 方法论论证'],
  },
  { name: '证据链强度评估', headings: ['## 证据链强度评估'] },
  { name: 'OpenReview / 审稿意见吸收', headings: ['## OpenReview / 审稿意见吸收'] },
  { name: '主要启发', headings: ['## 主要启发'] },
  { name: '局限', headings: ['## 局限', '## 局限与待验证问题'] },
  { name: 'Reference Intake Brief', headings: ['## Reference Intake Brief'] },
];

const forbiddenPublicPaperPatterns = [
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
];

const forbiddenPublicUtilityPatterns = [
  ...forbiddenPublicPaperPatterns,
  /Grok/i,
  /author-x-account-search-sop\.md/i,
  /候选账号/,
  /检索命令/,
  /scratch/i,
  /\/tmp\b/i,
  /未跟踪/,
  /npm run/i,
  /文件是否落盘/,
  /提交最终回答/,
  /本地提交策略/,
  /最终回复/,
];

const suspiciousHrefPatterns = [
  /%EF%BC%9B/i,
  /%EF%BC%8C/i,
  /%E3%80%82/i,
  /[；，。]/,
  /%E6%9C%AA%E5%8F%91%E7%8E%B0/i,
];

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const exists = async (target) => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const scanFiles = async (dir, predicate) => {
  if (!(await exists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanFiles(fullPath, predicate)));
    } else if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
};

const data = JSON.parse(await fs.readFile(generatedFile, 'utf8'));
const sourceAuthors = JSON.parse(await fs.readFile(authorsFile, 'utf8'));

if (!Array.isArray(data.papers) || data.papers.length === 0) {
  fail('No generated paper pages found.');
}

if (!Array.isArray(data.authors)) {
  fail('No generated author pages found.');
}

const paperSlugs = new Set((data.papers ?? []).map((paper) => paper.slug));
const authorSlugs = new Set((data.authors ?? []).map((author) => author.slug));
const generatedAuthorsBySlug = new Map((data.authors ?? []).map((author) => [author.slug, author]));

const checkHtmlLinks = (label, html) => {
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (suspiciousHrefPatterns.some((pattern) => pattern.test(href))) {
      fail(`${label} generated HTML contains suspicious href: ${href}`);
    }

    const paperMatch = href.match(/^\/papers\/([^/#?]+)\//);
    if (paperMatch && !paperSlugs.has(paperMatch[1]) && paperMatch[1] !== '%3Cslug%3E') {
      fail(`${label} links to missing paper page: ${href}`);
    }

    const authorMatch = href.match(/^\/authors\/([^/#?]+)\//);
    if (authorMatch && !authorSlugs.has(authorMatch[1]) && authorMatch[1] !== '%3Cslug%3E') {
      fail(`${label} links to missing author page: ${href}`);
    }
  }
};

for (const paper of data.papers) {
  const source = await fs.readFile(path.join(repoRoot, paper.file), 'utf8');
  for (const group of requiredSectionGroups) {
    if (!group.headings.some((heading) => source.includes(heading))) {
      fail(`${paper.file} is missing required section group: ${group.name}`);
    }
  }

  if (paper.html.includes(legacyLocalRoot)) {
    fail(`${paper.file} generated HTML still contains a local absolute path.`);
  }

  if (paper.sourceUrl && !/^https?:\/\//i.test(paper.sourceUrl)) {
    fail(`${paper.file} generated sourceUrl must be an absolute URL: ${paper.sourceUrl}`);
  }

  for (const pattern of forbiddenPublicPaperPatterns) {
    if (pattern.test(paper.html)) {
      fail(`${paper.file} generated HTML contains public maintenance text matching ${pattern}.`);
    }
  }

  checkHtmlLinks(paper.file, paper.html);
}

for (const utility of data.utilities) {
  if (utility.html.includes(legacyLocalRoot)) {
    fail(`${utility.file} generated HTML still contains a local absolute path.`);
  }

  for (const pattern of forbiddenPublicUtilityPatterns) {
    if (pattern.test(utility.html)) {
      fail(`${utility.file} generated HTML contains public maintenance text matching ${pattern}.`);
    }
  }

  checkHtmlLinks(utility.file, utility.html);
}

for (const sourceAuthor of sourceAuthors) {
  const generatedAuthor = generatedAuthorsBySlug.get(sourceAuthor.slug);
  if (!generatedAuthor) continue;

  for (const field of ['github', 'huggingFace']) {
    if (sourceAuthor[field] && generatedAuthor[field] !== sourceAuthor[field]) {
      fail(`Generated author ${sourceAuthor.slug} is missing ${field} from data/authors.json.`);
    }
  }
}

const distFiles = await scanFiles(distDir, (file) => file.endsWith('.html') || file.endsWith('.xml') || file.endsWith('.txt'));
for (const file of distFiles) {
  const content = await fs.readFile(file, 'utf8');
  if (content.includes(legacyLocalRoot)) {
    fail(`${path.relative(repoRoot, file)} contains a local absolute path.`);
  }
}

const htmlFiles = distFiles.filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const content = await fs.readFile(file, 'utf8');
  if (!content.includes(`src="${expectedUmamiScriptSrc}"`) || !content.includes(`data-website-id="${expectedUmamiWebsiteId}"`)) {
    fail(`${path.relative(repoRoot, file)} is missing the Umami analytics script.`);
  }
}

const sitemapXmlPath = path.join(distDir, 'sitemap.xml');
const sitemapShardPath = path.join(distDir, 'sitemap-0.xml');
const robotsTxtPath = path.join(distDir, 'robots.txt');
const authorsIndexPath = path.join(distDir, 'authors', 'index.html');

if (!(await exists(sitemapXmlPath))) {
  fail('dist/sitemap.xml is missing.');
}

if (!(await exists(sitemapShardPath))) {
  fail('dist/sitemap-0.xml is missing.');
}

if (!(await exists(robotsTxtPath))) {
  fail('dist/robots.txt is missing.');
}

if (data.authors.length > 0 && !(await exists(authorsIndexPath))) {
  fail('dist/authors/index.html is missing.');
}

for (const author of data.authors) {
  const authorPage = path.join(distDir, author.path.replace(/^\//, ''), 'index.html');
  if (!(await exists(authorPage))) {
    fail(`${path.relative(repoRoot, authorPage)} is missing.`);
  }
}

if ((await exists(sitemapXmlPath)) && (await exists(robotsTxtPath))) {
  const sitemapXml = await fs.readFile(sitemapXmlPath, 'utf8');
  const robotsTxt = await fs.readFile(robotsTxtPath, 'utf8');
  const sitemapUrl = new URL('/sitemap.xml', expectedSiteUrl).href;
  const sitemapShardUrl = new URL('/sitemap-0.xml', expectedSiteUrl).href;

  if (!robotsTxt.includes(`Sitemap: ${sitemapUrl}`)) {
    fail(`robots.txt must point to ${sitemapUrl}.`);
  }

  if (!sitemapXml.includes(sitemapShardUrl)) {
    fail(`sitemap.xml must include ${sitemapShardUrl}.`);
  }
}

if (process.exitCode) {
  process.exit();
}

console.log(`Site check passed for ${data.papers.length} papers.`);
