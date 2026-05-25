# EXECUTION BRIEF - slice-04: Spec validation, scope, and worktree reliability

## Context

Pixel Quiver showed false confidence: `spec validate` could pass while `check-slice` failed, and `spec status` could report a missing worktree as healthy.

## Objective

Make validation and worktree diagnostics match the real execution preconditions.

## Scope

- `spec validate`
- `check-slice`
- `check-scope`
- `spec status`
- `spec start --dry-run`
- related tests

## Acceptance Criteria

- Slice metadata problems are caught at spec validation time.
- Missing/stale worktrees are reported accurately.
- Dirty checkout failures include files and safe options.
- Scope matching is covered by regression tests.

## Technical Plan Summary

Align spec-level and slice-level validators, harden worktree checks against filesystem and Git state, and improve dirty checkout diagnostics.

## Suggested Execution Steps

1. Add failing tests for each observed false-ready case.
2. Update validation helpers.
3. Update worktree status/start diagnostics.
4. Add scope matching tests.
5. Run focused tests and full relevant command tests.

## Restrictions

- Do not mutate dirty worktrees.
- Do not add destructive cleanup.
- Do not change AI lifecycle behavior here.

## Risks

- Stricter validation can affect old specs; use warnings or `--strict` where needed.

## Completion Checklist

- [ ] Spec validation tests pass.
- [ ] Worktree tests pass.
- [ ] Scope tests pass.
- [ ] Backward compatibility behavior documented.

