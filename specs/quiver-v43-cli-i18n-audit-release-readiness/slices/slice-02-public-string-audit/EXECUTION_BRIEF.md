# EXECUTION_BRIEF - slice-02 Public string audit

## Context

Hardcoded human strings outside the i18n catalog can leave partial English/Spanish output.

## Objective

Audit public CLI strings and fix or document any remaining localization gaps.

## Acceptance Criteria

- Hardcoded public human strings are identified.
- Strings are moved to catalogs unless they are stable literals.
- Stable literals are documented as exceptions.
- Tests cover newly fixed gaps.

## Completion Checklist

- [ ] String audit run.
- [ ] Gaps fixed or documented.
- [ ] Tests updated.
