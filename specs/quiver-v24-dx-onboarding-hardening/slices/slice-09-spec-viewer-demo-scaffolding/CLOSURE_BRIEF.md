# CLOSURE BRIEF - slice-09: Spec Viewer demo scaffolding

## Resumen de lo realizado

Se agregó el scaffold opcional `demo create spec-viewer` para crear una app estática pequeña con specs/slices de ejemplo, handoffs, cuerpo de PR y script de validación.

## Validación contra criterios de aceptación

- [x] Demo dry-run writes nothing.
- [x] Demo real run creates runnable files.
- [x] Existing files are preserved.
- [x] No heavy dependencies added.
- [x] Local demo output is excluded by package safety.

## Cambios relevantes

- Nuevo comando `npx create-quiver demo create spec-viewer`.
- Nuevo scaffold en `src/create-quiver/lib/demo.js`.
- Nueva integración CLI en `src/create-quiver/commands/demo.js` y `src/create-quiver/index.js`.
- Demo generado con HTML/CSS/JS estático, `server.js`, `scripts/validate-demo.js`, spec, slices, handoffs, evidencia y PR body.
- Smoke `create-quiver` extendido para cubrir dry-run, scaffold real, validación y evidencia del demo.
- Package safety y `.npmignore` protegen contra publicar `quiver-spec-viewer/` generado localmente.

## Pendientes

Sin pendientes del slice.

## Riesgos remanentes

El demo debe seguir siendo opcional y estático. Si crece hacia una UI persistente, conviene moverlo a un paquete o proyecto separado.

## Recomendaciones futuras

If users ask for a visual UI, consider a separate companion package, not core `create-quiver`.
