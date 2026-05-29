# EXECUTION_BRIEF - slice-02 Analyze, migrate, and prepare-context

## Context

Setup-adjacent commands explain what Quiver detected or will write, so localization must preserve actionability.

## Objective

Localize `analyze`, `migrate`, and `ai prepare-context` human output.

## Acceptance Criteria

- Commands render in `en` and `es`.
- `--dry-run` outputs are localized and write-free.
- `--json` output remains stable where supported.
- File paths and suggested commands remain exact.
- Planner prompt content is not silently translated unless it is a human-facing CLI wrapper message.

## Completion Checklist

- [ ] Human strings cataloged.
- [ ] Dry-run tests added.
- [ ] JSON regression tests preserved.
