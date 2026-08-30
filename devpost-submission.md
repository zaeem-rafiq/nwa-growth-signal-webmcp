# NWA Growth Signal

> **Public submission verified August 30, 2026.** Devpost lists the project as New and embeds the current 2-minute-46-second public YouTube demo. The deployed application and reproducible public-repository evidence remain the 80-test release.

## One-line Summary

A source-backed municipal planning desk where people and browser agents share filing-level truth—and every brief stays human-reviewed.

## Inspiration

Municipal planning information is public, but procedural truth is fragmented across agendas, legal notices, hearing pages, and permit portals. A single parcel can have multiple filings with different statuses. A scheduled hearing is not an approval; a recommendation is not adoption; a planning action is not permission to build.

NWA Growth Signal started with a practical question: can an agent help someone research local development without flattening those distinctions or hiding the evidence? The first editorial sample covers Bentonville and Rogers, Arkansas, for real-estate professionals, land and development teams, local journalists, and others who need a defensible view of planning activity.

## What changed during the challenge

NWA Growth Signal was created during the submission period. The repository begins with commit `85c27f7` on August 26, 2026. The project includes the public WebMCP application, three native page-defined tools, the shared agent-human staging workflow, filing-level status safeguards, dependency-free tests, a deterministic release benchmark, responsive and accessible interface states, a public repository, and the Cloudflare deployment.

## What it does

NWA Growth Signal gives a person and their browser agent one shared planning desk. The page exposes three native WebMCP tools:

1. `search_planning_cases` filters five verified records by municipality, procedural status, residential relevance, and pending government action.
2. `inspect_case_record` returns one record with separate filing-level statuses, plain-English context, explicit non-claims, and official municipal sources.
3. `stage_source_backed_brief` places one to five records into the visible briefing workspace for human review.

Each real handler call also writes a bounded session receipt to the page, so a person can see search, inspect, and stage start and succeed or fail in order. The receipt is separate from the brief lifecycle: only the human control can record review.

The decisive example is a Rogers parcel with two different filings: `VAR26-0397` is **Withdrawn**, while `RZ26-00511` is **Scheduled**. The agent preserves both rather than collapsing the parcel into one misleading status. A single request can then search the dataset, inspect that evidence, and stage a three-record brief. Nothing is published, sent, or saved externally; the page visibly requires human review.

## Why WebMCP makes the experience better

This is a strong WebMCP fit because the agent should not guess its way through interface controls or infer legal status from loose page text. The website defines typed, bounded actions and returns structured results from the same data shown to the person. Deterministic handlers—not the model—own filtering, validation, exact status attribution, source boundaries, and the human-review gate.

That creates a better user experience in two ways. First, one natural-language request compresses repeated filtering, record inspection, and brief assembly into three accountable actions. Second, every agent action remains visible on the page with the same sources, procedural next steps, and review state the person sees.

For the fixed primary script, the executable report records eight direct human control activations or three browser-agent tool invocations under the same atomic counting rule. That is scripted interface evidence, not observed time savings or a general productivity claim.

What was difficult before becomes a genuine collaboration: the person states the research intent and retains editorial judgment; the agent searches, checks filing-level evidence, and stages the working brief; the person reviews the result before anything can leave the page. It is not a separate chatbot, a hidden automation, or a brittle script clicking through an interface.

## How we built it

The application is a dependency-free static HTML, CSS, and JavaScript site deployed on Cloudflare Pages. `site/cases.json` contains the dated editorial sample. `site/core.js` owns deterministic record operations. `site/webmcp.js` registers the three tools with `document.modelContext.registerTool`. `site/app.js` keeps manual and agent-driven state synchronized in the visible interface.

The ordinary-browser fallback preserves the complete human interface when WebMCP is unavailable. There is no database, authentication layer, external write path, or hidden publishing service. Codex supported implementation, review, testing, browser dogfooding, evidence checks, UI/UX audit work, and submission preparation. Hyperagent supported municipal research and editorial work during the challenge, and Google Gemini generated the participant-approved two-speaker demo narration.

## Challenges we ran into

The hardest problem was preserving truth at the filing level. Parcel-level summaries are tempting, but they can turn one withdrawn variance and one scheduled rezoning into a false combined status. We kept each filing explicit throughout the data, tools, interface, tests, and demo.

