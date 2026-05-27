# EXECUTION_BRIEF - slice-04 Planner IA progress flows

## Context

The observed bug is in a planner flow: `ai prepare-context --with-planner` can run silently while waiting for provider output.

## Objective

Apply the new UX runtime to planner-oriented IA commands so users see real progress and selected profile/model names.

## Scope

- `ai onboard`
- `ai prepare-context --with-planner`
- `ai plan`
- `ai review-plan`
- Planner/Reviewer display names.
- Provider-running spinner.
- Failure/cancel cleanup.

## Acceptance Criteria

- `ai prepare-context --with-planner` shows progress and does not look frozen.
- Headings use selected profile/model names, not provider fallback when a better label exists.
- `--print-prompt` stays clean and copyable.
- `--json`, CI, no-TTY, and no-color output stay clean.
- Provider failures stop spinners and produce actionable errors.

## Plan tecnico resumido

Wrap real command stages with the progress runtime and use profile/provider validation before provider execution.

## Suggested Steps

1. Define real stages for each planner command.
2. Add heading/display name resolution.
3. Wrap provider execution in spinner lifecycle.
4. Add failure/cancel handling.
5. Add tests with injected slow and failing providers.

## Restrictions

- Do not fake progress checks.
- Do not add selectors without `--interactive`.
- Do not change deterministic `ai prepare-context` behavior unless adopting clearer output safely.

## Risks

- `commands/ai.js` is shared and can conflict with executor/PR changes.
- Provider stderr can be noisy and must be summarized safely.

## Completion Checklist

- [ ] Planner commands show real progress.
- [ ] Display names are correct.
- [ ] Failure/cancel paths tested.
- [ ] Machine output stays clean.
