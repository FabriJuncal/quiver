# EXECUTION_BRIEF - slice-04 next/plan/graph UX edge cases

## Context

Some next/plan/graph audit findings may already be implemented. This slice must close gaps without unnecessary refactor.

## Objective

Close or validate secondary CLI UX edge cases without reimplementing completed behavior.

## Scope

- `next --auto-start` prompt behavior.
- `plan` missing-estimates note.
- `graph --level` empty state.
- `graph --json` vs `--format` docs.
- EN/ES and JSON safety.

## Acceptance Criteria

- Implemented behaviors are closed by evidence/tests only.
- Missing behaviors are implemented with tests.
- JSON output is not polluted by human notes.
- Docs match runtime behavior.

## Expected Files To Modify

- `src/create-quiver/commands/next.js`
- `src/create-quiver/commands/plan.js`
- `src/create-quiver/commands/graph.js`
- `src/create-quiver/lib/cli/selectors.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `tests/commands/next.test.js`
- `tests/commands/plan.test.js`
- `tests/commands/graph.test.js`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/commands/next.test.js`
- `node --test tests/commands/plan.test.js`
- `node --test tests/commands/graph.test.js`
- `node --test`
- `git diff --check`

## Risks

- Refactoring stable read-only command logic unnecessarily.
- Polluting JSON with human notes.
- Prompt behavior not respecting no-TTY.

## Dependencies

- Depends on `slice-00-cli-contract-baseline`.

## Instructions For Executor

1. Check current tests before implementing.
2. Add only missing behavior.
3. Prefer evidence/docs for already-complete findings.
4. Preserve read-only nature.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Secondary UX edges are closed without destabilizing read-only commands.
