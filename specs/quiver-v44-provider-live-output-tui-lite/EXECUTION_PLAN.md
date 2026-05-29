# Execution Plan - Quiver v44 Provider Live Output TUI-lite

## Execution Rules

- Do not stream provider output unless `--verbose` is explicitly passed.
- Keep non-verbose behavior unchanged.
- Keep `--json`, CI, no-TTY, `--dry-run`, and `--print-prompt` clean.
- Redact and truncate provider output before any human display.
- Preserve provider result shape and downstream parsing.
- Avoid full-screen TUI dependencies.

## Suggested Order

1. `slice-00-tui-lite-contract-foundation`
2. `slice-01-provider-stream-hooks`
3. `slice-02-live-output-renderer`
4. `slice-03-prepare-context-integration`
5. `slice-04-planner-command-audit-adoption`
6. `slice-05-docs-tests-readiness`

## Final Validation

```bash
node --test tests/lib/ai-providers.test.js tests/lib/cli-ux.test.js
node --test tests/commands/ai-prepare-context-planner.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js
node --test tests/**/*.test.js
npm run smoke:create-quiver
npm run package:quiver
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v44-provider-live-output-tui-lite --strict
```
