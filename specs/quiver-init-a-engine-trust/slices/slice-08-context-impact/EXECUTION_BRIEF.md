# EXECUTION_BRIEF — slice-08-context-impact

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Detect contradictions, affected areas and stale context.

## Scope

- Represent claims using explicit subject/predicate/value and record authority; compare relevant contract claims and observed facts without pretending deterministic code understands arbitrary prose.
- Contradictory relevant requirements/decisions/policy produce unresolved decision with both sources; approved resolution must reference exact claims.
- Construct typed graph linking requirement/module/data/permission/API/UI/test/integration nodes from explicit refs and observed repo paths; identify inferred edges.
- Produce understandable impact summary including changed/excluded areas and required verification.
- Recompute source digests before execution; changed/missing contractual sources invalidate manifest and block executor before provider/writes.

- Revalidate receipt-backed approval authority for impact, contradiction resolution and context.verify using the slice-05 checker; unchanged content digests cannot conceal revocation or unavailable approval evidence.

## Acceptance Criteria

- Conflicting requirement blocks execution; explicit approved resolution of exact digests permits it.
- Change a source between planning and execute: stale, no provider execution.
- Impact graph returns related permissions/tests and marks unknown edges without full enterprise indexing.
- Unrelated optional source change follows explicit manifest policy and does not claim stale mandatory contract.

- CASE-A-08-X03: Revoke an approval after manifest creation without changing content bytes; context.verify returns blocked/CONTEXT_STALE with fresh=false, contradiction resolution is no longer current and executor performs no provider call/write.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/brain/impact.js`
- `src/create-quiver/lib/brain/context.js`
- `src/create-quiver/lib/ai/executor.js`
- `src/create-quiver/commands/brain.js`
- `tests/lib/brain-impact.test.js`
- `tests/commands/brain.test.js`
- `tests/lib/ai-executor.test.js`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/brain-impact.test.js tests/commands/brain.test.js tests/lib/ai-executor.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
