---
title: "Quiver — Requerimiento maestro: metodología risk-aware, plataformas y Agent Skills"
document_type: "Product Requirements Document / Functional & Technical Requirements"
version: "3.0"
status: "Propuesta para planificación"
owner: "Fabri Juncal"
origin: "Lecciones del piloto NIK-9 de TraceBudget y metodología para Linear, GitHub, Codex Cloud, Vercel, Supabase, Base44, Sentry, Notion y Agent Skills"
date: "2026-08-11"
---

# Quiver — Requerimiento maestro: metodología risk-aware, plataformas y Agent Skills

## 0. Propósito del documento

Este documento define los cambios que se recomienda implementar en **Quiver** para que la herramienta cumpla su objetivo original:

> Permitir que equipos humanos y agentes de IA desarrollen software con mayor velocidad, seguridad, trazabilidad y menor carga de coordinación manual.

La propuesta surge del uso intensivo de Quiver durante el piloto **NIK-9 — Identity Role Hardening** de TraceBudget.

El piloto demostró que Quiver aporta valor real para:

- detectar riesgos de seguridad antes de implementar;
- evitar que un agente amplíe el alcance silenciosamente;
- separar planificación, ejecución y revisión;
- convertir requerimientos en contratos verificables;
- conservar evidencia de aceptación, plan, spec, slices, commits, PRs y tests;
- obligar a que los cambios sensibles sean revisados antes de llegar a producción.

Sin embargo, también reveló problemas importantes:

- múltiples iteraciones del technical plan sin comenzar a programar;
- findings de implementación tratados como bloqueantes de arquitectura;
- pérdida de contenido al regenerar planes extensos;
- imposibilidad de aprobar una versión anterior válida cuando el último draft era peor;
- falta de una excepción humana formal y auditable;
- discrepancias entre la representación humana y el artefacto realmente aprobado;
- mezcla entre contrato inmutable y estado mutable de ejecución;
- dependencia excesiva del reviewer generativo para tareas que deberían resolverse con validadores determinísticos;
- ausencia de detección de capacidades reales de GitHub, Codex Cloud o el entorno de ejecución;
- dificultad para distinguir deuda heredada de vulnerabilidades introducidas por el cambio.

La meta no es hacer que Quiver sea menos estricto.

La meta es que Quiver sea:

- **estricto con la seguridad, los datos y el rollout**;
- **flexible con detalles de implementación que pueden resolverse en un slice o PR**;
- **capaz de detener loops de análisis improductivos**;
- **capaz de preservar la autoridad humana sin falsificar estados internos**;
- **más rápido para llevar un requerimiento hasta código ejecutable**.

---

# 1. Contexto y problema observado

## 1.1. Flujo ideal esperado

El flujo esperado era:

```text
Requerimiento
→ criterios de aceptación
→ technical plan
→ spec
→ slices
→ implementación
→ PR
→ CI
→ revisión
→ merge
```

La persona debía intervenir solamente para:

```text
Definir el resultado
→ resolver ambigüedades bloqueantes
→ aprobar decisiones sensibles
→ validar el resultado
```

## 1.2. Flujo real observado en NIK-9

El flujo real derivó en:

```text
Acceptance v1…v6
→ Technical plan v5…v15
→ múltiples review-plan
→ múltiples reconciliaciones
→ auditorías del artefacto
→ policy exception manual
→ spec
→ primer slice
```

Los reviewers encontraron vulnerabilidades reales, pero también transformaron repetidamente detalles mecánicos en bloqueantes de planificación.

Ejemplos de hallazgos que sí debían bloquear:

- actor administrativo suplantable;
- `service_role` usado como identidad del actor;
- auditoría mutable;
- rollout parcial inseguro;
- rollback que podía reabrir privilegios;
- metadata utilizada como fuente de autorización.

Ejemplos de hallazgos que no debían crear otra versión completa del plan:

- nombre o ubicación final de un script;
- formato exacto de un command manifest;
- lifecycle concreto de un proceso que debía implementarse y probarse en el slice;
- configuración futura de GitHub Rulesets;
- disponibilidad de artifact attestations según el tipo de repositorio;
- detalles de evidencia que podían cerrarse en el PR;
- pines exactos que el slice de infraestructura debía materializar;
- estado `completed` dentro de un archivo que el executor no tenía permitido modificar.

## 1.3. Diagnóstico

El problema no fue “demasiada seguridad”.

El problema fue la ausencia de una distinción formal entre:

```text
Decisión que debe resolverse en el plan
Decisión que debe resolverse en la spec
Decisión que debe resolverse en el slice
Decisión que debe verificarse en el PR
Deuda que debe convertirse en follow-up
Hardening opcional
```

El reviewer tenía una salida prácticamente binaria:

```text
APPROVE
APPROVE_WITH_RISK
REVISE
```

y cualquier `required_fix` podía bloquear la fase completa.

Esto produjo una dinámica donde:

```text
Un finding nuevo
→ nueva versión del plan
→ nuevo review
→ nuevos findings
→ otra versión
```

La metodología adaptada debe romper ese ciclo.

---

# 2. Principios de diseño

## P-01 — Seguridad proporcional al riesgo

Quiver debe aplicar distintos niveles de rigor según el tipo de cambio.

Un ajuste de copy no requiere el mismo workflow que un cambio de autenticación, RLS o facturación.

## P-02 — El artefacto aprobado debe ser inequívoco

Toda aprobación debe estar vinculada a:

- versión;
- ruta;
- digest;
- input digest;
- fecha;
- aprobador;
- cantidad de criterios o elementos relevantes.

## P-03 — El reviewer no reemplaza al accountable humano

El reviewer aporta señal y evidencia.

La decisión final puede ser:

- aprobar;
- aprobar con condiciones;
- rechazar;
- transferir findings a ejecución;
- aceptar un riesgo;
- declarar una excepción de política.

La herramienta debe registrar esa decisión, no impedirla de forma absoluta.

## P-04 — Bloquear únicamente en la fase correcta

Un finding debe bloquear el technical plan solamente cuando pertenece al technical plan.

Un detalle de implementación debe bajar al slice.

Un problema verificable únicamente sobre el código real debe bajar al PR review.

## P-05 — Evitar regeneraciones completas de artefactos largos

Los cambios acotados deben implementarse mediante:

- addendums;
- patches determinísticos;
- amendments estructurados;
- validación de preservación.

## P-06 — Primero validación determinística, luego análisis semántico

Conteos, IDs, referencias, hashes, duplicados, gaps y schemas deben validarse con código.

La IA debe concentrarse en:

- ambigüedad;
- seguridad;
- arquitectura;
- datos;
- rollout;
- decisiones de negocio.

## P-07 — Contrato inmutable y estado mutable separados

`slice.json` describe qué debe hacerse.

El estado de ejecución debe almacenarse en un artefacto separado.

## P-08 — Las capacidades externas se detectan

No asumir que un repositorio o entorno ofrece:

- artifact attestations;
- Docker-in-Docker;
- branch protection;
- un modelo determinado;
- acceso a servicios;
- secretos;
- push desde Codex Cloud.

## P-09 — La deuda heredada no debe confundirse con regresión

Un cambio debe bloquear por vulnerabilidades nuevas.

La deuda ya existente debe registrarse como baseline, salvo que el cambio la agrave.

## P-10 — El objetivo es entregar software

Quiver debe medir el tiempo hasta:

- primer commit;
- primer PR;
- preview;
- merge.

No solamente la cantidad de artefactos producidos.

---

## P-11 — Quiver conoce la metodología; Symphony ejecuta las integraciones

Quiver Core debe saber:

- qué rol cumple cada plataforma;
- qué información es canónica;
- qué estados recibe o produce;
- qué gates deben cumplirse;
- qué manifests debe generar;
- qué capability debe estar disponible;
- quién tiene autoridad sobre cada transición.

Quiver Core no debe:

- guardar tokens;
- manejar OAuth;
- recibir webhooks HTTP;
- ejecutar retries de API;
- mantener workers esperando durante horas;
- promover deployments;
- crear issues directamente.

Estas operaciones pertenecen a **Quiver Symphony** y sus adapters.

La separación conceptual es:

```text
Quiver Core
→ metodología, contratos, políticas, manifests y validación

Quiver Symphony
→ orquestación durable, webhooks, credenciales, retries e idempotencia

Linear / GitHub / Codex Cloud / Vercel
→ ejecución real y estado operativo de cada proveedor
```

## P-12 — Cada dato tiene una fuente de verdad y un único escritor

Quiver debe impedir que múltiples plataformas intenten controlar simultáneamente el mismo estado.

Ejemplo incorrecto:

```text
GitHub mueve el issue a Done
Symphony lo mueve a QA
Linear lo devuelve a In Review
```

Ejemplo correcto:

```text
GitHub
→ informa PR y checks

Vercel
→ informa deployment

Symphony
→ calcula el estado canónico

Linear
→ refleja el estado canónico
```

La metodología debe declarar:

```text
source_of_truth
state_owner
allowed_writers
read_only_integrations
```

## P-13 — Deployment no equivale a release

Un deployment `READY` en Vercel no implica que un release completo esté listo.

Un release puede incluir:

- aplicación web;
- migraciones;
- Edge Functions;
- backend;
- feature flags;
- jobs;
- webhooks;
- configuración;
- validaciones post-release.

Quiver debe modelar un **release compuesto** y no marcar `PRODUCTION_VERIFIED` hasta comprobar todos los componentes requeridos.

## P-14 — High Assurance prueba el mismo artefacto que recibe tráfico

Para cambios de alto riesgo, Quiver debe preferir una estrategia donde:

```text
Production deployment staged
→ smoke tests
→ aprobación
→ promoción del mismo deployment
```

y no asumir que promover una Preview conserva necesariamente el mismo artefacto y las mismas variables.

Esta decisión debe ser configurable porque depende de las capacidades del proveedor, pero el perfil `high-assurance` debe exigir identidad verificable entre artefacto probado y artefacto servido.

# 3. Perfiles de ejecución

## RQ-001 — Perfil `fast-delivery`

### Problema

El mismo workflow de alto rigor aplicado a todos los cambios vuelve lento el desarrollo diario.

### Requerimiento

Quiver debe soportar un perfil de ejecución denominado:

```yaml
profile: fast-delivery
```

Aplicable a:

- copy;
- estilos;
- bugs de bajo riesgo;
- tests;
- refactors mecánicos;
- documentación;
- cambios internos sin migraciones ni permisos.

### Política sugerida

```yaml
profile: fast-delivery

acceptance:
  human_approval: optional
  max_revisions: 1

technical_plan:
  required: true
  detail_level: brief
  max_reviews: 1
  max_full_revisions: 1

spec:
  required: true

execution:
  independent_pr_review: true


skills:
  installation_scope: project

  agents:
    codex:
      enabled: true
    claude_code:
      enabled: true

  core:
    - quiver-workflow
    - quiver-requirement-triage
    - quiver-review-plan
    - quiver-execute-slice
    - quiver-review-pr
    - quiver-recovery

  delivery:
    - quiver-preview-qa
    - quiver-environment-audit
    - quiver-release-safety

  data:
    - quiver-supabase-change-safety

  migration:
    - quiver-platform-migration
    - quiver-base44-independence

  operations:
    - quiver-incident-triage

  knowledge:
    - quiver-decision-memory

  providers:
    - github
    - linear
    - vercel
    - supabase
    - base44
    - sentry
    - notion

release:
  human_merge: true
```

### Resultado esperado

```text
Requirement
→ Acceptance breve
→ Plan breve
→ Spec
→ Code
→ PR
```

### Criterios de aceptación

- Quiver permite seleccionar el perfil por CLI o configuración.
- El perfil define límites de revisión.
- Al superar el presupuesto, Quiver no genera automáticamente otra revisión.
- Quiver devuelve `HUMAN_DECISION_REQUIRED`.
- El perfil no puede utilizarse cuando el cambio incluye categorías prohibidas.

### Categorías que deben forzar `high-assurance`

- auth;
- RLS;
- roles;
- billing;
- secrets;
- migraciones destructivas;
- eliminación de datos;
- infraestructura productiva;
- cambios multi-tenant sensibles.

### ¿Es necesario?

**Sí. Prioridad crítica.**

### Riesgo de sobreingeniería

No crear diez perfiles inicialmente.

MVP:

```text
fast-delivery
high-assurance
```

---

## RQ-002 — Perfil `high-assurance`

### Requerimiento

Quiver debe soportar:

```yaml
profile: high-assurance
```

para cambios sensibles.

### Política sugerida

```yaml
profile: high-assurance

acceptance:
  human_approval: required
  max_revisions: 2

technical_plan:
  human_approval: required
  independent_review: required
  max_reviews: 2
  max_full_revisions: 1
  targeted_amendments_after_limit: true

execution:
  review_each_slice: true
  security_review: true

release:
  human_merge: true
  human_release_approval: true
```

### Flujo

```text
Requirement
→ Acceptance
→ Threat review
→ Technical plan
→ Independent review
→ máximo una revisión completa
→ targeted amendments
→ Human approval
→ Spec
→ Code
→ PR security review
→ Human merge
```

### Criterios de aceptación

- El perfil impide autoaprobar findings Critical/High de seguridad, datos o rollout.
- Los detalles de implementación no consumen una revisión completa del plan.
- El agotamiento del presupuesto exige decisión humana.
- Quiver registra el perfil en todos los artefactos.

### ¿Es necesario?

**Sí.**

---

# 4. Review governance

## RQ-003 — Findings estructurados

### Problema

El reviewer devuelve findings en texto y los marca como required sin indicar en qué fase deben resolverse.

### Requerimiento

Cada finding debe representarse de forma estructurada.

### Schema propuesto

```json
{
  "id": "F-001",
  "title": "Actor administrativo suplantable",
  "summary": "La RPC acepta actor_user_id controlado indirectamente.",
  "severity": "high",
  "category": "security",
  "phase_owner": "technical-plan",
  "phase_blocking": true,
  "evidence": [
    "technical-plan.json#/admin_path/rpc"
  ],
  "acceptance_refs": ["AC-23", "AC-24", "AC-25"],
  "recommended_disposition": "revise-plan",
  "confidence": "high"
}
```

### Valores mínimos

#### `severity`

```text
critical
high
medium
low
info
```

#### `category`

```text
security
data-integrity
rollout
architecture
business-rule
implementation-detail
testing
evidence
operations
tooling
follow-up
optional-hardening
```

#### `phase_owner`

```text
requirement
acceptance
technical-plan
spec
slice
pr-review
release
follow-up
```

#### `recommended_disposition`

```text
revise-requirement
revise-acceptance
revise-plan
transfer-to-spec
transfer-to-slice
transfer-to-pr
create-follow-up
accept-risk
optional
```

### Ejemplos

#### Debe bloquear el plan

```json
{
  "severity": "high",
  "category": "security",
  "phase_owner": "technical-plan",
  "phase_blocking": true,
  "recommended_disposition": "revise-plan",
  "summary": "El rollout permite desplegar el adapter nuevo sobre una DB todavía vulnerable."
}
```

#### No debe bloquear el plan

```json
{
  "severity": "medium",
  "category": "implementation-detail",
  "phase_owner": "slice",
  "phase_blocking": false,
  "recommended_disposition": "transfer-to-slice",
  "summary": "Falta definir el nombre final del script de teardown."
}
```

### Criterios de aceptación

- Todo finding tiene ID estable.
- Todo finding declara severidad y fase responsable.
- Quiver valida los enums.
- Un finding sin `phase_owner` se considera inválido.
- El reviewer no puede marcar `phase_blocking=true` sin justificarlo.
- Los findings pueden transferirse sin perder su ID.

### ¿Es necesario?

