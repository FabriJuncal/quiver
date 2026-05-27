# Evidence Report - Quiver v31 AI Model Catalog and Agent Selection

## Summary

This report starts with documentation-only evidence for `slice-00`. Product implementation evidence must be appended by each later slice.

## slice-00 - Spec foundation

### Completed

- Created v31 spec package with `SPEC.md`, `STATUS.md`, `EXECUTION_PLAN.md`, `EVIDENCE_REPORT.md`, and `pr.md`.
- Created 8 slice folders with `slice.json`, `EXECUTION_BRIEF.md`, and `CLOSURE_BRIEF.md`.
- Synchronized `README_FOR_AI.md` and `ROADMAP.md` to mark v31 as planned work.

### Validation

- `find specs/quiver-v31-ai-model-catalog-agent-selection -name 'slice.json' -print -exec node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('ok', process.argv[1])" {} \;` passed for 8 slice files.
- `node bin/create-quiver.js spec validate specs/quiver-v31-ai-model-catalog-agent-selection` passed and reported 8 slices.
- `git diff --check` passed.

### Risks Observed During Validation

- The repo is currently ahead of `origin/main` by the local `v0.15.0` release commit from the prior npm publication attempt. This slice does not modify or resolve that release state.

## Later Slices

Each implementation slice must append:

- commands executed;
- tests or smokes run;
- files changed;
- validation result;
- human and JSON output evidence when applicable;
- remaining risks;
- evidence location.

## slice-01 - Local model catalog and alias normalization

### Completed

- Added `src/create-quiver/lib/ai/model-catalog.js` as the local, versioned model catalog source of truth.
- Added Codex, Claude, and Gemini known model entries with aliases, role recommendations, cost/quality/stability metadata, and custom model support.
- Added tolerant alias normalization for case, spaces, dashes, and punctuation.
- Updated agent profile creation to normalize known visual aliases into technical model ids while preserving human `displayName`.
- Preserved free-form custom model support and added optional profile metadata: `modelSource`, `modelAlias`, `validation_status`, `validated_at`, and `validation_error`.

### Validation

- `node --test tests/lib/model-catalog.test.js tests/lib/agent-profiles.test.js` passed: 10 tests.
- `git diff --check` passed.

### Risks

- Catalog entries are local and can become stale. Later docs must keep the wording "known by Quiver" and avoid implying account-level availability.
- Live provider validation and command preflight are intentionally deferred to later slices.

## slice-02 - Interactive agent set provider and model selectors

### Completed

- Added interactive provider/model resolution for `ai agent set <role>`.
- Added no-TTY/CI safeguards requiring explicit `--provider` and `--model`.
- Added existing profile actions: update current, create new, change default, and cancel before writes.
- Added provider CLI status hints in provider choices.
- Added role-ordered model choices from the local catalog.
- Added custom model id and display-name capture.
- Added a write summary before saving profiles selected through prompts.
- Made `ai agent` dispatch async-safe.

### Validation

- `node --test tests/commands/ai-agent.test.js tests/lib/cli-selectors.test.js tests/lib/model-catalog.test.js tests/lib/agent-profiles.test.js` passed: 30 tests.

### Risks

- Provider status is best-effort CLI detection and does not guarantee account-level model availability.
- Interactive rendering is validated through injectable prompt helpers; real terminal behavior should be covered by smoke testing in the final slice.

## slice-03 - Agent profile doctor and repair dry-run

### Completed

- Added pure profile diagnostics that evaluate every configured agent profile.
- Added `ai agent doctor` with human output sections `Checks` and `Suggested fixes`.
- Added `ai agent doctor --json` with parseable JSON output and no human prose.
- Added exit code 1 when doctor errors are present.
- Added `ai agent repair --dry-run` with before/after changes and no writes.
- Added safe catalog-alias repair for legacy profiles such as `model: "GPT 5.5"`.
- Added warnings for custom unvalidated models and provider CLI checks.
- Updated CLI help for `ai agent doctor` and `ai agent repair`.

### Validation

- `node --test tests/commands/ai-agent.test.js tests/lib/agent-profiles.test.js tests/lib/model-catalog.test.js tests/lib/cli-selectors.test.js` passed: 36 tests.

### Risks

- Provider CLI checks are best-effort and do not prove selected model entitlement.
- Repair write mode is intentionally unavailable until dry-run behavior is dogfooded.

## slice-04 - Shared model preflight and provider error extraction

### Completed

