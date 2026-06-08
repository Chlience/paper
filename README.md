# Chlience Paper Archive

Personal paper-reading archive for LLM, RL, systems, safety, theory, and optimizer research.

The Markdown files in the repository root are the source of truth. The Astro site reads those files, generates static pages, and deploys only the built artifact to `papers.chlience.com`.

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
paper-analysis-workflow.md
```

New notes should follow:

```text
paper-note-template.md
```
