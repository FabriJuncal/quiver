# Quiver v0.19 Evidence Report

**Spec:** quiver-v19-project-visibility
**Date:** 2026-04-23
**Status:** Draft

## Summary

This spec ships three read-only visibility commands that surface active specs, estimated effort, and consistency between SPEC.md, STATUS.md, and slice.json. The measurable outcome is that maintainers no longer need to run a bespoke sequence of `git worktree list`, `ls specs`, and `cat STATUS.md` to recover state at the start of a session.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Draft | `quiver:status` prints a one-screen dashboard; the PR section degrades cleanly if `gh` is missing; `--json` returns structured data |
| slice-02 | Draft | `quiver:estimate` prints total hours, critical path, and wall-clock with `--agents <n>`; numbers match the sum of slice estimates |
| slice-03 | Draft | `quiver:lint-spec` exits 0 on a clean spec and exits 1 with a list of discrepancies on a desynchronized spec |

## Required Final Evidence

- `npx create-quiver status` works with and without `gh` installed (verified on all three OS)
- `npx create-quiver status --json` is valid JSON
- `npx create-quiver estimate --agents 2` returns a wall-clock strictly less than (or equal to) `--agents 1`
- `npx create-quiver lint-spec` detects a deliberate mismatch between `estimated_hours` in a slice and the STATUS.md total
- `docs/examples/status.md`, `docs/examples/estimate.md`, and `docs/examples/lint-spec.md` exist with real input/output
- `docs/COMMANDS.md` has rows for all three commands
- `README.md` "Project NPM Scripts" lists `quiver:status`, `quiver:estimate`, `quiver:lint-spec`
- CI matrix is green on macOS, Linux, Windows

## Validation Checkpoint (Post-Merge)

- `quiver:status` replaces at least two ad-hoc commands in the maintainer's daily flow
- `quiver:lint-spec` catches at least one real desync in an existing spec
- Decision to scope v20 is based on this evidence
