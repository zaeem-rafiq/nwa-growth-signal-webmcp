const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const site = path.join(__dirname, "..", "site");

test("the page presents the agent workflow as a visible human-review workspace", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.match(html, /id="desk"/);
  assert.match(html, /stage_source_backed_brief/);
  assert.match(html, /Mark as reviewed/);
  assert.doesNotMatch(html, /checkout|payment/i);
});

test("the hackathon surface links to the three-page issue sample", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const links = html.match(/assets\/NWA-Growth-Signal-Hackathon-Sample\.pdf/g) || [];

  assert.equal(links.length, 2);
});

test("dynamic municipal records are rendered without HTML injection sinks", () => {
  const app = fs.readFileSync(path.join(site, "app.js"), "utf8");
  assert.match(app, /textContent/);
  assert.doesNotMatch(app, /innerHTML|insertAdjacentHTML|document\.write/);
});

test("the WebMCP readiness copy has a dedicated update target", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(site, "app.js"), "utf8");
  assert.match(html, /class="state-detail"/);
  assert.match(app, /querySelector\("\.state-detail"\)/);
});

test("an agent-staged brief keeps the visible audience in sync", () => {
  const app = fs.readFileSync(path.join(site, "app.js"), "utf8");

  assert.match(app, /elements\.audience\.value = brief\.audience/);
});

test("the desktop hero breakpoint caps the field-note heading size", () => {
  const css = fs.readFileSync(path.join(site, "styles.css"), "utf8");

  assert.match(css, /\.agent-brief h2 \{[^}]*font-size: clamp\(32px, 3\.2vw, 52px\)/);
});

test("the accessibility foundation keeps controls reachable and focus stable", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(site, "styles.css"), "utf8");
  const app = fs.readFileSync(path.join(site, "app.js"), "utf8");

  assert.match(html, /id="record-list-status"[^>]*aria-live="polite"/);
  assert.match(html, /id="record-detail"[^>]*aria-label="Planning record detail"/);
  assert.doesNotMatch(html, /id="record-list"[^>]*aria-live/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /\.agent-brief button:focus-visible[^}]*outline-color:\s*var\(--paper-light\)/);
  assert.match(app, /data-record-id/);
  assert.match(app, /focusRecordRow/);
});

test("selection and review state stay visible, current, and attributable", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(site, "styles.css"), "utf8");
  const app = fs.readFileSync(path.join(site, "app.js"), "utf8");

  assert.match(html, /id="selection-count"/);
  assert.match(html, /id="stage-brief"[^>]*disabled[^>]*>Stage selected records</);
  assert.match(html, /id="mark-reviewed"[^>]*>Mark as reviewed</);
  assert.match(css, /\.selection-tray/);
  assert.match(app, /function invalidateBrief/);
  assert.match(app, /className: "brief-snapshot"/);
  assert.match(app, /record\.sources\.forEach/);
  assert.match(app, /elements\.audience\.addEventListener\("change", invalidateBrief\)/);
});

test("loading, navigation, copy, and filtered-selection states recover clearly", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(site, "app.js"), "utf8");

  assert.match(html, /class="signal-desk"[^>]*aria-busy="true"/);
  assert.match(html, /id="retry-load"/);
  assert.match(html, /id="copy-status"[^>]*role="status"/);
  assert.match(html, /NWA-Growth-Signal-Hackathon-Sample\.pdf" target="_blank" rel="noopener"/);
  assert.match(app, /function setDeskReady/);
  assert.match(app, /elements\.retry\.addEventListener\("click", initialize\)/);
  assert.match(app, /elements\.count\.textContent = "Unavailable"/);
  assert.match(app, /outside current filters/);
  assert.match(app, /range\.selectNodeContents\(elements\.prompt\)/);
});

test("the hero shows the real issue sample without overstating the data surface", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(site, "styles.css"), "utf8");

  assert.match(html, /src="assets\/issue-preview\.png"[^>]*alt="Cover of NWA Growth Signal Issue 01/);
  assert.match(html, /Verified working surface/);
  assert.doesNotMatch(html, /Live working surface/);
  assert.match(css, /\.issue-preview/);
});
