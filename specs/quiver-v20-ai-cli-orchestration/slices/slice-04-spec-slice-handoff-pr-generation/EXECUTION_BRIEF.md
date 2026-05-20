# EXECUTION BRIEF - slice-04: Spec, slice, handoff, and PR generation

**Spec:** quiver-v20-ai-cli-orchestration
**Slice:** slice-04-spec-slice-handoff-pr-generation
**Tipo:** feature

## Contexto

Una vez aprobado el plan tecnico, Quiver debe crear artefactos ejecutables para que el trabajo se pueda dividir por slices y PR.

## Objetivo

Implementar generacion de `SPEC.md`, `slice-00`, slices, handoffs, `EXECUTION_PLAN.md` y `pr.md`.

## Alcance

- Generador de spec directory.
- Template de slice obligatoria `slice-00`.
- Handoffs por slice.
- Validacion de JSON generado.
- Prevencion de overwrite accidental.

## Criterios de aceptacion

- Toda spec generada tiene `slice-00`.
- Cada slice tiene `EXECUTION_BRIEF.md` y `CLOSURE_BRIEF.md`.
- `pr.md` siempre existe.
- Colision de directorio falla sin sobrescribir.
- JSON generado parsea.

## Plan tecnico resumido

Crear `spec-generator.js` y `spec-templates.js`. Integrar la fase `spec` de `ai plan` con el generador. Validar antes de escribir y despues de escribir.

## Pasos sugeridos de ejecucion

1. Definir modelo de input aprobado.
2. Crear templates internos.
3. Implementar escritura atomica o segura.
4. Validar paths y colisiones.
5. Integrar con `ai plan --phase spec`.
6. Agregar tests.

## Restricciones

- No commitear automaticamente.
- No abrir PR.
- No ejecutar slices.

## Riesgos

- Generar artefactos inconsistentes.
- Sobrescribir una spec existente.
- Handoffs demasiado genericos para executors.

## Checklist de finalizacion

- [ ] Tests de generador pasan.
- [ ] Colision cubierta.
- [ ] slice-00 cubierta.
- [ ] pr.md cubierta.
- [ ] JSON parse cubierto.

