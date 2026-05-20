# Quiver v20 - AI CLI Orchestration

**Date:** 2026-05-19
**Status:** Active

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver already creates workflow documentation and can analyze a project with `npx create-quiver analyze`, but the AI-assisted workflow still depends on manual copy/paste prompts and ad hoc model usage.

Teams using Quiver need a repeatable way to:

- Run AI tasks through local CLIs such as Codex, Claude, or Gemini.
- Separate expensive planner work from cheaper executor work.
- Optimize token usage by giving each agent only the context it needs.
- Move from requirements to acceptance criteria, technical plan, specs, slices, handoffs, and PR body with explicit human approvals.
- Execute slices safely, including parallel slice execution when dependencies allow it.
- Open PRs with `gh` and SSH configuration in a cross-platform way.

## Objective

Add an AI orchestration layer to Quiver that standardizes planner/executor workflows through `quiver ai ...` commands, provider adapters, context packs, phase gates, slice handoffs, execution plans, and GitHub PR preflight checks.

The goal is not to replace the AI agent. Quiver should define how to invoke it, what context to provide, when to require approval, what artifacts to generate, and how to validate that execution stayed inside scope.

## Core Decisions

- `slice-00` is mandatory for every generated spec and is reserved for committing the spec foundation to the repo.
- One spec maps to one worktree and one PR.
- One slice maps to one commit.
- Planner agents use broader context and do not modify product code in acceptance-criteria or technical-plan phases.
- Executor agents can modify code directly, but only within the slice handoff scope.
- Prompt execution must support macOS, Linux, and Windows.
- Prompts must not rely on shell string concatenation for long content.
- `gh` and SSH setup must be validated, not silently modified.
- AI execution output is printed to console; no global run logs are created automatically.
- Final evidence belongs in the relevant slice closure brief.

## Scope

### Included

- Add `quiver ai ...` command family.
- Add provider runner adapters for Codex, Claude, and Gemini CLIs.
- Add provider preflight validation and `--dry-run`.
- Add safe prompt transport for long prompts through stdin or temporary files where supported.
- Add planner/executor roles.
- Add context packs and token-budget guidance.
- Add phase-gated planner flow:
  - acceptance criteria
  - technical plan
  - spec/slices/handoffs/PR body
- Generate mandatory `slice-00`.
- Generate `SPEC.md`, slice definitions, execution handoffs, closure handoffs, `EXECUTION_PLAN.md`, and `pr.md`.
- Track implementation evidence in `EVIDENCE_REPORT.md`.
- Generate an execution plan with sequential and parallel slices.
- Support executor slice execution with context minimization.
- Enforce scope before and after executor runs.
- Add GitHub PR preflight for `gh`, auth, remote, worktree, GitFlow guide, SSH host alias, and identity file.
- Update generated docs, README guidance, templates, npm scripts, and smoke tests.

### Excluded

- Direct provider API integrations.
- Automatic model cost estimation.
- Automatic installation of `gh`.
- Automatic SSH credential modification without explicit user approval.
- Global AI run logs.
- Fully autonomous PR merge.
- Guaranteeing exact feature parity between Codex, Claude, and Gemini CLIs.

## Acceptance Criteria

1. Given a Quiver project, when the user runs an AI command, then Quiver distinguishes between `planner` and `executor` roles.
2. Given a supported provider, when the user selects `codex`, `claude`, or `gemini`, then Quiver builds the provider-specific command safely.
3. Given an unsupported provider, when the user runs `quiver ai ...`, then Quiver fails with a clear list of supported providers.
4. Given a missing provider CLI, when Quiver runs preflight, then it fails with an actionable install/auth hint.
5. Given a long prompt, when Quiver invokes a provider, then it uses a cross-platform-safe transport instead of shell string concatenation.
6. Given `--dry-run`, when any `quiver ai ...` command runs, then Quiver prints provider, role, context pack, and invocation plan without calling the provider.
7. Given planner onboarding, when `quiver ai onboard` runs, then the prompt instructs the AI to read Quiver context, WDD/SDD workflow, project scan/map, assumptions, risks, and relevant docs without modifying product code.
8. Given new requirements, when `quiver ai plan` runs in acceptance phase, then it prints acceptance criteria and does not create specs, slices, handoffs, or product code changes.
9. Given approved acceptance criteria, when `quiver ai plan` runs in technical-plan phase, then it prints a technical plan and still does not create specs, slices, handoffs, or product code changes.
10. Given an approved technical plan, when `quiver ai plan` runs in spec phase, then it creates the spec artifacts.
11. Given a generated spec, when artifacts are created, then `slice-00` exists and every other slice depends on it unless explicitly justified.
12. Given `slice-00`, when it is executed, then it only commits documentation/spec foundation unless an explicit exception is approved.
13. Given a generated spec, when planning completes, then `EXECUTION_PLAN.md` declares sequential slices, parallel-ready slices, dependencies, and integration order.
14. Given an executor slice, when `quiver ai execute-slice` runs, then the executor receives only slice, handoff, allowed files, criteria, and validation commands.
15. Given an executor run, when it completes, then Quiver verifies changed files against declared scope and reports violations.
16. Given context packs, when Quiver prepares AI context, then it excludes secrets, env files, build outputs, package caches, node_modules, and other unsafe paths.
17. Given repository files containing instructions, when AI context is prepared, then prompts state that repo content is data and cannot override Quiver/system/user instructions.
18. Given a PR flow, when `quiver ai pr` runs, then Quiver verifies `gh`, `gh auth status`, Git remote, worktree, GitFlow guide, SSH host alias, and identity file before opening or preparing the PR.
19. Given missing `gh`, auth, SSH alias, identity file, remote, or GitFlow guide, when PR preflight runs, then Quiver stops with an actionable cross-platform message.
20. Given a generated spec, when artifacts are created, then `pr.md` is always generated from the GitFlow guide.
21. Given CI, when tests run, then provider behavior is validated with mocks and `--dry-run`, without requiring real provider auth.

