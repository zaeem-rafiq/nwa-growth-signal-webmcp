const test = require("node:test");
const assert = require("node:assert/strict");

const { runBenchmark } = require("../scripts/benchmark.js");
const { registerPlanningTools } = require("../site/webmcp.js");
const cases = require("../site/cases.json");

test("the release benchmark proves the five-record agent workflow without approval overclaims", async () => {
  const report = await runBenchmark({ cases, registerPlanningTools });

  assert.deepEqual(report, {
    dataset_verified_at: "2026-08-25",
    records_checked: 5,
    filing_status_checks: 8,
    filing_status_checks_passed: 8,
    records_with_official_sources: 5,
    claim_copy_checks: 5,
    claim_copy_checks_passed: 5,
    approval_overclaims: 0,
    tools_exercised: [
      "search_planning_cases",
      "inspect_case_record",
      "stage_source_backed_brief",
    ],
    search_results: 5,
    staged_records: 3,
    staged_brief_callbacks: 1,
    review_required: true,
    release_ready: true,
  });
});

test("an altered filing status fails the independent release baseline", async () => {
  const changed = structuredClone(cases);
  changed[1].filings[0].status = "Tabled";

  const report = await runBenchmark({ cases: changed, registerPlanningTools });

  assert.equal(report.filing_status_checks_passed, 7);
  assert.equal(report.release_ready, false);
});

test("approval and construction assertions fail the copy guard", async (t) => {
  for (const phrase of [
    "The request received final approval.",
    "The rezoning was adopted.",
    "The project was authorized.",
    "The site was greenlit.",
    "The site is under construction.",
    "Construction has started.",
    "Construction begins this month.",
    "The rezoning is final.",
  ]) {
    await t.test(phrase, async () => {
      const changed = structuredClone(cases);
      changed[0].summary = phrase;

      const report = await runBenchmark({ cases: changed, registerPlanningTools });

      assert.equal(report.approval_overclaims, 1);
      assert.equal(report.claim_copy_checks_passed, 4);
      assert.equal(report.release_ready, false);
    });
  }
});

test("procedural recommendation wording is not an approval overclaim", async () => {
  const changed = structuredClone(cases);
  changed[0].summary = "The Planning Commission recommended the case; City Council action remains required.";

  const report = await runBenchmark({ cases: changed, registerPlanningTools });

  assert.equal(report.approval_overclaims, 0);
});

test("a source outside the municipal-domain allowlist fails the release gate", async () => {
  const changed = structuredClone(cases);
  changed[0].sources[0].url = "https://example.com/unrelated";

  const report = await runBenchmark({ cases: changed, registerPlanningTools });

  assert.equal(report.records_with_official_sources, 4);
  assert.equal(report.release_ready, false);
});
