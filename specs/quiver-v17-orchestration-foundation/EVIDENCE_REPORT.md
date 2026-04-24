# Quiver v0.17 Evidence Report

**Spec:** quiver-v17-orchestration-foundation
**Date:** 2026-04-23
**Status:** Completed

## Summary

This spec installs the cross-platform foundation and shared graph library used by every orchestration command in v18–v22. It does not ship a user-facing command. The primary measurable outcome is that the graph library returns the correct topological order and parallel levels for the existing Quiver repo, and that the CI matrix is green on macOS, Linux, and Windows.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | CI matrix runs macOS + Linux + Windows; a Windows path guard validates `path.win32` handling and the authoring rules docs are generated |
| slice-02 | Draft | `src/create-quiver/lib/slice-graph.js` exports the six documented functions; unit tests cover cycle detection, missing dep, disjoint files, and numeric-order inference; dry-run against the real repo returns every slice |
| slice-03 | Draft | `check-slice` rejects `depends_on: ["nonexistent/slice-99"]`, rejects self-cycles, and requires `parallel_safe_reason` when `parallel_safe: "never"` |

## Required Final Evidence

- `.github/workflows/ci.yml` shows `macos-latest`, `ubuntu-latest`, `windows-latest` in the matrix and all three are green
- `node -e "const g=require('./src/create-quiver/lib/slice-graph'); console.log(g.readAllSlices('.').length)"` returns a non-zero count on all three OS
- Unit tests for `buildGraph`, `topoSort`, `computeLevels`, and `detectFileConflicts` pass on all three OS
- `check-slice` output demonstrates the new `depends_on` validation rules
- `docs/COMMANDS.md` exists with a header table and at least one reserved command row
- `docs/SUPPORT_MATRIX.md` contains the cross-platform authoring rules section

## Validation Checkpoint (Post-Merge)

- A dry-run of `readAllSlices` against the Quiver repo returns every existing slice without throwing
- The maintainer confirms the library is usable before starting v18
- At least one reviewer on a second machine confirms the CI matrix works locally
