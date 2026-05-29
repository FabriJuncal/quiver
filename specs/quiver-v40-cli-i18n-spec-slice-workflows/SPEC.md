# Quiver v40 - CLI i18n Spec and Slice Workflows

**Date:** 2026-05-28
**Status:** Completed
**Source:** Continuation of the approved CLI i18n program.

## Problem

Spec and slice workflow commands are central to WDD + SDD. Their guidance must be localized without changing structured artifacts or automation contracts.

## Objective

Localize spec/slice workflow command output in `en` and `es` while preserving generated spec metadata and JSON contracts.

## Scope

### Included

- `spec create`, `spec validate`, `spec start`, `spec close`.
- `start-slice`, `check-slice`, `check-pr`, `ai prompt-slice`.
- Handoff validation messages and workflow gate output.
- Human output, dry-run, review/interactive wrapper messages, no-TTY/CI, and `--json` where supported.

### Excluded

- Translating generated spec content or templates; v42 owns generated docs/templates.
- Provider-backed AI lifecycle output; v41 owns that.

## Acceptance Criteria

1. Included workflow commands render human output in `en` and `es`.
2. Generated `slice.json` fields, status values, git metadata, and schema-like content remain stable.
3. Handoff validation errors are localized but required heading aliases stay documented.
4. Suggested commands remain exact and copy-pasteable.
5. `spec validate --strict` remains deterministic across languages.
6. Tests cover success, warning, validation failure, dry-run, and no-TTY/CI paths.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Spec/slice foundation | completed | none |
| slice-01 | Spec create, start, and status surfaces | completed | v37 complete |
| slice-02 | Spec validate and close | completed | slice-01 |
| slice-03 | Slice lifecycle and handoffs | completed | slice-01 |
| slice-04 | Spec/slice tests and smokes | completed | slice-02, slice-03 |

## Guardrails

- Do not translate JSON keys, statuses, branch names, file paths, or spec/slice ids.
- Do not localize generated spec files unless v42 explicitly owns the generated template.
- Preserve parser and strict validation behavior.
