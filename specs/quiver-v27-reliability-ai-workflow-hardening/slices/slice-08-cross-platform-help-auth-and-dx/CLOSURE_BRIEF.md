# CLOSURE BRIEF - slice-08: Cross-platform help, auth, and DX

## Summary

Hardened cross-platform DX around help output, agent profile previews, GitHub auth diagnostics, SSH/path guidance, and package-manager-aware next-step messaging.

## Validation Against Acceptance Criteria

- Help output now documents the `ai agent set --dry-run` flow and the general `--dry-run` option includes `ai agent set`.
- Paths with spaces now trigger shell-specific guidance for macOS/Linux, Windows PowerShell, Git Bash, and WSL in GitHub PR/preflight output.
- GitHub auth failures now identify likely account, scope, and SSH alias issues and point to `gh auth status` as the next safe command.
- `ai agent set --dry-run` validates and previews the profile without writing `.quiver/agents/profiles.json`.
- `flow` now reports the detected package manager and generated `quiver:flow` script command; init/migrate install fallback warnings respect npm, pnpm, yarn, or bun.

## Changes

- Added `buildAgentProfileState` and wired `ai agent set --dry-run` through `src/create-quiver/commands/ai.js`.
- Updated CLI help, examples, and agent dispatch in `src/create-quiver/index.js`.
- Added GitHub auth classification and shell-safe command/path formatting in `src/create-quiver/lib/ai/github.js`.
- Added package-manager-aware flow output in `src/create-quiver/commands/flow.js`.
- Updated command docs and v27 evidence/status docs.
- Added focused tests for agent dry-run, help contract, GitHub diagnostics/path guidance, and flow package-manager output.

## Remaining Risks

- `gh auth status` output varies by GitHub CLI version; diagnostics intentionally combine parsed hints with general account/scope/alias guidance.
- Shell-safe examples are generated for common shells, but unusual shell configurations may still require manual path adaptation.

## Follow-up Recommendations

- In `slice-09`, include smoke coverage for packaged CLI help, `flow`, `ai agent set --dry-run`, and GitHub diagnostic fixtures.
