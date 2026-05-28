## Title

Quiver v34: CLI dashboard status

## Summary

- Adds a read-only `dashboard` command for consolidated Quiver project state.
- Shows specs, slices, global progress, visible progress, next ready work, blockers, warnings, approvals, agents, active-slice state, runs, evidence counts, and next safe commands.
- Keeps the dashboard CLI-first and script-safe: no Ink, no prompts, no provider execution, no writes.
- Adds compact `dashboard --json` output with a stable schema.
- Adds docs, generated scripts, tests, smokes, and release-readiness evidence.

## Scope

- Dashboard report contract.
- Human and JSON dashboard output.
- Top-level CLI command routing and help.
- Edge-case handling for missing specs, invalid graphs, legacy/incomplete layouts, no-spec states, no-color, CI/no-TTY, and evidence/log redaction.
- Docs, generated templates, package scripts, tests, and evidence.

## Files

- `README.md`
- `README_FOR_AI.md`
- `docs/CLI_UX_GUIDE.md`
- `docs/reference/commands.md`
- `src/create-quiver/commands/dashboard.js`
- `src/create-quiver/index.js`
- `src/create-quiver/lib/dashboard.js`
- `src/create-quiver/lib/init-docs.js`
- `tests/commands/dashboard.test.js`
- `tests/commands/cli-contract.test.js`
- `tests/commands/ux-flags.test.js`
- `tests/lib/dashboard.test.js`
- `tests/lib/init-docs.test.js`
- `tests/lib/init-layout.test.js`
- `specs/quiver-v34-cli-dashboard-status/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm.
- No provider credentials are required.
- No GitHub credentials are required.

### Worktree Access

- One dedicated branch/worktree for `quiver-v34-cli-dashboard-status`.
- One commit per slice.

### Use Cases

- Run `npx create-quiver dashboard` in a project with specs and slices.
- Run `npx create-quiver dashboard --json` and parse stdout as JSON.
- Run `npx create-quiver dashboard --spec <slug>` for an existing spec.
- Run `npx create-quiver dashboard --spec missing-spec` and verify actionable failure.
- Run `npx create-quiver dashboard --include-completed` and verify completed slices are visible while global progress remains correct.
- Run in legacy/incomplete/no-spec/no-slice fixtures and verify useful output without crashes.
- Run with no-color/CI/no-TTY conditions and verify no prompts, spinners, or color-only semantics.

### Technical Verification

- `node --test tests/lib/dashboard.test.js`
- `node --test tests/commands/dashboard.test.js`
- `node --test tests/commands/cli-contract.test.js tests/commands/ux-flags.test.js`
- `node --test tests/lib/ai-export-state.test.js tests/commands/ai-export.test.js`
- `node --test tests/lib/init-docs.test.js tests/lib/init-layout.test.js`
- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `npm run smoke:doctor-fixtures`
- `npm run smoke:guided-workflow`
- `npm run package:quiver`
- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v34-cli-dashboard-status`

## Evidence

- `node --test tests/lib/dashboard.test.js tests/commands/dashboard.test.js tests/commands/cli-contract.test.js tests/commands/ux-flags.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js` passed.
- `node --test` passed: 511 tests.
- `npm run smoke:create-quiver` passed.
- `npm run smoke:doctor-fixtures` passed: 13 states.
- `npm run smoke:guided-workflow` passed.
- `npm run package:quiver` passed: `create-quiver-0.15.2.tgz`.
- `node bin/create-quiver.js dashboard --json --spec quiver-v34-cli-dashboard-status` passed.
- `git diff --check` passed.
- `node bin/create-quiver.js spec validate specs/quiver-v34-cli-dashboard-status` passed.

## Rollback

Revert slice commits in reverse order. The dashboard is additive and read-only, so rollback should not affect existing workflow commands if done by slice.

## Risks / Notes

- Dashboard progress must distinguish global progress from visible filtered progress.
- `dashboard --json` must stay compact and must not duplicate the full `ai export` contract.
- Graph errors must not break the entire dashboard.
- Evidence/log content must not be printed.
- This PR does not publish npm.
