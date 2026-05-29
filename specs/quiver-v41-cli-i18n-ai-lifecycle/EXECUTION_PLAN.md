# Execution Plan - Quiver v41 CLI i18n AI Lifecycle

## Execution Rules

- Start only after v37 foundation is complete.
- Localize Quiver wrapper messages only.
- Preserve provider prompts, JSON, JSONL, and artifacts.
- Do not change credential or provider access behavior.

## Suggested Order

1. `slice-00-ai-i18n-foundation`
2. `slice-01-ai-run-status-resume`
3. `slice-02-ai-agent-models`
4. `slice-03-ai-planner-approval-review`
5. `slice-04-ai-execution-pr`
6. `slice-05-ai-tests-smokes`

## Parallelization Guidance

- `slice-02` and `slice-03` may overlap only after `slice-01` if `src/create-quiver/commands/ai.js` ownership is split carefully.
- `slice-04` should wait for planner/approval behavior to stabilize.
- `slice-05` runs last.

## Final Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v41-cli-i18n-ai-lifecycle --strict
npm run package:quiver
npm run smoke:create-quiver
```
