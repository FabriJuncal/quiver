# PR — QUIVER-58-03 Approved with Conditions

## Title

QUIVER-58-03: add deterministic conditioned approval candidates

## Summary

Implements the v58 approved-with-conditions eligibility lifecycle. Quiver now evaluates complete canonical dispositions against a versioned default-deny policy, validates actor and bounded reason evidence, and persists an explicitly non-final candidate whose reviewer recommendation remains visible. It fails closed without mutation for protected Critical, stale, duplicate, missing, unauthorized, non-transferable, unresolved, or tampered state.

Final decision publication, exact-byte digest binding, run approval append, and phase advancement remain assigned to slice-04.

## PR Policy

- One functional slice, one commit, and one PR.
- Source branch: `feature/QUIVER-58-03-v58-approved-with-conditions`.
- Target branch: `main`, as frozen by this slice and the repository default branch.
- Human review and merge are mandatory; auto-merge is not authorized.
- slice-04 must not start before this PR is merged.

## Scope

- Add strict canonical disposition, eligibility evaluation, and conditioned candidate records to the run governance store.
- Apply the authorized stable-code precedence and protected Critical behavior.
- Evaluate exact condition-policy selectors with default deny, allow-only union semantics, and no implicit release allowance.
- Require exactly one current disposition per open finding, explicit supersession, target shape, and evidence obligations.
- Re-resolve or consume the decision actor, authorize `approve-with-conditions`, and retain sanitized identity failure evidence.
- Store the decision reason as repository-relative path plus digest, without copying full text.
- Correlate dispositions, evaluations, candidates, policies, actors, reviews, and frozen reviewer recommendation.
- Reject legacy conditioned writes through `approved.md` and preserve additive reads of historical run state.
- Keep successful and failed attempts in `technical-plan-reviewed`, with no final decision or run approval projection.
- Close AC-10 and the conditioned-action, reason-storage, and compatibility subsets of AC-03, AC-14, and AC-15.

Out of scope: public conditioned-decision CLI parser flags, final exact-byte decision publication, phase transition, break-glass bypass, downstream target resolution or propagation, migration writers, rollback mode, release/deployment, v59, and v60.

## Files

Production:

- `src/create-quiver/lib/ai/review-governance.schema.js`
- `src/create-quiver/lib/ai/review-governance.js`
- `src/create-quiver/lib/ai/plan-review.js`
- `src/create-quiver/lib/approvals.js`
- `src/create-quiver/commands/ai.js`

Validation:

- Focused governance, run-state, approval, plan, review-plan, and flow tests declared by `slice.json`.
- Closure, evidence, status, execution-plan, and PR artifacts under `specs/quiver-v58-risk-aware-review-governance/**`.

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`, npm, Git, and a Unix-compatible shell.
- Install the exact branch dependencies with `npm ci` in a fresh checkout or worktree.
- No live GitHub identity, provider, or production repository is needed; the directed tests use isolated temporary projects and injected identity/provider boundaries.

### Worktree Access

```bash
git fetch origin feature/QUIVER-58-03-v58-approved-with-conditions
git worktree add --detach ../quiver-58-03-review origin/feature/QUIVER-58-03-v58-approved-with-conditions
cd ../quiver-58-03-review
npm ci
```

### Run the Project

This repository exposes a CLI rather than a long-running application:

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js ai approve --help
```

The public parser for conditioned-decision input flags is intentionally deferred to slice-04. Do not perform a live governed mutation to verify this PR.

### Use Cases

#### Case 1: Verify policy and eligibility precedence

```bash
node --test --test-name-pattern='condition policy|condition eligibility|condition disposition replacement' tests/lib/ai-review-governance.test.js
```

Expected: default-deny union matching, release denial, exact failure precedence, and explicit disposition supersession pass.

#### Case 2: Verify candidate persistence and fail-closed authorization

```bash
node --test --test-name-pattern='conditioned approval' tests/commands/ai-review-plan.test.js
```

Expected: the eligible path persists only a non-final candidate; protected Critical and identity failures preserve stable codes, mutate nothing, and never advance the phase.

#### Case 3: Verify tamper and legacy safety

```bash
node --test --test-name-pattern='conditioned approval persists only|legacy planner approval writer|legacy run governance state' tests/commands/ai-review-plan.test.js tests/lib/approvals.test.js tests/lib/ai-review-governance.test.js
```

Expected: actor/review/policy/recommendation tampering is rejected, conditioned state cannot create `approved.md`, and historical state receives empty additive collections without an invented decision.

#### Case 4: Verify the complete slice contract

Run the full directed command below. Expected result: 137 tests pass and none fail.

### Technical Verification

```bash
node --test tests/lib/ai-review-governance.test.js tests/lib/ai-run-state.test.js tests/lib/approvals.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-run-state.test.js tests/commands/flow.test.js
npm test
node scripts/ci/check-slice-schema.js
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
npm run docs:check
npx --no-install markdownlint-cli2 specs/quiver-v58-risk-aware-review-governance/EVIDENCE_REPORT.md specs/quiver-v58-risk-aware-review-governance/EXECUTION_PLAN.md specs/quiver-v58-risk-aware-review-governance/SPEC.md specs/quiver-v58-risk-aware-review-governance/STATUS.md specs/quiver-v58-risk-aware-review-governance/pr.md specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/EXECUTION_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/CLOSURE_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/pr.md
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/slice.json
git diff --check
```

## Evidence

- Directed slice suite: 137 passed, 0 failed.
- Full portable regression: 857 passed, 0 failed.
- Relevant JavaScript syntax checks: passed.
- Local slice, strict spec, schema, docs, Markdown, PR handoff, and whitespace gates: passed.
- Protected Critical, all stable disposition result classes, default-deny/union policy, explicit supersession, identity denial, reason bounding, tamper rejection, and no-publication/no-phase-advance paths are covered.
- Independent governance-core review: approved without actionable observations and independently reproduced the 137-test suite plus structural gates.
- Independent command-boundary follow-up: both mandatory findings resolved; 2 focused tests passed.
- Full traceability and exact commands are recorded in `CLOSURE_BRIEF.md` and `EVIDENCE_REPORT.md`.

## Rollback

After merge, revert the merge or squash commit without rewriting history:

```bash
git revert <merge-or-squash-commit-sha>
```

This slice adds no database migration, remote resource, release, deployment, final decision, or phase transition. Retain `.quiver/runs/**` runtime evidence for diagnosis; do not rewrite disposition/evaluation/candidate state into legacy approval markers.

## Risks / Notes

- slice-04 must revalidate the candidate under the run lock against exact artifact bytes before atomically publishing a decision and advancing the phase.
- slice-05 owns referential target resolution and downstream propagation; slice-06 owns migration and rollback behavior.
- The service-layer conditioned contract is deliberate; public parser flags remain slice-04 scope.
- `npm audit` reported existing dependency findings after installing the committed lockfile; no dependency manifest or lockfile changed here.
- Human merge is required. No release, publish, deployment, or auto-merge is included.
