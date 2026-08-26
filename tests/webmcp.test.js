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
