# Quiver v46 - CLI Surface Ergonomics

**Date:** 2026-05-31
**Status:** Completed
**Source:** User-approved acceptance criteria, technical plan, and production-readiness review derived from `CLI_ANALYSIS.md`.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver's CLI surface has several production-facing ergonomics and maintainability risks:

- Slice and handoff commands live as flat root commands instead of coherent namespaces.
- Some human errors and guidance still bypass the i18n catalog.
- Several read-only commands have partially implemented UX improvements that need baseline verification before further work.
- Write-capable commands need stronger dry-run, idempotency, progress, and safety evidence.
- `init`, `analyze`, and `doctor` still keep command orchestration inside `src/create-quiver/index.js`.

The current repository already contains related work from v35-v43. This spec must therefore start with a baseline/delta audit to avoid duplicate fixes and partial regressions.

## Objective

Harden the immediate CLI surface while preserving backwards compatibility:

- Audit current behavior against the approved criteria before implementation.
- Complete missing i18n coverage for human command errors.
- Add low-risk read-only UX improvements only where still missing.
- Improve safety and transparency for write-capable commands.
- Introduce `slice` and `handoff` namespaces with deprecated legacy aliases.
- Extract `init`, `analyze`, and `doctor` command orchestration into command modules without behavior drift.

## Scope

### Included

- `slice start|check|check-pr|scope|cleanup|refresh`.
- `handoff check|create`.
- Deprecated compatibility aliases for all existing root slice/handoff commands.
- i18n hardening for command errors and next-step text.
- Read-only UX quick wins after baseline/delta verification.
- Write-command feedback and safety hardening for `init`, `analyze`, `doctor`, `prepare`, and `migrate`.
- Pure command-module extraction for `init`, `analyze`, and `doctor`.
- Help, docs, tests, package-installed smoke coverage, and spec validation.

### Excluded

- Removing legacy root commands.
- Full migration to Commander.js/yargs.
- Full `commands/ai.js` modularization.
- New loop-closure commands such as `status`, `evidence list/show`, and `changelog`; those are covered by v47.
- Changing AI provider behavior or lifecycle semantics.

## Approved Acceptance Criteria

1. A baseline/delta matrix classifies every approved criterion as `present`, `partial`, `missing`, or `regression-risk` before implementation slices modify runtime code.
2. The matrix includes evidence paths and assigns every gap to one slice.
3. Human errors in `config`, `evidence`, `spec`, `graph`, `prepare`, and `ai` use i18n catalog keys or documented exceptions.
4. Static i18n checks catch newly introduced hardcoded command errors unless allowlisted.
5. JSON output remains parseable and does not receive localized human prose.
6. `flow --json` exposes a stable next-command field; if already present, tests lock the current contract and naming.
7. `dashboard --section`, `plan`, `graph`, `next`, and `evidence run` receive only missing read-only UX improvements identified by the baseline.
8. `init`, `analyze`, `doctor`, `prepare`, and `migrate` have explicit dry-run/no-write tests where applicable.
9. `init`, `analyze`, `doctor --fix`, and `migrate` report changed or planned files/actions clearly in human output.
10. Write-capable command tests cover idempotency or explain why idempotency is not applicable.
11. `slice start <slice.json>` is equivalent to `start-slice <slice.json>`.
12. `slice check <slice.json>` is equivalent to `check-slice <slice.json>`.
13. `slice check-pr <slice.json>` is equivalent to `check-pr <slice.json>`.
14. `slice scope <slice.json>` is equivalent to `check-scope <slice.json>`.
15. `slice cleanup <slice.json>` is equivalent to `cleanup-slice <slice.json>`.
16. `slice refresh` is equivalent to `refresh-active-slices`.
17. `handoff check <path.md>` is equivalent to `check-handoff <path.md>`.
18. `handoff create <spec-slug>` is equivalent to `new-handoff <spec-slug>`.
19. Legacy aliases remain functional and emit deprecation warnings only on stderr in human mode.
20. Legacy aliases emit no deprecation warnings to stdout and emit no warnings when JSON output is requested or documented as unsupported.
21. Help, docs, generated scripts, doctor checks, and package-installed smokes include both canonical commands and compatibility aliases where relevant.
22. `init`, `analyze`, and `doctor` orchestration moves into `commands/` modules with golden tests proving no behavior drift.
23. Final validation includes focused command tests, full `node --test`, package build, package-installed smoke, `git diff --check`, and `spec validate`.

## Baseline / Delta Matrix

Slice `slice-00-cli-surface-baseline-and-delta` classifies the approved v46 criteria against the current repository before runtime implementation. Status values are limited to `present`, `partial`, `missing`, and `regression-risk`.

