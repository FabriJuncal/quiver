# Quiver v29 - Planner-Assisted Prepare Context and CLI UX Standard

**Date:** 2026-05-26
**Status:** Planned
**Source:** User-approved requirement to improve `ai prepare-context` with optional planner IA and standardize CLI UX across Quiver.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

`npx create-quiver ai prepare-context` is currently safe and deterministic: it prepares docs-only context using templates and project signals. That behavior must remain, but Quiver also needs an explicit planner-assisted mode where a configured planner IA can analyze project context and propose richer onboarding documentation.

At the same time, Quiver's CLI UX has grown command by command. It needs a shared standard for loaders, prompts, visual hierarchy, review flows, flags, color usage, non-interactive execution, CI, `--json`, agents, and errors. Without a standard, each new AI command risks solving UX differently.

## Objective

Create a CLI UX standard for Quiver and implement the first high-value application of it:

- keep `ai prepare-context` deterministic by default;
- add explicit planner-assisted preparation;
- add safe interactive/review flows;
- validate planner output before writes;
- standardize output modes, colors, prompts, loaders, and flags;
- apply the standard progressively to selected commands.

## Scope

### Included

- UX standard documentation for Quiver CLI commands.
- Shared CLI UX/theme/editor helpers.
- Quiver color tokens for human-mode output.
- Optional `--with-planner` mode for `ai prepare-context`.
- Optional `--interactive` and `--review` flows where they add value.
- `--print-prompt`, `--dry-run`, `--json`, CI, no-TTY, no-color compatibility.
- Planner proposal contract validated with a structured schema.
- Docs-only allowlist for context writes.
- `$EDITOR` review before applying AI-generated documentation.
- Progressive adoption plan for `ai plan`, `spec create`, and `ai pr`.
- Tests, fixtures, documentation, and package smoke readiness.

### Excluded

- Replacing the whole CLI parser with `commander`, `yargs`, or `oclif`.
- Adding terminal dashboards with `ink`, `blessed`, or `neo-blessed`.
- Adding image output protocols.
- Migrating tests from `node:test` to `vitest`.
- Storing provider credentials.
- Allowing planner IA to modify product code.
- Making interactive prompts mandatory.

## Approved Acceptance Criteria

### Prepare-context modes

1. Given a project with Quiver initialized, when `npx create-quiver ai prepare-context --dry-run` runs, then Quiver keeps the current deterministic behavior, invokes no provider, writes no files, and shows the proposed docs plan.
2. Given a user runs `npx create-quiver ai prepare-context` without new flags, when the command finishes, then it writes only allowed context docs and does not modify product code.
3. Given a planner profile or explicit provider is available, when `npx create-quiver ai prepare-context --with-planner --dry-run` runs, then Quiver shows provider invocation, context inputs, candidate docs, and no writes.
4. Given the user has reviewed dry-run output, when `npx create-quiver ai prepare-context --with-planner` runs, then Quiver invokes the planner, validates the output, and applies only allowed docs-only changes.
5. Given the user wants to use another AI environment, when `--with-planner --print-prompt` is used, then Quiver prints the exact prompt and exits without provider auth or writes.
6. Given planner output suggests docs updates, when Quiver evaluates it, then only allowed context docs can be written.
7. Given planner output attempts product-code, dependency, build, test, lockfile, runtime, absolute, traversal, or outside-repo writes, when Quiver validates it, then the command blocks those writes and reports why.
8. Given the command writes docs, when it completes, then it snapshots touched docs under `.quiver/runs/<run-id>/snapshots/` and reports files, assumptions, risks, and generation source.
9. Given provider CLI fails, is missing, or is unauthenticated, when planner mode runs, then Quiver shows an actionable error and writes no partial changes.
10. Given planner output is incomplete, ambiguous, or invalid, when Quiver processes it, then Quiver does not write files automatically and reports the next safe step.

### CLI UX standard

11. Given the new behavior, when docs are reviewed, then README, command reference, templates, and `README_FOR_AI.md` explain deterministic mode, planner-assisted mode, and safe usage.
12. Given the new command surface, when tests run, then there is coverage for deterministic mode, planner dry-run, prompt printing, provider failure, invalid output, path blocking, docs-only writes, TTY/no-TTY, CI, and `--json`.
13. Given any command uses UX output, when it runs, then it clearly indicates whether it is deterministic, planner-assisted, interactive, review, dry-run, or machine mode.
14. Given multiple docs or checks are proposed, when human output is shown, then Quiver groups files, actions, risks, and next steps with clear visual hierarchy.
15. Given `--json`, CI, or stdout/stderr redirection, when output is produced, then no spinners, prompts, colors, or decorative symbols appear in machine-readable output.
16. Given a command supports `--review`, when a proposal exists, then Quiver opens `$VISUAL` or `$EDITOR`; if neither is available, it leaves an artifact path and gives a manual next step.
17. Given a command supports prompts, when `--interactive` is not used, then it must not block for interactive choices except already documented confirmations.
18. Given a prompt is added, when automation is needed, then equivalent non-interactive flags must exist.
19. Given a command uses loaders, when it runs in human TTY mode, then loaders appear only for slow stages and never hide errors.
20. Given an output uses colors, when colors are disabled or unsupported, then the output remains readable.

