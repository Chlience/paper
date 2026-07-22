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
  getSourceFieldRaw,
  getSourceUrl,
  getTopLevelField,
  getUpdatedAt,
  renderMarkdown,
  stripMarkdown,
  stripPageChrome,
  stripPublicPaperMaintenance,
  stripPublicUtilityMaintenance,
  stripSection,
} from './content/markdown.mjs';
import { generatedDir, generatedFile, readPaperEntries, readUtilityEntries } from './content/repository.mjs';
import { parseArchiveCoreSignals } from './content/paper-workflow.mjs';
import {
  tagDefinitions as controlledTagDefinitions,
  tagFacets as controlledTagFacets,
  tagsForPaper,
} from './content/tagging.mjs';
import { normalizePaperReviewStatus } from '../src/lib/paper-review.mjs';

const parseSearchWindow = (value = '') => {
  const dates = String(value).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
  if (dates.length < 2) return null;

  const start = dates[0];
  const end = dates.at(-1);
  const startMonth = start.slice(0, 7).replace('-', '.');
  const endMonth = end.slice(0, 7).replace('-', '.');
  const cutoff = String(value).match(/(?:至|\bto\b)\s*(.+)$/i)?.[1]?.trim() ?? end;

  return {
    start,
    end,
    startMonth,
    endMonth,
    label: startMonth === endMonth ? startMonth : `${startMonth} → ${endMonth}`,
    cutoff,
  };
};

const getSourceScalar = (markdown, names) => getSourceFieldRaw(markdown, names).trim();

const getSourceHref = (markdown, names) => {
  const value = getSourceScalar(markdown, names);
  return value.match(/\[[^\]]+\]\(([^)]+)\)/)?.[1] ?? value;
};

