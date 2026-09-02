const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const core = require("../site/core.js");
const { PRIMARY_HUMAN_TRACE } = require("../scripts/benchmark.js");
const cases = require("../site/cases.json");
const appSource = fs.readFileSync(path.join(__dirname, "..", "site", "app.js"), "utf8");

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName;
    this.dataset = {};
    this.value = "";
    this.disabled = false;
    this.textContent = "";
    this.className = "";
    this.attributes = new Map();
    this.children = [];
    this.listeners = new Map();
  }
  addEventListener(type, listener) {
    this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
  }
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren(...children) {
    this.children = children;
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  focus() {
    this.focused = true;
  }
  async dispatch(type) {
    if (this.disabled) return;
    await Promise.all((this.listeners.get(type) || []).map((listener) => listener({ target: this })));
  }
  querySelector(selector) {
    const attribute = selector.match(/^\[([^=]+)="([^"]+)"\]$/);
    const matches = (element) => selector.startsWith(".")
      ? element.className.split(" ").includes(selector.slice(1))
      : attribute
        ? element.attributes.get(attribute[1]) === attribute[2]
        : element.tagName === selector;
    for (const child of this.children) {
      if (matches(child)) return child;
      const nested = child.querySelector(selector);
      if (nested) return nested;
    }
    return null;
  }
}

function createDocument(modelContext) {
  const elements = new Map();
  const selectors = [
    "#city-filter", "#status-filter", "#action-filter", "#reset-filters", "#result-count", "#record-list", "#record-list-status",
    "#record-detail", ".signal-desk", "#desk-message", "#desk-message-copy", "#retry-load",
    "#selection-tray", "#selection-count", "#selected-records", "#brief-audience", "#stage-brief", "#brief-preview",
    "#mark-reviewed", "#workspace-status", "#webmcp-state", "#demo-prompt", "#copy-prompt", "#copy-status",
    "#receipt-empty", "#receipt-rows", "#receipt-disclosure", "#freshness-summary", "#freshness-state", "#freshness-detail",
  ];
  selectors.forEach((selector) => elements.set(selector, new FakeElement()));
  elements.get("#brief-audience").value = "Land and development";
  elements.get("#demo-prompt").textContent = "Stage a verified brief.";
  const stateTitle = new FakeElement("strong");
  const stateDetail = new FakeElement("span");
  stateDetail.className = "state-detail";
  elements.get("#webmcp-state").append(stateTitle, stateDetail);
  const document = {
    modelContext,
    createElement: (tagName) => new FakeElement(tagName),
    querySelector: (selector) => elements.get(selector),
    elements,
  };
  document.range = {
    selectNodeContents(node) { this.selectedNode = node; },
  };
  document.selection = {
    ranges: [],
    removeAllRanges() { this.ranges = []; },
    addRange(range) { this.ranges.push(range); },
  };
  document.createRange = () => document.range;
  return document;
}

async function runApp({ modelContext, fetchResponse, registerPlanningTools, clipboardWrite = async () => {}, abortSignal = AbortSignal, signalCore = core }) {
  const document = createDocument(modelContext);
  const window = {
    NWASignal: signalCore,
    NWAWebMCP: { registerPlanningTools },
    getSelection: () => document.selection,
  };
  vm.runInNewContext(appSource, {
    console: { error() {} },
    document,
    fetch: typeof fetchResponse === "function" ? fetchResponse : async () => fetchResponse,
    navigator: { clipboard: { writeText: clipboardWrite } },
    AbortSignal: abortSignal,
    Set,
    window,
  });
  await new Promise((resolve) => setImmediate(resolve));
  return document;
}

test("the app exposes an unsupported-browser fallback without losing the human interface", async () => {
  const document = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
  });
  const state = document.elements.get("#webmcp-state");

  assert.equal(state.dataset.state, "unsupported");
  assert.equal(state.querySelector("strong").textContent, "WebMCP not exposed in this browser");
});

