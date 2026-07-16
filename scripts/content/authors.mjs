import fs from 'node:fs/promises';
import { getSection } from './markdown.mjs';
import { authorsFile } from './repository.mjs';

const asciiFold = (value = '') =>
  String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

export const normalizeAuthorKey = (value = '') =>
  asciiFold(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

export const slugifyAuthor = (value = '') =>
  asciiFold(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'author';

export const formatAuthorDisplayName = (name, chineseName = '') => (chineseName ? `${name} (${chineseName})` : name);

const authorTextIsParseable = (value = '') => {
  const text = value.trim();
  if (!text || /^unknown$/i.test(text)) return false;
  return !/(https?:|contributors?|team:|other authors?|appendix|collaboration|;)/i.test(text);
};

const looksLikePersonName = (value = '') => {
  const name = value.trim();
  if (!name || name.length > 64) return false;
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]+$/u.test(name)) return false;
  const words = name.split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.length <= 6;
};

export const splitAuthorNames = (value = '') => {
  if (!authorTextIsParseable(value)) return [];
  const separator = value.includes(',') ? /\s*,\s*/ : /\s+and\s+/i;
  const seen = new Set();
  const names = [];

  for (const rawPart of value.split(separator)) {
    const name = rawPart.trim().replace(/\s+/g, ' ');
    const key = normalizeAuthorKey(name);
    if (!looksLikePersonName(name) || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
};

export const collectAuthorReferences = (markdown = '', authorNames = '') => {
  const sourceSection = getSection(markdown, 'Source');
  const authorSections = [sourceSection, getSection(markdown, '作者与关系')].join('\n');
  const slugs = new Set(
    [...authorSections.matchAll(/\/authors\/([a-z0-9]+(?:-[a-z0-9]+)*)\//g)].map((match) => match[1]),
  );
  const sourceAuthors = sourceSection.match(/^-\s+Authors?:\s*(.+)$/mi)?.[1] ?? '';
  const sourceAuthorLinks = [
    ...sourceAuthors.matchAll(/\[([^\]]+)\]\(\/authors\/([a-z0-9]+(?:-[a-z0-9]+)*)\/\)/g),
  ];
  const authorSlugs = new Set(sourceAuthorLinks.map((match) => match[2]));
  const authorLinkKeysBySlug = new Map();
  for (const match of sourceAuthorLinks) {
    const key = normalizeAuthorKey(match[1]);
    if (!key) continue;
    const linkKeys = authorLinkKeysBySlug.get(match[2]) ?? new Set();
    linkKeys.add(key);
    authorLinkKeysBySlug.set(match[2], linkKeys);
  }
  const keys = new Set(splitAuthorNames(authorNames).map(normalizeAuthorKey).filter(Boolean));
  return { slugs, authorSlugs, authorLinkKeysBySlug, keys };
};

export const authorProfileIsReferenced = (profile, references) => {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return false;
  const slug = typeof profile.slug === 'string' ? profile.slug.trim() : '';
  const identities = [profile.name, ...(Array.isArray(profile.aliases) ? profile.aliases : [])]
    .filter((name) => typeof name === 'string')
    .map(normalizeAuthorKey)
    .filter(Boolean);
  if (profile.matchByName === false) {
    const linkKeys = references.authorLinkKeysBySlug?.get(slug);
    return identities.some((key) => linkKeys?.has(key));
  }
  if (slug && references.slugs.has(slug)) return true;

  return identities.some((key) => references.keys.has(key));
};

export const readAuthorProfiles = async () => {
  try {
    const raw = await fs.readFile(authorsFile, 'utf8');
    const profiles = JSON.parse(raw);
    return Array.isArray(profiles) ? profiles : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
};
