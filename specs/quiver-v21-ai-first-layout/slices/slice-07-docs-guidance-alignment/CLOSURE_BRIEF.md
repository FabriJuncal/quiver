# CLOSURE BRIEF - slice-07: Documentation and guidance alignment

## Resumen de lo realizado

Se alineo la documentacion humana, la guia para agentes y las plantillas generadas con el layout AI-first actual. El flujo default ahora queda documentado como contrato visible chico con maquinaria interna en `.quiver/`, mientras `docs-template/`, `tools/scripts/` y los specs placeholder quedan marcados como compatibilidad u opciones explicitas.

## Validacion contra criterios de aceptacion

- [x] Visible vs interno documentado.
- [x] Legacy marcado como compatibilidad.
- [x] Specs reales documentadas en fase spec.
- [x] Paths de scan/map correctos.

## Cambios relevantes

- `README.md` prioriza `init --name`, `.quiver/`, `docs/PROJECT_MAP.md` y el flujo planner/executor.
- `README_FOR_AI.md` dejo de presentar `docs-template/` como onboarding normal.
- `docs/AI_ONBOARDING_PROMPT.md.template`, `docs/WORKFLOW.md.template` y `docs/STANDARD.md.template` apuntan al mapa visible y al scan crudo en `.quiver/scans/PROJECT_SCAN.json`.
- `docs/COMMANDS.md.template` documenta init, profiles y analyzer output.
- `src/create-quiver/lib/init-docs.js` y `scripts/init-docs.sh` ajustan README generado y dejan el script Bash como compatibilidad legacy.
- Los smokes esperan la ruta nueva del scan en el onboarding prompt generado.

## Pendientes

Ninguno para este slice. `slice-08` debe decidir si actualiza el smoke `smoke-tiered-pack` o el output de `doctor` para el nuevo estado sin specs.

## Riesgos remanentes

El script Bash `scripts/init-docs.sh` sigue siendo una ruta legacy amplia y conserva referencias internas a `docs-template/`, `tools/scripts/` y `slice-template` porque ese es su proposito de compatibilidad.
`npm run smoke:tiered-pack` sigue fallando porque espera una sugerencia de `start-slice` en `doctor`, algo que el layout AI-first sin specs ya no garantiza.

## Recomendaciones futuras

Completar `slice-08` con la validacion final de smokes, release readiness y consistencia del paquete antes de publicar.
