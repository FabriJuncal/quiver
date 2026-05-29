# Execution Plan - Quiver v40 CLI i18n Spec and Slice Workflows

## Execution Rules

- Start only after v37 foundation is complete.
- Keep structured spec and slice artifacts stable.
- Do not translate generated docs/templates in this spec.

## Suggested Order

1. `slice-00-spec-slice-foundation`
2. `slice-01-spec-create-start-status`
3. `slice-02-spec-validate-close`
4. `slice-03-slice-lifecycle-handoffs`
5. `slice-04-spec-slice-tests-smokes`

## Final Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v40-cli-i18n-spec-slice-workflows --strict
npm run package:quiver
npm run smoke:create-quiver
```
