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

## slice-03 - Safe AI onboarding documentation

### Completed

- Expanded `ai prepare-context` to prepare `INDEX`, `PROJECT_MAP`, `AI_CONTEXT`, `AI_ONBOARDING_PROMPT`, `CONTEXTO`, `WORKFLOW`, `ARCHITECTURE`, `STATUS`, and `DECISIONS` where applicable.
- Added dry-run write plans with proposed actions, diff snippets, assumptions, risks, contradictions, omitted paths, and uncertainty markers.
- Added write-mode snapshots under `.quiver/runs/<run-id>/snapshots/` before modifying docs.
- Preserved human-authored content by appending or refreshing a Quiver-managed context block in existing docs.
- Added contradiction detection for stale `docs/PROJECT_MAP.md` project name/package manager signals.
- Wired `ai prepare-context` writes into the AI run lifecycle by advancing to `onboarding-ready`.
- Updated README, README_FOR_AI, and command docs with the new safe docs behavior.

### Validation

- `node --test tests/commands/ai-onboard.test.js tests/lib/ai-context-packs.test.js tests/lib/init-docs.test.js tests/commands/analyze.test.js` passed: 25 tests.
- `node --test tests/**/*.test.js` passed: 272 tests.
- `node -e "JSON.parse(require('fs').readFileSync('specs/quiver-v25-ai-first-lifecycle-orchestrator/slices/slice-03-safe-ai-onboarding-docs/slice.json','utf8')); console.log('slice-03 json ok')"` passed.
- `git diff --check` passed.

### Risks

- Diff snippets are compact previews, not full patch files; users should still inspect `git diff` before committing generated docs.
- Contradiction detection is intentionally conservative and currently focuses on high-signal project identity and package-manager mismatches.

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

## slice-05 - Approval gates and planner iterations

### Completed

- Added `ai revise` as a phase-safe planner revision command for acceptance and technical-plan drafts.
- Changed `ai approve` so it requires `--version <n>` and approves only the current saved draft version.
- Blocked direct approval from arbitrary input files; human feedback must create a new draft through `ai revise`.
- Required a current production-readiness review before approving a technical-plan draft.
- Kept spec generation blocked until the reviewed technical-plan draft is approved.
- Updated README, README_FOR_AI, command docs, onboarding templates, generated init docs, flow guidance, package scripts, and CLI help examples.
- Added tests for versioned approvals, missing/non-current approval failures, acceptance revise, technical-plan revise, stale review blocking, and spec generation gates.

### Validation

- `node --test tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-plan-spec-phase.test.js tests/lib/approvals.test.js tests/commands/flow.test.js tests/lib/init-layout.test.js` passed: 48 tests.
- `node --test tests/**/*.test.js` passed: 276 tests.
- `git diff --check` passed.
- `node -e "const fs=require('fs'); for (const f of process.argv.slice(1)) JSON.parse(fs.readFileSync(f,'utf8')); console.log('slice json ok:', process.argv.length-1);" specs/quiver-v25-ai-first-lifecycle-orchestrator/slices/*/slice.json` passed for 12 slice files.

### Risks

- `ai revise` now gives the planner the current draft plus feedback; output quality still depends on the selected provider/model.
- Approval state remains file-based under `.quiver/approvals`; concurrent writes are still governed by later execution/locking hardening.

## slice-06 - Spec, slice, handoff, and PR body generation

### Completed

- Completed the generated slice artifact contract with `expected_read_paths`, `allowed_write_paths`, and `validation_hints`.
- Added generated execution brief sections for read paths, write paths, and validation hints.
- Preserved compatibility with existing `files` and `tests` fields while exposing clearer agent-facing fields.
- Added validation that generated `slice.json` files contain required scope arrays.
- Added fixture coverage for explicit generated scope fields and default derivation from existing `files`/`tests`.

### Validation

