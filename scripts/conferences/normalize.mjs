import crypto from 'node:crypto';
import { classifyPaper } from './classify.mjs';
import { decodeHtml } from './html-entities.mjs';

export const normalizeSpace = (value = '') =>
  String(value)
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeTitleKey = (value = '') =>
  normalizeSpace(value)
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const shortHash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);

export const stablePaperId = ({ venueId, year, officialId, title }) => {
  const identity = officialId ? `${venueId}:${year}:${officialId}` : `${venueId}:${year}:${normalizeTitleKey(title)}`;
  return `${venueId}-${year}-${shortHash(identity)}`;
};

export const normalizeAuthors = (authors = []) => {
  const values = Array.isArray(authors) ? authors : String(authors).split(/\s*(?:,|;|\band\b)\s*/i);
  return [
    ...new Set(
      values
        .map((value) => decodeHtml(value))
        .map(normalizeSpace)
        .filter(Boolean),
    ),
  ];
};

const compareStableStrings = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

const canonicalizeForComparison = (value) => {
  if (Array.isArray(value)) return value.map(canonicalizeForComparison);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareStableStrings)
      .map((key) => [key, canonicalizeForComparison(value[key])]),
  );
};

const normalizeStringSet = (values = []) =>
  [...new Set(values.map((value) => normalizeSpace(decodeHtml(value))).filter(Boolean))].sort(compareStableStrings);

export const normalizeTrack = (value = '') => {
  const key = normalizeSpace(value).toLocaleLowerCase();
  if (!key) return 'unknown';
  if (/finding/.test(key)) return 'findings';
  if (/industry|industrial/.test(key)) return 'industry';
  if (/demo|demonstration/.test(key)) return 'demo';
  if (/workshop/.test(key)) return 'workshop';
  if (/short/.test(key)) return 'short';
  if (/main|regular|full|research/.test(key)) return 'main';
  return 'other';
};

export const normalizePresentationType = (value = '') => {
  const key = normalizeSpace(value).toLocaleLowerCase();
  if (!key) return 'unknown';
  if (/spotlight|highlight|featured/.test(key)) return 'featured';
  if (/oral|technical session|paper session/.test(key)) return 'oral';
  if (/poster/.test(key)) return 'poster';
  if (/virtual|online|remote|digital|proceedings[- ]only/.test(key)) return 'unknown';
  return 'other';
};

export const normalizePresentationMode = (value = '') => {
  const key = normalizeSpace(value).toLocaleLowerCase();
  if (!key) return 'unknown';
  if (/hybrid/.test(key)) return 'hybrid';
  if (/in[- ]?person|on[- ]?site/.test(key)) return 'in-person';
  if (/proceedings[- ]?only/.test(key)) return 'proceedings-only';
  if (/virtual|online|remote|digital/.test(key)) return 'virtual';
  return 'other';
};

export const migratePresentationFields = (paper = {}) => {
  const legacyRaw = normalizeSpace(paper.presentationRaw);
  const legacyNormalized = normalizeSpace(paper.presentationNormalized).toLocaleLowerCase();
  const hasTypeRaw = Object.hasOwn(paper, 'presentationTypeRaw');
  const hasModeRaw = Object.hasOwn(paper, 'presentationModeRaw');
  const presentationTypeRaw = normalizeSpace(
    hasTypeRaw
      ? paper.presentationTypeRaw
      : legacyNormalized === 'virtual' || /virtual/i.test(legacyRaw)
        ? ''
        : legacyRaw,
  );
  const presentationModeRaw = normalizeSpace(
    hasModeRaw
      ? paper.presentationModeRaw
      : legacyNormalized === 'virtual' || /virtual/i.test(legacyRaw)
        ? legacyRaw || 'Virtual'
        : '',
  );
  const { presentationRaw: _legacyRaw, presentationNormalized: _legacyNormalized, ...rest } = paper;
  return {
    ...rest,
    presentationTypeRaw,
    presentationTypeNormalized: normalizePresentationType(presentationTypeRaw),
    presentationModeRaw,
    presentationModeNormalized: normalizePresentationMode(presentationModeRaw),
  };
};

