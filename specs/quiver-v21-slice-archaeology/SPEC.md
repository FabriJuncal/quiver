# Quiver v0.21 - Slice Archaeology

**Date:** 2026-04-23
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Ship two commands that help maintainers navigate historical work once enough specs exist: `quiver:archive <spec>` moves completed specs to `specs/_archive/` and writes a one-page SUMMARY.md; `quiver:blame-slice <file>` tells you which slice(s) touched a given file and through which PRs.

`quiver:bisect-slice` was considered but dropped in favor of documenting `git bisect run` in `docs/TROUBLESHOOTING.md`.

## Context

Once a repo accumulates more than ~10 completed specs, the `specs/` directory becomes noisy for orchestration commands, and investigating "which slice introduced X" requires manual correlation between `git log` and `slice.json.files`. This spec formalizes both concerns.

## Scope

### Included

- `quiver:archive <spec>` — move completed spec to `specs/_archive/<spec>/` and generate SUMMARY.md; update ROADMAP.md
- `quiver:blame-slice <file>` — identify slices that touched a file and their PRs
- `docs/TROUBLESHOOTING.md` section on using `git bisect run` to find the slice that introduced a regression
- Docs, examples, CHANGELOG

### Excluded

- Wrapper around `git bisect run` (documented instead)
- Automatic promotion of specs to archived (requires explicit command)
- Undo for `quiver:archive` (user can `git revert` the commit)

## Commands

### `quiver:archive <spec>`

- Verifies the spec is fully completed (all slices `status: "completed"`)
- Moves `specs/<spec>/` to `specs/_archive/<spec>/`
- Generates `specs/_archive/<spec>/SUMMARY.md` with: objective, slice count, PRs merged, completion date
- Updates `ROADMAP.md` to append `(archived YYYY-MM-DD)` next to the spec entry
- Requires `--yes` to bypass confirmation (destructive action; asks for confirmation on TTY by default)

### `quiver:blame-slice <file>`

- Finds every `slice.json` whose `files[]` contains the given path
- Cross-references with `git log --follow` to identify the merge commit for each slice
- Prints: slice id, ticket, PR number (if detectable from commit message), merge date

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | `quiver:archive` Command | Draft | [slice-01](./slices/slice-01-archive-command/slice.json) |
| 02 | `quiver:blame-slice` Command | Draft | [slice-02](./slices/slice-02-blame-slice-command/slice.json) |

## Definition of Done

- `npx create-quiver archive <spec>` refuses to archive an incomplete spec
- `npx create-quiver archive <spec> --yes` moves the spec, writes SUMMARY.md, updates ROADMAP.md
- `npx create-quiver blame-slice <file>` returns the slices that mentioned the path and their PRs
- `docs/TROUBLESHOOTING.md` contains a section explaining `git bisect run` for slice regression
- Each command has `docs/examples/<command>.md`
- `docs/COMMANDS.md` has rows for both
- CI matrix green on all three OS

## Validation Checkpoint

Only start this spec after there are at least 10 completed specs in the repo. Before v22 is scoped, at least one of the two commands must answer a real question that previously required manual grep + git log.