- Added shared provider model alias resolution.
- Added blocking policy for display aliases read from persisted profiles.
- Added normalization for CLI `--model` display aliases in dry-run and invocation output.
- Added provider error cause extraction for invalid model, auth, missing CLI, timeout, and generic failures.
- Added provider failure serialization for non-zero exits where stderr contains the useful cause.
- Applied model preflight options to planner, reviewer, repair-plan, execute-slice, and execute-plan runtime paths.
- Added tests for `GPT 5.5` CLI override normalization, legacy profile blocking before provider execution, invalid model priority over MCP noise, and secret redaction.

### Validation

- `node --test tests/lib/ai-providers.test.js tests/commands/ai-prepare-context-planner.test.js tests/commands/ai-execute-slice.test.js` passed: 35 tests.
- `node --test tests/lib/ai-providers.test.js tests/commands/ai-prepare-context-planner.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-execute-slice.test.js tests/commands/ai-execute-plan.test.js` passed: 78 tests.

### Risks

- Provider stderr patterns can change; future observed failures should become fixtures.
- Custom models remain allowed and can only be proven through live provider validation.

## slice-05 - AI models list command

### Completed

- Added `ai models list`.
- Added `--provider <id>` filtering for catalog providers.
- Added `--json` clean machine output with `catalogVersion` and `lastUpdated`.
- Updated CLI help and contract tests.
- Added human output wording that says models are known by Quiver and avoids claiming availability.

### Validation

- `node --test tests/commands/ai-models.test.js tests/commands/cli-contract.test.js` passed: 11 tests.

### Risks

- The model catalog is local and can become stale until Quiver has a remote/update mechanism.

## slice-06 - Documentation and generated template alignment

### Completed

- Updated `README.md` with concise public-facing model catalog, agent setup, doctor, and repair commands.
- Updated `docs/reference/commands.md` with interactive and script-safe agent setup, `ai models list`, `ai agent doctor`, and `ai agent repair --dry-run`.
- Updated `docs/CLI_UX_GUIDE.md` with the profile data contract: `model` is the provider technical id and `displayName` is the human label.
- Updated generated project templates: `docs/COMMANDS.md.template`, `docs/AI_ONBOARDING_PROMPT.md.template`, and `docs/AI_CONTEXT.md.template`.
- Updated `README_FOR_AI.md`, `ROADMAP.md`, `STATUS.md`, and the slice closure to reflect completed docs/templates alignment without claiming package publication.

### Validation

- `node bin/create-quiver.js --help` passed and exposed `ai models list`, `ai agent doctor`, and `ai agent repair --dry-run`.
- `node bin/create-quiver.js ai models list --provider codex` passed and printed "Models are known by Quiver; provider account access is not guaranteed."
- `node bin/create-quiver.js spec validate specs/quiver-v31-ai-model-catalog-agent-selection` passed with a warning before this evidence section was appended.
- `git diff --check` passed.

### Risks

- The final release-readiness slice must verify the CLI help contract after docs alignment.
- The local model catalog can become stale until Quiver has a remote/update mechanism.

## slice-07 - Tests, smokes, package dry-run, and release readiness

### Completed

- Corrected remaining CLI help/flow guidance so `--model` is documented as a technical model id, not a free-form label.
- Updated contract tests and `smoke:create-quiver` packaged-help assertions for `ai agent doctor`, `ai agent repair --dry-run`, `ai models list`, and `--model <model-id>`.
- Updated release docs: `CHANGELOG.md`, `README_FOR_AI.md`, `ROADMAP.md`, `STATUS.md`, `pr.md`, and this evidence report.

### Validation

- `node --test tests/commands/cli-contract.test.js tests/commands/flow.test.js tests/commands/ai-agent.test.js tests/lib/agent-profiles.test.js` passed: 44 tests.
- `node --test tests/**/*.test.js` passed: 482 tests.
- `npm run smoke:doctor-fixtures` passed: 13 fixture states.
- `npm run smoke:create-quiver` passed after updating packaged-help expectations.
- `npm run smoke:guided-workflow` passed.
- `npm run package:quiver` passed with package smoke.
- `npm pack --dry-run` passed and generated dry-run tarball details for `create-quiver@0.15.0`.

### Risks

- npm publication was not performed and still requires explicit human approval.
- Live provider model entitlement was not tested because it depends on provider CLI/account access and may consume tokens.
- The local model catalog remains manually maintained until Quiver has a remote/update mechanism.
