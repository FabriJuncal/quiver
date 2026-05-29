# Quiver v41 - CLI i18n AI Lifecycle

**Date:** 2026-05-28
**Status:** Planned
**Source:** Continuation of the approved CLI i18n program.

## Problem

AI lifecycle commands contain long-running progress, approvals, provider errors, and PR flows. These messages must be localized without changing provider prompts, stable artifacts, or automation contracts.

## Objective

Localize AI lifecycle command output in `en` and `es`, including planning, approvals, agents, execution, run status, and PR creation wrappers.

## Scope

### Included

- `ai run create`, `ai run watch`, `ai status`, `ai resume`.
- `ai agent set`, `ai agent doctor`, `ai agent repair`, `ai models list`.
- `ai plan`, `ai revise`, `ai review-plan`, `ai repair-plan`, `ai approve`, `ai approvals`.
- `ai execute-slice`, `ai execute-plan`, and `ai pr`.
- Human progress, loaders, review/interactive wrapper messages, no-TTY/CI, dry-run, `--print-prompt`, and supported `--json`.

### Excluded

- Translating provider prompts or model-generated content unless a later spec explicitly defines that behavior.
- Changing provider adapters, credentials, or model access semantics.

## Acceptance Criteria

1. Human output for included commands supports `en` and `es`.
2. Provider prompts, prompt files, run ids, provider names, model ids, and command snippets remain exact.
3. `--print-prompt` output remains an exact provider prompt surface and is not polluted by localized decoration.
4. JSON/JSONL outputs remain parseable and schema-stable.
5. CI/no-TTY never blocks for localized prompts.
6. Errors from provider execution preserve actionable context without leaking secrets.
7. Tests cover normal, dry-run, review, approval, failure, no-TTY, and JSON modes where applicable.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | AI i18n foundation | completed | none |
| slice-01 | AI run status and resume | planned | v37 complete |
| slice-02 | AI agents and models | planned | slice-01 |
| slice-03 | AI planner, approvals, and review | planned | slice-01 |
| slice-04 | AI execution and PR | planned | slice-03 |
| slice-05 | AI tests and smokes | planned | slice-02, slice-04 |

## Guardrails

- Localize Quiver wrapper UX, not provider-owned content.
- Keep JSONL watcher output pure.
- Keep secrets redaction behavior unchanged or stricter.
- Do not translate model/provider identifiers.