const buildCompositePageMarkdown = (markdown) => {
  const source = getSection(markdown, 'Source');
  const narrativeStart = source.search(/^###\s+/m);
  const sourceNarrative =
    narrativeStart >= 0 ? source.slice(narrativeStart).replace(/^###\s+/, '## ') : '';
  const hiddenSections = ['Source', '作者与关系', 'OpenReview / 审稿意见吸收', 'Reference Intake Brief'];
  const publicBody = hiddenSections.reduce((body, heading) => stripSection(body, heading), markdown);
  return [sourceNarrative, publicBody].filter(Boolean).join('\n\n');
};

const buildPaperRecords = async (paperEntries, coreSignals) => {
  const papers = [];

  for (const entry of paperEntries) {
    const { file, slug, sourcePath } = entry;
    const raw = await fs.readFile(sourcePath, 'utf8');
    const title = getSourceField(raw, 'Title') || getFirstHeading(raw, slug);
    const conclusionMarkdown = getSection(raw, '一句话结论');
    const materialType = getSourceScalar(raw, 'Material type');
    const searchWindow = getSourceScalar(raw, 'Search window');
    const archivedBody = stripSection(stripPublicPaperMaintenance(stripPageChrome(raw)), '一句话结论');
    const pageMarkdown = materialType === 'composite' ? buildCompositePageMarkdown(archivedBody) : archivedBody;
    const authors = getSourceField(raw, ['Authors', 'Author']) || 'Unknown';
    const assignedTags = tagsForPaper(slug);
    const coreSignal = stripMarkdown(coreSignals.get(slug) ?? '');

    papers.push({
      slug,
      file,
      path: `/papers/${slug}/`,
      title,
      firstArchivedAt: getFirstArchivedAt(raw),
      updatedAt: getUpdatedAt(raw),
      reviewStatus: normalizePaperReviewStatus(getTopLevelField(raw, 'Review-Status')),
      reviewedAt: getTopLevelField(raw, 'Reviewed-At'),
      pinned: getPinned(raw),
      sourceUrl: getSourceUrl(raw),
      canonicalSource: getSourceHref(raw, 'Canonical source'),
      materialType,
      responsibleOrganization: getSourceScalar(raw, 'Responsible organization'),
      searchWindow: parseSearchWindow(searchWindow),
      authors,
      parsedAuthors: splitAuthorNames(authors),
      authorReferences: collectAuthorReferences(raw, authors),
      subjects: getSourceField(raw, 'Subjects'),
      currentVersion: getSourceField(raw, 'Current version read'),
      tags: assignedTags.map((tag) => tag.label),
      tagIds: assignedTags.map((tag) => tag.id),
      tagAliases: [...new Set(assignedTags.flatMap((tag) => tag.aliases))],
      primaryTag: assignedTags[0].label,
      primaryTagId: assignedTags[0].id,
      coreSignal,
      conclusion: stripMarkdown(conclusionMarkdown),
      conclusionHtml: renderMarkdown(conclusionMarkdown),
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
  const authorRecordsBySlug = new Map();
  const authorIdentityKeysBySlug = new Map();
  const explicitIdentityKeys = new Set(
    authorProfiles
      .filter((profile) => profile.matchByName === false)
      .flatMap((profile) => [profile.name, ...(profile.aliases ?? [])])
      .map(normalizeAuthorKey)
      .filter(Boolean),
  );
  const addAuthorRecord = (key, profile, mention) => {
    const name = profile?.name ?? mention?.name;
    const chineseName = profile?.chineseName ?? '';
    const slug = profile?.slug ?? slugifyAuthor(name);
    const aliasKeys = [name, ...(profile?.aliases ?? [])].filter(Boolean).map(normalizeAuthorKey);
    const matchByName = profile?.matchByName !== false;
    const paperSlugs = new Set();

    if (matchByName) {
      for (const aliasKey of aliasKeys) {
        for (const slugValue of authorMentions.get(aliasKey)?.paperSlugs ?? []) {
          paperSlugs.add(slugValue);
        }
      }
      for (const slugValue of mention?.paperSlugs ?? []) {
        paperSlugs.add(slugValue);
      }
    }
    if (profile) {
      for (const paper of papers) {
        const isReferenced = authorProfileIsReferenced(profile, paper.authorReferences);
        if (isReferenced) paperSlugs.add(paper.slug);
      }
    }

    const paperList = papers
      .filter((paper) => paperSlugs.has(paper.slug))
      .map(({ slug: paperSlug, path: paperPath, title, firstArchivedAt, updatedAt, pinned, coreSignal, tags }) => ({
        slug: paperSlug,
        path: paperPath,
        title,
        firstArchivedAt,
        updatedAt,
        pinned,
        coreSignal,
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

    authorRecordsBySlug.set(slug, record);
    authorIdentityKeysBySlug.set(slug, new Set(aliasKeys));
    if (matchByName) {
      for (const aliasKey of aliasKeys) {
        if (aliasKey) authorRecordsByKey.set(aliasKey, record);
      }
      if (key) authorRecordsByKey.set(key, record);
    }
  };

  for (const profile of authorProfiles) {
    const key = normalizeAuthorKey(profile.name);
    addAuthorRecord(key, profile, authorMentions.get(key));
  }

  for (const [key, mention] of authorMentions) {
    if (authorRecordsByKey.has(key) || explicitIdentityKeys.has(key) || mention.paperSlugs.size < 2) continue;
    addAuthorRecord(key, null, mention);
  }

  const resolveAuthorRecord = (paper, name) => {
    const key = normalizeAuthorKey(name);
    for (const [slug, linkKeys] of paper.authorReferences.authorLinkKeysBySlug) {
      if (linkKeys.has(key) && authorIdentityKeysBySlug.get(slug)?.has(key)) {
        return authorRecordsBySlug.get(slug);
      }
    }
    return authorRecordsByKey.get(key);
  };

  const authors = [...authorRecordsBySlug.values()].map((author) => {
    const coauthorsByKey = new Map();
    const ownKeys = [author.name, ...(author.aliases ?? [])].map(normalizeAuthorKey);
    const paperSlugs = new Set(author.papers.map((paper) => paper.slug));

    for (const paper of papers) {
      const isPaperAuthor = paper.parsedAuthors.some((name) => ownKeys.includes(normalizeAuthorKey(name)));
      if (!paperSlugs.has(paper.slug) || !isPaperAuthor) continue;
      for (const coauthorName of paper.parsedAuthors) {
        const key = normalizeAuthorKey(coauthorName);
        if (!key || ownKeys.includes(key)) continue;
        const linked = resolveAuthorRecord(paper, coauthorName);
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

  return { authors, authorRecordsByKey, authorRecordsBySlug, authorIdentityKeysBySlug };
};

const attachPaperAuthorEntries = (papers, authorRecordsByKey, authorRecordsBySlug, authorIdentityKeysBySlug) => {
  for (const paper of papers) {
    paper.authorEntries = paper.parsedAuthors.map((name) => {
      const key = normalizeAuthorKey(name);
      let author;
      for (const [slug, linkKeys] of paper.authorReferences.authorLinkKeysBySlug) {
        if (linkKeys.has(key) && authorIdentityKeysBySlug.get(slug)?.has(key)) {
          author = authorRecordsBySlug.get(slug);
          break;
        }
      }
      author ??= authorRecordsByKey.get(key);
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
    const pageMarkdown = stripPublicUtilityMaintenance(stripPageChrome(raw));
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
  const archiveIndexEntry = readUtilityEntries().find((entry) => entry.fileName === 'papers-index.md');
  const archiveIndexMarkdown = await fs.readFile(archiveIndexEntry.sourcePath, 'utf8');
  const coreSignals = parseArchiveCoreSignals(archiveIndexMarkdown);

  const papers = await buildPaperRecords(paperEntries, coreSignals);
  const { authors, authorRecordsByKey, authorRecordsBySlug, authorIdentityKeysBySlug } = buildAuthorRecords(
    papers,
    authorProfiles,
  );
  attachPaperAuthorEntries(papers, authorRecordsByKey, authorRecordsBySlug, authorIdentityKeysBySlug);

  const utilities = await buildUtilityRecords();
  const tagRoutes = controlledTagDefinitions
    .map((tag) => ({
      ...tag,
      count: papers.filter((paper) => paper.tagIds.includes(tag.id)).length,
    }))
    .filter((tag) => tag.count > 0);
  const tagFacets = controlledTagFacets.map((facet) => {
    const routeIds = new Set(tagRoutes.filter((tag) => tag.facetId === facet.id).map((tag) => tag.id));
    return {
      ...facet,
      routeCount: routeIds.size,
      paperCount: papers.filter((paper) => paper.tagIds.some((tagId) => routeIds.has(tagId))).length,
    };
  });
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
    tagRoutes,
    tagFacets,
  };

  await fs.mkdir(generatedDir, { recursive: true });
  await fs.writeFile(generatedFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Generated ${papers.length} paper pages, ${authors.length} author pages, and ${utilities.length} utility pages.`);
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
