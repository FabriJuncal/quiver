# CLOSURE_BRIEF - slice-01 CLI proposal contract

## Summary

Completed. The CLI contract now recognizes the v55 doc-apply flags and `ai analyze-project apply --run <run-id>` without implementing the later save/apply flows.

Implemented:

- Parser support for `--apply-docs`, `--save-proposal`, `--diff`, and `--allow-dirty-docs`.
- Parser support for `ai analyze-project apply --run <run-id>`.
- Pre-provider contract failures for invalid flag combinations.
- Runtime contract guards that prevent provider execution for future save/apply flows until later slices implement them.
- Proposal/write manifest schema helpers in `analyze-project-proposal.js`.
- Help/reference documentation for the new command surface.
- Regression coverage for existing `--review` UX support.

## Required Evidence

- Parser/flag tests pass.
- Invalid combination tests pass before provider execution.
- Proposal manifest schema tests pass.
- Existing `--review` tests still pass.
- Docs and slice schema checks pass.

## Validation

Executed:

```bash
node --test tests/lib/ai-analyze-project-proposal.test.js
node --test tests/commands/ai-analyze-project.test.js
node --test tests/commands/cli-contract.test.js
node --test tests/commands/parser-contract.test.js
node --test tests/commands/ux-flags.test.js
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/ai-analyze-project-docs.test.js tests/lib/ai-analyze-project-validation.test.js
npm run docs:check
npm run schema:slice:check
```

Pending final gate after metadata close:

```bash
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```
