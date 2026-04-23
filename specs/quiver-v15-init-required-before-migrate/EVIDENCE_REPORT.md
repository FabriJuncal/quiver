# Quiver v0.15 Evidence Report

**Spec:** quiver-v15-init-required-before-migrate
**Date:** 2026-04-23
**Status:** Completed

## Summary

This spec hardens `migrate` so it only upgrades projects that were already initialized by Quiver. The key outcome is that migration stops behaving like a hidden bootstrap path.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | `runMigrate()` now fails before any writes when a repo lacks Quiver initialization evidence; `src/create-quiver/lib/state.js` recognizes both initialized state metadata and strong legacy Quiver markers; `scripts/ci/smoke-create-quiver.sh` now proves that migrate fails for plain or malformed repos and still succeeds for legacy Quiver projects |
| slice-02 | Completed | `doctor` now fails early with an init-first message when the repo has no Quiver initialization evidence; the smoke suite proves that plain repos and malformed state get `Run init first`, while legacy Quiver projects still receive migration guidance |
| slice-03 | Completed | `README.md`, `README_FOR_AI.md`, and the generated README contract in `src/create-quiver/lib/init-docs.js` now state that `migrate` is only for already initialized Quiver projects; shell and cross-platform smokes assert the generated docs keep that wording |

## Required Final Evidence

- Running `npx create-quiver migrate` in a repo without Quiver initialization evidence fails before creating docs
- The failure message points to `npx create-quiver --name "Project Name"`
- Running `migrate` in an initialized or legacy Quiver project still succeeds
- `doctor` can explain the difference between "not initialized" and "needs migration"
- README and generated docs reflect the new contract
- Smokes cover both the failing and successful flows
