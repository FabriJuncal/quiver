# CLOSURE_BRIEF — slice-04 Digest-bound Approvals

Status: Completed

Completed at: 2026-08-27T19:20:53Z

## Summary

Quiver now publishes governed acceptance and technical-plan decisions from an explicit run as canonical, digest-bound records. The commit rereads exact artifact, input, review, policy, profile, disposition, reason, count, run, and actor state under the run-to-planner lock order, then writes the run artifact, governance ledger, approval projection, compatible unconditional legacy projection, and phase transition through a durable recovery marker. Any failed write rolls every target back; readers and planner writers fail closed while recovery is pending.

The singular `ai approval show|verify|export` commands verify and render the same canonical decision. `approved-with-conditions` remains distinct, retains reviewer non-approval, and never creates the legacy technical-plan `approved.md` projection.

## Delivered

- Added a strict canonical final-decision schema and stable decision digest in the run governance ledger.
- Bound decisions to run, phase, version, exact artifact and canonical input bytes, current technical review, effective profile and controls, policy identity, complete canonical finding count, raw acceptance collection count, current dispositions, bounded reason, and current authorized actor evidence.
- Re-resolved identity and re-evaluated authorization and independence inside the protected commit section.
- Added one run-scoped write-ahead recovery marker containing verified before/after snapshots for every target; the run phase is written last and the marker is durably removed only after every target succeeds.
- Enforced the exact ordered target allowlist before normal publication and again during recovery; foreign paths, roles, reordered targets, and symlinked namespaces are rejected before mutation.
- Added deterministic rollback and idempotent recovery for interruption after prepare, artifact, governance, run projection, legacy projection, phase, or immediately before WAL cleanup.
- Made run/governance/planner readers and legacy planner writers fail closed while a matching approval WAL exists.
- Fixed run state, requirement, governance, approval projection, and approval artifact reads to their canonical run namespace with run-id correlation and no-follow path checks.
- Applied textual and structured redaction checks to exact artifact/input bytes and every WAL snapshot. Schema-valid authorization evidence is checked leaf-by-leaf as a root value; unsafe bytes block rather than being rewritten.
- Made governed technical-plan planning and every repeated revision consume a verified acceptance input and immutable draft owned by the same run. Legacy revise compatibility preserves that acceptance binding across newly persisted drafts instead of rebinding to feedback.
- Preserved historical unconditional draft approval for a run-owned candidate without allowing another run's latest draft or counts to satisfy it.
- Derived `finding_count` from the complete canonical finding collection and `criterion_count` from parsed raw acceptance arrays, never provider aggregates.
- Returned `REPRESENTATION_MISMATCH` for canonical count/projection divergence and `APPROVAL_BINDING_MISMATCH` for stale or tampered bindings.
- Added clean JSON success/failure envelopes, stable exit semantics, human inspection, and exact Linear-comment export.
- Preserved plural `ai approvals` as the compatible planner/run listing command while rejecting foreign, malformed, or downgraded canonical rows, non-historical legacy paths, and hidden symlinked run namespaces.

## Acceptance evidence

| Criterion | Evidence | Result |
|---|---|---|
| AC-08 | Ambiguous active-run rejection, explicit closed-run inspection, and two simultaneous runs approving only their own version, bytes, paths, counts, and phase | Passed |
| AC-09 | Exact byte digests, current actor/policy recheck, conditioned and unconditional commit, post-publication tampering, seven injected failure points, reader fail-closed behavior, rollback, and recovery | Passed |
| AC-12 | Raw structured acceptance collections, duplicate representation rejection, canonical decision/projection parity, and distinct representation/binding codes | Passed |
| AC-13 | Approval commit/show/verify/export human and clean JSON contracts, parser/help flags, stable codes/status/exit, and Linear-comment projection | Passed for the approval surfaces owned by this slice; broader cross-command convergence remains slice-06 |

## Validation

Required validation commands:

