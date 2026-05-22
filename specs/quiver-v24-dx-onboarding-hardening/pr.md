## Title
Quiver v24 - DX Onboarding Hardening

## Summary
- Hardens first-use and dogfooding workflows discovered while building Quiver Spec Viewer.
- Improves init hygiene, CLI errors, doctor fixes, prepare output, local slice validation, analyzer quality, evidence capture, and demo scaffolding.
- Adds tests, smokes, and documentation for the new DX contract.

## Scope
- Quiver CLI and generated project templates.
- Documentation and source-of-truth sync.
- Tests and smoke coverage.
- No provider API integrations.
- No package publishing in this PR.

## Files
- `README_FOR_AI.md`
- `ROADMAP.md`
- `README.md`
- `src/create-quiver/**`
- `docs/**`
- `specs/quiver-v24-dx-onboarding-hardening/**`
- `tests/**`
- `scripts/ci/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment
- Node.js 22.x or compatible runtime used by CI.
- npm.
- Git.
- Optional `gh` for PR preflight tests where applicable.

### Worktree Access
- One spec worktree/branch for v24.
- One commit per slice.
- `slice-00` must land before implementation slices.

### Run the Project
```bash
npm install
node bin/create-quiver.js --help
```

### Use Cases
- Initialize an empty project and inspect `.gitignore`, `package.json`, scripts, and docs links.
- Run `prepare --dry-run` in a generated project.
- Run `check-slice --local` in a repo without remotes.
- Run `plan --include-completed` and `graph --include-completed`.
- Run `ai prepare-context --dry-run`.
- Run `evidence run -- npm test`.
- Run `demo create spec-viewer --dry-run`.

### Technical Verification
```bash
git diff --check
node --test tests/**/*.test.js
npm run smoke:create-quiver
npm run smoke:guided-workflow
npm run smoke:tiered-pack
npm pack --dry-run
```

## Evidence
- Update `specs/quiver-v24-dx-onboarding-hardening/EVIDENCE_REPORT.md` after each slice.

## Rollback
- Revert the slice commits in reverse order.
- If template changes caused generated-project regressions, revert init/template slices before command slices.

## Risks / Notes
- `doctor --fix` must remain non-destructive.
- Evidence redaction is best-effort and must not be presented as a complete secret scanner.
- Demo scaffolding must stay optional and lightweight.
