# Quiver v57 - Evidence Budget Recovery UX

**Date:** 2026-06-18
**Status:** In Progress
**Source:** User-approved requirement, production review, stricter second-pass review, and execution plan for recoverable `ai analyze-project` evidence validation failures.

## Problem

`ai analyze-project --deep --provider codex --model gpt-5.5` can fail safely when the provider cites evidence outside the selected context sample. The current failure is technically correct, but the user must infer whether the fix is increasing `--max-files`, increasing `--max-bytes`, enabling a category such as tests/db, or reducing scope. This creates avoidable friction after an expensive provider run.

The real observed case in `nika-erp` failed with `evidence-not-selected` for paths such as `.env.example`, `eslint.config.mjs`, and `app/test/page.tsx`. A larger budget later succeeded, but Quiver did not calculate or highlight a safe command that would likely recover the run.

## Objective

When provider evidence validation fails because cited evidence was not selected, Quiver must generate a safe, auditable recovery payload and a prominent next command. The recovery must help the user rerun with the right context budget or scope without weakening evidence validation or sending unsafe files.

## Scope

### Included

- Evidence recovery contract for `evidence-not-selected` failures.
- Secure path normalization and classification.
- Safety-first classification for missing evidence paths.
- Deterministic budget recommendation for `--max-files` and `--max-bytes`.
- Command recommendation that preserves relevant user flags.
- Human CLI output in English and Spanish.
- `--json` recovery payload.
- Validation manifest recovery details.
- Focused tests, docs, and release smoke with a sanitized nika-erp-style fixture.

### Excluded

- Auto-expanding context and retrying with a larger budget in the same run.
- Sending or recommending unsafe files such as `.env`, secrets, dependency folders, build outputs, dumps, caches, or binaries.
- Relaxing provider schema or evidence validation.
- Modifying product code in the analyzed repository.
- Generating specs automatically from project analysis.
- Rewriting the existing sampling engine beyond metadata needed for recovery.

## Requirements

1. On final `evidence-not-selected` failure, Quiver must classify every missing evidence path before recommending any fix.
2. Classification must be the single source of truth for recovery safety.
3. Quiver must never recommend increasing budget to include paths excluded for security.
4. Quiver must never read or send `.env`, secrets, `.git`, `node_modules`, `.next`, caches, dumps, dependency folders, or binaries.
5. `.env.example` and similar files must be treated as metadata/redacted only unless existing policy explicitly allows safe content.
6. Quiver must differentiate at least these causes:
   - `budget_limited`
   - `security_excluded`
   - `generated_or_dependency`
   - `metadata_only`
   - `missing_file`
   - `not_discovered`
   - `outside_scope`
   - `unknown`
7. Quiver must calculate recommended budgets from the current selected sample, safe missing evidence, and a safety margin.
8. Quiver must never recommend a budget lower than the one used by the failed command.
9. Quiver must enforce caps and suggest scope reduction when a safe recommendation exceeds caps.
10. Quiver must preserve relevant command flags such as `--deep`, `--provider`, `--model`, `--include-tests`, `--include-db`, `--include-source`, `--scope`, `--lang`, and `--strict`.
11. Quiver must not preserve transient or contradictory flags in the recommended command when they are not useful for recovery, such as `--json`, `--dry-run`, or obsolete review/apply flags.
12. Human output must show the recommended fix prominently before long details.
13. Human output must summarize missing evidence paths and truncate long lists.
14. Spanish output must be available through existing language selection.
15. `--json` must expose a stable optional `recovery` object without breaking existing consumers.
16. Validation manifests must record recovery classification, budget calculation inputs, generated command, and warnings.
17. If no safe recovery exists, Quiver must say so clearly and recommend inspection with a safe dry-run JSON command.
18. Recovery must be deterministic for the same validation issues, report, and CLI options.

## Budget Recommendation Contract

Recommended values are calculated only from classified safe evidence:

```text
safe_missing_bytes = sum(effective_prompt_bytes for safe_to_include missing evidence)
safety_margin_bytes = max(50000, ceil(safe_missing_bytes * 0.25))
recommended_max_bytes = round_up_to_50000(current_selected_bytes + safe_missing_bytes + safety_margin_bytes)
recommended_max_files = max(current_max_files, current_selected_files + safe_missing_file_count + 20)
```

The final values must never be lower than the original command values. If the recommendation exceeds configured caps, Quiver must not emit an inflated command; it must recommend reducing scope or enabling a more precise category.

## Recovery Output Shape

`--json` and manifests may include:

```json
{
  "recovery": {
    "schema_version": 1,
    "available": true,
    "reason": "evidence_not_selected",
    "recommendation_type": "increase_budget",
    "command": "npx --yes create-quiver@latest ai analyze-project --deep --max-files 120 --max-bytes 500000 --provider codex --model gpt-5.5",
    "budget": {
      "current_max_files": 80,
      "current_max_bytes": 300000,
      "recommended_max_files": 120,
      "recommended_max_bytes": 500000
    },
    "evidence_summary": {
      "safe_to_include": [],
      "metadata_only": [],
      "excluded": []
    },
    "warnings": []
  }
}
```

The recovery object must be optional and additive.

## Slice Roadmap

| Slice | Title | Status | Dependencies | Parallel Guidance |
|---|---|---|---|---|
| slice-01-recovery-contract-security-classifier | Recovery Contract + Security Classifier | completed | none | sequential first |
| slice-02-budget-command-recommendation | Budget + Command Recommendation | completed | slice-01 | sequential after slice-01 |
| slice-03-cli-json-i18n-output | CLI + JSON + i18n Output | completed | slice-02 | sequential after slice-02 |
| slice-04-integration-fixtures-docs-release-smoke | Integration Fixtures + Docs + Release Smoke | completed | slice-03 | final; docs/tests can be parallel inside the slice |

## Production Guardrails

- Provider output remains untrusted until schema and evidence validation pass.
- Recovery is diagnostic only and must not weaken validation.
- Recovery must not silently expand budget in the same run.
- Recovery must not expose secret values or read unsafe content.
- Failure remains a failure when final provider output is invalid.
- Manifests must be audit-friendly but redacted.

## Validation Strategy

```bash
node --test tests/lib/ai-analyze-project-recovery.test.js
node --test tests/lib/ai-analyze-project-validation.test.js
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/i18n-catalog.test.js
node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict
git diff --check
```
