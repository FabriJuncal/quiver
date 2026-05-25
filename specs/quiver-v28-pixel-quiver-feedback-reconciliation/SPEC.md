# Quiver v28 - Pixel Quiver Feedback Reconciliation

**Date:** 2026-05-25
**Status:** Wave 1 partially complete
**Source:** Pixel Quiver dogfooding follow-up after `create-quiver@0.13.0`

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Pixel Quiver produced a second set of framework feedback after Quiver v27 shipped in `create-quiver@0.13.0`. The repository source of truth says v27 already covered `QP-001` to `QP-019` and `QIS-001` to `QIS-022`, but the Pixel Quiver files still list several of those items as open and add later issues around `spec create`, repair flows, active-slice reconciliation, worktrees, and `ai inspect`.

The risk is implementing duplicate fixes or missing regressions. Quiver needs a reconciliation-first spec that verifies what v27 truly covers, then fixes only the remaining, partial, regressed, or newly observed gaps.

## Objective

Reconcile Pixel Quiver feedback against the current Quiver implementation, then harden the unresolved workflow gaps across AI runs, approvals, structured technical plans, active-slice state, spec validation, worktrees, plan reviews, agent DX, documentation, and release readiness.

## Evidence Sources

Primary input files:

- `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/Pixel Quiver/QUIVER_PROBLEMS.md`
- `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/Pixel Quiver/QUIVER_IMPROVEMENT_SUGGESTIONS.md`
- `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/Pixel Quiver/QUIVER_FRAMEWORK_IMPROVEMENTS.md`

Repository source-of-truth files:

- `README_FOR_AI.md`
- `ROADMAP.md`
- `BACKLOG.md`
- `specs/quiver-v27-reliability-ai-workflow-hardening/**`

## Core Decisions

- Do not reimplement v27 behavior blindly.
- `slice-00` must freeze and reconcile evidence before implementation slices start.
- Each finding must end as `verified-resolved`, `fixed`, `documented-risk`, `duplicate`, or `out-of-scope-with-reason`.
- No npm publication or PR creation is included in this spec.
- Changes must remain backward compatible by default unless a stricter mode is explicitly documented.
- `--dry-run` behavior must remain read-only.
- Machine-readable output must be valid without stripping human logs.

## Scope

### Included

- Reconciliation matrix for all supplied Pixel Quiver `QP-*`, `QIS-*`, and framework improvement sections.
- AI run lifecycle and approval clarity.
- Clean AI command output and raw provider log persistence.
- Structured `spec.slices[]` contract for technical plans.
- Safe repair path for approved technical plans with missing structure.
- Active-slice multi-source reconciliation.
- `ai inspect` behavior after manual/fallback spec creation.
- `spec validate`, `check-slice`, `spec status`, `spec start`, scope, and worktree reliability.
- Structured `ai review-plan` closure metadata.
- Agent command DX using `npx --yes create-quiver@<version>`.
- Cross-platform help, docs, fixtures, tests, smoke coverage, and release readiness.

### Excluded

- Pixel Quiver application changes.
- Building a web dashboard inside Quiver core.
- Publishing npm.
- Opening a PR.
- Removing legacy compatibility without migration.
- Storing provider credentials.

## Acceptance Criteria

1. Given v27 claims coverage for earlier findings, when `slice-00` completes, then every supplied finding is classified with evidence as resolved, partial, pending, regression, duplicate, or out of scope.
2. Given a finding is already resolved by v27, when the final matrix is produced, then it is not reimplemented unless a regression test proves it still fails.
3. Given a finding is pending or partial, when implementation starts, then it is mapped to exactly one primary slice and at least one validation artifact.
4. Given an AI run is active, when another run is created or inspected, then Quiver avoids mixing scopes and shows the next safe action.
5. Given approvals exist across multiple runs, when `ai approvals` runs, then active, historical, stale, orphaned, and run-specific approvals are distinguishable.
6. Given `ai onboard`, `ai plan`, or provider-backed commands run, when output is shown, then useful human output is separated from raw logs and redacted raw artifacts are persisted separately.
7. Given a technical plan is generated, when it is approved or used by `spec create`, then it contains a parseable structured `spec.slices[]` contract or fails before writing files.
8. Given an approved plan lacks required structure, when the user requests repair, then Quiver can create a derived draft without mutating the approved artifact and requires review plus approval.
9. Given active slice state exists in multiple files, when reconciliation runs, then Quiver reports all sources and supports safe dry-run decisions: preserve, close, replace, or block.
10. Given a spec was created manually or by fallback, when `ai inspect` runs, then it reconciles existing specs and suggests `spec validate`, `next`, or `ai prompt-slice` instead of stale `spec create`.
11. Given `spec validate` runs, when slices are structurally invalid for execution, then the command detects the relevant `check-slice --local` failures or reports them as strict warnings.
12. Given a spec worktree path is missing, stale, dirty, or not listed by Git, when `spec status` runs, then the command reports the real state and recovery guidance.
13. Given `spec start --dry-run` finds a dirty checkout, when it fails, then it lists blocking files and safe options without modifying state.
14. Given `ai review-plan` runs, when it finishes, then it emits structured metadata for blocking status, approval recommendation, required fixes, optional hardening, and next command.
15. Given generated examples target agents, when commands are printed, then non-interactive versioned examples use `npx --yes create-quiver@<version>`.
16. Given docs are updated, when the spec closes, then `README_FOR_AI.md`, `README.md`, `CHANGELOG.md`, and `ROADMAP.md` do not contradict the implemented state.
17. Given final validation runs, when release readiness is checked, then source tests and package/tarball smoke evidence are recorded.

## Technical Plan

1. Freeze evidence and create the reconciliation matrix before implementation.
2. Add focused fixtures for unresolved or regressed cases.
3. Harden AI run state and approvals before touching spec generation.
4. Enforce the structured technical-plan contract and repair path.
5. Add active-slice reconciliation and stale `ai inspect` recovery.
6. Align validation gates and worktree reporting.
7. Add plan-review closure metadata and agent-friendly command examples.
8. Close with compatibility tests, documentation sync, smoke coverage, and release evidence.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Reconciliation and evidence freeze | completed | none |
| slice-01 | AI run state, approvals, and clean output | completed | slice-00 |
| slice-02 | Structured technical plan contract and repair flow | completed | slice-00, slice-01 |
| slice-03 | Active slice reconciliation and AI inspect | ready | slice-00, slice-01 |
| slice-04 | Spec validation, scope, and worktree reliability | completed | slice-00 |
| slice-05 | Review-plan closure and agent DX | ready | slice-00, slice-01 |
| slice-06 | Backward compatibility, docs, and release readiness | draft | slice-01, slice-02, slice-03, slice-04, slice-05 |

## Validation Strategy

- `node --test tests/**/*.test.js`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run smoke:create-quiver`
- `npm run package:quiver`
- package/tarball smoke from a temporary directory
- `git diff --check`
- JSON parse validation for all `slice.json`
- `npx create-quiver spec validate specs/quiver-v28-pixel-quiver-feedback-reconciliation`
- `npx create-quiver check-handoff` for each execution and closure brief

## Risks

- Some findings may already be fixed by v27 and only stale in Pixel Quiver docs.
- Tightening validation can break older project specs if strict behavior is not gated.
- AI lifecycle changes can affect existing `.quiver/runs` and `.quiver/approvals` state.
- Worktree changes can affect users with in-flight branches.
- Real dogfooding evidence contains absolute local paths and must not be copied into fixtures without sanitization.
