# Evidence Report - Quiver v30 Interactive CLI UX and Agent Selection

## Summary

This report starts with documentation-only evidence for `slice-00`. Product implementation evidence must be appended by each later slice.

## slice-00 - Spec foundation

### Completed

- Create v30 spec folder.
- Create `SPEC.md`, `STATUS.md`, `EVIDENCE_REPORT.md`, `EXECUTION_PLAN.md`, and `pr.md`.
- Create every slice folder with `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Sync source-of-truth planning docs with v29 release status and v30 planned scope.

### Validation

- `find specs/quiver-v30-interactive-cli-ux-agent-selection -name 'slice.json' -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('ok', process.argv[1])" {} \;` passed for 9 slice files.
- `git diff --check` passed.
- `node bin/create-quiver.js spec validate specs/quiver-v30-interactive-cli-ux-agent-selection` passed and reported 9 slices.

### Risks Observed During Validation

- None for the documentation package.

## Later Slices

Each implementation slice must append:

- commands executed;
- tests or smokes run;
- files changed;
- validation result;
- UX/machine-output evidence;
- remaining risks;
- evidence location.

## slice-01 - CLI UX runtime and progress engine

### Completed

- Extended `src/create-quiver/lib/cli/theme.js` with section, success, warning, and error semantics while keeping the approved Quiver palette centralized.
- Extended `src/create-quiver/lib/cli/ux.js` with helpers for sections, checks, warnings, errors, summaries, next steps, and task groups.
- Hardened spinner stop behavior so a spinner is stopped once on success or failure.
- Added tests for branded human hierarchy, plain no-TTY fallback, JSON suppression, and real stage execution through `taskGroup`.

### Validation

- `node --test tests/lib/cli-theme.test.js tests/lib/cli-ux.test.js` passed: 15 tests.
- `git diff --check` passed.

### Risks

- Command adoption is intentionally deferred to later slices; this slice only adds the runtime.

## slice-02 - Agent profile selection and selectors

### Completed

- Added backward-compatible multiple named agent profiles per role.
- Kept legacy single-profile behavior by preserving the default profile under `profiles.<role>`.
- Added profile sets under `profile_sets.<role>s`.
- Added display-name resolution order for profile output.
- Added CLI flags for profile identity and future selectors: `--id`, `--display-name`, `--default`, `--planner`, `--executor`, `--reviewer`, `--doctor`, and `--methodology`.
- Added `src/create-quiver/lib/cli/selectors.js` for reusable interactive/non-interactive selection.
- Extended `ai agent set/list/show` for named profiles.

### Validation

- `node --test tests/lib/agent-profiles.test.js tests/lib/cli-selectors.test.js tests/commands/ai-agent.test.js` passed: 16 tests.
- `git diff --check` passed.
- `node bin/create-quiver.js spec validate specs/quiver-v30-interactive-cli-ux-agent-selection` passed.

### Risks

- Command flows do not yet consume the new profile selector flags; that adoption belongs to later slices.
- Provider model correctness is not enforced until slice-03.

## slice-03 - Provider model selection contract

### Completed

- Added provider adapter metadata for model selection support and model argument construction.
- Added model-selection metadata to provider invocations and dry-run results.
- Added live execution enforcement so selected models are passed to provider adapters or block with actionable guidance when unsupported.
- Wired planner/reviewer profile model selection into `ai onboard`, `ai prepare-context --with-planner`, `ai plan`, `ai review-plan`, `ai repair-plan`, and `ai revise`.
- Added command flag propagation for `--model`, `--planner`, and `--reviewer` in planner/reviewer flows.
- Documented the model-selection contract in `docs/CLI_UX_GUIDE.md` and synchronized `README_FOR_AI.md`.

### Validation

- `node --test tests/lib/ai-providers.test.js tests/commands/ai-agent.test.js tests/commands/ai-onboard.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-prepare-context-planner.test.js` passed: 72 tests.
- `git diff --check` passed.
- `node bin/create-quiver.js spec validate specs/quiver-v30-interactive-cli-ux-agent-selection` passed.

### Risks

- Provider model flags are implemented through the current adapter contract. Installed provider CLIs can still vary by version, so later release validation should dogfood dry-run and live commands with available local CLIs.
- Executor provider/model propagation remains for slice-05.

## slice-04 - Planner IA progress flows

### Completed

