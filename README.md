# NWA Growth Signal — WebMCP

An agent-native municipal planning desk for Bentonville and Rogers, Arkansas. The same five source-backed signals are available to people through the interface and to browser agents through native WebMCP tools, with each filing bound to its own procedural status.

**Current public demo:** https://nwa-growth-signal-webmcp.pages.dev/

The public release includes a handler-originated execution receipt, explicit snapshot freshness, a two-scenario parity benchmark, and a sourced product comparison. The deployed workflow and three succeeded receipt rows were browser-verified on August 29, 2026.

## What agents can do

- `search_planning_cases` — filter grouped signals by city, procedural status, residential relevance, and pending action; status-filtered results identify the matching filings
- `inspect_case_record` — retrieve exact status labels, the requested filing, plain-English context, explicit non-claims, and official municipal URLs
- `stage_source_backed_brief` — stage one to five records in the visible page for human review; nothing is published or sent

Each real tool call writes a bounded session receipt into the page. Receipt state is observational; the staged workspace still requires a person to record review.

## Run locally

```sh
python3 -m http.server 8000 --directory site
```

Open `http://localhost:8000`. The human interface works in ordinary browsers. WebMCP tools require ChatGPT's in-app browser or a supported Chrome build with WebMCP enabled.

## Test

```sh
node --test tests/*.test.js
```

The 74-test suite covers exact filing selection, snapshot freshness, handler-side input validation, atomic tool registration, bounded execution receipts, browser fallback states, two-scenario workflow parity, official-source boundaries, and injection-safe rendering.

## Reproduce the hackathon evidence

```sh
node scripts/benchmark.js 2026-09-01
```

The fresh-fixture run compares the direct core and registered WebMCP paths across two fixed scripts. It requires exact equality for filing IDs, filing/status pairs, audience, official URLs, the standing note, freshness, and `review_required`. The primary script records eight direct human control activations and three browser-agent tool invocations under a published atomic counting rule; this is scripted interface evidence, not observed time savings or general productivity evidence.

The snapshot boundary is inclusive. This command is expected to exit non-zero with `reverification_due` and `release_ready: false` while preserving every procedural status:

```sh
node scripts/benchmark.js 2026-09-02
```

See [`docs/hackathon/EVIDENCE.md`](docs/hackathon/EVIDENCE.md) for the proof contract and [`docs/hackathon/DEMO.md`](docs/hackathon/DEMO.md) for the prepared revised recording guide.

## Demo prompt

> Find residential Bentonville and Rogers cases still awaiting procedural action. Inspect their official evidence and stage a three-item brief without representing any recommendation as final approval.

## Evidence boundary

The included dataset was verified August 25, 2026 from official Bentonville and Rogers records. Its release-review boundary is September 2, 2026; once due, the last verified statuses remain visible but the release gate stays closed until the official records are checked again. No building permits, price forecasts, demographic targeting, or investment recommendations are included.

## Adjacent workflow context

Official product pages checked August 28, 2026 describe [CivicPlus](https://www.civicplus.com/agenda-meeting-management/) as agenda and meeting management, [Regrid](https://regrid.com/property-app) as a parcel and property-map application, and [PermitFlow](https://www.permitflow.com/) as permitting workflow software. NWA Growth Signal's narrower job is to turn a dated Bentonville-and-Rogers planning snapshot into filing-specific, source-linked briefs shared by a person and a browser agent. These are affirmative job descriptions, not claims that another product lacks a capability.

## Deployment

Production is deployed from `site/` to Cloudflare Pages at https://nwa-growth-signal-webmcp.pages.dev/. A green branch or pull request is candidate proof, not deployment proof. Before a release or submission update, re-verify the official records if freshness is due, confirm production serves the candidate commit, exercise the live tools in a supported browser, and then keep the judged deployment unchanged unless the rules require otherwise.
