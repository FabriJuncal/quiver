# Evidence Report - Quiver v21 AI-First Layout

## Summary

Implementation and release-readiness validation are complete.

## Evidence By Slice

| Slice | Evidence |
| --- | --- |
| slice-00 | Completed. Created spec foundation, all slice handoffs, execution plan, and PR body. Validated JSON parsing for all `slice.json` files and `git diff --check`. |
| slice-01 | Completed. Added explicit `init` command parsing, init profile flags, pure layout planner, dry-run formatter, compatibility alias handling, and focused tests. Evidence: `node --test tests/lib/init-layout.test.js tests/commands/init-profiles.test.js`; `git diff --check`. |
| slice-02 | Completed. Added `.quiver/` internal path helpers, versionable config, internal gitignore for runtime folders, packaged/exported/legacy template resolver, and explicit template-root support in init docs. Evidence: `node --test tests/lib/template-resolver.test.js tests/lib/quiver-internal-layout.test.js tests/lib/init-layout.test.js tests/commands/init-profiles.test.js`; `git diff --check`. |
| slice-03 | Completed. Implemented profile-aware init generation. Default no longer creates root `docs-template/`, `tools/scripts/`, or placeholder specs; minimal creates the essential onboarding contract; full preserves the broad compatibility layout. Evidence: `node --test tests/**/*.test.js`; `bash scripts/ci/smoke-init-docs.sh`; `bash scripts/ci/smoke-create-quiver.sh`; `git diff --check`. |
| slice-04 | Completed. Moved raw analyze output to `.quiver/scans/PROJECT_SCAN.json`, kept `docs/PROJECT_MAP.md` visible, added current/legacy scan helpers, and wired context pack metadata plus doctor scan detection to accept the new path with legacy fallback. Evidence: `node --test tests/commands/analyze.test.js tests/lib/project-scan.test.js tests/lib/ai-context-packs.test.js`; `node --test tests/**/*.test.js`; `bash scripts/ci/smoke-create-quiver.sh`; `node scripts/ci/smoke-cross-platform.js`; `git diff --check`. |
| slice-05 | Completed. Updated doctor so projects initialized with the clean AI-first layout can have no specs yet without failing. Added layout detection for new, legacy, hybrid, and incomplete projects while preserving valid empty states for plan, graph, and next. Evidence: `node --test tests/commands/doctor.test.js tests/lib/doctor.test.js tests/commands/plan.test.js tests/commands/graph.test.js tests/commands/next.test.js`; `node --test tests/**/*.test.js`; `git diff --check`. |
| slice-06 | Completed. Added non-destructive migrate reporting for legacy `docs-template/`, `tools/scripts/`, and `docs/PROJECT_SCAN.json`, plus explicit optional asset coverage for `--legacy-scripts`, `--include-templates`, and `--full`. Evidence: `node --test tests/commands/init-profiles.test.js tests/lib/init-docs.test.js`; `bash scripts/ci/smoke-init-docs.sh`; `bash scripts/ci/smoke-create-quiver.sh`; `node scripts/ci/smoke-cross-platform.js`; `node --test tests/**/*.test.js`; `git diff --check`. |
| slice-07 | Completed. Aligned root README, AI guide, onboarding/workflow/command templates, generated README text, and smoke assertions with the AI-first layout. Docs now distinguish visible contract from `.quiver/` internals, mark `docs-template/` and `tools/scripts/` as legacy/optional, and point raw scan output to `.quiver/scans/PROJECT_SCAN.json`. Evidence: `node --test tests/commands/init-profiles.test.js tests/lib/init-docs.test.js`; `bash scripts/ci/smoke-init-docs.sh`; `bash scripts/ci/smoke-create-quiver.sh`; `node --test tests/**/*.test.js`; `bash -n scripts/init-docs.sh`; `git diff --check`. |
| slice-08 | Completed. Hardened the tiered context-pack smoke to use the explicit `--full --skip-install` compatibility profile and updated expectations for the no-spec AI-first doctor guidance. Completed the final validation matrix. Evidence: `node --test tests/**/*.test.js`; `npm run smoke:create-quiver`; `bash scripts/ci/smoke-init-docs.sh`; `node scripts/ci/smoke-cross-platform.js`; `npm run smoke:tiered-pack`; `git diff --check`. |

## Final Evidence

- `node --test tests/**/*.test.js` passed: 136 tests.
- `npm run smoke:create-quiver` passed.
- `bash scripts/ci/smoke-init-docs.sh` passed.
- `node scripts/ci/smoke-cross-platform.js` passed.
- `npm run smoke:tiered-pack` passed.
- `git diff --check` passed.
- Default init is covered by tests and smokes that assert no root `docs-template/`, no `tools/scripts/`, and no placeholder spec in the default/minimal profiles.
