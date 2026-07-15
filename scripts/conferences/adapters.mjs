import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { normalizeTitleKey } from './normalize.mjs';
import {
  absoluteUrl,
  csvRecords,
  decodeHtml,
  parseAclAnthologyMods,
  parseAsplosProgram,
  parseCvfOpenAccess,
  parseUsenixProgram,
} from './source-utils.mjs';

const sourceUrls = {
  acl: {
    homepage: 'https://2026.aclweb.org/',
    accepted: 'https://2026.aclweb.org/program/accepted_papers/',
    roster: 'https://aclanthology.org/volumes/2026.acl-long.xml',
    schedule:
      'https://docs.google.com/spreadsheets/d/16ZuzEVhY1BAeZGK9LJskLcvqacy-7YuoAaK1yXoRcFQ/export?format=csv',
  },
  cvpr: {
    homepage: 'https://cvpr.thecvf.com/Conferences/2026',
    accepted: 'https://openaccess.thecvf.com/CVPR2026?day=all',
    schedule:
      'https://docs.google.com/spreadsheets/d/1Tq6j5YjsaLaYO5QAHLJNEW-eZRCarVbI_2PQFvlw5PQ/export?format=csv',
    events: 'https://cvpr.thecvf.com/static/virtual/data/cvpr-2026-orals-posters.json',
    abstracts: 'https://cvpr.thecvf.com/static/virtual/data/cvpr-2026-abstracts.json',
  },
  icml: {
    homepage: 'https://icml.cc/Conferences/2026',
    accepted: 'https://icml.cc/virtual/2026/papers.html',
    events: 'https://icml.cc/static/virtual/data/icml-2026-orals-posters.json',
    abstracts: 'https://icml.cc/static/virtual/data/icml-2026-abstracts.json',
  },
  asplos: {
    homepage: 'https://www.asplos-conference.org/asplos2026/',
    accepted: 'https://www.asplos-conference.org/asplos2026/program/',
  },
  'usenix-security': {
    homepage: 'https://www.usenix.org/conference/usenixsecurity26',
    accepted: 'https://www.usenix.org/conference/usenixsecurity26/technical-sessions',
  },
};

const cacheFileNames = new Map([
  [sourceUrls.acl.roster, 'acl-long.xml'],
  [sourceUrls.acl.schedule, 'acl2026.csv'],
  [sourceUrls.cvpr.accepted, 'cvpr-open.html'],
  [sourceUrls.cvpr.schedule, 'cvpr2026.csv'],
  [sourceUrls.cvpr.events, 'cvpr-events.json'],
  [sourceUrls.cvpr.abstracts, 'cvpr-abstracts.json'],
  [sourceUrls.icml.events, 'icml-events.json'],
  [sourceUrls.icml.abstracts, 'icml-abstracts.json'],
  [sourceUrls.asplos.accepted, 'asplos26.html'],
  [sourceUrls['usenix-security'].accepted, 'usenix26.html'],
]);

const execFileAsync = promisify(execFile);

