# Quiver v33 - Approval UX and Planner Progress

**Date:** 2026-05-28
**Status:** Completed
**Source:** User-approved acceptance criteria and production review for approval selectors, planner progress, and consistent decision guidance.

Slice numbering resets here. This spec intentionally starts at `slice-00`.

## Problem

Quiver already has visible progress and guided selectors in several AI workflow commands, but the experience is incomplete around planner approvals and technical-plan iteration.

Three gaps create partial-fix risk:

- planner/reviewer commands can still feel inconsistent with `ai prepare-context --with-planner`;
- `ai approve --phase acceptance|technical-plan` requires users to know the exact draft version instead of guiding them with the same kind of selector used by `ai agent set`;
- approval recommendations are spread across `ai approve`, `ai approvals`, `flow`, `ai status`, `ai resume`, `spec create --interactive`, and `plan-review` logic, which can produce conflicting or incomplete next-step guidance.

## Objective

Make planner approval and revision flows production-safe and consistent:

- show real human progress for provider-backed planner/reviewer commands;
- offer TTY selectors for approval versions when `--version` is omitted;
- keep CI/no-TTY/JSON/scripted usage clean and explicit;
- centralize approval candidates and recommendations so every workflow surface presents the same decision state;
- harden incomplete `ai revise --input` usage for both acceptance and technical-plan phases;
- keep `plan-review` blocking semantics strict and visible.

## Scope

### Included

- Shared approval-candidate model for acceptance, technical-plan, and plan-review decision context.
- `ai approve --phase acceptance` selector when `--version` is omitted in TTY.
- `ai approve --phase technical-plan` selector that includes plan-review recommendation, blocking status, required fixes, optional hardening, risks, and next command.
- No-TTY/CI guardrails for `ai approve` without `--version`.
- Missing/incomplete `--input` handling for `ai revise --phase acceptance` and `ai revise --phase technical-plan`.
- Progress/loaders alignment for provider-backed planner commands: `ai plan`, `ai revise`, `ai review-plan`, and `ai repair-plan`.
- Audit and regression coverage for existing long-running flows: `ai onboard`, `ai prepare-context --with-planner`, `ai execute-slice`, `ai execute-plan --execute`, and `ai pr --create`.
- Integration of the shared approval-candidate model into `ai approvals`, `flow`, `ai status`, `ai resume`, and `spec create --interactive`.
- Documentation and tests for human, TTY, no-TTY, CI, JSON, dry-run, print-prompt, no-color, and review-state cases.

### Excluded

- Product feature implementation beyond CLI workflow UX and approval state.
- Replacing the CLI parser.
- Adding a TUI framework.
- Making prompts mandatory.
- Relaxing `plan-review` approval gates.
- Storing provider credentials or secrets.
- Changing WDD + SDD semantics.

## Approved Acceptance Criteria

### Provider Progress

1. `ai plan --phase acceptance --input <file>` shows human progress and a spinner when executing the planner in a human TTY, following the pattern of `ai prepare-context --with-planner`.
2. `ai plan --phase technical-plan` shows the same progress pattern when executing the planner.
3. `ai revise --phase acceptance --input <file>` and `ai revise --phase technical-plan --input <file>` inherit the same progress behavior through the shared planner path.
4. `ai review-plan` shows progress for reading the technical plan, preparing context, preparing the prompt, executing the reviewer, and writing review metadata.
5. `ai repair-plan` is in scope and shows the same provider-progress standard.
6. Existing long-running flows are audited for consistency: `ai onboard`, `ai prepare-context --with-planner`, `ai execute-slice`, `ai execute-plan --execute`, and `ai pr --create`.
7. `--dry-run` and `--print-prompt` never execute providers or show fake loaders.
8. `--json`, CI/no-TTY, `NO_COLOR`, `TERM=dumb`, and `--no-color` remain clean and script-safe.

### Approval Selection

9. `ai approve --phase acceptance` without `--version` opens a TTY selector when prompts are available.
10. `ai approve --phase technical-plan` without `--version` opens a TTY selector when prompts are available and includes plan-review decision data.
11. In no-TTY/CI, `ai approve --phase <phase>` without `--version` fails early with an actionable command using `--version <n>`.
12. Explicit `--version <n>` preserves existing script-safe behavior.
13. Only the latest draft version is approvable. Older versions may be displayed as history but must not be silently approved.
14. The selector recommends the current/latest eligible draft and explains why.
15. Technical-plan approval distinguishes `plan-review` states: `missing`, `stale`, `unapproved`, `reviewed + approve`, `reviewed + approve-with-risk`, and `reviewed + revise`.
16. `reviewed + revise` blocks approval and points to `ai revise --phase technical-plan --input <feedback.md> --dry-run`.
17. `reviewed + approve-with-risk` allows explicit approval while showing risks and optional hardening.
18. Candidate summaries must be concise, truncated, and redacted through existing utilities before printing draft or review snippets.

