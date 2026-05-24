# EXECUTION BRIEF - slice-02: JSON export contract and machine output

## Context

Pixel Quiver could not consume `ai export --format json` directly because the output schema did not match dashboard needs and completed slices were missing in some states. This slice stabilizes machine output.

## Objective

Implement a stable, versioned JSON export contract and align AI export behavior with it.

## Scope

- Export resolver/adapters
- CLI format handling
- JSON schema fixtures/tests
- v27 evidence/status docs

## Acceptance Criteria

- `--format json` emits parseable JSON only on stdout.
- Export includes the required state, source metadata, warnings, and aggregates.
- Completed slices appear with `--include-completed`.
- Errors go to stderr and exit non-zero.
- Arrays are deterministically ordered.

## Technical Plan Summary

Define schema, serialize from the shared resolver, align `ai export`, and add CLI parse tests.

## Suggested Execution Steps

1. Define export payload shape and schema version.
2. Implement serializer over the shared resolver.
3. Align `ai export` and/or add `export-specs`.
4. Add valid/invalid fixtures and CLI tests.
5. Update docs/evidence.

## Restrictions

- Do not add dashboard UI.
- Do not mix human logs into JSON stdout.

## Risks

- Existing consumers may rely on older `ai export`; preserve or document compatibility.

## Completion Checklist

- [ ] Schema implemented.
- [ ] CLI JSON parse tests added.
- [ ] Completed slice export covered.
- [ ] Error path covered.
- [ ] Validation commands passed.

