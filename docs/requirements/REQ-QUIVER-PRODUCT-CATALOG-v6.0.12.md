---
title: "Quiver — Catálogo segmentado de especificaciones y requerimientos v6.0.12"
document_type: "Product Requirements Initiative Catalog"
artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
artifact_type: "requirements"
version: "6.0.12"
status: "Propuesta para aprobación"
lifecycle_status: "proposed"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: "./REQ-QUIVER-PRODUCT-CATALOG-v6.0.11.md"
related_plans:
  - artifact_id: "PLAN-QUIVER-MASTER"
    catalog_path: "../plans/README.md"
initiatives:
  - artifact_id: "REQ-QUIVER-INIT-A-ENGINE-TRUST"
    version: "1.0.3"
    path: "./initiatives/REQ-QUIVER-INIT-A-ENGINE-TRUST-v1.0.3.md"
  - artifact_id: "REQ-QUIVER-INIT-B-STUDIO-ALPHA"
    version: "1.0.2"
    path: "./initiatives/REQ-QUIVER-INIT-B-STUDIO-ALPHA-v1.0.2.md"
  - artifact_id: "REQ-QUIVER-INIT-C-OBSERVER-CONTROL"
    version: "1.0.2"
    path: "./initiatives/REQ-QUIVER-INIT-C-OBSERVER-CONTROL-v1.0.2.md"
  - artifact_id: "REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM"
    version: "1.0.2"
    path: "./initiatives/REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM-v1.0.2.md"
  - artifact_id: "REQ-QUIVER-INIT-E-BUILDER-DELIVERY"
    version: "1.0.2"
    path: "./initiatives/REQ-QUIVER-INIT-E-BUILDER-DELIVERY-v1.0.2.md"
  - artifact_id: "REQ-QUIVER-INIT-F-ORCHESTRATION-OPERATIONS"
    version: "1.0.1"
    path: "./initiatives/REQ-QUIVER-INIT-F-ORCHESTRATION-OPERATIONS-v1.0.1.md"
  - artifact_id: "REQ-QUIVER-INIT-G-SCALE-ECOSYSTEM"
    version: "1.0.0"
    path: "./initiatives/REQ-QUIVER-INIT-G-SCALE-ECOSYSTEM-v1.0.0.md"
decisions:
  - decision_id: "DEC-20260903-001"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Segmentar el catálogo monolítico en siete iniciativas alineadas con los hitos A–G"
    reason: "Reducir contexto y permitir planificación independiente sin crear 35 duplicados de las specs ejecutables"
    impact: "Cambia la organización documental, no el alcance ni el estado de los 314 requisitos"
  - decision_id: "DEC-20260903-002"
    date: "2026-09-03"
    actor: "project-owner"
    change: "Fijar como canónica la ubicación de gates de la tabla de dependencias y la sección 7 del roadmap v6"
    reason: "El roadmap visual v6.0 ubicaba G2, G3 y G4 después de fases que ya dependían de esos gates"
    impact: "G2 precede V75, G3 precede V77 y G4 precede V82; el diagrama v6.0 queda como representación histórica no canónica para esos gates"
  - decision_id: "DEC-20260903-014"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar el binding de la iniciativa A de 1.0.0 a 1.0.1"
    reason: "La nueva revisión agrega la relación durable con su plan específico"
    impact: "Cambia solo metadata de trazabilidad; mantiene siete iniciativas, 35 specs y 314 requisitos"
  - decision_id: "DEC-20260903-018"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar el binding de la iniciativa A de 1.0.1 a 1.0.2"
    reason: "La revisión 1.0.2 reconcilia el estado de V58 tras el merge de PR #144"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-028"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar A a su revisión aprobada 1.0.3 y vincular B 1.0.1 con su plan"
    reason: "Persistir la aprobación secuencial de A y habilitar la planificación de B"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-033"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar el binding de B a su revisión aprobada 1.0.2"
    reason: "Persistir la aprobación explícita de la cadena documental B"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-037"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar C a 1.0.1 y vincular su plan específico"
    reason: "La aprobación de B habilita la planificación documental de C"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-043"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar el binding de C a su revisión aprobada 1.0.2"
    reason: "Persistir la aprobación explícita de la cadena documental C"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-047"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar D a 1.0.1 y vincular su plan específico"
    reason: "La aprobación de C habilita la planificación documental de D"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-053"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar el binding de D a su revisión aprobada 1.0.2"
    reason: "Persistir la aprobación explícita de la cadena documental D"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-057"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar E a 1.0.1 y vincular su plan específico"
    reason: "La aprobación de D habilita la planificación documental de E"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-063"
    date: "2026-09-03"
    actor: "project-owner"
    change: "Actualizar el binding de E a su revisión aprobada 1.0.2"
    reason: "Persistir la aprobación explícita de la cadena documental E"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
  - decision_id: "DEC-20260903-067"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Actualizar F a 1.0.1 y vincular su plan específico"
    reason: "La aprobación de E habilita la planificación documental de F"
    impact: "Mantiene siete iniciativas, 35 specs y 314 requisitos sin cambio de alcance"
