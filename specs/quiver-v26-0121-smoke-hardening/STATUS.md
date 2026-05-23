# Status - Quiver v26 0.12.1 Smoke Hardening

**Overall status:** Slices 00-05 complete; scoped graph and release readiness pending
**Created:** 2026-05-23
**Current slice:** slice-05 completed

## Summary

This hotfix spec tracks the first-use issues found while smoke testing `create-quiver@0.12.0` from npm. The goal is to prepare a reliable `0.12.1` before using Quiver for the real `Quiver Spec Viewer` project.

## Slice Status

| Slice | Status | Notes |
|---|---|---|
| slice-00-docs-foundation | Completed | Planning artifacts and source-of-truth sync created. |
| slice-01-cli-help-version-contract | Completed | Added grouped command help, `help` command alias, help drift tests, and alias/version coverage. |
| slice-02-init-doc-links-and-flow-guidance | Completed | Removed default generated doc links to absent files and added flow-after-analyze coverage. |
| slice-03-ai-approval-review-consistency | Completed | Clarified review/spec-create blockers and removed confusing re-approval guidance before review. |
| slice-04-local-validation-brief-contracts | Completed | Local validation no longer fatally requires Git, bare slice dependencies normalize, and brief validation supports execution/closure briefs. |
| slice-05-demo-scaffold-readiness | Completed | Demo scaffold now includes Quiver metadata, doctor/plan/graph/next coverage, brief validation, and server port fallback. |
| slice-06-plan-graph-scope-performance | Planned | Fix scoped plan/graph OOM in repos with many historical specs. |
| slice-07-smoke-release-readiness | Planned | Run full validation, tarball smoke, and release prep. |

## Current Blockers

- `plan` and `graph` still need scoped loading hardening in `slice-06` before release readiness.
- The real `Quiver Spec Viewer` project should wait until this hotfix is published and smoke-tested from npm.

## Next Step

Execute `slice-06-plan-graph-scope-performance` next before final smoke and release prep.
