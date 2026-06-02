# PR - QUIVER-51-02 - Dashboard section validation and i18n

## Title

QUIVER-51-02 dashboard section validation and i18n

## Summary

Closes dashboard section validation gaps by making invalid `--section` behavior contract-tested in English and Spanish, preserving JSON-safe failure output, and documenting the real supported section values in CLI help and command references.

## PR Policy

- [x] One slice only.
- [ ] Grouped PR exception: at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [x] No behavior changes in a grouped PR.
- [x] No mixed docs with UI, backend, refactor, or performance work.
- [x] Separate evidence for this slice is recorded in `EVIDENCE_REPORT.md`.
- [x] Whole PR is revertible without leaving partial state.

Individual PR required classification: tests/help/docs for a CLI quality slice.

### Merge Policy

- [x] Human merge expected.
- [ ] Assisted auto-merge explicitly authorized for this PR or documented category.
- [ ] Assisted auto-merge conditions met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is not requested.

## Scope

- Add dashboard invalid-section tests for EN/ES human output.
- Add dashboard invalid-section test for JSON-safe failure output.
- Make CLI help list the supported dashboard sections through i18n help descriptions.
- Update public and generated command docs so supported sections include `overview`.
- Update v51 slice status, closure, and evidence.

## Files

- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/dashboard.test.js`
- `tests/commands/cli-contract.test.js`
- `docs/reference/commands.md`
- `docs/COMMANDS.md.template`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/STATUS.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/CLOSURE_BRIEF.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by the repo.
- npm.
- Git.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver
git switch feature/QUIVER-51-02-v51-dashboard-section-i18n
```

### Run the Project

No runtime server is required. This is CLI behavior, tests, docs, and spec evidence.

### Use Cases

#### Case 1: invalid dashboard section in English

**Prerequisite:** branch checked out.

1. Run `node bin/create-quiver.js dashboard --section nope --lang en`.
2. Inspect stderr.

**Expected result:** command exits non-zero, stdout is empty, and stderr says the section is unsupported with the complete supported list.

#### Case 2: invalid dashboard section in Spanish

**Prerequisite:** branch checked out.

1. Run `node bin/create-quiver.js dashboard --section nope --lang es`.
2. Inspect stderr.

**Expected result:** command exits non-zero, stdout is empty, and stderr is localized while preserving exact section ids.

#### Case 3: invalid dashboard section in JSON mode

**Prerequisite:** branch checked out.

1. Run `node bin/create-quiver.js dashboard --json --section nope --lang es`.
2. Parse stdout as JSON.
3. Inspect stderr.

**Expected result:** stdout is parseable JSON, stderr is empty, and the JSON error message remains English for machine stability.

### Technical Verification

```bash
npm run test:ci -- tests/commands/dashboard.test.js tests/commands/cli-contract.test.js tests/lib/i18n-catalog.test.js
node --test
npm run docs:check
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts
node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --local --gate validation
node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --base main --strict
```

## Evidence

- `npm run test:ci -- tests/commands/dashboard.test.js tests/commands/cli-contract.test.js tests/lib/i18n-catalog.test.js`: passed, 35 tests.
- `node --test`: passed, 624 tests.
- `npm run docs:check`: passed.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --local --gate validation`: passed.
- `node bin/create-quiver.js check-scope specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --base main --strict`: passed.
- `node bin/create-quiver.js check-pr specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --base main`: partial pass; scope, branch, and clean-worktree checks pass, then commit ownership fails against `origin/develop`. This is a known base-branch readiness gap assigned to `QUIVER-51-03`.

## Rollback

1. Revert this slice commit.
2. Run the technical verification commands above.
3. Confirm dashboard invalid-section behavior returns to the previous baseline.

## Risks / Notes

- Runtime invalid-section localization already existed in `src/create-quiver/lib/dashboard.js`; this slice closes the gap with contract tests and docs/help alignment.
- Section ids remain untranslated by design because they are CLI input values.
- Full PR readiness remains blocked by the existing `origin/develop` assumption in readiness commit checks. Continue with `QUIVER-51-03` after this PR is merged.
