---
title: Get native WebMCP tool-run evidence by driving the ChatGPT desktop app's in-app browser with computer-use
date: 2026-09-02
category: developer-experience
module: verification
problem_type: developer_experience
component: tooling
severity: medium
applies_when:
  - "A release claim depends on a browser agent actually invoking the page's WebMCP tools, not on unit tests or a human-path check"
  - "Ordinary automation browsers (Playwright, the in-app Claude browser) do not expose document.modelContext, so they cannot make the calls"
  - "Screenshots of the live receipt or tool output are wanted for a submission or evidence document"
tags: [webmcp, chatgpt-desktop, codex, computer-use, native-run, evidence, screenshots, verification]
---

# Get native WebMCP tool-run evidence by driving the ChatGPT desktop app's in-app browser with computer-use

## Context
The product's strongest claim is that a browser agent calls `search_planning_cases`, `inspect_case_record`, and `stage_source_backed_brief` on the live page and the page writes a receipt row per call. Tests prove the handlers; Playwright proves the human path; neither proves a native agent run, because those browsers have no `document.modelContext`. On September 2, 2026 the release needed that proof twice (after the re-verification deploy and after the `status_history` deploy), plus gallery images of the receipt rows, and the person able to run it was not always at the keyboard.

The ChatGPT desktop app on this machine (bundle id `com.openai.codex`; the menu bar reads ChatGPT, the window shows the Codex UI) has an in-app browser with WebMCP support. Computer-use can drive it. That turned the native run into something the assistant can do end to end.

## Guidance
1. **Request access to the app by its display name.** `request_access` with `apps: ["ChatGPT"]` and `clipboardWrite: true` grants the Codex bundle at the full tier. Open it with `open_application`.

2. **Reuse a project thread and paste, do not type.** Pick an existing thread under the project (the "Measure live agent outcomes" thread was used) so the agent has context. Write the whole instruction to the clipboard with `write_clipboard`, click the composer, press `cmd+v`, click send. Typing a long prompt key by key is slow and error-prone; paste is one action.

3. **Ask for exact outputs and a saved file, not a summary.** The prompt should require: open the live URL fresh, confirm the page's ready state, call the named tools with named inputs, report the exact receipt row texts and tool return values, report `review_required` and console errors, and take no side-effecting action (no review click, no publish). Then send a second message asking it to save its previous reply verbatim as Markdown to a path outside the repository. The chat pane is too narrow to read a long report from screenshots; the file is what gets quoted into the evidence document.

4. **Screenshots: page content yes, browser chrome no.** The agent can capture page regions (the receipt section rendered cleanly at 658 pixels wide) and save them to a folder you name. It cannot capture the browser's own "Available site tools" panel; ask for a fallback capture of the page's ready state instead of letting it stall. Its first saves were JPEG bytes under `.png` names; it converted them when told. Crop with PIL, not `sips`, which silently ignored the crop.

5. **Expect two timing quirks.** `wait` actions are capped at 30 seconds each, so poll with several in one batch. A transient `UserNotificationCenter` window (the app's own notifications) sometimes sits in front and makes a click fail with a "not in the allowed applications" error; wait a few seconds and retry the batch.

6. **Steer rather than restart when it wanders.** When the agent began rewriting DOM order on a form or planning to build a payload from a stale local file, one pasted steer message ("Stop reordering ... save now", "Do not use any local file ... edit the live editor in place") redirected it without losing the session.

7. **Copy the verbatim report into the evidence doc.** `docs/hackathon/EVIDENCE.md` quotes the receipt texts, the returned statuses and `status_history`, `review_required: true`, and the empty console-error list from the saved file, and names where the report lives.

## Why This Matters
"Verified in a supported browser" was, until this method, a claim only a person could produce, and the person was the bottleneck at exactly the moment the release cycle had to run twice in one day. Driving the app through computer-use makes the native run repeatable, produces a verbatim artifact instead of a paraphrase, and yields the one gallery image that shows the agent doing the work rather than the UI looking nice.

## When to Apply
- After every production deploy of this project, before the evidence doc or any public submission text says the release is live.
- When a judge-facing image of real tool calls is needed.
- Any time the in-app Claude browser or Playwright reports `WebMCP not exposed in this browser`; that is the signal to switch to this path rather than to conclude the tools are broken.

## Examples
Prompt shape that worked (abridged):

> In your in-app browser, open https://nwa-growth-signal-webmcp.pages.dev/ fresh. Confirm "WebMCP ready · 3 tools exposed". Using the page's WebMCP tools only: call inspect_case_record for RZ26-00419 and RZ26-00511; then run "[demo prompt]" staging exactly RZ26-0041, RZ26-00419, RZ26-00511 for Land and development. Do not click Mark as reviewed, publish, or send anything. Reply with the requested_filing.status and full status_history for each inspected filing, the exact receipt row texts, review_required, and any console errors.

Follow-up that produced the artifact:

> Save your previous reply verbatim as Markdown to /Users/zaeemkhan/Documents/NWA_Growth/demo/native-run-2026-09-02b.md. Do nothing else.

Resulting receipt rows, as saved:

```text
#01 inspect_case_record SUCCEEDED RZ26-00419 · Recommended.
#02 inspect_case_record SUCCEEDED RZ26-00511 · Recommended.
#03 search_planning_cases SUCCEEDED 5 verified records matched.
#04 inspect_case_record SUCCEEDED RZ26-0041 · Scheduled.
#05 stage_source_backed_brief SUCCEEDED 3 filings staged · human review required.
```

## Related
- `docs/hackathon/EVIDENCE.md`, "Native WebMCP run" and "Second native run" entries under the September 2 production verification.
- `docs/solutions/integration-issues/cloudflare-pages-deploy-preview-vs-production.md`, the deploy verification that precedes the native run.
- The Playwright MCP in this environment can only save screenshots under `/Users/zaeemkhan/Documents/Kajabi/.playwright-mcp/`; copy them out afterwards.
