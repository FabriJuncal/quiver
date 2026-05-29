# EXECUTION_BRIEF - slice-01 Provider stream hooks

## Context

`runProvider` currently captures stdout/stderr and returns them after provider completion. TUI-lite needs optional live observation while preserving this contract.

## Objective

Add opt-in provider stream/status callbacks with no behavior change for existing callers.

## Acceptance Criteria

- Existing provider runner behavior remains unchanged when callbacks are absent.
- Optional callbacks can observe stdout and stderr chunks.
- Provider result shape and accumulated stdout/stderr remain stable.
- Callback data is safe for display paths and does not bypass redaction.
- Timeout, preflight, spawn error, missing provider CLI, and invalid model behavior remain intact.

## Completion Checklist

- [ ] Provider runner callbacks implemented.
- [ ] Default behavior regression tests pass.
- [ ] Callback behavior tests added.
- [ ] No renderer or command UX behavior added in this slice.
