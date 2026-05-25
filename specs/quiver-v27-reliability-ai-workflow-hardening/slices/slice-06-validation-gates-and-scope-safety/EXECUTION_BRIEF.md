# EXECUTION BRIEF - slice-06: Validation gates and scope safety

## Context

Pixel Quiver showed that some validation gates passed while later execution failed, or skipped checks because of wrong branch assumptions. This slice turns validation into a reliable preflight.

## Objective

Harden validation gates and path/scope safety.

## Scope

- `check-slice`
- `check-scope`
- `check-handoff`
- `spec validate`
- path safety helpers
- tests and docs evidence

## Acceptance Criteria

- Local slice validation catches local execution preconditions or clearly lists skipped checks.
- Scope validation respects `--base` and `slice.git.base_branch`.
- Handoff errors include templates or aliases.
- `spec validate` validates full spec structure and evidence consistency.
- Path traversal/out-of-root writes are rejected.

## Technical Plan Summary

Align validators with execution behavior, add strict/legacy modes where needed, and cover real dogfooding failures with tests.

## Suggested Execution Steps

1. Inspect validation and scope code.
2. Add missing base/path/brief checks.
3. Implement `spec validate` if not present.
4. Add compatibility handling for legacy specs.
5. Add regression tests.

## Restrictions

- Do not break legacy specs without documented strict mode.
- Do not silently skip validation when base information is available.

## Risks

- End users may have older specs; use warnings or migration guidance when appropriate.

## Completion Checklist

- [ ] check-slice covered.
- [ ] check-scope covered.
- [ ] check-handoff covered.
- [ ] spec validate covered.
- [ ] path safety covered.
- [ ] Validation commands passed.

