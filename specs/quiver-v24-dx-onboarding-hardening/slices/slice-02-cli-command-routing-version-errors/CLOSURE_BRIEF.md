# CLOSURE BRIEF - slice-02: CLI command routing and version mismatch errors

## Resumen de lo realizado

- El parser ahora rechaza un primer argumento desconocido como comando no soportado, en vez de tratarlo como nombre legacy de proyecto.
- La compatibilidad `--name "Project"` sigue funcionando para inicialización.
- El error de comando no soportado muestra el comando, `--help`, el comando correcto de init y la recomendación de actualizar si el comando existe en documentación más nueva.
- `doctor` ahora advierte cuando scripts `package.json` que llaman a `npx create-quiver` apuntan a comandos, subcomandos `ai` o subcomandos `spec` no soportados por esta versión.

## Validación contra criterios de aceptación

- [x] Unknown subcommands fail clearly.
- [x] Legacy `--name` remains supported.
- [x] Modern command-like tokens do not trigger init alias behavior.
- [x] Version/script mismatch guidance is actionable.

## Cambios relevantes

- `src/create-quiver/index.js`
- `tests/commands/init-profiles.test.js`
- `tests/commands/doctor.test.js`

## Pendientes

Sin pendientes del slice.

## Riesgos remanentes

El shortcut posicional no documentado `npx create-quiver "Project"` deja de funcionar; el camino documentado y preservado es `npx create-quiver --name "Project"` o `npx create-quiver init --name "Project"`.

## Recomendaciones futuras

Keep parser behavior explicit and avoid compatibility fallthrough for command-like tokens.
