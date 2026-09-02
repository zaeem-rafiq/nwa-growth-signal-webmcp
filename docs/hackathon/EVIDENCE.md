# Hackathon Evidence

This document separates executable proof from claims that still need external confirmation.

## Central loop

One agent request drives three native WebMCP actions in the same interface, and a fourth read-only tool answers what moved between verifications:

1. `search_planning_cases` finds bounded Bentonville and Rogers records.
2. `inspect_case_record` returns filing-level status, non-claims, and official municipal URLs.
3. `stage_source_backed_brief` updates the visible brief workspace and requires human review.
4. `list_status_changes` lists the filings whose verified status moved between the previous check (August 25) and the current one (September 2), each with the official source consulted on both dates, and can include the unchanged filings with their notes.

Each handler emits a bounded, session-local receipt row as it starts and succeeds or fails. The receipt proves handler execution order; it does not own the brief lifecycle. The staging tool does not publish, send, or persist a brief externally, and no tool can record final review.

## Reproducible benchmark

Run from the repository root:

```sh
node scripts/benchmark.js 2026-09-02
```

Observed fresh-fixture result for the dataset re-verified September 2, 2026:

| Measure | Result |
|---|---:|
| Snapshot freshness | `current` as of 2026-09-02 |
| Re-verification boundary | 2026-09-08 |
| Planning records checked | 5 |
| Filing-level status checks | 8/8 |
| Records whose source URLs stay within the municipal-domain allowlist | 5/5 |
| Records matching the pinned affirmative-copy baseline | 5/5 |
| Approval/adoption/construction overclaims in affirmative record copy | 0 |
| WebMCP tools exercised | 4/4 |
| Fixed core-to-adapter scenarios with exact canonical parity | 2/2 |
| Filings changed since August 25 per `list_status_changes` | 2: `RZ26-00419`, `RZ26-00511` |
| Primary script interface actions | 8 human controls / 3 agent tools |
| Primary / counter brief size | 3 / 2 filings |
| Human review required | Yes |
| Visible brief callbacks across both scenarios | 2 |
| Release gate | Pass |

The primary script searches residential records requiring action, inspects `RZ26-00511`, and stages `RZ26-0041`, `RZ26-00419`, and `RZ26-00511` for `Land and development`. The counter-script searches withdrawn residential records in Rogers, inspects `VAR26-0397`, and stages `VAR26-0397` with `RZ26-00345` for `Public-interest planning`. Both compare exact filing IDs, filing/status pairs, audience, official URLs, the standing note, freshness, and `review_required` between the direct core and the registered WebMCP adapter.

Each script also calls `list_status_changes`: the primary script with its default filters (changed filings only) and the counter-script for Rogers with `changed_only: false`. The comparison adds the previous verification date and every status-change entry (record, filing, dated from and to status with source and note, and the changed flag) to the canonical outcome, so both scenario hashes changed when the step was added on September 2. The release gate also requires the listed changes to be exactly `RZ26-00419` and `RZ26-00511`.

The action evidence uses one published atomic rule: one direct human control activation or one browser-agent tool invocation equals one action. Its raw primary traces are included in the JSON report. Eight versus three is evidence for this fixed script only; it is not a user study, observed elapsed-time saving, adoption signal, or general productivity claim.

The freshness gate is fail-closed. This boundary run is expected to exit non-zero:

```sh
node scripts/benchmark.js 2026-09-08
```

It reports `reverification_due` and `release_ready: false` without changing any filing's last verified procedural status. Recovery requires checking the official records and updating the verified snapshot, not changing the date or bypassing the gate.

This remains a deterministic adapter-regression and release-data benchmark. Pinned statuses and affirmative copy do not independently prove that a source supports a claim; source relevance and factual support remain manually verified.

### Held-out historical source-risk study

Run the separate pre-challenge study:

```sh
node scripts/historical-impact-benchmark.js
```

