# EXECUTION BRIEF - slice-07: GitHub PR preflight

**Spec:** quiver-v20-ai-cli-orchestration
**Slice:** slice-07-github-pr-preflight
**Tipo:** feature

## Contexto

Quiver debe preparar PRs siguiendo `docs/GITFLOW_PR_GUIDE.md`, usando `gh` y configuracion SSH portable. macOS, Linux y Windows necesitan guias distintas.

## Objetivo

Agregar preflight para PR con `gh`, auth, remote, worktree, GitFlow guide, `sshHostAlias` e `identityFile`.

## Alcance

- Validar `gh`.
- Validar `gh auth status`.
- Validar remote Git.
- Validar worktree/rama.
- Validar guia GitFlow.
- Separar alias SSH y identity file.
- Guiar configuracion sin modificar credenciales automaticamente.

## Criterios de aceptacion

- Missing `gh` muestra guia macOS/Linux/Windows.
- `gh` no autenticado muestra `gh auth login`.
- Falta GitFlow guide detiene el flujo.
- Falta identity file muestra path revisado.
- `sshHostAlias` e `identityFile` son opciones separadas.
- Dry-run no crea PR.

## Plan tecnico resumido

Crear `ai/github.js` y extender preflight. Reusar helpers de Git. Los comandos externos deben usar arrays y ser mockeables en tests.

## Pasos sugeridos de ejecucion

1. Implementar checks de `gh`.
2. Implementar checks de auth.
3. Implementar checks de remote/worktree.
4. Implementar checks SSH.
5. Integrar en `ai doctor` y `ai pr`.
6. Agregar tests.

## Restricciones

- No instalar `gh`.
- No editar SSH config.
- No abrir PR en tests.

## Riesgos

- Cuenta `gh` distinta al remote SSH.
- Alias SSH confundido con path de key.
- Windows path handling.

## Checklist de finalizacion

- [ ] Tests de PR preflight pasan.
- [ ] Missing gh cubierto.
- [ ] Missing auth cubierto.
- [ ] Missing SSH cubierto.
- [ ] Dry-run cubierto.

