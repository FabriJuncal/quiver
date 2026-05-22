# EXECUTION BRIEF - slice-11: Export, dashboard-friendly output, and migration

## Context

Quiver should expose its state to humans, agents, and optional visualizers without turning the core package into a full web application.

## Objective

Add inspection, export, dashboard-friendly output, and migration dry-runs.

## Scope

- `status`, `specs list`, `slices list`, `inspect`, and `trace report` style outputs.
- JSON and Markdown export.
- Dashboard-friendly state shape.
- Migration dry-run for older Quiver projects.

## Acceptance Criteria

- Inspection output is actionable.
- JSON export is machine-readable.
- Markdown export is readable.
- Migration dry-run writes nothing.
- Older project fixtures get clear guidance.
- No heavy UI dependencies are added.

## Technical Plan Summary

Build on execution planning and validation so export and migration reflect real Quiver state rather than ad-hoc file reads.

## Suggested Execution Steps

1. Define export JSON contract.
2. Add Markdown export.
3. Add inspection/list/report commands.
4. Add migration dry-run checks.
5. Test against older-project fixtures.

## Restrictions

- Do not add a persistent web server to core.
- Do not perform destructive migration without preview.

## Risks

- Export contracts can become public APIs. Version the shape or document stability.

## Completion Checklist

- [ ] JSON export tested.
- [ ] Markdown export tested.
- [ ] Inspection commands tested.
- [ ] Migration dry-run tested.
- [ ] Evidence appended.
