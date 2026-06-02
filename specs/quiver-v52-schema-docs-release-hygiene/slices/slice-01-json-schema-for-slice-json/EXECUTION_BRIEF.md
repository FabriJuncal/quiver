# EXECUTION_BRIEF - slice-01 JSON Schema for slice.json

## Context

Users manually edit `slice.json`. A schema helps only if it matches what Quiver actually validates and generates.

## Objective

Publish a `slice.json` JSON Schema aligned with runtime behavior.

## Scope

- `docs/schema/slice.schema.json`.
- Schema generation or maintenance script.
- Valid/invalid fixtures.
- Docs reference.
- Package inclusion if public.

## Acceptance Criteria

- Schema is valid JSON Schema Draft-07 or higher.
- Existing valid slice fixtures pass.
- Representative invalid fixtures fail.
- Required/optional fields match runtime behavior.
- Docs reference the schema.
- Package smoke includes the schema if it is public.

## Expected Files To Modify

- `docs/schema/slice.schema.json`
- `package.json`
- `package-lock.json`
- `scripts/**`
- `tests/**`
- `docs/**`
- `specs/quiver-v52-schema-docs-release-hygiene/EVIDENCE_REPORT.md`

## Validations Required

- `npm ci`
- `node --test`
- schema validation script
- `npm run package:quiver`
- `git diff --check`

## Risks

- Schema diverges from runtime.
- New dependency without lockfile update.
- Schema excluded from npm package accidentally.

## Dependencies

- Depends on `slice-00-schema-docs-release-baseline`.

## Instructions For Executor

1. Use the baseline source-of-truth decision.
2. Validate against real fixtures.
3. Do not promise fields runtime does not support.
4. Update package smoke if schema is published.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Users can rely on the schema for real `slice.json` editing.
