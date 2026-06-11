# EXECUTION_BRIEF - slice-06 audit and review transaction

## Context

After provider execution, users need an audit trail and a safe review/write transaction. Provider-only runs may write redacted audit artifacts, but final docs must require valid JSON and review approval.

## Objective

Implement redacted audit artifacts and review/write transaction guarantees.

## Scope

- `.quiver/runs` artifacts.
- Versioned manifests.
- Edited proposal revalidation.
- Final diff.
- Snapshot and hash before write.
- Atomic final docs writes.

## Acceptance Criteria

- Provider execution writes redacted audit artifacts.
- `--dry-run` writes nothing.
- Review cancel leaves docs unchanged.
- Invalid edited JSON blocks writes.
- Approved review writes snapshots and docs atomically.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-review.js`
- `src/create-quiver/lib/ai/artifacts.js`
- `src/create-quiver/lib/ai/run-state.js`
- analyze-project provider/review tests

## Validations Required

- `node --test tests/commands/ai-analyze-project-provider.test.js`
- `node --test tests/commands/ai-analyze-project-review.test.js`
- `node --test tests/commands/ai-analyze-project.test.js`
- `npm run smoke:create-quiver`
- `git diff --check`

## Risks

- Audit files can leak sensitive content if redaction is incomplete.
- Review flow can be confusing if audit writes are not distinguished from final docs writes.
- Partial writes can leave docs inconsistent.

## Dependencies

- Depends on `slice-02-safe-context-boundary`.
- Depends on `slice-04-safe-repair-layer`.
- Depends on `slice-05-controlled-retry-layer`.

## Instructions For Executor

1. Use temporary files and atomic rename for final docs writes.
2. Record hashes and snapshots before writing.
3. Keep non-TTY behavior non-interactive and actionable.

## Completion Checklist

- [ ] Audit artifacts implemented.
- [ ] Review cancel/approve tests pass.
- [ ] Atomic write behavior is validated.
- [ ] Closure brief updated.

## Conditions Of Closure

- Provider analysis has a reliable audit trail and docs writes are transactional.
