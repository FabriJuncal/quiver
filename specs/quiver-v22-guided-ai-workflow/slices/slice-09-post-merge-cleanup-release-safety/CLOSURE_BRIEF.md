# CLOSURE BRIEF - slice-09: Post-merge cleanup and release safety

## Resumen de lo realizado

Se agrego cierre seguro de worktrees por spec con `spec close` y un gate de package safety para bloquear archivos locales sensibles antes del release.

## Validacion contra criterios de aceptacion

- [x] Cleanup bloquea PR no mergeado.
- [x] Cleanup bloquea worktree sucio.
- [x] Main local se actualiza.
- [x] Package safety cubierto.

## Cambios relevantes

- Nuevo comando `npx create-quiver spec close <spec-dir>`.
- `spec close` bloquea worktrees sucios y ramas de spec no mergeadas, salvo descarte explicito.
- `spec close --dry-run` muestra la limpieza planeada sin remover worktrees.
- `spec close` remueve el worktree mergeado y hace `git pull --ff-only` cuando hay remote base.
- Nuevo modulo `package-safety` para validar paths del tarball.
- `scripts/package-quiver.sh` ejecuta package safety sobre el contenido real de `npm pack`.

## Pendientes

Sin pendientes criticos para esta slice.

## Riesgos remanentes

Package safety valida nombres/rutas dentro del tarball; no inspecciona secretos embebidos dentro de archivos aparentemente seguros.

## Recomendaciones futuras

Mantener cleanup destructivo separado de PR merge. Si se agrega borrado de ramas remotas, debe quedar detras de un flag explicito distinto.
