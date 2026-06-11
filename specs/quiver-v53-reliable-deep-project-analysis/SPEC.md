# Quiver v53 - Reliable Deep Project Analysis

**Date:** 2026-06-11
**Status:** Completed
**Source:** User-approved requirement, acceptance criteria, production review, and revised technical plan for reliable `ai analyze-project` provider execution.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

`ai analyze-project --deep` can now discover a representative project sample and show provider progress, but live provider output can drift from the strict analysis schema. In the `nika-erp` validation run, Codex returned JSON with unsupported `notes` keys inside `domain.roles`, `domain.entities`, and `domain.actions`, causing:

```text
provider analysis JSON does not match the required schema
```

The command did the right safety thing by failing without doc writes, but the user experience and reliability are not production-grade yet. A real user needs Quiver to treat provider output as untrusted, validate it, repair only safe schema drift, retry only when useful, audit artifacts, and never write invalid docs.

## Objective

Make:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --provider codex --model gpt-5.5
```

robust, auditable, and safe in real projects by implementing a transactional analysis pipeline:

```text
discover -> normalize context -> provider generate -> validate/repair -> review/write
```

The command must produce a valid analysis proposal or fail with a compact actionable error, without writing final docs or product code when the final JSON is invalid.

## Scope

### Included

- Formal analysis run contract and versioned manifests in `.quiver/runs`.
- Explicit mode contract for `--dry-run`, provider execution, `--json`, `--review`, and future write paths.
- Provider fixture harness for deterministic drift scenarios.
- Safe context boundary with pre-provider redaction and prompt-injection guardrails.
- Error taxonomy for repairable, retryable, and fatal provider/schema failures.
- Compact schema error grouping with complete manifest output.
- Minimal safe repair for `additionalProperties` drift such as unsupported `notes` keys.
- Controlled retry layer with hard retry cap and compact retry prompts.
- Audit artifacts for raw/redacted/repaired provider output, validation, retries, context, and final status.
- Review/write transaction with edited proposal revalidation, diff, confirmation, snapshot, and atomic writes.
- Semantic validation for evidence-backed confidence and claim quality.
- Public docs and benchmark guidance.
- Optional structural map hardening after reliability kernel is stable.

### Excluded

- Product-code changes in analyzed repositories.
- Generating specs automatically without human approval.
- Writing final documentation without review/confirmation.
- Accepting arbitrary provider fields by relaxing the schema.
- Moving provider-provided `notes` into semantic fields unless the schema explicitly defines a destination in a future change.
- Full multi-language AST indexing in this spec.
- Provider-specific features that cannot fall back to validate/repair/retry.

## Approved Acceptance Criteria

1. The command shows visible progress within 2 seconds and keeps reporting status while provider execution runs.
2. `--dry-run` writes 0 files and runs 0 providers.
3. `--json` emits machine-readable JSON only and does not mix spinner/progress output into stdout.
4. Provider execution treats repository content as untrusted data, not as instructions.
5. Quiver excludes and redacts secrets before provider execution and before artifact persistence.
6. `.env`, secrets, `.git`, `node_modules`, `.next`, caches, dumps, binaries, and unsafe symlinks are never sent to the provider.
7. Quiver writes a selected-context manifest with paths, bytes, reasons, truncation, and safety exclusions.
8. Provider output is parsed, validated, and classified before any final docs write.
9. Schema errors are grouped by type/path family in console output, with complete details stored in a validation manifest.
10. Repair is limited to safe structural changes, initially removing unsupported additional properties such as `notes`.
11. Repair never changes claim meaning, confidence, evidence, or inferred facts.
12. Non-repairable but retryable failures can trigger at most 2 retries, with default 1 retry.
13. Retry prompts include compact schema feedback and do not resend more context than necessary unless explicitly required.
14. Fatal failures fail immediately with 0 final doc writes.
15. If final JSON remains invalid after repair/retry, Quiver fails without final docs writes.
16. Provider raw output, redacted output, repaired output when present, validation manifest, repair manifest, retry manifest, selected context, and final status are saved under `.quiver/runs/run-...` when provider execution occurs.
17. Run artifacts are size-bounded, redacted, versioned, and ignored from git.
18. `--review` opens or prepares an editable proposal, revalidates edited JSON, shows a final diff, and requires explicit approval before docs writes.
19. Canceling review leaves final docs unchanged.
20. Any docs write creates snapshots and hashes before writing, then writes atomically.
21. Semantic validation checks that meaningful claims include confidence and evidence, and prevents `confirmed` claims without explicit evidence.
22. The `nika-erp` failure mode with extra `notes` keys is covered by a deterministic fixture.
23. The command passes or fails in `nika-erp` without massive schema noise.
24. Regression tests cover provider fake success, repair success, retry success, retry exhausted, secret-like content, parse failure, JSON fences, truncation, and no invalid writes.

## Technical Strategy

The solution must start with a reliability kernel, not a broader indexing project:

1. Define run contracts, modes, states, and manifests.
2. Add deterministic provider fixture tests.
3. Enforce safe context boundaries before provider calls.
4. Classify and group validation errors.
5. Add minimal safe repair.
6. Add controlled retry.
7. Add audit and review/write transaction.
8. Add semantic validation, docs, and benchmark guidance.
9. Add structural map hardening only after reliability is stable.

## Mode Contract

| Mode | Provider | Writes | Notes |
|---|---:|---:|---|
| `--dry-run` | no | none | Reports planned context and safety exclusions only. |
| provider execution without `--review` | yes | audit only | Writes redacted `.quiver/runs` artifacts, never final docs. |
| `--review` | yes | audit, then docs only after approval | Editable proposal, revalidation, final diff, confirmation, snapshot. |
| `--json` | depends on other flags | same as selected mode | JSON stdout only; progress goes to stderr or is suppressed. |
| non-TTY | yes if explicitly requested | same as selected mode | Never opens editor or waits for interactive confirmation. |

## Error Taxonomy

| Class | Examples | Behavior |
|---|---|---|
| repairable | `additionalProperties` such as `notes` | Remove only unsupported keys, record manifest, revalidate. |
| retryable | missing required, wrong type, invalid enum, parse/truncated JSON, markdown fences if parsing is ambiguous | Retry with compact schema feedback up to cap. |
| fatal | secret leak candidate, provider command failure, unsafe context, ambiguous multi-JSON, write path violation | Fail immediately with actionable guidance and no final docs writes. |

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Analysis run contract | completed | none |
| slice-01 | Provider fixture harness | completed | slice-00 |
| slice-02 | Safe context boundary | completed | slice-00, slice-01 |
| slice-03 | Schema error grouping | completed | slice-01 |
| slice-04 | Safe repair layer | completed | slice-03 |
| slice-05 | Controlled retry layer | completed | slice-03, slice-04 |
| slice-06 | Audit and review transaction | completed | slice-02, slice-04, slice-05 |
| slice-07 | Semantic validation, docs, and benchmark | completed | slice-06 |
| slice-08 | Structural map hardening | completed | slice-07 |

## Validation Strategy

Required validation should include:

```bash
npm ci
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/commands/ai-analyze-project.test.js
node --test tests/lib/ai/*.test.js
npm run docs:check
npm run schema:slice:check
npm run smoke:create-quiver
npm run package:quiver
node bin/create-quiver.js spec validate specs/quiver-v53-reliable-deep-project-analysis --strict
git diff --check
```

Live validation against `nika-erp` is useful but must remain an optional evidence smoke, not a required deterministic CI gate.

## Benchmark Contract

Benchmarks must be split into:

- deterministic provider fake benchmarks for CI;
- optional live provider benchmarks for release evidence.

Minimum benchmark cases:

- valid JSON/schema success;
- extra `notes` keys;
- markdown fences;
- text before/after JSON;
- JSON truncation;
- missing required fields;
- invalid confidence;
- secret-like content;
- retry success;
- retry exhausted.

## Production Guardrails

- Provider output is untrusted until parsed, validated, repaired when safe, and revalidated.
- Repository content is untrusted input and cannot override system/provider instructions.
- Repair must be structural and auditable, not semantic.
- Final docs writes only happen after valid final JSON and explicit review approval.
- `.quiver/runs` artifacts must be redacted, size-bounded, versioned, and git-ignored.
- Errors in console stay compact; full details live in manifests.
- CI/non-TTY must never hang on prompts or editors.

## Risks

- Secret or PII leakage if redaction happens only after provider execution.
- Silent data loss if repair removes meaningful provider content without manifest.
- High cost or long latency if retry resends full context.
- Overfitting to Codex behavior and breaking Claude/Gemini.
- Review UX confusion if audit writes and final docs writes are not clearly separated.
- Schema-valid but low-quality analysis if semantic validation is weak.

## Resolved Decisions

- Keep schema strict; do not relax it to absorb arbitrary provider output.
- Repair only safe structural drift, initially unsupported extra keys.
- Do not move `notes` into another semantic field in this spec.
- Treat structured outputs as optional provider capability; validate/repair/retry remains mandatory fallback.
- Do not implement structural/symbol map before the reliability kernel.
- Use `nika-erp` as a live smoke reference and synthetic fixtures for deterministic tests.

## Open Questions

- Whether a future flag should expose retry control as `--max-retries <n>` immediately or keep it internal first.
- Whether restore should be implemented as a command in a future spec or remain manifest-guided manual recovery here.
- Which provider metadata can be reliably captured for cost/latency without provider-specific brittle parsing.
