## Title

QUIVER-56-01 document classification merge engine

## Summary

Implements deterministic document classification and merge behavior for analyze-project docs.

## PR Policy

Individual PR required because this changes CLI write behavior internals.

## Scope

Slice 01 only.

## Files

- `src/create-quiver/lib/ai/analyze-project-docs.js`
- `tests/lib/ai-analyze-project-docs.test.js`
- `specs/quiver-v56-analyze-project-usable-doc-merge/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

Node.js/npm.

### Worktree Access

Use the slice branch.

### Run the Project

No dev server required.

### Use Cases

Validate scaffold replacement, partial scaffold preservation, human content preservation, context-prep cleanup, and idempotency.

### Technical Verification

```bash
node --test tests/lib/ai-analyze-project-docs.test.js
node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict
git diff --check
```

## Evidence

- `node --test tests/lib/ai-analyze-project-docs.test.js`: passed.
- `node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict`: passed.
- `git diff --check`: passed.

## Rollback

Revert the PR.

## Risks / Notes

Later slices integrate this engine into all apply/review/strict CLI paths.
