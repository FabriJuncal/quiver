# Evidence Report - Quiver v49 Parser Modernization

## Planning Evidence

- Source analysis: `CLI_ANALYSIS.md`.
- Repository inspection confirmed parser and global help live primarily in `src/create-quiver/index.js`.

## Validation Evidence

- `slice-00-parser-modernization-foundation` documented parser compatibility targets for `--lang`, `--version`, `-V`, `--`, JSON-safe output, positional validation, unknown flags, aliases, and deprecation warning behavior.
- Parser ownership boundaries recorded for `src/create-quiver/index.js` and `src/create-quiver/lib/cli/ux-flags.js`.
- Required golden coverage recorded before any migration slice may run.
- Decision constraints recorded: no Commander.js/yargs/internal-parser decision before `slice-03`; no dependency changes before migration.
- Out-of-bounds scope recorded: no alias removal, provider behavior changes, UX flag semantic changes, shell completion promises, or AI module rework.
- No runtime code was modified for this foundation slice.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v49-parser-modernization`: passed.

## slice-02-parser-golden-contract-suite

- Created `tests/commands/parser-contract.test.js`.
- Golden coverage includes root `--version` and `-V`, `--lang` before/after/inline forms, JSON-safe early errors, missing values, invalid values, positional validation, `--` separator passthrough for `evidence run`, deprecated alias warnings, JSON deprecation suppression, compatibility aliases without deprecation, collection default behavior, registered parser ambiguities, and command-scoped flag rejection.
- Runtime parser code was not modified.
- `node --test tests/commands/parser-contract.test.js`: passed.
- `node --test tests/commands/cli-contract.test.js`: passed.
- `git diff --check`: passed.

## slice-03-parser-library-decision

- Created `specs/quiver-v49-parser-modernization/parser-decision.md`.
- Compared Commander.js, yargs, and an internal declarative parser across dependency/package impact, migration reversibility, help scoping, alias compatibility, i18n, JSON-safe errors, `--` behavior, and golden-test alignment.
- Chosen path: internal declarative command registry with compatibility adapter.
- Rejected Commander.js and yargs for v49 because they would require heavy compatibility wrapping and increase dependency/package risk.
- No runtime parser code was modified.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v49-parser-modernization`: passed.

## slice-04-parser-adapter-incremental-migration

- Added `src/create-quiver/lib/cli/command-registry.js`.
- Added `src/create-quiver/lib/cli/parser.js`.
- Updated `src/create-quiver/index.js` to read command support sets from the registry and parse through the live adapter.
- The adapter delegates to the legacy parser during v49 migration to preserve current args shape, error timing, aliases, i18n behavior, JSON-safe errors, and `--` passthrough.
- No external parser dependency was added; `package.json` and lockfile were not changed for parser dependencies.
- `node --test tests/commands/parser-contract.test.js`: passed.
- `node --test tests/commands/cli-contract.test.js`: passed.
- `node --test`: passed, 665 tests.
- `git diff --check`: passed.
- `bash scripts/ci/smoke-create-quiver.sh`: passed, including packaged install and both binary aliases.

## slice-05-help-and-shell-readiness

- Added `HELP_OPTION_SCOPES` metadata to `src/create-quiver/lib/cli/command-registry.js`.
- Updated global help rendering to append `[scope: ...]` ownership annotations for listed options.
- Updated `docs/reference/commands.md` to explain scoped options and state that v49 does not generate shell completions.
- Added help contract assertions for scoped option annotations.
- `node --test tests/commands/cli-contract.test.js`: passed.
- `node --test tests/commands/parser-contract.test.js`: passed.
- `git diff --check`: passed.

## slice-06-docs-tests-release-readiness

- Updated `README_FOR_AI.md` with v49 parser registry/adapter, scoped help, and shell-completion guidance.
- Updated `docs/CLI_UX_GUIDE.md` with help scope, parser compatibility, `--lang`, `--version`, `--`, and shell-readiness rules.
- Confirmed `docs/reference/commands.md` documents scoped help and no shell completion support in v49.
- `node --test`: passed, 665 tests.
- `npm run package:quiver`: passed, `Package smoke passed: create-quiver-0.15.4.tgz`.
- `bash scripts/ci/smoke-create-quiver.sh`: passed, `create-quiver smoke test passed`.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v49-parser-modernization`: passed.

## slice-01-command-flag-registry-inventory

- Created `specs/quiver-v49-parser-modernization/command-flag-registry.md`.
- Inventory sources recorded: `src/create-quiver/index.js`, `src/create-quiver/lib/cli/ux-flags.js`, `src/create-quiver/commands/slice.js`, `src/create-quiver/commands/handoff.js`, `docs/reference/commands.md`, and `tests/commands/cli-contract.test.js`.
- Every documented public command and compatibility alias has an inventory entry.
- Global/cross-cutting flags are separated from command-scoped flags.
- Positional behavior and `--` separator behavior are documented.
- Current parser ambiguities are documented for golden-test coverage before migration.
- No runtime code was modified for this inventory slice.
- `git diff --check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v49-parser-modernization`: passed.
