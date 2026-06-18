# EXECUTION_BRIEF - slice-03 CLI + JSON + i18n Output

## Objective

Render the recovery payload in human CLI output, JSON output, validation manifests, and English/Spanish messages.

## Context

This slice consumes the recovery payload from slice 02. It must not recalculate path safety or budget recommendations.

## Scope

- Integrate recovery payload into final `evidence-not-selected` failure handling.
- Print prominent recommended fix before long issue details.
- Add optional `recovery` object to `--json`.
- Persist recovery payload in validation manifest.
- Add English and Spanish messages.
- Add focused command and i18n tests.

## Acceptance Criteria

- Human output highlights the recommended command or safe fallback.
- Long missing evidence lists are grouped and truncated.
- `--json` remains valid and backward-compatible.
- Spanish output renders recovery guidance when `--lang es` is active.
- Exit code remains non-zero for invalid final provider output.

## Expected Files

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `src/create-quiver/lib/i18n/messages/en.js`
- `src/create-quiver/lib/i18n/messages/es.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- `tests/lib/i18n-catalog.test.js`
- `specs/quiver-v57-evidence-budget-recovery-ux/**`

## Validation

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
node --test tests/lib/i18n-catalog.test.js
node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict
git diff --check
```

## Completion Checklist

- CLI output renders recovery guidance prominently.
- JSON output includes optional recovery payload.
- Validation manifest persists recovery payload.
- English and Spanish copy are covered by tests.
- Slice closure brief records validation evidence.

## Constraints

- Do not weaken validation.
- Do not auto-apply recovery.
