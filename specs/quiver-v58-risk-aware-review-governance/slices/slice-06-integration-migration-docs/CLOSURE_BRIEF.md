# CLOSURE_BRIEF — slice-06 Integration, Migration, and Documentation

Status: Completed

Completed at: 2026-08-31T18:48:54Z

## Summary

Quiver v58 now exposes one canonical governance projection across approval, flow, status, resume, export, generation, and readiness surfaces. Equivalent state produces stable nonlocalized machine keys, statuses, enums, codes, and exit semantics, while human output remains localizable and JSON stdout remains a single clean document.

Legacy projects are inspected without write-on-read or invented evidence. The existing migration command provides no-write preview, confirmed apply with post-write verification, and idempotent no-write reapply. Tracked compatibility metadata supports a fail-closed read-only rollback mode and blocks older active or declared writers without destructively rewriting governed records.

## Delivered

- Added schema-validated `governance.compatibility` metadata with schema version 1, `writer_mode`, and monotonic `minimum_writer_version`.
- Added read-only compatibility inspection states `none`, `legacy-unverified`, `v58-verified`, and `rollback-read-only`.
- Preserved incomplete legacy evidence with null unavailable counts and `LEGACY_EVIDENCE_UNVERIFIED`; legacy reads neither write nor advance governed phases.
- Added migration preflight, no-write dry-run, confirmed apply, post-write verification, independent `doctor --json` verification, and zero-write `already-current` reapply.
- Allowed only the explicit migration writer to consume `legacy-unverified` preflight evidence, with a repeated full preflight, snapshot comparison, and independent writer/dependency checks before its first write; every other governed writer remains blocked.
- Kept migration, verification, and rollback inside existing command and configuration surfaces; no new namespace or destructive downgrade was introduced.
- Disabled supported v58 writers with `GOVERNANCE_READ_ONLY` in rollback mode while leaving compatible readers and gates available and fail-closed.
- Blocked an older active writer or older declared local dependency with `UNSAFE_WRITER_DOWNGRADE`, including when rollback mode is also active.
- Returned `MIGRATION_VERIFICATION_FAILED` for invalid or inconsistent config, state, or package evidence without partial mutation.
- Routed approval, approvals, flow, status, resume, export, spec, slice, and PR boundaries through the shared compatibility and governance projections.
- Preserved exact approval-commit recovery: a prepared WAL may be repaired before the rollback guard, but the requested new write still fails read-only and publishes no decision.
- Applied the shared redaction and safe contractual-data boundary to persisted, rendered, exported, and raw governance evidence.
- Updated CLI, migration, rollback, troubleshooting, legacy-project, full-workflow, command-reference, and AI-onboarding documentation without claiming release or deployment.

## Acceptance evidence

| Criterion | Evidence | Result |
|---|---|---|
| AC-13 | Projection parity, clean JSON stdout, stable codes/statuses/exits, i18n audit, and readiness/generation boundary fixtures | Passed |
| AC-14 | Existing governed redaction suites plus migration, projection, approval-recovery, export, and unsafe contractual-data cases | Passed |
| AC-15 | Legacy no-write reads, null unavailable counts, dry-run/apply/post-verify/reapply, invalid metadata, and tamper fixtures | Passed |
| AC-16 | Read-only readers/writers/gates, active and declared downgrade guards, WAL recovery, directed cross-slice regression, and operator docs | Passed |
| AC-01 through AC-12 | Directed regressions for the previously delivered profiles, findings, budgets, decisions, approvals, transfer, generation, and gates | Passed |

## Validation

Executed with exit code 0:

```bash
node --test tests/commands/ai-export.test.js tests/commands/ai-run-state.test.js tests/commands/cli-contract.test.js tests/commands/doctor.test.js tests/commands/flow.test.js tests/commands/init-profiles.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/ai-export-state.test.js tests/lib/ai-run-state.test.js tests/lib/ai-review-governance.test.js tests/lib/doctor.test.js tests/lib/init-docs.test.js tests/lib/init-layout.test.js tests/lib/i18n-catalog.test.js
node --test tests/lib/ai-review-budget.test.js tests/lib/ai-spec-generator.test.js tests/lib/check-slice.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-pr.test.js tests/commands/analyze.test.js tests/commands/demo.test.js tests/commands/findings.test.js tests/commands/spec-create.test.js
node scripts/ci/smoke-cross-platform.js
npm test -- --test-reporter=tap
node --check src/create-quiver/index.js
node --check src/create-quiver/commands/flow.js
node --check src/create-quiver/lib/ai/export-state.js
node --check src/create-quiver/lib/ai/review-governance.js
node --check src/create-quiver/lib/ai/review-governance.schema.js
node --check src/create-quiver/lib/ai/run-state.js
node --check src/create-quiver/lib/demo.js
node --check src/create-quiver/lib/i18n/messages/en.js
node --check src/create-quiver/lib/i18n/messages/es.js
node --check src/create-quiver/lib/init-docs.js
node --check src/create-quiver/lib/state.js
npm run schema:slice:check
npm run docs:check
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
node bin/create-quiver.js slice scope specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json --base main
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json
git diff --check
```

Final local evidence, including post-CI remediation:

