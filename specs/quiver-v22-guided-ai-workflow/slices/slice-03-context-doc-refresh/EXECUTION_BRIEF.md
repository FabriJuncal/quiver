# EXECUTION BRIEF - slice-03: Context documentation refresh

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-03-context-doc-refresh
**Tipo:** feature

## Contexto

El analisis actual genera mapa y scan, pero el flujo ideal necesita docs de contexto mas utiles para onboarding de IA con menos tokens.

## Objetivo

Mejorar la generacion/refresco de contexto sin exponer secretos ni archivos ruidosos.

## Alcance

- Mejorar scan/map/contexto visible.
- Reutilizar exclusiones de seguridad.
- Reportar supuestos y faltantes.
- Mantener raw scan en `.quiver/scans/`.

## Criterios de aceptacion

- Contexto AI-facing queda actualizado y conciso.
- Secretos y ruido quedan fuera.
- Supuestos y faltantes quedan visibles.
- Tests cubren exclusiones principales.

## Plan tecnico resumido

Extender el analizador/context writer con filtros seguros y salidas humanas. No inferir dominio si el repo no lo declara.

## Pasos sugeridos de ejecucion

1. Revisar `runAnalyze`, `project-scan` y context packs.
2. Definir salidas a refrescar.
3. Aplicar exclusiones compartidas.
4. Agregar tests con fixtures de archivos sensibles/ruidosos.
5. Actualizar docs necesarias.

## Restricciones

- No persistir aprobaciones.
- No ejecutar proveedores IA.

## Riesgos

- Generar contexto demasiado largo.
- Ocultar informacion util por filtros demasiado agresivos.

## Checklist de finalizacion

- [ ] Context docs refrescados.
- [ ] Exclusiones cubiertas.
- [ ] Supuestos reportados.
- [ ] Tests pasan.
