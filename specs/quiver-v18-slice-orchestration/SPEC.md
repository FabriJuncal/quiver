# Quiver v0.18 - Slice Orchestration

**Date:** 2026-04-23
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Ship the three commands that answer the core multi-agent question "what should I work on now, and what can run in parallel?": `quiver:plan` (sequential order), `quiver:graph` (dependency and parallelism tree), and `quiver:next` (single ready slice). Together they let a maintainer coordinate planning-tier and execution-tier models without guessing.

## Context

With the v17 foundation in place (CI matrix, shared graph library, optional `depends_on` validation), the user-facing commands are thin wrappers around the library. The main deliverables here are the output formats, flag ergonomics, and documentation. `quiver:next` never takes destructive action by default: it prints a suggestion and only optionally runs `start-slice` behind a confirmation prompt.

## Scope

### Included

- `quiver:plan` — topological order of pending slices across all specs, with critical path and total hours
- `quiver:graph` — dependency tree with parallel lots, conflict detection, and multiple output formats
- `quiver:next` — next ready slice (or all ready slices), with optional `--auto-start` behind a TTY confirmation
- Entries in `docs/COMMANDS.md`, examples in `docs/examples/`, `package.json` `quiver:*` scripts, `README.md` and `README_FOR_AI.md` updates for each command
- `CHANGELOG.md` entries

### Excluded

- A status dashboard (deferred to v19)
- Token cost estimation (deferred to v20)
- Archiving completed specs (deferred to v21)
- Automatic locking of parallel slices (commands are advisory)

## Commands

### `quiver:plan`

Topological order across all specs with pending slices. Output modes:

- Default: human-readable table with `[N]  TICKET  spec/slice  title  hours  status`
- `--json`: `{ plan: Slice[], critical_path: SliceId[], total_hours: number }`
- `--only-ready`: filter to slices with no pending dependencies
- `--spec <slug>`: restrict to a single spec

Exit codes: 0 ok, 1 cycle detected, 2 invalid repo state.

### `quiver:graph`

Dependency and parallelism view. Output modes:

- `--format tree` (default): ASCII tree grouped by level, with `⚠` markers on file conflicts (`+--` fallback without Unicode)
- `--format mermaid`: Mermaid `flowchart TD` block pastable into GitHub
- `--format dot`: Graphviz DOT source
- `--show-conflicts`: highlight intersections of `files[]`
- `--level <n>`: focus on one topological level
- `--json`: structured output

### `quiver:next`

Single-slice suggestion. Output modes:

- Default: top-1 ready slice plus the exact `start-slice` command to copy
- `--all-ready`: list every slice at the first unblocked level
- `--auto-start`: prompt for confirmation (requires TTY) and run `start-slice` on accept

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | `quiver:plan` Command | Completed | [slice-01](./slices/slice-01-plan-command/slice.json) |
| 02 | `quiver:graph` MVP Tree | Completed | [slice-02](./slices/slice-02-graph-mvp-tree/slice.json) |
| 03 | `quiver:graph` Extended Formats | Completed | [slice-03](./slices/slice-03-graph-extended-formats/slice.json) |
| 04 | `quiver:next` Command | Draft | [slice-04](./slices/slice-04-next-command/slice.json) |

## Definition of Done

- `npx create-quiver plan` prints the sequential plan and `--json` produces a valid parseable object
- `npx create-quiver graph --format tree` prints a correct tree; `--show-conflicts` marks shared files
- `npx create-quiver graph --format mermaid` output pastes directly into a GitHub markdown block
- `npx create-quiver next` prints the next ready slice without side effects
- `npx create-quiver next --auto-start` requires confirmation on TTY and refuses on non-TTY
- Each command has a `docs/examples/<command>.md` page with input and representative output
- `docs/COMMANDS.md` has rows for all three commands with OS support and example link
- `README.md` "Project NPM Scripts" lists `quiver:plan`, `quiver:graph`, `quiver:next`
- All three commands run green on macOS, Linux, and Windows in CI

## Validation Checkpoint

Before v19 is started, `quiver:plan` must be used at least once per day for one week during real work on Quiver itself. If the maintainer does not reach for it, v19 is rescoped before it is written.
