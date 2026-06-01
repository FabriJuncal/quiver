# EXECUTION_BRIEF - slice-06 docs, tests, and release readiness

## Context

This slice closes v49 after parser migration and help readiness complete.

## Objective

Close v49 with documentation, full validation, package smoke, and evidence.

## Scope

- Parser docs and help docs.
- Parser contract tests.
- Full test suite.
- Package-installed smoke.
- Status/evidence updates.

## Acceptance Criteria

- Parser docs match behavior.
- Full validation passes or blockers are documented.
- Package-installed smoke covers both binaries.
- v49 status and evidence are updated.

## Expected Files To Modify

- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `README_FOR_AI.md`
- `tests/**`
- `scripts/ci/**`
- `specs/quiver-v49-parser-modernization/**`

## Validations Required

- `node --test`
- `npm run package:quiver`
- Package-installed parser smoke
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v49-parser-modernization`

## Risks

- Missing package-installed parser regressions.
- Docs drifting from actual parser behavior.

## Dependencies

- Depends on slices 04-05.

## Instructions For Executor

1. Review prior closure briefs.
2. Smoke both `create-quiver` and `quiver`.
3. Record evidence and blockers clearly.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- v49 parser modernization is documented, tested, and evidenced.
