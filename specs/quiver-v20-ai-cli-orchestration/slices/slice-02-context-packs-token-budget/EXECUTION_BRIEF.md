# EXECUTION BRIEF - slice-02: Context packs and token budgets

**Spec:** quiver-v20-ai-cli-orchestration
**Slice:** slice-02-context-packs-token-budget
**Tipo:** feature

## Contexto

El valor principal del flujo es que el planner use contexto amplio y el executor use contexto minimo. Esta slice define esa separacion.

## Objetivo

Implementar roles, context packs, token-budget hints y exclusiones de seguridad para preparar prompts eficientes.

## Alcance

- Roles `planner` y `executor`.
- Context packs `full`, `planning`, `slice`, `minimal`.
- Exclusiones de secretos y archivos pesados.
- Texto base contra prompt injection desde archivos del repo.
- Metadata para dry-run.

## Criterios de aceptacion

- Executor no recibe contexto `full`.
- Secrets y outputs pesados quedan excluidos.
- Prompt incluye jerarquia de instrucciones.
- Tests cubren paths POSIX y Windows.

## Plan tecnico resumido

Crear `context-packs.js`, `prompts.js` y `safety.js`. Modelar context packs como datos estructurados con entradas sugeridas, exclusiones, rol esperado y presupuesto orientativo.

## Pasos sugeridos de ejecucion

1. Definir constantes de roles y packs.
2. Implementar resolucion de archivos candidatos.
3. Implementar filtros de exclusion.
4. Agregar prompt base de seguridad.
5. Agregar tests para inclusion/exclusion.

## Restricciones

- No leer archivos sensibles.
- No ejecutar providers.
- No generar specs.

## Riesgos

- Contexto demasiado chico para executor.
- Contexto demasiado grande para ahorrar tokens.
- Exclusion incompleta de archivos sensibles.

## Checklist de finalizacion

- [ ] Tests de context packs pasan.
- [ ] Tests de safety pasan.
- [ ] Executor no puede seleccionar `full` por default.
- [ ] Dry-run puede mostrar metadata sin filtrar secretos.

