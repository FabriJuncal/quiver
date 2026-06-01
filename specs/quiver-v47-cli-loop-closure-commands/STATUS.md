# Status - Quiver v47 CLI Loop Closure Commands

**Overall status:** Completed
**Created:** 2026-05-31
**Current slice:** none

## Summary

This spec adds small commands and aliases that close CLI loops: `status`, `evidence list/show`, `changelog`, `demo spec-viewer`, and a config-surface decision.

## Slice Status

| Slice | Status | Notes |
|---|---|---|
| slice-00-loop-closure-foundation | Completed | Command contracts and v46 dependency conventions documented in `SPEC.md`; runtime work remains deferred. |
| slice-01-status-command | Completed | Added read-only top-level `status`, schema v1 JSON output, localized human labels, help entry, and no-write coverage. |
| slice-02-evidence-list-show | Completed | Added `evidence list`, `evidence show <path>`, schema v1 JSON for browsing, stable ordering, and path-safety checks while preserving `evidence run`. |
| slice-03-changelog-contract | Completed | Added local `changelog`, schema v1 JSON, parser/help coverage, and `migrate` guidance pointing to changelog plus dry-run preview. |
| slice-04-demo-spec-viewer-alias | Completed | Added `demo spec-viewer` as the simplified entrypoint while preserving `demo create spec-viewer` behavior. |
| slice-05-config-contract-decision | Completed | Documented `config language show|set` as the canonical v47 config surface and deferred generic config aliases to future additive work. |
| slice-06-docs-tests-release-readiness | Completed | Updated public docs, generated command templates, audit matrix coverage, package-installed smoke, and final validation evidence. |

## Current Blockers

- None. v47 is complete.
