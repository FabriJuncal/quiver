# Quiver v54 - Deep Project Analysis Hardening

**Date:** 2026-06-11
**Status:** Approved, not implemented
**Source:** User-approved requirement, live `nika-erp` smoke evidence, production review, and final slice cut review.

## Problem

`ai analyze-project --deep --provider codex --model gpt-5.5` now fails closed and audits invalid provider output, but the live `nika-erp` end-to-end test still showed production reliability gaps:

- Codex returned schema drift such as `claim`, `notes`, `confidence`, and objects missing `name`.
- `package-lock.json` consumed most of the context budget.
- Quiver-generated docs competed with product source files.
- TTY progress works, but no-TTY progress is not visible until the command finishes.
- Retry can take too long and repeat the same drift.
- `AGENTS.md` can be preserved safely but left contract-incomplete with only a warning.

The next iteration must make the command reliable in real projects without relaxing the schema or writing invalid final documentation.

## Objective

Make the command:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --provider codex --model gpt-5.5
```

produce a valid, reviewable project-analysis JSON proposal in `nika-erp`, or fail quickly with actionable diagnostics and complete audit artifacts while preserving these invariants:

- no product code writes;
- no final docs writes without valid final JSON and explicit review/confirmation;
- no secrets, unsafe paths, dependency dumps, caches, generated outputs, or binaries sent to the provider;
- no schema relaxation to accept arbitrary provider output.

## Scope

### Included

- Deterministic regression harness based on sanitized `nika-erp` provider drift.
- Safe discovery and sampling with quotas, lockfile summaries, symlink handling, and source-priority rules.
- Run lifecycle state machine, visible progress, stdout/stderr contract, timeouts, and cancellation cleanup.
- Artifact store with redaction, truncation, head/tail retention, hashes, manifest metadata, and size limits.
- Path-aware repair engine for strictly allowed drift only.
- Retry controller with compact prompts, drift signatures, timeouts, and early stop.
- Final validation and review/write gate ensuring invalid JSON never writes final docs.
- `doctor` guidance for incomplete existing `AGENTS.md`.
- Release smoke documentation separating deterministic CI gates from optional live provider evidence.

### Excluded

- Modifying product code in analyzed repositories.
- Generating specs automatically from analysis output.
- Writing documentation final without `--review` or explicit confirmation.
- Accepting arbitrary provider fields by loosening the schema.
- Building a full AST/indexing engine.
- Requiring live provider execution as a CI gate.

## Approved Acceptance Criteria

1. In `nika-erp`, the command either produces schema-valid JSON or fails controlled without final docs writes.
2. `--dry-run` creates no `.quiver/runs`, docs, code, or audit artifacts.
3. Provider mode without `--review` writes only audit artifacts, never final docs.
4. `--json` keeps stdout machine-readable and sends human progress to stderr or suppresses it.
5. TTY mode shows a loader and step names.
6. No-TTY mode prints line-based progress before provider execution and during validation/repair/retry/artifact writes.
7. First visible progress appears in less than 2 seconds.
8. `.env*`, secrets, `.git`, `.quiver`, dependency folders, `.next`, caches, dumps, binaries, certificates, credential files, and unsafe symlinks are never sent to the provider.
9. Lockfiles are summarized by default and never consume the main source budget.
10. Sampling reserves budget for product source and caps generated Quiver docs.
11. Raw provider stdout/stderr artifacts are redacted before persistence and size-bounded.
12. Artifacts keep head/tail, original size, persisted size, hash, truncation flag, command/options, `run_id`, `kind`, `schema_version`, and timestamps.
13. Repair is table-driven and path-aware.
14. Allowed repairs are limited to:
    - remove unsupported `notes`;
    - remove unsupported `confidence`;
    - rename `claim` to `name` only where the path expects a human label, `name` is missing, and `claim` is a safe non-empty string.
15. Conflicting `name` and `claim` values are not repaired.
16. Repair has a maximum total threshold and per-path-family threshold.
17. Retry does not resend full selected context.
18. Retry has per-attempt timeout, total timeout, drift signature, and early stop when dominant drift repeats.
19. Canceling with `SIGINT`/`SIGTERM` terminates provider children and writes status `canceled`.
20. Final docs write requires valid schema, semantic validation, review approval, snapshot, and atomic writes.
21. Error output is compact, bounded to grouped summaries, and points to manifests for full details.
22. Deterministic fixtures are CI gates; live `nika-erp` smoke is release evidence only.
23. `doctor` gives a safe next action for incomplete existing `AGENTS.md` without overwriting human content.

## Architecture Rule

Implementation must preserve this boundary sequence:

```text
Read boundary -> Provider boundary -> Repair boundary -> Validation boundary -> Write boundary
```

No slice should cross more than one critical boundary without explicit tests. Repository content and provider output are untrusted until validated.

## Slice Roadmap

| Slice | Title | Status | Dependencies | Parallel Guidance |
|---|---|---|---|---|
| slice-01-contract-regression-harness | Contract & Regression Harness | pending | none | sequential first |
| slice-02-safe-discovery-sampling | Safe Discovery & Sampling | pending | slice-01 | parallel after slice-01 |
| slice-03-run-lifecycle-cli-io | Run Lifecycle & CLI IO | pending | slice-01 | parallel after slice-01 |
| slice-04-artifact-store-redaction | Artifact Store & Redaction | pending | slice-01, slice-03 | parallel with slice-05 after slice-03 |
| slice-05-path-aware-repair-engine | Path-Aware Repair Engine | pending | slice-01 | parallel with slice-02/03, before slice-06 |
| slice-06-retry-controller | Retry Controller | pending | slice-03, slice-05 | sequential |
| slice-07-final-validation-review-write-gate | Final Validation & Review Write Gate | pending | slice-02, slice-04, slice-05, slice-06 | sequential production gate |
| slice-08-doctor-agents-guidance | Doctor AGENTS.md Guidance | pending | slice-01 | parallel/non-blocking |
| slice-09-release-smoke-rollback-docs | Release Smoke & Rollback Docs | pending | slice-07 | final |

## Execution Order

```text
01
├─ 02
├─ 03
│  └─ 04
├─ 08
└─ 05
   └─ 06
      └─ 07
         └─ 09
