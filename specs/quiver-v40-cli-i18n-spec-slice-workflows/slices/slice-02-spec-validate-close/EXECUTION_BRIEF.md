# EXECUTION_BRIEF - slice-02 Spec validate and close

## Context

Validation output must be understandable in the selected language while preserving machine-readable identifiers.

## Objective

Localize `spec validate` and `spec close` human output.

## Acceptance Criteria

- Success, warning, and failure output supports `en` and `es`.
- Strict-mode promotion remains deterministic.
- File paths, slice ids, and error codes remain stable.
- No-TTY/CI behavior remains non-interactive.

## Completion Checklist

- [ ] Validation output cataloged.
- [ ] Close output cataloged.
- [ ] Strict-mode tests updated.
