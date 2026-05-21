# Quiver v22 - Guided AI Workflow

**Date:** 2026-05-21
**Status:** Draft

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver already has an AI-first foundation: it can initialize a project, analyze it, generate context artifacts, run planner phases, generate specs/slices/handoffs, execute one slice with reduced context, and run GitHub PR preflight checks.

The current experience still requires too much manual coordination. A user must remember which command comes next, manually preserve approved criteria and plans, decide when a worktree is safe, decide when parallel execution is safe, create slice commits by hand, and open or close the PR outside the guided flow.

The desired workflow is a guided AI delivery line:

1. Install or run Quiver.
2. Prepare the project for AI onboarding.
3. Choose a planner agent.
4. Run planner onboarding with generated context.
5. Turn requirements into acceptance criteria.
6. Iterate criteria until approved.
7. Turn approved criteria into a development plan.
8. Iterate the plan until approved.
9. Generate spec, slices, handoffs, and `pr.md`.
10. Build an execution plan with sequential and parallel slices.
11. Execute slices through cheaper executor agents, one slice per commit.
12. Open the PR from the generated body.
13. Let the human review and merge.
14. Close the worktree and pull merged changes back into the main local checkout.

## Objective

Make Quiver guide the full AI-assisted workflow from project preparation to post-merge cleanup while preserving human approvals, one spec per worktree, one slice per commit, token-efficient executor context, and safe defaults.

## Core Decisions

- `README_FOR_AI.md` remains the source of truth for Quiver workflow guidance in this repo.
- This repo uses `specs/quiver-vNN-*` as the real spec location, even though some reusable skills mention `docs/specs/`.
- `slice-00` is mandatory and only establishes the spec foundation.
- One spec maps to one dedicated worktree and one PR.
- One slice maps to one commit.
- Planner agents use broad context and do not modify product code while creating criteria or plans.
- Executor agents may modify product code only inside the approved slice scope.
- AI outputs that influence implementation must be saved and explicitly approved before they become inputs for the next phase.
- Parallel slice execution is allowed only when dependencies and touched files make it safe.
- Quiver validates or guides setup for `gh`, SSH aliases, provider CLIs, and auth. It must not silently rewrite credentials.
- PR creation is allowed after checks pass, but PR merge remains a human decision.
- Worktree cleanup is allowed only after the PR merge is confirmed and no local changes would be lost.

## Scope

### Included

- Sync documentation that drifted after `0.10.0`.
- Define the official command experience for guided workflows, including whether a short `quiver` command exists or commands remain under `npx create-quiver`.
- Add a safe project preparation command that combines analysis, diagnostics, context refresh, and setup guidance.
- Improve project analysis so it produces useful AI onboarding context without exposing secrets or noisy generated files.
- Persist planner outputs and approvals for acceptance criteria and technical plans.
- Generate specs, slices, handoffs, execution plans, and `pr.md` only from approved inputs.
- Formalize one spec per worktree.
- Add status, retry, abort, and recovery surfaces for slices.
- Add optional commit automation after slice validation.
- Add execution waves for sequential and parallel slices.
- Add safe delegation guidance for cheap executor agents.
- Create PRs with `gh` from generated `pr.md` after preflight passes.
- Add post-merge cleanup that removes the spec worktree and pulls the main local checkout.
- Add release/package safety checks so local settings or secrets are not published.
- Cover macOS, Linux, and Windows guidance for `gh`, SSH, providers, and paths.

### Excluded

- Fully autonomous PR merge.
- Silent installation of tools without explicit user approval.
- Silent SSH config rewriting.
- Direct provider API integrations.
- Guaranteeing identical behavior across Codex, Claude, and Gemini CLIs.
- Running real paid AI providers in CI.
- Replacing human approval for acceptance criteria, plans, or PR review.

## Acceptance Criteria

