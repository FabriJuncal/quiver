# Evidence Report - Quiver v46 CLI Surface Ergonomics

## Planning Evidence

- Source analysis: `CLI_ANALYSIS.md`.
- Repository convention inspected: `specs/quiver-vNN-*/SPEC.md` and `specs/<spec>/slices/<slice-id>/`.
- Production-readiness review identified required baseline/delta audit before runtime changes.

## Validation Evidence

- `slice-00-cli-surface-baseline-and-delta` baseline matrix created in `SPEC.md`.
- Evidence inspected for i18n gaps: `src/create-quiver/commands/config.js`, `src/create-quiver/commands/prepare.js`, `src/create-quiver/commands/graph.js`, `src/create-quiver/commands/spec.js`, `src/create-quiver/index.js`, `src/create-quiver/commands/ai.js`.
- Evidence inspected for read-only UX baseline: `src/create-quiver/lib/dashboard.js`, `tests/commands/dashboard.test.js`, `docs/reference/commands.md`, `src/create-quiver/commands/plan.js`, `src/create-quiver/commands/graph.js`, `src/create-quiver/commands/next.js`.
- Evidence inspected for write-command safety baseline: `src/create-quiver/index.js`, `src/create-quiver/commands/prepare.js`, `src/create-quiver/lib/init-layout.js`, `src/create-quiver/lib/doctor.js`, `tests/commands/doctor.test.js`, `tests/lib/init-layout.test.js`.
- Evidence inspected for namespace baseline: `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js`, `src/create-quiver/lib/init-docs.js`, `README_FOR_AI.md`, `docs/reference/commands.md`.
- Evidence inspected for module extraction baseline: `src/create-quiver/index.js`, `src/create-quiver/commands/`.
- `git diff --check`: passed for slice-00.
- `node bin/create-quiver.js spec validate specs/quiver-v46-cli-surface-ergonomics`: passed for slice-00.

## slice-01-i18n-command-error-hardening - Execution Evidence

- Localized representative human command errors and output for `config`, `evidence`, `spec`, `graph`, `prepare`, and selected `ai` flows.
- Added EN/ES catalog keys in `src/create-quiver/lib/i18n/messages/en.js` and `src/create-quiver/lib/i18n/messages/es.js`.
- Added a static hardcoded command-error audit with explicit allowlist in `tests/commands/i18n-audit-matrix.test.js`.
- Added or updated focused command tests in `tests/commands/config-language.test.js`, `tests/commands/evidence.test.js`, `tests/commands/graph.test.js`, `tests/commands/spec-validate.test.js`, `tests/commands/prepare.test.js`, and `tests/commands/ai-export.test.js`.
- `node --test tests/lib/i18n-catalog.test.js`: passed.
- `node --test tests/commands/i18n-audit-matrix.test.js`: passed.
- `node --test tests/commands/cli-contract.test.js`: passed.
- `node --test tests/commands/config-language.test.js tests/commands/evidence.test.js tests/commands/graph.test.js tests/commands/spec-validate.test.js tests/commands/prepare.test.js tests/commands/ai-export.test.js tests/commands/ai-models.test.js tests/lib/i18n-catalog.test.js tests/commands/i18n-audit-matrix.test.js`: passed.
- `git diff --check`: passed.

## slice-02-read-only-ux-quick-wins - Execution Evidence

- Added missing-hours reporting for human `plan` output while keeping `plan --json` parseable with `missing_estimates`.
- Added explicit empty-level guidance for human `graph --level <n>` output without changing graph JSON contracts.
- Documented that top-level `--json` wins over `graph --format` in help text and locked behavior with tests.
- Compact human `next` output now reports additional ready slices as a count with `--all-ready` guidance instead of listing every secondary slice by default.
- Added no-write assertions for `plan`, `graph`, and `next`.
- Added EN/ES catalog keys for the new human guidance.
- `node --test tests/commands/plan.test.js`: passed.
- `node --test tests/commands/flow.test.js tests/commands/dashboard.test.js tests/commands/plan.test.js tests/commands/graph.test.js tests/commands/next.test.js tests/commands/evidence.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js`: passed.
- `git diff --check`: passed.

## slice-03-write-command-feedback-safety - Execution Evidence

- `analyze --dry-run` now reports a planned write count; live `analyze` reports applied write count after writing scan, project map, and AI context artifacts.
- Live `init` reports applied create/update/preserve counts after initialization.
- Live `migrate` warns on stderr before writing and points to `npx create-quiver migrate --dry-run`; stdout reports applied create/update/preserve counts after migration.
- Added stronger no-write assertion for `migrate --dry-run` using full file snapshots.
- Added idempotency tests for repeated `init` and repeated `migrate`.
- Existing `doctor --fix --dry-run`, `doctor --fix` idempotency, and `prepare --dry-run` no-write coverage remained green.
- `node --test tests/commands/init-profiles.test.js tests/commands/analyze.test.js tests/commands/doctor.test.js tests/commands/prepare.test.js tests/lib/i18n-catalog.test.js`: passed.
- `node --test tests/commands/cli-contract.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js`: passed.
- `git diff --check`: passed.

## slice-04-slice-namespace-compatibility - Execution Evidence

