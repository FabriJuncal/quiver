# Quiver v20 - AI CLI Orchestration Status

**Status:** Active
**Created:** 2026-05-19

## Summary

This spec defines Quiver's AI CLI orchestration layer: provider runners, planner/executor roles, token-efficient context packs, phase-gated planning, spec/slice generation, executor scope enforcement, parallel slice planning, and GitHub PR preflight.

## Current State

- Requirements and acceptance criteria: approved.
- Technical plan: approved.
- Spec and slice handoffs: created in this documentation pass.
- `slice-00`: completed.
- `slice-01`: completed.
- `slice-02`: completed.
- `slice-03`: completed.
- `slice-04`: completed.

## Execution Rules

- `slice-00` must be executed and committed first.
- Every later slice depends on `slice-00` unless explicitly stated otherwise.
- One slice equals one commit.
- One spec equals one worktree and one PR.
- Parallel slices may use temporary worktrees, but their commits must be integrated into the spec PR branch in dependency order.

## Open Items

- Confirm exact provider CLI stdin/file support during slice-01 implementation.
- Confirm generated project docs should materialize `docs/GITFLOW_PR_GUIDE.md` rather than only the template.
