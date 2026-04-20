# Quiver v0.3 - Adoption Verification

**Date:** 2026-04-20
**Status:** Ready

Slice numbering resets here: this spec starts at `slice-01` and does not continue any previous spec's numbering.

## Objective

Make Quiver self-verifying so every supported release proves the real adoption path in CI and documents how a new user can recover from common first-run failures.

## Scope

### Included

- CI smoke tests for `init-docs.sh` and generated projects
- Fixture-driven validation for bootstrap and gate scripts
- Support matrix and troubleshooting docs for first-time adopters
- Executable verification of the documented bootstrap path

### Excluded

- One-command installation via `npx create-quiver`
- Hosted docs site
- Native Windows support
- Release automation outside the verification workflow

## Slices

| Slice | Title | Status |
|-------|-------|--------|
| 01 | CI Bootstrap Smoke | Ready |
| 02 | Workflow Gate Fixtures | Ready |
| 03 | Support Matrix + Troubleshooting | Ready |

## Definition of Done

- CI proves the bootstrap flow on the supported OS matrix
- The gate scripts have fixture-backed regression coverage for happy-path and key failure-path scenarios
- README and generated docs expose a support matrix and first-run troubleshooting guidance
