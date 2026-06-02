# EXECUTION_BRIEF - slice-04 user-facing i18n error coverage

## Context

The audit found user-facing errors that bypass i18n. Some errors originate in libraries invoked by commands, not only command files.

## Objective

Ensure user-facing errors in covered command paths respect EN/ES language selection.

## Scope

- Covered command paths and invoked libraries.
- EN/ES catalog keys.
- Allowlist for technical strings.
- Behavior tests for errors.

## Acceptance Criteria

- Covered errors localize with `--lang es` and `--lang en`.
- JSON stdout remains parseable and free of human warnings.
- Catalog completeness passes.
- Allowlisted strings are documented.
- No command semantics change.

## Expected Files To Modify

- `src/create-quiver/commands/**`
- `src/create-quiver/lib/**`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/i18n-audit-matrix.test.js`
- `tests/lib/i18n-catalog.test.js`
- `specs/quiver-v50-audit-trust-foundation/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/commands/i18n-audit-matrix.test.js`
- `node --test tests/lib/i18n-catalog.test.js`
- `node --test`
- `git diff --check`

## Risks

- Localizing machine-readable values.
- Missing errors thrown by libs.
- Breaking tests that assert exact messages.

## Dependencies

- Depends on `slice-00-audit-baseline-and-resolved-findings`.

## Instructions For Executor

1. Trace real command failure paths.
2. Add catalog keys only for user-facing text.
3. Keep JSON fields and codes stable.
4. Record allowlist rationale.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Covered command errors honor Quiver's bilingual contract.