- `node --test tests/lib/ai-spec-generator.test.js tests/commands/spec-create.test.js tests/commands/ai-plan-spec-phase.test.js` passed: 9 tests.
- `node --test tests/**/*.test.js` passed: 276 tests.
- `git diff --check` passed.
- `node -e "const fs=require('fs'); for (const f of process.argv.slice(1)) JSON.parse(fs.readFileSync(f,'utf8')); console.log('slice json ok:', process.argv.length-1);" specs/quiver-v25-ai-first-lifecycle-orchestrator/slices/*/slice.json` passed for 12 slice files.

### Risks

- Generated read/write scopes depend on the approved plan quality; later validation slices should keep hardening error messages when planner output is incomplete.
- Existing executor code still primarily reads `files` for scope checks; generated `allowed_write_paths` is now aligned with `files` but deeper executor support belongs to later slices.

## slice-07 - Slice execution planning and parallel safety

### Completed

- Updated slice graph reads to treat `allowed_write_paths` as the authoritative write scope when present.
- Preserved compatibility by falling back to existing `files` when `allowed_write_paths` is absent.
- Added execution plan JSON metadata for `expected_read_paths`, `allowed_write_paths`, and `validation_hints`.
- Updated human execution plan output to show `Wave <n>` and each slice's `parallel_safe` rationale.
- Added regression coverage for conflicts detected from `allowed_write_paths` even when `files` is empty.
- Added CLI JSON coverage for downstream agent/dashboard consumption.

### Validation

- `node --test tests/lib/slice-graph.test.js tests/lib/ai-execution-plan.test.js tests/commands/ai-execute-plan.test.js tests/commands/plan.test.js tests/commands/graph.test.js tests/commands/next.test.js` passed: 46 tests.
- `node --test tests/**/*.test.js` passed: 279 tests.
- `git diff --check` passed.
- `node -e "const fs=require('fs'); for (const f of process.argv.slice(1)) JSON.parse(fs.readFileSync(f,'utf8')); console.log('slice json ok:', process.argv.length-1);" specs/quiver-v25-ai-first-lifecycle-orchestrator/slices/*/slice.json` passed for 12 slice files.

### Risks

- If planner output omits both `allowed_write_paths` and `files`, Quiver correctly falls back to sequential execution, but the user still needs to fix the slice contract.
- Parallel execution still requires later execution slices to enforce scope and commit behavior during actual provider runs.

## slice-08 - Controlled slice execution and evidence

### Completed

- Updated slice metadata resolution so `allowed_write_paths` becomes the authoritative executor write scope while preserving `files` fallback.
- Added simple glob-aware scope validation for declared write paths such as `src/**` and `tests/**/*.test.js`.
- Added branch/worktree validation for direct `ai execute-slice` runs and kept `ai execute-plan` delegated worktrees explicitly exempt through internal orchestration.
- Expanded executor context with expected read paths and validation hints while keeping prompt-only/manual execution minimal.
- Added automatic closure artifacts after successful execution: `CLOSURE_BRIEF.md`, `EVIDENCE_REPORT.md`, `COMMAND_LOG.md`, `STATUS.md`, and `slice.json`.
- Added no-op protection so a provider that changes no in-scope files cannot close a slice.
- Redacted likely secrets from provider output, validation output, command logs, and saved execution evidence.
- Updated README and generated command/workflow docs for the controlled execution behavior.

### Validation

- `node --test tests/lib/scope.test.js tests/lib/ai-executor.test.js tests/commands/ai-execute-slice.test.js tests/lib/ai-execution-plan.test.js tests/commands/ai-execute-plan.test.js` passed: 39 tests.
- `node --test tests/**/*.test.js` passed: 285 tests.

### Risks

- Scope glob support is intentionally simple and covers the common `*` and `**` cases used by Quiver-generated slices; more advanced glob syntax remains out of scope.
- Direct `ai execute-slice` now requires the declared slice branch. Orchestrated `ai execute-plan` execution bypasses that specific branch check because it manages temporary worktrees itself.
