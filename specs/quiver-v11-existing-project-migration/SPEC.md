# Quiver v0.11 - Existing Project Migration

**Date:** 2026-04-22
**Status:** Draft

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Make existing Quiver projects upgradeable without reinstalling or manually copying new templates, while preserving user-authored project context.

## Scope

### Included

- Add a `create-quiver migrate --dir <project>` command for existing projects
- Add or update Quiver project metadata so `doctor` can understand initialized, analyzed, and migrated state
- Teach `doctor` to recommend migration when required files or version metadata are missing
- Document the upgrade flow for users who already initialized Quiver in a project
- Add smoke fixtures that simulate older generated projects and validate non-destructive migration

### Excluded

- Running AI providers from the CLI
- Overwriting user-authored docs without preserving or reporting the change
- Changing slice execution semantics
- Publishing a release as part of this spec
- Reworking global installation behavior

## Target Upgrade Flow

For a project that already has Quiver:

```bash
cd /path/to/project
npm install --save-dev create-quiver@latest
npx create-quiver migrate --dir .
npx create-quiver analyze --dir .
npx create-quiver doctor --dir .
```

Then the developer opens the AI agent and asks it to execute `docs/AI_ONBOARDING_PROMPT.md`.

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Non-Destructive Migrate Command | Completed | [slice-01](./slices/slice-01-non-destructive-migrate-command/slice.json) |
| 02 | Version Metadata and Doctor Upgrade Checks | Pending | [slice-02](./slices/slice-02-version-metadata-doctor-upgrade-checks/slice.json) |
| 03 | Upgrade Docs and Legacy Project Smokes | Pending | [slice-03](./slices/slice-03-upgrade-docs-legacy-project-smokes/slice.json) |

## Definition of Done

- Existing generated projects can receive new Quiver templates without deleting user edits
- `migrate` reports copied, skipped, and already-present files
- Quiver records enough metadata to distinguish initialized, analyzed, and migrated projects
- `doctor` recommends `migrate` when upgrade artifacts are missing
- README and generated docs explain the upgrade path for existing projects
- Smokes cover a legacy project missing post-0.5 onboarding files
