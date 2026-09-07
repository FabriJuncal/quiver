# EXECUTION_BRIEF — slice-00-foundation

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Executable foundation and inherited V58 verification.

## Scope

- Freeze all seven specs and review global interfaces before implementation.
- Verify V58 merged status, seven completed slices and existing governance tests; reference inherited implementation rather than recreate it.
- Produce schema-valid slices, dependency manifest, exact 314-RQ ownership and independent audit.

## Acceptance Criteria

- All RQ IDs have exactly one owner; DAG has no cycle.
- V58 baseline tests actually pass; inherited status never asserts npm publication.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `docs/INDEX.md` (link the execution program from the canonical map)
- `docs/programs/quiver-v6/**`
- `specs/quiver-init-a-engine-trust/**`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `npm run schema:slice:check`
- `node bin/create-quiver.js spec validate specs/quiver-init-a-engine-trust --strict`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