traceability:
  artifact_id: "TRACE-QUIVER-V4-TO-V6"
  version: "1.0.0"
  path: "./traceability/TRACE-QUIVER-V4-TO-V6-v1.0.0.md"
---

<!-- markdownlint-disable MD025 -->

# Quiver — Catálogo segmentado de requerimientos v6.0.12

## 0. Cómo usar este catálogo

Este archivo reemplaza v6.0.11 como punto de entrada operativo. Vincula las
revisiones aprobadas 1.0.3 de A y 1.0.2 de B, C, D y E, y la revisión propuesta
1.0.1 de F con sus planes. El contenido continúa distribuido en siete
iniciativas versionables, sin cambios de alcance.

Para una tarea normal:

1. leer este manifiesto;
2. abrir solamente la iniciativa relevante;
3. consultar el plan maestro y el gate aplicable;
4. materializar la `SPEC.md` ejecutable antes de implementar.

El archivo [v6.0 monolítico](./Quiver_Especificaciones_Requerimientos_v6.md)
queda como versión histórica inmutable. No debe cargarse completo salvo auditoría
o comparación de integridad.

## 1. Iniciativas

| Segmento | Artifact ID | Specs | RQs | Documento |
|---|---|---:|---:|---|
| A | `REQ-QUIVER-INIT-A-ENGINE-TRUST` | V58–V62 | 46 | [REQ-QUIVER-INIT-A-ENGINE-TRUST-v1.0.3.md](./initiatives/REQ-QUIVER-INIT-A-ENGINE-TRUST-v1.0.3.md) |
| B | `REQ-QUIVER-INIT-B-STUDIO-ALPHA` | V63–V70 | 80 | [REQ-QUIVER-INIT-B-STUDIO-ALPHA-v1.0.2.md](./initiatives/REQ-QUIVER-INIT-B-STUDIO-ALPHA-v1.0.2.md) |
| C | `REQ-QUIVER-INIT-C-OBSERVER-CONTROL` | V71–V76 | 48 | [REQ-QUIVER-INIT-C-OBSERVER-CONTROL-v1.0.2.md](./initiatives/REQ-QUIVER-INIT-C-OBSERVER-CONTROL-v1.0.2.md) |
| D | `REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM` | V77–V81 | 46 | [REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM-v1.0.2.md](./initiatives/REQ-QUIVER-INIT-D-EXECUTION-AI-TEAM-v1.0.2.md) |
| E | `REQ-QUIVER-INIT-E-BUILDER-DELIVERY` | V82–V85 | 40 | [REQ-QUIVER-INIT-E-BUILDER-DELIVERY-v1.0.2.md](./initiatives/REQ-QUIVER-INIT-E-BUILDER-DELIVERY-v1.0.2.md) |
| F | `REQ-QUIVER-INIT-F-ORCHESTRATION-OPERATIONS` | V86–V88 | 22 | [REQ-QUIVER-INIT-F-ORCHESTRATION-OPERATIONS-v1.0.1.md](./initiatives/REQ-QUIVER-INIT-F-ORCHESTRATION-OPERATIONS-v1.0.1.md) |
| G | `REQ-QUIVER-INIT-G-SCALE-ECOSYSTEM` | V89–V92 | 32 | [REQ-QUIVER-INIT-G-SCALE-ECOSYSTEM-v1.0.0.md](./initiatives/REQ-QUIVER-INIT-G-SCALE-ECOSYSTEM-v1.0.0.md) |

