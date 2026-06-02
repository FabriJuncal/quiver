# PR - QUIVER-51-05 - Evidence robustness and path safety

## Title

QUIVER-51-05 evidence robustness and path safety

## Summary

Hardens `evidence run/list/show` for production failure modes without changing the existing evidence Markdown contract. The slice preserves child exit codes, writes evidence on failures, records signal metadata, enforces safe project-local output/read paths, keeps redaction/truncation behavior, and documents JSON list/show usage.

## PR Policy

- [x] One slice only.
- [ ] Grouped PR exception: at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [x] No behavior changes in a grouped PR.
- [x] No mixed docs with UI, backend, refactor, or performance work.
- [x] Separate evidence for this slice is recorded in `EVIDENCE_REPORT.md`.
- [x] Whole PR is revertible without leaving partial state.

Individual PR required classification: functional CLI behavior, tests, docs, and audit matrix coverage.

### Merge Policy

- [x] Human merge expected.
- [ ] Assisted auto-merge explicitly authorized for this PR or documented category.
- [ ] Assisted auto-merge conditions met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is not requested.

## Scope

- Preserve `evidence run` child exit-code behavior for successful and failing commands.
- Keep writing evidence when the wrapped command exits with a non-zero status.
- Record signal termination metadata and return standard `128 + signal` exit codes for signaled processes.
- Add safe `evidence list` and `evidence show` helpers with parseable `--json` output.
- Reject output/read path traversal and symlink escapes before execution or reads.
- Preserve redaction and truncation.
- Update CLI help, command docs, and i18n audit matrix coverage.

## Files

- `src/create-quiver/commands/evidence.js`
- `src/create-quiver/lib/evidence.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/cli-contract.test.js`
- `tests/commands/evidence.test.js`
- `tests/lib/evidence.test.js`
- `docs/reference/commands.md`
- `docs/COMMANDS.md.template`
- `specs/quiver-v43-cli-i18n-audit-release-readiness/command-language-mode-matrix.json`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/STATUS.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-05-evidence-robustness-path-safety/slice.json`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-05-evidence-robustness-path-safety/CLOSURE_BRIEF.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-05-evidence-robustness-path-safety/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by the repo.
- npm.
- Git.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver
git switch feature/QUIVER-51-05-v51-evidence-robustness
```

### Run the Project

No runtime server is required. This is CLI behavior, tests, docs, and spec evidence.

### Use Cases

#### Case 1: failing command still writes evidence

1. Run `node bin/create-quiver.js evidence run --output .quiver/evidence/failure.md -- node -e "console.error('failing command'); process.exit(7)"`.
2. Inspect `.quiver/evidence/failure.md`.

**Expected result:** CLI exits with code `7`; evidence file exists and contains `Exit code: 7` plus captured stderr.

#### Case 2: JSON list/show contract

1. Run `node bin/create-quiver.js evidence run -- node -e "console.log('json evidence')"`.
2. Run `node bin/create-quiver.js evidence list --json`.
3. Run `node bin/create-quiver.js evidence show <path-from-list> --json`.
4. Parse both JSON outputs.

**Expected result:** both commands emit parseable JSON; `show` includes the evidence content and parsed metadata.

#### Case 3: unsafe output path is rejected before command execution

1. Run `node bin/create-quiver.js evidence run --output ../escape.md -- node -e "require('fs').writeFileSync('marker.txt','ran')"`.
2. Inspect the project root and parent directory.

**Expected result:** CLI exits with an error before running the child command; no `marker.txt` or escaped evidence file is created.

#### Case 4: signal metadata

**Prerequisite:** signal behavior is covered by unit tests with a mocked `spawnSync` result.

1. Run `node --test tests/lib/evidence.test.js`.
2. Inspect the `runEvidenceCommand records signal metadata and signal exit code` test.

**Expected result:** signaled process records `Signal: SIGTERM` and returns exit code `143`.

### Technical Verification

```bash
node --test tests/commands/evidence.test.js
node --test tests/lib/evidence.test.js
node --test tests/commands/evidence.test.js tests/lib/evidence.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js
node --test tests/commands/i18n-audit-matrix.test.js tests/commands/evidence.test.js tests/lib/evidence.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js
node --test
npm run docs:check
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts
node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-05-evidence-robustness-path-safety/slice.json --local --gate validation
node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-05-evidence-robustness-path-safety/slice.json --base main --strict
node bin/create-quiver.js check-pr specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-05-evidence-robustness-path-safety/slice.json --base main
```

## Evidence

- `node --test tests/commands/evidence.test.js tests/lib/evidence.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js`: passed, 38 tests.
- `node --test tests/commands/i18n-audit-matrix.test.js tests/commands/evidence.test.js tests/lib/evidence.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js`: passed, 40 tests.
- `node --test`: passed, 638 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.

## Rollback

1. Revert this slice commit with `git revert <commit-sha>`.
2. Run the technical verification commands above.
3. Confirm `evidence run` returns to the previous baseline behavior and `evidence list/show` docs/help changes are removed.

## Risks / Notes

- Path checks intentionally reject traversal and symlink escapes for explicit output/read paths.
- `evidence run` still uses synchronous direct child execution with `shell: false`; this avoids introducing shell-created child processes.
- Redaction remains best effort; users should avoid commands that deliberately print secrets.
