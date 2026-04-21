# Quiver v0.10 - Local Project Installation Guidance

**Date:** 2026-04-21
**Status:** Completed

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Clarify that Quiver should be run from the project where the workflow will live, preferably through `npx`, and should not be installed globally.

## Scope

### Included

- Update the root README to recommend running Quiver from the project root
- Make `npx create-quiver --name "Project Name"` the primary path
- Document `npm install --save-dev create-quiver` as the pinned project-local option
- Explicitly discourage global installation
- Update generated project README and AI-facing docs with the same guidance
- Add smoke checks for the new guidance

### Excluded

- CLI behavior changes
- npm package version changes
- Release publishing
- Windows-specific installation changes

## Slices

| Slice | Title | Status | Spec |
|-------|-------|--------|------|
| 01 | Local Project Installation Guidance | Completed | [slice-01](./slices/slice-01-local-project-installation-guidance/slice.json) |

## Definition of Done

- The README tells developers to run Quiver from the target project root
- The README does not recommend global installation
- The generated project README includes the same local-project guidance
- AI-facing docs refer to the local project root as the operating context
- Smoke checks verify the generated README guidance
