# EXECUTION_BRIEF — slice-09-artifact-envelopes

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Version artifacts, lineage and offline verification.

## Scope

- Define immutable contractual envelope independent of mutable execution status; schema version, id/type/version/digest, parents, inputs, actor and evidence status mandatory.
- Canonical JSON digest uses recursive lexicographic key ordering, UTF-8, no whitespace, digest field excluded; arrays preserve order; reject non-JSON and cycles.
- Support derives-from/supersedes/amends/verifies/executes/approves/deploys with explicit source/target IDs and digests; no orphan verification or authority gain from relation name.
- Offline verification checks structural validity, digest and available referenced content; unavailable external parents remain unverified rather than false verified.
- Legacy read projection retains original identity/history and evidence limitations, does not mutate legacy files.

## Acceptance Criteria

- Envelope identical input yields identical digest; tamper fails offline verify.
- Lineage cycle/missing parent/different parent bytes yields explicit failure or unverified per evidence availability.
- Changing execution status cannot change contractual digest.
- Legacy artifact reads with unverified evidence, never elevated by envelope wrapping.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `src/create-quiver/lib/protocol/envelope.js`
- `src/create-quiver/lib/protocol/result.js`
- `src/create-quiver/lib/brain/store.js`
- `tests/lib/protocol-envelope.test.js`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/protocol-envelope.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
