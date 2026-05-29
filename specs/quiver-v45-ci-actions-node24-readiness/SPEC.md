# Quiver v45 - CI Actions Node 24 Readiness

**Date:** 2026-05-29
**Status:** Completed
**Source:** Follow-up fix from CI warnings observed after PR #88.

## Problem

GitHub Actions reports deprecation warnings because JavaScript actions currently run on Node.js 20. The workflow still passes, but the warning says Actions will force Node.js 24 by default starting June 2, 2026 and remove Node.js 20 on September 16, 2026.

## Objective

Make the CI workflow explicitly ready for GitHub Actions Node.js 24 action runtime without changing Quiver's tested Node version, package behavior, or smoke coverage.

## Scope

### Included

- `.github/workflows/ci.yml`.
- A dedicated spec/slice package for the fix.
- Validation evidence for workflow syntax, package smoke, and create-quiver smoke.

### Excluded

- Changing the project runtime target.
- Changing package scripts or release flow.
- Changing i18n behavior or command output.
- Updating unrelated GitHub Actions workflows.

## Acceptance Criteria

1. CI opts into the Node.js 24 JavaScript action runtime.
2. The job test runtime remains Node.js 22 unless a separate spec changes it.
3. Existing CI jobs and steps remain semantically unchanged.
4. The fix has dedicated slice evidence.
5. Package and smoke validation pass locally.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | CI Actions foundation | completed | none |
| slice-01 | Actions Node 24 readiness | completed | slice-00 |

## Guardrails

- Keep workflow changes minimal.
- Do not silence warnings by removing jobs.
- Do not change Quiver CLI runtime behavior.
