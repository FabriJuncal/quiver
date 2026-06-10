# CLOSURE_BRIEF - slice-03 Doc proposal review and safe writes

## Summary

Implemented safe documentation writes for `ai analyze-project --review`. Validated analysis is converted into a constrained doc proposal, edited as JSON, revalidated, diffed, and written only after explicit confirmation. Writes are limited to approved Markdown docs, preserve human-authored content through a managed block, report dirty target files before confirmation, and create `.quiver/runs` snapshots, manifests, before/after hashes, restore hints, and redacted raw artifacts before mutating docs.

## Validation

- [x] `node --test tests/commands/ai-analyze-project-review.test.js`
- [x] `node --test tests/lib/ai-analyze-project-docs.test.js`
- [x] `node --test`
- [x] `git diff --check`

## Closure Notes

- Managed-block strategy: Quiver owns only the block between `<!-- quiver:analyze-project:start -->` and `<!-- quiver:analyze-project:end -->`. Existing human content outside that block is preserved.
- `docs/PROJECT_MAP.md` uses the same constrained managed-block path as other approved docs; product code, lockfiles, configs, and dependency files remain denied for writes.
- Restore guidance is stored per changed file in the snapshot manifest with original snapshots and before/after hashes.
- No-TTY review, review cancellation, invalid edited proposals, path traversal, oversized docs, dirty targets, and declined confirmation leave target docs unchanged.
