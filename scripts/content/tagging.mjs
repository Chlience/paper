import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './repository.mjs';

const readJson = (fileName) => JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', fileName), 'utf8'));

export const tagTaxonomy = readJson('tag-taxonomy.json');
export const paperTagAssignments = readJson('paper-tags.json');

export const tagFacets = tagTaxonomy.facets.map(({ id, label, description }) => ({ id, label, description }));

export const tagDefinitions = tagTaxonomy.facets.flatMap((facet) =>
  facet.tags.map((tag) => ({
    ...tag,
    facetId: facet.id,
    facetLabel: facet.label,
  })),
);

const tagDefinitionsById = new Map(tagDefinitions.map((tag) => [tag.id, tag]));

const issue = (code, subject, message) => ({ code, subject, message });
const normalizedLabel = (value = '') => String(value).trim().toLocaleLowerCase();

export const validateTagConfiguration = (
  paperSlugs,
  { taxonomy = tagTaxonomy, assignments = paperTagAssignments } = {},
) => {
  const errors = [];
  const knownPaperSlugs = new Set(paperSlugs);
  const facetIds = new Set();
  const tagIds = new Set();
  const tagLabels = new Set();
  const tagTerms = new Map();

  if (!Number.isInteger(taxonomy?.version) || !Array.isArray(taxonomy?.facets)) {
    return [issue('tag-taxonomy-shape', 'tag-taxonomy.json', 'Expected an integer version and a facets array.')];
  }

  for (const facet of taxonomy.facets) {
    if (!facet?.id || !facet?.label || !Array.isArray(facet?.tags)) {
      errors.push(issue('tag-facet-shape', facet?.id ?? 'unknown-facet', 'Each facet needs id, label, and tags.'));
      continue;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(facet.id)) {
      errors.push(issue('invalid-tag-facet-id', facet.id, 'Facet IDs must be stable lowercase kebab-case values.'));
    }
    if (facetIds.has(facet.id)) {
      errors.push(issue('duplicate-tag-facet', facet.id, 'Facet IDs must be unique.'));
    }
    facetIds.add(facet.id);

    for (const tag of facet.tags) {
      if (!tag?.id || !tag?.label || !tag?.description || !Array.isArray(tag?.aliases)) {
        errors.push(issue('tag-definition-shape', tag?.id ?? 'unknown-tag', 'Each tag needs id, label, aliases, and description.'));
        continue;
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag.id)) {
        errors.push(issue('invalid-tag-id', tag.id, 'Tag IDs must be stable lowercase kebab-case values.'));
      }
      if (tagIds.has(tag.id)) {
        errors.push(issue('duplicate-tag-id', tag.id, 'Tag IDs must be unique.'));
      }
      tagIds.add(tag.id);

      const labelKey = normalizedLabel(tag.label);
      if (tagLabels.has(labelKey)) {
        errors.push(issue('duplicate-tag-label', tag.label, 'Preferred tag labels must be unique.'));
      }
      tagLabels.add(labelKey);

      const localTerms = new Set();
      for (const term of [tag.label, ...tag.aliases]) {
        const termKey = normalizedLabel(term);
        if (!termKey) {
          errors.push(issue('empty-tag-term', tag.id, 'Preferred labels and aliases must be non-empty strings.'));
          continue;
        }
        if (localTerms.has(termKey)) {
          errors.push(issue('duplicate-tag-term', tag.id, `Repeated preferred label or alias: ${term}.`));
          continue;
        }
        localTerms.add(termKey);
        const existingTagId = tagTerms.get(termKey);
        if (existingTagId && existingTagId !== tag.id) {
          errors.push(issue('ambiguous-tag-term', tag.id, `Term ${term} is already used by ${existingTagId}.`));
        } else {
          tagTerms.set(termKey, tag.id);
        }
      }
    }
  }

  if (!assignments || typeof assignments !== 'object' || Array.isArray(assignments)) {
    return [...errors, issue('paper-tags-shape', 'paper-tags.json', 'Expected a slug-to-tag-ID object.')];
  }

  for (const slug of knownPaperSlugs) {
    const ids = assignments[slug];
    if (!Array.isArray(ids) || ids.length === 0) {
      errors.push(issue('missing-paper-tags', slug, 'Every paper needs one primary tag and up to three secondary tags.'));
      continue;
    }
    if (ids.length > 4) {
      errors.push(issue('too-many-paper-tags', slug, 'A paper may have at most four tags.'));
    }
    if (new Set(ids).size !== ids.length) {
      errors.push(issue('duplicate-paper-tag', slug, 'A paper cannot repeat the same tag.'));
    }
    for (const id of ids) {
      if (!tagIds.has(id)) {
        errors.push(issue('unknown-paper-tag', slug, `Unknown tag ID: ${id}.`));
      }
    }
  }

  for (const slug of Object.keys(assignments)) {
    if (!knownPaperSlugs.has(slug)) {
      errors.push(issue('stale-paper-tags', slug, 'Tag assignment points to a paper that is not in the archive.'));
    }
  }

  return errors;
};

export const tagsForPaper = (slug) => {
  const ids = paperTagAssignments[slug];
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error(`Missing controlled tag assignment for ${slug}.`);
  }

  return ids.map((id) => {
    const tag = tagDefinitionsById.get(id);
    if (!tag) throw new Error(`Unknown controlled tag ${id} assigned to ${slug}.`);
    return tag;
  });
};
