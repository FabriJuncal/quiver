# Evidence Report - Quiver v37 CLI i18n Foundation

## slice-00-foundation-and-program-roadmap

- Created this spec package and all slice handoffs.
- Runtime implementation intentionally not started.

## slice-01-language-resolution-contract

- Implemented `src/create-quiver/lib/i18n/language.js`.
- Wired global `--lang <en|es>` extraction before command dispatch in `src/create-quiver/index.js`.
- Added focused resolver/config/locale tests in `tests/lib/i18n-language.test.js`.
- Added CLI contract tests proving `--lang` works before and after commands without changing JSON output.
- Validation passed:
  - `node --test tests/lib/i18n-language.test.js`
  - `node --test tests/commands/cli-contract.test.js`
  - `node --test tests/**/*.test.js` (534 tests)
  - `node bin/create-quiver.js spec validate specs/quiver-v37-cli-i18n-foundation --strict`
  - `git diff --check`

## slice-02-message-catalog-interpolation

- Implemented `src/create-quiver/lib/i18n/catalog.js`.
- Added versioned catalogs:
  - `src/create-quiver/lib/i18n/messages/en.js`
  - `src/create-quiver/lib/i18n/messages/es.js`
- Added focused catalog tests in `tests/lib/i18n-catalog.test.js`.
- Validation passed:
  - `node --test tests/lib/i18n-catalog.test.js`

## slice-03-config-language-command

- Implemented `src/create-quiver/commands/config.js`.
- Wired `config language show` and `config language set <en|es>` into `src/create-quiver/index.js`.
- Added `--global` support for writing `~/.quiver/config.json`.
- Updated `docs/reference/commands.md`.
- Added `tests/commands/config-language.test.js`.
- Validation passed:
  - `node --test tests/commands/config-language.test.js`
  - `node --test tests/lib/i18n-catalog.test.js tests/lib/i18n-language.test.js tests/commands/cli-contract.test.js`
  - `node --test tests/**/*.test.js` (547 tests)
  - `node bin/create-quiver.js spec validate specs/quiver-v37-cli-i18n-foundation --strict`
  - `git diff --check`

## slice-04-parser-help-error-foundation

- Routed top-level help headings, command descriptions, language warnings, unsupported commands, unsupported flags, and missing flag values through the i18n catalog.
- Preserved literal command snippets, flags, ids, and JSON contracts.
- Added CLI contract coverage for:
  - `--lang es --help`
  - project-configured Spanish help without `--lang`
  - missing `--lang` value using `QUIVER_LANG=es`
  - unsupported flags in Spanish
  - unsupported commands in English and Spanish
- Validation passed:
  - `node --test tests/commands/cli-contract.test.js`
  - `node --test tests/lib/i18n-catalog.test.js tests/lib/i18n-language.test.js`
  - `node --test tests/commands/config-language.test.js`

## slice-05-foundation-docs-tests-package-readiness

- Updated `docs/CLI_UX_GUIDE.md` with language resolution precedence, JSON stability, and automation/no-TTY rules.
- Updated `docs/reference/commands.md` with `--lang`, `QUIVER_LANG`, project/global config precedence, and examples.
- Validation passed:
  - `node --test tests/**/*.test.js` (549 tests)
  - `git diff --check`
  - `npm run package:quiver`
  - `npm run smoke:create-quiver`
  - `node bin/create-quiver.js spec validate specs/quiver-v37-cli-i18n-foundation --strict`

## Pending Evidence

- None.
