# Quiver v34 - CLI Dashboard Status

**Date:** 2026-05-28
**Status:** Planned
**Source:** User-approved acceptance criteria and production review for a read-only CLI dashboard that visualizes Quiver project state.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver exposes useful state through `flow`, `plan`, `next`, `ai export`, `ai specs list`, and `ai slices list`, but users still need to combine several commands to understand the whole project at a glance.

The gap is especially visible when deciding what to do next:

- spec and slice progress are spread across multiple surfaces;
- blockers, warnings, migration guidance, approvals, agents, active-slice state, runs, and evidence are not shown together;
- machine-readable export exists, but there is no compact human dashboard optimized for quick project status;
- a future dashboard must avoid duplicating Quiver state or creating a second source of truth.

## Objective

Add a read-only CLI dashboard that shows the complete actionable state of a Quiver project without using Ink, a web console, providers, prompts, or writes.

The dashboard should answer:

- What is the current project state?
- How many specs and slices exist?
- What is complete, open, ready, or blocked?
- What is the next ready slice?
- What blockers, warnings, approvals, active-slice issues, agent gaps, runs, and evidence exist?
- What safe commands should the user run next?

## Scope

### Included

- New top-level command: `npx create-quiver dashboard`.
- `dashboard --json` with a compact stable schema.
- `dashboard --spec <slug>` filter.
- `dashboard --include-completed`.
- Human output that follows `docs/CLI_UX_GUIDE.md`.
- Distinct global progress and visible progress.
- Tolerant behavior for legacy, incomplete, uninitialized, no-spec, no-slice, and graph-error states.
- No evidence/log content in human or compact JSON output.
- Generated `quiver:dashboard` npm script.
- Documentation, tests, smokes, and release-readiness evidence.

### Excluded

- Ink or fullscreen TUI.
- Browser/web console.
- Local server.
- Interactive navigation.
- Diff viewer.
- Starting slices from the dashboard.
- Creating specs, opening PRs, discarding changes, running providers, or writing project state.
- Changing WDD + SDD semantics.

## Approved Acceptance Criteria

### Read-only dashboard behavior

1. Given a project with Quiver, when the user runs `npx create-quiver dashboard`, then Quiver prints a consolidated read-only dashboard and does not modify files, run providers, open prompts, create worktrees, start slices, or create PRs.
2. Given specs and slices exist, when the dashboard renders, then it shows spec count, slice count, completed slices, open slices, blocked slices, ready slices, and progress.
3. Given completed slices are hidden from visible work by default, when the dashboard renders, then it still shows correct global progress across all slices and separately shows visible progress for the current filter.
4. Given `--include-completed` is passed, then visible progress and visible slice sections include completed slices.
5. Given `--spec <slug>` is passed, then visible dashboard sections are limited to that spec while global project context remains clear.
6. Given `--spec <slug>` is passed for a missing spec, then the command fails with actionable guidance instead of silently showing an empty dashboard.

### Next ready work and blockers

7. Given at least one slice is ready, when the dashboard renders, then it shows the recommended next slice with spec slug, slice id, title, status, path, and start command.
8. Given multiple slices are ready, then the dashboard shows the recommended first slice and indicates that more ready slices exist.
9. Given blockers or warnings exist, then the dashboard shows their refs, reasons, and next commands where available.
10. Given the slice graph is invalid, then the dashboard does not crash; it reports the graph issue and still renders the rest of the available state.

### Workflow state

11. Given planner approvals exist or are missing, then the dashboard shows `acceptance`, `technical-plan`, and `plan-review` status.
12. Given agent profiles exist or are missing, then the dashboard shows planner, executor, reviewer, and doctor configuration without exposing credentials or secrets.
13. Given active-slice state exists, then the dashboard shows active-slice sources, reconciliation decision, reason, and risks if any.
14. Given runs or evidence exist, then the dashboard shows counts and refs only, not raw logs, command output, or evidence contents.

### Output contracts

