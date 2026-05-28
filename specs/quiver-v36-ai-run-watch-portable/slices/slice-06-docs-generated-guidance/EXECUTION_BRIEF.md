# EXECUTION_BRIEF - slice-06 Docs and generated guidance

## Context

The watcher introduces public commands, artifacts, and safety expectations. User-facing docs and generated project guidance must match the implemented behavior.

## Objective

Document `ai run watch`, run artifacts, JSONL mode, portability limits, and safe usage in canonical docs and generated guidance.

## Scope

- CLI UX documentation
- AI guidance documentation
- Command reference documentation
- Generated docs/templates
- Notes for legacy runs, stale runs, JSONL, and security

## Acceptance Criteria

- Docs explain what the Quiver run id is and that it is not a provider session id.
- Docs include `npx create-quiver ai run watch --run <run-id>`.
- Docs include `npx create-quiver ai run watch --latest`.
- Docs include JSONL usage and state that `--json` emits JSONL only.
- Docs explain completed, failed, canceled, stale, legacy, and missing-run behavior at a user level.
- Docs explicitly state Quiver does not embed provider TUIs or require terminal multiplexers.
- Generated guidance matches public command behavior.
- Missing `docs/INDEX.md` debt is not hidden if the documentation workflow requires index updates.

## Technical Plan Summary

Update docs after runtime behavior stabilizes, then update generated guidance/templates so new projects receive the same command references.

## Restrictions

- Do not document behavior that has not been implemented.
- Do not add architecture claims that contradict the SPEC.
- Do not duplicate large sections across docs when a command reference link is enough.

## Completion Checklist

- [ ] Canonical docs updated.
- [ ] Generated guidance updated.
- [ ] Command examples verified.
- [ ] Documentation debt captured if `docs/INDEX.md` remains absent.
