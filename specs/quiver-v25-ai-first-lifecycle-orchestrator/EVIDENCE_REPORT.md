# Evidence Report - Quiver v25 AI-First Lifecycle Orchestrator

## Summary

This report starts with documentation-only evidence for `slice-00`. Product implementation evidence must be appended by each later slice.

## slice-00 - Spec foundation

### Completed

- Created v25 spec folder.
- Created `SPEC.md`, `STATUS.md`, `EXECUTION_PLAN.md`, `EVIDENCE_REPORT.md`, and `pr.md`.
- Created every slice folder with `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Updated source-of-truth planning docs to mention v25 as planned without claiming package publication.

### Validation

- `git diff --check` passed.
- `find specs/quiver-v25-ai-first-lifecycle-orchestrator -name "slice.json" -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" {} \;` passed for 12 slice files.
- `find specs/quiver-v25-ai-first-lifecycle-orchestrator/slices -maxdepth 2 -type f | wc -l` returned 36 slice files.
- `npm run quiver:plan -- --spec quiver-v25-ai-first-lifecycle-orchestrator --include-completed` failed with Node out-of-memory after starting `npx create-quiver plan`. This does not invalidate the documentation package, but it is evidence that scoped planning can still have a scaling or command execution issue in the current CLI and should be considered by `slice-10-validation-errors-fixtures`.
- `npm view create-quiver version` returned `0.12.0`; release documentation should be synchronized before future docs claim the latest package status.

### Risks Observed During Validation

- The scoped plan command can consume too much memory on the current repo. Future implementation should include a fixture or regression test that proves `--spec <slug>` does not scan or retain unnecessary data from unrelated specs.

## Later Slices

Each implementation slice must append:

- commands executed;
- tests or smokes run;
- files changed;
- validation result;
- risks remaining;
- evidence location.

## slice-01 - CLI contract and compatibility

### Completed

- Added top-level `--version` and `-V` handling before normal argument parsing.
- Kept `--version <n>` available for `ai approve`.
- Added focused CLI contract tests.
- Added command reference docs for version output.

### Validation

- `node bin/create-quiver.js --version` passed and printed `0.12.0`.
- `node bin/create-quiver.js -V` passed and printed `0.12.0`.
- `node --test tests/commands/cli-contract.test.js tests/commands/init-profiles.test.js tests/commands/flow.test.js tests/lib/init-layout.test.js` passed: 36 tests.
- `git diff --check` passed.

### Risks

- The local `quiver` binary alias is validated through `package.json` and the shared entrypoint, not by installing the package into a fixture.
