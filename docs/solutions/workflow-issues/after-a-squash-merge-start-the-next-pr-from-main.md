---
title: After a squash merge, start the next PR from a fresh branch off main instead of reusing or force-pushing the old branch
date: 2026-09-02
category: workflow-issues
module: git-workflow
problem_type: workflow_issue
component: development_workflow
severity: medium
applies_when:
  - "The repository merges pull requests with squash, so main never contains the branch's original commits"
  - "Follow-up work lands on the same local branch after its PR was squash-merged"
  - "A commit hook or policy blocks force-pushes, so rewriting the pushed branch is not an option"
tags: [git, squash-merge, cherry-pick, force-push, pull-request, unmergeable, worktree]
---

# After a squash merge, start the next PR from a fresh branch off main instead of reusing or force-pushing the old branch

## Context
PR #6 was squash-merged into `main`. The working branch still held the two original commits that PR had squashed. A follow-up docs commit was then pushed to the same branch and opened as PR #7. GitHub reported it as not mergeable: "the merge commit cannot be cleanly created." The branch's history and `main`'s history now disagreed on the same lines, because the squash had rewritten those changes into one commit the branch never saw.

The obvious repair, rebasing the branch onto `origin/main` and force-pushing, was blocked by a local hook (`~/.claude/hooks/require-confirm-destructive.py` refuses force-pushes without explicit confirmation). A second variant of the same mistake happened later on PR #12: an `--amend` of a pushed commit needed a force-push to land, which the hook again blocked, and a `git reset --soft origin/<branch>` to convert the amend into a new commit produced an empty diff because the amended content had already been lost in the reset.

## Guidance
Treat a squash-merged branch as finished. Do not push more commits to it and do not rewrite it.

For follow-up work after a squash merge:

```bash
git fetch origin main
git checkout -b <new-branch> origin/main
git cherry-pick <follow-up-sha>      # or make the change fresh
git push -u origin <new-branch>
gh pr close <old-pr> --comment "Superseded by a clean branch off main after the squash."
gh pr create --base main ...
```

This is how PR #8 replaced PR #7 and merged cleanly with the same content.

For a small correction to a commit that is already pushed on an open PR, add a second commit rather than amending:

```bash
# edit the file
git add <file>
git commit -m "fix: ..."
git push origin <branch>
```

A squash merge folds the two commits together, so the history on `main` looks the same either way, and nothing needs to be rewritten. Do not run `git reset --soft origin/<branch>` after an amend to "undo" it; the amend replaced the commit locally, and a reset to the remote tip discards the amended content from the index. Re-apply the edit instead, then commit.

## Why This Matters
Squash merges are convenient on `main` but they orphan the source branch: its commits are ancestors of nothing on `main`, so any later PR from it carries the old commits as new changes and conflicts on every line the squash touched. Force-pushing fixes the branch but rewrites shared history, which is exactly what the hook is there to stop. Branching off `main` for each PR costs one command and never conflicts. It also keeps the automation honest: the merge and deploy steps in this repository are run by a person, so a PR that is silently unmergeable stalls the release until someone notices.

## When to Apply
- Every time a PR merges with squash and you have more work in the same area: branch again from `origin/main`.
- Whenever you are tempted to `git commit --amend` a commit that is already on a remote branch with an open PR: add a commit instead.
- In a worktree that outlives its PR: leave the old branch alone and create a new worktree or branch for the next change.

## Examples
Unmergeable follow-up, what happened with PR #7:

```
# branch: claude/hackathon-submission-strategy-35e739  (commits A, B, then C)
# main:   squash(A+B) as one commit
gh pr create ...                     # PR #7 from the same branch
gh pr merge 7 --squash               # X Pull request ... is not mergeable
```

Clean replacement, what fixed it as PR #8:

```
git checkout -b docs/production-verification origin/main
git cherry-pick C
git push -u origin docs/production-verification
gh pr close 7 --comment "Superseded by a clean branch off main after the #6 squash."
gh pr create --base main ...         # mergeable
```

## Related
- PR #6 (squash-merged), PR #7 (closed as unmergeable), PR #8 (its clean replacement), PR #12 (second-commit correction instead of amend).
- `docs/solutions/integration-issues/cloudflare-pages-deploy-preview-vs-production.md`, the deploy step that follows each merge in this repository.
