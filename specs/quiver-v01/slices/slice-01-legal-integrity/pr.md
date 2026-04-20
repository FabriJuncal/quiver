# PR - QUIVER-01 - Legal + Integrity

## Title

chore: add MIT license, fix broken refs, clean orphans, and fix init-docs.sh

## Summary

Adds the MIT license, removes broken references, deletes the orphan template file, renames the slice PR template, and fixes the `init-docs.sh` date and copy logic.

## Scope

- MIT license added
- Broken references removed
- Orphan slice template removed
- PR template renamed to `pr.md.template`
- `init-docs.sh` copies `TESTING_GUIDE_FOR_AI.md.template` and uses portable dates

## Files

- `LICENSE`
- `README_FOR_AI.md`
- `docs/WORKFLOW.md.template`
- `specs/[project-name]/slices/pr.md.template`
- `scripts/init-docs.sh`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node
- macOS or Linux

### Worktree Access

```bash
npm run start:slice -- specs/quiver-v01/slices/slice-01-legal-integrity/slice.json
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: Verify the license

1. Open `LICENSE`
2. Confirm it contains the MIT text and the 2026 copyright

**Expected result:** The root license file is valid MIT text.

#### Case 2: Verify portable dates

1. Run `bash scripts/init-docs.sh "Test Project"` in a clean directory with `docs-template/`
2. Confirm `docs/TESTING_GUIDE_FOR_AI.md` is created
3. Confirm the future date placeholders are replaced with real dates

**Expected result:** The script works on macOS and Linux.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-01-legal-integrity/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-01-legal-integrity/slice.json
grep -r "GITFLOW\|MIGRATION_SUMMARY" . --include="*.md" --include="*.sh" | grep -v ".git"
```

## Evidence

- License file contents
- `init-docs.sh` output on a clean directory

## Rollback

1. `git revert <commit-hash>`
2. Confirm the license and script changes are gone

## Risks / Notes

- The script assumes `node` is available in PATH.
