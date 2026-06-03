# PR - QUIVER-52-02 - Generated CLI reference

## Title

QUIVER-52-02 Generated CLI reference

## Summary

Adds a protected generated CLI command reference block to `docs/reference/commands.md` and a no-dependency drift check that validates the generated content against CLI help metadata and runtime `--help` output. The check is wired into `npm run docs:check` so CI/release validation can fail on drift without rewriting docs.

## PR Policy

- [x] One slice only.
- [ ] Grouped PR exception: at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [x] No behavior changes in a grouped PR.
- [x] No mixed docs with UI, backend, refactor, or performance work.
- [x] Separate evidence for this slice is recorded in `EVIDENCE_REPORT.md`.
- [x] Whole PR is revertible without leaving partial state.

Individual PR required classification: docs generation tooling, docs drift check, tests affecting docs gate, and slice metadata.

### Merge Policy

- [x] Human merge expected.
- [ ] Assisted auto-merge explicitly authorized for this PR or documented category.
- [ ] Assisted auto-merge conditions met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is not requested.

## Scope

- Add `scripts/ci/check-command-reference.js` with `--write` and `--check` modes.
- Add a protected generated block to `docs/reference/commands.md`.
- Preserve curated command documentation outside generated markers.
- Add `docs:commands:write` and `docs:commands:check` npm scripts.
- Wire `docs:commands:check` into `docs:check`.
- Add tests for runtime help consistency, drift synchronization, and manual-content preservation.
- Update v52 status, evidence, closure, slice metadata, and PR body.

## Files

- `docs/reference/commands.md`
- `package.json`
- `scripts/ci/check-command-reference.js`
- `tests/docs/command-reference.test.js`
- `specs/quiver-v52-schema-docs-release-hygiene/SPEC.md`
- `specs/quiver-v52-schema-docs-release-hygiene/spec.md`
- `specs/quiver-v52-schema-docs-release-hygiene/STATUS.md`
- `specs/quiver-v52-schema-docs-release-hygiene/EVIDENCE_REPORT.md`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-02-generated-cli-reference/CLOSURE_BRIEF.md`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-02-generated-cli-reference/slice.json`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-02-generated-cli-reference/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by the repo.
- npm.
- Git.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver
git switch feature/QUIVER-52-02-v52-generated-cli-reference
```

### Run the Project

No runtime server is required. This is docs generation tooling, docs drift validation, tests, and spec evidence.

### Use Cases

#### Case 1: regenerate command reference

1. Run `npm run docs:commands:write`.
2. Inspect `docs/reference/commands.md`.

**Expected result:** only the generated block between `<!-- quiver:generated-cli-reference:start -->` and `<!-- quiver:generated-cli-reference:end -->` changes.

#### Case 2: detect docs drift without rewriting

1. Run `npm run docs:commands:check`.
2. Inspect the command summary.

**Expected result:** check mode exits successfully when the generated block is synchronized and exits non-zero with guidance to run `docs:commands:write` when stale or missing.

#### Case 3: preserve curated docs

1. Review content before and after the generated markers in `docs/reference/commands.md`.
2. Run `node --test tests/docs/command-reference.test.js`.

**Expected result:** manual content outside markers is preserved and the focused preservation test passes.

#### Case 4: CI/docs gate includes drift check

1. Run `npm run docs:check`.
2. Inspect the final step.

**Expected result:** markdown lint, link check, and generated CLI reference drift check all pass.

### Technical Verification

```bash
npm ci
npm run docs:commands:write
npm run docs:commands:check
node --test tests/docs/command-reference.test.js
npm run docs:check
node bin/create-quiver.js --help
node --test
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene
node bin/create-quiver.js check-slice specs/quiver-v52-schema-docs-release-hygiene/slices/slice-02-generated-cli-reference/slice.json --local --gate validation
node bin/create-quiver.js check-scope specs/quiver-v52-schema-docs-release-hygiene/slices/slice-02-generated-cli-reference/slice.json --base main --strict
node bin/create-quiver.js check-pr specs/quiver-v52-schema-docs-release-hygiene/slices/slice-02-generated-cli-reference/slice.json --base main
```

## Evidence

- `npm run docs:commands:write`: passed; generated 7 groups and 59 commands.
- `npm run docs:commands:check`: passed; generated block is synchronized.
- `node --test tests/docs/command-reference.test.js`: passed, 3 tests.
- `node bin/create-quiver.js --help`: passed.
- `npm run docs:check`: passed, including generated CLI reference drift check.
- `npm ci`: passed; 165 packages installed/audited, 0 vulnerabilities reported.
- `node --test`: passed, 651 tests.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v52-schema-docs-release-hygiene/slices/slice-02-generated-cli-reference/slice.json --local --gate validation`: passed.

## Rollback

1. Revert this slice commit with `git revert <commit-sha>`.
2. Run the technical verification commands above.
3. Confirm `docs:commands:write`, `docs:commands:check`, the generated block, command reference script, and focused tests are removed.

## Risks / Notes

- The generator reads `COMMAND_HELP_GROUPS` from `src/create-quiver/index.js` because that is the current source used by runtime help.
- The drift check also runs `node bin/create-quiver.js --lang en --help --no-color` to detect mismatch between metadata and runtime help.
- The generated block is English because the runtime help metadata is English. Existing curated Spanish documentation remains outside the generated block.
- No package dependency or lockfile update is required.