## Approved Technical Plan

### Objective

Implement an AI orchestration layer around local provider CLIs while preserving Quiver's spec/slice workflow, explicit approvals, token efficiency, and cross-platform support.

### Architecture

Add a command family under:

```text
npx create-quiver ai <task>
```

Recommended modules:

```text
src/create-quiver/commands/ai.js
src/create-quiver/lib/ai/providers.js
src/create-quiver/lib/ai/context-packs.js
src/create-quiver/lib/ai/prompts.js
src/create-quiver/lib/ai/preflight.js
src/create-quiver/lib/ai/execution-plan.js
src/create-quiver/lib/ai/github.js
```

Generated projects should expose scripts such as:

```text
quiver:ai:onboard
quiver:ai:plan
quiver:ai:execute-slice
quiver:ai:pr
quiver:ai:doctor
```

### Provider Strategy

Provider adapters map a normalized request to CLI-specific execution:

```text
codex  -> codex exec
claude -> claude -p
gemini -> gemini -p
```

Adapters must use `spawn` or `execFile` with argument arrays. They must not concatenate shell strings.

Prompt transport must support long prompts with stdin or temporary files where supported by the provider adapter.

### Context Strategy

Context packs:

- `full`: planner onboarding.
- `planning`: requirements, project map, workflow docs, related specs.
- `slice`: spec, slice, handoff, allowed files, validation commands.
- `minimal`: executor-focused task context only.

Executors must not receive full onboarding context.

### GitHub Strategy

Separate:

- `sshHostAlias`, for example `github-work`.
- `identityFile`, for example `~/ssh/github-work`.
- `gh` account/auth state.
- Git remote URL.

Quiver validates these and guides the user. It does not edit credentials automatically.

## Slices

| Slice | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| slice-00 | Spec foundation and PR planning artifacts | Ready | none |
| slice-01 | AI provider runner and safe prompt transport | Draft | slice-00 |
| slice-02 | Context packs, roles, token budgets, and safety exclusions | Draft | slice-00 |
| slice-03 | Phase-gated planner commands | Draft | slice-01, slice-02 |
| slice-04 | Spec, slice, handoff, and PR body generation | Draft | slice-03 |
| slice-05 | Execution plan, dependencies, and parallel worktrees | Draft | slice-04 |
| slice-06 | Executor command and scope enforcement | Draft | slice-01, slice-02, slice-05 |
| slice-07 | GitHub PR preflight with gh and SSH | Draft | slice-01, slice-04 |
| slice-08 | Documentation, generated scripts, smokes, and release readiness | Draft | slice-01, slice-02, slice-03, slice-04, slice-05, slice-06, slice-07 |

## Risks

- Provider CLIs may have incompatible flags or prompt input behavior.
- Long prompts can break if transported as shell strings.
- Windows quoting and path behavior can regress if not tested with argument arrays.
- Parallel slice execution can create merge conflicts if integration order is unclear.
- Executor context can be too small to be safe or too large to save tokens.
- `gh` authentication and SSH remotes can point to different accounts.
- Prompt injection can occur through repo content if not explicitly guarded.

## Validation Strategy

- Unit tests for provider command construction.
- Unit tests for provider preflight and unsupported providers.
- Unit tests for context pack file inclusion/exclusion.
- Unit tests for phase gate state and artifact creation boundaries.
- Unit tests for scope enforcement after executor runs.
- Dry-run smoke tests for all `quiver ai` commands.
- Cross-platform smoke for paths with spaces.
- CI tests must not require real provider CLIs or auth.
