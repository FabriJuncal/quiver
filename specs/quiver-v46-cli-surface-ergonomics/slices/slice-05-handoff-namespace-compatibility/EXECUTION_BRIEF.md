# EXECUTION_BRIEF - slice-05 handoff namespace compatibility

## Context

This slice introduces the canonical `handoff` namespace while preserving legacy root commands.

## Objective

Introduce canonical `handoff` subcommands while preserving legacy handoff commands.

## Scope

- `handoff check <path.md>`
- `handoff create <spec-slug>`
- `check-handoff` compatibility alias.
- `new-handoff` compatibility alias.
- Help, docs, tests, and generated guidance.

## Acceptance Criteria

- Canonical commands match legacy behavior.
- Legacy aliases remain functional.
- Deprecation warnings go to stderr only in human mode.
- Handoff and brief validation contracts remain unchanged.
- Help/docs show canonical commands and compatibility aliases.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/handoff.js`
- `src/create-quiver/lib/handoff.js`
- `src/create-quiver/lib/cli/ux-flags.js`
- `src/create-quiver/lib/init-docs.js`
- `docs/reference/commands.md`
- `tests/commands/handoff-namespace.test.js`
- `tests/lib/handoff.test.js`

## Validations Required

- `node --test tests/lib/handoff.test.js`
- `node --test tests/commands/handoff-namespace.test.js`
- `node --test tests/commands/cli-contract.test.js`
- `git diff --check`

## Risks

- Breaking existing brief path validation.
- Warning output contaminating stdout.
- Inconsistent help examples.

## Dependencies

- Depends on `slice-00-cli-surface-baseline-and-delta`.
- Depends on `slice-01-i18n-command-error-hardening`.

## Instructions For Executor

1. Preserve handoff library behavior.
2. Route new namespace through the same implementation paths.
3. Add alias warning tests with stdout/stderr separation.
4. Update docs and generated guidance only where public contract changes.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Canonical and legacy commands pass.
- Warnings are safe.
- Docs/help align.
