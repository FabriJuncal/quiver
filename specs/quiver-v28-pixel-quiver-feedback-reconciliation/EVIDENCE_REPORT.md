# Evidence Report - Quiver v28 Pixel Quiver Feedback Reconciliation

## slice-00-reconciliation-and-evidence-freeze

Completed on 2026-05-25.

### Source Evidence Frozen

The following Pixel Quiver files were treated as evidence inputs only. They were not copied into fixtures.

| Source | SHA-256 | Modified |
|---|---|---|
| `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/Pixel Quiver/QUIVER_PROBLEMS.md` | `516d8928af437fc3d20cacfe50fb78752954eb59b6dace6860cdda820aa6701d` | 2026-05-25 03:29:24 -03 |
| `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/Pixel Quiver/QUIVER_IMPROVEMENT_SUGGESTIONS.md` | `43c4bfbef68fc8343b7f905f299c53716b55abcace415c9ce1088aa53ac12949` | 2026-05-25 03:29:39 -03 |
| `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/Pixel Quiver/QUIVER_FRAMEWORK_IMPROVEMENTS.md` | `7a4eb66a996fc44cce80df4907a948fbef3e780a5f8fc856a6bdc2b0bd1f1ea3` | 2026-05-25 03:29:53 -03 |

Detected IDs:

- `QP-001` to `QP-028`
- `QIS-001` to `QIS-031`
- Narrative framework-improvement sections without stable IDs

### Repository Evidence Inspected

- `README_FOR_AI.md`
- `ROADMAP.md`
- `BACKLOG.md`
- `CHANGELOG.md`
- `specs/quiver-v27-reliability-ai-workflow-hardening/COVERAGE_MATRIX.md`
- `specs/quiver-v27-reliability-ai-workflow-hardening/STATUS.md`
- `specs/quiver-v27-reliability-ai-workflow-hardening/EVIDENCE_REPORT.md`
- `src/create-quiver/commands/spec.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/run-state.js`
- `src/create-quiver/lib/ai/export-state.js`
- `src/create-quiver/lib/ai/plan-review.js`
- `src/create-quiver/lib/approvals.js`
- `src/create-quiver/lib/spec-worktrees.js`
- `src/create-quiver/lib/lifecycle.js`
- Focused tests under `tests/commands/*` and `tests/lib/*`

### Reconciliation Outcome

- v27 is documented as complete and covers many earlier findings (`QP-001` to `QP-019`, `QIS-001` to `QIS-022`), but several later Pixel Quiver findings expose gaps that v27 either did not intend to solve or only partially solved.
- Confirmed no product-code change is required for `slice-00`.
- The final execution mapping is now captured in `COVERAGE_MATRIX.md`.
- `slice-01` and `slice-04` are the only implementation slices ready immediately after `slice-00`.

## Evidence Required by Pending Slices

| Slice | Required evidence |
|---|---|
| slice-02 | Tests for valid, invalid, and missing `spec.slices[]`; no-write dry-run/failure coverage; repair-flow tests requiring review plus approval. |
| slice-03 | Tests for `ACTIVE_SLICE.md` plus `ACTIVE_SLICES.md` conflicts; dry-run reconciliation; `ai inspect` fallback when specs already exist. |
| slice-05 | Tests for structured `ai review-plan` metadata; approve-with-risk/revise recommendations; agent-safe commands; GitHub auth/alias guidance. |
| slice-06 | Full source tests, smoke tests, package/tarball smoke, docs sync, final matrix status, and release-readiness risks. |

## Validation Evidence for slice-00

Passed:

- `git diff --check`
- JSON parse validation for all v28 `slice.json` files
- `node bin/create-quiver.js spec validate specs/quiver-v28-pixel-quiver-feedback-reconciliation`
- `node bin/create-quiver.js spec validate specs/quiver-v28-pixel-quiver-feedback-reconciliation --strict`
- `node bin/create-quiver.js check-slice --local specs/quiver-v28-pixel-quiver-feedback-reconciliation/slices/slice-00-reconciliation-and-evidence-freeze/slice.json`
- `node bin/create-quiver.js next --all-ready --spec quiver-v28-pixel-quiver-feedback-reconciliation`
- `node bin/create-quiver.js plan --spec quiver-v28-pixel-quiver-feedback-reconciliation --json`

Ready slices reported after `slice-00`:

- `slice-01-ai-run-state-approvals-and-clean-output`
- `slice-04-spec-validation-scope-and-worktree-reliability`

## slice-01-ai-run-state-approvals-and-clean-output

Completed on 2026-05-25.

### Implementation Evidence

- Updated `src/create-quiver/commands/ai.js` so successful provider-backed planner commands print clean extracted output instead of raw stdout/stderr.
- Preserved raw provider artifact persistence and redaction for `ai plan` and `ai review-plan`.
- Updated `ai approvals` output to separate run-scoped approvals, active run, global planner approvals, and run relation.
- Added `ai run close --run <id>` to close/archive stale runs without deleting `.quiver/runs/<id>` evidence.
- Updated `src/create-quiver/lib/ai/run-state.js` so `ai status` reports the number of open runs and lists other open runs with next safe commands.

### Validation Evidence

Passed:

- `node --test tests/commands/ai-run-state.test.js tests/commands/ai-plan.test.js tests/commands/ai-export.test.js tests/commands/cli-contract.test.js`
- `node --test tests/lib/ai-run-state.test.js tests/lib/approvals.test.js tests/lib/ai-export-state.test.js`

## slice-04-spec-validation-scope-and-worktree-reliability

Completed on 2026-05-25.

### Implementation Evidence

- Updated `src/create-quiver/commands/spec.js` so `spec validate` rejects slices missing execution git metadata required by local slice execution: `git.branch_type`, `git.base_branch`, `git.branch_slug`, and `git.branch_name`.
- Updated `src/create-quiver/lib/spec-worktrees.js` so `spec status` reports expected worktree paths that exist on disk but are not registered in `git worktree list` as missing/stale.
- Updated dirty checkout failures in `spec start --dry-run` to list blocking dirty files and safe recovery options without modifying state.
- Added regression coverage for exact path plus supported glob scope matching.

### Validation Evidence

Passed:

- `node --test tests/commands/spec-validate.test.js tests/commands/spec-worktree.test.js`
- `node --test tests/lib/check-slice.test.js tests/lib/scope.test.js tests/lib/paths.test.js`
