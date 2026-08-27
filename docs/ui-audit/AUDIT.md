# NWA Growth Signal — UI/UX Audit

**Audit date:** 2026-08-26

**Branch:** `ui-audit/2026-08-26`

**Scope:** Presentation and copy only. Brand, business logic, APIs, data contracts, persistence, payments, CI/CD, and environment configuration are excluded.

## Phase 0 — Recon

### Stack

NWA Growth Signal is a dependency-free static web application: semantic HTML, one custom-property-based CSS file, native DOM JavaScript, static JSON, and the browser's WebMCP API. It has no application framework, router, Tailwind, CSS-in-JS layer, component library, package manager, or build step. `site/styles.css` contains the visual tokens and responsive rules; Archivo Black is bundled for the display treatment and the body uses the established condensed system stack. The global `design-review` and `kole-jain-ui-design` skills were loaded and used as the release rubric. Their generic defaults were subordinated to the product's established identity and the explicit instruction not to change brand colors, fonts, or logos.

### Run and visual coverage

The README launch path works:

```sh
python3 -m http.server 4173 --directory site
```

The first sandboxed launch was denied permission to bind a local port; the same command succeeded with local execution permission. Because the app launched and all surfaces were visually exercised, no persistent blocker was recorded.

Before captures:

- [`home-375.png`](before/home-375.png)
- [`home-768.png`](before/home-768.png)
- [`home-1440.png`](before/home-1440.png)
- [`state-stale-review-375.png`](before/state-stale-review-375.png)
- [`state-scheduled-poplar-1440.png`](before/state-scheduled-poplar-1440.png)
- [`issue-01-page-1.png`](before/issue-01-page-1.png)
- [`issue-01-page-2.png`](before/issue-01-page-2.png)
- [`issue-01-page-3.png`](before/issue-01-page-3.png)
- [`issue-01-page-4.png`](before/issue-01-page-4.png)

### Audit universe

1. `/` — hero, WebMCP readiness, and reusable demo prompt
2. `/#desk` — record filters and index
3. `/#desk` — record detail and official evidence
4. `/#desk` — selection, brief staging, and human-review state
5. `/#method` — evidence method, nonclaims, and footer
6. `assets/NWA-Growth-Signal-Hackathon-Sample.pdf` — linked three-page hackathon sample; the four-page commercial sample is preserved separately

## Phase 1 — Audit

### Release verdict

The identity passes the distinctiveness check: it reads as a forensic municipal desk, uses sharp geometry and an earned dossier/grid treatment, and avoids generic rounded-card UI, decorative gradients, excessive shadows, and AI-product filler. Hierarchy is strong, layouts do not overflow at 375, 768, or 1440 pixels, status is not communicated by color alone, and the page already includes a skip link, labels, live regions, reduced-motion support, and visible focus treatment.

The audit-time release gate was **rejected pending P1 remediation**. Phase 3 fixed every presentation-layer finding that could be completed within the approved bounds. The UI release now passes its scoped gate; the complete audit remains conditional on the two protected findings A-07 and A-09, which require a tagged-PDF source workflow and a filing-level product/business-logic decision respectively. Brand-level observations were deliberately not converted into fixes.

### Findings

Locations A-01 through A-18 are audit-time references against pre-fix baseline commit `e8f0ad7`; final-status hashes identify the implementation batch. A-19 was found during the post-implementation agent-parity review. This keeps the evidence stable as later batches move current line numbers.