export const normalizeStatus = (value = '') => {
  const key = normalizeSpace(value).toLocaleLowerCase();
  if (/withdraw|retract/.test(key)) return 'withdrawn';
  if (/missing/.test(key)) return 'source-missing';
  return 'active';
};

export const normalizePaper = (raw, context, taxonomy) => {
  const title = normalizeSpace(decodeHtml(raw.title));
  const trackRaw = normalizeSpace(raw.trackRaw || context.defaultTrack || 'Main');
  const presentation = migratePresentationFields(raw);
  const officialId = normalizeSpace(raw.officialId);
  const normalized = {
    id: stablePaperId({ venueId: context.venue.id, year: context.year, officialId, title }),
    venueId: context.venue.id,
    venueAcronym: context.venue.acronym,
    venueName: context.venue.name,
    ccfAreaId: context.venue.ccfAreaId,
    year: context.year,
    officialId,
    title,
    authors: normalizeAuthors(raw.authors),
    abstract: normalizeSpace(decodeHtml(raw.abstract)),
    sourceTopics: normalizeStringSet(raw.sourceTopics ?? []),
    trackRaw,
    trackNormalized: normalizeTrack(trackRaw),
    presentationTypeRaw: presentation.presentationTypeRaw,
    presentationTypeNormalized: presentation.presentationTypeNormalized,
    presentationModeRaw: presentation.presentationModeRaw,
    presentationModeNormalized: presentation.presentationModeNormalized,
    recognition: normalizeStringSet(raw.recognition ?? []),
    ...(raw.publicationStatus ? { publicationStatus: normalizeSpace(raw.publicationStatus) } : {}),
    ...(raw.authorStatus ? { authorStatus: normalizeSpace(raw.authorStatus).toLocaleLowerCase() } : {}),
    ...(raw.abstractStatus ? { abstractStatus: normalizeSpace(raw.abstractStatus).toLocaleLowerCase() } : {}),
    status: normalizeStatus(raw.status),
    sourceUrl: raw.sourceUrl || context.sourceUrl,
    paperUrl: raw.paperUrl || '',
    pdfUrl: raw.pdfUrl || '',
    notePath: raw.notePath || '',
  };

  return classifyPaper(normalized, taxonomy);
};

export const mergePapers = (existing = [], incoming = [], observedAt) => {
  const incomingById = new Map(
    incoming.map((paper) => {
      const migrated = migratePresentationFields(paper);
      return [migrated.id, migrated];
    }),
  );
  const merged = [];

  for (const existingPaper of existing) {
    const paper = migratePresentationFields(existingPaper);
    const next = incomingById.get(paper.id);
    if (next) {
      const previousComparable = { ...paper };
      delete previousComparable.firstSeenAt;
      delete previousComparable.lastSeenAt;
      const changed =
        contentHash(canonicalizeForComparison(previousComparable)) !==
        contentHash(canonicalizeForComparison(next));
      merged.push({
        ...paper,
        ...next,
        firstSeenAt: paper.firstSeenAt || observedAt,
        lastSeenAt: changed ? observedAt : paper.lastSeenAt || observedAt,
      });
      incomingById.delete(paper.id);
      continue;
    }
    merged.push({ ...paper, status: paper.status === 'withdrawn' ? 'withdrawn' : 'source-missing' });
  }

  for (const paper of incomingById.values()) {
    merged.push({ ...paper, firstSeenAt: observedAt, lastSeenAt: observedAt });
  }

  return merged.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
};

export const sortPapersById = (papers = []) =>
  [...papers].sort((left, right) => compareStableStrings(left.id ?? '', right.id ?? ''));

export const contentHash = (value) =>
  crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
