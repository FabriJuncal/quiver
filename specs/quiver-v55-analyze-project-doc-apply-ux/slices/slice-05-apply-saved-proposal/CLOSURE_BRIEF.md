# CLOSURE_BRIEF - slice-05 apply saved proposal

## Summary

Completed. `ai analyze-project apply --run <run-id>` now loads a saved analyze-project doc proposal from `.quiver/runs/<run-id>/proposal/`, revalidates the manifest and proposal JSON, and applies it through the same safe apply engine without executing a provider or requiring provider/model flags.

## Behavior Delivered

- Explicit run ids are validated as safe single path segments before artifact access.
- Missing or invalid saved proposal manifests fail before docs writes.
- Saved proposal JSON is reparsed through the doc proposal schema and allowed-path checks.
- Saved proposal manifest doc paths must match the proposal target docs.
- Manual proposal content edits are accepted only after revalidation and recorded as `saved-proposal-edited` in the write manifest.
- Dirty target docs block by default and can be applied only with `--allow-dirty-docs`.
- Stale target docs block before any final docs write.
- `--run latest` is resolved only in an interactive terminal, and is rejected with `--yes` or `--json`.
- Apply-run reports set `provider_execution: skipped` and do not call provider/model resolution.

## Required Evidence

- Apply saved run success test passes.
- Invalid run id test passes.
- Stale/dirty blocking tests pass.
- No-provider-execution test passes.
- Manual proposal edit audit test passes.

## Validation

Executed:

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/lib/ai-analyze-project-proposal.test.js
node --test tests/commands/ai-analyze-project.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
npm test
```

Result: all passed. Full `npm test` passed with 747 tests.
