## Title

QUIVER-50: Audit Trust Foundation execution

## Summary

Executes the Quiver v50 Audit Trust Foundation spec across its implementation slices.

This PR turns audit-derived trust findings into production-ready behavior and documentation: runtime metadata, safer `migrate` writes, concrete security reporting, broader EN/ES error coverage, safe `init`/`analyze` progress feedback, contributor/architecture docs, and CI/docs validation gates.

## Scope

- Declares the verified Node runtime minimum and synchronizes package metadata.
- Adds pre-write safety for `migrate`, including no-TTY/CI-safe refusal and `--yes` automation.
- Documents a concrete private vulnerability reporting channel.
- Localizes covered user-facing CLI errors while preserving JSON stdout cleanliness and technical diagnostics.
- Adds transient TTY-only progress for `init` and `analyze` without emitting progress in JSON, CI, no-TTY, or `--no-color` paths.
- Expands contributor and architecture documentation around Quiver's real CLI/spec/slice workflow.
- Adds portable CI scripts, markdown lint/link checks with controlled non-flaky scope, package smoke coverage, and Windows `pwsh` path coverage.

## Files

- `.github/workflows/ci.yml`
- `.markdownlint.json`
- `.markdown-link-check.json`
- `package.json`
- `package-lock.json`
- `README.md`
- `CONTRIBUTING.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `SECURITY.md`
- `docs/CLI_UX_GUIDE.md`
- `docs/getting-started/installation.md`
- `docs/reference/commands.md`
- `scripts/ci/**`
- `src/create-quiver/**`
- `tests/**`
- `specs/quiver-v43-cli-i18n-audit-release-readiness/command-language-mode-matrix.json`
- `specs/quiver-v50-audit-trust-foundation/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`.
- npm with access to the committed lockfile.
- GitHub CLI `gh` only for PR creation, not for local validation.
- ShellCheck for CI validation of Bash scripts.
- Windows `pwsh` coverage is encoded in GitHub Actions; `pwsh` was not available on this local machine.

### Worktree Access

- Checkout this branch:

```bash
git checkout feature/QUIVER-50-audit-trust-foundation-execution
```

- Keep local audit artifacts and generated PDFs untracked; they are intentionally excluded from this PR.

### Run the Project

No long-running app server is required. Validate the CLI directly:

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation
```

### Use Cases

- Run `migrate --dry-run` and confirm it remains prompt-free and write-free.
- Run `migrate` without `--yes` in no-TTY automation and confirm it fails before writes.
- Run covered commands with `--lang es` and confirm human errors are localized without changing command snippets or JSON keys.
- Run `init`/`analyze` in non-TTY or `--no-color` mode and confirm transient progress text is suppressed.
- Run docs checks and confirm only the controlled public-docs scope is linted/linked.

### Technical Verification

```bash
npm ci
npm run docs:check
npm run test:ci -- tests/lib/paths.test.js
node --test
npm run package:quiver
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation
node bin/create-quiver.js check-slice specs/quiver-v50-audit-trust-foundation/slices/slice-07-ci-and-documentation-lint-baseline/slice.json --local
```

## Evidence

- `npm ci`: passed, 160 packages installed/audited, 0 vulnerabilities.
- `npm run docs:lint`: passed, 20 files, 0 markdownlint errors.
- `npm run docs:links`: passed, 20 files, local-link scope only.
- `npm run docs:check`: passed.
- `npm run test:ci -- tests/lib/paths.test.js`: passed, 10 tests, 0 failures.
- `node --test`: passed, 621 tests, 0 failures.
- `npm run package:quiver`: passed, package smoke `create-quiver-0.15.3.tgz`.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.
- `node bin/create-quiver.js check-slice .../slice-07-ci-and-documentation-lint-baseline/slice.json --local`: passed with the expected completed-slice warning.

## Rollback

Revert the QUIVER-50 commits on this branch. For partial rollback, revert the affected slice commit and rerun:

```bash
npm ci
node --test
npm run package:quiver
node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation
```

## Risks / Notes

- Local `pwsh` validation was not runnable because `pwsh` is not installed on this machine; GitHub Actions now includes a Windows-only `pwsh` smoke.
- External HTTP and `mailto:` links are ignored in the first docs link baseline to avoid flaky network gates; local documentation links are blocking.
- The root-level local audit/input files and generated PDF remain untracked and are intentionally excluded from the PR.
