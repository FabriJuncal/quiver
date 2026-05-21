# EXECUTION BRIEF - slice-07: Execution waves and safe delegation

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-07-execution-waves-delegation
**Tipo:** feature

## Contexto

El usuario quiere que Quiver indique que slices van secuenciales y cuales pueden ir en paralelo con agentes ejecutores baratos.

## Objetivo

Agregar ejecucion por olas con fallback seguro a secuencial.

## Alcance

- Planificar olas desde dependencias.
- Validar conflictos por archivos.
- Imprimir comandos en dry-run.
- Ejecutar olas cuando este habilitado.
- Respetar un commit por slice.

## Criterios de aceptacion

- `slice-00` siempre va primero.
- Paralelo solo se permite sin conflictos.
- Scope desconocido cae a secuencial.
- Una falla corta la ola requerida.
- Dry-run no llama providers.

## Plan tecnico resumido

Extender `execution-plan` y agregar un comando de execute-plan que use el executor ya validado. Mantener primero modo print-only/dry-run.

## Pasos sugeridos de ejecucion

1. Revisar `execution-plan.js` y `slice-graph.js`.
2. Agregar deteccion de conflicto por files.
3. Agregar comando dry-run.
4. Integrar ejecucion real con flags explicitos.
5. Agregar tests de waves y conflictos.

## Restricciones

- No asumir que paralelo es seguro sin files declarados.
- No abrir PR.

## Riesgos

- Ejecutar dos agentes que toquen la misma zona.
- Dejar un wave a medio completar sin reporte claro.

## Checklist de finalizacion

- [ ] Olas generadas.
- [ ] Conflictos detectados.
- [ ] Dry-run print-only listo.
- [ ] Tests pasan.
