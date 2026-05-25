# Coverage Matrix - Quiver v28 Pixel Quiver Feedback Reconciliation

`slice-00` completed the evidence freeze on 2026-05-25. This matrix replaces the initial planning hypothesis and is the execution contract for the remaining slices.

Status meanings used during this spec:

- `verified-resolved`: current repo evidence shows enough code, test, or doc coverage; no v28 implementation should repeat it.
- `partial`: current repo covers part of the issue, but Pixel Quiver evidence still exposes a gap or missing regression guard.
- `pending`: no sufficient current coverage was found; implement in the mapped v28 slice.
- `duplicate`: tracked through another finding.
- `documented-risk`: not fixed in this slice; must remain visible until closure.
- `out-of-scope-with-reason`: intentionally excluded from v28 with a reason.

## Frozen Inputs

| Source | Unique IDs | SHA-256 | Modified |
|---|---:|---|---|
| Pixel Quiver `QUIVER_PROBLEMS.md` | `QP-001` to `QP-028` | `516d8928af437fc3d20cacfe50fb78752954eb59b6dace6860cdda820aa6701d` | 2026-05-25 03:29:24 -03 |
| Pixel Quiver `QUIVER_IMPROVEMENT_SUGGESTIONS.md` | `QIS-001` to `QIS-031` | `43c4bfbef68fc8343b7f905f299c53716b55abcace415c9ce1088aa53ac12949` | 2026-05-25 03:29:39 -03 |
| Pixel Quiver `QUIVER_FRAMEWORK_IMPROVEMENTS.md` | narrative sections only | `7a4eb66a996fc44cce80df4907a948fbef3e780a5f8fc856a6bdc2b0bd1f1ea3` | 2026-05-25 03:29:53 -03 |

## Problem Coverage

