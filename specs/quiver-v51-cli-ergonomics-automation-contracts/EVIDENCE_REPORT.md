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

## slice-03-base-branch-resolution-policy

- `src/create-quiver/lib/git.js`: adds shared base branch resolution helpers with explicit override precedence, Remote HEAD discovery, and fallback candidates `main`, `master`, and `develop`.
- `src/create-quiver/lib/readiness.js`: uses the shared resolver for slice readiness, scope checks, and PR readiness instead of hardcoded `origin/develop`.
- `src/create-quiver/lib/spec-worktrees.js`: uses the shared resolver for spec worktree base selection while preserving explicit slice/spec base metadata.
- `src/create-quiver/lib/lifecycle.js`: applies the shared resolver to slice cleanup and base freshness checks without changing slice branch fetch behavior.
- `src/create-quiver/lib/ai/github.js`: resolves default `ai pr` base from Remote HEAD when `--base` is omitted, while preserving the `gh pr create --base <branch>` argument contract.
- `src/create-quiver/index.js`: forwards `--base` only as an explicit override for `check-pr`, `ai pr`, `spec start`, and `spec close`.
- `src/create-quiver/lib/i18n/messages/en.js` and `src/create-quiver/lib/i18n/messages/es.js`: remove stale hardcoded `origin/develop` readiness text and localize generic base/ref messages.
- `docs/reference/commands.md` and `docs/COMMANDS.md.template`: document explicit `--base` precedence, Remote HEAD resolution, and fallback order.
- `tests/lib/git.test.js`: covers explicit override precedence, Remote HEAD defaulting, and `main`/`master`/`develop` fallback order.
- `tests/lib/check-slice.test.js`: covers `check-pr` using the slice base branch instead of hardcoded `origin/develop`.
- `tests/lib/ai-github.test.js`: covers `ai pr` defaulting to Remote HEAD when `--base` is omitted.
- `tests/lib/scope.test.js`: existing coverage verifies slice `git.base_branch` and explicit base override behavior for scope checks.
- `tests/lib/lifecycle.test.js`: confirms lifecycle start/cleanup output remains valid after restoring remote slice branch detection.
- `node --test tests/lib/git.test.js tests/commands/spec-close.test.js tests/commands/ai-pr.test.js tests/lib/check-slice.test.js tests/lib/scope.test.js tests/lib/ai-github.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js`: passed, 77 tests.
- `node --test tests/lib/lifecycle.test.js`: passed, 12 tests.
- `node --test`: passed, 629 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --local --gate validation`: passed.
- `node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --base main --strict`: passed.
- `node bin/create-quiver.js check-pr specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --base main`: passed.

## slice-04-next-plan-graph-ux-edge-cases

- `tests/commands/next.test.js`: existing coverage validates `next --auto-start` rejects no-TTY sessions and can start through an injected confirmation prompt.
- `src/create-quiver/commands/plan.js`: adds a localized human-only note when pending slices have no positive `estimated_hours`; JSON output still contains numeric `hours` and no human prose.
- `tests/commands/plan.test.js`: covers EN/ES missing-estimates notes, `total_hours`/`hours` as `0`, and JSON output without human notes.
- `src/create-quiver/commands/graph.js`: adds a localized human empty state for `graph --level <n>` when that level has no slices.
- `tests/commands/graph.test.js`: covers empty-level EN/ES output, JSON-safe empty `levels`/`conflicts`, and `--json` precedence over `--format mermaid`.
- `src/create-quiver/lib/i18n/messages/en.js` and `src/create-quiver/lib/i18n/messages/es.js`: add localized plan missing-estimates and graph empty-level messages.
- `docs/reference/commands.md`, `docs/CLI_UX_GUIDE.md`, and `docs/COMMANDS.md.template`: document plan missing estimates, graph empty-level behavior, `next --auto-start` TTY behavior, and `graph --json` precedence over human render formats.
- `node --test tests/commands/next.test.js tests/commands/plan.test.js tests/commands/graph.test.js tests/lib/i18n-catalog.test.js`: passed, 37 tests.
- `node --test`: passed, 632 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.

## slice-05-evidence-robustness-path-safety

- `src/create-quiver/lib/evidence.js`: now resolves explicit output/read paths through project-root and realpath checks, rejects traversal and symlink escapes, preserves failure evidence, records signal metadata, and exposes safe `list`/`show` helpers.
- `src/create-quiver/commands/evidence.js`: supports `evidence list` and `evidence show` with human output and parseable `--json` output.
- `src/create-quiver/index.js`: parses `evidence run|list|show`, validates positional arguments, and documents the expanded help surface.
- `src/create-quiver/lib/i18n/messages/en.js` and `src/create-quiver/lib/i18n/messages/es.js`: keep evidence list/show human messages and missing-subcommand guidance aligned.
- `tests/commands/evidence.test.js`: covers parseable JSON list/show and rejects traversal output before command execution.
- `tests/lib/evidence.test.js`: covers redaction, truncation, failure evidence, signal exit code metadata, symlink escape rejection, safe listing, and safe show behavior.
- `tests/commands/cli-contract.test.js`: covers the expanded help contract for `evidence list` and `evidence show`.
- `docs/reference/commands.md` and `docs/COMMANDS.md.template`: document evidence run/list/show, safe path policy, JSON usage, redaction/truncation, and signal exit-code behavior.
- `specs/quiver-v43-cli-i18n-audit-release-readiness/command-language-mode-matrix.json`: records evidence run/list/show coverage for the documented command reference.
- `node --test tests/commands/evidence.test.js tests/lib/evidence.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js`: passed, 38 tests.
- `node --test tests/commands/i18n-audit-matrix.test.js tests/commands/evidence.test.js tests/lib/evidence.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js`: passed, 40 tests.
- `node --test`: passed, 638 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.

## slice-06-namespace-compatibility-windows-scripts

- `src/create-quiver/index.js`: adds canonical `slice start|check|pr|scope|cleanup|refresh-active` and `handoff check|new` namespace parsing while mapping to existing handlers.
- `src/create-quiver/index.js`: preserves legacy top-level aliases and emits deprecation guidance to stderr only; warnings are suppressed for `--json` output.
- `package.json`: adds PowerShell-safe `quiver:*` scripts that call the Node CLI directly and keeps existing Bash scripts as legacy compatibility paths.
- `src/create-quiver/lib/init-layout.js`: generated project scripts now use canonical namespaces for slice and handoff commands.
- `.github/workflows/ci.yml`: extends the Windows PowerShell smoke with canonical namespace commands and the portable `quiver:check-handoff` npm script.
- `README.md`, `CONTRIBUTING.md`, `docs/reference/commands.md`, and `docs/COMMANDS.md.template`: document canonical namespaces, legacy alias policy, portable script guidance, and Windows-safe command paths.
- `src/create-quiver/lib/i18n/messages/es.js`: adds Spanish help descriptions for the new canonical namespace entries.
- `specs/quiver-v43-cli-i18n-audit-release-readiness/command-language-mode-matrix.json`: records canonical namespace command coverage for the i18n audit matrix.
- `tests/commands/slice-namespace.test.js`: validates canonical/legacy slice parity, stderr-only legacy warnings, JSON warning suppression, and unsupported subcommand rejection.
- `tests/commands/handoff-namespace.test.js`: validates canonical/legacy handoff parity, `handoff new` compatibility, and unsupported subcommand rejection.
- `tests/commands/parser-contract.test.js`: validates help coverage and package script portability contracts.
- `tests/commands/cli-contract.test.js` and `tests/lib/init-layout.test.js`: align public help and generated script contracts with canonical namespaces.
- `node --test tests/commands/slice-namespace.test.js tests/commands/handoff-namespace.test.js tests/commands/parser-contract.test.js tests/commands/cli-contract.test.js tests/lib/init-layout.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js`: passed, 40 tests.
- `npm ci`: passed; `package-lock.json` did not require changes because root package scripts are not represented in lockfile metadata.
- `node bin/create-quiver.js slice check --local specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-00-cli-contract-baseline/slice.json && node bin/create-quiver.js handoff check specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/EXECUTION_BRIEF.md && npm run quiver:check-handoff -- specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/EXECUTION_BRIEF.md`: passed after dependency installation.
- `npm run docs:check`: passed.
- `git diff --check`: passed.
- `node --test`: passed, 646 tests.
- Windows PowerShell validation is configured in CI; local execution was performed on macOS using the same Node CLI entrypoints and package script contracts.
