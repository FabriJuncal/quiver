# Evidence Report - Quiver v54 Deep Project Analysis Hardening

**Status:** Implemented
**Last updated:** 2026-06-11

## Evidence Available Before Implementation

- Live `nika-erp` smoke showed base onboarding commands pass.
- Live provider run failed closed with audited schema drift instead of writing invalid docs.
- TTY loader was visible.
- No-TTY progress did not stream until final output.
- Default sampling selected `package-lock.json` and Quiver-generated docs too heavily.
- Provider drift included `claim`, `notes`, `confidence`, and missing `name`.

## Evidence Captured During Implementation

- `slice-01-contract-regression-harness`: deterministic fixtures and command/parser regression tests.
- `slice-02-safe-discovery-sampling`: lockfile metadata sampling, product-source priority, and live read-only `nika-erp` dry-run smoke.
- `slice-03-run-lifecycle-cli-io`: TTY loader and no-TTY linear progress.
- `slice-04-artifact-store-redaction`: bounded/redacted raw provider stream artifacts with hash metadata.
- `slice-05-path-aware-repair-engine`: fail-closed path-aware repair for safe drift.
- `slice-06-retry-controller`: compact retry prompts, retry cap, retry manifests, and audited provider failures.
- `slice-07-final-validation-review-write-gate`: review, confirmation, snapshot, write, and post-write validation gates.
- `slice-08-doctor-agents-guidance`: actionable AGENTS.md warning and safe `doctor --fix`.
- `slice-09-release-smoke-rollback-docs`: release smoke commands, expected evidence, and rollback guidance.
- Deterministic fixture tests cover `notes`, `claim` to `name`, unsupported `confidence`, invalid confidence, missing fields, malformed JSON, fenced JSON, embedded JSON, secret-like output, retry success, and retry exhaustion.
- `--dry-run` and `--dry-run --json` remain read-only and do not create `.quiver`.
- Provider mode without `--review` writes audit artifacts but no final docs.
- TTY loader and no-TTY linear progress are covered.
- Lockfiles are summarized as metadata and omitted from provider content by default.
- Raw provider artifacts are redacted, size-bounded, and include stream metadata/hash.
- `doctor` reports actionable AGENTS.md repair guidance and `doctor --fix` preserves manual content.
- Review cancel, confirmation decline, no-TTY review, invalid edited proposal, approved writes, snapshots, and post-write validation are covered.
- Release smoke docs and rollback guidance are updated.

## Validation Log

- PASS: `node --test tests/lib/ai/analyze-project-repair.test.js`
- PASS: `node --test tests/commands/ai-analyze-project-provider.test.js`
- PASS: `node --test tests/lib/ai-analyze-project-discovery.test.js`
- PASS: `node --test tests/commands/ai-analyze-project.test.js`
- PASS: `node --test tests/lib/ai-artifacts.test.js`
- PASS: `node --test tests/commands/ai-analyze-project-review.test.js tests/lib/ai-analyze-project-validation.test.js`
- PASS: `node --test tests/commands/doctor.test.js tests/lib/doctor.test.js`
- PASS: `npm run docs:check`
- PASS: `npm run schema:slice:check`
- PASS: `node bin/create-quiver.js spec validate specs/quiver-v54-deep-project-analysis-hardening --strict`
- PASS: `git diff --check`
- PASS: live read-only smoke in `nika-erp` using local CLI: `node bin/create-quiver.js ai analyze-project --deep --dry-run --json`
  - `provider_execution`: `skipped`
  - `writes`: `[]`
  - `package-lock.json`: summarized under `detected.lockfiles`, omitted as `sampling:lockfile-metadata`
  - safety exclusions included `.env`, `.git`, `.quiver`, `.next`, and `node_modules`
