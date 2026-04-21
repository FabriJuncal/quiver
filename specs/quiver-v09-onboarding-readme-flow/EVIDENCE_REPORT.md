# Quiver v0.9 Evidence Report

**Spec:** quiver-v09-onboarding-readme-flow
**Last updated:** 2026-04-21
**Status:** Completed

## Summary

| Slice | Acceptance criteria | Status | Evidence |
|-------|---------------------|--------|----------|
| slice-01 | 5 | Completed | `bash scripts/ci/smoke-init-docs.sh` |
| slice-02 | 5 | Completed | `bash scripts/ci/smoke-create-quiver.sh`, `bash scripts/package-quiver.sh` |

## Evidence by Slice

### slice-01-developer-readme-onboarding-flow

- Reworked the root README around install, analyze, doctor, AI handoff, review, and first-slice execution
- Updated the generated project README in `scripts/init-docs.sh` with the same onboarding path
- Added smoke assertions for the generated README AI handoff and context review checklist
- Verified shell syntax with `bash -n scripts/init-docs.sh scripts/ci/smoke-init-docs.sh`
- Verified generated README behavior with `bash scripts/ci/smoke-init-docs.sh`

### slice-02-ai-handoff-doctor-guidance

- Updated `doctor` to require the AI context and onboarding prompt files
- Made `doctor` point to `docs/AI_ONBOARDING_PROMPT.md` after scan artifacts exist
- Updated `README_FOR_AI.md` so agents treat onboarding as context preparation before product work
- Extended `smoke-create-quiver.sh` to assert the new doctor handoff guidance for local and packaged installs
- Verified syntax with `node -c src/create-quiver/index.js`
- Verified shell syntax with `bash -n scripts/ci/smoke-create-quiver.sh scripts/package-quiver.sh`
- Verified end-to-end CLI behavior with `bash scripts/ci/smoke-create-quiver.sh`
- Verified package contract with `bash scripts/package-quiver.sh`
