const namedEntities = new Map([
  ['auml', 'ä'],
  ['alpha', 'α'],
  ['amp', '&'],
  ['apos', "'"],
  ['cacute', 'ć'],
  ['copy', '©'],
  ['eacute', 'é'],
  ['epsilon', 'ε'],
  ['frasl', '⁄'],
  ['gt', '>'],
  ['hellip', '…'],
  ['infin', '∞'],
  ['isin', '∈'],
  ['ldquo', '“'],
  ['le', '≤'],
  ['lsquo', '‘'],
  ['lt', '<'],
  ['mdash', '—'],
  ['middot', '·'],
  ['nbsp', ' '],
  ['ndash', '–'],
  ['ograve', 'ò'],
  ['ouml', 'ö'],
  ['quot', '"'],
  ['rarr', '→'],
  ['rdquo', '”'],
  ['rsquo', '’'],
  ['sigma', 'σ'],
  ['times', '×'],
  ['uuml', 'ü'],
]);

const decodeEntity = (entity, key) => {
  const normalized = key.toLocaleLowerCase();
  if (!normalized.startsWith('#')) return namedEntities.get(normalized) ?? entity;

  const codePoint = normalized.startsWith('#x')
    ? Number.parseInt(normalized.slice(2), 16)
    : Number.parseInt(normalized.slice(1), 10);
  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return entity;
  return String.fromCodePoint(codePoint);
};

export const decodeHtml = (value = '') => {
  let decoded = String(value);
  for (let round = 0; round < 3; round += 1) {
    const next = decoded.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, decodeEntity);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
};
