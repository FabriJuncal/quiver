# EXECUTION_BRIEF - slice-05 Main progress and user guidance

## Context

After provider runs persist events and `ai run watch` exists, the main command should make the feature discoverable without streaming raw provider output into the primary terminal.

## Objective

Update planner-oriented live AI commands so users see stable Quiver progress, the generated run id, and the exact watch command for the current run.

## Scope

- Main terminal progress for live provider-backed commands
- Run id display
- Watch command display
- CI, no-TTY, `--json`, `--print-prompt`, and `--dry-run` behavior
- Provider failure/cancel user guidance

## Acceptance Criteria

- Live provider-backed commands print the generated run id in human TTY mode.
- Human TTY output prints `npx create-quiver ai run watch --run <run-id>`.
- Main output remains stable and does not stream raw provider stdout/stderr by default.
- CI, no-TTY, `--json`, and `--print-prompt` remain clean and automation-safe.
- `--dry-run` does not create live run artifacts unless explicitly documented as a preview.
- Provider failures keep actionable context without exposing secrets.
- `Ctrl+C` in the main provider command marks the run canceled when a run was created.

## Technical Plan Summary

Wire the run metadata returned by provider execution into the existing command UX layer. Keep human progress and machine output on separate paths.

## Restrictions

- Do not change existing JSON contracts except to add documented fields only if the SPEC requires them.
- Do not print provider raw logs in the main command by default.
- Do not make the watcher mandatory for command completion.

## Completion Checklist

- [ ] Main commands show run id and watch command in human TTY mode.
- [ ] Automation modes remain uncontaminated.
- [ ] Dry-run and print-prompt behavior are preserved.
- [ ] Failure and cancellation states update run metadata.
