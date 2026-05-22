# EXECUTION BRIEF - slice-06: Spec, slice, handoff, and PR body generation

## Context

Once the technical plan is approved, Quiver must turn it into durable artifacts that agents and humans can execute.

## Objective

Generate complete spec/slice/handoff/PR artifacts from approved planner output.

## Scope

- Spec folder creation.
- Mandatory `slice-00`.
- Slice JSON and handoff generation.
- `EXECUTION_PLAN.md`, `EVIDENCE_REPORT.md`, `STATUS.md`, and `pr.md`.
- File scope declarations.
- Dry-run previews.

## Acceptance Criteria

- Generation is blocked before plan approval.
- Dry-run lists all proposed files.
- Artifacts follow Quiver layout.
- Every slice has handoffs and parseable JSON.
- `slice-00` exists.

## Technical Plan Summary

Transform approved planner output into the canonical `specs/<spec-slug>/` structure and validate before writing.

## Suggested Execution Steps

1. Define artifact generator contracts.
2. Add dry-run preview.
3. Generate top-level files.
4. Generate slices and handoffs.
5. Validate JSON and required files.
6. Test with fixture planner outputs.

## Restrictions

- Do not run execution agents.
- Do not commit or open PRs.

## Risks

- Poor planner output may create unusable slices. Validate and fail with actionable messages.

## Completion Checklist

- [ ] Dry-run tested.
- [ ] Generated files validated.
- [ ] Mandatory slice-00 tested.
- [ ] PR body tested.
- [ ] Evidence appended.