| Finding | Status | Primary slice | Evidence | Required action |
|---|---|---|---|---|
| QP-001 | verified-resolved | slice-00 | v27 matrix maps flow freshness to slice-07; `tests/commands/flow.test.js`; `src/create-quiver/commands/flow.js`. | Do not reimplement. |
| QP-002 | fixed | slice-05 | v27 path handling remains, and help/docs now include non-interactive `npx --yes create-quiver@<version>` examples for agents. | Completed in slice-05. |
| QP-003 | fixed | slice-03 | `collectLifecycleExport` now includes active-slice state, uses shared resolver data, and `ai inspect` next steps reconcile existing specs before suggesting stale creation. Covered by `tests/lib/ai-export-state.test.js` and `tests/commands/ai-export.test.js`. | Completed in slice-03. |
| QP-004 | fixed | slice-05 | GitHub install/auth/alias guidance now includes account/scope/alias diagnosis plus macOS, Linux, Windows PowerShell, Git Bash, and WSL recovery copy. Covered by `tests/lib/ai-github.test.js`. | Completed in slice-05. |
| QP-005 | verified-resolved | slice-00 | v27 matrix maps React/Vite analyzer detection to slice-07; `tests/commands/analyze.test.js`; `tests/fixtures/validation-errors/matrix.json`. | Do not reimplement unless a new failing fixture appears. |
| QP-006 | verified-resolved | slice-00 | v27 matrix maps evidence-backed `prepare-context` to slice-07; `README_FOR_AI.md`; `docs/PROJECT_MAP.md` contract in templates. | Do not reimplement. |
| QP-007 | verified-resolved | slice-00 | v27 matrix maps agent docs gaps to slice-07/slice-08; generated templates include current docs instead of missing `docs/ai/QUICK.md` style paths. | Do not reimplement. |
| QP-008 | verified-resolved | slice-00 | v27 status is 100%; v27 evidence says source-of-truth docs were synchronized; `README_FOR_AI.md` documents v27 coverage. | Do not reimplement. |
| QP-009 | verified-resolved | slice-00 | `src/create-quiver/lib/ai/artifacts.js`; `tests/commands/ai-plan.test.js`; v27 slice-04 closure covers revise compaction. | Do not reimplement. |
| QP-010 | fixed | slice-01 | `src/create-quiver/commands/ai.js`; `tests/commands/ai-plan.test.js` covers clean console output without prompt echo/stderr logs while raw artifacts remain persisted. | Completed in slice-01. |
| QP-011 | fixed | slice-02 | `ai plan --phase technical-plan` prompts for the required `spec.slices[]` contract; `ai approve --phase technical-plan` blocks invalid drafts before writing approved artifacts; `spec create` still fails before writes for legacy invalid approvals. | Completed in slice-02. |
| QP-012 | verified-resolved | slice-00 | `tests/lib/ai-spec-generator.test.js` covers fail-before-writing and no build remnants. | Do not reimplement. |
| QP-013 | fixed | slice-01 | `ai status` reports multiple open runs; `ai run close --run <id>` archives stale runs without deleting evidence; covered by `tests/commands/ai-run-state.test.js`. | Completed in slice-01. |
| QP-014 | fixed | slice-01 | Provider-backed `ai onboard`, `ai plan`, and `ai review-plan` print clean output on success; raw output is only printed on provider failure. Covered by focused `ai plan` test. | Completed in slice-01. |
| QP-015 | fixed | slice-01 | `ai approvals` now separates run-scoped approvals, active run, global planner approvals, and run relation (`active`, `historical`, `orphaned`, `none`). | Completed in slice-01. |
| QP-016 | fixed | slice-03 | Added active-source detection for `docs/ai/ACTIVE_SLICE.md` and `ACTIVE_SLICES.md`, conflict detection, and `ai active-slice reconcile --dry-run`. Covered by resolver and CLI tests. | Completed in slice-03. |
| QP-017 | fixed | slice-05 | `ai review-plan` now stores structured `review_result` metadata with approval recommendation, blocking status, required fixes, optional hardening, risks, and next command. | Completed in slice-05. |
| QP-018 | fixed | slice-05 | Stale technical-plan review approval errors now recommend dry-run review followed by live review, and blocking review results surface the exact next command. | Completed in slice-05. |
| QP-019 | fixed | slice-05 | Review closure now distinguishes `approve`, `approve-with-risk`, and `revise`, with required fixes blocking approval and optional hardening remaining non-blocking. | Completed in slice-05. |
| QP-020 | fixed | slice-03 | `collectActiveSliceState` defines supported sources and canonical dry-run decisions: `preserve`, `close`, `replace`, and `blocked`. | Completed in slice-03. |
| QP-021 | fixed | slice-05 | Review metadata separates `required_fixes` from `optional_hardening`, and approval checks block only revise/blocking results. | Completed in slice-05. |
| QP-022 | fixed | slice-03 | Added `npx create-quiver ai active-slice status|reconcile`; `reconcile` is dry-run-first and refuses live writes. | Completed in slice-03. |
| QP-023 | fixed | slice-02 | Technical-plan approval now validates that the selected draft can generate a spec package before approving it. | Completed in slice-02. |
| QP-024 | fixed | slice-02 | Added `ai repair-plan` to create a provider-backed derived structured draft from a legacy approved invalid technical plan while preserving the original approved artifact. | Completed in slice-02. |
| QP-025 | fixed | slice-04 | `spec validate` now rejects slices missing execution git metadata required by `check-slice --local`; covered by `tests/commands/spec-validate.test.js`. | Completed in slice-04. |
| QP-026 | fixed | slice-04 | `spec status` now reports expected worktree paths that exist but are not registered in `git worktree list` as missing/stale; covered by `tests/commands/spec-worktree.test.js`. | Completed in slice-04. |
| QP-027 | fixed | slice-04 | `spec start --dry-run` dirty checkout failures now list dirty files and safe recovery options; covered by `tests/commands/spec-worktree.test.js`. | Completed in slice-04. |
| QP-028 | fixed | slice-03 | `ai inspect` detects existing specs when an active run still points at `spec create --dry-run` and now suggests `spec validate`, `next --all-ready`, and `ai prompt-slice`. | Completed in slice-03. |

## Suggestion Coverage

