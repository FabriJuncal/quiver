# EXECUTION_BRIEF - slice-00 CLI UX spec foundation

## Context

Quiver v29 introduces planner-assisted `ai prepare-context` and a shared CLI UX standard. This slice establishes the documentation foundation only.

## Objective

Commit the approved spec package so later implementation slices have a stable contract.

## Scope

- Review `SPEC.md`, `EXECUTION_PLAN.md`, `STATUS.md`, `pr.md`, and every slice contract.
- Ensure each slice has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Validate JSON and Markdown hygiene.

## Acceptance Criteria

- No product code changes.
- All slice JSON files parse.
- `git diff --check` passes.
- Slice dependencies and allowed write paths are explicit.

## Suggested Steps

1. Inspect the spec package.
2. Validate every `slice.json`.
3. Run `git diff --check`.
4. Commit only the spec package.

## Restrictions

- Do not modify `src/`, tests, package files, or generated templates in this slice.
- Do not implement CLI behavior.

## Risks

- If this slice is skipped, implementation agents may work from inconsistent scope.

## Completion Checklist

- [ ] Spec package reviewed.
- [ ] JSON validation passed.
- [ ] Whitespace validation passed.
- [ ] Documentation foundation committed.
