---
artifact_id: "REQ-QUIVER-INIT-C-OBSERVER-CONTROL"
artifact_type: "requirements"
version: "1.0.2"
status: "Aprobado"
lifecycle_status: "approved"
owner: "Fabri Juncal"
date: "2026-09-03"
supersedes: "./REQ-QUIVER-INIT-C-OBSERVER-CONTROL-v1.0.1.md"
catalog:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0.7"
  path: "../REQ-QUIVER-PRODUCT-CATALOG-v6.0.7.md"
derived_from:
  artifact_id: "REQ-QUIVER-PRODUCT-CATALOG"
  version: "6.0"
  path: "../Quiver_Especificaciones_Requerimientos_v6.md"
source_specs:
  - "SPEC-V71"
  - "SPEC-V72"
  - "SPEC-V73"
  - "SPEC-V74"
  - "SPEC-V75"
  - "SPEC-V76"
source_section_sha256: "de6cc31733a665c0665cfa5bec1a9ac39ccb672a5eeb4b95477686909930225f"
related_plans:
  - artifact_id: "PLAN-QUIVER-MASTER"
    catalog_path: "../../plans/README.md"
  - artifact_id: "PLAN-QUIVER-INIT-C-OBSERVER-CONTROL"
    catalog_path: "../../plans/README.md"
decisions:
  - decision_id: "DEC-20260903-005"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Extraer SPEC-V71–SPEC-V76 como iniciativa C"
    reason: "Reducir el contexto por tarea sin duplicar el rol de las specs ejecutables"
    impact: "Crea una iniciativa versionable con 6 specs y 48 requisitos; no cambia alcance"
  - decision_id: "DEC-20260903-036"
    date: "2026-09-03"
    actor: "technical-agent"
    change: "Agregar el plan específico de la iniciativa C como relación durable"
    reason: "La cadena B fue aprobada y el workflow habilita planificar C"
    impact: "Actualiza metadata y bindings; no cambia los 48 requisitos ni sus criterios"
  - decision_id: "DEC-20260903-042"
    date: "2026-09-03"
    actor: "project-owner"
    change: "Aprobar el requerimiento de la iniciativa C"
    reason: "Aprobación explícita de REQ-C 1.0.1, binding maestro 6.0.8 y PLAN-C 1.0.1"
    impact: "Crea REQ-C 1.0.2 aprobado; no cambia sus 48 requisitos ni inicia implementación"
---

# Iniciativa C — Observer y Control

## Objetivo de la iniciativa

Construir provenance read-only y findings accionables antes de introducir policies, enforcement y evidencia compartida.

## Alcance y secuencia

- **Hito:** Hito C — Quiver Observer / Control.
- **Specs incluidas:** `SPEC-V71`, `SPEC-V72`, `SPEC-V73`, `SPEC-V74`, `SPEC-V75`, `SPEC-V76`.
- **Requisitos incluidos:** 48.
- **Gate canónico:** G1 precede SPEC-V71; G2 precede SPEC-V75.
- Las dependencias declaradas dentro de cada spec conservan precedencia.
- Independiente significa versionable y planificable como unidad; no autoriza
  ejecutar una spec antes de cerrar sus dependencias y gates.

## Contratos compartidos

- [Catálogo segmentado v6.0.7](../REQ-QUIVER-PRODUCT-CATALOG-v6.0.7.md)
- [Plan maestro efectivo v6.0.9](../../plans/PLAN-QUIVER-MASTER-v6.0.9.md)
- [Plan aprobado de la iniciativa C v1.0.2](../../plans/PLAN-QUIVER-INIT-C-OBSERVER-CONTROL-v1.0.2.md)
- [Trazabilidad completa RQ v4 → SPEC v6](../traceability/TRACE-QUIVER-V4-TO-V6-v1.0.0.md)

## Especificaciones incluidas

## SPEC-V71 — GitHub Read-only Provenance Observer

**Versión:** `v71`<br>
**Slug sugerido:** `quiver-v71-github-read-only-provenance-observer`<br>
**Componente:** Quiver Cloud / Observer<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G1 + SPEC-V62 + SPEC-V69

### Problema / objetivo

Observar GitHub de forma continua para construir provenance sin modificar el repositorio.

### Resultado que debe percibir el usuario

Quiver detecta PRs, commits y checks que no encajan con el trabajo declarado aunque nadie ejecute un comando manual.

### Dolor(es) del catálogo de builders que ataca

