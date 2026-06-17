## Title

QUIVER-56-02 apply integration validation contract

## Summary

Integrates the merge engine into all analyze-project write paths and post-write validation.

## PR Policy

Individual PR required.

## Scope

Slice 02 only.

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

Live apply, saved proposal apply, review diff, JSON output, strict validation.

### Technical Verification

```bash
node --test tests/commands/ai-analyze-project-provider.test.js tests/commands/ai-analyze-project-review.test.js
node --test tests/lib/ai-analyze-project-docs.test.js tests/lib/ai-analyze-project-validation.test.js
node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict
git diff --check
```

## Evidence

Pending.

## Rollback

Revert the PR.

## Risks / Notes

Depends on Slice 01.
