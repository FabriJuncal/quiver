# CLOSURE_BRIEF - slice-02 Interactive agent set provider and model selectors

## Summary

Implemented guided provider/model resolution for `ai agent set <role>`.
The command now supports interactive provider/model selectors when TTY prompts are available, requires explicit `--provider` and `--model` in non-interactive mode, supports existing profile actions, custom model ids, and a write summary before saving.

## Validation Against Acceptance Criteria

- [x] Interactive setup works through injectable selector helpers.
- [x] No-TTY guardrails fail clearly without hanging.
- [x] Existing profiles can be updated, extended, switched as default, or canceled before writes.
- [x] Custom model flow captures technical id and display name.
- [x] Known catalog selections write technical model ids and human display names.

## Relevant Changes

- Added reusable `promptText` support to CLI selectors.
- Added provider/model selector resolution to `ai agent set`.
- Added provider CLI status hints for provider choices.
- Added role-ordered model choices from the local catalog.
- Made `ai agent` dispatch async-safe.
- Added tests for selector helpers, no-TTY behavior, interactive provider/model selection, custom models, and named profile creation.

## Pending

- Live validation and repair remain deferred to later slices.

## Remaining Risks

- Provider install status is best-effort and only detects CLI availability, not whether the selected account can run the chosen model.
- Interactive prompt rendering itself is covered through injected selectors rather than a real terminal e2e test.

## Future Recommendations

Add richer live provider validation only after the selector flow is stable.
