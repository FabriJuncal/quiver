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