Total: **7 iniciativas, 35 specs y 314 requisitos**.

## 2. Regla de independencia

Cada iniciativa puede versionarse, revisarse y planificarse por separado. Esto
no elimina dependencias entre specs ni gates comerciales. La fuente canónica de
orden y gates es el
[plan maestro v6.0.16](../plans/PLAN-QUIVER-MASTER-v6.0.16.md).

## 3. Principios globales de producto

### GP-01 — La metodología debe ser invisible por defecto

El usuario común no necesita aprender WDD, SDD, findings, digests o manifests para completar el flujo principal.

### GP-02 — Una interfaz principal

Quiver Lead es la interfaz principal. Las capacidades internas no se convierten en chats separados obligatorios.

### GP-03 — El equipo es dinámico

Producto, UX, frontend, backend, QA, seguridad, DevOps, reviewer e incident se activan solo cuando aportan valor.

### GP-04 — Evidence over claims

Una afirmación de un agente no es evidencia suficiente para marcar una entrega como verificada.

### GP-05 — Project Brain no es chat history

El conocimiento durable debe tener fuente, vigencia, autoridad y lineage.

### GP-06 — Obsidian es opcional

Quiver mantiene su Project Brain. El Open Knowledge Vault es compatible con Obsidian, pero Obsidian no es backend obligatorio.

### GP-07 — Propiedad del cliente

Código, artifacts exportables y conocimiento deben poder salir de Quiver en formatos estándar.

### GP-08 — Read-only before write

Cada integración remota comienza con la menor autoridad posible.

### GP-09 — Seguridad proporcional al riesgo

Copy y auth no usan el mismo workflow.

### GP-10 — No false green

`unknown`, `not-tested`, `capability-unavailable` y `failed` son estados diferentes.

### GP-11 — Simple primero, técnico bajo demanda

Studio muestra resultado, riesgo y acción; Engineering Console expone evidencia, IDs, digests, tools y logs.

### GP-12 — No construir por anticipación

Una spec condicional requiere el gate del roadmap o evidencia equivalente.

### GP-13 — GitHub como fuente del código

Quiver no debe mantener una copia propietaria como única fuente del producto.

### GP-14 — Single writer por dato mutable

Una integración puede reflejar información de otra, pero no existirán múltiples escritores silenciosos del mismo estado.

### GP-15 — Determinístico antes que generativo

Schemas, hashes, invariantes, permisos y state transitions deben validarse con código cuando sea posible.

### GP-16 — Producción es una etapa distinta

Preview, aprobación y publicación no son sinónimos.

### GP-17 — Equipo completo no significa reemplazo humano absoluto

Quiver puede ejecutar roles, pero el humano conserva decisiones sensibles y puede ocupar cualquier rol.

### GP-18 — Coste forma parte de la calidad

Un workflow que funciona pero cuesta demasiado o entra en loops no es una mejora.

### GP-19 — Contexto mínimo y relevante

Más memoria almacenada no implica más contexto enviado a cada agente.

### GP-20 — Los dolores son hipótesis de producto

El archivo de dolores orienta prioridades, pero frecuencia y willingness-to-pay se validan con usuarios reales.

