# PR — QUIVER-58-04 Digest-bound Approvals

## Title

QUIVER-58-04: publish atomic digest-bound approval decisions

## Summary

Publishes governed acceptance and technical-plan approvals as canonical run-scoped decisions bound to exact bytes, current policy/profile/review/count/disposition/reason state, and a currently authorized actor. A durable WAL makes the decision, projections, and phase transition all-or-nothing. The same record powers human/JSON show and verify plus Linear-comment export.

## PR policy

- Source: `feature/QUIVER-58-04-v58-digest-bound-approvals`.
- Target: `main`.
- One functional slice, one commit, and one PR.
- Human review and merge are mandatory; auto-merge is not authorized.
- Slice-05 must not start before this PR is merged.

## Scope

- Strict final-decision schema and deterministic decision/profile/disposition digests.
- Exact-byte artifact and canonical-input validation under run-to-planner locking.
- Commit-time identity, authorization, independence, policy, review, count, disposition, and reason revalidation.
- Durable before/after snapshots, rollback, fail-closed readers/writers, and idempotent recovery.
- Exact pre-publication/recovery target allowlists, canonical no-follow run namespaces, and run-id correlation.
- Textual plus structured secret blocking for approval bytes and WAL snapshots, with typed authorization evidence preserved only after leaf validation.
- Distinct final `approved-with-conditions` publication without legacy `approved.md`.
- Singular `ai approval show|verify|export` and clean machine envelopes; compatible plural listing retained.
- Same-run draft and acceptance bindings across repeated technical-plan revisions; foreign/downgraded projection rows and symlink-hidden run namespaces fail closed.
- Directed coverage for tampering, staleness, representation divergence, all write failures, recovery, conditioned retry/drift, and multi-run isolation.

Out of scope: finding transfer and downstream gates, migration, rollback package mode, release/deploy, v59, and v60.

## Files

Production:

- `src/create-quiver/commands/ai.js` and `src/create-quiver/index.js`
- `src/create-quiver/lib/approvals.js`
- `src/create-quiver/lib/ai/approval-candidates.js`
- `src/create-quiver/lib/ai/plan-review.js`
- `src/create-quiver/lib/ai/review-governance.js` and `review-governance.schema.js`
- `src/create-quiver/lib/ai/run-state.js`
- `src/create-quiver/lib/cli/command-registry.js`

Validation and handoff:

- Approval, governance, run-state, plan, review-plan, and CLI contract tests declared by `slice.json`.
- Spec, status, evidence, execution, closure, and PR artifacts under `specs/quiver-v58-risk-aware-review-governance/**`.

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js `>=20.12.0`, npm, Git, and a Unix-compatible shell.
- Install the committed dependency tree with `npm ci`.
- No live provider or GitHub identity is required; directed tests use isolated temporary repositories and injected provider/identity boundaries.

### Worktree Access

```bash
git fetch origin feature/QUIVER-58-04-v58-digest-bound-approvals
git worktree add --detach ../quiver-58-04-review origin/feature/QUIVER-58-04-v58-digest-bound-approvals
cd ../quiver-58-04-review
npm ci
```

### Run the Project

Quiver exposes a CLI rather than a long-running service:

```bash
node bin/create-quiver.js --help
node bin/create-quiver.js ai approval show --help
```

### Use Cases

#### Case 1: Digest-bound approval and recovery

Run the directed suite:

```bash
node --test tests/lib/approvals.test.js tests/lib/ai-review-governance.test.js tests/lib/ai-run-state.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-run-state.test.js tests/commands/cli-contract.test.js
```

Expected: 171 tests pass, including exact bindings, seven WAL failure boundaries, rollback/recovery, conditioned publication, inspection/export, multi-run isolation, repeated revision, projection downgrade, and symlink rejection.

#### Case 2: Portable regression

```bash
npm test
```

Expected: 893 tests pass with no failures.

### Technical Verification

```bash
node --check src/create-quiver/lib/approvals.js
node --check src/create-quiver/lib/ai/approval-candidates.js
node --check src/create-quiver/lib/ai/plan-review.js
node --check src/create-quiver/lib/ai/review-governance.js
node --check src/create-quiver/lib/ai/review-governance.schema.js
node --check src/create-quiver/lib/ai/run-state.js
node --check src/create-quiver/commands/ai.js
node --check src/create-quiver/index.js
npm run schema:slice:check
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
npm run docs:check
npx --no-install markdownlint-cli2 specs/quiver-v58-risk-aware-review-governance/EVIDENCE_REPORT.md specs/quiver-v58-risk-aware-review-governance/EXECUTION_PLAN.md specs/quiver-v58-risk-aware-review-governance/SPEC.md specs/quiver-v58-risk-aware-review-governance/STATUS.md specs/quiver-v58-risk-aware-review-governance/pr.md specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/EXECUTION_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/CLOSURE_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/pr.md
node bin/create-quiver.js slice scope specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/slice.json --base main
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/slice.json
git diff --check
```

## Evidence

- Directed slice suite: 171 passed, 0 failed.
- Full portable regression: 893 passed, 0 failed.
- JavaScript syntax, slice schema/local check, strict spec, documentation, Markdown, scope, PR-readiness, and whitespace gates passed.
- Independent atomicity, conditioned-flow, security, binding, compatibility, and traceability reviews ended approved with no blocker.
- Exact commands and covered behavior are recorded in `CLOSURE_BRIEF.md` and `EVIDENCE_REPORT.md`.

## Reviewer checks

- Verify all binding sources are reread inside the protected commit callback.
- Inject each WAL fault point and confirm every target equals its prior snapshot.
- Confirm a pending WAL blocks readers and global planner writers before mutation.
- Confirm conditioned publication never creates technical-plan legacy `approved.md`.
- Tamper artifact, reason, disposition, decision, projection, and counts; verify stable fail-closed codes.
- Confirm two active runs publish only their own candidate and explicit inspection remains available after close.
- Revise one of two active runs twice and confirm neither its draft nor acceptance binding can switch to the other run or to feedback.
- Remove canonical projection fields, redirect its artifact to another run, or symlink a run namespace; confirm plural listing fails closed while a valid historical row remains readable.
- Redirect run paths or WAL targets and confirm canonical namespace and pre-publication allowlists fail before mutation.
- Insert textual, structured, or authorization-leaf secrets and confirm no approval artifact or WAL is published.
- Confirm JSON stdout is one parseable, non-localized document and failures exit nonzero.

## Rollback

After merge, revert the merge or squash commit without rewriting history:

```bash
git revert <merge-or-squash-commit-sha>
```

Do not manually delete or rewrite `.quiver/runs/**` evidence. If an approval WAL exists, use the supported recovery path before retrying a writer. Slice-06 will own package rollback/read-mode policy.

## Risks / Notes

- Human merge is required; no release, publish, deployment, or auto-merge is included.
- Canonical decisions are additive evidence; this slice does not implement legacy migration or downgrade rewriting.
- The plan-review compatibility adjustment exempts only schema-valid authorization evidence from generic credential-key redaction.
