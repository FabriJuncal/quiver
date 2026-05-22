# CLOSURE BRIEF - slice-02: Run state, phase gates, and locks

## Summary of Work

- Added persistent AI lifecycle run state under `.quiver/runs/<run-id>/`.
- Added `ai run create`, `ai status`, and `ai resume` command behavior.
- Added approvals metadata for lifecycle runs.
- Added run/slice lock helpers with stale-lock metadata in `.quiver/locks/`.
- Connected `ai plan` and `ai approve` to lifecycle phase updates.
- Added phase guard helpers for blocking future-phase work with next-command guidance.

## Validation Against Acceptance Criteria

- [x] Run creation inspected.
- [x] Resume verified.
- [x] Invalid phase blocked.
- [x] Locks verified.
- [x] Tests run.

## Relevant Changes

- `src/create-quiver/lib/ai/run-state.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/init-layout.js`
- `tests/lib/ai-run-state.test.js`
- `tests/commands/ai-run-state.test.js`
- `tests/lib/init-layout.test.js`
- `README.md`
- `README_FOR_AI.md`
- `docs/COMMANDS.md.template`

## Pending

- None.

## Remaining Risks

- Locks are implemented as file locks with owner metadata. Process liveness cleanup is intentionally manual for now to avoid unsafe deletion.

## Future Recommendations

- Later slices should wire `assertAiRunPhaseAllows` into spec generation, execution planning, slice execution, and PR creation.
