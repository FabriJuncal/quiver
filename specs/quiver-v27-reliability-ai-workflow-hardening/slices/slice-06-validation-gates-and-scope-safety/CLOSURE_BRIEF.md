# CLOSURE BRIEF - slice-06: Validation gates and scope safety

## Summary

Implemented validation gate hardening across local slice checks, scope validation, handoff validation, full spec validation, and path safety. The slice closes the Pixel Quiver gaps where validation could pass while later execution failed or where commands assumed the wrong base branch.

## Validation Against Acceptance Criteria

- `check-slice --local` now validates local execution metadata, declared scope paths, dependency contracts, and reports executed and skipped checks.
- `check-scope` now respects an explicit `--base`, then `slice.git.base_branch`, before falling back to common base branches.
- `check-handoff` now reports missing headings with accepted aliases and a minimal template.
- `spec validate` now checks spec docs, slice JSON, briefs, dependency cycles, safe paths, evidence references, and status references.
- Slice paths and declared scope paths outside the repo root or using traversal are rejected before execution guidance or scope validation.

## Changes

- Added `spec validate` command support in `src/create-quiver/commands/spec.js` and `src/create-quiver/index.js`.
- Hardened `src/create-quiver/lib/readiness.js` for local slice checks and base-aware `check-scope`.
- Hardened `src/create-quiver/lib/handoff.js` with alias/template guidance.
- Added repo-bound path validation helpers in `src/create-quiver/lib/paths.js`.
- Applied path boundary checks in `src/create-quiver/lib/slice.js`, `src/create-quiver/lib/scope.js`, and `src/create-quiver/lib/ai/executor.js`.
- Added `quiver:spec:validate` to generated package scripts and synchronized `README.md`, `README_FOR_AI.md`, and `docs/COMMANDS.md.template`.
- Added tests in `tests/lib/check-slice.test.js`, `tests/lib/scope.test.js`, `tests/lib/handoff.test.js`, `tests/lib/paths.test.js`, `tests/commands/spec-validate.test.js`, and `tests/commands/cli-contract.test.js`.

## Remaining Risks

- `spec validate` intentionally treats status/evidence mismatches as warnings by default for legacy compatibility; `--strict` promotes those warnings to failures.
- `check-pr` still contains older `origin/develop` assumptions and should be revisited when PR/readiness flows are hardened further.

## Follow-up Recommendations

- Execute `slice-07-context-analysis-and-doctor-flow` next so analyzer, prepare-context, flow, and doctor can consume the stronger validation contracts.
