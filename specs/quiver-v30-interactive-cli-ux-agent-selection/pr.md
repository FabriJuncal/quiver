## Title

Quiver v30: interactive CLI UX, progress, and agent selection

## Summary

- Adds production-grade CLI UX for long-running IA commands.
- Shows visible progress, Quiver colors, selected agent display names, and safe fallback output.
- Adds interactive selectors for Planner, Executor, Reviewer, Doctor, specs, slices, methodology, and execution modes.
- Hardens provider model selection so selected models affect real invocations or block safely.
- Keeps `--json`, CI, no-TTY, no-color, and Windows-safe output clean.

## Scope

- CLI UX runtime and progress lifecycle.
- Multiple named IA profiles and selectors.
- Provider model support contract.
- Planner, executor, PR, doctor, init, and spec-create command adoption.
- Tests, docs, generated templates, smokes, and package readiness.

## Files

Expected areas:

- `src/create-quiver/lib/cli/**`
- `src/create-quiver/lib/agent-profiles.js`
- `src/create-quiver/lib/ai/**`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/spec.js`
- `src/create-quiver/lib/doctor.js`
- `src/create-quiver/index.js`
- `docs/**`
- `README.md`
- `README_FOR_AI.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `tests/**`
- `scripts/ci/**`
- `package.json`
- `package-lock.json`
- `specs/quiver-v30-interactive-cli-ux-agent-selection/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm.
- Git.
- Optional provider CLIs for manual live IA smoke tests.
- `gh` only for PR flow validation.

### Worktree Access

- One dedicated worktree/branch for `quiver-v30-interactive-cli-ux-agent-selection`.
- One commit per slice.

### Run the Project

This is a CLI framework change. Run command-level tests and smoke commands from the Quiver repo root.

### Use Cases

- Run `ai prepare-context --with-planner` and verify visible progress.
- Run IA commands with configured profile display names and verify headings use the selected profile/model.
- Run selectors with `--interactive`.
- Run equivalent non-interactive flags in no-TTY/CI mode.
- Run doctor in human mode and `--json`.
- Run provider failure/cancellation tests.
- Confirm `NO_COLOR`, `TERM=dumb`, `--ascii`, and `--json` stay clean.

### Technical Verification

- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `npm pack --dry-run`
- `git diff --check`
- `npx create-quiver spec validate specs/quiver-v30-interactive-cli-ux-agent-selection`

## Evidence

- To be filled by implementation slices.

## Rollback

Revert slice commits in reverse order. The existing deterministic and planner-assisted flows must remain usable during rollback.

## Risks / Notes

- Spinners and colors must not leak into machine-readable output.
- Displayed model names must reflect real provider invocation semantics.
- Interactive selectors must remain opt-in and script-safe.
