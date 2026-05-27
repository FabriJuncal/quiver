# CLOSURE_BRIEF - slice-06 Documentation and generated template alignment

## Summary

Updated public docs, source-of-truth AI guidance, command reference, CLI UX guide, generated templates, roadmap, and v31 status to describe the new model catalog and agent profile setup contract.

## Validation Against Acceptance Criteria

- [x] Docs explain `model` vs `displayName`.
- [x] Docs explain catalog limitations: models are known by Quiver, not guaranteed available in the user's provider account.
- [x] Commands are documented: `ai models list`, `ai agent doctor`, and `ai agent repair --dry-run`.
- [x] Generated templates are aligned with current setup, no-TTY/script setup, and legacy-profile repair guidance.

## Relevant Changes

- Updated `README.md` with concise agent setup commands and profile data guidance.
- Updated `docs/reference/commands.md` with model listing, interactive agent setup, profile doctor, and repair dry-run commands.
- Updated `docs/CLI_UX_GUIDE.md` with the canonical profile data contract and UX matrix rows.
- Updated generated templates `docs/COMMANDS.md.template`, `docs/AI_ONBOARDING_PROMPT.md.template`, and `docs/AI_CONTEXT.md.template`.
- Updated `README_FOR_AI.md`, `ROADMAP.md`, and this spec status to reflect completed docs/templates alignment without claiming package publication.

## Pending

Final release-readiness validation remains in `slice-07-tests-smokes-release-readiness`.

## Remaining Risks

- The local model catalog can become stale until Quiver has a remote or update mechanism.
- Account-level model access still depends on the provider CLI/account and can only be proven by live execution.

## Future Recommendations

Keep model catalog docs close to command references so users do not treat catalog entries as guaranteed access.
