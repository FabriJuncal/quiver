# EXECUTION_BRIEF - slice-01 CLI UX runtime and progress engine

## Context

v29 added initial UX primitives, but live provider calls still look frozen because commands do not consistently use a progress runtime.

## Objective

Build a reusable CLI UX runtime that makes human output clear and keeps machine output clean.

## Scope

- Extend `src/create-quiver/lib/cli/**`.
- Add helpers for headings, sections, checks, warnings, errors, summaries, next steps, spinners, and task groups.
- Add cleanup behavior for spinner lifecycle.
- Add tests for human, no-color, CI, no-TTY, JSON, ASCII, success, and failure modes.

## Acceptance Criteria

- Human TTY mode can render Quiver-branded progress.
- No-TTY mode does not appear frozen.
- JSON/CI/no-color modes stay clean.
- Spinner lifecycle is safe on success and failure.
- No command-specific hardcoding of Quiver colors is introduced.

## Plan tecnico resumido

Keep the runtime internal and dependency-light. Use injected IO for testability and avoid direct command coupling to prompt libraries.

## Suggested Steps

1. Review existing `theme.js` and `ux.js`.
2. Add missing output primitives.
3. Add progress/task lifecycle helpers.
4. Add cleanup hooks for error paths.
5. Add focused unit tests.

## Restrictions

- Do not change IA command behavior in this slice.
- Do not add a TUI dependency.
- Do not replace the CLI parser.

## Risks

- Decoration can leak into automation if mode detection is weak.
- Spinners can leave terminal artifacts if lifecycle cleanup is incomplete.

## Completion Checklist

- [ ] UX runtime helpers implemented.
- [ ] Human/machine output modes tested.
- [ ] Spinner cleanup tested.
- [ ] `git diff --check` passes.
