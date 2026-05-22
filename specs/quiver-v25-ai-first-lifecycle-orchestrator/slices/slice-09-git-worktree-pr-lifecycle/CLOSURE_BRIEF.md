# CLOSURE BRIEF - slice-09: Git worktree, commit, PR, and close lifecycle

## Summary of Work

Implemented Git/worktree/PR lifecycle hardening around the AI-first flow. Quiver can now dry-run spec worktree creation, refuses dirty-tree slice commits, requires explicit SSH host alias input for PR preflight, blocks PR creation while spec slices remain open, and keeps post-merge worktree cleanup/pull guidance visible.

## Validation Against Acceptance Criteria

- [x] Worktree lifecycle verified.
- [x] Commit-by-slice verified.
- [x] PR preflight verified.
- [x] PR body usage verified.
- [x] Post-merge close verified.
- [x] Open-slice PR blocking verified.
- [x] Cross-platform SSH alias guidance verified.

## Relevant Changes

- `spec start --dry-run` now previews branch/base/worktree without creating a worktree.
- CLI wiring passes `--dry-run` into `startSpecWorktree`.
- `ai execute-slice --commit` blocks when the worktree is dirty before execution, even if `--allow-dirty` is set.
- GitHub PR preflight requires `--ssh-host-alias` and reports macOS/Linux/Windows setup guidance when missing.
- PR creation from a generated spec `pr.md` refuses to continue while any slice in that spec is not completed.
- README, README_FOR_AI, generated command docs, workflow docs, and CLI help describe the hardened lifecycle.

## Pending

None for this slice.

## Remaining Risks

- SSH alias presence is validated, but key authentication still depends on the user's local SSH configuration.
- Open-slice blocking is intentionally scoped to standard `specs/<slug>/pr.md` PR bodies.

## Future Recommendations

- Keep `gh` and SSH alias guidance platform-specific and actionable.
- Consider adding a future `ai doctor --ssh-host-alias <alias>` live SSH probe when network access is intentionally available.
