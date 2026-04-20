# Quiver v0.2 Evidence Report

**Spec:** quiver-v02-bootstrap-hardening
**Last updated:** 2026-04-20
**Status:** In progress

## Summary

| Slice | Acceptance criteria | Status | Evidence |
|-------|---------------------|--------|----------|
| slice-01 | 4 | Completed | Canonical path handling, local-base fallback, and worktree creation verified in smoke tests |
| slice-02 | 3 | Completed | Default generated baseline files copied by `init-docs.sh` and preserved when pre-existing |
| slice-03 | 3 | Completed | Generated docs and slice templates no longer retain project-scoped placeholders |
| slice-04 | 3 | Completed | Draft gate and alias readability verified in smoke tests |

## Evidence by Slice

- `bash -n scripts/start-slice.sh`
- `bash -n scripts/init-docs.sh`
- Smoke test in a clone at `/tmp/quiver-fresh` with `SLICE_WORKTREES_DIR=/tmp/quiver-fresh-worktrees`
- Verified creation path from a local `develop` base without needing `origin` network access
- Verified canonical path handling and existing-worktree detection with paths that resolve through `/private/tmp`
- Fresh init smoke test created `LICENSE`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/*`, and `.github/workflows/ci.yml`
- Existing-file smoke test preserved pre-existing baseline files and reported skips instead of overwriting
- Fresh init smoke test found no unresolved `[project]`, `[project-name]`, or `[project-slug]` tokens in generated `docs/` or `specs/placeholder-project/`
- `start-slice.sh` now rejects `draft` slices unless `--allow-draft` or `ALLOW_DRAFT_SLICE=1` is provided
- Alias output now uses the ticket prefix, producing stable labels such as `QUI-04` and `DEM-001`
