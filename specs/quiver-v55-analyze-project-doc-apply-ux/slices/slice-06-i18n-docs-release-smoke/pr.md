## Title

QUIVER-55-06 - i18n Docs And Release Smoke Guidance

## Summary

Completes the final v55 slice for `ai analyze-project` doc apply UX.

This PR updates user-facing docs, troubleshooting, command reference, EN/ES help coverage, and release smoke guidance so users can discover the simple apply flow without being forced into the advanced editor review path.

## PR Policy

- One slice, one commit, one PR.
- Docs/test release-readiness slice.
- Human merge required after CI passes.

## Scope

Included:

- Command reference updates for `--apply-docs`, `--save-proposal`, `--review`, `--yes`, `--diff`, and `apply --run`.
- Existing-project workflow updates for the recommended `--apply-docs` path.
- CLI UX guide updates for selector behavior, automation, saved proposals, and advanced `--review`.
- Troubleshooting entry explaining why normal provider mode does not write final docs.
- Safe release smoke guidance against a temporary copy or disposable branch of `nika-erp`.
- Spanish help coverage for new analyze-project flags while preserving commands/flags untranslated.
- Spec status, evidence, and closure updates.

Excluded:

- Runtime apply implementation changes.
- Live provider CI gate.
- Mutating the main `nika-erp` checkout.

## Files

- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `docs/workflows/existing-project.md`
- `docs/TROUBLESHOOTING.md`
- `tests/commands/cli-contract.test.js`
- `specs/quiver-v55-analyze-project-doc-apply-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node/npm environment for this repo.
- No live provider credentials required.

### Worktree Access

```bash
git checkout feature/QUIVER-55-06-v55-i18n-docs-release-smoke
```

### Run the Project

No dev server is required. This is CLI/docs behavior.

### Use Cases

1. Spanish help preserves command syntax:

```bash
node --test tests/commands/cli-contract.test.js
```

Expected: `ai analyze-project apply --run <run-id>` and new flags remain exact while Spanish descriptions are localized.

2. i18n catalog coverage:

```bash
node --test tests/lib/i18n-catalog.test.js
```

Expected: EN/ES catalogs are complete and command snippets remain exact.

3. Analyze-project apply UX regression coverage:

```bash
node --test tests/commands/ai-analyze-project-review.test.js
```

Expected: apply/save/diff/edit/cancel, Spanish selector copy, and apply-run paths remain covered.

### Technical Verification

```bash
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

Expected: all pass.

## Evidence

Executed locally:

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

## Rollback

Revert this PR. Runtime behavior from slices 01-05 remains intact; only docs/spec/test coverage from this slice is removed.

## Risks / Notes

- Live provider smoke remains release evidence only, not a CI gate.
- Release smoke guidance intentionally uses a temporary copy or disposable branch for `nika-erp`.
- `--review` remains documented as advanced JSON edit mode, not the default apply path.
