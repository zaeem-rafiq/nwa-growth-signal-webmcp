# NWA Growth Signal

> **Facts and production snapshot verified September 2, 2026.** Production serves the September 2 release (all six site files match `main` commit `c579912`); the native three-tool run in the ChatGPT desktop browser was completed against it on September 2. The four-tool, 94-test release is the September 3 candidate and, as of this commit, is not yet on production; the live judge flow below describes that candidate. The video was re-recorded September 2 against the four-tool release, so its on-screen statuses match the September 2 snapshot.

## One-line Summary

A source-backed municipal planning desk where people and browser agents share filing-level evidence, with human review before anything leaves the page.

## Inspiration

An agenda-wording-only heuristic could determine just 3 of 23 real planning outcomes, and 2 of those 3 were wrong: the wording implied approval for requests that were actually tabled. This week, Rogers changed an existing `8/18/26` outcome row in place from `Tabled to 9/1` to `Recommended to City Council`, with no separate September 1 row. That is the kind of quiet procedural change that can burn land and development teams, lenders and title professionals, local journalists, and public-interest planners in Northwest Arkansas.

Municipal records are public, but the procedural truth is scattered across agendas, minutes, outcome tables, hearing pages, and companion filings. One parcel can have several filings with different statuses. NWA Growth Signal gives a person and a browser agent a dated, filing-level planning evidence desk for Bentonville and Rogers, Arkansas.

Adjacent products serve related jobs. CivicPlus provides agenda and meeting management. Regrid provides a parcel and property map. PermitFlow provides permitting workflow. NWA Growth Signal focuses on the evidence handoff between a researcher and an agent as official planning records change.

## What it does

### Why is this a strong fit for WebMCP?

The research task has four distinct steps, each with a clear contract. `search_planning_cases` filters 5 verified records by municipality, procedural status, residential relevance, and pending government action. `list_status_changes` returns the filings whose verified status moved since the previous check, with the official source on both dates. `inspect_case_record` returns one filing-level record with its context and official sources. `stage_source_backed_brief` places 1 to 5 selected records into the visible briefing workspace. The agent receives typed results from the same dated data the person sees instead of inferring status from page wording or clicking by coordinates.

### How does it create a better experience?

One prompt can drive the whole flow: “Find residential Bentonville and Rogers cases still awaiting procedural action. List which filings changed status since the previous verification, inspect their official evidence, and stage a three-item brief without representing any recommendation as final approval.” The fixed demo script takes 10 direct human control activations or 4 agent tool calls. Each real handler call adds an on-page receipt, so the person can see search, list changes, inspect, and stage start and then succeed or fail in order.

### What can people and agents now do together?

The person states the research intent and keeps editorial judgment. The agent searches, inspects the filing-level evidence, and stages the brief. The person can check every selected filing and source before using it. The staging tool cannot publish, send, or persist a brief, and only a human control can record review.

### How did we implement WebMCP?

The page registers all 4 tools atomically with `document.modelContext.registerTool` after the record set loads and supports `AbortSignal`. Handler inputs are validated. The 3 read tools carry `readOnlyHint` annotations. Search, inspection, staging, the ordinary browser interface, and the receipt row all use the same deterministic record operations, so the agent and person work from one application state.

Every filing also carries a `status_history`: its August 25 and September 2 statuses, the official source checked on each date, and a note where the record moved or went silent. The tools return it through their existing outputs, and the page shows the same line beside each filing, so an agent inspecting `RZ26-00419` sees Tabled on August 25 and Recommended on September 2 with the same outcome-table URL for both, not a single current label.

A fourth tool, `list_status_changes`, landed after the video was recorded. It reads that same `status_history` and returns the filings whose verified status moved between the previous check and the current one: `RZ26-00419` (Tabled to Recommended) and `RZ26-00511` (Scheduled to Recommended), each with the official source checked on both dates. With `changed_only` set to false it also lists the six unchanged filings and their notes, such as `FP26-0005` absent from the reissued agenda. It is read-only, registered atomically with the other three, and writes the same on-page receipt: `2 filings changed since 2026-08-25.`

## What changed during the challenge

The project was created during the challenge. Its first commit was `85c27f7` on August 26, 2026. In the 8 days since the first snapshot, the official record moved 4 times across just 5 tracked records:

