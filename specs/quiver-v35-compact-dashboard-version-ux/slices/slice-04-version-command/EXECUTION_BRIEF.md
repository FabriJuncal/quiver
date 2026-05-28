# EXECUTION_BRIEF - slice-04 Version command and banner

## Context

The user wants an Angular CLI-like branded version display, but Quiver's existing `--version` is automation-sensitive and must remain semver-only.

## Objective

Add `create-quiver version` and `version --json` without breaking existing `--version` behavior.

## Scope

- New version command routing
- Human banner and metadata formatter
- JSON metadata formatter
- Tests for color, no-color, CI/no-TTY, and semver preservation

## Acceptance Criteria

- `create-quiver version` renders a readable human report.
- `version --json` emits parseable JSON with `version_schema_version: 1`.
- `--version` and `-V` still output only semver.
- `quiver version` works through the same binary alias.
- No ANSI appears when color is disabled or in JSON.
- Version metadata is best-effort and uses no external process execution.

## Technical Plan Summary

Add a small version metadata module that reads local package/runtime information and renders through the existing Quiver theme helpers.

## Suggested Steps

1. Add version metadata collection from `process`, package data, env, package.json, and lockfiles.
2. Add human banner renderer with approved palette.
3. Add JSON renderer.
4. Route `version` command without touching top-level `--version`.
5. Add tests for binary contract and theme behavior.

## Restrictions

- Do not execute `npm`, `git`, or provider CLIs.
- Do not overload `--version`.
- Do not require initialized Quiver project files.

## Completion Checklist

- [ ] Version command implemented.
- [ ] JSON version output implemented.
- [ ] Semver-only contract preserved.
