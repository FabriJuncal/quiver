# PR - QUIVER-01 - CI Bootstrap Smoke

## Title

feat: add bootstrap smoke coverage to CI

## Summary

Adds a reusable local smoke script and wires GitHub Actions to verify that `init-docs.sh` can initialize a fresh target repo on both supported operating systems.

## Scope

- `scripts/ci/smoke-init-docs.sh` creates a temporary target repo and runs `init-docs.sh` end to end
- `.github/workflows/ci.yml` runs the smoke on `ubuntu-latest` and `macos-latest`
- The smoke asserts the generated project has the expected baseline files, npm scripts, and executable Quiver tooling

## Files

- `.github/workflows/ci.yml`
- `scripts/init-docs.sh`
- `scripts/ci/smoke-init-docs.sh`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node 22.x or newer

### Worktree Access

```bash
npm run start:slice -- specs/quiver-v03-adoption-verification/slices/slice-01-ci-bootstrap-smoke/slice.json
```

### Run the Project

```bash
bash scripts/ci/smoke-init-docs.sh "Smoke Project"
```

### Use Cases

#### Case 1: Local bootstrap smoke

1. Run `bash scripts/ci/smoke-init-docs.sh "Smoke Project"`
2. Inspect the generated temporary repo behavior in the output

**Expected result:** The script finishes successfully and reports the smoke passed.

#### Case 2: CI matrix coverage

1. Push the branch or open the PR
2. Watch the GitHub Actions workflow

**Expected result:** The smoke job passes on both supported OS runners.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v03-adoption-verification/slices/slice-01-ci-bootstrap-smoke/slice.json --gate validation
npm run check:pr -- specs/quiver-v03-adoption-verification/slices/slice-01-ci-bootstrap-smoke/slice.json
git diff --check
```

## Evidence

- Local smoke script output
- GitHub Actions smoke job on macOS and Ubuntu

## Rollback

1. `git revert <commit-hash>`
2. Confirm the smoke script and CI job are removed

## Risks / Notes

- The smoke copies the repository tree into a temporary docs-template folder, so it requires enough local disk space for a short-lived repo copy.

