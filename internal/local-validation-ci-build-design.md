# Local Validation and CI Build Separation

Date: 2026-07-11
Status: Approved

## Context

`dist/` is ignored by Git. The deployment workflow already runs the Astro production build, checks the generated site, packages `dist/`, and deploys the artifact. The paper-analysis SOP currently repeats the production build locally. A local `check:site` also reads the existing `dist/`, so stale output can produce misleading missing-page messages when no fresh build has run.

## Decision

Paper archival uses source-level checks locally:

```bash
npm run check:source
```

The local archival workflow does not run `npm run build` or `npm run check:dist`. `check:source` contains pure unit tests and read-only corpus checks, so every local source check can run without generated files from a preceding command. GitHub Actions retains responsibility for one production Astro build, generated-data and page checks, artifact packaging, and deployment. `npm run check:all` reproduces this validation path locally.

## Documentation Changes

- Update `README.md` to separate local validation from the CI build and deployment path.
- Update `content/utility/paper-analysis-workflow.md` wherever local completion currently requires a site build or generated-page check.
- Keep the public SOPs aligned on `check:source` and the CI workflow aligned on `check:source → build → check:dist`.

## Verification

- Confirm every documented local command exists in `package.json`.
- Check the README and paper SOP use the same local command set and CI responsibility boundary.
- Run `npm run check:source` for ordinary archive changes; use `npm run check:all` only when reproducing the full Action.
- Run `git diff --check` and review the final diff before committing.

## Consequences

Local paper archival avoids producing `dist/` and removes duplicate production-build work. Generated paper and author pages remain guarded by the GitHub Actions build that runs after push. A CI failure blocks deployment and is fixed through a follow-up commit.
