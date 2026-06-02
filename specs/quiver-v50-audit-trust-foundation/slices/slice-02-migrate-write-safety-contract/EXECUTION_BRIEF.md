# EXECUTION_BRIEF - slice-02 migrate write-safety contract

## Context

`migrate` writes project files. It must not perform side effects before explicit user confirmation or `--yes`.

## Objective

Require explicit confirmation before `migrate` performs any side effects.

## Scope

- TTY confirmation.
- no-TTY safe behavior.
- `migrate --yes`.
- `migrate --dry-run`.
- Parser/help/i18n/tests.

## Acceptance Criteria

- No side effects happen before confirmation.
- Cancellation leaves the tree unchanged.
- no-TTY without `--yes` is safe and actionable.
- `migrate --yes` proceeds without prompt.
- `migrate --dry-run` remains prompt-free and write-free.
- `--yes` help scope is updated.
- EN/ES messages exist.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/parser-contract.test.js`
- `tests/commands/*migrate*.test.js`
- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `specs/quiver-v50-audit-trust-foundation/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/commands/parser-contract.test.js`
- `node --test`
- `git diff --check`

## Risks

- Prompting too late after side effects.
- Treating `--yes` as unsupported or too global.
- Breaking automation/no-TTY flows.

## Dependencies

- Depends on `slice-00-audit-baseline-and-resolved-findings`.

## Instructions For Executor

1. Move confirmation before `packTemplate`, file writes, state updates, and install attempts.
2. Snapshot test cancellation and no-TTY behavior.
3. Keep dry-run behavior unchanged.
4. Keep stdout clean for machine-readable paths.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- `migrate` cannot unexpectedly modify a project.
