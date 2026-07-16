import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

export const repoRoot = process.cwd();
export const conferenceDataDir = path.join(repoRoot, 'data', 'conferences');
export const conferenceRegistryFile = path.join(conferenceDataDir, 'registry.json');
export const latestEditionCalendarFile = path.join(conferenceDataDir, 'latest-editions.json');
export const generatedConferenceFile = path.join(repoRoot, 'src', 'generated', 'conference-data.json');

export const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

export const readConferenceRegistry = () => readJson(conferenceRegistryFile);
export const readLatestEditionCalendar = () => readJson(latestEditionCalendarFile);

export const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};
