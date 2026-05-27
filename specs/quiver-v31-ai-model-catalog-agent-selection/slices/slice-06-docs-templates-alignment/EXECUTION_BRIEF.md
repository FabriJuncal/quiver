# EXECUTION_BRIEF - slice-06 Documentation and generated template alignment

## Context

The new model catalog and agent setup behavior must be discoverable in the public README, AI source of truth, command reference, CLI UX guide, and generated project docs.

## Objective

Document the finalized v31 behavior without duplicating long procedural content in the root README.

## Scope

- `README.md`
- `README_FOR_AI.md`
- `ROADMAP.md`
- `docs/CLI_UX_GUIDE.md`
- `docs/reference/commands.md`
- `docs/COMMANDS.md.template`
- generated onboarding/context templates where relevant

## Acceptance Criteria

- Docs explain `model` vs `displayName`.
- Docs explain known catalog vs account availability.
- Docs include interactive and no-TTY setup.
- Docs include `ai models list`, `ai agent doctor`, and `ai agent repair --dry-run`.
- Generated templates include current guidance where appropriate.
- Source-of-truth docs are synchronized.

## Technical Plan Summary

Update the canonical docs after command contracts settle. Keep README concise and put details in references/templates.

## Suggested Steps

1. Update command reference.
2. Update CLI UX guide.
3. Update generated command/onboarding templates.
4. Update README_FOR_AI and ROADMAP.
5. Add concise README mention only if useful.
6. Run docs validation and spec validation.

## Restrictions

- Do not claim npm publication.
- Do not add implementation code.
- Do not duplicate full procedure in root README.

## Risks

- Generated templates can drift from root docs.

## Completion Checklist

- [ ] Repo docs updated.
- [ ] Generated templates updated.
- [ ] README_FOR_AI synchronized.
- [ ] Spec validation passes.
