# Quiver v0.5 - README Adoption Contract

**Date:** 2026-04-21
**Status:** Completed

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Make the root README the adoption contract for Quiver: a new user should understand what Quiver is, install it with the canonical CLI, validate the scaffold, and start the first slice without reading historical implementation notes.

## Scope

### Included

- Reposition the README around `create-quiver` as the primary install path
- Keep manual `docs-template/` usage as a local development fallback
- Document the first slice workflow at a high level
- Separate user adoption guidance from maintainer release guidance
- Reduce long file inventories and link to the relevant generated docs instead

### Excluded

- CLI behavior changes
- Generated template content changes
- Hosted documentation
- Release automation changes

## Slices

| Slice | Title | Status |
|-------|-------|--------|
| 01 | README Adoption Contract | Completed |

## Definition of Done

- The first install command in the README uses `npx create-quiver`
- The README explains install, doctor validation, first slice workflow, manual fallback, and maintainer commands
- Commands shown in the README match the current CLI and package scripts
- The README no longer presents manual template copying as the primary path
