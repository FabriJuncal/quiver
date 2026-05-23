# Status - Quiver v26 0.12.1 Smoke Hardening

**Overall status:** Spec foundation complete; implementation pending
**Created:** 2026-05-23
**Current slice:** slice-00 completed

## Summary

This hotfix spec tracks the first-use issues found while smoke testing `create-quiver@0.12.0` from npm. The goal is to prepare a reliable `0.12.1` before using Quiver for the real `Quiver Spec Viewer` project.

## Slice Status

| Slice | Status | Notes |
|---|---|---|
| slice-00-docs-foundation | Completed | Planning artifacts and source-of-truth sync created. |
| slice-01-cli-help-version-contract | Completed | Added grouped command help, `help` command alias, help drift tests, and alias/version coverage. |
| slice-02-init-doc-links-and-flow-guidance | Planned | Fix generated doc links and guided flow next steps. |
| slice-03-ai-approval-review-consistency | Planned | Align review/approval/spec-create state messages. |
| slice-04-local-validation-brief-contracts | Planned | Harden local slice validation and brief contracts. |
| slice-05-demo-scaffold-readiness | Planned | Make the demo scaffold diagnosable and easier to run. |
| slice-06-plan-graph-scope-performance | Planned | Fix scoped plan/graph OOM in repos with many historical specs. |
| slice-07-smoke-release-readiness | Planned | Run full validation, tarball smoke, and release prep. |

## Current Blockers

- Implementation has not started.
- The real `Quiver Spec Viewer` project should wait until this hotfix is published and smoke-tested from npm.

## Next Step

Execute `slice-02-init-doc-links-and-flow-guidance` and `slice-03-ai-approval-review-consistency` next. They can run in parallel only if shared `flow`/help files do not overlap.