**Sí. Es el cambio más importante.**

---

## RQ-004 — Política de bloqueo consciente de fase

### Requerimiento

Quiver debe calcular `blocking` con una policy explícita.

### Regla propuesta

Un technical plan queda bloqueado solamente por findings que cumplan:

```text
phase_owner = technical-plan
AND phase_blocking = true
```

y pertenezcan a una de estas categorías:

```text
security
data-integrity
rollout
architecture crítica
business-rule crítica
```

### Ejemplo de policy

```yaml
review_policy:
  technical_plan:
    blocking_categories:
      - security
      - data-integrity
      - rollout
      - architecture
      - business-rule

    non_blocking_categories:
      - implementation-detail
      - testing
      - evidence
      - operations
      - tooling
      - follow-up
      - optional-hardening
```

### Criterios de aceptación

- El resumen diferencia:
  - plan blockers;
  - transferred findings;
  - follow-ups;
  - optional hardening.
- `required_fixes` no mezcla todas las categorías.
- El output incluye:
  - `plan_required_fixes`;
  - `slice_required_fixes`;
  - `pr_required_fixes`;
  - `follow_ups`.

### ¿Es necesario?

**Sí. Prioridad crítica.**

---

## RQ-005 — Aprobación con condiciones

### Problema

NIK-9 necesitó una excepción humana, pero Quiver no tenía un estado formal para representarla.

### Requerimiento

Agregar una decisión:

```text
approved-with-conditions
```

### CLI propuesto

```bash
quiver ai approve \
  --phase technical-plan \
  --version 15 \
  --decision approved-with-conditions \
  --conditions-file review-disposition.json \
  --reason-file human-decision.md
```

### Registro de ejemplo

```json
{
  "phase": "technical-plan",
  "version": 15,
  "decision": "approved-with-conditions",
  "artifact_sha256": "e45c...",
  "review": {
    "recommendation": "revise",
    "blocking": true,
    "finding_ids": ["F-101", "F-102", "F-103", "F-104"]
  },
  "human_disposition": {
    "plan_blockers": [],
    "transferred_to_slices": {
      "F-101": "slice-01",
      "F-102": "slice-03",
      "F-103": "slice-01",
      "F-104": "slice-04"
    }
  },
  "approved_by": "Fabri Juncal",
  "approved_at": "2026-08-11T..."
}
```

### Reglas

- No debe equivaler a un `--force` sin explicación.
- Debe requerir un archivo de disposición.
- Los findings Critical de seguridad, datos o rollout necesitan un modo separado:
  ```text
  break-glass
  ```
- El output debe dejar visible que el reviewer no aprobó.
- La spec debe heredar las condiciones.

### Criterios de aceptación

- Quiver distingue `approved` de `approved-with-conditions`.
- Los findings transferidos aparecen en los slices destino.
- `spec create` acepta el estado condicionado.
- `check-pr` valida que las condiciones estén resueltas antes del merge.

### ¿Es necesario?

**Sí.**

---

## RQ-006 — Review budget y circuit breaker

### Problema

El proceso puede generar versiones indefinidamente.

### Requerimiento

Cada perfil debe definir un presupuesto.

### Configuración

```yaml
review_budget:
  acceptance:
    max_reviews: 2
    max_full_revisions: 2

  technical_plan:
    max_reviews: 2
    max_full_revisions: 1
    max_targeted_amendments: 3
```

### Al agotar el presupuesto

Quiver debe devolver:

```text
REVIEW_BUDGET_EXHAUSTED
HUMAN_DECISION_REQUIRED
```

y ofrecer:

```text
approve-with-conditions
reject
transfer-findings
create-follow-up
targeted-amendment
```

No debe ejecutar automáticamente:

```text
review → revise → review → revise
```

### Criterios de aceptación

- El contador se persiste por run.
- Los retries por timeout no cuentan como revisión semántica nueva.
- Una revisión externa importada sí cuenta.
- El presupuesto puede ampliarse mediante una decisión humana auditable.
- La ampliación no puede ser silenciosa.

### ¿Es necesario?

**Sí.**

---

## RQ-007 — Transferencia de findings

### Requerimiento

Agregar:

```bash
quiver findings transfer \
  --finding F-002 \
  --to slice-03 \
  --criterion-file criterion.md
```

También debe permitirse una operación por lote:

```bash
quiver findings disposition \
  --file review-disposition.json
```

### Ejemplo

```json
{
  "F-001": {
    "action": "revise-plan"
  },
  "F-002": {
    "action": "transfer-to-slice",
    "target": "slice-03"
  },
  "F-003": {
    "action": "create-follow-up",
    "target_issue": "NIK-11"
  },
  "F-004": {
    "action": "optional"
  }
}
```

### Criterios de aceptación

- El ID del finding se conserva.
- El slice resultante contiene el criterio.
- El PR template muestra findings pendientes.
- Un finding no puede desaparecer sin disposición.
- Quiver genera una matriz de trazabilidad.

### ¿Es necesario?

**Sí.**

---

# 5. Aprobaciones y artefactos

## RQ-008 — Aprobaciones vinculadas a digest

### Requerimiento

Toda aprobación debe persistir:

```json
{
  "phase": "acceptance",
  "version": 6,
  "artifact_path": ".quiver/approvals/acceptance/approved.md",
  "artifact_sha256": "4119ca...",
  "input_path": "requirements/NIK-6-identity-role-hardening.md",
  "input_sha256": "d9cdf4...",
  "criteria_count": 44,
  "approved_by": "Fabri Juncal",
  "approved_at": "2026-07-30T..."
}
```

### Validaciones

Antes de usar una aprobación:

- recalcular artifact digest;
- recalcular input digest;
- comparar versión;
- comparar criteria count;
- confirmar que no quedó stale.

### CLI

```bash
quiver ai approval show --phase acceptance
quiver ai approval verify --phase acceptance
quiver ai approval export --format linear-comment
```

### Salida para Linear

```text
ACCEPTANCE_APPROVED:v6
artifact_sha256=4119ca...
requirement_sha256=d9cdf4...
criteria_count=44
```

### ¿Es necesario?

**Sí. Bajo costo y alto valor.**

---

## RQ-009 — Detección de representación divergente

### Problema

Una salida humana puede mostrar un número o contenido distinto del artefacto guardado.

### Requerimiento

Después de generar un artefacto, Quiver debe producir:

```json
{
  "artifact_version": 6,
  "artifact_sha256": "...",
  "criteria_count": 44,
  "rendered_summary_criteria_count": 44,
  "representation_match": true
}
```

Si no coincide:

```text
REPRESENTATION_MISMATCH
```

### Criterios de aceptación

- Quiver no permite aprobar mientras exista mismatch.
- El resumen debe derivarse del artefacto guardado, no del output libre del provider.
- El provider output crudo se conserva como evidencia, pero no es contractual.

### ¿Es necesario?

**Sí.**

---

# 6. Lifecycle de drafts

## RQ-010 — Estados explícitos de drafts

### Requerimiento

Cada draft debe tener:

```text
draft
current
reviewed
approved
approved-with-conditions
rejected
superseded
corrupted
```

### Metadata propuesta

```json
{
  "version": 13,
  "status": "rejected",
  "artifact_sha256": "...",
  "parent_version": 12,
  "reason": "content-loss",
  "created_at": "...",
  "updated_at": "..."
}
```

### Criterios de aceptación

- Una versión rechazada no se considera current.
- Una versión corrupta no invalida automáticamente una anterior válida.
- El historial no se elimina.
- Quiver muestra la lineage.

### ¿Es necesario?

**Sí.**

---

## RQ-011 — Seleccionar, revisar y aprobar una versión anterior

### CLI

```bash
quiver ai draft list --phase technical-plan

quiver ai draft select \
  --phase technical-plan \
  --version 12

quiver ai draft reject \
  --phase technical-plan \
  --version 13 \
  --reason-file content-loss.md

quiver ai review-plan \
  --version 12

quiver ai approve \
  --phase technical-plan \
  --version 12
```

### Condiciones de elegibilidad

Una versión anterior puede seleccionarse solamente cuando:

- su input digest sigue vigente;
- su acceptance digest sigue vigente;
- no está `corrupted`;
- tiene un review compatible o se ejecuta uno nuevo;
- la decisión humana está registrada.

### ¿Es necesario?

**Sí.**

### Riesgo

Aprobar un artefacto viejo con requerimiento cambiado.

Mitigación: digest verification.

---

## RQ-012 — Rollback del draft actual

### Requerimiento

Agregar:

```bash
quiver ai draft rollback \
  --phase technical-plan \
  --to-version 12 \
  --reason-file reason.md
```

No borra v13.

Solo cambia:

```text
current_version
```

### Criterios de aceptación

- La operación es reversible.
- Registra actor y timestamp.
- No altera el contenido.
- Recalcula staleness.

### ¿Es necesario?

**Sí, aunque puede implementarse junto con RQ-011.**

---

# 7. Amendments y preservación

## RQ-013 — Addendums como artefactos de primera clase

### Problema

Para agregar dos decisiones se regeneró un plan enorme.

### Requerimiento

Quiver debe soportar:

```bash
quiver ai addendum create \
  --phase technical-plan \
  --base-version 12 \
  --input execution-addendum.md
```

### Resultado

```json
{
  "base_artifact": {
    "version": 12,
    "sha256": "..."
  },
  "addendum": {
    "version": 1,
    "sha256": "..."
  },
  "effective_contract_sha256": "..."
}
```

### Regla

La spec puede referenciar:

```text
technical-plan v12
+
execution-addendum v1
```

sin crear v13.

### Criterios de aceptación

- El addendum indica qué secciones modifica o complementa.
- No puede contradecir acceptance sin marcar staleness.
- El effective contract tiene digest.
- Los validators consumen base + addendum.

### ¿Es necesario?

**Sí. MVP recomendado antes que un motor complejo de patches.**

---

## RQ-014 — Amendments determinísticos

### Requerimiento avanzado

Agregar:

```bash
quiver ai amend \
  --phase technical-plan \
  --base-version 12 \
  --patch plan.patch.json \
  --mode deterministic
```

### Patch de ejemplo

```json
[
  {
    "op": "add",
    "path": "/rollout/admin_path_activation",
    "value": {
      "default": "disabled",
      "activation_gate": "NIK-9 security gates"
    }
  }
]
```

### Salidas

- nuevo artefacto;
- JSON pointers modificados;
- preservation report;
- hashes;
- fields added/removed;
- content-loss result.

### Criterios de aceptación

- Si aparece una diferencia fuera de la allowlist:
  ```text
  PRESERVATION_FAILED
  ```
- El artefacto base queda intacto.
- No se utiliza un provider generativo para serializar el plan completo.
- El nuevo artefacto es autosuficiente.

### ¿Es necesario?

**Sí, pero después de implementar addendums.**

---

## RQ-015 — Detección automática de content loss

### Requerimiento

Después de `ai revise`, Quiver debe comparar parent y child.

### Invariantes configurables

```yaml
preservation:
  required_collections:
    - acceptance_coverage
    - slices
    - command_manifest
    - evidence_paths
    - allowed_files
    - rollback
    - non_goals

  minimum_ratio:
    commands: 1.0
    acceptance_criteria: 1.0
    slices: 1.0

  forbidden:
    - base_manifest_reference
    - same_as_previous
```

### Señales de riesgo

- reducción de tamaño > umbral;
- pérdida de IDs;
- pérdida de arrays;
- campos obligatorios ausentes;
- referencias a la versión anterior para completar el nuevo artefacto;
- resumen en lugar de contrato.

### Resultado

```text
CONTENT_LOSS_DETECTED
DRAFT_MARKED_CORRUPTED
```

### ¿Es necesario?

**Sí.**

---

# 8. Elaboración progresiva

## RQ-016 — Niveles de detalle por fase

### Technical plan debe definir

- decisiones de arquitectura;
- invariantes de seguridad;
- cambios de datos;
- rollout;
- rollback;
- componentes afectados;
- slices;
- dependencias;
- non-goals.

### Spec debe definir

- resultados por slice;
- dependencia;
- risk;
- criterios;
- evidence categories;
- high-level allowed files.

### Slice debe definir

- allowed write paths exactos;
- comandos;
- timeout;
- environment;
- tests;
- evidence paths;
- branch;
- PR contract.

### PR debe demostrar

- diff real;
- tests reales;
- checks reales;
- riesgos reales;
- findings transferidos resueltos.

### Criterios de aceptación

- Quiver valida que el technical plan no incluya campos que pertenecen obligatoriamente a un slice, salvo perfil `high-assurance`.
- Los detalles pueden materializarse progresivamente.
- La spec no necesita simular todos los comandos futuros.

### ¿Es necesario?

**Sí.**

---

## RQ-017 — Presupuesto de complejidad del artefacto

### Requerimiento

Quiver debe emitir warnings cuando un artefacto supera:

- tamaño;
- cantidad de secciones;
- cantidad de commands;
- cantidad de tokens;
- profundidad de nesting.

### Ejemplo

```text
TECHNICAL_PLAN_COMPLEXITY_WARNING

Size: 161 KB
Commands: 57
Recommendation:
Move executable details to slice-01 manifest.
```

### Importante

No debe ser un hard cap universal.

### ¿Es necesario?

**Sí como warning, no como bloqueo inicial.**

---

# 9. Validación determinística

## RQ-018 — Pipeline previo al reviewer IA

### Orden obligatorio

```text
1. Schema validation
2. Digest validation
3. Reference validation
4. Coverage validation
5. Dependency graph validation
6. Scope validation
7. Preservation validation
8. AI semantic review
```

### Resultado

Si falla una validación determinística:

```text
AI_REVIEW_NOT_STARTED
```

### Justificación

No usar tokens de un modelo para detectar:

- ID duplicado;
- path inexistente;
- hash distinto;
- criteria count incorrecto;
- command reference rota.

### ¿Es necesario?

**Sí.**

---

## RQ-019 — Reviewer semántico acotado

### Requerimiento

El prompt del reviewer debe recibir:

- artefacto;
- requirement;
- acceptance;
- results de validators;
- risk profile;
- blocking policy;
- review budget.

No debe volver a revisar:

- conteos ya validados;
- hashes ya validados;
- referencias ya validadas.

### Criterios de aceptación

- El output referencia findings estructurados.
- La policy controla qué puede declararse bloqueante.
- El reviewer debe justificar findings nuevos.
- El reviewer no puede cambiar el scope de revisión sin declararlo.

### ¿Es necesario?

**Sí.**

---

# 10. Slice contract y estado

## RQ-020 — Separar contrato de estado

### Problema

`slice.json` era inmutable para el executor, pero `check-pr` necesitaba modificar su status.

### Requerimiento

Mantener:

```text
specs/<spec>/slices/<slice>/slice.json
```

como contrato.

Crear:

```text
.quiver/state/<spec>/<slice>.json
```

como estado mutable.

### Ejemplo

```json
{
  "slice_id": "slice-01-verification-foundation",
  "status": "implemented",
  "branch": "feature/NIK-9-slice-01-verification-foundation",
  "head_sha": "ae2d3a...",
  "pr_number": 10,
  "checks": {
    "cloud": "passed",
    "github_actions": "passed",
    "review": "pending"
  },
  "updated_at": "..."
}
```

### CLI

```bash
quiver slice transition \
  slice-01-verification-foundation \
  --to implemented

quiver slice transition \
  slice-01-verification-foundation \
  --to pr-ready

quiver slice transition \
  slice-01-verification-foundation \
  --to completed
```

### Transiciones

```text
draft
→ ready
→ implementing
→ implemented
→ pr-open
→ review-passed
→ completed
```

### Criterios de aceptación

