# EXECUTION BRIEF - slice-08: Docs, smokes, and release readiness

**Spec:** quiver-v20-ai-cli-orchestration
**Slice:** slice-08-docs-smokes-release-readiness
**Tipo:** docs

## Contexto

Esta slice cierra la feature. Debe alinear README, templates generados, scripts npm, prompts y smokes con el comportamiento real implementado.

## Objetivo

Documentar `quiver ai ...`, actualizar templates y agregar smokes dry-run sin depender de providers reales.

## Alcance

- README y README_FOR_AI.
- Templates de onboarding, commands, support, troubleshooting y GitFlow.
- Scripts generados en package templates.
- Smokes create-quiver y cross-platform.
- Verificacion de docs generadas.

## Criterios de aceptacion

- README generado menciona comandos AI.
- COMMANDS generado incluye ejemplos `quiver ai`.
- Onboarding prompt generado explica planner/executor.
- Scripts `quiver:ai:*` existen.
- Smokes cubren dry-run sin auth real.
- Cross-platform cubre paths con espacios.

## Plan tecnico resumido

Actualizar documentacion y generadores despues de que los comandos existan. Los smokes deben usar dry-run/mocks para no requerir Codex, Claude, Gemini ni `gh` autenticado.

## Pasos sugeridos de ejecucion

1. Revisar comportamiento final implementado.
2. Actualizar README.
3. Actualizar templates.
4. Actualizar init docs runtime.
5. Agregar scripts npm generados.
6. Agregar smokes.
7. Correr suite completa.

## Restricciones

- No cambiar comportamiento funcional fuera de docs/smokes salvo ajuste necesario para generacion.
- No publicar npm en esta slice.
- No modificar specs antiguas.

## Riesgos

- Docs prometen mas de lo implementado.
- Smokes requieren CLIs reales por accidente.
- Drift entre README_FOR_AI y templates.

## Checklist de finalizacion

- [ ] Tests unitarios pasan.
- [ ] Smoke create-quiver pasa.
- [ ] Cross-platform smoke pasa.
- [ ] README_FOR_AI no contradice README/templates.
- [ ] No hay prompts obsoletos.
