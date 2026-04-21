# PR - QUIVER-05 - Community Health + CI

## Title

chore: add community health files and GitHub Actions CI

## Summary

Adds the core open-source community health files and a CI workflow that validates shell scripts and JSON templates.

## Scope

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `.github/ISSUE_TEMPLATE/`
- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`

## Files

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node
- GitHub Actions

### Worktree Access

```bash
npm run start-slice -- specs/quiver-v01/slices/slice-05-community-health-ci/slice.json
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: CI runs on GitHub Actions

1. Push the branch
2. Open GitHub Actions
3. Confirm the workflow passes

**Expected result:** CI is green.

#### Case 2: Community health is visible

1. Open the repository on GitHub
2. Check the community health indicators

**Expected result:** License, contributing, code of conduct, and security policy are present.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-05-community-health-ci/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-05-community-health-ci/slice.json
shellcheck scripts/*.sh
node -e "JSON.parse(require('fs').readFileSync('specs/[project-name]/slices/slice-template/slice.json','utf8'))" && echo "templates valid"
```

## Evidence

- CI workflow run
- Community standards status

## Rollback

1. `git revert <commit-hash>`
2. Confirm the workflow file is removed or reverted

## Risks / Notes

- `CHANGELOG.md` must include v0.1.0.
