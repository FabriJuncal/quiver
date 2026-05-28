# EXECUTION_BRIEF - slice-05 Provider progress alignment

## Context

`ai prepare-context --with-planner` provides the UX baseline. Planner and reviewer commands must look alive during real provider execution without affecting machine output.

## Objective

Align progress/loaders for `ai plan`, `ai revise`, `ai review-plan`, and `ai repair-plan`, and audit existing long-running flows.

## Scope

- `src/create-quiver/commands/ai.js`
- existing CLI UX helpers if needed
- focused progress tests

## Acceptance Criteria

- Live provider-backed planner/reviewer commands show progress in human TTY.
- Dry-run and print-prompt do not show loaders.
- JSON/no-TTY/CI/no-color stay clean.
- Provider failure stops the spinner.
- Existing compliant flows are protected by regression tests or noted.

## Technical Plan Summary

Reuse `createCommandUx`, `shouldShowHumanProgress`, `writeProgressChecks`, and `runProviderWithProgress`. Avoid new abstractions unless real duplication appears.

## Suggested Steps

1. Audit current progress usage.
2. Add missing progress stages.
3. Add tests with injected spinner/UX helpers.
4. Add no-color/no-TTY regression coverage where gaps exist.

## Restrictions

- Do not change provider prompts.
- Do not add progress to JSON output.
- Do not mark fake work as completed.

## Risks

- Progress output can be hard to test if implementation is coupled to terminal rendering.

## Completion Checklist

- [ ] Planner progress covered.
- [ ] Review-plan progress covered.
- [ ] Repair-plan progress covered.
- [ ] Machine-output cleanliness covered.
