# Demo Recording Package

Published baseline: `demo/output/NWA-Growth-Signal-WebMCP-Demo.mp4`

- Runtime: 2 minutes 31.8 seconds; below the official three-minute limit.
- Format: 1280×720 H.264/AAC with 30 sidecar caption cues.
- Narration: Google Gemini Kore host and Iapetus expert.
- Technical QA: passed.
- Participant listening approval: passed August 28, 2026.
- Publication status: public at https://youtu.be/y3lzrrvDKP8; independently verified August 28, 2026.
- YouTube captions: the 30-cue English (United States) SRT was published in YouTube Studio on August 28, 2026; the public player still reported captions unavailable during the immediate propagation check.

Revised local candidate: `demo/output/NWA-Growth-Signal-WebMCP-Demo-v2.mp4`

- Runtime: 2 minutes 39.4 seconds; below the official three-minute limit.
- Format: 1280×720 H.264/AAC with 30 sidecar caption cues.
- Live evidence: exact host task, all three succeeded handler receipts, split filing status, review boundary, freshness, and sourced comparison captured from one deployed browser session on August 29, 2026.
- Release proof: 74/74 tests, 2/2 core-to-adapter parity scenarios, eight human control activations versus three agent tool calls for the fixed script, and `release_ready: true` on the fresh fixture date.
- Technical media QA: passed.
- Participant listening approval: passed August 29, 2026.
- Publication status: public at https://youtu.be/otLlVr_CHVU; browser-verified August 29, 2026.
- YouTube captions: English (United States) is published in Studio; the public player still reported captions unavailable during the immediate propagation check.

## v7 dialogue and shot list (four-call prompt)

Rendered with `demo/render-judge-live-v7.sh` from `demo/captures/v7/live-workflow.mp4` (one continuous local screencast against the four-tool release) and the Gemini Kore host and Iapetus expert narration. Total runtime 2:50 (170.8s), inside the official three-minute limit. Captions come from `demo/make-srt-v7.py`, one cue per narration line.

### 0:00-0:16 - The problem

**Picture:** Hero, then the problem card over the five-record Signal Desk.

**Dialogue:**

> **Host:** Why is local planning research still so hard?
>
> **Expert:** Because the public record is fragmented across agendas, legal notices, and permit portals.
>
> **Host:** And what does NWA Growth Signal change?
>
> **Expert:** It brings that record into one evidence desk, shared by people and browser agents.

### 0:16-0:34 - The WebMCP contract

**Picture:** The demo prompt with the four tool names, then the workflow map: 01 search, 02 changes, 03 inspect, 04 stage.

**Dialogue:**

> **Host:** What can a browser agent do here?
>
> **Expert:** Four native WebMCP tools: search the verified record, list which filings changed since the last check, inspect one filing, and stage a source-backed brief for human review.
>
> **Host:** Separate from what a person sees?
>
> **Expert:** No. Same data, same page.

### 0:34-0:53 - Search

**Picture:** Ask the agent:

> Find residential Bentonville and Rogers cases still awaiting procedural action. List which filings changed status since the previous verification, inspect their official evidence, and stage a three-item brief without representing any recommendation as final approval.

Keep the host prompt visible, then show `search_planning_cases` returning the bounded records and its receipt row changing to `Succeeded`. Begin the continuous, uncut tool segment here.

**Dialogue:**

> **Host:** Show me the search.
>
> **Expert:** I asked for residential records still waiting on another procedural action. The live tool returned five editorially verified records across Bentonville and Rogers.
>
> **Host:** What comes back with each result?
>
> **Expert:** Its filing identifiers, exact status, next step, and official municipal sources.

### 0:53-1:16 - What moved since the last check

**Picture:** Show `list_status_changes` returning the two moved filings, its receipt row (`2 filings changed since 2026-08-25.`), then open 209 W. Locust Street so the status-history line (`2026-08-25: Tabled → 2026-09-02: Recommended`) is on screen.

**Dialogue:**

> **Host:** What moved since the last check?
>
> **Expert:** It compares each filing's two verified dates. Two moved: Locust Street, tabled to recommended inside the same table row, and Poplar Street, scheduled to recommended.
>
> **Host:** Does it say why?
>
> **Expert:** No. Only the label, the date, and the official source.

### 1:16-1:42 - Inspect the difficult case

**Picture:** Show `inspect_case_record` for `RZ26-00511`. Hold on the filing-level result: `VAR26-0397 · Withdrawn` beside `RZ26-00511 · Recommended`, then the official source URLs, without cutting away from the run.

