# PR - QUIVER-01 - Canonical Paths + Remote-Safe Bootstrap

## Title

Canonical Paths + Remote-Safe Bootstrap

## Summary

Hardened `start-slice.sh` so it resolves canonical paths, prefers local base branches when `origin` is unavailable, and handles existing worktrees with spaces in their paths.

## Scope

- Normalize repo and slice paths before validating the slice location
- Resolve the bootstrap base ref from local branches before falling back to remote refs
- Ignore stale prunable worktree entries instead of treating them as live worktrees

## Files

- `scripts/start-slice.sh`
- `README.md`
- `README_FOR_AI.md`
- `docs/WORKFLOW.md.template`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node: 20.x or newer
- Git available in `PATH`
- A repo checkout with `develop` available locally

### Worktree Access

```bash
cd /path/to/quiver
SLICE_WORKTREES_DIR=/tmp/quiver-fresh-worktrees bash scripts/start-slice.sh specs/quiver-v02-bootstrap-hardening/slices/slice-01-path-remote-safety/slice.json
```

### Run the Project

```bash
# This slice is bootstrap-only; there is no app runtime to start.
```

### Use Cases

#### Case 1: Canonical path validation

**Prerequisite:** A slice path reached through a canonicalization-sensitive path such as `/tmp` versus `/private/tmp`.

1. Run `start-slice.sh` against the slice path.
2. Confirm the script accepts the slice instead of rejecting it as outside `specs/`.

**Expected result:** The slice is recognized correctly and the bootstrap proceeds.

#### Case 2: Local base branch fallback

**Prerequisite:** A repo with a local `develop` branch and no usable `origin` fetch.

1. Run `start-slice.sh` for the slice.
2. Observe the worktree creation path.

**Expected result:** The worktree is created from the local base branch without requiring remote network access.

### Technical Verification

```bash
# Syntax check
bash -n scripts/start-slice.sh

# Smoke test against a clone with a local base branch
SLICE_WORKTREES_DIR=/tmp/quiver-fresh-worktrees bash scripts/start-slice.sh specs/quiver-v02-bootstrap-hardening/slices/slice-01-path-remote-safety/slice.json

# Diff hygiene
git diff --check
```

## Evidence

- Canonical path handling validated in a smoke run
- Local base branch fallback validated in a smoke run
- Existing worktree detection no longer truncates paths with spaces

## Rollback

1. `git revert 0c4c7fb`
2. Re-run the bootstrap smoke test
3. Confirm `start-slice.sh` returns to the previous behavior

## Risks / Notes

- The script still depends on `git` and `node`
- `origin` can still be used when available, but it is no longer a hard requirement for the bootstrap path
