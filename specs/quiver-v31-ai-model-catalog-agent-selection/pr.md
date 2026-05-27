## Title

Quiver v31: AI model catalog and guided agent setup

## Summary

- Adds a local Quiver model catalog for Codex, Claude, and Gemini.
- Separates technical model ids from human display names.
- Adds guided provider/model selection for agent profiles.
- Adds diagnostics and repair dry-run for existing profile misconfigurations.
- Improves live AI command preflight and provider error messages.

## Scope

- Local model catalog and alias normalization.
- Interactive `ai agent set <role>` provider/model flow.
- `ai models list`.
- `ai agent doctor`.
- `ai agent repair --dry-run`.
- Shared model preflight for live AI commands.
- Better invalid-model/provider error extraction.
- Documentation, templates, tests, smokes, and package readiness.

## Files

Expected areas:

- `src/create-quiver/lib/ai/model-catalog.js`
- `src/create-quiver/lib/agent-profiles.js`
- `src/create-quiver/lib/ai/providers.js`
- `src/create-quiver/lib/cli/selectors.js`
- `src/create-quiver/commands/ai.js`
- `docs/**`
- `README.md`
- `README_FOR_AI.md`
- `ROADMAP.md`
- `tests/**`
- `specs/quiver-v31-ai-model-catalog-agent-selection/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm.
- Optional provider CLIs for live validation smoke tests.
- A terminal that can run both TTY and no-TTY command checks.

### Worktree Access

- One dedicated branch/worktree for `quiver-v31-ai-model-catalog-agent-selection`.
- One commit per slice.

### Run the Project

This is a CLI framework change. Run command-level tests and smoke commands from the Quiver repo root.

### Use Cases

- Configure a planner interactively with Codex and a known model.
- Configure an executor with `custom`.
- Run `ai agent doctor` against legacy profile fixtures.
- Run `ai agent repair --dry-run` against `model: "GPT 5.5"`.
- Run `ai models list` and `ai models list --json`.
- Run `ai prepare-context --with-planner` with a bad display alias and verify Quiver blocks before Codex execution.
- Verify no-TTY and JSON outputs do not prompt or colorize.

### Technical Verification

- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `npm pack --dry-run`
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v31-ai-model-catalog-agent-selection`

## Evidence

- To be filled by implementation slices.

## Rollback

Revert slice commits in reverse order. Free-form custom model support and non-interactive profile setup must remain available during rollback.

## Risks / Notes

- Catalog models are known by Quiver, not guaranteed available for every account.
- Live validation can consume tokens and must be opt-in.
- Provider CLI behavior can change across versions.
- Existing profiles can contain legitimate custom values and must not be overwritten without explicit confirmation.
