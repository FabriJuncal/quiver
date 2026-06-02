## Title

QUIVER-50: Audit Trust Foundation planning baseline

## Summary

Adds the Quiver v50 Audit Trust Foundation spec package and closes its `slice-00` baseline.

The baseline classifies audit-derived trust findings against current repository behavior before implementation. It routes runtime minimum metadata, migrate write-safety, security reporting, i18n coverage, init/analyze UX, contributor docs, and CI/docs hardening to later slices while marking already-covered behavior as evidence-only.

## Scope

- Adds the v50 spec documentation, status, evidence report, slices, and per-slice handoff briefs.
- Marks `slice-00-audit-baseline-and-resolved-findings` as completed.
- Records current implementation state and next-slice actions.
- Does not modify runtime code.

## Files

- `specs/quiver-v50-audit-trust-foundation/SPEC.md`
- `specs/quiver-v50-audit-trust-foundation/STATUS.md`
- `specs/quiver-v50-audit-trust-foundation/EVIDENCE_REPORT.md`
- `specs/quiver-v50-audit-trust-foundation/pr.md`
- `specs/quiver-v50-audit-trust-foundation/slices/**`

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

- Review the v50 baseline table in `SPEC.md`.
- Confirm later slices have explicit execution and closure briefs.
- Confirm `slice-00` is completed and later slices remain planned.

### Technical Verification

```bash
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation
```

## Evidence

- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v50-audit-trust-foundation`: passed.
- Runtime code was not modified.

## Rollback

Remove `specs/quiver-v50-audit-trust-foundation/` and revert the commit.

## Risks / Notes

- This PR intentionally excludes local audit inputs, PDFs, copy docs, and other root-level untracked files.
- Follow-up implementation must start from `slice-01-runtime-minimum-and-package-metadata`.
