# EXECUTION_BRIEF - slice-04 AI run watch command

## Context

After runs and events are persisted safely, users need a portable command to replay and follow events from another terminal.

## Objective

Implement `npx create-quiver ai run watch --run <run-id>`, `--latest`, and `--json`.

## Scope

- CLI parsing/routing for `ai run watch`
- Replay + follow behavior
- Human output
- JSONL output
- `--latest` selection
- Stale, missing, completed, failed, canceled, and legacy handling
- `Ctrl+C` watcher-only cancellation

## Acceptance Criteria

- `watch --run <id>` replays history and follows active runs.
- `watch --json` emits JSONL only.
- `watch --latest` selects deterministically and reports the selected run in human mode.
- Missing or malformed runs fail actionably.
- Completed runs summarize and exit.
- `Ctrl+C` stops only the watcher.

## Technical Plan Summary

Implement the watcher on top of run-state and run-event readers, not provider-specific code.

## Restrictions

- Do not add terminal multiplexer dependencies.
- Do not embed provider TUI output.

## Completion Checklist

- [ ] Watch command routed.
- [ ] Human replay/follow implemented.
- [ ] JSONL replay/follow implemented.
- [ ] Edge-case tests pass.
