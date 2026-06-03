# Status - Quiver v51 CLI Ergonomics and Automation Contracts

**Overall status:** In Progress
**Created:** 2026-06-01
**Current slice:** slice-06-namespace-compatibility-windows-scripts

## Summary

This spec hardens CLI contracts for automation, JSON consumers, human UX, evidence handling, base branch behavior, and Windows portability. The CLI contract baseline is complete and later slices can distinguish evidence-only items from real gaps.

## Slice Status

| Slice | Status | Notes |
|---|---|---|
| slice-00-cli-contract-baseline | Completed | Classified current CLI capabilities, froze implemented contracts, and routed partial gaps to later slices. |
| slice-01-flow-json-compatibility | Completed | Added additive `next_command`, preserved `nextCommand`, documented compatibility, and tested matching values in representative JSON states. |
| slice-02-dashboard-section-validation-i18n | Completed | Localized and documented invalid dashboard section behavior with EN/ES tests, JSON-safe failure coverage, and supported section help/reference docs. |
| slice-03-base-branch-resolution-policy | Completed | Centralized base branch resolution across readiness, spec lifecycle, scope, and AI PR flows. |
| slice-04-next-plan-graph-ux-edge-cases | Completed | Closed next/plan/graph secondary UX gaps with localized human notes, JSON-safe tests, and docs alignment. |
| slice-05-evidence-robustness-path-safety | Completed | Hardened evidence command contracts, safe paths, signal metadata, JSON list/show, docs, and i18n matrix coverage. |
| slice-06-namespace-compatibility-windows-scripts | Planned | Protect namespace aliases and portable script path. |

## Current Blockers

- None for `slice-01` through `slice-06`. Execution must resolve open decisions inside the relevant slices.
