# EXECUTION BRIEF - slice-08: PR creation with gh and SSH guidance

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-08-pr-create-gh-ssh
**Tipo:** feature

## Contexto

`ai pr` hoy valida preflight, pero el flujo final necesita crear el PR con `gh` usando `pr.md`.

## Objetivo

Agregar creacion de PR segura, con dry-run y guia clara para gh/SSH.

## Alcance

- Leer `pr.md`.
- Validar setup.
- Construir y ejecutar `gh pr create`.
- Mantener dry-run.
- No mergear PRs.

## Criterios de aceptacion

- Dry-run no crea PR.
- Faltantes bloquean con mensaje claro.
- Setup valido crea PR usando `pr.md`.
- Tests mockean `gh`.

## Plan tecnico resumido

Extender preflight existente y agregar una capa de creacion que use argumentos seguros, cuerpo desde archivo y confirmacion explicita.

## Pasos sugeridos de ejecucion

1. Revisar `ai/github.js` y `ai-pr.test.js`.
2. Definir flags de create.
3. Leer y validar `pr.md`.
4. Construir llamada segura a `gh`.
5. Agregar tests de dry-run y success mockeado.

## Restricciones

- No instalar `gh`.
- No modificar SSH config.
- No mergear.

## Riesgos

- Crear PR contra base incorrecta.
- Confundir alias SSH con identity file.

## Checklist de finalizacion

- [ ] Dry-run listo.
- [ ] Create listo con mocks.
- [ ] Faltantes bloquean.
- [ ] Tests pasan.
