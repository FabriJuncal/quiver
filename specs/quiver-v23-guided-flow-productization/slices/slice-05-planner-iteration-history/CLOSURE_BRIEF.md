# CLOSURE BRIEF - slice-05: Planner iteration history

## Resumen de lo realizado

Se agrego historial versionado para drafts de `acceptance` y `technical-plan`, manteniendo compatibilidad con `draft.md` y `approved.md`. Ahora se puede aprobar una version concreta con `ai approve --version`.

## Validacion contra criterios de aceptacion

- [x] Drafts versionados.
- [x] Aprobacion explicita.
- [x] Bloqueos preservados.
- [x] Tests pasan.

## Cambios relevantes

- `src/create-quiver/lib/approvals.js`: drafts versionados, metadata de version y deteccion de stale cuando se aprueba una version anterior.
- `src/create-quiver/commands/ai.js` e `index.js`: soporte `ai approve --version <n>`.
- `tests/lib/approvals.test.js` y `tests/commands/ai-plan.test.js`: multiples drafts y aprobacion por version.
- Docs de comandos y README actualizados.

## Pendientes

Ninguno para este slice.

## Riesgos remanentes

Los archivos legacy `draft.md` y `approved.md` siguen existiendo como punteros/copia para compatibilidad; el historial canonico de drafts vive en `drafts/`.

## Recomendaciones futuras

Usar el historial versionado como entrada de la revision de plan de produccion en `slice-06`.