**Dialogue:**

> **Host:** Which record is easiest to misread?
>
> **Expert:** Case RZ26-00511. One parcel, two separate filings: the variance is withdrawn, while the rezoning is now recommended to City Council.
>
> **Host:** Does the tool collapse them into one story?
>
> **Expert:** No. It keeps them distinct, infers no relationship, and does not turn a recommendation into an approval.

### 1:42-1:59 - Shared agent-human surface

**Picture:** Let `stage_source_backed_brief` stage three records. The fourth receipt row succeeds and the brief workspace updates in the same continuous run. Scroll through one staged filing and the standing note.

**Dialogue:**

> **Host:** What happens when you stage the brief?
>
> **Expert:** Three source-backed records move into the same page the person is already using.
>
> **Host:** Is anything published automatically?
>
> **Expert:** No. The live result says three records staged and human review required.

### 1:59-2:15 - Boundary

**Picture:** Hold on the review-required state, then the human review control.

**Dialogue:**

> **Host:** What does the agent do outside this page?
>
> **Expert:** Nothing. It does not send, save externally, or publish.
>
> **Host:** And what boundary does the workspace preserve?
>
> **Expert:** Recommendation is not adoption, and a planning action is not a construction permit.

### 2:15-2:39 - Proof

**Picture:** The evidence card: 2/2 parity, 4/4 tools, 26/26 historical events, 20/23 agenda-only unknowns, 2 false-finality cases, 10/4 human controls versus agent tools, 94 tests.

**Dialogue:**

> **Host:** How do you know those guardrails hold?
>
> **Expert:** The release benchmark compares the direct core and all four tool handlers across two fixed tasks.
>
> **Host:** What did it verify?
>
> **Expert:** Both tasks reach the same filing, status, source, audience, freshness, and review outcomes. Ninety-four tests pass. The primary script takes ten human controls or four agent tool calls, not observed time savings.

### 2:39-2:50 - Close

**Picture:** The human-accountability card over the recorded-review state.

**Dialogue:**

> **Host:** What's the takeaway?
>
> **Expert:** NWA Growth Signal makes the municipal record usable by agents without taking accountability away from people.

### Required captures (v7)

1. Agent host with the exact four-call task visible before any call.
2. Page receipt showing succeeded search, list_status_changes, inspect, and stage calls from one continuous run.
3. `list_status_changes` result with `RZ26-00419` (Tabled to Recommended) and `RZ26-00511` (Scheduled to Recommended), then the Locust Street status-history line.
4. `RZ26-00511` inspection with `VAR26-0397 · Withdrawn` beside `RZ26-00511 · Recommended` and official sources.
5. Exact three-filing brief with the review-required status and current freshness summary.
6. Proof card with 2/2 parity, 4/4 tools, 10/4 controls versus tools, and 94 tests.

## Recording setup

- Record the public HTTPS deployment in ChatGPT's in-app browser or another supported WebMCP browser.
- Use a clean 16:9 window at 1920x1080 or 1440x900 with browser zoom at 100%.
- Close unrelated tabs and notifications; expose no credentials, personal data, or local file paths.
- Keep the pointer deliberate and the interface large enough to read at 1080p.
- Use the approved final narration. Do not replace a failed tool call with edited footage that implies success.
- Start with the exact task visible in the agent host. Keep the host prompt, all three live page receipt rows, and the resulting brief in one continuous segment; do not use a prefilled or reconstructed receipt.
- Show the page freshness summary. If it is `reverification_due`, stop the release and re-check the official municipal records rather than recording around it.

## Final dialogue and shot list

### 0:00-0:12 - The problem

**Picture:** Hero, then the five-record Signal Desk.

**Dialogue:**

> **Host:** Why is local planning research still so hard?
>
> **Expert:** Because the public record is fragmented across agendas, legal notices, and permit portals.
>
> **Host:** And what does NWA Growth Signal change?
>
> **Expert:** It brings that record into one evidence desk, shared by people and browser agents.

### 0:12-0:27 - The WebMCP contract

**Picture:** The demo prompt and the three visible tool names.

**Dialogue:**

> **Host:** What can a browser agent actually do here?
>
> **Expert:** Three native WebMCP tools let it search the verified record, inspect one filing with its evidence, and stage a source-backed brief for human review.
>
> **Host:** Is that separate from what a person sees?
>
> **Expert:** No. The person and the agent use the same bounded data on the same visible page.

