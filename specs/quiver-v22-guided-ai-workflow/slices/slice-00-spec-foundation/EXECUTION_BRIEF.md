# EXECUTION BRIEF - slice-00: Spec foundation

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-00-spec-foundation
**Tipo:** docs

## Contexto

Esta slice sube al repo la base documental del nuevo flujo guiado de IA. Es obligatoria y debe ejecutarse antes de cualquier slice de implementacion.

## Objetivo

Crear y validar la estructura completa de spec, slices, handoffs, plan de ejecucion y cuerpo de PR para el guided AI workflow.

## Alcance

- Crear `SPEC.md`.
- Crear `STATUS.md`.
- Crear `EVIDENCE_REPORT.md`.
- Crear `EXECUTION_PLAN.md`.
- Crear `pr.md`.
- Crear `slice.json`, `EXECUTION_BRIEF.md` y `CLOSURE_BRIEF.md` para cada slice.

## Criterios de aceptacion

- La carpeta `specs/quiver-v22-guided-ai-workflow/` existe.
- `slice-00` existe y precede al resto.
- Cada slice tiene `slice.json`, `EXECUTION_BRIEF.md` y `CLOSURE_BRIEF.md`.
- Todos los JSON parsean correctamente.
- No se modifica codigo de producto.

## Plan tecnico resumido

Crear artefactos documentales siguiendo el patron real del repo bajo `specs/`. Mantener `slice-00` como base documental y declarar dependencias para todas las slices posteriores.

## Pasos sugeridos de ejecucion

1. Revisar `README_FOR_AI.md`.
2. Crear estructura `specs/quiver-v22-guided-ai-workflow/`.
3. Agregar archivos top-level de spec.
4. Agregar cada slice y handoff.
5. Validar JSON y whitespace.
6. Preparar commit unico de slice-00.

## Restricciones

- No tocar codigo de producto.
- No resolver implementacion en esta slice.
- No crear PR todavia.

## Riesgos

- Generar una spec demasiado amplia sin dependencias claras.
- Dejar handoffs incompletos para agentes executor.

## Checklist de finalizacion

- [ ] `git diff --check` pasa.
- [ ] Todos los `slice.json` parsean.
- [ ] No hay cambios fuera de `specs/quiver-v22-guided-ai-workflow/`.
- [ ] El commit representa solo slice-00.
