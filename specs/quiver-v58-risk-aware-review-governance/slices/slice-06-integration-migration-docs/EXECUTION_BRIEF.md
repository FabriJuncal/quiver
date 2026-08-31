# EXECUTION_BRIEF — slice-06 Integration, Migration, and Documentation

## Context

The final slice reconciles the completed runtime contracts across CLI surfaces, legacy projects, rollback mode, directed integration evidence, and public operator documentation. It does not publish a release.

## Objective

Prove one canonical governance projection across commands, migrate legacy projects without invented evidence, keep rollback fail-closed, and close AC-13 through AC-16 with directed evidence.

## Scope

- Unify approve, approvals, flow, status, resume, export, spec, slice, and PR projections.
- Stabilize human/JSON boundaries, codes, statuses, exits, and i18n behavior.
- Apply the common redaction boundary everywhere governance state can surface.
- Add legacy dual-read and legacy-unverified normalization.
- Make migration explicit, dry-runnable, idempotent, and verifiable.
- Disable writers but retain fail-closed readers and gates in rollback mode.
- Block unsafe older-writer or package downgrade scenarios.
- Add directed end-to-end fixtures and update relevant documentation.

## Authorized compatibility contract

- Persist `governance.compatibility` with schema version 1, `writer_mode`, and monotonic `minimum_writer_version`.
- Use `migrate --dry-run` for preview, confirmed migrate for apply plus post-write verification, and `doctor --json` for independent verification.
- Permit only the explicit migration writer to consume `legacy-unverified` evidence, then repeat the complete preflight and independently recheck writer/dependency compatibility before its first write.
- Return `already-current` without writes on an idempotent reapply.
- Activate rollback by setting the tracked writer mode to `read-only`; do not rewrite governed records.
- Use the stable codes `LEGACY_EVIDENCE_UNVERIFIED`, `GOVERNANCE_READ_ONLY`, `UNSAFE_WRITER_DOWNGRADE`, and `MIGRATION_VERIFICATION_FAILED`.
- Block older writers within the supported Quiver command path and diagnose an older declared local dependency; arbitrary execution of a pre-guard binary remains an operational package-control concern.

## Acceptance Criteria

- AC-13 — Shared CLI and machine contract.
- AC-14 — Consistent redaction and bounded reason storage.
- AC-15 — Additive migration without false advancement.
- AC-16 — Fail-closed rollback and directed validation.
- Regression evidence for AC-01 through AC-12 on their affected paths.

The normative wording and traceability are in ../../SPEC.md.

## Ordered Steps

1. Confirm slices 00 through 05 are completed and reconcile their output contracts.
2. Route all listed surfaces through the canonical governance projection.
3. Stabilize codes, statuses, exit behavior, JSON stdout, and localization boundaries.
4. Audit and complete redaction on every new persistence and output surface.
5. Add dual-read legacy normalization and legacy-unverified status.
6. Add migration dry-run, apply with post-verification, independent doctor verification, and idempotent no-write reapply.
7. Add read-only fail-closed rollback mode and downgrade guard.
8. Execute directed integration fixtures from AC-16.
9. Update CLI, workflow, migration, rollback, and AI onboarding documentation.
10. Reconcile STATUS.md and EVIDENCE_REPORT.md from actual results.

## Expected Files

- src/create-quiver/index.js
- src/create-quiver/commands/flow.js
- src/create-quiver/lib/ai/run-state.js
- src/create-quiver/lib/ai/export-state.js
- src/create-quiver/lib/ai/review-governance.js
- src/create-quiver/lib/ai/review-governance.schema.js
- src/create-quiver/lib/state.js
- src/create-quiver/lib/json.js
- src/create-quiver/lib/doctor.js
- src/create-quiver/lib/demo.js
- src/create-quiver/lib/init-layout.js
- src/create-quiver/lib/init-docs.js
- src/create-quiver/lib/i18n/messages/en.js
- src/create-quiver/lib/i18n/messages/es.js
- scripts/ci/smoke-cross-platform.js
- Relevant tests, fixtures, and public docs listed in slice.json.

## Restrictions

- Do not mutate legacy state on read.
- Do not invent actor, digest, disposition, condition, or approval evidence.
- Do not rewrite governed data into a legacy shape for rollback.
- Do not localize JSON keys, enums, status values, or error codes.
- Do not add a new migrate, verify, rollback, or config command namespace for this contract.
- Do not add release, publish, deploy, or OTA work.
- Do not run unrelated full regression, load, or performance suites without concrete evidence.

## Validation

    node --test tests/commands/ai-export.test.js tests/commands/ai-run-state.test.js tests/commands/cli-contract.test.js tests/commands/doctor.test.js tests/commands/flow.test.js tests/commands/init-profiles.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/ai-export-state.test.js tests/lib/ai-run-state.test.js tests/lib/ai-review-governance.test.js tests/lib/doctor.test.js tests/lib/init-docs.test.js tests/lib/init-layout.test.js tests/lib/i18n-catalog.test.js
    node --test tests/lib/ai-review-budget.test.js tests/lib/ai-spec-generator.test.js tests/lib/check-slice.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-pr.test.js tests/commands/analyze.test.js tests/commands/demo.test.js tests/commands/findings.test.js tests/commands/spec-create.test.js
    node scripts/ci/smoke-cross-platform.js
    npm run docs:check
    npm run schema:slice:check
    node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json
    node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
    node bin/create-quiver.js slice scope specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json --base main
    node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-06-integration-migration-docs/slice.json
    git diff --check

## Completion Checklist

- All listed surfaces share canonical state and counts.
- JSON stdout and stable machine semantics have directed tests.
- Redaction covers persistence, rendering, export, and raw evidence.
- Legacy reads perform no writes or false advancement.
- Migration dry-run, apply, verify, and reapply are evidenced.
- Rollback disables writers while readers and gates fail closed.
- Unsafe downgrade with active v58-only state is blocked.
- All AC-16 scenarios have linked evidence.
- Relevant public docs match implemented behavior.
- Package status and evidence are reconciled without premature claims.
