# Evidence Report - Quiver v27 Reliability and AI Workflow Hardening

## Initial Evidence

- Pixel Quiver final dogfooding produced `QP-001` to `QP-019` and `QIS-001` to `QIS-022`.
- The approved plan requires a single spec with slices ordered by shared contracts first, command fixes second, and release readiness last.
- `README_FOR_AI.md` was read before creating this spec.
- `ROADMAP.md` and `BACKLOG.md` were reviewed before creating this spec.

## Validation Pending

- In implementation slices, record command evidence and test results in this file.

## Slice 00 Evidence - 2026-05-24

- Created `COVERAGE_MATRIX.md` to map all `QP-001..QP-019` and `QIS-001..QIS-022` to a responsible slice, risk, and validation strategy.
- Created `COMMAND_CONTRACTS.md` to define shared production contracts for output streams, exit codes, dry-run behavior, write classes, atomicity, idempotency, path safety, root detection, package manager detection, deterministic ordering, status catalogs, JSON versioning, legacy/strict modes, security, and validation.
- Created `AUDIT_V24_V25_V26.md` to separate existing v24/v25/v26 implementation surfaces from the dogfooding gaps that v27 must still close.
- Audited existing command and test surfaces with `rg` across `src/create-quiver`, `tests`, and v24/v25/v26 specs for resolver/export/spec-create/check-scope/check-handoff/worktree/analyze/dry-run/doctor/path/redaction surfaces.
- Confirmed `README_FOR_AI.md`, `ROADMAP.md`, and `CHANGELOG.md` were updated so v26 remains the shipped release and v27 is not described as published.

## Slice 01 Evidence - 2026-05-24

- Added `src/create-quiver/lib/statuses.js` with shared canonical status catalogs and alias normalization for specs, slices, runs, approvals, agents, and datasets.
- Added `src/create-quiver/lib/project-state-resolver.js` as the shared resolver over slice discovery, graph building, deterministic ordering, scoped reads, completed-slice filtering, progress, spec grouping, and graph summaries.
- Routed classic `plan` and `graph` commands through the shared resolver while preserving existing human output and adding `canonical_status` to machine payloads.
- Routed AI lifecycle export/list/inspect state through the shared resolver so classic and AI surfaces agree about completed slices when `includeCompleted` is requested.
- Added `tests/lib/project-state-resolver.test.js` for canonical statuses, scoped read safety, and plan/export agreement on completed slices.
- Ran targeted command and library tests for resolver, AI export, plan, graph, next, and doctor.
- Ran `npm run smoke:doctor-fixtures`.
- Ran full Node test suite: `node --test tests/**/*.test.js` passed with 320 tests.
- Ran `git diff --check`.

## Slice 02 Evidence - 2026-05-24

- Bumped lifecycle export schema to `schema_version: 2`.
- Extended `ai export` JSON with `source_metadata`, `warnings`, `approvals`, top-level `blockers`, `evidence`, `next_steps`, `lifecycle`, and `aggregates` while preserving existing `summary`, `project`, `agents`, `runs`, `specs`, `slices`, `graph`, `migration`, and `dashboard` fields.
- Kept source metadata sanitized by exposing the project root name rather than an absolute local path.
- Added canonical statuses to exported slices, runs, agents, specs, and approvals.
- Added CLI tests that parse stdout JSON directly, assert stderr is empty on success, assert unsupported formats write to stderr with non-zero exit, and assert `--include-completed` includes completed slices.
- Ran `node --test tests/lib/ai-export-state.test.js tests/commands/ai-export.test.js`.
- Ran `node --test tests/commands/cli-contract.test.js tests/lib/project-state-resolver.test.js`.
- Ran full Node test suite: `node --test tests/**/*.test.js` passed with 321 tests.
- Ran `git diff --check`.

## Slice 03 Evidence - 2026-05-24