- El executor no necesita modificar el contrato.
- Cada transición valida evidencia.
- `check-pr` consulta state, no `slice.json.status`.
- El estado registra actor y timestamp.
- Mantener compatibilidad con specs antiguas.

### ¿Es necesario?

**Sí. Prioridad alta.**

---

## RQ-021 — Governance transition separada

### Requerimiento

Una transición que excede los permisos del executor debe quedar como:

```text
GOVERNANCE_PENDING
```

No como fallo de implementación.

### Ejemplo

```text
Implementation: PASS
PR checks: PASS
Slice contract update: not permitted
Governance: pending human transition
```

### ¿Es necesario?

**Sí.**

---

# 11. Reviews externos y Cloud

## RQ-022 — Importar review externo

### CLI

```bash
quiver ai review import \
  --phase technical-plan \
  --version 15 \
  --file codex-cloud-review.json \
  --provider codex-cloud \
  --source-sha 4065e4...
```

### Registro

```json
{
  "provider": "codex-cloud",
  "source_commit_sha": "...",
  "artifact_sha256": "...",
  "review_sha256": "...",
  "imported_by": "...",
  "imported_at": "..."
}
```

### Validaciones

- El review debe referenciar el mismo artifact digest.
- El snapshot SHA debe existir.
- El review debe cumplir el schema.
- No debe poder importar un review de otro plan.

### ¿Es necesario?

**Sí para Symphony, pero posterior a governance y drafts.**

---

## RQ-023 — Target-aware execution bundle

### CLI

```bash
quiver execution bundle \
  --spec nik-9-identity-role-hardening \
  --slice slice-01-verification-foundation \
  --target codex-cloud
```

### Salida esperada

```text
bundle/
├── prompt.md
├── allowed-files.json
├── cloud-commands.json
├── github-actions-commands.json
├── blockers.json
└── context-manifest.json
```

### Target capabilities

```yaml
targets:
  codex-cloud:
    docker: false
    supabase_local: false
    write_repository: true
    create_pr: true

  github-actions:
    docker: true
    supabase_local: true
    write_repository: false
```

### ¿Es necesario?

**Sí, pero no debe incluir dispatch directo en Quiver core.**

Quiver produce el bundle.

Symphony lo ejecuta.

---

## RQ-024 — Timeout y retry policy

### Problema

Un review de v15 terminó por timeout sin persistir resultado.

### Requerimiento

Configurar:

```yaml
providers:
  codex:
    timeout_ms: 1200000
    max_retries: 1
    retry_on:
      - timeout
      - transient_network
```

### Regla

Un retry técnico:

- no incrementa la versión;
- no consume review budget semántico;
- debe revisar el mismo digest;
- debe quedar registrado.

### Estados

```text
PROVIDER_TIMEOUT
RETRYING_SAME_REVIEW
REVIEW_ENGINE_EXHAUSTED
```

### ¿Es necesario?

**Sí.**

---

# 12. Capabilities y evidence

## RQ-025 — Capability discovery

### Requerimiento

Antes de generar un workflow, Quiver debe evaluar capacidades.

### Ejemplo

```json
{
  "github": {
    "artifact_attestations": {
      "available": false,
      "reason": "user-owned-private-repository"
    },
    "artifact_upload": {
      "available": true
    }
  }
}
```

### Policy

```yaml
evidence:
  preferred:
    - native-attestation

  fallbacks:
    - artifact-digest-record

  require_fail_closed: true
```

### Diferencia obligatoria

```text
CAPABILITY_UNAVAILABLE
```

no es igual a:

```text
EVIDENCE_INTEGRITY_FAILURE
```

### ¿Es necesario?

**Sí. Prioridad media-alta.**

---

## RQ-026 — Evidence provider interface

### Interface conceptual

```ts
interface EvidenceProvider {
  detectCapability(context): CapabilityResult;
  publish(evidence): PublishResult;
  verify(record): VerifyResult;
}
```

### Providers iniciales

- GitHub native attestation.
- GitHub artifact digest fallback.
- Local evidence bundle.
- Control Plane attestation futura.

### ¿Es necesario?

**Sí, pero después del MVP de capability discovery.**

---

# 13. Seguridad baseline/delta

## RQ-027 — Vulnerability delta

### Requerimiento

Quiver debe consumir reportes y distinguir:

```text
INHERITED_BASELINE_SECURITY_DEBT
NEW_SECURITY_REGRESSION
```

### Reporte normalizado

```json
{
  "base": {
    "critical": 0,
    "high": 12
  },
  "head": {
    "critical": 0,
    "high": 12
  },
  "delta": {
    "new_critical": 0,
    "new_high": 0
  }
}
```

### Policy

```yaml
security_delta:
  block_new_critical: true
  block_new_high: true
  block_inherited: false
  create_follow_up_for_inherited: true
```

### Reglas

- No ejecutar `npm audit fix` automáticamente.
- No ampliar scope para deuda heredada.
- Si el cambio empeora un finding heredado, se considera nuevo.
- Si el registry no responde:
  ```text
  AUDIT_SOURCE_UNAVAILABLE
  ```
  y se aplica la política configurada.

### ¿Es necesario?

**Útil y recomendable, pero puede implementarse después de governance.**

---

# 14. Doctor y scope

## RQ-028 — Doctor con scope

### CLI

```bash
quiver doctor --scope current-run

quiver doctor --scope spec:nik-9-identity-role-hardening

quiver doctor --scope repository
```

### Reglas

- `current-run` no bloquea por deuda de otras specs.
- `spec` analiza solo dependencias relevantes.
- `repository` conserva el diagnóstico global.

### Output

```text
CURRENT_SCOPE: PASS
REPOSITORY_HEALTH: WARN
UNRELATED_DEBT:
- specs/tb-supa-foundation/STATUS.md
```

### ¿Es necesario?

**Probablemente sí, pero debe confirmarse con NIK-10 y NIK-11.**

---

# 15. Spec creation con condiciones

## RQ-029 — Spec desde plan condicionado

### Requerimiento

`spec create` debe aceptar:

```text
approved
approved-with-conditions
```

### Spec metadata

```yaml
planning_governance:
  decision: approved-with-conditions
  artifact_version: 15
  artifact_sha256: e45c...
  review_recommendation: revise
  transferred_findings:
    - F-101
    - F-102
```

### Reglas

- Cada finding transferido debe tener destino.
- La spec no puede omitir findings.
- `check-slice` verifica que el finding esté materializado.
- `check-pr` verifica que se haya cerrado o aceptado.

### ¿Es necesario?

**Sí.**

---

# 16. Métricas y observabilidad del proceso

## RQ-030 — Métricas mínimas

Quiver debe registrar:

```text
time_to_acceptance
time_to_plan
time_to_spec
time_to_first_commit
time_to_first_pr
acceptance_versions
plan_versions
plan_reviews
provider_timeouts
content_loss_incidents
policy_exceptions
findings_transferred
findings_reopened
manual_prompts
token_usage_if_available
```

### Alertas

```text
plan_versions > configured limit
→ REVIEW_BUDGET_EXHAUSTED

content_loss_incidents > 0
→ PROVIDER_OUTPUT_UNTRUSTED

time_to_first_commit > profile target
→ DELIVERY_DELAY_WARNING
```

### Objetivos iniciales

| Métrica | Fast Delivery | High Assurance |
|---|---:|---:|
| Tiempo hasta código | < 1 hora | < 4 horas |
| Reviews del plan | 1 | máximo 2 |
| Versiones completas | máximo 2 | máximo 3 |
| Aprobaciones con digest | 100% | 100% |
| Findings transferidos | >80% | >80% |

### ¿Es necesario?

**Sí, al menos en forma básica.**

---

# 17. Compatibilidad y migración

## RQ-031 — Compatibilidad con specs existentes

### Requerimiento

Quiver debe mantener compatibilidad con:

- approvals sin digest;
- `slice.json.status`;
- reviews sin finding IDs;
- technical plans no estructurados;
- specs existentes.

### Estrategia

#### Lectura

- Si existe `state.json`, usarlo.
- Si no existe, leer `slice.json.status`.
- Si una aprobación no tiene digest, marcar:
  ```text
  LEGACY_UNBOUND_APPROVAL
  ```

#### Migración

```bash
quiver migrate governance-v2
```

Debe:

- generar digests;
- crear draft states;
- crear slice state;
- no alterar contenido histórico;
- producir reporte.

### ¿Es necesario?

**Sí.**

---

# 18. Metodología consciente de Linear, GitHub, Codex Cloud y Vercel

## 18.1. Decisión arquitectónica

Quiver debe conocer metodológicamente cómo se trabaja con estas plataformas, aunque no ejecute directamente sus APIs desde el core.

```text
QUIVER CORE
Metodología, contratos, políticas, manifests y estado canónico
        ↓
QUIVER SYMPHONY
Orquestación durable, adapters, webhooks, credenciales, retries e idempotencia
        ↓
LINEAR / GITHUB / CODEX CLOUD / VERCEL
Ejecución real
```

### En alcance de Quiver Core

- Roles metodológicos de las plataformas.
- Fuentes de verdad.
- Estado canónico.
- State mappings.
- Issue granularity.
- Branching y PR policy.
- Execution bundles.
- Deployment modes.
- QA manifests.
- Release manifests.
- Environment data policies.
- Capability requirements.
- Provider intents.
- Validación de configuración.
- Trazabilidad de decisiones.

### Fuera de alcance de Quiver Core

- OAuth.
- Tokens.
- Secret storage.
- Firmas de webhooks.
- Endpoints HTTP.
- Retries de APIs.
- Workers durables.
- Creación real de issues.
- Push real de ramas.
- Creación real de deployments.
- Promoción real.
- Rollback real.
- Idempotencia de deliveries.

Estas responsabilidades pertenecen a Quiver Symphony.

## 18.2. Matriz de fuentes de verdad

| Información | Fuente de verdad | Escritor principal | Consumidores |
|---|---|---|---|
| Requerimiento comprometido | Linear | Humano / Symphony | Quiver, Codex |
| Prioridad, owner y riesgo operativo | Linear | Humano / Symphony | Quiver |
| Acceptance, plan, spec y slices | Quiver + repositorio | Quiver | Linear, Codex, GitHub |
| Estado durable del workflow | Symphony | Symphony | Linear, Quiver UI |
| Código, commits y PR | GitHub | Executor / GitHub | Quiver, Linear, Vercel |
| Checks y merge SHA | GitHub | GitHub Actions / humano | Symphony, Quiver |
| Ejecución del agente | Codex Cloud | Codex | GitHub, Symphony |
| Deployment ID, URL y estado | Vercel | Vercel | Symphony, Linear, Quiver |
| QA y release decision | Quiver/Symphony | QA agent / humano | Linear, GitHub, Vercel |
| Decisiones estratégicas duraderas | Notion, fuera de este alcance | Humano / Decision Agent | Portfolio |

### Regla

Una plataforma puede reflejar información de otra, pero no convertirse silenciosamente en un segundo escritor del mismo dato.

## 18.3. Estado canónico del workflow

Quiver debe definir estados semánticos independientes de los nombres particulares de Linear, GitHub o Vercel.

```text
INTAKE
NEEDS_CONTEXT
ACCEPTANCE_REVIEW
PLAN_REVIEW
SPEC_READY
READY_FOR_EXECUTION
IMPLEMENTING
PR_OPEN
PREVIEW_PENDING
PREVIEW_READY
QA_IN_PROGRESS
QA_FAILED
READY_FOR_RELEASE
RELEASE_STAGED
RELEASE_APPROVAL
RELEASING
VERIFYING
DONE
BLOCKED
FAILED
ROLLED_BACK
CANCELED
```

### Transiciones principales

```text
INTAKE
→ NEEDS_CONTEXT | ACCEPTANCE_REVIEW

ACCEPTANCE_REVIEW
→ PLAN_REVIEW | NEEDS_CONTEXT | CANCELED

PLAN_REVIEW
→ SPEC_READY | NEEDS_CONTEXT | CANCELED

SPEC_READY
→ READY_FOR_EXECUTION

READY_FOR_EXECUTION
→ IMPLEMENTING

IMPLEMENTING
→ PR_OPEN | BLOCKED

PR_OPEN
→ PREVIEW_PENDING | QA_IN_PROGRESS | BLOCKED

PREVIEW_PENDING
→ PREVIEW_READY | BLOCKED

PREVIEW_READY
→ QA_IN_PROGRESS

QA_IN_PROGRESS
→ READY_FOR_RELEASE | QA_FAILED

READY_FOR_RELEASE
→ RELEASE_STAGED | RELEASING

RELEASE_STAGED
→ RELEASE_APPROVAL | BLOCKED

RELEASE_APPROVAL
→ RELEASING | CANCELED

RELEASING
→ VERIFYING | ROLLED_BACK | FAILED

VERIFYING
→ DONE | ROLLED_BACK | FAILED
```

El mapping con estados externos debe ser configurable.

---

## RQ-032 — Platform Role Registry

### Problema

Sin un registro explícito, cada adapter puede interpretar de forma diferente para qué sirve Linear, GitHub, Codex Cloud o Vercel.

### Requerimiento

Quiver debe permitir declarar:

```yaml
platform_roles:
  linear:
    role: work-and-human-decisions

  github:
    role: code-and-verification

  codex-cloud:
    role: execution-and-review

  vercel:
    role: deployment-and-environment-validation

  quiver-symphony:
    role: workflow-orchestration
```

### Responsabilidades mínimas

#### Linear

- Requerimientos.
- Prioridad.
- Owner.
- Riesgo.
- Aprobaciones humanas.
- Estado visible.
- Links a artefactos.

#### GitHub

- Código.
- Branches.
- Commits.
- PRs.
- Checks.
- Review del diff.
- Merge.
- Release SHA.

#### Codex Cloud

- Implementación acotada.
- Revisión independiente.
- Ejecución de comandos compatibles.
- Propuesta de PR.
- Nunca fuente contractual.

#### Vercel

- Deployment.
- URL.
- Environment.
- Logs y estado.
- Promoción y rollback de la aplicación web.
- Nunca fuente única del release compuesto.

### Justificación

Impide que Symphony invente la metodología dentro de cada adapter.

### ¿Es necesario?

**Sí, antes de construir integraciones reales.**

### Riesgo de sobreingeniería

No modelar cada feature del proveedor. Solo su rol y responsabilidades contractuales.

### Criterios de aceptación

1. Todo proveedor configurado tiene un rol válido.
2. Los roles incompatibles producen error.
3. Quiver puede exportar el registry en JSON.
4. Symphony puede consumirlo sin interpretar texto libre.

---

## RQ-033 — Canonical Workflow State Model

### Problema

Los estados de Linear no son universales y no deben convertirse en el modelo interno del workflow.

### Requerimiento

Quiver debe implementar el modelo canónico de la sección 18.3 y mappings configurables.

```yaml
platforms:
  linear:
    state_mapping:
      INTAKE: Triage
      NEEDS_CONTEXT: Needs input
      ACCEPTANCE_REVIEW: Acceptance review
      PLAN_REVIEW: Plan review
      SPEC_READY: Ready
      IMPLEMENTING: In Progress
      PR_OPEN: In Review
      PREVIEW_READY: QA
      READY_FOR_RELEASE: Ready for release
      DONE: Done
      BLOCKED: Blocked
```

### Justificación

Permite cambiar de workspace o herramienta sin cambiar la metodología.

### ¿Es necesario?

**Sí.**

### Criterios de aceptación

1. Los mappings se validan.
2. Un estado externo desconocido no cambia el estado canónico silenciosamente.
3. Toda transición registra causa y actor.
4. El estado canónico puede exportarse con `--json`.

---

## RQ-034 — Source of Truth and Single Writer Policy

