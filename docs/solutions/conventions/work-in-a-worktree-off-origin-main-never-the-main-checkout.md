---
title: Work in a worktree branched from origin/main; treat the main checkout as another session's desk
date: 2026-09-02
category: conventions
module: git-workflow
problem_type: convention
component: development_workflow
severity: high
applies_when:
  - "Several agents or sessions (Claude Code, Codex, a human) work in the same repository at the same time"
  - "The primary checkout is parked on someone else's branch with uncommitted changes"
  - "Automation is asked to read a file from 'the repo' without an explicit path"
tags: [git, worktree, concurrent-sessions, stale-checkout, codex, devpost, automation-inputs]
---

# Work in a worktree branched from origin/main; treat the main checkout as another session's desk

## Context
The repository's primary checkout at `/Users/zaeemkhan/Documents/NWA_Growth` is not on `main`. As of September 2, 2026 it sits on `codex/judge-wow-evidence` at the August 30 commit that merged as PR #4, eight commits behind `origin/main`, with 11 modified tracked files (README, CHANGELOG, evidence docs, `scripts/benchmark.js`, `site/webmcp.js`, two test files, two audit images) and 16 untracked paths. None of that came from the Claude sessions; it is a Codex session's in-progress work. `git worktree list` shows five checkouts of this repository in use at once: the primary, a Codex worktree, a temporary refresh worktree, and two Claude worktrees.

Two things went wrong because of it on the same day:

- A Codex Devpost run was told to use "the approved text in `devpost-submission.md`". It read the primary checkout's copy, which is the August 30 story, correctly refused to overwrite the published page with it, and reported that the "approved file" contradicted the requested checks. A second run later began "constructing the description payload" from that file and had to be steered to edit the live description in place.
- A wrangler deploy from a worktree warned about a dirty tree; the primary checkout's dirty files were the reason a deploy from there was never an option.

## Guidance
- **Never work in the primary checkout.** Create a worktree from the remote main for each task: `git worktree add <path> -b <branch> origin/main`. The Claude Code worktree feature does this automatically; keep using it.
- **Never pull, reset, stash, clean, or check out branches in the primary checkout**, and do not commit its uncommitted files. They belong to another session. Look, do not touch, unless the user says so explicitly.
- **Give automation an explicit, current path, never "the repo's copy".** For the Devpost story that meant copying the merged file to a stable location under the untracked demo folder of the primary checkout (`devpost-story-2026-09-02.md`) and pointing Codex at that path, with an instruction to edit the live description in place and never to build a payload from a local file.
- **Before trusting any file, check where you are.** `git branch --show-current`, `git rev-list --count HEAD..origin/main`, and `git status --short` take two seconds and would have caught both incidents.
- **Deploy from a tree that equals `origin/main`.** In a worktree: `git fetch origin main && git checkout -q origin/main -- site` before running wrangler. Then hash-compare production against `origin/main` (see the Cloudflare Pages doc under Related).

## Why This Matters
With one checkout per person, "the repo" and "the current code" are the same thing. With five checkouts and three kinds of agent, they are not, and the primary path is the most likely to be stale because nobody is responsible for keeping it current. An agent that reads it will act on old data with full confidence, and the failure shows up as a wrong public page or a wrong deploy rather than as an error. Branching every task from `origin/main` removes the question of which checkout is right.

## When to Apply
- At the start of any session in this repository, before reading or writing a file.
- Whenever a prompt to another agent names a file without a full path.
- Whenever a git command is blocked by uncommitted changes you did not make: that is the signal you are in the wrong checkout, not a reason to stash.

## Examples
Two-second orientation check, run before trusting a file:

```bash
git branch --show-current
git rev-list --count HEAD..origin/main   # non-zero means this checkout is behind
git status --short | head               # foreign modifications mean it is someone else's desk
```

Handing an agent a current file instead of "the repo's file":

```text
Source of truth: /Users/zaeemkhan/Documents/NWA_Growth/demo/devpost-story-2026-09-02.md
Edit the live description in place in the owner editor. Never build the payload from a local file.
```

## Related
- `docs/solutions/integration-issues/cloudflare-pages-deploy-preview-vs-production.md`, deploying from a tree that matches `origin/main`.
- `docs/solutions/workflow-issues/after-a-squash-merge-start-the-next-pr-from-main.md`, branching fresh from `origin/main` after each merge.
- The `concurrent-session-git` skill covers the general discipline for repositories shared by several sessions.
