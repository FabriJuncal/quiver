---
artifact_id: "REQ-WORKFLOW-001"
artifact_type: "requirements"
version: "1.0.0"
lifecycle_status: "approved"
owner: "project-owner"
date: "2026-09-02"
supersedes: null
related_plans:
  - artifact_id: "PLAN-WORKFLOW-001"
    catalog_path: "../plans/README.md"
decisions:
  - decision_id: "DEC-20260902-001"
    date: "2026-09-02"
    actor: "project-owner"
    change: "Crear un contrato documental para requerimientos y planes"
    reason: "El proyecto necesita artefactos durables, relacionados y versionados fuera del historial de chat y del estado interno de Quiver"
    impact: "Modifica la documentación de workflow e incorpora catálogos canónicos bajo docs/requirements y docs/plans"
---

# Requerimiento: gobernanza documental de requerimientos y planes

## Objetivo

Registrar requerimientos en `docs/requirements/` y planes en `docs/plans/` con
versionado explícito, trazabilidad bidireccional y motivo documentado para cada
modificación.

## Requerimientos

- Todo requerimiento durable debe vivir en `docs/requirements/`.
- Todo plan durable debe vivir en `docs/plans/`.
- Cada requerimiento y plan debe tener ID y versión.
- Cada plan debe fijar la versión exacta de los requerimientos que consume.
- Cada requerimiento debe identificar sus planes relacionados.
- Cada modificación debe crear una versión nueva y registrar cambio, motivo e
  impacto.
- Las versiones aprobadas anteriores deben permanecer inmutables.
- El catálogo de requerimientos v6 debe incorporarse completo al repositorio.
- El roadmap v6 debe incorporarse como plan relacionado para evitar un
  requerimiento maestro huérfano.

## Criterios de aceptación

- Existe un workflow canónico que define estructura, metadata y versionado.
- `docs/INDEX.md` enlaza requerimientos, planes y el workflow.
- Las guías de flujo usan `docs/requirements/` y explican cómo persistir planes.
- Los templates generados contienen la misma regla.
- El requerimiento v6 y el roadmap v6 están importados íntegros y relacionados.
- La importación conserva versión, estado, owner y hashes de origen.
- Los archivos preexistentes del usuario no se modifican.

## Fuera de alcance

- Cambiar el CLI para publicar automáticamente planes aprobados.
- Migrar o reescribir todos los requerimientos históricos.
- Alterar el alcance congelado de `SPEC-V58`.
