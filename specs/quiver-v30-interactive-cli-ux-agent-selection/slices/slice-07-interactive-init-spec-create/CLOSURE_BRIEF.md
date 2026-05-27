# CLOSURE_BRIEF - slice-07 Interactive init and spec create flows

## Summary

Implemented guided interactive flows for init and spec creation while keeping default automation unchanged.

## Validation Against Acceptance Criteria

- [x] `init --interactive` validated.
- [x] non-interactive init compatibility validated.
- [x] `spec create --interactive` validated.
- [x] no-TTY/CI/JSON fallback validated.

## Relevant Changes

- Added `init --interactive` guided choices for project mode, methodology, init profile, and optional agent-profile next steps.
- Enforced the only supported methodology, `wdd-sdd`, through `--methodology` and interactive selectors.
- Added summaries before persistent writes in interactive init/spec-create flows.
- Added `spec create --interactive` selectors for methodology, approved technical-plan input, and direct-vs-review write mode.
- Added no-TTY guardrails so interactive commands fail with explicit flag guidance instead of blocking automation.
- Documented the interactive flow and methodology flag in CLI docs and source-of-truth guide.

## Pending

- Full docs and release-readiness evidence are handled by slice-08.

## Remaining Risks

- The project-mode selector currently maps "solo validar estructura" to Doctor. That is useful and non-destructive, but it still requires the target to have Quiver initialization evidence.
- `spec create --interactive` presents the currently resolved approved technical plan input; additional historical input selection can be added later if multiple approved inputs become a supported contract.

## Future Recommendations

Keep the interactive question count small and add more prompts only when real dogfooding shows repeated confusion.
