## Title

Quiver v22 - Guided AI workflow

## Summary

Adds the plan for a guided AI workflow that takes Quiver from project preparation through planner approvals, spec generation, slice execution, PR creation, and post-merge cleanup.

The goal is to make Quiver feel like an AI-first delivery assistant: the planner handles context and decisions, cheaper executors handle bounded slices, each slice becomes one commit, and the human remains responsible for approvals and PR merge.

## Scope

- Documentation source-of-truth sync
- Guided project preparation command
- AI context refresh with safe exclusions
- Draft and approved planner artifact persistence
- One spec per worktree lifecycle
- Executor validation, recovery, and optional commit per slice
- Execution waves for safe sequential and parallel slice work
- PR creation with `gh` and SSH guidance
- Post-merge cleanup
- Package/release safety checks
- Final docs, scripts, and smoke coverage

## Files

- `specs/quiver-v22-guided-ai-workflow/SPEC.md`
- `specs/quiver-v22-guided-ai-workflow/STATUS.md`
- `specs/quiver-v22-guided-ai-workflow/EVIDENCE_REPORT.md`
- `specs/quiver-v22-guided-ai-workflow/EXECUTION_PLAN.md`
- `specs/quiver-v22-guided-ai-workflow/pr.md`
- `specs/quiver-v22-guided-ai-workflow/slices/**`

Future implementation slices are expected to touch CLI source, AI orchestration modules, analyzer/context modules, worktree lifecycle code, PR helpers, tests, templates, generated docs, and smoke scripts as declared in each slice.

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by Quiver
- npm
- Git
- `gh` for PR creation slices
- Optional local provider CLIs for manual checks:
  - `codex`
  - `claude`
  - `gemini`

### Worktree Access

Use one dedicated worktree for this spec PR. Parallel slices may use temporary slice worktrees only when the execution plan marks them safe and their changed-file scopes do not conflict.

### Run the Project

For documentation-only `slice-00`, validate files and JSON:

```bash
git diff --check
find specs/quiver-v22-guided-ai-workflow -name "slice.json" -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" {} \;
```

For implementation slices, run the validation commands declared in each `slice.json` and `EXECUTION_BRIEF.md`.

### Use Cases

- New user prepares a repo for AI-assisted work.
- Planner creates and iterates acceptance criteria.
- Planner creates and iterates the technical plan.
- Approved plan generates spec, slices, handoffs, execution plan, and PR body.
- Executor runs a bounded slice with reduced context.
- Slice validation passes and one commit is created.
- Failed slice leaves a recoverable report.
- Ready slices are grouped into safe execution waves.
- PR is created from `pr.md` after `gh` and SSH checks.
- Merged spec worktree is closed and main local checkout is updated.

### Technical Verification

- Dry-run paths write nothing.
- Approval transitions are explicit and persisted.
- Context excludes secrets, env files, generated outputs, dependency folders, and local AI tool state.
- Worktree cleanup refuses dirty or unmerged work.
- PR creation uses `gh` without opening a PR in tests.
- Release safety fails if unsafe local files would enter the npm package.

## Evidence

To be completed by implementation slices. Expected evidence includes:

- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- targeted smoke tests for guided prepare, approval flow, executor commit, execution waves, PR creation, cleanup, and release safety
- `git diff --check`

## Rollback

Revert the smallest failing slice commit. Since the spec requires one slice per commit, rollback should target the affected slice commit rather than the full PR when possible.

## Risks / Notes

- This spec intentionally does not automate PR merge.
- Short command naming must not conflict with the canonical `npx create-quiver` guidance.
- Parallel execution must remain conservative until conflict detection is reliable.
- Tool installation and SSH setup must require explicit user approval.