### Problema

Linear, GitHub y Symphony pueden competir por actualizar estados.

### Requerimiento

Cada propiedad sincronizable debe declarar:

```yaml
ownership:
  workflow_state:
    source_of_truth: quiver-symphony
    writers:
      - quiver-symphony
    mirrors:
      - linear

  pull_request:
    source_of_truth: github
    writers:
      - github

  deployment:
    source_of_truth: vercel
    writers:
      - vercel
```

### Justificación

Evita loops y estados contradictorios.

### Alternativa considerada

Permitir sincronización bidireccional general.

### Crítica

La sincronización bidireccional de estados es atractiva, pero difícil de razonar. Para el MVP, un único writer por propiedad es más seguro.

### Criterios de aceptación

1. Quiver detecta dos writers configurados para la misma propiedad.
2. Las integraciones nativas pueden operar como `mirror`.
3. Symphony conoce qué evento puede producir una transición.
4. Toda resolución de conflicto queda auditada.

---

## RQ-035 — Linear Work Item Methodology

### Problema

Crear un issue por cada artefacto genera ruido; crear uno solo para todo impide distribuir el trabajo.

### Requerimiento

Modo recomendado:

```yaml
linear:
  issue_granularity: root-and-executable-slices
```

### Regla

Crear un subissue cuando el slice tiene al menos uno:

- Branch independiente.
- PR independiente.
- Owner independiente.
- Dependencia explícita.
- Resultado verificable separado.
- Aprobación separada.

No crear por defecto un issue para:

- Cada versión de acceptance.
- Cada review.
- Cada validator.
- Cada archivo.
- Cada slice puramente documental sin resultado independiente.

### Ejemplo

```text
NIK-200 — Importación CSV
├── NIK-201 — Backend
├── NIK-202 — UI
└── NIK-203 — QA/evidence
```

### Estado

Linear refleja el estado canónico, pero Symphony es writer.

### Integración nativa GitHub

Configuración inicial recomendada:

```yaml
linear:
  native_github:
    link_prs: true
    show_diffs: true
    status_automation: false
```

### Justificación

Se aprovecha el vínculo nativo sin introducir conflictos de estado.

### ¿Es necesario?

**Sí metodológicamente. La creación real corresponde a Symphony.**

### Criterios de aceptación

1. Quiver produce un `work-item-manifest`.
2. Los slices documentales pueden omitirse según policy.
3. Los IDs de Linear pueden vincularse a branch/PR.
4. No se duplican issues por reintentos.

---

## RQ-036 — Linear Approval and Attachment Contract

### Problema

Un comentario `PLAN_APPROVED:v15` no identifica qué contenido se aprobó.

### Requerimiento

Las aprobaciones visibles en Linear deben contener:

```text
decision
artifact_version
artifact_sha256
input_sha256
approved_by
approved_at
```

### Manifest

```json
{
  "approval_type": "technical-plan",
  "decision": "approved-with-conditions",
  "artifact_version": 15,
  "artifact_sha256": "e45c...",
  "approved_by": "Fabri Juncal"
}
```

### Attachments recomendados

- PR.
- Preview.
- QA report.
- Release.
- Rollback.

No adjuntar como comentario completo:

- Technical plan de cientos de KB.
- Manifests extensos.
- Logs crudos.

### Justificación

Linear es la interfaz humana; el repositorio es la fuente contractual.

### Criterios de aceptación

1. Quiver genera el bloque de aprobación.
2. Symphony valida el digest antes de registrar la decisión.
3. Una aprobación stale no avanza.
4. Los links se deduplican mediante idempotency key.

---

## RQ-037 — GitHub Delivery Methodology

### Requerimiento

Configuración por defecto:

```yaml
github:
  branching:
    strategy: branch-per-executable-slice
    base_branch: develop

  pull_requests:
    one_per_slice: true
    initial_state: draft

  lineage:
    dependency_sha_required: true
    tested_sha_required: true
    pr_head_must_match_tested_sha: true

  merge:
    authority: human
```

### Reglas

- Un PR corresponde a un resultado ejecutable.
- El HEAD probado debe ser el HEAD revisado.
- Los checks pertenecen al commit.
- No declarar branch protection como activa sin detectarla.
- El merge SHA se convierte en dependencia del siguiente slice secuencial.

### Estado de contrato

```text
slice.json
→ inmutable

.quiver/state/<spec>/<slice>.json
→ mutable
```

### Justificación

GitHub demuestra el cambio real. Quiver no debe reemplazarlo.

### ¿Es necesario?

**Sí.**

### Criterios de aceptación

1. Quiver genera branch y PR contracts.
2. El lineage gate falla ante SHA diferente.
3. `check-pr` distingue check producido de check requerido por ruleset.
4. Human merge gate queda explícito cuando no hay enforcement automático.

---

## RQ-038 — Codex Cloud Execution Methodology

### Problema

Un task Cloud puede implementar, revisar o fallar operativamente; Quiver debe distinguir esos roles y resultados.

### Roles permitidos

```text
PLANNER
PLAN_REVIEWER
EXECUTOR
PR_REVIEWER
QA_REVIEWER
```

### Regla de independencia

No permitir que el mismo run sea:

```text
planner + executor + approver
```

en cambios `high-assurance`.

### Execution bundle

```text
prompt.md
canonical-inputs.json
allowed-write-paths.json
cloud-commands.json
delegated-commands.json
blockers.json
output-contract.json
```

### Capacidades

```yaml
codex_cloud:
  production_access: false
  docker: false-or-unknown
  repository_write: true
  pull_request: true
  secrets: restricted
```

### Identidad del snapshot

Validar con:

```text
HEAD SHA
+ ancestry
+ artifact digests
+ worktree limpio
```

No bloquear por el nombre interno `work`.

### Fallos operativos

```text
IMPLEMENTATION_FAILED
PUSH_FAILED
NETWORK_BLOCKED
PROVIDER_TIMEOUT
CAPABILITY_UNAVAILABLE
SCOPE_VIOLATION
```

### Justificación

Un push bloqueado por proxy no significa que la implementación sea incorrecta.

### ¿Es necesario?

**Sí.**

### Criterios de aceptación

1. Cada task tiene un rol.
2. Cada target recibe solo comandos compatibles.
3. Los comandos Docker quedan delegados.
4. Un commit local no publicado puede reanudarse mediante un flujo explícito.
5. La salida Cloud es importable o verificable.

---

## RQ-039 — Vercel Environment Model

### Problema

“Development”, “test”, “staging” y “preview” suelen usarse de forma ambigua.

### Requerimiento

Quiver debe usar un modelo canónico:

```text
LOCAL
PR_PREVIEW
SHARED_STAGING
PRODUCTION_STAGED
PRODUCTION_CURRENT
EXTERNAL
```

### Mapping conceptual con Vercel

```text
LOCAL
→ Vercel Development / entorno local

PR_PREVIEW
→ Vercel Preview por commit o branch

SHARED_STAGING
→ Preview estable de develop o Custom Environment staging/QA

PRODUCTION_STAGED
→ Production deployment sin dominio actual

PRODUCTION_CURRENT
→ Production deployment que recibe tráfico
```

### Regla

No modelar `Development` de Vercel como un servidor remoto persistente por defecto.

### Justificación

Evita una configuración incorrecta de ambientes.

### ¿Es necesario?

**Sí cuando el proyecto usa Vercel.**

### Criterios de aceptación

1. Los ambientes canónicos se mapean al proveedor.
2. Custom Environment es capability, no supuesto.
3. La configuración declara si staging es branch preview o custom environment.
4. Quiver puede operar con `external` cuando otro sistema despliega.

---

## RQ-040 — Deployment Strategy Policy

### Modos oficiales

```text
disabled
preview-only
preview-and-staging
auto-production
staged-production
external-production
```

### `preview-only`

```yaml
deployment:
  mode: preview-only
  preview:
    trigger: pull-request
    required_for_pr: true
  production:
    managed_externally: true
```

Recomendado como primer MVP.

### `preview-and-staging`

```yaml
deployment:
  mode: preview-and-staging
  preview:
    trigger: pull-request
  staging:
    trigger: branch
    branch: develop
    stable_url: true
```

Recomendado cuando QA necesita integración estable.

### `auto-production`

```yaml
deployment:
  mode: auto-production
  production:
    branch: main
    approval: automatic-after-checks
```

Permitido solo para:

- `fast-delivery`;
- riesgo bajo;
- rollback simple;
- sin migraciones sensibles.

### `staged-production`

```yaml
deployment:
  mode: staged-production
  production:
    branch: main
    auto_assign_domains: false
    approval: human
    smoke_required: true
    rollback_required: true
```

Recomendado para `high-assurance`.

### `external-production`

Quiver genera release intent y evidencia, pero otro sistema ejecuta producción.

### Justificación

Una única bandera `vercel=true` no expresa el riesgo ni el proceso de release.

### Criterios de aceptación

1. El perfil valida modos permitidos.
2. `high-assurance + auto-production` requiere excepción explícita.
3. Preview y producción pueden habilitarse por separado.
4. El modo queda registrado en la spec y release manifest.

---

## RQ-041 — PR Preview Contract

### Requerimiento

Cuando `preview.required_for_pr=true`, Quiver debe exigir:

```text
PR HEAD SHA
=
deployment source SHA
=
QA source SHA
```

### Deployment manifest

```json
{
  "provider": "vercel",
  "environment": "PR_PREVIEW",
  "source_commit_sha": "abc123",
  "required": true,
  "data_profile": "qa",
  "production_credentials_allowed": false
}
```

### URL

Preferir para QA:

- URL específica del commit.

La URL de branch puede mostrarse como conveniencia, pero no es suficiente para aprobar un commit específico.

### Gate

```text
PREVIEW_READY
```

requiere:

- deployment exitoso;
- commit correcto;
- URL disponible;
- environment correcto;
- policy de datos válida.

### Justificación

Evita aprobar una Preview que ya fue reemplazada por otro commit.

### ¿Es necesario?

**Sí para preview-driven QA.**

---

## RQ-042 — Shared Staging Contract

### Problema

Las Preview por PR prueban aislamiento, pero no siempre prueban la integración de múltiples cambios.

### Requerimiento

Quiver debe permitir:

```yaml
staging:
  enabled: true
  strategy: branch-preview
  branch: develop
  data_profile: qa
```

o:

```yaml
staging:
  enabled: true
  strategy: custom-environment
  environment: staging
  branch: develop
```

### Cuándo usarlo

- QA necesita una URL estable.
- Varias features deben probarse juntas.
- Existe backend QA.
- Se necesitan regresiones integradas.

### Cuándo no

- Proyecto pequeño.
- Preview por PR suficiente.
- No existe backend QA.
- El costo operacional supera el beneficio.

### Regla

Staging no reemplaza el PR Preview.

### Justificación

Aislamiento e integración resuelven problemas distintos.

### ¿Es necesario?

**Configurable, no obligatorio para todos los proyectos.**

---

## RQ-043 — Production Release Strategy

### Requerimiento

Para `high-assurance`, la estrategia recomendada debe ser:

```text
Merge a main
→ Production deployment staged
→ smoke y checks
→ RELEASE_APPROVED
→ promover el mismo deployment
→ production smoke
```

### Preview promotion

Quiver debe registrar que una promoción desde Preview puede implicar un nuevo build con variables de producción.

### Staged production

Quiver debe preferir, cuando esté disponible, promover el mismo production deployment ya probado.

### Regla

```yaml
artifact_identity:
  high_assurance: same-deployment
  fast_delivery: source-equivalent-allowed
```

### Justificación

Probar el mismo artefacto reduce diferencias entre QA y producción.

### ¿Es necesario?

**Sí para producción crítica.**

### Criterios de aceptación

1. El release manifest declara estrategia.
2. Quiver detecta si el proveedor soporta staged production.
3. El deployment probado queda vinculado a la aprobación.
4. Una rebuild obliga a repetir checks configurados.

---

## RQ-044 — QA Manifest and Deployment Identity

### Requerimiento

Quiver debe generar:

```json
{
  "deployment_id": "dpl_...",
  "deployment_url": "...",
  "source_commit_sha": "abc123",
  "environment": "PR_PREVIEW",
  "automated_checks": [
    "health",
    "smoke",
    "critical-route"
  ],
  "manual_steps": [],
  "expected_results": [],
  "approval_required": true,
  "status": "pending"
}
```

### Estados

```text
PENDING
RUNNING
PASSED
FAILED
APPROVED
REJECTED
STALE
```

### Staleness

El QA manifest queda stale cuando cambia:

- PR HEAD;
- deployment ID;
- configuration digest;
- backend profile;
- migration set.

### Justificación

La URL por sí sola no constituye QA.

### ¿Es necesario?

**Sí.**

---

## RQ-045 — Multi-component Release Manifest

### Problema

Vercel `READY` solo describe el componente web.

### Requerimiento

```json
{
  "release_id": "rel_...",
  "source_sha": "abc123",
  "components": [
    {
      "id": "web",
      "type": "vercel-deployment",
      "status": "ready"
    },
    {
      "id": "database",
      "type": "migration-set",
      "status": "pending"
    },
    {
      "id": "edge",
      "type": "edge-functions",
      "status": "pending"
    },
    {
      "id": "flags",
      "type": "feature-flags",
      "status": "ready"
    }
  ],
  "ready_for_release": false
}
```

### Regla

```text
Todos los componentes required = READY
→ READY_FOR_RELEASE
```

### Justificación

Impide declarar un release completo cuando solo terminó el frontend.

### ¿Es necesario?

**Obligatorio antes de producción automatizada.**

---

## RQ-046 — Environment Data Isolation Policy

### Requerimiento

```yaml
environment_data_policy:
  LOCAL:
    allowed:
      - local
      - mock

  PR_PREVIEW:
    allowed:
      - mock
      - qa
      - ephemeral
    forbidden:
      - production-database
      - production-service-role
      - production-webhooks
      - unmasked-personal-data

  SHARED_STAGING:
    allowed:
      - qa

  PRODUCTION_STAGED:
    allowed:
      - production

  PRODUCTION_CURRENT:
    allowed:
      - production
```

### Gate

```text
DEPLOYMENT_POLICY_VIOLATION
```

si un environment usa un perfil prohibido.

### Justificación

Las Previews suelen ser más accesibles y menos controladas que producción.

### ¿Es necesario?

**Sí por seguridad.**

---

## RQ-047 — Composite Rollback Contract

### Problema

Rollback de Vercel no revierte automáticamente DB, Edge o flags.

### Requerimiento

```yaml
rollback:
  web:
    provider: vercel
    strategy: instant-rollback

  database:
    strategy: forward-fix

  edge:
    strategy: previous-version

  feature_flags:
    strategy: disable

  webhooks:
    strategy: pause-or-restore
```

### Regla

Un release no puede declararse `rollback-ready` si falta estrategia para un componente required.

### Justificación

Evita una falsa sensación de reversibilidad.

### ¿Es necesario?

**Sí para releases compuestos.**

---

## RQ-048 — Provider Capability Profile

### Requerimiento

Quiver debe modelar capacidades detectadas:

```yaml
capabilities:
  linear:
    github_linking: true
    coding_sessions: true
    webhooks: true

  github:
    required_checks_enforced: false
    artifact_attestations: false

  codex_cloud:
    docker: false
    push: unknown
    pull_request: true

  vercel:
    preview: true
    custom_environments: true
    staged_production: true
    deployment_checks: true
```

### Regla

La configuración deseada se valida contra capacidades reales.

### Resultado

```text
CAPABILITY_AVAILABLE
CAPABILITY_UNAVAILABLE
CAPABILITY_UNKNOWN
FALLBACK_REQUIRED
```

