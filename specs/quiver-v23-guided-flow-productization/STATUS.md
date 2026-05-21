# Quiver v23 - Guided Flow Productization Status

**Status:** Completed
**Created:** 2026-05-21

## Summary

This spec productizes the user's current prompt-driven workflow into first-class Quiver commands and templates. The goal is to reduce prompt pasting, preserve WDD/SDD approvals, guide the user through the next safe step, and support planner/executor agent roles with lower token cost.

## Current State

- Requirements and product direction: approved in conversation.
- Spec and slice handoffs: created in this documentation pass.
- `slice-00`: completed.
- `slice-01`: completed. Added the `quiver` binary alias, read-only `flow` command, docs, generated script, and tests.
- `slice-02`: completed. Expanded `flow` into a read-only wizard that reads context docs, approvals, specs, slices, and blockers.
- `slice-03`: completed. Added reusable planner, executor, reviewer, and researcher agent profiles under `.quiver/agents/profiles.json`.
- `slice-04`: completed. Added packaged index-first onboarding prompt generation and context preparation reporting.
- `slice-05`: completed. Added versioned planner draft history and explicit approval by draft version.
- `slice-06`: completed. Added `ai review-plan`, persisted plan review state, flow guidance, and spec-generation gating for reviewed and approved technical plans.
- `slice-07`: completed. Added explicit `spec create` command, generated `quiver:spec:create` script, next-command output, docs, and tests.
- `slice-08`: completed. Added `ai prompt-slice` / `executor-prompt` to print minimal manual executor prompts from slice artifacts without calling providers.
- `slice-09`: completed. Added manual/delegated execution modes, prompt commands in dry-runs, delegated temporary worktrees for parallel-ready waves, and commit integration back into the active checkout.
- `slice-10`: completed. Updated root docs, generated docs/templates, roadmap/backlog/changelog, smoke coverage, release readiness evidence, and no-publish release checklist.

## Execution Rules

- `slice-00` must be executed and committed first.
- Every later slice depends on `slice-00`.
- One slice equals one commit.
- One spec equals one worktree and one PR.
- Planner phases cannot modify product code.
- Executor phases can modify product code only inside approved slice scope.
- Parallel slices may run only when dependencies and file scopes are safe.

## Open Items

- Decide whether future UX should add a dedicated `ai approve --phase plan-review` command, or keep the current model where the reviewed technical-plan draft is approved by version.
- Validate provider-specific model argument handling for Codex, Claude, and Gemini before model labels are used as invocation arguments.
