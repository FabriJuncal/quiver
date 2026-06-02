# EXECUTION_BRIEF - slice-03 base branch resolution policy

## Context

Multiple commands use base branches. Fixing only one command can leave contradictory defaults.

## Objective

Define and apply a consistent base branch resolution policy across commands.

## Scope

- Shared base branch policy/helper.
- `spec close`.
- `ai pr`.
- `slice check`.
- `slice scope`.
- Readiness flows.
- Tests for major branch/default scenarios.

## Acceptance Criteria

- `--base` always wins.
- Remote HEAD is used when available.
- Fallback behavior is documented and localized.
- `main`, `master`, `develop`, no remote, fetch failure, and explicit override are covered.
- `ai pr` does not change `gh pr create` behavior without tests.

## Expected Files To Modify

- `src/create-quiver/lib/git.js`
- `src/create-quiver/lib/spec-worktrees.js`
- `src/create-quiver/lib/readiness.js`
- `src/create-quiver/lib/ai/github.js`
- `src/create-quiver/commands/spec.js`
- `src/create-quiver/commands/ai-core.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/spec-close.test.js`
- `tests/commands/ai-pr.test.js`
- `tests/lib/git.test.js`
- `tests/lib/check-slice.test.js`
- `docs/reference/commands.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/lib/git.test.js`
- `node --test tests/commands/spec-close.test.js`
- `node --test tests/commands/ai-pr.test.js`
- `node --test tests/lib/check-slice.test.js`
- `node --test`
- `git diff --check`

## Risks

- Inconsistent defaults across commands.
- Fetch-dependent tests becoming flaky.
- Breaking PR base selection.

## Dependencies

- Depends on `slice-00-cli-contract-baseline`.

## Instructions For Executor

1. Audit all base branch consumers before implementation.
2. Prefer a shared helper or documented policy.
3. Keep `--base` behavior explicit and highest priority.
4. Test offline/no-remote cases.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Quiver base branch defaults are predictable and consistent.
