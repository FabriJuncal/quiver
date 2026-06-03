# PR - QUIVER-51-06 - Namespace compatibility and Windows npm scripts

## Title

QUIVER-51-06 namespace compatibility and Windows npm scripts

## Summary

Adds canonical `slice` and `handoff` CLI namespaces while preserving legacy aliases, protects JSON stdout from deprecation warnings, and makes recommended package scripts portable for PowerShell users. Existing Bash scripts remain available as legacy compatibility paths.

## PR Policy

- [x] One slice only.
- [ ] Grouped PR exception: at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [x] No behavior changes in a grouped PR.
- [x] No mixed docs with UI, backend, refactor, or performance work.
- [x] Separate evidence for this slice is recorded in `EVIDENCE_REPORT.md`.
- [x] Whole PR is revertible without leaving partial state.

Individual PR required classification: functional CLI behavior, package scripts, tests, docs, audit matrix, and CI smoke coverage.

### Merge Policy

- [x] Human merge expected.
- [ ] Assisted auto-merge explicitly authorized for this PR or documented category.
- [ ] Assisted auto-merge conditions met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is not requested.

## Scope

- Add canonical `slice start|check|pr|scope|cleanup|refresh-active` parser support.
- Add canonical `handoff check|new` parser support.
- Preserve legacy top-level aliases including `start-slice`, `check-slice`, `check-pr`, `check-scope`, `cleanup-slice`, `refresh-active-slices`, `check-handoff`, and `new-handoff`.
- Emit legacy alias guidance to stderr only, and suppress it for `--json`.
- Add portable root `quiver:*` npm scripts that use the Node CLI entrypoint.
- Keep existing Bash scripts as legacy compatibility scripts.
- Update generated project package scripts to use canonical namespaces.
- Update Windows CI smoke coverage for canonical namespaces and portable package scripts.
- Update command docs, onboarding docs, generated command template, Spanish help descriptions, and i18n audit matrix coverage.

## Files

- `.github/workflows/ci.yml`
- `CONTRIBUTING.md`
- `README.md`
- `docs/COMMANDS.md.template`
- `docs/reference/commands.md`
- `package.json`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `src/create-quiver/lib/init-layout.js`
- `tests/commands/cli-contract.test.js`
- `tests/commands/handoff-namespace.test.js`
- `tests/commands/parser-contract.test.js`
- `tests/commands/slice-namespace.test.js`
- `tests/lib/init-layout.test.js`
- `specs/quiver-v43-cli-i18n-audit-release-readiness/command-language-mode-matrix.json`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/STATUS.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/slice.json`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/CLOSURE_BRIEF.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by the repo.
- npm.
- Git.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver
git switch feature/QUIVER-51-06-v51-namespace-windows-scripts
```

### Run the Project

No runtime server is required. This is CLI behavior, package script, docs, CI configuration, and spec evidence.

### Use Cases

#### Case 1: canonical slice namespace

1. Run `node bin/create-quiver.js slice check --local specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-00-cli-contract-baseline/slice.json`.
2. Inspect stdout and stderr.

**Expected result:** command succeeds with the same behavior as the legacy `check-slice` command and no legacy warning appears.

#### Case 2: legacy alias warning stays automation-safe

1. Run `node bin/create-quiver.js check-slice --local specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-00-cli-contract-baseline/slice.json`.
2. Run `node bin/create-quiver.js check-slice --json --local specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-00-cli-contract-baseline/slice.json`.
3. Parse JSON stdout from the second command.

**Expected result:** legacy human command emits deprecation guidance on stderr only; JSON stdout remains parseable and does not include the warning.

#### Case 3: canonical handoff namespace and portable npm script

1. Run `node bin/create-quiver.js handoff check specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/EXECUTION_BRIEF.md`.
2. Run `npm run quiver:check-handoff -- specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/EXECUTION_BRIEF.md`.

**Expected result:** both commands succeed using the canonical handoff path without requiring Bash.

#### Case 4: unsupported namespace subcommand fails before execution

1. Run `node bin/create-quiver.js slice unknown specs/example/slice.json`.
2. Run `node bin/create-quiver.js handoff unknown specs/example/EXECUTION_BRIEF.md`.

**Expected result:** both commands fail with parser-level unsupported subcommand errors before command execution.

### Technical Verification

```bash
node --test tests/commands/slice-namespace.test.js
node --test tests/commands/handoff-namespace.test.js
node --test tests/commands/parser-contract.test.js
node --test tests/commands/slice-namespace.test.js tests/commands/handoff-namespace.test.js tests/commands/parser-contract.test.js tests/commands/cli-contract.test.js tests/lib/init-layout.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js
npm ci
node bin/create-quiver.js slice check --local specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-00-cli-contract-baseline/slice.json
node bin/create-quiver.js handoff check specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/EXECUTION_BRIEF.md
npm run quiver:check-handoff -- specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/EXECUTION_BRIEF.md
node --test
npm run docs:check
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts
node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/slice.json --local --gate validation
node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/slice.json --base main --strict
node bin/create-quiver.js check-pr specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/slice.json --base main
```

## Evidence

- `node --test tests/commands/slice-namespace.test.js tests/commands/handoff-namespace.test.js tests/commands/parser-contract.test.js tests/commands/cli-contract.test.js tests/lib/init-layout.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js`: passed, 40 tests.
- `npm ci`: passed; no package-lock update required.
- `node bin/create-quiver.js slice check --local specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-00-cli-contract-baseline/slice.json && node bin/create-quiver.js handoff check specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/EXECUTION_BRIEF.md && npm run quiver:check-handoff -- specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-06-namespace-compatibility-windows-scripts/EXECUTION_BRIEF.md`: passed after dependency installation.
- `npm run docs:check`: passed.
- `git diff --check`: passed.
- `node --test`: passed, 646 tests.

## Rollback

1. Revert this slice commit with `git revert <commit-sha>`.
2. Run the technical verification commands above.
3. Confirm legacy aliases still work and canonical namespace additions, portable script updates, docs, tests, and CI smoke changes are removed.

## Risks / Notes

- Legacy aliases intentionally remain available; this PR does not remove or hard-fail legacy command names.
- Deprecation guidance is intentionally not printed for JSON mode to preserve machine-readable stdout.
- Local Windows shell execution was not run on this macOS workspace; the Windows PowerShell smoke is configured in CI.
- Existing Bash scripts are retained as legacy paths, while recommended `quiver:*` scripts use Node CLI entrypoints.
