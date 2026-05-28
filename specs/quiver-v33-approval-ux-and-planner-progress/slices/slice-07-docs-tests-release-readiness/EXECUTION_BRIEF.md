# EXECUTION_BRIEF - slice-07 Docs, tests, and release readiness

## Context

This slice closes the spec after implementation slices land. It synchronizes documentation, evidence, and PR readiness.

## Objective

Update docs and evidence, run validation, and prepare the PR for review without claiming package publication.

## Scope

- `docs/CLI_UX_GUIDE.md`
- `docs/reference/commands.md`
- `README_FOR_AI.md`
- generated docs templates if affected
- changelog/roadmap if local release process requires it
- spec evidence and closure docs

## Acceptance Criteria

- Public and AI-facing docs match implemented behavior.
- Generated templates match command guidance.
- Focused and full tests pass or blockers are explicit.
- Smoke/package readiness evidence is recorded.
- Spec status and PR body are updated.

## Technical Plan Summary

Close documentation after behavior is real. Run focused tests first, then full suite and smokes.

## Suggested Steps

1. Update docs and templates.
2. Run focused command tests.
3. Run full tests and smokes.
4. Update evidence and status.
5. Update PR body.

## Restrictions

- Do not claim npm publication.
- Do not introduce new behavior beyond documentation/test closure.

## Risks

- Full smokes can be slow or environment-sensitive; record exact blockers if any fail.

## Completion Checklist

- [ ] Docs updated.
- [ ] Focused tests run.
- [ ] Full tests/smokes run or blockers recorded.
- [ ] Evidence report updated.
- [ ] PR body ready.
