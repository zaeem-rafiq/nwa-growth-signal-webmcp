const { createHash } = require("node:crypto");

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

function claimCopy(record) {
  return [record.summary, record.proposal, record.significance, record.next_step]
    .filter(Boolean)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

async function runBenchmark({ cases, registerPlanningTools }) {
  const registered = [];
  let stagedBriefCallbacks = 0;
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => { stagedBriefCallbacks += 1; },
  });
  const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));
  const statusChecks = await Promise.all(cases.flatMap((record) =>
    record.filings.map(async (filing) => {
      const inspected = await tools.inspect_case_record.execute({ case_id: filing.case_id });
      return filing.status === EXPECTED_STATUSES[filing.case_id]
        && inspected.requested_filing?.status === EXPECTED_STATUSES[filing.case_id];
    })
  ));
  const search = await tools.search_planning_cases.execute({
    residential_only: true,
    requires_action: true,
  });
  const staged = await tools.stage_source_backed_brief.execute({
    case_ids: ["RZ26-0041", "RZ26-00419", "RZ26-00511"],
    audience: "Land and development",
  });
  const claimText = cases.flatMap((record) => [
    claimCopy(record),
    ...record.filings.map(({ status }) => status),
  ]);
  const claimCopyChecks = cases.map((record) =>
    createHash("sha256").update(claimCopy(record)).digest("hex") === EXPECTED_CLAIM_HASHES[record.id]
  );

  const report = {
    dataset_verified_at: cases[0]?.verified_at || null,
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
    search_results: search.results.length,
    staged_records: staged.item_count,
    staged_brief_callbacks: stagedBriefCallbacks,
    review_required: staged.review_required,
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
    && report.staged_brief_callbacks === 1
    && report.review_required === true;
  return report;
}

if (require.main === module) {
  const cases = require("../site/cases.json");
  const { registerPlanningTools } = require("../site/webmcp.js");
  runBenchmark({ cases, registerPlanningTools })
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (!report.release_ready) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { runBenchmark };
