# EXECUTION_BRIEF - slice-00 Analysis contract foundation

## Context

The user approved acceptance criteria and a production review for a new deep project analysis workflow. This slice creates the documented contract only.

## Objective

Create the v46 spec package and all slice handoffs without implementing runtime code.

## Scope

### Included

- `SPEC.md`
- `STATUS.md`
- `EXECUTION_PLAN.md`
- `EVIDENCE_REPORT.md`
- `pr.md`
- `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md` for each planned slice.

### Excluded

- CLI parser changes.
- Source discovery implementation.
- Provider execution.
- Safe write implementation.
- Tests beyond structural validation.

## Acceptance Criteria

- Spec package exists under `specs/quiver-v46-deep-project-analysis`.
- Every slice directory includes `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Runtime implementation is explicitly marked as not started.
- Source code implementation files are not modified.

## Completion Checklist

- [x] Spec package created.
- [x] Slice handoffs created.
- [x] Implementation deferred.
