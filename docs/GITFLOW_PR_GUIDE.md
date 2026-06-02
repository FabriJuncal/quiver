# Git and PR Guide

**Version:** 2.1
**Last updated:** 2026-06-02

## Purpose

This guide explains how to open, review, and merge slice PRs without breaking the canonical workflow.

## Core Rule

- One slice = one commit.
- One slice = one PR by default.
- One spec can produce multiple PRs. Grouped PRs are exceptions and must meet the grouped PR policy below.
- One active PR should be worked from one dedicated worktree/branch.
- Slice numbers reset per spec. `slice-01` is the first slice in each spec.
- Do not commit directly to `develop` or any protected base branch.
- Open and merge the documentation PR that establishes `slice-00` before runtime slices start execution.
- Do not open runtime slice PRs before the documentation foundation is merged.

## PR Sizing Policy

### Individual PR Required

Open an individual PR for any slice that includes:

- Functional code.
- UI/UX changes.
- Supabase, Edge Functions, auth, or storage changes.
- Preview or deployment behavior.
- Performance or code-splitting changes.
- Refactors.
- Tests or CI changes that affect gates.

### Grouped PR Exception

A grouped PR is allowed only when all conditions are true:

- It contains at most 2-3 slices.
- Every included slice is docs-only, research-only, or low-risk mechanical cleanup.
- It does not change behavior.
- It does not mix docs with UI, backend, refactor, or performance work.
- Each slice keeps separate evidence.
- The whole PR can be reverted without leaving partial state.

If any condition fails, split the work into individual slice PRs.

## Merge Policy

- Human merge is the default.
- AI agents may create PRs, fix CI, monitor checks, and mark PRs as ready.
- Assisted auto-merge is allowed only when explicitly authorized by a human for that PR or for a documented category.

## Assisted Auto-Merge Policy

Assisted auto-merge is allowed only when all conditions are true:

- The PR is docs-only or chore-only.
- Risk is low.
- There are no runtime changes.
- There are no production configuration changes.
- Checks are green.
- There are no pending comments.

Assisted auto-merge is prohibited for:

- UI.
- Supabase.
- Edge Functions.
- Auth.
- Storage.
- Preview.
- Performance.
- Refactors.
- Changes with doubtful rollback.

## AI PR Preflight

Before asking an AI agent to prepare PR work, validate the local setup:

```bash
npm run quiver:ai:pr -- --dry-run --ssh-host-alias github-work --identity-file ~/.ssh/github-work
```

Use the SSH host alias from your Git remote separately from the key path. Quiver validates `gh`, `gh auth status`, the remote, branch/worktree state, this guide, and the identity file. It does not install `gh`, edit SSH config, or create a PR in dry-run mode.

## Review Guidance

- Start with `git diff` and the slice scope before opening full files.
- Use the diff to confirm what changed, then open full files only for gaps, regressions, or unclear context.
- For debugging reviews, inspect the first relevant error, stacktrace, or failing command before reading large logs.
- Keep review notes anchored to the changed lines and the slice acceptance criteria.

## Required PR Headings

All slice PR notes must use:

- `## Title`
- `## Summary`
- `## PR Policy`
- `## Scope`
- `## Files`
- `## How to Test (DETAILED - REQUIRED)`
- `## Evidence`
- `## Rollback`
- `## Risks / Notes`

Inside `How to Test`, use:

- `### Required Environment`
- `### Worktree Access`
- `### Run the Project`
- `### Use Cases`
- `### Technical Verification`

## Branch Strategy

| Type | Prefix | Source | Target |
|------|--------|--------|--------|
| feature | `feature/` | `develop` | `develop` |
| bugfix | `bugfix/` | `develop` | `develop` |
| hotfix | `hotfix/` | `main` | `main` |

## Anti-Patterns

- Pushing directly to `develop`
- Reusing the same branch for unrelated PRs
- Grouping behavior-changing slices
- Mixing docs-only slices with UI, backend, refactor, or performance work
- Auto-merging without explicit human authorization
- Auto-merging prohibited categories
- Writing PR bodies outside `pr.md`
