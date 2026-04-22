# Quiver v0.11 Evidence Report

**Spec:** quiver-v11-existing-project-migration
**Last updated:** 2026-04-22
**Status:** Draft

## Summary

| Slice | Acceptance criteria | Status | Evidence |
|-------|---------------------|--------|----------|
| slice-01 | 6 | Completed | `node -c src/create-quiver/index.js`; `bash -n scripts/init-docs.sh scripts/ci/smoke-create-quiver.sh scripts/package-quiver.sh`; `bash scripts/ci/smoke-create-quiver.sh` |
| slice-02 | 6 | Pending | - |
| slice-03 | 6 | Pending | - |

## Evidence by Slice

## Slice 01

- Added `create-quiver migrate --dir <project>` with a non-destructive migration path for existing projects
- `init-docs.sh` now respects `QUIVER_MIGRATE=1` and skips files that already exist
- Generated projects now receive `tools/scripts/migrate-project.sh` and a `migrate` package script
- Smoke coverage now verifies that migration restores missing files without overwriting existing edits
