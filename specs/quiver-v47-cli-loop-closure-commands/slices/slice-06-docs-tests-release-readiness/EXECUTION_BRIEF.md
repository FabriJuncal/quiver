# EXECUTION_BRIEF - slice-06 docs, tests, and release readiness

## Context

This slice closes v47 after all loop-closure command slices have completed.

## Objective

Close v47 with docs/help alignment, full tests, package smoke, and evidence.

## Scope

- Public docs.
- CLI help alignment.
- Focused and full validation.
- Package-installed smoke.
- Status and evidence updates.

## Acceptance Criteria

- Docs match implemented v47 commands.
- Package-installed smoke covers new commands.
- Full validation passes or blockers are documented.
- v47 status and evidence are updated.

## Expected Files To Modify

- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `README_FOR_AI.md`
- `tests/**`
- `scripts/ci/**`
- `specs/quiver-v47-cli-loop-closure-commands/**`

## Validations Required

- `node --test`
- `npm run package:quiver`
- Package-installed smoke
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`

## Risks

- Docs drift from actual command behavior.
- Package smoke omits one binary alias.

## Dependencies

- Depends on slices 01-05.

## Instructions For Executor

1. Review all v47 closure briefs.
2. Update docs only for implemented behavior.
3. Run focused tests before full validation.
4. Record evidence.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- v47 is documented, tested, and evidenced.
