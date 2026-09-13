# EXECUTION_BRIEF — slice-02-draft-recovery

## Context

Read SPEC.md and the exact source requirements. The all-spec audit and A01/A05
dependency integration were verified before implementation.

## Objective

Recover and approve an earlier still-valid draft.

## Scope

- Provide compare/select/reject/restore operations over exact immutable versions, verifying artifact and input digests under phase lock.
- Make selected current version explicit and ensure candidate guidance, review and approval consume it; do not simply remove existing historical-version guards.
- Preserve v58 actor, findings, conditioned decisions and review budget gates; a historical version with stale inputs cannot be approved.
- Rollback moves only current projection and selection metadata; no version deletion or rewriting approval history.

## Acceptance Criteria

- Create v1 and v2, select v1, review/approve valid v1 and inspect same version.
- Change original input, then restore or approve: stale rejection with no approval write.
- Recover corrupted last version; invalid ID/path cannot escape approval root.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/ai/draft-integrity.js`
- `src/create-quiver/lib/approvals.js`
- `src/create-quiver/lib/ai/approval-candidates.js`
- `src/create-quiver/lib/ai/phase-gates.js`
- `src/create-quiver/lib/ai/plan-review.js`
- `src/create-quiver/lib/ai/run-state.js`
- `src/create-quiver/commands/ai.js`
- `tests/lib/draft-integrity.test.js`
- `tests/lib/approvals.test.js`
- `tests/commands/ai-draft-recovery.test.js`
- `tests/commands/ai-plan.test.js`
- `tests/commands/ai-review-plan.test.js`
- `tests/commands/ai-run-state.test.js`
- `tests/commands/spec-create.test.js`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/draft-integrity.test.js tests/lib/approvals.test.js tests/commands/ai-draft-recovery.test.js`
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/commands/ai-plan.test.js`
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/commands/ai-review-plan.test.js`
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/commands/ai-run-state.test.js`
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/commands/spec-create.test.js`
- `git diff --check`

The final commands exist and their observed results are recorded in the closure
and slice evidence. Initiative-wide full CI remains coordinator-owned.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
