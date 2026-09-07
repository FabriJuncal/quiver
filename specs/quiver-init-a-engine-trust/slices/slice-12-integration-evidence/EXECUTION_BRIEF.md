# EXECUTION_BRIEF — slice-12-integration-evidence

## Context

Read SPEC.md and the exact source requirements. Program state is SPEC_DRAFT;
implementation starts only after all-spec audit and dependencies are verified.

## Objective

Verify A as an integrated dependency and prepare its PR.

## Scope

- Run four directed E2E flows required by PLAN-A: draft recovery, Brain vault export, stale/contradiction context and machine/legacy parity.
- Run affected v58 governance regressions and complete existing suite on supported Node; docs/schema/package boundaries and direct facade contract tests.
- Link all 46 requirements to actual test/evidence; separate inherited V58 proof and new execution.
- Complete per-plan report with actual slice commits, cycles, commands, pending/manual checks and PR body; later integration auditor checks downstream consumption.
- Exclude Cloud application and program-only evidence from CLI tarball with executable package-boundary checks before any Cloud source is added.

## Acceptance Criteria

- Real CLI flow completes in temp project with evidence hashes and no leaked fixture secrets.
- Tarball contains Engine facade and excludes apps/quiver-cloud, test evidence and local state.
- No known failure, missing requirement or unverified required acceptance is hidden by READY state.

## Ordered Steps

1. Verify source revision, dependency evidence, clean assigned worktree and scope.
2. Inspect the listed existing modules; future test/module paths are planned.
3. Implement the required behavior and its positive/negative tests.
4. Run targeted tests; record exact command and observed results.
5. Obtain independent code review, fix required findings and retest.
6. Update evidence/traceability and produce one logical commit for this slice.

## Expected Files

- `specs/quiver-init-a-engine-trust/**`
- `docs/programs/quiver-v6/**`
- `docs/INDEX.md`
- `docs/reference/commands.md`
- `ARCHITECTURE.md`
- `README_FOR_AI.md`
- `tests/integration/engine-trust.test.js`
- `.npmignore`
- `tests/lib/package-safety.test.js`

## Restrictions

No authority bypass, secret logging, source history deletion or unrelated changes.
No unverified claim is promoted to verified. Conflicting parallel writes serialize.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/integration/engine-trust.test.js tests/lib/package-safety.test.js`
- `git diff --check`

New test paths are planned, not commands claimed executable at foundation time.
The implementer must verify the final command exists before recording a result.

## Completion Checklist

- All declared acceptance cases pass with artifact references.
- Reviewer is independent from the author.
- Cycle count and resolved findings are recorded from actual work.
- Commit includes only this slice's code, tests and evidence updates.