Secciones: `62–68, 111–134, 193–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-037; RQ-048–RQ-052; subset read-only de RQ-109

### Requerimientos

#### V71-RQ-01

Usar una GitHub App o mecanismo equivalente con permisos mínimos de lectura por repositorio.

#### V71-RQ-02

Ingerir commits, PRs, reviews, checks y merge SHAs con idempotencia.

#### V71-RQ-03

Correlacionar esos eventos con Project, Feature Delivery, requirement y artifact lineage.

#### V71-RQ-04

Diferenciar proveedor source-of-truth de proyección Quiver.

#### V71-RQ-05

Detectar PR sin requirement, requirement sin PR, HEAD no verificado y evidencia stale.

#### V71-RQ-06

Mantener modo read-only: no crear PR, comentarios ni checks.

#### V71-RQ-07

Registrar permisos y desconexión/revocación de la integración.

#### V71-RQ-08

Reconciliar periódicamente para corregir webhooks perdidos.

### Criterios de aceptación

- Eventos duplicados no generan findings duplicados.
- Quiver reconstruye provenance después de una interrupción.
- La integración puede revocarse sin perder el código del cliente.

### Fuera de alcance

- GitHub Checks de escritura
- Merge
- Branch management remoto

---

## SPEC-V72 — Linear Read-only Work Correlation

**Versión:** `v72`<br>
**Slug sugerido:** `quiver-v72-linear-read-only-work-correlation`<br>
**Componente:** Quiver Cloud / Observer<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G1 + SPEC-V71

### Problema / objetivo

Relacionar el trabajo declarado en Linear con el trabajo real de GitHub/Quiver sin introducir loops de estado.

### Resultado que debe percibir el usuario

Quiver muestra cuando una tarea de Linear y el código real dicen cosas distintas.

### Dolor(es) del catálogo de builders que ataca

Secciones: `64–68, 104, 111–119, 162–163` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-032–RQ-036; RQ-050–RQ-051

### Requerimientos

#### V72-RQ-01

Conectar Linear inicialmente en modo lectura.

#### V72-RQ-02

Relacionar issues/subissues con requirements, Feature Deliveries, branches y PRs.

#### V72-RQ-03

Mantener source-of-truth y single-writer explícitos por propiedad.

#### V72-RQ-04

Detectar trabajo marcado Done sin evidencia o con PR todavía abierto.

#### V72-RQ-05

Detectar trabajo ejecutado sin issue/requirement cuando la policy lo exija.

#### V72-RQ-06

No mover estados de Linear automáticamente en esta spec.

#### V72-RQ-07

Conservar IDs externos y timestamps para provenance.

#### V72-RQ-08

Tolerar workspaces que no utilicen la granularidad recomendada sin inventar subissues.

### Criterios de aceptación

- No hay loops de estado.
- Quiver puede mostrar divergencia Linear ↔ GitHub.
- Un issue externo actualizado marca projections stale cuando corresponde.

### Fuera de alcance

- Creación de issues
- Automatización bidireccional
- Reemplazar Linear

---

## SPEC-V73 — Observer Project Health & Actionable Findings

**Versión:** `v73`<br>
**Slug sugerido:** `quiver-v73-observer-project-health-findings`<br>
**Componente:** Quiver Cloud / Observer<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V71, SPEC-V72

### Problema / objetivo

Convertir señales distribuidas en un panel de salud y findings accionables, no en otra colección de logs.

### Resultado que debe percibir el usuario

Veo qué necesita mi atención y por qué, con pocas alertas de alto valor.

### Dolor(es) del catálogo de builders que ataca

Secciones: `07–12, 38–42, 63–68, 84–89, 111–134, 193–204` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

Amplía RQ-003, RQ-030, RQ-098 y métricas de v4

### Requerimientos

#### V73-RQ-01

Crear Project Health con estados comprensibles: healthy, attention, blocked y unknown.

#### V73-RQ-02

Priorizar findings por impacto, confianza, fase y acción recomendada.

#### V73-RQ-03

Detectar trabajo bloqueado iniciado, scopes superpuestos, evidencia stale, PR huérfano y documentación divergente.

#### V73-RQ-04

Distinguir problema nuevo, deuda heredada, unknown y capacidad no disponible.

#### V73-RQ-05

Evitar findings duplicados mediante identity/reconciliation.

#### V73-RQ-06

Permitir resolver, aceptar, transferir o descartar falsos positivos con razón.

#### V73-RQ-07

Medir precisión percibida y tasa de findings accionables.

#### V73-RQ-08

No ampliar integraciones si el Observer produce demasiado ruido.

### Criterios de aceptación

- Los design partners pueden señalar findings que realmente evitaron retrabajo.
- La misma causa no produce una cascada de alertas redundantes.
- Cada finding explica qué ocurrió, por qué importa y la siguiente acción.

### Fuera de alcance

- Bloqueos automáticos
- Ejecutar agentes
- Producción

---

## SPEC-V74 — Production Provenance: Vercel + Sentry

**Versión:** `v74`<br>
**Slug sugerido:** `quiver-v74-production-provenance-vercel-sentry`<br>
**Componente:** Quiver Cloud / Observer<br>
**Repositorio objetivo:** `quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G1 + SPEC-V73

### Problema / objetivo

Cerrar la trazabilidad hasta producción e incidentes antes de permitir que Quiver opere producción.

### Resultado que debe percibir el usuario

Cuando algo falla sé qué versión, PR, requirement y decisión están relacionados.

### Dolor(es) del catálogo de builders que ataca

Secciones: `38–42, 74–80, 88–95, 104–110, 120–121, 193–204` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-039–RQ-049; RQ-074; RQ-082; RQ-109

### Requerimientos

#### V74-RQ-01

Ingerir deployments de Vercel en modo lectura y correlacionarlos con commit SHA.

