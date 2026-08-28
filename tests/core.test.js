const test = require("node:test");
const assert = require("node:assert/strict");

const core = require("../site/core.js");
const { inspectCaseRecord, searchPlanningCases, stageSourceBackedBrief } = core;

test("snapshot freshness becomes due on the shared re-verification date", () => {
  assert.deepEqual(core.evaluateSnapshotFreshness?.({
    verified_at: "2026-08-25",
    reverify_on: "2026-09-02",
  }, "2026-09-02"), {
    state: "reverification_due",
    as_of: "2026-09-02",
    reverify_on: "2026-09-02",
  });
});

test("snapshot freshness fails closed when verification metadata is incomplete", () => {
  assert.deepEqual(core.evaluateSnapshotFreshness({ verified_at: "2026-08-25" }, "2026-09-01"), {
    state: "verification_date_only",
    as_of: "2026-09-01",
    reverify_on: null,
  });
  assert.deepEqual(core.evaluateSnapshotFreshness({
    verified_at: "2026-08-25",
    reverify_on: "2026-09-02",
  }, "2026-08-24"), {
    state: "verification_date_only",
    as_of: "2026-08-24",
    reverify_on: "2026-09-02",
  });
});

test("Northwest Arkansas civil dates change at Chicago midnight", () => {
  assert.equal(core.northwestArkansasCivilDate(new Date("2026-09-02T04:30:00Z")), "2026-09-01");
  assert.equal(core.northwestArkansasCivilDate(new Date("2026-09-02T05:30:00Z")), "2026-09-02");
});

test("snapshot freshness rejects a malformed comparison date", () => {
  assert.throws(
    () => core.evaluateSnapshotFreshness({
      verified_at: "2026-08-25",
      reverify_on: "2026-09-02",
    }, "09/02/2026"),
    /ISO civil date/
  );
});

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
    filings: [
      { case_id: "VAR26-0397", status: "Withdrawn" },
      { case_id: "RZ26-00511", status: "Scheduled" },
    ],
    status_labels: ["Withdrawn", "Scheduled"],
    relationship: "Not stated in the official record.",
    sources: [{ title: "City outcome table", url: "https://www.rogersar.gov/1181/Public-Hearing-Items" }],
  }];

  const record = inspectCaseRecord(cases, "RZ26-00511");

  assert.deepEqual(record.requested_filing, { case_id: "RZ26-00511", status: "Scheduled" });
  assert.equal(record.relationship, "Not stated in the official record.");
});

test("status filtering exposes only the filings that match", () => {
  const cases = [{
    id: "signal-4",
    case_ids: ["VAR26-0397", "RZ26-00511"],
    filings: [
      { case_id: "VAR26-0397", status: "Withdrawn" },
      { case_id: "RZ26-00511", status: "Scheduled" },
    ],
    status_labels: ["Withdrawn", "Scheduled"],
  }];

  const [record] = searchPlanningCases(cases, { status: "Scheduled" });

  assert.deepEqual(record.matching_filings, [{ case_id: "RZ26-00511", status: "Scheduled" }]);
});

test("status and action filters must match the same filing", () => {
  const cases = [{
    id: "signal-4",
    filings: [
      { case_id: "VAR26-0397", status: "Withdrawn" },
      { case_id: "RZ26-00511", status: "Scheduled" },
    ],
  }];

  assert.deepEqual(searchPlanningCases(cases, { status: "Withdrawn", requires_action: true }), []);
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
    filings: [
      { case_id: "VAR26-0397", status: "Withdrawn" },
      { case_id: "RZ26-00511", status: "Scheduled" },
    ],
    title: "408 E. Poplar Street",
  }];

  const brief = stageSourceBackedBrief(cases, {
    case_ids: ["VAR26-0397", "RZ26-00511"],
    audience: "Lending and title",
  });

  assert.equal(brief.items.length, 1);
  assert.deepEqual(brief.items[0].selected_filings, cases[0].filings);
});

test("a staged brief rejects inputs outside its public contract", () => {
  assert.throws(
    () => stageSourceBackedBrief([], { case_ids: [], audience: "Lending and title" }),
    /one to five unique case IDs/
  );
  assert.throws(
    () => stageSourceBackedBrief([], { case_ids: ["A"], audience: "Everyone" }),
    /Unsupported brief audience/
  );
});
