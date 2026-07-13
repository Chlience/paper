# Chlience Paper Archive

Personal paper-reading archive for LLM, RL, systems, safety, theory, and optimizer research.

The content source is split by role:

```text
content/papers/      paper notes, one Markdown file per paper
content/utility/     public workflow, template, and archive index pages
data/authors.json    maintained author profiles
data/tag-taxonomy.json controlled tag vocabulary and facets
data/paper-tags.json paper-to-tag assignments, primary tag first
internal/            private maintenance SOPs
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
npm run check:metadata
npm run check:math
npm run test:search
npm run test:pins
```

These source-level checks do not produce the production `dist/` artifact. `check:math` refreshes the ignored `src/generated/` content data before validating Markdown formulas.

## CI Build and Deployment

GitHub Actions runs the production build and generated-site check:

```bash
npm run build
npm run check:site
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

New notes use the v2 source snapshot and evidence contract in:

```text
content/utility/paper-note-template.md
```

Author identity, profile, and public-account verification follows the internal SOP:

```text
internal/author-x-account-search-sop.md
```

`npm run check:workflow` validates paper structure, v2 fields, evidence locations, archive-time conflicts, local figures, controlled tag assignments, author-profile data, and recurring unprofiled authors. Historical notes remain readable under compatibility mode and produce bounded migration advisories.
