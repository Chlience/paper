# Author X/Twitter Account Discovery & High-Confidence Verification SOP

**Purpose**  
Find **personal X (Twitter) accounts** belonging to paper/project authors (especially AI/ML systems, Chinese research teams) with **high confidence only**. Rely on bios, self-referential posts/comments, GitHub signals, and cross-attributions rather than name similarity alone. Explicitly document "no high-confidence account found" when evidence is insufficient.

This SOP was reverse-engineered from successful verification of slime (2026-06-17-slime-rl-scaling-framework.md) + GLM-5 overlapping authors (Zilin Zhu / zhuzilin, Chengxing Xie, Xin Lv).

## When to Apply
- Immediately after drafting or updating any paper note that contains an "作者与关系" (or equivalent Authors) section.
- For citation authors, corresponding authors, GitHub release owners/maintainers, core contributors, tech leads, and direct org overlaps.
- Reusable across the entire paper archive (cross-reference papers-index.md and linked notes).

## Tools (in this environment)
- **Default search driver**: Grok via the local `grok-subagent` wrapper. Use `--mode search`, which routes to `grok-build` with web/search enabled.
- `x_user_search` / `x_keyword_search` / `x_semantic_search` / `x_thread_fetch` when directly available, mainly for follow-up verification on promising handles.
- `web_search` + `browse_page` / `open_page` / `web_fetch` for independent cross-validation: GitHub profiles, personal sites, blogs, community credits, institutional pages.
- Local: `read_file`, `grep` on target .md + papers-index.md + other notes
- Optional: GitHub web pages for bios, Zhihu links, lmsys-style blogs

## Default Grok Search Protocol

Use Grok first for broad discovery and candidate expansion. This SOP was written in a style that can be passed directly to Grok; give Grok the SOP, the target paper note, and the extracted candidate list so it can reuse the same verification criteria.

Recommended command shape:

```bash
python3 /home/chlience/.agents/skills/grok-subagent/scripts/grok_subagent.py \
  --mode search \
  --prompt-file /tmp/author-x-search-task.md
```

Recommended prompt-file structure:

```text
Today is YYYY-MM-DD.

You are searching for high-confidence personal X/Twitter accounts for authors in this paper archive.

Read and follow this SOP exactly:
<paste author-x-account-search-sop.md>

Target paper note:
<paste Source + 作者与关系 sections, or a concise extracted summary>

Candidate authors:
<English name, Chinese name if known, affiliation, GitHub/homepage/project clues>

Output contract:
1. Table: author, candidate X handle, confidence, personal/project/lab account, final decision.
2. Evidence bullets with URLs for every medium/high candidate.
3. "None found" for authors without enough evidence.
4. Separate non-personal project/lab accounts.
5. Do not rely on name similarity alone.
```

After Grok returns candidates, **do not write results directly**. Re-check high and medium candidates with independent sources before updating `authors.json`.