```

## Production Guardrails

- Fail closed before final docs writes.
- Keep stdout parseable in `--json`.
- Keep progress accessible in no-TTY logs.
- Kill child processes on cancellation.
- Redact before persisting.
- Bound all artifacts and console output.
- Keep repair structural and auditable, not semantic.
- Preserve human-authored files by default.

## Validation Strategy

Deterministic gates:

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

Release evidence:

```bash
npx create-quiver ai analyze-project --deep --dry-run
npx create-quiver ai analyze-project --deep --provider codex --model gpt-5.5
npx create-quiver ai analyze-project --deep --review --provider codex --model gpt-5.5
```

The live `nika-erp` smoke must be documented, but CI must not depend on live provider credentials, network, or model availability.

## Risks

- Over-repairing provider output could turn low-quality JSON into schema-valid misinformation.
- Redaction after persistence could leak secrets into `.quiver/runs`.
- No-TTY progress in stdout could break automation.
- Lockfile summary could still read huge files inefficiently if implemented with full reads.
- Retry without drift signatures could waste time and money.
- A broad final-write slice could hide regressions unless artifacts and write gates are separated.

## Resolved Decisions

- Keep the schema strict.
- Repair only the explicitly allowed drift table.
- Use fixtures as CI gates and live smoke as release evidence.
- Separate artifact redaction from final validation/write gate.
- Keep `doctor` AGENTS guidance parallel and non-blocking for the provider hardening path.

## Open Questions

- Exact default timeout values should be chosen during implementation and documented in the slice closure.
- Exact repair thresholds should be chosen during implementation and documented in the slice closure.
- The final `AGENTS.md` repair command name should align with existing CLI command structure if one already exists.
