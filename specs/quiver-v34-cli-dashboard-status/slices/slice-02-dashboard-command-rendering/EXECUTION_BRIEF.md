# EXECUTION_BRIEF - slice-02 Dashboard command and rendering

## Context

The report contract exists from slice-01. This slice makes it available through the CLI.

## Objective

Add `npx create-quiver dashboard` with human and JSON output.

## Scope

- `src/create-quiver/commands/dashboard.js`
- `src/create-quiver/index.js`
- focused command tests

## Acceptance Criteria

- `dashboard` is a supported top-level command.
- `dashboard --json` emits parseable compact JSON.
- Human output shows project, progress, next ready slice, blockers, approvals, agents, active slice, and next steps where available.
- `--spec`, `--include-completed`, and `--no-color` are passed to the report/formatting layer.
- `--interactive`, `--review`, and `--with-planner` are rejected.
- Help output documents the command.

## Technical Plan Summary

Add a command wrapper that calls the dashboard report helpers and formats either compact JSON or human output. Integrate the command into the central parser/router/help.

## Suggested Steps

1. Add `commands/dashboard.js`.
2. Add `dashboard` to supported modes.
3. Add usage/help/example entries.
4. Wire options into `runDashboard`.
5. Add command tests for human output, JSON, filters, no-color, and unsupported UX flags.

## Restrictions

- Do not perform writes.
- Do not start slices.
- Do not prompt.
- Do not use Ink.

## Risks

- Central CLI router changes can regress help or unsupported-command behavior.

## Completion Checklist

- [ ] Command implemented.
- [ ] Help updated.
- [ ] Command tests pass.
