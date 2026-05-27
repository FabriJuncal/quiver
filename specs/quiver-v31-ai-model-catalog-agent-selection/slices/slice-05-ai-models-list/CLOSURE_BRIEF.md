# CLOSURE_BRIEF - slice-05 AI models list command

## Summary

Implemented `ai models list` with human and JSON output for Quiver's local model catalog.

## Validation Against Acceptance Criteria

- [x] Models list command works and groups by provider.
- [x] Provider filter works for `--provider codex`.
- [x] JSON output parses and includes catalog metadata.
- [x] Help includes the command.
- [x] Human output says models are known by Quiver and does not claim availability.

## Relevant Changes

- Added `runModelsList` command handler.
- Added `ai models list` parser and command routing.
- Updated CLI help and command contract tests.
- Added `tests/commands/ai-models.test.js`.

## Pending

- None for this slice.

## Remaining Risks

- The catalog remains local and can become stale until a remote/update mechanism exists.

## Future Recommendations

Use this command as the future integration point for a remote model catalog API.
