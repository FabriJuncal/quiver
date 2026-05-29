# EXECUTION_BRIEF - slice-05 Docs, tests, and readiness

## Context

The runtime behavior changes visible CLI output, so public documentation and AI guidance must be aligned before the spec is considered ready.

## Objective

Finalize docs, validation evidence, and package readiness for v44.

## Acceptance Criteria

- `docs/CLI_UX_GUIDE.md` documents `--verbose` provider live output behavior and constraints.
- `docs/reference/commands.md` documents the supported command usage.
- `README_FOR_AI.md` is updated if the agent-visible contract changed.
- Focused tests pass.
- Broad tests/smokes/package validation are run or blocked with concrete evidence.
- `EVIDENCE_REPORT.md`, `STATUS.md`, and closure briefs are updated.

## Completion Checklist

- [ ] Docs updated.
- [ ] Focused tests run.
- [ ] Broad validation run or blocked with evidence.
- [ ] Evidence report updated.
- [ ] Spec status updated.