test("the live receipt replaces calls by ID, keeps the latest eight, and discloses truncation", async () => {
  let onActivity;
  const document = await runApp({
    modelContext: { registerTool() {} },
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async (options) => { onActivity = options.onActivity; },
  });
  const elements = document.elements;

  assert.equal(elements.get("#receipt-empty").textContent, "No agent calls have run in this session.");
  onActivity({ id: 1, tool: "search_planning_cases", status: "started", code: "CALL_STARTED", summary: "Call started." });
  onActivity({ id: 1, tool: "search_planning_cases", status: "succeeded", code: "SEARCH_COMPLETE", summary: "5 verified records matched." });
  for (let id = 2; id <= 9; id += 1) {
    onActivity({ id, tool: "inspect_case_record", status: "succeeded", code: "RECORD_FOUND", summary: `Record ${id} found.` });
  }

  const rows = elements.get("#receipt-rows");
  assert.equal(rows.children.length, 8);
  assert.equal(rows.children[0].attributes.get("data-call-id"), "2");
  assert.equal(rows.children[7].attributes.get("data-call-id"), "9");
  assert.equal(rows.children.some((row) => row.querySelector(".receipt-state").textContent === "started"), false);
  assert.equal(elements.get("#receipt-empty").hidden, true);
  assert.equal(elements.get("#receipt-disclosure").hidden, false);
});

test("agent receipts stay separate from the human-owned workspace review lifecycle", async () => {
  let onActivity;
  let onBrief;
  const document = await runApp({
    modelContext: { registerTool() {} },
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async (options) => {
      onActivity = options.onActivity;
      onBrief = options.onBrief;
    },
  });
  const elements = document.elements;
  const brief = core.stageSourceBackedBrief(cases, {
    case_ids: ["RZ26-00511"],
    audience: "Public-interest planning",
  });

  onActivity({ id: 1, tool: "stage_source_backed_brief", status: "started", code: "CALL_STARTED", summary: "Call started." });
  onBrief(brief);
  onActivity({ id: 1, tool: "stage_source_backed_brief", status: "succeeded", code: "BRIEF_STAGED", summary: "1 filing staged · human review required." });

  assert.match(elements.get("#workspace-status").textContent, /Agent staged 1 record\. Review required/);
  assert.equal(elements.get("#mark-reviewed").disabled, false);
  assert.equal(elements.get("#receipt-rows").children[0].querySelector(".receipt-state").textContent, "succeeded");

  await elements.get("#mark-reviewed").dispatch("click");
  assert.match(elements.get("#workspace-status").textContent, /Human review recorded/);
  assert.equal(elements.get("#receipt-rows").children[0].querySelector(".receipt-state").textContent, "succeeded");

  elements.get("#brief-audience").value = "Lending and title";
  await elements.get("#brief-audience").dispatch("change");
  assert.match(elements.get("#workspace-status").textContent, /Stage the brief again/);
  assert.equal(elements.get("#receipt-rows").children[0].querySelector(".receipt-state").textContent, "succeeded");
});

test("the app reports registration and verified-record load failures", async () => {
  const registrationDocument = await runApp({
    modelContext: { registerTool() {} },
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => { throw new Error("no tools"); },
  });
  const recordsDocument = await runApp({
    fetchResponse: { ok: false, status: 503 },
    registerPlanningTools: async () => {},
  });
  const registration = registrationDocument.elements.get("#webmcp-state");
  const records = recordsDocument.elements.get("#webmcp-state");

  assert.equal(registration.dataset.state, "error");
  assert.equal(registration.querySelector("strong").textContent, "WebMCP registration failed");
  assert.equal(records.dataset.state, "error");
  assert.equal(records.querySelector("strong").textContent, "Planning record unavailable");
});

test("selection, staging, invalidation, focus, and clipboard recovery execute in the UI", async () => {
  const document = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
    clipboardWrite: async () => { throw new Error("denied"); },
  });
  const elements = document.elements;
  const secondRecord = elements.get("#record-list").querySelector(`[data-record-id="${cases[1].id}"]`);

  await secondRecord.dispatch("click");
  assert.equal(elements.get("#record-list").querySelector(`[data-record-id="${cases[1].id}"]`).focused, true);

  const select = elements.get("#record-detail").querySelector(".select-record");
  await select.dispatch("click");
  assert.equal(elements.get("#selection-count").textContent, "1 selected");
  assert.equal(elements.get("#stage-brief").disabled, false);

  await elements.get("#stage-brief").dispatch("click");
  assert.equal(elements.get("#mark-reviewed").disabled, false);
  assert.match(elements.get("#brief-preview").querySelector(".brief-snapshot").textContent, /1 record staged/);

  elements.get("#brief-audience").value = "Lending and title";
  await elements.get("#brief-audience").dispatch("change");
  assert.equal(elements.get("#mark-reviewed").disabled, true);
  assert.match(elements.get("#workspace-status").textContent, /Stage the brief again/);

  await elements.get("#copy-prompt").dispatch("click");
  assert.equal(elements.get("#demo-prompt").focused, true);
  assert.match(elements.get("#copy-status").textContent, /selected for manual copying/);
  assert.equal(document.range.selectedNode, elements.get("#demo-prompt"));
  assert.deepEqual(document.selection.ranges, [document.range]);

  elements.get("#city-filter").value = "Rogers";
  await elements.get("#city-filter").dispatch("change");
  assert.match(elements.get("#selected-records").querySelector(".selection-disclosure").textContent, /1 selected filing is outside current filters/);

  await elements.get("#stage-brief").dispatch("click");
  await elements.get("#selected-records").querySelector(".remove-selection").dispatch("click");
  assert.equal(elements.get("#selection-count").textContent, "0 selected");
  assert.equal(elements.get("#stage-brief").disabled, true);
  assert.equal(elements.get("#mark-reviewed").disabled, true);
  assert.equal(elements.get("#brief-audience").focused, true);
});

