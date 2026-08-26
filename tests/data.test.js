const test = require("node:test");
const assert = require("node:assert/strict");

const cases = require("../site/cases.json");

test("the product ships five verified records backed only by official municipal URLs", () => {
  assert.equal(cases.length, 5);
  assert.ok(cases.every((record) => record.verified_at === "2026-08-25"));
  assert.ok(cases.every((record) => record.sources.length > 0));
  assert.ok(cases.flatMap(({ sources }) => sources).every(({ url }) =>
    /^https:\/\/(?:www\.)?(?:bentonvillear\.portal\.civicclerk\.com|bentonville\.ar\.gov|rogersar\.gov|permitting\.rogersar\.gov)\//.test(url)
  ));
  assert.ok(cases.every((record) => record.filings.length === record.case_ids.length));
  assert.ok(cases.every((record) => record.filings.every(({ case_id, status }) =>
    record.case_ids.includes(case_id) && record.status_labels.includes(status)
  )));
});
