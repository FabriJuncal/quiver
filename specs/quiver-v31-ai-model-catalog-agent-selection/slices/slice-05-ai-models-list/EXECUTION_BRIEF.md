# EXECUTION_BRIEF - slice-05 AI models list command

## Context

Users need a discoverable way to see Quiver's known providers and model ids without reading source files.

## Objective

Add `ai models list` with human and JSON output.

## Scope

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/model-catalog.js`
- command/help tests

## Acceptance Criteria

- `ai models list` groups models by provider.
- `ai models list --provider codex` filters to Codex.
- `ai models list --json` emits valid JSON with `catalogVersion` and `lastUpdated`.
- Human output says known by Quiver, not available.
- Help output includes the command.

## Technical Plan Summary

Render the catalog through the existing CLI UX primitives and keep JSON output free of colors/prompts/prose.

## Suggested Steps

1. Add command routing.
2. Add provider filter validation.
3. Add human renderer.
4. Add JSON renderer.
5. Add tests for output and help contract.

## Restrictions

- Do not call provider CLIs.
- Do not implement remote catalog lookup.
- Do not call models available without validation.

## Risks

- Human output can become too noisy if metadata is excessive.

## Completion Checklist

- [ ] Human output implemented.
- [ ] JSON output implemented.
- [ ] Provider filtering tested.
- [ ] Help contract updated.
