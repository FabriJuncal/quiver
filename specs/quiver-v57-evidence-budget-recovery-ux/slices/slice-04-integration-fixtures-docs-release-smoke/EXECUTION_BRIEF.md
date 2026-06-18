# EXECUTION_BRIEF - slice-04 Integration Fixtures + Docs + Release Smoke

## Objective

Validate the full recovery workflow with fixtures, docs, and release smoke evidence.

## Context

This slice validates the feature end to end after the contracts and CLI output are implemented.

## Scope

- Add sanitized nika-erp-style fixture coverage.
- Add docs/troubleshooting guidance.
- Validate manifests and JSON recovery payloads.
- Validate English and Spanish command output.
- Update release evidence.

## Acceptance Criteria

- A nika-erp-style evidence failure produces a clear recovery command or safe fallback.
- Unsafe paths are never recommended.
- Manifests contain recovery classification and command data.
- Docs explain why `--max-bytes` exists and how to rerun safely.
- Release smoke evidence is recorded.

## Expected Files

- `tests/commands/ai-analyze-project-provider.test.js`
- `docs/**`
- `specs/quiver-v57-evidence-budget-recovery-ux/**`

## Validation

```bash
node --test tests/lib/ai-analyze-project-recovery.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/i18n-catalog.test.js
npm run docs:check
node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict
git diff --check
```

## Completion Checklist

- Sanitized nika-erp-style fixture reproduces recovery guidance.
- Docs explain `--max-files`, `--max-bytes`, and safe rerun guidance.
- Release evidence records validation commands.
- No private repo content or secrets are stored.
- Slice closure brief records validation evidence.

## Constraints

- Do not require a real private project fixture in CI.
- Do not store secrets or private project content.
