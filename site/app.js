(() => {
  const elements = {
    city: document.querySelector("#city-filter"),
    status: document.querySelector("#status-filter"),
    action: document.querySelector("#action-filter"),
    reset: document.querySelector("#reset-filters"),
    count: document.querySelector("#result-count"),
    list: document.querySelector("#record-list"),
    listStatus: document.querySelector("#record-list-status"),
    detail: document.querySelector("#record-detail"),
    signalDesk: document.querySelector(".signal-desk"),
    deskMessage: document.querySelector("#desk-message"),
    deskMessageCopy: document.querySelector("#desk-message-copy"),
    retry: document.querySelector("#retry-load"),
    selectionTray: document.querySelector("#selection-tray"),
    selectionCount: document.querySelector("#selection-count"),
    selected: document.querySelector("#selected-records"),
    audience: document.querySelector("#brief-audience"),
    stage: document.querySelector("#stage-brief"),
    preview: document.querySelector("#brief-preview"),
    reviewed: document.querySelector("#mark-reviewed"),
    workspaceStatus: document.querySelector("#workspace-status"),
    webmcpState: document.querySelector("#webmcp-state"),
    prompt: document.querySelector("#demo-prompt"),
    copyPrompt: document.querySelector("#copy-prompt"),
    copyStatus: document.querySelector("#copy-status"),
    receiptEmpty: document.querySelector("#receipt-empty"),
    receiptRows: document.querySelector("#receipt-rows"),
    receiptDisclosure: document.querySelector("#receipt-disclosure"),
    freshnessSummary: document.querySelector("#freshness-summary"),
    freshnessState: document.querySelector("#freshness-state"),
    freshnessDetail: document.querySelector("#freshness-detail"),
  };

  const state = {
    cases: [],
    filtered: [],
    activeRecordId: null,
    selectedFilingIds: new Set(),
    stagedBrief: null,
    ready: false,
    receiptCalls: [],
    receiptTruncated: false,
    freshness: null,
  };

  function node(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.text !== undefined) element.textContent = options.text;
    return element;
  }

  function statusBadge(status) {
    const badge = node("span", { className: "status-badge", text: status });
    badge.dataset.status = status;
    return badge;
  }

  function freshnessCopy(freshness) {
    if (freshness.state === "reverification_due") {
      return {
        title: "Re-verification due",
        detail: `Last verified ${window.NWASignal.SNAPSHOT.verified_at}. Official records may have changed on or after ${freshness.reverify_on}; statuses are shown as last verified. Confirm current status with the city before relying on an item.`,
      };
    }
    if (freshness.state === "verification_date_only") {
      return {
        title: "Verification date only",
        detail: "The snapshot cannot be treated as current; statuses are shown as last verified. Confirm current status with the city before relying on an item.",
      };
    }
    return {
      title: "Snapshot current",
      detail: `Verified ${window.NWASignal.SNAPSHOT.verified_at} against the official records; next scheduled re-verification ${freshness.reverify_on}. Statuses are shown as last verified.`,
    };
  }

  function renderSnapshotFreshness() {
    state.freshness = window.NWASignal.evaluateSnapshotFreshness(
      window.NWASignal.SNAPSHOT,
      window.NWASignal.northwestArkansasCivilDate()
    );
    const copy = freshnessCopy(state.freshness);
    elements.freshnessSummary.dataset.state = state.freshness.state;
    elements.freshnessState.textContent = copy.title;
    elements.freshnessDetail.textContent = copy.detail;
  }

  function freshnessLine(className = "freshness-line") {
    return node("p", { className, text: freshnessCopy(state.freshness).detail });
  }

  function renderActivityReceipt() {
    elements.receiptRows.replaceChildren();
    elements.receiptEmpty.textContent = "No agent calls have run in this session.";
    elements.receiptEmpty.hidden = Boolean(state.receiptCalls.length);
    elements.receiptDisclosure.hidden = !state.receiptTruncated;
    state.receiptCalls.forEach((call) => {
      const row = node("article", { className: "receipt-row" });
      row.setAttribute("data-call-id", call.id);
      row.dataset.status = call.status;
      const heading = node("div", { className: "receipt-row-heading" });
      heading.append(
        node("span", { className: "receipt-number", text: `#${String(call.id).padStart(2, "0")}` }),
        node("code", { text: call.tool }),
        node("span", { className: "receipt-state", text: call.status })
      );
      row.append(heading, node("p", { className: "receipt-summary", text: call.summary }));
      elements.receiptRows.append(row);
    });
  }

  function recordActivity(event) {
    const tools = ["search_planning_cases", "inspect_case_record", "stage_source_backed_brief"];
    const statuses = ["started", "succeeded", "failed"];
    const codes = ["CALL_STARTED", "SEARCH_COMPLETE", "RECORD_FOUND", "BRIEF_STAGED", "VALIDATION_FAILED", "CALLBACK_FAILED", "TOOL_FAILED"];
    if (!Number.isSafeInteger(event?.id) || event.id < 1 || !tools.includes(event.tool) ||
        !statuses.includes(event.status) || !codes.includes(event.code) || typeof event.summary !== "string") return;
    const call = {
      id: event.id,
      tool: event.tool,
      status: event.status,
      summary: event.summary.slice(0, 120),
    };
    const existingIndex = state.receiptCalls.findIndex(({ id }) => id === call.id);
    if (existingIndex >= 0) state.receiptCalls[existingIndex] = call;
    else state.receiptCalls.push(call);
    if (state.receiptCalls.length > 8) {
      state.receiptCalls = state.receiptCalls.slice(-8);
      state.receiptTruncated = true;
    }
    renderActivityReceipt();
  }

  function currentFilters() {
    return {
      city: elements.city.value || undefined,
      status: elements.status.value || undefined,
      residential_only: true,
      requires_action: elements.action.value === "true" || undefined,
    };
  }

  function displayedFilings(record) {
    return record.matching_filings || record.filings || [];
  }

  function recordHasSelectedFiling(record) {
    return record.case_ids.some((caseId) => state.selectedFilingIds.has(caseId));
  }

  function applyFilters() {
    state.filtered = window.NWASignal.searchPlanningCases(state.cases, currentFilters());
    if (!state.filtered.some(({ id }) => id === state.activeRecordId)) {
      state.activeRecordId = state.filtered[0]?.id || null;
    }
    renderRecordList();
    renderRecordDetail();
    renderSelectedRecords();
  }

  function renderRecordList() {
    elements.list.replaceChildren();
    elements.count.textContent = `${state.filtered.length} ${state.filtered.length === 1 ? "record" : "records"}`;
    elements.listStatus.textContent = `${state.filtered.length} ${state.filtered.length === 1 ? "record" : "records"} shown.`;

    if (!state.filtered.length) {
      elements.list.append(node("p", { className: "empty-state", text: "No verified records match these filters." }));
      return;
    }

    state.filtered.forEach((record) => {
      const button = node("button", { className: "record-row" });
      button.type = "button";
      button.setAttribute("data-record-id", record.id);
      button.setAttribute("aria-current", String(record.id === state.activeRecordId));
      button.addEventListener("click", () => {
        state.activeRecordId = record.id;
        renderRecordList();
        renderRecordDetail();
        focusRecordRow(record.id);
      });

      const top = node("span", { className: "record-row-top" });
      top.append(
        node("strong", { text: record.title }),
        node("span", { className: "row-case", text: record.case_ids.join(" / ") })
      );
      const meta = node("span", { className: "row-meta" });
      meta.append(node("span", { text: record.city }));
      record.status_labels.forEach((status) => meta.append(statusBadge(status)));
      if (recordHasSelectedFiling(record)) meta.append(node("span", { className: "selection-marker", text: "Selected" }));
      button.append(top, meta);
      elements.list.append(button);
    });
  }

  function focusRecordRow(id) {
    elements.list.querySelector(`[data-record-id="${id}"]`)?.focus();
  }

  function labeledSection(label, text) {
    const section = node("section", { className: "record-section" });
    section.append(node("h4", { text: label }), node("p", { text }));
    return section;
  }

  function renderRecordDetail() {
    elements.detail.replaceChildren();
    const record = state.filtered.find(({ id }) => id === state.activeRecordId) ||
      window.NWASignal.inspectCaseRecord(state.cases, state.activeRecordId);
    if (!record) {
      elements.detail.append(node("p", { className: "empty-state", text: "Choose a record from the index." }));
      return;
    }

    const folio = node("div", { className: "detail-folio" });
    folio.append(
      node("span", { text: `Signal ${record.item_number}` }),
      node("span", { text: `Verified ${record.verified_at}` })
    );
    const title = node("h3", { className: "detail-title", text: record.title });
    title.id = "record-title";
    const caseLine = node("p", { className: "case-line", text: `${record.city}, Arkansas` });
    const filings = node("div", { className: "detail-filings" });
    displayedFilings(record).forEach((filing) => {
      const row = node("div", { className: "filing-row" });
      const select = node("button", {
        className: "button button-secondary select-record",
        text: state.selectedFilingIds.has(filing.case_id) ? "Remove filing" : "Add filing",
      });
      select.type = "button";
      select.setAttribute("aria-label", `${state.selectedFilingIds.has(filing.case_id) ? "Remove" : "Add"} ${filing.case_id} from the brief`);
      select.addEventListener("click", () => toggleSelection(filing.case_id, "detail"));
      row.append(node("strong", { text: filing.case_id }), statusBadge(filing.status), select);
      filings.append(row);
    });

    const sources = node("section", { className: "record-section" });
    sources.append(node("h4", { text: "Official sources" }));
    const sourceList = node("ol", { className: "source-list" });
    record.sources.forEach((source) => {
      const link = node("a", { text: source.title });
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.append(node("span", { className: "visually-hidden", text: ", opens in a new tab" }));
      const item = node("li");
      item.append(link);
      sourceList.append(item);
    });
    sources.append(sourceList);

    const nonClaims = node("section", { className: "record-section" });
    nonClaims.append(node("h4", { text: "Explicit non-claims" }));
    const nonClaimList = node("ul", { className: "non-claim-list" });
    record.non_claims.forEach((claim) => nonClaimList.append(node("li", { text: claim })));
    nonClaims.append(nonClaimList);

    elements.detail.append(
      folio,
      title,
      caseLine,
      freshnessLine(),
      filings,
      labeledSection("Record summary", record.summary),
      labeledSection("What is proposed", record.proposal),
      labeledSection("Why it matters", record.significance),
      labeledSection("Next procedural step", record.next_step),
      sources,
      nonClaims
    );
  }

  function toggleSelection(id, focusTarget) {
    if (state.selectedFilingIds.has(id)) state.selectedFilingIds.delete(id);
    else state.selectedFilingIds.add(id);
    invalidateBrief();
    renderRecordList();
    renderRecordDetail();
    renderSelectedRecords();
    elements.workspaceStatus.textContent = state.selectedFilingIds.size
      ? `${state.selectedFilingIds.size} ${state.selectedFilingIds.size === 1 ? "filing" : "filings"} ready to stage.`
      : "Awaiting a selection.";
    if (focusTarget === "detail") elements.detail.querySelector(".select-record")?.focus();
    if (focusTarget === "workspace") (elements.selected.querySelector(".remove-selection") || elements.audience).focus();
  }

  function renderSelectedRecords() {
    elements.selected.replaceChildren();
    elements.selectionCount.textContent = `${state.selectedFilingIds.size} selected`;
    elements.selectionTray.dataset.empty = String(!state.selectedFilingIds.size);
    elements.stage.disabled = !state.ready || !state.selectedFilingIds.size;
    if (!state.selectedFilingIds.size) {
      elements.selected.append(node("p", { className: "empty-state", text: "No records selected." }));
      return;
    }

    const visibleIds = new Set(state.filtered.flatMap((record) => displayedFilings(record).map(({ case_id: caseId }) => caseId)));
    const hiddenCount = [...state.selectedFilingIds].filter((id) => !visibleIds.has(id)).length;
    if (hiddenCount) {
      elements.selected.append(node("p", {
        className: "selection-disclosure",
        text: `${hiddenCount} selected ${hiddenCount === 1 ? "filing is" : "filings are"} outside current filters.`,
      }));
    }

    state.selectedFilingIds.forEach((id) => {
      const record = window.NWASignal.inspectCaseRecord(state.cases, id);
      const filing = record.requested_filing;
      const row = node("div", { className: "selected-row" });
      const copy = node("div");
      copy.append(node("strong", { text: record.title }), node("span", { text: `${filing.case_id} · ${filing.status}` }));
      const remove = node("button", { className: "remove-selection", text: "×" });
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${filing.case_id} from the brief`);
      remove.addEventListener("click", () => toggleSelection(id, "workspace"));
      row.append(copy, remove);
      elements.selected.append(row);
    });
  }

  function renderBrief(brief, source = "agent") {
    elements.preview.replaceChildren();
    state.stagedBrief = brief;
    elements.audience.value = brief.audience;
    elements.preview.append(node("p", {
      className: "brief-snapshot",
      text: `Audience: ${brief.audience} · ${brief.items.length} ${brief.items.length === 1 ? "record" : "records"} staged`,
    }), freshnessLine("freshness-line brief-freshness"));
    brief.items.forEach((record) => {
      const item = node("article", { className: "brief-item" });
      const heading = node("strong", { text: record.title });
      const provenance = node("p", {
        className: "brief-provenance",
        text: `${record.city}, Arkansas · Verified ${record.verified_at}`,
      });
      const filings = node("div", { className: "detail-statuses brief-filings" });
      (record.selected_filings || record.filings || []).forEach((filing) => {
        const row = node("div", { className: "filing-row" });
        row.append(node("strong", { text: filing.case_id }), statusBadge(filing.status));
        filings.append(row);
      });
      const sources = node("ol", { className: "brief-sources" });
      record.sources.forEach((source) => {
        const link = node("a", { text: source.title });
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.append(node("span", { className: "visually-hidden", text: ", opens in a new tab" }));
        const sourceItem = node("li");
        sourceItem.append(link);
        sources.append(sourceItem);
      });
      item.append(heading, provenance, filings, node("p", { text: record.summary }), node("p", { text: record.next_step }), sources);
      elements.preview.append(item);
    });
    elements.preview.append(node("p", { className: "brief-note", text: brief.standing_note }));
    elements.reviewed.disabled = false;
    elements.workspaceStatus.textContent = `${source === "agent" ? "Agent" : "Human"} staged ${brief.items.length} ${brief.items.length === 1 ? "record" : "records"}. Review required; nothing was published.`;
  }

  function invalidateBrief() {
    const hadBrief = Boolean(state.stagedBrief);
    state.stagedBrief = null;
    elements.preview.replaceChildren(node("p", { className: "empty-state", text: "Selection or audience changed. Stage the current records for review." }));
    elements.reviewed.disabled = true;
    if (hadBrief) elements.workspaceStatus.textContent = "Selection or audience changed. Stage the brief again before review.";
  }

  function stageManualBrief() {
    if (!state.selectedFilingIds.size) {
      elements.workspaceStatus.textContent = "Select at least one verified record before staging a brief.";
      return;
    }
    const brief = window.NWASignal.stageSourceBackedBrief(state.cases, {
      case_ids: [...state.selectedFilingIds],
      audience: elements.audience.value,
    });
    renderBrief(brief, "human");
  }

  function setWebMCPState(status, title, detail) {
    elements.webmcpState.dataset.state = status;
    elements.webmcpState.querySelector("strong").textContent = title;
    elements.webmcpState.querySelector(".state-detail").textContent = detail;
  }

  function setDeskLoading() {
    state.ready = false;
    elements.signalDesk.dataset.loading = "true";
    elements.signalDesk.setAttribute("aria-busy", "true");
    [elements.city, elements.status, elements.action, elements.reset, elements.audience, elements.stage].forEach((control) => {
      control.disabled = true;
    });
  }

  function setDeskReady(ready) {
    state.ready = ready;
    elements.signalDesk.dataset.loading = "false";
    elements.signalDesk.setAttribute("aria-busy", "false");
    [elements.city, elements.status, elements.action, elements.reset, elements.audience].forEach((control) => {
      control.disabled = !ready;
    });
    elements.stage.disabled = !ready || !state.selectedFilingIds.size;
  }

  async function registerWebMCP() {
    if (!document.modelContext?.registerTool) {
      setWebMCPState("unsupported", "WebMCP not exposed in this browser", "The human interface remains fully usable; open in ChatGPT’s browser or supported Chrome to expose three agent tools.");
      return;
    }

    try {
      await window.NWAWebMCP.registerPlanningTools({
        modelContext: document.modelContext,
        cases: state.cases,
        onActivity: recordActivity,
        onBrief: (brief) => {
          state.selectedFilingIds = new Set(brief.items.flatMap((record) =>
            (record.selected_filings || record.filings || []).map(({ case_id: caseId }) => caseId)
          ));
          renderRecordList();
          renderSelectedRecords();
          renderRecordDetail();
          renderBrief(brief, "agent");
        },
      });
      setWebMCPState("ready", "WebMCP ready · 3 tools exposed", "Your agent can search, inspect evidence, and stage a local brief in this shared interface.");
    } catch (error) {
      console.error(error);
      setWebMCPState("error", "WebMCP registration failed", "The human interface remains usable. Reload in a supported secure browser context to try again.");
    }
  }

  async function initialize() {
    setDeskLoading();
    elements.deskMessage.hidden = true;
    elements.count.textContent = "Loading";
    try {
      const response = await fetch("cases.json", { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Planning records failed to load (${response.status}).`);
      state.cases = await response.json();
      state.filtered = state.cases;
      state.activeRecordId = state.cases[0]?.id || null;
      setDeskReady(true);
      applyFilters();
      await registerWebMCP();
    } catch (error) {
      console.error(error);
      setDeskReady(false);
      elements.count.textContent = "Unavailable";
      elements.list.replaceChildren(node("p", { className: "empty-state", text: "The verified record could not be loaded." }));
      elements.detail.replaceChildren(node("p", { className: "empty-state", text: "Record unavailable." }));
      elements.deskMessageCopy.textContent = "The verified record could not be loaded. Check the connection and try again.";
      elements.deskMessage.hidden = false;
      setWebMCPState("error", "Planning record unavailable", "WebMCP tools were not registered because their verified source data did not load.");
    }
  }

  elements.city.addEventListener("change", applyFilters);
  elements.status.addEventListener("change", applyFilters);
  elements.action.addEventListener("change", applyFilters);
  elements.reset.addEventListener("click", () => {
    elements.city.value = "";
    elements.status.value = "";
    elements.action.value = "";
    applyFilters();
  });
  elements.stage.addEventListener("click", stageManualBrief);
  elements.audience.addEventListener("change", invalidateBrief);
  elements.retry.addEventListener("click", initialize);
  elements.reviewed.addEventListener("click", () => {
    elements.workspaceStatus.textContent = "Human review recorded for this session. Nothing was published or sent.";
    elements.reviewed.disabled = true;
  });
  elements.copyPrompt.addEventListener("click", async () => {
    elements.copyPrompt.disabled = true;
    try {
      await navigator.clipboard.writeText(elements.prompt.textContent.trim());
      elements.copyStatus.textContent = "Demo prompt copied to the clipboard.";
    } catch {
      elements.copyStatus.textContent = "Clipboard access was denied. The prompt is selected for manual copying.";
      elements.prompt.setAttribute("tabindex", "-1");
      elements.prompt.focus();
      const range = document.createRange();
      range.selectNodeContents(elements.prompt);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } finally {
      elements.copyPrompt.disabled = false;
    }
  });

  renderActivityReceipt();
  renderSnapshotFreshness();
  initialize();
})();
