# CLOSURE_BRIEF - slice-03 non-interactive apply engine

## Summary

Implemented. `ai analyze-project --deep --apply-docs --yes` now runs the provider, builds a validated doc proposal, saves proposal artifacts, blocks unsafe dirty/stale writes, creates a snapshot, writes only approved docs, saves a separate write manifest, runs post-write validation, and supports parseable JSON output.

The interactive `--apply-docs` selector and `apply --run` remain out of scope for later slices.

## Evidence

- Apply success test passes with proposal artifacts, snapshot, write manifest, written docs, and post-write validation.
- Dirty target docs block `--yes` unless `--allow-dirty-docs` is provided.
- Stale target hash preflight is covered at the apply engine boundary.
- Invalid provider doc proposals write no final docs and create no proposal artifacts.
- `--apply-docs --yes --json` emits a parseable complete result.
- Existing `--review` tests still pass unchanged.

## Validation

Executed:

```bash
node --test tests/lib/ai-analyze-project-apply.test.js
node --test tests/lib/ai-analyze-project-proposal.test.js
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/commands/ai-analyze-project.test.js tests/commands/cli-contract.test.js tests/commands/ux-flags.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/ai/analyze-project-repair.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
npm test
```

Result: all passed. Full `npm test` passed with 730 tests.
