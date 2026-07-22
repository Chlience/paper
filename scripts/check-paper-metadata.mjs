import fs from 'node:fs/promises';
import process from 'node:process';
import { isPublicPaperMaintenanceExemption } from './content/markdown.mjs';
import { generatedFile, readMainlineEntries, readPaperEntries, readUtilityEntries } from './content/repository.mjs';

const maintenanceScanExemptFiles = new Set([
  'paper-analysis-workflow.md',
  'paper-note-template.md',
]);

const forbiddenPaperMaintenancePatterns = [
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
  /X\s*\/\s*GitHub/i,
  /逐人\s*X/,
  /逐作者档案/,
  /全量作者\s*profile/i,
  /全作者\s*X/,
  /全体作者\s*X/,
  /homepage\s*\/\s*GitHub\s*\/\s*Scholar/i,
];

const forbiddenSourceArtifactPatterns = [
  {
    pattern: /paper archive root/i,
    message: 'contains legacy paper archive root placeholder',
  },
  {
    pattern: /\/home\/chlience\/paper/,
    message: 'contains local absolute paper repository path',
  },
  {
    pattern: /\]\((?:\.{1,2}\/)?[^)\s#]+\.md(?::\d+)?(?:#[^)]+)?\)/i,
    message: 'contains local Markdown link target; use site paths such as /papers/<slug>/',
  },
];

const forbiddenAuthorBulletPatterns = [
  /\b(equal contribution|corresponding author|corresponding|first author|senior author|project lead|core contributor|maintainer|submitter|arXiv submitter|contact author|advisor|lead|profile|homepage|GitHub|Hugging Face|Google Scholar|DBLP|OpenReview|LinkedIn|email|Research Scientist|Assistant Professor|Principal Researcher|PhD student|Ph\.D\. student|Ph\.D\. candidate|internship|intern|bio|Twitter|cofounder|chief scientist|shared|already tracked|also appears|appears in|author line|researcher at|working on|work done|verified|records|lists|advisor|supervised)\b/i,
  /个人主页|主页|公开|邮箱|通讯|提交|脚注|贡献声明|研究方向|当前|后续|此前|更早|线索|证据|显示|说明|标注|标为|连接|重叠|博士|副教授|教授|研究员|学生|实习|导师|贡献|维护|组织作者|第一作者|通讯作者|提交者|搜索结果|标题页|加粗作者|本地已有档案|另署|作者组|注释|参与|负责|出现/,
];

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const getTopLevelField = (markdown, name) =>
  markdown.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';

const getSection = (markdown, heading) => {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return '';

  const collected = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break;
    collected.push(line);
  }
  return collected.join('\n').trim();
};

const authorBulletPattern = /^- (?:\[[^\]]+\]\([^)]+\)|[^:：`]{1,100})[:：]\s+(.+)$/;

const sourceEntries = [...(await readPaperEntries()), ...(await readMainlineEntries()), ...readUtilityEntries()];

for (const entry of sourceEntries) {
  const markdown = await fs.readFile(entry.sourcePath, 'utf8');
  for (const { pattern, message } of forbiddenSourceArtifactPatterns) {
    if (pattern.test(markdown)) {
      fail(`${entry.file} ${message}.`);
    }
  }

  for (const legacyField of ['Date', 'Archive-Time', 'Sort-Time']) {
    if (getTopLevelField(markdown, legacyField)) {
      fail(`${entry.file} still uses legacy top-level field ${legacyField}.`);
    }
  }

  if (!getTopLevelField(markdown, 'First-Archived-At')) {
    fail(`${entry.file} is missing First-Archived-At.`);
  }

  if (!getTopLevelField(markdown, 'Updated-At')) {
    fail(`${entry.file} is missing Updated-At.`);
  }

  if (!maintenanceScanExemptFiles.has(entry.fileName)) {
    const maintenanceScanMarkdown = markdown
      .split('\n')
      .filter((line) => !isPublicPaperMaintenanceExemption(line))
      .join('\n');
    for (const pattern of forbiddenPaperMaintenancePatterns) {
      if (pattern.test(maintenanceScanMarkdown)) {
        fail(`${entry.file} contains paper-maintenance text matching ${pattern}.`);
      }
    }

    const authorSection = getSection(markdown, '作者与关系');
    const authorLines = authorSection.split('\n');
    for (const [index, line] of authorLines.entries()) {
      const match = line.match(authorBulletPattern);
      if (!match) continue;

      for (const pattern of forbiddenAuthorBulletPatterns) {
        if (pattern.test(match[1])) {
          fail(`${entry.file}:${index + 1} author list bullet contains non-institution detail matching ${pattern}: ${line}`);
        }
      }
    }
  }
}

try {
  const data = JSON.parse(await fs.readFile(generatedFile, 'utf8'));
  for (const paper of data.papers ?? []) {
    if (!paper.firstArchivedAt) fail(`${paper.slug} is missing generated firstArchivedAt.`);
    if (!paper.updatedAt) fail(`${paper.slug} is missing generated updatedAt.`);
    for (const legacyKey of ['date', 'archiveTime', 'sortTime']) {
      if (Object.hasOwn(paper, legacyKey)) {
        fail(`${paper.slug} still exposes generated legacy key ${legacyKey}.`);
      }
    }
  }

  const trmIndex = data.papers.findIndex((paper) => paper.slug === '2512.23075-trust-region-masking-long-horizon-llm-rl');
  const ulyssesIndex = data.papers.findIndex((paper) => paper.slug === '2309.14509-deepspeed-ulysses-long-sequence-training');
  if (trmIndex === -1 || ulyssesIndex === -1 || trmIndex > ulyssesIndex) {
    fail('Expected TRM to sort before DeepSpeed Ulysses by first archived time.');
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

if (process.exitCode) {
  process.exit();
}

console.log('Paper metadata check passed.');
