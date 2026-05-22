# Evidence Report - Quiver v24

## Status

All v24 slices are completed. Package publication is intentionally outside this spec.

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
| slice-04 | `node --test tests/commands/prepare.test.js tests/commands/ai-onboard.test.js tests/lib/ai-context-packs.test.js tests/commands/doctor.test.js tests/lib/init-layout.test.js` | Pass | 32 tests passed, covering prepare wording, `ai prepare-context` dry-run/write mode, approved docs-only targets, generated scripts, and doctor support for the new AI command. |
| slice-04 | `node bin/create-quiver.js ai prepare-context --dry-run` | Pass | Dry-run reported proposed docs, files considered, assumptions, risks, omitted paths, and uncertainty markers without writing files. |
| slice-04 | `npm run smoke:create-quiver` | Pass | Generated-project smoke passed with `quiver:ai:prepare-context` in the script contract. |
| slice-05 | `node --test tests/lib/check-slice.test.js tests/commands/flow.test.js` | Pass | 18 tests passed, covering `check-slice --local`, omitted-check reporting, missing-base guidance, explicit base branch, and flow regressions. |
| slice-06 | `node --test tests/commands/plan.test.js tests/commands/graph.test.js tests/commands/next.test.js tests/lib/slice-graph.test.js` | Pass | 30 tests passed, covering `--include-completed`, spec filtering, JSON output, next history behavior, and ticket propagation. |
| slice-06 | `node bin/create-quiver.js plan --spec quiver-v24-dx-onboarding-hardening --include-completed` | Pass | Plan history view shows completed v24 slices and preserves `QUIVER-24-*` ticket values. |
| slice-06 | `node bin/create-quiver.js graph --spec quiver-v24-dx-onboarding-hardening --include-completed` | Pass | Graph history view is restricted to v24 and no longer leaks unrelated specs. |
| slice-06 | `node bin/create-quiver.js next --spec quiver-v24-dx-onboarding-hardening --include-completed` | Pass | Next output keeps an actionable planned slice and appends completed history separately. |
| slice-07 | `node --test tests/commands/analyze.test.js tests/lib/project-scan.test.js` | Pass | 6 tests passed, covering plain Node/JavaScript analysis, language dedupe, useful script surfacing, and scan artifact helpers. |
| slice-08 | `node --test tests/commands/evidence.test.js tests/lib/evidence.test.js` | Pass | 9 tests passed, covering success/failure exit codes, output truncation, default paths, output path display, and secret redaction across command/stdout/stderr. |
| slice-08 | `node --test tests/lib/init-layout.test.js tests/commands/doctor.test.js tests/lib/quiver-internal-layout.test.js tests/lib/doctor.test.js` | Pass | 22 tests passed, covering supported script surfacing, `.quiver/.gitignore` evidence defaults, and doctor regression coverage. |
| slice-08 | `node --test tests/commands/init-profiles.test.js tests/lib/init-docs.test.js tests/lib/doctor.test.js tests/commands/prepare.test.js` | Pass | 30 tests passed, covering generated init profiles, docs initialization, doctor layout checks, and prepare regressions. |
| slice-08 | `node bin/create-quiver.js evidence run --output /private/tmp/quiver-v24-slice08-evidence.md --max-output 200 -- node --version` | Pass | Smoke verified direct command execution, exit code preservation, and explicit output path display. |
| slice-08 | `npm run smoke:create-quiver` | Pass | Generated package smoke passed after adding `quiver:evidence` to generated scripts. |
| slice-09 | `node --test tests/commands/demo.test.js tests/lib/package-safety.test.js` | Pass | 9 tests passed, covering dry-run, default nested target, real scaffold, file preservation, unsupported demo errors, and package safety for local demo output. |
| slice-09 | `node bin/create-quiver.js demo create spec-viewer --dir /private/tmp/quiver-spec-viewer-smoke --dry-run` | Pass | Dry-run listed 17 files and wrote nothing. |
| slice-09 | `node bin/create-quiver.js demo create spec-viewer --dir /private/tmp/quiver-spec-viewer-smoke-real` | Pass | Created static demo app, spec/slices, handoffs, PR body, and validation script. |
| slice-09 | `npm run validate` from `/private/tmp/quiver-spec-viewer-smoke-real` | Pass | Generated demo validation passed. |
| slice-09 | `npm run smoke:create-quiver` | Pass | Smoke now covers demo dry-run, real scaffold, demo validation, and evidence capture from the generated demo. |
| slice-10 | `git diff --check` | Pass | No whitespace errors. |
| slice-10 | `node --test tests/**/*.test.js` | Pass | 255 tests passed. |
| slice-10 | `npm pack --dry-run` | Local environment issue | Default npm cache had root-owned files under `~/.npm`; not a package failure. Re-ran with isolated cache. |
| slice-10 | `npm --cache /private/tmp/quiver-npm-cache pack --dry-run` | Pass | npm dry-run generated `create-quiver-0.10.0.tgz` with 401 files. |
| slice-10 | `npm run smoke:create-quiver` | Pass | Generated-project smoke passed, including v24 demo/evidence paths. |
| slice-10 | `npm run smoke:guided-workflow` | Pass | Guided workflow smoke and package smoke passed. |
| slice-10 | `npm run smoke:tiered-pack` | Pass | Tiered context smoke passed after updating expected doctor link warnings. |
| slice-10 | `npm run package:quiver` | Pass | Package safety smoke passed for `create-quiver-0.10.0.tgz`. |
