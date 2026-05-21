# CLOSURE BRIEF - slice-04: Context preparation and onboarding

## Resumen de lo realizado

Se productizo el onboarding planner como plantilla empaquetada e index-first, compartida por `ai onboard` y `prepare`. El dry-run ahora reporta fuente del prompt, docs seleccionados y deuda documental.

## Validacion contra criterios de aceptacion

- [x] Prompt index-first.
- [x] Omitidos reportados.
- [x] Supuestos y riesgos reportados.
- [x] Tests pasan.

## Cambios relevantes

- `src/create-quiver/lib/ai/onboarding-template.js`: plan de contexto, docs seleccionados, deuda, omisiones y prompt planner.
- `src/create-quiver/commands/ai.js`: `ai onboard --dry-run` muestra prompt source, selected docs y documentation debt.
- `src/create-quiver/commands/prepare.js`: reporte de onboarding context sin leer todo `docs/`.
- `docs/AI_ONBOARDING_PROMPT.md.template`: lectura index-first y selectiva.
- Tests de `prepare`, `ai onboard` y safety.

## Pendientes

Ninguno para este slice.

## Riesgos remanentes

La plantilla reporta deuda documental por rutas esperadas aunque algunos proyectos minimalistas pueden no necesitarlas todas; el flujo lo trata como guia, no como bloqueo.

## Recomendaciones futuras

Usar el plan de contexto compartido para prompts mas especificos en criterios, plan tecnico y review.
