# EXECUTION BRIEF - slice-08: Smokes and release readiness

**Spec:** quiver-v21-ai-first-layout
**Slice:** slice-08-smokes-release-readiness
**Tipo:** chore

## Contexto

El cambio toca init, analyze, doctor, docs y compatibilidad legacy. El cierre debe probar todos los perfiles y estados criticos.

## Objetivo

Completar validaciones, evidencia y cuerpo de PR para la spec v21.

## Alcance

- Smokes de perfiles.
- Smokes cross-platform.
- Suite Node.
- Evidence report.
- PR body.
- Fixes menores necesarios para que las validaciones pasen.

## Criterios de aceptacion

- Suite Node completa pasa.
- Smokes principales pasan.
- Evidencia real agregada.
- PR body listo.
- No queda drift documental conocido.

## Plan tecnico resumido

Ejecutar la matriz completa despues de todas las slices funcionales y documentales. Ajustar smokes o errores menores solo dentro del alcance de v21.

## Pasos sugeridos de ejecucion

1. Ejecutar suite Node.
2. Ejecutar smoke create-quiver.
3. Ejecutar smoke init-docs.
4. Ejecutar smoke cross-platform.
5. Revisar `git diff --check`.
6. Actualizar evidence y PR body.
7. Cerrar status.

## Restricciones

- No publicar npm.
- No abrir PR sin pedido explicito.
- No agregar nuevo alcance funcional.

## Riesgos

- Smokes lentos o dependientes de red.
- Tests legacy que asumen layout viejo.
- Fixes de ultimo minuto que expandan alcance.

## Checklist de finalizacion

- [ ] `node --test tests/**/*.test.js` pasa.
- [ ] `npm run smoke:create-quiver` pasa.
- [ ] `bash scripts/ci/smoke-init-docs.sh` pasa.
- [ ] `node scripts/ci/smoke-cross-platform.js` pasa.
- [ ] `git diff --check` pasa.
- [ ] Evidence report actualizado.
- [ ] PR body actualizado.
