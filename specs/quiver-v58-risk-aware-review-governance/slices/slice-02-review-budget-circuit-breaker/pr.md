# PR — QUIVER-58-02 Review Budget and Circuit Breaker

## Title

QUIVER-58-02: add run-scoped review budget circuit breaker

## Summary

Implements the v58 semantic review budget. Review attempts now reserve capacity atomically per run before provider execution, derive canonical counts from an append-only ledger, distinguish pre-payload retry from received invalid output through the provider adapter, and stop with governed human actions when exhausted. A recoverable run-scoped commit marker prevents partial canonical review/outcome state, and run closure cannot race an in-flight reservation.

## PR Policy

- One functional slice, one commit, and one PR.
- Source branch: `feature/QUIVER-58-02-v58-review-budget-circuit-breaker`.
- Target branch: `main`, as frozen by this slice and the repository default branch.
- Human review and merge are mandatory; auto-merge is not authorized.
- slice-03 must not start before this PR is merged.

## Scope

- Classify full, targeted, retry, and external budget events from immutable command intent.
- Reserve per-run semantic capacity under the run lock before provider invocation.
- Use an explicit contractual-payload signal to separate non-consuming transport retry from consuming invalid output.
- Derive review, revision, targeted, retry, invalid-output, and extension counts from the event ledger.
- Stop before provider invocation on exhaustion and project the two stable codes plus five governed next actions.
- Re-resolve and authorize the actor for every extension, then retain immutable audit evidence.
- Enforce exact canonical-review/valid-outcome correlation before mutation.
- Recover interrupted review commits idempotently and block close while recovery or a reservation is pending.
- Close AC-07, the review/budget subset of AC-08, and the budget-count subset of AC-12.

Out of scope: conditioned decisions, final digest-bound approval commits, downstream finding transfer, generalized external-review import, legacy migration writers, release/deployment, v59, and v60.

## Files

Production:

- `src/create-quiver/lib/ai/review-budget.js`
- `src/create-quiver/lib/ai/plan-review.js`
- `src/create-quiver/lib/ai/providers.js`
- `src/create-quiver/lib/ai/run-state.js`
- `src/create-quiver/lib/locks.js`
- `src/create-quiver/commands/ai.js`

Validation:

- Focused budget, provider, run-state, and review-plan tests declared by `slice.json`.
- Closure, evidence, status, execution-plan, and PR artifacts under `specs/quiver-v58-risk-aware-review-governance/**`.

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`, npm, Git, and a Unix-compatible shell.
- Install the exact branch dependencies with `npm ci` in a fresh checkout or worktree.
- No live provider, identity mutation, or production repository is needed; the directed tests use isolated temporary projects and stubbed provider/identity boundaries.

### Worktree Access

```bash
git fetch origin feature/QUIVER-58-02-v58-review-budget-circuit-breaker
git worktree add --detach ../quiver-58-02-review origin/feature/QUIVER-58-02-v58-review-budget-circuit-breaker
cd ../quiver-58-02-review
npm ci
```

### Run the Project

This repository exposes a CLI rather than a long-running application:

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js ai review-plan --help
```

Do not run a live governed mutation against a production repository for PR verification.

### Use Cases

#### Case 1: Enforce the atomic per-run budget

```bash
node --test --test-name-pattern='atomic reservation|cross-process reservations|review budgets are isolated' tests/lib/ai-review-budget.test.js
```

Expected: concurrent attempts cannot overspend one run, while separate runs retain independent capacity.

#### Case 2: Distinguish contractual payload from retry

```bash
node --test --test-name-pattern='diagnostic-only success|provider payload failures|pre-payload timeout' tests/commands/ai-review-plan.test.js
```

Expected: diagnostic-only or pre-payload transport failures record a non-consuming retry; received invalid payload consumes the reservation and preserves the last valid review.

#### Case 3: Recover interrupted commits and protect close

```bash
node --test --test-name-pattern='WAL recovers|corrupt or foreign governed review WAL|close rejects an in-flight' tests/commands/ai-review-plan.test.js
```

Expected: every injected commit interruption recovers to exactly one canonical review and one valid outcome; corrupt or foreign markers and in-flight closure fail closed.

#### Case 4: Verify the complete slice contract

Run the full directed command below. Expected result: 111 tests pass and none fail.

### Technical Verification

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

## Evidence

- Directed slice suite: 111 passed, 0 failed.
- Full portable regression: 847 passed, 0 failed.
- Local slice gate and strict seven-slice spec validation: passed.
- Slice schema, repository docs, direct Markdown, PR handoff, and whitespace gates: passed.
- Exact one-to-one review/outcome history, all six fault-injected commit boundaries, corrupt/foreign recovery state, and the provider/close race are covered.
- Independent governance/security review: approved; its separate exact slice suite passed 111 tests.
- Independent final code review: approved with all four mandatory findings closed.
- Full traceability and exact commands are recorded in `CLOSURE_BRIEF.md` and `EVIDENCE_REPORT.md`.

## Rollback

After merge, revert the merge or squash commit without rewriting history:

```bash
git revert <merge-or-squash-commit-sha>
```

This slice adds no database migration, remote resource, release, or deployment state. Retain `.quiver/runs/**` runtime evidence for diagnosis; do not rewrite v58 ledger or recovery records into legacy shapes.

## Risks / Notes

- Legacy canonical reviews without correlated v58 outcomes fail closed and require the explicit migration owned by slice-06.
- Conditioned decisions, final approval digest binding, downstream transfer, migration/rollback readers, and shared cross-command projections remain pending in slices 03 through 06.
- The general external-review import workflow remains excluded; only deterministic event classification/accounting is implemented.
- Human merge is required. No release, publish, deployment, or auto-merge is included.
