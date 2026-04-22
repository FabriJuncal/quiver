# Quiver v0.11 Evidence Report

**Spec:** quiver-v11-existing-project-migration
**Last updated:** 2026-04-22
**Status:** Completed

## Summary

| Slice | Acceptance criteria | Status | Evidence |
|-------|---------------------|--------|----------|
| slice-01 | 6 | Completed | `node -c src/create-quiver/index.js`; `bash -n scripts/init-docs.sh scripts/ci/smoke-create-quiver.sh scripts/package-quiver.sh`; `bash scripts/ci/smoke-create-quiver.sh` |
| slice-02 | 6 | Completed | `node -c src/create-quiver/index.js`; `bash -n scripts/init-docs.sh scripts/ci/smoke-init-docs.sh scripts/ci/smoke-create-quiver.sh scripts/package-quiver.sh`; `bash scripts/ci/smoke-create-quiver.sh` |
| slice-03 | 6 | Completed | `node -c src/create-quiver/index.js`; `bash -n scripts/init-docs.sh scripts/ci/smoke-init-docs.sh scripts/ci/smoke-create-quiver.sh scripts/package-quiver.sh`; `bash scripts/ci/smoke-init-docs.sh`; `bash scripts/ci/smoke-create-quiver.sh`; `bash scripts/package-quiver.sh` |

## Evidence by Slice

## Slice 01

- Added `create-quiver migrate --dir <project>` with a non-destructive migration path for existing projects
- `init-docs.sh` now respects `QUIVER_MIGRATE=1` and skips files that already exist
- Generated projects now receive `tools/scripts/migrate-project.sh` and a `migrate` package script
- Smoke coverage now verifies that migration restores missing files without overwriting existing edits

## Slice 02

- Added `.quiver/state.json` as project-local Quiver metadata
- `init` and `migrate` create or refresh the state file with initialized and migrated version data
- `analyze` updates `last_analysis_at` when metadata exists
- `doctor` distinguishes between missing Quiver metadata and missing migration/upgrade artifacts
- Smoke coverage now verifies the new state lifecycle across init, migrate, analyze, and doctor

## Slice 03

- Added an explicit `Upgrading Existing Projects` section to the root README and the generated project README
- Documented both `npx` and project-local devDependency upgrade flows
- Updated the generated onboarding docs so existing projects are guided to `migrate`, then `analyze`, then `doctor`
- Extended smoke checks to assert the upgrade section and legacy migration preservation behavior
- Confirmed `scripts/package-quiver.sh` still passes after the documentation and smoke updates
