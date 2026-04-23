# Quiver v0.15 - Init Required Before Migrate

**Date:** 2026-04-23
**Status:** Completed

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Make `create-quiver migrate` refuse to run unless the target project was previously initialized by Quiver, so migration stops being an implicit bootstrap path.

## Scope

### Included

- Require Quiver initialization metadata before `migrate` touches the filesystem
- Keep the failure non-destructive: if the precondition fails, no docs or templates are created
- Teach `doctor` to distinguish a project that was never initialized from one that only needs migration
- Document the new contract in README and generated docs
- Add smokes that prove `migrate` fails before init and succeeds after init

### Excluded

- A fallback bootstrap mode inside `migrate`
- New CLI commands for repair or force-migration
- Reworking `init`, `analyze`, or slice lifecycle semantics beyond the migration precondition
- Publishing a release as part of this spec

## Contract Change

The supported flows become:

For a new project:

```bash
npx create-quiver --name "Project Name"
npx create-quiver analyze
npx create-quiver doctor
```

For an existing Quiver project:

```bash
npx create-quiver migrate
npx create-quiver analyze
npx create-quiver doctor
```

If the project was never initialized by Quiver, `migrate` must fail with a clear message that points back to `npx create-quiver --name "Project Name"`. Legacy Quiver projects that predate `.quiver/state.json` must still be recognized from their generated workflow markers.

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Migrate Initialization Precondition | Completed | [slice-01](./slices/slice-01-migrate-initialization-precondition/slice.json) |
| 02 | Doctor Not-Initialized Guidance | Completed | [slice-02](./slices/slice-02-doctor-not-initialized-guidance/slice.json) |
| 03 | Docs and Smokes for Init Before Migrate | Completed | [slice-03](./slices/slice-03-docs-smokes-init-before-migrate/slice.json) |

## Definition of Done

- `migrate` fails before any file writes when Quiver initialization evidence is missing
- The failure message tells the developer to run `npx create-quiver --name "Project Name"`
- Initialized projects and legacy Quiver projects still migrate successfully
- `doctor` distinguishes not-initialized from not-migrated states
- README and generated docs explain that `migrate` is only for previously initialized projects
- Smokes cover both the failing and successful paths
