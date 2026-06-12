## Title

QUIVER-55-02 - Save Analyze Project Proposal Artifacts

## Summary

Implements the second v55 slice for `ai analyze-project`: `--save-proposal` now persists a validated, normalized documentation proposal without writing final docs.

## PR Policy

- One slice: `slice-02-save-proposal-flow`.
- Runtime behavior change is limited to save-only proposal artifact persistence.
- This PR does not implement docs apply, interactive selector UX, or saved proposal apply.

## Scope

Included:

- Build a normalized doc proposal from validated provider analysis.
- Save proposal JSON, compact Markdown summary, full diff, and manifest under `.quiver/runs/<run-id>/proposal/`.
- Record proposal metadata in run status.
- Support `--save-proposal --json`.
- Keep final docs unchanged.
- Avoid snapshots in save-only mode.
- Add command and helper tests for success, JSON output, and invalid provider JSON.

Excluded:

- No `--apply-docs` implementation.
- No interactive selector.
- No `ai analyze-project apply --run` implementation.
- No live provider smoke in CI.

## Files

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-proposal.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- `tests/lib/ai-analyze-project-proposal.test.js`
- `specs/quiver-v55-analyze-project-doc-apply-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by this repository.
- npm dependencies installed.
- No provider credentials are required for automated tests.

### Worktree Access

```bash
git checkout feature/QUIVER-55-02-v55-save-proposal-flow
```

### Run the Project

No dev server is required. This is a CLI save-artifact slice.

### Use Cases

#### Case 1: Save proposal artifacts

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
```

Expected: `--save-proposal` test writes proposal artifacts under `.quiver/runs/<run-id>/proposal/` and does not write `docs/CONTEXTO.md`.

#### Case 2: Save proposal JSON output

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
```

Expected: `--save-proposal --json` output parses as JSON and points to the saved proposal manifest.

#### Case 3: Invalid provider JSON remains safe

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
```

Expected: invalid final provider JSON rejects before proposal artifacts are created.

### Technical Verification

```bash
node --test tests/lib/ai-analyze-project-proposal.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/commands/ai-analyze-project.test.js tests/commands/cli-contract.test.js tests/commands/ux-flags.test.js
node --test tests/commands/ai-analyze-project-review.test.js tests/lib/ai-analyze-project-validation.test.js tests/lib/ai-analyze-project-docs.test.js
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Evidence

- All technical verification commands passed locally.
- `slice-02` closure brief records executed evidence.
- No live provider call was required.

## Rollback

Revert this PR:

```bash
git revert <merge-commit-sha>
```

This restores `--save-proposal` to the previously recognized-but-unavailable contract while preserving the earlier slice-01 CLI contract.

## Risks / Notes

- Saved proposals are artifacts only; users still need a later slice to apply them with `apply --run`.
- The Markdown summary intentionally omits full proposed doc contents; the JSON and diff artifacts hold details.
