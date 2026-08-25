# PR — QUIVER-58-01 Phase-aware Blocking Policy

## Title

QUIVER-58-01: add phase-aware review governance

## Summary

Implements the first v58 runtime slice. Canonical structured findings, effective governance profile, explicit actor authorization, and versioned phase policy now determine whether a plan review blocks. Invalid, stale, foreign-run, downgraded, closed-run, or unauthorized state fails before governance mutation, while prior valid review state remains intact.

## PR Policy

- One functional slice, one commit, and one PR.
- Source branch: `feature/QUIVER-58-01-v58-phase-aware-blocking-policy`.
- Target branch: `main`, as frozen by this slice and the current repository default branch.
- Human review and merge are mandatory; auto-merge is not authorized.
- slice-02 must not start before this PR is merged.

## Scope

- Add shared schema-valid governance configuration and granular runtime ignores.
- Resolve CLI/config profiles, sensitive-category forcing, policy identity, and anti-downgrade.
- Separate verified provider identity from explicit default-deny bindings, roles, action rules, and independence.
- Validate provider review evidence strictly and preserve the last valid state after invalid output.
- Reconcile stable canonical finding identity, reopen events, supersession, and ambiguity failures.
- Compute phase-aware blockers and phase-separated projections from canonical fields.
- Enforce run ownership, correlation, closed-run rejection, and lock-safe review/approval transitions.
- Apply common redaction to provider and review evidence surfaces.
- Close and evidence AC-01 through AC-06 plus the slice-01 subset of AC-14.

Out of scope: review budgets, conditioned decisions, final digest-bound decision commits, downstream finding transfer, migration/rollback machinery, release/deployment, v59, and v60.

## Files

Production:

- `src/create-quiver/lib/ai/review-governance.js`
- `src/create-quiver/lib/ai/review-governance.schema.js`
- `src/create-quiver/lib/ai/plan-review.js`
- `src/create-quiver/lib/ai/providers.js`
- `src/create-quiver/lib/ai/artifacts.js`
- `src/create-quiver/lib/ai/run-state.js`
- `src/create-quiver/lib/locks.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/config.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/init-layout.js`
- `src/create-quiver/lib/init-docs.js`
- `src/create-quiver/lib/doctor.js`

Validation:

- Focused tests under `tests/lib/` and `tests/commands/` declared by `slice.json`, including the directly affected existing-config init assertion in `tests/commands/init-profiles.test.js`.
- Closure, evidence, status, execution-plan, and PR artifacts under `specs/quiver-v58-risk-aware-review-governance/**`.

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`, npm, Git, and a Unix-compatible shell.
- Install the branch dependencies with `npm ci` in a fresh checkout/worktree.
- The recorded isolated-worktree run reused the already installed main-checkout dependencies through a temporary untracked `node_modules` symlink. That symlink was removed before commit and no dependency file changed.
- GitHub CLI authentication is needed only to exercise the live GitHub identity adapter; unit tests stub that boundary.

### Worktree Access

```bash
git fetch origin feature/QUIVER-58-01-v58-phase-aware-blocking-policy
git worktree add --detach ../quiver-58-01-review origin/feature/QUIVER-58-01-v58-phase-aware-blocking-policy
cd ../quiver-58-01-review
npm ci
```

### Run the Project

This repository exposes a CLI rather than a long-running application:

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js ai review-plan --help
```

Do not run a live provider mutation against a production repository for PR verification; the directed tests use isolated temporary projects and provider stubs.

### Use Cases

#### Case 1: Resolve config and effective profile

```bash
node --test --test-name-pattern='default governance config|profile resolution' tests/lib/ai-review-governance.test.js
```

Expected: valid defaults preserve compatible keys, sensitive categories force `high-assurance`, and an active run cannot downgrade.

#### Case 2: Reject invalid or unauthorized governed review state

```bash
node --test --test-name-pattern='governed review preserves|governed approval is default-deny' tests/commands/ai-review-plan.test.js
```

Expected: invalid provider output preserves the last valid review, and authorization denies before approval mutation unless an explicit binding and action rule match.

#### Case 3: Preserve run isolation and lock ordering

```bash
node --test tests/lib/ai-run-state.test.js
```

Expected: governed state remains run-correlated, phase transitions share the run lock, and asynchronous callbacks retain lock ownership until completion.

#### Case 4: Verify the complete slice contract

Run the full directed command from the next subsection. Expected result: 200 tests pass and none fail.

### Technical Verification

```bash
node --test tests/lib/ai-review-governance.test.js tests/lib/ai-providers.test.js tests/lib/ai-artifacts.test.js tests/lib/ai-run-state.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js tests/lib/doctor.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-plan.test.js tests/commands/cli-contract.test.js tests/commands/config-language.test.js tests/commands/doctor.test.js tests/commands/init-profiles.test.js
npm test
node scripts/ci/check-slice-schema.js
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-01-phase-aware-blocking-policy/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
npm run docs:check
npx --no-install markdownlint-cli2 specs/quiver-v58-risk-aware-review-governance/EVIDENCE_REPORT.md specs/quiver-v58-risk-aware-review-governance/EXECUTION_PLAN.md specs/quiver-v58-risk-aware-review-governance/SPEC.md specs/quiver-v58-risk-aware-review-governance/STATUS.md specs/quiver-v58-risk-aware-review-governance/pr.md specs/quiver-v58-risk-aware-review-governance/slices/slice-01-phase-aware-blocking-policy/CLOSURE_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-01-phase-aware-blocking-policy/pr.md
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-01-phase-aware-blocking-policy/slice.json
git diff --check
```

## Evidence

- Directed runtime suite: 200 passed, 0 failed.
- Full portable regression: 819 passed, 0 failed.
- Slice schema: 309 current runtime fixtures valid.
- Local slice gate and strict seven-slice spec validation: passed.
- Repository docs check and direct lint of the changed spec Markdown: passed.
- Scope assertion: 34 changed paths, 0 outside `allowed_write_paths`.
- Independent governance/security review: approved with no mandatory findings pending.
- Independent final code review: approved; 77-test focal suite passed and cross-process review/close exclusion was reproduced.
- Full traceability and exact validation commands are in `CLOSURE_BRIEF.md` and `EVIDENCE_REPORT.md`.

## Rollback

After merge, revert the merge or squash commit without rewriting history:

```bash
git revert <merge-or-squash-commit-sha>
```

This slice adds no database migration, remote resource, release, or deployment state. Reverting the code and documentation commit restores the prior ungoverned plan-review behavior; existing `.quiver` runtime artifacts should be retained for diagnosis and must not be rewritten as legacy evidence.

## Risks / Notes

- The complete exact-byte digest-bound decision transaction remains assigned to slice-04; this PR implements only the authorization, blocker, correlation, and locking safeguards declared by slice-01.
- Automatic source and capture timing for run creator, reviewer, and executor remain undefined and unassigned. No implicit values are synthesized; slice-04 owns only decision-time actor revalidation and ledger recording.
- Budget accounting, conditioned decisions, finding transfer, migration, rollback readers, and cross-command projection closure remain pending in slices 02 through 06.
- Human merge is required. No release, publish, deployment, or auto-merge is included.
- Post-PR CI required one scope-only amendment for `tests/commands/init-profiles.test.js`; it updates the historical expectation to preserve existing keys while accepting the required governance namespace.
