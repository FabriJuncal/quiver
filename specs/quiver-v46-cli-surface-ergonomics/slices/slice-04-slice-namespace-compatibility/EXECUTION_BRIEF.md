# EXECUTION_BRIEF - slice-04 slice namespace compatibility

## Context

This slice introduces the canonical `slice` namespace while preserving legacy root commands.

## Objective

Introduce canonical `slice` subcommands while preserving root command compatibility.

## Scope

- `slice start <slice.json>`
- `slice check <slice.json>`
- `slice check-pr <slice.json>`
- `slice scope <slice.json>`
- `slice cleanup <slice.json>`
- `slice refresh`
- Legacy root aliases and deprecation warnings.
- Help, docs, generated scripts, doctor checks, and tests.

## Acceptance Criteria

- New commands match legacy behavior.
- Legacy commands continue to work.
- Deprecation warnings go to stderr only in human mode.
- No warning contaminates stdout or JSON.
- Docs and generated scripts prefer canonical commands while documenting compatibility.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/slice.js`
- `src/create-quiver/lib/cli/ux-flags.js`
- `src/create-quiver/lib/init-docs.js`
- `src/create-quiver/lib/doctor.js`
- `docs/reference/commands.md`
- `tests/commands/cli-contract.test.js`
- `tests/commands/slice-namespace.test.js`

## Validations Required

- `node --test tests/commands/cli-contract.test.js`
- `node --test tests/commands/slice-namespace.test.js`
- `git diff --check`
- Package-installed smoke for `slice` and legacy aliases.

## Risks

- Parser routing regressions.
- Stderr/stdout contamination.
- Doctor false positives for generated scripts.

## Dependencies

- Depends on `slice-00-cli-surface-baseline-and-delta`.
- Depends on `slice-01-i18n-command-error-hardening`.
- Depends on `slice-02-read-only-ux-quick-wins`.

## Instructions For Executor

1. Add parser support and command module routing together.
2. Centralize deprecation warning behavior.
3. Test canonical and legacy paths with equivalent fixtures.
4. Keep lifecycle/readiness/scope library semantics unchanged.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Canonical namespace works.
- Legacy aliases work with safe warnings.
- Docs/help/scripts/doctor agree.
