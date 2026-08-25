# CLOSURE_BRIEF — slice-02 Review Budget and Circuit Breaker

Status: Completed

Completed at: 2026-08-25T14:45:12Z

## Summary

The v58 review-budget slice is implemented and validated. Quiver now reserves semantic review capacity atomically before provider invocation, derives per-run counts from an append-only ledger, distinguishes valid, invalid-output, and pre-payload retry outcomes from an explicit adapter signal, stops before provider execution on exhaustion, and authorizes every extension through the governance oracle. Canonical review persistence is recoverable across interruption and run closure cannot race an in-flight reservation. The implementation PR still requires human review and merge before slice-03 may start.

## Delivered

- Full, targeted, retry, and external events are classified from immutable intent and request-envelope identity; provider prose cannot reclassify an attempt.
- Full and targeted reservations consume policy-derived per-run capacity under the run lock before provider invocation; pending reservations prevent concurrent overspend.
- A provider adapter marks contractual payload receipt explicitly. Pre-payload transport failures become non-consuming retries, while received invalid contractual output consumes its reservation and preserves the last valid review.
- Event-derived counters distinguish reviews, full revisions, targeted amendments, retries, invalid output, and authorized extensions without trusting mutable aggregates.
- Exhaustion returns `REVIEW_BUDGET_EXHAUSTED` and `HUMAN_DECISION_REQUIRED`, projects exactly the five governed next actions, and makes no provider call or automatic decision.
- Budget extension re-resolves actor identity, applies the versioned `extend-review-budget` rule, and records authorization and policy evidence in an immutable audit event.
- Canonical reviews and valid ledger outcomes must correlate one to one before a new reservation or extension; unverifiable legacy history fails closed for explicit migration in slice-06.
- A redacted, digest-bound, run-scoped commit marker recovers canonical governance state, valid outcome, review projections, metadata, and phase idempotently after interruption.
- Approval, extension, later review mutation, and close recover pending commits first. Close remains under the run lock and rejects pending provider reservations.
- Human and JSON budget views use the same canonical ledger projection, and simultaneous runs retain independent review and budget state.

## Acceptance evidence

| Criterion | Evidence | Result |
|---|---|---|
| AC-07 | Deterministic classes, atomic reservations, concurrent boundary, exhaustion-before-provider, strict payload receipt, invalid-output consumption, retry accounting, five next actions, and authorized extension tests | Passed |
| AC-08 | Foreign-run rejection, independent multi-run ledgers, run-scoped recovery markers, exact review/outcome correlation, and provider/close race tests | Passed for review and budget state |
| AC-12 | Human and JSON budget totals derived from the canonical event fold, with mutated caller aggregates ignored | Passed for budget-count projection; final decision representation remains assigned to later slices |

## Validation

All required commands completed with exit code 0:

```bash
node --test tests/lib/ai-review-budget.test.js tests/lib/ai-review-governance.test.js tests/lib/ai-providers.test.js tests/lib/ai-run-state.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-run-state.test.js
npm test
node scripts/ci/check-slice-schema.js
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
npm run docs:check
npx --no-install markdownlint-cli2 specs/quiver-v58-risk-aware-review-governance/EVIDENCE_REPORT.md specs/quiver-v58-risk-aware-review-governance/EXECUTION_PLAN.md specs/quiver-v58-risk-aware-review-governance/STATUS.md specs/quiver-v58-risk-aware-review-governance/pr.md specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/EXECUTION_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/CLOSURE_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/pr.md
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/slice.json
git diff --check
```

Results:

- Directed slice suite: 111 tests passed, 0 failed.
- Full portable regression: 847 tests passed, 0 failed.
- Local slice gate and strict seven-slice spec validation: passed.
- Slice schema, repository docs, direct Markdown, PR handoff, and whitespace gates: passed.
- Independent governance/security review: approved; its separate exact slice suite passed 111 tests.
- Independent final slice review: approved with all four mandatory review findings closed.

## Scope evidence

- Runtime, tests, and package documentation remain inside `allowed_write_paths` from this slice.
- The provider adapter and its focused test were added to the declared read/write scope before closure because payload receipt is the normative boundary between retry and semantic consumption.
- No conditioned approval, final digest-bound decision, downstream transfer, generalized external import, migration writer, release, deployment, v59, or v60 behavior was added.
- `npm ci` materialized the committed lockfile in the isolated worktree for validation; no dependency manifest or lockfile changed.

## Deviations

- No acceptance or architecture deviation remains open.
- Production review identified four durability and correlation gaps: contractual-stream ambiguity, unverified legacy review history, interruption between canonical review and ledger outcome, and close racing an in-flight provider. The implementation and slice handoff were strengthened within AC-07/AC-08 to fail closed and recover idempotently; both independent reviewers verified the corrections.
- Legacy canonical reviews without correlated v58 ledger outcomes are not silently backfilled. Explicit migration and legacy projection remain assigned to slice-06, as frozen by the package contract.

## Risks and pending work

- Human review and merge of this implementation PR remain mandatory.
- Approved-with-conditions, final decision digest binding, downstream transfer, explicit migration/rollback, and cross-command projection closure remain in slices 03 through 06.
- The complete external-review import workflow remains intentionally excluded; this slice implements only deterministic event classification and accounting.

## Definition of done

- AC-07: satisfied.
- AC-08 review/budget subset: satisfied.
- AC-12 budget-count subset: satisfied.
- Directed, full-regression, schema, slice, strict-spec, docs, PR, diff, and independent-review evidence: passed.
- Next dependency state: slice-03 contract ready, execution gated by human review and merge of the slice-02 PR.
