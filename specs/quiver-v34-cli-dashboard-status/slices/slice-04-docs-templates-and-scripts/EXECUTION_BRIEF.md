# EXECUTION_BRIEF - slice-04 Docs, templates, and scripts

## Context

The dashboard command and guardrails are stable after slices 02 and 03. Public docs and generated project scripts now need to reflect the command.

## Objective

Document `dashboard` and add generated `quiver:dashboard` script support.

## Scope

- public docs
- AI guidance
- generated docs/templates
- generated package scripts
- focused docs/script tests

## Acceptance Criteria

- README and command reference mention `dashboard`.
- `README_FOR_AI.md` mentions dashboard as a read-only inspection command.
- CLI UX guide records dashboard as read-only and non-interactive.
- Generated project scripts include `quiver:dashboard`.
- Docs do not imply dashboard writes, executes providers, or opens a TUI.

## Technical Plan Summary

Update documentation only after the command contract is implemented. Keep root README concise and put procedural detail in command reference or generated docs.

## Suggested Steps

1. Update command reference.
2. Update README command list.
3. Update AI guidance.
4. Update CLI UX guide matrix.
5. Update generated docs/scripts.
6. Update docs/template tests.

## Restrictions

- Do not change command behavior in this slice.
- Do not claim npm publication.
- Do not document Ink as part of this feature.

## Risks

- Docs can drift if command contract changes after this slice; run command tests before final readiness.

## Completion Checklist

- [ ] Docs updated.
- [ ] Generated script tests updated.
- [ ] Docs tests pass.
