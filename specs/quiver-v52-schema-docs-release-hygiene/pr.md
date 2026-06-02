## Title

QUIVER-52: Schema, Docs, and Release Hygiene planning baseline

## Summary

Adds the Quiver v52 Schema, Docs, and Release Hygiene spec package and closes its `slice-00` baseline.

The baseline identifies that `slice.json` validation is currently split across runtime validation and spec generation, classifies package boundaries, chooses protected generated blocks for command reference updates, and preserves existing package/release smoke checks as the starting point.

## Scope

- Adds the v52 spec documentation, status, evidence report, slices, and per-slice handoff briefs.
- Marks `slice-00-schema-docs-release-baseline` as completed.
- Records schema source, package boundary, generated docs strategy, and release-smoke gaps.
- Does not modify runtime code.

## Files

- `specs/quiver-v52-schema-docs-release-hygiene/SPEC.md`
- `specs/quiver-v52-schema-docs-release-hygiene/STATUS.md`
- `specs/quiver-v52-schema-docs-release-hygiene/EVIDENCE_REPORT.md`
- `specs/quiver-v52-schema-docs-release-hygiene/pr.md`
- `specs/quiver-v52-schema-docs-release-hygiene/slices/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js available locally.
- Repository checkout with Quiver CLI scripts available.
- GitHub CLI is not required to validate the spec contents.

### Worktree Access

- Checkout this PR branch.
- Confirm no runtime source files are changed by this PR.

### Run the Project

No application runtime needs to be started; this PR is documentation/spec planning only.

### Use Cases

- Review the v52 baseline table in `SPEC.md`.
- Confirm schema source-of-truth constraints are explicit.
- Confirm generated docs and package boundary decisions are recorded before implementation.

### Technical Verification

```bash
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene
```

## Evidence

- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`: passed.
- Runtime code was not modified.

## Rollback

Remove `specs/quiver-v52-schema-docs-release-hygiene/` and revert the commit.

## Risks / Notes

- This PR intentionally excludes local audit inputs, PDFs, copy docs, and other root-level untracked files.
- Follow-up implementation must start from `slice-01-json-schema-for-slice-json`.
