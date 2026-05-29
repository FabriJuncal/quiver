## Title

fix: opt CI actions into Node 24 runtime

## Summary

- Adds the GitHub Actions Node.js 24 action-runtime opt-in to CI.
- Preserves the existing Node.js 22 project test runtime.
- Records a dedicated fix spec and slice evidence.

## Scope

- `.github/workflows/ci.yml`
- `docs/INDEX.md`
- `specs/quiver-v45-ci-actions-node24-readiness/**`

## Files

- `.github/workflows/ci.yml`
- `docs/INDEX.md`
- `specs/quiver-v45-ci-actions-node24-readiness/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- Run commands from the repository root.

### Worktree Access

```bash
git checkout fix/QUIVER-45-01-ci-actions-node24-readiness
```

### Run the Project

No runtime server is required.

### Use Cases

1. Open `.github/workflows/ci.yml`.
2. Confirm `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` is set.
3. Confirm `node-version: 22` remains unchanged.

### Technical Verification

```bash
node --test tests/lib/package-safety.test.js
npm run package:quiver
npm run smoke:create-quiver
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v45-ci-actions-node24-readiness --strict
```

## Evidence

Evidence is recorded in `specs/quiver-v45-ci-actions-node24-readiness/EVIDENCE_REPORT.md`.

## Rollback

Revert this PR. CI returns to the previous action runtime behavior.

## Risks / Notes

- This does not change Quiver's tested Node.js version.
- This does not publish a package.
