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
  const phrase = normalize(query);
  const score = (item) => {
    const title = normalize(item.title);
    const authors = normalize(item.authors).split(/\s*[,，;；]\s*/);
    if (title === phrase) return 100;
    if (authors.includes(phrase)) return 90;
    if (title.startsWith(phrase)) return 80;
    if (title.includes(phrase)) return 70;
    if (terms.every((term) => title.includes(term))) return 60;
    if ((item.tags ?? []).some((tag) => normalize(tag) === phrase)) return 50;
    return 0;
  };
  return items
    .filter((item) => terms.every((term) => item.searchText.includes(term)))
    .map((item, index) => ({ item, index, score: score(item) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, Math.max(0, limit))
    .map(({ item }) => item);
};
