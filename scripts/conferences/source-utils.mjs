import { decodeHtml } from './html-entities.mjs';

export { decodeHtml };

export const stripHtml = (value = '') =>
  decodeHtml(
    String(value)
      .replace(/<br\s*\/?\s*>/gi, ' ')
      .replace(/<\/p\s*>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();

export const absoluteUrl = (value = '', baseUrl) => {
  if (!value) return '';
  try {
    return new URL(decodeHtml(value), baseUrl).href;
  } catch {
    return '';
  }
};

export const parseCsv = (text = '') => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
};

export const csvRecords = (text, requiredHeader) => {
  const rows = parseCsv(text);
  const headerIndex = rows.findIndex((row) => row.some((value) => value.trim() === requiredHeader));
  if (headerIndex < 0) throw new Error(`CSV header not found: ${requiredHeader}`);
  const headers = rows[headerIndex].map((value) => value.replace(/\s+/g, ' ').trim());
  return rows.slice(headerIndex + 1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ''])),
  );
};

export const parseAclAnthologyMods = (xml = '') => {
  const papers = [];
  const recordPattern = /<mods\s+ID="([^"]+)"[^>]*>([\s\S]*?)<\/mods>/gi;
  for (const match of String(xml).matchAll(recordPattern)) {
    const body = match[2];
    const paperUrl = stripHtml(body.match(/<location>[\s\S]*?<url>([\s\S]*?)<\/url>[\s\S]*?<\/location>/i)?.[1] ?? '');
    if (!/\/2026\.acl-long\.\d+\/$/.test(paperUrl) || /\.0\/$/.test(paperUrl)) continue;
    const title = stripHtml(body.match(/<titleInfo[^>]*>[\s\S]*?<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    const authors = [];
    for (const nameMatch of body.matchAll(/<name\s+type="personal"[^>]*>([\s\S]*?)<\/name>/gi)) {
      const nameBody = nameMatch[1];
      if (!/<roleTerm[^>]*>author<\/roleTerm>/i.test(nameBody)) continue;
      const given = [...nameBody.matchAll(/<namePart\s+type="given">([\s\S]*?)<\/namePart>/gi)].map((part) =>
        stripHtml(part[1]),
      );
      const family = stripHtml(nameBody.match(/<namePart\s+type="family">([\s\S]*?)<\/namePart>/i)?.[1] ?? '');
      const name = [...given, family].filter(Boolean).join(' ').trim();
      if (name) authors.push(name);
    }
    if (!title || authors.length === 0) continue;
    const officialId = paperUrl.match(/\/(2026\.acl-long\.\d+)\/$/)?.[1] ?? match[1];
    papers.push({
      officialId,
      title,
      authors,
      paperUrl,
      pdfUrl: `${paperUrl.replace(/\/$/, '')}.pdf`,
    });
  }
  return papers;
};

export const parseCvfOpenAccess = (html = '', sourceUrl) => {
  const papers = [];
  const recordPattern = /<dt\s+class="ptitle"[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/dt>\s*<dd>([\s\S]*?)<\/dd>/gi;
  for (const match of String(html).matchAll(recordPattern)) {
    const paperUrl = absoluteUrl(match[1], sourceUrl);
    const authors = [...match[3].matchAll(/name="query_author"\s+value="([^"]+)"/gi)].map((author) =>
      decodeHtml(author[1]).trim(),
    );
    const pathName = new URL(paperUrl).pathname;
    papers.push({
      officialId: pathName.split('/').at(-1)?.replace(/_paper\.html$/i, '') ?? '',
      title: stripHtml(match[2]),
      authors,
      paperUrl,
      pdfUrl: paperUrl.replace('/html/', '/papers/').replace(/_paper\.html$/i, '_paper.pdf'),
    });
  }
  return papers;
};

const authorsWithoutAffiliations = (html = '') => {
  const withoutAffiliations = String(html).replace(/<em\b[^>]*>[\s\S]*?<\/em>/gi, ' ');
  return stripHtml(withoutAffiliations)
    .replace(/;+/g, ',')
    .split(/\s*(?:,\s*(?:and\s+)?|\s+and\s+)\s*/i)
    .map((author) => author.trim())
    .filter(Boolean);
};

export const cleanUsenixAbstract = (value = '') => {
  const text = stripHtml(value);
  const availablePreamble = /^This paper is currently under embargo,\s*but the paper abstract is available now\.\s*The final paper PDF will be available on the first day of the conference\.\s*/i;
  if (availablePreamble.test(text)) {
    return { abstract: text.replace(availablePreamble, '').trim(), abstractStatus: '' };
  }
  if (/The final paper PDF and abstract will be available/i.test(text)) {
    return { abstract: '', abstractStatus: 'embargoed' };
  }
  return { abstract: text, abstractStatus: '' };
};

export const parseAsplosProgram = (html = '', sourceUrl) => {
  const papers = [];
  const paperPattern = /<div\s+class="paper">\s*<div\s+class="paper-title">([\s\S]*?)<\/div>\s*<div\s+class="paper-authors">([\s\S]*?)<\/div>/gi;
  for (const match of String(html).matchAll(paperPattern)) {
    const title = stripHtml(match[1]);
    const authorText = stripHtml(match[2]);
    const authors = [...authorText.matchAll(/(?:^|,\s*)([^(),]+?)\s*\([^)]*\)/g)].map((author) =>
      author[1].trim(),
    );
    if (!title) continue;
    papers.push({
      title,
      authors,
      trackRaw: 'Full Research Paper',
      presentationTypeRaw: 'Oral',
      sourceUrl,
      paperUrl: sourceUrl,
    });
  }
  return papers;
};

export const parseUsenixProgram = (html = '', sourceUrl) => {
  const papers = [];
  const articlePattern = /<article\s+id="(node-\d+)"\s+class="node node-paper view-mode-schedule">([\s\S]*?)<\/article>/gi;
  for (const match of String(html).matchAll(articlePattern)) {
    const article = match[2].replace(/<!--[\s\S]*?-->/g, ' ');
    const authorField = article.match(/field-name-field-paper-people-text[\s\S]*?<div\s+class="field-item[^>]*>([\s\S]*?)<\/div><\/div><\/div>/i)?.[1];
    if (!authorField) continue;
    const titleMatch = article.match(/<h2>\s*<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i);
    const title = stripHtml(titleMatch?.[2] ?? '');
    if (!title) continue;
    const authorText = stripHtml(authorField);
    const authorStatus = /author list(?: is)? under embargo/i.test(authorText) ? 'embargoed' : '';
    const { abstract, abstractStatus } = cleanUsenixAbstract(
      article.match(/<div\s+class="field field-name-field-paper-description-long[^"]*"[^>]*>([\s\S]*)$/i)?.[1] ?? '',
    );
    papers.push({
      officialId: match[1],
      title,
      authors: authorStatus ? [] : authorsWithoutAffiliations(authorField),
      ...(authorStatus ? { authorStatus } : {}),
      abstract,
      ...(abstractStatus ? { abstractStatus } : {}),
      trackRaw: 'Full Research Paper',
      presentationTypeRaw: 'Technical Session',
      sourceUrl,
      paperUrl: absoluteUrl(titleMatch?.[1], sourceUrl),
    });
  }
  return papers;
};
