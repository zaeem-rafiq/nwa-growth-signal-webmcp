const test = require("node:test");
const assert = require("node:assert/strict");

const { inspectCaseRecord, searchPlanningCases, stageSourceBackedBrief } = require("../site/core.js");

test("an agent can find residential Bentonville cases that still need action", () => {
  const cases = [
    { id: "A", city: "Bentonville", residential: true, status: "Scheduled" },
    { id: "B", city: "Bentonville", residential: false, status: "Scheduled" },
    { id: "C", city: "Rogers", residential: true, status: "Recommended" },
  ];

  const matches = searchPlanningCases(cases, {
    city: "Bentonville",
    residential_only: true,
    requires_action: true,
  });

  assert.deepEqual(matches.map(({ id }) => id), ["A"]);
});

test("an agent can restrict search results to one procedural status", () => {
  const cases = [
    { id: "A", status: "Scheduled", status_labels: ["Scheduled"] },
    { id: "B", status: "Tabled", status_labels: ["Tabled"] },
  ];

  const matches = searchPlanningCases(cases, { status: "Tabled" });

  assert.deepEqual(matches.map(({ id }) => id), ["B"]);
});

test("an agent receives the recorded status and official sources without an inferred relationship", () => {
  const cases = [{
    id: "signal-4",
    case_ids: ["VAR26-0397", "RZ26-00511"],
    status_labels: ["Withdrawn", "Scheduled"],
    relationship: "Not stated in the official record.",
    sources: [{ title: "City outcome table", url: "https://www.rogersar.gov/1181/Public-Hearing-Items" }],
  }];

  const record = inspectCaseRecord(cases, "RZ26-00511");

  assert.deepEqual(record, cases[0]);
});

test("a staged brief preserves recommendation language instead of calling it approval", () => {
  const cases = [{
    id: "signal-5",
    case_ids: ["RZ26-00345"],
    title: "6253 S. Mt Hebron Road",
    city: "Rogers",
    status_labels: ["Recommended"],
    summary: "The Planning Commission recommended the rezoning to City Council.",
    next_step: "Awaiting separate City Council action.",
    sources: [{ title: "City outcome table", url: "https://www.rogersar.gov/1181/Public-Hearing-Items" }],
    verified_at: "2026-08-25",
  }];

  const brief = stageSourceBackedBrief(cases, {
    case_ids: ["RZ26-00345"],
    audience: "Lending and title",
  });

  assert.deepEqual(brief.items[0].status_labels, ["Recommended"]);
});

test("a staged brief rejects case identifiers outside the verified record", () => {
  assert.throws(
    () => stageSourceBackedBrief([], { case_ids: ["UNKNOWN"], audience: "Lending and title" }),
    /Unknown planning record: UNKNOWN/
  );
});

test("a staged brief includes a planning record only once when two case IDs resolve to it", () => {
  const cases = [{
    id: "signal-4",
    case_ids: ["VAR26-0397", "RZ26-00511"],
    title: "408 E. Poplar Street",
  }];

  const brief = stageSourceBackedBrief(cases, {
    case_ids: ["VAR26-0397", "RZ26-00511"],
    audience: "Lending and title",
  });

  assert.equal(brief.items.length, 1);
});
