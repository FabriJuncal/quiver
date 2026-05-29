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

## slice-02-init-docs-and-i18n-assets

- Routed `init` generated human templates through the v42 template language resolver.
- Added Spanish template variants for default init human docs and AGENTS onboarding guidance.
- Kept machine artifacts such as `package.template.json`, package scripts, and `slice.json` outside localization routing.
- Made `--lang` configure generated docs and persisted project language, while existing project config remains the default when `--lang` is absent.
- Preserved overwrite behavior for existing docs and config keys.

Validation:

- PASS `node --test tests/commands/init-profiles.test.js tests/lib/init-docs.test.js tests/lib/i18n-templates.test.js`
- PASS `node --test tests/commands/demo.test.js`

## slice-03-docs-reference-guides

- Documented generated human docs language behavior in `docs/reference/commands.md`.
- Clarified in `docs/CLI_UX_GUIDE.md` that CLI output, generated human docs, and machine artifacts are separate surfaces.
- Added getting-started guidance for using `--lang es init` and `config language set es`.
- Explicitly documented that JSON, JSONL, package metadata, `slice.json`, commands, flags, routes, providers, and models are not localized.

Validation:

- PASS `git diff --check`
- PASS `node bin/create-quiver.js spec validate specs/quiver-v42-cli-i18n-generated-docs --strict`

## slice-04-generated-docs-tests-smokes

- Full test suite passed: 608 tests, 0 failures.
- `npm run package:quiver` passed and produced a package smoke result for `create-quiver-0.15.3.tgz`.
- `npm run smoke:create-quiver` passed.
- Manual temporary project smoke generated `en` and `es` projects with `--full --skip-install`.
- Manual smoke confirmed `docs/INDEX.md` routes to English and Spanish human docs.
- Manual smoke confirmed stable machine artifacts by comparing `package.json` and `specs/lang-demo/slices/slice-template/slice.json` across `en` and `es`.
- Manual smoke confirmed `.quiver/config.json` stores the intended project language per project.

Validation:

- PASS `node --test tests/**/*.test.js`
- PASS `npm run package:quiver`
- PASS `npm run smoke:create-quiver`
- PASS manual generated-doc language smoke for `--lang en` and `--lang es`
- PASS `node bin/create-quiver.js spec validate specs/quiver-v42-cli-i18n-generated-docs --strict`
- PASS `git diff --check`
