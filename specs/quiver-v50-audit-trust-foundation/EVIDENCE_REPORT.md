# Evidence Report - Quiver v50 Audit Trust Foundation

## Planning Evidence

- Source requirements: `REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md`.
- Approved plan: user-approved technical plan v4.
- Repository convention inspected from `specs/quiver-v49-parser-modernization`.

## Baseline Evidence To Capture During Execution

- `node bin/create-quiver.js --help`
- `node --test`
- `npm ci`
- `.github/workflows/ci.yml`
- `package.json` and `package-lock.json`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `docs/CLI_UX_GUIDE.md`
- current command behavior for `migrate`, `init`, `analyze`, i18n errors, JSON/no-TTY/CI flows.

## Validation Evidence

## slice-00-audit-baseline-and-resolved-findings

- `node bin/create-quiver.js --help`: captured current public command surface, compatibility aliases, scoped options, and `--yes` scope.
- `node bin/create-quiver.js migrate --help`: current help falls back to global help and lists `migrate` as dry-run capable.
- `package.json`: no `engines` field is declared; `package-lock.json` exists and must remain synchronized when package metadata changes.
- `src/create-quiver/index.js`: `runMigrate` supports `--dry-run` and emits write warnings, but non-dry-run performs write side effects without an explicit confirmation prompt.
- `SECURITY.md`: asks for private reporting but does not name a concrete private channel.
- `CONTRIBUTING.md`: current contributor guidance is minimal.
- `ARCHITECTURE.md` and `docs/ARCHITECTURE.md`: absent.
- `.github/workflows/ci.yml`: CI runs `npm ci`, ShellCheck, slice-template validation, cross-platform smoke, and tiered pack smoke, but does not yet include full portable `node --test`, docs lint/link checks, or explicit Windows `pwsh` coverage.
- `src/create-quiver/lib/i18n/messages/{en,es}.js`: EN/ES catalogs exist; direct user-facing English errors remain in command paths and libraries for later audit.
- `src/create-quiver/lib/cli/ux.js`, `src/create-quiver/commands/init.js`, and `src/create-quiver/commands/analyze.js`: UX primitives and summaries exist; safe progress/spinner use is not yet consistently applied to `init`/`analyze`.
- Runtime code was not modified for this baseline slice.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.

## slice-01-runtime-minimum-and-package-metadata

- `package-lock.json` dependency metadata shows `@clack/core@1.3.1` and `@clack/prompts@1.4.0` both require Node `>= 20.12.0`, so the project cannot truthfully declare a lower supported minimum while keeping current dependencies.
- `npx -y node@20.12.0 --version`: passed, returned `v20.12.0`.
- `package.json` declares `engines.node: >=20.12.0`.
- `package-lock.json` root package metadata includes the same `engines.node` value.
- `README.md` and `docs/getting-started/installation.md` document Node `>=20.12.0`.
- `.github/workflows/ci.yml` adds a `minimum-node` job using Node `20.12.0`, `npm ci`, and `node --test`.
- `npm ci`: passed, added 7 packages and found 0 vulnerabilities.
- `node --test`: passed, 612 tests, 0 failures.
- `npx -y node@20.12.0 --test`: passed, 612 tests, 0 failures. Local npm emitted a compatibility warning because npm `11.12.1` does not support Node `20.12.0`, but the Node 20.12.0 runtime test suite completed successfully.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.

## slice-02-migrate-write-safety-contract

