# EXECUTION_BRIEF - slice-01 CLI proposal contract

## Context

The new apply-docs workflow needs stable contracts before any write behavior or selector UX is implemented. This slice freezes parser behavior, flag incompatibilities, proposal artifact schemas, and command help expectations.

## Objective

Define and test the CLI contract and proposal artifact contract for v55 without writing final docs.

## Scope

- Parse/validate:
  - `--apply-docs`
  - `--save-proposal`
  - `--diff`
  - `--yes`
  - `--allow-dirty-docs`
  - `ai analyze-project apply --run <run-id>`
- Define proposal manifest schema and write manifest schema.
- Define allowed JSON combinations.
- Update command registry/help metadata if needed.
- Add contract tests only; no apply implementation.

## Acceptance Criteria

- Parser accepts the approved flags and subaction without breaking existing `ai analyze-project --deep`.
- Invalid flag combinations fail before provider execution with actionable errors.
- `--review` remains backward compatible.
- Proposal manifest schema is documented and testable.
- `apply --run` contract does not require provider/model.
- No runtime docs write is introduced in this slice.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-*.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/ai-analyze-project*.test.js`
- `tests/lib/ai*.test.js`
- `docs/reference/commands.md`
- this slice closure/status/evidence files

## Validation Required

```bash
node --test tests/commands/ai-analyze-project.test.js
node --test tests/commands/ai-analyze-project-review.test.js
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Completion Checklist

- Parser and help contract updated.
- Proposal/write manifest schema contract documented.
- Contract tests added or updated.
- Existing `--review` behavior verified.
- Slice closure brief updated with evidence.

## Constraints

- Do not implement actual docs applying.
- Do not call live providers.
- Do not relax analyze-project schema.
- Do not change `--review` semantics.
