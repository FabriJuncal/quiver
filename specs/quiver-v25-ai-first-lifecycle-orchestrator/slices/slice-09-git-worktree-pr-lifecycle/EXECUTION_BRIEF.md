# EXECUTION BRIEF - slice-09: Git worktree, commit, PR, and close lifecycle

## Context

Quiver's intended workflow uses one worktree per spec, one commit per slice, and one PR per spec.

## Objective

Implement safe Git/GitHub lifecycle commands around worktrees, slice commits, PR creation, and post-merge cleanup.

## Scope

- Worktree create/status/repair/close.
- Clean-tree checks.
- Commit-by-slice.
- GitHub CLI preflight.
- SSH alias guidance across macOS, Linux, and Windows.
- PR creation from `pr.md`.
- Post-merge cleanup guidance.

## Acceptance Criteria

- Existing worktrees/branches/PRs are handled safely.
- Commits refuse unrelated mixed changes.
- PR preflight catches missing prerequisites.
- PR uses generated body.
- Close guides worktree removal and pull.

## Technical Plan Summary

Build on controlled slice execution so only closed, validated slice work can be committed and included in PR creation.

## Suggested Execution Steps

1. Audit current worktree and PR commands.
2. Add status/repair paths.
3. Harden clean-tree and commit checks.
4. Add/extend PR preflight.
5. Add post-merge close guidance.
6. Test with mocked Git/GitHub states.

## Restrictions

- Do not auto-merge PRs.
- Do not create SSH keys without explicit user approval.

## Risks

- Git state can vary widely. Prefer diagnostic output over destructive repair.

## Completion Checklist

- [ ] Worktree flows tested.
- [ ] Commit-by-slice tested.
- [ ] PR preflight tested.
- [ ] Close flow tested.
- [ ] Evidence appended.
