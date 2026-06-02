# Quiver v51 - CLI Ergonomics and Automation Contracts

**Date:** 2026-06-01
**Status:** Planned
**Source:** User-approved plan v4 derived from `REQUERIMIENTOS_DERIVADOS_DE_AUDITORIA.md`.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

The audit identified CLI ergonomics and automation contract gaps around JSON output, dashboard validation, base branch defaults, next/plan/graph UX, evidence robustness, namespace compatibility, and Windows portability. Several related capabilities already exist and must be preserved by tests/evidence instead of reimplemented.

## Objective

Harden Quiver's CLI contracts for humans, scripts, agents, and production CI:

- Add compatibility-safe JSON fields.
- Localize and document dashboard validation.
- Define one base branch resolution policy across related commands.
- Close UX edge cases in `next`, `plan`, and `graph`.
- Make evidence handling robust and path-safe.
- Preserve namespace compatibility and make recommended npm scripts portable.

## Scope

### Included

- CLI contract baseline for already-implemented findings.
- `flow --json` `next_command` additive compatibility.
- Dashboard `--section` validation/i18n/help.
- Base branch policy for `spec close`, `ai pr`, `slice check`, `slice scope`, and related readiness flows.
- `next`, `plan`, and `graph` UX edge cases.
- Evidence run/list/show robustness, signals, redaction, truncation, and path safety.
- Namespace parity, legacy stderr-only warnings, and Windows PowerShell script portability.

### Excluded

- Removing legacy aliases.
- Breaking JSON contracts.
- Rewriting parser.
- Shell completion.
- TypeScript.
- Commander.js/yargs.

## Approved Acceptance Criteria

1. Already-implemented CLI findings are closed by evidence/tests/docs only.
2. `flow --json` adds `next_command` while preserving `nextCommand`.
3. `dashboard --section` errors are localized, actionable, and list real supported sections.
4. Base branch resolution is consistent across all commands that use `--base`.
5. `next`, `plan`, and `graph` edge cases are implemented or closed by evidence.
6. Evidence commands preserve exit codes, redaction, truncation, safe paths, JSON contracts, and signal behavior.
7. Canonical namespaces and legacy aliases remain compatible with warnings only on stderr.
8. Recommended npm scripts/commands are portable under Windows PowerShell.

## Execution Baseline - slice-00

| Finding | Current state | Evidence | Action |
|---|---|---|---|
| `status` top-level command | implemented | `src/create-quiver/commands/status.js`; `tests/commands/status.test.js`. | Preserve current human/JSON and read-only contracts. |
| `slice start/check/check-pr/scope/cleanup/refresh` plus legacy aliases | implemented | `src/create-quiver/commands/slice.js`; `src/create-quiver/lib/cli/command-registry.js`; `tests/commands/slice-namespace.test.js`. | Preserve canonical namespace, legacy aliases, and stderr-only deprecation warnings. |
| `handoff check/create` plus legacy aliases | implemented | `src/create-quiver/commands/handoff.js`; `tests/commands/handoff-namespace.test.js`. | Preserve canonical namespace and stderr-only deprecation warnings. |
| `evidence run/list/show` | implemented | `src/create-quiver/commands/evidence.js`; `src/create-quiver/lib/evidence.js`; `tests/commands/evidence.test.js`. | Freeze JSON schema version, redaction, truncation, path-safety, and exit-code contracts before `slice-05`. |
| `demo spec-viewer` and `demo create spec-viewer` compatibility | implemented | `src/create-quiver/commands/demo.js`; `tests/commands/demo.test.js`. | Preserve both entrypoints and non-destructive scaffold behavior. |
| AI command fragmentation | implemented | `src/create-quiver/commands/ai.js` delegates to `src/create-quiver/commands/ai/{agents,diagnostics,execution,inspection,lifecycle,planner}.js`. | Preserve split modules and compatibility aliases; no dispatcher rewrite in v51 baseline. |
| `flow` human/stdout/JSON contract | partial | `src/create-quiver/commands/flow.js`; `tests/commands/flow.test.js`; current JSON contains `nextCommand` but not additive `next_command`. | Implement additive `next_command` in `slice-01-flow-json-compatibility`. |
| `dashboard` invalid-section behavior and JSON constraints | partial | `src/create-quiver/lib/dashboard.js`; `tests/commands/dashboard.test.js`; invalid `--section` error is actionable but still English-only in observed behavior. | Implement localization/help hardening in `slice-02-dashboard-section-validation-i18n`. |
| `plan` and `graph` UX edge cases | implemented | `tests/commands/plan.test.js`; `tests/commands/graph.test.js` cover missing estimates and empty level filters. | Close as evidence-only unless later validation proves a regression. |
| Base branch resolution policy | partial | `src/create-quiver/lib/spec-worktrees.js`, `src/create-quiver/commands/ai/github.js`, and readiness helpers use related but not fully centralized fallback logic. | Implement single policy in `slice-03-base-branch-resolution-policy`. |
| Windows npm script portability | partial | `package.json` still includes legacy Bash scripts (`check:slice`, `check:pr`, `start:slice`, `cleanup:slice`, `migrate`) alongside portable `quiver:*` scripts. | Implement or document portable script strategy in `slice-06-namespace-compatibility-windows-scripts`. |

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | CLI contract baseline | completed | none |
| slice-01 | Flow JSON compatibility | planned | slice-00 |
| slice-02 | Dashboard section validation and i18n | planned | slice-00 |
| slice-03 | Base branch resolution policy | planned | slice-00 |
| slice-04 | Next/plan/graph UX edge cases | planned | slice-00 |
| slice-05 | Evidence robustness and path safety | planned | slice-00 |
| slice-06 | Namespace compatibility and Windows npm scripts | planned | slice-00 |

## Guardrails

- Add JSON fields, do not rename/remove existing fields.
- Do not let warnings or deprecation messages contaminate JSON stdout.
- Do not change command semantics for already-implemented findings unless the baseline proves a gap.
- Keep `--base` explicit override highest priority.
- Preserve evidence format unless a compatible migration is documented.
- Keep aliases working.

## Required Production Gates

- targeted command tests
- parser contract tests when flags change
- stdout/stderr assertions for JSON, warnings, and errors
- EN/ES validation for human messages
- no-TTY/CI checks for prompts
- Windows `pwsh` validation for portable scripts
- `node --test`
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`

## Open Decisions

- Exact base branch fallback when no remote HEAD is available.
- Exact policy for `evidence run --output` allowed paths.
- Strategy for scripts Bash legacy: replace, wrap, or document as legacy.
