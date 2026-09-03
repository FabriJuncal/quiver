---
artifact_id: "PLAN-WORKFLOW-001"
artifact_type: "plan"
version: "1.0.0"
lifecycle_status: "completed"
owner: "project-owner"
date: "2026-09-02"
supersedes: null
requirements:
  - artifact_id: "REQ-WORKFLOW-001"
    version: "1.0.0"
    path: "../requirements/REQ-WORKFLOW-001-v1.0.0.md"
decisions:
  - decision_id: "DEC-20260902-002"
    date: "2026-09-02"
    actor: "technical-agent"
    change: "Adoptar archivos versionados con metadata y decision log embebido"
    reason: "Evita una base de datos documental paralela y mantiene cada cambio auditable junto al artefacto que modifica"
    impact: "Toda revisión futura crea un archivo nuevo y actualiza relaciones e índices"
  - decision_id: "DEC-20260902-003"
    date: "2026-09-02"
    actor: "technical-agent"
    change: "Importar el roadmap v6 como plan relacionado del catálogo v6"
    reason: "La relación bidireccional requerida no permite incorporar el catálogo maestro sin un plan asociado"
    impact: "Agrega el roadmap a docs/plans sin cambiar su estado de propuesta"
---

# Plan: gobernanza documental de requerimientos y planes

## Alcance

1. Definir el contrato de identidad, versión, relación y decisiones.
2. Crear índices para `docs/requirements/` y `docs/plans/`.
3. Actualizar el índice y los workflows afectados.
4. Actualizar templates de workflow y documentación.
5. Importar el catálogo de requerimientos v6.
6. Importar el roadmap v6 como plan relacionado.
7. Validar vínculos, metadata, hashes y consistencia documental.

## Validaciones

- Los links Markdown resuelven dentro del repositorio.
- El catálogo importado conserva las 35 specs y 314 requisitos.
- Los hashes de las fuentes importadas están registrados.
- Las relaciones `REQ-WORKFLOW-001 ↔ PLAN-WORKFLOW-001` y
  `REQ-QUIVER-PRODUCT-CATALOG ↔ PLAN-QUIVER-MASTER` existen en ambos sentidos.
- `npm run docs:check` y `git diff --check` pasan si están disponibles.

## Riesgos y mitigación

- **Confusión entre `.quiver/` y docs:** documentar explícitamente la separación.
- **Versionado en cascada:** usar relación estable por ID desde requerimiento y
  versión exacta desde plan.
- **Documentos históricos incompatibles:** preservarlos y migrarlos solo cuando
  vuelvan a cambiar.
- **Falsa aprobación de v6:** conservar `lifecycle_status: proposed`.

## Rollback

Revertir únicamente los archivos nuevos y los cambios documentales de este plan;
no tocar los requerimientos históricos ni el estado interno de `.quiver/`.
