# CLOSURE BRIEF - slice-01: AI run state, approvals, and clean output

## Summary

Completed the AI run-state and approval-visibility hardening slice. Successful provider-backed planner commands now print clean extracted output instead of raw stdout/stderr, run-scoped approvals are shown separately from global planner approval files, and stale runs can be closed without deleting evidence.

## Validation

Passed:

- `node --test tests/commands/ai-run-state.test.js tests/commands/ai-plan.test.js tests/commands/ai-export.test.js tests/commands/cli-contract.test.js`
- `node --test tests/lib/ai-run-state.test.js tests/lib/approvals.test.js tests/lib/ai-export-state.test.js`

## Relevant Changes

- Updated `src/create-quiver/commands/ai.js`.
- Updated `src/create-quiver/lib/ai/run-state.js`.
- Updated `tests/commands/ai-run-state.test.js`.
- Updated `tests/commands/ai-plan.test.js`.
- Updated v28 coverage/status/evidence documents.

## Pending Work

- `slice-02`: enforce and repair structured `spec.slices[]` technical-plan contracts.
- `slice-03`: reconcile multi-source active-slice state and stale `ai inspect` next commands.
- `slice-04`: align spec validation, scope, and worktree reliability.
- `slice-05`: add structured review-plan closure metadata and agent DX improvements.

## Remaining Risks

- `ai run close` archives by setting phase/status to `closed`; it does not delete or migrate any run artifacts.
- Existing historical `.quiver/approvals/*` files may still be orphaned by design; the CLI now labels them instead of mutating them.
- More advanced run replacement UX can be added later if dogfooding shows `close` plus visible open-run warnings are not enough.

## Future Recommendations

- Keep future planner commands using clean output on success and raw output only on failure diagnostics.
- Keep approval reports grouped by run when adding new phases or approval types.
