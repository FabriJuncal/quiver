## Title

Quiver v29: planner-assisted prepare-context and CLI UX standard

## Summary

- Adds a shared UX standard for Quiver CLI commands.
- Keeps `ai prepare-context` deterministic by default.
- Adds an explicit planner-assisted prepare-context mode.
- Adds review and interactive patterns with safe non-interactive alternatives.
- Standardizes color tokens, loaders, prompts, JSON/CI/no-TTY behavior, and command flag applicability.

## Scope

- CLI UX infrastructure and docs.
- Planner proposal validation for context documentation.
- `ai prepare-context` planner-assisted mode.
- Progressive UX adoption for selected commands.
- Tests, generated docs, and package readiness.

## Files

Expected areas:

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/spec.js`
- `src/create-quiver/lib/cli/**`
- `src/create-quiver/lib/ai/**`
- `docs/**`
- `README.md`
- `README_FOR_AI.md`
- `tests/**`
- `package.json`
- `package-lock.json`
- `specs/quiver-v29-planner-prepare-context-cli-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm.
- Git.
- Local provider CLI only for provider-backed tests/manual smoke.

### Worktree Access

- One spec worktree dedicated to `quiver-v29-planner-prepare-context-cli-ux`.
- One commit per slice.

### Run the Project

This is a CLI framework change. Run command-level tests and smoke commands from the Quiver repo root.

### Use Cases

- Run deterministic `ai prepare-context`.
- Run planner-assisted dry-run.
- Print planner prompt without provider auth.
- Review planner proposal with `$EDITOR`.
- Confirm JSON/no-TTY/CI output stays clean.
- Confirm unsupported UX flags fail with actionable guidance.

### Technical Verification

- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `npm pack --dry-run`
- `git diff --check`
- `npx create-quiver spec validate specs/quiver-v29-planner-prepare-context-cli-ux`

## Evidence

To be filled by implementation slices.

## Rollback

Revert the slice commits in reverse order. The deterministic `ai prepare-context` default must remain available throughout rollback.

## Risks / Notes

- Dependencies must be validated for CJS/ESM compatibility and package size.
- Human-mode visual output must never leak into JSON or CI output.
- Planner output must be treated as untrusted until validated.
