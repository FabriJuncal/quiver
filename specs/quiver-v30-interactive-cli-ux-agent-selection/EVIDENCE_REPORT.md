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
