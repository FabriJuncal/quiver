## Title

Supervised Development application in a temporary workspace

## Summary

A structurally valid proposal previously had no check against actual file bytes.
The optional IO adapter now verifies hashes and exact patch context, asks a
trusted host to approve the reviewed binding, and applies the changes only in a
new temporary copy. It rechecks every input after approval and emits hashes and
readback evidence. The pure planner stays unchanged; supplied code is never run.

## PR Policy

One slice, one draft PR against main 1c47ccdd1ed0f126024163895c4d6ac986e515f2.
Draft publication and CI are authorized. No merge or deployment is authorized.

## Scope

Exactly the twelve files declared in slice.json.

## Files

- `src/create-quiver/lib/planning/supervised-workspace.js`
- `tests/lib/planning-supervised-workspace.test.js`
- `docs/reference/supervised-workspace.md`
- `CHANGELOG.md`
- `specs/quiver-experimental-dry-run-planner/SPEC.md`
- `specs/quiver-experimental-dry-run-planner/STATUS.md`
- `specs/quiver-experimental-dry-run-planner/EXECUTION_PLAN.md`
- `specs/quiver-experimental-dry-run-planner/EVIDENCE_REPORT.md`
- `specs/quiver-experimental-dry-run-planner/slices/slice-03-supervised-workspace/slice.json`
- `specs/quiver-experimental-dry-run-planner/slices/slice-03-supervised-workspace/EXECUTION_BRIEF.md`
- `specs/quiver-experimental-dry-run-planner/slices/slice-03-supervised-workspace/CLOSURE_BRIEF.md`
- `specs/quiver-experimental-dry-run-planner/slices/slice-03-supervised-workspace/pr.md`

## How to Test (DETAILED - REQUIRED)

Run the commands in slice.json. The focused command covers 309 tests, including
277 existing planner/proposal cases and 32 adapter cases. For the full repository
suite run `npm run test:ci`; real file symlink assertions need a capable host.

## Evidence

Final focused tests: 309 pass, zero fail/skip, exit 0. Docs, changelog, schema,
strict spec, local slice, package/installed CLI and whitespace gates pass.
Independent read-only review covered all twelve files and the final delta.
Windows full suite on tree 9f3d271c749a1e79530fc40ec90459d38761976f:
1,275 total, 1,262 pass, 3 pre-existing real-symlink EPERM failures and 10 existing
skips, exit 1. This preceded the final root normalization and three new cases;
final focused tests cover that refinement. No new skips or elevated tests.
See ../../EVIDENCE_REPORT.md for exact commands, timing, failures and limits.
Remote CI results must be recorded against this PR's exact head SHA.

## Rollback

Revert this additive slice. No source repository writes, global configuration
changes or persistent migrations are introduced.

## Risks / Notes

Host approval authenticity/freshness and filesystem isolation are host duties.
Only UTF-8 LF modification patches and bounded private copies are supported.
This is not an OS sandbox against a malicious concurrent filesystem process.
Project tests, proposed commands, Research execution and chat integration remain
outside this slice. Evidence does not claim verification or human acceptance.
