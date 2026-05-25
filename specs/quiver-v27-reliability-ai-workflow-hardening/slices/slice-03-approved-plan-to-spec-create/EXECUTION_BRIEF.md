# EXECUTION BRIEF - slice-03: Approved plan to spec create

## Context

Pixel Quiver showed that `spec create` can generate a generic two-slice scaffold instead of the approved multi-slice plan. That breaks the central WDD + SDD flow.

## Objective

Make `spec create` faithful to the approved technical plan and safe on parse failure.

## Scope

- Spec generator
- Approval metadata handling
- Spec templates
- Command tests and fixtures
- v27 evidence/status docs

## Acceptance Criteria

- `spec create` uses an explicitly approved technical plan version.
- Approved slice count, IDs, dependencies, handoffs, execution plan, and PR body are generated.
- Missing/invalid structured slice data fails before writing.
- Generic fallback scaffolds are not created silently.
- Failed runs do not leave empty remnant directories.

## Technical Plan Summary

Add structured plan extraction/validation, atomic writes, safe failure handling, and regression tests based on the Pixel Quiver failure.

## Suggested Execution Steps

1. Inspect current spec generator and approval selection.
2. Define the structured slice block contract.
3. Implement validation and atomic write flow.
4. Add tests for good plan, missing structure, duplicates, circular dependencies, dry-run, and failure cleanup.
5. Update docs/evidence.

## Restrictions

- Do not execute generated slices.
- Do not open PRs.

## Risks

- Existing free-form plans may need compatibility guidance or migration.

## Completion Checklist

- [ ] Structured block contract implemented.
- [ ] Generic fallback removed or made explicit error.
- [ ] Atomic write behavior covered.
- [ ] Regression fixture added.
- [ ] Validation commands passed.

