const test = require("node:test");
const assert = require("node:assert/strict");

const { registerPlanningTools } = require("../site/webmcp.js");
const cases = require("../site/cases.json");

test("the page exposes the three planning workflow tools to an agent", async () => {
  const registered = [];
  const modelContext = {
    registerTool(tool) {
      registered.push(tool);
      return Promise.resolve();
    },
  };

  await registerPlanningTools({ modelContext, cases: [], onBrief: () => {} });

  assert.deepEqual(registered.map(({ name }) => name), [
    "search_planning_cases",
    "inspect_case_record",
    "stage_source_backed_brief",
  ]);
});

test("the agent workflow finds every residential record still awaiting procedural action", async () => {
  const registered = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
  });

  const search = registered.find(({ name }) => name === "search_planning_cases");
  const result = await search.execute({ residential_only: true, requires_action: true });

  assert.equal(result.results.length, 5);
});

test("the registered tools inspect evidence and stage a visible review-required brief", async () => {
  const registered = [];
  let stagedBrief;
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: (brief) => { stagedBrief = brief; },
  });

  const inspect = registered.find(({ name }) => name === "inspect_case_record");
  const stage = registered.find(({ name }) => name === "stage_source_backed_brief");
  const record = await inspect.execute({ case_id: "RZ26-00511" });
  const result = await stage.execute({ case_ids: ["RZ26-00511"], audience: "Lending and title" });

  assert.equal(record.requested_filing.status, "Scheduled");
  assert.deepEqual(stagedBrief.items[0].selected_filings, [record.requested_filing]);
  assert.deepEqual(result, {
    staged: true,
    review_required: true,
    item_count: 1,
    message: "The brief is staged in the page for human review. Nothing was published or sent.",
  });
  await assert.rejects(() => inspect.execute({ case_id: "UNKNOWN" }), /Unknown planning record/);
  await assert.rejects(
    () => stage.execute({ case_ids: [], audience: "Lending and title" }),
    /one to five unique case IDs/
  );
});

test("a failed tool registration aborts the successfully registered siblings", async () => {
  const exposed = new Set();
  const modelContext = {
    async registerTool(tool, { signal }) {
      if (tool.name === "inspect_case_record") throw new Error("registration failed");
      exposed.add(tool.name);
      signal.addEventListener("abort", () => exposed.delete(tool.name), { once: true });
    },
  };

  await assert.rejects(
    () => registerPlanningTools({ modelContext, cases, onBrief: () => {} }),
    /registration failed/
  );
  assert.deepEqual([...exposed], []);
});

test("registered tools reject inputs outside their advertised schemas", async () => {
  const registered = [];
  let stagedBrief = null;
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: (brief) => { stagedBrief = brief; },
  });
  const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));

  await tools.search_planning_cases.execute({ city: "Bentonville", requires_action: true });
  await tools.inspect_case_record.execute({ case_id: "RZ26-00511" });
  await tools.stage_source_backed_brief.execute({
    case_ids: ["RZ26-0041"],
    audience: "Land and development",
  });
  const stagedSentinel = stagedBrief;

  const invalidSearches = await Promise.allSettled([
    null,
    [],
    { extra: true },
    { city: "Fayetteville" },
    { status: "Approved" },
    { residential_only: "yes" },
    { requires_action: "yes" },
  ].map((input) => tools.search_planning_cases.execute(input)));
  const invalidInspections = await Promise.allSettled([
    null,
    [],
    {},
    { case_id: 123 },
    { case_id: "" },
    { case_id: "X".repeat(33) },
    { case_id: "RZ26-00511", extra: true },
  ].map((input) => tools.inspect_case_record.execute(input)));
  const invalidStages = await Promise.allSettled([
    null,
    [],
    {},
    { case_ids: "RZ26-0041", audience: "Land and development" },
    { case_ids: [], audience: "Land and development" },
    { case_ids: ["A", "B", "C", "D", "E", "F"], audience: "Land and development" },
    { case_ids: ["RZ26-0041", "RZ26-0041"], audience: "Land and development" },
    { case_ids: [123], audience: "Land and development" },
    { case_ids: [""], audience: "Land and development" },
    { case_ids: ["X".repeat(33)], audience: "Land and development" },
    { case_ids: ["RZ26-0041"] },
    { case_ids: ["RZ26-0041"], audience: "Everyone" },
    { case_ids: ["RZ26-0041"], audience: "Land and development", extra: true },
  ].map((input) => tools.stage_source_backed_brief.execute(input)));

  for (const [results, message] of [
    [invalidSearches, /Invalid search filters/],
    [invalidInspections, /Invalid case inspection input/],
    [invalidStages, /Invalid brief input|A brief requires|Unsupported brief audience/],
  ]) {
    for (const result of results) {
      assert.equal(result.status, "rejected");
      assert.match(result.reason.message, message);
    }
  }
  assert.strictEqual(stagedBrief, stagedSentinel);
});