The published study checks 23 real Rogers requests and 26 procedural events from six 2025 meetings against 12 official agenda and minutes documents. Inspection and brief staging each preserved 26/26 exact statuses; every event's expected source pair remained present in 26/26 record-wide outputs; 23/23 requests passed the same-meeting official agenda/minutes boundary; all three multi-meeting lifecycles were preserved; and no record falls inside the challenge period.

The transparent agenda-only heuristic produced three determinate predictions: one matched the eventual minutes and two incorrectly implied final approval for requests that were tabled. The other 20 requests remained unknown from request wording alone. This heuristic is a deliberately limited failure-mode probe, not a competitor or extraction model.

The study demonstrates a real source-risk and verifies the product's deterministic status-preservation contract after records are manually structured. It does not demonstrate automated extraction accuracy, adoption, elapsed-time savings, revenue, or changed practitioner decisions. The full protocol and record boundary are in [`HISTORICAL-IMPACT-BENCHMARK.md`](HISTORICAL-IMPACT-BENCHMARK.md). The study was merged, deployed, and added to the public submission on August 29, 2026.

## September 2, 2026 re-verification

The August 25 snapshot reached its inclusive boundary on September 2, 2026. Every filing was re-checked against the same official sources on that date. Four of the five records had moved in the official record within eight days; the changes and their sources are listed in the README re-verification log and reproduced in `site/cases.json`. No record was given a status that the official record does not state: Rogers recommendations remain recommendations, the Bentonville hearings carry no outcome until minutes are published, and the two entries that disappeared from official listings keep their last published status with the removal stated. The snapshot's next boundary is September 8, 2026, the next City Council date in both cities.

Each filing now carries a `status_history`: its August 25 and September 2 statuses, the official source checked on each date, and a note where the record moved or went silent. The tools return it unchanged from the same data the page renders beside each filing, so an agent inspecting `RZ26-00419` sees `Tabled` on August 25 and `Recommended` on September 2 with the same outcome-table URL for both, rather than a single current label.

`list_status_changes`, added September 2 after the video was recorded, reads that same history and returns the filings whose status moved between the previous check and the current one: `RZ26-00419` (Tabled to Recommended) and `RZ26-00511` (Scheduled to Recommended), each with the official source checked on both dates. With `changed_only: false` it also lists the six unchanged filings and their notes, including `FP26-0005` absent from the reissued agenda and `RZ26-00345` gone from the outcome table. Its receipt row reads `2 filings changed since 2026-08-25.`

### Production verification, September 2, 2026

After PR #6 merged as `c579912` and `site/` was deployed to the production branch, https://nwa-growth-signal-webmcp.pages.dev/ was checked directly:

- `index.html`, `cases.json`, `core.js`, `webmcp.js`, `app.js`, and `styles.css` served by production have the same SHA-1 as the merged source.
- The page reports `Snapshot current`, verified 2026-09-02 with re-verification on 2026-09-08, and the desk header reads verified September 2, 2026.
- The Poplar record shows `VAR26-0397 · Withdrawn` and `RZ26-00511 · Recommended` with the three official Rogers URLs.
- The human path staged `RZ26-00511`, `RZ26-00419`, and `RZ26-0041`, reported `Human staged 3 records. Review required; nothing was published.`, and the review control then reported `Human review recorded for this session. Nothing was published or sent.`
- The browser console had zero warnings and zero errors; the 375-pixel viewport showed all five records with no horizontal overflow.
- Native WebMCP run, September 2, 2026, in the ChatGPT desktop browser against this production release: the demo prompt drove all three tools; `search_planning_cases` matched five residential, action-pending records; `inspect_case_record` returned `RZ26-00511 · Recommended` with `VAR26-0397` still Withdrawn; `stage_source_backed_brief` staged `RZ26-0041`, `RZ26-00419`, and `RZ26-00511` for Land and development with `review_required: true`. The agent reported no console errors and did not mark the brief reviewed, publish, or send it. The participant ran and observed this session.
- Second native run, September 2, 2026, after the status-history release (`2083b44`) was deployed: `inspect_case_record` for `RZ26-00419` returned `Recommended` with `status_history` `[2026-08-25 Tabled, 2026-09-02 Recommended]` and for `RZ26-00511` returned `Recommended` with `[2026-08-25 Scheduled, 2026-09-02 Recommended]`, each entry carrying the outcome-table URL and its note; the demo task then produced `5 verified records matched`, `RZ26-0041 · Scheduled`, and `3 filings staged · human review required` with `review_required: true` and an empty console-error list. The verbatim agent report is kept outside the repository at `demo/native-run-2026-09-02b.md`.

