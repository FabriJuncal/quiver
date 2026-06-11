# EXECUTION_BRIEF - slice-03 schema error grouping

## Context

The current provider failure can print many repeated schema issues. Users need a compact explanation and a complete manifest for debugging.

## Objective

Group schema errors into actionable console output while preserving complete validation evidence.

## Scope

- Error grouping.
- Cause hints.
- Next safe command.
- Validation manifest.
- i18n messages.

## Acceptance Criteria

- Repeated `notes` errors are grouped.
- Console output shows a bounded number of examples.
- Complete validation issues are available in a manifest.
- `--json` remains machine-readable.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- provider tests/fixtures

## Validations Required

- `node --test tests/commands/ai-analyze-project-provider.test.js`
- `node --test tests/commands/ai-analyze-project.test.js`
- `npm run docs:check`
- `git diff --check`

## Risks

- Overly compact errors can hide necessary debugging detail.
- Human output can accidentally break `--json`.

## Dependencies

- Depends on `slice-01-provider-fixture-harness`.

## Instructions For Executor

1. Preserve strict schema validation.
2. Do not implement repair in this slice.
3. Keep complete details in a manifest, not only in console output.

## Completion Checklist

- [ ] Error grouping implemented.
- [ ] Tests assert compact output.
- [ ] Manifest details are complete.
- [ ] Closure brief updated.

## Conditions Of Closure

- Schema failure output is understandable without losing debug evidence.
