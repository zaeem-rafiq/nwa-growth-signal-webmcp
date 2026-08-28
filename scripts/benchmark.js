const { createHash } = require("node:crypto");
const core = require("../site/core.js");

const OFFICIAL_SOURCE = /^https:\/\/(?:www\.)?(?:bentonvillear\.portal\.civicclerk\.com|bentonville\.ar\.gov|rogersar\.gov|permitting\.rogersar\.gov)\//;
const APPROVAL_OVERCLAIM = /\b(?:approved|approval|adopted|adoption|authorized|greenlit|under construction|construction (?:has |is |was )?(?:started|begun|starts|begins)|(?:rezoning|approval|adoption) (?:is|was) final)\b/i;
// Update these release baselines only after re-verifying the official records and copy.
const EXPECTED_STATUSES = {
  "RZ26-0041": "Scheduled",
  "FP26-0003": "Scheduled",
  "FP26-0004": "Scheduled",
  "FP26-0005": "Scheduled",
  "RZ26-00419": "Tabled",
  "VAR26-0397": "Withdrawn",
  "RZ26-00511": "Scheduled",
  "RZ26-00345": "Recommended",
};
const EXPECTED_CLAIM_HASHES = {
  "signal-1": "930045bd866886d541633be3ff5134cb6e2dea51400794d146b013cf846b717f",
  "signal-2": "36a6745681a17183992f8d34201f970ede23085709c58f1d74405f45463dc984",
  "signal-3": "e7d49fe116a41160a4e474db334c51a76c96e9225899b1c8d3f143a327b251b0",
  "signal-4": "1104f52772085a743b40e83de93f48ddd8c32eac813b661326ed488b198ce663",
  "signal-5": "026bfb4457ead6ad97f21b9c02e909833bcac9ab014024d405593b4bd60f8497",
};

const SCENARIOS = Object.freeze({
  primary: Object.freeze({
    search: Object.freeze({ residential_only: true, requires_action: true }),
    inspect: "RZ26-00511",
    stage: Object.freeze({
      case_ids: Object.freeze(["RZ26-0041", "RZ26-00419", "RZ26-00511"]),
      audience: "Land and development",
    }),
  }),
  counter: Object.freeze({
    search: Object.freeze({ city: "Rogers", status: "Withdrawn", residential_only: true }),
    inspect: "VAR26-0397",
    stage: Object.freeze({
      case_ids: Object.freeze(["VAR26-0397", "RZ26-00345"]),
      audience: "Public-interest planning",
    }),
  }),
});

const PRIMARY_HUMAN_TRACE = Object.freeze([
  "Set Action needed to Yes",
  "Open RZ26-0041",
  "Add RZ26-0041",
  "Open RZ26-00419",
  "Add RZ26-00419",
  "Open RZ26-00511",
  "Add RZ26-00511",
  "Stage brief",
]);
const PRIMARY_TOOL_TRACE = Object.freeze([
  "Invoke search_planning_cases",
  "Invoke inspect_case_record",
  "Invoke stage_source_backed_brief",
]);

