# EXECUTION_BRIEF — slice-03-effective-amendments

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Build deterministic addendum and amendment contracts.

## Scope

- Create immutable addendum records bound to parent digest and required input identity; resolve effective content with ordered lineage.
- Accept deterministic structured operations addressed by stable IDs for supported JSON sections only; reject arbitrary source execution and ambiguous Markdown patching.
- Require explicit removals and affected identities, verify references after operations, detect cycles/missing parents/tamper.
- Reuse v58 review-event classification; retry keeps request identity and cannot masquerade as a free semantic revision.

## Acceptance Criteria

- Addendum augments content while preserving parent; effective digest reproducible.
- Amendment changes one ID, explicit delete repairs references or fails; malformed operations and stale parents rejected.
- Retry vs new semantic revision preserves distinct ledger identities and budget consumption.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/ai/draft-integrity.js`
- `src/create-quiver/lib/ai/effective-contract.js`
- `src/create-quiver/lib/ai/review-budget.js`
- `tests/lib/effective-contract.test.js`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/effective-contract.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
