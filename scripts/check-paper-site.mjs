import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { comparePapersForReviewFilter } from '../src/lib/paper-review.mjs';
import { REQUIRED_SECTION_GROUPS } from './content/paper-workflow.mjs';
import { authorsFile, generatedFile, repoRoot } from './content/repository.mjs';

const distDir = path.join(repoRoot, 'dist');
const legacyLocalRoot = ['', 'home', 'chlience', 'paper'].join('/');
const expectedSiteUrl = process.env.PUBLIC_SITE_URL ?? 'https://papers.chlience.com';
const expectedUmamiScriptSrc = 'https://umami.chlience.com/script.js';
const expectedUmamiWebsiteId = 'adb2da68-eff5-4878-9124-14cbde61f171';

const forbiddenPublicPaperPatterns = [
  /关系判断/,
  /作者\s*profile\s*pass/i,
  /Author\s+profile\s+pass/i,
  /作者页决策/,
  /Grok broad/i,
  /Grok CLI/i,
  /SuperGrok/i,
  /xConfidence/,
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
const mainlineDataPath = path.join(repoRoot, 'src', 'generated', 'mainline-data.json');
const mainlineData = JSON.parse(await fs.readFile(mainlineDataPath, 'utf8'));

if (!Array.isArray(data.papers) || data.papers.length === 0) {
  fail('No generated paper pages found.');
}

if (!Array.isArray(data.authors)) {
  fail('No generated author pages found.');
}

const paperSlugs = new Set((data.papers ?? []).map((paper) => paper.slug));
const paperReviewStatuses = new Set(['pending', 'needs-review', 'approved']);
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
  for (const group of REQUIRED_SECTION_GROUPS) {
    if (!group.headings.some((heading) => source.includes(`## ${heading}`))) {
      fail(`${paper.file} is missing required section group: ${group.name}`);
    }
  }

  if (paper.html.includes(legacyLocalRoot)) {
    fail(`${paper.file} generated HTML still contains a local absolute path.`);
  }

  if (paper.sourceUrl && !/^https?:\/\//i.test(paper.sourceUrl)) {
    fail(`${paper.file} generated sourceUrl must be an absolute URL: ${paper.sourceUrl}`);
  }

  if (!paperReviewStatuses.has(paper.reviewStatus)) {
    fail(`${paper.file} has an invalid generated reviewStatus: ${paper.reviewStatus}`);
  }

  if (!paper.coreSignal || !paper.conclusion || !paper.conclusionHtml) {
    fail(`${paper.file} must generate coreSignal, conclusion, and conclusionHtml.`);
  }

  if (paper.html.includes('id="一句话结论"')) {
    fail(`${paper.file} repeats the conclusion section below the detail-page deck.`);
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
const homeIndexPath = path.join(distDir, 'index.html');
const authorsIndexPath = path.join(distDir, 'authors', 'index.html');
const papersIndexPath = path.join(distDir, 'papers', 'index.html');
const topicsIndexPath = path.join(distDir, 'topics', 'index.html');
const mainlinesIndexPath = path.join(distDir, 'mainlines', 'index.html');
const paperSearchIndexPath = path.join(distDir, 'paper-search.json');

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

if (!(await exists(topicsIndexPath))) {
  fail('dist/topics/index.html is missing.');
} else {
  const topicsHtml = await fs.readFile(topicsIndexPath, 'utf8');
  for (const route of data.tagRoutes ?? []) {
    if (!topicsHtml.includes(`id="tag-${route.id}"`)) {
      fail(`dist/topics/index.html is missing topic anchor: tag-${route.id}.`);
    }
  }
}

if (!(await exists(paperSearchIndexPath))) {
  fail('dist/paper-search.json is missing.');
} else {
  const searchItems = JSON.parse(await fs.readFile(paperSearchIndexPath, 'utf8'));
  if (!Array.isArray(searchItems) || searchItems.length !== data.papers.length) {
    fail('dist/paper-search.json does not match the generated paper inventory.');
  }
}

if (!(await exists(homeIndexPath))) {
  fail('dist/index.html is missing.');
} else {
  const homeHtml = await fs.readFile(homeIndexPath, 'utf8');
  const expectedHomePapers = data.papers
    .filter((paper) => paper.reviewStatus === 'approved')
    .sort((left, right) => comparePapersForReviewFilter(left, right, 'approved'))
    .slice(0, 8);
  const renderedReviewStatuses = [...homeHtml.matchAll(/data-paper-review-status="([^"]+)"/g)].map(
    (match) => match[1],
  );

  if (
    renderedReviewStatuses.length !== expectedHomePapers.length ||
    renderedReviewStatuses.some((status) => status !== 'approved')
  ) {
    fail('dist/index.html must list only the latest approved papers.');
  }
  for (const paper of expectedHomePapers) {
    if (!homeHtml.includes(`href="${paper.path}"`)) {
      fail(`dist/index.html is missing the reviewed homepage paper: ${paper.slug}.`);
    }
  }

  const pendingCount = data.papers.filter((paper) => paper.reviewStatus === 'pending').length;
  if (pendingCount > 0 && !homeHtml.includes('href="/papers/?review=pending"')) {
    fail('dist/index.html is missing the pending review queue link.');
  }
  if (!homeHtml.includes('href="/papers/?review=approved"')) {
    fail('dist/index.html is missing the approved paper archive link.');
  }
  for (const marker of [
    'class="site-footer-main"',
    'class="site-footer-colophon"',
    'aria-label="档案入口"',
    `>${data.papers.length} notes<`,
    `>${data.authors.length} authors<`,
    'href="/workflow/"',
    'href="https://chlience.com"',
  ]) {
    if (!homeHtml.includes(marker)) {
      fail(`dist/index.html is missing the polished footer marker: ${marker}`);
    }
  }
}

for (const file of htmlFiles) {
  const content = await fs.readFile(file, 'utf8');
  if (content.includes('id="paper-search-data"')) {
    fail(`${path.relative(repoRoot, file)} still embeds the full paper search index.`);
  }
}

if (!Array.isArray(mainlineData.lines) || mainlineData.lines.length === 0) {
  fail('No generated research mainlines found.');
}

if (!(await exists(mainlinesIndexPath))) {
  fail('dist/mainlines/index.html is missing.');
} else {
  const mainlinesHtml = await fs.readFile(mainlinesIndexPath, 'utf8');
  if (/data-mainline-(?:filters|search|select|role|row|clear)/.test(mainlinesHtml)) {
    fail('dist/mainlines/index.html still contains local search or filter controls.');
  }
  for (const line of mainlineData.lines ?? []) {
    if (!mainlinesHtml.includes(`/mainlines/${line.id}/`)) {
      fail(`dist/mainlines/index.html is missing the ${line.id} directory link.`);
    }
  }
}

for (const line of mainlineData.lines ?? []) {
  const detailPath = path.join(distDir, 'mainlines', line.id, 'index.html');
  if (!(await exists(detailPath))) {
    fail(`${path.relative(repoRoot, detailPath)} is missing.`);
    continue;
  }

  const html = await fs.readFile(detailPath, 'utf8');
  const expectedMethodIds = [...new Set((line.methods ?? []).map((method) => method.id))].sort();
  const tableMethodIds = [...html.matchAll(/<tr\s+id="method-([^"]+)"/g)].map((match) => match[1]).sort();
  if (JSON.stringify(tableMethodIds) !== JSON.stringify(expectedMethodIds)) {
    fail(`${path.relative(repoRoot, detailPath)} method table does not match generated method IDs.`);
  }

  const graphMethodIds = [...html.matchAll(new RegExp(`\\bid="graph-method-${line.id}-([^"]+)"`, 'g'))]
    .map((match) => match[1])
    .sort();
  const expectedGraphIds = line.status === 'formal' ? expectedMethodIds : [];
  if (JSON.stringify(graphMethodIds) !== JSON.stringify(expectedGraphIds)) {
    fail(`${path.relative(repoRoot, detailPath)} graph and method table do not share the same method IDs.`);
  }

  const generatedRelationIds = [...new Set((line.relations ?? []).map((relation) => relation.id))].sort();
  const expectedGraphRelationIds = line.status === 'formal' ? generatedRelationIds : [];
  const graphRelationIds = [...html.matchAll(/\bid="graph-relation-([^"]+)"/g)]
    .map((match) => match[1])
    .sort();
  const tableRelationIds = [...html.matchAll(/\bdata-relation-id="([^"]+)"/g)]
    .map((match) => match[1])
    .sort();
  if (JSON.stringify(graphRelationIds) !== JSON.stringify(expectedGraphRelationIds)) {
    fail(`${path.relative(repoRoot, detailPath)} graph does not match generated relation IDs.`);
  }
  if (JSON.stringify(tableRelationIds) !== JSON.stringify(generatedRelationIds)) {
    fail(`${path.relative(repoRoot, detailPath)} method table does not match generated relation IDs.`);
  }

  if (/@viz-js\/viz|viz-js|WebAssembly|Viz\s*\(/i.test(html)) {
    fail(`${path.relative(repoRoot, detailPath)} contains a client-side graph runtime.`);
  }
}

if (await exists(papersIndexPath)) {
  const papersHtml = await fs.readFile(papersIndexPath, 'utf8');
  if (papersHtml.includes('id="tag-')) {
    fail('dist/papers/index.html still contains topic route sections.');
  }
  for (const reviewStatus of ['all', ...paperReviewStatuses]) {
    if (!papersHtml.includes(`data-paper-review-filter="${reviewStatus}"`)) {
      fail(`dist/papers/index.html is missing the ${reviewStatus} review filter.`);
    }
  }
  if (!papersHtml.includes('data-paper-review-status="pending"')) {
    fail('dist/papers/index.html is missing paper review status metadata.');
  }
  for (const attribute of [
    'data-paper-first-archived-at=',
    'data-paper-updated-at=',
    'data-paper-reviewed-at=',
    'data-paper-date-field=',
  ]) {
    if (!papersHtml.includes(attribute)) {
      fail(`dist/papers/index.html is missing contextual review sorting metadata: ${attribute}`);
    }
  }
}

for (const author of data.authors) {
  const authorPage = path.join(distDir, author.path.replace(/^\//, ''), 'index.html');
  if (!(await exists(authorPage))) {
    fail(`${path.relative(repoRoot, authorPage)} is missing.`);
  }
}

if ((await exists(sitemapXmlPath)) && (await exists(robotsTxtPath))) {
  const sitemapXml = await fs.readFile(sitemapXmlPath, 'utf8');
  const sitemapShard = await fs.readFile(sitemapShardPath, 'utf8');
  const robotsTxt = await fs.readFile(robotsTxtPath, 'utf8');
  const sitemapUrl = new URL('/sitemap.xml', expectedSiteUrl).href;
  const sitemapShardUrl = new URL('/sitemap-0.xml', expectedSiteUrl).href;
  const topicsUrl = new URL('/topics/', expectedSiteUrl).href;

  if (!robotsTxt.includes(`Sitemap: ${sitemapUrl}`)) {
    fail(`robots.txt must point to ${sitemapUrl}.`);
  }

  if (!sitemapXml.includes(sitemapShardUrl)) {
    fail(`sitemap.xml must include ${sitemapShardUrl}.`);
  }

  if (!sitemapShard.includes(topicsUrl)) {
    fail(`sitemap-0.xml must include ${topicsUrl}.`);
  }

  for (const line of mainlineData.lines ?? []) {
    const lineUrl = new URL(`/mainlines/${line.id}/`, expectedSiteUrl).href;
    if (!sitemapShard.includes(lineUrl)) {
      fail(`sitemap-0.xml must include ${lineUrl}.`);
    }
  }
}

if (process.exitCode) {
  process.exit();
}

console.log(`Site check passed for ${data.papers.length} papers.`);
