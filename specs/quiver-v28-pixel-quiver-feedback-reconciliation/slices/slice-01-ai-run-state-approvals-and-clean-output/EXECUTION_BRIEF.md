# EXECUTION BRIEF - slice-01: AI run state, approvals, and clean output

## Context

Pixel Quiver observed stale run state, approval history mixed with active work, and noisy provider output in AI commands.

## Objective

Make AI run and approval state clear, scoped to the active run when requested, and safe for humans and agents to consume.

## Scope

- AI command lifecycle and approvals.
- Clean draft persistence.
- Raw provider log storage and redaction.
- Tests for run/approval states.

## Acceptance Criteria

- Active run and historical approvals are distinguishable.
- Clean drafts do not include prompt echo or raw provider logs.
- Raw logs are stored separately and redacted.
- Existing run/approval data remains readable.

## Technical Plan Summary

Add or refine run-state and approval helpers, update AI command output, and add fixtures/tests around old and active lifecycle data.

## Suggested Execution Steps

1. Read `slice-00` final matrix for exact findings assigned here.
2. Add failing tests for stale/historical approvals and noisy output.
3. Update run/approval resolution.
4. Update raw artifact persistence and output formatting.
5. Run focused tests and update closure evidence.

## Restrictions

- Do not implement spec generation changes in this slice.
- Do not change provider credentials handling.
- Do not store secrets.

## Risks

- Existing `.quiver/approvals` layouts may vary across versions.

## Completion Checklist

- [ ] Run-state tests pass.
- [ ] Approval grouping tests pass.
- [ ] Clean draft/raw log tests pass.
- [ ] Documentation evidence updated.

