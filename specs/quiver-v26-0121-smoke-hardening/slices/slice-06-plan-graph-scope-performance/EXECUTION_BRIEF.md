# EXECUTION BRIEF - slice-06: Plan and graph scope performance

## Context

During v25 and v26 documentation validation, scoped `plan` and `graph` commands failed with Node out-of-memory even for a small target spec. This means the commands likely load or retain too much unrelated historical data before applying `--spec`.

## Objective

Make scoped `plan` and `graph` safe to run in this repo without increasing Node heap size.

## Scope

- `plan` command.
- `graph` command.
- Slice graph loading/filtering helpers.
- Regression tests and evidence.

## Acceptance Criteria

- Scoped plan for v26 completes without OOM.
- Scoped graph for v26 completes without OOM.
- Tests prove scoped loading avoids unrelated heavy artifacts.
- Unscoped behavior remains compatible.

## Technical Plan Summary

Audit the graph-loading path, move spec filtering earlier, avoid retaining unnecessary file contents or historical artifacts, and add focused tests.

## Suggested Execution Steps

1. Reproduce the OOM with v26 scoped plan/graph.
2. Inspect `plan`, `graph`, and slice graph loading.
3. Move filtering earlier or reduce retained data.
4. Add regression tests.
5. Re-run scoped plan/graph and record evidence.

## Restrictions

- Do not solve this by raising heap size.
- Do not remove support for historical specs.
- Do not change dependency semantics without explicit evidence.

## Risks

- Over-filtering could hide cross-spec dependencies if those are valid in existing specs.

## Completion Checklist

- [ ] Scoped plan passes.
- [ ] Scoped graph passes.
- [ ] Regression test added.
- [ ] Evidence updated.

