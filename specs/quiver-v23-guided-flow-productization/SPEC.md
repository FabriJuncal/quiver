# Quiver v23 - Guided Flow Productization

**Date:** 2026-05-21
**Status:** Draft

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver already has the core AI workflow pieces: project preparation, analysis, planner phases, approvals, spec generation, slice execution, execution waves, PR creation, and worktree cleanup.

The remaining friction is product experience. Users still need to remember the sequence, paste long prompts, choose planner/executor agents manually, know when to approve or iterate, and decide how to delegate slices safely.

The desired product experience is a guided flow:

1. Run one Quiver command.
2. Prepare project context for AI onboarding.
3. Configure planner and executor agents.
4. Let the planner onboard from generated docs.
5. Generate, revise, and approve acceptance criteria.
6. Generate, revise, production-review, and approve the technical plan.
7. Generate spec, slices, handoffs, execution plan, and `pr.md`.
8. Execute `slice-00` first.
9. Execute later slices sequentially or in parallel when safe.
10. Create one commit per slice.
11. Open one PR per spec.
12. Close the spec worktree after merge and pull the main checkout.

## Objective

Turn Quiver from a set of capable commands into a guided AI-first product flow that reduces prompt pasting, saves tokens, preserves human approvals, and makes the next safe step obvious.

## Core Decisions

- `README_FOR_AI.md` remains the source of truth for Quiver workflow guidance in this repo.
- The canonical package remains `create-quiver`; this spec may introduce a `quiver` binary alias only if it forwards to the same CLI behavior.
- `.quiver/` stores local workflow state, drafts, approvals, agent profiles, and runs.
- `docs/` stores visible project context.
- `specs/` stores durable spec, slice, handoff, execution plan, and PR artifacts.
- Planner agents use broad context and do not modify product code.
- Executor agents use slice-bounded context and may modify product code only inside the approved slice scope.
- Human approval remains mandatory for acceptance criteria, technical plans, and PR merge.
- `slice-00` is mandatory for every spec and must land before implementation slices.
- One spec maps to one worktree and one PR.
- One slice maps to one commit.

## Scope

### Included

- Add a short `quiver` command experience or a documented alias that does not contradict `npx create-quiver`.
- Add a guided flow/status command that tells the user the current stage and next safe command.
- Add planner, executor, reviewer, and optional researcher agent profiles.
- Add setup and validation for provider CLI choices without silently installing tools.
- Add a context-preparation command focused on token-efficient AI onboarding.
- Convert the user's long onboarding, planning, review, executor, delegation, and PR prompts into maintained Quiver prompt templates.
- Persist planner drafts, revised versions, approved artifacts, and review results.
- Add a production-readiness plan review phase before spec generation.
- Improve spec creation UX so approved inputs generate spec artifacts predictably.
- Generate minimal executor prompts for manual slice assignment.
- Add a delegated slice execution mode that uses safe waves, cheap executor profiles, isolated worktrees where needed, and one commit per slice.
- Add final PR and cleanup guidance around the generated `pr.md`, `gh`, SSH aliases, and spec worktrees.
- Add docs and smokes that demonstrate the full guided flow.

### Excluded

- Fully autonomous PR merge.
- Silent installation of `gh`, provider CLIs, or SSH keys.
- Direct provider API integrations.
- Guaranteeing provider-specific sub-agent spawning when the local CLI does not support it.
- Running real paid provider calls in CI.
- Replacing human approval for criteria, plans, or PR review.

## Acceptance Criteria

1. Given a user installs or runs Quiver, when they request the guided flow, then Quiver exposes a clear short command path or documented alias without contradicting `npx create-quiver`.
2. Given a project has Quiver state, when the flow status command runs, then it reports the current stage, blockers, and next safe command.
3. Given a project is not initialized, when the flow status command runs, then it recommends initialization instead of failing with low-level errors.
4. Given the user wants token-efficient onboarding, when context preparation runs, then Quiver refreshes project docs, reports assumptions and risks, and excludes secrets, generated files, dependency folders, and local AI state.
5. Given the user has preferred planner and executor models, when agent profiles are configured, then Quiver persists planner, executor, reviewer, and optional researcher choices under `.quiver/`.
6. Given a configured provider CLI is missing or unauthenticated, when diagnostics run, then Quiver prints OS-aware guidance and does not modify credentials silently.
7. Given a planner onboarding command runs in dry-run mode, then Quiver prints provider, role, context pack, prompt source, and token-relevant metadata without calling the provider.
8. Given requirements input exists, when acceptance criteria generation runs, then Quiver stores the output as a draft and does not advance until approved.
9. Given the user revises criteria multiple times, when drafts are listed, then Quiver shows the available versions and which one is approved.
10. Given acceptance criteria are approved, when technical planning starts, then Quiver uses the approved criteria by default.
11. Given a technical plan is generated, when production review runs, then Quiver reports fragile assumptions, ambiguous criteria, missing cases, and recommended fixes without changing product code.
12. Given a reviewed technical plan is not approved, when spec generation is requested, then Quiver blocks and explains the missing approval.
13. Given a reviewed plan is approved, when spec creation runs, then Quiver creates `SPEC.md`, `STATUS.md`, `EVIDENCE_REPORT.md`, `EXECUTION_PLAN.md`, `pr.md`, mandatory `slice-00`, and per-slice handoffs.
14. Given a spec has generated slices, when execution planning runs, then `slice-00` is first and later slices are blocked until `slice-00` is committed.
15. Given a slice is assigned manually, when executor prompt generation runs, then Quiver outputs only the slice objective, minimal context, allowed files, constraints, acceptance criteria, validation commands, and final report format.
16. Given a delegated execution plan is requested, when slices have overlapping or unknown file scopes, then Quiver falls back to sequential execution.
17. Given delegated execution runs later slices in parallel, when it writes code, then each executor works in an isolated safe workspace or otherwise cannot overlap writes.
18. Given a slice passes provider, scope, and validation checks with commit enabled, then Quiver creates exactly one commit for that slice.
19. Given all required slices are complete, when PR creation runs, then Quiver validates `gh`, auth, branch, remote, clean state, SSH alias, identity file, and generated `pr.md`.
20. Given the PR is merged and the spec worktree is clean, when cleanup runs, then Quiver removes the spec worktree and pulls the main checkout.
21. Given docs and generated templates are updated, when smokes run, then the full guided flow is covered without real paid provider calls.

