# Quiver v27 - Reliability and AI Workflow Hardening

## Summary

- Hardens Quiver after Pixel Quiver dogfooding surfaced workflow reliability issues.
- Aligns classic and AI command state discovery.
- Stabilizes JSON exports for dashboards and agents.
- Makes `spec create`, AI artifacts, worktrees, validation gates, context commands, and cross-platform DX safer.

## Scope

- `QP-001` to `QP-019`
- `QIS-001` to `QIS-022`
- Specs/slices, AI lifecycle, exports, validators, worktrees, docs, tests, fixtures, and release readiness.

## Validation

To be completed by implementation slices:

- `node --test tests/**/*.test.js`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run smoke:create-quiver`
- `npm run package:quiver`
- tarball smoke from `/private/tmp`
- `git diff --check`

## Risks

- Shared resolver changes can affect many commands.
- Export schema changes require backward-compatible handling or migration notes.
- Worktree lifecycle changes must preserve existing user workflows.
- Real fixtures must be sanitized before commit.

