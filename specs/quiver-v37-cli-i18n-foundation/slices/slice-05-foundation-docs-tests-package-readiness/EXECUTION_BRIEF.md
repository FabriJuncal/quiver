# EXECUTION_BRIEF - slice-05 Foundation docs, tests, and package readiness

## Context

The foundation changes public CLI behavior and must be documented before later command migration specs start.

## Objective

Update public docs and run validation for the i18n foundation.

## Acceptance Criteria

- `docs/CLI_UX_GUIDE.md` documents language selection and JSON stability.
- `docs/reference/commands.md` documents `--lang`, `QUIVER_LANG`, and `config language`.
- Tests cover the foundation in `en`, `es`, no-TTY/CI, `--json`, and `--no-color` where relevant.
- Package smoke passes.

## Completion Checklist

- [ ] Docs updated.
- [ ] Full test suite passes.
- [ ] Package smoke passes.
- [ ] Spec validation passes.
