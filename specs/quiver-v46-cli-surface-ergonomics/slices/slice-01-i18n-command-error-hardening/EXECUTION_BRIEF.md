# EXECUTION_BRIEF - slice-01 i18n command error hardening

## Context

This slice follows the v46 baseline and should only address confirmed i18n gaps.

## Objective

Complete missing i18n coverage for command human errors and prevent new hardcoded command errors.

## Scope

- Use slice-00 baseline to identify exact gaps.
- Add EN/ES catalog keys.
- Replace or wrap human command errors in `config`, `evidence`, `spec`, `graph`, `prepare`, and `ai`.
- Add static or matrix coverage with allowlisted exceptions.

## Acceptance Criteria

- Representative errors for every targeted command render in English and Spanish.
- JSON output remains parseable and unlocalized.
- Catalog completeness validation passes.
- Static audit catches new non-allowlisted hardcoded command errors.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/config.js`
- `src/create-quiver/commands/evidence.js`
- `src/create-quiver/commands/spec.js`
- `src/create-quiver/commands/graph.js`
- `src/create-quiver/commands/prepare.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/**`
- `tests/lib/i18n-catalog.test.js`

## Validations Required

- `node --test tests/lib/i18n-catalog.test.js`
- `node --test tests/commands/i18n-audit-matrix.test.js`
- Focused command tests for changed commands
- `git diff --check`

## Risks

- Accidentally translating command snippets.
- Breaking parser error expectations.
- Adding catalog keys without test coverage.

## Dependencies

- Depends on `slice-00-cli-surface-baseline-and-delta`.

## Instructions For Executor

1. Start from baseline gaps only.
2. Add tests before replacing messages where practical.
3. Keep literals such as flags, paths, providers, model ids, and commands exact.
4. If an English string must remain hardcoded, document the exception in the audit allowlist.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- All targeted command errors are localized or explicitly excepted.
- JSON behavior is unchanged.
- Validation commands pass.
