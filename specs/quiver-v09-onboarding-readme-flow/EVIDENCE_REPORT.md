# Quiver v0.9 Evidence Report

**Spec:** quiver-v09-onboarding-readme-flow
**Last updated:** 2026-04-21
**Status:** In progress

## Summary

| Slice | Acceptance criteria | Status | Evidence |
|-------|---------------------|--------|----------|
| slice-01 | 5 | Completed | `bash scripts/ci/smoke-init-docs.sh` |
| slice-02 | 5 | Pending | - |

## Evidence by Slice

### slice-01-developer-readme-onboarding-flow

- Reworked the root README around install, analyze, doctor, AI handoff, review, and first-slice execution
- Updated the generated project README in `scripts/init-docs.sh` with the same onboarding path
- Added smoke assertions for the generated README AI handoff and context review checklist
- Verified shell syntax with `bash -n scripts/init-docs.sh scripts/ci/smoke-init-docs.sh`
- Verified generated README behavior with `bash scripts/ci/smoke-init-docs.sh`
