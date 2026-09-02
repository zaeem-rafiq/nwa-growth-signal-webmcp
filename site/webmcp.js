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
  const AUDIENCES = ["Land and development", "Lending and title", "Public-interest planning"];

  function hasOnlyKeys(input, allowed) {
    return input && typeof input === "object" && !Array.isArray(input) &&
      Object.keys(input).every((key) => allowed.includes(key));
  }

  function typedError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function validateSearchInput(input) {
    if (!hasOnlyKeys(input, ["city", "status", "residential_only", "requires_action"]) ||
        (input.city !== undefined && !CITIES.includes(input.city)) ||
        (input.status !== undefined && !STATUSES.includes(input.status)) ||
        (input.residential_only !== undefined && typeof input.residential_only !== "boolean") ||
        (input.requires_action !== undefined && typeof input.requires_action !== "boolean")) {
      throw typedError("VALIDATION_FAILED", "Invalid search filters.");
    }
  }

  function validateInspectInput(input) {
    if (!hasOnlyKeys(input, ["case_id"]) || typeof input.case_id !== "string" ||
        input.case_id.length < 1 || input.case_id.length > 32) {
      throw typedError("VALIDATION_FAILED", "Invalid case inspection input.");
    }
  }

  function validateStageInput(input) {
    if (!hasOnlyKeys(input, ["case_ids", "audience"])) {
      throw typedError("VALIDATION_FAILED", "Invalid brief input.");
    }
    if (!Array.isArray(input.case_ids) || input.case_ids.length < 1 || input.case_ids.length > 5 ||
        input.case_ids.some((caseId) => typeof caseId !== "string" || caseId.length < 1 || caseId.length > 32) ||
        new Set(input.case_ids).size !== input.case_ids.length) {
      throw typedError("VALIDATION_FAILED", "A brief requires one to five unique case IDs.");
    }
    if (!AUDIENCES.includes(input.audience)) {
      throw typedError("VALIDATION_FAILED", `Unsupported brief audience: ${input.audience}`);
    }
  }

  function validateChangesInput(input) {
    if (!hasOnlyKeys(input, ["city", "changed_only"]) ||
        (input.city !== undefined && !CITIES.includes(input.city)) ||
        (input.changed_only !== undefined && typeof input.changed_only !== "boolean")) {
      throw typedError("VALIDATION_FAILED", "Invalid status change filters.");
    }
  }

  async function registerPlanningTools({ modelContext, cases, onBrief, onActivity, asOf = core.northwestArkansasCivilDate() }) {
    const freshness = core.evaluateSnapshotFreshness(core.SNAPSHOT, asOf);
    let nextCallId = 0;
    const emitActivity = (event) => {
      if (typeof onActivity !== "function") return;
      try {
        const pending = onActivity(event);
        if (pending?.catch) pending.catch(() => {});
      } catch {}
    };
    const successEvent = (tool, result) => {
      if (tool === "search_planning_cases") {
        return { code: "SEARCH_COMPLETE", summary: `${result.results.length} verified records matched.` };
      }
      if (tool === "inspect_case_record") {
        const filing = result?.requested_filing || result?.filings?.[0];
        const safeId = typeof filing?.case_id === "string" && /^[A-Za-z0-9-]{1,32}$/.test(filing.case_id)
          ? filing.case_id : "Verified filing";
        const safeStatus = STATUSES.includes(filing?.status) ? filing.status : "recorded status";
        return { code: "RECORD_FOUND", summary: `${safeId} · ${safeStatus}.` };
      }
      if (tool === "list_status_changes") {
        const changed = Array.isArray(result?.changes)
          ? result.changes.filter((entry) => entry?.changed === true).length : 0;
        const since = /^\d{4}-\d{2}-\d{2}$/.test(result?.previous_verified_at || "")
          ? `since ${result.previous_verified_at}` : "since the previous verification";
        return { code: "CHANGES_LISTED", summary: `${changed} ${changed === 1 ? "filing" : "filings"} changed ${since}.` };
      }
      return {
        code: "BRIEF_STAGED",
        summary: `${result.filing_count} ${result.filing_count === 1 ? "filing" : "filings"} staged · human review required.`,
      };
    };
    const withActivity = (tool, execute) => async (input) => {
      const id = ++nextCallId;
      emitActivity({ id, tool, status: "started", code: "CALL_STARTED", summary: "Call started." });
      try {
        const result = await execute(input);
        emitActivity({ id, tool, status: "succeeded", ...successEvent(tool, result) });
        return result;
      } catch (error) {
        const validationFailed = error?.code === "VALIDATION_FAILED";
        const callbackFailed = error?.code === "CALLBACK_FAILED";
        emitActivity({
          id,
          tool,
          status: "failed",
          code: validationFailed ? "VALIDATION_FAILED" : callbackFailed ? "CALLBACK_FAILED" : "TOOL_FAILED",
          summary: validationFailed
            ? "Call rejected: invalid input."
            : callbackFailed ? "Visible brief update failed." : "Call failed safely.",
        });
        throw error;
      }
    };
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
        execute: withActivity("search_planning_cases", async (input) => {
          validateSearchInput(input);
          return {
            verified_at: core.SNAPSHOT.verified_at,
            freshness,
            results: core.searchPlanningCases(cases, input),
          };
        }),
      },
      {
        name: "inspect_case_record",
        title: "Inspect a planning record",
        description: "Return one verified planning record with its exact procedural labels, each filing's verified status history (August 25 and September 2, 2026 with the official source for each), plain-English significance, explicit non-claims, and official municipal source links.",
        inputSchema: {
          type: "object",
          properties: { case_id: { type: "string", minLength: 1, maxLength: 32 } },
          required: ["case_id"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: withActivity("inspect_case_record", async (input) => {
          validateInspectInput(input);
          const { case_id } = input;
          const record = core.inspectCaseRecord(cases, case_id);
          if (!record) throw new Error(`Unknown planning record: ${case_id}`);
          return { ...record, freshness };
        }),
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
              enum: AUDIENCES,
            },
          },
          required: ["case_ids", "audience"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: withActivity("stage_source_backed_brief", async (input) => {
          validateStageInput(input);
          const brief = core.stageSourceBackedBrief(cases, input);
          try {
            await onBrief(brief);
          } catch {
            throw typedError("CALLBACK_FAILED", "Brief could not be staged.");
          }
          const filingIds = brief.items.flatMap((record) =>
            (record.selected_filings || record.filings || []).map(({ case_id: caseId }) => caseId)
          );
          return {
            staged: true,
            review_required: true,
            item_count: brief.items.length,
            filing_count: filingIds.length,
            filing_ids: filingIds,
            freshness,
            message: "The brief is staged in the page for human review. Nothing was published or sent.",
          };
        }),
      },
      {
        name: "list_status_changes",
        title: "List verified status changes",
        description: "List the verified filings whose procedural status changed between the previous verification and the current one. Each entry carries both verification dates, the official source checked on each date, and any note about a record that moved or went silent. Set changed_only to false to include the unchanged filings. Nothing is inferred about why a status changed.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", enum: CITIES },
            changed_only: { type: "boolean" },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: withActivity("list_status_changes", async (input) => {
          validateChangesInput(input);
          const { previous_verified_at, changes } = core.listStatusChanges(cases, input);
          return {
            verified_at: core.SNAPSHOT.verified_at,
            previous_verified_at,
            freshness,
            changes,
          };
        }),
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
