# EXECUTION_BRIEF - slice-05 Docs, help, and generated guidance

## Context

Docs should reflect stabilized behavior, not anticipated behavior. This slice comes after dashboard and version command behavior is implemented.

## Objective

Update public and generated documentation for compact dashboard and version UX.

## Scope

- Help text and examples
- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`
- `README_FOR_AI.md`
- generated docs/templates as needed
- `docs/INDEX.md` package decision if touched

## Acceptance Criteria

- Help documents dashboard flags and `version`.
- Command reference documents compact default, details, sections, limit, and version JSON.
- CLI UX guide documents relevant color/no-color and read-only rules.
- Generated guidance stays npx-first and automation-safe.
- If root `docs/INDEX.md` is added, package contents are intentionally handled.

## Technical Plan Summary

Patch docs only after command behavior is stable. Keep docs concise and avoid duplicating long reference content in README-style files.

## Suggested Steps

1. Update help output.
2. Update command reference.
3. Update CLI UX guide if rules changed.
4. Update README_FOR_AI.md if workflow guidance changed.
5. Update generated docs/templates when needed.
6. Validate package-content decision for `docs/INDEX.md`.

## Restrictions

- Do not change dashboard or version implementation except help strings.
- Do not publish npm.

## Completion Checklist

- [ ] Help updated.
- [ ] Docs updated.
- [ ] Generated guidance tests pass.