test("the human action-needed filter returns the same ordered records as the domain search", async () => {
  const document = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
  });
  const elements = document.elements;

  elements.get("#status-filter").value = "Withdrawn";
  elements.get("#action-filter").value = "true";
  await elements.get("#action-filter").dispatch("change");

  const expectedIds = core.searchPlanningCases(cases, {
    status: "Withdrawn",
    residential_only: true,
    requires_action: true,
  }).map(({ id }) => id);
  assert.deepEqual(
    elements.get("#record-list").children
      .filter((row) => row.attributes.has("data-record-id"))
      .map((row) => row.attributes.get("data-record-id")),
    expectedIds
  );
});

test("the primary fixed script exercises every named human action and stages exact filings", async () => {
  const document = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
  });
  const elements = document.elements;
  const activated = [];

  elements.get("#action-filter").value = "true";
  await elements.get("#action-filter").dispatch("change");
  activated.push("Set Action needed to Yes");
  for (const [recordId, caseId] of [
    ["signal-1", "RZ26-0041"],
    ["signal-3", "RZ26-00419"],
    ["signal-4", "RZ26-00511"],
  ]) {
    await elements.get("#record-list").querySelector(`[data-record-id="${recordId}"]`).dispatch("click");
    activated.push(`Open ${caseId}`);
    const filing = elements.get("#record-detail").querySelector(`[aria-label="Add ${caseId} from the brief"]`);
    await filing.dispatch("click");
    activated.push(`Add ${caseId}`);
  }
  await elements.get("#stage-brief").dispatch("click");
  activated.push("Stage brief");

  assert.deepEqual(activated, PRIMARY_HUMAN_TRACE);
  assert.equal(activated.length, 8);
  assert.deepEqual(
    elements.get("#brief-preview").querySelector(".brief-filings").children.map((row) => row.querySelector("strong").textContent),
    ["RZ26-0041"]
  );
  assert.deepEqual(
    elements.get("#brief-preview").children
      .filter((element) => element.className === "brief-item")
      .flatMap((item) => item.querySelector(".brief-filings").children.map((row) => row.querySelector("strong").textContent)),
    ["RZ26-0041", "RZ26-00419", "RZ26-00511"]
  );
});

test("multi-filing records keep each filing ID beside its own status through staging", async () => {
  const document = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
  });
  const elements = document.elements;
  await elements.get("#record-list").querySelector('[data-record-id="signal-4"]').dispatch("click");
  const detailRows = elements.get("#record-detail").querySelector(".detail-filings").children;

  assert.deepEqual(detailRows.map((row) => [
    row.querySelector("strong").textContent,
    row.querySelector(".status-badge").textContent,
  ]), [
    ["VAR26-0397", "Withdrawn"],
    ["RZ26-00511", "Recommended"],
  ]);

  await detailRows[0].querySelector(".select-record").dispatch("click");
  await elements.get("#record-detail").querySelector(".detail-filings").children[1].querySelector(".select-record").dispatch("click");
  await elements.get("#stage-brief").dispatch("click");

  assert.deepEqual(elements.get("#brief-preview").querySelector(".brief-filings")?.children.map((row) => [
    row.querySelector("strong").textContent,
    row.querySelector(".status-badge").textContent,
  ]), [
    ["VAR26-0397", "Withdrawn"],
    ["RZ26-00511", "Recommended"],
  ]);
});

test("each filing shows its verified status history in the detail and the staged brief", async () => {
  const document = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
  });
  const elements = document.elements;
  await elements.get("#record-list").querySelector('[data-record-id="signal-4"]').dispatch("click");
  const detailRows = elements.get("#record-detail").querySelector(".detail-filings").children;

  assert.match(detailRows[0].querySelector(".filing-history").textContent, /^Unchanged since 2026-08-25: Withdrawn\./);
  assert.match(detailRows[1].querySelector(".filing-history").textContent, /^2026-08-25: Scheduled → 2026-09-02: Recommended\. New 9\/1\/26 row/);

  await detailRows[1].querySelector(".select-record").dispatch("click");
  await elements.get("#stage-brief").dispatch("click");

  const briefRows = elements.get("#brief-preview").querySelector(".brief-filings").children;
  assert.equal(briefRows.length, 1);
  assert.match(briefRows[0].querySelector(".filing-history").textContent, /2026-08-25: Scheduled → 2026-09-02: Recommended/);
});

