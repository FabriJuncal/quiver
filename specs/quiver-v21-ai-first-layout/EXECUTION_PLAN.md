# Execution Plan - Quiver v21 AI-First Layout

## Execution Waves

`slice-00` must run first. It publishes the spec, slices, handoffs, and PR body.

### Ola 0 - Base documental obligatoria

Ejecutar primero y de forma secuencial:

1. `slice-00-spec-foundation`

Salida esperada:

- Spec, slices, briefs, execution plan y PR body versionados.
- El resto de agentes puede leer solo su slice y handoff.

Gate para avanzar:

- `slice-00` mergeado o, como minimo, disponible en la rama base compartida por los worktrees.
- Todos los `slice.json` parsean.
- No hay cambios de codigo de producto.

### Ola 1 - Contrato de entrada del init

Ejecutar de forma secuencial:

1. `slice-01-init-profiles-dry-run`

Motivo:

- Define el parser, flags, alias compatible y layout planner.
- Los demas slices dependen de estos contratos para no duplicar decisiones.

Gate para avanzar:

- `init --dry-run` no escribe archivos.
- `npx create-quiver --name` sigue funcionando como alias.
- El layout planner esta testeado como funcion pura.

### Ola 2 - Infraestructura interna

Ejecutar de forma secuencial:

1. `slice-02-internal-layout-template-resolver`

Motivo:

- Define `.quiver/`, paths internos y resolucion de templates.
- Es prerequisito para cambiar generacion y analyze sin hardcodear rutas en varios lugares.

Gate para avanzar:

- `.quiver/state.json`, `.quiver/config.json` y `.quiver/.gitignore` definidos.
- Templates resueltos desde el paquete sin requerir `docs-template/` visible.
- Fallback legacy cubierto por tests.

### Ola 3 - Cambios funcionales paralelizables

Ejecutar en paralelo despues de la Ola 2:

1. `slice-03-generation-profiles-visible-contract`
2. `slice-04-analyze-scan-relocation`

Por que pueden ir en paralelo:

- `slice-03` cambia que escribe `init`.
- `slice-04` cambia donde escribe y lee `analyze`.
- Comparten helpers de `.quiver/`, pero no deberian modificar la misma responsabilidad principal.

Condiciones de paralelismo:

- Ambos worktrees deben partir de una rama que ya incluya `slice-02`.
- Si ambos tocan `scripts/ci/smoke-create-quiver.sh`, coordinar el merge final para evitar conflictos de asserts.
- Si ambos tocan helpers de paths internos, mantener la autoridad en `slice-02` y solo consumirlos.

Gate para avanzar:

- Default init no crea `docs-template/`, `tools/scripts/` ni spec placeholder.
- `--minimal` y `--full` estan cubiertos.
- `analyze` escribe `.quiver/scans/PROJECT_SCAN.json`.
- `docs/PROJECT_MAP.md` sigue visible.
- Lectura legacy de `docs/PROJECT_SCAN.json` funciona.

### Ola 4 - Compatibilidad y comandos sobre el nuevo layout

Ejecutar en paralelo despues de la Ola 3:

1. `slice-05-empty-specs-layout-doctor`
2. `slice-06-legacy-migration-optional-assets`

Por que pueden ir en paralelo:

- `slice-05` adapta comandos y doctor al estado sin specs y a deteccion de layout.
- `slice-06` adapta migracion y assets opcionales.
- Ambos consumen el comportamiento ya definido por `slice-03` y `slice-04`.

Condiciones de paralelismo:

- Ambos worktrees deben partir de una rama que incluya la Ola 3 completa.
- Si ambos modifican `doctor`, coordinar ownership: `slice-05` debe ser owner de deteccion/reporting de layout; `slice-06` puede agregar mensajes de migracion usando esa API.
- Si ambos modifican smokes, evitar duplicar escenarios.

Gate para avanzar:

- `plan`, `graph`, `next` y `doctor` soportan proyectos sin specs.
- Doctor reporta layout nuevo, legacy, hibrido o incompleto.
- `migrate` es no destructivo.
- `--legacy-scripts`, `--include-templates` y `--full` generan assets consistentes.

### Ola 5 - Documentacion alineada

Ejecutar de forma secuencial despues de la Ola 4:

1. `slice-07-docs-guidance-alignment`

Motivo:

- La documentacion debe reflejar comportamiento final, no comportamiento intermedio.

Gate para avanzar:

- README, README_FOR_AI, generated README y templates describen el mismo modelo.
- `docs-template/`, `tools/scripts/` y scan legacy aparecen solo como compatibilidad u opciones.
- Onboarding de IA empieza por contrato visible, no por `.quiver/`.

### Ola 6 - Cierre y evidencia

Ejecutar ultimo y de forma secuencial:

1. `slice-08-smokes-release-readiness`

Motivo:

- Valida toda la matriz despues de comportamiento, compatibilidad y docs.

Gate final:

- Suite Node completa pasa.
- Smokes principales pasan.
- `EVIDENCE_REPORT.md` actualizado con evidencia real.
- `pr.md` actualizado y listo para abrir PR.

## Parallelism Summary

| Ola | Slices | Modo |
| --- | --- | --- |
| 0 | `slice-00` | Secuencial obligatorio |
| 1 | `slice-01` | Secuencial |
| 2 | `slice-02` | Secuencial |
| 3 | `slice-03`, `slice-04` | Paralelo condicionado |
| 4 | `slice-05`, `slice-06` | Paralelo condicionado |
| 5 | `slice-07` | Secuencial |
| 6 | `slice-08` | Secuencial |

## Worktree Guidance

- Use one worktree per implementation slice.
- Keep one commit per slice.
- Do not run `slice-03` before `slice-02` because generation depends on the internal layout and template resolver.
- Do not run `slice-07` until behavior is stable, otherwise docs will drift.

## Suggested Branches

- `feature/QUIVER-21-00-spec-foundation`
- `feature/QUIVER-21-01-init-profiles`
- `feature/QUIVER-21-02-internal-layout`
- `feature/QUIVER-21-03-generation-profiles`
- `feature/QUIVER-21-04-analyze-scan`
- `feature/QUIVER-21-05-empty-specs-doctor`
- `feature/QUIVER-21-06-legacy-migration`
- `feature/QUIVER-21-07-docs-alignment`
- `feature/QUIVER-21-08-smokes`

## Validation Gate

Before closing the spec:

```bash
node --test tests/**/*.test.js
npm run smoke:create-quiver
bash scripts/ci/smoke-init-docs.sh
node scripts/ci/smoke-cross-platform.js
git diff --check
```
