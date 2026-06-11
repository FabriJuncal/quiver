## Title

docs: add reliable deep project analysis spec

## Summary

Adds the Quiver v53 spec package for hardening `ai analyze-project --deep --provider codex --model gpt-5.5` against provider schema drift, unsafe context handling, noisy validation failures, and invalid writes.

## PR Policy

Docs/spec-only PR. No runtime implementation is included.

## Scope

- Adds `SPEC.md`.
- Adds `EXECUTION_PLAN.md`.
- Adds `STATUS.md`.
- Adds `EVIDENCE_REPORT.md`.
- Adds planned slices with `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.

## Files

- `specs/quiver-v53-reliable-deep-project-analysis/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- Repository dependencies installed if running full checks.

### Worktree Access

```bash
git checkout docs/quiver-v53-reliable-deep-project-analysis
```

### Run the Project

No dev server is required. This is a documentation/spec package.

### Use Cases

1. Review the spec and slice roadmap.
2. Confirm each slice has an execution brief and closure brief.
3. Confirm the slice order matches the approved reliability-first plan.

### Technical Verification

```bash
node bin/create-quiver.js spec validate specs/quiver-v53-reliable-deep-project-analysis --strict
npm run schema:slice:check
git diff --check
```

## Evidence

- `node bin/create-quiver.js spec validate specs/quiver-v53-reliable-deep-project-analysis --strict`
- `npm run schema:slice:check`
- `git diff --check`

## Rollback

Revert the spec package directory:

```bash
git revert <commit>
```

## Risks / Notes

- Runtime behavior is unchanged.
- Implementation must be done through the documented slices, not from the full spec at once.