| Finding | Status | Primary slice | Evidence | Required action |
|---|---|---|---|---|
| QIS-001 | verified-resolved | slice-00 | v27 flow source/freshness coverage; `tests/commands/flow.test.js`. | Do not reimplement. |
| QIS-002 | fixed | slice-05 | Agent examples now include `npx --yes create-quiver@<version>` and existing shell-safe copy remains covered. | Completed in slice-05. |
| QIS-003 | fixed | slice-04 | `spec validate` now catches missing execution git metadata before users reach local slice execution. | Completed in slice-04. |
| QIS-004 | verified-resolved | slice-00 | `src/create-quiver/lib/ai/export-state.js` exposes schema v2 dashboard data. | Do not reimplement unless schema gaps appear. |
| QIS-005 | fixed | slice-05 | Executor context pack guidance now explicitly limits agents to `slice.json`, `EXECUTION_BRIEF`, `CLOSURE_BRIEF`, allowed files, acceptance criteria, and validation commands; docs include non-interactive prompt-slice examples. | Completed in slice-05. |
| QIS-006 | fixed | slice-03 | `ai inspect`, `ai export`, active-slice status, spec listing, and slice listing share resolver-backed lifecycle export data. | Completed in slice-03. |
| QIS-007 | verified-resolved | slice-00 | v27 analyzer coverage and fixtures. | Do not reimplement. |
| QIS-008 | verified-resolved | slice-00 | v27 context evidence coverage and source-backed docs contract. | Do not reimplement. |
| QIS-009 | fixed | slice-05 | GitHub preflight guidance now includes shell-specific `gh` installation and SSH alias setup/verification copy. | Completed in slice-05. |
| QIS-010 | verified-resolved | slice-00 | v27 agent docs/template cleanup. | Do not reimplement. |
| QIS-011 | verified-resolved | slice-00 | `tests/commands/ai-agent.test.js` covers `ai agent set --dry-run`. | Do not reimplement. |
| QIS-012 | verified-resolved | slice-00 | v27 artifact compaction tests and `src/create-quiver/lib/ai/artifacts.js`. | Do not reimplement. |
| QIS-013 | fixed | slice-01 | Clean/raw persistence remains, and console output no longer emits provider transcript/logs on successful planner commands. | Completed in slice-01. |
| QIS-014 | fixed | slice-02 | Structured technical-plan output is now required in planner prompts and enforced before technical-plan approval/spec creation. | Completed in slice-02. |
| QIS-015 | fixed | slice-02 | Existing generator regressions continue to cover slug/title normalization, collision refusal, multi-slice preservation, and structured markdown extraction while the shared contract validator was added. | Completed in slice-02. |
| QIS-016 | fixed | slice-01 | `ai status` exposes other open runs and `ai run close --run <id>` provides a safe archive path. | Completed in slice-01. |
| QIS-017 | fixed | slice-01 | Successful provider-backed planner commands print clean output only; raw logs remain stored/redacted. | Completed in slice-01. |
| QIS-018 | fixed | slice-01 | `ai approvals` groups active/historical run-scoped approvals separately from global approval files. | Completed in slice-01. |
| QIS-019 | fixed | slice-03 | Added `ai active-slice status|reconcile` with multi-source reporting and dry-run output. | Completed in slice-03. |
| QIS-020 | fixed | slice-05 | `summarizePlanReview` now reports approval recommendation, blocking status, required fixes, optional hardening, and next command. | Completed in slice-05. |
| QIS-021 | fixed | slice-05 | `meta.json` stores machine-readable `review_result` data for downstream agents and gates. | Completed in slice-05. |
| QIS-022 | fixed | slice-03 | Added canonical multi-source active-slice reconciliation from active doc plus root board. | Completed in slice-03. |
| QIS-023 | fixed | slice-05 | CLI help, README, README_FOR_AI, and generated command docs now include `npx --yes create-quiver@<version>` guidance for agent-pasted commands. | Completed in slice-05. |
| QIS-024 | fixed | slice-05 | Review close threshold is now `approve`, `approve-with-risk`, or `revise`; `revise` and blocking required fixes prevent technical-plan approval. | Completed in slice-05. |
| QIS-025 | fixed | slice-03 | `ai active-slice reconcile --dry-run` reports supported sources, detected sources, planned changes, risks, and no-write guarantee. | Completed in slice-03. |
| QIS-026 | fixed | slice-02 | Missing `spec.slices[]` is now caught before approval and before spec creation. | Completed in slice-02. |
| QIS-027 | fixed | slice-02 | `ai repair-plan` provides a traceable repair path for approved legacy plans missing structure. | Completed in slice-02. |
| QIS-028 | fixed | slice-04 | `spec validate` enforces local execution metadata parity with focused regression coverage. | Completed in slice-04. |
| QIS-029 | fixed | slice-04 | `spec status` detects unregistered expected worktree directories and reports them as stale. | Completed in slice-04. |
| QIS-030 | fixed | slice-04 | Dirty checkout recovery now includes blocking files and safe options. | Completed in slice-04. |
| QIS-031 | fixed | slice-03 | `collectNextSteps` now prefers existing-spec recovery commands over stale lifecycle `spec create` guidance. | Completed in slice-03. |