function claimCopy(record) {
  return [record.summary, record.proposal, record.significance, record.next_step]
    .filter(Boolean)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

function recordOutcome(record, filings = record.matching_filings || record.selected_filings || record.filings || []) {
  return {
    record_id: record.id,
    filing_ids: filings.map(({ case_id: caseId }) => caseId),
    filing_statuses: filings.map(({ case_id: caseId, status }) => [caseId, status]),
    official_urls: record.sources.map(({ url }) => url),
  };
}

function briefStageOutcome(brief) {
  const filingIds = brief.items.flatMap((record) =>
    (record.selected_filings || record.filings || []).map(({ case_id: caseId }) => caseId)
  );
  return {
    staged: true,
    review_required: brief.review_required,
    item_count: brief.items.length,
    filing_count: filingIds.length,
    filing_ids: filingIds,
  };
}

function canonicalOutcome({ searchResults, inspected, brief, stage, freshness }) {
  const inspectedFilings = inspected.requested_filing ? [inspected.requested_filing] : inspected.filings;
  return {
    search: searchResults.map((record) => recordOutcome(record)),
    inspection: recordOutcome(inspected, inspectedFilings),
    brief: {
      audience: brief.audience,
      review_required: brief.review_required,
      standing_note: brief.standing_note,
      items: brief.items.map((record) => recordOutcome(record)),
    },
    stage,
    freshness,
  };
}

function outcomeHash(outcome) {
  return createHash("sha256").update(JSON.stringify(outcome)).digest("hex");
}

function runCoreScenario(cases, scenario, freshness) {
  const brief = core.stageSourceBackedBrief(cases, scenario.stage);
  return canonicalOutcome({
    searchResults: core.searchPlanningCases(cases, scenario.search),
    inspected: core.inspectCaseRecord(cases, scenario.inspect),
    brief,
    stage: briefStageOutcome(brief),
    freshness: { search: freshness, inspection: freshness, staging: freshness },
  });
}

async function runToolScenario(tools, stagedBriefs, scenario) {
  const search = await tools.search_planning_cases.execute(scenario.search);
  const inspected = await tools.inspect_case_record.execute({ case_id: scenario.inspect });
  const stage = await tools.stage_source_backed_brief.execute(scenario.stage);
  const brief = stagedBriefs.shift();
  if (!brief) throw new Error("The staging tool did not provide a reviewable brief.");
  return canonicalOutcome({
    searchResults: search.results,
    inspected,
    brief,
    stage: {
      staged: stage.staged,
      review_required: stage.review_required,
      item_count: stage.item_count,
      filing_count: stage.filing_count,
      filing_ids: stage.filing_ids,
    },
    freshness: {
      search: search.freshness,
      inspection: inspected.freshness,
      staging: stage.freshness,
    },
  });
}

async function runBenchmark({
  cases,
  registerPlanningTools,
  asOf = core.northwestArkansasCivilDate(),
}) {
  const registered = [];
  const stagedBriefs = [];
  let stagedBriefCallbacks = 0;
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: (brief) => {
      stagedBriefCallbacks += 1;
      stagedBriefs.push(brief);
    },
    asOf,
  });
  const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));
  const freshness = core.evaluateSnapshotFreshness(core.SNAPSHOT, asOf);
  const scenarioReports = {};
  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    const coreOutcome = runCoreScenario(cases, scenario, freshness);
    const toolOutcome = await runToolScenario(tools, stagedBriefs, scenario);
    const coreHash = outcomeHash(coreOutcome);
    const toolHash = outcomeHash(toolOutcome);
    scenarioReports[name] = {
      parity: coreHash === toolHash,
      core_sha256: coreHash,
      tool_sha256: toolHash,
      outcome: toolOutcome,
    };
  }

  const statusChecks = cases.flatMap((record) => record.filings.map((filing) => {
    const inspected = core.inspectCaseRecord(cases, filing.case_id);
    return filing.status === EXPECTED_STATUSES[filing.case_id]
      && inspected.requested_filing?.status === EXPECTED_STATUSES[filing.case_id];
  }));
  const claimText = cases.flatMap((record) => [
    claimCopy(record),
    ...record.filings.map(({ status }) => status),
  ]);
  const claimCopyChecks = cases.map((record) =>
    createHash("sha256").update(claimCopy(record)).digest("hex") === EXPECTED_CLAIM_HASHES[record.id]
  );

  const primary = scenarioReports.primary.outcome;
  const report = {
    dataset_verified_at: core.SNAPSHOT.verified_at,
    freshness,
    records_checked: cases.length,
    filing_status_checks: statusChecks.length,
    filing_status_checks_passed: statusChecks.filter(Boolean).length,
    records_with_official_sources: cases.filter((record) =>
      record.sources.length > 0 && record.sources.every(({ url }) => OFFICIAL_SOURCE.test(url))
    ).length,
    claim_copy_checks: claimCopyChecks.length,
    claim_copy_checks_passed: claimCopyChecks.filter(Boolean).length,
    approval_overclaims: claimText.filter((claim) => APPROVAL_OVERCLAIM.test(claim)).length,
    tools_exercised: registered.map(({ name }) => name),
    search_results: primary.search.length,
    staged_records: primary.brief.items.length,
    staged_brief_callbacks: stagedBriefCallbacks,
    review_required: primary.brief.review_required,
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
    scenarios: scenarioReports,
    interaction_evidence: {
      label: "Fixed-script interface-action evidence; not observed time savings or general productivity evidence.",
      counting_rule: "One direct human control activation or one browser-agent tool invocation equals one action.",
      human: { actions: PRIMARY_HUMAN_TRACE.length, raw_trace: [...PRIMARY_HUMAN_TRACE] },
      browser_agent: { actions: PRIMARY_TOOL_TRACE.length, raw_trace: [...PRIMARY_TOOL_TRACE] },
    },
  };
  report.release_ready = report.records_checked === 5
    && report.filing_status_checks === 8
    && report.filing_status_checks_passed === 8
    && report.records_with_official_sources === 5
    && report.claim_copy_checks_passed === 5
    && report.approval_overclaims === 0
    && report.tools_exercised.length === 3
    && report.search_results === 5
    && report.staged_records === 3
    && report.staged_brief_callbacks === 2
    && report.review_required === true
    && freshness.state === "current"
    && Object.values(scenarioReports).every(({ parity, outcome }) =>
      parity && outcome.brief.review_required &&
      Object.values(outcome.freshness).every((value) => value.state === "current")
    );
  return report;
}

if (require.main === module) {
  const cases = require("../site/cases.json");
  const { registerPlanningTools } = require("../site/webmcp.js");
  runBenchmark({ cases, registerPlanningTools, asOf: process.argv[2] })
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (!report.release_ready) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { PRIMARY_HUMAN_TRACE, runBenchmark };
