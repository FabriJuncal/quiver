# EXECUTION BRIEF - slice-01: CLI contract and compatibility

## Context

Every later AI lifecycle feature depends on a clear command surface. This slice stabilizes command naming before state, approvals, agents, and execution are added.

## Objective

Make `create-quiver`, local `quiver`, generated `quiver:*` scripts, version reporting, and unknown-command errors consistent.

## Scope

- CLI routing and binary alias behavior.
- `--version` support.
- Documentation for canonical bootstrap vs local shortcut.
- Tests for command compatibility and ambiguity.

## Acceptance Criteria

- `npx create-quiver --version` works.
- Local `quiver --version` works when installed.
- Unknown commands fail clearly.
- Docs do not contradict `README_FOR_AI.md`.
- Generated scripts target supported commands.

## Technical Plan Summary

Audit CLI entrypoints, normalize version handling, harden unknown command routing, and update docs/tests.

## Suggested Execution Steps

1. Read current CLI entrypoint and command router.
2. Add/adjust version handling.
3. Verify alias behavior.
4. Update docs.
5. Add focused tests.

## Restrictions

- Do not add new AI workflow behavior in this slice.
- Do not change spec/slice generation behavior.

## Risks

- Changing routing may break legacy `npx create-quiver --name` usage.

## Completion Checklist

- [ ] Tests added or updated.
- [ ] Docs updated.
- [ ] Existing init behavior preserved.
- [ ] Evidence appended.
