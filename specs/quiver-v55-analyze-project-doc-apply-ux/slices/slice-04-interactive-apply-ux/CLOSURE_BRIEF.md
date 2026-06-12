# CLOSURE_BRIEF - slice-04 interactive apply UX

## Summary

Completed. Plain TTY `ai analyze-project --deep --apply-docs` now runs the provider, builds the validated proposal, and shows an explained selector instead of forcing a large editor buffer. The selector routes apply/save/edit/cancel/view-diff actions through the existing safe proposal, review, and apply flows.

## Behavior Delivered

- TTY `--apply-docs` shows compact summary, proposed files, changed/dirty counts, selected context artifact, and option descriptions.
- Dynamic recommendation puts `Apply documentation` first for clean creates and `View diff` first for dirty/update targets.
- `View diff` saves the full diff artifact, prints only a bounded terminal preview, and requires a second decision.
- `Save proposal` writes `.quiver/runs/<run-id>/proposal/*` artifacts only.
- `Edit proposal` reuses the existing review/editor/confirmation flow.
- `Cancel` writes no final docs and records `apply-canceled` status.
- no-TTY or CI `--apply-docs` without `--yes` fails before provider execution with actionable guidance.
- English and Spanish selector copy are covered.

## Required Evidence

- Apply option test passes.
- Diff option test passes.
- Save option test passes.
- Edit option test passes.
- Cancel option test passes.
- no-TTY error test passes.

## Validation

Executed:

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/lib/cli-ux.test.js
node --test tests/commands/ai-analyze-project.test.js
node --test tests/commands/cli-contract.test.js
node --test tests/lib/i18n-catalog.test.js
node --test tests/commands/ux-flags.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/ai-analyze-project-validation.test.js tests/lib/ai/analyze-project-repair.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
npm test
```

Result: all passed. Full `npm test` passed with 741 tests.
