# EXECUTION_BRIEF - slice-07 Interactive init and spec create flows

## Context

The user wants guided selectors for onboarding-style flows, methodology, and spec decisions, but Quiver must stay script-safe.

## Objective

Add useful interactive flows to `init` and `spec create` without changing default automation behavior.

## Scope

- `init --interactive`
- `spec create --interactive`
- methodology selector with `WDD + SDD`
- write summary before action
- equivalent non-interactive flags and docs

## Acceptance Criteria

- `init --interactive` is guided.
- `init` without `--interactive` is unchanged.
- `spec create --interactive` lets the human review choices before writes.
- No prompt opens in CI/no-TTY/JSON.
- The methodology selector does not invent unsupported options.

## Plan tecnico resumido

Use the selector infrastructure from slice-02 and keep interactive prompts as explicit opt-in convenience wrappers around existing command contracts.

## Suggested Steps

1. Identify init/spec-create decision points.
2. Add selectors behind `--interactive`.
3. Add summary-before-write behavior.
4. Add no-TTY/CI fallback errors or defaults.
5. Add tests with injected prompt answers.

## Restrictions

- Do not run providers from init.
- Do not add unsupported methodology choices.
- Do not make prompts default behavior.

## Risks

- Interactive init can become too long if too many questions are added.
- Spec create must not re-open already approved plan gates incorrectly.

## Completion Checklist

- [ ] Interactive init tested.
- [ ] Non-interactive init compatibility tested.
- [ ] Interactive spec create tested.
- [ ] Methodology selector documented.