- `src/create-quiver/index.js`: `runMigrate` is now async and calls `confirmMigrateWrite` before `packTemplate`, `mergeDirectoryTree`, `initializeProjectDocs`, `updateStateForMigrate`, or `installSelfAsDevDep`.
- `migrate --dry-run`: remains prompt-free and write-free because it returns before confirmation.
- `migrate --yes`: maps to the existing `force` parser flag and bypasses the prompt for automation.
- no-TTY/CI without `--yes`: fails before writes with actionable guidance to run `migrate --dry-run` or pass `--yes`; JSON mode keeps stdout empty on that failure path.
- TTY cancellation: covered through exported `runMigrate` with injected `promptConfirm: () => false`; snapshot comparison proves the project tree remains unchanged.
- EN/ES messages: added `migrate.confirm.required`, `migrate.confirm.prompt`, and `migrate.confirm.declined`; Spanish no-TTY error and Spanish `--yes` help are covered in tests.
- `docs/reference/commands.md` and `docs/CLI_UX_GUIDE.md`: document `migrate --dry-run`, `migrate`, and `migrate --yes` safety semantics.
- `specs/quiver-v43-cli-i18n-audit-release-readiness/command-language-mode-matrix.json`: updated to include documented command `migrate --yes`; this file was added to the slice scope because `tests/commands/i18n-audit-matrix.test.js` enforces command-reference coverage.
- `node --test tests/commands/cli-contract.test.js`: passed.
- `node --test tests/commands/init-profiles.test.js`: passed.
- `node --test tests/commands/i18n-audit-matrix.test.js`: passed after adding `migrate --yes` to the matrix.
- `node --test`: passed, 614 tests, 0 failures.
- `npx -y node@20.12.0 --test tests/commands/cli-contract.test.js tests/commands/init-profiles.test.js tests/commands/i18n-audit-matrix.test.js`: passed, 39 tests, 0 failures.
- `git diff --check`: passed.

## slice-03-security-reporting-channel

- `gh repo view FabriJuncal/quiver --json nameWithOwner,isPrivate,viewerPermission,url`: verified repository visibility, URL, and ADMIN permission for inspection.
- `gh api repos/FabriJuncal/quiver/private-vulnerability-reporting --jq '.'`: returned `{"enabled":false}`; GitHub Private Vulnerability Reporting is not currently active.
- `SECURITY.md`: replaced vague private reporting wording with the concrete email channel `juncalfabri@gmail.com`, required report details, and owner action to enable GitHub Private Vulnerability Reporting before making it the primary channel.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v50-audit-trust-foundation/slices/slice-03-security-reporting-channel/slice.json --local`: passed with the expected completed-slice warning after marking the slice completed.

## slice-04-user-facing-i18n-error-coverage

- `src/create-quiver/commands/config.js`: localized unsupported language, unsupported section, and unsupported language-command errors through EN/ES catalog keys.
- `src/create-quiver/index.js`: passed resolved language into `runConfig` and localized parser-level `config` section/command errors plus the `spec` missing-directory wrapper.
- `src/create-quiver/commands/evidence.js` and `src/create-quiver/lib/evidence.js`: localized missing evidence subcommand and missing command-after-`--` errors while preserving the direct library fallback for existing callers.
- `src/create-quiver/commands/graph.js`: localized unsupported graph format errors before JSON output is emitted.
- `src/create-quiver/commands/spec.js`: localized missing/unknown spec directory, spec validation failure wrapper, spec-create collision, interactive TTY requirement, declined approval, and review terminal/cancellation wrappers.
- `src/create-quiver/lib/i18n/messages/{en,es}.js`: added matching EN/ES keys; catalog completeness remains enforced by `tests/lib/i18n-catalog.test.js`.
- Covered hardcoded error audit: no `throw new Error` user-facing wrapper remains hardcoded in `commands/{config,evidence,graph,spec}.js` or `lib/evidence.js` outside catalog-backed messages.
- Allowlist: `spec validate` internal diagnostics remain technical validator strings because they include field names, file paths, JSON parser messages, strict-warning labels, and schema terminology that tests already treat as stable developer diagnostics; machine-readable JSON keys and command/path snippets are intentionally not localized.
- `src/create-quiver/commands/prepare.js`: inspected; no direct user-facing throw path was changed in this slice.
- `src/create-quiver/commands/ai-core.js`: expected-read path from the brief does not exist in the current repo; AI command/provider dynamic errors remain outside this covered wrapper set and were not modified in this slice.
- `node --test tests/commands/config-language.test.js tests/commands/evidence.test.js tests/commands/graph.test.js tests/commands/spec-validate.test.js tests/commands/spec-create.test.js tests/lib/i18n-catalog.test.js tests/commands/i18n-audit-matrix.test.js`: passed, 51 tests, 0 failures.
- `node --test tests/lib/i18n-catalog.test.js`: passed, 7 tests, 0 failures.
- `node --test tests/commands/i18n-audit-matrix.test.js`: passed, 2 tests, 0 failures.
- `node --test`: passed, 619 tests, 0 failures.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v50-audit-trust-foundation/slices/slice-04-user-facing-i18n-error-coverage/slice.json --local`: passed with the expected completed-slice warning after marking the slice completed.
- Manual dirty-scope check against `slice-04` `allowed_write_paths`: passed, 18 files within scope.

