# EXECUTION_BRIEF - slice-02 Planner context proposal contract

## Context

Planner-assisted `ai prepare-context` needs a strict contract before any provider output can affect project docs.

## Objective

Create a safe parser and schema for planner-generated documentation proposals.

## Scope

- Add proposal schema.
- Add proposal parser/normalizer.
- Add docs-only allowlist.
- Add path safety checks.
- Add valid and invalid fixtures.

## Acceptance Criteria

- Unsafe planner output is rejected before writes.
- Valid planner output becomes a normalized docs-only plan.
- Errors explain what failed and how to continue safely.

## Suggested Steps

1. Define proposal JSON shape.
2. Add `zod` schema validation.
3. Add path normalization and allowlist checks.
4. Add fixtures for valid, invalid, product-code, absolute-path, traversal, and malformed outputs.
5. Add unit tests.

## Restrictions

- Do not call providers in this slice.
- Do not modify `runPrepareContext` write behavior yet.

## Risks

- Too-strict parsing can reject useful planner output; prefer clear repair guidance over unsafe fallback.

## Completion Checklist

- [ ] Valid fixtures parse.
- [ ] Unsafe fixtures fail.
- [ ] Proposal errors are actionable.
- [ ] No docs are written by this slice.
