# CLOSURE_BRIEF - slice-03 Provider model selection contract

## Summary

Implemented the provider/model selection contract for planner and reviewer IA flows.

## Validation Against Acceptance Criteria

- [x] Model support metadata validated.
- [x] Supported model invocation validated.
- [x] Unsupported model blocking validated.
- [x] Existing provider compatibility validated.

## Relevant Changes

- Added `supportsModelSelection`, model arg builders, model-selection metadata, and enforcement to provider adapters.
- Added dry-run visibility for selected provider models.
- Wired selected profile models into planner/reviewer command flows.
- Added targeted provider and command tests.
- Documented the model-selection contract in `docs/CLI_UX_GUIDE.md` and synchronized `README_FOR_AI.md`.

## Pending

- Executor command flows must use the same provider/model contract in slice-05.

## Remaining Risks

- Provider CLI model flags can vary by installed CLI version; release validation should include local dry-run/live smoke tests where CLIs are available.

## Future Recommendations

Keep provider adapter docs explicit about which model selectors are enforced by CLI flags and which require provider-side configuration.
