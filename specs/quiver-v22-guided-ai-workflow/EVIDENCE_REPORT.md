# Evidence Report - Quiver v22 Guided AI Workflow

## Status

Implementation is completed. Slices `slice-00` through `slice-10` are completed.

## Slice Evidence

| Slice | Evidence |
|-------|----------|
| slice-00 | Spec foundation files created. All `slice.json` files parse successfully and `git diff --check` passed. |
| slice-01 | Documentation source-of-truth sync completed. README no longer claims `package.json`/CHANGELOG are at 0.9.0, CHANGELOG includes 0.10.0, ROADMAP/BACKLOG distinguish shipped v20/v21 work from the then-active v22 implementation line, and targeted tests passed. |
| slice-02 | Prepare command implemented with dry-run diagnostics, GitHub CLI guidance, provider CLI guidance, SSH identity/auth recovery steps, and next safe command output. Targeted tests passed. |
| slice-03 | Analyze now refreshes `docs/AI_CONTEXT.md`, keeps `docs/PROJECT_MAP.md` visible, keeps raw scan under `.quiver/scans/PROJECT_SCAN.json`, summarizes missing/assumed context, and excludes secret/noisy paths from AI-facing context. Targeted tests passed. |
| slice-04 | Planner approval state implemented under `.quiver/approvals`, with draft persistence, explicit approvals, default use of approved acceptance/technical-plan inputs, `ai approvals` status, and blocking of unapproved/stale inputs. Targeted tests passed. |
| slice-05 | Spec-level worktree lifecycle implemented with `spec start/status`, safe main/develop base selection, dirty worktree protection, and `slice-00` completion guard for later `start-slice` executions. Targeted tests passed. |
| slice-06 | `ai execute-slice` now keeps executor context bounded, validates scope, runs declared validation commands, reports retry/abort guidance on failure, and creates exactly one commit when `--commit` is enabled after successful provider, scope, and validation stages. Targeted tests passed. |
| slice-07 | Execution waves now distinguish parallel-ready groups from sequential fallback, block parallel suggestions on unknown or overlapping file scopes, print dry-run executor commands without provider calls, and support explicit `ai execute-plan --execute --commit` with stop-on-failure behavior. Targeted tests passed. |
| slice-08 | `ai pr` now validates setup, reads generated `pr.md`, prints a dry-run `gh pr create` plan, and creates the PR only with explicit `--create`. Missing gh/auth/guide/identity/body/dirty state still blocks with guidance. Tests mock gh and real PR creation is not required. |
| slice-09 | `spec close` now blocks unmerged or dirty spec worktrees, removes merged clean worktrees, and pulls the main checkout when a remote base exists. Package safety now checks npm tarball contents for env files, npm credentials, AI local state, worktree state, and local worktree context before package smoke passes. Targeted tests and package smoke passed. |
| slice-10 | Final docs and generated templates now present the guided AI workflow as available behavior. Smokes cover prepare, approvals, execution waves, PR dry-run/create mocks, cleanup, package safety, generated project scripts, post-analyze AI context front matter, and mandatory `slice-00` fixtures. Full tests, smokes, JSON validation, diff check, and npm pack dry-run passed. |

## Validation Log

- 2026-05-21: `find specs/quiver-v22-guided-ai-workflow -name "slice.json" -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" {} \;`
- 2026-05-21: `git diff --check`
- 2026-05-21: `node --test tests/commands/analyze.test.js tests/commands/ai-plan.test.js tests/commands/ai-pr.test.js`
- 2026-05-21: `node --test tests/commands/prepare.test.js tests/lib/ai-github.test.js tests/lib/ai-providers.test.js tests/lib/doctor.test.js`
- 2026-05-21: `node --test tests/commands/analyze.test.js tests/lib/ai-context-packs.test.js tests/lib/ai-safety.test.js`
- 2026-05-21: `node --test tests/commands/ai-plan.test.js tests/commands/ai-plan-spec-phase.test.js tests/lib/approvals.test.js`
- 2026-05-21: `node --test tests/lib/lifecycle.test.js tests/commands/spec-worktree.test.js`
- 2026-05-21: `node --test tests/lib/check-slice.test.js tests/commands/next.test.js`
- 2026-05-21: `git diff --check`
- 2026-05-21: `node --test tests/commands/ai-execute-slice.test.js tests/lib/ai-executor.test.js tests/lib/scope.test.js`
- 2026-05-21: `git diff --check`
- 2026-05-21: `node --test tests/lib/ai-execution-plan.test.js tests/commands/ai-execute-plan.test.js`
- 2026-05-21: `node --test tests/commands/ai-execute-slice.test.js tests/lib/ai-executor.test.js`
- 2026-05-21: `git diff --check`
- 2026-05-21: `node --test tests/commands/ai-pr.test.js tests/lib/ai-github.test.js`
- 2026-05-21: `git diff --check`
- 2026-05-21: `node --test tests/commands/spec-close.test.js tests/lib/package-safety.test.js`
- 2026-05-21: `bash scripts/package-quiver.sh`
- 2026-05-21: `node --test tests/commands/spec-worktree.test.js tests/lib/lifecycle.test.js tests/commands/spec-close.test.js tests/lib/package-safety.test.js`
- 2026-05-21: `git diff --check`
- 2026-05-21: `node --test tests/lib/init-layout.test.js tests/lib/init-docs.test.js tests/commands/init-profiles.test.js`
- 2026-05-21: `node --test tests/commands/analyze.test.js tests/lib/init-docs.test.js`
- 2026-05-21: `npm run smoke:guided-workflow`
- 2026-05-21: `node --test tests/**/*.test.js`
- 2026-05-21: `npm run smoke:create-quiver`
- 2026-05-21: `npm run smoke:tiered-pack`
- 2026-05-21: `npm --cache /private/tmp/quiver-npm-cache pack --dry-run`
- 2026-05-21: `git diff --check`
- 2026-05-21: `find specs/quiver-v22-guided-ai-workflow -name slice.json -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" {} \;`

## Notes

- `npm pack --dry-run` failed once against the global npm cache because `~/.npm` contains root-owned files. Re-running with `npm --cache /private/tmp/quiver-npm-cache pack --dry-run` passed.
- No npm publish was performed by this slice.
