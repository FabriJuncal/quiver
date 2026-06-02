# EXECUTION_BRIEF - slice-03 security reporting channel

## Context

`SECURITY.md` currently asks for private reporting but must provide a concrete, usable channel.

## Objective

Make private vulnerability reporting concrete and verifiable.

## Scope

- `SECURITY.md`.
- Evidence of GitHub private reporting or fallback contact.
- Closure notes for any external owner action.

## Acceptance Criteria

- A concrete private reporting channel is documented.
- If GitHub Private Vulnerability Reporting is used, evidence or owner confirmation is recorded.
- If remote settings cannot be verified, a functional fallback channel is documented.
- No vague reporting instruction remains without a channel.

## Expected Files To Modify

- `SECURITY.md`
- `specs/quiver-v50-audit-trust-foundation/EVIDENCE_REPORT.md`
- `specs/quiver-v50-audit-trust-foundation/STATUS.md`

## Validations Required

- `git diff --check`

## Risks

- Treating an unverifiable GitHub setting as done.
- Publishing security contact instructions that do not work.

## Dependencies

- Depends on `slice-00-audit-baseline-and-resolved-findings`.

## Instructions For Executor

1. Pick the concrete reporting channel based on available repository settings.
2. If external verification is impossible, document the required owner action and fallback.
3. Keep wording concise and actionable.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Security reporters have a private path that can actually be used.
