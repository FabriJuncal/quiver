# EXECUTION BRIEF - slice-02: Structured technical plan contract and repair flow

## Context

Pixel Quiver reached an approved technical plan but `spec create` failed because the plan lacked a structured `spec.slices[]` array.

## Objective

Make the structured technical-plan contract explicit, validated, and repairable before spec creation.

## Scope

- Technical-plan prompts and validation.
- Spec generation from approved plans.
- Approval repair path.
- Tests for valid, invalid, missing, and repaired structures.

## Acceptance Criteria

- Missing `spec.slices[]` is caught before writing spec files.
- A valid plan creates the intended spec package.
- A repair flow creates a derived draft without mutating the approved artifact.
- Repaired drafts require review and approval.

## Technical Plan Summary

Add a formal minimum contract for `spec.slices[]`, validate it at approval/spec creation boundaries, and add a repair command or flow that preserves auditability.

## Suggested Execution Steps

1. Read final `slice-00` assignments.
2. Add failing tests for missing `spec.slices[]`.
3. Add schema/contract validation.
4. Add repair flow.
5. Validate dry-run no-write behavior.

## Restrictions

- Do not loosen approval gates.
- Do not generate fallback generic slices silently.
- Do not publish npm.

## Risks

- Planner output can vary; validation must produce helpful errors without requiring fragile formatting beyond the explicit contract.

## Completion Checklist

- [ ] Contract tests pass.
- [ ] Repair tests pass.
- [ ] Spec-create invalid input writes no files.
- [ ] Closure evidence updated.

