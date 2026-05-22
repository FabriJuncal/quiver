# CLOSURE BRIEF - slice-08: Evidence run command

## Resumen de lo realizado

Se agregó `evidence run -- <command>` para ejecutar validaciones y guardar una evidencia local en Markdown con comando, exit code, duración, stdout/stderr resumidos, truncado y redacción básica de secretos.

## Validación contra criterios de aceptación

- [x] Command output captured.
- [x] Exit code preserved.
- [x] Long output truncated.
- [x] Secret-like values redacted in command, stdout, and stderr.

## Cambios relevantes

- Nuevo comando `npx create-quiver evidence run -- <command>`.
- Nueva librería `src/create-quiver/lib/evidence.js`.
- Nuevo runner de comando `src/create-quiver/commands/evidence.js`.
- Script `quiver:evidence` en proyectos generados y en el repo fuente.
- `.quiver/.gitignore` ahora ignora `evidence/` por defecto.
- Documentación actualizada en README, README_FOR_AI, COMMANDS y WORKFLOW.
- Tests CLI y de librería agregados.

## Pendientes

Sin pendientes del slice.

## Riesgos remanentes

La redacción sigue siendo best effort. No reemplaza una política de secretos ni debe usarse para ejecutar comandos que impriman credenciales intencionalmente.

## Recomendaciones futuras

Consider integrating evidence with active spec/slice metadata after the standalone command is stable.
