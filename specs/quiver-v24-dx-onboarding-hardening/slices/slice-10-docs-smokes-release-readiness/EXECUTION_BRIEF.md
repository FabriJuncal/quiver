# EXECUTION BRIEF - slice-10: Docs, smokes, and release readiness

## Contexto

This is the final integration slice for v24. It must run after implementation behavior is stable.

## Objetivo

Close the spec with synchronized docs, smoke coverage, evidence, and package safety.

## Alcance

- README and README_FOR_AI updates.
- Command/template docs.
- Roadmap/changelog status.
- Smoke tests.
- Evidence report and status closure.
- Package safety and pack dry-run.

## Criterios de aceptación

- Docs match implemented behavior.
- Smokes cover v24 user paths.
- Evidence report is complete.
- Package safety passes.
- No unreleased behavior is marked as published.

## Plan técnico resumido

Audit all changed behavior, update docs once, run final validations, and record evidence.

## Pasos sugeridos de ejecución

1. Review all implementation slices.
2. Update docs/templates.
3. Add/adjust smoke coverage.
4. Run full tests and package checks.
5. Update evidence/status/pr body.

## Restricciones

- Do not add new functional scope in this final slice.
- Do not publish to npm.

## Riesgos

- Docs can overstate behavior if final validation fails; keep claims tied to evidence.

## Checklist de finalización

- [ ] Docs updated.
- [ ] Smokes updated.
- [ ] Full validation captured.
- [ ] Status/evidence closed.
