# Quiver v27 - Reliability and AI Workflow Hardening

**Date:** 2026-05-24
**Status:** Active
**Source:** Pixel Quiver dogfooding evidence, final worktree traceability

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Real use of Quiver in Pixel Quiver exposed that several AI-first workflow areas are still fragile even though related capabilities were introduced across v24, v25, and v26.

The current risk is not a missing single feature. The risk is systemic: commands can disagree about specs/slices, machine-readable output is not stable enough for dashboards, `spec create` can generate incomplete scaffolds from an approved plan, dry-run behavior is not consistently read-only, and validation/worktree guidance can leave users or agents in ambiguous states.

## Objective

Make Quiver reliable for production-grade AI-first WDD + SDD workflows by hardening the core state model, command contracts, spec/slice generation, exports, AI artifacts, worktrees, validations, context preparation, cross-platform DX, and release evidence.

## Evidence Sources

Primary requirement inputs are the final Pixel Quiver dogfooding files:

- `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/.worktrees/Pixel Quiver/feature-REAL-QUIVER-AI-LIFECYCLE-01-quiver-ai-config-and-context/QUIVER_PROBLEMS.md`
- `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/.worktrees/Pixel Quiver/feature-REAL-QUIVER-AI-LIFECYCLE-01-quiver-ai-config-and-context/QUIVER_IMPROVEMENT_SUGGESTIONS.md`
- `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/.worktrees/Pixel Quiver/feature-REAL-QUIVER-AI-LIFECYCLE-01-quiver-ai-config-and-context/COMMAND_LOG.md`

The final traceability set contains:

- `QP-001` to `QP-019`
- `QIS-001` to `QIS-022`

## Core Decisions

- Audit existing v24/v25/v26 behavior before changing code.
- Treat `README_FOR_AI.md` as the repository source of truth.
- Keep `npx create-quiver` as the canonical bootstrap command.
- Preserve existing command names and compatibility unless a breaking change is explicitly justified.
- Define shared contracts before fixing individual commands.
- Make `slice.json` and `.quiver/` operational state the source of truth; visible docs are derived and validated.
- Keep `--dry-run` strictly read-only.
- Keep machine-readable output parseable without cleanup.
- Keep one persistent worktree per spec and one commit per slice; delegated temporary worktrees remain an internal execution mode.
- Do not publish npm or open PRs from this spec unless explicitly requested after implementation and validation.

## Scope

### Included

- Audit and coverage matrix for all `QP-*` and `QIS-*`.
- Command contracts: exit codes, stdout/stderr, dry-run, write classes, idempotency, atomic writes, path safety, root detection, package manager detection, and deterministic ordering.
- Unified state resolver for specs, slices, runs, approvals, agents, evidence, worktrees, status, and source metadata.
- Canonical status catalogs for specs, slices, runs, approvals, agents, and datasets.
- JSON export contract for dashboards and agents.
- Alignment between `ai export` and the stable export contract.
- `spec create` generation from a reviewed and approved technical plan.
- Structured approved-plan slice block validation.
- Clean AI drafts, separated raw logs, redaction, and token compaction.
- Worktree lifecycle hardening, locks, recovery, and no nested worktree guidance.
- Validation gates for `check-slice`, `check-scope`, `check-handoff`, and `spec validate`.
- Context and diagnostics hardening for `analyze`, `prepare-context`, `flow`, and `doctor`.
- Cross-platform DX for macOS, Linux, Windows PowerShell, Git Bash, and WSL.
- GitHub auth diagnostics and help/error messages.
- Real/sanitized fixtures and smoke tests, including tarball/package validation.

### Excluded

- Building a web dashboard inside Quiver core.
- Publishing npm.
- Opening a PR.
- Replacing the WDD + SDD methodology.
- Removing existing legacy compatibility without an explicit migration path.
- Storing provider credentials or API keys.

## Acceptance Criteria

