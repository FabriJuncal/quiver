# PR - QUIVER-02 - Workflow Gate Fixtures

## Title

feat: add fixture-backed workflow gate regression coverage

## Summary

Adds a reusable smoke harness plus fixtures that exercise the bootstrap and gate scripts in happy-path and failure-path scenarios.

## Scope

- `scripts/ci/smoke-workflow-gates.sh` runs the bootstrap and gate scenarios locally
- `.github/workflows/ci.yml` runs the workflow-gate fixture smoke in CI
- `tests/fixtures/workflow-gates/` stores the reusable slice and PR fixtures used by the smoke harness

## Files

- `.github/workflows/ci.yml`
- `scripts/ci/smoke-workflow-gates.sh`
- `tests/fixtures/workflow-gates/slice-ready.json`
- `tests/fixtures/workflow-gates/pr-good.md`
- `tests/fixtures/workflow-gates/pr-bad.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node 22.x or newer

### Worktree Access

```bash
npm run start:slice -- specs/quiver-v03-adoption-verification/slices/slice-02-workflow-gate-fixtures/slice.json
```

### Run the Project

```bash
bash scripts/ci/smoke-workflow-gates.sh
```

### Use Cases

#### Case 1: Local workflow gate smoke

1. Run `bash scripts/ci/smoke-workflow-gates.sh`
2. Inspect the output for the happy-path and failure-path checks

**Expected result:** The smoke passes and reports each checked gate contract.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v03-adoption-verification/slices/slice-02-workflow-gate-fixtures/slice.json --gate validation
npm run check:pr -- specs/quiver-v03-adoption-verification/slices/slice-02-workflow-gate-fixtures/slice.json
git diff --check
```

## Evidence

- Local workflow-gate smoke script output
- CI workflow job results

## Rollback

1. `git revert <commit-hash>`
2. Confirm the smoke harness and CI job are removed

## Risks / Notes

- The smoke uses local copies of the repo to simulate both remote and no-remote bootstrap modes.
