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

export const buildPaperSearchItems = (papers = []) =>
  papers.map((paper) => {
    const tags = Array.isArray(paper.tags) ? paper.tags : [];
    const searchText = normalize(
      [
        paper.title,
        paper.summary,
        paper.authors,
        paper.slug,
        paper.subjects,
        paper.currentVersion,
        ...tags,
      ]
        .filter(Boolean)
        .join(' '),
    );

    return {
      title: paper.title ?? '',
      path: paper.path ?? '',
      firstArchivedAt: paper.firstArchivedAt ?? '',
      authors: paper.authors ?? '',
      summary: compactText(paper.summary ?? ''),
      tags,
      searchText,
    };
  });

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
