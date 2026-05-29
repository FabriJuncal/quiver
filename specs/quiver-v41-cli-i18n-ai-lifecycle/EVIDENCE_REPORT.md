# Evidence Report - Quiver v41 CLI i18n AI Lifecycle

## slice-00-ai-i18n-foundation

- Created this spec package and slice handoffs.
- Runtime implementation intentionally not started.

## slice-01-ai-run-status-resume

- Routed `ai run create` through the shared language option and localized current `ai run` lifecycle wrapper errors.
- Kept `ai run close`, `ai status`, `ai resume`, and `ai approvals` human output localized while preserving run ids, phases, statuses, commands, paths, and approval candidate versions.
- Added Spanish regression coverage for `ai run create`, `ai run close`, and unsupported `ai run watch` wrapper errors.
- Recorded that full `ai run watch` runtime is not present yet and remains owned by `specs/quiver-v36-ai-run-watch-portable`.

Validation:

- PASS `node --test tests/commands/ai-run-state.test.js`
- PASS `node --test tests/lib/i18n-catalog.test.js`
- PASS `git diff --check`

## Pending Evidence

- `node --test tests/**/*.test.js`
- `git diff --check`
- `npx create-quiver spec validate specs/quiver-v41-cli-i18n-ai-lifecycle --strict`
- `npm run package:quiver`
- `npm run smoke:create-quiver`