## Approved Technical Plan

### Objective

Add a productized flow layer on top of the v22 command foundation.

### Approach

Prefer thin orchestration wrappers over replacing proven commands. The new flow layer should call or reuse the existing command libraries for analysis, provider execution, approvals, spec generation, execution plans, PR creation, and cleanup.

Recommended areas:

```text
bin/quiver.js
src/create-quiver/commands/flow.js
src/create-quiver/commands/agent.js
src/create-quiver/lib/flow-state.js
src/create-quiver/lib/agent-profiles.js
src/create-quiver/lib/prompt-templates.js
src/create-quiver/lib/planner-history.js
src/create-quiver/lib/plan-review.js
src/create-quiver/lib/executor-prompts.js
src/create-quiver/lib/delegation.js
```

Exact file names may change if existing modules provide a better fit.

### Product Flow

The desired command experience should be understandable without reading long prompts:

```bash
quiver init --name "Project Name"
quiver flow
quiver prepare
quiver ai agent set planner --provider claude --model opus
quiver ai agent set executor --provider codex --model gpt-5.4-mini
quiver ai onboard
quiver ai criteria --input requirements.md
quiver ai approve criteria
quiver ai plan
quiver ai review-plan
quiver ai approve plan
quiver spec create
quiver spec start
quiver slices plan
quiver slices run --mode manual
quiver slices run --mode delegated
quiver pr create
quiver spec close
```

The existing `npx create-quiver ...` commands must continue working.

### Prompt Strategy

- Keep README snippets short.
- Store detailed prompt contracts as templates in the package.
- Generate task-specific prompts from state and slice artifacts.
- Do not send full specs to executor agents unless the slice explicitly needs it.
- Record assumptions, risks, and files read in outputs where relevant.

### Safety Rules

- Dry-run first for provider and PR operations.
- No product code changes before approved slice execution.
- No spec generation before approved and reviewed plan.
- No parallel execution when scopes conflict or are unknown.
- No commit before validation.
- No cleanup before merge confirmation.
- No silent credential, SSH, or tool installation.

## Slicing Strategy

`slice-00` lands first and only publishes this spec foundation. Later slices are ordered from user-facing command clarity to higher-risk delegated execution. Delegated parallel execution is intentionally late because it depends on command routing, agent profiles, prompt generation, slice status, and scope safety.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| slice-00 | Spec foundation and guided flow planning artifacts | Completed | none |
| slice-01 | Short command and guided flow entrypoint | Completed | slice-00 |
| slice-02 | Flow status and next-step wizard | Completed | slice-01 |
| slice-03 | Agent profiles for planner, executor, reviewer, and researcher | Completed | slice-02 |
| slice-04 | Context preparation and onboarding prompt productization | Completed | slice-03 |
| slice-05 | Planner iteration history for criteria and plans | Draft | slice-04 |
| slice-06 | Production-readiness plan review phase | Draft | slice-05 |
| slice-07 | Spec creation experience from approved plans | Draft | slice-06 |
| slice-08 | Executor prompt generation for manual slice assignment | Draft | slice-07 |
| slice-09 | Delegated slice execution with safe workspaces | Draft | slice-08 |
| slice-10 | Final docs, smokes, and release readiness | Draft | slice-09 |

## Risks

- A short `quiver` command can create package naming confusion if not documented carefully.
- Agent model names are provider-specific and may change over time.
- Delegated parallel execution can corrupt work if isolation and conflict checks are weak.
- Storing too much prompt history can add noise and token cost.
- Provider CLIs may not support true sub-agent delegation; manual prompt generation must remain a first-class fallback.
- Over-automation can hide important human approval points.

## Open Questions

- Should reviewed technical plans require a separate approval artifact, or can the approved plan include the review result?
- Should delegated execution create temporary worktrees per slice by default, even for sequential slices?
- Should final PR creation be owned by the planner profile, the default CLI, or a dedicated reviewer profile?
