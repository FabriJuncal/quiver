# EXECUTION_BRIEF — slice-01-draft-integrity

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Preserve draft history and detect structural content loss.

## Scope

- Extend existing approval metadata additively under the existing phase lock; immutable version files remain authoritative.
- Compute preservation using requirement/acceptance/slice IDs, structured required collections and references. Compare identity, not word-count thresholds.
- Persist defective candidates as corrupted and retain last valid current, with explicit diagnostics and transactional recovery marker for multi-file projection.
- Expose lifecycle draft/current/reviewed/approved/approved-with-conditions/rejected/superseded/corrupted without treating current selection as approval.
- Define the full lifecycle vocabulary here; exact review/conditioned/reject/restore projections are integrated by dependent slice-02. V59-RQ-07 is not fully verified until that evidence exists.
- Existing ai planning writers must honor the new save result: an unselected/corrupted candidate cannot advance phase or replace the valid run artifact. New CLI namespace still belongs to slice-04.
- Existing plaintext success fixtures gain stable AC/slice IDs while preserving original assertion intent; no test-only bypass or disabled tests.

## Acceptance Criteria

- Candidate drops a required ID or structured collection: corrupted, current/history unchanged.
- Valid addition or explicit deletion amendment: no false content-loss claim.
- Crash between writes, corrupt metadata, duplicate version and competing writer fail closed or recover deterministically.

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
- `tests/lib/draft-integrity.test.js`
- `tests/lib/approvals.test.js`
- `src/create-quiver/commands/ai.js` (existing save-result handling only)
- `tests/commands/ai-plan.test.js`
- `tests/commands/ai-review-plan.test.js`
- `tests/commands/ai-run-state.test.js`
- `tests/commands/flow.test.js`
- `tests/commands/ai-plan-spec-phase.test.js`
- `tests/commands/spec-create.test.js`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

Implementation decision DEC-A-010, 2026-09-06: read-only call-graph inspection
found existing writers and plaintext fixtures coupled to automatic selection.
The above narrow scope makes the integrity change coherent in its own commit;
it does not reopen reviewed contracts or implement slice-02/04 features early.
Full-suite cycle 1 found one additional `spec create` invalid-shape fixture that
depended on automatic selection of unstructured Markdown. Its stable slice ID is
in scope so the original missing-structured-slices and no-write assertions remain
reachable without an integrity bypass (coordinator authorization, 2026-09-06).

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/draft-integrity.test.js tests/lib/approvals.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
