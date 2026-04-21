# Quiver v0.4 - Zero-Friction Installation

**Date:** 2026-04-21
**Status:** Ready

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Replace manual template copying with a versioned one-command install path that scaffolds Quiver into a target repo and validates the result immediately.

## Scope

### Included

- Packageable distribution contract for Quiver assets
- `create-quiver` CLI for new and existing repos
- Post-init doctor or guided validation output
- Release and versioning docs for the installer surface

### Excluded

- Hosted docs site
- Non-Node installer channels such as Homebrew
- Advanced schema-driven editor integrations
- Windows-native packaging

## Slices

| Slice | Title | Status |
|-------|-------|--------|
| 01 | Package Distribution Contract | Completed |
| 02 | `create-quiver` CLI | Ready |
| 03 | Post-Init Doctor + Release Flow | Ready |

## Definition of Done

- A maintainer can build a distributable Quiver package with the intended assets and no repo-only noise
- A user can run a single documented command to scaffold Quiver into a target repo
- The installer surface validates the result and points the user to the next workflow steps
