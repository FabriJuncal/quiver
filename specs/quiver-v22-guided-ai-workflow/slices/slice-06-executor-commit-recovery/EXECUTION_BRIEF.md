# EXECUTION BRIEF - slice-06: Executor commit and recovery

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-06-executor-commit-recovery
**Tipo:** feature

## Contexto

El executor debe poder modificar codigo dentro del slice, pero el flujo necesita validacion, reporte y un commit por slice.

## Objetivo

Agregar commit opcional post-validacion y recuperacion clara ante fallos.

## Alcance

- Ejecutar slice con contexto acotado.
- Validar scope.
- Ejecutar validaciones declaradas.
- Crear commit unico si corresponde.
- Reportar retry/abort cuando algo falla.

## Criterios de aceptacion

- No hay commit si falla provider, scope o validaciones.
- Si todo pasa y commit esta habilitado, se crea un commit.
- El usuario ve que hacer ante fallos.
- El worktree sucio se bloquea por default.

## Plan tecnico resumido

Extender `ai execute-slice` y helpers del executor con una etapa posterior a validacion. Mantener commit automation explicita y testeada.

## Pasos sugeridos de ejecucion

1. Revisar `executor.js` y tests actuales.
2. Agregar opcion de commit.
3. Implementar commit message por slice.
4. Agregar reporte de fallo recuperable.
5. Cubrir casos happy/error.

## Restricciones

- No ejecutar multiples slices.
- No abrir PR.
- No hacer rollback destructivo automatico.

## Riesgos

- Commit accidental con cambios fuera de scope.
- Mensajes de error poco accionables.

## Checklist de finalizacion

- [ ] Commit opt-in listo.
- [ ] Scope bloquea commit.
- [ ] Fallos reportan recovery.
- [ ] Tests pasan.
