# Quiver v50 - Audit Trust Foundation

**Date:** 2026-06-01
**Status:** Planned
**Source:** User-approved plan v4 derived from `REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md`.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

The audit identified trust gaps around write-safety, runtime metadata, security reporting, user-facing i18n, onboarding feedback, contributor documentation, and CI/docs validation. Several related findings are already implemented in the current branch and must be closed by evidence instead of reimplementation.

## Objective

Establish a production-ready trust baseline for Quiver without broad rewrites:

- Verify current audit findings before changing behavior.
- Declare a real Node runtime minimum.
- Protect `migrate` from unintended writes.
- Provide a concrete private security reporting channel.
- Complete EN/ES coverage for user-facing errors.
- Improve `init` and `analyze` feedback without breaking automation.
- Make contributor and architecture docs usable.
- Harden CI and docs lint with controlled, non-flaky gates.

## Scope

### Included

- Audit baseline and already-resolved finding classification.
- Runtime minimum verification and package metadata.
- `migrate` write-safety and `--yes` contract.
- Security reporting channel documentation/evidence.
- User-facing i18n error coverage for commands and invoked libs.
- `init`/`analyze` progress and summaries.
- Contributor and architecture documentation.
- CI, docs lint, lockfile, and portable test baseline.

### Excluded

- Commander.js/yargs migration.
- TypeScript migration.
- Parser rewrite.
- Shell completion.
- Global async I/O migration.
- Alias removal.
- npm publish automation.

## Approved Acceptance Criteria

1. All audit findings in this spec are classified as `implemented`, `partial`, `missing`, or `not applicable` before implementation.
2. `package.json` declares a verified Node minimum and any package changes keep `package-lock.json` synchronized.
3. `migrate` requires explicit confirmation before side effects unless `--yes` or `--dry-run` is used.
4. `SECURITY.md` provides a concrete private vulnerability reporting channel with evidence or documented owner confirmation.
5. User-facing errors in covered command paths respect EN/ES i18n and keep JSON stdout clean.
6. `init` and `analyze` show progress only where safe and preserve automation/no-TTY/CI behavior.
7. Contributor docs explain setup, tests, smokes, commits, PRs, architecture, templates, examples, and real spec structure.
8. CI uses portable test commands, validates docs with controlled lint/link checks, runs `npm ci`, and includes Windows `pwsh` coverage.

## Execution Baseline - slice-00

| Finding | Current state | Evidence | Action |
|---|---|---|---|
| Runtime minimum metadata | missing | `package.json` has `dependencies` but no `engines`; `package-lock.json` exists. | Implement in `slice-01-runtime-minimum-and-package-metadata`; keep lockfile synchronized. |
| `migrate` write-safety confirmation | partial | `runMigrate` supports `--dry-run` and writes warning text, but non-dry-run proceeds to filesystem writes without an explicit prompt; global help scopes `--yes` only to `init, slice cleanup`. | Implement confirmation and `--yes` contract in `slice-02-migrate-write-safety-contract`. |
| Private security reporting channel | partial | `SECURITY.md` says to report privately but does not provide a concrete email, GitHub private vulnerability reporting path, or owner-confirmed channel. | Implement in `slice-03-security-reporting-channel`. |
| User-facing i18n error coverage | partial | EN/ES message catalogs exist in `src/create-quiver/lib/i18n/messages/{en,es}.js`, but direct English errors remain in command paths and invoked libraries. | Implement covered command/library message audit in `slice-04-user-facing-i18n-error-coverage`. |
| `init` / `analyze` progress and summaries | partial | `init` has interactive summaries through `createUx`; `analyze` prints direct summaries; no safe spinner/progress contract is used for these write paths. | Implement safe TTY-only progress and stable summaries in `slice-05-init-analyze-progress-and-summaries`. |
| Contributor and architecture docs | partial | `CONTRIBUTING.md` is minimal; no `ARCHITECTURE.md` or `docs/ARCHITECTURE.md` exists. | Implement in `slice-06-contributor-and-architecture-docs`. |
| CI and docs validation baseline | partial | `.github/workflows/ci.yml` runs `npm ci`, ShellCheck, slice-template validation, cross-platform smoke, and tiered pack smoke; it does not run full portable `node --test`, docs lint/link checks, or explicit Windows `pwsh` coverage. | Implement in `slice-07-ci-and-documentation-lint-baseline`. |
| Package safety against local audit artifacts | implemented | `.npmignore` excludes `*.pdf`, `.DS_Store`, `tests`, examples, package lock, and CI scripts; package safety code also rejects env/secrets/tool state. | Close with evidence only; do not reimplement in v50 unless a later slice touches packaging. |
| Parser/help compatibility baseline | implemented | `node bin/create-quiver.js --help` shows scoped help and compatibility aliases from v49. | Preserve current command/help contracts in all v50 changes. |

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Audit baseline and already-resolved findings | completed | none |
| slice-01 | Runtime minimum and package metadata | planned | slice-00 |
| slice-02 | Migrate write-safety contract | planned | slice-00 |
| slice-03 | Security reporting channel | planned | slice-00 |
| slice-04 | User-facing i18n error coverage | planned | slice-00 |
| slice-05 | Init/analyze progress and summaries | planned | slice-00, slice-04 |
| slice-06 | Contributor and architecture docs | planned | slice-00 |
| slice-07 | CI and documentation lint baseline | planned | slice-01, slice-06 |

## Guardrails

- Do not reimplement findings already implemented; close them with evidence/tests/docs only.
- Do not write files in `migrate` before confirmation.
- Do not localize machine-readable JSON keys.
- Do not emit spinner/progress frames in JSON, no-TTY, `CI=true`, or `--no-color`.
- Do not introduce flaky external link checks as blocking CI gates.
- Do not publish or package local audit files, PDFs, secrets, `.DS_Store`, worktrees, or tool state.

## Required Production Gates

- `npm ci`
- portable test runner, not shell-expanded globs
- targeted command tests per slice
- `node bin/create-quiver.js --help`
- stdout/stderr separation for warnings, errors, JSON, and prompts
- EN/ES validation for new human messages
- `npm pack` or package smoke where package contents change
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`

## Open Decisions

- Node minimum real version.
- Final security channel: GitHub private vulnerability reporting or email fallback.
- Initial blocking scope for markdown lint and link checks.
- Whether external link checks block or only report in the first CI slice.
