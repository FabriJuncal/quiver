# Quiver v56 - Analyze Project Usable Doc Merge

**Date:** 2026-06-17
**Status:** Approved, in progress
**Source:** User-approved requirement, production review, stricter second-pass review, and execution plan for `ai analyze-project` usable documentation output.

## Problem

`ai analyze-project --deep --provider codex --model gpt-5.5` now writes documentation by default, but real projects can still end with unusable docs. In `nika-erp`, Quiver wrote a valid `quiver:analyze-project` block, but preserved scaffold placeholders at the top of `docs/CONTEXTO.md`, plus an older `quiver:context-prep` block. The command reported success even though the first visible content still looked unmodified.

## Objective

Make analyze-project doc writes produce usable human-facing context files by applying a deterministic documentation merge contract:

```text
classify existing doc -> merge by classification -> preserve real human content -> replace scaffold placeholders -> consolidate managed blocks -> validate visible output
```

## Scope

### Included

- Document classification contract for scaffold, partial scaffold, human content, managed-only, mixed, and unknown docs.
- Deterministic merge strategy for `docs/CONTEXTO.md`, `docs/AI_CONTEXT.md`, and `docs/ARCHITECTURE.md`.
- Critical placeholder detection in English and Spanish.
- Idempotent managed block replacement.
- Safe handling of old `quiver:context-prep` blocks.
- Integration with live apply, saved proposal apply, review, JSON, and strict validation.
- Human output, manifests, docs, troubleshooting, and nika-erp regression fixture/smoke.

### Excluded

- Product-code changes in analyzed repositories.
- Writing outside the existing analyze-project documentation allowlist.
- Automatic spec generation from project analysis.
- Relaxing provider schema validation.
- Translating technical evidence or provider claims semantically.

## Requirements

1. Quiver must not preserve critical scaffold placeholders as primary visible content when a valid proposal can replace them.
2. Quiver must not delete real human content without preserving it or reporting a warning.
3. Existing frontmatter must be preserved when it is parseable.
4. If frontmatter is ambiguous, Quiver must preserve it and warn.
5. `quiver:analyze-project` must be replaced in place on repeated runs, never duplicated.
6. `quiver:context-prep` scaffold content must not remain as confusing primary content after analyze-project applies.
7. The merge must be idempotent for the same proposal and input.
8. `apply --run` and live provider apply must use the same merge engine.
9. `--save-proposal` must persist a merge plan or enough metadata to preview the eventual write result.
10. `--review` must show the final post-merge diff, not only raw provider Markdown.
11. `--json` must expose merge strategy and warnings without removing existing fields.
12. `--strict` must fail when critical placeholders remain in primary visible content.
13. Name conflicts such as `NIKA_ERP`, `stockflow`, and `StockFlow` must be reported, not silently hidden.

## Classification Contract

| Classification | Condition | Action |
|---|---|---|
| `scaffold` | Quiver/template signals plus known placeholders, with no significant human text | Replace primary content while preserving frontmatter |
| `partial_scaffold` | Some sections are placeholder-only and other sections have human text | Replace placeholder sections and preserve completed sections |
| `human_content` | Significant non-placeholder text outside managed markers | Preserve human text and insert generated summary visibly |
| `managed_only` | File is empty or only contains Quiver managed blocks | Replace managed content |
| `mixed` | Human text plus Quiver blocks plus placeholders | Preserve human text, remove/replace scaffold portions, consolidate blocks |
| `unknown` | Not safely classifiable | Preserve content, insert generated block visibly, warn |

## Slice Roadmap

| Slice | Title | Status | Dependencies | Parallel Guidance |
|---|---|---|---|---|
| slice-01-document-classification-merge-engine | Document Classification + Merge Engine | in progress | none | sequential first |
| slice-02-apply-integration-validation-contract | Apply Integration + Validation Contract | pending | slice-01 | sequential after slice-01 |
| slice-03-cli-docs-real-fixture-smoke | CLI UX + Docs + Real Fixture Smoke | pending | slice-02 | final hardening; docs can draft after slice-01 |

## Validation Strategy

```bash
node --test tests/lib/ai-analyze-project-docs.test.js
node --test tests/commands/ai-analyze-project-provider.test.js tests/commands/ai-analyze-project-review.test.js
npm run docs:check
node bin/create-quiver.js spec validate specs/quiver-v56-analyze-project-usable-doc-merge --strict
git diff --check
```

## Production Guardrails

- Snapshot before writes remains mandatory.
- Writes remain atomic.
- Path allowlist remains unchanged.
- Provider output remains untrusted until schema validation passes.
- Merge decisions must be recorded in the write plan/report.
- Critical placeholder validation checks primary visible content, not only managed blocks.

## Open Questions

- Whether `token_cost` should be recalculated immediately in v56 or deferred to a metadata cleanup.
- Whether old `context-prep` human notes should be moved into a named preserved section or only marked as superseded.
