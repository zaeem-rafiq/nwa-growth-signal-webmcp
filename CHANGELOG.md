# Changelog

## 2026-09-03

- Corrected the September 2 source record: Bentonville's latest reissued September 1 agenda is file 9143, and Rogers' August 11 City Council agenda contains the ordinance matching `RZ26-00345`; the agenda is not represented as adoption because no published result establishes council action.
- Added the official Rogers permit link for `RZ26-00511` and allowed Rogers CivicClerk agenda URLs wherever official municipal sources are rendered or release-checked.
- Published the approved final demo with the 99-test proof at https://youtu.be/sC_EQQguBWQ, updated the submitted Devpost embed, and kept public-player caption availability explicitly unverified.

## 2026-09-02

- Hardened the deployment after a read-only security audit: a `site/_headers` file sets a strict same-origin Content-Security-Policy, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, and a permissions policy; handler errors no longer echo caller input (unknown records now return a typed `NOT_FOUND` with the receipt `Call rejected: unknown record.`); source links render only for URLs on the official municipal allowlist, now shared between the page, the benchmark, and the data test; CI actions are pinned to commit SHAs.
- Added `list_status_changes`, a fourth read-only WebMCP tool that lists the filings whose verified status moved between the previous check and the current one, with the official source consulted on each date, an optional unchanged listing with notes, and a city filter.
- Registered the fourth tool in the same atomic post-load batch as the other three, added it to the live receipt allowlist, the page's tool list, and the readiness copy.
- Added a status-change step to both release benchmark scenarios; the gate now requires four tools and the two expected changed filings.
- Extended the demo prompt to drive all four tools in one request; the fixed primary script now records ten human control activations (two extra record opens to read status history by hand) or four agent tool calls.

## 2026-08-29

- Added a held-out historical benchmark covering 23 real Rogers planning requests, 26 procedural events, 12 official agenda/minutes documents, and three multi-meeting lifecycles.
- Added executable checks for exact status and source-pair preservation through inspection and brief staging, field-specific official-source completeness, lifecycle integrity, challenge-period isolation, and unique local event IDs.
- Documented the observed agenda-only failure modes and the study's limits without claiming adoption, automated extraction, elapsed-time savings, or business outcomes.

## 2026-08-28

- Preserved exact filing selection across human and agent staging, including separate statuses for multi-filing records.
- Added one shared snapshot-freshness contract that fails closed before verification and on the inclusive re-verification boundary.
- Extended the release benchmark to prove exact core-to-adapter parity across two fixed scenarios and publish raw eight-control versus three-tool traces for the primary script.
- Added a bounded handler-originated execution receipt while keeping final review human-only.
- Corrected combined filing filters and made receipt and benchmark proof count the exact staged filings.
- Added a sourced adjacent-workflow comparison and aligned repository, demo, and prepared Devpost evidence with the candidate's executable proof and public-release gates.

## 2026-08-27

- Added a reproducible five-record handler benchmark with pinned filing-status and affirmative-copy baselines, a municipal-domain allowlist, overclaim prevention, and an executable release gate.
- Added judge-facing evidence and a production-ready demo recording package with explicit release gates and honest limitations.

## 2026-08-26

- Added the five-record Bentonville and Rogers planning dataset with official municipal sources.
- Added native WebMCP search, record-inspection, and brief-staging tools.
- Added the responsive Signal Desk, manual filters, human review state, and unsupported-browser fallback.
- Added dependency-free Node tests for the planning logic, tool contract, dataset boundary, and UI safety.
- Kept agent-staged audience state visible to human reviewers and collapsed multiple case IDs that resolve to one planning record.
- Published the source repository and production Cloudflare Pages deployment.
- Bound each case ID to its own procedural status in agent search, inspection, and staged briefs.
- Added handler-side brief validation, all-or-nothing WebMCP registration, and executable fallback-state coverage.
- Fixed the desktop hero headline overflow at 1280px without changing the mobile composition.
- Enforced each WebMCP tool's advertised input schema inside its handler so malformed or extra fields fail visibly.
- Added a three-page hackathon edition of Issue 01 while preserving the four-page commercial sample.
- Improved keyboard focus continuity, touch target sizing, detail labeling, and functional text legibility across the Signal Desk.
- Kept selection, audience, provenance, source links, and review readiness visibly synchronized in staged briefs.
- Added explicit loading, retry, copy fallback, filtered-selection disclosure, and new-tab navigation cues.
- Added the real Issue 01 cover to the hero and renamed the dated dataset surface to avoid implying live municipal data.
- Extended the staged-brief source links to the 44px touch-target baseline.
- Added executable interaction, retry, clipboard-recovery, selector-specific touch-target, and three-page PDF regression checks.