## 4. Convenciones de aceptación

Una spec no se considera cerrada por “la IA terminó”. Debe existir, como aplique:

- criterios de aceptación ejecutados;
- tests/validators;
- evidencia;
- revisión independiente según riesgo;
- documentación actualizada;
- decisión humana cuando la policy la exige;
- ausencia de scope violation no resuelta.

## Apéndice A — Resumen del alcance inicial

El primer producto que debe ponerse frente a usuarios reales comprende **SPEC-V58 a SPEC-V70**, con ejecución parcialmente asistida si hace falta.

La experiencia objetivo del Alpha es:

```text
Conectar proyecto
→ Project Brain automático
→ Quiver Lead entiende pedido
→ impacto y decisiones
→ UX cuando corresponde
→ desarrollo
→ QA independiente
→ Vercel Preview
→ aprobación
→ PR
→ Brain actualizado
```

No hace falta que Observer, Runtime neutral, equipo multiagente durable o producción automática estén terminados para validar esta experiencia.

## Apéndice B — Definición del producto final

Cuando las specs condicionales estén justificadas, Quiver puede llegar a ofrecer:

- creación y evolución de software por lenguaje natural;
- Project Brain automático y exportable;
- Product/UX/Frontend/Backend/Data/QA/Security/DevOps dinámicos;
- análisis de impacto antes de cambiar;
- edición visual gobernada;
- backend y datos con políticas y pruebas;
- colaboración humano + IA;
- QA/evidence independiente;
- provenance requirement → release → incidente;
- policies y approvals;
- runtimes reemplazables;
- workspaces, permisos, checkpoints y leases;
- costos preventivos;
- preview, staging, release y recovery;
- operación continua e incidentes;
- multi-repo y enterprise governance;
- interoperabilidad con MCP y planning externo;
- Obsidian/Notion como adapters opcionales de conocimiento.

La promesa final no debe ser “más agentes”. Debe ser:

> **Una experiencia simple de equipo completo, respaldada por memoria, control y evidencia profesional.**

## Apéndice C — Reglas específicas para Project Brain / Obsidian

1. Quiver crea un Project Brain automáticamente por proyecto.
2. El Project Brain es una capacidad propia de Quiver.
3. El Open Knowledge Vault usa formatos abiertos.
4. Obsidian puede abrir el vault, pero no es requisito de uso.
5. No se crea una “instancia de Obsidian” oculta por proyecto.
6. Obsidian Sync/Headless no se usan como backend por defecto.
7. Cambios externos en el vault son propuestas hasta ser validados.
8. Secrets, locks, billing, runs y permisos nunca viven en el vault.
9. El usuario puede exportar o eliminar su Brain.
10. Un plugin oficial pertenece a SPEC-V92 y requiere demanda demostrada.

## Apéndice D — Reglas para convertir este catálogo en SPEC ejecutable

Antes de crear `specs/quiver-vNN-<slug>/SPEC.md`:

1. confirmar que las dependencias estén cerradas;
2. confirmar el gate comercial cuando la spec sea condicional;
3. revisar el estado real del repo y evitar reimplementar capacidades existentes;
4. reconciliar los RQs v4 relacionados;
5. definir alcance y no-alcance congelados;
6. dividir en slices pequeños y verificables;
7. definir evidence rules por slice;
8. mantener el lenguaje del usuario separado del contrato interno;
9. agregar kill/pivot criteria cuando la spec sea una apuesta de producto;
10. cerrar con evidencia de uso real cuando corresponda.

## Apéndice E — Trazabilidad completa de RQ v4 → SPEC v6

La tabla de 119 requerimientos técnicos vive en
[TRACE-QUIVER-V4-TO-V6-v1.0.0.md](./traceability/TRACE-QUIVER-V4-TO-V6-v1.0.0.md)
para que una tarea de iniciativa no cargue trazabilidad global innecesaria.
