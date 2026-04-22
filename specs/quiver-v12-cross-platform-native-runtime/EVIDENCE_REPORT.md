# Quiver v0.12 Evidence Report

**Spec:** quiver-v12-cross-platform-native-runtime
**Date:** 2026-04-22
**Status:** Draft

## Summary

This spec will make Quiver native across macOS, Linux, and Windows by moving user-facing workflow commands from Bash scripts to Node.js CLI commands.

## Slice Evidence

| Slice | Status | Evidence |
|-------|--------|----------|
| slice-01 | Completed | Updated README, README_FOR_AI, support matrix template, troubleshooting template, and init-docs README generation; validated with `bash scripts/ci/smoke-init-docs.sh`, `bash scripts/ci/smoke-create-quiver.sh`, and `git diff --check` |
| slice-02 | Completed | Ported `init` to the Node runtime via `src/create-quiver/lib/init-docs.js`; `src/create-quiver/index.js` now calls it directly; `scripts/ci/smoke-init-docs.sh` now validates the real CLI path. Verified with `node -c src/create-quiver/index.js`, `node -c src/create-quiver/lib/init-docs.js`, `bash -n scripts/init-docs.sh scripts/ci/smoke-init-docs.sh scripts/ci/smoke-create-quiver.sh scripts/package-quiver.sh`, `bash scripts/ci/smoke-init-docs.sh`, `bash scripts/ci/smoke-create-quiver.sh`, and `bash scripts/package-quiver.sh` |
| slice-03 | Completed | Ported `migrate` off Bash by calling the Node init runtime with `migrateMode: true`; added shared path and state helpers in `src/create-quiver/lib/paths.js` and `src/create-quiver/lib/state.js`; updated doctor/init output to use Node-native commands; added smoke coverage for spaces and Windows-style paths in `scripts/ci/smoke-create-quiver.sh`. Verified with `node -c src/create-quiver/index.js`, `node -c src/create-quiver/lib/init-docs.js`, `node -c src/create-quiver/lib/paths.js`, `node -c src/create-quiver/lib/state.js`, `node -c src/create-quiver/lib/analyze.js`, `node -c src/create-quiver/lib/doctor.js`, `bash -n scripts/init-docs.sh scripts/ci/smoke-init-docs.sh scripts/ci/smoke-create-quiver.sh scripts/package-quiver.sh`, `bash scripts/ci/smoke-init-docs.sh`, `bash scripts/ci/smoke-create-quiver.sh`, `bash scripts/package-quiver.sh`, and `git diff --check` |
| slice-04 | Draft | Pending |
| slice-05 | Draft | Pending |
| slice-06 | Draft | Pending |

## Required Final Evidence

- Node syntax checks for all new runtime modules
- Unit or smoke coverage for path handling on Windows-style and POSIX-style paths
- Generated project smoke on Linux
- Generated project smoke on macOS
- Generated project smoke on Windows
- Package smoke proving npm wrappers invoke CLI commands correctly
- Documentation check proving Bash is no longer documented as the primary path
