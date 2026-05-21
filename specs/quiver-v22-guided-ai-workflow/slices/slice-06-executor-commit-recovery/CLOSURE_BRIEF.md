# CLOSURE BRIEF - slice-06: Executor commit and recovery

## Resumen de lo realizado

Se extendio `ai execute-slice` para ejecutar validaciones declaradas, bloquear commits ante fallos y crear un unico commit del slice cuando el usuario habilita `--commit`.

## Validacion contra criterios de aceptacion

- [x] Commit unico post-validacion.
- [x] Fallos bloquean commit.
- [x] Recovery visible.
- [x] Tests ejecutados.

## Cambios relevantes

- Nuevo flag `--commit` para commit opt-in despues de provider, scope y validaciones.
- Nuevo flag `--allow-dirty` para permitir dirty worktree preexistente de forma explicita.
- Validaciones declaradas en `slice.json.tests` se ejecutan antes del commit.
- Fallos de provider, scope, validacion o commit agregan guia de retry/abort.
- Tests cubren provider failure, scope violation, validation failure, dirty worktree, commit exitoso y dry-run CLI.

## Pendientes

Sin pendientes criticos para esta slice.

## Riesgos remanentes

Los comandos de validacion se ejecutan como comandos del proyecto; deben venir de `slice.json.tests` revisado por el equipo.

## Recomendaciones futuras

Las waves de `slice-07` deben reutilizar este ejecutor en vez de duplicar logica de validacion o commit.