### Standard flags and visual identity

21. Given the UX standard, when docs are reviewed, then `--with-planner`, `--interactive`, and `--review` are defined with purpose, rules, and applicable commands.
22. Given a command is evaluated for those flags, when there is no generation, human decision, review, or planner value, then the command must not expose decorative flags.
23. Given `--with-planner --review` runs on a command that writes persistent AI-generated docs, then Quiver generates, validates, opens for human review, revalidates, and applies only allowed changes after approval.
24. Given unsupported UX flags are used on a command, then Quiver fails early with a clear explanation and an alternative command.
25. Given the Quiver CLI uses loaders, states, badges, or highlighted sections, when colors are enabled, then it uses the Quiver palette consistently:
    - `quiver.sky` `#86C8F2`
    - `quiver.blue` `#6BADEB`
    - `quiver.periwinkle` `#7F9EE8`
    - `quiver.violet` `#9B82E6`
    - `quiver.magenta` `#D56AB0`
26. Given semantic status output is needed, then success/error/warning semantics remain clear and are not replaced blindly by brand colors.
27. Given a migrated command shows output, then colors and symbols come from centralized helpers, not command-local hardcoding.

## Approved Technical Plan

1. Keep the current no-IA `ai prepare-context` behavior as the default.
2. Add shared CLI UX helpers behind a small internal abstraction before command adoption.
3. Add Quiver theme tokens and no-color/CI/no-TTY detection.
4. Add `$EDITOR` review support with safe fallback.
5. Add a planner context proposal contract and schema validation.
6. Add planner-assisted `ai prepare-context` flow with `--with-planner`, `--print-prompt`, `--dry-run`, `--review`, and `--interactive`.
7. Add strict docs-only allowlist and path safety for planner-generated writes.
8. Improve human output with loaders and hierarchy only where safe.
9. Preserve clean JSON output and automation behavior.
10. Apply the UX flag standard first to `ai prepare-context`, then selected parts of `ai plan`, `spec create`, and `ai pr`.
11. Document the standard and update generated templates.
12. Add tests and package/tarball smoke coverage.

## Command/Flag Matrix

| Command | `--with-planner` | `--interactive` | `--review` | Scope in this spec |
|---|---:|---:|---:|---|
| `ai prepare-context` | yes | yes | yes | Full implementation |
| `ai plan` | yes | yes | yes | Progressive adoption and contract alignment |
| `spec create` | yes | yes | yes | Progressive adoption and guardrails |
| `ai pr` | no | yes | yes | Review/edit PR body and interactive inputs |
| `ai onboard` | implicit planner | future | future | Documented follow-up |
| `ai revise` | future | future | future | Documented follow-up |
| `ai review-plan` | no planner flag | future | future | Documented follow-up |
| `doctor` | no | future for fixes | no | Documented follow-up |
| `flow`, `next`, `graph`, `ai inspect`, `ai export`, list commands | no | no | no | Must remain read-only/scriptable |

## Tools and Dependency Decisions

- Adopt `zod` for validating planner proposal contracts.
- Adopt `@clack/prompts` behind internal helpers for interactive prompts and human-mode spinners.
- Use Node native process spawning for `$EDITOR`.
- Do not adopt `commander`, `yargs`, or `oclif` in this spec.
- Do not adopt `ink`, `blessed`, `neo-blessed`, terminal image protocols, or `vitest` in this spec.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | CLI UX spec foundation | completed | none |
| slice-01 | CLI UX primitives, theme, and dependencies | completed | slice-00 |
| slice-02 | Planner context proposal contract | completed | slice-01 |
| slice-03 | Planner-assisted prepare-context review flow | planned | slice-01, slice-02 |
| slice-04 | UX flag matrix and compatibility guardrails | planned | slice-01 |
| slice-05 | Progressive command adoption | planned | slice-03, slice-04 |
| slice-06 | Docs, tests, smoke, and release readiness | planned | slice-02, slice-03, slice-04, slice-05 |

## Validation Strategy

- `node --test tests/**/*.test.js`
- focused command tests for `ai prepare-context`
- focused tests for UX mode detection and theme fallback
- focused tests for planner proposal schema/path validation
- focused tests for editor review cancellation and invalid edit fallback
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `npm pack --dry-run`
- `git diff --check`
- `npx create-quiver check-handoff` for all slice briefs
- JSON parse validation for all `slice.json` files

## Risks

- New dependencies may affect startup time, CJS/ESM compatibility, and package size.
- Visual output can break automation unless strictly disabled for `--json`, CI, no-TTY, and pipes.
- Planner output can be useful but invalid; the validation path must be strict.
- `$EDITOR` behavior differs across macOS, Linux, Windows PowerShell, Git Bash, and WSL.
- `--review` can become ambiguous unless consistently defined as "review before persistent writes".
- Progressive adoption can create inconsistent UX if the matrix is not documented and enforced.

## Open Questions

- Exact option spelling for no-color behavior: `--no-color`, environment detection only, or both.
- Whether `ai plan --with-planner` should be accepted as an alias even though planner behavior is already implicit.
- Whether `spec create --with-planner` should be implemented fully now or only guarded/documented until planner output contracts are more mature.