### Revise Input Guardrails

19. `ai revise --phase acceptance --input` and `ai revise --phase technical-plan --input` handle a missing input value explicitly.
20. Missing input in no-TTY/CI fails with an actionable example.
21. Missing input in TTY may show a selector or focused guidance if useful artifacts are available.
22. Nonexistent input files fail before provider execution.
23. Accidental extra arguments, such as a trailing `s`, are detected or reported clearly instead of being ignored.

### Shared Decision Surfaces

24. A shared approval-candidate model feeds `ai approve`, `ai approvals`, `flow`, `ai status`, `ai resume`, and `spec create --interactive`.
25. These surfaces do not duplicate or contradict next-step recommendations.
26. `spec create --interactive` shows the reviewed and approved technical-plan source using the same decision data.
27. Approval candidates include phase, version, path, created_at, source_file, current/latest flag, review recommendation, blocking state, recommended action, and next command.

### Documentation and Tests

28. `docs/CLI_UX_GUIDE.md`, `docs/reference/commands.md`, and `README_FOR_AI.md` are updated when the visible contract changes.
29. Tests cover TTY selector paths, no-TTY/CI failures, explicit `--version`, latest-draft recommendation, stale/blocked plan-review states, `approve-with-risk`, missing `--input`, accidental extra args, dry-run, print-prompt, no-color, and JSON cleanliness.
30. Implementation does not log secrets or credentials.
31. Every slice in this spec has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.

## Approved Technical Plan

1. Inventory the real command surface and existing tests before implementation.
2. Create a shared approval-candidates module that reads existing approval and plan-review metadata without changing persisted formats unless required.
3. Integrate approval candidates into `ai approvals`, `flow`, `ai status`, `ai resume`, and `spec create --interactive`.
4. Add TTY approval selection in `ai approve` for acceptance and technical-plan when `--version` is omitted.
5. Preserve no-TTY/CI/script behavior by requiring explicit `--version <n>` outside prompts.
6. Harden missing/incomplete `--input` handling in `ai revise` for both planner phases.
7. Align provider progress in `ai plan`, `ai revise`, `ai review-plan`, and `ai repair-plan`.
8. Audit existing progress flows and add regression tests instead of rewriting working behavior unnecessarily.
9. Update public docs and AI guidance only after the command contract is implemented.
10. Add focused tests and final full-suite/smoke validation.

## Slice Roadmap

| Slice | Title | Status | Dependencies |
|---|---|---|---|
| slice-00 | Approval UX foundation | completed | none |
| slice-01 | Approval candidates model | completed | slice-00 |
| slice-02 | Interactive approval selection | completed | slice-01 |
| slice-03 | Technical-plan review decision data | completed | slice-01, slice-02 |
| slice-04 | Revise input guardrails | completed | slice-01 |
| slice-05 | Provider progress alignment | completed | slice-01 |
| slice-06 | Workflow surface integration | completed | slice-01, slice-02, slice-03 |
| slice-07 | Docs, tests, and release readiness | completed | slice-02, slice-03, slice-04, slice-05, slice-06 |

## Validation Strategy

- `node --test tests/lib/approvals.test.js tests/commands/ai-run-state.test.js tests/commands/ai-review-plan.test.js`
- `node --test tests/commands/ai-plan.test.js tests/commands/ai-prepare-context-planner.test.js`
- `node --test tests/commands/ai-agent.test.js tests/lib/cli-selectors.test.js tests/lib/cli-ux.test.js`
- `node --test tests/commands/flow.test.js tests/commands/spec-create.test.js`
- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v33-approval-ux-and-planner-progress`

## Risks

- Approval UX touches critical workflow gates; selector convenience must not weaken plan-review blocking behavior.
- Prompt behavior can break automation if it is not strictly TTY-gated.
- Multiple surfaces can drift if candidate data is not shared.
- Progress output can contaminate JSON or no-TTY output if not centralized.
- Draft snippets can leak sensitive content unless they are truncated and redacted.

## Resolved Decisions

- `ai repair-plan` is in scope.
- `ai revise --phase acceptance --input` is in scope, not only technical-plan.
- TTY selection for `ai approve` may happen when `--version` is omitted, but CI/no-TTY must require explicit flags.
- Only the latest draft is approvable.
- `plan-review` recommendation `revise` remains blocking.
- `approve-with-risk` remains approvable with visible risk context.
- Do not add `--review` to commands that do not need editor review.
