# EXECUTION_BRIEF - slice-04 AI execution and PR

## Context

Execution and PR commands combine local state, GitHub/gh guidance, validation output, and user approvals.

## Objective

Localize `ai execute-slice`, `ai execute-plan`, and `ai pr` wrapper output.

## Acceptance Criteria

- Human output supports `en` and `es`.
- Git commands, branch names, PR titles, file paths, and validation commands remain exact.
- `--dry-run`, `--review`, and `--interactive` wrapper messages are localized.
- `gh` execution behavior and SSH alias handling are unchanged.
- JSON/automation paths remain stable.

## Completion Checklist

- [ ] Execution wrapper strings cataloged.
- [ ] PR wrapper strings cataloged.
- [ ] Dry-run/review tests updated.
