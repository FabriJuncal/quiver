## Title

Quiver v56 analyze-project usable doc merge

## Summary

Implements a deterministic document merge contract so `ai analyze-project` replaces scaffold placeholders, preserves real human content, consolidates managed blocks, and validates that final docs are usable.

## PR Policy

Individual PRs by slice. Runtime behavior changes must not be grouped with unrelated docs-only work.

## Scope

See the active slice `pr.md`.

## Files

See the active slice `slice.json`.

## How to Test (DETAILED - REQUIRED)

### Required Environment

Node.js/npm and local checkout.

### Worktree Access

Use the branch created for the active slice.

### Run the Project

No dev server is required.

### Use Cases

See active slice.

### Technical Verification

```bash
node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict
git diff --check
```

## Evidence

See active slice closure.

## Rollback

Revert the slice PR.

## Risks / Notes

This spec changes doc merge behavior for `ai analyze-project`; preserve snapshots and allowlist protections.
