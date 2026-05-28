# EXECUTION_BRIEF - slice-02 Dashboard compact renderer

## Context

The current dashboard human output prints every section vertically. The user explicitly reported that this makes headings disappear when there is a lot of information.

## Objective

Make `npx create-quiver dashboard` compact and actionable by default.

## Scope

- Default human renderer only
- List truncation helpers
- Line-budget and no-spec tests

## Acceptance Criteria

- Default output is summary-first.
- Large fixture output is `<= 28` non-empty lines after ANSI stripping.
- Next safe command is visible in compact output.
- No-spec output avoids repeated empty sections.
- Truncated lists show `+ N more` and an inspection command.
- `dashboard --json` remains unchanged.

## Technical Plan Summary

Build the compact view from the existing dashboard report. Keep details and section rendering for the next slice.

## Suggested Steps

1. Add compact formatting helper.
2. Add ANSI-stripped line-count test helper.
3. Create a large dashboard fixture.
4. Add truncation and horizontal shortening.
5. Preserve JSON tests.

## Restrictions

- Do not introduce Ink or fullscreen TUI.
- Do not change report collection semantics.
- Do not implement `--details` or `--section` rendering here.

## Completion Checklist

- [ ] Compact renderer implemented.
- [ ] Large fixture line budget tested.
- [ ] JSON compatibility tested.
