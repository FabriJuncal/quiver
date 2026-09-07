# EXECUTION_BRIEF — slice-07-context-selection

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Select bounded explainable and trust-separated context.

## Scope

- Create deterministic Context Manifest with task identity, selected/excluded refs, source digests, authority, confidence, validity and reasons.
- Rank by explicit task requirements/module refs; include mandatory policy and approved contracts first, optional relevant knowledge second.
- Budget bytes as reliably measurable input; token estimate labeled estimate, not telemetry. Mandatory overflow returns blocking code instead of truncation.
- Separate trusted instructions and untrusted source content in distinct structured fields; provider prompts delimit untrusted content and cannot elevate it to instructions.
- Wire existing context-pack building to the bounded manifest while preserving legacy pack behavior where Brain absent.

- Use the slice-05 receipt authority check on each selection, not a cached active flag; noncurrent optional knowledge stays untrusted/excluded and a mandatory approved contract with unavailable or stale authority blocks selection.

## Acceptance Criteria

- Small task excludes unrelated records with explanations; repeat request deterministic.
- Mandatory contract above budget fails, optional record omitted with reason.
- Malicious source text stays untrusted; invalid confidence/authority rejected.
- Legacy project context pack remains compatible and never labeled Brain-verified.

- CASE-A-07-X03: Current receipt-backed authority may enter trusted_instructions; revoke or make its resolver unavailable with content bytes unchanged and selection excludes optional authority or blocks a mandatory contract.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/brain/context.js`
- `src/create-quiver/lib/ai/context-packs.js`
- `tests/lib/brain-context.test.js`
- `tests/lib/ai-context-packs.test.js`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/brain-context.test.js tests/lib/ai-context-packs.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
