## Title

Quiver v57 Evidence Budget Recovery UX

## Summary

- Adds safe recovery guidance for `ai analyze-project` evidence validation failures.
- Classifies missing evidence before recommending budget changes.
- Calculates safe `--max-files` and `--max-bytes` rerun recommendations from classified evidence.
- Adds prominent English/Spanish recovery output, JSON recovery errors, validation manifest recovery payloads, docs, and tests.

## PR Policy

- Type: feature.
- Base: `main`.
- Scope: Quiver v57 evidence-budget recovery UX.
- Policy note: this PR groups the full v57 recovery feature because the slices are sequentially dependent and were executed as one approved implementation batch. The PR remains revertable as one feature change.
- Merge: human merge required.

## Scope

Included:

- Recovery classification for `evidence-not-selected` issues.
- Safe handling of `.env`, `.env.example`, dependency folders, generated output, binaries, missing files, and paths outside the repo.
- Budget recommendation and command builder.
- Human CLI error guidance in English and Spanish.
- `--json` error payload with optional `recovery`.
- Validation manifest recovery payload.
- Public docs and troubleshooting guidance.

Excluded:

- Auto-expanding context and retrying with a larger budget in the same run.
- Relaxing provider schema or evidence validation.
- Reading or sending unsafe files.
- Product-code changes in analyzed repositories.

## Files

- `src/create-quiver/lib/ai/analyze-project-recovery.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/lib/ai-analyze-project-recovery.test.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- `docs/TROUBLESHOOTING.md`
- `docs/reference/commands.md`
- `docs/workflows/existing-project.md`
- `docs/workflows/existing-project-ai-quiver-setup.md`
- `specs/quiver-v57-evidence-budget-recovery-ux/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js compatible with the repo.
- npm dependencies installed.
- GitHub CLI only needed for PR creation, not runtime tests.

### Worktree Access

From the repository root:

```bash
git status --short --branch
```

Expected branch:

```text
feature/QUIVER-57-01-recovery-contract-security-classifier
```

### Run the Project

No dev server is required. This is a CLI/runtime validation change.

### Use Cases

1. Provider cites a test file outside the selected sample.
   - Quiver fails validation.
   - Quiver shows a recommended command that includes `--include-tests`.
   - No docs are written.

2. Provider cites `.env.example`.
   - Quiver treats it as metadata-only/redacted.
   - Quiver does not recommend including its raw content.

3. Provider cites unsafe files.
   - Quiver classifies them as excluded.
   - Quiver does not recommend increasing budget for them.

4. `--json` is used on final evidence validation failure.
   - Quiver prints a parseable JSON error payload with optional `recovery`.
   - Exit behavior remains failure.

### Technical Verification

```bash
node --test tests/lib/ai-analyze-project-recovery.test.js tests/commands/ai-analyze-project-provider.test.js tests/lib/ai-analyze-project-validation.test.js tests/lib/i18n-catalog.test.js
npm run docs:check
node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict
git diff --check
```

## Evidence

- PASS `node --test tests/lib/ai-analyze-project-recovery.test.js tests/commands/ai-analyze-project-provider.test.js tests/lib/ai-analyze-project-validation.test.js tests/lib/i18n-catalog.test.js`
- PASS `npm run docs:check`
- PASS `node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict`
- PASS `git diff --check`

## Rollback

Revert this PR. The feature is additive around failed `ai analyze-project` evidence validation. Existing validation remains strict, and runtime doc writes remain blocked when provider output is invalid.

## Risks / Notes

- Live provider behavior can still drift; run a smoke with a real provider before npm release.
- The recovery command is diagnostic guidance only. It does not auto-expand context in the same run.
- The validation manifest gains an optional `recovery` field; existing consumers should remain compatible.

