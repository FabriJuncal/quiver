# CLOSURE BRIEF - slice-06: Plan and graph scope performance

## Summary of Work

- Added scoped slice loading for `plan` and `graph` when `--spec <slug>` is provided.
- Scoped loading reads the target spec and explicit dependency refs without parsing unrelated historical specs.
- Kept unscoped `plan` and `graph` behavior compatible.
- Updated root `quiver:plan` and `quiver:graph` scripts to use the local CLI entrypoint so local validation tests the branch code instead of the published npm version.

## Validation Against Acceptance Criteria

- [x] Scoped plan passes without OOM.
- [x] Scoped graph passes without OOM.
- [x] Regression test added.
- [x] Unscoped behavior verified.

## Relevant Changes

- Updated `src/create-quiver/lib/slice-graph.js`.
- Updated `src/create-quiver/commands/plan.js`.
- Updated `src/create-quiver/commands/graph.js`.
- Updated `tests/commands/plan.test.js` and `tests/commands/graph.test.js`.
- Updated root `package.json` scripts for local `quiver:plan` and `quiver:graph`.

## Pending

- No pending work for this slice.

## Remaining Risks

- Scoped output intentionally keeps external dependency refs for readiness but still displays only the requested spec, matching prior filtered output.

## Future Recommendations

- Keep large-repo fixtures around scoped graph commands.
