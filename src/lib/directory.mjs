export const matchesDirectoryQuery = (text = '', query = '') => {
  const haystack = String(text).toLocaleLowerCase();
  return String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
    .every((term) => haystack.includes(term));
};

export const paginateDirectory = (items, requestedPage = 1, pageSize = 24) => {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const parsed = Number(requestedPage);
  const page = Math.min(pageCount, Math.max(1, Number.isFinite(parsed) ? Math.floor(parsed) : 1));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageCount,
    total: items.length,
  };
};
