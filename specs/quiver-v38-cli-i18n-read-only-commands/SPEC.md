# Quiver v38 - CLI i18n Read-only Commands

**Date:** 2026-05-28
**Status:** Planned
**Source:** Continuation of the approved CLI i18n program.

## Problem

Read-only commands are the safest first migration after the i18n foundation because they have broad user visibility and low write risk.

## Objective

Migrate Quiver read-only human output to `en` and `es` while preserving JSON contracts and command snippets.

## Scope

### Included

- `version`, `--version`, `--help`.
- `dashboard`, `flow`, `doctor`, `next`, `graph`, `plan`.
- `ai inspect`, `ai export`, `ai specs list`, `ai slices list`, `ai trace report`, and `ai approvals`.
- Human mode, no-TTY/CI, `--no-color`, and supported `--json` modes.

### Excluded

- Commands that write files or call providers; those are covered by later specs.
- Generated project documentation.

## Acceptance Criteria

1. All included read-only human outputs render in `en` and `es`.
2. Configured project language is used without requiring `--lang`.
3. `--lang` and `QUIVER_LANG` overrides work for all included commands.
4. `--json` output remains parseable and schema-stable.
5. Suggested commands, flags, ids, paths, provider names, and model ids remain untranslated.
6. Tests cover both languages for representative normal, empty, warning, and error states.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Read-only foundation | completed | none |
| slice-01 | Version, dashboard, and help | planned | v37 complete |
| slice-02 | Flow, doctor, next, graph, and plan | planned | slice-01 |
| slice-03 | AI inspection and export read-only commands | planned | slice-01 |
| slice-04 | Read-only tests and smokes | planned | slice-02, slice-03 |

## Guardrails

- Do not localize JSON field names or stable codes.
- Avoid duplicating catalog keys when one domain key is enough.
- Keep compact dashboard layout readable in both languages.
