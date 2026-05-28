## Title

Quiver v33: Approval UX and planner progress

## Summary

- Adds shared approval-candidate guidance for planner phases.
- Adds guided approval selection for `ai approve` in TTY when `--version` is omitted.
- Preserves explicit `--version` behavior for CI/no-TTY/scripted use.
- Hardens incomplete `ai revise --input` usage.
- Aligns progress/loaders for provider-backed planner/reviewer commands.
- Synchronizes approval guidance across `ai approvals`, `flow`, `ai status`, `ai resume`, and `spec create --interactive`.

## Scope

- Approval candidate model and formatting.
- Interactive approval selector.
- Technical-plan plan-review state visibility and blocking.
- Revise input validation.
- Planner/reviewer/repair-plan progress UX.
- Workflow-surface integration.
- Docs, tests, smokes, and release readiness.

## Files

- `README.md`
- `README_FOR_AI.md`
- `docs/CLI_UX_GUIDE.md`
- `docs/reference/commands.md`
- `docs/COMMANDS.md.template`
- `docs/WORKFLOW.md.template`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/flow.js`
- `src/create-quiver/commands/spec.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/approvals.js`
- `src/create-quiver/lib/ai/approval-candidates.js`
- `src/create-quiver/lib/ai/plan-review.js`
- `src/create-quiver/lib/ai/run-state.js`
- `tests/**`
- `specs/quiver-v33-approval-ux-and-planner-progress/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm.
- No provider credentials are required for dry-run/print-prompt tests.
- TTY-like behavior should be tested through injected prompt helpers.

### Worktree Access

- One dedicated branch/worktree for `quiver-v33-approval-ux-and-planner-progress`.
- One commit per slice.

### Use Cases

- Run `ai approve --phase acceptance` in a prompt-capable test harness without `--version`.
- Run `ai approve --phase technical-plan` for plan-review states: missing, stale, unapproved, approve, approve-with-risk, revise.
- Run `ai approve --phase acceptance` in no-TTY/CI without `--version` and verify it fails actionably.
- Run `ai approve --phase acceptance --version 1` and verify existing scripted behavior remains.
- Run `ai revise --phase acceptance --input` and `ai revise --phase technical-plan --input` with missing, invalid, and accidental extra input.
- Run provider-backed planner commands in human mode and verify progress does not leak into JSON/dry-run/print-prompt.

### Technical Verification

- `node --test tests/lib/approvals.test.js tests/commands/ai-run-state.test.js tests/commands/ai-review-plan.test.js`
- `node --test tests/commands/ai-plan.test.js tests/commands/ai-prepare-context-planner.test.js`
- `node --test tests/commands/flow.test.js tests/commands/spec-create.test.js`
- `node --test tests/commands/ai-agent.test.js tests/lib/cli-selectors.test.js tests/lib/cli-ux.test.js`
- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v33-approval-ux-and-planner-progress`

## Evidence

- `git diff --check` passed.
- `node bin/create-quiver.js spec validate specs/quiver-v33-approval-ux-and-planner-progress` passed.
- `node --test tests/**/*.test.js` passed: 496/496.
- `npm run smoke:create-quiver` passed.
- `npm run smoke:doctor-fixtures` passed.
- `npm run smoke:guided-workflow` passed.
- `npm run package:quiver` passed.
- Detailed slice evidence is in `specs/quiver-v33-approval-ux-and-planner-progress/EVIDENCE_REPORT.md`.

## Rollback

Revert slice commits in reverse order. Preserve explicit `--version` approval behavior and existing non-interactive planner workflows during rollback.

## Risks / Notes

- Approval gates are critical workflow safety controls; selector UX must not approve stale or blocked drafts.
- Candidate summaries must remain redacted and truncated.
- Provider progress must not contaminate machine-readable output.
- This PR does not publish npm.
