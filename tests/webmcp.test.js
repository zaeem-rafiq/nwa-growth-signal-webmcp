const test = require("node:test");
const assert = require("node:assert/strict");

const { registerPlanningTools } = require("../site/webmcp.js");
const cases = require("../site/cases.json");

test("the page exposes the four planning workflow tools to an agent", async () => {
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
    "list_status_changes",
  ]);
});

test("real handler calls emit monotonic started and succeeded receipt events", async () => {
  const registered = [];
  const events = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
    onActivity: (event) => events.push(event),
    asOf: "2026-09-02",
  });
  const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));

  await tools.search_planning_cases.execute({ residential_only: true });
  await tools.inspect_case_record.execute({ case_id: "RZ26-00511" });
  await tools.stage_source_backed_brief.execute({
    case_ids: ["RZ26-00511"],
    audience: "Land and development",
  });

  assert.deepEqual(events, [
    { id: 1, tool: "search_planning_cases", status: "started", code: "CALL_STARTED", summary: "Call started." },
    { id: 1, tool: "search_planning_cases", status: "succeeded", code: "SEARCH_COMPLETE", summary: "5 verified records matched." },
    { id: 2, tool: "inspect_case_record", status: "started", code: "CALL_STARTED", summary: "Call started." },
    { id: 2, tool: "inspect_case_record", status: "succeeded", code: "RECORD_FOUND", summary: "RZ26-00511 · Recommended." },
    { id: 3, tool: "stage_source_backed_brief", status: "started", code: "CALL_STARTED", summary: "Call started." },
    { id: 3, tool: "stage_source_backed_brief", status: "succeeded", code: "BRIEF_STAGED", summary: "1 filing staged · human review required." },
  ]);
});

test("invalid hostile input emits a bounded typed failure and the next call recovers", async () => {
  const registered = [];
  const events = [];
  const hostile = `<script>${"x".repeat(5000)}</script>`;
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
    onActivity: (event) => events.push(event),
  });
  const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));

  await assert.rejects(() => tools.inspect_case_record.execute({ case_id: hostile }), /Invalid case inspection input/);
  await tools.search_planning_cases.execute({ city: "Rogers" });

  assert.deepEqual(events.slice(0, 2), [
    { id: 1, tool: "inspect_case_record", status: "started", code: "CALL_STARTED", summary: "Call started." },
    { id: 1, tool: "inspect_case_record", status: "failed", code: "VALIDATION_FAILED", summary: "Call rejected: invalid input." },
  ]);
  assert.deepEqual(events.slice(2).map(({ id, status }) => ({ id, status })), [
    { id: 2, status: "started" },
    { id: 2, status: "succeeded" },
  ]);
  assert.equal(JSON.stringify(events).includes(hostile), false);
  assert.ok(JSON.stringify(events).length < 1000);
});

test("an unknown record emits a generic bounded failure and the next call recovers", async () => {
  const registered = [];
  const events = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
    onActivity: (event) => events.push(event),
  });
  const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));

  await assert.rejects(() => tools.inspect_case_record.execute({ case_id: "UNKNOWN" }), /Unknown planning record/);
  await tools.search_planning_cases.execute({ city: "Rogers" });

  assert.deepEqual(events.slice(0, 2), [
    { id: 1, tool: "inspect_case_record", status: "started", code: "CALL_STARTED", summary: "Call started." },
    { id: 1, tool: "inspect_case_record", status: "failed", code: "TOOL_FAILED", summary: "Call failed safely." },
  ]);
  assert.equal(JSON.stringify(events).includes("UNKNOWN"), false);
  assert.deepEqual(events.slice(2).map(({ id, status }) => ({ id, status })), [
    { id: 2, status: "started" },
    { id: 2, status: "succeeded" },
  ]);
});

test("a receipt callback failure cannot change search or staging outcomes", async () => {
  const registered = [];
  let stagedBrief;
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: (brief) => { stagedBrief = brief; },
    onActivity: () => { throw new Error("receipt sink unavailable"); },
    asOf: "2026-09-02",
  });
  const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));

  const search = await tools.search_planning_cases.execute({ city: "Bentonville" });
  const stage = await tools.stage_source_backed_brief.execute({
    case_ids: ["RZ26-0041"],
    audience: "Land and development",
  });

  assert.equal(search.results.length, 2);
  assert.equal(stage.staged, true);
  assert.deepEqual(stagedBrief.items[0].selected_filings.map(({ case_id: caseId }) => caseId), ["RZ26-0041"]);
});

