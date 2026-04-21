# Quiver v0.6 - Release Readiness

**Date:** 2026-04-21
**Status:** Completed

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Prepare Quiver for its first public npm release without accidentally bumping past the intended initial version.

## Scope

### Included

- Align the release helper with first-release needs
- Update the changelog from `Unreleased` to the intended release version
- Validate the local package, installer smoke, release dry run, and npm prereqs
- Document the publish steps and post-release verification

### Excluded

- Publishing the package during spec preparation
- Changing CLI behavior
- Changing generated project templates
- Hosted documentation or marketing work

## Slices

| Slice | Title | Status |
|-------|-------|--------|
| 01 | First npm Release Readiness | Completed |

## Definition of Done

- The release helper can validate and publish the current package version without forcing an unintended patch bump
- `CHANGELOG.md` has a `0.4.0` release entry dated 2026-04-21 and a fresh `Unreleased` section
- npm auth and package-name availability are checked before publish
- Local package, installer, and release dry-run validations pass
- The publish command is explicit and not run as part of this slice unless requested separately
