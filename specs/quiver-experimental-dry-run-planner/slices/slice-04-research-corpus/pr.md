## Title

feat(research): compare literal terms with source-bound citations

## Summary

Research planning previously returned only an outline. This optional pure adapter
now checks supplied source bytes against their hashes/sizes and produces actual
case-sensitive literal comparisons with line citations. It reuses the unchanged
Core plan, scope and permissions. No external source acquisition or code runs.

Default output contains locations, not source text. Verbatim quotes require an
explicit host option outside corpus data, bound into the report. Queries and
metadata remain unredacted; this is not semantic verification or authorization.

## PR Policy

Local draft text only; publication requires separate authorization. One slice,
one future draft PR against main 688ae68c69b1a31cb70cee0af85a20fa1f5a80cc.
Merged PR152 is inherited unchanged. No merge or deployment requested.

## Scope

Exactly fifteen declared files; Core, previous tests, package metadata and lockfile unchanged.

## Files

- `src/create-quiver/lib/planning/research-corpus.js`
- `tests/lib/planning-research-corpus.test.js`
- `docs/reference/research-corpus.md`
- `examples/research-corpus/run.js`
- `examples/research-corpus/source-alpha.md`
- `examples/research-corpus/source-beta.md`
- `CHANGELOG.md`
- `specs/quiver-experimental-dry-run-planner/SPEC.md`
- `specs/quiver-experimental-dry-run-planner/STATUS.md`
- `specs/quiver-experimental-dry-run-planner/EXECUTION_PLAN.md`
- `specs/quiver-experimental-dry-run-planner/EVIDENCE_REPORT.md`
- `specs/quiver-experimental-dry-run-planner/slices/slice-04-research-corpus/slice.json`
- `specs/quiver-experimental-dry-run-planner/slices/slice-04-research-corpus/EXECUTION_BRIEF.md`
- `specs/quiver-experimental-dry-run-planner/slices/slice-04-research-corpus/CLOSURE_BRIEF.md`
- `specs/quiver-experimental-dry-run-planner/slices/slice-04-research-corpus/pr.md`

## How to Test (DETAILED - REQUIRED)

Run the sequential commands in slice.json. Run `npm run test:ci` for the full
repository suite in a symlink-capable environment. The authored disk-corpus demo
is `node examples/research-corpus/run.js`; six comparisons and their citations are
verified against its two known fictional documents. No external research is simulated.

## Evidence

- Focused: 351/351, zero failures/skips, exit 0 (42 new + 309 existing).
- Independent review: default quote disclosure and missing Title corrected;
  implementation/contract rechecked without concrete remaining functional defects.
- Full Windows suite on cd4b31ffbfd4ef703b89f39f696c5b4a59a061cd: 1,320 total,
  1,307 pass, 3 existing real-symlink EPERM failures and 10 existing skips; exit 1.
  No new skips or privileged tests. This is not a full-suite pass.
- Earlier dependency-resolution attempt preserved; repeated on identical code
  after copying existing same-lockfile dependencies locally, no new installation.
- Final documentary/package gates are recorded in EVIDENCE_REPORT.md and local
  reviewed-gates.json. No remote CI for this new delta has been run.

## Rollback

Revert this additive Research slice; no migrations or persistent source writes.

## Risks / Notes

Caller supplies source provenance; literal presence does not prove semantic
support, factual truth or completeness. Host must authorize verbatim disclosure.
Metadata, query text, hashes and counts are not anonymized. Source acquisition,
semantic synthesis/verification and chat integration remain open MVP work.
Project-code execution requires separate isolation: temporary folders are not
an OS sandbox. No publication, merge, deploy or complete MVP acceptance claimed.
