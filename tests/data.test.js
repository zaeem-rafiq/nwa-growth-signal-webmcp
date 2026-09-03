const test = require("node:test");
const assert = require("node:assert/strict");

const cases = require("../site/cases.json");
const { OFFICIAL_SOURCE } = require("../site/core.js");

test("the product ships five verified records backed only by official municipal URLs", () => {
  assert.equal(cases.length, 5);
  assert.ok(cases.every((record) => record.verified_at === "2026-09-02"));
  assert.ok(cases.every((record) => record.sources.length > 0));
  assert.ok(cases.flatMap(({ sources }) => sources).every(({ url }) => OFFICIAL_SOURCE.test(url)));
  assert.ok(cases.every((record) => record.filings.length === record.case_ids.length));
  assert.ok(cases.every((record) => record.filings.every(({ case_id, status }) =>
    record.case_ids.includes(case_id) && record.status_labels.includes(status)
  )));
});

test("every filing carries a verified status history that ends in its current status", () => {
  const filings = cases.flatMap((record) => record.filings);
  assert.equal(filings.length, 8);
  for (const filing of filings) {
    assert.deepEqual(filing.status_history.map(({ verified_at }) => verified_at), ["2026-08-25", "2026-09-02"]);
    assert.equal(filing.status_history[1].status, filing.status);
    assert.ok(filing.status_history.every(({ source }) => OFFICIAL_SOURCE.test(source)));
  }
  const changed = filings.filter(({ status_history: h }) => h[0].status !== h[1].status).map(({ case_id }) => case_id);
  assert.deepEqual(changed, ["RZ26-00419", "RZ26-00511"]);
});
