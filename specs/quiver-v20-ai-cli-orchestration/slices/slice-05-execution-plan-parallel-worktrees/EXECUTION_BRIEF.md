# EXECUTION BRIEF - slice-05: Execution plan and parallel worktrees

**Spec:** quiver-v20-ai-cli-orchestration
**Slice:** slice-05-execution-plan-parallel-worktrees
**Tipo:** feature

## Contexto

El planner debe decir que slices van secuenciales y cuales pueden correr en paralelo. Para paralelismo real, las slices no deben pisarse en la misma worktree.

## Objetivo

Agregar representacion de niveles de ejecucion, dependencias, paralelismo e integracion de worktrees temporales.

## Alcance

- Tratar `slice-00` como primer bloqueante.
- Generar niveles ready.
- Detectar ciclos y dependencias faltantes.
- Documentar estrategia de worktrees temporales.
- Mantener compatibilidad con plan/graph/next.

## Criterios de aceptacion

- El execution plan muestra `slice-00` primero.
- Slices paralelas solo aparecen cuando sus dependencias estan satisfechas.
- Ciclos fallan con diagnostico claro.
- Dependencias faltantes fallan con diagnostico claro.
- Smokes actuales siguen pasando.

## Plan tecnico resumido

Extender `slice-graph.js` y agregar `ai/execution-plan.js`. Reusar logica existente de plan/graph cuando sea posible. Evitar duplicar algoritmos de dependencias.

## Pasos sugeridos de ejecucion

1. Revisar graph/plan actual.
2. Agregar modelo de ready levels.
3. Agregar reglas de `slice-00`.
4. Agregar diagnosticos de error.
5. Agregar tests.
6. Correr smoke.

## Restricciones

- No ejecutar agentes.
- No mergear worktrees automaticamente.
- No romper formatos existentes.

## Riesgos

- Regresion en `quiver:plan`, `quiver:graph`, `quiver:next`.
- Ambiguedad entre paralelizable y paralelo ya ejecutado.

## Checklist de finalizacion

- [ ] Tests de execution plan pasan.
- [ ] Tests de slice graph pasan.
- [ ] Smoke create-quiver pasa.
- [ ] Formatos existentes siguen compatibles.

