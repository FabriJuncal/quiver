# Evidence Report - Quiver v42 CLI i18n Generated Docs

## slice-00-generated-docs-foundation

- Created this spec package and slice handoffs.
- Runtime implementation intentionally not started.

## slice-01-template-language-routing

- Added `src/create-quiver/lib/i18n/templates.js` as a pure routing layer for generated human templates.
- Reused v37 language resolution precedence through `resolveLanguage`.
- Defined localized template convention: base template is fallback `en`; non-default variants add the language before `.template`, for example `docs/INDEX.md.es.template`.
- Explicitly excludes machine artifacts such as `package.template.json` and `slice.json` from human template routing.
- Added coverage helpers so missing localized human templates can be reported while runtime fallback remains deterministic.
- Documented the convention in `docs/CLI_UX_GUIDE.md`.

Validation:

- PASS `node --test tests/lib/i18n-templates.test.js`
- PASS `git diff --check`

## Pending Evidence

- `node --test tests/**/*.test.js`
- `git diff --check`
- `npx create-quiver spec validate specs/quiver-v42-cli-i18n-generated-docs --strict`
- `npm run package:quiver`
- `npm run smoke:create-quiver`
