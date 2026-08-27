# Hackathon Evidence

This document separates executable proof from claims that still need external confirmation.

## Central loop

One agent request drives three native WebMCP actions in the same interface:

1. `search_planning_cases` finds bounded Bentonville and Rogers records.
2. `inspect_case_record` returns filing-level status, non-claims, and official municipal URLs.
3. `stage_source_backed_brief` updates the visible brief workspace and requires human review.

The staging tool does not publish, send, or persist a brief externally.

## Reproducible benchmark

Run from the repository root:

```sh
node scripts/benchmark.js
```

Expected release result for the dataset verified August 25, 2026:

| Measure | Result |
|---|---:|
| Planning records checked | 5 |
| Filing-level status checks | 8/8 |
| Records whose source URLs stay within the municipal-domain allowlist | 5/5 |
| Records matching the pinned affirmative-copy baseline | 5/5 |
| Approval/adoption/construction overclaims in affirmative record copy | 0 |
| WebMCP tools exercised | 3/3 |
| Action-pending search results | 5 |
| Records staged in the demo brief | 3 |
| Human review required | Yes |
| Visible brief callbacks | 1 |
| Release gate | Pass |

This is a deterministic handler-level contract benchmark. Statuses and affirmative copy are checked against pinned release baselines; source URLs are checked against a municipal-domain allowlist. It does not independently prove that a URL supports a claim, nor is it evidence of customer adoption, revenue, or time saved.

## Independent runtime reproduction

On August 27, 2026, the public deployment was opened in ChatGPT's in-app browser. The browser exposed all three page-defined WebMCP tools. An agent then:

- searched for residential records requiring another procedural action;
- inspected `RZ26-00511` and received `Scheduled` for that filing while `VAR26-0397` remained `Withdrawn`;
- staged `RZ26-0041`, `RZ26-00419`, and `RZ26-00511` for a land-and-development audience;
- observed the visible status `AGENT STAGED 3 RECORDS. REVIEW REQUIRED; NOTHING WAS PUBLISHED.`; and
- encountered no browser console warnings or errors.

## Three-page PDF verification

The hackathon sample was reopened and rendered on August 27, 2026:

- three A4 pages, unencrypted, with no JavaScript or form actions;
- five embedded HTTPS links, all pointing to official Rogers municipal records;
- all three full-page renders inspected with no clipped text, overlap, broken glyphs, or unreadable evidence exhibits; and
- filing statuses remain distinct: `VAR26-0397` is `Withdrawn`, `RZ26-00511` is `Scheduled`, and `RZ26-00345` is `Recommended to City Council` rather than adopted.

The source PDF is not tagged. That limitation is disclosed below and is not represented as resolved.

## Provenance and challenge window

The municipal-record research predates or is independent from the hackathon implementation. The WebMCP application, tool registration, shared agent-human staging workflow, tests, and release evidence are tracked separately in this repository's timestamped Git history. The repository history should remain the authoritative record of what was implemented during the challenge window.

## Release gate

Before recording or submitting:

- confirm the public repository contains the candidate commit;
- confirm the production deployment serves that same commit's interface and three-page hackathon PDF;
- rerun `node --test tests/*.test.js` and `node scripts/benchmark.js`;
- reproduce the three-tool workflow in a supported browser; and
- keep the judged deployment unchanged during judging unless the official rules require otherwise.

## Honest limitations

- The dataset is a five-record editorial sample, not a live municipal database.
- Scheduled and tabled records require re-verification after the September 1 meetings.
- The automated benchmark proves handler behavior, pinned release-data fidelity, and the municipal-domain boundary. Source relevance and factual support remain manually verified.
- The PDF is a visual sample; PDF tagging remains a separate accessibility limitation.
- Agent-side recovery after an initial record-load failure would require a public WebMCP contract change and is not included.
