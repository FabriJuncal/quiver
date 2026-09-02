# Requerimientos y planes versionados

Este documento define el contrato documental para registrar requerimientos en
`docs/requirements/` y planes en `docs/plans/`. Complementa el flujo
`full-ai-spec-to-pr.md`; no reemplaza las specs ejecutables bajo `specs/` ni el
estado interno de `.quiver/`.

## 1. Principios

- Todo requerimiento durable vive en `docs/requirements/`.
- Todo plan durable vive en `docs/plans/`.
- Cada artefacto tiene un ID estable y una versión explícita.
- Un plan referencia la versión exacta de cada requerimiento que implementa.
- Un requerimiento referencia los IDs estables de sus planes relacionados.
- Ningún requerimiento puede pasar a ejecución sin al menos un plan relacionado.
- Toda modificación crea una versión nueva y documenta la decisión que la motivó.
- Las versiones aprobadas o reemplazadas son inmutables.
- `.quiver/approvals/` conserva drafts y estado interno; no sustituye los planes
  durables y revisables de `docs/plans/`.

## 2. Identidad y nombres

Formato recomendado:

```text
docs/requirements/REQ-<DOMINIO>-<NNN>-v<VERSION>.md
docs/plans/PLAN-<DOMINIO>-<NNN>-v<VERSION>.md
```

Ejemplo:

```text
docs/requirements/REQ-BILLING-001-v1.0.0.md
docs/plans/PLAN-BILLING-001-v1.0.0.md
```

Los documentos maestros importados pueden conservar su nombre histórico si el
front matter declara un `artifact_id` estable, su versión y sus relaciones.

## 3. Metadata obligatoria

### Requerimiento

```yaml
---
artifact_id: "REQ-BILLING-001"
artifact_type: "requirements"
version: "1.0.0"
lifecycle_status: "approved"
supersedes: null
related_plans:
  - artifact_id: "PLAN-BILLING-001"
    catalog_path: "../plans/README.md"
decisions:
  - decision_id: "DEC-20260902-001"
    date: "2026-09-02"
    actor: "product-owner"
    change: "Creación del requerimiento"
    reason: "Problema y resultado esperado confirmados"
    impact: "Habilita planificación; no habilita implementación por sí solo"
---
```

### Plan

```yaml
---
artifact_id: "PLAN-BILLING-001"
artifact_type: "plan"
version: "1.0.0"
lifecycle_status: "approved"
supersedes: null
requirements:
  - artifact_id: "REQ-BILLING-001"
    version: "1.0.0"
    path: "../requirements/REQ-BILLING-001-v1.0.0.md"
decisions:
  - decision_id: "DEC-20260902-002"
    date: "2026-09-02"
    actor: "tech-lead"
    change: "Creación del plan"
    reason: "Define cómo cumplir el requerimiento aprobado"
    impact: "Habilita la creación de una spec después de revisión"
---
```

Campos obligatorios de cada decisión:

- `decision_id`: identificador único y estable.
- `date`: fecha ISO `YYYY-MM-DD`.
- `actor`: rol o identidad responsable.
- `change`: qué cambió.
- `reason`: por qué se decidió el cambio; no se acepta “actualización” sin causa.
- `impact`: qué alcance, plan, spec, riesgo o validación resulta afectado.

## 4. Versionado

Se recomienda SemVer documental:

- `MAJOR`: cambia alcance, contrato, reglas de negocio o estrategia de forma
  incompatible.
- `MINOR`: agrega requerimientos, pasos o alcance compatible.
- `PATCH`: aclara redacción o corrige metadata sin cambiar alcance.

Para modificar un artefacto:

1. no editar la versión aprobada existente;
2. crear un archivo con la versión siguiente;
3. conservar el mismo `artifact_id`;
4. establecer `supersedes` con la ruta a la versión anterior;
5. agregar una decisión con cambio, motivo e impacto;
6. actualizar el índice del directorio;
7. actualizar las referencias de versión exacta en los planes afectados.

La relación desde requerimiento hacia plan se mantiene por ID estable y apunta
al catálogo de planes para evitar un ciclo de versionado cuando cambia solamente
el plan. El plan siempre fija la versión exacta del requerimiento consumido.

## 5. Flujo WDD + SDD

1. Crear el requerimiento versionado en `docs/requirements/`.
2. Registrar la decisión inicial y cualquier supuesto pendiente.
3. Generar y aprobar criterios de aceptación mediante el flujo Quiver.
4. Crear el plan en `docs/plans/`, apuntando a la versión exacta del requerimiento.
5. Agregar el ID del plan al requerimiento. Si cambia una versión aprobada, crear
   una nueva versión del requerimiento.
6. Revisar y aprobar el plan.
7. Verificar las relaciones en ambos sentidos y actualizar los índices.
8. Crear la spec ejecutable y sus slices desde el plan aprobado.
9. Ejecutar únicamente slices `ready` y conservar evidencia.

Hasta que el CLI materialice estos documentos automáticamente, el agente o la
persona responsable debe persistir manualmente el requerimiento y el plan
aprobados. No se debe afirmar que `.quiver/approvals/` ya los publicó.

## 6. Estados

Estados recomendados para requerimientos:

```text
draft → proposed → approved → superseded | rejected | archived
```

Estados recomendados para planes:

```text
draft → proposed → approved → in_progress → completed | superseded | rejected
```

El estado original de documentos importados se conserva, y se normaliza en
`lifecycle_status` para permitir lectura consistente.

## 7. Validación mínima

Antes de crear una spec o implementar:

- el requerimiento y el plan existen dentro de los directorios canónicos;
- ambos tienen ID, versión y estado;
- el plan fija la versión exacta del requerimiento;
- el requerimiento referencia el ID del plan;
- cada versión nueva tiene `supersedes` y una decisión con motivo;
- no se modificó una versión aprobada anterior;
- los criterios de aceptación y riesgos siguen vigentes;
- el cambio no contradice una spec activa.

## 8. Migración y documentos históricos

- No reescribir documentos históricos solo para adaptar formato.
- Marcar como legacy los documentos todavía no gobernados por este contrato.
- Migrarlos cuando vuelvan a cambiar o cuando una spec necesite consumirlos.
- Conservar nombre, versión, owner, estado y provenance del archivo original.
- Un import inicial debe registrar hash de origen y motivo de incorporación.
