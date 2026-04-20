# PR - QUIVER-03 - Placeholder Rendering Cleanup

## Title

docs: render project-scoped placeholders in generated templates

## Summary

Standardizes project-scoped placeholders on the `{{PROJECT_*}}` contract and teaches `init-docs.sh` to render legacy project path tokens when copying generated templates.

## Scope

- `README.md`, `README_FOR_AI.md`, `TEMPLATE.md`, and `docs/DOCUMENTATION_GUIDE.md.template` now use renderable project placeholders
- `specs/[project-name]/slices/pr.md.template` now renders the project slug in generated worktree commands
- `specs/[project-name]/slices/slice-template/slice.json` is rendered during initialization so generated specs do not keep legacy project path tokens
- `scripts/init-docs.sh` now replaces legacy `[project]` style placeholders while copying templates

## Files

- `scripts/init-docs.sh`
- `README.md`
- `README_FOR_AI.md`
- `TEMPLATE.md`
- `docs/DOCUMENTATION_GUIDE.md.template`
- `specs/[project-name]/slices/pr.md.template`
- `specs/[project-name]/slices/slice-template/slice.json`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node

### Worktree Access

```bash
npm run start:slice -- specs/quiver-v02-bootstrap-hardening/slices/slice-03-placeholder-rendering-cleanup/slice.json
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: Fresh project generation

1. Copy the template into a clean target repo
2. Run `bash scripts/init-docs.sh "Placeholder Project"`
3. Scan the generated `docs/` and `specs/placeholder-project/` trees

**Expected result:** No unresolved project-scoped placeholders remain.

#### Case 2: Generated slice PR template

1. Inspect `specs/placeholder-project/slices/slice-template/pr.md.template`
2. Confirm the slice commands point to `specs/placeholder-project/...`

**Expected result:** The generated template uses the concrete project slug and only keeps slice-local placeholders.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v02-bootstrap-hardening/slices/slice-03-placeholder-rendering-cleanup/slice.json --gate validation
npm run check:pr -- specs/quiver-v02-bootstrap-hardening/slices/slice-03-placeholder-rendering-cleanup/slice.json
git diff --check
```

## Evidence

- Fresh project smoke test with no `[project]` placeholders in generated output
- `bash -n scripts/init-docs.sh`

## Rollback

1. `git revert <commit-hash>`
2. Confirm generated docs revert to the legacy placeholder contract

## Risks / Notes

- The init script now renders both new `{{PROJECT_*}}` tokens and legacy project path placeholders.

