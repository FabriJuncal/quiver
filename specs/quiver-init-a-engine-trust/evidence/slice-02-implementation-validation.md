# Slice 02 implementation validation

Date: 2026-09-12 (America/Argentina/Cordoba). Runtime: native Node 22 from
`/opt/homebrew/opt/node@22/bin`; `LANG` and `LC_ALL` were `en_US.UTF-8`.

## Final source-frozen results

- `node --test tests/lib/draft-integrity.test.js tests/lib/approvals.test.js tests/commands/ai-draft-recovery.test.js`
  exited 0: 30/30 pass, 0 fail, 0 skipped, 3,079 ms.
- `node --test tests/commands/ai-plan.test.js` exited 0: 37/37 pass,
  0 fail, 0 skipped, 24,368 ms.
- `node --test tests/commands/ai-review-plan.test.js` exited 0: 43/43 pass,
  0 fail, 0 skipped, 25,400 ms.
- `node --test tests/commands/ai-run-state.test.js` exited 0: 18/18 pass,
  0 fail, 0 skipped, 10,464 ms.
- `git diff --check` exited 0.

The focused lifecycle rerun covering the conditioned final decision and all seven
review-WAL interruption points exited 0: 2/2 top-level tests passed.

## Failure and retest record

1. The first combined affected run exited 1 with 110/120 passing. Ten failures
   exposed acceptance revision input handling and existing v58 fixtures that
   saved governed drafts without an explicit run binding. Revision now records
   feedback as its source while retaining the canonical prior-phase input, and
   governed fixtures pass explicit run identity.
2. The first exact lifecycle rerun passed the conditioned case but failed its
   reviewed-evidence assertion because repository SHA values include the
   `sha256:` prefix. The assertion was corrected to the canonical digest format;
   the unchanged product path then passed 2/2.
3. The first split consumer rerun passed ai-plan and ai-review-plan but failed one
   of 18 run-state tests: its two-run fixture attempted to approve a run-owned
   historical draft without selecting it. The fixture now performs explicit
   authorized run-bound selection before each approval, preserving A02's current
   selection contract; the test and final 18/18 suite pass.

## Independent findings closed before freeze

- F-A02-01: equal-byte alias input path could satisfy acceptance ownership.
  Recovery now requires exact canonical path identity and digest; positive and
  no-write negative tests pass.
- F-A02-02: conditioned lifecycle lacked the final canonical A-event identity.
  Final projection is prepared after decision construction and its WAL metadata
  contains `decision_id`, `decision_sha256`, artifact/input digests and exact
  last-operation evidence; no legacy approved artifact is written.
- F-A02-03: governed review WAL could be removed before reviewed lifecycle
  projection. WAL cleanup now follows an idempotent exact R-event projection;
  every interruption point recovers one reviewed event.
- F-A02-04: a temporary compatibility change inferred the latest active run.
  That inference was removed. Active digest-bound acceptance saves require an
  explicit run id, and an equal-byte two-run no-write regression passes.

No unrecoverable prior-session A02 command was claimed as evidence. Full CI was
not duplicated; combined post-integration validation remains coordinator-owned.

## Coordinator integration correction — cycle 5

The first full A02+A06 integrated run executed 997 tests: 996 passed and one
failed, zero skips, elapsed 100,471 ms. Its failed case was
`spec create resolves an on-disk canonical ledger without an injected governance resolver`:
`APPROVAL_BINDING_MISMATCH: digest-bound acceptance draft save requires an explicit run id`.
The raw command artifact is retained by A06 as
`evidence/slice-06-integration-with-slice-02.md`; this was not a passing CI run.

The fixture had already created `run-spec-create-ledger` from `requirements.md`
but omitted that run ID when saving its acceptance draft. Passing the existing
`runId` to `savePlannerDraft` preserves every product guard and every assertion.
The independent reviewer checked this exact producer/consumer binding and approved
the fixture-only correction; no closed core finding was reopened.

[The complete spec-create suite](./slice-02-spec-create-integration-retest.md)
then passed 15/15 tests, zero skips, 4,983 ms on Node 22. The unpublished A02
commit was amended so the correction remains in its single logical slice commit.
Combined CI must be rerun after rebasing A06; that result is not presumed here.