The second challenge was making the agent useful without giving it an unsafe side effect. The staging tool can assemble a brief, but it cannot publish, send, or persist one. The third was proving quality without overstating impact: the release benchmark measures handler behavior and task compression, not customer adoption, revenue, or unverified time savings.

## Impact validation

To test whether that problem appears in real municipal work—not only in our five-record demo—we assembled a held-out cohort of 23 Rogers planning requests from six 2025 Planning Commission and Board of Adjustment meetings. The study pairs every request with its official agenda and published minutes, covering 26 procedural events and three requests whose status changed across meetings.

NWA Growth Signal preserved 26/26 exact status events through both record inspection and brief staging; every event's expected source pair remained present in 26/26 record-wide outputs; 23/23 requests had same-meeting official agenda/minutes pairs; and all three multi-meeting lifecycles remained intact. A transparent agenda-only request-verb probe could determine only three of 23 eventual outcomes; one matched, while two approval-oriented agenda items were actually tabled. The remaining 20 outcomes were unknown from the request wording alone.

That is the practitioner risk the product addresses: a researcher who treats agenda language or one meeting as the result can miss tabling, withdrawal, denial, or a later status change. This is a real-record source-risk validation—not a user study, automated-ingestion result, or claim of time, revenue, adoption, or changed decisions.

## Accomplishments that we're proud of

- Three native WebMCP tools running on the public deployment.
- One browser-verified request driving search, inspection, and visible brief staging end to end.
- Three succeeded page receipts reading `5 verified records matched`, `RZ26-00511 · Scheduled`, and `3 filings staged · human review required` in one live browser session.
- Eight of eight filing-status checks preserved across five source-backed records.
- Five of five records constrained to official municipal-source domains.
- Eighty passing tests, all three tools exercised, zero approval overclaims in the deterministic release benchmark, and a passing 23-request held-out historical study.
- Exact core-to-adapter equality across a primary and counter-scenario, including filing/status pairs, sources, audience, freshness, standing note, and review requirement.
- A live, bounded execution receipt that remains distinct from the human-only review action.
- A fail-closed September 2 re-verification boundary that preserves last-verified statuses while blocking release readiness.
- A keyboard-accessible, responsive interface with loading, empty, error, retry, disabled, focus, and copy-recovery states.
- A clear human-control boundary: three records staged, review required, nothing published.

## What we learned

Agent-native design is less about adding chat and more about defining trustworthy actions between human intent and application state. The model is valuable for choosing and sequencing tools; exact municipal status, validation, source boundaries, and irreversible actions belong in deterministic code.

We also learned that human review works best when it is part of the shared product surface rather than a disclaimer after the fact. A person should be able to see what the agent selected, inspect why, and understand what has—and has not—happened.

## What's next for NWA Growth Signal

The immediate release requirement is to re-verify the official records when the snapshot reaches its inclusive September 2 boundary. From there, the project could add repeatable ingestion from official municipal records, status-change diffs, and coverage for more Northwest Arkansas cities while preserving the same filing-level evidence and human-review contract. Any future publishing or alerting workflow would remain explicitly user-approved.

## Testing Instructions

Live judge flow:

1. Open https://nwa-growth-signal-webmcp.pages.dev/ in a browser host with WebMCP support.
2. Confirm that the page reports `WebMCP ready · 3 tools exposed`.
3. Ask: “Find residential Bentonville and Rogers cases still awaiting procedural action. Inspect their official evidence and stage a three-item brief without representing any recommendation as final approval.” Keep the host prompt and page visible through all three calls.
4. Inspect `RZ26-00511`; verify that `VAR26-0397` remains `Withdrawn` while `RZ26-00511` is `Scheduled` in the August 25 snapshot.
5. Stage `RZ26-0041`, `RZ26-00419`, and `RZ26-00511`; verify three succeeded receipt rows, the exact three filings, human review required, and nothing published.
6. Confirm the freshness summary is current for the release date. If it is due, stop and re-verify the official records.
7. Open the CivicPlus, Regrid, and PermitFlow links in the comparison ledger and confirm that the copy uses affirmative job descriptions rather than capability-absence claims.

Local reproduction from the repository root:

```sh
python3 -m http.server 8000 --directory site
node --test tests/*.test.js
node scripts/benchmark.js 2026-09-01
node scripts/historical-impact-benchmark.js
```

