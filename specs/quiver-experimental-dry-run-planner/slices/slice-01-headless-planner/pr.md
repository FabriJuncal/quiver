## Title

Experimental Headless Planner

## Summary

Implement the reviewed pure controller, closed adapters, and adversarial tests.

## PR Policy

One slice per draft PR. No merge, execution, deployment, release, or human
acceptance is authorized by this PR.

## Scope

See [slice contract](slice.json).

## Files

One 309-line CommonJS module, 138 focused tests, two JSON examples, API docs,
changelog entry, and this slice's spec/evidence records. No dependencies or CLI
entrypoints were added.

## How to Test (DETAILED - REQUIRED)

Run `node bin/create-quiver.js spec validate specs/quiver-experimental-dry-run-planner --strict`
and the commands declared in the slice contract. Check `git diff --check`.
Implementation also requires focused/full tests, docs, and package checks.

## Evidence

See [evidence report](../../EVIDENCE_REPORT.md). Final local full suite:
1,105 passed, zero failed or skipped. Focused suite: 138 passed. Independent
review: no remaining blockers, 21 adversarial probes passed. Docs/spec/schema/
scope/changelog/package gates passed. Remote CI remains pending publication.

## Rollback

Revert the additive slice commit. There are no persistent migrations or runtime
state changes to reverse.

## Risks / Notes

Experimental plan-only API. Trusted snapshot provenance is a caller obligation.
All execution and acceptance flags stay false. Human merge remains separate.
