# EXECUTION BRIEF - slice-05: Review-plan closure and agent DX

## Context

Pixel Quiver showed long review/revise loops without a formal signal for when a plan is approvable, approvable with risks, or blocked.
The reconciliation pass also mapped agent-facing command safety, compact executor handoff guidance, and GitHub auth/SSH alias recovery copy to this slice.

## Objective

Make plan reviews actionable and make generated agent commands reproducible and non-interactive.

## Scope

- `ai review-plan` output and metadata.
- Review prompt/contract.
- Agent-facing command examples.
- GitHub auth and SSH alias diagnostic copy used by agent-driven PR flows.
- Compact executor handoff guidance/context packaging.
- Tests for review recommendations.

## Acceptance Criteria

- Review output includes structured blocking status and approval recommendation.
- Required fixes and optional hardening are separated.
- A recommended next command is available.
- Docs/help examples prefer `npx --yes create-quiver@<version>` where appropriate.
- GitHub auth and alias diagnostics provide actionable recovery across macOS, Linux, Windows, Git Bash, WSL, and PowerShell where applicable.
- Executor handoff guidance stays compact and does not require passing the full spec when the slice brief is enough.

## Technical Plan Summary

Extend plan review persistence/output with structured metadata, then update prompt/help/docs, GitHub diagnostic copy, and context-pack guidance for safer agent execution.

## Suggested Execution Steps

1. Add fixtures for review classifications.
2. Update review-plan parsing/persistence.
3. Update CLI output and docs.
4. Improve GitHub auth/alias recovery messaging where gaps are confirmed.
5. Add tests for recommended next command and agent-facing recovery copy.
6. Validate help output snapshots if applicable.

## Restrictions

- Do not weaken approval gates.
- Do not implement repair-plan here.
- Do not store provider, GitHub, or SSH secrets.

## Risks

- Provider text can be inconsistent; metadata generation must be resilient and testable.

## Completion Checklist

- [ ] Review-plan tests pass.
- [ ] GitHub diagnostic tests pass if messaging changes.
- [ ] CLI help/docs updated.
- [ ] Agent command examples verified.
- [ ] Closure evidence updated.
