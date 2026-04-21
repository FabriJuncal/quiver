# PR - QUIVER-02 - Generated Project Contract

## Title

feat: copy the default OSS baseline when initializing a project

## Summary

Teaches `init-docs.sh` to copy the default legal and OSS workflow assets when they are missing, while preserving any user-owned files that already exist in the target repo.

## Scope

- `scripts/init-docs.sh` copies the default baseline files only when they are missing
- `README.md` documents the generated files contract
- `README_FOR_AI.md` documents the non-destructive behavior
- `TEMPLATE.md` documents the default OSS baseline

## Files

- `scripts/init-docs.sh`
- `README.md`
- `README_FOR_AI.md`
- `TEMPLATE.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node

### Worktree Access

```bash
npm run start:slice -- specs/quiver-v02-bootstrap-hardening/slices/slice-02-generated-project-contract/slice.json
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: Fresh target repo

1. Copy the template into a clean target repo
2. Run `bash scripts/init-docs.sh "My Project"`
3. Inspect the target root and `.github/`

**Expected result:** The default OSS baseline files are created.

#### Case 2: Existing user-owned files

1. Create a target repo that already has `LICENSE` and `.github/pull_request_template.md`
2. Run `bash scripts/init-docs.sh "My Project"`
3. Re-open those files

**Expected result:** Existing files are preserved and the script reports the skip clearly.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v02-bootstrap-hardening/slices/slice-02-generated-project-contract/slice.json --gate validation
npm run check:pr -- specs/quiver-v02-bootstrap-hardening/slices/slice-02-generated-project-contract/slice.json
```

## Evidence

- `init-docs.sh` output in a fresh target repo
- `init-docs.sh` output with pre-existing baseline files

## Rollback

1. `git revert <commit-hash>`
2. Confirm `init-docs.sh` no longer copies the default baseline assets

## Risks / Notes

- The script now assumes the template source tree includes the default baseline files.

