# Quiver v23 - Guided Flow Productization Status

**Status:** Draft
**Created:** 2026-05-21

## Summary

This spec productizes the user's current prompt-driven workflow into first-class Quiver commands and templates. The goal is to reduce prompt pasting, preserve WDD/SDD approvals, guide the user through the next safe step, and support planner/executor agent roles with lower token cost.

## Current State

- Requirements and product direction: approved in conversation.
- Spec and slice handoffs: created in this documentation pass.
- `slice-00`: completed.
- `slice-01` through `slice-10`: draft.

## Execution Rules

- `slice-00` must be executed and committed first.
- Every later slice depends on `slice-00`.
- One slice equals one commit.
- One spec equals one worktree and one PR.
- Planner phases cannot modify product code.
- Executor phases can modify product code only inside approved slice scope.
- Parallel slices may run only when dependencies and file scopes are safe.

## Open Items

- Decide whether the short command is a real package binary alias or a generated local script.
- Decide the exact persisted shape for agent profiles under `.quiver/`.
- Decide whether plan review creates a new approval phase or annotates the technical-plan approval.
- Validate provider-specific model argument handling for Codex, Claude, and Gemini.
