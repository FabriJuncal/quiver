# EXECUTION_BRIEF - slice-05 evidence robustness and path safety

## Context

Evidence is a trust artifact. It must remain reliable for success, failure, interruption, large output, secrets, and safe paths.

## Objective

Make evidence run/list/show robust for failures, signals, output limits, redaction, JSON, and safe paths.

## Scope

- `evidence run`.
- `evidence list`.
- `evidence show`.
- Output path policy.
- Path traversal and symlink safety.
- Exit code and signal behavior.
- Redaction/truncation.

## Acceptance Criteria

- Failing child exit codes are preserved.
- Evidence is written for command failures.
- Signal behavior is documented and tested.
- No orphan child processes remain.
- Output/read paths cannot escape the allowed policy.
- Redaction and truncation still work.
- JSON list/show remain parseable.

## Expected Files To Modify

- `src/create-quiver/commands/evidence.js`
- `src/create-quiver/lib/evidence.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/evidence.test.js`
- `tests/lib/evidence.test.js`
- `docs/reference/commands.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/commands/evidence.test.js`
- `node --test tests/lib/evidence.test.js`
- `node --test`
- `git diff --check`

## Risks

- Breaking exit code semantics.
- Losing partial output on interruption.
- Allowing path escape through symlinks.

## Dependencies

- Depends on `slice-00-cli-contract-baseline`.

## Instructions For Executor

1. Define output path policy before implementation.
2. Preserve existing evidence format unless migration is compatible.
3. Test failure, signal, traversal, symlink, truncation, and redaction cases.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Evidence commands are safe and reliable under production failure modes.
