# Quiver v49 - Parser Modernization

**Date:** 2026-05-31
**Status:** Completed
**Source:** User-approved acceptance criteria and production-readiness review derived from `CLI_ANALYSIS.md`.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver's CLI parser is hand-written inside `src/create-quiver/index.js`. It mixes root command detection, global flags, command-specific flags, help text, aliases, and positional validation. This creates regression risk and causes global help to advertise flags that only apply to specific commands.

## Objective

Modernize parser behavior safely:

- Inventory command/flag ownership.
- Capture golden parser behavior before migration.
- Decide whether to adopt Commander.js/yargs or an internal declarative registry.
- Migrate incrementally through an adapter without breaking existing invocations.
- Improve help and shell-readiness after behavior is locked.

## Scope

### Included

- Command/flag registry inventory.
- Golden tests for current parser behavior.
- Library-vs-internal decision record.
- Incremental parser adapter.
- Help scoping improvements.
- Compatibility for aliases, `--lang`, `--version`, `-V`, `--`, and positional arguments.

### Excluded

- Removing legacy commands.
- Changing command semantics.
- Shell completion generation unless enabled by the chosen parser path and explicitly planned.
- AI module splitting; covered by v48.

## Approved Acceptance Criteria

1. Every public command has an explicit command/flag ownership entry.
2. Global flags are distinguished from command-scoped flags.
3. Golden tests cover `--lang` before and after commands, `--version`, `-V`, `--`, aliases, missing values, unknown flags, and positional errors.
4. A decision record selects Commander.js, yargs, or internal declarative parser with rationale.
5. The selected migration path preserves existing command invocations and exit behavior.
6. Help output no longer presents command-scoped flags as globally applicable unless clearly annotated.
7. JSON-safe error behavior remains stable.
8. Package-installed smoke validates parser behavior for `create-quiver` and `quiver`.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Parser modernization foundation | completed | none |
| slice-01 | Command flag registry inventory | completed | slice-00 |
| slice-02 | Parser golden contract suite | completed | slice-01 |
| slice-03 | Parser library decision | completed | slice-02 |
| slice-04 | Parser adapter incremental migration | completed | slice-03 |
| slice-05 | Help and shell readiness | completed | slice-04 |
| slice-06 | Docs, tests, and release readiness | completed | slice-04, slice-05 |

## Guardrails

- Do not change command semantics during inventory and golden-test slices.
- Do not migrate parser without a decision record.
- Preserve all compatibility aliases.
- Keep `--version` semver-only.
- Keep `--lang` accepted before and after command names.

## Parser Inventory

The v49 command/flag ownership inventory lives in `command-flag-registry.md`.
Parser golden tests, parser strategy selection, adapter migration, and help scoping must use that file as the baseline before changing runtime behavior.

## Parser Strategy

The approved parser strategy is documented in `parser-decision.md`: use an internal declarative command registry with a compatibility adapter. v49 must not add Commander.js or yargs.

## Parser Modernization Constraints

These constraints are binding for all v49 implementation slices.

### Compatibility Targets

- Preserve top-level `--version` and `-V` as semver-only output with no localized prose.
- Preserve `version` command behavior, including human output and `version --json`.
- Preserve global `--lang` before and after command names, including `--lang=<value>` forms.
- Preserve `--json` stdout cleanliness for all JSON-capable commands and failures.
- Preserve `--` separator behavior for `evidence run -- <command>` and any current command passthrough semantics.
- Preserve positional argument validation and current error timing for missing values, unknown flags, unsupported subcommands, and extra positional arguments.
- Preserve all compatibility aliases established before v49, including v46 slice/handoff aliases, v47 `demo spec-viewer`, and v48 AI aliases.
- Preserve stderr-only human-mode deprecation warnings and suppress them for JSON/machine-readable flows.

### Parser Ownership Boundaries

- `src/create-quiver/index.js` currently owns root mode detection, global flag extraction, manual flag parsing, positional validation, help rendering, compatibility warnings, and final command dispatch.
- `src/create-quiver/lib/cli/ux-flags.js` currently owns UX flag support validation after parsing.
- v49 may introduce `src/create-quiver/lib/cli/parser.js` and `src/create-quiver/lib/cli/command-registry.js`, but only after inventory, golden tests, and parser decision are complete.
- Runtime parser migration must be incremental and reversible behind an adapter; the previous manual parser behavior must remain covered by golden tests.

### Required Golden Coverage Before Migration

- `--lang` before command, after command, and as `--lang=<value>`.
- `--version`, `-V`, and `version --json`.
- `--` separator handling.
- Compatibility aliases and deprecation-warning stdout/stderr behavior.
- Missing values for global and command-scoped flags.
- Unknown flags.
- Unsupported subcommands.
- Extra positional arguments.
- JSON-safe error paths.

### Decision Constraints

- Do not choose Commander.js, yargs, or an internal declarative parser before `slice-03`.
- The decision record must compare dependency/bundle impact, help rendering, alias support, i18n behavior, JSON-safe errors, `--` handling, package smoke impact, and migration reversibility.
- If an external dependency is selected, `package.json` and lockfile changes belong only to the migration slice, not the decision slice.

### Out Of Bounds For v49

- Removing legacy commands or aliases.
- Changing provider behavior.
- Changing command semantics for UX flags.
- Generating shell completion unless the selected path supports it and `slice-05` explicitly documents implementation.
- Reworking AI command modules; that was completed in v48.
