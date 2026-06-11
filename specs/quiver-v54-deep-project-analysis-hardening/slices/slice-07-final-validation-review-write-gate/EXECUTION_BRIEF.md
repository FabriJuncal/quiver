# EXECUTION_BRIEF - slice-07 final validation review write gate

## Context

Final docs writes are the production-risk boundary. Invalid or low-quality JSON must never reach docs, even if provider execution, repair, retry, and artifacts all ran.

## Objective

Enforce final schema validation, semantic validation, review approval, snapshotting, and atomic writes.

## Scope

- Validate schema after repair/retry.
- Validate semantic evidence and confidence consistency.
- Ensure provider mode without `--review` writes no final docs.
- Ensure `--review` revalidates edited proposal before diff/confirmation/write.
- Snapshot and atomically write approved docs only.
- Keep cancellation/decline/no-TTY review paths intact.

## Acceptance Criteria

- Invalid final JSON writes zero final docs.
- Provider mode without `--review` writes audit artifacts only.
- `--review` cancel/decline/no-TTY failure leaves docs unchanged.
- Edited proposal is revalidated before write.
- Approved write creates snapshot manifest and writes atomically.
- Docs are not written if semantic validation fails.

## Completion Checklist

- [ ] Final validation gate implemented.
- [ ] Review tests updated.
- [ ] Atomic write/snapshot tests updated.
- [ ] Closure brief records no-write evidence.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-docs.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `tests/commands/ai-analyze-project-review.test.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- This slice's closure/status/evidence files.

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
git diff --check
```

## Constraints

- Do not relax schema validation.
- Do not write product code in analyzed repos.
- Do not let audit writes imply docs approval.
