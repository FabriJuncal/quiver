# EXECUTION BRIEF - slice-08: Cross-platform help, auth, and DX

## Context

Pixel Quiver exposed DX gaps around paths with spaces, GitHub auth, command copying, help coverage, and safe profile configuration. This slice focuses on user-facing clarity after core context behavior is hardened.

## Objective

Improve cross-platform help, auth diagnostics, and actionable command guidance.

## Scope

- CLI help
- doctor/preflight messages
- GitHub auth diagnostics
- agent profile dry-run
- package manager-aware suggestions
- docs and tests

## Acceptance Criteria

- Help output covers public commands and key options.
- Path guidance is copy-safe across OS variants.
- GitHub auth diagnostics are actionable.
- Agent profile dry-run does not write files.
- Suggested commands respect detected package manager.

## Technical Plan Summary

Update help registry/messages, add auth diagnostics and dry-run preview, and cover OS/package-manager examples with tests.

## Suggested Execution Steps

1. Inspect help and diagnostics surfaces.
2. Add/adjust `ai agent set --dry-run`.
3. Improve GitHub auth and SSH alias messages.
4. Add path/package-manager guidance.
5. Update docs and tests.

## Restrictions

- Do not install credentials or mutate user auth.
- Do not require network in tests.

## Risks

- Help output can drift; keep tests tied to command registry.

## Completion Checklist

- [ ] Help tests updated.
- [ ] Auth diagnostics tested.
- [ ] Agent dry-run tested.
- [ ] Cross-platform path guidance tested.
- [ ] Validation commands passed.

