# EXECUTION_BRIEF - slice-07 Tests and cross-platform readiness

## Context

The feature changes long-running AI command observability and touches persistence, redaction, command UX, and docs. Final validation must prove the full workflow is production-ready across supported terminals and platforms.

## Objective

Add and run final automated validation, package smoke tests, and cross-platform smoke coverage for the portable watcher.

## Scope

- Focused unit and command tests
- Integration-style simulated provider streaming tests
- Package smoke validation
- Cross-platform smoke script updates
- Final evidence report updates

## Acceptance Criteria

- Tests cover path traversal and malformed run ids.
- Tests cover missing run, `--latest`, completed, failed, canceled, stale, and legacy runs.
- Tests cover partial JSONL lines during append.
- Tests cover split secrets, ANSI/control character sanitization, and log truncation.
- Tests cover no-TTY, CI, JSON, dry-run, and print-prompt behavior.
- Tests cover paths with spaces.
- Simulated provider streaming proves stdout/stderr capture, event persistence, cancellation, and failure handling.
- Package smoke proves `npx create-quiver ai run watch ...` resolves from the packaged CLI.
- Final evidence records commands run and any remaining risks.

## Technical Plan Summary

Close gaps left by earlier slices with targeted tests first, then run full project validation and package smokes. Prefer deterministic local simulations over external provider calls.

## Restrictions

- Do not require real provider credentials for validation.
- Do not require `tmux`, `zellij`, Windows Terminal automation, or `node-pty`.
- Do not rely on platform-specific shell syntax in required smoke tests.

## Completion Checklist

- [ ] Focused tests added or updated.
- [ ] Cross-platform smoke covers watcher behavior.
- [ ] Package smoke covers packaged command resolution.
- [ ] Evidence report updated with command results.
