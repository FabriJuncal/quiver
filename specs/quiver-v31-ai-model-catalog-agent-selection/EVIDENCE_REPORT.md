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
