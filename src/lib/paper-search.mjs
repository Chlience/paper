const normalize = (value = '') =>
  String(value)
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');

const compactText = (value = '', limit = 180) => {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
};

const getTerms = (query = '') => normalize(query).split(/\s+/).filter(Boolean);

const paperSearchItems = (papers = []) =>
  papers.map((paper) => {
    const tags = Array.isArray(paper.tags) ? paper.tags : [];
    const tagAliases = Array.isArray(paper.tagAliases) ? paper.tagAliases : [];
    const searchText = normalize(
      [
        paper.title,
        paper.coreSignal,
        paper.conclusion,
        paper.authors,
        paper.slug,
        paper.subjects,
        paper.currentVersion,
        ...tags,
        ...tagAliases,
      ]
        .filter(Boolean)
        .join(' '),
    );

    return {
      contentType: 'paper',
      typeLabel: '论文',
      title: paper.title ?? '',
      path: paper.path ?? '',
      firstArchivedAt: paper.firstArchivedAt ?? '',
      authors: paper.authors ?? '',
      coreSignal: compactText(paper.coreSignal ?? ''),
      tags,
      searchText,
    };
  });

const mainlineSearchItems = (mainlines = []) =>
  mainlines.map((mainline) => ({
    contentType: 'mainline',
    typeLabel: '主线',
    title: mainline.title ?? '',
    path: mainline.path ?? '',
    firstArchivedAt: mainline.firstArchivedAt ?? '',
    authors: '',
    coreSignal: compactText(mainline.coreSignal ?? mainline.currentJudgment ?? ''),
    tags: Array.isArray(mainline.classificationAxes) ? mainline.classificationAxes : [],
    searchText: normalize(
      [
        mainline.title,
        mainline.slug,
        mainline.researchQuestion,
        mainline.coreSignal,
        mainline.boundary,
        mainline.currentJudgment,
        ...(mainline.classificationAxes ?? []),
      ]
        .filter(Boolean)
        .join(' '),
    ),
  }));

export const buildPaperSearchItems = (papers = [], mainlines = []) => [
  ...paperSearchItems(papers),
  ...mainlineSearchItems(mainlines),
];

export const searchPaperItems = (items = [], query = '', limit = 12) => {
  const terms = getTerms(query);
  if (terms.length === 0) return [];

  const results = [];
  for (const item of items) {
    if (!terms.every((term) => item.searchText.includes(term))) continue;
    results.push(item);
    if (results.length >= limit) break;
  }

  return results;
};