| ID | Surface | Location (file:line) | Severity | Evidence | Recommended fix | Effort | Final status |
|---|---|---|---|---|---|---|---|
| A-01 | Desk — mobile selection flow | `site/styles.css:268-296`; `site/app.js:57-85,156-185` | **P1** | At 375px, index, detail, and workspace become a long sequential stack; selecting multiple records requires repeated traversal. Record rows expose active state but not selected state. See `before/home-375.png`. | Reuse the current selection state to add a selected marker to index rows, a persistent selected-count tray, and a mobile-sticky Add/Remove action. | M | **Fixed** (`29697e3`) |
| A-02 | Global — touch targets | `site/styles.css:61-65,157-183,222-234,282-296` | **P1** | At 375px, key targets measured below the required 44px: header links 22–25px high, Copy/Reset 22px, selects 38px, source links 16–40px, and remove control about 20×19px. | Add a shared 44px minimum interactive target treatment; make source anchors fill their padded list rows while preserving the existing visual design. | S | **Fixed** (`8e0c4ff`; staged-source follow-up `8549ada`) |
| A-03 | Workspace — review integrity | `site/app.js:156-214,265-276` | **P1** | After staging, changing audience and clearing the selection leaves the old brief visible and “Mark human-reviewed” enabled. See `before/state-stale-review-375.png`. | Invalidate the staged review whenever its source inputs change, label the preview stale or clear it, and disable review until the current selection is staged again. | M | **Fixed** (`29697e3`) |
| A-04 | Desk — keyboard focus | `site/app.js:57-74` | **P1** | Selecting a record rerenders the full index; observed focus changed from the activated `BUTTON` to `BODY`. The entire list is also a live region, creating excessive announcement risk. | Preserve/restore focus to the active row and move announcements to a dedicated status region instead of the whole list. | S | **Fixed** (`8e0c4ff`) |
| A-05 | Hero — focus visibility | `site/styles.css:111-113,133-167` | **P1** | The brand-blue focus outline against the dark brief surface computes to about 2.47:1, below the 3:1 non-text contrast requirement. | Use an existing high-contrast neutral token for focus rings on dark surfaces; do not change the brand palette. | S | **Fixed** (`8e0c4ff`) |
| A-06 | Workspace — staged provenance | `site/app.js:95-126,187-200` | **P1** | Detail view includes official source links, but the staged human-review preview drops them along with case ID, city, and verified date. | Render the already-loaded case ID, city, verified date, and official links in each staged item. Do not alter the underlying brief contract. | S | **Fixed** (`29697e3`) |
| A-07 | Issue 01 PDF — accessibility | `site/assets/NWA-Growth-Signal-Hackathon-Sample.pdf:document metadata` | **P1** | `pdfinfo` reports `Tagged: no`; reliable heading, list, and reading order cannot be assumed. The PDF is a primary navigation and hero CTA. | Re-export a tagged PDF with headings, reading order, lists, link annotations, and alt text; verify with a screen reader. | L | **Needs-human** — no tagged source/export workflow exists in the repository. |
| A-08 | Issue 01 PDF — offer path | `site/assets/NWA-Growth-Signal-Public-Sample.pdf:page 4`; `site/index.html:22,34` | **P1** | The commercial sample advertises a `$149 / 3 issues` founding pilot and an unfulfilled reservation CTA. The approved hackathon resolution is a separate three-page edition with no offer page. | Link the hackathon surface only to the three-page edition and preserve the four-page commercial sample for a future working reservation path. | S | **Fixed** (`ae1ae27`) |
| A-09 | Desk — procedural specificity | `site/core.js:23-27`; `site/app.js:48-55,95-112` | **P1** | With the Scheduled filter active, the Poplar record still presents both Scheduled and Withdrawn filings without identifying which filing matched. See `before/state-scheduled-poplar-1440.png`. | Define the product rule for filing-level filtering; then present the matched filing first and label other filings as history. | M | **Needs-human** — requires a product decision and protected business-logic change. |
| A-10 | Desk — loading and failure | `site/index.html:64-121`; `site/app.js:246-262` | **P2** | Loading starts with dependent controls active and no `aria-busy`. On fetch failure, the count can remain “Loading,” controls remain usable, and no retry is offered. | Add desk-level busy/error status, disable dependent controls until data is ready, and provide one native Retry button. | M | **Fixed** (`a278283`; stalled-request hardening `8549ada`) |
| A-11 | Global — new-context cues | `site/index.html:22,34`; `site/app.js:114-124` | **P2** | “Read Issue 01 ↗” opens in the same tab and loses in-memory desk state, while official sources open new tabs without an accessible new-context cue. | Open the PDF in a new tab with `noopener`; add concise visible or screen-reader “opens in new tab” copy consistently. | S | **Fixed** (`a278283`) |
| A-12 | Hero — clipboard feedback | `site/app.js:277-283` | **P2** | Copy success permanently replaces the action label; failure asks the user to copy manually without selecting or focusing the prompt. | Keep a stable action label, announce transient outcome through the existing status pattern, and focus/select the prompt on failure. | S | **Fixed** (`a278283`; overlap guard `8549ada`) |
| A-13 | Workspace — hidden selection state | `site/app.js:48-55,156-185` | **P2** | Selected records remain selected when filters change but can disappear from the visible index without disclosure. | Show “N selected outside current filters” beside the selected count and retain the existing explicit remove controls. | S | **Fixed** (`a278283`) |
| A-14 | Desk detail — accessible name | `site/index.html:92-98`; `site/app.js:88-153` | **P2** | The detail article references `record-title`, but that ID is absent during loading, error, and no-results states. | Give the region a stable accessible label independent of the dynamically rendered title. | S | **Fixed** (`8e0c4ff`) |
| A-15 | Global — functional microcopy | `site/styles.css:79-90,127-136,182,206,215-225` | **P2** | Several functional labels render at 10–11px. Muted text on paper computes to about 4.48:1, just under AA for normal text. | Raise functional microcopy to at least 12px and use the existing ink token for the smallest text on paper. | S | **Fixed** (`8e0c4ff`) |
| A-16 | Hero — product comprehension | `site/index.html:27-52`; `site/assets/issue-preview.png` | **P2** | The polished existing issue preview is unused, so the hero communicates agent workflow more strongly than the editorial product it produces. | Place the existing preview beside the Issue 01 CTA with meaningful alt text; do not create a new asset or dependency. | S | **Fixed** (`c548f62`) |
| A-17 | Workspace — action clarity | `site/index.html:104-121`; `site/app.js:156-214` | **P2** | “Stage source-backed brief” remains actionable with no selection; “Mark human-reviewed” is system-centric and the staged snapshot lacks a clear current-audience header. | Disable staging until records are selected; tighten labels to “Stage selected records” and “Mark as reviewed”; display the snapshot audience. | S | **Fixed** (`29697e3`) |
| A-18 | Desk intro — freshness claim | `site/index.html:58-61`; `README.md:33-35` | **P3** | “Live working surface” can imply live municipal data, while the adjacent evidence boundary describes a dated verified snapshot. | Rename it “Verified working surface” or “Interactive record workspace.” | S | **Fixed** (`c548f62`) |
| A-19 | Agent recovery — record-load failure | `site/app.js:331-353`; `site/webmcp.js:1-138` | **P2** | When `cases.json` fails, the UI exposes Retry but the three WebMCP tools never register, leaving an agent without an equivalent recovery action. | Add a bootstrap retry primitive only after explicitly approving a public WebMCP tool-contract change. | M | **Needs-human** — the required fix changes a protected API/tool contract. |

