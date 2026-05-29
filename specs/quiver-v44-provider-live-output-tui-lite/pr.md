## Title

Document Quiver v44 provider live output TUI-lite spec

## Summary

- Adds the approved v44 spec package for opt-in provider live output TUI-lite.
- Documents acceptance criteria, technical plan, execution order, risks, and PR scope.
- Adds slice handoffs for provider stream hooks, renderer, prepare-context integration, planner-command adoption, and readiness.
- Updates the docs index so the new spec is discoverable.

## Scope

Included:

- `specs/quiver-v44-provider-live-output-tui-lite/**`
- `docs/INDEX.md`

Excluded:

- Runtime implementation.
- CLI parser changes.
- Provider runner changes.
- Tests beyond structural spec validation.

## Files

- `docs/INDEX.md`
- `specs/quiver-v44-provider-live-output-tui-lite/SPEC.md`
- `specs/quiver-v44-provider-live-output-tui-lite/STATUS.md`
- `specs/quiver-v44-provider-live-output-tui-lite/EXECUTION_PLAN.md`
- `specs/quiver-v44-provider-live-output-tui-lite/EVIDENCE_REPORT.md`
- `specs/quiver-v44-provider-live-output-tui-lite/pr.md`
- `specs/quiver-v44-provider-live-output-tui-lite/slices/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js available.
- Repository dependencies installed.
- Run commands from the repository root.

### Worktree Access

- Use the feature branch for `QUIVER-44-00`.
- Do not mix runtime implementation changes into this documentation PR.

### Run the Project

No runtime server is required. This PR only adds spec documentation.

### Use Cases

1. Review the v44 spec and confirm it captures the approved `--verbose` TUI-lite provider output requirements.
2. Review slice handoffs and confirm each future slice has `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
3. Confirm `docs/INDEX.md` links to the v44 spec.

### Technical Verification

```bash
node -e "const fs=require('fs'); for (const f of fs.globSync('specs/quiver-v44-provider-live-output-tui-lite/slices/*/slice.json')) JSON.parse(fs.readFileSync(f,'utf8')); console.log('slice json ok')"
node bin/create-quiver.js spec validate specs/quiver-v44-provider-live-output-tui-lite --strict
git diff --check
```

## Evidence

```text
slice json ok
PASS: spec validation passed.
git diff --check passed with no output.
```

## Rollback

Revert the documentation commit. No runtime code, generated package output, or persisted Quiver state is changed.

## Risks / Notes

- This PR intentionally does not implement `--verbose` runtime behavior.
- Follow-up implementation starts at `slice-01-provider-stream-hooks`.
- The spec follows `docs/GITFLOW_PR_GUIDE.md`: documentation PR first, implementation slices after merge.
- Repository remote currently exposes `origin/main` but not `origin/develop`; this PR targets `main`.
node --test tests/lib/ai-providers.test.js tests/lib/cli-ux.test.js
node --test tests/commands/ai-prepare-context-planner.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js
node --test tests/**/*.test.js
npm run smoke:create-quiver
npm run package:quiver
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v44-provider-live-output-tui-lite --strict
```