1. Given the root docs drift from the published package version, when the docs-sync slice runs, then README, CHANGELOG, ROADMAP, BACKLOG, and AI guidance no longer contradict the current package state.
2. Given a user wants to start safely, when the preparation command runs in dry-run mode, then it reports planned checks and writes nothing.
3. Given a user runs preparation for real, when the repo is valid, then Quiver refreshes project context docs and reports assumptions, risks, missing tools, and next commands.
4. Given a project has secrets, env files, generated files, large artifacts, or dependency folders, when context is prepared, then those files are excluded from AI-facing context.
5. Given `gh`, provider CLIs, auth, or SSH aliases are missing, when diagnostics run, then Quiver gives OS-specific guidance for macOS, Linux, and Windows.
6. Given a planner produces acceptance criteria, when the user does not approve them, then Quiver keeps them as draft and does not create a technical plan or spec.
7. Given acceptance criteria are approved, when the next phase starts, then Quiver uses the approved criteria as the source input.
8. Given a planner produces a technical plan, when the user does not approve it, then Quiver keeps it as draft and does not create spec artifacts.
9. Given a technical plan is approved, when the spec phase runs, then Quiver creates `SPEC.md`, `STATUS.md`, `EVIDENCE_REPORT.md`, `EXECUTION_PLAN.md`, `pr.md`, mandatory `slice-00`, and per-slice handoffs.
10. Given generated slices, when the execution plan is built, then `slice-00` is first and every later slice is blocked until `slice-00` is committed.
11. Given a spec starts, when Quiver creates or selects its worktree, then it uses one dedicated worktree/branch for that spec.
12. Given a slice executor runs, when it receives context, then it receives only the slice, handoff, allowed files, criteria, and validation commands.
13. Given a slice executor modifies files outside scope, when validation runs, then Quiver stops and reports the scope violation.
14. Given a slice passes validation and commit automation is enabled, when the slice completes, then Quiver creates exactly one commit for that slice.
15. Given a slice fails validation, when the command exits, then Quiver leaves a clear report and supports retry or abort without hiding local changes.
16. Given multiple slices are ready, when execution waves are requested, then Quiver only runs slices in parallel if dependencies and file scopes do not conflict.
17. Given execution waves include conflicts or unknown file scopes, when Quiver plans execution, then it falls back to sequential execution.
18. Given all required slices are complete, when PR creation runs, then Quiver validates `gh`, auth, remote, branch, worktree, identity file, SSH alias, clean state, and generated `pr.md`.
19. Given PR checks pass, when the user confirms PR creation, then Quiver creates the PR with `gh` using `pr.md`.
20. Given a PR is not merged, when cleanup is requested, then Quiver refuses normal cleanup and explains the safe options.
21. Given a PR is merged and the worktree is clean, when cleanup runs, then Quiver removes the spec worktree and pulls the merged changes into the main local checkout.
22. Given package release validation runs, when local settings, env files, npm credentials, or AI tool local state would be included, then Quiver fails before packaging or publishing.

## Approved Technical Plan

### Objective

Turn Quiver's current AI commands into a guided workflow that is safer, more recoverable, and easier to use end to end.

### Architecture

Add a lightweight workflow state layer under `.quiver/` and keep versioned project contracts under visible docs and `specs/`.

Recommended areas:

```text
src/create-quiver/commands/prepare.js
src/create-quiver/commands/ai.js
src/create-quiver/commands/spec.js
src/create-quiver/lib/workflow-state.js
src/create-quiver/lib/context-writer.js
src/create-quiver/lib/approvals.js
src/create-quiver/lib/spec-worktrees.js
src/create-quiver/lib/slice-runner.js
src/create-quiver/lib/pr-create.js
src/create-quiver/lib/package-safety.js
```

The exact file names can change during implementation if the existing codebase points to a better local pattern.

### Workflow State

Persist workflow progress in `.quiver/`:

- selected provider and role;
- current spec;
- current worktree;
- draft and approved acceptance criteria;
- draft and approved technical plan;
- generated spec path;
- slice statuses;
- execution wave status;
- PR status;
- cleanup status.

