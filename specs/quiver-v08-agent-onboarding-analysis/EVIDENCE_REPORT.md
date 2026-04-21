# Quiver v0.8 Evidence Report

**Spec:** quiver-v08-agent-onboarding-analysis
**Last updated:** 2026-04-21
**Status:** Completed

## Summary

| Slice | Acceptance criteria | Status | Evidence |
|-------|---------------------|--------|----------|
| slice-01 | 6 | Completed | `bash scripts/ci/smoke-create-quiver.sh`, `node -c src/create-quiver/index.js`, `bash -n scripts/ci/smoke-create-quiver.sh` |
| slice-02 | 6 | Completed | `bash scripts/ci/smoke-init-docs.sh`, `bash scripts/ci/smoke-create-quiver.sh`, `bash scripts/package-quiver.sh` |
| slice-03 | 6 | Pending | - |

## Evidence by Slice

### slice-01-project-scan-command

- Added `create-quiver analyze --dir <project>` support in `src/create-quiver/index.js`
- Generated `docs/PROJECT_SCAN.json` and `docs/PROJECT_MAP.md` from a local repository scan
- Extended the smoke test to run `analyze` on fresh, existing, and packaged installs
- Verified syntax with `node -c src/create-quiver/index.js`
- Verified shell syntax with `bash -n scripts/ci/smoke-create-quiver.sh`
- Verified end-to-end behavior with `bash scripts/ci/smoke-create-quiver.sh`

### slice-02-ai-onboarding-prompt

- Added `docs/AI_ONBOARDING_PROMPT.md.template` to the packaged docs templates
- Wired `scripts/init-docs.sh` to generate `docs/AI_ONBOARDING_PROMPT.md`
- Updated the AI guide and generated docs templates to link the onboarding prompt
- Extended init, create, and package smokes to require and validate the prompt artifact
- Verified shell syntax with `bash -n scripts/init-docs.sh scripts/ci/smoke-init-docs.sh scripts/ci/smoke-create-quiver.sh scripts/package-quiver.sh`
- Verified `docs/AI_ONBOARDING_PROMPT.md` generation with `bash scripts/ci/smoke-init-docs.sh`
- Verified end-to-end behavior with `bash scripts/ci/smoke-create-quiver.sh`
- Verified package inclusion with `bash scripts/package-quiver.sh`
