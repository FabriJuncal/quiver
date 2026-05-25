# EXECUTION BRIEF - slice-06: Backward compatibility, docs, and release readiness

## Context

After implementation slices, Quiver must prove the final behavior works with older generated project state and is accurately documented.

## Objective

Close v28 with compatibility tests, docs synchronization, smoke evidence, and final coverage status.

## Scope

- Source-of-truth docs.
- Command templates and troubleshooting docs.
- Smoke scripts/tests if needed.
- Final spec status, evidence, and PR body.

## Acceptance Criteria

- Every finding has a final status and evidence.
- Docs match implemented behavior.
- Source tests and available smoke tests pass.
- Package/tarball smoke evidence is recorded.
- npm is not published and PR is not opened by this slice.

## Technical Plan Summary

Run full validation, update docs, complete final evidence, and prepare release readiness without performing release actions.

## Suggested Execution Steps

1. Read closure briefs from slices 01-05.
2. Complete the final coverage matrix.
3. Update README/README_FOR_AI/ROADMAP/CHANGELOG as needed.
4. Run full tests and smoke tests.
5. Run package/tarball smoke if available.
6. Close final status/evidence.

## Restrictions

- Do not publish npm.
- Do not open PR.
- Do not change package version unless explicitly authorized.

## Risks

- Package smoke can reveal packaging issues not visible in source tests.

## Completion Checklist

- [ ] Full tests passed.
- [ ] Smoke tests passed.
- [ ] Package/tarball smoke passed or documented.
- [ ] Docs synced.
- [ ] Final matrix completed.

