# EXECUTION_BRIEF - slice-01 Local model catalog and alias normalization

## Context

Quiver currently stores free-form model labels. Users can accidentally save display names as provider model ids, causing live provider failures.

## Objective

Create Quiver's local model catalog and shared alias normalization helpers.

## Scope

- `src/create-quiver/lib/ai/model-catalog.js`
- `src/create-quiver/lib/agent-profiles.js`
- related unit tests

## Acceptance Criteria

- Required Codex, Claude, and Gemini entries exist.
- Catalog includes version and last updated date.
- Aliases normalize case-insensitively and tolerate spaces/dashes.
- `GPT 5.5`, `gpt 5.5`, `Gpt-5.5`, and `gpt-5.5` resolve to `gpt-5.5`.
- Existing v2 profiles remain readable.
- Custom models remain allowed.

## Technical Plan Summary

Add pure catalog/model-resolution helpers first. Later slices consume these helpers for prompts, doctor, repair, and live command preflight.

## Suggested Steps

1. Add `model-catalog.js`.
2. Add helpers for listing providers/models, defaults by role, alias matching, and normalization.
3. Extend profile building to use normalization where safe.
4. Add tests for catalog shape and aliases.

## Restrictions

- Do not add prompts.
- Do not execute provider CLIs.
- Do not add remote catalog calls.

## Risks

- Catalog entries can become stale.
- Alias collisions must not silently choose a model.

## Completion Checklist

- [ ] Catalog helpers implemented.
- [ ] Alias normalization tested.
- [ ] Legacy profile compatibility tested.
- [ ] `git diff --check` passes.
