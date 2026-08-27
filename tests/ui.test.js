const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const site = path.join(__dirname, "..", "site");

test("the page presents the agent workflow as a visible human-review workspace", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.match(html, /id="desk"/);
  assert.match(html, /stage_source_backed_brief/);
  assert.match(html, /Mark human-reviewed/);
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
