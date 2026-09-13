# Slice 03 implementation validation

Date: 2026-09-13

Slice: `slice-03-effective-amendments`

Runtime: native Node 22 from `/opt/homebrew/opt/node@22/bin`

## Outcome

The retained final affected-suite cycle passed 69/69 tests. It covers immutable and
deterministic addenda/amendments, exact root/input/lineage digests, explicit
removal and repaired references, malformed operations, stale parents, Markdown
rejection, authorization, tamper/missing-parent/cycle/branch rejection, v58
review-budget compatibility, ordinary governed review WAL behavior, and the
actual `runReviewPlan` effective-contract retry/recovery path.

Command:

```text
PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node --test tests/lib/effective-contract.test.js tests/lib/draft-integrity.test.js tests/lib/ai-review-budget.test.js tests/commands/ai-review-plan.test.js
```

Observed result: 69 passed, 0 failed, exit 0. The untruncated timestamped command,
exit code and output are retained in `slice-03-affected-suite-final.md`. The
preceding 68-test successful product run is retained in
`a03-implementation-cycle-2.log.gz`.

After rebasing the frozen candidate onto canonical A06 commit `26fc2db`, the
six-test A03 focal suite passed again (0 failures). A final self-audit then kept
the phase lock across the complete effective review WAL application, not only
its identity check; the same focal suite passed 6/6 afterward. Untruncated
evidence is in `slice-03-focal-after-rebase.md` and
`slice-03-focal-frozen.md`. `git diff --check` also passed.

## Actual cycles and corrections

1. The first new module-only run passed 4/4.
2. The first production-path test stopped in fixture setup because the run
   history used an absolute draft path, which the existing snapshot sanitizer
   correctly rejected. The fixture now uses the canonical relative draft path.
3. The next production-path run exposed a string timestamp passed to the phase
   lock during review-WAL finalization. Lock inputs now normalize ISO timestamps
   to `Date` while persisted timestamps remain unchanged.
4. The first effective-source persistence run passed `null` as a root draft
   lifecycle version. The implementation now derives and persists the strict
   effective-contract source binding from the verified reservation and skips
   root-draft lifecycle projection only for that binding.
5. The next run correctly blocked root-draft approval as stale; its test initially
   expected a governance error code that this legacy actionable error does not
   expose. The assertion now checks the exact stale-review behavior.
6. The first 68-test affected-suite execution reported all tests passed, but its
   capture wrapper exited 1 because `.quiver/evidence/` did not yet exist. This
   was an evidence-capture failure, not a product-test failure. The directory was
   created and the identical bounded suite was rerun and retained successfully.
7. Independent review reproduced an external write through a pre-existing
   effective-store symlink. Store reads and the exact immutable-write target now
   validate every existing ancestor as a real non-symlink directory before any
   mutation; the new regression proves the external directory remains empty.

## Authorized scope adaptation

Coordinator authorization added `src/create-quiver/commands/ai.js`,
`src/create-quiver/lib/ai/plan-review.js`, and
`src/create-quiver/lib/ai/review-governance.schema.js` to the slice. Call-graph
review showed these were required so the production review command consumes
effective bytes, the budget derives immutable identity under run→phase locks,
and canonical review/meta/WAL retain the same exact record, effective and input
digests. The optional schema field leaves legacy v58 review bytes unchanged when
there is no effective contract.

## Review findings closed before readiness

- `F-A03-01`: canonical `depends_on` and typed `*_refs` are now validated as
  references; dangling removal fails and repaired dependency removal passes.
- `F-A03-02`: canonical operation/identity ordering uses explicit code-unit
  comparison, with permutation coverage for case-sensitive IDs.
- `F-A03-03`: request-envelope factories receive held-lock ownership and do not
  recursively reacquire run or phase locks.
- `F-A03-04`: a symlinked effective-contract store now fails `UNSAFE_PATH`
  before any external file or directory is created.

Independent terminal review remains separate from this author evidence.
