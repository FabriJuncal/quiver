# EXECUTION BRIEF - slice-05: Approval gates and planner iterations

## Context

Human approval is central to Quiver. Planner output must be iterated and approved before later phases can run.

## Objective

Persist criteria and technical-plan drafts, revisions, and approvals with strict phase gates.

## Scope

- Acceptance criteria drafts.
- Technical-plan drafts.
- Revise commands.
- Approval commands.
- Approval state and phase blocking.

## Acceptance Criteria

- Drafts are versioned.
- Revisions do not advance phase.
- Approvals require concrete versions.
- Spec generation is blocked before approval.
- Approval history survives session changes.

## Technical Plan Summary

Use the run state from slice-02 and adapter prompts from slice-04 to manage planner drafts and approvals.

## Suggested Execution Steps

1. Define draft storage layout.
2. Add criteria draft/revise/approve behavior.
3. Add technical-plan draft/revise/review/approve behavior.
4. Wire phase guards.
5. Test invalid transitions.

## Restrictions

- Do not create spec/slice files in this slice.
- Do not execute implementation agents.

## Risks

- Loose approval semantics can let users approve the wrong version. Require explicit version IDs.

## Completion Checklist

- [ ] Criteria gate tested.
- [ ] Technical-plan gate tested.
- [ ] Invalid transitions tested.
- [ ] Approval state documented.
- [ ] Evidence appended.