const readCachedSource = async (url) => {
  const cacheDir = process.env.CONFERENCE_SOURCE_CACHE_DIR;
  const fileName = cacheFileNames.get(url);
  if (!cacheDir || !fileName) return null;
  try {
    return await fs.readFile(path.join(cacheDir, fileName), 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};

const fetchWithRetries = async (url, parser, { attempts = 6, timeoutMs = 240_000 } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: '*/*',
          'user-agent': 'chlience-paper-archive/0.1 (+https://github.com/chlience/paper)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return await parser(response);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw new Error(`Unable to fetch ${url}: ${lastError?.message ?? lastError}`);
};

const fetchTextWithCurl = async (url) => {
  const { stdout } = await execFileAsync(
    'curl',
    [
      '--fail',
      '--location',
      '--compressed',
      '--retry',
      '4',
      '--retry-all-errors',
      '--connect-timeout',
      '45',
      '--max-time',
      '300',
      '--silent',
      '--show-error',
      '--user-agent',
      'chlience-paper-archive/0.1 (+https://github.com/chlience/paper)',
      url,
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 330_000 },
  );
  return stdout;
};

const fetchNetworkText = async (url, options) => {
  try {
    return await fetchWithRetries(url, (response) => response.text(), options);
  } catch (fetchError) {
    try {
      return await fetchTextWithCurl(url);
    } catch (curlError) {
      throw new Error(
        `Unable to fetch ${url} with Node or curl: ${fetchError.message}; ${curlError.message}`,
      );
    }
  }
};

export const fetchText = async (url, options) => {
  const cached = await readCachedSource(url);
  return cached ?? fetchNetworkText(url, options);
};

export const fetchJson = async (url, options) => {
  const cached = await readCachedSource(url);
  if (cached != null) return JSON.parse(cached);
  try {
    return await fetchWithRetries(url, async (response) => JSON.parse(await response.text()), options);
  } catch (fetchError) {
    try {
      return JSON.parse(await fetchTextWithCurl(url));
    } catch (curlError) {
      throw new Error(
        `Unable to fetch JSON ${url} with Node or curl: ${fetchError.message}; ${curlError.message}`,
      );
    }
  }
};

const compareStableStrings = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

const uniqueStrings = (values) =>
  [...new Set(values.map((value) => decodeHtml(value).trim()).filter(Boolean))].sort(compareStableStrings);

const groupMiniconfEvents = (events = []) => {
  const groups = new Map();
  for (const event of events) {
    const key = normalizeTitleKey(decodeHtml(event?.name));
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(event);
    groups.set(key, group);
  }
  return groups;
};

const miniconfAbstract = (group, abstracts) => {
  for (const event of group) {
    const abstract = abstracts?.[String(event.id)];
    if (abstract) return decodeHtml(abstract);
  }
  return '';
};

const miniconfPresentation = (group) => {
  if (group.some((event) => /oral/i.test(event.event_type ?? event.eventtype ?? ''))) return 'Oral';
  if (group.some((event) => /spotlight/i.test(event.decision ?? ''))) return 'Spotlight';
  if (group.some((event) => /highlight/i.test(event.decision ?? ''))) return 'Highlight';
  if (group.some((event) => /poster/i.test(event.event_type ?? event.eventtype ?? event.decision ?? ''))) return 'Poster';
  return '';
};

const openReviewId = (value = '') => {
  try {
    return new URL(value).searchParams.get('id') ?? '';
  } catch {
    return '';
  }
};

const aclPresentation = (sessionName = '') => {
  if (/^orals? session\b/i.test(sessionName)) return 'Oral';
  if (/^poster session\b/i.test(sessionName)) return 'Poster';
  if (/^virtual presentations?\b/i.test(sessionName)) return 'Virtual';
  return '';
};

const aclTitleTokens = (value) =>
  new Set(
    normalizeTitleKey(decodeHtml(value))
      .split(' ')
      .filter((token) => token.length > 1),
  );

const tokenJaccard = (left, right) => {
  if (left.size <= 1 || right.size <= 1) return 0;
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
};

export const matchAclScheduleRows = (roster, scheduleRows, threshold = 0.75) => {
  const seenScheduleIds = new Set();
  const entries = [];
  for (const row of scheduleRows) {
    if (!/-MAIN$/i.test(row['Paper number'] ?? '')) continue;
    const titleKey = normalizeTitleKey(decodeHtml(row.Title));
    if (!titleKey) continue;
    const scheduleId = String(row['Paper number'] ?? '').trim() || titleKey;
    if (seenScheduleIds.has(scheduleId)) continue;
    seenScheduleIds.add(scheduleId);
    entries.push({ row, titleKey, tokens: aclTitleTokens(row.Title) });
  }

  const matches = new Map();
  const usedEntries = new Set();
  const unmatched = [];
  roster.forEach((paper, rosterIndex) => {
    const titleKey = normalizeTitleKey(decodeHtml(paper.title));
    const exact = entries.filter((entry) => entry.titleKey === titleKey && !usedEntries.has(entry));
    if (exact.length === 1) {
      matches.set(paper, exact[0].row);
      usedEntries.add(exact[0]);
    } else {
      unmatched.push({ paper, rosterIndex, tokens: aclTitleTokens(paper.title) });
    }
  });

  const proposals = [];
  for (const item of unmatched) {
    const candidates = entries
      .filter((entry) => !usedEntries.has(entry))
      .map((entry) => ({ entry, score: tokenJaccard(item.tokens, entry.tokens) }))
      .filter(({ score }) => score >= threshold)
      .sort((left, right) => right.score - left.score);
    if (candidates.length === 0) continue;
    if (candidates[1] && candidates[0].score - candidates[1].score < 0.1) continue;
    proposals.push({ ...item, ...candidates[0] });
  }

  proposals
    .sort((left, right) => right.score - left.score || left.rosterIndex - right.rosterIndex)
    .forEach(({ paper, entry }) => {
      if (usedEntries.has(entry)) return;
      matches.set(paper, entry.row);
      usedEntries.add(entry);
    });
  return matches;
};

const cvprScheduleMetadata = (value) => {
  if (/\b\d{4}-\d{4}-\d{4}-[\dX]{4}\b/i.test(value)) return true;
  if (/^blank$/i.test(value)) return true;
  return (
    /\bblank$/i.test(value) &&
    /\b(?:studios?|allen ai|universit(?:y|ies)|institutes?|laborator(?:y|ies))\b/i.test(value)
  );
};

export const parseCvprScheduleAuthors = (value = '') =>
  String(value)
    .split(/\s*,\s*/)
    .map((author) => decodeHtml(author).trim())
    .filter((author) => author && !cvprScheduleMetadata(author));

export const adaptAcl = async ({ getText = fetchText } = {}) => {
  const [yaml, scheduleCsv] = await Promise.all([
    getText(sourceUrls.acl.roster),
    getText(sourceUrls.acl.schedule),
  ]);
  const roster = parseAclAnthologyMods(yaml);
  const scheduleByPaper = matchAclScheduleRows(roster, csvRecords(scheduleCsv, 'Paper number'));
  return {
    adapter: 'acl-anthology-schedule',
    sourceUrl: sourceUrls.acl.accepted,
    sourceUrls: [sourceUrls.acl.roster, sourceUrls.acl.schedule, sourceUrls.acl.accepted],
    coverageStatus: 'published',
    coverageNote: `${roster.length} ACL Anthology long papers; short papers are excluded and presentation labels follow the official schedule.`,
    minPaperCount: 2_200,
    minAbstractCount: 2_200,
    minPresentationCount: 1_200,
    maxUnknownPresentationCount: 25,
    papers: roster.map((paper) => {
      const schedule = scheduleByPaper.get(paper);
      const sessionName = schedule?.['Underline/Whova Session Name'] ?? '';
      return {
        ...paper,
        abstract: schedule?.Abstract ?? '',
        sourceTopics: uniqueStrings([schedule?.Session, sessionName]),
        trackRaw: 'Main Conference Long Paper',
        presentationRaw: aclPresentation(sessionName),
        sourceUrl: sourceUrls.acl.accepted,
        paperUrl: paper.paperUrl,
      };
    }),
  };
};

export const adaptCvpr = async ({ getText = fetchText, getJson = fetchJson } = {}) => {
  const [scheduleCsv, openAccessHtml, eventData, abstracts] = await Promise.all([
    getText(sourceUrls.cvpr.schedule),
    getText(sourceUrls.cvpr.accepted),
    getJson(sourceUrls.cvpr.events),
    getJson(sourceUrls.cvpr.abstracts),
  ]);
  const publishedPapers = parseCvfOpenAccess(openAccessHtml, sourceUrls.cvpr.accepted);
  const publishedByPath = new Map(publishedPapers.map((paper) => [new URL(paper.paperUrl).pathname, paper]));
  const eventsByTitle = groupMiniconfEvents(eventData.results ?? []);
  const eventsByPaperId = new Map();
  for (const group of eventsByTitle.values()) {
    for (const event of group) {
      if (event.sourceid != null && event.sourceid !== '') eventsByPaperId.set(String(event.sourceid), group);
    }
  }
  const schedule = csvRecords(scheduleCsv, 'Paper ID').filter((row) => row['Paper ID'] && row.Title);
  const papers = schedule.map((row) => {
    const group = eventsByPaperId.get(row['Paper ID']) ?? eventsByTitle.get(normalizeTitleKey(row.Title)) ?? [];
    const proceedingsUrl = group.find((event) => event.paper_pdf_url)?.paper_pdf_url ?? '';
    let published;
    try {
      published = proceedingsUrl ? publishedByPath.get(new URL(proceedingsUrl).pathname) : undefined;
    } catch {
      published = undefined;
    }
    const virtualPath = group.find((event) => event.virtualsite_url)?.virtualsite_url ?? '';
    const presentationRaw = row['Oral Paper'] ? 'Oral' : row['Highlight Paper'] ? 'Highlight' : 'Poster';
    const publishedAuthors = (published?.authors ?? []).filter(
      (author) => !cvprScheduleMetadata(author),
    );
    return {
      officialId: row['Paper ID'],
      title: row.Title,
      authors: publishedAuthors.length ? publishedAuthors : parseCvprScheduleAuthors(row.Authors),
      abstract: miniconfAbstract(group, abstracts),
      sourceTopics: uniqueStrings(group.flatMap((event) => [event.topic, ...(event.keywords ?? [])])),
      trackRaw: 'Main Conference Paper',
      presentationRaw,
      recognition: row['Award Candidate'] ? ['Award Candidate'] : [],
      publicationStatus: published ? 'published' : 'scheduled',
      sourceUrl: published ? sourceUrls.cvpr.accepted : sourceUrls.cvpr.schedule,
      paperUrl: published?.paperUrl || absoluteUrl(virtualPath, sourceUrls.cvpr.homepage),
      pdfUrl: published?.pdfUrl ?? '',
    };
  });
  return {
    adapter: 'cvpr-schedule-cvf-miniconf',
    sourceUrl: sourceUrls.cvpr.accepted,
    sourceUrls: [sourceUrls.cvpr.schedule, sourceUrls.cvpr.accepted, sourceUrls.cvpr.events, sourceUrls.cvpr.abstracts],
    coverageStatus: 'published',
    coverageNote: `${papers.length} papers in the official schedule; ${publishedPapers.length} currently appear in CVF Open Access.`,
    minPaperCount: 4_050,
    minAbstractCount: 4_000,
    minPublishedCount: 4_000,
    minPresentationCount: 4_000,
    papers,
  };
};

export const adaptIcml = async ({ getJson = fetchJson } = {}) => {
  const [eventData, abstracts] = await Promise.all([
    getJson(sourceUrls.icml.events),
    getJson(sourceUrls.icml.abstracts),
  ]);
  const mainEvents = (eventData.results ?? []).filter((event) =>
    String(event.sourceurl ?? '').includes('ICML.cc/2026/Conference'),
  );
  const groups = groupMiniconfEvents(mainEvents);
  const papers = [...groups.values()].map((group) => {
    const base = group.find((event) => event.paper_url) ?? group.find((event) => /poster/i.test(event.event_type ?? '')) ?? group[0];
    const reviewUrl = decodeHtml(base.paper_url ?? '');
    const reviewId = openReviewId(reviewUrl);
    const virtualPath = group.find((event) => event.virtualsite_url)?.virtualsite_url ?? '';
    const paperUrl = reviewUrl || absoluteUrl(virtualPath, sourceUrls.icml.homepage);
    const officialId = reviewId || String(base.sourceid ?? base.uid ?? base.id ?? '');
    return {
      officialId,
      title: decodeHtml(base.name),
      authors: (base.authors ?? []).map((author) => decodeHtml(author.fullname)).filter(Boolean),
      abstract: miniconfAbstract(group, abstracts),
      sourceTopics: uniqueStrings(group.flatMap((event) => [event.topic, ...(event.keywords ?? [])])),
      trackRaw: `Main Conference · ${base.decision || 'Accept'}`,
      presentationRaw: miniconfPresentation(group),
      sourceUrl: sourceUrls.icml.accepted,
      paperUrl,
      pdfUrl: reviewId ? `https://openreview.net/pdf?id=${encodeURIComponent(reviewId)}` : '',
    };
  });

  return {
    adapter: 'miniconf-json',
    sourceUrl: sourceUrls.icml.accepted,
    sourceUrls: [sourceUrls.icml.events, sourceUrls.icml.abstracts, sourceUrls.icml.accepted],
    coverageStatus: 'published',
    coverageNote: `${papers.length} Main Conference papers; Position Paper Track and invited journal tracks are excluded.`,
    minPaperCount: 6_200,
    minAbstractCount: 6_200,
    minPresentationCount: 6_200,
    papers,
  };
};

export const adaptAsplos = async ({ getText = fetchText } = {}) => {
  const html = await getText(sourceUrls.asplos.accepted);
  const papers = parseAsplosProgram(html, sourceUrls.asplos.accepted);
  return {
    adapter: 'asplos-program-html',
    sourceUrl: sourceUrls.asplos.accepted,
    sourceUrls: [sourceUrls.asplos.accepted],
    coverageStatus: 'published',
    coverageNote: `Official program DOM lists ${papers.length} research papers; the page prose currently states 167.`,
    minPaperCount: 150,
    minPresentationCount: 150,
    papers,
  };
};

export const adaptUsenixSecurity = async ({ getText = fetchText } = {}) => {
  const html = await getText(sourceUrls['usenix-security'].accepted);
  const papers = parseUsenixProgram(html, sourceUrls['usenix-security'].accepted);
  const abstractCount = papers.filter((paper) => paper.abstract).length;
  return {
    adapter: 'usenix-program-html',
    sourceUrl: sourceUrls['usenix-security'].accepted,
    sourceUrls: [sourceUrls['usenix-security'].accepted],
    coverageStatus: 'published',
    coverageNote: `${papers.length} Cycle 1 and Cycle 2 research papers; ${abstractCount} official abstracts are currently available.`,
    minPaperCount: 340,
    minAbstractCount: 150,
    minPresentationCount: 340,
    papers,
  };
};

export const conferenceAdapters = new Map([
  ['acl-anthology-schedule', adaptAcl],
  ['cvpr-schedule-cvf-miniconf', adaptCvpr],
  ['miniconf-json', adaptIcml],
  ['asplos-program-html', adaptAsplos],
  ['usenix-program-html', adaptUsenixSecurity],
]);

export const officialConferenceSources = sourceUrls;
