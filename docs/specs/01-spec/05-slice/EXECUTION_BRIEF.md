# EXECUTION_BRIEF - 05-slice

## Objetivo

Preparar la implementacion futura de parser/command registry como cambio transversal seguro, sin copiar el refactor masivo de `feature/QUIVER-46-49-cli-modernization`.

## Base segura

La rama futura debe nacer desde `origin/main` @ `7bc234bbf96fb17d8c44863fac25430b59fc832e` o un SHA posterior verificado fresco.

No usar `main` local como base mientras siga divergida de `origin/main`.

## Archivos candidatos

Permitidos en primera implementacion:

- `src/create-quiver/lib/cli/command-registry.js`
- `src/create-quiver/lib/cli/parser.js`
- `src/create-quiver/index.js`, solo para extraer constantes existentes e invocar el adaptador parser sin cambiar comportamiento.
- `tests/commands/parser-contract.test.js`, solo como suite nueva de contratos de parser.
- `tests/commands/cli-contract.test.js`, solo para ajustar expectativas al comportamiento real de `origin/main`, no al comportamiento viejo de la rama candidata.

## Archivos excluidos

- `package.json`
- `package-lock.json`
- Version/release files
- Cambios de comandos no mapeados
- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/ai-core.js`
- Cualquier split de comandos `ai/*`
- Wrappers top-level nuevos como `status` o `changelog`
- Docs generadas o templates, salvo que el cambio futuro demuestre que el help real ya cambio y se apruebe en `07-slice`

## Funcionalidad existente afectada

Todos los comandos CLI pueden verse afectados por parser/dispatch.

## Matriz antes/despues

Obligatoria por comando, alias, flag, help, JSON, exit code y side effect.

Baseline minimo que debe quedar igual:

| Area | Antes en `origin/main` | Despues permitido |
|---|---|---|
| `--help` / `help` | Ambos imprimen la misma referencia CLI | Igual, sin perder comandos ni aliases |
| `version` | Reporte humano `Quiver CLI: 0.15.3` sobre base actual | Igual salvo version si se implementa en base posterior |
| `version --json` | JSON con `version_schema_version`, `cli`, `runtime`, `package_manager`, `project` | Igual schema y campos |
| Unknown command | Exit `1`, stderr con unsupported command + hints | Igual contrato |
| `config language show --json` | JSON con `schema_version`, `language`, `source`, `requested_source`, `requested_language`, `warnings` | Igual contrato |
| `slice` sin subcomando | Exit `1`, lista subcomandos soportados | Igual contrato |
| `handoff` sin subcomando | Exit `1`, lista subcomandos soportados | Igual contrato |
| `evidence list --json` | JSON `{ "evidence": [] }` cuando no hay evidencia | Igual contrato |
| `init --dry-run` | Plan sin escribir en el repo | Igual contrato dry-run |
| `ai status --json` | Actualmente salida humana en estado sin run | No corregir ni cambiar sin decision explicita |

## Validaciones

- Compatibilidad total contra baseline.
- No se pierden aliases ni flags.
- Rollback definido antes de implementar.
- `parser.js` debe seguir usando el parser legacy como adapter durante esta etapa.
- `command-registry.js` debe reconstruirse desde `origin/main`, no copiarse tal cual desde `QUIVER-46-49`.
- `HELP_OPTION_SCOPES` puede extraerse como metadata solo si no cambia texto publico sin aprobacion.

## Riesgos

Regresion transversal silenciosa.

Riesgos especificos detectados:

- `feature/QUIVER-46-49-cli-modernization` cambia `7` archivos clave con `4235` inserciones y `3755` eliminaciones en el area parser/CLI.
- El `command-registry.js` candidato incluye comandos top-level `status` y `changelog`; no deben habilitarse en este slice.
- El split `ai-core.js` tiene `3443` lineas nuevas; queda fuera para evitar mezclar parser con modularizacion AI.
- El test candidato `parser-contract.test.js` contiene casos utiles, pero algunos dependen de comportamiento de rama (`status` top-level) que no pertenece al baseline actual.

## Rollback

Revertir los archivos candidatos al estado previo de `origin/main` y validar:

- `node bin/create-quiver.js --help`
- `node bin/create-quiver.js help`
- `node bin/create-quiver.js version`
- `node bin/create-quiver.js version --json`
- `node bin/create-quiver.js __unknown__`
- `node bin/create-quiver.js config language show --json`
- `node bin/create-quiver.js slice`
- `node bin/create-quiver.js handoff`
- `node bin/create-quiver.js evidence list --json`

## Decision tecnica exacta

Implementar en una rama futura como migracion conservadora:

1. Crear `command-registry.js` nuevo, pero poblarlo con los sets actuales de `origin/main`, no con la lista literal de `QUIVER-46-49`.
2. Crear `parser.js` como adaptador de `parseArgs`, equivalente al candidato de rama, sin introducir parser nuevo.
3. Cambiar `index.js` solo para importar los sets desde `command-registry.js` y llamar `parseCliArgs(..., { legacyParseArgs: parseArgs })`.
4. No cambiar logica de parsing, validaciones, dispatch ni comandos.
5. Agregar tests de contrato seleccionados del candidato, filtrando casos que dependan de comandos no aprobados.
6. No tocar `ai.js`, `ai-core.js`, wrappers, docs, package ni version.

## Criterio de salida para aprobar implementacion futura

- Diff acotado a archivos candidatos.
- Help global sin perdida de comandos.
- Contratos basicos de baseline preservados.
- Tests nuevos solo pinnean comportamiento existente o riesgos aprobados.
- No aparecen `status` o `changelog` top-level como comandos nuevos.