1. Rogers `RZ26-00511`, Poplar Street Paired Homes at 408 E. Poplar, moved from Scheduled to a `9/1/26` outcome of `Recommended to City Council`. Its companion filing on the same parcel, `VAR26-0397`, still reads `Withdrawn by applicant`. The split-filing result is now Withdrawn plus Recommended, and council action is still pending.
2. Rogers `RZ26-00419`, 209 W. Locust, changed inside the same `8/18/26` row. On August 25 it read `Tabled to 9/1`; on September 2 it reads `Recommended to City Council`. The table publishes no separate September 1 row.
3. Bentonville `FP26-0005`, Brier Hill Phase II final plat, appeared on the September 1 agenda published August 25 as CivicClerk file `9108`. The city reissued that agenda as file `9133` without the filing. No reason, outcome, or new date is published, so the product keeps the filing visible with its last published status and states what changed.
4. Rogers `RZ26-00345`, 6253 S. Mt Hebron Rd, disappeared from the outcome table. No City Council action appears in the official sources reviewed, so the product retains the last recorded status, Recommended, and says the row is gone.

Bentonville `RZ26-0041`, `FP26-0003`, and `FP26-0004` were heard September 1 according to the agenda. Minutes are not yet published, so the product represents no outcome for them.

We also tested the approach on a held-out historical study: 23 real Rogers requests, 26 procedural events, 6 meetings in 2025, and 12 official agenda and minutes documents. NWA Growth Signal preserved 26/26 exact statuses through both inspection and staging. Expected source pairs were present in 26/26 record-wide outputs. All 23/23 same-meeting agenda and minutes pairs were present, and 3 multi-meeting lifecycles stayed intact. The request wording left 20 of 23 outcomes unknowable; as the opening example shows, it also gave the wrong answer for 2 of the 3 outcomes it appeared to reveal.

## How we built it

NWA Growth Signal is a dependency-free static HTML, CSS, and JavaScript site deployed on Cloudflare Pages. A dated JSON snapshot holds the editorial sample. Shared JavaScript owns deterministic filtering, record inspection, brief staging, freshness checks, and receipts. The WebMCP adapter and the ordinary browser interface call those same operations.

The release has 94 passing dependency-free tests, a deterministic benchmark, and a fail-closed freshness gate. The team used Codex and Claude Code for implementation, review, testing, and submission work; Hyperagent for municipal research and editorial work; and Google Gemini for the approved demo narration.

## Challenges we ran into

The hardest part was preserving truth at the filing level while the official record kept moving. A parcel summary would hide the difference between a withdrawn variance and a rezoning recommended to City Council. We carried each filing, status, source, and date through the data, tools, interface, benchmark, and demo.

The other hard boundary was useful agent action without an unsafe side effect. Staging had to be visible and valuable while leaving review and any later use of the brief with the person.

## Accomplishments that we're proud of

- A complete public planning desk with 4 native WebMCP tools over 5 verified records.
- One browser request that searches, inspects, and stages a source-backed brief, with a live receipt for every handler call.
- 94 passing tests, all 4 tools exercised, input validation, atomic registration, cancellation support, and a fail-closed freshness gate.
- Exact preservation of 26/26 historical status events, 26/26 expected source pairs, 23/23 same-meeting source pairs, and 3 multi-meeting lifecycles.
- A visible human-review boundary with no publish, send, or persistence path in the staging tool.
- Loading, empty, error, retry, disabled, focus, copy-recovery, responsive, and keyboard-accessible interface states.

## What we learned

Agent-native design starts with trustworthy actions, not a chat box. The model is good at choosing and sequencing tools. Exact municipal status, source boundaries, validation, freshness, and irreversible actions belong in deterministic application code.

We also learned that a source link is not enough. A useful evidence desk must preserve which filing the source supports, when the status was verified, what changed, and where the record is still silent.

## What's next for NWA Growth Signal

Next we want repeatable ingestion from official municipal records, status-change diffs across more than two verification dates, and coverage for more Northwest Arkansas cities. We would keep the same filing-level evidence model, freshness gate, visible receipts, and human-review boundary. Any future alerting or publishing action would require explicit user approval.

## Testing Instructions

Live judge flow:

1. Open https://nwa-growth-signal-webmcp.pages.dev/ in a browser host with WebMCP support.
2. Confirm that the page reports `WebMCP ready · 4 tools exposed`.
3. Ask: “Find residential Bentonville and Rogers cases still awaiting procedural action. List which filings changed status since the previous verification, inspect their official evidence, and stage a three-item brief without representing any recommendation as final approval.” Keep the host prompt and page visible through all four calls.
4. Inspect `RZ26-00511`; verify that it reads `Recommended to City Council` while companion filing `VAR26-0397` reads `Withdrawn by applicant` on the same parcel. Do not treat the recommendation as final council action.
5. Stage `RZ26-0041`, `RZ26-00419`, and `RZ26-00511`; verify four succeeded receipt rows, the exact three filings, human review required, and nothing published.
6. Confirm the freshness output says `verified_at: 2026-09-02` and re-verification is due `2026-09-08`.
7. Confirm that `list_status_changes` returned exactly `RZ26-00419` (Tabled to Recommended) and `RZ26-00511` (Scheduled to Recommended), each with the Rogers outcome-table URL for both dates, and that the receipt row reads `2 filings changed since 2026-08-25.`
8. Open the CivicPlus, Regrid, and PermitFlow links in the comparison ledger and confirm that the copy uses affirmative job descriptions.

