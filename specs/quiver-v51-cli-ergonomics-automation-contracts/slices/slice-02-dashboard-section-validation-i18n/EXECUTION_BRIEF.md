# EXECUTION_BRIEF - slice-02 dashboard section validation and i18n

## Context

Dashboard section validation exists but must be localized, documented, and contract-tested.

## Objective

Make dashboard section validation localized, actionable, and documented.

## Scope

- Invalid `--section` error.
- Valid section list.
- EN/ES messages.
- Help/reference docs.
- Tests.

## Acceptance Criteria

- Invalid sections produce localized errors.
- Error lists the real supported sections.
- Help/reference docs list valid values.
- Failure does not contaminate machine-readable stdout.

## Expected Files To Modify

- `src/create-quiver/commands/dashboard.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `docs/reference/commands.md`
- `tests/commands/dashboard.test.js`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/commands/dashboard.test.js`
- `node --test tests/lib/i18n-catalog.test.js`
- `node --test`
- `git diff --check`

## Risks

- Docs listing sections that runtime does not support.
- Error text in English under `--lang es`.

## Dependencies

- Depends on `slice-00-cli-contract-baseline`.

## Instructions For Executor

1. Source the valid section list from runtime when possible.
2. Test EN/ES behavior.
3. Keep JSON schema unchanged.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Dashboard section errors are actionable in both supported languages.