- Primary slice suite: 201 tests passed, 0 failed.
- Expanded affected-boundary suite: 185 tests passed, 0 failed.
- Full portable regression: 944 tests passed, 0 failed.
- Cross-platform smoke passed locally after exercising a true pre-v58 fixture with both state and compatibility metadata absent.
- All 11 changed JavaScript entry points, libraries, catalogs, and template modules passed syntax validation.
- Migration integration covered no-write dry-run, verified apply, no-write reapply, invalid JSON, rollback-current reapply, rollback delta rejection, active older writer, and declared older dependency.
- Rollback integration proved readers remain available, gates fail closed, writers make no mutation, and JSON failures contain one document with empty stderr.
- Approval-recovery integration proved an exact prepared WAL is removed and rolled back before the new writer receives `GOVERNANCE_READ_ONLY`; no decision, store, or phase advance is published.
- Independent command-boundary review reproduced the compatibility, rollback, recovery, tamper, downgrade, and JSON contracts and ended approved with no material blockers.
- Publication reference: [PR #144](https://github.com/FabriJuncal/quiver/pull/144), sourced from the single slice branch commit and pending human merge.

Directed fixture identifiers:

- `tests/commands/ai-run-state.test.js` — `status, resume, approvals, export, and flow share one canonical governance projection`.
- `tests/commands/ai-run-state.test.js` — `rollback recovers a prepared approval WAL before blocking the requested writer`.
- `tests/commands/init-profiles.test.js` — `migration JSON is no-write on preview, verified on apply, idempotent on reapply, and rollback-safe`.
- `tests/commands/doctor.test.js` — `doctor diagnoses missing governance and requires explicit migration without rewriting config`.
- `tests/commands/cli-contract.test.js` — `ai approvals --json emits one canonical projection without stderr` and `spec create --json emits one machine error document without stderr`.
- `tests/lib/ai-review-governance.test.js` — `compatibility metadata is strict, monotonic, and blocks read-only or older writers`.
- `tests/lib/ai-run-state.test.js` — `an advanced unbound legacy run stays unverifiable after migration and cannot advance or rebind`.

Recorded contract samples:

- Human no-run projection: `Status: no active run` and `Next safe command: npx create-quiver ai run create --input <requirements.md>`.
- JSON no-run projection: `schema_version: 1`, `task: approval-status`, `status: no-active-run`, `projection.kind: quiver-run-governance-projection`, `projection.compatibility: none`, null governed counts, and one clean stdout document.
- Migration apply/reapply: `status: applied` with `post_verification.status: passed` and compatibility `v58-verified`; then `status: already-current`, `writes: 0`.
- Rollback/downgrade failures: `GOVERNANCE_READ_ONLY` or `UNSAFE_WRITER_DOWNGRADE`, exit 1, empty stderr, and unchanged snapshots.
- Persisted compatibility shape: `{ "schema_version": 1, "writer_mode": "read-write", "minimum_writer_version": "0.17.6" }`; rollback changes only `writer_mode` to `read-only`.

## Scope evidence

- All 41 tracked production, test, CI fixture, documentation, and spec-package changes are declared by `allowed_write_paths`.
- The authorized minimum scope amendment added the shared governance schema/runtime, direct downstream command tests, demo initializer, cross-platform migration smoke, troubleshooting workflow, and legacy-project workflow needed by observed regressions.
- The generic feature-branch guide names `develop`, but the approved v58 package records its repository-state exception in slice-00 and every slice declares `main`; slice-06 preserves that accepted target and still requires human review.
- No dependency manifest, lockfile, release, publish, deployment, OTA, v59, or v60 file changed.

## Deviations

- Authorized on 2026-08-31 before implementation: persist the exact compatibility contract, use existing migrate and doctor surfaces, use tracked read-only rollback, return the four stable compatibility codes, enforce the supported writer boundary, and add only the direct files needed for that contract.
- Recovery of an already prepared approval WAL is allowed before the read-only guard only to restore the pre-transaction state. The requested approval remains blocked and cannot use recovery as a general writer bypass.
- Full regression exposed stale current-governance fixtures in AI plan/review, analyze, spec-create, and export tests plus demo initialization without compatibility metadata. Fixtures and the demo initializer were aligned with the v58 contract; no acceptance or architecture scope changed.
- The first full regression failed only because the documentary status `in-progress` is not a valid slice-schema enum. Closure metadata was completed and the repeated full regression passed 944 tests.
- Initial PR CI exposed a stale cross-platform legacy fixture that removed state but retained verified compatibility metadata. The fixture now removes both v58 evidence elements. Focused review then found evidence and dependency drift windows between preflight and the first write; repeated preflight, snapshot comparison, and immediate dependency revalidation close both windows. The two direct regressions, 15-test migration library suite, 24-test migration command suite, and local cross-platform smoke pass.

## Risks and pending work

- Human review and merge of this implementation PR remain mandatory; auto-merge is not authorized.
- The guard covers Quiver's supported current command path and the tracked dependency declaration. Deliberate execution of an untracked pre-guard binary remains an operational package-control concern documented for operators.
- Release, package publication, deployment, and OTA were not performed and remain outside this slice.

## Definition of done

- AC-13 through AC-16: satisfied.
- Regression evidence for AC-01 through AC-12: passed.
- Directed, expanded, cross-platform smoke, full-regression, syntax, schema, docs, local-slice, strict-spec, scope, PR-readiness, whitespace, and independent-review evidence: required to pass before publication.
- Package implementation state: complete; human PR review and merge remain the final repository gate.
