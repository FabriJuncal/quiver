# Quiver v30 - Interactive CLI UX and Agent Selection

**Date:** 2026-05-26
**Status:** Planned
**Source:** User-approved production review for visible progress, Quiver colors, agent/model selectors, and consistent human/machine CLI output.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver has the first version of CLI UX primitives and planner-assisted `ai prepare-context`, but real dogfooding showed a critical UX gap: long-running IA commands can look frozen. `ai prepare-context --with-planner` starts provider execution without a visible loader, without Quiver-branded progress, and without a clear "this can take time" state.

The issue is broader than one command. Quiver needs a production-grade CLI UX contract for commands that run Planners, Executors, Reviewers, Doctors, specs, slices, PRs, and diagnostics. The CLI must feel guided for humans while staying safe for automation.

## Objective

Implement a consistent, production-safe CLI UX layer for Quiver:

- show real progress for long-running IA commands;
- use Quiver colors and hierarchy in human TTY output;
- let users choose configured Planner, Executor, Reviewer, Doctor, spec, slice, methodology, and execution mode through interactive selectors;
- always provide equivalent non-interactive flags;
- show selected agent display names such as `GPT 5.5`, not only provider names such as `codex`;
- keep `--json`, CI, no-TTY, `NO_COLOR`, and Windows-safe output clean;
- harden provider model selection so the selected model impacts the real provider invocation or blocks with an actionable error.

## Scope

### Included

- Central CLI UX runtime for headings, sections, checks, warnings, errors, next steps, summaries, spinners, task groups, and fallbacks.
- Quiver palette usage for human output: `#86C8F2`, `#6BADEB`, `#7F9EE8`, `#9B82E6`, `#D56AB0`.
- Multiple named IA profiles per role: Planner, Executor, Reviewer, Doctor.
- Interactive selectors for IA profiles, specs, slices, methodology, execution mode, review mode, verbosity, and execution strategy where appropriate.
- Equivalent non-interactive flags for every selector.
- Provider adapter contract for model selection support.
- Visible progress stages for IA commands and diagnostics.
- Doctor human output in a clear `Checks` / `Suggested fixes` format and stable JSON output.
- Signal, cancellation, timeout, error, and child-process cleanup behavior for long-running tasks.
- Tests, docs, generated templates, and package-readiness evidence.

### Excluded

- Replacing the CLI parser with `commander`, `oclif`, or `yargs`.
- Adding a TUI with `ink`, `blessed`, or `neo-blessed`.
- Adding image protocols or terminal graphics.
- Adding new IA providers beyond the existing provider contract.
- Storing provider credentials or API keys.
- Making interactive prompts mandatory.
- Changing WDD + SDD semantics.

## Approved Acceptance Criteria

### Long-running IA UX

1. Given a project with Quiver initialized, when `npx create-quiver ai prepare-context --with-planner` runs in a human TTY, then Quiver shows an initial heading, selected Planner display name, visible progress, and a spinner while the provider is running.
2. Given any IA command can take several seconds or minutes, when provider execution starts, then Quiver shows that it may take time and does not appear frozen.
3. Given a provider fails, times out, or is canceled, when Quiver exits, then the spinner is stopped, provider output is summarized safely, and no partial success state is shown.
4. Given `$EDITOR` or `$VISUAL` opens during a review flow, then any active spinner is stopped before opening the editor.
5. Given `SIGINT` or `SIGTERM`, then Quiver stops spinners, terminates provider child processes, cleans temporary prompt files, and persists a canceled/failed run state when applicable.

### Quiver visual identity

6. Given human TTY output with color support, when Quiver prints headings, states, checks, warnings, errors, badges, loaders, or highlighted sections, then output uses centralized Quiver theme helpers and the approved palette.
7. Given `--json`, `NO_COLOR=1`, `CI=true`, `TERM=dumb`, no-TTY, or `--ascii`, then Quiver emits clean, readable output without ANSI, spinners, decorative symbols, or prompts.
8. Given a command outputs human text, then it uses a consistent hierarchy: title, checks/progress, results, warnings/risks, suggested fixes, and next commands.

### Agent/profile selection