### Justificación

Las capacidades dependen del plan, ownership y configuración.

### ¿Es necesario?

**Alta prioridad antes de automatización.**

---

## RQ-049 — Provider Intents

### Requerimiento

Quiver Core debe emitir intents declarativos:

```json
{
  "intent_id": "intent_...",
  "intent_type": "create-pr-preview",
  "provider": "vercel",
  "source_sha": "abc123",
  "environment": "PR_PREVIEW",
  "idempotency_key": "preview:repo:pr:10:abc123"
}
```

Otros intents:

```text
create-work-item
create-slice-work-item
dispatch-code-task
link-pull-request
create-pr-preview
request-qa
stage-production
promote-production
rollback-release
update-linear-state
```

### Symphony

- Ejecuta el intent.
- Registra resultado.
- Reintenta.
- Deduplica.
- Devuelve evento.

### Justificación

Mantiene Quiver independiente de APIs concretas.

### ¿Es necesario?

**Sí para una arquitectura limpia de Symphony.**

---

## RQ-050 — State Synchronization and Conflict Avoidance

### Requerimiento

Definir precedencia:

```text
Provider event
→ Symphony validates
→ Canonical transition
→ Mirror to Linear
```

No:

```text
Linear state change
→ GitHub automation
→ Symphony state change
→ Linear loop
```

### Integraciones nativas

Se deben clasificar como:

```text
link-only
read-only
state-writer
```

### Recomendación inicial

```yaml
native_integrations:
  linear_github:
    mode: link-only

  vercel_github:
    mode: deployment-source

  github_checks:
    mode: verification-source
```

### ¿Es necesario?

**Sí.**

---

## RQ-051 — Platform Event Contract and Idempotency

### Eventos canónicos

```text
WORK_ITEM_CREATE_REQUESTED
WORK_ITEM_CREATED
APPROVAL_RECORDED
CODE_TASK_DISPATCH_REQUESTED
CODE_TASK_COMPLETED
PR_OPENED
PR_UPDATED
PR_CHECKS_PASSED
PREVIEW_CREATED
PREVIEW_READY
QA_PASSED
QA_FAILED
RELEASE_STAGED
RELEASE_APPROVED
PRODUCTION_PROMOTED
PRODUCTION_VERIFIED
ROLLBACK_STARTED
ROLLBACK_COMPLETED
```

### Contrato

```json
{
  "event_id": "evt_...",
  "event_type": "PREVIEW_READY",
  "workflow_id": "wf_...",
  "provider": "vercel",
  "provider_event_id": "...",
  "source_sha": "abc123",
  "occurred_at": "...",
  "payload_digest": "..."
}
```

### Idempotency

```text
provider + provider_event_id
```

### Scope

El procesamiento real pertenece a Symphony, pero Quiver define el schema.

### ¿Es necesario?

**Sí para evitar duplicados y transiciones inconsistentes.**

---

## RQ-052 — Native Integration Preference

### Requerimiento

Antes de construir código propio, Quiver/Symphony debe preferir:

- Vercel Git integration para Previews.
- Linear GitHub linking para PRs y commits.
- GitHub Checks para validaciones.
- Vercel Deployment Checks cuando corresponda.

### No duplicar

- Comentarios de Preview si la integración ya los produce, salvo que Linear necesite attachment.
- Linking de PR ya resuelto por issue ID.
- Estado de deployment que Vercel ya expone.

### Justificación

Reduce superficie y mantenimiento.

### Crítica

Las integraciones nativas no deben controlar el estado canónico salvo configuración explícita.

### ¿Es necesario?

**Sí como principio de implementación.**

---

## 18.4. Configuración metodológica recomendada

```yaml
methodology:
  profile: high-assurance
  state_owner: quiver-symphony

platforms:
  linear:
    enabled: true
    role: work-and-human-decisions
    issue_granularity: root-and-executable-slices

    native_github:
      link_prs: true
      show_diffs: true
      status_automation: false

    state_mapping:
      INTAKE: Triage
      NEEDS_CONTEXT: Needs input
      ACCEPTANCE_REVIEW: Acceptance review
      PLAN_REVIEW: Plan review
      IMPLEMENTING: In Progress
      PR_OPEN: In Review
      PREVIEW_READY: QA
      READY_FOR_RELEASE: Ready for release
      DONE: Done
      BLOCKED: Blocked

  github:
    enabled: true
    role: code-and-verification

    branching:
      strategy: branch-per-executable-slice
      base_branch: develop

    pull_requests:
      initial_state: draft
      one_per_slice: true

    merge:
      authority: human
      require_head_match: true

  codex_cloud:
    enabled: true
    role: execution-and-review
    production_access: false
    docker: false
    independent_reviewer_required: true

  vercel:
    enabled: true
    role: deployment-and-environment-validation
    mode: preview-only

    preview:
      required_for_pr: true
      environment: PR_PREVIEW
      data_profile: qa
      production_credentials_allowed: false

    staging:
      enabled: false

    production:
      enabled: false
      managed_externally: true

release:
  require_all_components_ready: true
  human_approval_for_high_assurance: true
```

## 18.5. Recomendación por etapas

### Etapa 1

```text
Linear
→ work tracking y approvals

GitHub
→ code, PR y CI

Codex Cloud
→ executor y reviewer

Vercel
→ Preview por PR
```

Modo:

```yaml
vercel:
  mode: preview-only
```

### Etapa 2

```text
PR Preview
+
develop → Shared Staging
```

Modo:

```yaml
vercel:
  mode: preview-and-staging
```

### Etapa 3

Después de estabilizar NIK-11 y los release manifests:

```text
main
→ Production staged
→ smoke
→ human approval
→ promote
→ verify
```

Modo:

```yaml
vercel:
  mode: staged-production
```

### No recomendado inicialmente para TraceBudget

```text
merge a main
→ auto-production inmediata
```

hasta contar con:

- gates estables;
- release manifest;
- rollback compuesto;
- staging;
- smoke post-release;
- control de migraciones.

---

# 19. Agent Skills y Provider Packs

## 19.1. Objetivo

Quiver debe poder **instalar, versionar, validar, actualizar y distribuir Agent Skills predefinidas** para los agentes de programación utilizados por el proyecto.

Los primeros targets oficiales serán:

```text
Codex
Claude Code
```

La capacidad debe diseñarse de forma extensible para agentes compatibles con Agent Skills.

Los objetivos son:

1. Reducir prompts repetitivos de cientos de líneas.
2. Convertir la metodología de Quiver en procedimientos reutilizables.
3. Mantener comportamiento consistente entre agentes.
4. Versionar los procedimientos junto al repositorio.
5. Separar metodología, workflow, provider knowledge y trabajo concreto.
6. Preparar Quiver Symphony para enviar `intent + artifact refs` en vez de prompts gigantes.
7. Reducir drift entre lo que Quiver espera y lo que los agentes realmente ejecutan.

La arquitectura objetivo es:

```text
Quiver Methodology
        ↓
Agent Skills
"cómo ejecutar el procedimiento"
        ↓
Provider Packs
"cómo funciona la plataforma"
        ↓
Spec / Slice / Manifest
"qué debe hacerse ahora"
        ↓
Codex / Claude Code
```

---

## 19.2. Principio: Skills representan workflows, no APIs

No debe crearse una skill para cada pequeña operación.

### Antipatrón

```text
quiver-github-open-pr
quiver-github-read-checks
quiver-vercel-create-preview
quiver-supabase-run-reset
quiver-linear-create-issue
quiver-sentry-read-event
```

Esto produciría:

- demasiadas skills;
- duplicación;
- discovery ruidoso;
- mantenimiento costoso;
- lógica distribuida;
- dificultad para razonar el workflow completo.

### Modelo correcto

```text
SKILL
→ ¿Qué procedimiento debe realizar la IA?

PROVIDER PACK
→ ¿Qué debe saber sobre la herramienta?

SPEC / SLICE
→ ¿Qué aplica en este proyecto?
```

Ejemplo:

```text
quiver-preview-qa
        │
        ├── providers/github
        ├── providers/vercel
        ├── providers/supabase
        └── providers/sentry
```

No hacen falta cuatro skills diferentes para coordinar el mismo Preview.

---

## RQ-053 — Agent Skills Distribution

### Requerimiento

Al inicializar un proyecto Quiver se debe poder seleccionar qué agentes se utilizan.

Ejemplo:

```text
◇ AI agents detected

  ✓ Codex
  ✓ Claude Code

◇ Install Quiver Agent Skills?

  ● Project skills
  ○ No skills
  ○ Custom
```

Quiver debe materializar las skills en los paths correspondientes al target.

Modelo conceptual:

```text
Codex
→ .agents/skills/

Claude Code
→ .claude/skills/
```

Estas rutas deben implementarse mediante adapters versionados y no hardcodearse como una suposición eterna.

### Criterios de aceptación

1. `quiver init` puede detectar/configurar agentes.
2. El usuario puede seleccionar targets.
3. Las skills se instalan por proyecto por defecto.
4. Quedan versionadas en Git.
5. El mismo catálogo canónico puede generar las variantes.
6. La ausencia de un target no bloquea Quiver.
7. `doctor` puede validar el estado de las skills.

### Prioridad

**P0 tardía / P1 temprana, antes de Symphony.**

---

## RQ-054 — Project Scope por defecto

### Requerimiento

El scope de instalación por defecto debe ser:

```text
project
```

No global.

```yaml
skills:
  installation_scope: project
```

La instalación global debe ser opt-in:

```bash
quiver skills install --scope user
```

### Justificación

Evita:

```text
Proyecto A → Quiver 0.20
Proyecto B → Quiver 0.25
Skill global → 0.25
```

donde el proyecto A ejecutaría una metodología que no entiende.

### Criterios de aceptación

- Global requiere confirmación.
- Skill local prevalece cuando el agente lo soporte.
- `skills doctor` detecta incompatibilidades.
- Quiver no modifica el home del usuario sin consentimiento.

---

## RQ-055 — Canonical Skill Catalog

### Requerimiento

Quiver debe mantener una fuente canónica.

```text
.quiver/
└── skill-catalog/
    ├── core/
    ├── delivery/
    ├── data/
    ├── migration/
    ├── operations/
    └── knowledge/
```

Luego materializa:

```text
canonical
  ├── Codex adapter  → .agents/skills/
  └── Claude adapter → .claude/skills/
```

### Regla

No mantener dos skills manualmente divergentes para el mismo procedimiento.

### Criterios de aceptación

- Una skill tiene una única versión canónica.
- Los adapters generan variantes.
- Los hashes se registran.
- `skills sync` detecta drift.
- La generación es determinística.

---

## RQ-056 — Portable Skill Contract y extensiones vendor-specific

### Estructura

```text
skill/
├── SKILL.md
├── scripts/
├── references/
├── assets/
└── vendor/
    ├── codex/
    └── claude/
```

### Regla

```text
SKILL.md
→ procedimiento portable

vendor/*
→ capacidades específicas
```

### Justificación

Codex y Claude pueden soportar metadata o mecanismos distintos. El procedimiento no debe duplicarse por eso.

### Criterios de aceptación

- La skill core funciona sin vendor extension.
- Un adapter puede enriquecerla.
- Las extensiones no alteran la semántica contractual.
- La variante final puede validarse.

---

## RQ-057 — Managed Skill Manifest

### Requerimiento

Ruta sugerida:

```text
.quiver/skills/manifest.json
```

Ejemplo:

```json
{
  "skill": "quiver-review-pr",
  "source": "quiver",
  "version": "1.2.0",
  "managed": true,
  "canonical_sha256": "...",
  "codex_sha256": "...",
  "claude_sha256": "...",
  "installed_at": "...",
  "updated_at": "..."
}
```

### Criterios de aceptación

- Cada skill administrada queda registrada.
- Se puede comprobar drift.
- La versión de Quiver compatible queda registrada.
- El manifest no contiene secretos.

---

## RQ-058 — Protección de modificaciones locales

### Problema

Un usuario puede personalizar una skill.

### Requerimiento

Si la copia materializada difiere del digest:

```text
LOCAL_MODIFICATIONS_DETECTED
```

`quiver skills update` debe ofrecer:

```text
keep-local
show-diff
overwrite
fork
eject
```

### `fork`

Ejemplo:

```text
quiver-review-pr
→ quiver-review-pr-custom
```

### `eject`

Quiver deja de gestionar esa skill.

### Regla

Nunca sobrescribir silenciosamente.

---

## RQ-059 — Skill Lifecycle CLI

### Comandos

```bash
quiver skills list
quiver skills install --agents codex,claude-code
quiver skills update
quiver skills sync
quiver skills diff
quiver skills doctor
quiver skills eject quiver-review-pr
quiver skills fork quiver-review-pr quiver-review-pr-custom
```

### Ejemplo de `skills list`

```text
SKILL                       CODEX  CLAUDE  VERSION  STATUS

quiver-workflow               ✓      ✓      1.0.0   synced
quiver-execute-slice          ✓      ✓      1.2.0   update
quiver-review-pr              ✓      ✓      1.1.0   local-modified
```

---

## RQ-060 — Skill Security and Trust Model

### Requerimiento

Toda skill debe declarar capacidades.

```yaml
trust:
  source: quiver
  scripts_allowed: true
  network_required: false
  production_access: false
  secrets_required: []
```

### Reglas

- Nunca incluir secretos.
- Production access `false` por defecto.
- Scripts forman parte del digest.
- Skills de terceros son `untrusted` hasta aprobación.
- La instalación muestra capabilities.
- Una skill no puede elevar permisos por sí sola.

### Ejemplo

```text
quiver-supabase-change-safety

Scripts: yes
Network: optional
Production access: forbidden
Secrets: none
```

### Prioridad

**P0/P1 por seguridad.**

---

## RQ-061 — Skill Activation Policy

### Problema

Demasiadas skills instaladas agregan ruido.

### Requerimiento

Instalar solo workflows relevantes al stack.

```yaml
skills:
  core:
    enabled: true

  delivery:
    preview_qa: true

  data:
    supabase_change_safety: true

  migration:
    base44_independence: true
```

### Regla

- Sin Base44 → no instalar Base44 Independence.
- Sin Supabase → no instalar Supabase Safety.
- Sin deployment web → Release Safety puede quedar deshabilitada.

### Prioridad

**P1.**

---

# 19.3. Core Skills

## RQ-062 — `quiver-workflow`

### Propósito

Entender el workflow completo y decidir qué procedimiento corresponde ahora.

### Conoce

```text
Requirement
Acceptance
Plan
Spec
Slice
PR
Preview
QA
Release
Recovery
```

### Debe resolver

- Fase actual.
- Artifact canónico.
- Aprobación faltante.
- Skill siguiente.
- Bloqueo actual.

### No debe

- Implementar código.
- Aprobar por el humano.
- Reescribir planning sin un blocker real.

### Prioridad

**P0.**

---

## RQ-063 — `quiver-requirement-triage`

### Propósito

Convertir una entrada en un trabajo Quiver clasificado.

### Inputs

- Feature.
- Bug.
- Incident.
- Security finding.
- Migration.
- Refactor.
- Maintenance.

### Output

```json
{
  "type": "security",
  "risk": "high",
  "profile": "high-assurance",
  "areas": ["auth", "database"],
  "platforms": ["github", "supabase"],
  "clarification_required": false
}
```

### Ejemplos

```text
Cambiar color de botón
→ fast-delivery

Modificar RLS
→ high-assurance

Billing
→ high-assurance

Migración destructiva
→ high-assurance
```

### Prioridad

**P0.**

---

## RQ-064 — `quiver-review-plan`

### Propósito

Aplicar la governance risk-aware.

### Regla central

