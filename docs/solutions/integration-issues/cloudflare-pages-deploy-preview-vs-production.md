---
title: Wrangler deploy from a feature branch creates a Pages preview and leaves production stale
date: 2026-09-02
category: integration-issues
module: deployment
problem_type: integration_issue
component: tooling
symptoms:
  - "wrangler pages deploy reports Success and a deployment URL, but the production URL still serves the previous build"
  - "The deployment alias URL carries the feature branch name instead of the production hostname"
  - "Live file hashes differ from origin/main even though the merge is complete"
root_cause: missing_workflow_step
resolution_type: workflow_improvement
severity: high
tags: [cloudflare-pages, wrangler, deploy, production, preview, worktree, verification]
---

# Wrangler deploy from a feature branch creates a Pages preview and leaves production stale

## Problem
The judged Cloudflare Pages site kept serving the August 25 build after a September 2 merge and a "successful" wrangler deploy, because the deploy ran from a worktree on a feature branch and Pages filed it as a branch preview rather than the production deployment.

## Symptoms
- `npx wrangler pages deploy site --project-name nwa-growth-signal-webmcp` printed `Deployment complete!` with a hashed deployment URL (an eight-character Pages deployment ID as the subdomain, not a git commit) and an alias `https://claude-hackathon-submission.nwa-growth-signal-webmcp.pages.dev`.
- `https://nwa-growth-signal-webmcp.pages.dev/` still showed "verified August 25, 2026" and the old `cases.json`.
- A `shasum` comparison of the six site files showed the production host differing from `origin/main` on every file while the preview host matched.

## What Didn't Work
- Trusting the wrangler success message. It is accurate; the upload succeeded, just not to the production branch.
- Looking for a GitHub-side deployment. This Pages project has no Git integration, so there are no GitHub deployments, check runs, or statuses to confirm what production serves.

## Solution
Deploy explicitly to the production branch, from a tree that matches `main`, then verify by hash before claiming anything is live.

```bash
git fetch origin main && git checkout -q origin/main -- site
npx wrangler pages deploy site --project-name nwa-growth-signal-webmcp --branch main --commit-dirty=true
```

Verification, run against the production host, not the deployment URL wrangler prints:

```bash
host=nwa-growth-signal-webmcp.pages.dev
for f in index.html cases.json core.js webmcp.js app.js styles.css; do
  live=$(curl -s -H 'Cache-Control: no-cache' "https://$host/$([ $f = index.html ] && echo '' || echo $f)" | shasum | cut -c1-12)
  main=$(git show origin/main:site/$f | shasum | cut -c1-12)
  [ "$live" = "$main" ] && echo "$f MATCH" || echo "$f DIFF live=$live main=$main"
done
```

All six lines must read `MATCH`. Note that requesting `/index.html` by name returns an empty body on this host, so the root path is used for that file.

## Why This Works
Cloudflare Pages treats the branch name wrangler sends as the deployment's branch. When it equals the project's production branch (`main` here) the upload becomes the production deployment; any other name becomes a preview with a branch alias. Wrangler infers the branch from the current git checkout unless `--branch` is passed, and a worktree on `claude/…` or `docs/…` therefore never touches production. Checking out `origin/main -- site` first guarantees the uploaded files are the merged ones rather than whatever the worktree branch holds.

## Prevention
- Always pass `--branch main` when the intent is production, regardless of which branch the shell is on.
- Treat the wrangler URL as proof of upload only. Production is proven by the hash comparison above against `origin/main`.
- Record the production verification (hashes, freshness state, a browser check) in `docs/hackathon/EVIDENCE.md` before updating any public submission text that says the release is live.
- Keep the release gate in `README.md` under Deployment: "A green branch or pull request is candidate proof, not deployment proof."

## Related Issues
- PR #6, PR #11: the two releases whose deploys were verified with this procedure on 2026-09-02.
- `docs/hackathon/EVIDENCE.md`, section "Production verification, September 2, 2026".
