# EXECUTION BRIEF - slice-07: Documentation and guidance alignment

**Spec:** quiver-v21-ai-first-layout
**Slice:** slice-07-docs-guidance-alignment
**Tipo:** docs

## Contexto

Despues de cambiar comportamiento, la documentacion debe dejar de presentar `docs-template/`, `tools/scripts/` y spec placeholder como default.

## Objetivo

Alinear README, README_FOR_AI, generated README y templates con el nuevo layout AI-first.

## Alcance

- Root README.
- AI guide.
- Generated README in Node and Bash paths.
- Docs templates for commands, workflow, onboarding, support and troubleshooting.
- Smoke assertions de docs.

## Criterios de aceptacion

- Toda la documentacion diferencia contrato visible de maquinaria interna.
- `docs-template/` y `tools/scripts/` aparecen solo como legacy/opcionales.
- Specs reales se documentan como salida de `ai plan --phase spec`.
- Scan crudo y project map tienen paths correctos.

## Plan tecnico resumido

Actualizar docs despues de estabilizar comportamiento. Agregar asserts en smokes para evitar drift.

## Pasos sugeridos de ejecucion

1. Revisar textos actuales que nombren paths legacy.
2. Actualizar README y README_FOR_AI.
3. Actualizar generated README.
4. Actualizar templates.
5. Ajustar smokes de doc.
6. Validar que no se prometan comandos inexistentes.

## Restricciones

- No cambiar codigo de comportamiento salvo generated README text.
- No duplicar instrucciones largas.
- No documentar flags no implementados.

## Riesgos

- Docs queden ahead del comportamiento.
- README se vuelva demasiado largo.
- Onboarding IA vuelva a abrir `.quiver/` innecesariamente.

## Checklist de finalizacion

- [ ] README actualizado.
- [ ] README_FOR_AI actualizado.
- [ ] Generated README actualizado.
- [ ] Templates actualizados.
- [ ] Smokes de docs pasan.