test("the retry control recovers after a record-load failure", async () => {
  let attempts = 0;
  const document = await runApp({
    fetchResponse: async () => (++attempts === 1
      ? { ok: false, status: 503 }
      : { ok: true, json: async () => cases }),
    registerPlanningTools: async () => {},
  });
  const elements = document.elements;

  assert.equal(elements.get("#result-count").textContent, "Unavailable");
  await elements.get("#retry-load").dispatch("click");
  assert.equal(elements.get("#result-count").textContent, "5 records");
  assert.equal(elements.get("#desk-message").hidden, true);
});

test("record loading carries a timeout signal into fetch", async () => {
  let signal;
  let timeout;
  const sentinel = {};
  await runApp({
    fetchResponse: async (_url, options) => {
      signal = options?.signal;
      return { ok: true, json: async () => cases };
    },
    registerPlanningTools: async () => {},
    abortSignal: { timeout: (milliseconds) => { timeout = milliseconds; return sentinel; } },
  });

  assert.equal(timeout, 10000);
  assert.equal(signal, sentinel);
});

test("clipboard copying suppresses overlapping attempts", async () => {
  let finishCopy;
  let copies = 0;
  const pendingCopy = new Promise((resolve) => { finishCopy = resolve; });
  const document = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
    clipboardWrite: async () => {
      copies += 1;
      await pendingCopy;
    },
  });
  const copy = document.elements.get("#copy-prompt");

  const firstAttempt = copy.dispatch("click");
  await Promise.resolve();
  assert.equal(copy.disabled, true);
  await copy.dispatch("click");
  assert.equal(copies, 1);

  finishCopy();
  await firstAttempt;
  assert.equal(copy.disabled, false);
  assert.match(document.elements.get("#copy-status").textContent, /copied to the clipboard/);
});

test("an agent-staged brief synchronizes the human review workspace", async () => {
  let onBrief;
  const document = await runApp({
    modelContext: { registerTool() {} },
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async (options) => { onBrief = options.onBrief; },
  });
  const brief = core.stageSourceBackedBrief(cases, {
    case_ids: ["RZ26-00511"],
    audience: "Public-interest planning",
  });

  onBrief(brief);
  await document.elements.get("#stage-brief").dispatch("click");

  assert.equal(document.elements.get("#selection-count").textContent, "1 selected");
  assert.equal(document.elements.get("#brief-audience").value, "Public-interest planning");
  assert.match(document.elements.get("#brief-preview").querySelector(".brief-snapshot").textContent, /1 record staged/);
  assert.equal(document.elements.get("#brief-preview").querySelector(".brief-filings").querySelector("strong").textContent, "RZ26-00511");
  assert.equal(document.elements.get("#brief-preview").querySelector(".brief-filings").querySelector(".status-badge").textContent, "Recommended");
  assert.equal(document.elements.get("#brief-preview").querySelector(".brief-sources").querySelector("a").href, cases[3].sources[0].url);
  assert.match(document.elements.get("#workspace-status").textContent, /Human staged 1 record/);
});

test("a due snapshot requests official re-verification without changing procedural statuses", async () => {
  const dueCore = { ...core, northwestArkansasCivilDate: () => "2026-09-08" };
  const document = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
    signalCore: dueCore,
  });
  const elements = document.elements;

  assert.equal(elements.get("#freshness-summary").dataset.state, "reverification_due");
  assert.equal(elements.get("#freshness-state").textContent, "Re-verification due");
  assert.match(elements.get("#freshness-detail").textContent, /statuses are shown as last verified\. Confirm current status with the city/);
  assert.match(elements.get("#record-detail").querySelector(".freshness-line").textContent, /statuses are shown as last verified\. Confirm current status with the city/);
  assert.equal(elements.get("#record-detail").querySelector(".status-badge").textContent, cases[0].filings[0].status);

  await elements.get("#record-detail").querySelector(".select-record").dispatch("click");
  await elements.get("#stage-brief").dispatch("click");
  assert.match(elements.get("#brief-preview").querySelector(".brief-freshness").textContent, /statuses are shown as last verified\. Confirm current status with the city/);
});