### Findings not converted into implementation work

- **No dark mode:** dark mode is not an existing product mode, so parity is not applicable.
- **Colors, fonts, logo, and drafting-grid identity:** visually coherent and explicitly brand-protected.
- **WebMCP-first emphasis:** intentional for the current hackathon surface; it is not treated as generic technology-led copy.
- **Persisted/shareable workspace state:** potentially useful, but it is a product/business feature outside this presentation-only audit.
- **New browser-testing dependency:** not needed. The existing native stack plus the current browser tooling can cover the requested checks.

### Reference-product calibration

The fix direction borrows patterns, not visual identity: record-to-source traceability from [Granicus Legistar](https://granicus.com/product/agenda-management-legistar/), evidence review from [Hebbia](https://www.hebbia.com/product), explicit publication gating from [Harvey Agents](https://www.harvey.ai/blog/ai-agents-for-legal-work), and map/dossier coupling as a future benchmark from [UrbanFootprint Explorer](https://urbanfootprint.com/platform/explorer/). Map work is not proposed here because the current app has no map and adding one would exceed scope.

## Phase 2 — Ordered batch plan

The four planned UI batches were approved and implemented in the order below. The separately approved hackathon-PDF decision remains its own commit.

### Batch A — Accessibility foundation

- **Findings:** A-02, A-04, A-05, A-14, A-15
- **Files:** `site/index.html`, `site/styles.css`, `site/app.js`, `tests/app.test.js`, `tests/ui.test.js`
- **Intent:** 44px targets, durable detail labeling, surface-appropriate focus contrast, restored row focus, dedicated announcements, and readable functional microcopy.
- **Commit:** `ui-audit: accessibility foundation (fixes A-02, A-04, A-05, A-14, A-15)`

### Batch B — Trustworthy selection and review

- **Findings:** A-01, A-03, A-06, A-17
- **Files:** `site/index.html`, `site/styles.css`, `site/app.js`, `tests/app.test.js`, `tests/ui.test.js`
- **Intent:** selected-row state, mobile selection affordances, invalidation of stale reviews, provenance in the staged preview, and accurate action availability.
- **Commit:** `ui-audit: trustworthy review state (fixes A-01, A-03, A-06, A-17)`

### Batch C — Recovery and navigation consistency

- **Findings:** A-10, A-11, A-12, A-13
- **Files:** `site/index.html`, `site/styles.css`, `site/app.js`, `tests/app.test.js`, `tests/ui.test.js`
- **Intent:** loading/error/retry treatment, consistent new-tab cues, transient clipboard feedback, and disclosure of hidden selections.
- **Commit:** `ui-audit: recovery and navigation consistency (fixes A-10, A-11, A-12, A-13)`

### Batch D — Product comprehension polish

- **Findings:** A-16, A-18
- **Files:** `site/index.html`, `site/styles.css`, `tests/ui.test.js`
- **Intent:** reuse the existing issue preview and remove the ambiguous “Live” freshness claim.
- **Commit:** `ui-audit: product comprehension polish (fixes A-16, A-18)`

### Needs-human / protected findings

- **A-07:** Needs a tagged source PDF or an approved authoring/export workflow; the repository contains only the finished PDF.
- **A-09:** Needs a filing-level product decision and business-logic change, both outside this audit's permitted implementation scope.

### Verification after every approved batch

```sh
node --test tests/*.test.js
```

No build, lint, or typecheck command exists in this dependency-free repository; those gates will be reported as N/A rather than fabricated. The affected surfaces will also be browser-checked at 375, 768, and 1440 pixels, with after captures written to `docs/ui-audit/after/`. Final verification will include keyboard flow, focus visibility, empty/loading/error/selected/staged/reviewed states, overflow, and touch-target measurements.

## Phase 3 — Implementation

| Batch | Commit | RED proof | GREEN and regression proof |
|---|---|---|---|
| Accessibility foundation | `8e0c4ff` | New accessibility-contract test failed on the missing status region. | `node --test tests/*.test.js` → 23 passed, 0 failed. |
| Trustworthy selection and review | `29697e3` | New review-integrity test failed on the missing selection count. | `node --test tests/*.test.js` → 24 passed, 0 failed. |
| Recovery and navigation consistency | `a278283` | New recovery-state test failed on the missing busy state. | `node --test tests/*.test.js` → 25 passed, 0 failed. |
| Product comprehension polish | `c548f62` | New product-comprehension test failed on the unused issue preview. | `node --test tests/*.test.js` → 26 passed, 0 failed. |
| Final verification hardening | `8549ada` | Selector-specific target check failed on staged links; timeout-signal and clipboard-overlap checks failed before their guards were added. | `node --test tests/*.test.js` → 31 passed, 0 failed. |

No dependency, framework, API contract, dataset, WebMCP schema, persistence, payment, authentication, CI/CD, environment, brand color, brand font, or logo was changed.

## Phase 4 — Verification

### Gates

- ✅ **Tests:** `node --test tests/*.test.js` → 31 passed, 0 failed.
- ✅ **Browser behavior:** exercised at 375, 768, and 1440 pixels; final 375px DevTools measurement reported `innerWidth = clientWidth = scrollWidth = 375`, no browser-console errors, and staged source links measured 44px high.
- ✅ **Workflow:** row focus restored to `signal-4`; mobile selection tray visible with `1 selected`; stage action enabled only with a selection; staged audience, case ID, city, verified date, and three official sources visible; changing audience disabled review and replaced the stale preview; a Rogers selection filtered out by Bentonville remained disclosed.
- ➖ **Build:** N/A — the static site has no build step.
- ➖ **Lint:** N/A — no lint command exists.
- ➖ **Typecheck:** N/A — the repository contains no typed source or typecheck command.

### Highest-impact before/after evidence

1. Product comprehension: [`before/home-1440.png`](before/home-1440.png) → [`after/home-1440.png`](after/home-1440.png)
2. Mobile selection and target sizing: [`before/home-375.png`](before/home-375.png) → [`after/home-375.png`](after/home-375.png)
3. Review-state integrity: [`before/state-stale-review-375.png`](before/state-stale-review-375.png) → [`after/state-stale-review-375.png`](after/state-stale-review-375.png)
4. Selection/filter disclosure: [`before/desktop-coverage.png`](before/desktop-coverage.png) → [`after/desktop-coverage.png`](after/desktop-coverage.png)
5. Hackathon offer path: [`before/issue-01-page-4.png`](before/issue-01-page-4.png) → the separate edition ends at [`after/hackathon-issue-01-page-3.png`](after/hackathon-issue-01-page-3.png)

Additional after captures: [`home-768.png`](after/home-768.png), [`home-1440-viewport.png`](after/home-1440-viewport.png), [`state-selected-375.png`](after/state-selected-375.png), [`state-staged-375-final.png`](after/state-staged-375-final.png), and [`state-scheduled-poplar-1440.png`](after/state-scheduled-poplar-1440.png).

### Three-line summary

Improved: mobile selection, keyboard focus, touch targets, review integrity, provenance, failure recovery, navigation cues, and product comprehension.

Deferred: none within the approved presentation/copy scope.

Needs eyes: A-07 PDF tagging, A-09 filing-level presentation, and A-19 agent-side retry remain protected source-workflow, product/business-logic, or public tool-contract decisions.
