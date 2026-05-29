# EXECUTION_BRIEF - slice-01 AI run status and resume

## Context

Run status and watcher output expose AI progress and must remain clear in both languages.

## Objective

Localize `ai run create`, `ai run watch`, `ai status`, and `ai resume` wrapper output.

## Acceptance Criteria

- Human output supports `en` and `es`.
- Run ids, paths, and status codes remain stable.
- JSON and JSONL modes remain pure and parseable.
- Watcher cancellation semantics remain unchanged.

## Completion Checklist

- [ ] Run/status messages cataloged.
- [ ] JSON/JSONL regression tests preserved.
- [ ] Watch tests cover both languages.
