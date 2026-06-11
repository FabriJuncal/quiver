# CLOSURE_BRIEF - slice-08 structural map hardening

## Status

Completed on 2026-06-11.

## Summary

Analyze-project now includes a bounded, generic structural map with route, component, context, config, script, import, and export signals. Extraction is best-effort, budgeted, and does not weaken path safety or reliability behavior.

## Evidence

- `discoverProjectFiles` includes `detected.structural_map`.
- Dry-run JSON exposes structural map metadata.
- Provider prompt includes compact structural map JSON.
- Unknown-stack fallback remains covered.
- Extraction warnings are non-fatal and bounded.

## Validation

- `node --test tests/lib/ai-analyze-project-discovery.test.js` passed: 4 tests.
- `node --test tests/commands/ai-analyze-project.test.js` passed: 3 tests.
- `node --test tests/commands/ai-analyze-project-provider.test.js` passed: 17 tests.
- `npm run smoke:create-quiver` passed.
- `git diff --check` passed.

## Decisions

- Structural extraction uses conservative regex heuristics only for common text source extensions.
- The map is context quality metadata; it does not replace semantic sampling or provider validation.

## Follow-ups

- Consider stack-specific adapters in a future spec only after generic structural mapping proves useful.
