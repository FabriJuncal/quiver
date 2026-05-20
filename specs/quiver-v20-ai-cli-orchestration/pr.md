## Title

Quiver v20 - AI CLI orchestration

## Summary

Adds a spec for a Quiver AI orchestration layer that standardizes local AI CLI usage across planner and executor roles. The work introduces provider runners, token-efficient context packs, phase-gated planning, generated spec/slice/handoff artifacts, execution plans, executor scope enforcement, and GitHub PR preflight with `gh` and SSH validation.

## Scope

- `quiver ai ...` command family
- Provider adapters for Codex, Claude, and Gemini CLIs
- Planner/executor roles
- Context packs and token budget rules
- Phase gates for criteria, plan, and spec generation
- Mandatory `slice-00`
- Spec/slice/handoff/PR body generation
- Execution plan with parallelization rules
- Executor scope enforcement
- `gh` and SSH preflight
- Documentation, generated scripts, and smoke coverage

## Files

- `specs/quiver-v20-ai-cli-orchestration/SPEC.md`
- `specs/quiver-v20-ai-cli-orchestration/STATUS.md`
- `specs/quiver-v20-ai-cli-orchestration/EVIDENCE_REPORT.md`
- `specs/quiver-v20-ai-cli-orchestration/EXECUTION_PLAN.md`
- `specs/quiver-v20-ai-cli-orchestration/pr.md`
- `specs/quiver-v20-ai-cli-orchestration/slices/**`

Future implementation slices are expected to touch CLI source, AI library modules, tests, templates, generated docs, and smoke scripts as declared in each slice.

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js supported by Quiver
- npm
- Git
- `gh` for PR preflight slices
- Optional local provider CLIs for manual checks:
  - `codex`
  - `claude`
  - `gemini`

### Worktree Access

Use one worktree for this spec PR. Parallel slices may use temporary slice worktrees, but each slice must land as one commit in this PR branch.

### Run the Project

For documentation-only `slice-00`, validate files and JSON:

```bash
git diff --check
find specs/quiver-v20-ai-cli-orchestration -name "slice.json" -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" {} \;
```

For implementation slices, run the validation commands declared in each slice.

### Use Cases

- Planner onboarding via provider dry-run
- Planner criteria phase without file writes
- Planner technical-plan phase without file writes
- Spec generation after approval
- Executor slice execution with minimal context
- Scope violation detection
- PR preflight with missing and valid `gh`/SSH config

### Technical Verification

- Provider command construction uses argument arrays.
- Long prompt transport avoids shell string concatenation.
- Context packs exclude sensitive paths.
- `slice-00` is mandatory and every later slice declares dependencies.
- CI uses mocks or dry-run, not real provider auth.

## Evidence

- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `node scripts/ci/smoke-cross-platform.js`
- `bash scripts/ci/smoke-init-docs.sh`
- `git diff --check`
- Provider behavior covered with mocks and dry-runs; no real provider auth required for CI.
- GitHub PR preflight covered with fake `gh` in smoke coverage; no real PR is opened in tests.

## Rollback

Revert the spec PR or the affected slice commit. Since each slice maps to one commit, rollback should target the smallest failing slice commit.

## Risks / Notes

- Provider CLI behavior must be validated carefully during implementation.
- Windows quoting and paths with spaces are a primary regression risk.
- `gh` auth and SSH identity can point to different accounts; preflight must report that clearly.
- `docs/GITFLOW_PR_GUIDE.md` is not present in this source repo; this PR followed `docs/GITFLOW_PR_GUIDE.md.template` as the available canonical guide. Generated projects do materialize `docs/GITFLOW_PR_GUIDE.md`.
- This PR targets `main` because `develop` is behind `main` and would include unrelated historical commits in the diff.
