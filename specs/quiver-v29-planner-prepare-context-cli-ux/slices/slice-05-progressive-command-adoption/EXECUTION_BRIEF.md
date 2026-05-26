# EXECUTION_BRIEF - slice-05 Progressive command adoption

## Context

After `ai prepare-context` implements the full pattern, selected commands should adopt the same standard where it clearly improves UX.

## Objective

Apply UX flags and review/interactive behavior to `ai plan`, `spec create`, and `ai pr` without redesigning unrelated commands.

## Scope

- `ai plan`: planner-related UX flags and optional review flow.
- `spec create`: guarded review/interactive path.
- `ai pr`: interactive PR inputs and review/edit of `pr.md`; no `--with-planner`.
- Tests for supported and unsupported combinations.

## Acceptance Criteria

- No command becomes interactive by default.
- Every interactive choice has a flag equivalent.
- Machine output stays clean.
- Unsupported flags fail clearly.

## Suggested Steps

1. Start with `ai pr --review` because it maps cleanly to existing `pr.md`.
2. Add minimal `spec create --review` guardrails.
3. Add `ai plan` UX flag compatibility.
4. Add tests for each.

## Restrictions

- Do not apply the standard to all commands in this slice.
- Do not add planner mode to `ai pr`.

## Risks

- Broad command changes can create regressions. Keep adoption narrow and test heavily.

## Completion Checklist

- [ ] `ai plan` compatibility tested.
- [ ] `spec create` review/interactive behavior tested.
- [ ] `ai pr` review/interactive behavior tested.
- [ ] Existing command tests still pass.
