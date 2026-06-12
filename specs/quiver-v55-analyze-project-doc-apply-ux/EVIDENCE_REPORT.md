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

## Slice-02 Evidence - slice-02-save-proposal-flow

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

Covered behavior:

- `--save-proposal` persists proposal JSON, compact Markdown summary, full diff, and manifest.
- `--save-proposal --json` emits clean parseable JSON.
- Final docs remain unchanged.
- Save-only flows do not create snapshots.
- Invalid final provider JSON does not create usable proposal artifacts.

## Slice-03 Evidence - slice-03-noninteractive-apply-engine

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

Covered behavior:

- `--apply-docs --yes` applies validated allowed docs.
- `--apply-docs --yes --json` returns run id, proposal artifacts, write plan, snapshot, written docs, post-write validation, and write manifest.
- Dirty target docs block `--yes` unless `--allow-dirty-docs` is provided.
- Stale target docs are blocked at the apply engine boundary.
- Invalid provider doc proposals do not write final docs.
- Existing `--review` behavior remains covered.

## Slice-04 Evidence - slice-04-interactive-apply-ux

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

Covered behavior:

- TTY `--apply-docs` shows an explained selector after provider validation.
- Clean creates recommend `apply`; dirty/update targets recommend `view-diff`.
- no-TTY `--apply-docs` without `--yes` fails before provider execution.
- Cancel writes no final docs and records `apply-canceled`.
- Save proposal writes proposal artifacts only.
- View diff saves the full diff artifact, prints a bounded preview, and requires a second decision.
- Edit proposal reuses the existing review/editor confirmation flow.
- English and Spanish selector copy are covered.

## Slice-05 Evidence - slice-05-apply-saved-proposal

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

Covered behavior:

- `ai analyze-project apply --run <run-id>` applies a saved proposal without executing provider/model resolution.
- Saved proposal manifests and proposal JSON are revalidated before write.
- Missing or unsafe saved artifacts fail before final docs writes.
- Dirty target docs block by default and can be applied only with `--allow-dirty-docs`.
- Stale target docs block before any final docs write.
- Manual proposal edits are accepted after revalidation and recorded in the write manifest.
- `--run latest --yes` and `--run latest --json` are rejected to keep automation deterministic.

## Slice-06 Evidence - slice-06-i18n-docs-release-smoke

Executed:

```bash
node --test tests/commands/cli-contract.test.js
node --test tests/lib/i18n-catalog.test.js
node --test tests/commands/ai-analyze-project-review.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
npm test
```

Result: all passed. Full `npm test` passed with 747 tests.

Covered behavior:

- English and Spanish help coverage includes the new analyze-project doc-apply flags.
- Commands, flags, providers, models, and paths remain untranslated in localized output.
- Command reference explains `--apply-docs`, `--save-proposal`, `--review`, `--yes`, `--diff`, and `apply --run`.
- Existing-project workflow documents the recommended `--apply-docs` path and save/apply separation.
- Troubleshooting explains why normal provider mode does not write final docs.
- Release smoke guidance uses a temporary copy or disposable branch of `nika-erp`, not the main checkout.
