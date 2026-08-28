# Demo Recording Package

Published baseline: `demo/output/NWA-Growth-Signal-WebMCP-Demo.mp4`

- Runtime: 2 minutes 31.8 seconds; below the official three-minute limit.
- Format: 1280×720 H.264/AAC with 30 sidecar caption cues.
- Narration: Google Gemini Kore host and Iapetus expert.
- Technical QA: passed.
- Participant listening approval: passed August 28, 2026.
- Publication status: public at https://youtu.be/y3lzrrvDKP8; independently verified August 28, 2026.
- YouTube captions: the 30-cue English (United States) SRT was published in YouTube Studio on August 28, 2026; the public player still reported captions unavailable during the immediate propagation check.

The revised instructions below are a prepared candidate capture guide. The revised capture has not been recorded or published, and the public baseline is not represented as containing the new live receipt, parity, freshness, or comparison proof.

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
> **Expert:** Both tasks reach exactly the same filing, status, source, audience, freshness, and review outcomes. The current candidate passes 68 tests. For the primary script, the report records eight human control activations or three agent tool calls—not observed user time savings.

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
5. Fresh benchmark output showing two parity scenarios, 68 tests, raw eight-versus-three traces, and `release_ready: true`.
6. Sourced CivicPlus, Regrid, and PermitFlow comparison, with no negative capability claim.

## Pre-publish checklist

- [ ] Production matches the candidate Git commit.
- [ ] The Issue 01 link opens the three-page hackathon sample.
- [ ] All three tool calls succeed in one uncut run.
- [ ] The host prompt and live handler-originated receipt are visible in that same run.
- [ ] Freshness is current for the release date; due records were re-verified from official sources.
- [ ] Status labels remain legible at 1080p.
- [ ] Narration says recommendation is not adoption.
- [ ] No claim of customer adoption, time savings, deployment freshness, or submission status lacks evidence.
- [x] Participant approved the final narration and video.
- [x] The final video is public, has audio, and stays below the official duration limit.
- [ ] The 30-cue SRT caption file is available in the public YouTube player.
- [ ] The revised candidate capture and any Devpost/video replacement received separate publication approval.
