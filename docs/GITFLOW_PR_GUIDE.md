# Git and PR Guide

**Version:** 2.0
**Last updated:** 2026-05-26

## Purpose

This guide explains how to open and review spec PRs without breaking the canonical workflow.

## Core Rule

- One slice = one commit
- One spec = one PR
- One spec should be worked from one dedicated worktree/branch.
- Slice numbers reset per spec. `slice-01` is the first slice in each spec.
- Do not commit directly to `develop`
- Open and merge the documentation PR before the first slice starts execution
- Do not open the spec PR before the documentation PR is merged

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

All spec PR notes must use:

- `## Title`
- `## Summary`
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
- Reusing the same branch for multiple specs
- Writing PR bodies outside `pr.md`
