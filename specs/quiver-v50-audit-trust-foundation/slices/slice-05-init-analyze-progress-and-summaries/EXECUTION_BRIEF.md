# EXECUTION_BRIEF - slice-05 init/analyze progress and summaries

## Context

`init` and `analyze` are onboarding commands. They need feedback for humans without contaminating CI, JSON, no-TTY, or no-color flows.

## Objective

Add safe progress feedback and stable summaries to onboarding commands.

## Scope

- `init` progress and summary.
- `analyze` progress and summary.
- UX mode detection.
- EN/ES messages.
- Tests for TTY/no-TTY/CI/JSON/no-color behavior.

## Acceptance Criteria

- Progress appears only in safe TTY conditions.
- Progress does not appear in `CI=true`, no-TTY, `--json`, or `--no-color`.
- Final summaries remain in normal human output.
- JSON outputs remain clean.
- New messages are localized.

## Expected Files To Modify

- `src/create-quiver/commands/init.js`
- `src/create-quiver/commands/analyze.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/cli/ux.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/analyze.test.js`
- `tests/commands/init-profiles.test.js`
- `tests/lib/cli-ux.test.js`
- `specs/quiver-v50-audit-trust-foundation/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/commands/analyze.test.js`
- `node --test tests/commands/init-profiles.test.js`
- `node --test tests/lib/cli-ux.test.js`
- `node --test`
- `git diff --check`

## Risks

- Spinner/progress noise in CI.
- Accidentally suppressing useful final summaries.
- Snapshot drift in existing tests.

## Dependencies

- Depends on `slice-00-audit-baseline-and-resolved-findings`.
- Depends on `slice-04-user-facing-i18n-error-coverage`.

## Instructions For Executor

1. Use existing UX helpers where possible.
2. Keep transient progress separate from final summary output.
3. Test stdout/stderr behavior explicitly.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Onboarding commands feel responsive without breaking automation.
