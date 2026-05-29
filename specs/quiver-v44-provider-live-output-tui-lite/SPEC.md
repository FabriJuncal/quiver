# Quiver v44 - Provider Live Output TUI-lite

**Date:** 2026-05-29
**Status:** Planned
**Source:** User-approved acceptance criteria and technical plan for elegant provider output visibility.

## Problem

Provider-backed commands currently show clean progress spinners, but long-running executions can feel opaque. During dogfooding, `ai prepare-context --with-planner --review --interactive` remained on `Ejecutando agente` for several minutes while the underlying provider process was still active. The user could not see whether the model was producing useful output, blocked, waiting, or failing.

Showing raw provider output by default would conflict with Quiver's automation and privacy contracts. The improvement needs a controlled, opt-in, visually polished human mode.

## Objective

Add a safe and elegant TUI-lite live output experience for provider-backed commands, starting with:

```bash
npx create-quiver ai prepare-context --with-planner --review --interactive --verbose
```

The experience must improve observability and diagnostics without breaking JSON output, CI/no-TTY usage, provider result parsing, docs-only validation, or existing non-verbose behavior.

## Scope

### Included

- Introduce `--verbose` as the opt-in flag for provider live output.
- Add safe provider stream hooks without changing default provider result behavior.
- Add a reusable TUI-lite renderer using Quiver's existing CLI theme, colors, and TTY rules.
- Integrate the renderer into `ai prepare-context --with-planner`.
- Audit and adopt the renderer where appropriate for:
  - `ai plan --phase acceptance`
  - `ai plan --phase technical-plan`
  - `ai revise --phase acceptance`
  - `ai revise --phase technical-plan`
  - `ai review-plan`
  - `ai repair-plan`
- Preserve redaction, truncation, JSON cleanliness, no-color fallback, no-TTY behavior, CI behavior, and review/interactive gates.
- Update public docs and AI guidance for the visible contract.
- Add focused tests and final validation evidence.

### Excluded

- Full-screen TUI framework.
- Keyboard navigation, scrollback panes, persistent terminal state, or curses/Ink-style application mode.
- Showing provider output by default.
- Streaming hidden chain-of-thought or bypassing provider output policies.
- Storing provider credentials, tokens, or raw unredacted logs.
- Changing WDD + SDD semantics or approval gates.
- Product feature implementation outside CLI provider-output UX.

## Approved Acceptance Criteria

1. Given a user in a human TTY, when `ai prepare-context --with-planner --review --interactive --verbose` executes a provider, Quiver shows a TUI-lite view with clear sections for agent, progress, provider/model, duration, provider output, and next step.
2. Given the same command without `--verbose`, Quiver preserves current clean loader behavior and does not show detailed model output.
3. Provider output is displayed inside a controlled visual panel, redacted and truncated before printing.
4. Output respects `--no-color`, `NO_COLOR`, `TERM=dumb`, CI, and no-TTY, with a simple fallback and no incompatible ANSI.
5. `--json` remains incompatible with human TUI output and is not contaminated by loaders, colors, prompts, or provider text.
6. If the provider emits no visible output for a reasonable interval, Quiver shows an actionable heartbeat with provider, model, elapsed time, and waiting state.
7. If the provider fails, Quiver shows an actionable error and, when available, relevant redacted provider output.
8. TUI-lite output does not alter parsing of the provider result or docs-only validation in `prepare-context`.
9. The implementation audits the listed planner/reviewer commands and either adopts the renderer or records a concrete reason and follow-up.
10. The renderer is shared or structured for reuse instead of being hardcoded only inside `prepare-context`.
11. Documentation updates cover `docs/CLI_UX_GUIDE.md`, `docs/reference/commands.md`, and `README_FOR_AI.md` when the visible agent contract changes.
12. Tests cover TTY verbose, TTY non-verbose, no-TTY/CI, no-color, JSON cleanliness, provider success, provider failure, redaction/truncation, and `--review --interactive` compatibility.
13. The feature does not introduce a heavyweight TUI dependency or behavior that blocks automation.
14. The visual style follows `docs/CLI_UX_GUIDE.md` and Quiver's existing CLI theme.

## Approved Technical Plan

1. Add parser and option plumbing for `--verbose`, scoped to provider-backed commands and rejected or ignored safely where unsupported.
2. Extend provider execution internals with optional stream/status callbacks while preserving accumulated stdout/stderr and final result shape.
3. Create a reusable TUI-lite provider renderer under the CLI library layer.
4. Wire renderer activation through TTY-aware UX mode checks: human TTY + `--verbose` + live provider execution only.
5. Integrate the renderer into `runPrepareContextWithPlanner`.
6. Audit and adopt the same pattern for planner/reviewer commands using shared provider progress paths.
7. Keep provider output redacted/truncated before display and never persist new unredacted logs.
8. Update docs and AI guidance after behavior is implemented.
9. Add focused unit/command tests and final full-suite/package validation.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | TUI-lite contract foundation | completed | none |
| slice-01 | Provider stream hooks | planned | slice-00 |
| slice-02 | Live output renderer | planned | slice-01 |
| slice-03 | Prepare-context integration | planned | slice-02 |
| slice-04 | Planner command audit and adoption | planned | slice-03 |
| slice-05 | Docs, tests, and readiness | planned | slice-04 |

## Validation Strategy

```bash
node --test tests/lib/ai-providers.test.js tests/lib/cli-ux.test.js
node --test tests/commands/ai-prepare-context-planner.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js
node --test tests/**/*.test.js
npm run smoke:create-quiver
npm run package:quiver
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v44-provider-live-output-tui-lite --strict
```

## Risks

- Streaming output can leak sensitive values if redaction is bypassed.
- Spinner and live output can conflict visually if both render at once.
- JSON/no-TTY/CI output can regress if verbose gates are not centralized.
- Provider CLIs may buffer output differently, so heartbeat diagnostics are needed.
- Renderer snapshots can become brittle if tests assert transient spinner frames.

## Resolved Decisions

- Use `--verbose` instead of enabling output by default.
- Implement TUI-lite append-only output, not a full-screen TUI.
- Preserve the current provider result contract.
- Reuse existing Quiver colors and UX mode detection.
- Treat clean automation output as higher priority than visual richness.