### Production verification, September 2, 2026 (four-tool release)

After PR #14 merged as `420a127` and `site/` was deployed to the production branch, https://nwa-growth-signal-webmcp.pages.dev/ was checked directly:

- `cases.json`, `core.js`, `webmcp.js`, `app.js`, and `styles.css` served by production have the same SHA-1 as the merged source, and `index.html` matches when fetched at `/` (the `/index.html` path returns a 308 redirect to `/`).
- Playwright with a stub `document.modelContext`: the page reported `WebMCP ready · 4 tools exposed`, registered all four tools, `list_status_changes` returned `RZ26-00419` (Tabled to Recommended) and `RZ26-00511` (Scheduled to Recommended) with `previous_verified_at: 2026-08-25`, the receipt row read `2 filings changed since 2026-08-25.`, the console had no errors or warnings, and the 375-pixel viewport had no horizontal overflow.
- Third native run, September 2, 2026, in the ChatGPT desktop browser against this release: the page reported `WEBMCP READY · 4 TOOLS EXPOSED` and exposed `search_planning_cases`, `inspect_case_record`, `stage_source_backed_brief`, and `list_status_changes` with read-only hints true, true, false, true. `list_status_changes` with no arguments returned exactly `RZ26-00419` (Tabled to Recommended) and `RZ26-00511` (Scheduled to Recommended), each with the Rogers outcome-table URL and its note for both dates and `previous_verified_at: 2026-08-25`; with `city: Bentonville` and `changed_only: false` it returned the four Bentonville filings, all unchanged, with `FP26-0005` carrying the reissued-agenda note. The demo task then produced `5 verified records matched`, `RZ26-00511 · Recommended`, and `3 filings staged · human review required` with `review_required: true`. The five receipt rows read `2 filings changed since 2026-08-25.`, `0 filings changed since 2026-08-25.`, `5 verified records matched.`, `RZ26-00511 · Recommended.`, and `3 filings staged · human review required.`; the console error list was empty. The agent did not mark the brief reviewed, publish, or send it. The participant ran and observed this session. The verbatim agent report is kept outside the repository at `demo/native-run-2026-09-02c.md`.
- The public Devpost story at https://devpost.com/software/nwa-growth-signal was edited in place in the owner editor on September 2, 2026 after this release deployed. A before and after read of the rendered public page differs in exactly six places: the implementation paragraph (4 tools, 3 read tools), a new paragraph on `list_status_changes`, the 94-test count in two places, the 4-tool accomplishment, and the status-change diffs sentence under what's next. No other sentence, heading, list, or image changed, and the submission still shows Submitted with 5/5 steps done. The judge-only testing instructions field was then corrected in place to the current judge flow: step 2 expects `WebMCP ready · 4 tools exposed`, step 4 expects `RZ26-00511` as `Recommended to City Council` beside `VAR26-0397` as `Withdrawn by applicant`, step 6 expects `verified_at: 2026-09-02` with re-verification due `2026-09-08`, a new step 7 covers `list_status_changes`, the local benchmark command uses `2026-09-02`, and the expected-result paragraph matches the one in `devpost-submission.md`. Before that correction the field still described the August 25 snapshot and a September 1 benchmark date that exits non-zero.

## Criterion evidence map

