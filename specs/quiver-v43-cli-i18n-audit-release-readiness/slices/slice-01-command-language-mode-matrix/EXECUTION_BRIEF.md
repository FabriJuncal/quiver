# EXECUTION_BRIEF - slice-01 Command language mode matrix

## Context

The final audit needs explicit coverage by command, language, and mode.

## Objective

Create and validate the command x language x mode matrix for the full documented CLI surface.

## Acceptance Criteria

- Every command in `docs/reference/commands.md` is represented.
- Each command has `en` and `es` coverage status.
- Modes include human, JSON/JSONL where supported, dry-run, interactive/review where supported, CI/no-TTY, and no-color where relevant.
- Critical uncovered cells block release.
- Accepted exceptions include owner, reason, and follow-up.

## Completion Checklist

- [ ] Matrix created.
- [ ] Coverage status assigned.
- [ ] Critical gaps converted into fixes or blockers.