## slice-05-init-analyze-progress-and-summaries

- `src/create-quiver/index.js`: added an internal command-progress helper using `createUx.withSpinner(..., { echo: false })` so disabled spinner paths do not emit fallback progress lines.
- `analyze`: now wraps scan, artifact write, AI context refresh, and state update phases in transient progress; final human summary lines are unchanged.
- `init`: now wraps template preparation, optional compatibility-template export, docs/language writes, and optional package-install check in transient progress; final install/next-step summary lines are unchanged.
- Progress safety: progress can run only when `createUx` considers the output a safe human TTY and is additionally disabled for `--no-color`; JSON, CI, and no-TTY paths do not receive progress fallback text.
- Current layout note: `src/create-quiver/commands/init.js` and `src/create-quiver/commands/analyze.js` from the original expected path list do not exist in this repo; both command flows live in `src/create-quiver/index.js`.
- `src/create-quiver/lib/i18n/messages/{en,es}.js`: added localized progress messages for `init` and `analyze`.
- `tests/commands/analyze.test.js`: covers safe TTY spinner events separately from final summary output and verifies `--no-color` suppresses transient progress.
- `tests/commands/init-profiles.test.js`: verifies non-TTY `init` output does not contain transient progress messages while existing generated layout assertions still pass.
- `node --test tests/commands/analyze.test.js`: passed, 7 tests, 0 failures.
- `node --test tests/commands/init-profiles.test.js`: passed, 23 tests, 0 failures.
- `node --test tests/lib/cli-ux.test.js tests/lib/i18n-catalog.test.js`: passed, 17 tests, 0 failures.
- `node --test`: passed, 621 tests, 0 failures.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v50-audit-trust-foundation/slices/slice-05-init-analyze-progress-and-summaries/slice.json --local`: passed with the expected completed-slice warning after marking the slice completed.
- Manual dirty-scope check against `slice-05` `allowed_write_paths`: passed, 10 files within scope.

## slice-06-contributor-and-architecture-docs

- `node bin/create-quiver.js --help`: current command surface captured; docs use existing commands such as `start-slice`, `check-slice`, `check-pr`, `check-handoff`, `new-handoff`, `cleanup-slice`, `check-scope`, and `refresh-active-slices`.
- `CONTRIBUTING.md`: expanded setup, workflow, spec/slice convention, validation, PR headings, templates/examples, and package boundary guidance.
- `ARCHITECTURE.md`: created real architecture guide covering entrypoints, command layer, library layer, spec/slice structure, generated project contract, templates/localization, package boundary, tests, CI, and design constraints.
- `ROADMAP.md`: added a note explaining that `vNN` labels are internal spec identifiers unless a section explicitly states an npm release.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v50-audit-trust-foundation/slices/slice-06-contributor-and-architecture-docs/slice.json --local`: passed with the expected completed-slice warning after marking the slice completed.
