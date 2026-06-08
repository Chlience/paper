import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const generatedFile = path.join(repoRoot, 'src/generated/paper-data.json');
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
  { name: '局限', headings: ['## 局限', '## 局限与待验证问题'] },
  { name: 'Reference Intake Brief', headings: ['## Reference Intake Brief'] },
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

if (!Array.isArray(data.papers) || data.papers.length === 0) {
  fail('No generated paper pages found.');
}

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
}

for (const utility of data.utilities) {
  if (utility.html.includes(legacyLocalRoot)) {
    fail(`${utility.file} generated HTML still contains a local absolute path.`);
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

if (!(await exists(sitemapXmlPath))) {
  fail('dist/sitemap.xml is missing.');
}

if (!(await exists(sitemapShardPath))) {
  fail('dist/sitemap-0.xml is missing.');
}

if (!(await exists(robotsTxtPath))) {
  fail('dist/robots.txt is missing.');
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
