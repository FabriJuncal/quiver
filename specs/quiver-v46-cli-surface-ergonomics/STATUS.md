# Status - Quiver v46 CLI Surface Ergonomics

**Overall status:** Completed
**Created:** 2026-05-31
**Current slice:** none

## Summary

This spec hardens Quiver's immediate CLI surface with baseline-first auditing, i18n consistency, read-only UX fixes, write-command safety, `slice`/`handoff` namespaces, and command-module extraction.

## Slice Status

| Slice | Status | Notes |
|---|---|---|
| slice-00-cli-surface-baseline-and-delta | Completed | Baseline/delta matrix created in `SPEC.md`; all approved criteria classified with evidence and owners. |
| slice-01-i18n-command-error-hardening | Completed | Localized representative command errors, catalog keys, prepare/config output, and static hardcoded-error audit. |
| slice-02-read-only-ux-quick-wins | Completed | Added missing read-only UX guidance for plan/graph/next, documented JSON precedence in help, and locked read-only behavior with focused tests. |
| slice-03-write-command-feedback-safety | Completed | Added planned/applied write summaries, migrate pre-write dry-run warning, and idempotency/no-write coverage for init/analyze/migrate/doctor/prepare flows. |
| slice-04-slice-namespace-compatibility | Completed | Added canonical `slice start|check|check-pr|scope|cleanup|refresh`, preserved legacy aliases with stderr-only human warnings, and updated help/docs/generated scripts/doctor checks. |
| slice-05-handoff-namespace-compatibility | Completed | Added canonical `handoff check|create`, preserved legacy aliases with stderr-only human warnings, and updated help/docs/generated scripts/tests. |
| slice-06-init-analyze-doctor-command-modules | Completed | Extracted init/analyze/doctor orchestration into command modules while preserving focused command and CLI contract tests. |
| slice-07-docs-tests-release-readiness | Completed | Updated public docs/templates, aligned readiness tests, ran full test suite, package build, package-installed smoke, diff check, and spec validation. |

## Current Blockers

- None. v46 is complete. Later specs must preserve JSON stdout cleanliness, the i18n audit allowlist from `slice-01`, read-only command no-write guarantees from `slice-02`, write-command warning/idempotency coverage from `slice-03`, and namespace compatibility behavior from `slice-04`/`slice-05`.
