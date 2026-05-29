# EXECUTION_BRIEF - slice-01 Version, dashboard, and help

## Context

These commands are highly visible and define the first impression of localized Quiver output.

## Objective

Localize `version`, `--version`, `--help`, and `dashboard` human output.

## Acceptance Criteria

- `version` and `dashboard` render in `en` and `es`.
- The Quiver banner uses approved Quiver tonalities where color is enabled.
- `dashboard --json` and `version --json` remain stable.
- Compact dashboard labels fit in Spanish and English without losing section readability.
- Suggested commands remain exact.

## Completion Checklist

- [x] Human output catalog keys added.
- [x] `en` and `es` command tests added.
- [x] JSON regression tests preserved.
