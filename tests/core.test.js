const test = require("node:test");
const assert = require("node:assert/strict");

const core = require("../site/core.js");
const { inspectCaseRecord, listStatusChanges, searchPlanningCases, stageSourceBackedBrief } = core;

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

test("status changes list only filings whose verified label moved, with both dated sources", () => {
  const cases = [{
    id: "signal-4",
    title: "408 E. Poplar Street",
    city: "Rogers",
    next_step: "Awaiting separate Rogers City Council action.",
    filings: [
      { case_id: "VAR26-0397", status: "Withdrawn", status_history: [
        { verified_at: "2026-08-25", status: "Withdrawn", source: "https://www.rogersar.gov/1181/Public-Hearing-Items" },
        { verified_at: "2026-09-02", status: "Withdrawn", source: "https://www.rogersar.gov/1181/Public-Hearing-Items", note: "Still withdrawn." },
      ] },
      { case_id: "RZ26-00511", status: "Recommended", status_history: [
        { verified_at: "2026-08-25", status: "Scheduled", source: "https://www.rogersar.gov/1181/Public-Hearing-Items" },
        { verified_at: "2026-09-02", status: "Recommended", source: "https://www.rogersar.gov/1181/Public-Hearing-Items", note: "New 9/1/26 row." },
      ] },
    ],
  }];

  const result = listStatusChanges(cases);

  assert.deepEqual(result, {
    compared_from: "2026-08-25",
    compared_to: "2026-09-02",
    changed_count: 1,
    unchanged_count: 1,
    changes: [{
      record_id: "signal-4",
      case_id: "RZ26-00511",
      title: "408 E. Poplar Street",
      city: "Rogers",
      previous_status: "Scheduled",
      current_status: "Recommended",
      status_history: cases[0].filings[1].status_history,
      next_step: "Awaiting separate Rogers City Council action.",
    }],
    standing_note: "Each status is reproduced from the official source cited for that date. A changed label states no reason for the change, and recommendation is not adoption.",
  });
  assert.equal("unchanged" in result, false);
});

test("status changes can include unchanged filings with their notes and honor the city filter", () => {
  const history = (from, to, note) => [
    { verified_at: "2026-08-25", status: from, source: "https://www.rogersar.gov/1181/Public-Hearing-Items" },
    { verified_at: "2026-09-02", status: to, source: "https://www.rogersar.gov/1181/Public-Hearing-Items", note },
  ];
  const cases = [
    { id: "A", city: "Bentonville", filings: [{ case_id: "FP26-0005", status: "Scheduled", status_history: history("Scheduled", "Scheduled", "Absent from the reissued agenda.") }] },
    { id: "B", city: "Rogers", filings: [{ case_id: "RZ26-00419", status: "Recommended", status_history: history("Tabled", "Recommended", "Row changed in place.") }] },
    { id: "C", city: "Rogers", filings: [{ case_id: "OLD-1", status: "Tabled" }] },
    { id: "D", city: "Rogers", status: "Recommended" },
  ];

  const everything = listStatusChanges(cases, { include_unchanged: true });
  const bentonville = listStatusChanges(cases, { city: "Bentonville", include_unchanged: true });

  assert.deepEqual(everything.changes.map(({ case_id: caseId }) => caseId), ["RZ26-00419"]);
  assert.deepEqual(everything.unchanged.map(({ case_id: caseId }) => caseId), ["FP26-0005"]);
  assert.equal(everything.unchanged[0].status_history[1].note, "Absent from the reissued agenda.");
  assert.deepEqual(bentonville.changes, []);
  assert.equal(bentonville.unchanged_count, 1);
  assert.equal(bentonville.changed_count, 0);
});

test("status changes report no comparison window when no filing carries a history", () => {
  assert.deepEqual(listStatusChanges([{ id: "minimal", case_ids: ["MIN-1"] }]), {
    compared_from: null,
    compared_to: null,
    changed_count: 0,
    unchanged_count: 0,
    changes: [],
    standing_note: "Each status is reproduced from the official source cited for that date. A changed label states no reason for the change, and recommendation is not adoption.",
  });
});
