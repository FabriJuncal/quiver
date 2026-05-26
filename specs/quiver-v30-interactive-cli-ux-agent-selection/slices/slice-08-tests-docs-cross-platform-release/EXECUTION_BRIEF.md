# EXECUTION_BRIEF - slice-08 Tests, docs, cross-platform smokes, and release readiness

## Context

This slice closes v30. It must prove that the UX improvements work for humans without breaking automation or package publication.

## Objective

Validate the full v30 implementation and prepare release-ready evidence.

## Scope

- Full test suite.
- Smoke suites.
- Package smoke and `npm pack --dry-run`.
- Docs, README, README_FOR_AI, ROADMAP, CHANGELOG.
- Final evidence, status, and PR body updates.

## Acceptance Criteria

- Full tests pass.
- Smoke suites pass.
- Package/tarball checks pass.
- Human vs machine output docs are accurate.
- Cross-platform usage is documented.
- Final evidence is recorded.

## Plan tecnico resumido

Treat this as release readiness: no new product behavior unless it fixes validation gaps from earlier slices.

## Suggested Steps

1. Audit all accepted criteria against implementation.
2. Add missing tests or fixtures.
3. Update docs and generated templates.
4. Run full validations.
5. Update evidence/status/pr body.
6. Prepare package release notes.

## Restrictions

- Do not publish npm without explicit user request.
- Do not expand scope beyond v30 acceptance criteria.
- Do not leave failing validations unrecorded.

## Risks

- Cross-platform behavior can be hard to prove fully on one OS.
- Package tarball may expose missing dependencies or unintended files.

## Completion Checklist

- [ ] Full tests pass.
- [ ] Smoke suites pass.
- [ ] Package smoke passes.
- [ ] Docs updated.
- [ ] Evidence report updated.
- [ ] PR body ready.