```text
Security/data/rollout blocker
→ technical plan

Implementation detail
→ slice

Code-level concern
→ PR

Out-of-scope
→ follow-up

Optional hardening
→ non-blocking
```

### Debe consultar

- Risk profile.
- Review budget.
- Acceptance.
- Validators determinísticos.
- Findings anteriores.

### Prioridad

**P0.**

---

## RQ-065 — `quiver-execute-slice`

### Procedimiento

```text
1. Leer spec y slice.
2. Verificar dependency SHA.
3. Verificar allowed paths.
4. Verificar capabilities.
5. Implementar solo el slice.
6. Ejecutar comandos compatibles.
7. Delegar infraestructura incompatible.
8. Registrar evidence.
9. Validar scope.
10. Crear/actualizar PR.
```

### Prohibiciones

```text
NO implementar slices futuros.
NO ampliar scope.
NO modificar planning.
NO ocultar tests.
NO transformar failure real en success.
```

### Prioridad

**P0.**

---

## RQ-066 — `quiver-review-pr`

### Propósito

Revisar el diff real.

### Blockers

```text
nueva Critical/High
scope escape
secret
data loss
false green
unsafe teardown
SHA mismatch
acceptance violation
```

### Non-blocking

```text
naming
refactor
optional hardening
legacy debt
minor style
```

### Independencia

En `high-assurance`, el reviewer no debe ser el mismo run que implementó.

### Prioridad

**P0.**

---

## RQ-067 — `quiver-recovery`

### Propósito

Clasificar fallos sin reabrir planificación innecesariamente.

### Estados

```text
PROVIDER_TIMEOUT
NETWORK_BLOCKED
PUSH_FAILED
CAPABILITY_UNAVAILABLE
CONTENT_LOSS
SCOPE_VIOLATION
STALE_REVIEW
WRONG_HEAD
```

### Regla

```text
Push falló
≠ implementación falló

Review timeout
≠ plan inseguro

Attestation unavailable
≠ evidencia corrupta
```

### Prioridad

**P0.**

---

# 19.4. Delivery Skills

## RQ-068 — `quiver-preview-qa`

### Propósito

Coordinar QA de un PR desplegable.

### Plataformas frecuentes

```text
GitHub
Vercel
Supabase
Sentry
```

### Flujo

```text
PR HEAD
↓
Vercel Preview
↓
Backend Preview / QA
↓
Sentry environment
↓
Smoke / QA
```

### Invariantes

```text
PR HEAD SHA
=
deployment source SHA
=
QA manifest source SHA
```

Cuando existe backend por branch:

```text
PR branch
↔ backend preview branch
```

### Verificaciones

- Environment correcto.
- Sin production credentials.
- Preview accesible.
- Smoke tests.
- Source SHA.
- Observability environment.
- QA staleness.

### Prioridad

**P1 alta.**

---

## RQ-069 — `quiver-environment-audit`

### Propósito

Auditar:

```text
LOCAL
PR_PREVIEW
SHARED_STAGING
PRODUCTION_STAGED
PRODUCTION_CURRENT
```

### Matriz

```text
                     Local  Preview  Staging  Production

Database               ✓       ✓        ✓         ✓
Auth                    ✓       ✓        ✓         ✓
Sentry env              ✓       ✓        ✓         ✓
Base URL                ✓       ✓        ✓         ✓
Production service key  ✗       ✗        ✗         ✓
Production webhooks     ✗       ✗        ✗         ✓
```

### Findings críticos

- Production DB en Preview.
- Production secret en staging.
- Sentry sin environment.
- Preview usando backend productivo.
- Callback URL incorrecta.

### Prioridad

**P1.**

---

## RQ-070 — `quiver-release-safety`

### Propósito

Coordinar release compuesto.

### Flujo

```text
GitHub merge SHA
↓
DB / Edge changes
↓
Vercel staged deployment
↓
Sentry release
↓
Smoke
↓
Human approval
↓
Promotion
↓
Production verification
```

### Regla

```text
Vercel READY
≠
Release READY
```

### Debe validar

- Git SHA.
- Vercel deployment.
- DB migration.
- Edge Functions.
- Feature flags.
- Sentry release.
- Smoke.
- Approval.
- Rollback contract.

### Prioridad

**P1 antes de automatizar producción.**

---

# 19.5. Data Skills

## RQ-071 — `quiver-supabase-change-safety`

### Activación

Cuando el slice toca:

```text
supabase/migrations/**
supabase/functions/**
RLS
Auth
Storage policies
database grants
RPCs
```

### Procedimiento

```text
Classify
↓
Forward migration
↓
Local/Preview validation
↓
Schema diff
↓
RLS matrix
↓
Negative auth tests
↓
Integration
↓
Release gate
```

### Preguntas obligatorias

```text
¿Es destructiva?
¿Backward compatible?
¿DB-first o app-first?
¿Necesita backfill?
¿Necesita dual-read/write?
¿Rollback o forward-fix?
```

### RLS matrix

```text
Actor               SELECT INSERT UPDATE DELETE

anon                   ✗      ✗      ✗      ✗
own tenant              ✓      ✓      ✓      ✓
other tenant            ✗      ✗      ✗      ✗
global admin            ✓      ✓      ✓      ✓
service_role            explicit-policy
```

### Regla

Cambio RLS/Auth sensible fuerza `high-assurance`.

### Prioridad

**P0/P1.**

---

# 19.6. Migration Skills

## RQ-072 — `quiver-platform-migration`

### Propósito

Metodología genérica para salir de plataformas gestionadas.

### Fases

```text
INVENTORY
DEPENDENCY_GRAPH
PARITY_MATRIX
TARGET_ARCHITECTURE
MIGRATION_SLICES
DUAL_RUN
CUTOVER
VERIFY
DECOMMISSION
```

### Reglas

- Incremental.
- Parity antes de cutover.
- No big-bang por defecto.
- Rollback/cutback explícito.
- Métricas before/after.

### Adapters futuros

```text
Base44 → Supabase
Base44 → custom backend
Firebase → Supabase
Supabase → self-hosted
```

### Prioridad

**P2 genérica.**

---

## RQ-073 — `quiver-base44-independence`

### Propósito

Usar Base44 como MVP sin profundizar lock-in y preparar salida progresiva.

### Modos

```text
AUDIT
GUARD
MIGRATE
VERIFY
```

### AUDIT

Inventariar:

```text
Entities
Auth
Functions
Realtime
Storage
Integrations
SDK usages
Environment dependencies
```

Artefacto:

```text
BASE44_DEPENDENCY_MANIFEST.md
```

### GUARD

Antes de una nueva feature:

```text
¿Aumenta lock-in?
```

Antipatrón:

```text
Base44 SDK disperso por componentes
```

Patrón recomendado:

```text
Domain abstraction
→ Base44 adapter
```

para poder cambiar luego:

```text
Base44 adapter
→ Supabase/custom adapter
```

### MIGRATE

Mapear:

```text
Base44 Auth      → Target Auth
Base44 Entities  → Target DB
Base44 Functions → Target backend/Edge
Base44 Realtime  → Target realtime
Base44 Storage   → Target storage
Base44 Hosting   → Vercel/other
```

### VERIFY

Tests de paridad:

```text
Base44 behavior
=
Independent stack behavior
```

### Prioridad

**P0 en proyectos Base44 con intención de independizarse.**

---

# 19.7. Operations Skills

## RQ-074 — `quiver-incident-triage`

### Fuente típica

Sentry.

### Flujo

```text
Issue / alert
↓
Identify release
↓
Identify commit
↓
Regression?
↓
Severity
↓
User impact
↓
Reproduce
↓
Decision
```

### Decisiones

```text
IGNORE
MONITOR
CREATE_ISSUE
HOTFIX
ROLLBACK
INCIDENT
```

### Regla

Sentry/Seer = señal diagnóstica.

No = autoridad de aprobación.

### Ejemplo

```text
Nueva excepción
+ posterior a release
+ ruta crítica afectada
+ muchos usuarios

→ INCIDENT
→ rollback candidate
→ Linear Critical intent
```

### Prioridad

**P1 antes de automatizar releases.**

---

# 19.8. Knowledge Skills

## RQ-075 — `quiver-decision-memory`

### Plataforma típica

Notion.

### Propósito

Persistir solo decisiones durables.

### Guardar

- Arquitectura.
- Cambio de proveedor.
- Estrategia de rollout.
- Principios.
- Constraints permanentes.
- ADRs.
- Deprecations.

### No guardar

- Cada PR.
- Cada test verde.
- Timeouts.
- Cambios triviales.
- Logs.
- Cada revisión de plan.

### Flujo

```text
Decision candidate
↓
Durability classifier
↓
Read existing context
↓
Update existing decision OR create ADR
```

### Regla

Buscar antes de crear.

### Prioridad

**P2.**

---

# 19.9. Provider Packs

## RQ-076 — Provider Pack Contract

### Propósito

Contener conocimiento operativo de una plataforma sin duplicar workflow.

### Estructura

```text
.quiver/providers/
├── github/
├── linear/
├── vercel/
├── supabase/
├── base44/
├── sentry/
└── notion/
```

Cada pack puede contener:

```text
capabilities.yaml
terminology.md
constraints.md
events.yaml
environment-mapping.yaml
references/
```

### No contiene

- Tokens.
- Secretos.
- Estado mutable.
- Webhook deliveries.

### Prioridad

**P1.**

---

## RQ-077 — GitHub Provider Pack

Debe conocer:

- Branch.
- Commit.
- PR.
- Checks.
- Merge SHA.
- Workflow.
- Required checks capability.
- Artifact evidence capability.

Consumido por:

```text
execute-slice
review-pr
preview-qa
release-safety
```

---

## RQ-078 — Linear Provider Pack

Debe conocer:

- Issue.
- Subissue.
- State.
- Labels.
- Approval record.
- Attachment.
- PR link.
- Work item mapping.

Consumido por:

```text
requirement-triage
workflow
incident-triage
```

---

## RQ-079 — Vercel Provider Pack

Debe conocer:

```text
Preview
commit deployment
branch deployment
staging/custom environments
production staged
promotion
rollback
deployment checks
environment variables
```

Consumido por:

```text
preview-qa
environment-audit
release-safety
```

---

## RQ-080 — Supabase Provider Pack

Debe conocer:

```text
CLI
local development
migrations
RLS
Auth
Storage
Edge Functions
Preview Branches
branch credentials
db diff/reset
```

Consumido por:

```text
supabase-change-safety
preview-qa
environment-audit
release-safety
platform-migration
```

---

## RQ-081 — Base44 Provider Pack

Debe conocer:

```text
SDK usage
entities
auth
functions
realtime
hosting
GitHub synchronization
export boundaries
migration boundaries
```

Consumido por:

```text
base44-independence
platform-migration
environment-audit
```

---

## RQ-082 — Sentry Provider Pack

Debe conocer:

```text
issues
events
releases
commits
traces
environment
regression
source maps
deployment correlation
```

Consumido por:

```text
incident-triage
release-safety
preview-qa
```

---

## RQ-083 — Notion Provider Pack

Debe conocer:

```text
pages
databases/data sources
decision pages
ADR destinations
update vs create
linking
```

Consumido por:

```text
decision-memory
```

---

# 19.10. Stack Detection

## RQ-084 — Skill and Provider Auto-Detection

### Señales

```text
Git remote github.com
→ GitHub

supabase/config.toml
→ Supabase

vercel.json / mapping
→ Vercel

Base44 package/imports
→ Base44

@sentry/*
→ Sentry
```

Linear y Notion pueden requerir configuración explícita.

### UX

```text
◇ Stack detected

  ✓ GitHub
  ✓ Vercel
  ✓ Supabase
  ✓ Sentry
  ✓ Base44

◇ Work tracking

  ✓ Linear

◇ Knowledge

  ✓ Notion

◇ AI agents

  ✓ Codex
  ✓ Claude Code

◇ Recommended skills

  ✓ Core
  ✓ Preview QA
  ✓ Environment Audit
  ✓ Supabase Safety
  ✓ Base44 Independence
  ✓ Incident Triage
  ✓ Release Safety
  ✓ Decision Memory
```

### Regla

Detection propone.

El humano confirma.

### Prioridad

**P1.**

---

# 19.11. Pack recomendado para el stack objetivo

```yaml
skills:

  core:
    - quiver-workflow
    - quiver-requirement-triage
    - quiver-review-plan
    - quiver-execute-slice
    - quiver-review-pr
    - quiver-recovery

  delivery:
    - quiver-preview-qa
    - quiver-environment-audit
    - quiver-release-safety

  data:
    - quiver-supabase-change-safety

  migration:
    - quiver-platform-migration
    - quiver-base44-independence

  operations:
    - quiver-incident-triage

  knowledge:
    - quiver-decision-memory

providers:
  - github
  - linear
  - vercel
  - supabase
  - base44
  - sentry
  - notion
```

Catálogo inicial:

```text
14 skills significativas
7 Provider Packs
```

Nueva skill solo debe agregarse cuando exista evidencia de un procedimiento repetitivo que no encaja claramente en las existentes.

---

# 19.12. Skills vs archivos de instrucciones

La metodología debe distinguir:

```text
AGENTS.md / CLAUDE.md
→ reglas permanentes del repositorio

Agent Skills
→ procedimientos reutilizables

Provider Packs
→ conocimiento de herramientas

Spec
→ qué construir

Slice
→ qué implementar ahora

State
→ dónde estamos

Symphony
→ coordinación real entre plataformas
```

---

# 19.13. Skills como contrato para Symphony

Sin Skills:

```text
Symphony
→ prompt enorme
→ agent
```

Con Skills:

```text
Symphony
→ intent + artifact refs + required_skill
→ agent
```

Ejemplo:

```json
{
  "intent": "execute-slice",
  "spec": "nik-9-identity-role-hardening",
  "slice": "slice-02-trusted-identity-boundary",
  "artifact_digests": {
    "spec": "...",
    "slice": "..."
  },
  "required_skill": "quiver-execute-slice"
}
```

### Decisión

Agent Skills y Provider Packs deben implementarse **antes del primer Symphony MVP**.

---

# 20. Configuración propuesta

## Archivo sugerido

```text
.quiver/policy.yaml
```

## Ejemplo completo

