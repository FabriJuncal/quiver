# EXECUTION BRIEF - slice-05: Spec worktree lifecycle

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-05-spec-worktree-lifecycle
**Tipo:** feature

## Contexto

El flujo deseado usa un worktree por SPEC, no una mezcla manual de ramas y worktrees por cada tarea.

## Objetivo

Agregar ciclo de vida de worktree a nivel spec y bloquear ejecucion hasta que `slice-00` este completada.

## Alcance

- Comandos de spec start/status.
- Seleccion segura de base branch.
- Reuso seguro de worktree existente.
- Estado de slices dentro del spec.

## Criterios de aceptacion

- Un spec tiene un worktree dedicado.
- `slice-00` es obligatoria primero.
- El estado muestra rama, path y pendientes.
- No se borra ni pisa trabajo local.

## Plan tecnico resumido

Extraer o extender helpers de lifecycle para soportar spec-level worktrees, manteniendo compatibilidad con start-slice existente.

## Pasos sugeridos de ejecucion

1. Revisar `lifecycle.js`, `slice.js` y `git.js`.
2. Definir metadata de spec worktree.
3. Agregar comando start/status.
4. Cubrir main/develop y paths con espacios.
5. Agregar tests.

## Restricciones

- No cerrar worktrees en esta slice.
- No crear PR en esta slice.

## Riesgos

- Romper `start-slice` existente.
- Mantener supuestos viejos de `develop` cuando el repo usa `main`.

## Checklist de finalizacion

- [ ] Spec worktree start/status listo.
- [ ] Base branch segura.
- [ ] Bloqueo de slice-00 cubierto.
- [ ] Tests pasan.