test("receipt projection failure cannot change a valid inspection result", async () => {
  const registered = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases: [{ id: "minimal", case_ids: ["MIN-1"] }],
    onBrief: () => {},
    onActivity: () => {},
  });
  const inspect = registered.find(({ name }) => name === "inspect_case_record");

  const result = await inspect.execute({ case_id: "minimal" });

  assert.equal(result.id, "minimal");
});

test("a visible brief callback failure makes staging fail with a generic receipt code", async () => {
  const registered = [];
  const events = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => { throw new Error("host DOM leaked details"); },
    onActivity: (event) => events.push(event),
  });
  const stage = registered.find(({ name }) => name === "stage_source_backed_brief");

  await assert.rejects(
    () => stage.execute({ case_ids: ["RZ26-0041"], audience: "Land and development" }),
    (error) => error.code === "CALLBACK_FAILED" && error.message === "Brief could not be staged."
  );

  assert.deepEqual(events, [
    { id: 1, tool: "stage_source_backed_brief", status: "started", code: "CALL_STARTED", summary: "Call started." },
    { id: 1, tool: "stage_source_backed_brief", status: "failed", code: "CALLBACK_FAILED", summary: "Visible brief update failed." },
  ]);
  assert.equal(JSON.stringify(events).includes("host DOM leaked details"), false);
});

test("schema-invalid staging input uses the bounded validation failure receipt", async () => {
  const registered = [];
  const events = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
    onActivity: (event) => events.push(event),
  });
  const stage = registered.find(({ name }) => name === "stage_source_backed_brief");

  await assert.rejects(
    () => stage.execute({ case_ids: [], audience: "Land and development" }),
    /one to five unique case IDs/
  );
  assert.equal(events.at(-1).code, "VALIDATION_FAILED");
  assert.equal(events.at(-1).summary, "Call rejected: invalid input.");
});

test("the agent workflow finds every residential record still awaiting procedural action", async () => {
  const registered = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
    asOf: "2026-09-02",
  });

  const search = registered.find(({ name }) => name === "search_planning_cases");
  const result = await search.execute({ residential_only: true, requires_action: true });

  assert.equal(result.results.length, 5);
  assert.deepEqual(result.freshness, {
    state: "current",
    as_of: "2026-09-02",
    reverify_on: "2026-09-08",
  });
});

test("every tool output carries the same exact freshness context", async () => {
  const registered = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
    asOf: "2026-09-08",
  });
  const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));
  const outputs = await Promise.all([
    tools.search_planning_cases.execute({}),
    tools.inspect_case_record.execute({ case_id: "RZ26-00511" }),
    tools.stage_source_backed_brief.execute({
      case_ids: ["RZ26-00511"],
      audience: "Land and development",
    }),
    tools.list_status_changes.execute({}),
  ]);

  assert.equal(outputs.length, 4);
  outputs.forEach((output) => assert.deepEqual(output.freshness, {
    state: "reverification_due",
    as_of: "2026-09-08",
    reverify_on: "2026-09-08",
  }));
});

test("the registered tools inspect evidence and stage a visible review-required brief", async () => {
  const registered = [];
  let stagedBrief;
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: (brief) => { stagedBrief = brief; },
    asOf: "2026-09-02",
  });

  const inspect = registered.find(({ name }) => name === "inspect_case_record");
  const stage = registered.find(({ name }) => name === "stage_source_backed_brief");
  const record = await inspect.execute({ case_id: "RZ26-00511" });
  const result = await stage.execute({ case_ids: ["RZ26-00511"], audience: "Lending and title" });

  assert.equal(record.requested_filing.status, "Recommended");
  assert.deepEqual(stagedBrief.items[0].selected_filings, [record.requested_filing]);
  assert.deepEqual(result, {
    staged: true,
    review_required: true,
    item_count: 1,
    filing_count: 1,
    filing_ids: ["RZ26-00511"],
    freshness: {
      state: "current",
      as_of: "2026-09-02",
      reverify_on: "2026-09-08",
    },
    message: "The brief is staged in the page for human review. Nothing was published or sent.",
  });
  await assert.rejects(() => inspect.execute({ case_id: "UNKNOWN" }), /Unknown planning record/);
  await assert.rejects(
    () => stage.execute({ case_ids: [], audience: "Lending and title" }),
    /one to five unique case IDs/
  );
});

