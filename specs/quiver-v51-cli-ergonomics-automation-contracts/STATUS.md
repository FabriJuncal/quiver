# Status - Quiver v51 CLI Ergonomics and Automation Contracts

**Overall status:** In Progress
**Created:** 2026-06-01
**Current slice:** slice-03-base-branch-resolution-policy

## Summary

This spec hardens CLI contracts for automation, JSON consumers, human UX, evidence handling, base branch behavior, and Windows portability. The CLI contract baseline is complete and later slices can distinguish evidence-only items from real gaps.

## Slice Status

| Slice | Status | Notes |
|---|---|---|
| slice-00-cli-contract-baseline | Completed | Classified current CLI capabilities, froze implemented contracts, and routed partial gaps to later slices. |
| slice-01-flow-json-compatibility | Completed | Added additive `next_command`, preserved `nextCommand`, documented compatibility, and tested matching values in representative JSON states. |
| slice-02-dashboard-section-validation-i18n | Completed | Localized and documented invalid dashboard section behavior with EN/ES tests, JSON-safe failure coverage, and supported section help/reference docs. |
| slice-03-base-branch-resolution-policy | Planned | Centralize/audit base branch defaults. |
| slice-04-next-plan-graph-ux-edge-cases | Planned | Close or validate secondary UX edge cases. |
| slice-05-evidence-robustness-path-safety | Planned | Harden evidence command contracts and paths. |
| slice-06-namespace-compatibility-windows-scripts | Planned | Protect namespace aliases and portable script path. |

## Current Blockers

- None for `slice-01` through `slice-06`. Execution must resolve open decisions inside the relevant slices.
