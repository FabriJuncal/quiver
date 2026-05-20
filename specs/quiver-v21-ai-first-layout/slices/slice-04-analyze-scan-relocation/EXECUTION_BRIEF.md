# EXECUTION BRIEF - slice-04: Analyze scan relocation

**Spec:** quiver-v21-ai-first-layout
**Slice:** slice-04-analyze-scan-relocation
**Tipo:** feature

## Contexto

`PROJECT_SCAN.json` es dato crudo para herramientas. El proyecto visible necesita `PROJECT_MAP.md`, no necesariamente el JSON completo en `docs/`.

## Objetivo

Mover el scan crudo a `.quiver/scans/` y mantener compatibilidad con el path viejo.

## Alcance

- Escritura de `analyze`.
- Lectura de scan en doctor/context packs.
- Compatibilidad con `docs/PROJECT_SCAN.json`.
- Tests de path nuevo y legacy.

## Criterios de aceptacion

- `analyze` escribe `.quiver/scans/PROJECT_SCAN.json`.
- `docs/PROJECT_MAP.md` sigue visible.
- Lectores soportan path nuevo y legacy.
- Si existen ambos, se prefiere el path nuevo.

## Plan tecnico resumido

Crear helpers de scan path sobre `.quiver/`, cambiar escritura de analyze y actualizar consumidores para leer con fallback.

## Pasos sugeridos de ejecucion

1. Identificar todos los consumidores de `docs/PROJECT_SCAN.json`.
2. Crear helper de lectura/escritura de scan.
3. Cambiar `analyze`.
4. Actualizar doctor y AI context.
5. Agregar tests de compatibilidad.

## Restricciones

- No borrar archivos legacy.
- No ocultar `PROJECT_MAP.md`.
- No cambiar el contrato semantico del scan.

## Riesgos

- Onboarding que siga buscando solo el path viejo.
- Smokes desactualizados.
- Usuarios confundidos por dos paths durante transicion.

## Checklist de finalizacion

- [ ] Analyze path nuevo validado.
- [ ] Project map visible validado.
- [ ] Fallback legacy validado.
- [ ] Smokes actualizados.
