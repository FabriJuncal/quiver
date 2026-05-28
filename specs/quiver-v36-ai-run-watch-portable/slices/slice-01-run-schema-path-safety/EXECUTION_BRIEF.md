# EXECUTION_BRIEF - slice-01 Run schema and path safety

## Context

The watcher must never treat a user-provided run id as a file path. This slice creates the safe foundation for all run and event files.

## Objective

Define and implement run id validation, path-safe run lookup, run schema v1, event schema v1, and status normalization.

## Scope

- Run id generator and validator
- Safe `.quiver/runs/<run-id>` path resolver
- `run.json` schema v1
- `events.jsonl` event schema v1
- Status catalog for `pending`, `running`, `completed`, `failed`, `canceled`
- Focused tests for valid/invalid ids and traversal rejection

## Acceptance Criteria

- Generated run ids match the approved regex.
- `watch --run` style validation rejects traversal, absolutes, separators, empty ids, and malformed ids.
- Safe path resolution guarantees resolved paths stay inside `.quiver/runs`.
- `run.json` and event schema helpers produce required fields.
- Stale is represented as derived state, not persisted status.

## Technical Plan Summary

Add small, testable helpers before any writer or watcher reads from disk.

## Restrictions

- Do not implement streaming writer yet.
- Do not implement `ai run watch` yet.
- Do not modify provider execution yet.

## Completion Checklist

- [ ] Run id helper added.
- [ ] Safe path resolver added.
- [ ] Schemas documented in code/tests.
- [ ] Path-safety tests pass.