#### V74-RQ-02

Ingerir issues/releases de Sentry en modo lectura y correlacionarlos con deployment/commit.

#### V74-RQ-03

Modelar estados PR_PREVIEW, SHARED_STAGING, PRODUCTION_STAGED y PRODUCTION_CURRENT sin asumir que todos existen.

#### V74-RQ-04

Distinguir deployment de release completo.

#### V74-RQ-05

Relacionar una regresión con release, PR, Feature Delivery y Project Brain.

#### V74-RQ-06

Reabrir o crear finding cuando el runtime contradice una assumption/acceptance relevante.

#### V74-RQ-07

No ejecutar rollback ni promoción.

#### V74-RQ-08

Marcar unknown cuando la correlación de source maps/release no pueda demostrarse.

### Criterios de aceptación

- Un incidente real puede trazarse hacia atrás hasta su cambio.
- Vercel READY no implica release verified.
- Sentry no se usa como autoridad de aprobación.

### Fuera de alcance

- Autofix
- Rollback automático
- Promoción a producción

---

## SPEC-V75 — Policy Engine & GitHub Checks

**Versión:** `v75`<br>
**Slug sugerido:** `quiver-v75-control-policy-engine-github-checks`<br>
**Componente:** Quiver Engine + Cloud / Control<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** G2 + SPEC-V73

### Problema / objetivo

Pasar de observar a aplicar reglas con rollout progresivo y explicable.

### Resultado que debe percibir el usuario

Quiver puede advertir o bloquear un cambio inseguro y explicarme exactamente qué regla se incumplió.

### Dolor(es) del catálogo de builders que ataca

Secciones: `19–28, 36–37, 69–80, 129–134, 187–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-001–RQ-007; RQ-034; RQ-037; RQ-118

### Requerimientos

#### V75-RQ-01

Definir policies versionadas con rule IDs, inputs, decisión y remediaciones.

#### V75-RQ-02

Soportar modos observe, warn y enforce por policy/regla.

#### V75-RQ-03

Publicar GitHub Check para reglas seleccionadas sin reemplazar CI del proyecto.

#### V75-RQ-04

Bloquear únicamente cuando la organización activó enforcement y existe evidencia suficiente.

#### V75-RQ-05

Permitir excepciones auditables con alcance, actor, razón y expiración.

#### V75-RQ-06

Mantener fast-delivery/high-assurance como defaults simples.

#### V75-RQ-07

Detectar policy stale frente a cambios de configuración.

#### V75-RQ-08

Medir falsos positivos antes de expandir enforcement.

### Criterios de aceptación

- Una regla puede operar semanas en warn antes de enforce.
- Un deny muestra la remediación exacta.
- Una excepción no desactiva auditoría.
- Quiver no sustituye required checks externos sin configuración.

### Fuera de alcance

- Producción autónoma
- Policies enterprise completas

---

## SPEC-V76 — Unified Evidence Bundle & Actor Decisions

**Versión:** `v76`<br>
**Slug sugerido:** `quiver-v76-evidence-bundle-actor-decisions`<br>
**Componente:** Quiver Protocol + Engine + Cloud / Control<br>
**Repositorio objetivo:** `quiver + quiver-cloud`<br>
**Fase:** 3 — Observer y Control<br>
**Estado:** `CONDITIONAL`<br>
**Dependencias:** SPEC-V62, SPEC-V68, SPEC-V75

### Problema / objetivo

Crear evidencia portable y decisiones humanas autenticadas como base de confianza antes de la ejecución remota.

### Resultado que debe percibir el usuario

Puedo demostrar qué se pidió, quién lo aprobó, qué se probó y qué versión exacta fue revisada.

### Dolor(es) del catálogo de builders que ataca

Secciones: `11–12, 65–80, 120–134, 193–200` de `dolores_actuales_ai_builders(1).md`.

### Relación con requerimientos v4

RQ-008–RQ-009; RQ-097–RQ-101; RQ-110

### Requerimientos

#### V76-RQ-01

Producir EvidenceBundle por Feature Delivery y release con checksums y refs.

#### V76-RQ-02

Distinguir claimed, observed y verified dentro del bundle.

#### V76-RQ-03

Registrar base_sha, final_sha, tested_sha y reviewed_sha y aplicar policy de identidad.

#### V76-RQ-04

Registrar actor autenticado y autorización para approvals, risk acceptance y excepciones.

#### V76-RQ-05

Permitir verificar el bundle offline cuando sea autocontenido.

#### V76-RQ-06

Aplicar clasificación/redacción y no persistir secretos.

#### V76-RQ-07

Agregar append-only event ledger o mecanismo equivalente de tamper evidence.

#### V76-RQ-08

Exponer el resumen de evidencia en Studio y el detalle en Engineering Console.

### Criterios de aceptación

- Modificar evidencia rompe su verificación.
- Un display name no basta para high-assurance.
- Una versión nueva vuelve stale la evidencia anterior.
- El bundle se puede exportar sin depender del runtime que lo creó.

### Fuera de alcance

- Attestation externa obligatoria para todos
- Compliance formal

---