The official [WebMCP Challenge criteria](https://webmcp.devpost.com/) are mapped below without assigning an internal score or predicting a judge's score.

### WebMCP Leverage

- **Claim:** Four page-defined tools form one non-trivial, human-reviewed municipal-planning workflow, and their adapter results match the deterministic core across two distinct scripts.
- **Artifact:** `site/webmcp.js`, the on-page live execution receipt, `scripts/benchmark.js`, and `tests/webmcp.test.js`.
- **Reproduce:** Run `node scripts/benchmark.js 2026-09-02`, then perform search, inspect, stage, and the status-change listing in one continuous supported-browser session.
- **Falsifier:** A tool is missing, a receipt row is not produced by its real handler, a tool result differs from the canonical core outcome, or a tool can review or write externally.
- **Observed result:** All four tools were exercised in the ChatGPT desktop browser against production on September 2, 2026 and produced five succeeded receipt rows, including `2 filings changed since 2026-08-25.` Both fixed benchmark scenarios, each now including the status-change step, had identical core and adapter hashes in the fresh-fixture report.

### Execution

- **Claim:** The candidate is a coherent static product for human and agent use, with exact filing selection, explicit failure and fallback states, freshness disclosure, and a human-only review boundary.
- **Artifact:** `site/`, the 94 dependency-free tests, the release benchmark, the held-out historical benchmark, and candidate viewport/browser evidence.
- **Reproduce:** Run `node --test tests/*.test.js`, serve `site/`, and exercise the ordinary-browser and supported-WebMCP paths.
- **Falsifier:** Any test fails; exact filing selection reintroduces a sibling filing; the due state changes procedural status; or a browser path reaches a dead end or obscures review state.
- **Observed result:** The current automated suite passes 94/94. The candidate passed browser verification at 375, 768, and 1440 pixels with no horizontal overflow or console warnings and errors.

### Potential Impact

- **Claim:** The workflow addresses a demonstrated municipal-research failure mode: agenda wording may not reveal the eventual outcome, and one request can change status across meetings. NWA Growth Signal is designed to keep each verified event, official source pair, and human review boundary intact for real-estate, development, and public-interest work.
- **Artifact:** `benchmark/historical-cases.json`, `scripts/historical-impact-benchmark.js`, the two release-benchmark scenarios, and the staged workspace.
- **Reproduce:** Run `node scripts/historical-impact-benchmark.js`; inspect the 26 exact status checks, three multi-meeting lifecycles, and agenda-only baseline. Then run the fresh release benchmark and compare the same primary outcome through the visible human controls.
- **Falsifier:** Any historical event changes or disappears through inspection or staging; any request lacks its official agenda and minutes pair; the historical cohort leaks into the challenge period; or the copy presents the study as automated ingestion or observed user impact.
- **Observed result:** The held-out study preserved 26/26 status events through both product paths; every event's expected source pair remained present in 26/26 record-wide outputs; and all three changing lifecycles remained intact. The agenda-only probe left 20/23 outcomes unknown and made two false-finality overclaims among three determinate predictions. Separately, both fixed release tasks reached equal canonical outcomes, with eight human control activations or three agent tool invocations under the stated rule. No adoption, revenue, elapsed-time, or changed-decision claim is made.

### Creativity & Ambition

- **Claim:** The candidate applies WebMCP to a source-bound municipal editorial workflow in which agents can assemble work but cannot erase procedural distinctions or human accountability.
- **Artifact:** Filing-specific status rendering, the shared receipt and brief, the freshness gate, and the sourced comparison on the page.
- **Reproduce:** Inspect the multi-filing Rogers case, stage only `RZ26-00511`, and open the official comparison links.
- **Falsifier:** The candidate collapses the withdrawn and scheduled filings, uses an unsourced or negative competitor claim, or presents a planning action as approval or construction permission.
- **Observed result:** `VAR26-0397` and `RZ26-00511` remain independently selectable with their own statuses. The adjacent-workflow descriptions link to official CivicPlus, Regrid, and PermitFlow pages checked August 28, 2026, and were visible in the candidate browser.

## Candidate browser verification

On August 28, 2026, the branch candidate was served locally and exercised in ChatGPT's supported in-app browser:

- the page exposed all three WebMCP tools and loaded all five verified records;
- one continuous agent run searched five records, inspected `RZ26-00511` as `Scheduled`, and staged exactly `RZ26-0041`, `RZ26-00511`, and `RZ26-00345`;
- the handler-originated receipt showed three succeeded calls and reported `3 filings staged · human review required.`;
- the visible workspace remained review-required until the separate human control recorded review, and neither state claimed publication;
- the combined `Withdrawn` plus `Action still pending` filter returned zero records, then Reset restored all five records; and
- 375-, 768-, and 1440-pixel viewports had no horizontal overflow, with no browser console warnings or errors.

Candidate evidence is stored under `docs/ui-audit/after/candidate-2026-08-28-*.png`. This proves the local branch candidate, not the public deployment.

## Independent runtime reproduction

On August 27, 2026, the public deployment was opened in ChatGPT's in-app browser. The browser exposed all three page-defined WebMCP tools. An agent then:

- searched for residential records requiring another procedural action;
- inspected `RZ26-00511` and received `Scheduled` for that filing while `VAR26-0397` remained `Withdrawn`;
- staged `RZ26-0041`, `RZ26-00419`, and `RZ26-00511` for a land-and-development audience;
- observed the visible status `AGENT STAGED 3 RECORDS. REVIEW REQUIRED; NOTHING WAS PUBLISHED.`; and
- encountered no browser console warnings or errors.

The final deployed workflow was repeated on August 28, 2026 against `https://nwa-growth-signal-webmcp.pages.dev/`:

- the production page loaded with `WebMCP ready · 3 tools exposed`;
- `search_planning_cases` returned all five residential records still awaiting another procedural action;
- `inspect_case_record` preserved `VAR26-0397` as `Withdrawn` and `RZ26-00511` as `Scheduled`, with the requested filing identified separately;
- `stage_source_backed_brief` staged `RZ26-0041`, `RZ26-00419`, and `RZ26-00511` for the land-and-development audience;
- the visible workspace reported `AGENT STAGED 3 RECORDS. REVIEW REQUIRED; NOTHING WAS PUBLISHED.`;
- the manual review action changed that state to `HUMAN REVIEW RECORDED FOR THIS SESSION. NOTHING WAS PUBLISHED OR SENT.`; and
- the browser console contained no warnings or errors.

The deployed workflow was repeated again on August 29, 2026 after the release containing the handler-originated receipt, explicit freshness state, two-scenario benchmark, and sourced comparison. The live page showed three succeeded receipt rows, the exact three-filing brief, `review_required: true`, current freshness, and no console errors. The public Devpost page and revised YouTube demo were then updated and browser-verified against that release.

## Three-page PDF verification

The hackathon sample was reopened and rendered on August 27, 2026:

- three A4 pages, unencrypted, with no JavaScript or form actions;
- five embedded HTTPS links, all pointing to official Rogers municipal records;
- all three full-page renders inspected with no clipped text, overlap, broken glyphs, or unreadable evidence exhibits; and
- filing statuses remain distinct: `VAR26-0397` is `Withdrawn`, `RZ26-00511` is `Scheduled`, and `RZ26-00345` is `Recommended to City Council` rather than adopted.

The source PDF is not tagged. That limitation is disclosed below and is not represented as resolved.

## Published demo baseline and revised release

The published baseline is `demo/output/NWA-Growth-Signal-WebMCP-Demo.mp4` with the sidecar caption file `demo/output/NWA-Growth-Signal-WebMCP-Demo.srt`.

- Runtime: 2 minutes 31.8 seconds.
- Format: 1280×720 H.264/AAC.
- Caption cues: 30.
- Full media decode: passed.
- Integrated loudness: −16.10 LUFS; true peak: −1.84 dBTP.
- Narration: Google Gemini Kore host and Iapetus expert.
- Participant listening approval: passed August 28, 2026.
- Public YouTube availability: verified as `public` at https://youtu.be/y3lzrrvDKP8 on August 28, 2026.
- Public player duration: 2 minutes 32 seconds.
- Public YouTube captions: the 30-cue English (United States) SRT was published in YouTube Studio on August 28, 2026; the public player still reported captions unavailable during the immediate propagation check.

Technical media checks, participant listening approval, public video availability, and the caption upload are complete. Public-player caption propagation remains a separate verification item. Devpost displayed `Project submitted!` at https://devpost.com/software/nwa-growth-signal on August 28, 2026.

The revised public release is `demo/output/NWA-Growth-Signal-WebMCP-Demo-v2.mp4` with `demo/output/NWA-Growth-Signal-WebMCP-Demo-v2.srt`.

- Runtime: 2 minutes 39.4 seconds; 1280×720 H.264/AAC.
- Caption cues: 30.
- Full media decode: passed; integrated loudness −16.50 LUFS and true peak −1.47 dBTP.
- Narration: Google Gemini Kore host and Iapetus expert; participant-approved August 29, 2026.
- Public YouTube availability: verified at https://youtu.be/otLlVr_CHVU on August 29, 2026.
- YouTube Studio reports the English (United States) track as published; the public player still reported captions unavailable during the immediate propagation check.

The public Devpost story was replaced on August 28, 2026 after a rendered-page audit found seven empty template headings. The revised page was reopened and verified with nine populated sections, explicit challenge-period provenance, explicit WebMCP-fit and better-user-experience explanations, the agent-human collaboration boundary, implementation details, and no remaining empty template sequence. The submission remained `Submitted` with `5/5 steps done` after the save.

`docs/hackathon/DEMO.md` records the revised public demo containing the exact host task, all three handler-originated receipt rows, the resulting brief, freshness state, 74-test parity proof, and sourced comparison. Devpost embedded the revised YouTube URL and publicly displayed the updated evidence story on August 29, 2026.

## Provenance and challenge window

The municipal-record research predates or is independent from the hackathon implementation. The WebMCP application, tool registration, shared agent-human staging workflow, tests, and release evidence are tracked separately in this repository's timestamped Git history. The repository history should remain the authoritative record of what was implemented during the challenge window.

## Release gate

Before releasing, recording the revised candidate, or updating the submission:

- confirm the public repository contains the candidate commit;
- confirm the production deployment serves that same commit's interface and three-page hackathon PDF;
- rerun `node --test tests/*.test.js` and the benchmark with the actual release date;
- if `as_of >= 2026-09-08`, re-verify every included filing from the official records and update the snapshot before release;
- reproduce the host prompt, three live receipt transitions, exact brief, and human-review boundary in one continuous supported-browser run;
- confirm any revised Devpost copy and video are separately authorized, published, and re-opened from their public URLs; and
- keep the judged deployment unchanged during judging unless the official rules require otherwise.

## Sourced adjacent-workflow context

Official product pages checked August 28, 2026 describe:

- [CivicPlus](https://www.civicplus.com/agenda-meeting-management/) as agenda and meeting management;
- [Regrid](https://regrid.com/property-app) as a parcel and property-map application; and
- [PermitFlow](https://www.permitflow.com/) as permitting workflow software.

The candidate describes NWA Growth Signal affirmatively as a dated, filing-specific planning evidence desk shared by people and browser agents. It does not claim these products lack a capability or claim general superiority.

## Honest limitations

- The deployed dataset is a five-record editorial sample, not a live municipal database; the separate 23-request historical cohort is an offline validation asset, not additional live coverage.
- Bentonville's September 1 minutes were not published as of September 2, so the three Bentonville records carry no September 1 outcome; the two Rogers recommendations await separate City Council action.
- The release benchmark proves handler behavior, pinned release-data fidelity, and the municipal-domain boundary. The historical benchmark proves status preservation after manual structuring, not automated extraction accuracy. Source relevance and factual support remain manually verified.
- The eight-control versus three-tool result belongs only to the declared interface script; no observed user-time, adoption, revenue, or general productivity evidence exists.
- The repository candidate is not proof that the public deployment, Devpost story, or YouTube video contains the new receipt, freshness, parity, or comparison evidence.
- The PDF is a visual sample; PDF tagging remains a separate accessibility limitation.
- Agent-side recovery after an initial record-load failure would require a public WebMCP contract change and is not included.
- `list_status_changes` compares only the two verified dates carried in each filing's `status_history`; it does not watch official sources or detect changes between verifications.
