import fs from 'node:fs/promises';
import {
  authorProfileIsReferenced,
  collectAuthorReferences,
  formatAuthorDisplayName,
  normalizeAuthorKey,
  readAuthorProfiles,
  slugifyAuthor,
  splitAuthorNames,
} from './content/authors.mjs';
import {
  collectHeadings,
  excerpt,
  getFirstArchivedAt,
  getFirstHeading,
  getPinned,
  getSection,
  getSourceField,
  getSourceUrl,
  getUpdatedAt,
  renderMarkdown,
  stripPageChrome,
  stripPublicPaperMaintenance,
} from './content/markdown.mjs';
import { generatedDir, generatedFile, readPaperEntries, readUtilityEntries } from './content/repository.mjs';
import { tagsForPaper } from './content/tagging.mjs';

const buildPaperRecords = async (paperEntries) => {
  const papers = [];

  for (const entry of paperEntries) {
    const { file, fileName, slug, sourcePath } = entry;
    const raw = await fs.readFile(sourcePath, 'utf8');
    const title = getSourceField(raw, 'Title') || getFirstHeading(raw, slug);
    const oneSentence = getSection(raw, '一句话结论');
    const pageMarkdown = stripPublicPaperMaintenance(stripPageChrome(raw));
    const authors = getSourceField(raw, ['Authors', 'Author']) || 'Unknown';

    papers.push({
      slug,
      file,
      path: `/papers/${slug}/`,
      title,
      firstArchivedAt: getFirstArchivedAt(raw),
      updatedAt: getUpdatedAt(raw),
      pinned: getPinned(raw),
      sourceUrl: getSourceUrl(raw),
      authors,
      parsedAuthors: splitAuthorNames(authors),
      authorReferences: collectAuthorReferences(raw, authors),
      subjects: getSourceField(raw, 'Subjects'),
      currentVersion: getSourceField(raw, 'Current version read'),
      tags: tagsForPaper(slug, raw, fileName),
      summary: excerpt(oneSentence || getSection(raw, '论文脉络')),
      headings: collectHeadings(pageMarkdown),
      html: renderMarkdown(pageMarkdown),
    });
  }

  papers.sort((a, b) => {
    const pinnedCompare = Number(b.pinned) - Number(a.pinned);
    if (pinnedCompare) return pinnedCompare;
    const timeCompare = String(b.firstArchivedAt).localeCompare(String(a.firstArchivedAt));
    return timeCompare || b.slug.localeCompare(a.slug);
  });

  return papers;
};

