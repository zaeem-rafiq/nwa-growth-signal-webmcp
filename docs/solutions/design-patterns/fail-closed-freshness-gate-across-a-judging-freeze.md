---
title: Plan a fail-closed freshness gate around a judging freeze so the due state reads as design, not neglect
date: 2026-09-02
category: design-patterns
module: snapshot-freshness
problem_type: design_pattern
component: development_workflow
severity: medium
applies_when:
  - "A product ships a dated snapshot of external records with a re-verification date and a fail-closed release gate"
  - "The deployment must stay untouched for a fixed window (hackathon judging, audit, contract freeze) that outlasts the snapshot's boundary"
  - "Evaluators will open the live product during that window without context on the release process"
tags: [freshness-gate, fail-closed, snapshot, judging-window, deployment-freeze, release-gate, ux-copy]
---

# Plan a fail-closed freshness gate around a judging freeze so the due state reads as design, not neglect

## Context
NWA Growth Signal serves a dated municipal-record snapshot. `site/core.js:8` pins `verified_at` and `reverify_on`, and `evaluateSnapshotFreshness` (`site/core.js:16`) returns `reverification_due` once the civil date reaches the boundary (`site/core.js:27`). The release benchmark then reports `release_ready: false` (`scripts/benchmark.js:228` and `:239`) and exits non-zero (`scripts/benchmark.js:253`). That is the intended contract: statuses stay as last verified and nothing is released on stale data.

The gap surfaced on September 2, 2026, the original boundary date, one day before a hackathon deadline followed by an 18-day judging window in which the WebMCP Challenge rules forbid any change to the submission. Left alone, the live page would have shown a red "Official re-verification required ... before release" warning to every judge, the data was already wrong after the September 1 hearings, and the only two "fixes" on hand were both bad: refresh the data after the deadline (a rule violation) or move the boundary past judging (dishonest, and contrary to the gate's purpose).

## Guidance
Handle the three concerns separately, all before the freeze begins.

1. **Re-verify at the boundary and set the next boundary honestly.** Check every record against its official source, update the data, and set `reverify_on` to the next date on which an official body can actually change a tracked record. Here that was September 8, the next City Council date in both cities (`site/core.js:8`). Do not pick a date because it lands after the freeze.

2. **Make the due state informational, not a release alarm.** The gate is a release control; the page is read by people who are not releasing anything. The due copy now says what a reader needs (`site/app.js:63-64`): last verified date, that official records may have changed on or after the boundary, that statuses are shown as last verified, and to confirm with the city before relying on an item. The state colour moved from red to amber (`site/styles.css:229`). The benchmark gate itself did not change; `node scripts/benchmark.js 2026-09-08` still fails closed, and the tests pin that (`tests/benchmark.test.js:182`, `tests/app.test.js:452`).

3. **State the freeze in the repository before it starts.** One sentence in the README's evidence boundary says the deployment is frozen from the deadline through judging, so from the boundary date the page reports re-verification due by design and every status shown is the one verified on the last check (`README.md:58`). Put the same sentence in the public submission's limitations. After the deadline, touch nothing: not the site, not `main`, not the submission.

Keep the reproduction commands date-explicit so they keep passing during the freeze. The README and testing instructions run `node scripts/benchmark.js 2026-09-02`, the verified date, and show `2026-09-08` only as the expected-failure example (`README.md:45`). A dateless run defaults to today and would go red mid-window; the CI workflow runs one but only on push, so nothing goes red on its own.

## Why This Matters
A fail-closed gate is only credible if it is allowed to close. Moving the boundary to hide the due state would have turned the product's central claim, that it never presents stale status as current, into a cosmetic one. Refreshing the data during the freeze would have risked disqualification. Leaving the red warning would have read as an abandoned project. Separating the release control from the reader-facing copy lets the gate stay strict while the page stays honest and calm, and the pre-announced freeze turns the due state into evidence that the gate works.

## When to Apply
- Any snapshot-backed product with a scheduled re-verification and an evaluation or freeze window longer than the interval between boundaries.
- Any time a "release gate" state is rendered to end users: ask whether the copy is addressed to the releaser or the reader, and write for the reader.
- Before a deadline that forbids changes: search the live copy, README, and submission text for dates that will pass during the window and decide what each one will say on the far side.

## Examples
Due-state copy before, addressed to the releaser:

> Official re-verification required. Snapshot due 2026-09-02. Procedural statuses are unchanged; official re-verification is required before release.

Due-state copy after, addressed to the reader (`site/app.js:63-64`):

> Re-verification due. Last verified 2026-09-02. Official records may have changed on or after 2026-09-08; statuses are shown as last verified. Confirm current status with the city before relying on an item.

Freeze sentence in the README evidence boundary (`README.md:58`):

> The judged deployment is frozen from the September 3, 2026 submission deadline through judging, so from September 8 the live page reports re-verification due by design; every status shown is the one verified September 2.

## Related
- `docs/solutions/integration-issues/cloudflare-pages-deploy-preview-vs-production.md`, how the September 2 refresh actually reached production.
- `docs/hackathon/EVIDENCE.md`, sections "September 2, 2026 re-verification" and "Release gate".
- PR #6 (re-verification and due-state copy), PR #10 (README freeze sentence).
