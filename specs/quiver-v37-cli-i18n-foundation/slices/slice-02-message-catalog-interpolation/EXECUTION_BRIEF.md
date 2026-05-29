# EXECUTION_BRIEF - slice-02 Message catalog and interpolation

## Context

Localized output must be maintainable and testable. Hardcoded Spanish or English strings in command bodies would make coverage incomplete.

## Objective

Add the catalog and translation helper used by the CLI for human output.

## Acceptance Criteria

- Catalogs exist for `en` and `es`.
- Catalog metadata includes a version.
- Interpolation escapes missing or unsafe values predictably.
- Plural forms support at least `one` and `other`.
- Missing keys fail tests.
- Fallback to `en` is explicit and tested.
- Suggested commands and flags remain exact literals.

## Completion Checklist

- [x] Catalog files added.
- [x] Translation helper added.
- [x] Missing-key and fallback tests added.
- [x] Pluralization tests added.