- Added `src/create-quiver/commands/slice.js` as the canonical mapping layer for `slice start|check|check-pr|scope|cleanup|refresh`.
- Parser routes canonical `slice` subcommands to existing lifecycle/readiness/scope implementations without changing those semantics.
- Legacy root aliases remain functional and emit deprecation warnings only to stderr in human mode.
- Legacy aliases do not emit deprecation warnings when `--json` is requested.
- Help, docs reference, generated package scripts, generated docs, doctor checks, and the i18n command matrix now include canonical `slice` commands while retaining compatibility aliases.
- Added `tests/commands/slice-namespace.test.js` for canonical/legacy equivalence, stderr warning behavior, JSON cleanliness, and subcommand validation.
- `node --test tests/commands/slice-namespace.test.js tests/commands/cli-contract.test.js tests/commands/init-profiles.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js tests/commands/doctor.test.js tests/lib/i18n-catalog.test.js`: passed.
- `node --test tests/commands/slice-namespace.test.js tests/commands/cli-contract.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js tests/commands/doctor.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js tests/lib/check-slice.test.js`: passed.
- Package-installed smoke: local `npm pack`, temp install, `create-quiver slice refresh`, and legacy `check-slice --json` warning-clean failure path passed.
- `git diff --check`: passed.

## slice-05-handoff-namespace-compatibility - Execution Evidence

- Added `src/create-quiver/commands/handoff.js` as the canonical mapping layer for `handoff check|create`.
- Parser routes canonical `handoff check` and `handoff create` through the existing handoff library and scaffold paths.
- Legacy `check-handoff` and `new-handoff` remain functional and emit deprecation warnings only to stderr in human mode.
- Help, docs reference, generated package scripts, generated docs, and the i18n command matrix now include canonical `handoff` commands while retaining compatibility aliases.
- Added `tests/commands/handoff-namespace.test.js` for canonical/legacy equivalence, stderr warning behavior, missing subcommand validation, and stdout cleanliness on failures.
- `node --test tests/lib/handoff.test.js tests/commands/handoff-namespace.test.js tests/commands/cli-contract.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js`: passed after updating generated-script whitelist for `new-handoff`.
- Package-installed smoke: local `npm pack`, temp install, `create-quiver handoff create`, `create-quiver handoff check`, and legacy `check-handoff` warning path passed.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v46-cli-surface-ergonomics`: passed.

## slice-06-init-analyze-doctor-command-modules - Execution Evidence

- Captured pre-extraction baseline with focused init/analyze/doctor and CLI contract tests.
- Added `src/create-quiver/commands/init.js`, `src/create-quiver/commands/analyze.js`, and `src/create-quiver/commands/doctor.js` as dependency-injected command orchestration modules.
- Updated `src/create-quiver/index.js` to delegate to the extracted modules while preserving the existing public command behavior.
- Kept behavior changes out of the extraction slice; the only functional correction during extraction was passing the existing package root from `index.js` into the init module so generated template resolution remained stable after moving files.
- `node --test tests/commands/init-profiles.test.js tests/commands/analyze.test.js tests/commands/doctor.test.js tests/commands/cli-contract.test.js`: passed before extraction.
- `node --test tests/commands/init-profiles.test.js tests/commands/analyze.test.js tests/commands/doctor.test.js tests/commands/cli-contract.test.js`: passed after extraction.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v46-cli-surface-ergonomics`: passed.

## slice-07-docs-tests-release-readiness - Execution Evidence

- Updated public and generated documentation to prefer canonical `slice ...` and `handoff ...` commands while documenting legacy aliases as compatibility paths.
- Added CLI UX guidance for canonical namespaces, stderr-only deprecation warnings, and JSON stdout cleanliness.
- Kept `next` example aligned with current CLI output, which still prints the compatibility `start-slice` command, and documented `slice start` as the preferred command for new docs/scripts.
- Updated the `spec create --interactive` Spanish cancellation test to assert the localized error when `language: 'es'` is passed.
- `node --test tests/lib/init-docs.test.js tests/lib/init-layout.test.js tests/commands/slice-namespace.test.js tests/commands/handoff-namespace.test.js tests/commands/cli-contract.test.js`: passed.
- `node --test tests/commands/spec-create.test.js`: passed after aligning the localized assertion.
- `node --test`: passed, 634 tests.
- `npm run package:quiver`: passed, package smoke reported `create-quiver-0.15.4.tgz`.
- Package-installed smoke with a temporary `npm pack`: passed for `create-quiver --version`, `quiver --version`, `create-quiver slice refresh`, `quiver handoff create`, and `quiver handoff check`.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v46-cli-surface-ergonomics`: passed.

## Notes

- `slice-00` changed only the v46 spec package.
- `slice-01` intentionally did not localize deep AI repair/plan workflow errors; those are documented in the static audit allowlist and owned by v48 AI command modularization.
- `slice-02` did not add new v47 commands and did not change machine-readable JSON field names beyond additive `missing_estimates`.
- `slice-03` did not move command orchestration into `commands/`; that remains owned by `slice-06`.
- `slice-04` did not remove or alter legacy root commands beyond adding stderr-only human deprecation warnings.
- `slice-05` did not change handoff heading/brief validation contracts.
- `slice-06` did not change command behavior, parser behavior, AI behavior, or parser modernization scope.
- `slice-07` did not implement v47-v49 behavior and did not remove legacy aliases.
