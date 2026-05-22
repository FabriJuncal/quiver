# CLOSURE BRIEF - slice-04: Agent profiles and provider adapters

## Summary of Work

Implemented the provider-agnostic agent profile contract for planner, executor, reviewer, and doctor roles, plus prompt-only rendering and redacted provider output.

## Validation Against Acceptance Criteria

- [x] Profiles inspected.
- [x] Prompt-only mode verified.
- [x] Missing CLI guidance verified.
- [x] Structured output captured.
- [x] Tests run.

## Relevant Changes

- Added `doctor` as a supported agent profile and removed `researcher` from the public profile contract.
- Added `--print-prompt` support for planner/reviewer AI commands without invoking provider CLIs.
- Redacted likely secrets from provider stdout, stderr, and error messages.
- Added focused tests for doctor profiles, prompt-only output, missing CLI guidance, structured provider metadata, and log redaction.
- Updated README and command reference docs.

## Pending

No pending implementation for this slice.

## Remaining Risks

- Redaction remains best-effort and should not be treated as a reason to intentionally print secrets.
- `ai doctor` does not yet use the doctor provider profile; it remains a local readiness/GitHub preflight command.

## Future Recommendations

- Consider a later explicit `ai doctor --provider` diagnostic flow if the doctor profile should run model-assisted diagnosis.
