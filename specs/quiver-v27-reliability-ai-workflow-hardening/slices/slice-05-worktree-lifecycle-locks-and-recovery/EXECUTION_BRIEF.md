# EXECUTION BRIEF - slice-05: Worktree lifecycle, locks, and recovery

## Context

Pixel Quiver showed confusing worktree guidance and potential nested worktree paths. The desired workflow is one persistent worktree per spec and one commit per slice, while delegated execution may still use temporary worktrees internally.

## Objective

Harden worktree lifecycle, locking, and recovery.

## Scope

- Spec worktree lifecycle
- Delegated execution worktree strategy
- Git/worktree recovery messages
- Locking for concurrent operations
- Tests and docs evidence

## Acceptance Criteria

- Spec worktrees are persistent and reused.
- Existing spec worktrees do not create nested paths.
- Temporary worktrees remain limited to delegated parallel execution.
- Dirty/missing/stale worktrees report recovery steps.
- Concurrent operations are locked or rejected safely.

## Technical Plan Summary

Clarify worktree identity, add detection for current worktree context, add locks and recovery tests.

## Suggested Execution Steps

1. Inspect spec worktree and executor code.
2. Define worktree modes and lock locations.
3. Implement context detection and recovery messaging.
4. Add tests for root, worktree, dirty, missing, stale, and delegated paths.
5. Update docs/evidence.

## Restrictions

- Do not remove delegated parallel capability.
- Do not force destructive cleanup without explicit option.

## Risks

- Existing users may rely on current branch names; preserve compatibility where possible.

## Completion Checklist

- [ ] Persistent spec worktree behavior covered.
- [ ] Nested worktree prevention covered.
- [ ] Delegated worktrees still pass tests.
- [ ] Lock/recovery behavior covered.
- [ ] Validation commands passed.

