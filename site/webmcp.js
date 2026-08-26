(function attachWebMCP(root, factory) {
  const core = typeof module === "object" && module.exports
    ? require("./core.js")
    : root.NWASignal;
  const api = factory(core);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NWAWebMCP = api;
})(typeof window === "undefined" ? globalThis : window, (core) => {
  async function registerPlanningTools({ modelContext, cases, onBrief }) {
    const tools = [
      {
        name: "search_planning_cases",
        title: "Search NWA planning cases",
        description: "Search the verified Bentonville and Rogers planning record by municipality, procedural status, residential relevance, and whether another government action is pending.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", enum: ["Bentonville", "Rogers"] },
            status: { type: "string", enum: ["Scheduled", "Tabled", "Withdrawn", "Recommended"] },
            residential_only: { type: "boolean" },
            requires_action: { type: "boolean" },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async (input) => ({
          verified_at: "2026-08-25",
          results: core.searchPlanningCases(cases, input),
        }),
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
        execute: async ({ case_id }) => {
          const record = core.inspectCaseRecord(cases, case_id);
          if (!record) throw new Error(`Unknown planning record: ${case_id}`);
          return record;
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
          const brief = core.stageSourceBackedBrief(cases, input);
          onBrief(brief);
          return {
            staged: true,
            review_required: true,
            item_count: brief.items.length,
            message: "The brief is staged in the page for human review. Nothing was published or sent.",
          };
        },
      },
    ];

    await Promise.all(tools.map((tool) => modelContext.registerTool(tool)));
    return tools;
  }

  return { registerPlanningTools };
});
