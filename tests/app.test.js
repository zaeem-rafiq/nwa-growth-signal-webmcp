const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const core = require("../site/core.js");
const cases = require("../site/cases.json");
const appSource = fs.readFileSync(path.join(__dirname, "..", "site", "app.js"), "utf8");

class FakeElement {
  constructor() {
    this.dataset = {};
    this.value = "";
    this.disabled = false;
    this.textContent = "";
    this.children = new Map();
  }
  addEventListener() {}
  append() {}
  replaceChildren() {}
  setAttribute() {}
  querySelector(selector) {
    if (!this.children.has(selector)) this.children.set(selector, new FakeElement());
    return this.children.get(selector);
  }
}

function createDocument(modelContext) {
  const elements = new Map();
  const selectors = [
    "#city-filter", "#status-filter", "#reset-filters", "#result-count", "#record-list",
    "#record-detail", "#selected-records", "#brief-audience", "#stage-brief", "#brief-preview",
    "#mark-reviewed", "#workspace-status", "#webmcp-state", "#demo-prompt", "#copy-prompt",
    ".signal-desk",
  ];
  selectors.forEach((selector) => elements.set(selector, new FakeElement()));
  elements.get("#brief-audience").value = "Land and development";
  return {
    modelContext,
    createElement: () => new FakeElement(),
    querySelector: (selector) => elements.get(selector),
    elements,
  };
}

async function runApp({ modelContext, fetchResponse, registerPlanningTools }) {
  const document = createDocument(modelContext);
  const window = { NWASignal: core, NWAWebMCP: { registerPlanningTools } };
  vm.runInNewContext(appSource, {
    console: { error() {} },
    document,
    fetch: async () => fetchResponse,
    navigator: { clipboard: { writeText: async () => {} } },
    Set,
    window,
  });
  await new Promise((resolve) => setImmediate(resolve));
  return document.elements.get("#webmcp-state");
}

test("the app exposes an unsupported-browser fallback without losing the human interface", async () => {
  const state = await runApp({
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => {},
  });

  assert.equal(state.dataset.state, "unsupported");
  assert.equal(state.querySelector("strong").textContent, "WebMCP not exposed in this browser");
});

test("the app reports registration and verified-record load failures", async () => {
  const registration = await runApp({
    modelContext: { registerTool() {} },
    fetchResponse: { ok: true, json: async () => cases },
    registerPlanningTools: async () => { throw new Error("no tools"); },
  });
  const records = await runApp({
    fetchResponse: { ok: false, status: 503 },
    registerPlanningTools: async () => {},
  });

  assert.equal(registration.dataset.state, "error");
  assert.equal(registration.querySelector("strong").textContent, "WebMCP registration failed");
  assert.equal(records.dataset.state, "error");
  assert.equal(records.querySelector("strong").textContent, "Planning record unavailable");
});
