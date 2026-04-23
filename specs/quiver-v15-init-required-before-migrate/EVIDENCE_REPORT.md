# Quiver v0.15 Evidence Report

**Spec:** quiver-v15-init-required-before-migrate
**Date:** 2026-04-23
**Status:** Draft

## Summary

This spec hardens `migrate` so it only upgrades projects that were already initialized by Quiver. The key outcome is that migration stops behaving like a hidden bootstrap path.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | `runMigrate()` now fails before any writes when a repo lacks Quiver initialization evidence; `src/create-quiver/lib/state.js` recognizes both initialized state metadata and strong legacy Quiver markers; `scripts/ci/smoke-create-quiver.sh` now proves that migrate fails for plain or malformed repos and still succeeds for legacy Quiver projects |
| slice-02 | Draft | Pending |
| slice-03 | Draft | Pending |

## Required Final Evidence

- Running `npx create-quiver migrate` in a repo without Quiver initialization evidence fails before creating docs
- The failure message points to `npx create-quiver --name "Project Name"`
- Running `migrate` in an initialized or legacy Quiver project still succeeds
- `doctor` can explain the difference between "not initialized" and "needs migration"
- README and generated docs reflect the new contract
- Smokes cover both the failing and successful flows
