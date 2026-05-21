# EXECUTION BRIEF - slice-09: Post-merge cleanup and release safety

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-09-post-merge-cleanup-release-safety
**Tipo:** feature

## Contexto

Despues del merge, el usuario quiere cerrar el worktree y actualizar el checkout principal. Ademas, la publicacion npm debe bloquear archivos locales sensibles.

## Objetivo

Agregar cierre seguro de spec y guardas de packaging/release.

## Alcance

- Cleanup post-merge.
- Validacion de PR mergeado.
- Proteccion ante worktree sucio.
- Pull del checkout principal.
- Guardas para `npm pack`/release.

## Criterios de aceptacion

- No se limpia si el PR no esta mergeado.
- No se limpia worktree sucio por default.
- El cierre exitoso elimina worktree y actualiza main.
- Packaging falla si entran archivos sensibles.

## Plan tecnico resumido

Extender lifecycle a nivel spec y agregar un chequeo de paquete que inspeccione el resultado de `npm pack --dry-run` o equivalente antes de publicar.

## Pasos sugeridos de ejecucion

1. Revisar cleanup actual y supuestos de base branch.
2. Definir cierre de spec.
3. Agregar validaciones de merge/dirty.
4. Agregar package safety.
5. Cubrir tests y smoke.

## Restricciones

- No mergear PR.
- No publicar npm.
- No descartar cambios sin flag explicito.

## Riesgos

- Borrar trabajo local no mergeado.
- Fallar en repos con base branch distinta.
- Falsos positivos en package safety.

## Checklist de finalizacion

- [ ] Cleanup seguro listo.
- [ ] Main/develop sin hardcode incorrecto.
- [ ] Package safety listo.
- [ ] Tests pasan.
