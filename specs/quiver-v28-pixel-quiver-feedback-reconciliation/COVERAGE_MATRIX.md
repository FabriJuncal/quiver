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
| QP-002 | partial | slice-05 | v27 matrix maps path examples to slice-08; `tests/lib/paths.test.js`; Pixel still asks for agent-safe command examples. | Extend agent-facing examples with copy-safe, versioned commands. |
| QP-003 | partial | slice-03 | v27 resolver/export exists in `src/create-quiver/lib/project-state-resolver.js` and `src/create-quiver/lib/ai/export-state.js`; Pixel still found `ai inspect/specs/slices` discovery drift. | Reconcile AI inspect/listing with existing specs and fallback-created specs. |
| QP-004 | partial | slice-05 | v27 covers GitHub auth preflight; `src/create-quiver/lib/ai/github.js`; Pixel found `ai doctor --dry-run` unclear vs `gh auth status`. | Improve GitHub auth/alias recovery copy for agents. |
| QP-005 | verified-resolved | slice-00 | v27 matrix maps React/Vite analyzer detection to slice-07; `tests/commands/analyze.test.js`; `tests/fixtures/validation-errors/matrix.json`. | Do not reimplement unless a new failing fixture appears. |
| QP-006 | verified-resolved | slice-00 | v27 matrix maps evidence-backed `prepare-context` to slice-07; `README_FOR_AI.md`; `docs/PROJECT_MAP.md` contract in templates. | Do not reimplement. |
| QP-007 | verified-resolved | slice-00 | v27 matrix maps agent docs gaps to slice-07/slice-08; generated templates include current docs instead of missing `docs/ai/QUICK.md` style paths. | Do not reimplement. |
| QP-008 | verified-resolved | slice-00 | v27 status is 100%; v27 evidence says source-of-truth docs were synchronized; `README_FOR_AI.md` documents v27 coverage. | Do not reimplement. |
| QP-009 | verified-resolved | slice-00 | `src/create-quiver/lib/ai/artifacts.js`; `tests/commands/ai-plan.test.js`; v27 slice-04 closure covers revise compaction. | Do not reimplement. |
| QP-010 | fixed | slice-01 | `src/create-quiver/commands/ai.js`; `tests/commands/ai-plan.test.js` covers clean console output without prompt echo/stderr logs while raw artifacts remain persisted. | Completed in slice-01. |
| QP-011 | partial | slice-02 | `tests/commands/spec-create.test.js` proves safe failure for missing structured slices; Pixel still needs planner-generated `spec.slices[]`. | Require/generate structured technical-plan contract before approval/spec create. |
| QP-012 | verified-resolved | slice-00 | `tests/lib/ai-spec-generator.test.js` covers fail-before-writing and no build remnants. | Do not reimplement. |
| QP-013 | fixed | slice-01 | `ai status` reports multiple open runs; `ai run close --run <id>` archives stale runs without deleting evidence; covered by `tests/commands/ai-run-state.test.js`. | Completed in slice-01. |
| QP-014 | fixed | slice-01 | Provider-backed `ai onboard`, `ai plan`, and `ai review-plan` print clean output on success; raw output is only printed on provider failure. Covered by focused `ai plan` test. | Completed in slice-01. |
| QP-015 | fixed | slice-01 | `ai approvals` now separates run-scoped approvals, active run, global planner approvals, and run relation (`active`, `historical`, `orphaned`, `none`). | Completed in slice-01. |
| QP-016 | pending | slice-03 | Current lifecycle writes `docs/ai/ACTIVE_SLICE.md` and root `ACTIVE_SLICES.md`; no dry-run reconciliation command exists. | Add multi-source active-slice reconciliation. |
| QP-017 | partial | slice-05 | `readPlanReview` tracks stale/unapproved/reviewed, but review output lacks structured approval recommendation. | Add review metadata for blocking vs optional issues. |
| QP-018 | partial | slice-05 | `ai approve` blocks stale reviews; error is not recovery-rich enough for the observed stale-review loop. | Add clearer recovery and recommended next command. |
| QP-019 | pending | slice-05 | No structured review closure threshold was found. | Add P0/P1/P2, `approvalRecommendation`, required fixes, optional hardening. |
| QP-020 | pending | slice-03 | `src/create-quiver/lib/lifecycle.js` still maintains both active-slice files. | Define a canonical reconciliation protocol. |
| QP-021 | pending | slice-05 | Current review metadata lacks "blocking vs optional" closure result. | Add formal approvability status. |
| QP-022 | pending | slice-03 | No official `active-slice reconcile --dry-run` style command exists. | Add dry-run-first reconciliation. |
| QP-023 | partial | slice-02 | `spec create` fails safely when `spec.slices[]` is missing, but the planner can still produce an approved plan without that structure. | Enforce the contract before approval and support repair. |
| QP-024 | pending | slice-02 | No official post-approval repair command was found. | Add derived repair draft requiring review and approval. |
| QP-025 | partial | slice-04 | `spec validate` checks docs/briefs/safe paths but not the full `check-slice --local` execution metadata contract. | Align validation gates or report strict warnings. |
| QP-026 | partial | slice-04 | Current `spec-worktrees.js` has missing/stale fields, but Pixel found a false healthy report and command-level coverage is thin. | Add regression coverage and fix remaining false-negative paths. |
| QP-027 | partial | slice-04 | `tests/commands/spec-worktree.test.js` checks dirty refusal, but the message remains generic. | Print blocking files and safe options. |
| QP-028 | pending | slice-03 | `run-state.js` has phase-based next command `spec create --dry-run`; no reconciliation with existing fallback specs. | Make `ai inspect` prefer `spec validate`, `next`, or slice prompts when a spec already exists. |

