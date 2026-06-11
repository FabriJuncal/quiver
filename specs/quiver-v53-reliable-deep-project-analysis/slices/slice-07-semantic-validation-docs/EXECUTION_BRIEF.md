# EXECUTION_BRIEF - slice-07 semantic validation, docs, and benchmark

## Context

Passing JSON schema is necessary but not sufficient. The analysis must remain evidence-backed and understandable to users.

## Objective

Add semantic validation and document the reliable analyze-project workflow.

## Scope

- Confidence/evidence validation.
- Strict-mode behavior.
- Command docs.
- Troubleshooting docs.
- Benchmark guidance.

## Acceptance Criteria

- `confirmed` claims require explicit evidence.
- Evidence-poor output is reported as warning or strict error.
- Docs explain dry-run, provider, repair, retry, audit, and review behavior.
- Benchmark guidance separates deterministic fixtures from optional live provider smoke.

## Expected Files To Modify

- `src/create-quiver/lib/ai/analyze-project-validation.js`
- i18n messages
- `docs/reference/commands.md`
- `docs/workflows/existing-project.md`
- `docs/TROUBLESHOOTING.md`
- provider tests/fixtures

## Validations Required

- `node --test tests/commands/ai-analyze-project-provider.test.js`
- `npm run docs:check`
- `npm run smoke:create-quiver`
- `git diff --check`

## Risks

- Over-strict semantic validation can reject useful inferred analysis.
- Docs can drift from actual CLI behavior.

## Dependencies

- Depends on `slice-06-audit-review-transaction`.

## Instructions For Executor

1. Keep semantic validation conservative.
2. Do not promote inferred claims to confirmed.
3. Keep docs aligned with CLI help and tests.

## Completion Checklist

- [ ] Semantic validation implemented.
- [ ] Docs updated.
- [ ] Benchmark guidance added.
- [ ] Closure brief updated.

## Conditions Of Closure

- Users understand and can verify reliable analyze-project behavior.
