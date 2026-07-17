# Chlience Paper Archive

Personal paper-reading archive for LLM, RL, systems, safety, theory, and optimizer research.

The content source is split by role:

```text
content/papers/      paper notes, one Markdown file per paper
content/utility/     public workflow, template, archive index, and research-mainline snapshot
data/authors.json    maintained author profiles
data/tag-taxonomy.json controlled tag vocabulary and facets
data/paper-tags.json paper-to-tag assignments, primary tag first
data/research-mainlines.json facets, method nodes, sourced relations, and corpus coverage
internal/            analysis modules and private maintenance SOPs
```

The Astro site reads those files through `scripts/build-paper-data.mjs`, generates `src/generated/paper-data.json`, and deploys only the built artifact to `papers.chlience.com`.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:4321
```

## Local Validation

```bash
npm run test:workflow
npm run check:workflow
npm run check:mainlines
npm run check:metadata
npm run check:math
npm run test:search
npm run test:pins
```

These source-level checks do not produce the production `dist/` artifact. `check:math` refreshes the ignored `src/generated/` content data before validating Markdown formulas.

## CI Build and Deployment

GitHub Actions validates source files, runs one production build, and checks the generated output:

```bash
npm run test:workflow
npm run check:workflow
npm run check:mainlines
npm run check:metadata
npm run test:search
npm run test:pins
npm run build
node scripts/check-markdown-math.mjs
node scripts/check-paper-site.mjs
```

The workflow packages `dist/` as a static tarball and uploads it to the server. Both `dist/` and `src/generated/` are ignored by Git and are not committed.

Required GitHub secret:

```text
CHLIENCE_SSH_PRIVATE_KEY
```

Server setup details live in:

```text
deploy/server-setup.md
```

## Content Workflow

Paper-reading workflow:

```text
content/utility/paper-analysis-workflow.md
```

New notes use the v2.1 source snapshot, analysis modules, and seven-section contract in:

```text
content/utility/paper-note-template.md
```

Author identity, profile, and public-account verification follows the internal SOP:

```text
internal/author-x-account-search-sop.md
```

Module-specific analysis and repository maintenance follow:

```text
internal/paper-analysis-modules.md
internal/paper-archive-maintenance-sop.md
```

`npm run check:workflow` validates paper structure, v2/v2.1 fields, evidence locations, archive-time conflicts, local figures, controlled tag assignments, author-profile data, and recurring unprofiled authors. Historical notes remain readable under compatibility mode and produce bounded migration advisories.

## Manual Research-Mainline Update

Research mainlines use a manually maintained v2 snapshot. `npm run check:mainlines` validates ID formats and uniqueness, facets, method memberships, sourced relations, formal/candidate admission, and paper coverage within the recorded snapshot. It does not discover papers or infer relations.

When manually refreshing the snapshot:

1. Compare papers added or changed after `snapshot.asOf`.
2. Add method nodes and line memberships; add a relation only when its evidence and locator are recorded.
3. Record non-method papers in `materials`, including evidence, boundary, counterexample, or synthesis uses.
4. Advance the snapshot only after the strict current-corpus check succeeds:

```bash
node scripts/check-research-mainlines.mjs --require-current
npm run build
node scripts/check-paper-site.mjs
```

The default check may report newer papers as snapshot advisories. The strict command requires every current paper to have exactly one material record.
