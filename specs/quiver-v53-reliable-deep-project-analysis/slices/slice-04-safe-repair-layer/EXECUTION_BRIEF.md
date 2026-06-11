# EXECUTION_BRIEF - slice-04 safe repair layer

## Context

The observed drift is structurally repairable: unsupported `notes` keys appear in otherwise useful provider JSON. Repair must be safe, minimal, auditable, and non-semantic.

## Objective

Add safe repair for provider output that fails only because of unsupported additional properties.

## Scope

- Repair module.
- Repair manifest.
- Revalidation after repair.
- Tests for `notes` drift and unrepairable errors.

## Acceptance Criteria

- Extra `notes` keys are removed and recorded.
- Repaired output must pass schema before proceeding.
- Repair does not move or reinterpret content.
- Unrepairable errors still fail safely.

## Expected Files To Modify

- `src/create-quiver/lib/ai/analyze-project-repair.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `src/create-quiver/commands/ai.js`
- repair/provider tests

## Validations Required

- `node --test tests/lib/ai/analyze-project-repair.test.js`
- `node --test tests/commands/ai-analyze-project-provider.test.js`
- `npm run schema:slice:check`
- `git diff --check`

## Risks

- Repair could hide real model mistakes if it becomes too broad.
- Removing fields without manifest can reduce auditability.

## Dependencies

- Depends on `slice-03-schema-error-grouping`.

## Instructions For Executor

1. Keep repair whitelist narrow.
2. Do not change semantic values.
3. Record every repair and revalidate.

## Completion Checklist

- [ ] Repair module implemented.
- [ ] Repair manifest implemented.
- [ ] Revalidation tests pass.
- [ ] Closure brief updated.

## Conditions Of Closure

- The `notes` drift failure can be repaired safely and audited.
