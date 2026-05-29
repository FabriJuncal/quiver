# Execution Plan - Quiver v38 CLI i18n Read-only Commands

## Execution Rules

- Start only after v37 foundation is complete.
- Keep every `--json` mode non-localized and parseable.
- Reuse v37 catalog helpers; do not add a second i18n mechanism.

## Suggested Order

1. `slice-00-read-only-foundation`
2. `slice-01-version-dashboard-help`
3. `slice-02-flow-doctor-next-graph`
4. `slice-03-ai-inspection-and-export`
5. `slice-04-read-only-tests-smokes`

## Final Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v38-cli-i18n-read-only-commands --strict
npm run package:quiver
npm run smoke:create-quiver
```
