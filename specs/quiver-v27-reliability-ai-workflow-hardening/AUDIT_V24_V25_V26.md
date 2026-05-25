# Audit - v24/v25/v26 Against Pixel Quiver Evidence

## Purpose

This audit records the starting point for v27. It separates already existing implementation surfaces from behavior that remains partial, fragile, or unproven by the Pixel Quiver dogfooding evidence.

## Audited Inputs

- `README_FOR_AI.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `specs/quiver-v24-dx-onboarding-hardening/**`
- `specs/quiver-v25-ai-first-lifecycle-orchestrator/**`
- `specs/quiver-v26-0121-smoke-hardening/**`
- `src/create-quiver/**`
- `tests/**`
- Pixel Quiver evidence files containing `QP-001..QP-019` and `QIS-001..QIS-022`

## Existing Coverage Observed

The current repository already contains implementation and tests in several areas that v27 must reuse instead of rebuilding from scratch:

| Area | Existing evidence in repo |
|---|---|
| `flow`, onboarding, and first-use guidance | `src/create-quiver/commands/flow.js`, `tests/commands/flow.test.js`, v24/v25/v26 docs. |
| Context analysis and context preparation | `src/create-quiver/commands/analyze.js`, `src/create-quiver/commands/prepare-context.js`, `tests/commands/analyze.test.js`, `tests/commands/prepare-context.test.js`. |
| Doctor diagnostics | `src/create-quiver/commands/doctor.js`, `tests/commands/doctor.test.js`, doctor fixture scripts. |
| AI lifecycle commands | `src/create-quiver/commands/ai-onboard.js`, `ai-plan.js`, `ai-revise.js`, `ai-approve.js`, `ai-execute-plan.js`, `ai-export.js`, and related tests. |
| AI export/state helpers | `src/create-quiver/lib/ai/export-state.js`, `tests/lib/ai-export-state.test.js`, `tests/commands/ai-export.test.js`. |
| Spec and worktree lifecycle | `src/create-quiver/commands/spec-create.js`, `spec-start.js`, `spec-status.js`, `spec-close.js`, `src/create-quiver/lib/spec-worktrees.js`, related command tests. |
| Scope, slice, handoff, and path validation | `src/create-quiver/commands/check-scope.js`, `check-slice.js`, `check-handoff.js`, `src/create-quiver/lib/scope.js`, `handoff.js`, `paths.js`, related tests. |
| Evidence redaction and package safety | `src/create-quiver/lib/evidence.js`, `tests/lib/evidence.test.js`, `tests/lib/package-safety.test.js`. |
| Cross-platform path handling | `tests/lib/paths.test.js` includes Windows-style path normalization and project-root safety coverage. |

## Dogfooding Gaps Still Requiring v27 Work

| Gap | Evidence | Why existing coverage is not enough |
|---|---|---|
| Classic and AI commands still disagree on completed slices. | QP-003, QIS-006 | Tests cover command names and helper output, but Pixel Quiver showed inconsistent lifecycle state across `plan --include-completed`, `ai inspect`, and `ai export`. |
| JSON export is not stable enough for dashboards. | QP-019, QIS-004, QIS-022 | Existing `ai export` support exists, but the dashboard contract needs schema versioning, source metadata, lifecycle data, agents, runs, approvals, blockers, evidence, aggregates, and pure stdout JSON. |
| `spec create` can ignore approved plan structure. | QP-011, QP-012, QIS-014, QIS-015 | Existing spec creation exists, but approved technical-plan parsing, structured slice validation, deterministic naming, and safe failure cleanup need direct regression fixtures. |
| AI artifacts can contain prompt echo or raw provider noise. | QP-010, QIS-013 | Existing AI commands do not fully prove clean draft/raw transcript separation for real provider-style output. |
| Revision feedback can exceed context limits. | QP-009, QIS-012 | Token compaction and safe refusal need explicit behavior before provider overflow. |
| Worktree lifecycle needs persistent one-spec behavior and recovery. | QP-018, QIS-021 | Worktree helpers exist, but dogfooding showed nested/conflicting worktree confusion and missing recovery guidance. |
| Validation gates miss execution preconditions. | QP-013, QP-016, QP-017, QIS-003, QIS-016, QIS-019, QIS-020 | Existing validation commands exist, but they must align with actual execution needs, base branch resolution, handoff templates, and strict spec validation. |
| `analyze --dry-run` must be strictly read-only and stack detection must improve. | QP-005, QP-014, QIS-007, QIS-017 | Analyzer tests exist, but v27 needs mutation guards and React/Vite fixtures based on dogfooding failures. |
| `flow`, `doctor`, and `prepare-context` must use current resolver state. | QP-001, QP-006, QP-015, QIS-001, QIS-008, QIS-018 | Existing diagnostics exist, but stale examples and missing evidence-backed next steps remain a real-world problem. |
| Cross-platform help and GitHub auth guidance are incomplete. | QP-002, QP-004, QP-007, QIS-002, QIS-009, QIS-010, QIS-011 | Existing docs/help exist, but they must be more explicit for Windows/macOS/Linux, `gh`, aliases, and AI agent setup dry-runs. |

## Source-of-Truth Sync

`README_FOR_AI.md`, `ROADMAP.md`, and `CHANGELOG.md` were updated before implementation started so they do not describe v27 as already released.

The current sync decision is:

- v26 / `0.12.1` is shipped.
- v27 is active/planned implementation work.
- v27 must not be described as published until release smoke and npm publication happen.

## Implementation Guidance

- Treat v24/v25/v26 as prior art, not proof of closure.
- Prefer extending existing commands and tests over creating duplicate lifecycle paths.
- Add dogfooding fixtures that reproduce the Pixel Quiver failures in sanitized form.
- Keep compatibility where users may depend on existing command names.
- Introduce shared contracts first, then command-specific behavior.

