# PR - QUIVER-52-03 - Changelog, package, and release smoke hygiene

## Title

QUIVER-52-03 Changelog, package, and release smoke hygiene

## Summary

Formalizes changelog handling and hardens release/package validation. The package smoke now validates required public files, rejects local audit/tool/secret artifacts, installs the generated tarball, and verifies the installed CLI with `--version`, `--help`, and `init --dry-run`. Release dry-run gates now include changelog, docs, schema, installer, package, and installed CLI checks, while publish flags remain explicitly guarded.

## PR Policy

- [x] One slice only.
- [ ] Grouped PR exception: at most 2-3 slices, all docs-only, research-only, or low-risk mechanical cleanup.
- [x] No behavior changes in a grouped PR.
- [x] No mixed docs with UI, backend, refactor, or performance work.
- [x] Separate evidence for this slice is recorded in `EVIDENCE_REPORT.md`.
- [x] Whole PR is revertible without leaving partial state.

Individual PR required classification: release/package gates, CI docs gate, tests affecting validation gates, docs, and slice metadata.

### Merge Policy

- [x] Human merge expected.
- [ ] Assisted auto-merge explicitly authorized for this PR or documented category.
- [ ] Assisted auto-merge conditions met: docs-only or chore-only, low risk, no runtime changes, no production configuration changes, green checks, and no pending comments.

Assisted auto-merge is not requested.

## Scope

- Add `npm run changelog:check`.
- Add `scripts/ci/check-changelog.js` and focused tests.
- Update `[Unreleased]` changelog entries.
- Harden `.npmignore` for local audit, PDF, SSH/key, and local-noise artifacts.
- Extend `npm run package:quiver` to validate required public files, forbidden local artifacts, installed tarball, installed `--version`, installed `--help`, and installed `init --dry-run`.
- Wire CI docs job to `npm run docs:check`.
- Add changelog/docs/schema gates to `scripts/release-quiver.sh`.
- Require `QUIVER_ALLOW_NPM_PUBLISH=1` for release publish flags.
- Document changelog/package/release expectations in `CONTRIBUTING.md` and release validation docs.
- Update v52 status, evidence, closure, slice metadata, and PR body.

## Files

- `.github/workflows/ci.yml`
- `.npmignore`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `README.md`
- `package.json`
- `scripts/ci/check-changelog.js`
- `scripts/package-quiver.sh`
- `scripts/release-quiver.sh`
- `tests/ci/changelog.test.js`
- `specs/quiver-v52-schema-docs-release-hygiene/SPEC.md`
- `specs/quiver-v52-schema-docs-release-hygiene/STATUS.md`
- `specs/quiver-v52-schema-docs-release-hygiene/EVIDENCE_REPORT.md`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-03-changelog-package-release-smoke-hygiene/CLOSURE_BRIEF.md`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-03-changelog-package-release-smoke-hygiene/slice.json`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/slice-03-changelog-package-release-smoke-hygiene/pr.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by the repo.
- npm.
- Git.
- ShellCheck for local shell lint validation.

### Worktree Access

```bash
cd /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver
git switch feature/QUIVER-52-03-v52-release-package-hygiene
```

### Run the Project

No runtime server is required. This is release/package automation, docs, CI gate, tests, and spec evidence.

### Use Cases

#### Case 1: validate changelog hygiene

1. Run `npm run changelog:check`.
2. Inspect the report.

**Expected result:** the checker finds `CHANGELOG.md`, detects `[Unreleased]`, and reports categorized entries.

#### Case 2: validate package boundary and installed CLI

1. Run `npm run package:quiver`.
2. Inspect the output.

**Expected result:** the package smoke requires public files, rejects forbidden local artifacts, installs the tarball, and verifies installed `--version`, `--help`, and `init --dry-run`.

#### Case 3: validate release dry-run gates

1. Run `npm run release:quiver`.
2. Inspect the gate sequence.

**Expected result:** release dry-run requires a clean worktree, then runs changelog, docs, schema, installer smoke, package smoke, and installed CLI checks before printing publish guidance.

#### Case 4: verify publish remains guarded

1. Run `bash scripts/release-quiver.sh --help`.
2. Review the publish text.

**Expected result:** publish flags are documented as requiring `QUIVER_ALLOW_NPM_PUBLISH=1`; publish remains opt-in and human-authorized.

### Technical Verification

```bash
npm ci
npm run changelog:check
node --test tests/ci/changelog.test.js
bash -n scripts/package-quiver.sh scripts/release-quiver.sh
shellcheck scripts/package-quiver.sh scripts/release-quiver.sh
npm run docs:check
npm run schema:slice:check
npm run package:quiver
npm run release:quiver
node --test
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene
node bin/create-quiver.js check-slice specs/quiver-v52-schema-docs-release-hygiene/slices/slice-03-changelog-package-release-smoke-hygiene/slice.json --local --gate validation
node bin/create-quiver.js check-scope specs/quiver-v52-schema-docs-release-hygiene/slices/slice-03-changelog-package-release-smoke-hygiene/slice.json --base main --strict
node bin/create-quiver.js check-pr specs/quiver-v52-schema-docs-release-hygiene/slices/slice-03-changelog-package-release-smoke-hygiene/slice.json --base main
```

## Evidence

- `npm run changelog:check`: passed; 22 `[Unreleased]` entries detected.
- `node --test tests/ci/changelog.test.js`: passed, 3 tests.
- `bash -n scripts/package-quiver.sh scripts/release-quiver.sh`: passed.
- `shellcheck scripts/package-quiver.sh scripts/release-quiver.sh`: passed.
- `npm run package:quiver`: passed; generated `create-quiver-0.15.3.tgz` and installed CLI smoke passed.
- `npm run docs:check`: passed, including generated CLI reference drift check.
- `npm run schema:slice:check`: passed; 266 runtime-valid fixtures validated, 1 historical/non-runtime fixture skipped, 4 invalid fixtures rejected.
- `npm ci`: passed; 165 packages installed/audited, 0 vulnerabilities reported.
- `node --test`: passed, 654 tests.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`: passed.
- `node bin/create-quiver.js check-slice specs/quiver-v52-schema-docs-release-hygiene/slices/slice-03-changelog-package-release-smoke-hygiene/slice.json --local --gate validation`: passed.
- `npm run release:quiver`: passed; changelog, docs, schema, installer smoke, package smoke, and installed CLI smoke passed before printing manual publish guidance.

## Rollback

1. Revert this slice commit with `git revert <commit-sha>`.
2. Run the technical verification commands above.
3. Confirm changelog check, installed package smoke, release dry-run gates, CI docs gate change, package exclusions, docs updates, and focused tests are removed.

## Risks / Notes

- `npm run package:quiver` now performs an npm install from the generated tarball, so package smoke is intentionally stricter and slightly slower.
- `scripts/release-quiver.sh --publish` and `--publish-current` now require `QUIVER_ALLOW_NPM_PUBLISH=1` to avoid accidental publish automation.
- CI docs job now uses `npm run docs:check`, so generated CLI reference drift can fail the docs gate.
- No package dependency or lockfile update is required.