- Updated approved-plan parsing to extract structured slice data from full JSON input or fenced JSON blocks inside Markdown.
- Removed silent generic fallback behavior for plans without structured slices.
- Added pre-write validation for duplicate slice IDs, missing dependencies, invalid slice IDs, and dependency cycles.
- Kept `slice-00-spec-foundation` mandatory while preserving every approved implementation slice from the plan.
- Added atomic failure coverage showing missing structured slices fail before creating a spec directory or temporary build remnant.
- Added command-level coverage for `spec create --dry-run` failing safely when the reviewed approved plan lacks structured slices.
- Ran `node --test tests/lib/ai-spec-generator.test.js tests/commands/spec-create.test.js tests/commands/ai-plan-spec-phase.test.js`.
- Ran full Node test suite: `node --test tests/**/*.test.js` passed with 327 tests.

## Slice 04 Evidence - 2026-05-24

- Added `src/create-quiver/lib/ai/artifacts.js` to centralize clean AI output extraction, raw provider artifact persistence, local path redaction, prompt-size checks, and revise-input compaction.
- Updated `ai plan`, `ai revise`, and `ai review-plan` persistence so saved drafts/reviews use clean provider output while raw stdout/stderr are stored separately under `.quiver/runs/<run-id>/raw/*.json`.
- Added prompt echo stripping and provider-log edge cleanup so draft artifacts do not include provider logs or prompt echoes when useful stdout is available.
- Added raw artifact metadata to planner approval and plan-review metadata, including `raw_artifact_path`, `output_source`, and revise `input_compaction`.
- Preserved explicit approved draft versions while carrying raw artifact metadata from the selected draft into approved metadata.
- Added revise-input compaction for oversized feedback, preserving decisions, risks, files, acceptance criteria, validation, blockers, dependencies, assumptions, rollback, and evidence lines.
- Added prompt-size rejection before provider execution with an actionable `AI_PROMPT_TOO_LARGE` error.
- Added package-safety coverage for raw AI artifacts under `.quiver/runs/*/raw/`.
- Ran `node --test tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/lib/ai-providers.test.js tests/lib/package-safety.test.js`.
- Ran `node --test tests/lib/ai-*.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js`.
- Ran full Node test suite: `node --test tests/**/*.test.js` passed with 330 tests.
- Ran `node bin/create-quiver.js plan --spec quiver-v27-reliability-ai-workflow-hardening --include-completed`.
- Ran `node bin/create-quiver.js graph --spec quiver-v27-reliability-ai-workflow-hardening`.
- Ran `git diff --check`.

## Spec Package Validation - 2026-05-24

- Every `slice.json` under `specs/quiver-v27-reliability-ai-workflow-hardening` parsed successfully with Node.
- Every `EXECUTION_BRIEF.md` passed `node bin/create-quiver.js check-handoff`.
- Every `CLOSURE_BRIEF.md` passed `node bin/create-quiver.js check-handoff`.
- `node bin/create-quiver.js plan --spec quiver-v27-reliability-ai-workflow-hardening --include-completed` passed and reported 10 planned slices.
- `node bin/create-quiver.js graph --spec quiver-v27-reliability-ai-workflow-hardening` passed and produced the expected dependency levels.
- `node bin/create-quiver.js check-slice --local <slice.json>` passed for all 10 slices.
- `git diff --check` passed.

## Slice Evidence

| Slice | Evidence |
|---|---|
| slice-00 | Completed: coverage matrix, command contracts, v24/v25/v26 audit, source-of-truth docs sync, and spec package validation. |
| slice-01 | Completed: shared resolver, canonical status catalogs, classic/AI resolver adapters, scoped-read tests, completed-slice consistency tests, and targeted validation. |
| slice-02 | Completed: schema v2 export contract, pure stdout/stderr CLI checks, completed-slice export coverage, source metadata, warnings, approvals, evidence, next steps, lifecycle, and aggregates. |
| slice-03 | Completed: structured approved-plan extraction, no generic fallback, duplicate/dependency/cycle validation, eight-slice preservation, safe failure cleanup, and command coverage. |
| slice-04 | Completed: clean drafts/reviews, redacted run-scoped raw provider artifacts, revise compaction, prompt-size guardrails, approval metadata, and raw artifact package-safety coverage. |
| slice-05 | Pending |
| slice-06 | Pending |
| slice-07 | Pending |
| slice-08 | Pending |
| slice-09 | Pending |
