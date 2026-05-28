# Execution Plan - Quiver v36 Portable AI Run Watch

## Execution Rules

- Do not implement without an approved slice.
- Keep one slice per focused change set.
- Preserve CI/no-TTY/JSON cleanliness.
- Never persist unredacted provider output or prompts.
- Do not introduce `tmux`, `zellij`, AppleScript, Windows Terminal automation, or `node-pty` as required behavior.

## Suggested Order

1. `slice-00-foundation-and-handoffs`
2. `slice-01-run-schema-path-safety`
3. `slice-02-event-writer-redacted-logs`
4. `slice-03-provider-streaming-integration`
5. `slice-04-ai-run-watch-command`
6. `slice-05-main-progress-user-guidance`
7. `slice-06-docs-generated-guidance`
8. `slice-07-tests-cross-platform-readiness`

## Parallelization Guidance

- `slice-01` must run before runtime implementation.
- `slice-02` must run before provider streaming and watcher finalization.
- `slice-03` and `slice-04` can overlap only after `slice-02` if file ownership is split carefully; default to sequential unless delegated worktrees prove no overlap.
- `slice-05` depends on the actual provider streaming and watcher command.
- `slice-06` and `slice-07` should run after behavior stabilizes.

## Final Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v36-ai-run-watch-portable --strict
npm run package:quiver
npm run smoke:create-quiver
node scripts/ci/smoke-cross-platform.js
```
