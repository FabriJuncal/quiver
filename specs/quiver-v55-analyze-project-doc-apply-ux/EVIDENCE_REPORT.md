# Evidence Report - Quiver v55 Analyze Project Doc Apply UX

**Status:** In progress
**Last updated:** 2026-06-12

## Evidence Behind The Requirement

- Live `nika-erp` run with `create-quiver@0.17.2` completed successfully and generated valid doc update proposals.
- The normal provider command did not write final docs, by design.
- Existing `docs/CONTEXTO.md` in `nika-erp` still contained placeholders because no apply/review flow was completed.
- `--review` is safe but confusing because it opens a large JSON proposal in an editor.
- Users need a simpler flow: summary, explained options, optional diff, save, apply, edit, or cancel.

## Evidence To Capture During Implementation

- Parser/flag tests for `--apply-docs`, `--save-proposal`, `--diff`, `--yes`, `--allow-dirty-docs`, and `ai analyze-project apply --run`. Captured in `slice-01`.
- Proposal artifact schema tests. Captured in `slice-01`.
- Save proposal command tests in TTY/no-TTY and JSON modes.
- Non-interactive apply tests with snapshots, write manifests, and post-write validation.
- Dirty/stale doc preflight tests.
- Interactive selector tests for apply, diff, save, edit, and cancel.
- Saved proposal apply tests without provider execution.
- EN/ES i18n tests.
- Docs/checks and package smoke before release.

## Required Validation Before Closing Spec

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/commands/ai-analyze-project.test.js
node --test tests/lib/ai-analyze-project-validation.test.js
node --test tests/lib/ai/analyze-project-repair.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Release Smoke Evidence

Use a temporary copy or disposable branch of `nika-erp`:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project --deep --save-proposal --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project --deep --apply-docs --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project --deep --apply-docs --yes --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project apply --run <run-id>
```

Live provider smoke is release evidence only and must not become a CI gate.

## Slice-01 Evidence

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

Result: all passed.