## High-Confidence Criteria (Strict)
Report an account **only if** there are **multiple independent strong signals** (ideally 3+):
- Exact/near-exact bio match to known GitHub or personal homepage self-description + project/org.
- Self-identification in posts (first-person "I am a slime contributor", "our main focus is RL training for chat.z.ai", roadmap statements, direct comments on the project's CI/PRs).
- GitHub activity (release publisher, specific PRs) mirrored in X behavior.
- External attribution (web posts, community credits, Zhihu Frontier, co-author mentions) that explicitly pairs the human name with the X handle or activity.
- Institutional + project consistency (Tsinghua, Z.ai / zai-org, THUDM, GLM family, exact framework name).
- Chinese name / alias consistency where available (e.g. 朱小霖 → Zilin Zhu variants).

**Do not** report on:
- Name-only matches with no supporting signals.
- Low-signal accounts (bio vaguely similar, no project-specific posts).
- Project/org accounts (note them separately as non-personal).

Confidence labels: **High** (strong multi-signal) | **Plausible / Medium** (notable signals but gaps — document explicitly) | None found.

## Step-by-Step Workflow

### Phase 1: Extract & Normalize Authors (Start Here)
1. Read the target paper `.md` (focus on "作者与关系", Source, and any cross-paper links).
2. Pull:
   - Citation authors (exact list).
   - Corresponding author(s).
   - GitHub signals (release owner, top contributors from text or implied).
   - Overlaps from linked notes (e.g., GLM-5 tech leads / core contributors).
3. Normalize variants for each person:
   - English full name
   - GitHub handle (if mentioned)
   - Possible Chinese characters / pinyin (from homepages or later discovery, e.g. 吕鑫, 朱子林/朱小霖, 谢程兴)
   - Org/role shorthand ("RL infra @Z.ai", "PhD Tsinghua slime", "corresponding author slime")
4. Quick local grep across papers-index.md and related notes for additional context or duplicates.
5. Output a clean candidate list before touching X.

**Example from slime case**:
- Zilin Zhu (GitHub: zhuzilin) — release publisher, core contributor in GLM-5
- Chengxing Xie — citation + core contributor
- Xin Lv — corresponding author, GLM-5 tech lead

### Phase 2: Grok Broad Search (Default First Pass)
Run Grok with the SOP and the candidate list before direct manual X searches. Ask it to search broadly across X, web, GitHub, personal sites, Chinese-language sources, lab/project announcements, and community mentions.

Grok should return:
- candidate handles, including rejected weak matches;
- direct URLs for evidence;
- whether each account is personal, project, lab, or unrelated;
- exact reasons for confidence;
- missing evidence that prevents a high-confidence decision.

Use Grok's result as a hypothesis set, then proceed to manual cross-validation.

### Phase 3: Enrich External Profiles (Parallelizable)
For each candidate:
- GitHub: 
  - `web_search` or direct browse `https://github.com/{handle}` or `"name" github`.
  - Capture bio (often the gold signal: "☀️ RL infra @Z.ai, ex WeChat AI"), location, pinned repos (slime), links (Zhihu, .github.io), "No Twitter Username" note (does **not** rule anything out).
- Personal / academic sites: Search `"name" github.io` or follow links from collaborator pages. Extract role statements (e.g., "I lead the O Team... maintains slime").
- Web search templates (run several):
  - `"Full Name" OR "GitHubHandle" (Twitter OR "X.com" OR @) (project OR org)`
  - `"Name" (slime OR GLM OR "Z.ai" OR Tsinghua) (Twitter OR X)`
  - Project announcement pages (lmsys.org blog, GitHub release notes).
- Note any Chinese platform signals (Zhihu username patterns often match GitHub).

### Phase 4: Direct X Discovery (Broad → Targeted, If Needed)
1. If Grok did not produce enough evidence, run multiple `x_user_search` in parallel:
   - Pure name: "Zilin Zhu", "Chengxing Xie", "Xin Lv"
   - Name + strong context: "Zilin Zhu Z.ai", "Chengxing Xie Tsinghua", "Xin Lv GLM OR Zhipu OR slime"
   - GitHub handle as query: "zhuzilin"
   - Project / org accounts: "slime_framework", "Z.ai GLM", "Zhipu"
2. Review top results for **bio quality** first (exact phrases win).
3. Also search variations and Chinese names once you discover them.
4. Record promising handles immediately (even low-follower ones if bio matches perfectly).

**Useful pattern**: One early hit had the exact GitHub bio copied into an X profile — treat as strong hypothesis to verify next.

### Phase 5: Verification via Posts & Behavior (Most Important Phase)
For every promising handle, execute deep checks:

- Basic activity: `x_keyword_search` with query `from:handle` (mode=Latest, limit 5–10). Read the actual content.
- Project-specific: `from:handle (slime OR "Z.ai" OR GLM OR roadmap OR contributor OR CI OR "chat.z.ai")`
- Self-identification hunting: Look for quotes like:
  - "As a slime contributor..."
  - "Huge shoutout to slime-agentic... built on the slime RL framework"
  - "nvfp4 will on the roadmap for slime... our main focus is the RL training for https://chat.z.ai"
  - Direct comments on project CI/PRs ("调了一天 conda 的 ci")
- Community side: `x_keyword_search` `"Chengxing Xie" slime`, `from:slime_framework` (name), or semantic searches.
- If a post looks like insider knowledge, run `x_thread_fetch` on its ID for replies/quote context.
- `x_semantic_search` for "Zilin Zhu slime developer Z.ai" or similar to surface discussions.

**Key verification mindset**: Does the person talk about the project **as if they build/maintain it**? Does activity align with known GitHub actions (releases, specific PRs)?

### Phase 6: Cross-Validation & Final Confidence Decision
Combine signals across sources:
- Bio match + self-post = very strong.
- GitHub PR activity echoed in X comment + community credit = strong.
- Zhihu attribution explicitly tagging the X handle (e.g. "@朱小霖 @zhuzilinallen") + content match = strong.
- Multiple external pages (lmsys, GitHub rankings, collaborator sites) reinforcing the same person + project.

**Decision rules**:
- **High**: 2+ independent strong signals + no contradictions.
- **Plausible**: Good bio or one strong post but missing corroboration — note the gaps.
- **None**: No account meets threshold. State clearly.

Always separate:
- Personal author accounts.
- Project accounts (e.g. @slime_framework — document its bio/followers/credit style but label as non-personal).

### Phase 7: Document Results
Recommended output format (add to the paper note or a tracking section):

**Author: Chengxing Xie**
- X: [@Chengxing_Xie](https://x.com/Chengxing_Xie)
- Confidence: **High**
- Reasons:
  - Bio (exact): "Building LLM RL + agentic training infra. PhD student @ Tsinghua University Open-source: slime / SGLang"
  - Post (2026-04-07): "Huge shoutout to slime-agentic, a community project built on the slime RL framework..."
  - Post (2026-03-11): "As a slime contributor, I'm thrilled to see this project: A fully asynchronous RL training framework built on slime"
  - Community corroboration: Multiple credits pairing the name with slime integrations and co-authors (Zilin Zhu et al.).
  - Perfect institutional + project alignment.

**Author: Zilin Zhu**
- X: [@zhuzilinallen](https://x.com/zhuzilinallen) (display: zhuzilin / 朱小霖)
- Confidence: **High**
- Reasons:
  - GitHub (zhuzilin): "☀️ RL infra @Z.ai, ex WeChat AI"; release publisher and core maintainer of slime.
  - Post: "nvfp4 will on the roadmap for slime... our main focus is the RL training for https://chat.z.ai/"
  - Post quoting slime_framework CI: "调了一天 conda 的 ci" (matches known PR activity).
  - External: Zhihu Frontier X post attributes slime v0.3.0 insights to "@朱小霖 @zhuzilinallen"; GitHub Zhihu link consistency.
  - Bio intent ("非技术内容") explains lower volume of tech posts while still containing high-signal ones.

**Author: Xin Lv**
- X: None found with high confidence.
- Notes: Personal site (davidlvxin.github.io) confirms "Researcher @ Zhipu AI... lead the O Team... maintains slime". No matching X handle surfaced despite targeted searches.

Also note the project account separately if useful:
- @slime_framework: Official framework account (bio + follower count). Frequently credits individual contributors.

### Phase 8: Follow-ups & Archival
- If new high-confidence links appear, update the paper note's "作者与关系" and papers-index.md author clusters.
- Optionally re-check low-activity candidates later (new posts can appear).
- For future papers: Repeat from Phase 1; reuse the same query templates.

## Common Patterns & Chinese AI Community Nuances
- GitHub bios are often the highest-signal single source (copy-paste into X sometimes).
- X follower counts can be very low (0–100) for serious infra people; do not dismiss.
- "No Twitter Username" in third-party GitHub rankings is common even when an account exists.
- Many researchers prioritize Zhihu + GitHub + internal comms. X may be lightly used for non-tech + occasional tech notes.
- Handles are not always literal (zhuzilinallen vs zhuzilin_dev).
- Chinese name searches become powerful once discovered (via homepages or attributions).
- Project accounts (@slime_framework) are useful context but not personal author accounts.
- Self-referential language ("our main focus", "as a ... contributor") is the strongest verifier.

## Reusability & Maintenance
- Keep this SOP in the repo root.
- When using: Start a scratch file or Notion with the candidate list + queries tried.
- Evolve the SOP: Add new successful query templates or verification signals as you apply it to more papers.
- Reference in paper-analysis-workflow.md or AGENTS.md if desired for future authors.

## Example Successful Run (slime + GLM-5, 2026-06-17 context)
See the conversation history for the exact sequence of tool calls and evidence that produced the two high-confidence matches above. The process took focused parallel searches + iterative post verification.

---

**Created**: 2026-06-17 (distilled from live author X search on slime/GLM authors).  
**Reuse**: `@author-x-account-search-sop.md` or open directly. Always demand high-evidence standards — better to report "none" than a weak guess.
