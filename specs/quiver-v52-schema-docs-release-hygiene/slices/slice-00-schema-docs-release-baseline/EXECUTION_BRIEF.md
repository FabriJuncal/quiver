# EXECUTION_BRIEF - slice-00 schema/docs/release baseline

## Context

Schema and generated docs work can create false confidence if the source of truth is wrong. Package/release hygiene must also know which files are published.

## Objective

Identify source of truth and package boundaries before generating schema or docs.

## Scope

- `slice.json` source-of-truth decision.
- Package boundary classification.
- Existing package/release smoke assessment.
- Generated command docs strategy.

## Acceptance Criteria

- Schema source decision is explicit.
- Files are classified as `published`, `repo-only`, or `generated`.
- Generated docs strategy is selected.
- Runtime code is unchanged.

## Expected Files To Modify

- `specs/quiver-v52-schema-docs-release-hygiene/SPEC.md`
- `specs/quiver-v52-schema-docs-release-hygiene/STATUS.md`
- `specs/quiver-v52-schema-docs-release-hygiene/EVIDENCE_REPORT.md`

## Validations Required

- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v52-schema-docs-release-hygiene`

## Risks

- Building schema from the wrong source.
- Publishing or excluding new files accidentally.
- Overwriting curated command docs later.

## Dependencies

- None.

## Instructions For Executor

1. Inspect runtime validation/generation before deciding schema source.
2. Inspect `.npmignore` and package smoke before classifying files.
3. Keep this slice documentary.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- v52 can generate schema/docs without guessing.
