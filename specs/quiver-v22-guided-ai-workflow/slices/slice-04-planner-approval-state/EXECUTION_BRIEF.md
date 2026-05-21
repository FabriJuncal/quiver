# EXECUTION BRIEF - slice-04: Planner approval state

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-04-planner-approval-state
**Tipo:** feature

## Contexto

El flujo requiere iterar criterios y planes, pero solo usar versiones aprobadas para avanzar.

## Objetivo

Persistir borradores y aprobaciones explicitas para acceptance criteria y technical plan.

## Alcance

- Estado de aprobaciones en `.quiver/`.
- Comandos o subcomandos de aprobacion.
- Bloqueos entre fases.
- Estado legible para el usuario.

## Criterios de aceptacion

- Nada no aprobado alimenta la fase siguiente.
- Las aprobaciones tienen metadata minima.
- El usuario puede ver que falta aprobar.
- La fase spec usa el plan aprobado por defecto.

## Plan tecnico resumido

Crear una capa de approvals reutilizable por `ai plan`, con guardas de fase y tests de transiciones.

## Pasos sugeridos de ejecucion

1. Revisar `phase-gates.js`.
2. Definir formato interno de aprobaciones.
3. Agregar persistencia y lectura.
4. Integrar comandos.
5. Agregar tests de bloqueo y avance.

## Restricciones

- No versionar borradores internos salvo decision explicita.
- No modificar codigo de producto.

## Riesgos

- Que el estado interno y los archivos visibles diverjan.
- Que una aprobacion vieja alimente una spec nueva.

## Checklist de finalizacion

- [ ] Draft/approved diferenciado.
- [ ] Bloqueos entre fases cubiertos.
- [ ] Status legible.
- [ ] Tests pasan.
