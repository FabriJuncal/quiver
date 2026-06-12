# EXECUTION_BRIEF - slice-04 interactive apply UX

## Context

The main user-facing improvement is an explained selector that avoids forcing users into a large editor buffer. This selector must orchestrate already-tested save/apply/edit actions instead of owning write logic.

## Objective

Implement `--apply-docs` TTY selector UX with English/Spanish messages and safe action routing.

## Scope

- Show compact analysis/proposal summary.
- Show proposed files and action counts.
- Show repair summary and artifact paths.
- Render selector options with one-line descriptions.
- Dynamic recommendation:
  - Apply documentation when target docs are clean/low-risk;
  - View diff when docs are existing/dirty/high-risk.
- Implement actions:
  - apply;
  - view diff then apply/save/cancel;
  - save proposal;
  - edit proposal via existing `--review` path;
  - cancel.
- Truncate human diff and save full diff artifact.

## Acceptance Criteria

- TTY `--apply-docs` shows explained options.
- no-TTY `--apply-docs` without `--yes` fails with actionable message.
- Cancel writes no final docs.
- Save proposal from selector writes artifacts only.
- Edit proposal reuses editor flow and handles editor failure by returning actionable guidance.
- View diff does not accidentally apply docs and requires a second decision.
- `--review` remains backward compatible.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-interactive.js`
- `src/create-quiver/lib/ai/analyze-project-apply.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/ai-analyze-project-review.test.js`
- `tests/lib/cli-ux.test.js`
- this slice closure/status/evidence files

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/lib/cli-ux.test.js
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Completion Checklist

- TTY selector presents explained choices in the configured language.
- no-TTY apply without `--yes` fails with actionable guidance.
- Diff, save, edit, cancel, and apply paths are tested.
- Terminal diff output remains bounded.
- Slice closure brief updated with evidence.

## Constraints

- Do not duplicate write logic inside selector code.
- Do not make `--interactive` required for `--apply-docs`.
- Do not print unbounded diffs in terminal.
