# EXECUTION BRIEF - slice-03: Phase-gated planner commands

**Spec:** quiver-v20-ai-cli-orchestration
**Slice:** slice-03-ai-phase-gated-planner
**Tipo:** feature

## Contexto

El planner debe operar por fases con aprobacion humana. No puede crear specs ni modificar codigo antes de que los criterios y el plan tecnico esten aprobados.

## Objetivo

Agregar `quiver ai onboard` y `quiver ai plan` con fases explicitas.

## Alcance

- Parsear `npx create-quiver ai onboard`.
- Parsear `npx create-quiver ai plan`.
- Soportar provider, role, context, input, dry-run y timeout.
- Separar acceptance, technical-plan y spec phase.
- Impedir escrituras en acceptance y technical-plan.

## Criterios de aceptacion

- `ai onboard --dry-run` muestra provider, role, context pack e invocation plan.
- `ai plan` en fase acceptance no escribe archivos.
- `ai plan` en fase technical-plan no escribe archivos.
- Faltante de input falla con error claro.
- Error del provider se propaga.

## Plan tecnico resumido

Crear `commands/ai.js` y conectar desde `index.js`. Usar provider runner y context packs existentes. Implementar `phase-gates.js` para validar transiciones.

## Pasos sugeridos de ejecucion

1. Agregar comando `ai` al parser del CLI.
2. Implementar subcomandos `onboard` y `plan`.
3. Integrar provider runner.
4. Integrar context pack selection.
5. Agregar phase gate validation.
6. Agregar tests de comandos.

## Restricciones

- No crear specs en esta slice.
- No modificar producto desde planner.
- Mantener salida en consola.

## Riesgos

- Avanzar de fase por error.
- Mezclar responsabilidades de planner y executor.
- Cambiar parser global y romper comandos existentes.

## Checklist de finalizacion

- [ ] Tests de `ai onboard` pasan.
- [ ] Tests de `ai plan` pasan.
- [ ] Comandos existentes siguen funcionando.
- [ ] Dry-run no ejecuta providers.

