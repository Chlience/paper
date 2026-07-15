import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

export const repoRoot = process.cwd();
export const conferenceDataDir = path.join(repoRoot, 'data', 'conferences');
export const conferenceYearDir = path.join(conferenceDataDir, '2026');
export const conferenceRegistryFile = path.join(conferenceDataDir, 'registry.json');
export const conferenceTaxonomyFile = path.join(conferenceDataDir, 'taxonomy.json');
export const generatedConferenceFile = path.join(repoRoot, 'src', 'generated', 'conference-data.json');
export const conferenceDatasetFile = (venueId) => path.join(conferenceYearDir, `${venueId}.json`);

export const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

export const readConferenceRegistry = () => readJson(conferenceRegistryFile);
export const readConferenceTaxonomy = () => readJson(conferenceTaxonomyFile);

export const readConferenceDatasets = async () => {
  let files = [];
  try {
    files = await fs.readdir(conferenceYearDir);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const datasets = [];
  for (const fileName of files.filter((value) => value.endsWith('.json')).sort()) {
    datasets.push(await readJson(path.join(conferenceYearDir, fileName)));
  }
  return datasets;
};

export const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};
