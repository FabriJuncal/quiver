# EXECUTION_BRIEF - slice-01 contract regression harness

## Context

The live `nika-erp` provider run exposed schema drift and UX issues that must be locked into deterministic tests before implementation changes continue.

## Objective

Create the regression contract and sanitized fixture harness for v54 without live provider requirements.

## Scope

- Add or update deterministic fixtures for `claim`, `notes`, `confidence`, missing `name`, repeated drift, timeout, cancellation, and invalid final JSON.
- Add golden expectations for no-write and compact-error behavior.
- Keep this slice focused on tests/contracts; runtime fixes belong to later slices.

## Acceptance Criteria

- Fixtures reproduce the observed `nika-erp` drift without credentials, network, or a live checkout.
- Tests assert `--dry-run` creates no `.quiver/runs`, docs, or code writes.
- Tests assert provider mode without `--review` writes only audit artifacts and no final docs.
- Tests assert `--json` stdout is parseable and not contaminated by progress.
- Tests assert console schema errors are grouped and bounded.
- The spec validates with this slice present.

## Completion Checklist

- [ ] Fixtures added or updated.
- [ ] Tests fail against missing behavior and pass after later slices.
- [ ] `slice.json` status and `CLOSURE_BRIEF.md` updated with evidence.

## Expected Files To Modify

- `tests/fixtures/analyze-project/**`
- `tests/commands/ai-analyze-project-provider.test.js`
- `tests/commands/ai-analyze-project.test.js`
- `tests/commands/ai-analyze-project-review.test.js`
- `tests/lib/ai/analyze-project-repair.test.js`
- This slice's closure/status/evidence files.

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/commands/ai-analyze-project.test.js
node bin/create-quiver.js spec validate specs/quiver-v54-deep-project-analysis-hardening --strict
git diff --check
```

## Constraints

- Do not call live providers.
- Do not implement runtime repair/retry in this slice.
- Do not store real provider secrets or raw private project data.
