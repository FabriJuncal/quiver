# Quiver v36 - Portable AI Run Watch

**Date:** 2026-05-28
**Status:** Planned
**Source:** User-approved requirement, hardened acceptance criteria, and approved technical plan for a portable live watcher for provider-backed AI runs.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Provider-backed commands such as `npx create-quiver ai plan --phase technical-plan` can take long enough that users need visibility into what is happening. Showing Quiver progress and embedding the provider TUI in the same terminal is fragile because multiple processes compete for one TTY: cursor state, ANSI redraws, resize, input, `Ctrl+C`, scrollback, and CI/no-TTY behavior.

Quiver already persists AI lifecycle state under `.quiver/runs/<run-id>/`, but there is no portable way for a second terminal to watch provider progress, stdout, stderr, and artifacts live without mixing provider output into the main command UX.

## Objective

Add a portable, provider-agnostic AI run watcher:

- Quiver generates and displays its own `run-id`.
- Provider-backed commands persist structured events and redacted logs under `.quiver/runs/<run-id>/`.
- The main terminal keeps stable progress and points to `npx create-quiver ai run watch --run <run-id>`.
- A second terminal can replay and follow run events in human or JSONL mode.
- The base solution works on macOS, Linux, and Windows with Node primitives only.

## Scope

### Included

- Quiver-owned run id format and validation.
- Run and event schema version 1.
- Path-safe access to `.quiver/runs/<run-id>/`.
- Append-only `events.jsonl` with monotonic `seq`.
- Redacted and sanitized provider stdout/stderr logs.
- Provider streaming integration for planner-oriented live commands:
  - `ai plan`
  - `ai revise`
  - `ai review-plan`
  - `ai repair-plan`
- Human watcher:
  - `npx create-quiver ai run watch --run <run-id>`
  - `npx create-quiver ai run watch --latest`
- Machine watcher:
  - `npx create-quiver ai run watch --run <run-id> --json`
- Replay + follow behavior.
- Completed, failed, canceled, stale, legacy, and missing-run handling.
- Docs, generated guidance, tests, package smoke, and cross-platform smoke.

### Excluded

- Embedding Codex, Claude, or Gemini TUI.
- Opening terminal windows automatically.
- `tmux`, `zellij`, AppleScript, Windows Terminal automation, or `node-pty` as required behavior.
- Changing the existing `--json` contracts.
- Publishing to npm.
- Implementing provider UI split panes as core behavior.

## Approved Acceptance Criteria

### Run id and path safety