```yaml
version: 3

profile: high-assurance

review_budget:
  acceptance:
    max_reviews: 2
    max_full_revisions: 2

  technical_plan:
    max_reviews: 2
    max_full_revisions: 1
    max_targeted_amendments: 3

blocking_policy:
  technical_plan:
    severities:
      - critical
      - high

    categories:
      - security
      - data-integrity
      - rollout
      - architecture

    require_phase_owner: technical-plan

approvals:
  require_digest: true
  allow_conditions: true
  allow_break_glass: false

preservation:
  enabled: true
  mark_corrupted_on_loss: true

slice_state:
  external_state_file: true

security_delta:
  block_new_critical: true
  block_new_high: true
  block_inherited: false

methodology:
  state_owner: quiver-symphony
  require_single_writer: true

platforms:
  linear:
    enabled: true
    role: work-and-human-decisions
    issue_granularity: root-and-executable-slices

    native_github:
      link_prs: true
      show_diffs: true
      status_automation: false

    state_mapping:
      INTAKE: Triage
      NEEDS_CONTEXT: Needs input
      ACCEPTANCE_REVIEW: Acceptance review
      PLAN_REVIEW: Plan review
      SPEC_READY: Ready
      IMPLEMENTING: In Progress
      PR_OPEN: In Review
      PREVIEW_READY: QA
      READY_FOR_RELEASE: Ready for release
      DONE: Done
      BLOCKED: Blocked

  github:
    enabled: true
    role: code-and-verification

    branching:
      strategy: branch-per-executable-slice
      base_branch: develop

    pull_requests:
      one_per_slice: true
      initial_state: draft

    lineage:
      dependency_sha_required: true
      tested_sha_required: true
      pr_head_must_match_tested_sha: true

    merge:
      authority: human
      expected_required_checks:
        - quiver
        - project-ci

  codex_cloud:
    enabled: true
    role: execution-and-review
    production_access: false
    docker: false
    repository_write: true
    pull_request: true
    independent_reviewer_required: true

  vercel:
    enabled: true
    role: deployment-and-environment-validation
    mode: preview-only

    preview:
      enabled: true
      required_for_pr: true
      environment: PR_PREVIEW
      data_profile: qa
      production_credentials_allowed: false
      qa_url_strategy: commit-specific

    staging:
      enabled: false
      environment: SHARED_STAGING
      strategy: branch-preview
      branch: develop
      data_profile: qa

    production:
      enabled: false
      environment: PRODUCTION_STAGED
      branch: main
      strategy: external-production
      approval: human
      smoke_required: true
      rollback_required: true

environment_data_policy:
  LOCAL:
    allowed:
      - local
      - mock

  PR_PREVIEW:
    allowed:
      - mock
      - qa
      - ephemeral
    forbidden:
      - production-database
      - production-service-role
      - production-webhooks
      - unmasked-personal-data

  SHARED_STAGING:
    allowed:
      - qa

  PRODUCTION_STAGED:
    allowed:
      - production

  PRODUCTION_CURRENT:
    allowed:
      - production

release:
  require_all_components_ready: true
  human_approval_for_high_assurance: true

  rollback:
    web:
      strategy: provider-rollback

    database:
      strategy: forward-fix

    edge:
      strategy: previous-version

    feature_flags:
      strategy: disable
```

## Validaciones de configuración

Quiver debe rechazar:

- Dos writers para el mismo estado.
- `high-assurance + auto-production` sin excepción.
- Preview con credenciales productivas.
- Production automática sin rollback contract.
- Staging habilitado sin data profile.
- Codex Cloud con production access.
- Vercel configurado como única fuente de un release multi-componente.
- Linear status automation y Symphony state writer simultáneamente, salvo reglas explícitas.

---


# 21. Comandos propuestos

```bash
# Profiles
quiver profile show
quiver profile set high-assurance

# Draft lifecycle
quiver ai draft list --phase technical-plan
quiver ai draft select --phase technical-plan --version 12
quiver ai draft reject --phase technical-plan --version 13 --reason-file reason.md
quiver ai draft rollback --phase technical-plan --to-version 12

# Review
quiver ai review-plan --version 12
quiver ai review import --phase technical-plan --version 12 --file review.json

# Findings
quiver findings list
quiver findings disposition --file disposition.json
quiver findings transfer --finding F-002 --to slice-03

# Approval
quiver ai approve \
  --phase technical-plan \
  --version 12 \
  --decision approved-with-conditions \
  --conditions-file disposition.json \
  --reason-file decision.md

# Amendments
quiver ai addendum create \
  --phase technical-plan \
  --base-version 12 \
  --input addendum.md

quiver ai amend \
  --phase technical-plan \
  --base-version 12 \
  --patch plan.patch.json \
  --mode deterministic

# Spec
quiver spec create --from-approved-contract
quiver spec validate specs/<slug> --strict

# Slice state
quiver slice transition slice-01 --to implementing
quiver slice transition slice-01 --to pr-ready
quiver slice transition slice-01 --to completed

# Target execution bundle
quiver execution bundle \
  --spec <slug> \
  --slice <slice> \
  --target codex-cloud

# Platform methodology
quiver platform roles show
quiver platform configuration validate
quiver platform capabilities inspect
quiver workflow states show
quiver workflow mapping validate --provider linear

# Work item manifests
quiver work-item manifest create \
  --spec <slug> \
  --provider linear

# Deployment and QA
quiver deployment manifest create \
  --spec <slug> \
  --mode preview-only

quiver qa manifest create \
  --deployment <deployment-id> \
  --source-sha <sha>

# Release
quiver release manifest create \
  --source-sha <sha>

quiver release validate <release-manifest>

# Provider intents
quiver intents export \
  --workflow <workflow-id> \
  --format json


# Agent Skills
quiver skills list
quiver skills install --agents codex,claude-code
quiver skills update
quiver skills sync
quiver skills diff
quiver skills doctor
quiver skills eject quiver-review-pr
quiver skills fork quiver-review-pr quiver-review-pr-custom

# Provider Packs
quiver providers list
quiver providers detect
quiver providers install github,linear,vercel,supabase,base44,sentry,notion
quiver providers doctor

# Stack detection
quiver stack detect
quiver stack show

# Doctor
quiver doctor --scope current-run
quiver doctor --scope spec:<slug>
quiver doctor --scope repository
```

Los nombres son propuestos y deben confirmarse durante el diseño técnico.

El core genera manifests, intents y validaciones. Symphony ejecuta las acciones reales.

---


# 22. Escenarios de aceptación end-to-end

## Escenario A — Bug de bajo riesgo

### Entrada

```text
El spinner queda infinito cuando falla el dashboard.
```

### Resultado

```text
Profile: fast-delivery
Acceptance: v1
Plan: v1
Review: APPROVE
Spec: creada
Primer commit: mismo día
```

### Validación

- No más de una revisión completa.
- Ninguna aprobación manual innecesaria.
- PR review independiente.

---

## Escenario B — Cambio de autenticación

### Entrada

```text
Impedir que metadata asigne admin.
```

### Resultado

```text
Profile: high-assurance
Threat findings:
- actor spoofing → plan blocker
- naming script → transfer to slice
```

### Validación

- El actor spoofing bloquea.
- El naming no genera otra versión del plan.
- Tras una revisión dirigida, se crea la spec.

---

## Escenario C — Último draft defectuoso

### Estado

```text
v12 completa
v13 con content loss
```

### Resultado

```bash
quiver ai draft reject --version 13
quiver ai draft select --version 12
quiver ai review-plan --version 12
quiver ai approve --version 12
```

### Validación

- v13 queda en historial.
- v12 puede aprobarse si no está stale.
- No se edita metadata manualmente.

---

## Escenario D — Revisión agotada

### Estado

```text
max_plan_reviews = 2
review 2 completado
```

### Resultado

```text
REVIEW_BUDGET_EXHAUSTED
HUMAN_DECISION_REQUIRED
```

### Acciones permitidas

- approve-with-conditions;
- targeted amendment;
- reject;
- transfer findings.

---

## Escenario E — Capacidad externa ausente

### Estado

```text
GitHub artifact attestation no disponible.
```

### Resultado

```text
CAPABILITY_UNAVAILABLE
Fallback: artifact digest
```

### Validación

- Un fallo real de evidencia sigue bloqueando.
- La ausencia de la capability no genera falso verde.
- El workflow no falla por intentar una función imposible.

---

## Escenario F — Vulnerabilidades heredadas

### Estado

```text
Base High: 12
Head High: 12
New High: 0
```

### Resultado

```text
INHERITED_BASELINE_SECURITY_DEBT
PR no bloqueado por delta
Follow-up creado
```

---

## Escenario G — Contrato y estado de slice

### Estado

```text
slice.json no modificable por executor
```

### Resultado

```text
contract: intacto
state.json: implemented
```

### Validación

- `check-pr` usa state.
- No exige modificar el contrato.
- La transición de governance es explícita.

---

## Escenario H — Linear root issue y executable slices

### Estado

Una spec contiene:

```text
slice-00 documental
slice-01 backend con PR
slice-02 UI con PR
slice-03 evidencia
```

### Resultado

Quiver produce:

```text
Issue raíz
Subissue slice-01
Subissue slice-02
```

y omite los slices puramente documentales cuando la policy no exige issue independiente.

### Validación

- No se crean issues duplicados.
- Cada subissue referencia el slice.
- Symphony es writer del estado.
- La integración GitHub nativa solo vincula PRs.

---

## Escenario I — Preview por PR

### Estado

PR #10 tiene HEAD:

```text
abc123
```

Vercel genera una Preview para:

```text
abc123
```

### Resultado

```text
PREVIEW_READY
```

solo si:

```text
PR HEAD = deployment source SHA = QA source SHA
```

### Validación

- Se usa URL específica del commit para QA.
- Preview no usa credenciales productivas.
- Cambiar el HEAD vuelve stale el QA manifest.

---

## Escenario J — Staging compartido

### Estado

Dos PRs fueron mergeados a `develop`.

### Resultado

```text
develop
→ SHARED_STAGING
→ QA integrado
```

### Validación

- Staging no sustituye a las previews individuales.
- Usa backend QA.
- El source SHA del staging queda registrado.
- Un fallo de staging no altera producción.

---

## Escenario K — Staged production

### Estado

Perfil:

```text
high-assurance
```

### Resultado

```text
main
→ PRODUCTION_STAGED
→ smoke tests
→ RELEASE_APPROVED
→ promote same deployment
→ PRODUCTION_CURRENT
```

### Validación

- No se asigna dominio antes de aprobación.
- El deployment promovido es el probado.
- El production smoke puede activar rollback.
- La migración sigue su estrategia propia.

---

## Escenario L — Release multi-componente

### Estado

Vercel:

```text
READY
```

Database migration:

```text
PENDING
```

### Resultado

```text
READY_FOR_RELEASE = false
```

### Validación

Vercel `READY` no cierra el release completo.

---

## Escenario M — Conflicto de estado Linear/GitHub

### Estado

GitHub integration intenta mover el issue a Done mientras Symphony está en QA.

### Resultado

```text
STATE_WRITE_CONFLICT
```

### Validación

- Symphony conserva el estado canónico.
- GitHub queda como source de PR/check, no de workflow state.
- El conflicto se registra.

---

## Escenario N — Codex Cloud no puede hacer push

### Estado

Codex implementa y crea commit local, pero el proxy bloquea push.

### Resultado

```text
PUSH_FAILED
```

No:

```text
IMPLEMENTATION_FAILED
```

### Validación

- El output conserva commit SHA y diff.
- Symphony o un executor local puede reanudar.
- No se crea otro plan.

---

## Escenario O — Capability de Vercel no disponible

### Estado

La policy solicita Custom Environment, pero el proyecto no lo soporta.

### Resultado

```text
CAPABILITY_UNAVAILABLE
```

Opciones:

- fallback a branch preview estable;
- cambiar policy;
- bloquear si no existe fallback seguro.

### Validación

No asumir capabilities por el nombre del proveedor.

---

## Escenario P — Init detecta stack y materializa skills

### Estado

Repositorio:

```text
GitHub
Vercel
Supabase
Base44
Sentry
```

Usuario configura:

```text
Linear
Notion
Codex
Claude Code
```

### Resultado

Quiver recomienda y materializa:

```text
Core
Preview QA
Environment Audit
Supabase Safety
Base44 Independence
Incident Triage
Release Safety
Decision Memory
```

### Validación

- Versionadas.
- Digests registrados.
- Project scope.
- No se instalan skills innecesarias.

---

## Escenario Q — Skill modificada localmente

### Estado

```text
.claude/skills/quiver-review-pr/SKILL.md
```

fue editada.

### Resultado

```text
LOCAL_MODIFICATIONS_DETECTED
```

Quiver ofrece:

```text
keep-local
show-diff
overwrite
fork
eject
```

No sobrescribe.

---

## Escenario R — Base44 Guard

### Estado

Nueva feature propone Base44 SDK directamente en muchos componentes.

### Resultado

```text
LOCK_IN_INCREASE_DETECTED
```

`quiver-base44-independence` recomienda abstraction/adaptor sin exigir migrar inmediatamente.

---

## Escenario S — Supabase RLS

### Estado

Un slice modifica RLS.

### Resultado

```text
quiver-supabase-change-safety
profile → high-assurance
```

Se exige:

- actor matrix;
- negative tests;
- migration validation;
- QA;
- release gate.

---

## Escenario T — Incidente Sentry

### Estado

Nueva regresión después de release en ruta crítica.

### Resultado

```text
quiver-incident-triage
→ INCIDENT
→ rollback candidate
→ Linear Critical intent
```

Sentry no es autoridad de aprobación.

---

## Escenario U — Memoria durable

### Decisión

```text
Base44 queda como MVP temporal.
Supabase será el backend independiente objetivo.
```

### Resultado

`quiver-decision-memory` busca el contexto existente y actualiza la decisión durable en Notion.

No crea una página duplicada si existe una adecuada.

---

# 23. Cambios que no deben implementarse todavía

## 23.1. Ejecución directa de APIs de Linear, GitHub y Vercel dentro de Quiver Core

Quiver Core **sí debe conocer metodológicamente** estas plataformas.

Debe incluir:

- roles;
- fuentes de verdad;
- estados;
- mappings;
- issue granularity;
- deployment modes;
- QA manifests;
- release manifests;
- capability profiles;
- provider intents;
- validaciones.

Quiver Core **no debe ejecutar directamente**:

- OAuth;
- tokens;
- webhooks;
- retries HTTP;
- creación de issues;
- dispatch de Codex;
- creación de deployments;
- promoción a producción;
- rollback;
- almacenamiento de secretos.

Estas acciones pertenecen a Quiver Symphony.

La formulación correcta es:

```text
Quiver define cómo se trabaja.
Symphony hace que ocurra.
Las plataformas ejecutan y demuestran el resultado.
```


## 23.2. Auto-merge general

El merge humano continúa por defecto.

## 23.3. Lógica específica de Supabase

Supabase pertenece a adapters o repos consumidores.

Quiver solamente modela:

- lanes;
- commands;
- evidence;
- capabilities.

## 23.4. Routing complejo de modelos

No implementar hasta estabilizar:

- governance;
- artifacts;
- retries;
- approvals.

## 23.5. Votación de múltiples reviewers

Más reviewers pueden producir más ruido.

Primero resolver clasificación y policy.

---

# 24. Roadmap de implementación

## Quiver v58 — Risk-aware review governance

### Objetivo

Eliminar loops de planificación y formalizar autoridad humana.

### Slices sugeridos

```text
slice-00
Finding schema y enums

slice-01
Phase-aware blocking policy

slice-02
Review budget y circuit breaker

slice-03
Approved-with-conditions

slice-04
Digest-bound approvals

slice-05
Finding disposition y transferencia

slice-06
Tests, migración y documentación
```

### Criterio de éxito

NIK-9 podría haber pasado de v12 a spec sin generar v13–v15 por detalles que pertenecían a slices.

---

## Quiver v59 — Draft lifecycle and deterministic amendments

### Objetivo

Evitar content loss y permitir volver a una versión válida.

### Slices

```text
slice-00
Draft lifecycle

slice-01
Select/reject/rollback

slice-02
Addendums

slice-03
Deterministic patch

slice-04
Preservation validator

slice-05
Content-loss detection

slice-06
External review import y retry
```

---

## Quiver v60 — Execution state and target bundles

### Objetivo

Mejorar Codex Cloud, GitHub Actions y estado de slices.

### Slices

```text
slice-00
Separate contract/state

slice-01
State transitions

slice-02
Target capability model

slice-03
Codex Cloud bundle

slice-04
GitHub Actions bundle

slice-05
Capability-aware evidence

slice-06
Scoped doctor
```

---

## Quiver v61 — Platform-aware methodology contracts

### Objetivo

Incorporar formalmente la metodología de Linear, GitHub, Codex Cloud y Vercel en Quiver Core.

### Slices

```text
slice-00
Platform Role Registry

slice-01
Canonical workflow states y mappings

slice-02
Source-of-truth y single-writer policy

slice-03
Linear work-item methodology

slice-04
GitHub delivery methodology

slice-05
Codex Cloud execution methodology

slice-06
Vercel environment y deployment policies

slice-07
QA, release y rollback manifests

slice-08
Provider intents, capabilities y events

slice-09
Configuration, schemas, fixtures y docs
```

