const test = require("node:test");
const assert = require("node:assert/strict");

const { runBenchmark } = require("../scripts/benchmark.js");
const { registerPlanningTools } = require("../site/webmcp.js");
const cases = require("../site/cases.json");

test("the release benchmark proves two fixed core-to-adapter scenarios and their interaction traces", async () => {
  const report = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-01" });

  assert.deepEqual({
    ...report,
    scenarios: Object.fromEntries(Object.entries(report.scenarios).map(([name, scenario]) => [name, {
      parity: scenario.parity,
      core_sha256: scenario.core_sha256,
      tool_sha256: scenario.tool_sha256,
    }])),
  }, {
    dataset_verified_at: "2026-08-25",
    freshness: {
      state: "current",
      as_of: "2026-09-01",
      reverify_on: "2026-09-02",
    },
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
    staged_brief_callbacks: 2,
    review_required: true,
    scenario_fields_compared: [
      "filing IDs",
      "filing/status pairs",
      "audience",
      "official URLs",
      "standing note",
      "freshness",
      "review_required",
    ],
    scenarios: {
      primary: {
        parity: true,
        core_sha256: "ddec37f3e38888df1a77ff8b3fb94fbf80e4b9b9a2b4871d2c1a48145b9829d0",
        tool_sha256: "ddec37f3e38888df1a77ff8b3fb94fbf80e4b9b9a2b4871d2c1a48145b9829d0",
      },
      counter: {
        parity: true,
        core_sha256: "cbe775f0bff8058765684f9fcfb54b01141b8ca8be8f04f0faa4047b6820b787",
        tool_sha256: "cbe775f0bff8058765684f9fcfb54b01141b8ca8be8f04f0faa4047b6820b787",
      },
    },
    interaction_evidence: {
      label: "Fixed-script interface-action evidence; not observed time savings or general productivity evidence.",
      counting_rule: "One direct human control activation or one browser-agent tool invocation equals one action.",
      human: {
        actions: 8,
        raw_trace: [
          "Set Action needed to Yes",
          "Open RZ26-0041",
          "Add RZ26-0041",
          "Open RZ26-00419",
          "Add RZ26-00419",
          "Open RZ26-00511",
          "Add RZ26-00511",
          "Stage brief",
        ],
      },
      browser_agent: {
        actions: 3,
        raw_trace: [
          "Invoke search_planning_cases",
          "Invoke inspect_case_record",
          "Invoke stage_source_backed_brief",
        ],
      },
    },
    release_ready: true,
  });
});

test("a tool-side outcome mismatch fails parity and the release gate", async () => {
  async function registerFaultyTools(options) {
    return registerPlanningTools({
      ...options,
      modelContext: {
        registerTool(tool, registrationOptions) {
          return options.modelContext.registerTool({
            ...tool,
            execute: tool.name === "inspect_case_record"
              ? async (input) => ({
                ...await tool.execute(input),
                requested_filing: { case_id: input.case_id, status: "Wrong" },
              })
              : tool.execute,
          }, registrationOptions);
        },
      },
    });
  }

  const report = await runBenchmark({
    cases,
    registerPlanningTools: registerFaultyTools,
    asOf: "2026-09-01",
  });

  assert.equal(report.scenarios.primary.parity, false);
  assert.equal(report.scenarios.counter.parity, false);
  assert.equal(report.release_ready, false);
});

test("the benchmark is byte-deterministic for the same fixture date", async () => {
  const first = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-01" });
  const second = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-01" });

  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test("the inclusive freshness boundary changes only freshness and readiness", async () => {
  const fresh = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-01" });
  const due = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-02" });
  const withoutFreshness = (report) => {
    const copy = structuredClone(report);
    delete copy.freshness;
    delete copy.release_ready;
    for (const scenario of Object.values(copy.scenarios)) {
      delete scenario.core_sha256;
      delete scenario.tool_sha256;
      delete scenario.outcome.freshness;
    }
    return copy;
  };

  assert.equal(fresh.freshness.state, "current");
  assert.equal(fresh.release_ready, true);
  assert.equal(due.freshness.state, "reverification_due");
  assert.equal(due.release_ready, false);
  assert.deepEqual(withoutFreshness(due), withoutFreshness(fresh));
});

test("an altered filing status fails the independent release baseline", async () => {
  const changed = structuredClone(cases);
  changed[1].filings[0].status = "Tabled";

  const report = await runBenchmark({ cases: changed, registerPlanningTools, asOf: "2026-09-01" });

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

      const report = await runBenchmark({ cases: changed, registerPlanningTools, asOf: "2026-09-01" });

      assert.equal(report.approval_overclaims, 1);
      assert.equal(report.claim_copy_checks_passed, 4);
      assert.equal(report.release_ready, false);
    });
  }
});

test("procedural recommendation wording is not an approval overclaim", async () => {
  const changed = structuredClone(cases);
  changed[0].summary = "The Planning Commission recommended the case; City Council action remains required.";

  const report = await runBenchmark({ cases: changed, registerPlanningTools, asOf: "2026-09-01" });

  assert.equal(report.approval_overclaims, 0);
});

test("a source outside the municipal-domain allowlist fails the release gate", async () => {
  const changed = structuredClone(cases);
  changed[0].sources[0].url = "https://example.com/unrelated";

  const report = await runBenchmark({ cases: changed, registerPlanningTools, asOf: "2026-09-01" });

  assert.equal(report.records_with_official_sources, 4);
  assert.equal(report.release_ready, false);
});
