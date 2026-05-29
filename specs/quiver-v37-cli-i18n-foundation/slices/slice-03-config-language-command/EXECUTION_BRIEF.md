# EXECUTION_BRIEF - slice-03 Config language command

## Context

Language changes should be discoverable after init and usable in scripts.

## Objective

Add `config language show` and `config language set <en|es>` with project and global persistence.

## Acceptance Criteria

- `config language show` reports effective language and source.
- `config language set es` and `config language set en` update project config by default.
- A global option writes to `~/.quiver/config.json` without requiring a project.
- Invalid languages fail with actionable guidance.
- `--json` returns stable keys and codes.
- Existing config keys are preserved.

## Completion Checklist

- [x] Command parser route added.
- [x] Project/global write paths tested.
- [x] JSON and human modes covered.
- [x] Docs updated.
