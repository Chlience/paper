# Chlience Paper Archive

Personal paper-reading archive for LLM, RL, systems, safety, theory, and optimizer research.

The content source is split by role:

```text
content/papers/      paper notes, one Markdown file per paper
content/utility/     public workflow, template, and archive index pages
data/authors.json    maintained author profiles
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

## Build

```bash
npm run build
npm run check:site
npm run check:math
```

The static output is written to:

```text
dist/
```

## Deployment

GitHub Actions builds the site and uploads a static tarball to the server.

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

New notes should follow:

```text
content/utility/paper-note-template.md
```
