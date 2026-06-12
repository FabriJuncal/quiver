## Title

QUIVER-55-01 - Analyze Project CLI Proposal Contract

## Summary

Implements the first v55 slice for `ai analyze-project` doc-apply UX. This PR establishes the CLI contract, parser validation, help/docs surface, and proposal/write manifest schemas without implementing the later save/apply flows.

## PR Policy

- One slice: `slice-01-cli-proposal-contract`.
- Runtime behavior change is limited to parser/contract guards and manifest schema helpers.
- Later slices will implement saving proposals, applying docs, interactive UX, saved proposal apply, and release smoke.

## Scope

Included:

- Recognize `--apply-docs`, `--save-proposal`, `--diff`, and `--allow-dirty-docs`.
- Recognize `ai analyze-project apply --run <run-id>`.
- Reject invalid combinations before provider execution.
- Keep `--review` backward compatible.
- Add proposal and write manifest schema validation helpers.
- Add command help, command reference, and EN/ES help descriptions.
- Add the approved v55 spec/slice package and mark `slice-01` completed.

Excluded:

- No proposal persistence implementation.
- No docs apply implementation.
- No interactive selector.
- No saved proposal apply.
- No live provider smoke.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-proposal.js`
- `src/create-quiver/lib/cli/ux-flags.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/ai-analyze-project.test.js`
- `tests/commands/cli-contract.test.js`
- `tests/lib/ai-analyze-project-proposal.test.js`
- `docs/reference/commands.md`
- `specs/quiver-v55-analyze-project-doc-apply-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by this repository.
- npm dependencies installed.
- No provider credentials are required for this slice.

### Worktree Access

```bash
git checkout feature/QUIVER-55-01-v55-cli-proposal-contract
```

### Run the Project

No dev server is required. This is a CLI contract slice.

### Use Cases

#### Case 1: Dry-run remains read-only

```bash
node bin/create-quiver.js ai analyze-project --deep --dry-run
```

Expected: reports read-only analysis and does not create final docs.

#### Case 2: Invalid apply/review combination fails before provider

```bash
node bin/create-quiver.js ai analyze-project --deep --apply-docs --review
```

Expected: fails with an actionable contract error before provider execution.

#### Case 3: Saved proposal apply contract is recognized

```bash
node bin/create-quiver.js ai analyze-project apply --run run-123
```

Expected: command is parsed without requiring provider/model and reports that execution is reserved for a later v55 slice.

### Technical Verification

```bash
node --test tests/lib/ai-analyze-project-proposal.test.js
node --test tests/commands/ai-analyze-project.test.js
node --test tests/commands/cli-contract.test.js
node --test tests/commands/parser-contract.test.js
node --test tests/commands/ux-flags.test.js
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/ai-analyze-project-docs.test.js tests/lib/ai-analyze-project-validation.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v55-analyze-project-doc-apply-ux --strict
git diff --check
```

## Evidence

- All technical verification commands passed locally.
- `slice-01` closure brief records executed evidence.
- No live provider call was required.

## Rollback

Revert this PR:

```bash
git revert <merge-commit-sha>
```

Existing `ai analyze-project --deep`, `--dry-run`, provider mode, and `--review` behavior are isolated and covered by regression tests.

## Risks / Notes

- The new flags are recognized but intentionally blocked from executing save/apply behavior until later slices.
- This PR includes the v55 spec package because the spec does not exist on `main` yet.