Only durable team contracts belong in visible docs or `specs/`.

### Command Experience

The command surface should be simple for humans:

```bash
npx create-quiver prepare
npx create-quiver ai planner onboard
npx create-quiver ai planner acceptance
npx create-quiver ai approve acceptance
npx create-quiver ai planner technical-plan
npx create-quiver ai approve technical-plan
npx create-quiver ai planner spec
npx create-quiver spec start
npx create-quiver ai execute-plan
npx create-quiver ai pr create
npx create-quiver spec close
```

If a short `quiver` binary is introduced, it must be documented as an alias or project-local script and must not contradict the canonical `npx create-quiver` entrypoint until that decision is made.

### Safety Rules

- Dry-run support comes before write support.
- No product code changes before an approved slice.
- No commit before validation.
- No parallel execution when files or dependencies are unclear.
- No PR creation with dirty worktree or missing generated PR body.
- No cleanup before merge confirmation.
- No publishing if local settings or secrets enter the package tarball.

### Validation Strategy

- Unit tests for state persistence and approval transitions.
- Unit tests for context exclusion and secret/path filters.
- Unit tests for missing tools and cross-platform install guidance.
- Unit tests for spec worktree lifecycle and cleanup guardrails.
- Unit tests for slice commit success/failure behavior.
- Unit tests for execution wave grouping and conflict fallback.
- Unit tests for PR creation command construction with mocked `gh`.
- Smoke tests for `prepare`, planner approval flow, executor dry-run, PR dry-run, and release/package safety.
- Existing tests for `ai plan`, `ai execute-slice`, `plan`, `graph`, and `next` must remain green.

## Slicing Strategy

`slice-00` lands first and only publishes this spec foundation. The rest of the work is split so Quiver becomes useful earlier while high-risk automation, such as parallel execution and cleanup, is introduced after state, approvals, and single-slice execution are reliable.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| slice-00 | Spec foundation and guided workflow planning artifacts | Completed | none |
| slice-01 | Documentation source-of-truth sync | Completed | slice-00 |
| slice-02 | Prepare command and setup diagnostics | Completed | slice-01 |
| slice-03 | Context documentation refresh and safe analyzer output | Completed | slice-02 |
| slice-04 | Planner approval state for criteria and technical plans | Completed | slice-03 |
| slice-05 | Spec worktree lifecycle | Completed | slice-04 |
| slice-06 | Executor validation, recovery, and commit per slice | Draft | slice-05 |
| slice-07 | Execution waves and safe delegation | Draft | slice-06 |
| slice-08 | PR creation with gh and SSH guidance | Draft | slice-05 |
| slice-09 | Post-merge cleanup and release safety | Draft | slice-07, slice-08 |
| slice-10 | Final docs, smokes, and release readiness | Draft | slice-09 |

## Risks

- A short `quiver` command can confuse users if it is introduced before the canonical command decision is documented.
- Persisted approval state can drift from visible spec artifacts if not validated.
- More automation increases the cost of recovering from failed provider runs.
- Parallel executor runs can create conflicts or overlapping edits.
- Cross-platform setup guidance can become stale if it is duplicated in several files.
- PR creation can target the wrong account if `gh` auth and SSH alias point to different identities.
- Cleanup can delete useful local work if merge and cleanliness checks are incomplete.
- Packaging can leak local tool state unless tarball checks are enforced.

## Open Questions

- Should the short command be `quiver`, a project-local npm script, or only documented as future sugar over `npx create-quiver`?
- Should approval artifacts be versioned in `specs/` or stored internally in `.quiver/` until the spec is generated?
- Should commit automation default to confirmation prompts or require an explicit `--commit` flag?
- Should execution waves initially print commands for manual execution before running multiple providers automatically?
- Should `gh` installation remain guidance-only or include optional installer helpers behind explicit approval?
