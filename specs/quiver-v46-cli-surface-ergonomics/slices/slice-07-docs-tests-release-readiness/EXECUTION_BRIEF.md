# EXECUTION_BRIEF - slice-07 docs, tests, and release readiness

## Context

This slice closes v46 after all behavior slices have completed.

## Objective

Close v46 by aligning docs, generated guidance, tests, package smoke, and evidence.

## Scope

- Public docs and command reference.
- Generated templates affected by command names.
- Full test suite and package smoke.
- Spec evidence/status updates.

## Acceptance Criteria

- Docs match actual CLI behavior.
- Generated guidance prefers canonical commands and documents compatibility aliases.
- Full validation passes or blockers are documented.
- v46 status and evidence are updated.

## Expected Files To Modify

- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `README_FOR_AI.md`
- `docs/COMMANDS.md.template`
- `docs/COMMANDS.md.es.template`
- `tests/**`
- `scripts/ci/**`
- `specs/quiver-v46-cli-surface-ergonomics/**`

## Validations Required

- `node --test`
- `npm run package:quiver`
- Package-installed smoke for affected commands
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v46-cli-surface-ergonomics`

## Risks

- Documentation drift.
- Package smoke missing alias behavior.
- Final evidence not recording failures clearly.

## Dependencies

- Depends on slices 01-06.

## Instructions For Executor

1. Review all prior closure briefs.
2. Update docs only for behavior actually implemented.
3. Run focused tests before full suite.
4. Record validation evidence in `EVIDENCE_REPORT.md`.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- v46 public contract is documented.
- Release validation is complete.
- Status and evidence reflect final state.
