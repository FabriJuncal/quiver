# CLOSURE BRIEF - slice-05: Spec worktree lifecycle

## Resumen de lo realizado

Se agrego el flujo de worktree a nivel spec con comandos `spec start` y `spec status`. Tambien se bloqueo `start-slice` para slices posteriores cuando `slice-00` no esta completada.

## Validacion contra criterios de aceptacion

- [x] Worktree por spec implementado.
- [x] `slice-00` bloquea slices posteriores.
- [x] Estado visible.
- [x] Tests ejecutados.

## Cambios relevantes

- Nuevo helper `src/create-quiver/lib/spec-worktrees.js`.
- Nuevo comando `npx create-quiver spec start <spec-dir>`.
- Nuevo comando `npx create-quiver spec status <spec-dir>`.
- `start-slice` valida que `slice-00` este completado antes de iniciar slices posteriores.
- `feature` y `bugfix` aceptan `main` o `develop` como base branch.

## Pendientes

Sin pendientes criticos para esta slice.

## Riesgos remanentes

La limpieza post-merge del worktree no esta incluida en esta slice; queda para `slice-09`.

## Recomendaciones futuras

Mantener `spec close` separado de `spec start/status` para no mezclar creacion segura con limpieza destructiva.
