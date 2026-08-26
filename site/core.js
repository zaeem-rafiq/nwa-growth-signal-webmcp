(function attachCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NWASignal = api;
})(typeof window === "undefined" ? globalThis : window, () => {
  const ACTION_STATUSES = new Set(["Scheduled", "Tabled", "Recommended"]);
  const BRIEF_AUDIENCES = new Set(["Land and development", "Lending and title", "Public-interest planning"]);

  function filingsFor(record) {
    return record.filings || [];
  }

  function searchPlanningCases(cases, filters = {}) {
    return cases.flatMap((record) => {
      const filings = filingsFor(record);
      const statuses = filings.length
        ? filings.map(({ status }) => status)
        : (record.status_labels || [record.status]);
      if (filters.city && record.city !== filters.city) return [];
      if (filters.status && !statuses.includes(filters.status)) return [];
      if (filters.residential_only && !record.residential) return [];
      if (filters.requires_action && !statuses.some((status) => ACTION_STATUSES.has(status))) return [];
      if (!filters.status || !filings.length) return [record];
      return [{
        ...record,
        matching_filings: filings.filter(({ status }) => status === filters.status),
      }];
    });
  }

  function inspectCaseRecord(cases, caseId) {
    const record = cases.find((candidate) =>
      candidate.id === caseId || candidate.case_ids?.includes(caseId)
    );
    if (!record || record.id === caseId) return record || null;
    const requestedFiling = filingsFor(record).find(({ case_id }) => case_id === caseId);
    return requestedFiling ? { ...record, requested_filing: requestedFiling } : record;
  }

  function stageSourceBackedBrief(cases, input) {
    if (!input || !Array.isArray(input.case_ids) || input.case_ids.length < 1 || input.case_ids.length > 5 ||
        input.case_ids.some((caseId) => typeof caseId !== "string" || !caseId.length || caseId.length > 32) ||
        new Set(input.case_ids).size !== input.case_ids.length) {
      throw new Error("A brief requires one to five unique case IDs.");
    }
    if (!BRIEF_AUDIENCES.has(input.audience)) {
      throw new Error(`Unsupported brief audience: ${input.audience}`);
    }

    const itemsById = new Map();
    input.case_ids.forEach((caseId) => {
      const record = inspectCaseRecord(cases, caseId);
      if (!record) throw new Error(`Unknown planning record: ${caseId}`);
      const { requested_filing: requestedFiling, matching_filings: _matchingFilings, ...baseRecord } = record;
      const selectedFilings = requestedFiling
        ? [requestedFiling]
        : (caseId === record.id ? filingsFor(record) : []);
      const existing = itemsById.get(record.id);
      if (existing) {
        existing.selected_filings = [...new Map(
          [...(existing.selected_filings || []), ...selectedFilings].map((filing) => [filing.case_id, filing])
        ).values()];
      } else {
        itemsById.set(record.id, selectedFilings.length
          ? { ...baseRecord, selected_filings: selectedFilings }
          : baseRecord);
      }
    });
    return {
      title: "NWA planning brief",
      audience: input.audience,
      review_required: true,
      standing_note: "Procedural status is reproduced from the cited record. Recommendation is not adoption, and a planning action is not a construction permit.",
      items: [...itemsById.values()],
    };
  }

  return { inspectCaseRecord, searchPlanningCases, stageSourceBackedBrief };
});
