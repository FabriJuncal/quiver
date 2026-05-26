# EXECUTION_BRIEF - slice-01 CLI UX primitives, theme, and dependencies

## Context

Quiver currently has no runtime dependencies and uses direct string output. This slice adds a shared UX layer carefully so later command changes stay consistent and script-safe.

## Objective

Create internal helpers for Quiver-branded human output, prompts, spinners, mode detection, and editor review.

## Scope

- Add `@clack/prompts` and `zod` only if required by the approved implementation path.
- Add `src/create-quiver/lib/cli/theme.js`.
- Add `src/create-quiver/lib/cli/ux.js`.
- Add `src/create-quiver/lib/cli/editor.js`.
- Add focused unit tests.

## Acceptance Criteria

- Existing commands keep current behavior unless using new helpers internally without visible behavior changes.
- No output decoration in CI/no-TTY/JSON/no-color modes.
- Quiver color tokens match the approved palette.
- `$VISUAL`/`$EDITOR` fallback is tested.

## Suggested Steps

1. Add dependencies and lockfile updates.
2. Implement theme tokens and symbol fallbacks.
3. Implement mode detection and human-output helpers.
4. Implement editor helper with cancellation handling.
5. Add unit tests.
6. Run package smoke.

## Restrictions

- Do not migrate CLI parsing in this slice.
- Do not modify `ai prepare-context` behavior yet.

## Risks

- Dependency ESM/CJS compatibility can break `npx`.
- Decoration can leak into tests if mode detection is weak.

## Completion Checklist

- [ ] Dependencies justified and package smoke passes.
- [ ] Theme/helper/editor tests pass.
- [ ] No hardcoded Quiver colors outside the theme module.
