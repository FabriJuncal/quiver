# EXECUTION_BRIEF - slice-04 demo spec-viewer alias

## Context

This slice simplifies the only current demo command without removing the existing form.

## Objective

Add `demo spec-viewer` as a simplified entrypoint while preserving `demo create spec-viewer`.

## Scope

- Parser support.
- Demo command routing.
- Help/docs updates.
- Tests for canonical and compatibility forms.

## Acceptance Criteria

- `demo spec-viewer [--dry-run]` works.
- `demo create spec-viewer [--dry-run]` remains functional.
- Dry-run output and write behavior remain compatible.
- Help documents both forms.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/demo.js`
- `src/create-quiver/lib/demo.js`
- `tests/commands/demo.test.js`
- `tests/commands/cli-contract.test.js`

## Validations Required

- `node --test tests/commands/demo.test.js`
- `node --test tests/commands/cli-contract.test.js`
- `git diff --check`

## Risks

- Ambiguous parser interpretation of `demo spec-viewer`.
- Breaking default output directory.

## Dependencies

- Depends on `slice-00-loop-closure-foundation`.

## Instructions For Executor

1. Route both forms to the same implementation.
2. Preserve default target behavior.
3. Do not add new demo types.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Both demo forms are tested and documented.
