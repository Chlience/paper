# Chlience Paper Archive

Personal research archive for LLM, RL, systems, safety, theory, and frontier-model reports.

The source tree separates single-material evidence from request-defined research synthesis:

```text
content/papers/        one Markdown note per paper, report, model card, blog, or published survey
content/mainlines/     one synthesis article per explicit direction-summary request
content/utility/       public workflows, templates, archive index, and mainline policy
data/authors.json      maintained author profiles
data/tag-taxonomy.json controlled paper-tag vocabulary and facets
data/paper-tags.json   paper-to-tag assignments, primary tag first
internal/              analysis modules and private maintenance SOPs
```

`scripts/build-paper-data.mjs` builds the paper, author, topic, and utility inventory. `scripts/build-mainline-data.mjs` independently validates and builds mainline articles. The Astro site combines both inventories for global search and generates paper-to-mainline backlinks from local paper links in each mainline article.

## Paper Reading

New notes follow the v3 reading contract in `content/utility/paper-analysis-workflow.md` and its companion template. The workflow starts with the reading question, reconstructs the mechanism, and distinguishes observations from interpretations and unresolved alternatives. `Reading scope` records what was actually read. Existing legacy, v2 and v2.1 notes keep their compatibility checks until a substantive update migrates them.

The September 2026 audit and revision rationale are in `internal/paper-sop-v3-review.md`. Analysis modules define claim-specific questions; the maintenance SOP owns repository operations. Scientific validity remains a manual review responsibility.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

## Validation

```bash
npm run check:source
git diff --check
```

`check:source` runs pure unit tests and read-only corpus checks without generating ignored files. Use `npm run check:all` to run the source checks, build the production site once, verify generated data and `dist/`, and run browser regressions. `npm run check:browser` starts a temporary local server for the existing `dist/` and requires `google-chrome`; it covers the real v3 article and legacy figures, mobile anchors, complete search results, and directory filters and pagination. CI runs this check before packaging the deployment. The additional interaction checks under `npm run manual:browser` require a running local site.

Paper and author directories support keyword filters and 24 entries per page. Paper filters preserve the existing pinned, archive-time and review-time ordering and combine with topics; author filters include profile scope and name ordering. Query parameters preserve the selected filters and page. Without JavaScript, the complete directories remain readable. Paper source details remain available in an expandable section and through the existing `#source` links.

Generated `src/generated/` data and `dist/` are ignored and stay outside commits.

## Content Workflows

- Single materials: `content/utility/paper-analysis-workflow.md`
- Single-material template: `content/utility/paper-note-template.md`
- Request-defined mainlines: `content/utility/research-synthesis-workflow.md`
- Mainline template: `content/utility/research-mainline-template.md`
- Author verification: `internal/author-x-account-search-sop.md`
- Repository maintenance: `internal/paper-archive-maintenance-sop.md`

Single materials live at `/papers/<slug>/`, appear exactly once in the paper index, and receive controlled paper tags. Mainlines live at `/mainlines/<slug>/`; they remain outside paper counts, tags, and review filters while participating in global search.

## Mainline Update Contract

An explicit user request to summarize a direction creates one formal mainline. Each article owns its research question, stable date-free path, classification framework, search window, material membership, cross-material comparison, evidence strength per conclusion, current judgment, and update history.

Mainlines update only on explicit user request. Adding a paper does not mutate a mainline. The mainline validator checks the independent synthesis structure, local paper targets, request-defined live canaries, and separation from the paper inventory.

## Deployment

GitHub Actions runs the source checks, builds the static site, checks generated pages, packages `dist/`, and uploads it to `papers.chlience.com`. Server setup details live in `deploy/server-setup.md`; deployment requires the `CHLIENCE_SSH_PRIVATE_KEY` GitHub secret.
