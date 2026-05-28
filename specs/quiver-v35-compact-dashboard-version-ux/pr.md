# PR: Quiver v35 Compact Dashboard and Version UX

## Title

Quiver v35 Compact Dashboard and Version UX

## Summary

- Makes `dashboard` compact, summary-first, and actionable by default.
- Adds `dashboard --details`, `dashboard --section <name>`, and `dashboard --limit <n>` for focused inspection.
- Adds branded `version` and parseable `version --json`.
- Preserves semver-only top-level `--version` / `-V` and stable `dashboard --json` automation behavior.
- Extends docs, generated guidance, tests, package smoke, installed tarball smoke, and spec evidence.

## Scope

- CLI parser/routing for dashboard human-only flags.
- Dashboard human renderers and JSON-safe option validation.
- Version report collection and Quiver ASCII banner rendering.
- Generated `quiver:version` script and command documentation.
- Release-readiness evidence for local tests, package build, smoke scripts, and cross-platform smoke.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/commands/dashboard.js`
- `src/create-quiver/lib/dashboard.js`
- `src/create-quiver/lib/version.js`
- `src/create-quiver/lib/init-docs.js`
- `src/create-quiver/lib/init-layout.js`
- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `README_FOR_AI.md`
- `scripts/ci/smoke-create-quiver.sh`
- `scripts/ci/smoke-cross-platform.js`
- `tests/commands/dashboard.test.js`
- `tests/commands/cli-contract.test.js`
- `tests/lib/dashboard.test.js`
- `tests/lib/version.test.js`
- `specs/quiver-v35-compact-dashboard-version-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- `gh` installed for PR preflight/creation.
- SSH access configured for `github-personal` with identity file `~/ssh/github-personal`.

### Worktree Access

- Branch: `feature/QUIVER-35-compact-dashboard-version-ux`
- Base used for this PR: `main`, because the remote currently exposes `main` as default and does not expose `origin/develop`.
- Spec package: `specs/quiver-v35-compact-dashboard-version-ux/`

### Run the Project

```bash
node bin/create-quiver.js dashboard
node bin/create-quiver.js dashboard --section slices --limit 10
node bin/create-quiver.js dashboard --json
node bin/create-quiver.js version --no-color
node bin/create-quiver.js version --json
```

### Use Cases

- Human user can inspect project/spec/slice state without scrolling through every section by default.
- Human user can opt into full dashboard detail with `--details`.
- Human user can inspect one dashboard area with `--section <name>`.
- Automation can keep using `dashboard --json` without ANSI/prose contamination.
- Automation can keep using top-level `--version` / `-V` as semver-only output.
- Humans and automation can use `version` / `version --json` for richer metadata.

### Technical Verification

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v35-compact-dashboard-version-ux --strict
npm run package:quiver
npm run smoke:create-quiver
node scripts/ci/smoke-cross-platform.js
```

## Evidence

- `node --test tests/**/*.test.js` passed: 523 tests.
- `git diff --check` passed.
- `npx create-quiver spec validate specs/quiver-v35-compact-dashboard-version-ux --strict` passed.
- `npm run package:quiver` passed and produced `create-quiver-0.15.2.tgz`.
- `npm run smoke:create-quiver` passed.
- `node scripts/ci/smoke-cross-platform.js` passed.
- Detailed evidence is recorded in `specs/quiver-v35-compact-dashboard-version-ux/EVIDENCE_REPORT.md`.

## Rollback

- Revert this PR.
- If already packaged locally, remove the generated tarball `create-quiver-0.15.2.tgz`.
- Existing `--version` consumers remain protected because top-level semver behavior is covered by tests and smoke.

## Risks / Notes

- No npm publication is included.
- Root `docs/INDEX.md` was not added; this repo currently has `docs/INDEX.md.template`, while generated projects still receive `docs/INDEX.md`.
- Native Windows was not run in this turn; cross-platform smoke includes Windows path/npm guards and passed locally on macOS.
