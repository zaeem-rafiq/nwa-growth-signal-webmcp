const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const core = require("../site/core.js");
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
    "#city-filter", "#status-filter", "#reset-filters", "#result-count", "#record-list", "#record-list-status",
    "#record-detail", ".signal-desk", "#desk-message", "#desk-message-copy", "#retry-load",
    "#selection-tray", "#selection-count", "#selected-records", "#brief-audience", "#stage-brief", "#brief-preview",
    "#mark-reviewed", "#workspace-status", "#webmcp-state", "#demo-prompt", "#copy-prompt", "#copy-status",
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
    createRange: () => ({ selectNodeContents() {} }),
    querySelector: (selector) => elements.get(selector),
    elements,
  };
  return document;
}

async function runApp({ modelContext, fetchResponse, registerPlanningTools, clipboardWrite = async () => {} }) {
  const document = createDocument(modelContext);
  const window = {
    NWASignal: core,
    NWAWebMCP: { registerPlanningTools },
    getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
  };
  vm.runInNewContext(appSource, {
    console: { error() {} },
    document,
    fetch: typeof fetchResponse === "function" ? fetchResponse : async () => fetchResponse,
    navigator: { clipboard: { writeText: clipboardWrite } },
    AbortSignal,
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
  await runApp({
    fetchResponse: async (_url, options) => {
      signal = options?.signal;
      return { ok: true, json: async () => cases };
    },
    registerPlanningTools: async () => {},
  });

  assert.ok(signal);
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
    case_ids: [cases[2].id],
    audience: "Public-interest planning",
  });

  onBrief(brief);

  assert.equal(document.elements.get("#selection-count").textContent, "1 selected");
  assert.equal(document.elements.get("#brief-audience").value, "Public-interest planning");
  assert.match(document.elements.get("#brief-preview").querySelector(".brief-snapshot").textContent, /1 record staged/);
  assert.equal(document.elements.get("#brief-preview").querySelector(".brief-sources").querySelector("a").href, cases[2].sources[0].url);
  assert.match(document.elements.get("#workspace-status").textContent, /Agent staged 1 record/);
});
