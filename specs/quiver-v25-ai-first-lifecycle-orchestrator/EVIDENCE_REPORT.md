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

## slice-02 - Run state, phase gates, and locks

### Completed

- Added `.quiver/runs/<run-id>/state.json`, `approvals.json`, copied requirement input, and decision log scaffolding.
- Added `.quiver/locks/` as runtime-only internal state.
- Added `ai run create`, `ai status`, and `ai resume`.
- Added lifecycle phase helpers, next-command guidance, approval metadata recording, and run/slice lock helpers.
- Connected `ai plan` and `ai approve` to lifecycle run phase updates.

### Validation

- `node --test tests/lib/ai-run-state.test.js tests/commands/ai-run-state.test.js tests/commands/ai-plan.test.js tests/lib/approvals.test.js tests/lib/init-layout.test.js` passed: 25 tests.
- `node /Users/fabrijk/Documents/Work/Proyectos\ Personales/nika/frameworks/quiver/bin/create-quiver.js ai status` from `/private/tmp` passed and reported no active run without creating files.
- `node --test tests/**/*.test.js` passed: 264 tests.
- `git diff --check` passed.

### Risks

- File locks intentionally require manual inspection/removal when stale; automatic process liveness cleanup is deferred to avoid unsafe cross-platform behavior.
- Phase guards are available and used by lifecycle status tests, but later slices still need to wire them into spec generation, execution planning, slice execution, and PR creation.

## slice-04 - Agent profiles and provider adapters

### Completed

- Replaced the old `researcher` profile slot with `doctor` to match the v25 agent contract.
- Added prompt-only output through `--print-prompt` for `ai onboard`, `ai plan`, and `ai review-plan`.
- Kept prompt-only paths provider-auth-free by rendering prompts without running provider preflight or spawn.
- Added best-effort redaction of likely secrets in provider stdout, stderr, and serialized error messages.
- Updated README and command reference docs for doctor profiles and prompt-only mode.

### Validation

- `node --test tests/lib/agent-profiles.test.js tests/commands/ai-agent.test.js tests/lib/ai-providers.test.js tests/commands/ai-onboard.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js` passed: 40 tests.
- `node --test tests/**/*.test.js` passed: 270 tests.
- `git diff --check` passed.

### Risks

- Redaction is intentionally best-effort and may hide some diagnostic text if provider output contains key-like labels such as `token=` or `password=`.
- The `doctor` profile is configurable now, but `ai doctor` itself remains a GitHub/readiness preflight and does not invoke a provider in this slice.
