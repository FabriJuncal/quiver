# Quiver v0.19 - Project Visibility

**Date:** 2026-04-23
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Ship three commands that answer "what is the current state of this repo?": `quiver:status` (single-screen dashboard), `quiver:estimate` (hours and wall-clock with N agents), and `quiver:lint-spec` (consistency check between SPEC.md, STATUS.md, and slice.json). Together they replace the ad-hoc `git`, `ls`, and `grep` sequences that maintainers run to recover context at the start of a session.

## Context

v18 gave us ordering and parallelism. v19 uses the same library to surface what is running, what is stuck, and whether the spec documents match reality. None of these commands mutate state; they exist to close the loop between planning (SPEC.md) and execution (slice.json), so discrepancies don't silently grow.

## Scope

### Included

- `quiver:status` — active specs, in-progress slices, open PRs (when `gh` available), next-up suggestion
- `quiver:estimate` — total hours, critical path, wall-clock with `--agents <n>`, per-spec breakdown
- `quiver:lint-spec` — STATUS.md / SPEC.md / slice.json consistency checks
- Docs (COMMANDS.md rows, examples/, README updates) and CHANGELOG entries for each

### Excluded

- Token cost estimation (deferred to v20)
- Spec archiving (deferred to v21)
- Auto-fixing detected lint issues (lint reports only)

## Commands

### `quiver:status`

One-screen dashboard:

```
Active specs (N)
  <spec-slug>  <done>/<total> slices  <spec-status>  blocked: <n>

In progress (M)
  <ticket>  <spec>/<slice>  worktree: <path>  branch: <name>

Open PRs (K)   # omitted if `gh` not installed
  #<num>  <title>  reviews: <count>

Next up: <spec>/<slice> (<hours>, ready)
```

Flags: `--json`, `--no-pr` (skip `gh` even if installed), `--spec <slug>` (restrict scope).

### `quiver:estimate`

```
Spec: <slug>
  Total estimated:     <N>h
  Critical path:       <N>h  (<slice> → <slice> → ...)
  Parallelizable:      <N>h saved with <k> agents → <wall>h wall-clock
```

Flags: `--agents <n>` (default 1), `--spec <slug>`, `--json`.

### `quiver:lint-spec`

Checks:

1. STATUS.md lists every slice directory that exists under `slices/`
2. STATUS.md does not list nonexistent slice directories
3. SPEC.md "Definition of Done" does not reference removed slices
4. `estimated_hours` per slice sum equals STATUS.md total
5. Titles match across SPEC.md "Slices" table, STATUS.md table, and `slice.json.title`
6. Slice `status` values match between STATUS.md and slice.json

Exit 0 ok, exit 1 errors (lists each discrepancy).

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | `quiver:status` Command | Draft | [slice-01](./slices/slice-01-status-command/slice.json) |
| 02 | `quiver:estimate` Command | Draft | [slice-02](./slices/slice-02-estimate-command/slice.json) |
| 03 | `quiver:lint-spec` Command | Draft | [slice-03](./slices/slice-03-lint-spec-command/slice.json) |

## Definition of Done

- `npx create-quiver status` prints the dashboard and omits the PR section cleanly when `gh` is absent
- `npx create-quiver estimate` prints totals and critical path for the whole repo and for `--spec <slug>`
- `npx create-quiver lint-spec` exits 1 on a deliberately desynchronized STATUS.md and 0 on a clean repo
- Every command has `docs/examples/<command>.md`
- `docs/COMMANDS.md` lists all three commands with OS columns
- CI matrix is green on all three OS

## Validation Checkpoint

Before v20 is started, `quiver:status` must replace at least two manual `git` or `ls` invocations in the maintainer's daily workflow, documented in an informal note. If it does not earn its place, v20 is rescoped.