### 0:27-0:48 - Search

**Action:** Ask the agent:

> Find residential Bentonville and Rogers cases still awaiting procedural action. Inspect their official evidence and stage a three-item brief without representing any recommendation as final approval.

**Picture:** Keep the host prompt visible, then show `search_planning_cases` returning the bounded records and its page receipt row changing to `Succeeded`. Begin the continuous, uncut tool segment here.

**Dialogue:**

> **Host:** Show me the search.
>
> **Expert:** I asked for residential records still waiting on another procedural action. The live tool returned five editorially verified records across Bentonville and Rogers.
>
> **Host:** What comes back with each result?
>
> **Expert:** Its filing identifiers, exact status, next step, and official municipal sources.

### 0:48-1:08 - Inspect the difficult case

**Action:** Show `inspect_case_record` for `RZ26-00511`.

**Picture:** Hold on the filing-level result, official source URLs, and the second succeeded receipt row without cutting away from the run.

**Dialogue:**

> **Host:** Which record is easiest to misread?
>
> **Expert:** Case RZ26-00511. One parcel has two separate filings: variance 26-0397 is withdrawn, while rezoning RZ26-00511 is scheduled.
>
> **Host:** Does the tool collapse them into one story?
>
> **Expert:** No. It keeps them distinct, does not infer a relationship, and does not turn either filing into an approval.

### 1:08-1:32 - Shared agent-human surface

**Action:** Let `stage_source_backed_brief` stage three records.

**Picture:** The third receipt row succeeds and the brief workspace updates in the same continuous run. Scroll through one staged filing and its official sources.

**Dialogue:**

> **Host:** What happens when you stage the brief?
>
> **Expert:** Three source-backed records move into the same page the person is already using.
>
> **Host:** Is anything published automatically?
>
> **Expert:** No. The live result says three records staged and human review required.

### 1:32-1:48 - Boundary

**Picture:** Hold on the review-required state and procedural note.

**Dialogue:**

> **Host:** What does the agent do outside this page?
>
> **Expert:** Nothing. It does not send, save externally, or publish.
>
> **Host:** And what boundary does the workspace preserve?
>
> **Expert:** Recommendation is not adoption, and a planning action is not a construction permit.

### 1:48-2:15 - Proof

**Picture:** Show the benchmark output or a prepared terminal capture with the command visible.

**Dialogue:**

> **Host:** How do you know those guardrails hold?
>
> **Expert:** The release benchmark compares the direct core and all three tool handlers across two fixed tasks.
>
> **Host:** What did it verify?
>
> **Expert:** Both tasks reach exactly the same filing, status, source, audience, freshness, and review outcomes. The current candidate passes 74 tests. For the primary script, the report records eight human control activations or three agent tool calls—not observed user time savings.

### 2:15-2:32 - Close

**Picture:** Show the sourced CivicPlus, Regrid, and PermitFlow comparison, then return to the product title and WebMCP-ready state.

**Dialogue:**

> **Host:** What's the takeaway?
>
> **Expert:** NWA Growth Signal makes the municipal record usable by agents without taking accountability away from people.

## Required captures

1. Agent host with the exact task visible before any call.
2. Page receipt showing succeeded search, inspect, and stage calls from one continuous run.
3. `RZ26-00511` inspection with filing-level status and official sources.
4. Exact three-filing brief with the review-required status and current freshness summary.
5. Fresh benchmark output showing two parity scenarios, 74 tests, raw eight-versus-three traces, and `release_ready: true`.
6. Sourced CivicPlus, Regrid, and PermitFlow comparison, with no negative capability claim.

## Pre-publish checklist

- [x] Production matches the candidate Git commit.
- [x] The Issue 01 link opens the three-page hackathon sample.
- [x] All three tool calls succeed in one browser session.
- [x] The exact host task and live handler-originated receipt were captured from that session.
- [x] Freshness is current for the release date; the scheduled September 2 re-verification was completed on September 2, 2026 (next boundary September 8). The video shows the August 25 statuses.
- [x] Status labels remain legible at 720p.
- [x] Narration says recommendation is not adoption.
- [x] No claim of customer adoption, time savings, deployment freshness, or submission status lacks evidence.
- [x] Participant approved the revised narration and video.
- [x] The revised video is public, has audio, and stays below the official duration limit.
- [ ] The 30-cue SRT caption file is available in the public YouTube player.
- [x] The revised candidate capture and the Devpost/video replacement received action-time publication confirmation.
