# Evidence Report - Quiver v51 CLI Ergonomics and Automation Contracts

## Planning Evidence

- Source requirements: `REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md`.
- Approved plan: user-approved technical plan v4.
- Current branch inspection showed `status`, `slice`, `handoff`, `evidence list/show`, `demo spec-viewer`, and AI module fragmentation are already present.

## Baseline Evidence To Capture During Execution

- `node bin/create-quiver.js --help`
- `node bin/create-quiver.js flow --json`
- `node bin/create-quiver.js dashboard --section invalid --lang es`
- `node bin/create-quiver.js evidence list --json`
- namespace alias stdout/stderr behavior
- Windows `pwsh` command execution for portable scripts

## Validation Evidence

## slice-00-cli-contract-baseline

- `bin/create-quiver.js`: delegates to the `src/create-quiver` CLI implementation.
- `src/create-quiver/lib/cli/command-registry.js`: enumerates the public command surface for `status`, `flow`, `dashboard`, `plan`, `graph`, `evidence`, `demo`, `slice`, `handoff`, and `ai`.
- `src/create-quiver/commands/status.js` and `tests/commands/status.test.js`: `status` command exists with human and JSON contracts.
- `src/create-quiver/commands/slice.js` and `tests/commands/slice-namespace.test.js`: canonical `slice` namespace and legacy aliases exist with deprecation warnings on stderr.
- `src/create-quiver/commands/handoff.js` and `tests/commands/handoff-namespace.test.js`: canonical `handoff` namespace and legacy aliases exist with deprecation warnings on stderr.
- `src/create-quiver/commands/evidence.js`, `src/create-quiver/lib/evidence.js`, and `tests/commands/evidence.test.js`: evidence `run/list/show`, redaction, truncation, JSON, and path-safety contracts exist.
- `src/create-quiver/commands/demo.js` and `tests/commands/demo.test.js`: `demo spec-viewer` and `demo create spec-viewer` compatibility exists.
- `src/create-quiver/commands/ai.js` delegates to `src/create-quiver/commands/ai/{agents,diagnostics,execution,inspection,lifecycle,planner}.js`; AI fragmentation is already implemented.
- `src/create-quiver/commands/flow.js` and `tests/commands/flow.test.js`: `flow` is read-only and has JSON tests, but additive `next_command` still belongs to `slice-01`.
- `src/create-quiver/lib/dashboard.js` and `tests/commands/dashboard.test.js`: dashboard sections and JSON constraints are tested; invalid-section localization remains for `slice-02`.
- `tests/commands/plan.test.js` and `tests/commands/graph.test.js`: missing estimates and empty level filters are covered.
- `package.json`: legacy Bash scripts coexist with portable `quiver:*` scripts; Windows script policy remains for `slice-06`.
- Runtime code was not modified for this baseline slice.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`: passed.

## slice-01-flow-json-compatibility

- `src/create-quiver/commands/flow.js`: `baseReport` now emits `next_command` as an additive snake_case alias of the existing `nextCommand` field.
- `tests/commands/flow.test.js`: machine-readable tests cover both uninitialized and ready-slice states, asserting `next_command` and `nextCommand` remain equal.
- `docs/reference/commands.md`: documents `flow --json` compatibility for both fields.
- `specs/quiver-v43-cli-i18n-audit-release-readiness/command-language-mode-matrix.json`: records the newly documented `flow --json` command under a JSON coverage profile.
- `node --test tests/commands/flow.test.js`: passed, 17 tests.
- `node --test tests/commands/i18n-audit-matrix.test.js tests/commands/flow.test.js`: passed, 19 tests.
- `node --test`: passed, 622 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`: passed.

## slice-02-dashboard-section-validation-i18n

- `src/create-quiver/lib/dashboard.js`: existing invalid-section handling uses localized `dashboard.unsupported_section` for human output and English-only translation for JSON output.
- `src/create-quiver/lib/i18n/messages/en.js`: English help text now lists the supported dashboard sections.
- `src/create-quiver/lib/i18n/messages/es.js`: Spanish help text now lists the supported dashboard sections.
- `tests/commands/dashboard.test.js`: added EN/ES invalid-section assertions, supported-section list coverage, and JSON-safe invalid-section failure coverage.
- `tests/commands/cli-contract.test.js`: updated help contract to require the supported section list.
- `docs/reference/commands.md`: documents every supported dashboard section, including `overview`.
- `docs/COMMANDS.md.template`: keeps generated command docs aligned with the public reference.
- `npm run test:ci -- tests/commands/dashboard.test.js tests/commands/cli-contract.test.js tests/lib/i18n-catalog.test.js`: passed, 35 tests.
- `node --test`: passed, 624 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --local --gate validation`: passed.
- `node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --base main --strict`: passed.
- `node bin/create-quiver.js check-pr specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --base main`: passed spec, slice, overlap, validation gate, scope, branch, and clean-worktree checks; failed commit ownership because PR readiness still evaluates `origin/develop` even when the slice base is `main`. This is tracked by `slice-03-base-branch-resolution-policy`.
