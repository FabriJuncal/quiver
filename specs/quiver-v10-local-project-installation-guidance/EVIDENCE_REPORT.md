# Quiver v0.10 Evidence Report

**Spec:** quiver-v10-local-project-installation-guidance
**Last updated:** 2026-04-21
**Status:** Completed

## Summary

| Slice | Acceptance criteria | Status | Evidence |
|-------|---------------------|--------|----------|
| slice-01 | 5 | Completed | `bash scripts/ci/smoke-init-docs.sh`, `bash scripts/ci/smoke-create-quiver.sh` |

## Evidence by Slice

### slice-01-local-project-installation-guidance

- Updated the root README to prioritize running Quiver from the target project root with `npx`
- Documented project-local pinned installation with `npm install --save-dev create-quiver`
- Explicitly discouraged global installation
- Updated generated README guidance in `scripts/init-docs.sh`
- Updated AI-facing guidance in `README_FOR_AI.md` and `docs/AI_CONTEXT.md.template`
- Added smoke assertions for generated README guidance
- Verified shell syntax with `bash -n scripts/init-docs.sh scripts/ci/smoke-init-docs.sh scripts/ci/smoke-create-quiver.sh`
- Verified generated docs with `bash scripts/ci/smoke-init-docs.sh`
- Verified CLI smoke with `bash scripts/ci/smoke-create-quiver.sh`
