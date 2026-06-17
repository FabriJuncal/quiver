# EXECUTION_BRIEF - slice-03 CLI UX + Docs + Real Fixture Smoke

## Context

Slice 03 depends on the integrated apply behavior from Slice 02 and focuses on user-facing output, docs, and regression evidence.

## Objective

Finish the user-facing output, docs, and nika-erp regression coverage after Slice 02 integration.

## Acceptance Criteria

- Output reports merge strategies and warnings.
- Docs/troubleshooting explain how to fix old placeholder-heavy docs.
- nika-erp style fixture proves final visible docs are usable.
- Name conflicts are reported.

## Validation

```bash
node --test tests/commands/ai-analyze-project-provider.test.js tests/commands/cli-contract.test.js
npm run docs:check
node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict
git diff --check
```

## Completion Checklist

- Output copy is compact and actionable.
- Docs and troubleshooting are updated.
- Command reference is synchronized.
- nika-erp style fixture proves visible placeholders are removed.
