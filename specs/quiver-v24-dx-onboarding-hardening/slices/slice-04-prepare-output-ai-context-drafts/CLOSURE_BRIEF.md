# CLOSURE BRIEF - slice-04: Prepare output and AI context preparation drafts

## Resumen de lo realizado

Se aclaró la salida de `prepare --dry-run` para separar guidance del framework de docs del proyecto, y se agregó `ai prepare-context` para previsualizar o escribir borradores de contexto IA solo en documentación.

## Validación contra criterios de aceptación

- [x] Prepare output is clear.
- [x] Context preparation dry-run writes nothing.
- [x] Write mode stays docs-only.
- [x] Uncertainty is explicitly marked.
- [x] Generated scripts and command docs include `quiver:ai:prepare-context`.

## Cambios relevantes

- `prepare --dry-run` ya no reporta `README_FOR_AI.md missing` como deuda falsa en proyectos generados.
- Nuevo subcomando `npx create-quiver ai prepare-context`.
- `ai prepare-context --dry-run` reporta docs propuestas, archivos considerados, supuestos, riesgos y rutas omitidas.
- Write mode toca solo `docs/AI_CONTEXT.md`, `docs/AI_ONBOARDING_PROMPT.md`, `docs/CONTEXTO.md`, `docs/STATUS.md` y `docs/DECISIONS.md`.
- Scripts generados y docs de comandos incluyen `quiver:ai:prepare-context`.

## Pendientes

Sin pendientes del slice.

## Riesgos remanentes

Los borradores escritos reemplazan los docs/context aprobados. El flujo recomendado sigue siendo ejecutar `--dry-run`, revisar supuestos/riesgos y recién después escribir.

## Recomendaciones futuras

Use this context preparation output as the input for planner onboarding.
