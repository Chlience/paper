import process from 'node:process';
import { conferenceAdapters } from './conferences/adapters.mjs';
import { contentHash, mergePapers, normalizePaper, sortPapersById } from './conferences/normalize.mjs';
import {
  conferenceDatasetFile,
  readConferenceRegistry,
  readConferenceTaxonomy,
  readJson,
  writeJson,
} from './conferences/paths.mjs';

const usage = `Usage: node scripts/sync-conference-data.mjs [options]

Options:
  --venue <id>       Sync one venue; may be repeated or comma-separated.
  --observed-at <ts> Override the ISO observation timestamp.
  --dry-run          Fetch, parse, normalize, and validate without writing.
  --help             Show this help message.`;

const parseArguments = (argv) => {
  const options = { venueIds: [], dryRun: false, observedAt: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') options.help = true;
    else if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--venue') options.venueIds.push(...String(argv[++index] ?? '').split(','));
    else if (argument.startsWith('--venue=')) options.venueIds.push(...argument.slice(8).split(','));
    else if (argument === '--observed-at') options.observedAt = argv[++index] ?? '';
    else if (argument.startsWith('--observed-at=')) options.observedAt = argument.slice(14);
    else throw new Error(`Unknown argument: ${argument}`);
  }
  options.venueIds = [...new Set(options.venueIds.map((value) => value.trim()).filter(Boolean))];
  return options;
};

