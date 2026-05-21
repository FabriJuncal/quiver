# CLOSURE BRIEF - slice-08: PR creation with gh and SSH guidance

## Resumen de lo realizado

Se extendio `ai pr` para validar setup, leer `pr.md`, mostrar el plan de `gh pr create` en dry-run y crear el PR solo cuando el usuario pasa `--create`.

## Validacion contra criterios de aceptacion

- [x] Dry-run no crea PR.
- [x] PR se crea con `gh` en setup valido.
- [x] Faltantes bloquean.
- [x] Tests ejecutados.

## Cambios relevantes

- `ai pr --dry-run` imprime comando planificado y no ejecuta `gh pr create`.
- `ai pr --create --input specs/<spec-slug>/pr.md` ejecuta `gh pr create` con argumentos seguros.
- El cuerpo del PR se toma de `pr.md`; si hay multiples `pr.md`, se exige `--input`.
- Se mantiene la validacion de gh, auth, remote, branch, worktree limpio, guia GitFlow, alias SSH e identity file.
- Tests mockean `gh` y cubren dry-run, create, faltantes y fallos de `gh pr create`.

## Pendientes

Sin pendientes criticos para esta slice.

## Riesgos remanentes

La deteccion automatica de `pr.md` requiere que haya uno solo; si hay varios specs en el repo, el usuario debe pasar `--input`.

## Recomendaciones futuras

Mantener el merge fuera de `ai pr`; el merge queda como decision humana.
