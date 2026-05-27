# Status - Quiver v31 AI Model Catalog and Agent Selection

**Overall status:** In progress
**Created:** 2026-05-27
**Current slice:** slice-05 completed; slice-06 ready

## Summary

This spec is planned to improve AI agent setup by adding a local model catalog, provider/model selectors, alias normalization, profile diagnostics, repair dry-runs, shared model preflight, and clearer provider errors.

## Slice Status

| Slice | Status | Notes |
|---|---|---|
| slice-00-spec-foundation | Completed | Documentation package created, source-of-truth docs synchronized, validation passed. |
| slice-01-model-catalog-alias-normalization | Completed | Local catalog, role metadata, aliases, custom model support, and profile normalization added. |
| slice-02-interactive-agent-set-selectors | Completed | Guided `ai agent set <role>` provider/model flow, no-TTY guardrails, custom models, and profile actions added. |
| slice-03-agent-doctor-repair | Completed | Profile diagnostics, JSON output, error exit codes, and dry-run alias repair added. |
| slice-04-shared-preflight-provider-errors | Completed | Shared alias preflight, CLI override normalization, and provider error extraction added. |
| slice-05-ai-models-list | Completed | `ai models list` human/JSON output, provider filter, and help contract added. |
| slice-06-docs-templates-alignment | Planned | Repo docs and generated templates. |
| slice-07-tests-smokes-release-readiness | Planned | Full validation and release evidence. |

## Current Blockers

- None. Implementation must begin with `slice-00`.

## Next Step

Continue with `slice-06-docs-templates-alignment`.
