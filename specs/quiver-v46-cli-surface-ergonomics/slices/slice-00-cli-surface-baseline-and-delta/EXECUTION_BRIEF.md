# EXECUTION_BRIEF - slice-00 CLI surface baseline and delta

## Context

This slice starts v46 and must establish evidence before any runtime changes.

## Objective

Create the current-state baseline/delta matrix for v46 before runtime implementation.

## Scope

- Audit all approved v46 criteria against the current repository.
- Classify each criterion as `present`, `partial`, `missing`, or `regression-risk`.
- Record evidence paths and assign gaps to slices.
- Update only the v46 spec package.

## Acceptance Criteria

- Every approved v46 criterion appears in the matrix.
- Every criterion has evidence or an explicit evidence gap.
- Every `partial`, `missing`, or `regression-risk` item has an owning slice.
- No runtime source files are modified.

## Expected Files To Modify

- `specs/quiver-v46-cli-surface-ergonomics/SPEC.md`
- `specs/quiver-v46-cli-surface-ergonomics/STATUS.md`
- `specs/quiver-v46-cli-surface-ergonomics/EVIDENCE_REPORT.md`
- `specs/quiver-v46-cli-surface-ergonomics/slices/slice-00-cli-surface-baseline-and-delta/CLOSURE_BRIEF.md`

## Validations Required

- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v46-cli-surface-ergonomics`

## Risks

- Treating stale analysis as current truth.
- Missing behavior already implemented in v35-v43.
- Creating implementation work without a gap owner.

## Dependencies

- None.

## Instructions For Executor

1. Inspect current code and tests for each approved criterion.
2. Build the matrix in `SPEC.md` or a clearly referenced v46 artifact.
3. Keep evidence concrete: file paths, test names, or command output summaries.
4. Do not edit runtime code.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Baseline matrix is complete.
- Scope for slices 01-07 is adjusted by evidence.
- Spec validation passes.