```bash
node --test tests/lib/approvals.test.js tests/lib/ai-review-governance.test.js tests/lib/ai-run-state.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-run-state.test.js tests/commands/cli-contract.test.js
npm test
node --check src/create-quiver/lib/approvals.js
node --check src/create-quiver/lib/ai/approval-candidates.js
node --check src/create-quiver/lib/ai/plan-review.js
node --check src/create-quiver/lib/ai/review-governance.js
node --check src/create-quiver/lib/ai/review-governance.schema.js
node --check src/create-quiver/lib/ai/run-state.js
node --check src/create-quiver/commands/ai.js
node --check src/create-quiver/index.js
node scripts/ci/check-slice-schema.js
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
npm run docs:check
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/slice.json
git diff --check
```

Executed evidence before final publication:

- Directed slice suite: 171 tests passed, 0 failed.
- Full portable regression: 893 tests passed, 0 failed.
- Relevant JavaScript syntax, local slice, strict seven-slice spec, slice-schema, documentation, command-reference, PR-readiness, scope, and whitespace gates passed.
- Conditioned end-to-end test passed acceptance commit, technical review, candidate creation, exact retry, drift rejection, final publication, verify/export, and reason/disposition tamper detection.
- Atomicity review independently reproduced all seven recovery boundaries and approved the final WAL/lock ordering with no remaining blocker.
- Final security review reproduced canonical-path, symlink, redaction, target-allowlist, cross-run, and normal-publication attacks and ended approved with no blocker.
- Final compatibility review reproduced repeated-revision rebinding, cross-run draft mixing, canonical-row downgrade, and symlink-hidden run namespaces; terminal reaudit ended approved with no blocker.

## Scope evidence

- All implementation, test, and documentation changes remain in `allowed_write_paths`.
- `review-governance.schema.js` and the command registry were added by the explicitly authorized contract amendment.
- `plan-review.js` was added after integration evidence showed that its WAL redaction guard treated newly persisted, schema-validated authorization evidence as an HTTP credential and blocked the canonical acceptance-to-review sequence.
- No downstream finding transfer, migration writer, package rollback mode, release, deployment, v59, or v60 behavior was added.
- `npm ci` materialized the committed dependency lock in the isolated worktree; dependency manifests and lockfiles were not changed.

## Deviations

- The user authorized the canonical ledger location, profile/disposition digest formulas, complete finding and raw criterion counts, singular CLI namespace, compatibility of plural `ai approvals`, and required schema/registry scope on 2026-08-27.
- Canonical authorization evidence is schema-validated and scanned as a root value before only that typed node is omitted from the generic credential-key scan. Provider payloads, unsafe leaf values, arbitrary marker fields, and every untyped `authorization` key remain blocked by the common redaction boundary.
- Independent atomicity review exposed two recovery races: legacy planner writers could invalidate WAL snapshots, and a concurrent recovery could observe an already removed marker. Writers now reject before mutation and recovery treats a missing marker idempotently.
- Final binding review exposed redirectable in-project paths and a normal-publication target-allowlist bypass. Canonical namespaces, no-follow reads, run-id correlation, and pre-WAL marker validation now close both paths.
- CLI contract review exposed missing flag-value guards and incomplete public option help. Relevant value flags now reject a following flag, and help documents the phase and Linear export format without widening generated command documentation.
- Compatibility review exposed a global-current draft leak, feedback rebinding on a second legacy revision, canonical rows accepted under another run, downgrade by field removal, and symlinked namespaces omitted by plural listing. Revision inputs now retain one run identity across cycles, and the plural reader validates canonical versus historical representations before rendering.

## Risks and pending work

- Human review and merge of this implementation PR remain mandatory.
- Slice-05 owns referential finding transfer into specs, slices, PRs, and gates.
- Slice-06 owns migration, package rollback/read mode, and full cross-command projection convergence.
- Existing dependency audit findings remain outside this slice; no dependency manifest or lockfile changed.

## Definition of done

- AC-08 run-isolation subset: satisfied.
- AC-09: satisfied.
- AC-12 approval-representation subset: satisfied.
- AC-13 approval-surface subset: satisfied.
- Directed, full-regression, syntax, schema, docs, slice, strict-spec, PR, whitespace, and independent-review evidence: required to pass before commit.
- Next dependency state: slice-05 becomes executable only after human review and merge of this slice-04 PR.