const readExistingDataset = async (venueId) => {
  try {
    return await readJson(conferenceDatasetFile(venueId));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};

const persistablePaper = (raw, context, taxonomy) => {
  const normalized = normalizePaper(raw, context, taxonomy);
  const classificationInputHash = contentHash({
    title: normalized.title,
    abstract: normalized.abstract,
    sourceTopics: normalized.sourceTopics,
  });
  const { abstract: _abstract, sourceTopics: _sourceTopics, ...persisted } = normalized;
  return { ...persisted, classificationInputHash };
};

const assertAdapterResult = (venue, result, papers) => {
  if (result.adapter !== venue.edition2026.adapter) {
    throw new Error(`${venue.id}: adapter returned ${result.adapter}, expected ${venue.edition2026.adapter}.`);
  }
  if (papers.length < result.minPaperCount) {
    throw new Error(`${venue.id}: parsed ${papers.length} papers; safety floor is ${result.minPaperCount}.`);
  }
  const abstractCount = papers.filter((paper) => paper.classificationStatus === 'automatic').length;
  if (result.minAbstractCount && abstractCount < result.minAbstractCount) {
    throw new Error(`${venue.id}: only ${abstractCount} papers have official abstracts; safety floor is ${result.minAbstractCount}.`);
  }
  const publishedCount = papers.filter((paper) => paper.publicationStatus === 'published').length;
  if (result.minPublishedCount && publishedCount < result.minPublishedCount) {
    throw new Error(
      `${venue.id}: only ${publishedCount} papers have official publication links; safety floor is ${result.minPublishedCount}.`,
    );
  }
  const presentationCount = papers.filter((paper) => paper.presentationNormalized !== 'unknown').length;
  if (result.minPresentationCount && presentationCount < result.minPresentationCount) {
    throw new Error(
      `${venue.id}: only ${presentationCount} papers have official presentation labels; safety floor is ${result.minPresentationCount}.`,
    );
  }
  const unknownPresentationCount = papers.length - presentationCount;
  if (
    Number.isInteger(result.maxUnknownPresentationCount) &&
    unknownPresentationCount > result.maxUnknownPresentationCount
  ) {
    throw new Error(
      `${venue.id}: ${unknownPresentationCount} papers lack official presentation labels; maximum is ${result.maxUnknownPresentationCount}.`,
    );
  }
  const ids = new Set();
  for (const paper of papers) {
    if (!paper.title || (paper.authors.length === 0 && paper.authorStatus !== 'embargoed')) {
      throw new Error(`${venue.id}: paper ${paper.id || paper.title || 'unknown'} lacks a title or authors.`);
    }
    if (paper.trackNormalized !== 'main') {
      throw new Error(`${venue.id}: out-of-scope track ${paper.trackRaw || 'unknown'} for ${paper.title}.`);
    }
    if (ids.has(paper.id)) throw new Error(`${venue.id}: duplicate stable paper ID ${paper.id}.`);
    ids.add(paper.id);
  }
};

const syncVenue = async ({ venue, taxonomy, observedAt, dryRun }) => {
  const adapter = conferenceAdapters.get(venue.edition2026.adapter);
  if (!adapter) throw new Error(`${venue.id}: unknown adapter ${venue.edition2026.adapter}.`);
  process.stdout.write(`Syncing ${venue.acronym} 2026 from official source...\n`);
  const result = await adapter();
  const context = { venue, year: 2026, sourceUrl: result.sourceUrl, defaultTrack: 'Main' };
  const incoming = sortPapersById(
    result.papers.map((paper) => persistablePaper(paper, context, taxonomy)),
  );
  assertAdapterResult(venue, result, incoming);

  const nextContentHash = contentHash({
    adapter: result.adapter,
    coverageStatus: result.coverageStatus,
    coverageNote: result.coverageNote,
    sourceUrl: result.sourceUrl,
    sourceUrls: result.sourceUrls,
    taxonomy,
    papers: incoming,
  });
  const existing = await readExistingDataset(venue.id);
  if (existing?.source?.contentHash === nextContentHash) {
    process.stdout.write(`  ${venue.acronym}: unchanged (${incoming.length} papers).\n`);
    return { venueId: venue.id, changed: false, count: incoming.length };
  }

  const existingPapers = Array.isArray(existing?.papers) ? existing.papers : [];
  const papers = mergePapers(existingPapers, incoming, observedAt);
  const dataset = {
    schemaVersion: 1,
    year: 2026,
    venueId: venue.id,
    coverageStatus: result.coverageStatus,
    coverageNote: result.coverageNote,
    source: {
      url: result.sourceUrl,
      urls: result.sourceUrls,
      adapter: result.adapter,
      contentHash: nextContentHash,
      lastSuccessfulSyncAt: observedAt,
    },
    papers,
  };

  if (!dryRun) await writeJson(conferenceDatasetFile(venue.id), dataset);
  const missingCount = papers.filter((paper) => paper.status === 'source-missing').length;
  process.stdout.write(
    `  ${venue.acronym}: ${dryRun ? 'would write' : 'wrote'} ${papers.length} records` +
      `${missingCount ? ` (${missingCount} source-missing)` : ''}.\n`,
  );
  return { venueId: venue.id, changed: true, count: papers.length };
};

const main = async () => {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage);
    return;
  }
  const observedAt = options.observedAt || new Date().toISOString();
  if (Number.isNaN(new Date(observedAt).getTime())) throw new Error(`Invalid --observed-at value: ${observedAt}`);

  const [registry, taxonomy] = await Promise.all([readConferenceRegistry(), readConferenceTaxonomy()]);
  const configured = registry.venues.filter((venue) => venue.edition2026?.adapter);
  const selected = options.venueIds.length
    ? options.venueIds.map((venueId) => {
        const venue = registry.venues.find((candidate) => candidate.id === venueId);
        if (!venue) throw new Error(`Unknown venue: ${venueId}`);
        if (!venue.edition2026?.adapter) throw new Error(`${venueId} has no configured 2026 adapter.`);
        return venue;
      })
    : configured;

  const results = [];
  for (const venue of selected) {
    results.push(await syncVenue({ venue, taxonomy, observedAt, dryRun: options.dryRun }));
  }
  const changed = results.filter((result) => result.changed).length;
  console.log(
    `Conference sync complete: ${results.length} venues checked, ${changed} ${options.dryRun ? 'would change' : 'changed'}.`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