| # | Requirement | Status | Evidence | Owning slice | Notes |
|---|---|---|---|---|---|
| 1 | Baseline/delta matrix exists before runtime implementation. | present | `specs/quiver-v46-cli-surface-ergonomics/SPEC.md` | slice-00 | This section is the baseline artifact. |
| 2 | Matrix includes evidence paths and assigns every gap to one slice. | present | `specs/quiver-v46-cli-surface-ergonomics/SPEC.md` | slice-00 | Non-present rows name the responsible implementation slice. |
| 3 | Human errors in `config`, `evidence`, `spec`, `graph`, `prepare`, and `ai` use i18n catalog keys or documented exceptions. | partial | `src/create-quiver/commands/config.js`, `src/create-quiver/commands/prepare.js`, `src/create-quiver/commands/graph.js`, `src/create-quiver/commands/spec.js`, `src/create-quiver/index.js`, `src/create-quiver/commands/ai.js`, `tests/commands/cli-contract.test.js` | slice-01 | Catalog-backed errors exist, but several command modules still build human English strings directly. |
| 4 | Static i18n checks catch newly introduced hardcoded command errors unless allowlisted. | partial | `src/create-quiver/lib/i18n/catalog.js`, `tests/commands/i18n-audit-matrix.test.js`, `src/create-quiver/commands/config.js`, `src/create-quiver/commands/graph.js` | slice-01 | Catalog completeness is tested, but hardcoded command-error scanning is not yet a complete guard. |
| 5 | JSON output remains parseable and does not receive localized human prose. | regression-risk | `tests/commands/cli-contract.test.js`, `tests/commands/flow.test.js`, `tests/commands/dashboard.test.js`, `tests/commands/i18n-audit-matrix.test.js` | slice-01, slice-02, slice-07 | Existing JSON coverage is strong for several commands; all v46 human-output changes must preserve stdout cleanliness. |
| 6 | `flow --json` exposes a stable next-command field; if already present, tests lock the current contract and naming. | present | `src/create-quiver/commands/flow.js`, `tests/commands/flow.test.js` | slice-02 | Current machine contract uses `nextCommand` and is asserted by tests. Do not rename without an additive compatibility decision. |
| 7 | `dashboard --section`, `plan`, `graph`, `next`, and `evidence run` receive only missing read-only UX improvements identified by baseline. | partial | `src/create-quiver/lib/dashboard.js`, `tests/commands/dashboard.test.js`, `docs/reference/commands.md`, `src/create-quiver/commands/plan.js`, `src/create-quiver/commands/graph.js`, `src/create-quiver/commands/next.js`, `src/create-quiver/index.js` | slice-02 | Dashboard sections and evidence separator docs exist; plan no-hours warning, graph empty-level guidance, graph JSON/format precedence docs, and next secondary-ready hints still need targeted verification/fixes. |
| 8 | `init`, `analyze`, `doctor`, `prepare`, and `migrate` have explicit dry-run/no-write tests where applicable. | partial | `src/create-quiver/index.js`, `src/create-quiver/commands/prepare.js`, `tests/commands/init-profiles.test.js`, `tests/lib/init-layout.test.js`, `tests/commands/doctor.test.js`, `README_FOR_AI.md` | slice-03 | Dry-run behavior exists in several paths, but v46 needs explicit no-write coverage across the named write-capable commands and documented exceptions for read-only commands. |
| 9 | `init`, `analyze`, `doctor --fix`, and `migrate` report changed or planned files/actions clearly in human output. | partial | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js`, `src/create-quiver/lib/doctor.js`, `tests/lib/init-layout.test.js`, `tests/commands/doctor.test.js` | slice-03 | Some summaries exist; v46 must verify changed/planned file/action reporting consistently for the named commands. |
| 10 | Write-capable command tests cover idempotency or explain why idempotency is not applicable. | partial | `tests/commands/**`, `tests/lib/**`, `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js` | slice-03 | Existing tests cover write paths unevenly; each write-capable command needs idempotency evidence or an explicit exception. |
| 11 | `slice start <slice.json>` is equivalent to `start-slice <slice.json>`. | missing | `src/create-quiver/index.js`, `tests/lib/init-layout.test.js`, `src/create-quiver/lib/init-layout.js` | slice-04 | `SUPPORTED_COMMAND_MODES` contains `start-slice` but no `slice` namespace. |
| 12 | `slice check <slice.json>` is equivalent to `check-slice <slice.json>`. | missing | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js` | slice-04 | Root alias exists; canonical namespace is absent. |
| 13 | `slice check-pr <slice.json>` is equivalent to `check-pr <slice.json>`. | missing | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js` | slice-04 | Root alias exists; canonical namespace is absent. |
| 14 | `slice scope <slice.json>` is equivalent to `check-scope <slice.json>`. | missing | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js` | slice-04 | Root alias exists; canonical namespace is absent. |
| 15 | `slice cleanup <slice.json>` is equivalent to `cleanup-slice <slice.json>`. | missing | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js` | slice-04 | Root alias exists; canonical namespace is absent. |
| 16 | `slice refresh` is equivalent to `refresh-active-slices`. | missing | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js`, `README_FOR_AI.md` | slice-04 | Root command exists; canonical namespace is absent. |
| 17 | `handoff check <path.md>` is equivalent to `check-handoff <path.md>`. | missing | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js` | slice-05 | Root alias exists; canonical namespace is absent. |
| 18 | `handoff create <spec-slug>` is equivalent to `new-handoff <spec-slug>`. | missing | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js` | slice-05 | Root alias exists; canonical namespace is absent. |
| 19 | Legacy aliases remain functional and emit deprecation warnings only on stderr in human mode. | missing | `src/create-quiver/index.js`, `tests/commands/cli-contract.test.js` | slice-04, slice-05 | Legacy commands are functional today, but no canonical alias deprecation warning layer exists yet. |
| 20 | Legacy aliases emit no deprecation warnings to stdout and emit no warnings when JSON output is requested or documented as unsupported. | missing | `src/create-quiver/index.js`, `tests/commands/cli-contract.test.js` | slice-04, slice-05 | Needs stderr-only and JSON-cleanliness assertions once warnings are introduced. |
| 21 | Help, docs, generated scripts, doctor checks, and package-installed smokes include both canonical commands and compatibility aliases where relevant. | partial | `src/create-quiver/index.js`, `src/create-quiver/lib/init-layout.js`, `src/create-quiver/lib/init-docs.js`, `src/create-quiver/lib/doctor.js`, `README_FOR_AI.md`, `docs/reference/commands.md`, `tests/lib/init-layout.test.js` | slice-04, slice-05, slice-07 | Current help/docs/scripts/checks use legacy root commands; canonical namespace docs and smoke coverage are missing. |
| 22 | `init`, `analyze`, and `doctor` orchestration moves into `commands/` modules with golden tests proving no behavior drift. | missing | `src/create-quiver/index.js`, `src/create-quiver/commands/`, `tests/commands/**` | slice-06 | Orchestration still lives in `index.js`; no `commands/init.js`, `commands/analyze.js`, or `commands/doctor.js` module extraction exists. |
| 23 | Final validation includes focused command tests, full `node --test`, package build, package-installed smoke, `git diff --check`, and `spec validate`. | partial | `specs/quiver-v46-cli-surface-ergonomics/EXECUTION_PLAN.md`, `specs/quiver-v46-cli-surface-ergonomics/EVIDENCE_REPORT.md` | slice-07 | Validation contract is planned; full final evidence remains pending until implementation slices complete. |

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | CLI surface baseline and delta | completed | none |
| slice-01 | i18n command error hardening | completed | slice-00 |
| slice-02 | Read-only UX quick wins | completed | slice-00, slice-01 |
| slice-03 | Write-command feedback and safety | completed | slice-00, slice-01 |
| slice-04 | Slice namespace compatibility | completed | slice-00, slice-01, slice-02 |
| slice-05 | Handoff namespace compatibility | completed | slice-00, slice-01 |
| slice-06 | Init/analyze/doctor command modules | completed | slice-00, slice-03 |
| slice-07 | Docs, tests, and release readiness | completed | slice-01, slice-02, slice-03, slice-04, slice-05, slice-06 |

## Guardrails

- Do not remove legacy commands.
- Do not contaminate stdout for machine-readable outputs.
- Do not implement v47/v48/v49 scope inside this spec.
- Do not mix behavior changes into the pure extraction slice.
- Prefer additive contracts and explicit deprecation warnings.
- Treat the current implemented state as source evidence, not as stale assumptions from `CLI_ANALYSIS.md`.

## Risks

- Parser changes can accidentally change root command behavior.
- Deprecation warnings can break automation if routed incorrectly.
- Existing i18n work can regress if new strings bypass the catalog.
- Write-capable command improvements can accidentally write during dry-run.
- Extracting command modules can change exports or test seams.

## Validation Strategy

- Focused command tests for every changed command.
- EN/ES human output tests for representative errors.
- JSON cleanliness tests for commands that support `--json`.
- Filesystem no-write assertions for dry-run paths.
- Package-installed smoke for `create-quiver` and `quiver`.
- `node --test`, `npm run package:quiver`, `git diff --check`, and `npx create-quiver spec validate specs/quiver-v46-cli-surface-ergonomics`.
