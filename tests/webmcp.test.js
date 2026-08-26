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
