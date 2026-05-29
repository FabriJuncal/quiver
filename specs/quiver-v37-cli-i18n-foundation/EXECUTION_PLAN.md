# Execution Plan - Quiver v37 CLI i18n Foundation

## Execution Rules

- Do not implement runtime code without an approved slice.
- Preserve stable JSON output.
- Keep command names, flags, ids, paths, provider names, and model ids untranslated.
- Add tests for `en` and `es` for every public human output touched by this spec.

## Suggested Order

1. `slice-00-foundation-and-program-roadmap`
2. `slice-01-language-resolution-contract`
3. `slice-02-message-catalog-interpolation`
4. `slice-03-config-language-command`
5. `slice-04-parser-help-error-foundation`
6. `slice-05-foundation-docs-tests-package-readiness`

## Parallelization Guidance

- `slice-01` must complete before runtime i18n work.
- `slice-02` must complete before commands are migrated to catalogs.
- `slice-03` and `slice-04` can run in parallel only after `slice-02` if ownership is split by files.
- `slice-05` runs last.

## Final Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v37-cli-i18n-foundation --strict
npm run package:quiver
npm run smoke:create-quiver
```
