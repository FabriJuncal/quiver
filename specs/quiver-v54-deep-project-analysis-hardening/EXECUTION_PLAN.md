# Execution Plan - Quiver v54 Deep Project Analysis Hardening

## Sequential Order

1. `slice-01-contract-regression-harness`
2. `slice-02-safe-discovery-sampling` and `slice-03-run-lifecycle-cli-io`
3. `slice-04-artifact-store-redaction`, `slice-05-path-aware-repair-engine`, and `slice-08-doctor-agents-guidance`
4. `slice-06-retry-controller`
5. `slice-07-final-validation-review-write-gate`
6. `slice-09-release-smoke-rollback-docs`

## Parallelization Rules

- `slice-01` must land first because it defines the regression contract.
- `slice-02` and `slice-03` can run in parallel after `slice-01`.
- `slice-04` can start after `slice-03` defines run lifecycle/status and can run in parallel with `slice-05`.
- `slice-08` can run after `slice-01` and must not block provider hardening.
- `slice-06` must wait for lifecycle and repair contracts.
- `slice-07` must wait for sampling, artifacts, repair, and retry.
- `slice-09` closes release evidence after production gates pass.

## Critical Boundaries

- Read boundary: `slice-02`
- Provider/run boundary: `slice-03`
- Artifact/redaction boundary: `slice-04`
- Repair boundary: `slice-05`
- Retry boundary: `slice-06`
- Validation/write boundary: `slice-07`

## Required Validation Before Closing Spec

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/commands/ai-analyze-project-review.test.js
node --test tests/commands/ai-analyze-project.test.js
node --test tests/commands/doctor.test.js
node --test tests/lib/ai-analyze-project-discovery.test.js
node --test tests/lib/ai/analyze-project-repair.test.js
npm run docs:check
npm run schema:slice:check
node bin/create-quiver.js spec validate specs/quiver-v54-deep-project-analysis-hardening --strict
git diff --check
```

## Release Evidence

Run a live smoke against `nika-erp` only after deterministic gates pass. The live smoke is release evidence, not a CI gate.

## Rollback

- Each runtime slice must be revertible independently.
- If repair causes quality issues, revert `slice-05` and `slice-06` while preserving discovery and dry-run.
- If artifact redaction fails, block release and revert `slice-04` before publishing.
- If final write gate regresses, revert `slice-07`; provider mode without `--review` must still avoid docs writes.
