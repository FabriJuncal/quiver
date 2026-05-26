# CLOSURE_BRIEF - slice-04 UX flag matrix and compatibility guardrails

## Summary

Completed centralized UX flag support and early compatibility validation.

## Validation Against Acceptance Criteria

- `--with-planner`, `--interactive`, and `--review` support is centralized in `src/create-quiver/lib/cli/ux-flags.js`.
- Unsupported UX flags fail before command dispatch and before side effects.
- Incompatible combinations such as `--json --interactive` and `--json --review` fail before command dispatch.
- `ai pr` supports `--interactive` and `--review`, while rejecting `--with-planner`.
- Read-only commands such as `flow`, `ai inspect`, and `ai export` reject unsupported UX flags.
- Existing `plan --json` output remains parseable when UX flags are not requested.

## Relevant Changes

- Added `src/create-quiver/lib/cli/ux-flags.js`.
- Updated `src/create-quiver/index.js` to parse UX flags, validate them early, document them in help, and forward supported values to future command handlers.
- Added `tests/commands/ux-flags.test.js`.

## Pending Work

- Later slices should rely on this matrix instead of ad hoc flag behavior.
- `slice-03` must implement actual `ai prepare-context --with-planner` behavior now that flags are accepted and forwarded.

## Remaining Risks

- Command help and docs must stay aligned with this matrix.
- Some supported flags are forwarded before their command behavior exists; final release readiness depends on `slice-03` and `slice-05` completing before merge.

## Future Recommendations

- Consider generating docs/reference command flag tables from the matrix in a future spec.