- Added a shared command UX bridge for planner-oriented IA commands.
- Added visible TTY progress for `ai onboard`, `ai prepare-context --with-planner`, `ai plan`, `ai review-plan`, `ai repair-plan`, and `ai revise`.
- Progress headings use the selected profile/model display name when available.
- Provider execution now runs inside a spinner in human TTY mode and stops on both success and provider failure.
- `--dry-run`, `--print-prompt`, CI, and non-TTY output remain free of progress noise.
- Updated `docs/CLI_UX_GUIDE.md` and `README_FOR_AI.md` with the progress-output standard.

### Validation

- `node --test tests/commands/ai-prepare-context-planner.test.js tests/commands/ai-onboard.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/lib/cli-ux.test.js` passed: 65 tests.
- `git diff --check` passed.

### Risks

- Some direct unit tests run with a TTY can display clack spinner artifacts in the test log, although captured no-TTY output remains clean. Slice-08 should include a final full-suite check and adjust test harness mode if needed.
- Executor and PR command progress remains for slice-05.

## slice-05 - Executor, execution-plan, and PR progress flows

### Completed

- Added executor runtime profile/model resolution and provider model enforcement to `ai execute-slice`.
- Added interactive ready-slice selection for `ai execute-slice --interactive` when `--slice` is omitted.
- Added interactive executor profile selection when multiple executor profiles are configured.
- Added TTY progress for executor provider execution, validation commands, slice commits, execution-plan waves, GitHub preflight, and PR creation.
- Added model visibility to execute-slice and execute-plan dry-runs.
- Extended UX flag support to `ai execute-slice` and `ai execute-plan` for `--interactive`.
- Preserved clean JSON/no-TTY behavior and existing PR/gh error propagation.

### Validation

- `node --test tests/lib/ai-executor.test.js tests/commands/ai-execute-slice.test.js tests/lib/ai-execution-plan.test.js tests/commands/ai-execute-plan.test.js tests/commands/ai-pr.test.js tests/commands/ux-flags.test.js` passed: 54 tests.
- `git diff --check` passed.

### Risks

- `ai execute-plan --interactive` is now accepted for strategy UX consistency, but this slice does not yet add a full strategy selector. Future UX work can add it without changing the safety contract.
- Direct TTY unit runs can still show spinner artifacts in logs; final suite validation should decide whether to force test I/O to no-TTY.

## slice-06 - Doctor visual and JSON contract

### Completed

- Added a shared Doctor command report with stable fields for `schema_version`, `status`, `exit_code`, `checks`, `suggested_fixes`, `warnings`, and `errors`.
- Rendered human Doctor output with the required `Quiver Doctor`, `Checks`, and `Suggested fixes` hierarchy.
- Added `doctor --json` output that is parseable, machine-clean, and backed by the same checks as human output.
- Preserved deterministic exit-code behavior: warnings remain exit code 0 and blocking layout errors set exit code 1.
- Kept `doctor --fix --dry-run` behavior and added clean JSON behavior for `doctor --fix --dry-run --json`.
- Updated Doctor documentation in `docs/CLI_UX_GUIDE.md`, `docs/reference/commands.md`, and `README_FOR_AI.md`.

### Validation

- `node --test tests/commands/doctor.test.js tests/lib/doctor.test.js tests/lib/cli-ux.test.js` passed: 29 tests.
- `npm run smoke:doctor-fixtures` passed: 13 fixture states.
- `git diff --check` passed.

### Risks

- Local environment checks can still add host-dependent warnings, for example `gh auth` status. That behavior existed before this slice and remains visible through the shared check model.
- Downstream JSON consumers should pin to `schema_version: 1` and avoid parsing human text.

## slice-07 - Interactive init and spec create flows

### Completed

- Added guarded `init --interactive` flow for project mode, methodology, init profile, and optional agent-profile guidance.
- Added `--methodology wdd-sdd` validation and documented that no other methodology is currently supported.
- Added `spec create --interactive` selectors for methodology, approved plan input, and direct-vs-review mode.
- Added summaries before persistent writes for interactive init/spec-create flows.
- Added explicit no-TTY failure for interactive init/spec-create so CI and scripts do not hang.
- Extended UX flag support to `init --interactive`.
- Updated help text, CLI UX guide, command reference, and `README_FOR_AI.md`.

### Validation

- `node --test tests/commands/init-profiles.test.js tests/commands/spec-create.test.js tests/commands/ux-flags.test.js tests/commands/cli-contract.test.js` passed: 39 tests.
- `node bin/create-quiver.js --help` showed the updated interactive init example and methodology flag.
- `git diff --check` passed.

### Risks

- The `init --interactive` validation-only path delegates to `doctor`, which still requires Quiver initialization evidence in the target project.
- The spec-create approved-input selector currently exposes the resolved approved technical-plan input. Wider selection across historical approved inputs is intentionally deferred until the approval store defines that as a stable contract.