9. Given a command requires a Planner and multiple configured Planner profiles exist, when `--interactive` is used, then Quiver shows a selector populated only from configured profiles.
10. Given a Planner profile has `displayName: "GPT 5.5"`, when the command starts, then the heading says `Ejecutando <accion> con GPT 5.5` instead of `con Codex`, unless no more specific display name exists.
11. Given a command requires an Executor, Reviewer, or Doctor, when multiple profiles exist and `--interactive` is used, then Quiver shows the corresponding role-specific selector.
12. Given a command runs in CI, no-TTY, or `--json`, when a profile choice is required, then Quiver uses a configured default or fails with an actionable message showing the required flag.
13. Given a selector exists, then an equivalent non-interactive flag exists: `--planner`, `--executor`, `--reviewer`, `--doctor`, `--spec`, `--slice`, `--methodology`, and command-specific mode flags.
14. Given no profiles exist for a required role, then Quiver explains how to configure one with `ai agent set` and does not continue in live mode.

### Provider/model correctness

15. Given a profile selects a model, when the provider adapter supports model selection, then the real provider invocation receives the correct model argument or equivalent supported option.
16. Given a profile selects a model but the provider adapter does not support model selection, then live execution blocks with a clear message unless an explicit override is provided.
17. Given Quiver shows a model or profile as selected, then that value must either impact provider execution or be explicitly described as display-only.

### Specs, slices, methodology, and execution choices

18. Given multiple specs exist, when a command needs a spec and `--interactive` is used, then Quiver shows a spec selector using unique internal values and labels that include useful state.
19. Given multiple slices exist under a selected spec, when a command needs a slice and `--interactive` is used, then Quiver shows slice state, dependencies, and next-ready recommendation.
20. Given slice dependencies are incomplete, then Quiver does not silently select a blocked slice as the next executable slice.
21. Given methodology is requested, then Quiver shows only supported methodology options. For now, `WDD + SDD` is the only real option.
22. Given an action can write files, execute providers, create commits, or open PRs, then interactive mode shows a summary and confirmation before the sensitive action.

### Command adoption

23. Given `ai onboard` runs in human TTY mode, then it shows a heading with the selected Planner display name and real stages such as reading docs, detecting structure, preparing prompt, and executing agent.
24. Given `ai prepare-context --with-planner` runs, then it shows real stages for structure analysis, docs detection, prompt preparation, provider execution, proposal validation, and docs-only write planning.
25. Given `ai plan`, `ai review-plan`, `ai execute-slice`, `ai execute-plan`, and `ai pr` run, then each command uses command-specific real stages and never marks fake work as completed.
26. Given `doctor` runs in human mode, then output follows the `Quiver Doctor` structure with `Checks` and `Suggested fixes`.
27. Given `doctor --json` runs, then it emits a stable parseable schema with the same underlying findings as human output.

### Automation and compatibility

28. Given a command has a selector in human mode, when the same command runs with flags in automation, then it must be fully scriptable without prompts.
29. Given output is redirected or run in no-TTY mode, then the user still sees plain progress lines for long work unless `--json` is requested.
30. Given a command runs on Windows PowerShell, Git Bash, WSL, macOS, or Linux, then path examples, ASCII fallback, no-color behavior, and no-TTY behavior are documented and tested where possible.
31. Given package publication, then `npx create-quiver@latest` exposes the same UX behavior after release.

### Documentation and tests

32. Given the UX standard changes, then `docs/CLI_UX_GUIDE.md`, README, command reference, generated templates, and `README_FOR_AI.md` document the standard and examples.
33. Given the implementation is complete, then tests cover human output, machine output, no-color, CI, no-TTY, selector defaults, missing defaults, provider model support, provider failure, cancellation, doctor JSON, and package smoke.
34. Given this spec is executed, then slice-00 lands first and every later slice has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.

## Approved Technical Plan

