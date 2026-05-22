# Evidence Report - Quiver v24

## Status

`slice-00` documentation foundation, `slice-01` init/template hygiene, `slice-02` CLI routing/version diagnostics, `slice-03` doctor fixes/link checks, and `slice-07` analyzer command map hardening are completed. Remaining implementation slices are pending.

## Required Final Evidence

- `git diff --check`
- `node --test tests/**/*.test.js`
- `npm run smoke:create-quiver`
- `npm run smoke:guided-workflow`
- `npm run smoke:tiered-pack`
- `npm pack --dry-run`
- Generated-project smoke covering `init`, `flow`, `prepare --dry-run`, `analyze`, `doctor`, `check-slice --local`, `plan --include-completed`, `graph --include-completed`, `ai prepare-context --dry-run`, `evidence run`, and `demo create spec-viewer --dry-run`

## Evidence Log

| Slice | Evidence | Result | Notes |
|---|---|---|---|
| slice-00 | `git diff --check` | Pass | No whitespace errors. |
| slice-00 | `find specs/quiver-v24-dx-onboarding-hardening -name "slice.json" -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" {} \;` | Pass | All 11 slice definitions parse. |
| slice-00 | `node bin/create-quiver.js plan --spec quiver-v24-dx-onboarding-hardening` | Pass with observation | Shows 10 planned implementation slices and a critical path. Ticket values rendered as `-`; captured under `slice-06`. |
| slice-00 | `node bin/create-quiver.js graph --spec quiver-v24-dx-onboarding-hardening` | Observed issue | Output included an unrelated v20 slice; captured under `slice-06` scope for spec-filter hardening. |
| slice-01 | `node --test tests/lib/init-docs.test.js tests/lib/init-layout.test.js tests/commands/init-profiles.test.js` | Pass | 30 tests passed, covering `.gitignore`, package name, profile-aware index, and generated script command targets. |
| slice-01 | `npm run smoke:create-quiver` | Pass | Generated-project smoke passed after aligning full-profile index expectations with actual generated extras. |
| slice-02 | `node --test tests/commands/init-profiles.test.js tests/commands/doctor.test.js tests/commands/flow.test.js` | Pass | 29 tests passed, covering unsupported command routing, legacy `--name`, doctor script mismatch warnings, and flow regressions. |
| slice-03 | `node --test tests/lib/doctor.test.js tests/commands/doctor.test.js tests/commands/prepare.test.js` | Pass | 15 tests passed, covering fix dry-run, idempotent fixes, local docs link warnings, and prepare regressions. |
| slice-07 | `node --test tests/commands/analyze.test.js tests/lib/project-scan.test.js` | Pass | 6 tests passed, covering plain Node/JavaScript analysis, language dedupe, useful script surfacing, and scan artifact helpers. |
