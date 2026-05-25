# EXECUTION BRIEF - slice-01: Core state resolver and canonical statuses

## Context

Pixel Quiver showed that classic commands and AI commands can disagree about specs/slices, especially completed slices. This slice creates the shared model that later export, spec create, validation, and DX work depends on.

## Objective

Implement a shared internal resolver and canonical status model.

## Scope

- Resolver/state code under `src/create-quiver/lib/**`
- Command adapters that currently discover specs/slices independently
- Tests and fixtures for state discovery
- v27 evidence/status docs

## Acceptance Criteria

- Classic and AI commands can resolve the same specs/slices from the same underlying model.
- Completed slices are included when explicitly requested.
- Scoped reads do not parse unrelated specs unnecessarily.
- Status values are normalized and deterministic.
- Existing command contracts are preserved or explicitly documented.

## Technical Plan Summary

Extract or introduce a resolver module, route affected commands through it, add fixtures for mixed states, and test deterministic output.

## Suggested Execution Steps

1. Identify all spec/slice discovery implementations.
2. Design the internal model and canonical statuses.
3. Refactor command adapters incrementally.
4. Add tests for completed/draft/multiple-spec/scoped cases.
5. Update evidence and status.

## Restrictions

- Do not change public JSON schema in this slice unless required for compatibility.
- Do not implement spec create parsing here.

## Risks

- Broad resolver changes can regress many commands; keep adapters small and tested.

## Completion Checklist

- [ ] Shared resolver implemented.
- [ ] Canonical statuses documented in code/tests.
- [ ] Classic and AI commands covered by tests.
- [ ] Scoped behavior covered.
- [ ] Validation commands passed.

