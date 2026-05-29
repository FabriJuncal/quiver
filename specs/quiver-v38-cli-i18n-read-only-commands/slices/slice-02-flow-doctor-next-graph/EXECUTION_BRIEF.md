# EXECUTION_BRIEF - slice-02 Flow, doctor, next, graph, and plan

## Context

Workflow status commands guide the user's next action and must be clear in the configured language.

## Objective

Localize `flow`, `doctor`, `next`, `graph`, and `plan` human output.

## Acceptance Criteria

- All included commands render human output in `en` and `es`.
- Actionable suggested commands remain exact.
- Warning and blocker labels are localized without changing stable codes.
- JSON outputs remain stable where supported.

## Completion Checklist

- [ ] Command output migrated.
- [ ] Normal, empty, warning, and blocker states tested.
- [ ] JSON regression tests preserved.
