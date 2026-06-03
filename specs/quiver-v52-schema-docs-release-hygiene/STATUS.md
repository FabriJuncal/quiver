# Status - Quiver v52 Schema, Docs, and Release Hygiene

**Overall status:** In Progress
**Created:** 2026-06-01
**Current slice:** slice-03-changelog-package-release-smoke-hygiene

## Summary

This spec reduces schema/docs/release drift and hardens package validation without adding unsafe publish automation. All planned slices are complete.

## Slice Status

| Slice | Status | Notes |
|---|---|---|
| slice-00-schema-docs-release-baseline | Completed | Confirmed current schema validation is split, chose protected generated docs blocks, and classified package boundary baseline. |
| slice-01-json-schema-for-slice-json | Completed | Published Draft-07 schema, added AJV validation against runtime-valid fixtures and invalid fixtures, documented usage, and required schema/doc package contents. |
| slice-02-generated-cli-reference | Completed | Added protected generated CLI reference block, write/check commands, docs drift gate, and tests preserving manual content. |
| slice-03-changelog-package-release-smoke-hygiene | Completed | Added changelog gate, package tarball install smoke, stronger package exclusions, docs/schema release gates, CI docs drift check, and guarded publish flags. |

## Current Blockers

- None.
