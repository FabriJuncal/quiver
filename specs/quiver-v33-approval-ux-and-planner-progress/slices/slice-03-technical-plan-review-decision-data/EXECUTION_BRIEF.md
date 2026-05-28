# EXECUTION_BRIEF - slice-03 Technical-plan review decision data

## Context

Technical-plan approval already has safety checks, but users need visible decision data before approving.

## Objective

Surface plan-review state and recommendation consistently during technical-plan approval.

## Scope

- `src/create-quiver/lib/ai/plan-review.js`
- approval candidate helpers
- `runApprove` selector output if needed
- focused plan-review tests

## Acceptance Criteria

- Missing, stale, unapproved, approve, approve-with-risk, and revise states are distinguishable.
- Revise blocks approval.
- Approve-with-risk remains approvable and visible.
- Required fixes, optional hardening, risks, and next command are shown where relevant.
- Existing technical-plan approval validation remains intact.

## Technical Plan Summary

Extend the shared candidate data with normalized review-decision fields and consume them in the approval selector.

## Suggested Steps

1. Normalize review decision state.
2. Add candidate annotations for technical-plan.
3. Update selector rendering or approval summaries.
4. Add tests for all review states.

## Restrictions

- Do not modify provider prompts.
- Do not change review-result schema unless needed for backward compatibility.

## Risks

- Displaying unapproved vs reviewed states incorrectly can lead users to approve the wrong artifact.

## Completion Checklist

- [ ] Review states normalized.
- [ ] Blocking behavior preserved.
- [ ] Tests cover all review states.
