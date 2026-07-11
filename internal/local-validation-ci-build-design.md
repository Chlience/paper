# Local Validation and CI Build Separation

Date: 2026-07-11
Status: Approved

## Context

`dist/` is ignored by Git. The deployment workflow already runs the Astro production build, checks the generated site, packages `dist/`, and deploys the artifact. The paper-analysis SOP currently repeats the production build locally. A local `check:site` also reads the existing `dist/`, so stale output can produce misleading missing-page messages when no fresh build has run.

## Decision

Paper archival uses source-level checks locally:

```bash
npm run test:workflow
npm run check:workflow
npm run check:metadata
npm run check:math
npm run test:search
npm run test:pins
```

The local archival workflow does not run `npm run build` or `npm run check:site`. GitHub Actions retains responsibility for the production Astro build, generated-page checks, artifact packaging, and deployment.

## Documentation Changes

- Update `README.md` to separate local validation from the CI build and deployment path.
- Update `content/utility/paper-analysis-workflow.md` wherever local completion currently requires a site build or generated-page check.
- Keep `.github/workflows/deploy.yml`, `package.json`, validation scripts, and `.gitignore` unchanged.

## Verification

- Confirm every documented local command exists in `package.json`.
- Check the README and paper SOP use the same local command set and CI responsibility boundary.
- Run source-level validation commands only; skip the Astro production build and `check:site` locally.
- Run `git diff --check` and review the final diff before committing.

## Consequences

Local paper archival avoids producing `dist/` and removes duplicate production-build work. Generated paper and author pages remain guarded by the GitHub Actions build that runs after push. A CI failure blocks deployment and is fixed through a follow-up commit.