1. Quiver generates a run id before live provider execution.
2. The run id does not depend on provider-specific session ids.
3. Valid run ids match `^run-[0-9]{4}-[0-9]{2}-[0-9]{2}t[0-9]{2}-[0-9]{2}-[0-9]{2}z-[a-f0-9]{6,12}$`.
4. `watch --run` rejects absolute paths, traversal, `/`, `\`, empty values, and unknown formats.
5. The watcher only reads inside `.quiver/runs/<run-id>/`.
6. `--run` and `--latest` are mutually exclusive.
7. Missing both `--run` and `--latest` fails with actionable guidance.

### Run artifacts and schemas

8. Each live provider run creates `.quiver/runs/<run-id>/`.
9. The run directory contains at least `run.json`, `events.jsonl`, `provider.stdout.log`, `provider.stderr.log`, `prompt.md`, and `result.md` when applicable.
10. `run.json` includes `schema_version`, `run_id`, `status`, `phase`, `provider`, `model`, `display_name`, `started_at`, `updated_at`, `finished_at`, `exit_code`, and `artifacts`.
11. `events.jsonl` events include `schema_version`, `run_id`, `seq`, `timestamp`, and `type`.
12. Event `seq` is monotonic per run.
13. Event writes are append-only and tolerate concurrent watcher reads.
14. Watcher tolerates partial JSONL lines while the writer is appending.

### Main command UX

15. Live provider-backed commands show the generated run id.
16. The main terminal keeps stable Quiver progress instead of streaming raw provider output by default.
17. The main terminal prints the exact watch command.
18. TTY human output can use checks and spinners.
19. CI, no-TTY, `--json`, and `--print-prompt` remain clean and automation-safe.
20. `--dry-run` does not create live provider run artifacts unless explicitly documented as a dry-run preview.

### Watch command UX

21. `ai run watch --run <run-id>` replays existing events and follows active runs.
22. For completed runs, watch prints a final summary and exits.
23. For failed runs, watch prints the failure summary and relevant artifacts.
24. For canceled runs, watch prints canceled state without treating watcher cancellation as run cancellation.
25. `Ctrl+C` in watch stops only the watcher.
26. Stale running runs are detected from `status=running` plus old `updated_at` or heartbeat gap and shown with an actionable warning.
27. Legacy runs without `events.jsonl` are handled safely without breaking `ai status`, `ai resume`, or `ai export`.
28. `--latest` chooses the last running run first; if none are running, it chooses the latest `updated_at`; ties use lexicographic `run_id`.
29. Human `--latest` output displays the selected run id and reason.

### JSONL watcher

30. `ai run watch --run <run-id> --json` emits JSONL only.
31. JSONL watch emits no headings, spinners, colors, or human prose.
32. JSONL events are parseable and escaped correctly.
33. JSONL watch replays history and follows active runs until terminal status.

### Provider streaming, logs, and security

34. Provider execution uses `child_process.spawn` without shell.
35. Provider stdout and stderr are captured through pipes.
36. Provider stdout/stderr are redacted before they are persisted.
37. Redaction handles secrets split across chunks by buffering lines or a sliding window.
38. ANSI and unsafe control characters from provider output are sanitized before visible or persisted logs.
39. Logs have a documented cap; exceeding it records `log_truncated`.
40. `prompt.md` is redacted by default.
41. Provider errors preserve actionable context without exposing secrets.
42. Existing model/provider validation remains honest and unchanged.

### Compatibility and validation

43. The base implementation uses Node-only primitives and no required external terminal multiplexer.
44. macOS, Linux, Windows PowerShell, Git Bash, and paths with spaces are supported.
45. Tests cover path traversal, missing run, `--latest`, completed/failed/canceled/stale runs, legacy runs, partial JSONL lines, split secrets, ANSI/control chars, log truncation, no-TTY/CI/JSON behavior, and simulated provider streaming.
46. Docs update `docs/CLI_UX_GUIDE.md`, `README_FOR_AI.md`, command references, and generated guidance when public contracts change.
47. Final validation includes `node --test`, `git diff --check`, spec validation, package smoke, and cross-platform smoke.

## Approved Technical Plan

1. Create this spec package and slice handoffs without implementing runtime code.
2. Define run id, run schema, event schema, status model, and path-safety helpers.
3. Build an append-only run event writer with redaction, sanitization, log caps, and monotonic sequence numbers.
4. Integrate the writer into provider execution for planner-oriented live commands.
5. Implement `ai run watch` with replay + follow, `--latest`, human output, JSONL output, stale detection, and legacy handling.
6. Update main command progress to display run id and watch command.
7. Update docs and generated guidance.
8. Add focused and full validation, package smoke, and cross-platform smoke.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Foundation and handoffs | completed | none |
| slice-01 | Run schema and path safety | ready | slice-00 |
| slice-02 | Event writer and redacted logs | planned | slice-01 |
| slice-03 | Provider streaming integration | planned | slice-02 |
| slice-04 | AI run watch command | planned | slice-01, slice-02 |
| slice-05 | Main progress and user guidance | planned | slice-03, slice-04 |
| slice-06 | Docs and generated guidance | planned | slice-04, slice-05 |
| slice-07 | Tests and cross-platform readiness | planned | slice-02, slice-03, slice-04, slice-05, slice-06 |

## Risks and Guardrails

- Redaction must happen before persistence, not only before display.
- Path validation must not rely only on string prefix checks.
- Watchers must tolerate concurrent appends and incomplete final lines.
- `Ctrl+C` semantics must be different for the watcher and the main provider process.
- JSONL mode must stay pure even on errors.
- Existing `.quiver/runs` data may be legacy and must not be broken.
- Provider CLIs may produce little or no incremental output; heartbeat and stage events must keep watch useful.
- Log caps and truncation must avoid unbounded disk growth.

## Assumptions

- This repository's canonical spec location is `specs/quiver-vNN-*`, not the generic `docs/specs` path from reusable skills.
- `docs/INDEX.md` is missing in this checkout while `docs/INDEX.md.template` exists; this is documented debt but does not block creating this spec package.
- v34 and v35 are already documented in prior work/branches even if this new branch is based on `main`.
