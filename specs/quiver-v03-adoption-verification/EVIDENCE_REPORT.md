# Quiver v0.3 Evidence Report

**Spec:** quiver-v03-adoption-verification
**Last updated:** 2026-04-20
**Status:** In progress

## Summary

| Slice | Acceptance criteria | Status | Evidence |
|-------|---------------------|--------|----------|
| slice-01 | 3 | Completed | Local smoke script passed and CI now runs the bootstrap smoke on Linux and macOS |
| slice-02 | 3 | Completed | Local workflow-gate smoke passed after validating both bootstrap modes and both PR gate paths |
| slice-03 | 3 | Ready | - |

## Evidence by Slice

- `bash scripts/ci/smoke-workflow-gates.sh`
- `bash -n scripts/ci/smoke-workflow-gates.sh`
- `.github/workflows/ci.yml` now runs the workflow-gate fixture smoke on `ubuntu-latest`
