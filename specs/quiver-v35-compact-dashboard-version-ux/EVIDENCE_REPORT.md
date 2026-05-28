# Evidence Report - Quiver v35 Compact Dashboard and Version UX

## Status

Implementation, documentation, tests, package smoke, and cross-platform smoke completed. No npm publication is part of this spec.

## Evidence Log

| Date | Slice | Evidence | Result |
|---|---|---|---|
| 2026-05-28 | slice-00-foundation-and-doc-router | Created spec package, slices, execution briefs, closure brief templates, status, execution plan, and PR body. | Completed |
| 2026-05-28 | slice-00-foundation-and-doc-router | `node -e "const fs=require('fs'); for (const f of process.argv.slice(1)) JSON.parse(fs.readFileSync(f,'utf8')); console.log('slice json ok')" specs/quiver-v35-compact-dashboard-version-ux/slices/*/slice.json` | Passed |
| 2026-05-28 | slice-00-foundation-and-doc-router | `node bin/create-quiver.js spec validate specs/quiver-v35-compact-dashboard-version-ux` | Passed |
| 2026-05-28 | slice-00-foundation-and-doc-router | `git diff --check` | Passed |
| 2026-05-28 | slice-01-dashboard-cli-contract | Added dashboard-scoped `--details`, `--section <name>`, and `--limit <n>` parsing/validation plus JSON-safe errors. | Completed |
| 2026-05-28 | slice-02-dashboard-compact-renderer | Implemented compact default dashboard renderer with summary, next command, counts, truncation, and detail inspection hints. | Completed |
| 2026-05-28 | slice-03-dashboard-details-sections | Implemented `dashboard --details` and focused sections for overview, specs, slices, blockers, warnings, agents, approvals, runs, active-slice, and next-steps. | Completed |
| 2026-05-28 | slice-04-version-command | Added `version` and `version --json`, Quiver ASCII banner, palette coloring, no-color handling, package-manager detection, and semver-only `--version` preservation. | Completed |
| 2026-05-28 | slice-05-docs-help-generated-guidance | Updated CLI help, `docs/reference/commands.md`, `docs/CLI_UX_GUIDE.md`, `README_FOR_AI.md`, generated docs guidance, and `quiver:version` generated script. | Completed |
| 2026-05-28 | slice-05-docs-help-generated-guidance | Root `docs/INDEX.md` decision: not added in this repo because only `docs/INDEX.md.template` exists and generated projects already receive `docs/INDEX.md`; package validation confirms no unintended package-content change. | Passed |
| 2026-05-28 | slice-06-tests-smokes-release-readiness | `node --check src/create-quiver/lib/version.js && node --check src/create-quiver/lib/dashboard.js && node --check src/create-quiver/index.js && node --check scripts/ci/smoke-cross-platform.js` | Passed |
| 2026-05-28 | slice-06-tests-smokes-release-readiness | `node --test tests/lib/dashboard.test.js tests/commands/dashboard.test.js tests/commands/cli-contract.test.js tests/lib/version.test.js tests/lib/cli-theme.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js` | Passed |
| 2026-05-28 | slice-06-tests-smokes-release-readiness | `node --test tests/**/*.test.js` | Passed: 523 tests |
| 2026-05-28 | slice-06-tests-smokes-release-readiness | `npm run package:quiver` | Passed: `create-quiver-0.15.2.tgz` |
| 2026-05-28 | slice-06-tests-smokes-release-readiness | `npm run smoke:create-quiver` | Passed |
| 2026-05-28 | slice-07-package-and-cross-platform-smoke | Installed tarball smoke validates `create-quiver --version`, `create-quiver version`, `create-quiver version --json`, `quiver version`, `dashboard`, and `dashboard --json`. | Passed |
| 2026-05-28 | slice-07-package-and-cross-platform-smoke | `node scripts/ci/smoke-cross-platform.js` | Passed |
| 2026-05-28 | slice-07-package-and-cross-platform-smoke | `npx create-quiver spec validate specs/quiver-v35-compact-dashboard-version-ux --strict` | Passed |
| 2026-05-28 | slice-07-package-and-cross-platform-smoke | `git diff --check` | Passed |

## Required Final Validation

- [x] `node --test tests/**/*.test.js`
- [x] `git diff --check`
- [x] `npx create-quiver spec validate specs/quiver-v35-compact-dashboard-version-ux --strict`
- [x] `npm run package:quiver`
- [x] `npm run smoke:create-quiver`
- [x] Package-installed smoke for `create-quiver` and `quiver` binaries
- [x] `node scripts/ci/smoke-cross-platform.js`

## Notes

No npm publication is part of this spec. Cross-platform smoke was executed on the local macOS environment; the script contains Windows path and npm command guards but was not run on a native Windows host in this turn.
