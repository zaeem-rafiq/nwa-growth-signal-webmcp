const test = require("node:test");
const assert = require("node:assert/strict");

const { runBenchmark } = require("../scripts/benchmark.js");
const { registerPlanningTools } = require("../site/webmcp.js");
const cases = require("../site/cases.json");

test("the release benchmark proves two fixed core-to-adapter scenarios and their interaction traces", async () => {
  const report = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-02" });

  assert.deepEqual({
    ...report,
    scenarios: Object.fromEntries(Object.entries(report.scenarios).map(([name, scenario]) => [name, {
      parity: scenario.parity,
      core_sha256: scenario.core_sha256,
      tool_sha256: scenario.tool_sha256,
    }])),
  }, {
    dataset_verified_at: "2026-09-02",
    freshness: {
      state: "current",
      as_of: "2026-09-02",
      reverify_on: "2026-09-08",
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
      "list_status_changes",
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
      "stage response",
      "freshness",
      "review_required",
    ],
    scenarios: {
      primary: {
        parity: true,
        core_sha256: "5c181c4987b2a0a4aee6ae22fdae87e2e3e1f68c3c820c655381089f5e3e7dfe",
        tool_sha256: "5c181c4987b2a0a4aee6ae22fdae87e2e3e1f68c3c820c655381089f5e3e7dfe",
      },
      counter: {
        parity: true,
        core_sha256: "d70cd73d425dfe70a7a0510a38826aa94a4284653715316f1d08d89708ef34ad",
        tool_sha256: "d70cd73d425dfe70a7a0510a38826aa94a4284653715316f1d08d89708ef34ad",
      },
    },
    status_changes: {
      compared_from: "2026-08-25",
      compared_to: "2026-09-02",
      changed_filing_ids: ["RZ26-00419", "RZ26-00511"],
      unchanged_filing_ids: ["RZ26-0041", "FP26-0003", "FP26-0004", "FP26-0005", "VAR26-0397", "RZ26-00345"],
      baseline_match: true,
      parity: true,
      core_sha256: "e8fc916b9587e9b07566e0045713df564ae0c483d2010f205bfa460ba5595bf3",
      tool_sha256: "e8fc916b9587e9b07566e0045713df564ae0c483d2010f205bfa460ba5595bf3",
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
    asOf: "2026-09-02",
  });

  assert.equal(report.scenarios.primary.parity, false);
  assert.equal(report.scenarios.counter.parity, false);
  assert.equal(report.release_ready, false);
});

test("a corrupted staging response fails parity and the release gate", async () => {
  async function registerFaultyTools(options) {
    return registerPlanningTools({
      ...options,
      modelContext: {
        registerTool(tool, registrationOptions) {
          return options.modelContext.registerTool({
            ...tool,
            execute: tool.name === "stage_source_backed_brief"
              ? async (input) => ({
                ...await tool.execute(input),
                item_count: 99,
                review_required: false,
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
    asOf: "2026-09-02",
  });

  assert.equal(report.scenarios.primary.parity, false);
  assert.equal(report.scenarios.counter.parity, false);
  assert.equal(report.release_ready, false);
});

test("a status-change listing that drifts from the core or the pinned baseline fails the release gate", async () => {
  async function registerFaultyTools(options) {
    return registerPlanningTools({
      ...options,
      modelContext: {
        registerTool(tool, registrationOptions) {
          return options.modelContext.registerTool({
            ...tool,
            execute: tool.name === "list_status_changes"
              ? async (input) => {
                const result = await tool.execute(input);
                return { ...result, changes: result.changes.slice(0, 1), changed_count: 1 };
              }
              : tool.execute,
          }, registrationOptions);
        },
      },
    });
  }
  const faulty = await runBenchmark({ cases, registerPlanningTools: registerFaultyTools, asOf: "2026-09-02" });
  assert.equal(faulty.status_changes.parity, false);
  assert.equal(faulty.status_changes.baseline_match, false);
  assert.equal(faulty.scenarios.primary.parity, true);
  assert.equal(faulty.release_ready, false);

  const rewritten = structuredClone(cases);
  rewritten[2].filings[0].status_history[0].status = "Recommended";
  const drifted = await runBenchmark({ cases: rewritten, registerPlanningTools, asOf: "2026-09-02" });
  assert.equal(drifted.status_changes.parity, true);
  assert.deepEqual(drifted.status_changes.changed_filing_ids, ["RZ26-00511"]);
  assert.equal(drifted.status_changes.baseline_match, false);
  assert.equal(drifted.release_ready, false);
});

test("the benchmark is byte-deterministic for the same fixture date", async () => {
  const first = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-02" });
  const second = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-02" });

  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test("the inclusive freshness boundary changes only freshness and readiness", async () => {
  const notYetVerified = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-01" });
  const fresh = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-02" });
  const due = await runBenchmark({ cases, registerPlanningTools, asOf: "2026-09-08" });
  const withoutFreshness = (report) => {
    const copy = structuredClone(report);
    delete copy.freshness;
    delete copy.release_ready;
    for (const scenario of Object.values(copy.scenarios)) {
      delete scenario.core_sha256;
      delete scenario.tool_sha256;
      delete scenario.outcome.freshness;
    }
    delete copy.status_changes.core_sha256;
    delete copy.status_changes.tool_sha256;
    return copy;
  };

  assert.equal(notYetVerified.freshness.state, "verification_date_only");
  assert.equal(notYetVerified.release_ready, false);
  assert.equal(fresh.freshness.state, "current");
  assert.equal(fresh.release_ready, true);
  assert.equal(due.freshness.state, "reverification_due");
  assert.equal(due.release_ready, false);
  assert.deepEqual(withoutFreshness(due), withoutFreshness(fresh));
});

test("an altered filing status fails the independent release baseline", async () => {
  const changed = structuredClone(cases);
  changed[1].filings[0].status = "Tabled";

  const report = await runBenchmark({ cases: changed, registerPlanningTools, asOf: "2026-09-02" });

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

      const report = await runBenchmark({ cases: changed, registerPlanningTools, asOf: "2026-09-02" });

      assert.equal(report.approval_overclaims, 1);
      assert.equal(report.claim_copy_checks_passed, 4);
      assert.equal(report.release_ready, false);
    });
  }
});

test("procedural recommendation wording is not an approval overclaim", async () => {
  const changed = structuredClone(cases);
  changed[0].summary = "The Planning Commission recommended the case; City Council action remains required.";

  const report = await runBenchmark({ cases: changed, registerPlanningTools, asOf: "2026-09-02" });

  assert.equal(report.approval_overclaims, 0);
});

test("a source outside the municipal-domain allowlist fails the release gate", async () => {
  const changed = structuredClone(cases);
  changed[0].sources[0].url = "https://example.com/unrelated";

  const report = await runBenchmark({ cases: changed, registerPlanningTools, asOf: "2026-09-02" });

  assert.equal(report.records_with_official_sources, 4);
  assert.equal(report.release_ready, false);
});