### Criterio de éxito

Quiver puede validar una configuración completa de plataformas y generar manifests/intents sin ejecutar APIs.

---

## Quiver v62 — Agent Skills Distribution and Provider Packs

### Objetivo

Convertir la metodología Quiver en procedimientos reutilizables por Codex y Claude Code antes de construir Symphony.

### Slices

```text
slice-00
Skill catalog, manifest y schemas

slice-01
Codex skill adapter

slice-02
Claude Code skill adapter

slice-03
Skill lifecycle CLI

slice-04
Core Skills

slice-05
Delivery Skills

slice-06
Supabase Safety

slice-07
Platform Migration + Base44 Independence

slice-08
Incident Triage + Decision Memory

slice-09
Provider Pack contract y packs iniciales

slice-10
Stack detection, init UX y migrate

slice-11
Security, drift, fixtures y docs
```

### Criterio de éxito

```text
Symphony
→ intent corto + refs
→ agent carga Quiver skill
→ ejecuta procedimiento
```

No se requieren prompts enormes.

---

## Quiver Symphony MVP 1 — Linear + GitHub + Codex + Vercel Preview

Construir después de dogfoodear v58–v61.

### Alcance

```text
Input
→ Linear issue
→ Quiver contracts
→ Codex Cloud bundle
→ GitHub PR
→ Vercel PR Preview
→ QA manifest
→ Linear update
```

### No incluye

- Staging compartido obligatorio.
- Producción automática.
- Rollback de producción.
- Notion.

---

## Quiver Symphony MVP 2 — Shared Staging

```text
develop
→ SHARED_STAGING
→ QA integrado
→ Linear
```

Puede usar:

- branch preview estable;
- Custom Environment si la capability está disponible.

---

## Quiver Symphony MVP 3 — Staged Production

Solo después de estabilizar NIK-11 y release manifests.

```text
main
→ PRODUCTION_STAGED
→ checks
→ human approval
→ promote
→ verify
→ rollback compuesto
```

---

## Quiver Symphony MVP 4 — Portfolio memory

```text
Release completed
→ Decision Agent
→ Notion solo si cambió una decisión durable
```

---


# 25. Priorización

## P0 — Implementar primero

### Gobernanza

- RQ-003 Findings estructurados.
- RQ-004 Blocking consciente de fase.
- RQ-005 Approved-with-conditions.
- RQ-006 Review budget.
- RQ-008 Digest-bound approvals.
- RQ-010/RQ-011 Draft lifecycle y aprobación de versión anterior.
- RQ-020 Separación contract/state.
- RQ-029 Spec desde plan condicionado.

### Fundamentos platform-aware

- RQ-032 Platform Role Registry.
- RQ-033 Canonical Workflow State Model.
- RQ-034 Source of Truth and Single Writer.
- RQ-037 GitHub Delivery Methodology.
- RQ-038 Codex Cloud Execution Methodology.

Estos contratos deben existir antes de que Symphony automatice el workflow.

### Agent Skills P0/P1

- RQ-053 Agent Skills Distribution.
- RQ-055 Canonical Skill Catalog.
- RQ-060 Skill Security and Trust Model.
- RQ-062 `quiver-workflow`.
- RQ-063 `quiver-requirement-triage`.
- RQ-064 `quiver-review-plan`.
- RQ-065 `quiver-execute-slice`.
- RQ-066 `quiver-review-pr`.
- RQ-067 `quiver-recovery`.

## P1 — Siguiente bloque

- RQ-013 Addendums.
- RQ-015 Content-loss detection.
- RQ-018 Deterministic validation pipeline.
- RQ-024 Retry policy.
- RQ-035 Linear Work Item Methodology.
- RQ-036 Linear Approval Contract.
- RQ-039 Vercel Environment Model.
- RQ-040 Deployment Strategy Policy.
- RQ-041 PR Preview Contract.
- RQ-044 QA Manifest.
- RQ-048 Provider Capability Profile.
- RQ-068 `quiver-preview-qa`.
- RQ-069 `quiver-environment-audit`.
- RQ-070 `quiver-release-safety`.
- RQ-071 `quiver-supabase-change-safety`.
- RQ-073 `quiver-base44-independence`.
- RQ-074 `quiver-incident-triage`.
- RQ-076 Provider Pack Contract.
- RQ-084 Skill and Provider Auto-Detection.

## P2 — Después del dogfooding

- External review import.
- Target bundles.
- Evidence providers.
- Vulnerability delta.
- Scoped doctor.
- Shared staging.
- Multi-component release.
- Composite rollback.
- Provider intents.
- Platform event contract.
- State synchronization.
- Staged production.

## Orden crítico recomendado

```text
Governance
→ Artifact integrity
→ Execution state
→ Platform methodology
→ Agent Skills + Provider Packs
→ Symphony preview-only
→ Staging
→ Staged production
```

### Justificación

Automatizar plataformas antes de corregir la gobernanza amplificaría los loops de NIK-9.

Automatizar producción antes de tener release manifests y rollback compuesto sería inseguro.

---


# 26. Riesgos de la propuesta

## Riesgo 1 — Excepciones utilizadas para saltar seguridad

### Mitigación

- No usar `--force`.
- Exigir finding disposition.
- Exigir digest.
- Exigir aprobador.
- Limitar break-glass.
- Registrar todo.

## Riesgo 2 — Demasiados estados y schemas

### Mitigación

Implementar un MVP mínimo.

No agregar taxonomías extensas.

## Riesgo 3 — Planes demasiado breves

### Mitigación

Mantener obligatorios:

- invariantes;
- datos;
- rollout;
- rollback;
- slices;
- non-goals.

## Riesgo 4 — Compatibilidad con proyectos existentes

### Mitigación

- lectura legacy;
- migración no destructiva;
- warnings;
- feature flags.

## Riesgo 5 — Transferir un finding que sí era crítico

### Mitigación

- policy por severidad;
- categorias críticas;
- justificación;
- aprobación humana;
- audit trail.

---

## Riesgo 6 — Quiver Core se convierte en un orquestador monolítico

### Mitigación

- Core genera contracts e intents.
- Symphony ejecuta APIs.
- Adapters aislados.
- No guardar tokens en Quiver.

## Riesgo 7 — Estado circular entre Linear, GitHub y Symphony

### Mitigación

- Single writer por propiedad.
- Integraciones nativas en modo link-only inicialmente.
- Event log e idempotencia.
- State mapping validado.

## Riesgo 8 — Producción automática prematura

### Mitigación

- `preview-only` como primer modo.
- `staged-production` para high assurance.
- `auto-production` solo para bajo riesgo.
- Human approval y rollback compuesto.

## Riesgo 9 — Preview con datos productivos

### Mitigación

- Environment data policy.
- Variables por environment.
- Gate de credenciales.
- Preview protegida cuando sea necesario.

## Riesgo 10 — Confundir deployment de Vercel con release completo

### Mitigación

- Multi-component release manifest.
- Todos los componentes required deben estar READY.
- Rollback por componente.

## Riesgo 11 — Exceso de micro-skills

### Mitigación

- Una skill representa un workflow significativo.
- Provider knowledge vive en Provider Packs.
- Catálogo inicial limitado.
- Nueva skill requiere demostrar repetición real.

## Riesgo 12 — Skill version drift

### Mitigación

- Scope project.
- Manifest administrado.
- Digests.
- `skills doctor`.
- No overwrite silencioso.

## Riesgo 13 — Skill maliciosa o demasiado poderosa

### Mitigación

- Trust metadata.
- Scripts dentro del digest.
- Production access false.
- Third-party skills untrusted.

## Riesgo 14 — Duplicación Codex/Claude

### Mitigación

- Canonical skill catalog.
- Vendor adapters.
- SKILL.md portable.

## Riesgo 15 — Profundizar lock-in Base44 durante el MVP

### Mitigación

- Base44 Independence GUARD.
- Dependency manifest.
- Domain adapters.
- Parity tests.
- Migración incremental.

# 27. Definición de terminado

Esta iniciativa se considera terminada cuando:

## Gobernanza y artefactos

1. Un reviewer puede clasificar findings por fase.
2. Un technical plan no queda bloqueado por detalles exclusivos de un slice.
3. Existe `approved-with-conditions`.
4. Toda aprobación está vinculada a digest.
5. Se puede seleccionar y aprobar una versión anterior vigente.
6. Una revisión defectuosa puede rechazarse sin perder la versión válida.
7. Un addendum puede complementar un plan sin regenerarlo.
8. Quiver detecta content loss.
9. Existe un review budget.
10. El agotamiento del presupuesto requiere decisión humana.
11. `slice.json` ya no mezcla contrato con estado.
12. Un review externo puede importarse.
13. Una capability externa ausente puede usar fallback seguro.
14. La deuda heredada se separa del delta introducido.
15. `doctor` puede ejecutarse con scope.
16. No se necesita editar metadata interna manualmente.
17. La trazabilidad de decisiones sigue completa.

## Plataforma y workflow

18. Quiver tiene Platform Role Registry.
19. Existe un estado canónico independiente de Linear.
20. Cada propiedad tiene source of truth y writer.
21. Linear usa root issue + executable slices.
22. Las aprobaciones de Linear incluyen digest.
23. GitHub delivery contract define branch, PR, lineage y merge.
24. Codex Cloud recibe bundles target-aware.
25. Los fallos Cloud distinguen implementación de conectividad.
26. Quiver modela LOCAL, PR_PREVIEW, SHARED_STAGING, PRODUCTION_STAGED y PRODUCTION_CURRENT.
27. Existen deployment modes validados por risk profile.
28. PR Preview queda ligada al PR HEAD.
29. Existe QA manifest con staleness.
30. Existe release manifest multi-componente.
31. Preview no puede usar credenciales productivas.
32. Existe rollback por componente.
33. Las capabilities del proveedor se detectan.
34. Quiver emite provider intents.
35. Existe contrato de eventos canónicos.
36. Symphony puede deduplicar mediante provider event ID.
37. Quiver no afirma branch protection o required check si no fue detectado.
38. El primer MVP de Symphony puede operar en modo preview-only.

## Métricas

39. NIK-10 o un piloto equivalente llega al primer PR sin más de:
    - 2 versiones de acceptance;
    - 3 versiones completas de plan;
    - 2 reviews del plan.
40. Tiempo hasta primer commit:
    - Fast Delivery: menos de una hora.
    - High Assurance: menos de cuatro horas de trabajo efectivo.
41. No existe pérdida contractual silenciosa.
42. No existen scope violations mergeadas.
43. No existen deployments Preview con credenciales productivas.
44. No existe producción automática de high assurance sin aprobación explícita.

## Agent Skills y Provider Packs

45. `quiver init` puede configurar Codex y Claude Code.
46. Las skills se instalan por proyecto por defecto.
47. Existe un catálogo canónico.
48. Codex y Claude reciben variantes del mismo procedimiento.
49. Existe managed skill manifest con digests.
50. Las modificaciones locales no se sobrescriben.
51. `skills doctor` detecta drift.
52. Existe trust model para skills.
53. Las Core Skills P0 están implementadas.
54. Preview QA coordina GitHub/Vercel/Supabase/Sentry.
55. Supabase Safety se activa ante RLS/Auth/migrations.
56. Base44 Independence soporta AUDIT/GUARD/MIGRATE/VERIFY.
57. Incident Triage transforma señales Sentry en decisiones.
58. Decision Memory guarda solo decisiones durables.
59. Existen Provider Packs para GitHub, Linear, Vercel, Supabase, Base44, Sentry y Notion.
60. Stack detection propone skills sin instalarlas silenciosamente.
61. Symphony puede despachar `intent + artifact refs + required_skill`.
62. Los workflows estándar ya no requieren prompts enormes.

---


# 28. Decisión final recomendada

La siguiente iniciativa de Quiver debe seguir siendo:

```text
Quiver v58 — Risk-aware review governance
```

### Motivo

La automatización de Linear, Codex Cloud, GitHub y Vercel no debe construirse sobre un workflow que todavía puede producir loops de planificación.

El orden recomendado es:

```text
v58
Gobernanza sensible al riesgo

v59
Draft lifecycle y artefactos determinísticos

v60
Estado de ejecución y bundles

v61
Metodología platform-aware

v62
Agent Skills + Provider Packs

Symphony MVP 1
Linear + GitHub + Codex Cloud + Vercel Preview

Symphony MVP 2
Shared Staging

Symphony MVP 3
Staged Production
```

## Decisiones concretas

### Linear

Sí debe formar parte de la metodología de Quiver.

Quiver define:

- issue granularity;
- state mappings;
- approvals;
- source of truth;
- links requeridos.

Symphony crea y actualiza los issues.

### GitHub

Sí debe formar parte del core metodológico.

GitHub es la fuente de verdad de:

- código;
- PR;
- checks;
- merge SHA.

### Codex Cloud

Sí debe formar parte de la metodología de ejecución.

Quiver genera bundles por rol y capability.

Symphony despacha o integra la tarea.

### Vercel

Sí debe formar parte de la metodología de ambientes y release.

La configuración inicial recomendada es:

```yaml
vercel:
  mode: preview-only
```

Después:

```yaml
vercel:
  mode: preview-and-staging
```

Y únicamente con CI, release manifests y rollback estabilizados:

```yaml
vercel:
  mode: staged-production
```

## Lo que no debe hacerse

No comenzar por:

- auto-merge;
- producción automática;
- Notion sync;
- routing complejo de modelos;
- adapters monolíticos dentro del core.

La regla metodológica final es:

> Quiver debe impedir que implementemos una decisión insegura, pero no debe intentar demostrar antes de escribir código que todos los detalles futuros ya están perfectamente resueltos.

La regla arquitectónica final es:

> Quiver define cómo se trabaja. Las Agent Skills enseñan a la IA cómo ejecutar cada procedimiento. Los Provider Packs describen las plataformas. Symphony hace que ocurra. Linear coordina el trabajo. GitHub demuestra el cambio. Codex/Claude ejecutan y revisan. Vercel valida y publica deployments. Supabase provee backend y datos. Sentry observa. Notion conserva decisiones durables.

---

# 29. Referencias de capacidades actuales

Estas referencias documentan capacidades observadas al redactar este requerimiento. No deben hardcodearse como eternas: Quiver debe detectar capabilities.

- Linear GitHub Integration: https://linear.app/integrations/github
- Linear Webhooks: https://linear.app/developers/webhooks
- Linear Codex Integration: https://linear.app/integrations/codex
- Linear Coding Sessions: https://linear.app/docs/coding-sessions
- Vercel Environments: https://vercel.com/docs/deployments/environments
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Vercel Promoting Deployments: https://vercel.com/docs/deployments/promoting-a-deployment
- Vercel Preview to Production: https://vercel.com/docs/deployments/promote-preview-to-production
- Vercel Deployment Checks: https://vercel.com/docs/deployment-checks
- Vercel Deployment Protection: https://vercel.com/docs/deployment-protection

- OpenAI Codex Skills: https://learn.chatgpt.com/codex/build-skills
- Claude Code Skills: https://code.claude.com/docs/en/skills
- Supabase Branching: https://supabase.com/docs/guides/deployment/branching
- Supabase Branching Integrations: https://supabase.com/docs/guides/deployment/branching/integrations
- Base44 GitHub/local development: https://docs.base44.com/developers/app-code/local-development/github
- Sentry Releases: https://docs.sentry.io/api/releases/create-a-new-release-for-an-organization/
- Notion API: https://developers.notion.com/reference/intro
