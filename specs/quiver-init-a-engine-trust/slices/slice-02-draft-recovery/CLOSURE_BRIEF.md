# CLOSURE_BRIEF — slice-02-draft-recovery

Status: SPEC_DRAFT. Runtime status: not-tested. Cycles: 0.

## Summary

Recover and approve an earlier still-valid draft. Implementation and validation pending.

## Delivered

Contract only; no runtime or test success claimed.

## Validation

- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/draft-integrity.test.js tests/lib/approvals.test.js tests/commands/ai-draft-recovery.test.js`: not executed for this slice.
- `git diff --check`: not executed for this slice.

## Deviations

Program-specific PR policy documented in docs/programs/quiver-v6/PROGRAM.md.
Estimated hours in slice.json is 0 because no estimate has been made; it is not
elapsed time or a delivery promise.

## Risks and pending work

- Not verified: Create v1 and v2, select v1, review/approve valid v1 and inspect same version.
- Not verified: Change original input, then restore or approve: stale rejection with no approval write.
- Not verified: Recover corrupted last version; invalid ID/path cannot escape approval root.

## Definition of done

Acceptance passes, independent review closes, evidence captured, one logical
commit exists and the initiative's final integration evidence includes the slice.