## Suggestion Coverage

| Finding | Status | Primary slice | Evidence | Required action |
|---|---|---|---|---|
| QIS-001 | verified-resolved | slice-00 | v27 flow source/freshness coverage; `tests/commands/flow.test.js`. | Do not reimplement. |
| QIS-002 | partial | slice-05 | v27 path handling exists; agent examples still need `npx --yes create-quiver@<version>` and shell-safe copy. | Update help/prompts/docs for agent-safe examples. |
| QIS-003 | partial | slice-04 | `spec validate` exists, but execution metadata parity is incomplete. | Harden validation. |
| QIS-004 | verified-resolved | slice-00 | `src/create-quiver/lib/ai/export-state.js` exposes schema v2 dashboard data. | Do not reimplement unless schema gaps appear. |
| QIS-005 | partial | slice-05 | Handoff/brief validation exists; no dedicated compact executor handoff/package command was confirmed. | Add or document minimal context handoff output for agents. |
| QIS-006 | partial | slice-03 | Shared resolver exists; Pixel still saw AI/classic command drift. | Route inspect/list/fallback recovery through the same resolver. |
| QIS-007 | verified-resolved | slice-00 | v27 analyzer coverage and fixtures. | Do not reimplement. |
| QIS-008 | verified-resolved | slice-00 | v27 context evidence coverage and source-backed docs contract. | Do not reimplement. |
| QIS-009 | partial | slice-05 | GitHub auth preflight exists; Pixel evidence asks for clearer auth/alias guidance. | Improve diagnostic output and tests. |
| QIS-010 | verified-resolved | slice-00 | v27 agent docs/template cleanup. | Do not reimplement. |
| QIS-011 | verified-resolved | slice-00 | `tests/commands/ai-agent.test.js` covers `ai agent set --dry-run`. | Do not reimplement. |
| QIS-012 | verified-resolved | slice-00 | v27 artifact compaction tests and `src/create-quiver/lib/ai/artifacts.js`. | Do not reimplement. |
| QIS-013 | fixed | slice-01 | Clean/raw persistence remains, and console output no longer emits provider transcript/logs on successful planner commands. | Completed in slice-01. |
| QIS-014 | partial | slice-02 | `spec create` parses structured slices and fails safely; planner contract is not guaranteed before approval. | Enforce structured plans in planner flow. |
| QIS-015 | partial | slice-02 | Slug generation exists in `spec-templates.js`; default titles/slug collisions remain tied to structured spec generation. | Add focused regressions while changing spec generator. |
| QIS-016 | fixed | slice-01 | `ai status` exposes other open runs and `ai run close --run <id>` provides a safe archive path. | Completed in slice-01. |
| QIS-017 | fixed | slice-01 | Successful provider-backed planner commands print clean output only; raw logs remain stored/redacted. | Completed in slice-01. |
| QIS-018 | fixed | slice-01 | `ai approvals` groups active/historical run-scoped approvals separately from global approval files. | Completed in slice-01. |
| QIS-019 | pending | slice-03 | No active-slice reconciliation command found. | Add protocol and CLI. |
| QIS-020 | pending | slice-05 | Review/revise status lacks structured closure state. | Add state summary and next action. |
| QIS-021 | pending | slice-05 | No structured approvability metadata found. | Add machine-readable review result. |
| QIS-022 | pending | slice-03 | Multi-source active-slice protocol missing. | Add canonical reconciliation. |
| QIS-023 | pending | slice-05 | Help/docs still include plain `npx create-quiver` examples in several places. | Prefer non-interactive versioned examples for agent prompts. |
| QIS-024 | pending | slice-05 | Review close threshold missing. | Add threshold/status contract. |
| QIS-025 | pending | slice-03 | Active-slice dry-run missing. | Add dry-run output with planned writes and risks. |
| QIS-026 | partial | slice-02 | Safe failure exists, but planner output can still omit `spec.slices[]`. | Make structured plan contract mandatory. |
| QIS-027 | pending | slice-02 | Repair flow missing. | Add repair command/phase. |
| QIS-028 | partial | slice-04 | Validation exists but does not fully match `check-slice --local`. | Align validators. |
| QIS-029 | partial | slice-04 | Worktree missing/stale code exists; add command-level regression for observed false healthy state. | Harden `spec status`. |
| QIS-030 | partial | slice-04 | Dirty checkout refusal exists; recovery copy is not actionable enough. | Improve diagnostics. |
| QIS-031 | pending | slice-03 | `ai inspect` next command remains phase-based, not spec-aware after fallback. | Reconcile with existing specs. |

