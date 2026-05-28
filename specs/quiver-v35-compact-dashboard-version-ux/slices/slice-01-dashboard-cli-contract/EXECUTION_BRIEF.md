# EXECUTION_BRIEF - slice-01 Dashboard CLI contract

## Context

`dashboard --json` already has tests asserting parseable stdout and empty stderr on dashboard errors. New human-only dashboard flags must not break that automation contract.

## Objective

Add the dashboard flag contract for `--details`, `--section <name>`, and `--limit <n>`.

## Scope

- CLI parsing/routing for dashboard flags
- dashboard option validation
- focused CLI tests

## Acceptance Criteria

- `dashboard --details` is accepted for human output.
- `dashboard --section specs` is accepted for human output.
- `dashboard --limit 5` is accepted.
- `dashboard --details --section specs` fails actionably.
- `dashboard --json --section specs` fails with JSON stdout, empty stderr, and non-zero exit.
- `dashboard --json` remains compatible when no human-only flags are passed.
- New flags fail clearly outside `dashboard`.

## Technical Plan Summary

Add parser support for the flags, then validate dashboard-specific combinations in a location that can still return JSON errors when `--json` is present.

## Suggested Steps

1. Add parse support for `--details`, `--section`, and `--limit`.
2. Scope the flags to dashboard.
3. Validate `--limit` as integer `1..100`.
4. Add JSON-safe dashboard combination errors.
5. Add CLI tests for valid and invalid combinations.

## Restrictions

- Do not change dashboard default rendering yet.
- Do not add the version command.
- Do not alter `dashboard --json` schema by default.

## Completion Checklist

- [ ] Parser updated.
- [ ] Dashboard option validation added.
- [ ] Focused CLI tests pass.