1. Extend the existing CLI UX layer instead of replacing the parser.
2. Create a central human-output API for headings, sections, checks, warnings, errors, next steps, summaries, spinners, and task groups.
3. Add a progress runner that declares real stages per command and prevents fake completed checks.
4. Add multiple named IA profiles per role while keeping existing single-profile behavior backward compatible.
5. Add display-name resolution order: `displayName`, `model`, `provider`, then role.
6. Add interactive selectors only behind `--interactive`.
7. Add equivalent non-interactive flags for every selector.
8. Add provider adapter metadata for model selection support and invocation mapping.
9. Block or require explicit override when a chosen model cannot impact live provider execution.
10. Add signal, timeout, cancellation, spinner cleanup, temporary file cleanup, and run-state persistence for long-running IA flows.
11. Apply the standard first to `ai prepare-context --with-planner`, `ai onboard`, `ai plan`, and `doctor`.
12. Extend the standard to `ai review-plan`, `ai execute-slice`, `ai execute-plan`, `ai pr`, `init --interactive`, and `spec create --interactive`.
13. Preserve clean output in `--json`, CI, no-TTY, `NO_COLOR`, `TERM=dumb`, and ASCII modes.
14. Add tests and smoke coverage before package publication.

## UX Examples

### IA flow with selected Planner

```text
◇ Ejecutando onboarding con GPT 5.5

✓ Leyendo docs base
✓ Detectando estructura
✓ Preparando prompt
⠋ Ejecutando agente...
```

### Doctor

```text
◆ Quiver Doctor

Checks
  ✓ README encontrado
  ✓ AI_ONBOARDING_PROMPT.md encontrado
  ✓ Carpeta specs encontrada
  ! Falta docs/WORKFLOW.md
  ! Hay 2 slices sin CLOSURE_BRIEF.md

Suggested fixes
  npx create-quiver ai prepare-context --dry-run
```

### Planner selector

```text
? Que Planner queres usar?
  ◉ GPT 5.5
  ○ OPUS 4.7
```

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Spec foundation and source-of-truth sync | planned | none |
| slice-01 | CLI UX runtime and progress engine | planned | slice-00 |
| slice-02 | Agent profile selection and selectors | planned | slice-01 |
| slice-03 | Provider model selection contract | planned | slice-02 |
| slice-04 | Planner IA progress flows | planned | slice-01, slice-02, slice-03 |
| slice-05 | Executor, execution-plan, and PR progress flows | planned | slice-01, slice-02, slice-03 |
| slice-06 | Doctor visual and JSON contract | planned | slice-01 |
| slice-07 | Interactive init and spec create flows | planned | slice-01, slice-02 |
| slice-08 | Tests, docs, cross-platform smokes, and release readiness | planned | slice-04, slice-05, slice-06, slice-07 |

## Validation Strategy

- `node --test tests/**/*.test.js`
- focused tests for CLI UX runtime, theme, progress runner, selectors, and profile display names
- focused tests for provider model invocation and unsupported model blocking
- focused tests for `ai onboard`, `ai prepare-context`, `ai plan`, `ai review-plan`, `ai execute-slice`, `ai execute-plan`, `ai pr`, and `doctor`
- focused tests for `--json`, CI, no-TTY, `NO_COLOR`, `TERM=dumb`, and `--ascii`
- signal/cancellation tests where feasible through injected process runners
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `npm pack --dry-run`
- `git diff --check`
- JSON parse validation for all `slice.json` files
- `npx create-quiver spec validate specs/quiver-v30-interactive-cli-ux-agent-selection`

## Risks

- UX improvements can break automation if spinners, colors, or prompts leak into machine output.
- Model labels can become misleading if provider adapters do not pass models to real commands.
- Interactive selectors can block CI unless opt-in and backed by non-interactive flags.
- Signal cleanup is cross-platform and must avoid leaving child processes, locks, or temp files.
- Doctor visual polish must not diverge from JSON diagnostics.
- Windows terminals may need ASCII/no-color fallbacks for symbols and spinners.

## Resolved Decisions

- `--interactive` is required for selectors.
- Every selector must have a non-interactive flag equivalent.
- The selected agent/model display name is shown in headings.
- Provider names are fallback labels only.
- `WDD + SDD` is the only methodology option until another methodology is actually supported.
- Do not add `ink`, `blessed`, `neo-blessed`, `oclif`, `commander`, or `yargs` in this spec.
