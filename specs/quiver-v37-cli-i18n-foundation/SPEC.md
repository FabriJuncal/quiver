# Quiver v37 - CLI i18n Foundation

**Date:** 2026-05-28
**Status:** Completed
**Source:** User-approved requirement for Spanish and English CLI output, hardened for production before implementation.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver currently exposes human CLI messages in a single language. Users should not need to remember language flags after configuring a project, and automation must keep stable JSON contracts while human output can be localized.

## Objective

Create the foundation for Spanish (`es`) and English (`en`) output across Quiver commands:

- A single language resolution contract.
- Project and global language persistence.
- A message catalog with interpolation, pluralization, fallback, and missing-key detection.
- Localized help, parser errors, and early command errors before command dispatch.
- A stable rule that JSON output remains machine-readable and not localized.

## Scope

### Included

- Supported languages: `en`, `es`.
- Global `--lang <en|es>` flag that works before and after command names.
- `QUIVER_LANG` environment override.
- Project config `.quiver/config.json`.
- Global config `~/.quiver/config.json` resolved with `os.homedir()`.
- Locale detection from `LC_ALL`, `LC_MESSAGES`, `LANG`, `LANGUAGE`, and `Intl.DateTimeFormat().resolvedOptions().locale`.
- Fallback to `en`.
- `config language show`, `config language set es`, and `config language set en`.
- Catalog versioning, interpolation, pluralization, fallback, and test coverage.
- Parser/help/error localization foundation.

### Excluded

- Migrating every existing command in this spec.
- Localizing JSON keys, error codes, schema fields, or command identifiers.
- Translating commands, flags, file paths, provider names, model ids, run ids, spec ids, slice ids, or suggested command snippets.
- Generated project documentation; that is covered by v42.

## Approved Acceptance Criteria

1. `init --interactive` can store the selected language in `.quiver/config.json`.
2. After project language is configured, normal commands use that language without requiring `--lang`.
3. `--lang` overrides every other source and works before or after the command.
4. `QUIVER_LANG` overrides project/global config when `--lang` is absent.
5. Project config overrides global config.
6. Global config lives at `~/.quiver/config.json` using `os.homedir()`.
7. Locale detection normalizes `es_AR`, `es-AR`, `en_US`, and `en-US`.
8. Unsupported or missing language falls back to `en` with an actionable warning in human mode.
9. `--json` output remains stable and parseable; JSON keys and codes are not localized.
10. Localized text keeps suggested commands and flags exact.
11. Catalog misses fail tests before release.
12. New commands after v37 must use i18n or declare a temporary documented exception.

## Approved Technical Plan

1. Create this SDD package and handoffs without runtime implementation.
2. Add language resolution and persistence helpers.
3. Add message catalogs and safe translation helpers.
4. Add `config language` commands.
5. Route help, parser errors, and early command errors through the i18n layer.
6. Add docs, tests, and package readiness for the foundation.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Foundation and program roadmap | completed | none |
| slice-01 | Language resolution contract | completed | slice-00 |
| slice-02 | Message catalog and interpolation | completed | slice-01 |
| slice-03 | Config language command | completed | slice-01, slice-02 |
| slice-04 | Parser, help, and early error foundation | completed | slice-01, slice-02 |
| slice-05 | Foundation docs, tests, and package readiness | completed | slice-02, slice-03, slice-04 |

## Risks and Guardrails

- Do not localize JSON contracts.
- Do not mix Spanish and English in the same human command unless the untranslated fragment is a literal command, flag, path, id, provider, or model.
- Do not hardcode output strings in later command work when a catalog key should exist.
- Keep no-TTY and CI behavior deterministic; no prompts unless `--interactive` was requested.
- Keep fallback behavior explicit and testable.

## Assumptions

- This repository's canonical spec location is `specs/quiver-vNN-*`.
- The first implementation slice should start with a minimal reusable foundation before command migration.
