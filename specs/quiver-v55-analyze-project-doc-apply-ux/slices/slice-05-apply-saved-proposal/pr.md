## Title

QUIVER-55-05 - Apply Saved Analyze Project Proposals

## Summary

Implements the fifth v55 slice for `ai analyze-project`: saved documentation proposals can now be applied by run id without executing a provider.

`ai analyze-project apply --run <run-id>` now loads `.quiver/runs/<run-id>/proposal/manifest.json`, revalidates the saved proposal JSON, checks dirty/stale target docs, and delegates final writes to the existing safe apply engine.

## PR Policy

- One slice, one commit, one PR.
- Runtime CLI behavior change, so this must be an individual PR.
- Human merge required after CI passes.

## Scope

Included:

- `ai analyze-project apply --run <run-id>` runtime implementation.
- Safe run id validation before artifact access.
- Saved proposal manifest and JSON revalidation.
- Dirty/stale doc blocking using the original saved proposal hashes.
- Manual proposal edit detection and write-manifest audit events.
- `--run latest` guardrails for interactive-only usage.
- Apply-run post-write validation without requiring the original provider analysis payload.
- Tests for success, missing artifacts, dirty/stale blocking, no-provider execution, and manual proposal edits.
- Slice status, evidence, closure, and PR docs.

Excluded:

- Fresh provider prompt/schema changes.
- Product repo code changes in analyzed projects.
- Release smoke docs for npm publishing.

## Files

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/ai/analyze-project-apply.js`
- `src/create-quiver/lib/ai/analyze-project-proposal.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `tests/commands/ai-analyze-project-review.test.js`
- `tests/commands/ai-analyze-project.test.js`
- `tests/lib/ai-analyze-project-proposal.test.js`
- `specs/quiver-v55-analyze-project-doc-apply-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node/npm environment for this repo.
- No live provider credentials required for automated tests.

### Worktree Access

```bash
git checkout feature/QUIVER-55-05-v55-apply-saved-proposal
```

### Run the Project

No dev server is required. This is CLI behavior.

### Use Cases

1. Apply a saved proposal by run id:

```bash
node --test tests/commands/ai-analyze-project-review.test.js
```

Expected: saved proposal apply writes docs without provider execution, blocks dirty/stale targets, and records manual proposal edits.

2. Validate saved proposal artifact helpers:

```bash
node --test tests/lib/ai-analyze-project-proposal.test.js
```

Expected: run id validation, saved proposal loading, manifest validation, and edit detection pass.

3. Validate CLI contract:

```bash
node --test tests/commands/ai-analyze-project.test.js
```

Expected: `apply --run` no longer hits the old stub, missing artifacts fail actionably, and unsafe `latest` combinations are rejected.

### Technical Verification

```bash
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
npm test
```

Expected: all pass.

## Evidence

Executed locally:

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/lib/ai-analyze-project-proposal.test.js
node --test tests/commands/ai-analyze-project.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
npm test
```

Result: all passed. Full `npm test` passed with 747 tests.

## Rollback

Revert this PR. Fresh `--save-proposal`, `--apply-docs`, `--apply-docs --yes`, and `--review` behavior from earlier slices remain available.

## Risks / Notes

- `apply --run <run-id>` now writes docs when the saved proposal is valid and current target hashes match.
- Stale docs always block; `--allow-dirty-docs` only bypasses the dirty-doc guard.
- `--run latest` is intentionally not available for `--yes` or `--json` automation.
