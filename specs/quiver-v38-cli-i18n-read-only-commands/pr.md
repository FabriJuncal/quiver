## Title

feat: complete v38 read-only CLI i18n

## Summary

- Completes the v38 read-only command migration to the shared `en`/`es` i18n catalog.
- Localizes human output for `flow`, `doctor`, `next`, `graph`, `plan`, and AI read-only inspection/export/status surfaces.
- Preserves JSON contracts, ids, paths, provider/model names, and exact suggested command snippets.
- Closes v38 with full tests, package smoke, create-quiver smoke, spec validation, slice validation, and evidence.

## Scope

- Included: `flow`, `doctor`, `next`, `graph`, `plan` human output in `en` and `es`.
- Included: `ai inspect`, `ai export --format markdown`, `ai specs list`, `ai slices list`, `ai trace report`, `ai status`, `ai resume`, and `ai approvals` human output in `en` and `es`.
- Included: shared read-only formatting helpers for status labels, warning prefixes, and human translators.
- Included: focused command tests plus full v38 evidence and handoff closure.
- Excluded: write commands, provider-backed AI execution, generated project docs, and v44 TUI-lite work.

## Files

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/flow.js`
- `src/create-quiver/commands/graph.js`
- `src/create-quiver/commands/next.js`
- `src/create-quiver/commands/plan.js`
- `src/create-quiver/lib/ai/export-state.js`
- `src/create-quiver/lib/ai/run-state.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `src/create-quiver/lib/i18n/read-only-format.js`
- `src/create-quiver/lib/renderers/tree.js`
- `tests/commands/ai-export.test.js`
- `tests/commands/ai-run-state.test.js`
- `tests/commands/doctor.test.js`
- `tests/commands/flow.test.js`
- `tests/commands/graph.test.js`
- `tests/commands/next.test.js`
- `tests/commands/plan.test.js`
- `specs/quiver-v38-cli-i18n-read-only-commands/**`

## How to Test (DETAILED - REQUIRED)

### Required Environment

- Node.js and npm available.
- Repository dependencies installed.
- `gh` available only for PR creation, not for runtime validation.

### Worktree Access

- Worktree: `/Users/fabrijk/Documents/Work/Proyectos Personales/nika/frameworks/quiver-v38-02`
- Branch: `feature/QUIVER-38-02-v38-flow-doctor-next-graph`
- Base: `main`

### Run the Project

```bash
node bin/create-quiver.js flow --lang es
node bin/create-quiver.js doctor --lang es
node bin/create-quiver.js next --lang es --json
node bin/create-quiver.js graph --lang es
node bin/create-quiver.js plan --lang es
node bin/create-quiver.js ai inspect --lang es
node bin/create-quiver.js ai specs list --lang es
node bin/create-quiver.js ai slices list --lang es
node bin/create-quiver.js ai trace report --lang es
node bin/create-quiver.js ai export --format markdown --lang es
node bin/create-quiver.js ai export --format json --lang es
node bin/create-quiver.js ai status --lang es
node bin/create-quiver.js ai resume --lang es
node bin/create-quiver.js ai approvals --lang es
```

### Use Cases

- Run included read-only commands with `--lang es` and confirm labels/messages render in Spanish.
- Run the same commands without `--lang` in a project configured with `"language": "es"` and confirm the configured project language is used.
- Run included JSON modes and confirm stdout remains parseable JSON without localized field names.
- Confirm suggested commands, flags, ids, paths, provider names, and model names remain exact and untranslated.
- Confirm empty, warning, and blocker states render localized human text without changing machine-readable contracts.

### Technical Verification

```bash
node --test tests/commands/flow.test.js tests/commands/doctor.test.js tests/commands/next.test.js tests/commands/graph.test.js tests/commands/plan.test.js tests/lib/i18n-catalog.test.js
node --test tests/commands/ai-export.test.js tests/commands/ai-run-state.test.js tests/lib/ai-export-state.test.js tests/lib/ai-run-state.test.js tests/lib/i18n-catalog.test.js
node --test tests/**/*.test.js
npm run package:quiver
npm run smoke:create-quiver
git diff --check
node bin/create-quiver.js spec validate specs/quiver-v38-cli-i18n-read-only-commands --strict
node bin/create-quiver.js check-slice specs/quiver-v38-cli-i18n-read-only-commands/slices/slice-04-read-only-tests-smokes/slice.json --local
```

## Evidence

- Passed: focused slice-02 command/lib test set.
- Passed: focused slice-03 AI command/lib test set.
- Passed: `node --test tests/**/*.test.js` (562 tests).
- Passed: `npm run package:quiver`.
- Passed: `npm run smoke:create-quiver`.
- Passed: `git diff --check`.
- Passed: strict v38 spec validation.
- Passed: `check-slice --local` with expected warning because the slice is already marked completed.

## Rollback

- Revert the v38 slice commits in this PR.
- Re-run `node --test tests/**/*.test.js`.
- Re-run `npm run package:quiver`.
- Re-run `npm run smoke:create-quiver`.
- Re-run `node bin/create-quiver.js spec validate specs/quiver-v38-cli-i18n-read-only-commands --strict`.

## Risks / Notes

- AI lifecycle work in later specs should account for the read-only AI status/resume coverage already completed here to avoid duplicate localization work.
- This PR intentionally does not include or modify `specs/quiver-v44-provider-live-output-tui-lite/`.
