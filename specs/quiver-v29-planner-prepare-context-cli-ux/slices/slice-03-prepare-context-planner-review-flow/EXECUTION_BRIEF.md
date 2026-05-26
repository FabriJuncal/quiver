# EXECUTION_BRIEF - slice-03 Planner-assisted prepare-context review flow

## Context

The deterministic `ai prepare-context` path must remain default. Planner-assisted mode is opt-in and must never bypass docs-only safety.

## Objective

Implement `ai prepare-context --with-planner` with dry-run, prompt printing, review, and interactive support.

## Scope

- Parse new flags for `ai prepare-context`.
- Build planner prompt from context pack and current draft plan.
- Invoke provider only when not dry-run/print-prompt.
- Validate planner proposal.
- Snapshot and write docs-only changes.
- Add editor review flow.

## Acceptance Criteria

- Existing deterministic behavior stays compatible.
- Planner mode is explicit.
- No partial writes on provider, validation, editor, or snapshot failure.
- Human output has clear next safe commands.

## Suggested Steps

1. Extend CLI args for `ai prepare-context`.
2. Add planner prompt builder or reuse onboarding prompt pieces.
3. Add dry-run and print-prompt paths.
4. Add provider execution path.
5. Add proposal validation and write integration.
6. Add review flow and tests.

## Restrictions

- Do not allow product code writes.
- Do not make planner mode default.
- Do not require interactive prompts for automation.

## Risks

- Combining provider execution, review, and writes can create partial-state bugs unless staged carefully.

## Completion Checklist

- [ ] Default mode unchanged.
- [ ] Planner dry-run and print-prompt tested.
- [ ] Provider failure tested.
- [ ] Review cancellation tested.
- [ ] Snapshot and docs-only write tested.
