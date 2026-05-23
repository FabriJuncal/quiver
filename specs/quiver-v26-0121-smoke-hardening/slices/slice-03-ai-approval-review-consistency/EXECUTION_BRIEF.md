# EXECUTION BRIEF - slice-03: AI approval and review consistency

## Context

The smoke test showed that Quiver correctly blocks spec generation without reviewed plan state, but the recovery path can be confusing. A suggested `plan-review` approval phase is not supported by `ai approve`.

## Objective

Make review/approval/spec-create gates coherent, testable, and actionable.

## Scope

- `ai review-plan` guidance.
- `ai approve` phase guidance.
- `spec create` blockers.
- `flow` next-step messages for plan review.
- Tests and docs.

## Acceptance Criteria

- No unsupported approval phase is suggested.
- Missing review state blocks spec creation with the exact next command.
- Reviewed technical-plan drafts can be approved through a supported path.
- Tests cover review/approval/spec-create edge cases.

## Technical Plan Summary

Audit approval state transitions and user-facing messages. Clarify status labels and block conditions without weakening review gates.

## Suggested Execution Steps

1. Reproduce the approved-but-unreviewed state.
2. Audit `flow`, `review-plan`, `approve`, and `spec create` messages.
3. Fix unsupported phase suggestions.
4. Add focused tests for state transitions.
5. Update docs and evidence.

## Restrictions

- Do not allow spec generation from unreviewed technical plans.
- Do not introduce a new phase unless it is fully wired and tested.

## Risks

- Changing approval labels can break existing tests or stored state expectations.

## Completion Checklist

- [ ] Blocker messages are actionable.
- [ ] Supported command path verified.
- [ ] Tests added.
- [ ] Docs updated.

