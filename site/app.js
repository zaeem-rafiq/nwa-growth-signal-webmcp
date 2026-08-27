(() => {
  const elements = {
    city: document.querySelector("#city-filter"),
    status: document.querySelector("#status-filter"),
    reset: document.querySelector("#reset-filters"),
    count: document.querySelector("#result-count"),
    list: document.querySelector("#record-list"),
    listStatus: document.querySelector("#record-list-status"),
    detail: document.querySelector("#record-detail"),
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
  };

  const state = {
    cases: [],
    filtered: [],
    activeId: null,
    selectedIds: new Set(),
    stagedBrief: null,
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

  function currentFilters() {
    return {
      city: elements.city.value || undefined,
      status: elements.status.value || undefined,
      residential_only: true,
    };
  }

  function applyFilters() {
    state.filtered = window.NWASignal.searchPlanningCases(state.cases, currentFilters());
    if (!state.filtered.some(({ id }) => id === state.activeId)) {
      state.activeId = state.filtered[0]?.id || null;
    }
    renderRecordList();
    renderRecordDetail();
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
      button.dataset.selected = String(state.selectedIds.has(record.id));
      button.setAttribute("aria-current", String(record.id === state.activeId));
      button.addEventListener("click", () => {
        state.activeId = record.id;
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
      if (state.selectedIds.has(record.id)) meta.append(node("span", { className: "selection-marker", text: "Selected" }));
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
    const record = window.NWASignal.inspectCaseRecord(state.cases, state.activeId);
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
    const caseLine = node("p", { className: "case-line", text: `${record.city}, Arkansas · ${record.case_ids.join(" · ")}` });
    const statuses = node("div", { className: "detail-statuses" });
    record.status_labels.forEach((status) => statuses.append(statusBadge(status)));

    const sources = node("section", { className: "record-section" });
    sources.append(node("h4", { text: "Official sources" }));
    const sourceList = node("ol", { className: "source-list" });
    record.sources.forEach((source) => {
      const link = node("a", { text: source.title });
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener";
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

    const select = node("button", {
      className: "button button-secondary select-record",
      text: state.selectedIds.has(record.id) ? "Remove from brief" : "Add to brief",
    });
    select.type = "button";
    select.addEventListener("click", () => toggleSelection(record.id, "detail"));

    elements.detail.append(
      folio,
      title,
      caseLine,
      statuses,
      labeledSection("Record summary", record.summary),
      labeledSection("What is proposed", record.proposal),
      labeledSection("Why it matters", record.significance),
      labeledSection("Next procedural step", record.next_step),
      sources,
      nonClaims,
      select
    );
  }

  function toggleSelection(id, focusTarget) {
    if (state.selectedIds.has(id)) state.selectedIds.delete(id);
    else state.selectedIds.add(id);
    invalidateBrief();
    renderRecordList();
    renderRecordDetail();
    renderSelectedRecords();
    elements.workspaceStatus.textContent = state.selectedIds.size
      ? `${state.selectedIds.size} ${state.selectedIds.size === 1 ? "record" : "records"} ready to stage.`
      : "Awaiting a selection.";
    if (focusTarget === "detail") elements.detail.querySelector(".select-record")?.focus();
    if (focusTarget === "workspace") (elements.selected.querySelector(".remove-selection") || elements.stage).focus();
  }

  function renderSelectedRecords() {
    elements.selected.replaceChildren();
    elements.selectionCount.textContent = `${state.selectedIds.size} selected`;
    elements.selectionTray.dataset.empty = String(!state.selectedIds.size);
    elements.stage.disabled = !state.selectedIds.size;
    if (!state.selectedIds.size) {
      elements.selected.append(node("p", { className: "empty-state", text: "No records selected." }));
      return;
    }

    state.selectedIds.forEach((id) => {
      const record = window.NWASignal.inspectCaseRecord(state.cases, id);
      const row = node("div", { className: "selected-row" });
      const copy = node("div");
      copy.append(node("strong", { text: record.title }), node("span", { text: record.case_ids.join(" / ") }));
      const remove = node("button", { className: "remove-selection", text: "×" });
      remove.type = "button";
      remove.setAttribute("data-selection-id", id);
      remove.setAttribute("aria-label", `Remove ${record.title} from the brief`);
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
    }));
    brief.items.forEach((record) => {
      const item = node("article", { className: "brief-item" });
      const heading = node("strong", { text: record.title });
      const selectedCaseIds = record.selected_filings?.map(({ case_id: caseId }) => caseId) || record.case_ids;
      const provenance = node("p", {
        className: "brief-provenance",
        text: `${record.city}, Arkansas · ${selectedCaseIds.join(" / ")} · Verified ${record.verified_at}`,
      });
      const statuses = node("div", { className: "detail-statuses" });
      const selectedStatuses = record.selected_filings?.map(({ status }) => status) || record.status_labels;
      selectedStatuses.forEach((status) => statuses.append(statusBadge(status)));
      const sources = node("ol", { className: "brief-sources" });
      record.sources.forEach((source) => {
        const link = node("a", { text: source.title });
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener";
        const sourceItem = node("li");
        sourceItem.append(link);
        sources.append(sourceItem);
      });
      item.append(heading, provenance, statuses, node("p", { text: record.summary }), node("p", { text: record.next_step }), sources);
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
    if (!state.selectedIds.size) {
      elements.workspaceStatus.textContent = "Select at least one verified record before staging a brief.";
      return;
    }
    const brief = window.NWASignal.stageSourceBackedBrief(state.cases, {
      case_ids: [...state.selectedIds],
      audience: elements.audience.value,
    });
    renderBrief(brief, "human");
  }

  function setWebMCPState(status, title, detail) {
    elements.webmcpState.dataset.state = status;
    elements.webmcpState.querySelector("strong").textContent = title;
    elements.webmcpState.querySelector(".state-detail").textContent = detail;
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
        onBrief: (brief) => {
          state.selectedIds = new Set(brief.items.map(({ id }) => id));
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
    try {
      const response = await fetch("cases.json");
      if (!response.ok) throw new Error(`Planning records failed to load (${response.status}).`);
      state.cases = await response.json();
      state.filtered = state.cases;
      state.activeId = state.cases[0]?.id || null;
      document.querySelector(".signal-desk").dataset.loading = "false";
      applyFilters();
      renderSelectedRecords();
      await registerWebMCP();
    } catch (error) {
      console.error(error);
      elements.list.replaceChildren(node("p", { className: "empty-state", text: "The verified record could not be loaded. Refresh the page to retry." }));
      elements.detail.replaceChildren(node("p", { className: "empty-state", text: "Record unavailable." }));
      setWebMCPState("error", "Planning record unavailable", "WebMCP tools were not registered because their verified source data did not load.");
    }
  }

  elements.city.addEventListener("change", applyFilters);
  elements.status.addEventListener("change", applyFilters);
  elements.reset.addEventListener("click", () => {
    elements.city.value = "";
    elements.status.value = "";
    applyFilters();
  });
  elements.stage.addEventListener("click", stageManualBrief);
  elements.audience.addEventListener("change", invalidateBrief);
  elements.reviewed.addEventListener("click", () => {
    elements.workspaceStatus.textContent = "Human review recorded for this session. Nothing was published or sent.";
    elements.reviewed.disabled = true;
  });
  elements.copyPrompt.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(elements.prompt.textContent.trim());
      elements.copyPrompt.textContent = "Prompt copied";
    } catch {
      elements.copyPrompt.textContent = "Select and copy the prompt manually";
    }
  });

  initialize();
})();
