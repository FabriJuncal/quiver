## Title

feat: localize version and dashboard read-only output

## Summary

- Localizes the first v38 read-only command slice: `version`, help contract coverage, and `dashboard`.
- Routes human `version` and `dashboard` output through the shared `en`/`es` catalog.
- Preserves stable JSON output for `version --json` and `dashboard --json`.
- Marks `slice-01-version-dashboard-help` as completed with evidence.

## Scope

- Included: `version` human labels, `dashboard` compact/details/section labels, localized dashboard warnings and human option errors.
- Included: command tests for explicit `--lang`, configured project language, and JSON stability.
- Excluded: v38 slice-02 command groups (`flow`, `doctor`, `next`, `graph`, `plan`) and later AI lifecycle/localization slices.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/lib/version.js`
- `src/create-quiver/lib/dashboard.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/version.test.js`
- `tests/commands/dashboard.test.js`
- `specs/quiver-v38-cli-i18n-read-only-commands/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js available.
- `gh` available only for PR creation, not for runtime validation.

### Worktree Access

- Branch: `feature/QUIVER-38-01-v38-version-dashboard-help`
- Base: `main`

### Run the Project

```bash
node bin/create-quiver.js version --no-color --lang es
node bin/create-quiver.js dashboard --lang es
node bin/create-quiver.js dashboard --json
```

### Use Cases

- Run `version` with `--lang es` and confirm Spanish labels.
- Configure `.quiver/config.json` with `"language": "es"` and run `version` or `dashboard` without `--lang`.
- Run `dashboard --section slices --lang es` and confirm suggested commands stay exact.
- Run JSON modes and confirm stdout remains parseable JSON without localized human text.

### Technical Verification

```bash
node --test tests/commands/version.test.js tests/commands/dashboard.test.js tests/commands/cli-contract.test.js tests/lib/version.test.js tests/lib/dashboard.test.js tests/lib/i18n-catalog.test.js tests/lib/i18n-language.test.js
node --test tests/**/*.test.js
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v38-cli-i18n-read-only-commands --strict
node bin/create-quiver.js check-slice specs/quiver-v38-cli-i18n-read-only-commands/slices/slice-01-version-dashboard-help/slice.json --local
```

## Evidence

- Passed: focused command/lib test set.
- Passed: full Node suite, 555 tests.
- Passed: `git diff --check`.
- Passed: strict v38 spec validation.
- Passed: `check-slice --local` with expected warning because the slice is already marked completed.

## Rollback

- Revert the single slice commit.
- Re-run `node --test tests/**/*.test.js`.
- Re-run `node bin/create-quiver.js spec validate specs/quiver-v38-cli-i18n-read-only-commands --strict`.

## Risks / Notes

- `npm run package:quiver` and `npm run smoke:create-quiver` remain pending for final v38 release readiness.
- This PR intentionally does not include `specs/quiver-v44-provider-live-output-tui-lite/`.
