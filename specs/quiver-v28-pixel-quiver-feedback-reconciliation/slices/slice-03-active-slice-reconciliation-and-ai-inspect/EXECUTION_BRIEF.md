# EXECUTION BRIEF - slice-03: Active slice reconciliation and AI inspect

## Context

Pixel Quiver showed that active slice state can live in more than one file and that `ai inspect` can continue suggesting `spec create` after a spec exists by fallback.

## Objective

Make active-slice state inspectable, safely reconcilable, and reflected in AI inspection guidance.

## Scope

- Project state resolver.
- AI inspect/export state.
- Active slice status/reconciliation command surface if needed.
- Tests and fixtures for conflicting active state.

## Acceptance Criteria

- All active-slice sources are detected.
- Dry-run reconciliation is safe and explicit.
- `ai inspect` does not recommend stale `spec create` when an existing spec should be validated or executed.
- No worktrees or branches are deleted automatically.

## Technical Plan Summary

Extend the resolver to read active-slice sources, expose reconciliation states, and update AI inspect guidance.

## Suggested Execution Steps

1. Add fixtures for active-state conflicts.
2. Extend resolver tests.
3. Update inspect/export behavior.
4. Add command/help updates if a new command surface is introduced.
5. Validate no-write dry-run behavior.

## Restrictions

- Do not implement repair-plan logic.
- Do not modify worktree lifecycle logic except for reading/reporting.

## Risks

- Existing generated projects may have partial active-slice files.

## Completion Checklist

- [ ] Resolver tests pass.
- [ ] Inspect/export tests pass.
- [ ] Dry-run behavior verified.
- [ ] Docs/evidence updated.

