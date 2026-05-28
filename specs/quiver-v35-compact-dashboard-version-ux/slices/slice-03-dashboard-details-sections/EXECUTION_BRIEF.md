# EXECUTION_BRIEF - slice-03 Dashboard details and sections

## Context

The compact default must not remove access to complete state. Deep inspection should be explicit and predictable.

## Objective

Implement `dashboard --details` and `dashboard --section <name>` human renderers.

## Scope

- Full details human report
- Single-section human report
- Shared section registry and tests

## Acceptance Criteria

- `dashboard --details` renders the full human report.
- `dashboard --section slices` renders only slice information and relevant context.
- Supported sections are `overview`, `specs`, `slices`, `blockers`, `warnings`, `agents`, `approvals`, `runs`, `active-slice`, and `next-steps`.
- Unsupported sections list valid values.
- `--limit` applies consistently.
- No evidence/log content leaks.

## Technical Plan Summary

Use the existing dashboard report and shared formatter helpers. Do not fork state collection for sections.

## Suggested Steps

1. Add section registry.
2. Implement details renderer.
3. Implement section renderers.
4. Add tests for each representative section and invalid sections.
5. Verify no JSON behavior changes.

## Restrictions

- Do not recollect state per section.
- Do not add interactive navigation.
- Do not modify `dashboard --json` shape.

## Completion Checklist

- [ ] Details renderer implemented.
- [ ] Section renderer implemented.
- [ ] Section tests pass.