Local reproduction from the repository root:

```sh
python3 -m http.server 8000 --directory site
node --test tests/*.test.js
node scripts/benchmark.js 2026-09-02
node scripts/historical-impact-benchmark.js
```

The expected automated result is 94 passing tests; a release benchmark with `verified_at: 2026-09-02`, re-verification due `2026-09-08`, `release_ready: true`, 2/2 exact parity scenarios that each include the status-change listing, the two changed filings `RZ26-00419` and `RZ26-00511`, 8/8 filing-status checks, 5/5 municipal-source records, 4/4 tools exercised, zero approval overclaims, and the raw ten-control/four-tool traces; and a historical study with 23 requests, 26/26 exact statuses through both product paths, expected-source presence in 26/26 record-wide outputs, 23/23 same-meeting official source pairs, 3 preserved multi-meeting lifecycles, and zero challenge-period leakage. `node scripts/benchmark.js 2026-09-08` is expected to exit non-zero with `reverification_due` as the due-date example.

## Public Demo Link

https://nwa-growth-signal-webmcp.pages.dev/

Production was verified September 2, 2026: every site file matches the merged commit, the page reports the snapshot as current with re-verification on 2026-09-08, the human path staged the three-record brief with review required, and the browser console had no warnings or errors at 1440 and 375 pixels.

## Public Repository Link

https://github.com/zaeem-rafiq/nwa-growth-signal-webmcp

The repository is public and includes an MIT license.

## Demo Video

- Runtime: 2 minutes 51 seconds
- Format: 1280×720 H.264/AAC with a published 34-cue English (United States) track
- Narration: Google Gemini Kore host and Iapetus expert; participant-approved September 2, 2026
- Public YouTube URL: https://youtu.be/Bj0qcwkuwas (replaces the three-tool cut at https://youtu.be/N1ykmBzcf4Y)

The demo shows search, the status-change listing, inspection, and staging as four action-state-payoff sequences, including the split-filing Poplar record and the human-review boundary.

## Submission Readiness Notes

- Live application: September 2 snapshot deployed to production and verified, including the native three-tool run in the ChatGPT desktop browser on September 2.
- Public repository, MIT license, automated checks, and deterministic benchmark: ready.
- Public video and narration approval: four-call cut approved and published September 2, 2026.
- Devpost entry: browser-verified August 30, 2026 at https://devpost.com/software/nwa-growth-signal.
- Next source re-verification: September 8, 2026.

## Known Limitations

- The product contains 5 manually structured and verified records, not a live municipal database or automated ingestion pipeline. Official changes between refreshes require another source review.
- `Recommended to City Council` means council action is pending. The current sources support no claim that these recommendations were approved, adopted, or denied.
- Published gaps remain visible: Bentonville minutes are pending, `FP26-0005` vanished between agenda versions, and the Rogers `RZ26-00345` outcome row is gone.
- The benchmarks measure deterministic handler behavior and status preservation after manual structuring. They do not measure automated extraction accuracy, adoption, revenue, time saved, or changed decisions.
- The downloadable PDF is not tagged for assistive technology, and the YouTube player's public caption control was inconsistent during the latest check even though the timestamped transcript is public.
- Agent-side recovery after an initial record-load failure would require a public tool-contract change and is not included.

## TODO Official Form Fields

Official fields last verified August 30, 2026:

- **Submitter Type (28249):** Individual
- **Country of residence (28250):** United States
- **Organization name (28251, optional):** Not applicable
- **App Status (28252):** New
- **Existing-project update (28253):** Leave blank; App Status is New.
- **Live URL (28254):** https://nwa-growth-signal-webmcp.pages.dev/
- **Testing instructions (28255):** Use the live judge flow under “Testing Instructions” above. No credentials are required.
- **Public code repository (28256):** https://github.com/zaeem-rafiq/nwa-growth-signal-webmcp
- **Tested agents or clients (28257):** Codex in-app browser with native WebMCP support. The ordinary-browser fallback is covered separately by the automated interface tests.
- **AI tools used (28258):** Codex, Claude Code, Hyperagent, and Google Gemini neural speech generation.
- **Learning level (28259):** Significant
- **Career AI value (28260):** Yes
- **Required public video:** https://youtu.be/Bj0qcwkuwas
