# PR - QUIVER-51-03 - Base branch resolution policy

## Title

QUIVER-51-03 base branch resolution policy

## Summary

Centralizes base branch resolution for Quiver CLI workflows so `--base` explicit overrides, Remote HEAD defaults, and fallback branches behave consistently across readiness, scope, spec lifecycle, and AI PR commands.

## PR Policy

- [x] One slice only.
- [ ] Grouped PR exception: at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [x] No behavior changes in a grouped PR.
- [x] No mixed docs with UI, backend, refactor, or performance work.
- [x] Separate evidence for this slice is recorded in `EVIDENCE_REPORT.md`.
- [x] Whole PR is revertible without leaving partial state.

Individual PR required classification: functional CLI behavior, readiness gates, tests, and docs.

### Merge Policy

- [x] Human merge expected.
- [ ] Assisted auto-merge explicitly authorized for this PR or documented category.
- [ ] Assisted auto-merge conditions met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is not requested.

## Scope

- Add shared base branch resolution helpers in the Git utility layer.
- Ensure explicit `--base` values always win.
- Use Remote HEAD when available before fallback branches.
- Keep fallback branches ordered as `main`, `master`, then `develop`.
- Apply the shared policy to readiness, scope checks, spec lifecycle, and AI PR planning.
- Preserve `gh pr create --base <branch>` behavior in `ai pr`.
- Localize and document fallback/recovery behavior.
- Add tests for explicit override, Remote HEAD, fallback branches, and readiness behavior that previously assumed `origin/develop`.

## Files

- `src/create-quiver/lib/git.js`
- `src/create-quiver/lib/spec-worktrees.js`
- `src/create-quiver/lib/readiness.js`
- `src/create-quiver/lib/ai/github.js`
- `src/create-quiver/lib/lifecycle.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/lib/git.test.js`
- `tests/lib/check-slice.test.js`
- `tests/lib/ai-github.test.js`
- `docs/reference/commands.md`
- `docs/COMMANDS.md.template`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/STATUS.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/CLOSURE_BRIEF.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by the repo.
- npm.
- Git.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver
git switch feature/QUIVER-51-03-v51-base-branch-policy
```

### Run the Project

No runtime server is required. This is CLI Git/readiness behavior, tests, docs, and spec evidence.

### Use Cases

#### Case 1: explicit base override

**Prerequisite:** branch checked out.

1. Run a readiness command with `--base main`.
2. Inspect output and Git refs used by the command.

**Expected result:** the explicit base is used before any slice metadata, Remote HEAD, or fallback branch.

#### Case 2: Remote HEAD default

**Prerequisite:** a repo fixture or remote where `origin/HEAD` points to a branch such as `trunk`.

1. Run `ai pr` planning without `--base`.
2. Inspect the generated `gh pr create` command.

**Expected result:** the command contains `--base trunk` when Remote HEAD points to `origin/trunk`.

#### Case 3: fallback branch order

**Prerequisite:** a repo fixture without an explicit base or Remote HEAD.

1. Resolve the base through the shared Git helper.
2. Repeat with local `main`, `master`, and `develop` availability.

**Expected result:** fallback order is `main`, then `master`, then `develop`.

#### Case 4: readiness no longer assumes origin/develop

**Prerequisite:** a slice with `git.base_branch` set to `main` and no `origin/develop` ref.

1. Run PR readiness for that slice.
2. Inspect readiness output.

**Expected result:** readiness checks use `origin/main` or the explicit `--base main` ref instead of `origin/develop`.

### Technical Verification

```bash
node --test tests/lib/git.test.js
node --test tests/commands/spec-close.test.js
node --test tests/commands/ai-pr.test.js
node --test tests/lib/check-slice.test.js
node --test tests/lib/lifecycle.test.js
node --test tests/lib/git.test.js tests/commands/spec-close.test.js tests/commands/ai-pr.test.js tests/lib/check-slice.test.js tests/lib/scope.test.js tests/lib/ai-github.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js
node --test
npm run docs:check
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts
node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --local --gate validation
node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --base main --strict
node bin/create-quiver.js check-pr specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --base main
```

## Evidence

- `node --test tests/lib/git.test.js tests/commands/spec-close.test.js tests/commands/ai-pr.test.js tests/lib/check-slice.test.js tests/lib/scope.test.js tests/lib/ai-github.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js`: passed, 77 tests.
- `node --test tests/lib/lifecycle.test.js`: passed, 12 tests.
- `node --test`: passed, 629 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --local --gate validation`: passed.
- `node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --base main --strict`: passed.
- `node bin/create-quiver.js check-pr specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-03-base-branch-resolution-policy/slice.json --base main`: passed.

## Rollback

1. Revert this slice commit with `git revert <commit-sha>`.
2. Run the technical verification commands above.
3. Confirm readiness and PR commands return to the previous baseline behavior.

## Risks / Notes

- This changes default base selection when Remote HEAD is available and `--base` is omitted; explicit overrides remain unchanged.
- Legacy shell wrappers are not migrated in this slice; portable script and namespace compatibility are tracked by `slice-06-namespace-compatibility-windows-scripts`.
- PR readiness was verified after committing because the gate requires a clean worktree and branch-owned commits.
