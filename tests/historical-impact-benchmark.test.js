const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { evaluateHistoricalImpact } = require("../scripts/historical-impact-benchmark.js");

const sourcePair = (eventId, agendaId, minutesId) => ({
  agenda: `https://rogersar.portal.civicclerk.com/event/${eventId}/files/agenda/${agendaId}`,
  minutes: `https://rogersar.portal.civicclerk.com/event/${eventId}/files/minutes/${minutesId}`,
});

test("the historical study preserves exact status events and exposes agenda-only failure modes", () => {
  const records = [
    {
      id: "HB-001",
      title: "Approved request",
      agenda_language: "Approving a rezone request.",
      events: [{
        id: "HB-001-E1",
        meeting_date: "2025-01-07",
        status: "Approved by Planning Commission",
        decision_body: "Planning Commission",
        sources: sourcePair(980, 4610, 4747),
      }],
    },
    {
      id: "HB-002",
      title: "Tabled request",
      agenda_language: "Approving a rezone request.",
      events: [{
        id: "HB-002-E1",
        meeting_date: "2025-01-07",
        status: "Tabled",
        decision_body: "Planning Commission",
        sources: sourcePair(980, 4610, 4747),
      }],
    },
    {
      id: "HB-003",
      title: "Multi-meeting request",
      agenda_language: "Requesting a variance from the Unified Development Code.",
      events: [
        {
          id: "HB-003-E1",
          meeting_date: "2025-01-07",
          status: "Tabled",
          decision_body: "Board of Adjustment",
          sources: sourcePair(980, 4610, 4747),
        },
        {
          id: "HB-003-E2",
          meeting_date: "2025-02-04",
          status: "Withdrawn",
          decision_body: "Board of Adjustment",
          sources: sourcePair(994, 4750, 5311),
        },
      ],
    },
  ];

  assert.deepEqual(evaluateHistoricalImpact(records, { minimumRecords: 3, maximumRecords: 3 }), {
    records_checked: 3,
    status_events_checked: 4,
    status_events_preserved_by_inspection: 4,
    status_events_preserved_by_staging: 4,
    status_events_with_expected_sources_present_by_inspection: 4,
    status_events_with_expected_sources_present_by_staging: 4,
    records_with_official_agenda_and_minutes: 3,
    multi_meeting_lifecycles_preserved: 1,
    challenge_period_leakage: 0,
    agenda_only_baseline: {
      determinate_predictions: 2,
      exact_matches: 1,
      unknown_outcomes: 1,
      false_finality_overclaims: 1,
    },
    study_ready: true,
  });
});

test("the historical study rejects duplicate local status-event IDs", () => {
  const records = [
    {
      id: "HB-001",
      title: "First request",
      agenda_language: "A request to consider a rezoning.",
      events: [{
        id: "HB-DUPLICATE",
        meeting_date: "2025-01-07",
        status: "Approved by Planning Commission",
        decision_body: "Planning Commission",
        sources: sourcePair(980, 4610, 4747),
      }],
    },
    {
      id: "HB-002",
      title: "Second request",
      agenda_language: "A request to consider a rezoning.",
      events: [{
        id: "HB-DUPLICATE",
        meeting_date: "2025-01-21",
        status: "Tabled",
        decision_body: "Planning Commission",
        sources: sourcePair(1005, 4639, 4753),
      }],
    },
  ];

  assert.throws(
    () => evaluateHistoricalImpact(records, { minimumRecords: 2, maximumRecords: 2 }),
    /unique local status-event IDs/
  );
});

test("the historical study requires agenda and minutes links from the same meeting", () => {
  const records = [{
    id: "HB-001",
    title: "Swapped sources",
    agenda_language: "A request to consider a rezoning.",
    events: [{
      id: "HB-001-E1",
      meeting_date: "2025-01-07",
      status: "Tabled",
      decision_body: "Planning Commission",
      sources: {
        agenda: "https://rogersar.portal.civicclerk.com/event/980/files/agenda/4610",
        minutes: "https://rogersar.portal.civicclerk.com/event/1005/files/minutes/4753",
      },
    }],
  }];

  const report = evaluateHistoricalImpact(records, { minimumRecords: 1, maximumRecords: 1 });
  assert.equal(report.records_with_official_agenda_and_minutes, 0);
  assert.equal(report.study_ready, false);
});

test("the historical study requires an observed agenda-only failure mode", () => {
  const records = [{
    id: "HB-001",
    title: "No observed failure",
    agenda_language: "Approving a rezone request.",
    events: [{
      id: "HB-001-E1",
      meeting_date: "2025-01-07",
      status: "Approved by Planning Commission",
      decision_body: "Planning Commission",
      sources: sourcePair(980, 4610, 4747),
    }, {
      id: "HB-001-E2",
      meeting_date: "2025-01-21",
      status: "Approved by Planning Commission",
      decision_body: "Planning Commission",
      sources: sourcePair(1005, 4639, 4753),
    }],
  }];

  assert.equal(
    evaluateHistoricalImpact(records, { minimumRecords: 1, maximumRecords: 1 }).study_ready,
    false
  );
});

test("the historical study rejects malformed or unordered lifecycles", () => {
  const validEvent = {
    id: "HB-001-E1",
    meeting_date: "2025-01-07",
    status: "Tabled",
    decision_body: "Planning Commission",
    sources: sourcePair(980, 4610, 4747),
  };
  const record = (events) => ({
    id: "HB-001",
    title: "Lifecycle",
    agenda_language: "A request to consider a rezoning.",
    events,
  });

  assert.throws(() => evaluateHistoricalImpact([record([])]), /at least one status event/);
  assert.throws(
    () => evaluateHistoricalImpact([record([{ ...validEvent, meeting_date: "2025-13-40" }])]),
    /valid ISO meeting dates/
  );
  assert.throws(
    () => evaluateHistoricalImpact([record([
      { ...validEvent, id: "HB-001-E2", meeting_date: "2025-02-04" },
      validEvent,
    ])]),
    /chronological event order/
  );
  assert.throws(
    () => evaluateHistoricalImpact([record([{ ...validEvent, decision_body: "Unknown board" }])]),
    /recognized decision bodies/
  );
});

test("the committed historical cohort reproduces the published report", () => {
  const records = JSON.parse(fs.readFileSync(
    path.join(__dirname, "..", "benchmark", "historical-cases.json"),
    "utf8"
  ));

  assert.deepEqual(evaluateHistoricalImpact(records), {
    records_checked: 23,
    status_events_checked: 26,
    status_events_preserved_by_inspection: 26,
    status_events_preserved_by_staging: 26,
    status_events_with_expected_sources_present_by_inspection: 26,
    status_events_with_expected_sources_present_by_staging: 26,
    records_with_official_agenda_and_minutes: 23,
    multi_meeting_lifecycles_preserved: 3,
    challenge_period_leakage: 0,
    agenda_only_baseline: {
      determinate_predictions: 3,
      exact_matches: 1,
      unknown_outcomes: 20,
      false_finality_overclaims: 2,
    },
    study_ready: true,
  });
});
