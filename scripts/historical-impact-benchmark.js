const fs = require("node:fs");
const path = require("node:path");

const core = require("../site/core.js");

const OFFICIAL_ROGERS_AGENDA = /^https:\/\/rogersar\.portal\.civicclerk\.com\/event\/(\d+)\/files\/agenda\/\d+$/;
const OFFICIAL_ROGERS_MINUTES = /^https:\/\/rogersar\.portal\.civicclerk\.com\/event\/(\d+)\/files\/minutes\/\d+$/;
const CHALLENGE_START = "2026-08-25";
const DECISION_BODIES = new Set(["Planning Commission", "Board of Adjustment"]);

function normalizedStatus(status) {
  if (status.startsWith("Approved")) return "Approved";
  if (status.startsWith("Recommended")) return "Recommended";
  if (status.startsWith("Denied")) return "Denied";
  return status;
}

function agendaOnlyPrediction(language) {
  if (/\brecommend(?:ed|ing)?\b.*\bcity council\b/i.test(language)) return "Recommended";
  if (/\bapprov(?:e|ed|ing|al)\b/i.test(language)) return "Approved";
  return "Unknown";
}

function toCoreCases(records) {
  return records.map((record) => ({
    id: record.id,
    case_ids: record.events.map((event) => event.id),
    title: record.title,
    city: "Rogers",
    filings: record.events.map((event) => ({ case_id: event.id, status: event.status })),
    sources: [...new Map(record.events.flatMap((event) => [
      { title: `Agenda — ${event.meeting_date}`, url: event.sources.agenda },
      { title: `Minutes — ${event.meeting_date}`, url: event.sources.minutes },
    ]).map((source) => [source.url, source])).values()],
  }));
}

function isIsoDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
}

function validateRecords(records) {
  for (const record of records) {
    if (!Array.isArray(record.events) || record.events.length === 0) {
      throw new Error("Historical benchmark requires at least one status event per record.");
    }
    const dates = record.events.map((event) => event.meeting_date);
    if (dates.some((date) => !isIsoDate(date))) {
      throw new Error("Historical benchmark requires valid ISO meeting dates.");
    }
    if (dates.some((date, index) => index > 0 && date < dates[index - 1])) {
      throw new Error("Historical benchmark requires chronological event order.");
    }
    if (record.events.some((event) => !DECISION_BODIES.has(event.decision_body))) {
      throw new Error("Historical benchmark requires recognized decision bodies.");
    }
  }
}

function includesEventSources(item, event) {
  const urls = new Set(item?.sources?.map((source) => source.url));
  return urls.has(event.sources.agenda) && urls.has(event.sources.minutes);
}

function isOfficialSourcePair(event) {
  const agenda = event.sources.agenda.match(OFFICIAL_ROGERS_AGENDA);
  const minutes = event.sources.minutes.match(OFFICIAL_ROGERS_MINUTES);
  return Boolean(agenda && minutes && agenda[1] === minutes[1]);
}

function evaluateHistoricalImpact(records, { minimumRecords = 20, maximumRecords = 30 } = {}) {
  validateRecords(records);
  const events = records.flatMap((record) => record.events);
  if (new Set(events.map((event) => event.id)).size !== events.length) {
    throw new Error("Historical benchmark requires unique local status-event IDs.");
  }
  const cases = toCoreCases(records);
  const inspections = events.map((event) => core.inspectCaseRecord(cases, event.id));
  const inspected = inspections.map((item, index) =>
    item?.requested_filing?.status === events[index].status
  );
  const inspectedSources = inspections.map((item, index) => includesEventSources(item, events[index]));
  const stagedItems = events.map((event) => {
    const brief = core.stageSourceBackedBrief(cases, {
      case_ids: [event.id],
      audience: "Land and development",
    });
    return brief.items[0];
  });
  const staged = stagedItems.map((item, index) =>
    item?.selected_filings?.[0]?.status === events[index].status
  );
  const stagedSources = stagedItems.map((item, index) => includesEventSources(item, events[index]));
  const pairedSources = records.filter((record) => record.events.every(isOfficialSourcePair)).length;
  const baseline = records.map((record) => {
    const predicted = agendaOnlyPrediction(record.agenda_language);
    const actual = normalizedStatus(record.events.at(-1).status);
    return { predicted, actual };
  });
  const report = {
    records_checked: records.length,
    status_events_checked: events.length,
    status_events_preserved_by_inspection: inspected.filter(Boolean).length,
    status_events_preserved_by_staging: staged.filter(Boolean).length,
    status_events_with_expected_sources_present_by_inspection: inspectedSources.filter(Boolean).length,
    status_events_with_expected_sources_present_by_staging: stagedSources.filter(Boolean).length,
    records_with_official_agenda_and_minutes: pairedSources,
    multi_meeting_lifecycles_preserved: records.filter((record) => record.events.length > 1).length,
    challenge_period_leakage: events.filter((event) => event.meeting_date >= CHALLENGE_START).length,
    agenda_only_baseline: {
      determinate_predictions: baseline.filter(({ predicted }) => predicted !== "Unknown").length,
      exact_matches: baseline.filter(({ predicted, actual }) => predicted !== "Unknown" && predicted === actual).length,
      unknown_outcomes: baseline.filter(({ predicted }) => predicted === "Unknown").length,
      false_finality_overclaims: baseline.filter(({ predicted, actual }) =>
        predicted === "Approved" && actual !== "Approved"
      ).length,
    },
  };
  report.study_ready = records.length >= minimumRecords
    && records.length <= maximumRecords
    && report.status_events_preserved_by_inspection === events.length
    && report.status_events_preserved_by_staging === events.length
    && report.status_events_with_expected_sources_present_by_inspection === events.length
    && report.status_events_with_expected_sources_present_by_staging === events.length
    && pairedSources === records.length
    && report.multi_meeting_lifecycles_preserved > 0
    && report.challenge_period_leakage === 0
    && report.agenda_only_baseline.unknown_outcomes > 0
    && report.agenda_only_baseline.false_finality_overclaims > 0;
  return report;
}

if (require.main === module) {
  const inputPath = path.resolve(process.argv[2] || "benchmark/historical-cases.json");
  const records = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const report = evaluateHistoricalImpact(records);
  console.log(JSON.stringify(report, null, 2));
  if (!report.study_ready) process.exitCode = 1;
}

module.exports = { evaluateHistoricalImpact };
