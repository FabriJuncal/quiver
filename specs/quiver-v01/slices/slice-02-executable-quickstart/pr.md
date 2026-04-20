# PR - QUIVER-02 - Executable Quickstart

## Title

feat: add `package.template.json` and wire npm scripts in `init-docs.sh`

## Summary

Adds the npm script template and teaches `init-docs.sh` how to create or merge `package.json` so new projects can run the slice workflow immediately.

## Scope

- `package.template.json` created with the required scripts
- `init-docs.sh` copies or merges `package.json`
- `README.md` updated with the quick start flow

## Files

- `package.template.json`
- `scripts/init-docs.sh`
- `README.md`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- bash
- node
- macOS or Linux

### Worktree Access

```bash
npm run start:slice -- specs/quiver-v01/slices/slice-02-executable-quickstart/slice.json
```

### Run the Project

```bash
# Not applicable
```

### Use Cases

#### Case 1: No existing package.json

1. Start from a clean project root with `docs-template/`
2. Run `bash scripts/init-docs.sh "My Project"`
3. Open the generated `package.json`

**Expected result:** The four required scripts are present.

#### Case 2: Existing package.json

1. Create a project with an existing `package.json`
2. Run `bash scripts/init-docs.sh "My Project"`
3. Re-open `package.json`

**Expected result:** Existing scripts remain and the four required scripts are added.

### Technical Verification

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-02-executable-quickstart/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-02-executable-quickstart/slice.json
```

## Evidence

- Resulting `package.json`
- `init-docs.sh` output in both scenarios

## Rollback

1. `git revert <commit-hash>`
2. Confirm `init-docs.sh` no longer touches `package.json`

## Risks / Notes

- The merge step requires `node`.
