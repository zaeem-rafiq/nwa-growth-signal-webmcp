# NWA Growth Signal — WebMCP

An agent-native municipal planning desk for Bentonville and Rogers, Arkansas. The same five source-backed signals are available to people through the interface and to browser agents through native WebMCP tools, with each filing bound to its own procedural status.

**Live demo:** https://nwa-growth-signal-webmcp.pages.dev/

## What agents can do

- `search_planning_cases` — filter grouped signals by city, procedural status, residential relevance, and pending action; status-filtered results identify the matching filings
- `inspect_case_record` — retrieve exact status labels, the requested filing, plain-English context, explicit non-claims, and official municipal URLs
- `stage_source_backed_brief` — stage one to five records in the visible page for human review; nothing is published or sent

## Run locally

```sh
python3 -m http.server 8000 --directory site
```

Open `http://localhost:8000`. The human interface works in ordinary browsers. WebMCP tools require ChatGPT's in-app browser or a supported Chrome build with WebMCP enabled.

## Test

```sh
node --test tests/*.test.js
```

The suite covers per-filing status attribution, evidence lookup, handler-side input validation, atomic tool registration, browser fallback states, real-data workflow integration, official-source boundaries, and injection-safe rendering.

## Demo prompt

> Find residential Bentonville and Rogers cases still awaiting procedural action. Inspect their official evidence and stage a three-item brief without representing any recommendation as final approval.

## Evidence boundary

The included dataset was verified August 25, 2026 from official Bentonville and Rogers records. Scheduled and tabled items require another verification pass after the September 1 meetings. No building permits, price forecasts, demographic targeting, or investment recommendations are included.

## Deployment

Production is deployed from `site/` to Cloudflare Pages at https://nwa-growth-signal-webmcp.pages.dev/. Before submission, verify the live tools in ChatGPT's in-app browser and supported Chrome, then keep the submitted deployment unchanged during judging.
