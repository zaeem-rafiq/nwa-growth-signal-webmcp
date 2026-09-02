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
  "RZ26-00419": "Recommended",
  "VAR26-0397": "Withdrawn",
  "RZ26-00511": "Recommended",
  "RZ26-00345": "Recommended",
};
const EXPECTED_CLAIM_HASHES = {
  "signal-1": "68da7d0ed49b31130360a42b1bec2715f74a52d7da9ac7d3cebf2a7f5cc6ecec",
  "signal-2": "9b9c002a839f091b360580f83da7944474354cfd001bb0c31172db7979dcb01d",
  "signal-3": "ae703fab80e122815596c188963cc3f8ff3d8d8b216af29da1580f1899edd6b4",
  "signal-4": "359fa2e065c2992723704837bce54d43dc3c66732a0104193210f2c662882786",
  "signal-5": "3abece6435a8a8635be8cb76e1abdfa36ee00a25997c16737e707e5c78327ccf",
};

const SCENARIOS = Object.freeze({
  primary: Object.freeze({
    search: Object.freeze({ residential_only: true, requires_action: true }),
    inspect: "RZ26-00511",
    stage: Object.freeze({
      case_ids: Object.freeze(["RZ26-0041", "RZ26-00419", "RZ26-00511"]),
      audience: "Land and development",
    }),
    changes: Object.freeze({}),
  }),
  counter: Object.freeze({
    search: Object.freeze({ city: "Rogers", status: "Withdrawn", residential_only: true }),
    inspect: "VAR26-0397",
    stage: Object.freeze({
      case_ids: Object.freeze(["VAR26-0397", "RZ26-00345"]),
      audience: "Public-interest planning",
    }),
    changes: Object.freeze({ city: "Rogers", changed_only: false }),
  }),
});

// The human path to "which filings changed" is opening every record and reading its status-history
// line, so the two records that are not staged are opened once each and never added.
const PRIMARY_HUMAN_TRACE = Object.freeze([
  "Set Action needed to Yes",
  "Open RZ26-0041",
  "Add RZ26-0041",
  "Open FP26-0003",
  "Open RZ26-00419",
  "Add RZ26-00419",
  "Open RZ26-00511",
  "Add RZ26-00511",
  "Open RZ26-00345",
  "Stage brief",
]);
const PRIMARY_TOOL_TRACE = Object.freeze([
  "Invoke search_planning_cases",
  "Invoke list_status_changes",
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

function canonicalOutcome({ searchResults, inspected, brief, stage, changes, freshness }) {
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
    status_changes: {
      previous_verified_at: changes.previous_verified_at,
      entries: changes.changes,
    },
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
    changes: core.listStatusChanges(cases, scenario.changes),
    freshness: { search: freshness, inspection: freshness, staging: freshness, changes: freshness },
  });
}

async function runToolScenario(tools, stagedBriefs, scenario) {
  const search = await tools.search_planning_cases.execute(scenario.search);
  const inspected = await tools.inspect_case_record.execute({ case_id: scenario.inspect });
  const stage = await tools.stage_source_backed_brief.execute(scenario.stage);
  const changes = await tools.list_status_changes.execute(scenario.changes);
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
    changes: { previous_verified_at: changes.previous_verified_at, changes: changes.changes },
    freshness: {
      search: search.freshness,
      inspection: inspected.freshness,
      staging: stage.freshness,
      changes: changes.freshness,
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
    changed_filings: primary.status_changes.entries
      .filter(({ changed }) => changed)
      .map(({ case_id: caseId }) => caseId),
    scenario_fields_compared: [
      "filing IDs",
      "filing/status pairs",
      "audience",
      "official URLs",
      "standing note",
      "stage response",
      "previous verification date",
      "status-change entries",
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
    && report.tools_exercised.length === 4
    && report.changed_filings.join(",") === "RZ26-00419,RZ26-00511"
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
