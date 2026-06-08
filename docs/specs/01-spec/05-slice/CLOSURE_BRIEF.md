# CLOSURE_BRIEF - 05-slice

## Resultado

Implementado con alcance minimo aprobado.

## Evidencia

Plan de extraccion segura:

| Area | Decision | Restriccion |
|---|---|---|
| `command-registry.js` | Rehacer desde `origin/main`; no copiar literal de `QUIVER-46-49` | La rama candidata incluye `status`/`changelog` top-level; no habilitarlos |
| `parser.js` | Extraer como adaptador conservador sobre parser legacy | No introducir parser nuevo |
| Dispatch en `index.js` | Cambio minimo para imports y llamada al adapter | No cambiar validaciones ni dispatch |
| `parser-contract.test.js` | Tomar casos compatibles con baseline | Excluir casos que dependan de comandos no aprobados |
| `cli-contract.test.js` | Ajustes solo si reflejan baseline real | No adoptar expectativas viejas de rama |
| `ai.js` modularizado / `ai-core.js` | Fuera del slice | Alto riesgo por providers/lifecycle |
| Package/version | Excluido | No tocar en este slice |

Delta inspeccionado en rama fuente:

| Archivo | Estado | Tamano/riesgo |
|---|---|---|
| `src/create-quiver/lib/cli/command-registry.js` | Nuevo | 139 lineas; util como referencia, requiere reconstruccion |
| `src/create-quiver/lib/cli/parser.js` | Nuevo | 14 lineas; adapter sobre `legacyParseArgs` |
| `src/create-quiver/index.js` | Modificado | 726 lineas de diff; tocar solo minimo |
| `src/create-quiver/commands/ai.js` | Modificado masivo | Fuera del slice |
| `src/create-quiver/commands/ai-core.js` | Nuevo, 3443 lineas | Fuera del slice |
| `tests/commands/parser-contract.test.js` | Nuevo | Util como fuente de contratos filtrados |

Gate de compatibilidad para implementacion futura:

- Help global preserva comandos y shortcuts legacy.
- `help` y `--help` siguen equivalentes.
- `version` y `version --json` conservan contrato observado.
- Unknown command mantiene exit code no cero y hints de help/init/update.
- Cualquier comando sin baseline completo queda bloqueado o requiere baseline adicional.
- `config language show --json`, `slice`, `handoff`, `evidence list --json`, `init --dry-run`, `doctor --dry-run`, `ai status --json` y `spec status` conservan el contrato observado o requieren decision explicita.
- No aparecen `status` o `changelog` top-level como comandos nuevos.

Plan de implementacion futura aprobado por este cierre:

1. Rama nueva creada desde `origin/main`: `feature/QUIVER-05-parser-command-registry`.
2. `src/create-quiver/lib/cli/command-registry.js` creado con los sets existentes de `origin/main`.
3. `src/create-quiver/lib/cli/parser.js` creado como adapter de `parseArgs`.
4. `src/create-quiver/index.js` ajustado solo para importar registry/parser y delegar a `parseCliArgs` con `legacyParseArgs`.
5. `tests/commands/parser-contract.test.js` agregado con contratos compatibles con baseline.
6. Validaciones focalizadas ejecutadas y aprobadas.

Validaciones ejecutadas:

| Validacion | Resultado |
|---|---|
| `node --check src/create-quiver/index.js` | OK |
| `node --check src/create-quiver/lib/cli/command-registry.js` | OK |
| `node --check src/create-quiver/lib/cli/parser.js` | OK |
| `node --check tests/commands/parser-contract.test.js` | OK |
| `node --test tests/commands/parser-contract.test.js tests/commands/cli-contract.test.js` | OK, 17 tests passed |
| `node bin/create-quiver.js --help` | OK |
| `node bin/create-quiver.js help` | OK |
| `node bin/create-quiver.js version` | OK |
| `node bin/create-quiver.js version --json` | OK, JSON parseable |
| `node bin/create-quiver.js __unknown__` | OK, exit `1` |
| `node bin/create-quiver.js status --json` | OK, sigue unsupported, exit `1` |
| `node bin/create-quiver.js changelog` | OK, sigue unsupported, exit `1` |

## Cambios de comportamiento

No se busca cambio funcional. La implementacion mueve constantes a registry y delega parsing al adapter legacy.

## Regresiones detectadas

Ninguna en las validaciones focalizadas del slice.

## Riesgos residuales

Parser/registry sigue siendo alto riesgo por blast radius total sobre CLI.

`ai status --json` conserva una ambiguedad detectada: en baseline emite salida humana. No corregir dentro de este slice.

## Decision sobre ramas

Mantener `feature/QUIVER-46-49-cli-modernization` y su remoto como referencia hasta decidir si parser/registry se extraen como codigo o se rehacen.
