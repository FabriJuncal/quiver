# EXECUTION_BRIEF - slice-01 Spec create, start, and status surfaces

## Context

Spec creation and startup commands guide WDD + SDD adoption and need localized human guidance.

## Objective

Localize `spec create`, `spec start`, and related status/preview output.

## Acceptance Criteria

- Human output supports `en` and `es`.
- `spec create --dry-run` and `--review --interactive` wrapper messages are localized.
- Generated spec artifacts remain schema-stable and are not translated by this slice.
- Suggested commands remain exact.

## Completion Checklist

- [ ] Human strings cataloged.
- [ ] Dry-run/review tests updated.
- [ ] Generated artifact regression tests preserved.
