# CLOSURE BRIEF - slice-04: Spec, slice, handoff, and PR generation

## Resumen de lo realizado

Se implemento la fase `spec` de `ai plan` con un generador local que crea `SPEC.md`, `STATUS.md`, `EVIDENCE_REPORT.md`, `EXECUTION_PLAN.md`, `pr.md`, `slice-00` y slices posteriores, valida los `slice.json`, y falla sin overwrite cuando el directorio de spec ya existe.

## Validacion contra criterios de aceptacion

- [x] `SPEC.md` generado.
- [x] `slice-00` generado.
- [x] Handoffs generados para cada slice.
- [x] `EXECUTION_PLAN.md` generado.
- [x] `pr.md` generado.
- [x] Colisiones fallan sin overwrite.

## Cambios relevantes

- `src/create-quiver/lib/ai/spec-generator.js`
- `src/create-quiver/lib/ai/spec-templates.js`
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/phase-gates.js`
- `tests/lib/ai-spec-generator.test.js`
- `tests/commands/ai-plan-spec-phase.test.js`
- `tests/commands/ai-plan.test.js`

## Pendientes

Ninguno para esta slice.

## Riesgos remanentes

- La primera version depende de `--input` como fuente aprobada. Si el input no trae una forma clara de spec, el generador usa una plantilla segura.

## Recomendaciones futuras

Persistir la salida de fases anteriores para que `spec` pueda consumir un contrato estructurado en lugar de solo el input aprobado.
