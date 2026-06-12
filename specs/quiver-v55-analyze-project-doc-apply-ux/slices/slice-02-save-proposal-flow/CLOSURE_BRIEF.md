# CLOSURE_BRIEF - slice-02 save proposal flow

## Summary

Implemented `--save-proposal` for `ai analyze-project`.

The command now runs the existing provider analysis path, validates and repairs provider JSON through the current schema gates, builds a normalized documentation proposal, and persists proposal artifacts under `.quiver/runs/<run-id>/proposal/` without writing final docs or creating snapshots.

Saved artifacts include:

- `analyze-project-doc-proposal.json`
- `analyze-project-doc-proposal.md`
- `analyze-project-doc-proposal.diff`
- `manifest.json`

`--save-proposal --json` emits clean parseable JSON for automation.

## Required Evidence

- Save proposal command test passes.
- JSON output test passes.
- No-final-doc write test passes.
- Invalid provider JSON creates no usable proposal artifacts.
- Proposal Markdown summary stays compact and omits full doc contents.

## Validation

Executed:

```bash
node --test tests/lib/ai-analyze-project-proposal.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/commands/ai-analyze-project.test.js tests/commands/cli-contract.test.js tests/commands/ux-flags.test.js
node --test tests/commands/ai-analyze-project-review.test.js tests/lib/ai-analyze-project-validation.test.js tests/lib/ai-analyze-project-docs.test.js
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

Result: all passed.