15. Given `dashboard --json`, then stdout is parseable JSON with no colors, prompts, spinners, or human prose.
16. Given `dashboard --json`, then the payload uses `dashboard_schema_version: 1` and includes `summary`, `global_progress`, `visible_progress`, `next_ready`, `specs`, `slices`, `agents`, `approvals`, `active_slice`, `blockers`, `warnings`, and `next_steps`.
17. Given human output, then it follows the Quiver CLI UX standard: clear hierarchy, next safe commands, no color-only status, ASCII/no-color fallback, and no prompts.
18. Given unsupported UX flags such as `--interactive`, `--review`, or `--with-planner` are passed, then Quiver rejects them through the existing UX flag guardrails.

### Documentation and validation

19. Given the command is public, then README, `README_FOR_AI.md`, command reference, CLI UX guide, generated templates, and package scripts are updated.
20. Given implementation is complete, then tests cover human output, JSON cleanliness, `--spec`, missing spec, `--include-completed`, no specs, graph errors, legacy/incomplete layout, agent gaps, blockers, no-color, CI/no-TTY, and no evidence/log leakage.
21. Given every slice is created, then each slice has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.

## Approved Technical Plan

1. Inventory the current state surfaces and tests before implementation.
2. Add a dashboard report contract that consumes existing state from `collectLifecycleExport()` and related internal helpers without shelling out to the CLI.
3. Calculate `global_progress` from all slices and `visible_progress` from filtered visible slices.
4. Derive `next_ready` from graph/plan state when the graph is valid; degrade safely with a warning when graph state is invalid.
5. Define a compact JSON schema with `dashboard_schema_version: 1`; do not return the full lifecycle export from `dashboard --json`.
6. Add human formatting with existing Quiver UX/theme helpers and no prompt/spinner behavior.
7. Add top-level `dashboard` routing, help text, examples, and UX-flag support matrix behavior.
8. Add `quiver:dashboard` to generated project scripts and docs.
9. Add focused tests for report construction, command output, JSON cleanliness, filters, missing specs, graph errors, legacy/no-spec states, no-color/CI/no-TTY, and secret-safe evidence summaries.
10. Update docs, templates, smoke coverage, PR body, status, and evidence only after command contract is stable.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Dashboard foundation | completed | none |
| slice-01 | Dashboard report contract | ready | slice-00 |
| slice-02 | Dashboard command and rendering | planned | slice-01 |
| slice-03 | Dashboard edge cases and guardrails | planned | slice-01, slice-02 |
| slice-04 | Docs, templates, and scripts | planned | slice-02, slice-03 |
| slice-05 | Tests, smokes, and release readiness | planned | slice-03, slice-04 |

## Validation Strategy

- `node --test tests/lib/dashboard.test.js`
- `node --test tests/commands/dashboard.test.js`
- `node --test tests/commands/cli-contract.test.js tests/commands/ux-flags.test.js`
- `node --test tests/lib/ai-export-state.test.js tests/commands/ai-export.test.js`
- `node --test tests/lib/init-docs.test.js tests/lib/init-layout.test.js`
- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v34-cli-dashboard-status`

## Risks

- Progress can be misleading if visible filters hide completed slices; global and visible progress must remain distinct.
- A dashboard can become another source of truth if it rebuilds state independently; reuse existing resolver/export state.
- Graph errors can break naive `next_ready` logic; the dashboard must degrade safely.
- A missing `--spec` filter can hide typos if empty output is treated as success.
- Evidence and runs can contain sensitive command output; the dashboard must summarize counts and refs only.
- Human formatting can contaminate JSON if output paths are not tested separately.

## Resolved Decisions

- Use `dashboard`, not top-level `status`, to avoid ambiguity with `ai status`.
- Do not use Ink for the MVP.
- Do not add interactive behavior in this spec.
- Do not add write actions from the dashboard.
- `dashboard --json` has a compact schema, not the full `ai export` schema.
- The command must be useful in legacy and incomplete layouts.
