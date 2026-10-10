# Local draft text (not published)

## Title

feat(demo): verify a controlled Development change with real fixed tests

## Summary

Supervised application previously stopped at byte evidence. This demo adds
real before/after tests for authored catalog name search and detects a wrong
patch. Fixed tests remain outside the application patch; Core is unchanged.

## PR Policy

One slice, one future draft PR. Publication needs separate specific approval.

## Scope

Exactly the eighteen paths in slice.json; no dependency or CLI changes.

## Files

- examples/development-verification/.gitattributes
- examples/development-verification/app/catalog.cjs
- examples/development-verification/fixtures/search.cjs
- examples/development-verification/fixtures/wrong.cjs
- examples/development-verification/host-tests.cjs
- examples/development-verification/host.cjs
- examples/development-verification/run.cjs
- tests/lib/planning-controlled-development.test.js
- docs/reference/controlled-development-verification.md
- CHANGELOG.md
- specs/quiver-experimental-dry-run-planner/SPEC.md
- specs/quiver-experimental-dry-run-planner/STATUS.md
- specs/quiver-experimental-dry-run-planner/EXECUTION_PLAN.md
- specs/quiver-experimental-dry-run-planner/EVIDENCE_REPORT.md
- specs/quiver-experimental-dry-run-planner/slices/slice-05-controlled-development-tests/slice.json
- specs/quiver-experimental-dry-run-planner/slices/slice-05-controlled-development-tests/EXECUTION_BRIEF.md
- specs/quiver-experimental-dry-run-planner/slices/slice-05-controlled-development-tests/CLOSURE_BRIEF.md
- specs/quiver-experimental-dry-run-planner/slices/slice-05-controlled-development-tests/pr.md

## How to Test (DETAILED - REQUIRED)

Run commands in slice.json. The wrong variant intentionally exits 1.

## Evidence

329/329 focused checks pass with zero skips. Correct demo runs exit 1 then 0; wrong demo exit 1 then 1.
Six auxiliary gates pass and independent review has no blockers. Full Windows suite: 1298 total, 1285 passed, 3 existing real-symlink EPERM failures, 10 existing skips, zero cancelled; exit 1. This is not a full-suite pass.
No new skips or privileged tests; exact evidence and initial corrected gate failures are in EVIDENCE_REPORT.md. No remote CI yet.

## Rollback

Remove the additive demo and its tests/docs; no migrations.

## Risks / Notes

Trusted owned fixtures only; not an OS sandbox or arbitrary-project executor.
Timeout/cancellation terminate only the direct child. Human acceptance stays false.