The expected automated result is 80 passing tests; a fresh release benchmark with `release_ready: true`, 2/2 exact parity scenarios, 8/8 filing-status checks, 5/5 municipal-source records, 3/3 tools exercised, zero approval overclaims, and the raw eight-control/three-tool traces; and a historical study with 23 requests, 26/26 exact statuses through both product paths, expected-source presence in 26/26 record-wide outputs, 23/23 same-meeting official source pairs, three preserved multi-meeting lifecycles, and zero challenge-period leakage. `node scripts/benchmark.js 2026-09-02` is expected to exit non-zero with `reverification_due` until the official snapshot is refreshed.

## Public Demo Link

https://nwa-growth-signal-webmcp.pages.dev/

The production deployment was verified August 29, 2026. One native WebMCP session returned all three succeeded receipt rows, the current freshness state, the exact three-filing brief, and `review_required: true` with no console errors.

## Public Repository Link

https://github.com/zaeem-rafiq/nwa-growth-signal-webmcp

The repository is public and includes an MIT license.

## Demo Video

- Runtime: 2 minutes 46 seconds
- Format: 1280×720 H.264/AAC with a published 31-cue English (United States) track
- Narration: Google Gemini Kore host and Iapetus expert; participant-approved August 30, 2026
- Public YouTube URL: https://youtu.be/N1ykmBzcf4Y

The public demo identifies the fragmented-record problem and the Northwest Arkansas land-analyst user in its first 16.2 seconds. It then shows search, inspection, and staging as three action-state-payoff sequences, including the split-filing Poplar record and the separate human-review boundary.

## Submission Readiness Notes

- Live application: ready; the deployed search, inspect, stage, freshness, and human-review workflow was browser-verified August 29, 2026 with three succeeded receipt rows and no console errors.
- Public repository and visible license: ready.
- Automated checks and deterministic benchmark: ready.
- Current demo content, technical QA, and participant listening approval: ready.
- Current public YouTube video: published and browser-verified August 30, 2026 at https://youtu.be/N1ykmBzcf4Y.
- YouTube captions: the 31-cue English (United States) track and timestamped transcript are public; the player caption control remained inconsistent during the latest check.
- Country-of-residence form answer: United States, confirmed by the participant August 28, 2026.
- September 1 scheduled and tabled records: require a final source-status check before the entry is locked.
- Devpost submission: completed and browser-verified August 30, 2026 at https://devpost.com/software/nwa-growth-signal with video ID `N1ykmBzcf4Y` embedded.
- Public “About the project” story: browser-verified August 30, 2026 with created-during-submission provenance and the 80-test public-release evidence.
- Receipt/parity/freshness/comparison release: live and browser-verified on the public deployment, Devpost page, and revised YouTube demo.

## Sourced Adjacent-Workflow Context

Official pages checked August 28, 2026 describe [CivicPlus](https://www.civicplus.com/agenda-meeting-management/) as agenda and meeting management, [Regrid](https://regrid.com/property-app) as a parcel and property-map application, and [PermitFlow](https://www.permitflow.com/) as permitting workflow software. NWA Growth Signal's specific job is a dated, filing-level planning evidence desk shared by people and browser agents. This is an affirmative comparison, not a claim that another product lacks a capability.

## Known Limitations

- The dataset is a five-record editorial snapshot verified August 25, 2026, not a live municipal database.
- Scheduled and tabled records require re-verification after the September 1 meetings.
- The release benchmark proves handler behavior, pinned release-data fidelity, and municipal-domain boundaries. The historical benchmark proves status preservation after manual structuring; it does not prove automated extraction accuracy, customer adoption, revenue, time saved, or changed practitioner decisions.
- The eight-control versus three-tool result applies only to the declared script and is not observed user-effect evidence.
- YouTube exposes the timestamped transcript, but the public-player caption control remained inconsistent during the latest check.
- Source relevance and factual support remain manually verified.
- The downloadable PDF is a visual sample and is not tagged for assistive technology.
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
- **AI tools used (28258):** Codex, Hyperagent, and Google Gemini neural speech generation.
- **Learning level (28259):** Significant
- **Career AI value (28260):** Yes
- **Required public video:** https://youtu.be/N1ykmBzcf4Y