## Framework Improvement Sections

| Area from Pixel Quiver improvement file | Status | Primary slice | Evidence | Required action |
|---|---|---|---|---|
| Intent/spec selection before a spec exists | fixed | slice-03 | `ai inspect` now reconciles existing specs and ready slices before suggesting another spec creation path. | Completed in slice-03 without adding a separate intent system. |
| Local vs latest Quiver version visibility | documented-risk | slice-06 | Pixel saw local dependency drift vs `@latest`. | Document release-readiness check; consider future `status --versions`. |
| Standard names for improvement files | documented-risk | slice-06 | Pixel used several similar feedback files. | Document accepted feedback filenames and aliases. |
| Graph conflicts summary | out-of-scope-with-reason | slice-06 | Useful but not required for the AI lifecycle failures in v28. | Record as future graph UX work. |
| Visual validation command | out-of-scope-with-reason | slice-06 | Valuable for frontend projects, but would require browser tooling and a larger product decision. | Record as future visual evidence feature. |
| Active run management | fixed | slice-01 | `ai status` surfaces multiple open runs; `ai run close --run <id>` closes stale runs while preserving `.quiver/runs/<id>`. | Completed in slice-01. |
| Clean AI output | fixed | slice-01 | Successful provider-backed planner commands now print clean extracted output instead of raw stdout/stderr. | Completed in slice-01. |
| Active slice reconciliation | fixed | slice-03 | Matches QP-016/QP-020/QIS-019/QIS-022/QIS-025; implemented through resolver state and `ai active-slice` CLI. | Completed in slice-03. |
| Structured plan/spec create | fixed | slice-02 | Matches QP-011, QP-023, QP-024, QIS-014, QIS-015, QIS-026, and QIS-027; validated by approval, repair, spec-create, and generator tests. | Completed in slice-02. |
| Worktree and validation hardening | fixed | slice-04 | Matches QP-025 to QP-027 and QIS-028 to QIS-030; validated by spec validation, worktree, check-slice, scope, and path tests. | Completed in slice-04. |
| Review-plan closure | fixed | slice-05 | Matches QP-017/QP-019/QP-021 and QIS-020/QIS-021/QIS-024; implemented with structured review metadata and approval gating. | Completed in slice-05. |
| Agent-safe `npx --yes create-quiver@<version>` examples | fixed | slice-05 | Matches QIS-023 and Pixel command log; help/docs now include non-interactive pinned examples for agents. | Completed in slice-05. |
| GitHub auth/alias guidance | fixed | slice-05 | Matches QP-004/QIS-009; guidance and tests cover gh install/auth plus SSH alias setup across supported shells. | Completed in slice-05. |

## Execution Decisions

- `slice-01` and `slice-04` are completed after `slice-00`.
- `slice-02`, `slice-03`, and `slice-04` are completed after `slice-01`.
- `slice-05` is completed after `slice-01`; `slice-06` owns final compatibility, docs sync, smoke, and release readiness.
- Graph conflict summaries and visual validation commands are kept as documented future work, not v28 blocking implementation.
- No product code was modified by `slice-00`.
