# EXECUTION_BRIEF - slice-01 Actions Node 24 readiness

## Context

GitHub Actions reports Node.js 20 runtime deprecation warnings for JavaScript actions. The workflow already uses `node-version: 22` for the project runtime; this slice must not change that test runtime.

## Objective

Opt CI into the GitHub Actions Node.js 24 action runtime with the smallest safe workflow change.

## Acceptance Criteria

- CI sets `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`.
- Existing CI jobs and steps remain unchanged.
- `node-version: 22` remains unchanged.
- Package and smoke validation pass.
- Spec evidence is updated.

## Completion Checklist

- [x] Workflow updated.
- [x] Validation run.
- [x] Evidence updated.
