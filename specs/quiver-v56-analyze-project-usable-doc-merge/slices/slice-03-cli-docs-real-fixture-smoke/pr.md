## Title

QUIVER-56-03 CLI docs real fixture smoke

## Summary

Adds user-facing output, docs, and fixture smoke evidence for the usable doc merge behavior.

## PR Policy

Individual PR required.

## Scope

Slice 03 only.

## Files

See `slice.json`.

## How to Test (DETAILED - REQUIRED)

### Required Environment

Node.js/npm.

### Worktree Access

Use the slice branch.

### Run the Project

No dev server required.

### Use Cases

CLI output, docs, troubleshooting, deterministic nika-erp style fixture.

### Technical Verification

```bash
node --test tests/commands/ai-analyze-project-provider.test.js tests/commands/cli-contract.test.js
npm run docs:check
node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict
git diff --check
```

## Evidence

- `node --test tests/commands/ai-analyze-project-provider.test.js tests/commands/cli-contract.test.js`: passed.
- `npm run docs:check`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict`: passed.
- `git diff --check`: passed.

## Rollback

Revert the PR.

## Risks / Notes

Depends on Slice 02.
