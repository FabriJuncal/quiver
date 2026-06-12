## Title

QUIVER-55-04 - Interactive Analyze Project Apply UX

## Summary

Implements the fourth v55 slice for `ai analyze-project`: plain TTY `--apply-docs` now shows an explained selector after provider validation instead of forcing users into a large editor buffer.

The selector supports:

- Apply documentation.
- View bounded diff, then choose again.
- Save proposal artifacts only.
- Edit proposal through the existing review flow.
- Cancel without final docs writes.

## PR Policy

- One slice, one commit, one PR.
- Runtime UX change, so this must be an individual PR.
- Human merge required after CI passes.

## Scope

Included:

- Interactive selector module for `--apply-docs`.
- Safe routing from selector actions into existing save/apply/review flows.
- Dynamic recommendation based on clean creates vs dirty/update targets.
- Bounded terminal diff with full diff artifact saved under `.quiver/runs`.
- English and Spanish selector copy with option descriptions.
- Tests for apply, save, edit, cancel, view-diff second decision, no-TTY guard, and selector recommendation.
- Slice status, evidence, and closure updates.

Excluded:

- `ai analyze-project apply --run <run-id>`.
- Release smoke docs.
- Product repo code changes.

## Files

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-interactive.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/ai-analyze-project-review.test.js`
- `tests/lib/cli-ux.test.js`
- `specs/quiver-v55-analyze-project-doc-apply-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node/npm environment for this repo.
- No live provider credentials required for automated tests.

### Worktree Access

```bash
git checkout feature/QUIVER-55-04-v55-interactive-apply-ux
```

### Run the Project

No dev server is required. This is CLI behavior.

### Use Cases

1. Interactive apply selector:

```bash
node --test tests/commands/ai-analyze-project-review.test.js
```

Expected: selector paths for apply, save, edit, cancel, view diff, no-TTY, and Spanish copy pass.

2. UX helper behavior:

```bash
node --test tests/lib/cli-ux.test.js
```

Expected: selector recommendations and bounded diff formatting pass.

3. Contract regressions:

```bash
node --test tests/commands/ai-analyze-project.test.js
node --test tests/commands/cli-contract.test.js
node --test tests/commands/ux-flags.test.js
node --test tests/lib/i18n-catalog.test.js
```

Expected: CLI contracts, help, UX flags, and i18n catalog remain valid.

### Technical Verification

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/ai-analyze-project-validation.test.js tests/lib/ai/analyze-project-repair.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
npm test
```

Expected: all pass.

## Evidence

Executed locally:

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

## Rollback

Revert this PR. `--apply-docs --yes`, `--save-proposal`, and `--review` remain available from earlier slices if this selector UX must be removed.

## Risks / Notes

- `--apply-docs` without `--yes` now runs the provider in interactive TTY mode before showing the selector.
- no-TTY and CI usage still require `--yes`; otherwise the command fails before provider execution.
- `apply --run <run-id>` remains intentionally deferred to slice-05.