1. Given the v27 spec is created, when `slice-00` completes, then every `QP-*` and `QIS-*` is mapped to a slice, command area, risk, and validation strategy.
2. Given a command supports `--dry-run`, when it completes, then no repository file changes, including `.quiver/`, `docs/`, and `specs/`.
3. Given a command emits `--format json`, when it succeeds, then `stdout` is valid JSON parseable without removing logs or human text.
4. Given a command fails, when it exits, then it writes the error to `stderr`, exits non-zero, and leaves previous valid state intact or reports exact partial state.
5. Given Quiver resolves project state, when commands inspect specs/slices, then classic and AI commands use the same resolver and agree on status, dependencies, completed slices, runs, approvals, agents, and evidence.
6. Given a project has completed slices, when export runs with `--include-completed`, then completed specs/slices appear in deterministic order.
7. Given Quiver exports JSON, when a dashboard consumes it, then the payload includes schema version, dataset source, generated timestamp, source metadata, warnings, specs, slices, agents, runs, approvals, blockers, evidence, next steps, lifecycle, and aggregates.
8. Given an approved technical plan includes a structured slice block, when `spec create` runs, then it creates the approved spec, slices, handoffs, execution plan, and PR body without generic fallback.
9. Given an approved technical plan lacks a parseable structured slice block, when `spec create` runs, then it fails before writing files and prints the expected format.
10. Given an AI provider returns prompt echo, logs, or mixed output, when Quiver persists drafts, then the useful draft is clean and raw logs are stored separately with redaction.
11. Given feedback is near provider context limits, when `ai revise` runs, then Quiver compacts safely or requests smaller input before exceeding limits.
12. Given a spec worktree exists, when `spec start`, `spec status`, or slice execution commands run, then Quiver reuses the persistent spec worktree and avoids nested or conflicting worktrees.
13. Given a worktree or lock is stale, missing, dirty, or manually removed, when Quiver detects it, then it reports recovery steps without corrupting state.
14. Given a slice is checked locally, when `check-slice --local` runs, then it validates all local preconditions required by later execution or explicitly lists skipped checks.
15. Given `check-scope` receives `--base` or a slice declares `git.base_branch`, when it runs, then it uses that base before falling back.
16. Given a handoff/brief is incomplete, when `check-handoff` runs, then it prints the missing heading, a minimal template, and supported aliases where applicable.
17. Given a path is outside the project root or attempts traversal, when a write path is resolved, then Quiver rejects it.
18. Given Quiver runs in a simple repo, subdirectory, worktree, or basic monorepo, when it resolves the root, then it uses or reports the project root clearly.
19. Given a project uses npm, pnpm, yarn, or bun, when Quiver suggests package commands, then it respects the detected package manager.
20. Given a project path contains spaces, when Quiver prints commands, then examples are copy-safe for macOS, Linux, Windows PowerShell, Git Bash, and WSL.
21. Given GitHub auth is missing or ambiguous, when `ai doctor` or PR preflight runs, then Quiver reports account/scopes/alias expectations and the next safe command.
22. Given old `.quiver/` state exists, when `migrate --dry-run` runs, then it reports exactly what would be updated and preserves existing data.
23. Given fixtures are added from real projects, when committed, then they are sanitized and do not expose unnecessary personal paths or credentials.
24. Given release readiness is validated, when final smoke runs, then it uses the packaged tarball or installed package path, not only local source files.

## Coverage Matrix

The full coverage matrix lives in `COVERAGE_MATRIX.md`. Summary:

| Evidence | Covered by |
|---|---|
| QP-001, QIS-001 | slice-07 |
| QP-002, QIS-002 | slice-08 |
| QP-003, QIS-006 | slice-01, slice-02 |
| QP-004, QIS-009 | slice-08 |
| QP-005, QIS-007 | slice-07 |
| QP-006, QIS-008 | slice-07 |
| QP-007, QIS-010 | slice-07, slice-08 |
| QP-008, QIS-008 | slice-00, slice-07 |
| QP-009, QIS-012 | slice-04 |
| QP-010, QIS-013 | slice-04 |
| QP-011, QIS-014, QIS-015 | slice-03 |
| QP-012 | slice-03 |
| QP-013, QIS-016 | slice-06 |
| QP-014, QIS-017 | slice-07 |
| QP-015, QIS-018 | slice-07 |
| QP-016, QIS-019 | slice-06 |
| QP-017, QIS-020 | slice-06 |
| QP-018, QIS-021 | slice-05 |
| QP-019, QIS-004, QIS-022 | slice-02 |
| QIS-003 | slice-06 |
| QIS-005 | slice-06 |
| QIS-011 | slice-08 |

## Technical Plan

1. Publish a documentation-only foundation that audits current docs, code, tests, and dogfooding evidence.
2. Define command contracts and the shared internal state model before command-specific fixes.
3. Build or refactor a core resolver that every relevant command can consume.
4. Define and test a stable JSON export contract with pure machine output.
5. Make `spec create` require a reviewed, approved, structured plan and fail safely otherwise.
6. Clean AI artifact persistence, raw logs, redaction, and token compaction.
7. Harden worktree, lock, branch, and recovery behavior for the spec/slice lifecycle.
8. Harden validation gates and scope/path safety.
9. Harden context commands, diagnostics, first-use guidance, and cross-platform help.
10. Validate with fixtures, command tests, smokes, tarball/package smoke, docs sync, and release readiness.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Docs audit, coverage, and contracts | completed | none |
| slice-01 | Core state resolver and canonical statuses | planned | slice-00 |
| slice-02 | JSON export contract and machine output | planned | slice-01 |
| slice-03 | Approved plan to spec create | planned | slice-01, slice-02 |
| slice-04 | AI artifact storage, redaction, and token compaction | planned | slice-01 |
| slice-05 | Worktree lifecycle, locks, and recovery | planned | slice-01 |
| slice-06 | Validation gates and scope safety | planned | slice-01, slice-05 |
| slice-07 | Context analysis and doctor flow | planned | slice-01, slice-06 |
| slice-08 | Cross-platform help, auth, and DX | planned | slice-07 |
| slice-09 | Fixtures, smoke, docs, and release readiness | planned | slice-02, slice-03, slice-04, slice-05, slice-06, slice-07, slice-08 |

## Validation Strategy

- `node --test tests/**/*.test.js`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run smoke:create-quiver`
- `npm run package:quiver`
- Tarball smoke from `/private/tmp`
- `git diff --check`
- JSON parse validation for every `slice.json`
- `check-handoff` for every `EXECUTION_BRIEF.md` and `CLOSURE_BRIEF.md`

## Risks

- Some v24/v25/v26 docs may claim behavior that is only partially implemented.
- A shared resolver can create broad regressions if introduced without command-by-command compatibility tests.
- Export schema stabilization can break ad-hoc consumers unless old behavior is kept or documented.
- Worktree lifecycle changes can affect existing users with in-flight branches.
- Real fixtures can expose local paths unless sanitized.
