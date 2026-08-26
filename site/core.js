(function attachCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NWASignal = api;
})(typeof window === "undefined" ? globalThis : window, () => {
  const ACTION_STATUSES = new Set(["Scheduled", "Tabled", "Recommended"]);

  function searchPlanningCases(cases, filters = {}) {
    return cases.filter((record) => {
      if (filters.city && record.city !== filters.city) return false;
      if (filters.status && !(record.status_labels || [record.status]).includes(filters.status)) return false;
      if (filters.residential_only && !record.residential) return false;
      if (filters.requires_action && !(record.status_labels || [record.status]).some((status) => ACTION_STATUSES.has(status))) return false;
      return true;
    });
  }

  function inspectCaseRecord(cases, caseId) {
    return cases.find((record) =>
      record.id === caseId || record.case_ids?.includes(caseId)
    ) || null;
  }

  function stageSourceBackedBrief(cases, input) {
    const records = input.case_ids.map((caseId) => {
      const record = inspectCaseRecord(cases, caseId);
      if (!record) throw new Error(`Unknown planning record: ${caseId}`);
      return record;
    });
    const items = [...new Map(records.map((record) => [record.id, record])).values()];
    return {
      title: "NWA planning brief",
      audience: input.audience,
      review_required: true,
      standing_note: "Procedural status is reproduced from the cited record. Recommendation is not adoption, and a planning action is not a construction permit.",
      items,
    };
  }

  return { inspectCaseRecord, searchPlanningCases, stageSourceBackedBrief };
});
