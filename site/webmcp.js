(function attachWebMCP(root, factory) {
  const core = typeof module === "object" && module.exports
    ? require("./core.js")
    : root.NWASignal;
  const api = factory(core);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NWAWebMCP = api;
})(typeof window === "undefined" ? globalThis : window, (core) => {
  const CITIES = ["Bentonville", "Rogers"];
  const STATUSES = ["Scheduled", "Tabled", "Withdrawn", "Recommended"];

  function hasOnlyKeys(input, allowed) {
    return input && typeof input === "object" && !Array.isArray(input) &&
      Object.keys(input).every((key) => allowed.includes(key));
  }

  function validateSearchInput(input) {
    if (!hasOnlyKeys(input, ["city", "status", "residential_only", "requires_action"]) ||
        (input.city !== undefined && !CITIES.includes(input.city)) ||
        (input.status !== undefined && !STATUSES.includes(input.status)) ||
        (input.residential_only !== undefined && typeof input.residential_only !== "boolean") ||
        (input.requires_action !== undefined && typeof input.requires_action !== "boolean")) {
      throw new Error("Invalid search filters.");
    }
  }

  function validateInspectInput(input) {
    if (!hasOnlyKeys(input, ["case_id"]) || typeof input.case_id !== "string" ||
        input.case_id.length < 1 || input.case_id.length > 32) {
      throw new Error("Invalid case inspection input.");
    }
  }

  function validateStageInput(input) {
    if (!hasOnlyKeys(input, ["case_ids", "audience"])) {
      throw new Error("Invalid brief input.");
    }
  }

  async function registerPlanningTools({ modelContext, cases, onBrief, asOf = core.northwestArkansasCivilDate() }) {
    const freshness = core.evaluateSnapshotFreshness(core.SNAPSHOT, asOf);
    const tools = [
      {
        name: "search_planning_cases",
        title: "Search NWA planning cases",
        description: "Search the verified Bentonville and Rogers planning record by municipality, procedural status, residential relevance, and whether another government action is pending.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", enum: CITIES },
            status: { type: "string", enum: STATUSES },
            residential_only: { type: "boolean" },
            requires_action: { type: "boolean" },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async (input) => {
          validateSearchInput(input);
          return {
            verified_at: core.SNAPSHOT.verified_at,
            freshness,
            results: core.searchPlanningCases(cases, input),
          };
        },
      },
      {
        name: "inspect_case_record",
        title: "Inspect a planning record",
        description: "Return one verified planning record with its exact procedural labels, plain-English significance, explicit non-claims, and official municipal source links.",
        inputSchema: {
          type: "object",
          properties: { case_id: { type: "string", minLength: 1, maxLength: 32 } },
          required: ["case_id"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async (input) => {
          validateInspectInput(input);
          const { case_id } = input;
          const record = core.inspectCaseRecord(cases, case_id);
          if (!record) throw new Error(`Unknown planning record: ${case_id}`);
          return { ...record, freshness };
        },
      },
      {
        name: "stage_source_backed_brief",
        title: "Stage a source-backed brief",
        description: "Stage a reviewable briefing from one to five verified planning records. This updates only the visible page preview; it does not publish, send, or save externally.",
        inputSchema: {
          type: "object",
          properties: {
            case_ids: {
              type: "array",
              items: { type: "string", minLength: 1, maxLength: 32 },
              minItems: 1,
              maxItems: 5,
              uniqueItems: true,
            },
            audience: {
              type: "string",
              enum: ["Land and development", "Lending and title", "Public-interest planning"],
            },
          },
          required: ["case_ids", "audience"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (input) => {
          validateStageInput(input);
          const brief = core.stageSourceBackedBrief(cases, input);
          onBrief(brief);
          return {
            staged: true,
            review_required: true,
            item_count: brief.items.length,
            freshness,
            message: "The brief is staged in the page for human review. Nothing was published or sent.",
          };
        },
      },
    ];

    const controller = new AbortController();
    try {
      await Promise.all(tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })));
    } catch (error) {
      controller.abort();
      throw error;
    }
    return tools;
  }

  return { registerPlanningTools };
});
