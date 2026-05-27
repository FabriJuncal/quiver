# EXECUTION_BRIEF - slice-06 Doctor visual and JSON contract

## Context

The user explicitly wants output shaped like `Quiver Doctor` with checks and suggested fixes. Doctor must remain useful for scripts.

## Objective

Give `doctor` a clear human format and a stable JSON contract with matching diagnostics.

## Scope

- Human doctor output.
- JSON doctor output.
- Exit-code semantics.
- Doctor fixtures and smoke tests.
- Docs for doctor output.

## Acceptance Criteria

- Human output includes `Quiver Doctor`, `Checks`, and `Suggested fixes`.
- `doctor --json` remains parseable and stable.
- Human and JSON findings match.
- Exit codes are deterministic.
- Smoke doctor fixtures pass.

## Plan tecnico resumido

Separate diagnostic data from renderers. Use the same findings model for human and JSON output.

## Suggested Steps

1. Identify current doctor findings data.
2. Add human renderer using shared UX runtime.
3. Add or stabilize JSON schema.
4. Add fixture tests for representative states.
5. Update docs.

## Restrictions

- Do not add automatic repair behavior.
- Do not invoke IA provider in doctor by default.
- Do not make colors required to understand severity.

## Risks

- Existing fixture snapshots may be brittle.
- JSON schema changes can break downstream automation.

## Completion Checklist

- [ ] Human doctor output validated.
- [ ] JSON schema validated.
- [ ] Fixture smoke passes.
- [ ] Docs updated.
