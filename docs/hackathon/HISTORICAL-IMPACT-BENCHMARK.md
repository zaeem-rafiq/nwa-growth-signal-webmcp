# Historical Impact Benchmark

This study asks a narrow practitioner question: when a planning request moves through real municipal meetings, can NWA Growth Signal preserve the exact procedural outcome and its official evidence without turning an agenda item into false finality?

It is a zero-participant, held-out historical validation. It is not a user study, a customer-adoption result, an ingestion benchmark, or evidence of time or revenue saved.

## Cohort

| Measure | Value |
|---|---:|
| Rogers requests | 23 |
| Procedural events | 26 |
| Planning Commission / Board of Adjustment meetings | 6 |
| Official agenda and minutes documents | 12 |
| Multi-meeting request lifecycles | 3 |
| Meeting-date range | January 7–May 6, 2025 |
| Records from the challenge period | 0 |

The cohort was assembled from official Rogers CivicClerk agendas and published minutes. Every request has both sources. The source documents do not publish official case numbers for these items, so `HB-*` values are explicitly local benchmark identifiers and `official_case_id` remains `null` rather than inferred.

## Protocol

1. Select official pre-challenge agendas and matching published minutes.
2. Record the request language from the agenda and the procedural result from the minutes.
3. Preserve every multi-meeting event rather than replacing earlier states with only the latest state.
4. Convert the manually verified records into the same core case shape used by the application.
5. Check every event through the shared core operations underlying `inspect_case_record` and `stage_source_backed_brief`; the separate release benchmark covers the registered WebMCP adapter.
6. Run a deliberately limited agenda-only request-verb heuristic to expose how often agenda language alone supplies a final result.

The agenda-only heuristic recognizes only explicit approval language or an explicit recommendation to City Council. It is a transparent failure-mode probe, not a competitor, model, or production extraction system.

## Observed result

Run from the repository root:

```sh
node scripts/historical-impact-benchmark.js
```

| Measure | Result |
|---|---:|
| Status events preserved by inspection | 26/26 |
| Status events preserved by brief staging | 26/26 |
| Events whose expected source pair remains present in inspection output | 26/26 |
| Events whose expected source pair remains present in brief output | 26/26 |
| Requests with official agenda and minutes URLs | 23/23 |
| Multi-meeting lifecycles preserved | 3/3 |
| Challenge-period leakage | 0 |
| Agenda-only determinate predictions | 3/23 |
| Agenda-only exact matches | 1/3 determinate predictions |
| Agenda-only unknown outcomes | 20/23 |
| Agenda-only false-finality overclaims | 2 |
| Study gate | Pass |

The two false-finality cases are the practical risk this workflow is designed to prevent: approval-oriented agenda wording preceded a later `Tabled` result. The three lifecycle records add a second practitioner-relevant risk: requests moved from `Tabled` to `Withdrawn`, `Approved`, or `Denied` across meetings, so a single-meeting summary would omit material procedural history.

## What this supports

The benchmark supports one potential-impact claim: for this held-out real-record cohort, the application's deterministic inspection and staging paths preserved the manually verified status for every event, and each expected official source pair remained present in the record-wide output, including across all three changing lifecycles. That is evidence that the product's evidence-and-status contract addresses a real municipal research failure mode.

It does not prove that the product automatically extracts records correctly, that practitioners save time, that users adopt the workflow, or that the workflow changes a business decision. Those require future ingestion evaluation and practitioner observation.

## Reproducibility boundary

- Dataset: `benchmark/historical-cases.json`
- Evaluator: `scripts/historical-impact-benchmark.js`
- Behavioral checks: `tests/historical-impact-benchmark.test.js`
- Inclusion window: official Rogers meetings before August 25, 2026
- Source allowlist: official Rogers CivicClerk agenda and minutes URLs
- Release rule: 20–30 requests, exact status preservation and expected-source presence through both core paths, at least one lifecycle, same-meeting official agenda/minutes pairs, observed agenda-only failure cases, and zero challenge-period records

The evaluator uses only Node.js standard-library features and the existing application core. Duplicate local event IDs, empty or unordered lifecycles, invalid dates, unrecognized decision bodies, and swapped source types fail visibly instead of contaminating a passing study.
