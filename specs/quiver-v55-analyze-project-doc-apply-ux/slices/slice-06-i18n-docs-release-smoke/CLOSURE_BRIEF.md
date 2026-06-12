# CLOSURE_BRIEF - slice-06 i18n docs release smoke

## Summary

Completed. The final v55 slice updates the user-facing docs, command matrix, troubleshooting guidance, and EN/ES coverage so the completed analyze-project doc apply workflow is discoverable and safe to smoke before release.

## Behavior Delivered

- `docs/reference/commands.md` now describes the recommended `--save-proposal`, `--apply-docs`, and `apply --run <run-id>` flows.
- `docs/CLI_UX_GUIDE.md` documents the TTY selector, automation path, saved proposal path, and advanced `--review` mode.
- `docs/workflows/existing-project.md` now recommends `--apply-docs` for existing projects and explains save/apply separation.
- `docs/TROUBLESHOOTING.md` explains why normal provider mode does not write final docs and how to apply a proposal safely.
- Release smoke guidance uses a temporary copy of `nika-erp` and explicitly avoids mutating the main checkout.
- Spanish help coverage now asserts the new analyze-project flags are localized while commands, flags, and paths stay untranslated.

## Required Evidence

- i18n tests pass.
- docs checks pass.
- spec validation passes.
- release smoke guidance is documented.

## Validation

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
