# Quiver v48 - AI Command Modularization

**Date:** 2026-05-31
**Status:** Completed
**Source:** User-approved acceptance criteria and production-readiness review derived from `CLI_ANALYSIS.md`.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

`src/create-quiver/commands/ai.js` concentrates many unrelated subcommands in one large module. It mixes lifecycle, planner, agent, execution, inspection, export, diagnostics, and aliases. This increases regression risk and makes user-facing help harder to understand.

## Objective

Modularize AI command routing without changing behavior:

- Establish golden baseline tests.
- Introduce `ai lifecycle create|close` while preserving `ai run create|close`.
- Mark duplicate aliases as deprecated.
- Split AI command implementation by domain.
- Improve help grouping and advanced command labeling.

## Scope

### Included

- Baseline dispatch contract for current AI subcommands.
- `ai lifecycle create|close` compatibility path.
- Deprecated aliases for `approval-status` and `executor-prompt`.
- Domain modules for lifecycle, planner, agents, execution, inspection/export, and diagnostics.
- Help/documentation updates and tests.

### Excluded

- Changing provider defaults.
- Changing AI execution behavior.
- Parser modernization outside AI routing.
- Removing any legacy AI command.

## Approved Acceptance Criteria

1. Every current canonical AI subcommand keeps behavior, arguments, stdout/stderr expectations, and exit-code behavior.
2. Golden tests capture representative AI dispatch before module splitting.
3. `ai lifecycle create|close` works as the canonical lifecycle form.
4. `ai run create|close` remains functional as a deprecated compatibility alias.
5. `approval-status` remains functional as a deprecated alias of `approvals`.
6. `executor-prompt` remains functional as a deprecated alias of `prompt-slice`.
7. Deprecated warnings follow the v46 stderr-only human-mode rule.
8. `commands/ai.js` becomes a thin router after domain extraction.
9. Domain modules separate lifecycle, planner, agents, execution, inspection/export, and diagnostics.
10. `ai active-slice reconcile` and `ai trace report` are labeled advanced in help/docs.
11. Tests cover at least one command per AI domain plus aliases.
12. Full validation passes without changing provider execution semantics.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | AI modularization foundation | planned | none |
| slice-01 | AI dispatch contract baseline | completed | slice-00 |
| slice-02 | AI lifecycle namespace alias | completed | slice-01 |
| slice-03 | AI alias deprecations | completed | slice-01 |
| slice-04 | AI domain module split | completed | slice-01, slice-02, slice-03 |
| slice-05 | AI help and advanced surface | completed | slice-04 |
| slice-06 | Docs, tests, and release readiness | completed | slice-04, slice-05 |

## AI Domain Boundaries

These boundaries define the target module split. They are planning constraints for later slices; `slice-00` does not move runtime code.

| Domain | Target module | Commands |
|---|---|---|
| Lifecycle runs | `src/create-quiver/commands/ai/lifecycle.js` | `ai lifecycle create|close`, `ai run create|close`, `ai status`, `ai resume` |
| Planner workflow | `src/create-quiver/commands/ai/planner.js` | `ai onboard`, `ai prepare-context`, `ai plan`, `ai revise`, `ai repair-plan`, `ai review-plan`, `ai approve`, `ai approvals`, `ai approval-status` |
| Agent profiles and models | `src/create-quiver/commands/ai/agents.js` | `ai agent set|list|show|doctor|repair`, `ai models list` |
| Slice execution | `src/create-quiver/commands/ai/execution.js` | `ai prompt-slice`, `ai executor-prompt`, `ai execute-slice`, `ai execute-plan` |
| Inspection and export | `src/create-quiver/commands/ai/inspection.js` | `ai inspect`, `ai export`, `ai specs list`, `ai slices list` |
| Diagnostics and advanced maintenance | `src/create-quiver/commands/ai/diagnostics.js` | `ai active-slice status|reconcile`, `ai trace report`, `ai doctor`, `ai pr` |
| Shared routing | `src/create-quiver/commands/ai.js` | Thin router only: dispatch, shared option normalization, compatibility warnings, and domain exports |

### Compatibility and Deprecation Policy

- `ai lifecycle create|close` becomes the canonical lifecycle namespace.
- `ai run create|close` remains functional as a deprecated compatibility alias for the same behavior.
- `ai approvals` remains canonical for approval status.
- `ai approval-status` remains functional as a deprecated compatibility alias of `ai approvals`.
- `ai prompt-slice` remains canonical for executor prompt generation.
- `ai executor-prompt` remains functional as a deprecated compatibility alias of `ai prompt-slice`.
- Deprecated human-mode warnings must go to `stderr` only.
- JSON-capable commands must keep `stdout` parseable and must not emit deprecation prose on `stdout`.
- Alias deprecations must not change exit codes, writes, provider calls, prompts, or generated artifacts.

### Advanced Surface Policy

- `ai active-slice reconcile` is advanced because it reconciles internal active-slice state across supported sources. Help and docs should label it as advanced/maintenance without hiding it.
- `ai trace report` is advanced because it reports lifecycle and migration internals. Help and docs should label it as advanced/diagnostic without changing behavior.
- Advanced labeling is documentation/help wording only; it must not add confirmation prompts or change command semantics.

### Extraction Guardrails

- `slice-01` must establish dispatch baseline tests before runtime extraction.
- `slice-04` may move code into domain modules only after `slice-02` and `slice-03` alias behavior is covered.
- Provider-backed flows must remain behind existing dry-run/print-prompt/test doubles in tests; no live provider dependency may be introduced.
- Parser modernization belongs to v49 and must not be coupled to the AI module split.
- `src/create-quiver/index.js` may continue to own top-level CLI parsing until v49.

## Guardrails

- Refactor behavior only after golden dispatch tests exist.
- Keep provider-backed execution unchanged.
- Keep compatibility aliases.
- Do not combine parser modernization with this spec.
