# CLOSURE BRIEF - slice-06: Historical plan, graph, and next views

## Resumen de lo realizado

- Se agregó `--include-completed` a `plan`, `graph` y `next`.
- `plan` y `graph` mantienen el default pending-only; con el flag incluyen completados y siguen excluyendo `skipped`/`cancelled`.
- `next --include-completed` no sugiere completados como trabajo accionable; solo agrega historial.
- `graph --spec <slug>` ahora filtra consistentemente por spec y no mezcla slices de otros specs.
- `readAllSlices` propaga `ticket`, por lo que el plan muestra tickets reales.

## Validación contra criterios de aceptación

- [x] Defaults are unchanged.
- [x] Completed slices visible with explicit flag.
- [x] JSON output remains parseable.
- [x] `--spec` filtering is consistent across plan, graph, and next.
- [x] Ticket values are preserved in plan output.

## Cambios relevantes

- `src/create-quiver/index.js`
- `src/create-quiver/commands/plan.js`
- `src/create-quiver/commands/graph.js`
- `src/create-quiver/commands/next.js`
- `src/create-quiver/lib/slice-graph.js`
- `tests/commands/plan.test.js`
- `tests/commands/graph.test.js`
- `tests/commands/next.test.js`
- `README.md`
- `README_FOR_AI.md`
- `docs/COMMANDS.md.template`

## Pendientes

Sin pendientes del slice.

## Riesgos remanentes

History mode copy must not be mistaken for execution guidance.

## Recomendaciones futuras

Consider adding examples to docs after usage stabilizes.
