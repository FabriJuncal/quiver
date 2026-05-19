# EXECUTION BRIEF - slice-06: Execute slice with scope enforcement

**Spec:** quiver-v20-ai-cli-orchestration
**Slice:** slice-06-ai-execute-slice-scope-enforcement
**Tipo:** feature

## Contexto

El executor es un agente de menor costo que puede modificar codigo directamente siguiendo el handoff. Para que sea seguro, Quiver debe controlar el scope antes y despues.

## Objetivo

Agregar `quiver ai execute-slice` con contexto minimo y validacion de scope.

## Alcance

- Subcomando `ai execute-slice`.
- Requerir `--slice`.
- Requerir `slice.json` y `EXECUTION_BRIEF.md`.
- Preparar prompt executor con contexto `slice` o `minimal`.
- Capturar diff antes/despues.
- Ejecutar scope validation.

## Criterios de aceptacion

- Falla si falta `slice.json`.
- Falla si falta `EXECUTION_BRIEF.md`.
- Dry-run no ejecuta provider.
- Detecta archivos fuera de scope.
- No incluye onboarding full.
- Error de provider sale con codigo no cero.

## Plan tecnico resumido

Crear `ai/executor.js` y conectar el subcomando en `commands/ai.js`. Reusar context packs, provider runner y scope validation existente.

## Pasos sugeridos de ejecucion

1. Implementar loader de slice y handoff.
2. Implementar prompt executor.
3. Integrar provider runner.
4. Capturar diff pre/post.
5. Validar scope.
6. Agregar tests.

## Restricciones

- No commitear automaticamente.
- No arreglar scope violations automaticamente.
- No correr multiples executors en esta slice.

## Riesgos

- Scope validation incompleta.
- Executor necesita mas contexto que el minimo.
- Cambios de codigo fuera del handoff.

## Checklist de finalizacion

- [ ] Tests de execute-slice pasan.
- [ ] Dry-run cubierto.
- [ ] Scope violation cubierto.
- [ ] Provider failure cubierto.

