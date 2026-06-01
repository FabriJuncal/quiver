# EXECUTION_BRIEF - slice-02 evidence list and show

## Context

This slice closes the evidence loop by adding safe read-only browsing commands.

## Objective

Add `evidence list` and `evidence show <path>` so users can browse generated evidence from the CLI.

## Scope

- Evidence discovery.
- Safe evidence display.
- Parser/help/docs updates.
- Tests for unsafe paths and existing `evidence run`.

## Acceptance Criteria

- `evidence list` has stable ordering.
- `evidence show <path>` displays safe artifacts.
- Traversal and unsafe paths are rejected.
- `evidence run -- <command>` remains compatible.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/evidence.js`
- `src/create-quiver/lib/evidence.js`
- `tests/commands/evidence.test.js`
- `tests/lib/evidence.test.js`

## Validations Required

- `node --test tests/lib/evidence.test.js`
- `node --test tests/commands/evidence.test.js`
- `git diff --check`

## Risks

- Path traversal.
- Leaking unexpected files.
- Breaking `evidence run` parsing with `--`.

## Dependencies

- Depends on `slice-00-loop-closure-foundation`.

## Instructions For Executor

1. Add path safety before display.
2. Keep output read-only.
3. Preserve current run behavior exactly.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Evidence browsing works safely.
- Existing evidence run tests still pass.
