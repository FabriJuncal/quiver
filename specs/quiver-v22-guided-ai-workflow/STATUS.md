# Quiver v22 - Guided AI Workflow Status

**Status:** Draft
**Created:** 2026-05-21

## Summary

This spec defines the guided AI workflow needed to move from project preparation to planner approvals, spec generation, slice execution, PR creation, and post-merge cleanup.

## Current State

- Requirements and acceptance criteria: approved in conversation.
- Technical plan: approved in conversation after production-readiness review.
- Spec and slice handoffs: created in this documentation pass.
- `slice-00`: completed.
- `slice-01`: completed.
- `slice-02`: completed.
- `slice-03` through `slice-10`: draft.

## Execution Rules

- `slice-00` must be executed and committed first.
- Every later slice depends on `slice-00`.
- One slice equals one commit.
- One spec equals one worktree and one PR.
- Planner phases cannot modify product code.
- Executor phases can modify product code only inside approved slice scope.
- Parallel slices may run only when dependencies and file scopes are safe.

## Open Items

- Decide whether `quiver` becomes a real command or remains documentation sugar for `npx create-quiver`.
- Decide where approved planner artifacts live before spec generation.
- Decide whether commit automation is opt-in or confirmation-based.
