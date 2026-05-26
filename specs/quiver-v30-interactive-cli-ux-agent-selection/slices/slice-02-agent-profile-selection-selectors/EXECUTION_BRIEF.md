# EXECUTION_BRIEF - slice-02 Agent profile selection and selectors

## Context

The user wants commands that need Planners or Executors to show selectors such as `GPT 5.5` and `OPUS 4.7`, sourced from real configured profiles. The same selection must be scriptable through flags.

## Objective

Add the selection contract for agents, specs, slices, methodology, and execution modes.

## Scope

- Multiple named profiles per role.
- Display-name resolution.
- Interactive selectors behind `--interactive`.
- Non-interactive flags.
- Spec/slice selector data using stable internal values.
- Methodology selector with only `WDD + SDD` for now.

## Acceptance Criteria

- Selectors use configured data only.
- Display name appears instead of raw provider when configured.
- No prompt opens in CI/no-TTY/JSON.
- Missing default choices fail with actionable guidance.
- Existing configs remain compatible.

## Plan tecnico resumido

Build selectors as reusable infrastructure, not command-specific prompt code. Keep prompts opt-in and flags authoritative for automation.

## Suggested Steps

1. Extend profile read/write helpers for named arrays per role.
2. Add display-name resolver.
3. Add selector helpers with injectable prompt implementation.
4. Add command-line args for role/spec/slice choices.
5. Add tests for old and new profile shapes.

## Restrictions

- Do not execute providers in this slice.
- Do not invent model options.
- Do not add unsupported methodologies.

## Risks

- Config migration can break existing users if not backward compatible.
- Labels can become ambiguous if internal selector values are not unique.

## Completion Checklist

- [ ] Multiple profile shape supported.
- [ ] Display-name resolution tested.
- [ ] Selectors tested in TTY and no-TTY paths.
- [ ] Non-interactive flags documented.