test("staging two filings on one record reports both filing IDs", async () => {
  const registered = [];
  const events = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
    onActivity: (event) => events.push(event),
    asOf: "2026-09-02",
  });
  const stage = registered.find(({ name }) => name === "stage_source_backed_brief");

  const result = await stage.execute({
    case_ids: ["VAR26-0397", "RZ26-00511"],
    audience: "Public-interest planning",
  });

  assert.equal(result.item_count, 1);
  assert.equal(result.filing_count, 2);
  assert.deepEqual(result.filing_ids, ["VAR26-0397", "RZ26-00511"]);
  assert.equal(events.at(-1).summary, "2 filings staged · human review required.");
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
  await tools.list_status_changes.execute({ city: "Rogers", changed_only: false });
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
  const invalidChanges = await Promise.allSettled([
    null,
    [],
    { extra: true },
    { city: "Fayetteville" },
    { changed_only: "yes" },
    { include_unchanged: true },
    { since: "2026-08-25" },
  ].map((input) => tools.list_status_changes.execute(input)));

  for (const [results, message] of [
    [invalidSearches, /Invalid search filters/],
    [invalidInspections, /Invalid case inspection input/],
    [invalidStages, /Invalid brief input|A brief requires|Unsupported brief audience/],
    [invalidChanges, /Invalid status change filters/],
  ]) {
    for (const result of results) {
      assert.equal(result.status, "rejected");
      assert.match(result.reason.message, message);
    }
  }
  assert.strictEqual(stagedBrief, stagedSentinel);
});

test("a failed fourth-tool registration aborts the three tools registered before it", async () => {
  const exposed = new Set();
  const modelContext = {
    async registerTool(tool, { signal }) {
      if (tool.name === "list_status_changes") throw new Error("registration failed");
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

test("the status change tool returns the two moved filings with dated official sources and a receipt", async () => {
  const registered = [];
  const events = [];
  await registerPlanningTools({
    modelContext: { registerTool: async (tool) => registered.push(tool) },
    cases,
    onBrief: () => {},
    onActivity: (event) => events.push(event),
    asOf: "2026-09-02",
  });
  const changes = registered.find(({ name }) => name === "list_status_changes");
  const filing = (caseId) => cases.flatMap(({ filings }) => filings).find(({ case_id: id }) => id === caseId);

  assert.deepEqual(changes.annotations, { readOnlyHint: true, untrustedContentHint: false });
  assert.deepEqual(Object.keys(changes.inputSchema.properties), ["city", "changed_only"]);
  assert.equal(changes.inputSchema.additionalProperties, false);

  const result = await changes.execute({});

  assert.deepEqual(result, {
    verified_at: "2026-09-02",
    previous_verified_at: "2026-08-25",
    freshness: { state: "current", as_of: "2026-09-02", reverify_on: "2026-09-08" },
    changes: [
      {
        record_id: "signal-3",
        title: "209 W. Locust Street",
        city: "Rogers",
        case_id: "RZ26-00419",
        from: filing("RZ26-00419").status_history[0],
        to: filing("RZ26-00419").status_history[1],
        changed: true,
      },
      {
        record_id: "signal-4",
        title: "408 E. Poplar Street",
        city: "Rogers",
        case_id: "RZ26-00511",
        from: filing("RZ26-00511").status_history[0],
        to: filing("RZ26-00511").status_history[1],
        changed: true,
      },
    ],
  });
  assert.deepEqual(result.changes.map(({ from, to }) => [from.status, to.status]), [
    ["Tabled", "Recommended"],
    ["Scheduled", "Recommended"],
  ]);
  assert.ok(result.changes.every(({ from, to }) => /^https:\/\/www\.rogersar\.gov\//.test(from.source) && from.source === to.source));
  assert.doesNotMatch(JSON.stringify(result), /\b(?:approved|adopted|denied)\b/i);
  assert.deepEqual(events, [
    { id: 1, tool: "list_status_changes", status: "started", code: "CALL_STARTED", summary: "Call started." },
    { id: 1, tool: "list_status_changes", status: "succeeded", code: "CHANGES_LISTED", summary: "2 filings changed since 2026-08-25." },
  ]);

  const bentonville = await changes.execute({ city: "Bentonville", changed_only: false });

  assert.deepEqual(bentonville.changes.map(({ case_id: caseId, changed }) => [caseId, changed]), [
    ["RZ26-0041", false],
    ["FP26-0003", false],
    ["FP26-0004", false],
    ["FP26-0005", false],
  ]);
  assert.match(bentonville.changes[3].to.note, /Absent from the reissued September 1 agenda/);
  assert.equal(events.at(-1).summary, "0 filings changed since 2026-08-25.");
});
