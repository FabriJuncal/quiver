## Title
Quiver v25 - AI-First Lifecycle Orchestrator

## Summary

- Implements the Quiver v25 AI-first lifecycle orchestrator across CLI, state, planner approval gates, generated artifacts, controlled execution, worktrees/PRs, validation hardening, export, and migration dry-runs.
- Adds durable `.quiver/` run state, agent profiles, prompt-only/provider adapter flows, phase-gated planning, reviewed technical-plan approval, generated specs/slices/handoffs/PR body, and one-slice execution closure.
- Adds dashboard/agent-friendly lifecycle inspection and export commands for specs, slices, runs, agents, dependencies, blockers, progress, and migration state.

## Scope

- Product implementation for all v25 slices from `slice-01` through `slice-11`.
- Documentation, templates, tests, smoke coverage, CLI help, generated npm scripts, and spec evidence.
- No package release is included.

## Files

- `README.md`
- `README_FOR_AI.md`
- `docs/**`
- `package.json`
- `scripts/ci/**`
- `src/create-quiver/**`
- `specs/quiver-v25-ai-first-lifecycle-orchestrator/**`
- `tests/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- Git checkout with the v25 branch.
- No provider CLI credentials are required for dry-run/prompt-only validations.

### Worktree Access

- Run commands from the repository root.
- This PR does not require a running app server.

### Run the Project

```bash
node --test tests/**/*.test.js
npm run smoke:create-quiver
npm run smoke:guided-workflow
npm run smoke:doctor-fixtures
```

### Use Cases

- Create and inspect AI lifecycle runs with `ai run create`, `ai status`, and `ai resume`.
- Prepare docs-only context with `ai prepare-context --dry-run`.
- Generate planner drafts, revise them, approve concrete versions, and create specs only after reviewed approval.
- Execute or print slice prompts with `ai prompt-slice`, `ai execute-slice`, and `ai execute-plan`.
- Inspect/export lifecycle state with `ai inspect`, `ai export`, `ai specs list`, `ai slices list`, and `ai trace report`.

### Technical Verification

```bash
git diff --check
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); JSON.parse(require('fs').readFileSync('specs/quiver-v25-ai-first-lifecycle-orchestrator/slices/slice-11-export-dashboard-migration/slice.json','utf8'));"
```

## Evidence

- See `specs/quiver-v25-ai-first-lifecycle-orchestrator/EVIDENCE_REPORT.md`.

## Rollback

- Revert the v25 slice commits in reverse order.
- No migration or PR command writes unless invoked explicitly; dry-runs remain available for recovery.

## Risks / Notes

- Source-of-truth docs should not claim npm publication unless publication has been verified.
- `CHANGELOG.md`/`ROADMAP.md` still need release-version sync before npm publishing.
- The lifecycle export JSON is `schema_version: 1`; dashboard consumers should pin expectations.
