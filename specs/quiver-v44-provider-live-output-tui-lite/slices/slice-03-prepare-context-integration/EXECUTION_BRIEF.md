# EXECUTION_BRIEF - slice-03 Prepare-context integration

## Context

`ai prepare-context --with-planner` is the first target because it exposed the spinner-only opacity during dogfooding.

## Objective

Wire `--verbose` TUI-lite output into planner-assisted `ai prepare-context` without changing default behavior.

## Acceptance Criteria

- `--verbose` is parsed and passed to `runPrepareContextWithPlanner`.
- Human TTY verbose mode shows the TUI-lite renderer.
- Non-verbose mode keeps the existing progress checks and spinner.
- Dry-run, print-prompt, JSON, CI, and no-TTY modes stay clean.
- Review/interactive gates still run before docs writes.
- Provider result parsing and docs-only validation remain unchanged.

## Completion Checklist

- [ ] Parser plumbing added.
- [ ] Prepare-context integration added.
- [ ] Success/failure tests added.
- [ ] Automation-safe modes verified.
