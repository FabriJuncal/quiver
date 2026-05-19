# CLOSURE BRIEF - slice-01: AI provider runner

## Resumen de lo realizado

Se agrego la base del provider runner para `codex`, `claude` y `gemini`, incluyendo transporte de prompt por stdin/temp-file, dry-run, preflight de CLI, timeout y resultados estructurados.

## Validacion contra criterios de aceptacion

- [x] Proveedores `codex`, `claude`, `gemini` soportados.
- [x] Proveedor invalido falla con mensaje claro.
- [x] Dry-run no ejecuta procesos.
- [x] Prompt largo no viaja como shell string unico.
- [x] Tests no requieren CLIs reales.

## Cambios relevantes

- `src/create-quiver/lib/ai/providers.js`
- `src/create-quiver/lib/ai/prompt-transport.js`
- `src/create-quiver/lib/ai/preflight.js`
- `tests/lib/ai-providers.test.js`
- `tests/lib/ai-prompt-transport.test.js`

## Pendientes

- Confirmar manualmente opciones reales de ejecucion para cada CLI antes de documentarlas como estables.

## Riesgos remanentes

- `gemini` requiere `--prompt` con valor para entrar en modo headless; se usa un prompt vacio y el contenido real via stdin para evitar argumentos largos.
- La autenticacion especifica de cada provider queda para una validacion posterior.

## Recomendaciones futuras

Validar manualmente cada CLI real fuera de CI antes de publicar la version.

## Validacion ejecutada

- `node --test tests/lib/ai-providers.test.js tests/lib/ai-prompt-transport.test.js tests/lib/ai-context-packs.test.js tests/lib/ai-safety.test.js`
- `git diff --check`
