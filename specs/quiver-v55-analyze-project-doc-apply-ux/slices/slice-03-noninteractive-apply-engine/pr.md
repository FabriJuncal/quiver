## Title

QUIVER-55-03 - Non-Interactive Analyze Project Apply Engine

## Summary

Implements the third v55 slice for `ai analyze-project`: `--apply-docs --yes` now applies validated documentation proposals through a safe non-interactive write engine.

## PR Policy

- One slice: `slice-03-noninteractive-apply-engine`.
- Runtime behavior change is limited to the non-interactive `--apply-docs --yes` path.
- This PR does not implement interactive selector UX or saved proposal application by run id.
- Human merge is required because this PR changes runtime write behavior.

## Scope

Included:

- Persist proposal artifacts before applying docs.
- Build the write plan from a normalized validated proposal.
- Block dirty target docs in `--yes` unless `--allow-dirty-docs` is passed.
- Block stale target docs when current hashes no longer match the saved proposal manifest.
- Create snapshots before final doc writes.
- Write approved docs only through the existing managed-block path.
- Save `.quiver/runs/<run-id>/writes/analyze-project-doc-writes.json`.
- Run post-write validation.
- Support `--apply-docs --yes --json`.
- Preserve existing `--review` behavior.

Excluded:

- No interactive selector for plain `--apply-docs`.
- No `ai analyze-project apply --run <run-id>`.
- No live provider smoke in CI.

## Files

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-apply.js`
- `src/create-quiver/lib/ai/analyze-project-proposal.js`
- `tests/commands/ai-analyze-project-review.test.js`
- `tests/lib/ai-analyze-project-apply.test.js`
- `tests/lib/ai-analyze-project-proposal.test.js`
- `specs/quiver-v55-analyze-project-doc-apply-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by this repository.
- npm dependencies installed.
- No provider credentials are required for automated tests.

### Worktree Access

```bash
git checkout feature/QUIVER-55-03-v55-noninteractive-apply-engine
```

### Run the Project

No dev server is required. This is a CLI docs-apply engine slice.

### Use Cases

#### Case 1: Apply valid docs non-interactively

```bash
node --test tests/commands/ai-analyze-project-review.test.js
```

Expected: `--apply-docs --yes` writes approved docs, saves proposal artifacts, creates a snapshot, saves the write manifest, and passes post-write validation.

#### Case 2: Automation JSON output

```bash
node --test tests/commands/ai-analyze-project-review.test.js
```

Expected: `--apply-docs --yes --json` emits parseable JSON containing run id, proposal artifacts, write plan, snapshot, written docs, post-write validation, and write manifest.

#### Case 3: Dirty docs are blocked by default

```bash
node --test tests/commands/ai-analyze-project-review.test.js
```

Expected: existing target docs block `--yes` unless `--allow-dirty-docs` is provided; final docs remain unchanged when blocked.

#### Case 4: Stale docs are blocked

```bash
node --test tests/lib/ai-analyze-project-apply.test.js
```

Expected: hash mismatches between proposal manifest and current target docs fail before writing final docs.

### Technical Verification

```bash
node --test tests/commands/ai-analyze-project-review.test.js tests/lib/ai-analyze-project-apply.test.js tests/lib/ai-analyze-project-proposal.test.js tests/lib/ai-analyze-project-validation.test.js
node --test tests/commands/ai-analyze-project-provider.test.js tests/commands/ai-analyze-project.test.js tests/commands/cli-contract.test.js tests/commands/ux-flags.test.js
node --test tests/lib/ai/analyze-project-repair.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
npm test
```

## Evidence

- All technical verification commands passed locally.
- Full `npm test` passed locally: 730 tests.
- `slice-03` closure brief records executed evidence.

## Rollback

Revert this PR:

```bash
git revert <merge-commit-sha>
```

This disables non-interactive docs apply while preserving the earlier CLI contract and `--save-proposal` artifacts.

## Risks / Notes

- `--apply-docs` without `--yes` still intentionally blocks until the interactive selector slice lands.
- Existing docs are treated as dirty targets and require `--allow-dirty-docs` for automation.
- Saved proposal application remains a later slice.