## Framework Improvement Sections

| Area from Pixel Quiver improvement file | Status | Primary slice | Evidence | Required action |
|---|---|---|---|---|
| Intent/spec selection before a spec exists | partial | slice-03 | `flow`/`doctor` can suggest another ready spec; no explicit intent command exists. | Treat as active-state/inspect reconciliation; do not add a separate intent system unless needed. |
| Local vs latest Quiver version visibility | documented-risk | slice-06 | Pixel saw local dependency drift vs `@latest`. | Document release-readiness check; consider future `status --versions`. |
| Standard names for improvement files | documented-risk | slice-06 | Pixel used several similar feedback files. | Document accepted feedback filenames and aliases. |
| Graph conflicts summary | out-of-scope-with-reason | slice-06 | Useful but not required for the AI lifecycle failures in v28. | Record as future graph UX work. |
| Visual validation command | out-of-scope-with-reason | slice-06 | Valuable for frontend projects, but would require browser tooling and a larger product decision. | Record as future visual evidence feature. |
| Active run management | fixed | slice-01 | `ai status` surfaces multiple open runs; `ai run close --run <id>` closes stale runs while preserving `.quiver/runs/<id>`. | Completed in slice-01. |
| Clean AI output | fixed | slice-01 | Successful provider-backed planner commands now print clean extracted output instead of raw stdout/stderr. | Completed in slice-01. |
| Active slice reconciliation | pending | slice-03 | Matches QP-016/QP-020/QIS-019/QIS-022/QIS-025. | Implement in active-slice slice. |
| Structured plan/spec create | partial | slice-02 | Matches QP-023/QIS-026. | Implement contract/repair slice. |
| Worktree and validation hardening | partial | slice-04 | Matches QP-025 to QP-027 and QIS-028 to QIS-030. | Implement validation/worktree slice. |
| Review-plan closure | pending | slice-05 | Matches QP-017/QP-019/QP-021 and QIS-020/QIS-021/QIS-024. | Implement review metadata. |
| Agent-safe `npx --yes create-quiver@<version>` examples | pending | slice-05 | Matches QIS-023 and Pixel command log. | Update prompts/help/docs. |
| GitHub auth/alias guidance | partial | slice-05 | Matches QP-004/QIS-009. | Improve diagnostic copy and tests. |

## Execution Decisions

- `slice-01` and `slice-04` are ready after `slice-00`.
- `slice-02`, `slice-03`, and `slice-05` remain blocked on `slice-01` because they depend on clarified run/approval state.
- `slice-05` owns agent DX, including GitHub auth copy, handoff context packaging, and versioned command examples.
- Graph conflict summaries and visual validation commands are kept as documented future work, not v28 blocking implementation.
- No product code was modified by `slice-00`.
