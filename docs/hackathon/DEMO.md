# Demo Recording Package

Target length: 1 minute 50 seconds. Hard ceiling: 2 minutes 30 seconds.

## Recording setup

- Record the public HTTPS deployment in ChatGPT's in-app browser or another supported WebMCP browser.
- Use a clean 16:9 window at 1920x1080 or 1440x900 with browser zoom at 100%.
- Close unrelated tabs and notifications; expose no credentials, personal data, or local file paths.
- Keep the pointer deliberate and the interface large enough to read at 1080p.
- Record live narration. Do not replace a failed tool call with edited footage that implies success.

## Script and shot list

### 0:00-0:12 - The problem

**Picture:** Hero, then the five-record Signal Desk.

**Voiceover:**

> Municipal planning information is public, but the procedural truth is fragmented across agendas, notices, and case portals. NWA Growth Signal turns that record into one interface shared by people and browser agents.

### 0:12-0:27 - The WebMCP contract

**Picture:** The demo prompt and the three visible tool names.

**Voiceover:**

> The page exposes three native WebMCP tools: search the verified record, inspect one filing with its evidence, and stage a source-backed brief for human review.

### 0:27-0:48 - Search

**Action:** Ask the agent:

> Find residential Bentonville and Rogers cases still awaiting procedural action. Inspect their official evidence and stage a three-item brief without representing any recommendation as final approval.

**Picture:** Show `search_planning_cases` returning the bounded records.

**Voiceover:**

> Search is constrained to five editorially verified records. Each result retains its city, filing identifiers, procedural status, next step, and official sources.

### 0:48-1:08 - Inspect the difficult case

**Action:** Show `inspect_case_record` for `RZ26-00511`.

**Picture:** Hold on the filing-level result and source URLs.

**Voiceover:**

> This parcel has two filings. The variance is withdrawn; the separate rezoning is scheduled. The tool keeps those statuses distinct and does not infer that the filings are related.

### 1:08-1:32 - Shared agent-human surface

**Action:** Let `stage_source_backed_brief` stage three records.

**Picture:** The brief workspace updates. Scroll through one staged record and its official sources.

**Voiceover:**

> The agent's result appears in the same workspace the person is using. It includes the procedural next step and sources, but it is not published or sent. The interface requires a human review before the brief can be treated as ready.

### 1:32-1:45 - Proof

**Picture:** Show the benchmark output or a prepared terminal capture with the command visible.

**Voiceover:**

> The release benchmark runs all three tool handlers against five records, compares eight filing statuses and five records of affirmative copy with pinned release baselines, and checks the municipal-source domain boundary. The current candidate passes every check with zero approval overclaims.

### 1:45-1:50 - Close

**Picture:** Return to the product title and WebMCP-ready state.

**Voiceover:**

> NWA Growth Signal makes the municipal record usable by agents without taking accountability away from people.

## Required captures

1. Hero with `WebMCP ready - 3 tools exposed`.
2. Search result containing both municipalities.
3. `RZ26-00511` inspection with filing-level status and official sources.
4. Three-record staged brief with the review-required status.
5. Benchmark output showing the measured results.

## Pre-publish checklist

- [ ] Production matches the candidate Git commit.
- [ ] The Issue 01 link opens the three-page hackathon sample.
- [ ] All three tool calls succeed in one uncut run.
- [ ] Status labels remain legible at 1080p.
- [ ] Narration says recommendation is not adoption.
- [ ] No claim of customer adoption, time savings, deployment freshness, or submission status lacks evidence.
- [ ] The final video is public, has audio, and stays below the official duration limit.
