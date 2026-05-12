# Quiver v0.22 - Deferred Tooling

**Date:** 2026-04-23
**Status:** Draft (deferred — evidence-gated)

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Ship three productivity commands whose demand is speculative and must be confirmed before construction: `quiver:fork-slice` (split a slice in two), `quiver:squash-spec` (archive a completed spec into a single historical commit), and `quiver:share <slice>` (package a slice bundle for handoff to another agent). This spec exists so the work is traceable, not so it is executed immediately.

## Context

These commands appear useful in theory but have not been needed often enough to justify priority over v17–v21. This spec is the parking spot: it declares shape, acceptance, and cross-platform constraints, so when evidence accumulates in BACKLOG.md the promotion to execution is cheap.

## Scope

### Included

- `quiver:fork-slice <slice> --into <newId>` — split an oversized slice into two, regenerating IDs and updating STATUS.md
- `quiver:squash-spec <spec>` — collapse an archived spec into a single commit for repo compression (optional, requires `git` rewrite tooling)
- `quiver:share <slice>` — package a slice's replay bundle into a tar.gz file suitable for email, gist, or other handoff
- Docs, examples, CHANGELOG for each

### Excluded

- Auto-splitting based on size heuristics (manual decision)
- Re-publishing squashed specs to the public registry
- Network uploads to pastebins or cloud storage

## Commands

### `quiver:fork-slice <slice> --into <newId>`

- Copies the slice directory to a sibling with the new ID
- Prompts for the subset of `files[]` and `acceptance` to move to the new slice
- Updates STATUS.md to insert the new slice row

### `quiver:squash-spec <spec>`

- Requires the spec to be already under `specs/_archive/<spec>/` (v21 prerequisite)
- Optionally rewrites git history to collapse merge commits for that spec into a single commit (opt-in via `--rewrite-history`)
- Default mode: adds a `specs/_archive/<spec>/HISTORY_COLLAPSED.md` note only, without touching git

### `quiver:share <slice>`

- Wraps `quiver:replay <slice> --out <tmp>` with tar.gz packaging
- Writes `<slice-id>.tar.gz` to current directory
- Optionally strips secrets (`--strip-env`) before packaging

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | `quiver:fork-slice` Command | Draft | [slice-01](./slices/slice-01-fork-slice-command/slice.json) |
| 02 | `quiver:squash-spec` Command | Draft | [slice-02](./slices/slice-02-squash-spec-command/slice.json) |
| 03 | `quiver:share` Command | Draft | [slice-03](./slices/slice-03-share-command/slice.json) |

## Definition of Done

- Each command has tests, docs/examples entry, and a COMMANDS.md row
- Each command runs on macOS, Linux, Windows
- Each command is clearly marked `experimental` in SUPPORT_MATRIX.md until 4 weeks of post-merge usage

## Validation Checkpoint

This spec is gated on BACKLOG.md evidence. None of the three commands should be implemented before the maintainer records at least one real need for each. When a slice is promoted, update STATUS.md to `Ready` and proceed. Commands that never graduate are acceptable; the spec can be closed as `parked` after a year without adoption.
