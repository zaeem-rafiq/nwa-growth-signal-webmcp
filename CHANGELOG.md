# Changelog

## 2026-09-02 (candidate)

- Added `list_status_changes`, a fourth read-only WebMCP tool that lists each filing whose verified status label moved between the August 25 and September 2 checks with the official source consulted on each date, an optional unchanged listing with notes, and a city filter.
- Extended the release benchmark with core-to-adapter parity for the status-change listing and a pinned changed-filing baseline; the gate now requires all four tools.
- Added the fourth tool to the live receipt allowlist, the page's tool list, and the readiness copy.

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
