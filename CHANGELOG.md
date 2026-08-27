# Changelog

## 2026-08-26

- Added the five-record Bentonville and Rogers planning dataset with official municipal sources.
- Added native WebMCP search, record-inspection, and brief-staging tools.
- Added the responsive Signal Desk, manual filters, human review state, and unsupported-browser fallback.
- Added dependency-free Node tests for the planning logic, tool contract, dataset boundary, and UI safety.
- Kept agent-staged audience state visible to human reviewers and collapsed multiple case IDs that resolve to one planning record.
- Published the source repository and production Cloudflare Pages deployment.
- Bound each case ID to its own procedural status in agent search, inspection, and staged briefs.
- Added handler-side brief validation, all-or-nothing WebMCP registration, and executable fallback-state coverage.
- Fixed the desktop hero headline overflow at 1280px without changing the mobile composition.
- Enforced each WebMCP tool's advertised input schema inside its handler so malformed or extra fields fail visibly.