const buildAuthorRecords = (papers, authorProfiles) => {
  const authorMentions = new Map();
  for (const paper of papers) {
    for (const name of paper.parsedAuthors) {
      const key = normalizeAuthorKey(name);
      if (!key) continue;
      const mention = authorMentions.get(key) ?? { name, paperSlugs: new Set() };
      mention.paperSlugs.add(paper.slug);
      authorMentions.set(key, mention);
    }
  }

  const authorRecordsByKey = new Map();
  const addAuthorRecord = (key, profile, mention) => {
    const name = profile?.name ?? mention?.name;
    const chineseName = profile?.chineseName ?? '';
    const slug = profile?.slug ?? slugifyAuthor(name);
    const aliasKeys = [name, ...(profile?.aliases ?? [])].filter(Boolean).map(normalizeAuthorKey);
    const paperSlugs = new Set();

    for (const aliasKey of aliasKeys) {
      for (const slugValue of authorMentions.get(aliasKey)?.paperSlugs ?? []) {
        paperSlugs.add(slugValue);
      }
    }
    for (const slugValue of mention?.paperSlugs ?? []) {
      paperSlugs.add(slugValue);
    }
    if (profile) {
      for (const paper of papers) {
        if (authorProfileIsReferenced(profile, paper.authorReferences)) paperSlugs.add(paper.slug);
      }
    }

    const paperList = papers
      .filter((paper) => paperSlugs.has(paper.slug))
      .map(({ slug: paperSlug, path: paperPath, title, firstArchivedAt, updatedAt, pinned, summary, tags }) => ({
        slug: paperSlug,
        path: paperPath,
        title,
        firstArchivedAt,
        updatedAt,
        pinned,
        summary,
        tags,
      }));

    const paperTopics = [...new Set(paperList.flatMap((paper) => paper.tags ?? []))];
    const profileTopics = profile?.topics ?? [];
    const record = {
      slug,
      path: `/authors/${slug}/`,
      name,
      chineseName,
      displayName: formatAuthorDisplayName(name, chineseName),
      aliases: profile?.aliases ?? [],
      affiliations: profile?.affiliations ?? [],
      homepage: profile?.homepage ?? '',
      github: profile?.github ?? '',
      huggingFace: profile?.huggingFace ?? '',
      x: profile?.x ?? '',
      xConfidence: profile?.xConfidence ?? '',
      topics: profileTopics.length > 0 ? profileTopics : paperTopics,
      notes: profile?.notes ?? '',
      sources: profile?.sources ?? [],
      profileStatus: profile ? 'tracked' : 'recurring',
      paperCount: paperList.length,
      papers: paperList,
    };

    for (const aliasKey of aliasKeys) {
      if (aliasKey) authorRecordsByKey.set(aliasKey, record);
    }
    if (key) authorRecordsByKey.set(key, record);
  };

  for (const profile of authorProfiles) {
    const key = normalizeAuthorKey(profile.name);
    addAuthorRecord(key, profile, authorMentions.get(key));
  }

  for (const [key, mention] of authorMentions) {
    if (authorRecordsByKey.has(key) || mention.paperSlugs.size < 2) continue;
    addAuthorRecord(key, null, mention);
  }

  const authors = [...new Map([...authorRecordsByKey.values()].map((author) => [author.slug, author])).values()].map((author) => {
    const coauthorsByKey = new Map();
    const ownKeys = [author.name, ...(author.aliases ?? [])].map(normalizeAuthorKey);

    for (const paper of papers) {
      if (!paper.parsedAuthors.some((name) => ownKeys.includes(normalizeAuthorKey(name)))) continue;
      for (const coauthorName of paper.parsedAuthors) {
        const key = normalizeAuthorKey(coauthorName);
        if (!key || ownKeys.includes(key)) continue;
        const linked = authorRecordsByKey.get(key);
        coauthorsByKey.set(key, {
          name: linked?.displayName ?? coauthorName,
          path: linked?.path ?? '',
        });
      }
    }

    return {
      ...author,
      coauthors: [...coauthorsByKey.values()]
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 24),
    };
  });

  authors.sort((a, b) => {
    const statusCompare = a.profileStatus === b.profileStatus ? 0 : a.profileStatus === 'tracked' ? -1 : 1;
    return statusCompare || b.paperCount - a.paperCount || a.name.localeCompare(b.name);
  });

  return { authors, authorRecordsByKey };
};

const attachPaperAuthorEntries = (papers, authorRecordsByKey) => {
  for (const paper of papers) {
    paper.authorEntries = paper.parsedAuthors.map((name) => {
      const author = authorRecordsByKey.get(normalizeAuthorKey(name));
      return author
        ? { name: author.displayName, path: author.path, slug: author.slug, profileStatus: author.profileStatus }
        : { name };
    });
    delete paper.parsedAuthors;
    delete paper.authorReferences;
  }
};

const buildUtilityRecords = async () => {
  const utilities = [];
  for (const meta of readUtilityEntries()) {
    const raw = await fs.readFile(meta.sourcePath, 'utf8');
    const pageMarkdown = stripPageChrome(raw);
    utilities.push({
      ...meta,
      firstArchivedAt: getFirstArchivedAt(raw),
      updatedAt: getUpdatedAt(raw),
      summary: excerpt(raw, 180),
      headings: collectHeadings(pageMarkdown),
      html: renderMarkdown(pageMarkdown),
    });
  }
  return utilities;
};

const build = async () => {
  const paperEntries = await readPaperEntries();
  const authorProfiles = await readAuthorProfiles();

  const papers = await buildPaperRecords(paperEntries);
  const { authors, authorRecordsByKey } = buildAuthorRecords(papers, authorProfiles);
  attachPaperAuthorEntries(papers, authorRecordsByKey);

  const utilities = await buildUtilityRecords();
  const tags = [...new Set(papers.flatMap((paper) => paper.tags))].sort();
  const data = {
    generatedAt: new Date().toISOString(),
    site: {
      title: 'Chlience Paper Archive',
      description: 'LLM, RL, systems, safety, theory paper reading notes with author and cross-paper relationships.',
      url: 'https://papers.chlience.com',
    },
    papers,
    authors,
    utilities,
    tags,
  };

  await fs.mkdir(generatedDir, { recursive: true });
  await fs.writeFile(generatedFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Generated ${papers.length} paper pages, ${authors.length} author pages, and ${utilities.length} utility pages.`);
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
