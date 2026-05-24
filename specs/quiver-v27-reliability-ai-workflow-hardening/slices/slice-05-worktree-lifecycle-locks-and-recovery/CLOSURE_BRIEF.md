# CLOSURE BRIEF - slice-05: Worktree lifecycle, locks, and recovery

## Summary

Implemented worktree lifecycle hardening for persistent spec worktrees, slice worktree startup, and delegated parallel AI execution runs. The slice adds shared lock handling, stale/missing worktree recovery messages, nested worktree prevention, and focused tests for the production risks found in Pixel Quiver dogfooding.

## Validation Against Acceptance Criteria

- `spec start` dry-run and real reuse behavior remains covered by existing spec worktree tests.
- Existing spec worktrees are reused when valid; stale or manually deleted registered worktrees now fail with recovery steps instead of being silently recreated.
- Running slice startup from a linked worktree now rejects nested worktree creation unless it is reusing the exact registered worktree.
- Delegated parallel execution uses a run-level lock and fails safely before provider execution when the same run is already active.
- Dirty, missing, stale, and conflicting worktree states produce actionable recovery guidance.

## Changes

- Added `src/create-quiver/lib/locks.js` for `.quiver/locks` helpers and local runtime-state ignore handling.
- Updated `src/create-quiver/lib/git.js` with linked-worktree and realpath-aware git directory helpers.
- Updated `src/create-quiver/lib/spec-worktrees.js` with persistent worktree reuse checks, lock handling, stale path recovery, and nested worktree safeguards.
- Updated `src/create-quiver/lib/lifecycle.js` with slice worktree locks and nested worktree prevention.
- Updated `src/create-quiver/lib/ai/execution-plan.js` with delegated run locking.
- Added regression coverage in `tests/lib/lifecycle.test.js` and `tests/commands/ai-execute-plan.test.js`.

## Remaining Risks

- Existing user-created stale locks may require manual removal after the user confirms no Quiver process is active.
- This slice hardens lifecycle behavior but does not yet expand `check-scope`, `check-handoff`, or `spec validate`; those remain in `slice-06`.

## Follow-up Recommendations

- Execute `slice-06-validation-gates-and-scope-safety` next so the new lifecycle guarantees are enforced by validation gates before later context and DX work.
