# EXECUTION_BRIEF - slice-06 i18n docs release smoke

## Context

The feature is only useful if users can discover the simpler apply flow and understand it in English and Spanish. Release confidence also needs a documented real-project smoke that avoids mutating the user's main `nika-erp` checkout.

## Objective

Complete i18n coverage, user documentation, command matrix/help alignment, and release smoke guidance.

## Scope

- Add/verify EN and ES messages for all new flows.
- Ensure commands, flags, and paths remain untranslated.
- Update:
  - `docs/reference/commands.md`;
  - `docs/CLI_UX_GUIDE.md`;
  - `docs/workflows/existing-project.md`;
  - `docs/TROUBLESHOOTING.md`.
- Update i18n/UX command matrix if applicable.
- Document release smoke against temporary copy/disposable branch of `nika-erp`.
- Validate docs and spec.

## Acceptance Criteria

- English and Spanish outputs are covered by tests.
- Command docs explain `--apply-docs`, `--save-proposal`, `--review`, `--yes`, `--diff`, and `apply --run`.
- Troubleshooting explains why normal provider mode does not write final docs.
- Release smoke commands avoid modifying the main `nika-erp` checkout.
- Docs checks and spec validation pass.

## Expected Files To Modify

- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `docs/workflows/existing-project.md`
- `docs/TROUBLESHOOTING.md`
- `specs/quiver-v55-analyze-project-doc-apply-ux/**`
- relevant tests

## Validation Required

```bash
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Completion Checklist

- English and Spanish copy tests pass.
- Command reference and troubleshooting docs updated.
- Existing-project workflow documents recommended path.
- Release smoke evidence is recorded without mutating the main `nika-erp` checkout.
- Slice closure brief updated with evidence.

## Constraints

- Do not run live provider smoke as CI.
- Do not mutate the main `nika-erp` checkout during smoke.
- Do not translate commands, flags, or paths.
