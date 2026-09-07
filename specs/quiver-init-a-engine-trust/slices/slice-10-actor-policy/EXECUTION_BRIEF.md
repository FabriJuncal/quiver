# EXECUTION_BRIEF — slice-10-actor-policy

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Expose verifiable actor authorization and policy explanation.

## Scope

- Reuse v58 actor resolver/authorization oracle; new decisions bind verified actor ID, action, target/version/digest, policy ID/digest and rule.
- Default deny missing identity, wrong scope, stale policy or unverified authorization; no client-provided role assertion grants authority.
- Expose explain/dry-run from same decision evaluator with rule/reason/remediation and no mutation.
- Keep high-assurance governance and conditioned findings visible in canonical projection.

- Connect the existing local actor/policy adapter to slice-05 authority without writing a new approval ledger. A Cloud receipt validates the original deciding actor/action/policy separately from the current Brain writer's required grants; policy.authorize alone never creates approved knowledge.

## Acceptance Criteria

- Authorized actor within exact target/policy may act; other org/project/version denied.
- Claimed actor or forged role denied; unavailable resolver explicit capability status.
- Explain and authorize agree; dry-run creates no decision; changed policy digest invalidates cached permission.

- CASE-A-10-X03: A current writer cannot substitute its identity for the receipt's decision-maker, or upgrade an oracle allowed result into an approval; v58 approvals and default-unverified local behavior remain unchanged.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/protocol/policy.js`
- `src/create-quiver/lib/ai/review-governance.js`
- `tests/lib/protocol-policy.test.js`
- `specs/quiver-init-a-engine-trust/**`

- `src/create-quiver/lib/brain/authority.js`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/protocol-policy.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
